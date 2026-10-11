import { describe, expect, it } from 'vitest';
import {
  cast, collect, findSpell, gen, item, movePiece, nearestEmpty, newGame, spawnFrom, tickEnergy, GameState,
} from '../src/game/state';
import { ENERGY_REGEN_MS, MAX_ENERGY } from '../src/game/config';

function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function empty(): GameState {
  const s = newGame(seeded(), 0);
  s.board.forEach((c) => { c.piece = null; c.lock = 0; });
  return s;
}

describe('board moves', () => {
  it('merges two identical items into the next level', () => {
    const s = empty();
    s.board[0].piece = item('crystal', 1);
    s.board[1].piece = item('crystal', 1);
    const r = movePiece(s, 0, 1);
    expect(r.type).toBe('merge');
    expect(s.board[0].piece).toBeNull();
    expect(s.board[1].piece).toEqual(item('crystal', 2));
  });

  it('swaps different items and moves into empty cells', () => {
    const s = empty();
    s.board[0].piece = item('crystal', 1);
    s.board[1].piece = item('herb', 1);
    expect(movePiece(s, 0, 1).type).toBe('swap');
    expect(s.board[0].piece).toEqual(item('herb', 1));
    expect(movePiece(s, 0, 5).type).toBe('move');
    expect(s.board[5].piece).toEqual(item('herb', 1));
  });

  it('does not merge max level items', () => {
    const s = empty();
    s.board[0].piece = item('mana', 3);
    s.board[1].piece = item('mana', 3);
    expect(movePiece(s, 0, 1).type).toBe('swap');
  });

  it('frees a veiled item by merging onto it and reveals sealed neighbours', () => {
    const s = empty();
    const above = 1, target = 1 + s.cols, src = 1 + 2 * s.cols;
    s.board[above] = { piece: item('herb', 3), lock: 2 };
    s.board[target] = { piece: item('flame', 2), lock: 1 };
    s.board[src].piece = item('flame', 2);
    const r = movePiece(s, src, target);
    expect(r.type).toBe('merge');
    expect(s.board[target]).toEqual({ piece: item('flame', 3), lock: 0 });
    expect(s.board[above].lock).toBe(1);
  });

  it('cannot move onto a veiled cell without a match', () => {
    const s = empty();
    s.board[1] = { piece: item('flame', 2), lock: 1 };
    s.board[0].piece = item('herb', 2);
    expect(movePiece(s, 0, 1).type).toBe('none');
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
      expect(r.piece).toEqual(item('flame', 1));
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
    m.needs = [{ chain: 'crystal', level: 2 }];
    s.board[0] = { piece: item('crystal', 2), lock: 1 };
    expect(findSpell(s, m)).toBeNull();
  });
});
