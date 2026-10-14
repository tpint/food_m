import { describe, expect, it } from 'vitest';
import {
  canUpgrade, serve, collect, mergeYield, findOrder, gen, genLevel, item, movePiece, nearestEmpty, newGame, spawnFrom, tickEnergy,
  upgradeGen, GameState, currentTask, restore, load, save,
  makeCustomer, validateSave, storeInFridge, takeFromFridge, buyFridgeSlot, fridgeSlots, fridgeSlotCost, FRIDGE_START_SLOTS, FRIDGE_MAX_SLOTS, ensureDaily, makeQuest, claimQuest, claimDailyBonus, claimableQuests, dayKey, msToNextDay, DAILY_BONUS,
  grantPiece, takeFromRewardBag, tutorialStep, advanceTutorial, skipTutorial, TUTORIAL_STEPS, discover, isDiscovered,
} from '../src/game/state';
import { ACTIVE_CUSTOMERS, ENERGY_REGEN_MS, GEN_LEVELS, MAX_ENERGY, CUSTOMERS } from '../src/game/config';
import { CHAPTERS } from '../src/game/story';
import { untilReset } from '../src/online';

function seeded(seed = 1) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function empty(): GameState {
  const s = newGame(seeded(), 0);
  s.board.forEach((c) => { c.piece = null; });
  return s;
}

describe('board moves', () => {
  it('needs three matching items to merge', () => {
    const s = empty();
    s.board[0].piece = item('drinks', 1);
    s.board[1].piece = item('drinks', 1);
    expect(movePiece(s, 0, 1).type).toBe('need3');
    expect(s.board[0].piece).toEqual(item('drinks', 1));
    expect(s.board[1].piece).toEqual(item('drinks', 1));
  });

  it('merges three touching items into one of the next level on the drop cell', () => {
    const s = empty();
    s.board[0].piece = item('drinks', 1);
    s.board[1].piece = item('drinks', 1);
    s.board[2].piece = item('drinks', 1);
    s.board[20].piece = item('drinks', 1);
    const r = movePiece(s, 20, 1);
    expect(r.type).toBe('merge');
    expect(s.board[1].piece).toEqual(item('drinks', 2));
    // Four crystals were involved: three are used, one is left over.
    expect(s.board[20].piece).toBeNull();
    expect([0, 2].filter((i) => s.board[i].piece).length).toBe(1);
    if (r.type === 'merge') expect(r.results).toEqual([1]);
  });

  it('turns five touching items into two', () => {
    const s = empty();
    for (const i of [0, 1, 2, 3]) s.board[i].piece = item('bakery', 2);
    s.board[30].piece = item('bakery', 2);
    const r = movePiece(s, 30, 0);
    expect(r.type === 'merge' && r.results.length).toBe(2);
    expect(s.board.filter((c) => c.piece?.kind === 'item' && c.piece.level === 3)).toHaveLength(2);
    expect(s.board.filter((c) => c.piece?.kind === 'item' && c.piece.level === 2)).toHaveLength(0);
    expect(s.board[0].piece).toEqual(item('bakery', 3));
  });

  it('merges when an item is moved next to two matches', () => {
    const s = empty();
    s.board[0].piece = item('grill', 1);
    s.board[1].piece = item('grill', 1);
    s.board[30].piece = item('grill', 1);
    const r = movePiece(s, 30, 2);
    expect(r.type).toBe('merge');
    expect(s.board[2].piece).toEqual(item('grill', 2));
    expect(s.board[0].piece).toBeNull();
  });

  it('swaps different items and moves into empty cells', () => {
    const s = empty();
    s.board[0].piece = item('drinks', 1);
    s.board[1].piece = item('bakery', 1);
    expect(movePiece(s, 0, 1).type).toBe('swap');
    expect(s.board[0].piece).toEqual(item('bakery', 1));
    expect(movePiece(s, 0, 5).type).toBe('move');
    expect(s.board[5].piece).toEqual(item('bakery', 1));
  });

  it('does not merge max level items', () => {
    const s = empty();
    s.board[0].piece = item('energy', 3);
    s.board[1].piece = item('energy', 3);
    s.board[2].piece = item('energy', 3);
    expect(movePiece(s, 0, 1).type).toBe('swap');
  });

});

