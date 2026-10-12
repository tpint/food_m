// Pure game logic. No DOM access here so it can be unit tested and reused
// unchanged when the game is wrapped for iOS / Android.

import {
  ACTIVE_MONSTERS, BOARD_COLS, BOARD_ROWS, BOSS, BOSS_EVERY, CHAINS, ChainId, ENERGY_REGEN_MS,
  GEN_LEVELS, GENERATORS, GenId, MAGIC_CHAINS, MAX_ENERGY, MONSTERS, MonsterKind, SPAWN_COST, maxLevel, xpForLevel,
} from './config';

export type Piece =
  | { kind: 'item'; chain: ChainId; level: number }
  | { kind: 'gen'; gen: GenId; level?: number };

/** 0 = open, 1 = veiled (visible, merge onto it to free), 2 = sealed (hidden). */
export type Lock = 0 | 1 | 2;

export interface Cell {
  piece: Piece | null;
  lock: Lock;
}

export interface Need {
  chain: ChainId;
  level: number;
}

export interface Monster {
  id: number;
  kind: MonsterKind;
  name: string;
  needs: Need[];
  coins: number;
  xp: number;
  gems: number;
  boss: boolean;
}

export interface GameState {
  v: 1;
  cols: number;
  rows: number;
  board: Cell[];
  energy: number;
  energyTs: number;
  coins: number;
  gems: number;
  xp: number;
  level: number;
  monsters: Monster[];
  nextMonsterId: number;
  defeated: number;
}

export type Rng = () => number;

const pick = <T>(rng: Rng, arr: T[]): T => arr[Math.floor(rng() * arr.length)];

function shuffle<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const item = (chain: ChainId, level: number): Piece => ({ kind: 'item', chain, level });
export const gen = (g: GenId, level = 1): Piece => ({ kind: 'gen', gen: g, level });
export const genLevel = (p: Piece) => (p.kind === 'gen' ? p.level ?? 1 : 0);

export const idx = (s: GameState, x: number, y: number) => y * s.cols + x;
export const pos = (s: GameState, i: number) => ({ x: i % s.cols, y: Math.floor(i / s.cols) });

export function samePiece(a: Piece | null, b: Piece | null): boolean {
  if (!a || !b || a.kind !== 'item' || b.kind !== 'item') return false;
  return a.chain === b.chain && a.level === b.level;
}

export function canMerge(a: Piece | null, b: Piece | null): boolean {
  return samePiece(a, b) && a!.kind === 'item' && a!.level < maxLevel(a!.chain);
}

// ---------------------------------------------------------------- new game

export function newGame(rng: Rng = Math.random, now = Date.now()): GameState {
  const s: GameState = {
    v: 1,
    cols: BOARD_COLS,
    rows: BOARD_ROWS,
    board: Array.from({ length: BOARD_COLS * BOARD_ROWS }, () => ({ piece: null, lock: 0 as Lock })),
    energy: MAX_ENERGY,
    energyTs: now,
    coins: 50,
    gems: 10,
    xp: 0,
    level: 1,
    monsters: [],
    nextMonsterId: 1,
    defeated: 0,
  };

  // Top three rows: a misty, locked area full of items, like the cobwebbed
  // part of a Love & Pies board. The row nearest the play area starts veiled.
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < s.cols; x++) {
      const chain = pick(rng, MAGIC_CHAINS);
      const level = 1 + Math.floor(rng() * (2 + y));
      s.board[idx(s, x, y)] = { piece: item(chain, Math.min(level, 4)), lock: y === 2 ? 1 : 2 };
    }
  }

  // Generators along the bottom, a few starter items in the middle.
  const place = (x: number, y: number, p: Piece) => (s.board[idx(s, x, y)] = { piece: p, lock: 0 });
  place(0, 8, gen('geode'));
  place(2, 8, gen('planter'));
  place(4, 8, gen('forge'));
  place(6, 8, gen('lectern'));
  place(1, 5, item('crystal', 1));
  place(2, 5, item('crystal', 1));
  place(4, 5, item('flame', 1));
  place(5, 6, item('herb', 1));
  place(3, 6, item('coin', 1));
  place(1, 7, item('mana', 1));

  while (s.monsters.length < ACTIVE_MONSTERS) s.monsters.push(makeMonster(s, rng));
  return s;
}

// ---------------------------------------------------------------- energy

export function tickEnergy(s: GameState, now = Date.now()): boolean {
  if (s.energy >= MAX_ENERGY) {
    s.energyTs = now;
    return false;
  }
  const gained = Math.floor((now - s.energyTs) / ENERGY_REGEN_MS);
  if (gained <= 0) return false;
  s.energy = Math.min(MAX_ENERGY, s.energy + gained);
  s.energyTs = s.energy >= MAX_ENERGY ? now : s.energyTs + gained * ENERGY_REGEN_MS;
  return true;
}

