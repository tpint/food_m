// Online features: leaderboard, cloud save, recovery codes and the inbox.
//
// These run against the Supabase project "food_m": the game calls the
// database functions in supabase/migrations/ through Supabase's REST API with
// the project's publishable key (safe to ship: the tables are locked down by
// RLS and only those functions are callable). A MOCK backend that lives in
// this browser's localStorage is kept for offline development: open the game
// with ?mock=1 to use it.

const STORE = 'food-player-v2';
/** The player record from the mock-backend days: its token and name carry over, but it must register again. */
const OLD_STORE = 'food-player-v1';

/** 'week' and 'all' rank customers served; 'level' ranks player level. */
export type Period = 'week' | 'all' | 'level';

export interface BoardRow { rank: number; name: string; score: number; level: number; me: boolean; served?: number }
export interface Board {
  period: Period;
  week_start: string;
  top: BoardRow[];
  me: { rank: number | null; score: number; name: string } | null;
}

/** A message in the inbox. `sent` is ms since the epoch. */
export interface Mail {
  id: number;
  title: string;
  body: string;
  coins: number;
  gems: number;
  energy: number;
  items: { chain: string; level: number }[];
  sent: number;
  read: boolean;
  claimed: boolean;
}
export type MailRewards = Pick<Mail, 'coins' | 'gems' | 'energy' | 'items'>;

/** Everything the game asks of the server. `token` identifies this device's player. */
export interface Backend {
  register(token: string, name: string): Promise<{ name: string }>;
  submit(token: string, served: number, level: number): Promise<{ throttled?: boolean }>;
  board(token: string | null, period: Period): Promise<Board>;
  cloudSave(token: string, save: unknown, saveAt: number): Promise<void>;
  cloudLoad(token: string): Promise<{ save: unknown; save_at: number | null } | null>;
  newCode(token: string): Promise<{ code: string }>;
  recover(code: string, token: string): Promise<{ name: string; save: unknown; save_at: number | null }>;
  listMail(token: string): Promise<Mail[]>;
  readMail(token: string, ids: number[]): Promise<void>;
  /** Throws 'Already claimed' if this player claimed it before. */
  claimMail(token: string, id: number): Promise<MailRewards>;
}

// ------------------------------------------------------------------ mock backend

const MOCK_DB = 'food-mock-server-v1';

interface MockPlayer {
  name: string; served: number; weekServed: number; week: string; level: number; save?: unknown; saveAt?: number | null; code?: string;
  joined?: number; read?: number[]; claimed?: number[];
}
/** A mock message; `to` is a player token, or absent for everyone. */
type MockMail = MailRewards & { id: number; to?: string; title: string; body: string; sent: number };
interface MockDb { players: Record<string, MockPlayer>; mail?: MockMail[] }

const RIVALS = [
  'Chef Mango', 'Waffle Queen', 'Sir Pancake', 'Noodle Ninja', 'Captain Crumble', 'Lady Latte', 'Tofu Tom',
  'Sushi Sam', 'Muffin Mia', 'Biscuit Bob', 'Pretzel Pat', 'Cocoa Kai', 'Taco Tina', 'Ramen Ray', 'Gelato Gigi',
  'Dumpling Dan', 'Bagel Bea', 'Curry Cole', 'Paella Pia', 'Brownie Ben', 'Mochi Max', 'Churro Chloe',
];

