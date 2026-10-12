// Online leaderboard (Supabase). Each device gets a random secret token the
// first time it reports a score; the server stores only its hash. All calls
// go to three database functions, which validate names and cap how fast a
// score can grow, so an edited save cannot jump to the top.

const API = 'https://hdeywsbduhzvuthcvakk.supabase.co/rest/v1/rpc/';
// Publishable key: safe to ship in the browser (it can only call the functions above).
const KEY = 'sb_publishable_nekzHm_EjEPsPvdwyyuSfA_hC7btEgx';
const STORE = 'arcane-player-v1';

export type Period = 'week' | 'all';

export interface BoardRow { rank: number; name: string; score: number; level: number; me: boolean }
export interface Board {
  period: Period;
  week_start: string;
  top: BoardRow[];
  me: { rank: number | null; score: number; name: string } | null;
}

interface Player { token: string; name: string; registered: boolean }

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

async function rpc<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(API + fn, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

export const online = {
  get name() { return player.name; },

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