export function msToNextEnergy(s: GameState, now = Date.now()): number {
  if (s.energy >= MAX_ENERGY) return 0;
  return Math.max(0, ENERGY_REGEN_MS - (now - s.energyTs));
}

// ---------------------------------------------------------------- moves

export type MoveResult =
  | { type: 'none' }
  | { type: 'move'; from: number; to: number }
  | { type: 'swap'; from: number; to: number }
  | { type: 'merge'; from: number; to: number; result: Piece; unveiled: number[] };

/** Drag the piece at `from` onto cell `to`. */
export function movePiece(s: GameState, from: number, to: number): MoveResult {
  if (from === to) return { type: 'none' };
  const a = s.board[from];
  const b = s.board[to];
  if (!a.piece || a.lock !== 0 || b.lock === 2) return { type: 'none' };

  if (canMerge(a.piece, b.piece)) {
    const p = a.piece as Extract<Piece, { kind: 'item' }>;
    const result = item(p.chain, p.level + 1);
    b.piece = result;
    b.lock = 0;
    a.piece = null;
    const unveiled = revealAround(s, to);
    return { type: 'merge', from, to, result, unveiled };
  }

  if (b.lock === 1) return { type: 'none' };
  if (!b.piece) {
    b.piece = a.piece;
    a.piece = null;
    return { type: 'move', from, to };
  }
  [a.piece, b.piece] = [b.piece, a.piece];
  return { type: 'swap', from, to };
}

/** A merge next to sealed cells turns them into veiled ones. */
function revealAround(s: GameState, i: number): number[] {
  const { x, y } = pos(s, i);
  const out: number[] = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows) continue;
    const c = s.board[idx(s, nx, ny)];
    if (c.lock === 2) {
      c.lock = 1;
      out.push(idx(s, nx, ny));
    }
  }
  return out;
}

