// Static game data: merge chains, kitchen stations and customers.

export type ChainId = 'bakery' | 'drinks' | 'dessert' | 'grill' | 'coin' | 'energy';
export type GenId = 'oven' | 'fountain' | 'mixer' | 'bbq';
/** The four kinds of food customers order. */
export type FoodId = 'bakery' | 'drinks' | 'dessert' | 'grill';
/**
 * Customer kinds. These ids are stored in saves, so they stay as they are even where
 * the painted portrait shows a different animal: penguin is a sheep, pig a deer,
 * frog a squirrel, dog a wolf and lion a tiger.
 */
export type CustomerKind =
  | 'bunny' | 'cat' | 'bear' | 'fox' | 'penguin' | 'pig' | 'frog'
  | 'panda' | 'dog' | 'raccoon' | 'lion' | 'critic';

export interface ChainDef {
  id: ChainId;
  name: string;
  /** Item names, index 0 = level 1. Length = max level. */
  levels: string[];
  /** Dominant colour, used for VFX and UI accents. */
  color: string;
  /** Tapping a max/any level item of this chain collects it as a resource. */
  collect?: { resource: 'coins' | 'energy'; amounts: number[] };
}

export const CHAINS: Record<ChainId, ChainDef> = {
  bakery: {
    id: 'bakery',
    name: 'Bakery',
    levels: ['Wheat', 'Flour Sack', 'Dough', 'Bread Roll', 'Croissant', 'Baguette', 'Bread Basket'],
    color: '#d99a4e',
  },
  drinks: {
    id: 'drinks',
    name: 'Drinks',
    levels: ['Water', 'Lemonade', 'Coffee', 'Hot Cocoa', 'Milkshake', 'Bubble Tea', 'Party Punch'],
    color: '#4aa8f0',
  },
  dessert: {
    id: 'dessert',
    name: 'Desserts',
    levels: ['Candy', 'Cookie', 'Cupcake', 'Donut', 'Sundae', 'Strawberry Cake', 'Wedding Cake'],
    color: '#ff7fb8',
  },
  grill: {
    id: 'grill',
    name: 'Grill',
    levels: ['Egg', 'Fried Egg', 'Sausage', 'Kebab', 'Burger', 'Pizza', 'Roast Chicken'],
    color: '#ff7a3c',
  },
  coin: {
    id: 'coin',
    name: 'Coins',
    levels: ['Coin', 'Coin Stack', 'Tip Jar', 'Cash Register'],
    color: '#ffc93c',
    collect: { resource: 'coins', amounts: [2, 6, 15, 40] },
  },
  energy: {
    id: 'energy',
    name: 'Energy',
    levels: ['Energy Bar', 'Lunch Box', 'Picnic Basket'],
    color: '#a77cf0',
    collect: { resource: 'energy', amounts: [5, 15, 40] },
  },
};

export const FOOD_CHAINS: FoodId[] = ['bakery', 'drinks', 'dessert', 'grill'];
export const isFood = (c: ChainId): c is FoodId => (FOOD_CHAINS as ChainId[]).includes(c);

export interface GenDef {
  id: GenId;
  name: string;
  chain: ChainId;
}

export const GENERATORS: Record<GenId, GenDef> = {
  oven: { id: 'oven', name: 'Bread Oven', chain: 'bakery' },
  fountain: { id: 'fountain', name: 'Drink Fountain', chain: 'drinks' },
  mixer: { id: 'mixer', name: 'Dessert Mixer', chain: 'dessert' },
  bbq: { id: 'bbq', name: 'BBQ Grill', chain: 'grill' },
};

export interface GenLevel {
  /** Weight of spawning an item of level 1, 2, 3, 4. */
  odds: number[];
  /** Chance cooking costs no energy. */
  freeChance: number;
  /** Coins to upgrade to the next level (absent at max level). */
  upgradeCost?: number;
  /** Player level needed to upgrade to the next level. */
  upgradeReq?: number;
}

/** Shared by every station; index 0 = station level 1. */
export const GEN_LEVELS: GenLevel[] = [
  { odds: [85, 15], freeChance: 0, upgradeCost: 40, upgradeReq: 2 },
  { odds: [70, 25, 5], freeChance: 0.05, upgradeCost: 120, upgradeReq: 3 },
  { odds: [55, 32, 13], freeChance: 0.1, upgradeCost: 300, upgradeReq: 5 },
  { odds: [42, 36, 18, 4], freeChance: 0.15, upgradeCost: 700, upgradeReq: 7 },
  { odds: [32, 36, 22, 10], freeChance: 0.2, upgradeCost: 1500, upgradeReq: 9 },
  // Levels 6-10 add a small chance of a level 5 drop and keep improving the odds.
  { odds: [26, 34, 25, 13, 2], freeChance: 0.22, upgradeCost: 2500, upgradeReq: 11 },
  { odds: [20, 32, 28, 16, 4], freeChance: 0.25, upgradeCost: 4000, upgradeReq: 13 },
  { odds: [15, 30, 30, 19, 6], freeChance: 0.28, upgradeCost: 6000, upgradeReq: 15 },
  { odds: [10, 28, 32, 22, 8], freeChance: 0.31, upgradeCost: 9000, upgradeReq: 18 },
  { odds: [6, 24, 34, 26, 10], freeChance: 0.35 },
];

export interface CustomerDef {
  kind: CustomerKind;
  name: string;
  minLevel: number;
}

export const CUSTOMERS: CustomerDef[] = [
  { kind: 'bunny', name: 'Benny Bunny', minLevel: 1 },
  { kind: 'cat', name: 'Mittens', minLevel: 1 },
  { kind: 'bear', name: 'Bruno Bear', minLevel: 1 },
  { kind: 'penguin', name: 'Woolly Sheep', minLevel: 3 },
  { kind: 'pig', name: 'Dash Deer', minLevel: 4 },
  { kind: 'panda', name: 'Bao Panda', minLevel: 5 },
  { kind: 'fox', name: 'Felix Fox', minLevel: 2 },
  { kind: 'frog', name: 'Sammy Squirrel', minLevel: 4 },
  { kind: 'dog', name: 'Rex Wolf', minLevel: 6 },
  { kind: 'raccoon', name: 'Rocco Raccoon', minLevel: 8 },
  { kind: 'lion', name: 'Tora Tiger', minLevel: 10 },
];

/** Every few customers a food critic drops by: a bigger order, bigger rewards. */
export const CRITIC: CustomerDef = { kind: 'critic', name: 'Sir Walrus, Food Critic', minLevel: 1 };

export const BOARD_COLS = 7;
export const BOARD_ROWS = 9;
export const MAX_ENERGY = 100;
export const ENERGY_REGEN_MS = 20_000;
export const SPAWN_COST = 1;
export const ACTIVE_CUSTOMERS = 3;
export const CRITIC_EVERY = 6;
/** New customers cost this many coins, doubling with each refresh until one is served. */
export const REFRESH_BASE_COST = 10;
export const REFRESH_COST_GROWTH = 2;

export const xpForLevel = (level: number) => 10 + (level - 1) * 12;
export const maxLevel = (chain: ChainId) => CHAINS[chain].levels.length;
