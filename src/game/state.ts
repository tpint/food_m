// Pure game logic. No DOM access here so it can be unit tested and reused
// unchanged when the game is wrapped for iOS / Android.

import { CHAPTERS, ChapterDef, TaskDef } from './story';
import {
  ACTIVE_CUSTOMERS, BOARD_COLS, BOARD_ROWS, CHAINS, CRITIC, CRITIC_EVERY, CUSTOMERS, ChainId, CustomerKind,
  ENERGY_REGEN_MS, FOOD_CHAINS, GEN_LEVELS, GENERATORS, GenId, MAX_ENERGY, SPAWN_COST, maxLevel, xpForLevel,
} from './config';

export type Piece =
  | { kind: 'item'; chain: ChainId; level: number }
  | { kind: 'gen'; gen: GenId; level?: number };


export interface Cell {
  piece: Piece | null;
}

export interface Need {
  chain: ChainId;
  level: number;
}

export interface Customer {
  id: number;
  kind: CustomerKind;
  name: string;
  /** The dishes this customer ordered. */
  order: Need[];
  coins: number;
  xp: number;
  gems: number;
  stars: number;
  /** A food critic: a bigger order and bigger rewards. */
  critic: boolean;
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
  customers: Customer[];
  nextCustomerId: number;
  /** Customers served, all time. */
  served: number;
  /** Restaurant restoration. */
  stars: number;
  chapter: number;
  tasksDone: string[];
  storySeen: string[];
  /** Extra Stars every customer gives (a chapter reward). */
  starBonus?: number;
  /** Today's quests (filled in by ensureDaily). */
  daily?: Daily;
  /** Pieces stored in the fridge (the inventory), and how many slots it has. */
  fridge?: Piece[];
  fridgeSlots?: number;
  /** Reward pieces that didn't fit on the board, oldest first. Only the game adds to it. */
  rewardBag?: Piece[];
  /** When the player last changed something (ms); the newest of local and cloud wins. */
  savedAt?: number;
  /** First-time tutorial step (1-based); absent once it is done or for older saves. */
  tutorial?: number;
  /** Pieces the player has had, as discoveryKey()s; the details panel shows the rest as silhouettes. */
  discovered?: string[];
}

export type QuestKind = 'serve' | 'merge' | 'cook' | 'mergeHigh';
/** Quests drawn from each day. */
export const QUEST_KINDS: QuestKind[] = ['serve', 'merge', 'cook', 'mergeHigh'];

export interface Quest {
  kind: QuestKind;
  target: number;
  /** For 'mergeHigh': the item level to make. */
  level?: number;
  progress: number;
  claimed: boolean;
  coins: number;
  gems: number;
}

export interface Daily {
  /** Local date the quests are for, e.g. "2026-10-12". */
  day: string;
  quests: Quest[];
  /** The chest for finishing every quest has been opened. */
  bonusClaimed: boolean;
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
    v: 1,
    cols: BOARD_COLS,
    rows: BOARD_ROWS,
    board: Array.from({ length: BOARD_COLS * BOARD_ROWS }, () => ({ piece: null })),
    energy: MAX_ENERGY,
    energyTs: now,
    coins: 50,
    gems: 10,
    xp: 0,
    level: 1,
    customers: [],
    nextCustomerId: 1,
    served: 0,
    stars: 0,
    chapter: 0,
    tasksDone: [],
    storySeen: [],
    tutorial: 1,
  };

  // A row of starter items across the board (the two rows above start empty).
  for (let x = 0; x < s.cols; x++) {
    const chain = pick(rng, FOOD_CHAINS);
    const level = 1 + Math.floor(rng() * 4);
    s.board[idx(s, x, 2)] = { piece: item(chain, Math.min(level, 4)) };
  }

  // Kitchen stations along the bottom, a few starter items in the middle.
  const place = (x: number, y: number, p: Piece) => (s.board[idx(s, x, y)] = { piece: p });
  place(0, 8, gen('oven'));
  place(2, 8, gen('fountain'));
  place(4, 8, gen('mixer'));
  place(6, 8, gen('bbq'));
  place(1, 5, item('drinks', 1));
  place(2, 5, item('drinks', 1));
  place(5, 7, item('drinks', 1)); // drag this onto the pair to learn merge-3
  place(4, 5, item('grill', 1));
  place(5, 6, item('bakery', 1));
  place(3, 6, item('coin', 1));
  place(1, 7, item('energy', 1));

  while (s.customers.length < ACTIVE_CUSTOMERS) s.customers.push(makeCustomer(s, rng));
  discover(s);
  return s;
}

