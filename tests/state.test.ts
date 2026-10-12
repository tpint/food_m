import { describe, expect, it } from 'vitest';
import {
  canUpgrade, cast, collect, mergeYield, findSpell, gen, genLevel, item, movePiece, nearestEmpty, newGame, spawnFrom, tickEnergy,
  upgradeGen, GameState, currentTask, restore, load, save, refreshCost, refreshMonsters,
  makeMonster, validateSave, storeInBag, takeFromBag, buyBagSlot, bagSlots, bagSlotCost, BAG_START_SLOTS, BAG_MAX_SLOTS, ensureDaily, makeQuest, claimQuest, claimDailyBonus, claimableQuests, dayKey, msToNextDay, DAILY_BONUS,
} from '../src/game/state';
import { ENERGY_REGEN_MS, GEN_LEVELS, MAX_ENERGY, MONSTERS, REFRESH_BASE_COST, REFRESH_COST_GROWTH } from '../src/game/config';
import { CHAPTERS } from '../src/game/story';
import { untilReset } from '../src/online';

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

  it('a merge opens sealed neighbours, which then move freely', () => {
    const s = empty();
    const above = 1, target = 1 + s.cols, side = 2 + s.cols, src = 1 + 3 * s.cols;
    s.board[above] = { piece: item('earth', 3), lock: 2 };
    s.board[target].piece = item('fire', 2);
    s.board[side].piece = item('fire', 2);
    s.board[src].piece = item('fire', 2);
    const r = movePiece(s, src, target);
    expect(r.type).toBe('merge');
    expect(r.type === 'merge' && r.revealed).toEqual([above]);
    expect(s.board[target]).toEqual({ piece: item('fire', 3), lock: 0 });
    expect(s.board[above]).toEqual({ piece: item('earth', 3), lock: 0 });
    expect(movePiece(s, above, 3 * s.cols).type).toBe('move');
  });

  it('starts with no bubble tiles and opens any in an old save', () => {
    expect(newGame(seeded(), 0).board.every((c) => c.lock === 0 || c.lock === 2)).toBe(true);
    const old = JSON.parse(JSON.stringify(empty()));
    old.board[3].lock = 1;
    expect(validateSave(old)!.board[3].lock).toBe(0);
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
    s.board[0] = { piece: item('water', 2), lock: 2 };
    expect(findSpell(s, m)).toBeNull();
  });
});