/** Monday 00:00 UTC of the current week, as a date string. */
function weekStart(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function loadDb(): MockDb {
  try {
    const db = JSON.parse(localStorage.getItem(MOCK_DB) ?? 'null') as MockDb | null;
    if (db?.players) return db;
  } catch { /* storage unavailable */ }
  // Seed rival chefs so the leaderboard has something to show.
  const players: Record<string, MockPlayer> = {};
  let k = 7;
  const rnd = () => ((k = (k * 16807) % 2147483647) - 1) / 2147483646;
  RIVALS.forEach((name, i) => {
    const served = Math.round(20 + rnd() * 600 * (1 - i / RIVALS.length));
    players[`rival-${i}`] = { name, served, weekServed: Math.round(rnd() * Math.min(served, 80)), week: weekStart(), level: 2 + Math.floor(served / 25) };
  });
  return { players };
}

function storeDb(db: MockDb) {
  try { localStorage.setItem(MOCK_DB, JSON.stringify(db)); } catch { /* storage unavailable */ }
}

/** A short pause so the UI's loading states behave like they will online. */
const lag = () => new Promise((r) => setTimeout(r, 150 + Math.random() * 200));

function codeOf(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const mockBackend: Backend = {
  async register(token, name) {
    await lag();
    const clean = name.trim().replace(/\s+/g, ' ');
    if (clean.length < 1 || clean.length > 16) throw new Error('Names must be 1 to 16 characters.');
    const db = loadDb();
    db.players[token] ??= { name: clean, served: 0, weekServed: 0, week: weekStart(), level: 1, joined: Date.now() };
    db.players[token].name = clean;
    storeDb(db);
    return { name: clean };
  },
  async submit(token, served, level) {
    await lag();
    const db = loadDb();
    const p = db.players[token];
    if (!p) throw new Error('Unknown player');
    if (p.week !== weekStart()) { p.week = weekStart(); p.weekServed = 0; }
    if (served > p.served) p.weekServed += served - p.served;
    p.served = Math.max(p.served, served);
    p.level = Math.max(p.level, level);
    storeDb(db);
    return {};
  },
  async board(token, period) {
    await lag();
    const db = loadDb();
    const week = weekStart();
    const score = (p: MockPlayer) => (period === 'level' ? p.level : period === 'week' ? (p.week === week ? p.weekServed : 0) : p.served);
    const ranked = Object.entries(db.players)
      .filter(([, p]) => score(p) > 0)
      .sort(([, a], [, b]) => score(b) - score(a))
      .map(([id, p], i) => ({ id, row: { rank: i + 1, name: p.name, score: score(p), level: p.level, me: id === token, served: p.served } }));
    const mine = ranked.find((r) => r.id === token);
    const me = token && db.players[token]
      ? { rank: mine?.row.rank ?? null, score: score(db.players[token]), name: db.players[token].name }
      : null;
    return { period, week_start: week, top: ranked.slice(0, 50).map((r) => r.row), me };
  },
  async cloudSave(token, save, saveAt) {
    await lag();
    const db = loadDb();
    const p = db.players[token];
    if (!p) throw new Error('Unknown player');
    if ((p.saveAt ?? 0) <= saveAt) { p.save = save; p.saveAt = saveAt; }
    storeDb(db);
  },
  async cloudLoad(token) {
    await lag();
    const p = loadDb().players[token];
    return p ? { save: p.save ?? null, save_at: p.saveAt ?? null } : null;
  },
  async newCode(token) {
    await lag();
    const db = loadDb();
    const p = db.players[token];
    if (!p) throw new Error('Unknown player');
    // No 0/O or 1/I, so codes are easy to read back.
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const raw = Array.from(bytes, (b) => abc[b % abc.length]).join('');
    p.code = raw;
    storeDb(db);
    return { code: raw.match(/.{4}/g)!.join('-') };
  },
  async recover(code, token) {
    await lag();
    const db = loadDb();
    const raw = codeOf(code);
    const entry = Object.entries(db.players).find(([, p]) => p.code === raw);
    if (!entry) throw new Error('Recovery code not found');
    const [, p] = entry;
    // Link this device to the same player record.
    db.players[token] = p;
    storeDb(db);
    return { name: p.name, save: p.save ?? null, save_at: p.saveAt ?? null };
  },
  async listMail(token) {
    await lag();
    const db = loadDb();
    const p = db.players[token];
    if (!p) throw new Error('Unknown player');
    return mockMailFor(db, token).sort((a, b) => b.sent - a.sent).map((m) => ({
      id: m.id, title: m.title, body: m.body, coins: m.coins, gems: m.gems, energy: m.energy, items: m.items, sent: m.sent,
      read: !!p.read?.includes(m.id), claimed: !!p.claimed?.includes(m.id),
    }));
  },
  async readMail(token, ids) {
    await lag();
    const db = loadDb();
    const p = db.players[token];
    if (!p) throw new Error('Unknown player');
    p.read = [...new Set([...(p.read ?? []), ...ids])];
    storeDb(db);
  },
  async claimMail(token, id) {
    await lag();
    const db = loadDb();
    const p = db.players[token];
    const m = p && mockMailFor(db, token).find((x) => x.id === id);
    if (!m) throw new Error('Message not found');
    if (p.claimed?.includes(id)) throw new Error('Already claimed');
    p.claimed = [...(p.claimed ?? []), id];
    p.read = [...new Set([...(p.read ?? []), id])];
    storeDb(db);
    return { coins: m.coins, gems: m.gems, energy: m.energy, items: m.items };
  },
};

/** Like the server: your own messages, and messages to everyone sent since you joined. */
function mockMailFor(db: MockDb, token: string): MockMail[] {
  const p = db.players[token];
  return (db.mail ?? []).filter((m) => m.sent <= Date.now() && (m.to === token || (!m.to && m.sent >= (p.joined ?? 0))));
}

// ------------------------------------------------------------------ Supabase backend

const SUPABASE_URL = 'https://mipatiavaeasllqwezdj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9iXPj0maS01HyQcvPlqI1Q_yHieBAAl';

/** Call a database function; throws with the server's message if it refuses. */
async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
    body: JSON.stringify(args),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body as { message?: string } | null)?.message ?? `Server error ${res.status}`);
  return body as T;
}