// ---------------------------------------------------------------- discovery

export const discoveryKey = (p: Piece) => (p.kind === 'item' ? `item:${p.chain}:${p.level}` : `gen:${p.gen}:${genLevel(p)}`);

/**
 * Records every piece on the board and in the fridge as discovered. A station at
 * some level has been through every level below it, so those count too. Returns
 * whether anything new was found.
 */
export function discover(s: GameState): boolean {
  const known = new Set(s.discovered ?? []);
  const before = known.size;
  for (const p of [...s.board.map((c) => c.piece), ...(s.fridge ?? [])]) {
    if (!p) continue;
    if (p.kind === 'item') known.add(discoveryKey(p));
    else for (let lv = 1; lv <= genLevel(p); lv++) known.add(discoveryKey(gen(p.gen, lv)));
  }
  s.discovered = [...known];
  return known.size > before;
}

export const isDiscovered = (s: GameState, p: Piece) => !!s.discovered?.includes(discoveryKey(p));

// ---------------------------------------------------------------- tutorial

export interface TutorialStep {
  /** Every setup cell holds this item. */
  piece: Piece;
  setup: number[];
  /** Drag the item at `from` to `to` to make the merge. */
  from: number;
  to: number;
  /** How many items the merge uses (3 make one, 5 make two). */
  count: number;
}

/** The first-time tutorial: merge three drinks, then five desserts. Cells are [x, y]. */
const TUTORIAL: { chain: ChainId; setup: [number, number][]; from: [number, number]; to: [number, number] }[] = [
  // Uses newGame's water pair and the lone water below it.
  { chain: 'drinks', setup: [[1, 5], [2, 5], [5, 7]], from: [5, 7], to: [3, 5] },
  // Four candies along the empty top row, plus one more to drag in.
  { chain: 'dessert', setup: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 1]], from: [5, 1], to: [5, 0] },
];
export const TUTORIAL_STEPS = TUTORIAL.length;

/**
 * The current tutorial step, placing its items on any empty setup cells. Ends
 * the tutorial (and returns null) when it is done or the board no longer fits.
 */
export function tutorialStep(s: GameState): TutorialStep | null {
  const t = s.tutorial ? TUTORIAL[s.tutorial - 1] : undefined;
  if (!t) { delete s.tutorial; return null; }
  const at = ([x, y]: [number, number]) => idx(s, x, y);
  const piece = item(t.chain, 1);
  const setup = t.setup.map(at);
  if (s.board[at(t.to)].piece || setup.some((i) => s.board[i].piece && !samePiece(s.board[i].piece, piece))) {
    delete s.tutorial;
    return null;
  }
  for (const i of setup) s.board[i].piece ??= { ...piece };
  return { piece, setup, from: at(t.from), to: at(t.to), count: setup.length };
}

/** Move on after the step's merge; returns the next step, or null when the tutorial is over. */
export function advanceTutorial(s: GameState): TutorialStep | null {
  if (!s.tutorial) return null;
  s.tutorial++;
  return tutorialStep(s);
}