/** Nearest empty open cell to `origin` (Chebyshev distance, then Manhattan). */
export function nearestEmpty(s: GameState, origin: number): number {
  const o = pos(s, origin);
  let best = -1, bestD = Infinity;
  s.board.forEach((c, i) => {
    if (c.piece || c.lock) return;
    const p = pos(s, i);
    const d = Math.max(Math.abs(p.x - o.x), Math.abs(p.y - o.y)) * 100 + Math.abs(p.x - o.x) + Math.abs(p.y - o.y);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

export type SpawnResult =
  | { ok: true; at: number; piece: Piece; free: boolean }
  | { ok: false; reason: 'energy' | 'full' | 'invalid' };

export function spawnFrom(s: GameState, genIdx: number, rng: Rng = Math.random): SpawnResult {
  const c = s.board[genIdx];
  if (!c.piece || c.piece.kind !== 'gen' || c.lock) return { ok: false, reason: 'invalid' };
  if (s.energy < SPAWN_COST) return { ok: false, reason: 'energy' };
  const at = nearestEmpty(s, genIdx);
  if (at < 0) return { ok: false, reason: 'full' };

  const def = GENERATORS[c.piece.gen];
  const lv = GEN_LEVELS[genLevel(c.piece) - 1];
  const total = lv.odds.reduce((t, w) => t + w, 0);
  let r = rng() * total, level = 1;
  for (let k = 0; k < lv.odds.length; k++) {
    if ((r -= lv.odds[k]) < 0) { level = k + 1; break; }
  }
  const free = rng() < lv.freeChance;
  if (!free) {
    if (s.energy >= MAX_ENERGY) s.energyTs = Date.now();
    s.energy -= SPAWN_COST;
  }
  const piece = item(def.chain, level);
  s.board[at].piece = piece;
  return { ok: true, at, piece, free };
}

export type UpgradeCheck =
  | { ok: true; cost: number }
  | { ok: false; reason: 'max' | 'level' | 'coins' | 'invalid'; cost?: number; req?: number };

export function canUpgrade(s: GameState, i: number): UpgradeCheck {
  const c = s.board[i];
  if (!c.piece || c.piece.kind !== 'gen' || c.lock) return { ok: false, reason: 'invalid' };
  const lv = GEN_LEVELS[genLevel(c.piece) - 1];
  if (lv.upgradeCost === undefined) return { ok: false, reason: 'max' };
  if (s.level < (lv.upgradeReq ?? 0)) return { ok: false, reason: 'level', cost: lv.upgradeCost, req: lv.upgradeReq };
  if (s.coins < lv.upgradeCost) return { ok: false, reason: 'coins', cost: lv.upgradeCost };
  return { ok: true, cost: lv.upgradeCost };
}

export function upgradeGen(s: GameState, i: number): UpgradeCheck {
  const chk = canUpgrade(s, i);
  if (!chk.ok) return chk;
  const p = s.board[i].piece as Extract<Piece, { kind: 'gen' }>;
  s.coins -= chk.cost;
  p.level = genLevel(p) + 1;
  return chk;
}

/** Tap a coin / mana item to turn it into resources. */
export function collect(s: GameState, i: number): { resource: 'coins' | 'energy'; amount: number } | null {
  const c = s.board[i];
  if (!c.piece || c.piece.kind !== 'item' || c.lock) return null;
  const def = CHAINS[c.piece.chain].collect;
  if (!def) return null;
  const amount = def.amounts[c.piece.level - 1];
  if (def.resource === 'coins') s.coins += amount;
  else s.energy += amount; // may exceed the cap, like bonus energy in most merge games
  c.piece = null;
  return { resource: def.resource, amount };
}

export function sellValue(p: Piece): number {
  if (p.kind !== 'item' || CHAINS[p.chain].collect) return 0;
  return Math.max(1, Math.round(Math.pow(2, p.level - 1)));
}

export function sell(s: GameState, i: number): number {
  const c = s.board[i];
  if (!c.piece || c.lock) return 0;
  const v = sellValue(c.piece);
  if (!v) return 0;
  s.coins += v;
  c.piece = null;
  return v;
}

// ---------------------------------------------------------------- monsters

export function makeMonster(s: GameState, rng: Rng = Math.random): Monster {
  const boss = (s.nextMonsterId % BOSS_EVERY) === 0;
  const unlocked = MONSTERS.filter((m) => m.minLevel <= s.level);
  const fresh = unlocked.filter((m) => !s.monsters.some((x) => x.kind === m.kind));
  const def = boss ? BOSS : pick(rng, fresh.length ? fresh : unlocked);
  const top = Math.min(7, 2 + Math.floor(s.level / 2) + (boss ? 1 : 0));
  const count = boss ? 3 : s.level < 3 ? 1 : 1 + Math.floor(rng() * 2);

  const chains = shuffle(rng, [...MAGIC_CHAINS]).slice(0, count);
  const needs: Need[] = chains.map((chain) => {
    // Bias towards the upper end of what the player can currently reach.
    const level = Math.max(1, Math.min(top, Math.ceil(Math.sqrt(rng()) * top)));
    return { chain, level };
  });

  const power = needs.reduce((t, n) => t + Math.pow(2, n.level - 1), 0);
  return {
    id: s.nextMonsterId++,
    kind: def.kind,
    name: def.name,
    needs,
    coins: Math.round(power * 3 + 4) * (boss ? 2 : 1),
    xp: needs.reduce((t, n) => t + n.level * 2, 0) + (boss ? 10 : 0),
    gems: boss ? 5 : 0,
    boss,
  };
}

/** Board cells (one per need) that would be consumed to defeat a monster, or null. */
export function findSpell(s: GameState, m: Monster): number[] | null {
  const used = new Set<number>();
  for (const n of m.needs) {
    const i = s.board.findIndex((c, j) =>
      !used.has(j) && !c.lock && c.piece?.kind === 'item' && c.piece.chain === n.chain && c.piece.level === n.level);
    if (i < 0) return null;
    used.add(i);
  }
  return [...used];
}

/** True if this item satisfies a need of any active monster. */
export function isWanted(s: GameState, p: Piece | null): boolean {
  if (!p || p.kind !== 'item') return false;
  return s.monsters.some((m) => m.needs.some((n) => n.chain === p.chain && n.level === p.level));
}

export interface CastResult {
  cells: number[];
  monster: Monster;
  levelUp: boolean;
}

export function cast(s: GameState, monsterId: number, rng: Rng = Math.random): CastResult | null {
  const mi = s.monsters.findIndex((m) => m.id === monsterId);
  if (mi < 0) return null;
  const m = s.monsters[mi];
  const cells = findSpell(s, m);
  if (!cells) return null;

  for (const i of cells) s.board[i].piece = null;
  s.coins += m.coins;
  s.gems += m.gems;
  s.defeated++;
  const levelUp = addXp(s, m.xp);
  s.monsters.splice(mi, 1, makeMonster(s, rng));
  return { cells, monster: m, levelUp };
}

export function addXp(s: GameState, xp: number): boolean {
  s.xp += xp;
  let up = false;
  while (s.xp >= xpForLevel(s.level)) {
    s.xp -= xpForLevel(s.level);
    s.level++;
    s.gems += 3;
    s.energy = Math.max(s.energy, MAX_ENERGY);
    up = true;
  }
  return up;
}

// ---------------------------------------------------------------- save

const SAVE_KEY = 'arcane-merge-save-v1';

export function save(s: GameState, storage: Pick<Storage, 'setItem'> = localStorage) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

export function load(storage: Pick<Storage, 'getItem'> = localStorage): GameState | null {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s.v !== 1 || s.board?.length !== s.cols * s.rows) return null;
    return s;
  } catch {
    return null;
  }
}
