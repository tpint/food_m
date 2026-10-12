import { describe, expect, it } from 'vitest';
import {
  canUpgrade, cast, collect, mergeYield, findSpell, gen, genLevel, item, movePiece, nearestEmpty, newGame, spawnFrom, tickEnergy,
  upgradeGen, GameState,
} from '../src/game/state';
import { ENERGY_REGEN_MS, GEN_LEVELS, MAX_ENERGY } from '../src/game/config';

function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function empty(): GameState {
  const s = newGame(seeded(), 0);
  s.board.forEach((c) => { c.piece = null; c.lock = 0; });
  return s;
}

describe('board moves', () => {
  it('needs three matching items to merge', () => {
    const s = empty();
    s.board[0].piece = item('water', 1);
    s.board[1].piece = item('water', 1);
    expect(movePiece(s, 0, 1).type).toBe('need3');
    expect(s.board[0].piece).toEqual(item('water', 1));
    expect(s.board[1].piece).toEqual(item('water', 1));
  });

  it('merges three touching items into one of the next level on the drop cell', () => {
    const s = empty();
    s.board[0].piece = item('water', 1);
    s.board[1].piece = item('water', 1);
    s.board[2].piece = item('water', 1);
    s.board[20].piece = item('water', 1);
    const r = movePiece(s, 20, 1);
    expect(r.type).toBe('merge');
    expect(s.board[1].piece).toEqual(item('water', 2));
    // Four crystals were involved: three are used, one is left over.
    expect(s.board[20].piece).toBeNull();
    expect([0, 2].filter((i) => s.board[i].piece).length).toBe(1);
    if (r.type === 'merge') expect(r.results).toEqual([1]);
  });

  it('turns five touching items into two', () => {
    const s = empty();
    for (const i of [0, 1, 2, 3]) s.board[i].piece = item('earth', 2);
    s.board[30].piece = item('earth', 2);
    const r = movePiece(s, 30, 0);
    expect(r.type === 'merge' && r.results.length).toBe(2);
    expect(s.board.filter((c) => c.piece?.kind === 'item' && c.piece.level === 3)).toHaveLength(2);
    expect(s.board.filter((c) => c.piece?.kind === 'item' && c.piece.level === 2)).toHaveLength(0);
    expect(s.board[0].piece).toEqual(item('earth', 3));
  });

  it('merges when an item is moved next to two matches', () => {
    const s = empty();
    s.board[0].piece = item('fire', 1);
    s.board[1].piece = item('fire', 1);
    s.board[30].piece = item('fire', 1);
    const r = movePiece(s, 30, 2);
    expect(r.type).toBe('merge');
    expect(s.board[2].piece).toEqual(item('fire', 2));
    expect(s.board[0].piece).toBeNull();
  });

  it('swaps different items and moves into empty cells', () => {
    const s = empty();
    s.board[0].piece = item('water', 1);
    s.board[1].piece = item('earth', 1);
    expect(movePiece(s, 0, 1).type).toBe('swap');
    expect(s.board[0].piece).toEqual(item('earth', 1));
    expect(movePiece(s, 0, 5).type).toBe('move');
    expect(s.board[5].piece).toEqual(item('earth', 1));
  });

  it('does not merge max level items', () => {
    const s = empty();
    s.board[0].piece = item('mana', 3);
    s.board[1].piece = item('mana', 3);
    s.board[2].piece = item('mana', 3);
    expect(movePiece(s, 0, 1).type).toBe('swap');
  });

  it('uses veiled matches, frees the cell and reveals sealed neighbours', () => {
    const s = empty();
    const above = 1, target = 1 + s.cols, side = 2 + s.cols, src = 1 + 3 * s.cols;
    s.board[above] = { piece: item('earth', 3), lock: 2 };
    s.board[target] = { piece: item('fire', 2), lock: 1 };
    s.board[side] = { piece: item('fire', 2), lock: 1 };
    s.board[src].piece = item('fire', 2);
    const r = movePiece(s, src, target);
    expect(r.type).toBe('merge');
    expect(s.board[target]).toEqual({ piece: item('fire', 3), lock: 0 });
    expect(s.board[side]).toEqual({ piece: null, lock: 0 });
    expect(s.board[above].lock).toBe(1);
  });

  it('cannot move onto a veiled cell without a match', () => {
    const s = empty();
    s.board[1] = { piece: item('fire', 2), lock: 1 };
    s.board[0].piece = item('earth', 2);
    expect(movePiece(s, 0, 1).type).toBe('none');
  });
});

