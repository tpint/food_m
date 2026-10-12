// Static game data: merge chains, generators and monsters.

export type ChainId = 'earth' | 'water' | 'wind' | 'fire' | 'coin' | 'mana';
export type GenId = 'geode' | 'well' | 'windmill' | 'forge';
/** The four elements players brew spells from. */
export type ElementId = 'earth' | 'water' | 'wind' | 'fire';
export type MonsterKind = 'slime' | 'bat' | 'ghost' | 'mushroom' | 'imp' | 'golem' | 'dragon';

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
  earth: {
    id: 'earth',
    name: 'Earth',
    levels: ['Pebble', 'Acorn', 'Rock Cairn', 'Clay Urn', 'Standing Stone', 'Mountain Peak', 'Floating Isle'],
    color: '#c79056',
  },
  water: {
    id: 'water',
    name: 'Water',
    levels: ['Bubbles', 'Seashell', 'Splash', 'Tide Orb', 'Fountain', 'Trident', 'Great Wave'],
    color: '#4aa8f0',
  },
  wind: {
    id: 'wind',
    name: 'Wind',
    levels: ['Wisp', 'Dandelion', 'Pinwheel', 'Kite', 'Wind Chime', 'Tornado', 'Storm Cloud'],
    color: '#6fdcb8',
  },
  fire: {
    id: 'fire',
    name: 'Fire',
    levels: ['Ember', 'Candle', 'Candelabra', 'Lantern', 'Brazier', 'Phoenix Feather', 'Dragon Egg'],
    color: '#ff8a3c',
  },
  coin: {
    id: 'coin',
    name: 'Gold',
    levels: ['Gold Coin', 'Coin Stack', 'Coin Pouch', 'Treasure Chest'],
    color: '#ffc93c',
    collect: { resource: 'coins', amounts: [2, 6, 15, 40] },
  },
  mana: {
    id: 'mana',
    name: 'Mana',
    levels: ['Mana Drop', 'Mana Vial', 'Mana Flask'],
    color: '#ff7fc8',
    collect: { resource: 'energy', amounts: [5, 15, 40] },
  },
};

export const MAGIC_CHAINS: ElementId[] = ['earth', 'water', 'wind', 'fire'];
export const isElement = (c: ChainId): c is ElementId => (MAGIC_CHAINS as ChainId[]).includes(c);

export interface GenDef {
  id: GenId;
  name: string;
  chain: ChainId;
}

export const GENERATORS: Record<GenId, GenDef> = {
  geode: { id: 'geode', name: 'Grimoire of Earth', chain: 'earth' },
  well: { id: 'well', name: 'Grimoire of Water', chain: 'water' },
  windmill: { id: 'windmill', name: 'Grimoire of Wind', chain: 'wind' },
  forge: { id: 'forge', name: 'Grimoire of Fire', chain: 'fire' },
};

export interface GenLevel {
  /** Weight of spawning an item of level 1, 2, 3, 4. */
  odds: number[];
  /** Chance a conjure costs no mana. */
  freeChance: number;
  /** Coins to upgrade to the next level (absent at max level). */
  upgradeCost?: number;
  /** Player level needed to upgrade to the next level. */
  upgradeReq?: number;
}

/** Shared by every generator; index 0 = generator level 1. */
export const GEN_LEVELS: GenLevel[] = [
  { odds: [85, 15], freeChance: 0, upgradeCost: 40, upgradeReq: 2 },
  { odds: [70, 25, 5], freeChance: 0.05, upgradeCost: 120, upgradeReq: 3 },
  { odds: [55, 32, 13], freeChance: 0.1, upgradeCost: 300, upgradeReq: 5 },
  { odds: [42, 36, 18, 4], freeChance: 0.15, upgradeCost: 700, upgradeReq: 7 },
  { odds: [32, 36, 22, 10], freeChance: 0.2 },
];

export interface MonsterDef {
  kind: MonsterKind;
  name: string;
  minLevel: number;
}

export const MONSTERS: MonsterDef[] = [
  { kind: 'slime', name: 'Gloop Slime', minLevel: 1 },
  { kind: 'bat', name: 'Dusk Bat', minLevel: 1 },
  { kind: 'mushroom', name: 'Grumpshroom', minLevel: 1 },
  { kind: 'ghost', name: 'Wisp Ghost', minLevel: 3 },
  { kind: 'imp', name: 'Cinder Imp', minLevel: 4 },
  { kind: 'golem', name: 'Moss Golem', minLevel: 5 },
];

export const BOSS: MonsterDef = { kind: 'dragon', name: 'Ember Wyrmling', minLevel: 1 };

export const BOARD_COLS = 7;
export const BOARD_ROWS = 9;
export const MAX_ENERGY = 100;
export const ENERGY_REGEN_MS = 20_000;
export const SPAWN_COST = 1;
export const ACTIVE_MONSTERS = 3;
export const BOSS_EVERY = 6;

export const xpForLevel = (level: number) => 10 + (level - 1) * 12;
export const maxLevel = (chain: ChainId) => CHAINS[chain].levels.length;