export function skipTutorial(s: GameState) {
  delete s.tutorial;
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
  | { type: 'merge'; from: number; to: number; result: Piece; results: number[]; consumed: number[] }
  | { type: 'need3'; from: number; to: number };

/** Items needed to merge, and the bonus rule: 5 matching items make 2. */
export const MERGE_COUNT = 3;
const BONUS_COUNT = 5;

/**
 * Orthogonally connected cells holding the same item as `start`, nearest first.
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
      if (samePiece(s.board[j].piece, p)) queue.push(j);
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
  for (const i of consumed) s.board[i] = { piece: null };
  const results = consumed.slice(0, made);
  for (const i of results) s.board[i].piece = { ...result };
  questProgress(s, 'merge');
  questProgress(s, 'mergeHigh', made, result.level);
  return { type: 'merge', from, to, result, results, consumed };
}

/** Drag the piece at `from` onto cell `to`. */
export function movePiece(s: GameState, from: number, to: number): MoveResult {
  if (from === to) return { type: 'none' };
  const a = s.board[from];
  const b = s.board[to];
  if (!a.piece) return { type: 'none' };
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

/** Nearest empty cell to `origin` (Chebyshev distance, then Manhattan). */
export function nearestEmpty(s: GameState, origin: number): number {
  const o = pos(s, origin);
  let best = -1, bestD = Infinity;
  s.board.forEach((c, i) => {
    if (c.piece) return;
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
  if (!c.piece || c.piece.kind !== 'gen') return { ok: false, reason: 'invalid' };
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
  questProgress(s, 'cook');
  return { ok: true, at, piece, free };
}

export type UpgradeCheck =
  | { ok: true; cost: number }
  | { ok: false; reason: 'max' | 'level' | 'coins' | 'invalid'; cost?: number; req?: number };

export function canUpgrade(s: GameState, i: number): UpgradeCheck {
  const c = s.board[i];
  if (!c.piece || c.piece.kind !== 'gen') return { ok: false, reason: 'invalid' };
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

/** Tap a coin / energy item to turn it into resources. */
export function collect(s: GameState, i: number): { resource: 'coins' | 'energy'; amount: number } | null {
  const c = s.board[i];
  if (!c.piece || c.piece.kind !== 'item') return null;
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
  if (!c.piece) return 0;
  const v = sellValue(c.piece);
  if (!v) return 0;
  s.coins += v;
  c.piece = null;
  return v;
}

// ---------------------------------------------------------------- customers

/** A new customer. */
export function makeCustomer(s: GameState, rng: Rng = Math.random): Customer {
  const critic = (s.nextCustomerId % CRITIC_EVERY) === 0;
  const unlocked = CUSTOMERS.filter((m) => m.minLevel <= s.level);
  const fresh = unlocked.filter((m) => !s.customers.some((x) => x.kind === m.kind));
  const def = critic ? CRITIC : pick(rng, fresh.length ? fresh : unlocked);
  // Merging takes 3, so each level costs 3x the last; keep orders gentle.
  const top = Math.min(7, 2 + Math.floor((s.level - 1) / 3) + (critic ? 1 : 0));
  const count = critic ? 3 : s.level < 3 ? 1 : 1 + Math.floor(rng() * 2);

  const chains = shuffle(rng, [...FOOD_CHAINS]).slice(0, count);
  const order: Need[] = chains.map((chain) => {
    // Bias towards the upper end of what the player can currently reach.
    const level = Math.max(1, Math.min(top, Math.ceil(Math.sqrt(rng()) * top)));
    return { chain, level };
  });

  const power = order.reduce((t, n) => t + Math.pow(3, n.level - 1), 0);
  return {
    id: s.nextCustomerId++,
    kind: def.kind,
    name: def.name,
    order,
    coins: Math.round(power * 2 + 4) * (critic ? 2 : 1),
    xp: order.reduce((t, n) => t + n.level * 2, 0) + (critic ? 10 : 0),
    gems: critic ? 5 : 0,
    stars: critic ? 3 : order.length >= 2 ? 2 : 1,
    critic,
  };
}

/** Board cells (one per dish) that would be served to fill an order, or null. */
export function findOrder(s: GameState, m: Customer): number[] | null {
  const used = new Set<number>();
  for (const n of m.order) {
    const i = s.board.findIndex((c, j) =>
      !used.has(j) && c.piece?.kind === 'item' && c.piece.chain === n.chain && c.piece.level === n.level);
    if (i < 0) return null;
    used.add(i);
  }
  return [...used];
}

/** True if this item is part of any customer's order. */
export function isWanted(s: GameState, p: Piece | null): boolean {
  if (!p || p.kind !== 'item') return false;
  return s.customers.some((m) => m.order.some((n) => n.chain === p.chain && n.level === p.level));
}

export interface ServeResult {
  cells: number[];
  customer: Customer;
  levelUp: boolean;
}

/** Serve a customer their whole order from the board and collect the rewards. */
export function serve(s: GameState, customerId: number, rng: Rng = Math.random): ServeResult | null {
  const mi = s.customers.findIndex((m) => m.id === customerId);
  if (mi < 0) return null;
  const m = s.customers[mi];
  const cells = findOrder(s, m);
  if (!cells) return null;

  for (const i of cells) s.board[i].piece = null;
  s.coins += m.coins;
  s.gems += m.gems;
  s.stars += (m.stars ?? 1) + (s.starBonus ?? 0);
  s.served++;
  questProgress(s, 'serve');
  const levelUp = addXp(s, m.xp);
  s.customers.splice(mi, 1, makeCustomer(s, rng));
  return { cells, customer: m, levelUp };
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

// ---------------------------------------------------------------- fridge (inventory)

export const FRIDGE_START_SLOTS = 5;
export const FRIDGE_MAX_SLOTS = 15;

export const fridgeSlots = (s: GameState) => s.fridgeSlots ?? FRIDGE_START_SLOTS;
/** Gems for the next fridge slot: 10, then 5 more for each slot bought. */
export const fridgeSlotCost = (s: GameState) => 10 + 5 * (fridgeSlots(s) - FRIDGE_START_SLOTS);

export type StoreResult = { ok: true; piece: Piece } | { ok: false; reason: 'full' | 'invalid' };

/** Move the piece on board cell `i` into the fridge. */
export function storeInFridge(s: GameState, i: number): StoreResult {
  const c = s.board[i];
  if (!c?.piece) return { ok: false, reason: 'invalid' };
  s.fridge ??= [];
  if (s.fridge.length >= fridgeSlots(s)) return { ok: false, reason: 'full' };
  const piece = c.piece;
  s.fridge.push(piece);
  c.piece = null;
  return { ok: true, piece };
}

export type TakeResult = { ok: true; at: number; piece: Piece } | { ok: false; reason: 'full' | 'invalid' };

/** Put fridge slot `slot` back on the board, on the free cell nearest `near` (default: the bottom middle). */
export function takeFromFridge(s: GameState, slot: number, near = s.board.length - 1 - Math.floor(s.cols / 2)): TakeResult {
  const piece = s.fridge?.[slot];
  if (!piece) return { ok: false, reason: 'invalid' };
  const at = nearestEmpty(s, near);
  if (at < 0) return { ok: false, reason: 'full' };
  s.board[at].piece = piece;
  s.fridge!.splice(slot, 1);
  return { ok: true, at, piece };
}

export type BuySlotResult = { ok: true; cost: number } | { ok: false; reason: 'max' | 'gems'; cost?: number };

export function buyFridgeSlot(s: GameState): BuySlotResult {
  if (fridgeSlots(s) >= FRIDGE_MAX_SLOTS) return { ok: false, reason: 'max' };
  const cost = fridgeSlotCost(s);
  if (s.gems < cost) return { ok: false, reason: 'gems', cost };
  s.gems -= cost;
  s.fridgeSlots = fridgeSlots(s) + 1;
  return { ok: true, cost };
}

// ---------------------------------------------------------------- reward bag

const bottomMiddle = (s: GameState) => s.board.length - 1 - Math.floor(s.cols / 2);

/**
 * Give the player a reward piece: on the free cell nearest the bottom middle, or, when the board
 * is full, at the back of the reward bag. Returns the cell it landed on, or -1 if it was bagged.
 */
export function grantPiece(s: GameState, piece: Piece): number {
  const at = nearestEmpty(s, bottomMiddle(s));
  if (at < 0) {
    (s.rewardBag ??= []).push(piece);
    return -1;
  }
  s.board[at].piece = piece;
  return at;
}

/** Put the oldest piece in the reward bag on the board (first in, first out). */
export function takeFromRewardBag(s: GameState, near = bottomMiddle(s)): TakeResult {
  const piece = s.rewardBag?.[0];
  if (!piece) return { ok: false, reason: 'invalid' };
  const at = nearestEmpty(s, near);
  if (at < 0) return { ok: false, reason: 'full' };
  s.board[at].piece = piece;
  s.rewardBag!.shift();
  return { ok: true, at, piece };
}

// ---------------------------------------------------------------- daily quests

export const QUESTS_PER_DAY = 3;
/** Opening the chest for finishing every quest of the day. */
export const DAILY_BONUS = { gems: 10, energy: 50 };

/** Local calendar day, e.g. "2026-10-12". */
export function dayKey(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Milliseconds until local midnight, when new quests arrive. */
export function msToNextDay(now = Date.now()): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime() - now;
}

/** A quest of `kind`, scaled to the player's level. */
export function makeQuest(s: GameState, kind: QuestKind): Quest {
  const L = s.level;
  const q = { kind, progress: 0, claimed: false, coins: 20 + L * 5, gems: 2 };
  switch (kind) {
    case 'serve': return { ...q, target: 3 + Math.floor(L / 5), coins: q.coins + 10 };
    case 'merge': return { ...q, target: 12 + L };
    case 'cook': return { ...q, target: 25 + L * 2 };
    case 'mergeHigh': return { ...q, target: 1, level: Math.min(6, 3 + Math.floor(L / 4)), gems: 3 };
  }
}

/** Give the player today's quests if they don't have them yet. Returns true when new ones were made. */
export function ensureDaily(s: GameState, now = Date.now(), rng: Rng = Math.random): boolean {
  const day = dayKey(now);
  if (s.daily?.day === day) return false;
  const kinds = shuffle(rng, [...QUEST_KINDS]).slice(0, QUESTS_PER_DAY);
  s.daily = { day, quests: kinds.map((k) => makeQuest(s, k)), bonusClaimed: false };
  return true;
}

/** Count something the player did towards today's quests. */
export function questProgress(s: GameState, kind: QuestKind, amount = 1, level = 0) {
  for (const q of s.daily?.quests ?? []) {
    if (q.kind !== kind || q.progress >= q.target) continue;
    if (kind === 'mergeHigh' && level < (q.level ?? 0)) continue;
    q.progress = Math.min(q.target, q.progress + amount);
  }
}

export const questDone = (q: Quest) => q.progress >= q.target;

/** Quests finished but not claimed, plus the bonus chest if it is ready. */
export function claimableQuests(s: GameState): number {
  const qs = s.daily?.quests ?? [];
  const ready = qs.filter((q) => questDone(q) && !q.claimed).length;
  const bonus = qs.length > 0 && qs.every((q) => q.claimed) && !s.daily!.bonusClaimed ? 1 : 0;
  return ready + bonus;
}

export function claimQuest(s: GameState, i: number): Quest | null {
  const q = s.daily?.quests[i];
  if (!q || q.claimed || !questDone(q)) return null;
  q.claimed = true;
  s.coins += q.coins;
  s.gems += q.gems;
  return q;
}

/** Open the chest for finishing all of today's quests. */
export function claimDailyBonus(s: GameState): typeof DAILY_BONUS | null {
  const d = s.daily;
  if (!d || d.bonusClaimed || !d.quests.every((q) => q.claimed)) return null;
  d.bonusClaimed = true;
  s.gems += DAILY_BONUS.gems;
  s.energy += DAILY_BONUS.energy;
  return DAILY_BONUS;
}

// ---------------------------------------------------------------- restaurant

export function currentChapter(s: GameState): ChapterDef | null {
  return CHAPTERS[s.chapter] ?? null;
}

/** The next task to do in the current chapter, or null if none are left. */
export function currentTask(s: GameState): TaskDef | null {
  const ch = currentChapter(s);
  return ch?.tasks.find((t) => !s.tasksDone.includes(t.id)) ?? null;
}

export type RestoreResult =
  | { ok: true; task: TaskDef; chapterDone: ChapterDef | null; upgraded: number[]; placed: number[] }
  | { ok: false; reason: 'stars' | 'none'; cost?: number };

/** Spend Stars on the next task. Finishing the last task completes the chapter. */
export function restore(s: GameState): RestoreResult {
  const task = currentTask(s);
  if (!task) return { ok: false, reason: 'none' };
  if (s.stars < task.cost) return { ok: false, reason: 'stars', cost: task.cost };
  s.stars -= task.cost;
  s.tasksDone.push(task.id);
  const ch = currentChapter(s)!;
  if (currentTask(s)) return { ok: true, task, chapterDone: null, upgraded: [], placed: [] };

  // Chapter complete: pay out its reward and move on.
  s.coins += ch.reward.coins;
  s.gems += ch.reward.gems;
  const upgraded: number[] = [];
  if (ch.reward.upgradeGens) {
    s.board.forEach((c, i) => {
      if (c.piece?.kind === 'gen' && genLevel(c.piece) < GEN_LEVELS.length) {
        c.piece.level = genLevel(c.piece) + 1;
        upgraded.push(i);
      }
    });
  }
  // Reward items go on free cells, nearest the bottom of the board first; the rest wait in the reward bag.
  const placed: number[] = [];
  for (const it of ch.reward.items ?? []) {
    for (let k = 0; k < it.count; k++) {
      const at = grantPiece(s, item(it.chain, it.level));
      if (at >= 0) placed.push(at);
    }
  }
  if (ch.reward.starBonus) s.starBonus = (s.starBonus ?? 0) + ch.reward.starBonus;
  s.chapter++;
  return { ok: true, task, chapterDone: ch, upgraded, placed };
}

// ---------------------------------------------------------------- save

const SAVE_KEY = 'food-merge-save-v1';

export function save(s: GameState, storage: Pick<Storage, 'setItem'> = localStorage) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

/** Check a parsed save (local or cloud) and fill in optional fields. */
export function validateSave(data: unknown): GameState | null {
  const s = data as GameState | null;
  if (!s || typeof s !== 'object' || s.v !== 1 || !Array.isArray(s.board) || s.board.length !== s.cols * s.rows) return null;
  if (!Array.isArray(s.customers)) return null;
  s.stars ??= 0;
  s.chapter ??= 0;
  s.tasksDone ??= [];
  s.storySeen ??= [];
  discover(s);
  // Older saves kept fewer customers waiting.
  while (s.customers.length < ACTIVE_CUSTOMERS) s.customers.push(makeCustomer(s));
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
