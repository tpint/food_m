// Static game data: merge chains, generators and monsters.

export type ChainId = 'crystal' | 'herb' | 'flame' | 'arcane' | 'coin' | 'mana';
export type GenId = 'geode' | 'planter' | 'forge' | 'lectern';
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
  crystal: {
    id: 'crystal',
    name: 'Crystal',
    levels: ['Crystal Shard', 'Twin Shards', 'Crystal Cluster', 'Cut Gem', 'Mana Orb', 'Scrying Ball', 'Star Prism'],
    color: '#5cc8f0',
  },
  herb: {
    id: 'herb',
    name: 'Herbal',
    levels: ['Magic Seed', 'Sprout', 'Clover Sprig', 'Herb Bundle', 'Potted Mandrake', 'Moonbloom', 'Elder Bonsai'],
    color: '#6cbf4a',
  },
  flame: {
    id: 'flame',
    name: 'Flame',
    levels: ['Ember', 'Candle', 'Candelabra', 'Lantern', 'Brazier', 'Phoenix Feather', 'Dragon Egg'],
    color: '#ff8a3c',
  },
  arcane: {
    id: 'arcane',
    name: 'Arcane',
    levels: ['Rune Pebble', 'Rune Tablet', 'Spell Scroll', 'Spellbook', 'Magic Wand', 'Wizard Hat', 'Grimoire'],
    color: '#a970e8',
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

export const MAGIC_CHAINS: ChainId[] = ['crystal', 'herb', 'flame', 'arcane'];

export interface GenDef {
  id: GenId;
  name: string;
  chain: ChainId;
  /** Weighted odds for the level of the spawned item. */
  odds: { level: number; weight: number }[];
}

export const GENERATORS: Record<GenId, GenDef> = {
  geode: { id: 'geode', name: 'Glimmer Geode', chain: 'crystal', odds: [{ level: 1, weight: 85 }, { level: 2, weight: 15 }] },
  planter: { id: 'planter', name: 'Fairy Planter', chain: 'herb', odds: [{ level: 1, weight: 85 }, { level: 2, weight: 15 }] },
  forge: { id: 'forge', name: 'Ember Forge', chain: 'flame', odds: [{ level: 1, weight: 85 }, { level: 2, weight: 15 }] },
  lectern: { id: 'lectern', name: 'Rune Lectern', chain: 'arcane', odds: [{ level: 1, weight: 85 }, { level: 2, weight: 15 }] },
};

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
