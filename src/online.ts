// Online features (Supabase): leaderboard, cloud save and recovery codes.
// Each device has a random secret token; the server stores only its hash.
// A player can link more devices with a recovery code. All calls go to
// database functions, which validate input and cap how fast a leaderboard
// score can grow, so an edited save cannot jump to the top.

const API = 'https://hdeywsbduhzvuthcvakk.supabase.co/rest/v1/rpc/';
// Publishable key: safe to ship in the browser (it can only call the functions above).
const KEY = 'sb_publishable_nekzHm_EjEPsPvdwyyuSfA_hC7btEgx';
const STORE = 'arcane-player-v1';

/** 'week' and 'all' rank monsters defeated; 'level' ranks player level. */
export type Period = 'week' | 'all' | 'level';

export interface BoardRow { rank: number; name: string; score: number; level: number; me: boolean; defeated?: number }
export interface Board {
  period: Period;
  week_start: string;
  top: BoardRow[];
  me: { rank: number | null; score: number; name: string } | null;
}

interface Player { token: string; name: string; registered: boolean; code?: string }

function loadPlayer(): Player {
  try {
    const p = JSON.parse(localStorage.getItem(STORE) ?? 'null') as Player | null;
    if (p?.token) return p;
  } catch { /* storage unavailable */ }
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return { token, name: `Apprentice ${1000 + Math.floor(Math.random() * 9000)}`, registered: false };
}

let player = loadPlayer();

function storePlayer() {
  try { localStorage.setItem(STORE, JSON.stringify(player)); } catch { /* storage unavailable */ }
}

async function rpc<T>(fn: string, body: Record<string, unknown>, keepalive = false): Promise<T> {
  const res = await fetch(API + fn, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || `Leaderboard error (${res.status})`);
  }
  return res.json() as Promise<T>;
}

async function ensureRegistered() {
  if (player.registered) return;
  await rpc('arcane_register', { p_token: player.token, p_name: player.name });
  player.registered = true;
  storePlayer();
}

export interface CloudStatus { savedAt: number | null; error: boolean }
const cloud: CloudStatus = { savedAt: null, error: false };
let onCloud: (s: CloudStatus) => void = () => {};

export const online = {
  get name() { return player.name; },
  get registered() { return player.registered; },
  /** The recovery code made on this device, if any (the server only keeps its hash). */
  get code() { return player.code ?? null; },
  get cloud(): CloudStatus { return { ...cloud }; },
  set onCloudChange(fn: (s: CloudStatus) => void) { onCloud = fn; },

  /** Upload the save a few seconds after the last change (or right away with `now`). */
  cloudSave: (() => {
    let timer = 0;
    let latest: { json: unknown; at: number } | null = null;
    const flush = async (keepalive = false) => {
      if (!latest) return;
      const { json, at } = latest;
      try {
        await ensureRegistered();
        await rpc('arcane_cloud_save', { p_token: player.token, p_save: json, p_save_at: at }, keepalive);
        cloud.savedAt = Date.now();
        cloud.error = false;
        if (latest?.at === at) latest = null;
      } catch {
        cloud.error = true;
      }
      onCloud({ ...cloud });
    };
    return (save: { savedAt?: number }, now = false) => {
      latest = { json: save, at: save.savedAt ?? Date.now() };
      clearTimeout(timer);
      if (now) flush(true);
      else timer = window.setTimeout(() => flush(), 6000);
    };
  })(),

  /** The cloud copy of this player's save, if there is one. */
  async cloudLoad(): Promise<{ save: unknown; save_at: number | null } | null> {
    if (!player.registered) return null;
    return rpc('arcane_cloud_load', { p_token: player.token });
  },

  /** Make a new recovery code (the old one stops working). */
  async newCode(): Promise<string> {
    await ensureRegistered();
    const res = await rpc<{ code: string }>('arcane_new_code', { p_token: player.token });
    player.code = res.code;
    storePlayer();
    return res.code;
  },

  /** Link this device to the player that owns `code`; returns their cloud save. */
  async recover(code: string): Promise<{ save: unknown; save_at: number | null }> {
    const res = await rpc<{ name: string; save: unknown; save_at: number | null }>('arcane_recover', { p_code: code, p_token: player.token });
    player.name = res.name;
    player.registered = true;
    const raw = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    player.code = raw.length === 16 ? raw.match(/.{4}/g)!.join('-') : undefined;
    storePlayer();
    return res;
  },


  /** Change the display name (1-16 characters). Throws with a readable message if refused. */
  async rename(name: string) {
    const clean = name.trim().replace(/\s+/g, ' ');
    const res = await rpc<{ name: string }>('arcane_register', { p_token: player.token, p_name: clean });
    player.name = res.name;
    player.registered = true;
    storePlayer();
  },

  async board(period: Period): Promise<Board> {
    return rpc<Board>('arcane_board', { p_token: player.registered ? player.token : null, p_period: period });
  },

  /** Report the running monster total. Debounced; failures are retried on the next report. */
  submit: (() => {
    let timer = 0;
    let pending: { defeated: number; level: number } | null = null;
    const flush = async () => {
      if (!pending) return;
      const { defeated, level } = pending;
      try {
        await ensureRegistered();
        const res = await rpc<{ throttled?: boolean }>('arcane_submit', { p_token: player.token, p_defeated: defeated, p_level: level });
        if (res.throttled) { timer = window.setTimeout(flush, 4000); return; }
        if (pending?.defeated === defeated) pending = null;
      } catch { /* offline or blocked: try again with the next report */ }
    };
    return (defeated: number, level: number) => {
      pending = { defeated, level };
      clearTimeout(timer);
      timer = window.setTimeout(flush, 3500);
    };
  })(),
};

/** Time until the weekly board resets (Monday 00:00 UTC), as "3d 4h" / "5h 12m". */
export function untilReset(now = new Date()): string {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = now.getUTCDay(); // 0 = Sunday
  next.setUTCDate(next.getUTCDate() + (((8 - day) % 7) || 7));
  const mins = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 60000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  return d ? `${d}d ${h}h` : `${h}h ${m}m`;
}