describe('monster refresh', () => {
  it('costs coins, rerolls every monster and gets pricier each time', () => {
    const s = empty();
    s.coins = 1000;
    const before = s.monsters.map((m) => ({ ...m }));
    const next = s.nextMonsterId;
    const r = refreshMonsters(s, seeded(7));
    expect(r).toEqual({ ok: true, cost: REFRESH_BASE_COST, old: before });
    expect(s.coins).toBe(1000 - REFRESH_BASE_COST);
    expect(s.monsters).toHaveLength(3);
    expect(s.monsters.map((m) => m.id)).toEqual(before.map((m) => m.id));
    expect(s.monsters).not.toEqual(before);
    expect(s.nextMonsterId).toBe(next);
    expect(refreshCost(s)).toBe(REFRESH_BASE_COST * REFRESH_COST_GROWTH);
    refreshMonsters(s, seeded(8));
    expect(refreshCost(s)).toBe(REFRESH_BASE_COST * REFRESH_COST_GROWTH ** 2);
  });

  it('keeps a boss a boss', () => {
    const s = empty();
    s.coins = 1000;
    s.monsters[1].boss = true;
    refreshMonsters(s, seeded(2));
    expect(s.monsters.map((m) => m.boss)).toEqual([false, true, false]);
  });

  it('refuses without enough coins', () => {
    const s = empty();
    s.coins = REFRESH_BASE_COST - 1;
    const before = s.monsters;
    expect(refreshMonsters(s)).toEqual({ ok: false, reason: 'coins', cost: REFRESH_BASE_COST });
    expect(s.monsters).toBe(before);
    expect(s.coins).toBe(REFRESH_BASE_COST - 1);
  });

  it('resets the cost when a monster is defeated', () => {
    const s = empty();
    s.coins = 1000;
    refreshMonsters(s, seeded(4));
    refreshMonsters(s, seeded(5));
    expect(refreshCost(s)).toBeGreaterThan(REFRESH_BASE_COST);
    const m = s.monsters[0];
    m.needs.forEach((n, i) => (s.board[10 + i].piece = item(n.chain, n.level)));
    cast(s, m.id, seeded(3));
    expect(refreshCost(s)).toBe(REFRESH_BASE_COST);
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

  it('has ten levels, each costing more and needing a higher player level', () => {
    expect(GEN_LEVELS).toHaveLength(10);
    const ups = GEN_LEVELS.slice(0, -1);
    for (let i = 1; i < ups.length; i++) {
      expect(ups[i].upgradeCost!).toBeGreaterThan(ups[i - 1].upgradeCost!);
      expect(ups[i].upgradeReq!).toBeGreaterThan(ups[i - 1].upgradeReq!);
      expect(GEN_LEVELS[i].freeChance).toBeGreaterThan(GEN_LEVELS[i - 1].freeChance);
    }
    expect(GEN_LEVELS[9].upgradeCost).toBeUndefined();
  });

  it('upgrades from level 5 to 6 and level 10 can drop level 5 items', () => {
    const s = empty();
    s.board[0].piece = gen('well', 5);
    s.coins = 1e6;
    s.level = GEN_LEVELS[4].upgradeReq! - 1;
    expect(canUpgrade(s, 0)).toMatchObject({ ok: false, reason: 'level' });
    s.level++;
    expect(upgradeGen(s, 0)).toMatchObject({ ok: true });
    expect(genLevel(s.board[0].piece!)).toBe(6);
    s.board[0].piece = gen('well', 10);
    const r = spawnFrom(s, 0, () => 0.999);
    expect(r.ok && r.piece).toEqual(item('water', 5));
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

describe('tower restoration', () => {
  it('monsters drop stars', () => {
    const s = empty();
    const m = s.monsters[0];
    m.needs.forEach((n, i) => (s.board[10 + i].piece = item(n.chain, n.level)));
    cast(s, m.id, seeded(5));
    expect(s.stars).toBe(m.stars);
    expect(m.stars).toBeGreaterThan(0);
  });

  it('spends stars on tasks in order and refuses without enough', () => {
    const s = empty();
    const first = CHAPTERS[0].tasks[0];
    expect(currentTask(s)).toEqual(first);
    expect(restore(s)).toEqual({ ok: false, reason: 'stars', cost: first.cost });
    s.stars = 5;
    const r = restore(s);
    expect(r.ok && r.task.id).toBe(first.id);
    expect(s.stars).toBe(5 - first.cost);
    expect(currentTask(s)).toEqual(CHAPTERS[0].tasks[1]);
  });

  it('completing the chapter pays out and unseals the board', () => {
    const s = empty();
    s.board[0].lock = 2;
    s.board[1].lock = 2;
    s.stars = 999;
    const coins = s.coins, gems = s.gems;
    let last;
    for (let i = 0; i < CHAPTERS[0].tasks.length; i++) last = restore(s);
    expect(last!.ok && last!.chapterDone?.id).toBe('library');
    expect(last!.ok && last!.unsealed).toEqual([0, 1]);
    expect(s.board[0].lock).toBe(0);
    expect(s.coins).toBe(coins + CHAPTERS[0].reward.coins);
    expect(s.gems).toBe(gems + CHAPTERS[0].reward.gems);
    expect(s.chapter).toBe(1);
    expect(currentTask(s)).toEqual(CHAPTERS[1].tasks[0]);
  });

  it('chapter 3 places items, chapter 4 adds a star bonus', () => {
    const s = empty();
    s.stars = 9999;
    const upTo = (n: number) => CHAPTERS.slice(0, n).reduce((t, c) => t + c.tasks.length, 0);
    let last;
    for (let i = 0; i < upTo(3); i++) last = restore(s);
    expect(last!.ok && last!.chapterDone?.id).toBe('observatory');
    expect(last!.ok && last!.placed.length).toBe(2);
    expect(s.board.filter((c) => c.piece?.kind === 'item' && c.piece.chain === 'mana' && c.piece.level === 3)).toHaveLength(2);
    for (let i = upTo(3); i < upTo(4); i++) last = restore(s);
    expect(last!.ok && last!.chapterDone?.id).toBe('greenhouse');
    expect(s.starBonus).toBe(1);
    // Monsters now drop one extra star.
    const m = s.monsters[0];
    m.needs.forEach((n, i) => (s.board[10 + i].piece = item(n.chain, n.level)));
    const before = s.stars;
    cast(s, m.id, seeded(9));
    expect(s.stars).toBe(before + m.stars + 1);
  });

  it('has nothing left to restore after the last chapter', () => {
    const s = empty();
    s.chapter = CHAPTERS.length;
    expect(currentTask(s)).toBeNull();
    expect(restore(s)).toEqual({ ok: false, reason: 'none' });
  });

  it('chapter 2 gives every grimoire a level', () => {
    const s = empty();
    s.board[0].piece = gen('forge', 2);
    s.board[1].piece = gen('well', GEN_LEVELS.length);
    s.stars = 999;
    const all = CHAPTERS[0].tasks.length + CHAPTERS[1].tasks.length;
    let last;
    for (let i = 0; i < all; i++) last = restore(s);
    expect(last!.ok && last!.chapterDone?.id).toBe('lab');
    expect(last!.ok && last!.upgraded).toEqual([0]);
    expect(genLevel(s.board[0].piece!)).toBe(3);
    expect(genLevel(s.board[1].piece!)).toBe(GEN_LEVELS.length);
    expect(s.chapter).toBe(2);
  });

  it('loads older saves without tower fields', () => {
    const s = empty() as Partial<GameState>;
    delete s.stars; delete s.chapter; delete s.tasksDone; delete s.storySeen;
    const store: Record<string, string> = {};
    save(s as GameState, { setItem: (k, v) => { store[k] = v; } });
    const loaded = load({ getItem: (k) => store[k] ?? null })!;
    expect(loaded.stars).toBe(0);
    expect(loaded.chapter).toBe(0);
    expect(loaded.tasksDone).toEqual([]);
  });
});

describe('leaderboard reset countdown', () => {
  it('counts down to Monday 00:00 UTC', () => {
    expect(untilReset(new Date('2026-10-11T22:30:00Z'))).toBe('1h 30m'); // Sunday night
    expect(untilReset(new Date('2026-10-12T00:00:00Z'))).toBe('7d 0h'); // just reset
    expect(untilReset(new Date('2026-10-14T12:00:00Z'))).toBe('4d 12h'); // Wednesday noon
  });
});

describe('daily quests', () => {
  const noon = new Date(2026, 9, 12, 12).getTime();

  it('gives three different quests a day and new ones the next day', () => {
    const s = empty();
    expect(ensureDaily(s, noon, seeded(3))).toBe(true);
    expect(s.daily!.day).toBe('2026-10-12');
    expect(s.daily!.quests).toHaveLength(3);
    expect(new Set(s.daily!.quests.map((q) => q.kind)).size).toBe(3);
    expect(ensureDaily(s, noon + 3600_000)).toBe(false);
    expect(ensureDaily(s, noon + 86400_000)).toBe(true);
    expect(s.daily!.day).toBe('2026-10-13');
    expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05');
    expect(msToNextDay(noon)).toBe(12 * 3600_000);
  });

  it('counts merges, conjures and defeats', () => {
    const s = empty();
    s.daily = { day: dayKey(noon), bonusClaimed: false, quests: [makeQuest(s, 'merge'), makeQuest(s, 'conjure')] };
    s.board[0].piece = item('water', 1);
    s.board[1].piece = item('water', 1);
    s.board[20].piece = item('water', 1);
    movePiece(s, 20, 2);
    s.board[30].piece = gen('well');
    spawnFrom(s, 30, seeded());
    s.board[40].piece = item('coin', 2);
    collect(s, 40);
    expect(s.daily.quests.map((q) => q.progress)).toEqual([1, 1]);

    s.daily.quests = [makeQuest(s, 'defeat')];
    const m = s.monsters[0];
    m.needs.forEach((n, k) => { s.board[k].piece = item(n.chain, n.level); });
    cast(s, m.id, seeded());
    expect(s.daily.quests[0].progress).toBe(1);
  });

  it('never offers the removed collect-coins quest, and replaces one in an old save', () => {
    for (let seed = 1; seed < 30; seed++) {
      const s = empty();
      ensureDaily(s, noon, seeded(seed));
      expect(s.daily!.quests.map((q) => q.kind)).not.toContain('coins');
    }
    const s = empty();
    s.daily = JSON.parse(JSON.stringify({ day: dayKey(noon), bonusClaimed: false, quests: [
      makeQuest(s, 'merge'), makeQuest(s, 'defeat'), { kind: 'coins', target: 25, progress: 25, claimed: true, coins: 25, gems: 2 },
    ] }));
    expect(ensureDaily(s, noon)).toBe(false);
    const q = s.daily!.quests[2];
    expect(['conjure', 'mergeHigh']).toContain(q.kind);
    expect(q.claimed && q.progress === q.target).toBe(true);
  });

  it('only counts merges that reach the level a mergeHigh quest asks for', () => {
    const s = empty();
    const q = makeQuest(s, 'mergeHigh');
    s.daily = { day: dayKey(noon), bonusClaimed: false, quests: [q] };
    const merge3 = (level: number) => {
      s.board[0].piece = item('fire', level);
      s.board[1].piece = item('fire', level);
      s.board[20].piece = item('fire', level);
      movePiece(s, 20, 2);
      s.board[2].piece = null;
    };
    merge3(q.level! - 2);
    expect(q.progress).toBe(0);
    merge3(q.level! - 1);
    expect(q.progress).toBe(1);
  });

  it('pays out each finished quest once, then the bonus chest when all are claimed', () => {
    const s = empty();
    ensureDaily(s, noon, seeded());
    const [a, b, c] = s.daily!.quests;
    expect(claimQuest(s, 0)).toBeNull();
    a.progress = a.target;
    expect(claimableQuests(s)).toBe(1);
    const coins = s.coins, gems = s.gems;
    expect(claimQuest(s, 0)).toBe(a);
    expect(s.coins).toBe(coins + a.coins);
    expect(s.gems).toBe(gems + a.gems);
    expect(claimQuest(s, 0)).toBeNull();
    expect(claimDailyBonus(s)).toBeNull();
    b.progress = b.target; c.progress = c.target;
    claimQuest(s, 1); claimQuest(s, 2);
    expect(claimableQuests(s)).toBe(1);
    const g = s.gems, e = s.energy;
    expect(claimDailyBonus(s)).toEqual(DAILY_BONUS);
    expect(s.gems).toBe(g + DAILY_BONUS.gems);
    expect(s.energy).toBe(e + DAILY_BONUS.energy);
    expect(claimDailyBonus(s)).toBeNull();
    expect(claimableQuests(s)).toBe(0);
  });
});

describe('monster roster', () => {
  const kindsAt = (level: number) => {
    const s = empty();
    s.level = level;
    s.monsters = [];
    s.nextMonsterId = 1;
    const rng = seeded(7);
    const seen = new Set<string>();
    for (let k = 0; k < 400; k++) {
      if (s.nextMonsterId % 6 === 0) s.nextMonsterId++; // skip bosses
      seen.add(makeMonster(s, rng).kind);
    }
    return seen;
  };

  it('unlocks the new monsters as the player levels up', () => {
    expect([...kindsAt(1)].sort()).toEqual(['bat', 'mushroom', 'slime']);
    expect(kindsAt(2).has('spider')).toBe(true);
    expect(kindsAt(7).has('treant')).toBe(false);
    expect(kindsAt(10)).toEqual(new Set(MONSTERS.map((m) => m.kind)));
  });
});

describe('inventory bag', () => {
  it('stores items and generators, and refuses locked or empty cells', () => {
    const s = empty();
    s.board[3].piece = item('fire', 4);
    s.board[4].piece = gen('well', 3);
    expect(storeInBag(s, 3)).toEqual({ ok: true, piece: item('fire', 4) });
    expect(storeInBag(s, 4).ok).toBe(true);
    expect(s.board[3].piece).toBeNull();
    expect(s.bag).toEqual([item('fire', 4), gen('well', 3)]);
    expect(storeInBag(s, 3)).toEqual({ ok: false, reason: 'invalid' });
    s.board[5] = { piece: item('earth', 1), lock: 2 };
    expect(storeInBag(s, 5)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('is full at its slot count', () => {
    const s = empty();
    for (let i = 0; i < BAG_START_SLOTS + 1; i++) s.board[i].piece = item('water', 1);
    for (let i = 0; i < BAG_START_SLOTS; i++) expect(storeInBag(s, i).ok).toBe(true);
    expect(storeInBag(s, BAG_START_SLOTS)).toEqual({ ok: false, reason: 'full' });
  });

  it('puts items back on the nearest free cell, or says the board is full', () => {
    const s = empty();
    s.bag = [item('wind', 2), item('earth', 5)];
    const r = takeFromBag(s, 1, 10);
    expect(r).toEqual({ ok: true, at: 10, piece: item('earth', 5) });
    expect(s.bag).toEqual([item('wind', 2)]);
    s.board.forEach((c) => { c.piece = item('fire', 1); });
    expect(takeFromBag(s, 0)).toEqual({ ok: false, reason: 'full' });
    expect(s.bag).toHaveLength(1);
  });

  it('sells extra slots for gems, pricier each time, up to the maximum', () => {
    const s = empty();
    s.gems = 1000;
    expect(bagSlotCost(s)).toBe(10);
    expect(buyBagSlot(s)).toEqual({ ok: true, cost: 10 });
    expect(bagSlots(s)).toBe(BAG_START_SLOTS + 1);
    expect(bagSlotCost(s)).toBe(15);
    while (bagSlots(s) < BAG_MAX_SLOTS) buyBagSlot(s);
    expect(buyBagSlot(s)).toEqual({ ok: false, reason: 'max' });
    s.bagSlots = BAG_START_SLOTS; s.gems = 0;
    expect(buyBagSlot(s)).toEqual({ ok: false, reason: 'gems', cost: 10 });
  });
});