const supabaseBackend: Backend = {
  register: (token, name) => rpc('register', { p_token: token, p_name: name }),
  submit: (token, served, level) => rpc('submit_score', { p_token: token, p_served: served, p_level: level }),
  board: (token, period) => rpc('leaderboard', { p_token: token, p_period: period }),
  async cloudSave(token, save, saveAt) {
    await rpc('cloud_save', { p_token: token, p_save: save, p_save_at: saveAt });
  },
  cloudLoad: (token) => rpc('cloud_load', { p_token: token }),
  newCode: (token) => rpc('new_code', { p_token: token }),
  recover: (code, token) => rpc('recover', { p_code: code, p_token: token }),
  listMail: (token) => rpc('list_mail', { p_token: token }),
  async readMail(token, ids) {
    await rpc('read_mail', { p_token: token, p_ids: ids });
  },
  claimMail: (token, id) => rpc('claim_mail', { p_token: token, p_mail_id: id }),
};

const useMock = typeof location !== 'undefined' && new URLSearchParams(location.search).has('mock');
const backend: Backend = useMock ? mockBackend : supabaseBackend;

// ------------------------------------------------------------------ this device's player

interface Player { token: string; name: string; registered: boolean; code?: string }

function loadPlayer(): Player {
  try {
    const p = JSON.parse(localStorage.getItem(STORE) ?? 'null') as Player | null;
    if (p?.token) return p;
    const old = JSON.parse(localStorage.getItem(OLD_STORE) ?? 'null') as Player | null;
    if (old?.token) return { token: old.token, name: old.name, registered: false };
  } catch { /* storage unavailable */ }
  return newPlayer();
}

function newPlayer(): Player {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return { token, name: `Chef ${1000 + Math.floor(Math.random() * 9000)}`, registered: false };
}

let player = loadPlayer();

function storePlayer() {
  try { localStorage.setItem(STORE, JSON.stringify(player)); } catch { /* storage unavailable */ }
}

async function ensureRegistered() {
  if (player.registered) return;
  await backend.register(player.token, player.name);
  player.registered = true;
  storePlayer();
}

export interface CloudStatus { savedAt: number | null; error: boolean }
const cloud: CloudStatus = { savedAt: null, error: false };
let onCloud: (s: CloudStatus) => void = () => {};
/** Uploads and score reports waiting to be sent; dropped when the account is reset. */
const queued: { save?: () => void; score?: () => void } = {};