describe('mergeYield', () => {
  it('follows the 3-for-1, 5-for-2 rule', () => {
    expect([2, 3, 4, 5, 6, 8, 10].map((n) => mergeYield(n))).toEqual([
      { made: 0, used: 0 }, { made: 1, used: 3 }, { made: 1, used: 3 }, { made: 2, used: 5 },
      { made: 2, used: 5 }, { made: 3, used: 8 }, { made: 4, used: 10 },
    ]);
  });
});

describe('generators and energy', () => {
  it('spawns next to the generator and spends energy', () => {
    const s = empty();
    const g = 3 * s.cols + 3;
    s.board[g].piece = gen('forge');
    const r = spawnFrom(s, g, () => 0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.piece).toEqual(item('fire', 1));
      expect(nearestEmpty(s, g)).not.toBe(r.at);
    }
    expect(s.energy).toBe(MAX_ENERGY - 1);
  });

  it('refuses to spawn without energy', () => {
    const s = empty();
    s.board[0].piece = gen('geode');
    s.energy = 0;
    expect(spawnFrom(s, 0)).toEqual({ ok: false, reason: 'energy' });
  });

  it('regenerates energy over time', () => {
    const s = empty();
    s.energy = 10;
    s.energyTs = 0;
    tickEnergy(s, ENERGY_REGEN_MS * 3 + 5);
    expect(s.energy).toBe(13);
  });

  it('collects coin and mana items', () => {
    const s = empty();
    s.board[0].piece = item('coin', 2);
    s.board[1].piece = item('mana', 1);
    const coins = s.coins, energy = s.energy;
    expect(collect(s, 0)).toEqual({ resource: 'coins', amount: 6 });
    expect(collect(s, 1)).toEqual({ resource: 'energy', amount: 5 });
    expect(s.coins).toBe(coins + 6);
    expect(s.energy).toBe(energy + 5);
  });
});

describe('monsters', () => {
  it('casts a spell when all needs are on the board', () => {
    const s = empty();
    const m = s.monsters[0];
    expect(findSpell(s, m)).toBeNull();
    m.needs.forEach((n, i) => (s.board[10 + i].piece = item(n.chain, n.level)));
    const coins = s.coins;
    const r = cast(s, m.id, seeded(3));
    expect(r).not.toBeNull();
    expect(s.coins).toBe(coins + m.coins);
    expect(s.monsters.find((x) => x.id === m.id)).toBeUndefined();
    expect(s.monsters).toHaveLength(3);
    m.needs.forEach((_, i) => expect(s.board[10 + i].piece).toBeNull());
  });

  it('ignores locked items when looking for a spell', () => {
    const s = empty();
    const m = s.monsters[0];
    m.needs = [{ chain: 'water', level: 2 }];
    s.board[0] = { piece: item('water', 2), lock: 1 };
    expect(findSpell(s, m)).toBeNull();
  });
});

describe('generator upgrades', () => {
  it('costs coins, needs player level and raises the generator level', () => {
    const s = empty();
    s.board[0].piece = gen('geode');
    s.coins = 1000;
    s.level = 1;
    expect(canUpgrade(s, 0)).toMatchObject({ ok: false, reason: 'level', req: 2 });
    s.level = 2;
    expect(upgradeGen(s, 0)).toEqual({ ok: true, cost: GEN_LEVELS[0].upgradeCost });
    expect(genLevel(s.board[0].piece!)).toBe(2);
    expect(s.coins).toBe(1000 - GEN_LEVELS[0].upgradeCost!);
  });

  it('refuses without coins and at max level', () => {
    const s = empty();
    s.level = 99;
    s.board[0].piece = gen('forge');
    s.coins = 0;
    expect(canUpgrade(s, 0)).toMatchObject({ ok: false, reason: 'coins' });
    s.board[0].piece = gen('forge', GEN_LEVELS.length);
    s.coins = 1e6;
    expect(canUpgrade(s, 0)).toEqual({ ok: false, reason: 'max' });
  });

  it('higher levels can drop higher level items and conjure for free', () => {
    const s = empty();
    s.board[0].piece = gen('windmill', 5);
    const r = spawnFrom(s, 0, () => 0.999);
    expect(r.ok && r.piece).toEqual(item('wind', 4));
    const r2 = spawnFrom(s, 0, () => 0.01);
    expect(r2.ok && r2.free).toBe(true);
    expect(s.energy).toBe(MAX_ENERGY - 1);
  });

  it('treats generators from old saves as level 1', () => {
    expect(genLevel({ kind: 'gen', gen: 'geode' })).toBe(1);
  });
});