describe('saves', () => {
  it('accepts its own saves and rejects anything else', () => {
    const g = newGame(seeded(3), 0);
    expect(validateSave(JSON.parse(JSON.stringify(g)))).toEqual(g);
    expect(validateSave({ ...g, v: 2 })).toBeNull();
    expect(validateSave({ ...g, customers: undefined })).toBeNull();
    expect(validateSave({ ...g, board: g.board.slice(1) })).toBeNull();
    expect(validateSave(null)).toBeNull();
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

describe('kitchen stations and energy', () => {
  it('spawns next to the generator and spends energy', () => {
    const s = empty();
    const g = 3 * s.cols + 3;
    s.board[g].piece = gen('bbq');
    const r = spawnFrom(s, g, () => 0);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.piece).toEqual(item('grill', 1));
      expect(nearestEmpty(s, g)).not.toBe(r.at);
    }
    expect(s.energy).toBe(MAX_ENERGY - 1);
  });

  it('refuses to spawn without energy', () => {
    const s = empty();
    s.board[0].piece = gen('oven');
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

  it('collects coin and energy items', () => {
    const s = empty();
    s.board[0].piece = item('coin', 2);
    s.board[1].piece = item('energy', 1);
    const coins = s.coins, energy = s.energy;
    expect(collect(s, 0)).toEqual({ resource: 'coins', amount: 6 });
    expect(collect(s, 1)).toEqual({ resource: 'energy', amount: 5 });
    expect(s.coins).toBe(coins + 6);
    expect(s.energy).toBe(energy + 5);
  });
});

describe('customers', () => {
  it('serves a customer when their whole order is on the board', () => {
    const s = empty();
    const m = s.customers[0];
    expect(findOrder(s, m)).toBeNull();
    m.order.forEach((n, i) => (s.board[10 + i].piece = item(n.chain, n.level)));
    const coins = s.coins;
    const r = serve(s, m.id, seeded(3));
    expect(r).not.toBeNull();
    expect(s.coins).toBe(coins + m.coins);
    expect(s.customers.find((x) => x.id === m.id)).toBeUndefined();
    expect(s.customers).toHaveLength(ACTIVE_CUSTOMERS);
    m.order.forEach((_, i) => expect(s.board[10 + i].piece).toBeNull());
  });

  it('tops up older saves to the full row of customers', () => {
    const s = empty();
    s.customers = s.customers.slice(0, 3);
    const v = validateSave(JSON.parse(JSON.stringify(s)))!;
    expect(v.customers).toHaveLength(ACTIVE_CUSTOMERS);
    expect(v.customers.slice(0, 3)).toEqual(s.customers);
    expect(new Set(v.customers.map((m) => m.id)).size).toBe(ACTIVE_CUSTOMERS);
  });

});

describe('station upgrades', () => {
  it('costs coins, needs player level and raises the generator level', () => {
    const s = empty();
    s.board[0].piece = gen('oven');
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
    s.board[0].piece = gen('bbq');
    s.coins = 0;
    expect(canUpgrade(s, 0)).toMatchObject({ ok: false, reason: 'coins' });
    s.board[0].piece = gen('bbq', GEN_LEVELS.length);
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
    s.board[0].piece = gen('fountain', 5);
    s.coins = 1e6;
    s.level = GEN_LEVELS[4].upgradeReq! - 1;
    expect(canUpgrade(s, 0)).toMatchObject({ ok: false, reason: 'level' });
    s.level++;
    expect(upgradeGen(s, 0)).toMatchObject({ ok: true });
    expect(genLevel(s.board[0].piece!)).toBe(6);
    s.board[0].piece = gen('fountain', 10);
    const r = spawnFrom(s, 0, () => 0.999);
    expect(r.ok && r.piece).toEqual(item('drinks', 5));
  });

  it('higher levels can drop higher level items and cook for free', () => {
    const s = empty();
    s.board[0].piece = gen('mixer', 5);
    const r = spawnFrom(s, 0, () => 0.999);
    expect(r.ok && r.piece).toEqual(item('dessert', 4));
    const r2 = spawnFrom(s, 0, () => 0.01);
    expect(r2.ok && r2.free).toBe(true);
    expect(s.energy).toBe(MAX_ENERGY - 1);
  });

  it('treats generators from old saves as level 1', () => {
    expect(genLevel({ kind: 'gen', gen: 'oven' })).toBe(1);
  });
});

describe('restaurant restoration', () => {
  it('customers drop stars', () => {
    const s = empty();
    const m = s.customers[0];
    m.order.forEach((n, i) => (s.board[10 + i].piece = item(n.chain, n.level)));
    serve(s, m.id, seeded(5));
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

  it('completing the chapter pays out and places its reward items', () => {
    const s = empty();
    s.stars = 999;
    const coins = s.coins, gems = s.gems;
    let last;
    for (let i = 0; i < CHAPTERS[0].tasks.length; i++) last = restore(s);
    expect(last!.ok && last!.chapterDone?.id).toBe('dining');
    const placed = last!.ok ? last!.placed : [];
    expect(placed.map((i) => s.board[i].piece)).toEqual([item('coin', 3), item('energy', 2)]);
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
    expect(last!.ok && last!.chapterDone?.id).toBe('patio');
    expect(last!.ok && last!.placed.length).toBe(2);
    expect(s.board.filter((c) => c.piece?.kind === 'item' && c.piece.chain === 'energy' && c.piece.level === 3)).toHaveLength(2);
    for (let i = upTo(3); i < upTo(4); i++) last = restore(s);
    expect(last!.ok && last!.chapterDone?.id).toBe('parlor');
    expect(s.starBonus).toBe(1);
    // Customers now drop one extra star.
    const m = s.customers[0];
    m.order.forEach((n, i) => (s.board[10 + i].piece = item(n.chain, n.level)));
    const before = s.stars;
    serve(s, m.id, seeded(9));
    expect(s.stars).toBe(before + m.stars + 1);
  });

  it('has nothing left to restore after the last chapter', () => {
    const s = empty();
    s.chapter = CHAPTERS.length;
    expect(currentTask(s)).toBeNull();
    expect(restore(s)).toEqual({ ok: false, reason: 'none' });
  });

  it('chapter 2 gives every kitchen station a level', () => {
    const s = empty();
    s.board[0].piece = gen('bbq', 2);
    s.board[1].piece = gen('fountain', GEN_LEVELS.length);
    s.stars = 999;
    const all = CHAPTERS[0].tasks.length + CHAPTERS[1].tasks.length;
    let last;
    for (let i = 0; i < all; i++) last = restore(s);
    expect(last!.ok && last!.chapterDone?.id).toBe('kitchen');
    expect(last!.ok && last!.upgraded).toEqual([0]);
    expect(genLevel(s.board[0].piece!)).toBe(3);
    expect(genLevel(s.board[1].piece!)).toBe(GEN_LEVELS.length);
    expect(s.chapter).toBe(2);
  });

  it('loads saves without restaurant fields', () => {
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

  it('counts merges, cooking and customers served', () => {
    const s = empty();
    s.daily = { day: dayKey(noon), bonusClaimed: false, quests: [makeQuest(s, 'merge'), makeQuest(s, 'cook')] };
    s.board[0].piece = item('drinks', 1);
    s.board[1].piece = item('drinks', 1);
    s.board[20].piece = item('drinks', 1);
    movePiece(s, 20, 2);
    s.board[30].piece = gen('fountain');
    spawnFrom(s, 30, seeded());
    s.board[40].piece = item('coin', 2);
    collect(s, 40);
    expect(s.daily.quests.map((q) => q.progress)).toEqual([1, 1]);

    s.daily.quests = [makeQuest(s, 'serve')];
    const m = s.customers[0];
    m.order.forEach((n, k) => { s.board[k].piece = item(n.chain, n.level); });
    serve(s, m.id, seeded());
    expect(s.daily.quests[0].progress).toBe(1);
  });

  it('only counts merges that reach the level a mergeHigh quest asks for', () => {
    const s = empty();
    const q = makeQuest(s, 'mergeHigh');
    s.daily = { day: dayKey(noon), bonusClaimed: false, quests: [q] };
    const merge3 = (level: number) => {
      s.board[0].piece = item('grill', level);
      s.board[1].piece = item('grill', level);
      s.board[20].piece = item('grill', level);
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

describe('customer roster', () => {
  const kindsAt = (level: number) => {
    const s = empty();
    s.level = level;
    s.customers = [];
    s.nextCustomerId = 1;
    const rng = seeded(7);
    const seen = new Set<string>();
    for (let k = 0; k < 400; k++) {
      if (s.nextCustomerId % 6 === 0) s.nextCustomerId++; // skip critics
      seen.add(makeCustomer(s, rng).kind);
    }
    return seen;
  };

  it('unlocks the new customers as the player levels up', () => {
    expect([...kindsAt(1)].sort()).toEqual(['bear', 'bunny', 'cat', 'fox', 'penguin']);
    expect(kindsAt(3).has('pig')).toBe(false);
    expect(kindsAt(4).has('pig')).toBe(true);
    expect(kindsAt(7).has('raccoon')).toBe(false);
    expect(kindsAt(10)).toEqual(new Set(CUSTOMERS.map((m) => m.kind)));
  });
});

describe('inventory fridge', () => {
  it('stores items and generators, and refuses empty cells', () => {
    const s = empty();
    s.board[3].piece = item('grill', 4);
    s.board[4].piece = gen('fountain', 3);
    expect(storeInFridge(s, 3)).toEqual({ ok: true, piece: item('grill', 4) });
    expect(storeInFridge(s, 4).ok).toBe(true);
    expect(s.board[3].piece).toBeNull();
    expect(s.fridge).toEqual([item('grill', 4), gen('fountain', 3)]);
    expect(storeInFridge(s, 3)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('is full at its slot count', () => {
    const s = empty();
    for (let i = 0; i < FRIDGE_START_SLOTS + 1; i++) s.board[i].piece = item('drinks', 1);
    for (let i = 0; i < FRIDGE_START_SLOTS; i++) expect(storeInFridge(s, i).ok).toBe(true);
    expect(storeInFridge(s, FRIDGE_START_SLOTS)).toEqual({ ok: false, reason: 'full' });
  });

  it('puts items back on the nearest free cell, or says the board is full', () => {
    const s = empty();
    s.fridge = [item('dessert', 2), item('bakery', 5)];
    const r = takeFromFridge(s, 1, 10);
    expect(r).toEqual({ ok: true, at: 10, piece: item('bakery', 5) });
    expect(s.fridge).toEqual([item('dessert', 2)]);
    s.board.forEach((c) => { c.piece = item('grill', 1); });
    expect(takeFromFridge(s, 0)).toEqual({ ok: false, reason: 'full' });
    expect(s.fridge).toHaveLength(1);
  });

  it('sells extra slots for gems, pricier each time, up to the maximum', () => {
    const s = empty();
    s.gems = 1000;
    expect(fridgeSlotCost(s)).toBe(10);
    expect(buyFridgeSlot(s)).toEqual({ ok: true, cost: 10 });
    expect(fridgeSlots(s)).toBe(FRIDGE_START_SLOTS + 1);
    expect(fridgeSlotCost(s)).toBe(15);
    while (fridgeSlots(s) < FRIDGE_MAX_SLOTS) buyFridgeSlot(s);
    expect(buyFridgeSlot(s)).toEqual({ ok: false, reason: 'max' });
    s.fridgeSlots = FRIDGE_START_SLOTS; s.gems = 0;
    expect(buyFridgeSlot(s)).toEqual({ ok: false, reason: 'gems', cost: 10 });
  });
});

describe('reward bag', () => {
  it('puts rewards on the board, and only into the bag when the board is full', () => {
    const s = empty();
    expect(grantPiece(s, item('coin', 2))).toBeGreaterThanOrEqual(0);
    expect(s.rewardBag ?? []).toEqual([]);
    s.board.forEach((c) => { c.piece = item('grill', 1); });
    expect(grantPiece(s, item('coin', 3))).toBe(-1);
    expect(grantPiece(s, item('energy', 2))).toBe(-1);
    expect(s.rewardBag).toEqual([item('coin', 3), item('energy', 2)]);
  });

  it('hands rewards back first in, first out', () => {
    const s = empty();
    s.rewardBag = [item('coin', 3), item('energy', 2)];
    expect(takeFromRewardBag(s, 10)).toEqual({ ok: true, at: 10, piece: item('coin', 3) });
    expect(s.rewardBag).toEqual([item('energy', 2)]);
    s.board.forEach((c) => { c.piece = item('grill', 1); });
    expect(takeFromRewardBag(s)).toEqual({ ok: false, reason: 'full' });
    expect(s.rewardBag).toHaveLength(1);
    s.rewardBag = [];
    expect(takeFromRewardBag(s)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('bags chapter reward items that do not fit on a full board', () => {
    const s = empty();
    s.board.forEach((c) => { c.piece = item('grill', 1); });
    s.stars = 999;
    let last;
    for (let i = 0; i < CHAPTERS[0].tasks.length; i++) last = restore(s);
    expect(last!.ok && last!.placed).toEqual([]);
    expect(s.rewardBag).toEqual([item('coin', 3), item('energy', 2)]);
  });
});

describe('first-time tutorial', () => {
  it('walks a new game through a merge of 3, then a merge of 5', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = newGame(seeded(seed), 0);
      expect(s.tutorial).toBe(1);
      const a = tutorialStep(s)!;
      expect(a.count).toBe(3);
      const r1 = movePiece(s, a.from, a.to);
      expect(r1.type).toBe('merge');
      if (r1.type === 'merge') expect(r1.results).toHaveLength(1);

      const b = advanceTutorial(s)!;
      expect(b.count).toBe(5);
      for (const i of b.setup) expect(s.board[i].piece).toEqual(b.piece);
      // Resuming the step (e.g. after a reload) doesn't add more items.
      expect(tutorialStep(s)).toEqual(b);
      const r2 = movePiece(s, b.from, b.to);
      expect(r2.type).toBe('merge');
      if (r2.type === 'merge') expect(r2.results).toHaveLength(2);

      expect(advanceTutorial(s)).toBeNull();
      expect(s.tutorial).toBeUndefined();
    }
    expect(TUTORIAL_STEPS).toBe(2);
  });

  it('is not shown to existing players or once skipped', () => {
    const old = newGame(seeded(2), 0);
    delete old.tutorial;
    expect(tutorialStep(validateSave(JSON.parse(JSON.stringify(old)))!)).toBeNull();
    const s = newGame(seeded(2), 0);
    skipTutorial(s);
    expect(tutorialStep(s)).toBeNull();
  });

  it('ends quietly when the board no longer fits the step', () => {
    const s = newGame(seeded(4), 0);
    const a = tutorialStep(s)!;
    s.board[a.to].piece = item('coin', 1);
    expect(tutorialStep(s)).toBeNull();
    expect(s.tutorial).toBeUndefined();
  });
});

describe('discovery', () => {
  it('knows the starting pieces of a new game but not higher levels', () => {
    const s = newGame(seeded(), 0);
    expect(isDiscovered(s, item('drinks', 1))).toBe(true);
    expect(isDiscovered(s, gen('oven', 1))).toBe(true);
    expect(isDiscovered(s, gen('oven', 2))).toBe(false);
    expect(isDiscovered(s, item('drinks', 7))).toBe(false);
  });

  it('records merged items and fridge items, and keeps them after they are gone', () => {
    const s = empty();
    s.discovered = [];
    s.board[0].piece = item('drinks', 1);
    s.board[1].piece = item('drinks', 1);
    s.board[2].piece = item('drinks', 1);
    movePiece(s, 2, 1);
    expect(discover(s)).toBe(true);
    expect(isDiscovered(s, item('drinks', 2))).toBe(true);
    s.fridge = [item('bakery', 3)];
    discover(s);
    expect(isDiscovered(s, item('bakery', 3))).toBe(true);
    s.board.forEach((c) => { c.piece = null; });
    s.fridge = [];
    expect(discover(s)).toBe(false);
    expect(isDiscovered(s, item('drinks', 2))).toBe(true);
  });

  it('counts every level up to a station\'s current one', () => {
    const s = empty();
    s.discovered = [];
    s.board[0].piece = gen('mixer', 3);
    discover(s);
    expect([1, 2, 3].map((lv) => isDiscovered(s, gen('mixer', lv)))).toEqual([true, true, true]);
    expect(isDiscovered(s, gen('mixer', 4))).toBe(false);
  });

  it('fills in discoveries for older saves from what they hold', () => {
    const s = empty();
    s.board[0].piece = item('grill', 4);
    delete s.discovered;
    const loaded = validateSave(JSON.parse(JSON.stringify(s)))!;
    expect(isDiscovered(loaded, item('grill', 4))).toBe(true);
  });
});