export const online = {
  get name() { return player.name; },
  get registered() { return player.registered; },
  /** The recovery code made on this device, if any. */
  get code() { return player.code ?? null; },
  get cloud(): CloudStatus { return { ...cloud }; },
  set onCloudChange(fn: (s: CloudStatus) => void) { onCloud = fn; },

  /** Upload the save a few seconds after the last change (or right away with `now`). */
  cloudSave: (() => {
    let timer = 0;
    let latest: { json: unknown; at: number } | null = null;
    const flush = async () => {
      if (!latest) return;
      const { json, at } = latest;
      try {
        await ensureRegistered();
        await backend.cloudSave(player.token, json, at);
        cloud.savedAt = Date.now();
        cloud.error = false;
        if (latest?.at === at) latest = null;
      } catch {
        cloud.error = true;
      }
      onCloud({ ...cloud });
    };
    queued.save = () => { latest = null; clearTimeout(timer); };
    return (save: { savedAt?: number }, now = false) => {
      latest = { json: save, at: save.savedAt ?? Date.now() };
      clearTimeout(timer);
      if (now) flush();
      else timer = window.setTimeout(() => flush(), 6000);
    };
  })(),

  /** The cloud copy of this player's save, if there is one. */
  async cloudLoad(): Promise<{ save: unknown; save_at: number | null } | null> {
    if (!player.registered) return null;
    return backend.cloudLoad(player.token);
  },

  /** Make a new recovery code (the old one stops working). */
  async newCode(): Promise<string> {
    await ensureRegistered();
    const res = await backend.newCode(player.token);
    player.code = res.code;
    storePlayer();
    return res.code;
  },

  /** Link this device to the player that owns `code`; returns their cloud save. */
  async recover(code: string): Promise<{ save: unknown; save_at: number | null }> {
    const res = await backend.recover(code, player.token);
    player.name = res.name;
    player.registered = true;
    const raw = codeOf(code);
    player.code = raw.length === 16 ? raw.match(/.{4}/g)!.join('-') : undefined;
    storePlayer();
    return res;
  },

  /**
   * Forget this device's player and start as a new chef. The old player's
   * cloud save and leaderboard entry stay on the server, so a recovery code
   * made before the reset can still bring them back.
   */
  reset() {
    queued.save?.();
    queued.score?.();
    player = newPlayer();
    cloud.savedAt = null;
    cloud.error = false;
    storePlayer();
  },

  /** Change the display name (1-16 characters). Throws with a readable message if refused. */
  async rename(name: string) {
    const res = await backend.register(player.token, name);
    player.name = res.name;
    player.registered = true;
    storePlayer();
  },

  /** This player's inbox (registering first, so a new player's inbox starts now). */
  async mail(): Promise<Mail[]> {
    await ensureRegistered();
    return backend.listMail(player.token);
  },

  async readMail(ids: number[]) {
    if (ids.length) await backend.readMail(player.token, ids);
  },

  async claimMail(id: number): Promise<MailRewards> {
    return backend.claimMail(player.token, id);
  },

  /** With ?mock=1 only: send a message, to this player (`toMe`) or to everyone. For testing the inbox. */
  mockSend(m: Partial<MailRewards> & { title: string; body?: string }, toMe = false) {
    if (!useMock) throw new Error('Only with ?mock=1; send real messages with public.send_mail in Supabase.');
    const db = loadDb();
    const mail = db.mail ??= [];
    mail.push({ id: mail.length + 1, to: toMe ? player.token : undefined, sent: Date.now(), body: '', coins: 0, gems: 0, energy: 0, items: [], ...m });
    storeDb(db);
  },

  async board(period: Period): Promise<Board> {
    return backend.board(player.registered ? player.token : null, period);
  },

  /** Report the running total of customers served. Debounced; failures are retried on the next report. */
  submit: (() => {
    let timer = 0;
    let pending: { served: number; level: number } | null = null;
    const flush = async () => {
      if (!pending) return;
      const { served, level } = pending;
      try {
        await ensureRegistered();
        const res = await backend.submit(player.token, served, level);
        if (res.throttled) { timer = window.setTimeout(flush, 4000); return; }
        if (pending?.served === served) pending = null;
      } catch { /* offline or blocked: try again with the next report */ }
    };
    queued.score = () => { pending = null; clearTimeout(timer); };
    return (served: number, level: number) => {
      pending = { served, level };
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
