// Pure game logic. No DOM access here so it can be unit tested and reused
// unchanged when the game is wrapped for iOS / Android.

import { CHAPTERS, ChapterDef, TaskDef } from './story';
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
  stars: number;
  boss: boolean;
}

export interface GameState {
  v: 2;
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
  /** Tower restoration (added after v2 shipped; filled in by load()). */
  stars: number;
  chapter: number;
  tasksDone: string[];
  storySeen: string[];
  /** Extra Stars every monster drops (a chapter reward). */
  starBonus?: number;
  /** When the player last changed something (ms); the newest of local and cloud wins. */
  savedAt?: number;
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

// ---------------------------------------------------------------- new game

export function newGame(rng: Rng = Math.random, now = Date.now()): GameState {
  const s: GameState = {
    v: 2,
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
    stars: 0,
    chapter: 0,
    tasksDone: [],
    storySeen: [],
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
  place(2, 8, gen('well'));
  place(4, 8, gen('windmill'));
  place(6, 8, gen('forge'));
  place(1, 5, item('water', 1));
  place(2, 5, item('water', 1));
  place(5, 7, item('water', 1)); // drag this onto the pair to learn merge-3
  place(4, 5, item('fire', 1));
  place(5, 6, item('earth', 1));
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
  | { type: 'merge'; from: number; to: number; result: Piece; results: number[]; consumed: number[]; unveiled: number[] }
  | { type: 'need3'; from: number; to: number };

/** Items needed to merge, and the bonus rule: 5 matching items make 2. */
export const MERGE_COUNT = 3;
const BONUS_COUNT = 5;

/**
 * Orthogonally connected cells holding the same item as `start`, nearest
 * first. Veiled cells count (merging frees them); sealed cells do not.
 */
export function matchGroup(s: GameState, start: number, p: Piece, skip = -1): number[] {
  const seen = new Set<number>([start]);
  const out: number[] = [];
  const queue = [start];
  while (queue.length) {
    const i = queue.shift()!;
    out.push(i);
    const { x, y } = pos(s, i);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows) continue;
      const j = idx(s, nx, ny);
      if (seen.has(j) || j === skip) continue;
      seen.add(j);
      const c = s.board[j];
      if (c.lock !== 2 && samePiece(c.piece, p)) queue.push(j);
    }
  }
  return out;
}

/** How many items a group of `n` turns into, and how many it uses up. */
export function mergeYield(n: number): { made: number; used: number } {
  const bonus = Math.floor(n / BONUS_COUNT);
  const rest = Math.floor((n % BONUS_COUNT) / MERGE_COUNT);
  return { made: bonus * 2 + rest, used: bonus * BONUS_COUNT + rest * MERGE_COUNT };
}

/**
 * Clear `consumed` (nearest first) and put `made` next-level items on the
 * first of those cells, starting with the drop cell.
 */
function mergeAt(s: GameState, from: number, to: number, consumed: number[], made: number, p: Extract<Piece, { kind: 'item' }>): MoveResult {
  const result = item(p.chain, p.level + 1);
  for (const i of consumed) s.board[i] = { piece: null, lock: 0 };
  const results = consumed.slice(0, made);
  for (const i of results) s.board[i].piece = { ...result };
  const unveiled: number[] = [];
  for (const i of results) unveiled.push(...revealAround(s, i));
  return { type: 'merge', from, to, result, results, consumed, unveiled };
}

/** Drag the piece at `from` onto cell `to`. */
export function movePiece(s: GameState, from: number, to: number): MoveResult {
  if (from === to) return { type: 'none' };
  const a = s.board[from];
  const b = s.board[to];
  if (!a.piece || a.lock !== 0 || b.lock === 2) return { type: 'none' };
  const p = a.piece;
  const mergeable = p.kind === 'item' && p.level < maxLevel(p.chain);

  // Dropped onto a matching item: the dragged item joins that group.
  if (mergeable && samePiece(p, b.piece)) {
    const group = matchGroup(s, to, p, from);
    const { made, used } = mergeYield(group.length + 1);
    if (!made) return { type: 'need3', from, to };
    a.piece = null;
    // The dragged item is one of the used items, so take one fewer from the board.
    return mergeAt(s, from, to, group.slice(0, used - 1), made, p);
  }

  if (b.lock === 1) return { type: 'none' };
  if (!b.piece) {
    b.piece = a.piece;
    a.piece = null;
    // Moving next to two or more matches completes a group.
    if (mergeable) {
      const group = matchGroup(s, to, p);
      const { made, used } = mergeYield(group.length);
      if (made) return mergeAt(s, from, to, group.slice(0, used), made, p);
    }
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
  // Merging takes 3, so each level costs 3x the last; keep asks gentle.
  const top = Math.min(7, 2 + Math.floor((s.level - 1) / 3) + (boss ? 1 : 0));
  const count = boss ? 3 : s.level < 3 ? 1 : 1 + Math.floor(rng() * 2);

  const chains = shuffle(rng, [...MAGIC_CHAINS]).slice(0, count);
  const needs: Need[] = chains.map((chain) => {
    // Bias towards the upper end of what the player can currently reach.
    const level = Math.max(1, Math.min(top, Math.ceil(Math.sqrt(rng()) * top)));
    return { chain, level };
  });

  const power = needs.reduce((t, n) => t + Math.pow(3, n.level - 1), 0);
  return {
    id: s.nextMonsterId++,
    kind: def.kind,
    name: def.name,
    needs,
    coins: Math.round(power * 2 + 4) * (boss ? 2 : 1),
    xp: needs.reduce((t, n) => t + n.level * 2, 0) + (boss ? 10 : 0),
    gems: boss ? 5 : 0,
    stars: boss ? 3 : needs.length >= 2 ? 2 : 1,
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
  s.stars += (m.stars ?? 1) + (s.starBonus ?? 0);
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

// ---------------------------------------------------------------- tower

export function currentChapter(s: GameState): ChapterDef | null {
  return CHAPTERS[s.chapter] ?? null;
}

/** The next task to do in the current chapter, or null if none are left. */
export function currentTask(s: GameState): TaskDef | null {
  const ch = currentChapter(s);
  return ch?.tasks.find((t) => !s.tasksDone.includes(t.id)) ?? null;
}

export type RestoreResult =
  | { ok: true; task: TaskDef; chapterDone: ChapterDef | null; unsealed: number[]; upgraded: number[]; placed: number[] }
  | { ok: false; reason: 'stars' | 'none'; cost?: number };

/** Spend Stars on the next task. Finishing the last task completes the chapter. */
export function restore(s: GameState): RestoreResult {
  const task = currentTask(s);
  if (!task) return { ok: false, reason: 'none' };
  if (s.stars < task.cost) return { ok: false, reason: 'stars', cost: task.cost };
  s.stars -= task.cost;
  s.tasksDone.push(task.id);
  const ch = currentChapter(s)!;
  if (currentTask(s)) return { ok: true, task, chapterDone: null, unsealed: [], upgraded: [], placed: [] };

  // Chapter complete: pay out its reward and move on.
  s.coins += ch.reward.coins;
  s.gems += ch.reward.gems;
  const unsealed: number[] = [];
  if (ch.reward.unsealBoard) {
    s.board.forEach((c, i) => { if (c.lock === 2) { c.lock = 1; unsealed.push(i); } });
  }
  const upgraded: number[] = [];
  if (ch.reward.upgradeGens) {
    s.board.forEach((c, i) => {
      if (c.piece?.kind === 'gen' && genLevel(c.piece) < GEN_LEVELS.length) {
        c.piece.level = genLevel(c.piece) + 1;
        upgraded.push(i);
      }
    });
  }
  // Reward items go on free cells, nearest the bottom of the board first.
  const placed: number[] = [];
  for (const it of ch.reward.items ?? []) {
    for (let k = 0; k < it.count; k++) {
      const at = nearestEmpty(s, s.board.length - 1 - Math.floor(s.cols / 2));
      if (at < 0) break;
      s.board[at].piece = item(it.chain, it.level);
      placed.push(at);
    }
  }
  if (ch.reward.starBonus) s.starBonus = (s.starBonus ?? 0) + ch.reward.starBonus;
  s.chapter++;
  return { ok: true, task, chapterDone: ch, unsealed, upgraded, placed };
}

// ---------------------------------------------------------------- save

// v2: elements replaced the old crystal/herb/flame/arcane chains.
const SAVE_KEY = 'arcane-merge-save-v2';

export function save(s: GameState, storage: Pick<Storage, 'setItem'> = localStorage) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

/** Check a parsed save (local or cloud) and fill in fields added after v2 shipped. */
export function validateSave(data: unknown): GameState | null {
  const s = data as GameState | null;
  if (!s || typeof s !== 'object' || s.v !== 2 || !Array.isArray(s.board) || s.board.length !== s.cols * s.rows) return null;
  if (!Array.isArray(s.monsters)) return null;
  // Saves from before the tower existed start at the first chapter.
  s.stars ??= 0;
  s.chapter ??= 0;
  s.tasksDone ??= [];
  s.storySeen ??= [];
  return s;
}

export function load(storage: Pick<Storage, 'getItem'> = localStorage): GameState | null {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    return validateSave(JSON.parse(raw));
  } catch {
    return null;
  }
}
