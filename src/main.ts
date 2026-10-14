import './style.css';
import { CHAINS, ChainId, GEN_LEVELS, GENERATORS, GenId, isFood, MAX_ENERGY, SPAWN_COST, maxLevel, xpForLevel } from './game/config';
import {
  GameState, MERGE_COUNT, Customer, Piece, canUpgrade, currentTask, restore, serve, collect, findOrder, genLevel, isWanted, load, movePiece, msToNextEnergy,
  item, newGame, save, sell, sellValue, spawnFrom, tickEnergy, upgradeGen, validateSave,
  FRIDGE_MAX_SLOTS, fridgeSlotCost, fridgeSlots, buyFridgeSlot, storeInFridge, takeFromFridge, takeFromRewardBag,
  CHECKIN_REWARDS, FREE_MAKEUPS, checkIn, checkInReward, checkInStreak, checkedIn, checkedInToday, makeUpCost, makeUpDay, missedDays, dayKey,
  SPINS_PER_DAY, WHEEL, spinWheel, spinsLeft, DAILY_BONUS, Quest, claimDailyBonus, claimQuest, claimableQuests, WEEKLY_CHESTS, claimWeeklyChest, msToNextWeek, weekly, ensureDaily, msToNextDay, questDone,
  TutorialStep, advanceTutorial, skipTutorial, tutorialStep, discover, gen, isDiscovered,
} from './game/state';
import { generatorArt, iconArt, itemArt, loadArtOverrides, customerImg, pieceArt } from './render/art';
import { burst, cookCharge, puff, shower, trail, yum } from './render/fx';
import { sceneArt } from './render/scene';
import { plateRing, serveDish } from './render/serve';
import { roomAnchor, roomSvg, updateRoom } from './render/room';
import { CHAPTERS, COMING_SOON, MENTOR } from './game/story';
import { Board, Period, online, untilReset } from './online';
import { sfx } from './render/sfx';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector(sel) as T;

let state: GameState = load() ?? newGame();
tickEnergy(state);

// ------------------------------------------------------------------ helpers

const pieceColor = (p: Piece) => CHAINS[p.kind === 'gen' ? GENERATORS[p.gen].chain : p.chain].color;
const pieceName = (p: Piece) => (p.kind === 'gen' ? GENERATORS[p.gen].name : CHAINS[p.chain].levels[p.level - 1]);
const center = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

let saveTimer = 0;
/**
 * Save after the player changed something. Only real changes move `savedAt`,
 * so a device that was merely opened never looks newer than the cloud copy.
 */
function persist(changed = true) {
  if (changed) state.savedAt = Date.now();
  discover(state);
  updateFridgeCount();
  updateRewardBag();
  updateQuestBadge();
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    save(state);
    online.cloudSave(state);
  }, 250);
}

let toastTimer = 0;
function toast(msg: string, big = false, ms = 1400) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('big', big);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), ms);
}

function floater(text: string, x: number, y: number) {
  const f = document.createElement('div');
  f.className = 'floater stroked';
  f.textContent = text;
  f.style.left = `${x}px`;
  f.style.top = `${y}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1000);
}

/** Full-screen tinted flash for the biggest dishes. */
function flash(color: string, level: number) {
  const f = document.createElement('div');
  f.className = 'flash';
  f.style.setProperty('--flash', color);
  f.style.setProperty('--flash-o', String(Math.min(0.6, 0.15 + (level - 5) * 0.15)));
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 600);
}

function restartAnim(el: Element, cls: string) {
  el.classList.remove(cls);
  void (el as HTMLElement).offsetWidth;
  el.classList.add(cls);
}

/** Fly an image along an arc from one point to another with a sparkle trail. */
function fly(src: string, from: { x: number; y: number }, to: { x: number; y: number }, opts: { ms?: number; color?: string; size?: number; delay?: number } = {}) {
  const { ms = 550, color = '#fff', size, delay = 0 } = opts;
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'flyer';
      if (size) Object.assign(el.style, { width: `${size}px`, height: `${size}px`, margin: `${-size / 2}px 0 0 ${-size / 2}px` });
      el.innerHTML = `<img src="${src}" alt="">`;
      document.body.appendChild(el);
      const start = performance.now();
      const lift = Math.min(120, Math.abs(to.y - from.y) * 0.35 + 40);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / ms);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const x = from.x + (to.x - from.x) * e;
        const y = from.y + (to.y - from.y) * e - Math.sin(Math.PI * t) * lift;
        el.style.transform = `translate(${x}px, ${y}px) scale(${1 - t * 0.35}) rotate(${t * 20}deg)`;
        el.style.left = '0';
        el.style.top = '0';
        trail(x, y, color);
        if (t < 1) requestAnimationFrame(step);
        else { el.remove(); resolve(); }
      };
      requestAnimationFrame(step);
    }, delay);
  });
}

// ------------------------------------------------------------------ layout

const boardEl = $('#board');
const cells: HTMLDivElement[] = [];
const cellKeys: string[] = [];

/**
 * Size the board cells to the largest that fit the space left between the
 * customers and the info box, then give any spare height to the customer
 * portraits. Re-run whenever the screen or a panel changes size.
 */
function layout() {
  const wrap = $('#board-wrap');
  const root = document.documentElement.style;
  root.setProperty('--mon-extra', '0px');
  // Bigger cells mean a bigger board and bigger customer cards (less room), so
  // whether a size fits only changes once: binary search for the largest.
  const fits = (size: number) => {
    root.setProperty('--cell', `${size}px`);
    return boardEl.offsetHeight <= wrap.clientHeight - 6 && boardEl.offsetWidth <= wrap.clientWidth;
  };
  let lo = 20, hi = 72;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(mid)) lo = mid; else hi = mid - 1;
  }
  fits(lo);
  // Give leftover height to the customer portraits instead of a dead gap.
  const spare = wrap.clientHeight - boardEl.offsetHeight - 12;
  root.setProperty('--mon-extra', `${Math.max(0, Math.min(70, spare))}px`);
  placeHand();
}

let layoutQueued = false;
const queueLayout = () => {
  if (layoutQueued) return;
  layoutQueued = true;
  requestAnimationFrame(() => { layoutQueued = false; layout(); });
};

function buildBoard() {
  boardEl.style.setProperty('--cols', String(state.cols));
  boardEl.innerHTML = '';
  cells.length = 0;
  for (let i = 0; i < state.board.length; i++) {
    const c = document.createElement('div');
    c.className = 'cell';
    c.dataset.i = String(i);
    boardEl.appendChild(c);
    cells.push(c);
    cellKeys[i] = '';
  }
}

function renderCell(i: number, anim?: 'pop' | 'merge' | 'squish') {
  const c = state.board[i];
  const el = cells[i];
  const p = c.piece;
  const key = p ? (p.kind === 'gen' ? `g${p.gen}${genLevel(p)}` : `${p.chain}${p.level}`) : '';
  if (key !== cellKeys[i]) {
    cellKeys[i] = key;
    el.innerHTML = !p ? '' : p.kind === 'gen'
      ? `<div class="piece gen lv${genLevel(p)}"><img src="${pieceArt(p)}" alt=""></div>`
      : `<div class="piece"><img src="${pieceArt(p)}" alt=""><span class="check"></span></div>`;
  }
  const pe = el.firstElementChild;
  if (pe) {
    pe.classList.toggle('want', isWanted(state, p));
    if (anim) restartAnim(pe, anim);
  }
}

function renderBoard() {
  for (let i = 0; i < state.board.length; i++) renderCell(i);
}

// ------------------------------------------------------------------ HUD

const shown = { coins: state.coins, gems: state.gems, energy: state.energy };

function renderHud() {
  $('#hud-level span').textContent = String(state.level);
  $('#hud-energy .val').textContent = String(state.energy);
  $('#hud-coins .val').textContent = String(state.coins);
  $('#hud-gems .val').textContent = String(state.gems);
  for (const k of ['coins', 'gems', 'energy'] as const) {
    if (shown[k] !== state[k]) {
      if (state[k] > shown[k]) restartAnim($(`#hud-${k}`), 'bump');
      shown[k] = state[k];
    }
  }
  const need = xpForLevel(state.level);
  $('#xpfill').style.width = `${(state.xp / need) * 100}%`;
  $('#xptext').textContent = `${state.xp} / ${need} XP`;
  updateTimer();
  updateDinerBadge();
  // Keep the Upgrade button in sync with coins / level.
  if (selected >= 0 && state.board[selected]?.piece?.kind === 'gen') select(selected);
}

function updateTimer() {
  const ms = msToNextEnergy(state);
  const t = $('#hud-energy .timer');
  if (state.energy >= MAX_ENERGY || !ms) t.textContent = '';
  else t.textContent = `+1 in ${Math.ceil(ms / 1000)}s`;
}

// ------------------------------------------------------------------ customers

/** A serving cloche: the round Serve button in the customer's top-right corner. */
const SERVE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'
  + '<path d="M4.5 16a7.5 7.5 0 0 1 15 0z" fill="currentColor"/><circle cx="12" cy="6.6" r="1.7" fill="currentColor"/></svg>';

const customerEls = new Map<number, HTMLElement>();
const dyingIds = new Set<number>();

function customerCard(m: Customer): HTMLElement {
  const el = document.createElement('div');
  el.className = `customer enter${m.critic ? ' critic' : ''}`;
  el.dataset.id = String(m.id);
  el.innerHTML = `
    <div class="portrait" aria-label="${m.name}"><img src="${customerImg(m.kind)}" alt="${m.name}"></div>
    <div class="tags">
      <span class="xp-badge stroked" title="Experience for serving them">+${m.xp} XP</span>
      <span class="reward"><img src="${iconArt.coin()}" alt="coins">${m.coins}</span>
      <span class="reward"><img src="${iconArt.gstar()}" alt="stars"><span class="star-n">${(m.stars ?? 1) + (state.starBonus ?? 0)}</span></span>
      ${m.gems ? `<span class="reward"><img src="${iconArt.gem()}" alt="gems">${m.gems}</span>` : ''}
    </div>
    <div class="tray"><div class="needs">${m.order.map((n) => `<div class="need" role="button" aria-label="${CHAINS[n.chain].levels[n.level - 1]}" data-chain="${n.chain}" data-level="${n.level}"><img src="${itemArt(n.chain, n.level)}" alt=""><span class="check"></span></div>`).join('')}</div></div>
    <button class="serve" aria-label="Serve ${m.name}" title="Serve">${SERVE_ICON}</button>`;
  el.querySelector('.serve')!.addEventListener('click', (e) => { e.stopPropagation(); doServe(m.id); });
  el.querySelector('.portrait')!.addEventListener('click', () => showCustomerInfo(m));
  // Tapping an ordered item opens its merge chain, so you can see how to make it.
  el.querySelectorAll<HTMLElement>('.need').forEach((n) => n.addEventListener('click', (e) => {
    e.stopPropagation();
    openDetails({ kind: 'item', chain: n.dataset.chain as ChainId, level: Number(n.dataset.level) });
  }));
  setTimeout(() => el.classList.remove('enter'), 600);
  return el;
}

function renderCustomers() {
  const wrap = $('#customers');
  const ids = new Set(state.customers.map((m) => m.id));
  for (const [id, el] of customerEls) {
    if (!ids.has(id) && !dyingIds.has(id)) { el.remove(); customerEls.delete(id); }
  }
  state.customers.forEach((m, i) => {
    let el = customerEls.get(m.id);
    if (!el) {
      el = customerCard(m);
      customerEls.set(m.id, el);
    }
    if (wrap.children[i] !== el && !dyingIds.size) wrap.insertBefore(el, wrap.children[i] ?? null);
    // Mark which needs are on the board.
    const used = new Set<number>();
    el.querySelectorAll<HTMLElement>('.need').forEach((n) => {
      const chain = n.dataset.chain, level = Number(n.dataset.level);
      const at = state.board.findIndex((c, j) => !used.has(j) && c.piece?.kind === 'item' && c.piece.chain === chain && c.piece.level === level);
      if (at >= 0) used.add(at);
      n.classList.toggle('have', at >= 0);
    });
    el.classList.toggle('ready', !!findOrder(state, m));
    // Keep the star reward current (a chapter can add a bonus while cards are showing).
    const starN = el.querySelector('.star-n');
    if (starN) starN.textContent = String((m.stars ?? 1) + (state.starBonus ?? 0));
  });
}

function showCustomerInfo(m: Customer) {
  const stars = (m.stars ?? 1) + (state.starBonus ?? 0);
  const loot = [`${m.coins} coins`, `${m.xp} XP`, `${stars} star${stars === 1 ? '' : 's'}`, ...(m.gems ? [`${m.gems} gems`] : [])];
  setInfo(customerImg(m.kind), m.name, `Order: ${m.order.map((n) => CHAINS[n.chain].levels[n.level - 1]).join(' + ')}. Serve them for ${loot.join(', ')}.`);
}

async function doServe(id: number) {
  const m = state.customers.find((x) => x.id === id);
  const el = customerEls.get(id);
  if (!m || !el) return;
  const cellsUsed = findOrder(state, m);
  if (!cellsUsed) return;

  // Capture art + positions before the state changes.
  const dishes = cellsUsed.map((i) => {
    const p = state.board[i].piece as Extract<Piece, { kind: 'item' }>;
    return { src: pieceArt(p), from: center(cells[i]), color: pieceColor(p), chain: p.chain, level: p.level, cell: i };
  });
  const res = serve(state, id);
  if (!res) return;
  dyingIds.add(id);
  select(-1);

  const target = center(el.querySelector('.portrait')!);
  const cell = cells[0].offsetWidth;
  const boardBox = boardEl.getBoundingClientRect();
  const frame = boardEl.clientLeft;
  await Promise.all(dishes.map((f, k) => new Promise<void>((done) => {
    setTimeout(() => {
      // Plating: a plate draws itself under the item while it wiggles,
      // steaming, then it flies over to the customer.
      const charge = 320 + f.level * 70;
      const piece = cells[f.cell].firstElementChild as HTMLElement | null;
      const food = isFood(f.chain) ? f.chain : null;
      const plate = food
        ? plateRing(boardEl, food, f.from.x - boardBox.left - frame, f.from.y - boardBox.top - frame, f.level, cell, charge)
        : null;
      piece?.classList.add('charging');
      if (food) cookCharge(food, f.from.x, f.from.y, f.level, charge);
      sfx.plate(f.level, charge);
      setTimeout(() => {
        plate?.release();
        renderCell(f.cell);
        sfx.whoosh(f.level);
        const trip = food
          ? serveDish(food, f.level, f.src, f.from, target, cell)
          : fly(f.src, f.from, target, { ms: 520, color: f.color, size: cell * (0.8 + f.level * 0.1) });
        trip.then(() => {
          if (food) {
            const fx = yum(food, target.x, target.y, f.level);
            sfx.yum(food, f.level);
            if (fx.flash) flash(fx.flash, f.level);
          } else {
            burst(target.x, target.y, f.color, 0.7);
          }
          restartAnim(el, 'yum');
          done();
        });
      }, charge);
    }, k * 240);
  })));
  // Let the biggest effect play out before the customer leaves.
  await new Promise((r) => setTimeout(r, 200 + Math.max(...dishes.map((f) => f.level)) * 90));

  // The customer's happy thank-you, then the cash register jingle.
  sfx.customerCheer(m.kind);
  setTimeout(() => sfx.served(), m.critic ? 900 : 500);
  el.classList.add('leaving');
  shower(target.x, target.y, m.critic ? ['#ffcf4a', '#ff8a3c', '#fff'] : ['#ffd147', '#ff7fb8', '#fff']);
  floater(`+${res.customer.coins}`, target.x, target.y - 20);
  setTimeout(() => {
    const xp = center($('#xpbar'));
    floater(`+${res.customer.xp} XP`, xp.x, xp.y);
  }, 300);

  online.submit(state.served, state.level);

  // A star flies to the hub button (the restaurant lives there).
  fly(iconArt.gstar(), target, center(hubBtn), { ms: 700, delay: 250, color: '#ffd23c', size: 30 })
    .then(() => { restartAnim(hubBtn, 'bump'); updateDinerBadge(); });

  // Coins fly to the HUD.
  const hudCoin = center($('#hud-coins img'));
  const n = Math.min(8, 3 + Math.floor(res.customer.coins / 10));
  for (let k = 0; k < n; k++) {
    fly(iconArt.coin(), { x: target.x + (Math.random() - 0.5) * 40, y: target.y }, hudCoin, { ms: 600, delay: 150 + k * 60, color: '#ffd147', size: 26 })
      .then(() => { if (k % 2 === 0) sfx.coin(); });
  }
  setTimeout(() => {
    renderHud();
    dyingIds.delete(id);
    el.remove();
    customerEls.delete(id);
    renderCustomers();
    renderBoard();
    if (res.levelUp) {
      sfx.levelUp();
      toast(`✨ Level ${state.level}! ✨\nEnergy refilled, +3 gems`, true, 2200);
      const lv = center($('#hud-level'));
      shower(lv.x, lv.y, ['#7fd0ff', '#ff9ec8', '#fff']);
    }
  }, 750);
  persist();
}

// ------------------------------------------------------------------ info bar

let selected = -1;

function setInfo(img: string | null, title: string, desc: string, action?: { label: string; fn: () => void; off?: boolean }) {
  const im = $<HTMLImageElement>('#info-img');
  if (img) im.src = img; else im.removeAttribute('src');
  // A trailing "· Lv N" becomes a chip that never gets cut off; only the name shortens.
  const m = title.match(/^(.*) · (Lv \d+(?: \(max\))?)$/);
  const t = $('#info-title');
  t.textContent = '';
  const name = document.createElement('span');
  name.className = 'info-name';
  name.textContent = m ? m[1] : title;
  t.append(name);
  if (m) {
    const lv = document.createElement('span');
    lv.className = 'info-lv';
    lv.textContent = m[2];
    t.append(lv);
  }
  $('#info-desc').textContent = desc;
  const btn = $<HTMLButtonElement>('#info-action');
  btn.classList.toggle('hidden', !action);
  btn.onclick = action ? (e) => { e.stopPropagation(); action.fn(); } : null;
  // Labels are built in code (never from user input) and may include an icon.
  if (action) btn.innerHTML = action.label;
  btn.classList.toggle('off', !!action?.off);
}

function select(i: number) {
  if (selected >= 0) cells[selected]?.classList.remove('selected');
  selected = i;
  $('#info-more').classList.toggle('hidden', !(i >= 0 && state.board[i]?.piece));
  if (i < 0) {
    setInfo(iconArt.toque(), 'Serve the customers!', 'Merge ingredients into the dishes each customer orders.');
    return;
  }
  cells[i].classList.add('selected');
  const c = state.board[i];
  const p = c.piece;
  if (!p) return;
  const name = pieceName(p);


  if (p.kind === 'gen') {
    const def = GENERATORS[p.gen];
    const gl = genLevel(p);
    const lv = GEN_LEVELS[gl - 1];
    const top = CHAINS[def.chain].levels[lv.odds.length - 1];
    const free = lv.freeChance ? ` ${Math.round(lv.freeChance * 100)}% chance it's free.` : '';
    const desc = `Tap again to cook (⚡${SPAWN_COST}). Makes up to ${top}.${free}`;
    const up = canUpgrade(state, i);
    if (!up.ok && up.reason === 'max') return setInfo(pieceArt(p), `${def.name} · Lv ${gl} (max)`, desc);
    const cost = up.ok ? up.cost : up.cost!;
    return setInfo(pieceArt(p), `${def.name} · Lv ${gl}`, desc,
      { label: `Upgrade<span class="btn-cost"><img class="btn-ico" src="${iconArt.coin()}" alt="coins">${cost}</span>`, fn: () => doUpgrade(i), off: !up.ok });
  }

  const def = CHAINS[p.chain];
  const max = maxLevel(p.chain);
  const next = p.level < max ? `Merge ${MERGE_COUNT} → ${itemName(p.chain, p.level + 1)}` : 'Max level!';
  const title = `${name} · Lv ${p.level}`;
  if (def.collect) {
    const amt = def.collect.amounts[p.level - 1];
    const what = def.collect.resource === 'coins' ? `${amt} coins` : `${amt} energy`;
    return setInfo(pieceArt(p), title, `${next}. Tap again to collect ${what}.`, { label: 'Collect', fn: () => doCollect(i) });
  }
  const v = sellValue(p);
  setInfo(pieceArt(p), title, `${next}.${isWanted(state, p) ? ' A customer ordered this!' : ''}`, v ? { label: `Sell +${v}`, fn: () => doSell(i) } : undefined);
}

// ------------------------------------------------------------------ panels wait for their art

/** Resolve once every picture in `root` has loaded and decoded (or failed), or after `ms` at most. */
function imagesReady(root: ParentNode, ms = 2500): Promise<void> {
  // A spinner appears if the wait is long enough to notice, so a tap never seems ignored.
  const spin = setTimeout(() => document.body.classList.add('loading-art'), 250);
  const waits = [...root.querySelectorAll('img')].map((img) =>
    (img.complete ? Promise.resolve() : new Promise<void>((done) => {
      img.addEventListener('load', () => done(), { once: true });
      img.addEventListener('error', () => done(), { once: true });
    })).then(() => (img.naturalWidth ? img.decode().catch(() => {}) : undefined)));
  return Promise.race([Promise.all(waits).then(() => {}), new Promise<void>((done) => setTimeout(done, ms))])
    .then(() => { clearTimeout(spin); document.body.classList.remove('loading-art'); });
}

/** The panel being opened; opening another one first cancels it. */
let panelToken = 0;

/** Show a panel (already filled in while hidden) once its pictures are in, so it never opens with blank slots. */
async function revealWhenReady(panel: HTMLElement) {
  const token = ++panelToken;
  await imagesReady(panel);
  if (token === panelToken) panel.classList.remove('hidden');
}

// ------------------------------------------------------------------ details panel

/** What the details panel shows: an item's merge chain or a kitchen station. */
/** An item's name, or ??? until the player has had one. */
const itemName = (chain: ChainId, level: number) => (isDiscovered(state, item(chain, level)) ? CHAINS[chain].levels[level - 1] : '???');

type Detail = { kind: 'item'; chain: ChainId; level: number } | { kind: 'gen'; gen: GenId; level: number };

const detailsEl = $('#details');
/** The piece the panel opened on (highlighted green) and the level being looked at (described). */
let detail: Detail | null = null;
let detailFocus = 1;

const pct = (w: number, odds: number[]) => `${Math.round((w / odds.reduce((t, x) => t + x, 0)) * 100)}%`;

/** Each render gets a number, so a slow one can't replace a newer one. */
let detailsRender = 0;

async function renderDetails() {
  if (!detail) return;
  const d = detail;
  const run = ++detailsRender;
  discover(state);
  // Pieces the player hasn't had yet show as silhouettes.
  const hiddenItem = (chain: ChainId, level: number) => (isDiscovered(state, item(chain, level)) ? '' : ' unknown');
  const hiddenGen = (id: GenId, level: number) => (isDiscovered(state, gen(id, level)) ? '' : ' unknown');
  let html: string, sub: string, name: string;
  if (d.kind === 'item') {
    const def = CHAINS[d.chain];
    const max = maxLevel(d.chain);
    const f = detailFocus;
    sub = 'Merge chain';
    name = def.name;
    const tiles = def.levels.map((_, k) => `<button class="dtile${k + 1 === d.level ? ' now' : ''}${k + 1 === f ? ' focus' : ''}${hiddenItem(d.chain, k + 1)}" data-focus="${k + 1}" aria-label="${itemName(d.chain, k + 1)}, level ${k + 1}">`
      + `<img src="${itemArt(d.chain, k + 1)}" alt=""><span class="dlv">${k + 1}</span></button>`).join('');
    const next = f < max ? `Merge ${MERGE_COUNT} to make <b>${itemName(d.chain, f + 1)}</b>.` : 'The top of the chain!';
    const use = def.collect
      ? ` Tap it on the board to collect ${def.collect.amounts[f - 1]} ${def.collect.resource}.`
      : sellValue(item(d.chain, f)) ? ` Sells for ${sellValue(item(d.chain, f))} coins.` : '';
    const makers = Object.values(GENERATORS).filter((g) => g.chain === d.chain);
    const madeBy = makers.length
      ? `<div class="dmakers">${makers.map((g) => `<button class="dtile${hiddenGen(g.id, 1)}" data-open="gen:${g.id}" aria-label="${g.name}"><img src="${generatorArt(g.id, 1)}" alt=""></button>`).join('')}</div>`
        + `<p class="dnote">${makers.map((g) => g.name).join(', ')} makes levels 1 to ${Math.max(...GEN_LEVELS.map((l) => l.odds.length))} as it levels up. Tap it for the odds.</p>`
      : '<p class="dnote">No station makes these. You earn them as chapter rewards.</p>';
    html = `<h3>Level ${f} of ${max}</h3><div class="dgrid chain">${tiles}</div>`
      + `<p class="dnote"><b>${itemName(d.chain, f)}</b>. ${next}${use}</p>`
      + `<h3>Created by</h3>${madeBy}`;
  } else {
    const def = GENERATORS[d.gen];
    const f = detailFocus;
    const lv = GEN_LEVELS[f - 1];
    sub = 'Kitchen station';
    name = def.name;
    const tiles = GEN_LEVELS.map((_, k) => `<button class="dtile${k + 1 === d.level ? ' now' : ''}${k + 1 === f ? ' focus' : ''}${hiddenGen(d.gen, k + 1)}" data-focus="${k + 1}" aria-label="${def.name}, level ${k + 1}">`
      + `<img src="${generatorArt(d.gen, k + 1)}" alt=""><span class="dlv">${k + 1}</span></button>`).join('');
    const top = Math.max(...GEN_LEVELS.map((l) => l.odds.length));
    const makes = Array.from({ length: top }, (_, k) => {
      const w = lv.odds[k];
      const firstAt = GEN_LEVELS.findIndex((l) => (l.odds[k] ?? 0) > 0) + 1;
      return `<button class="dtile make${w ? '' : ' locked'}${hiddenItem(def.chain, k + 1)}" data-open="item:${def.chain}:${k + 1}" aria-label="${itemName(def.chain, k + 1)}${w ? `, ${pct(w, lv.odds)}` : `, from station level ${firstAt}`}">`
        + `<img src="${itemArt(def.chain, k + 1)}" alt=""><span class="dlv">${k + 1}</span><span class="dodds">${w ? pct(w, lv.odds) : `Lv ${firstAt}`}</span></button>`;
    }).join('');
    const free = lv.freeChance ? ` ${Math.round(lv.freeChance * 100)}% chance cooking is free.` : '';
    const up = lv.upgradeCost ? ` Upgrading to level ${f + 1} costs ${lv.upgradeCost} coins and needs player level ${lv.upgradeReq}.` : ' Max level.';
    html = `<h3>Level ${f} of ${GEN_LEVELS.length}</h3><div class="dgrid chain">${tiles}</div>`
      + `<p class="dnote">Each cook costs ⚡${SPAWN_COST}.${free}${up}</p>`
      + `<h3>Creates at level ${f}</h3><div class="dgrid">${makes}</div>`;
  }
  // Build it off-screen and swap it in once its pictures are ready, so the panel never shows empty tiles.
  const next = document.createElement('div');
  next.innerHTML = html;
  await imagesReady(next);
  if (run !== detailsRender) return;
  $('#details-sub').textContent = sub;
  $('#details-name').textContent = name;
  $('#details-body').replaceChildren(...next.childNodes);
}

async function openDetails(d: Detail) {
  detail = d;
  detailFocus = d.level;
  sfx.pick();
  const wasOpen = !detailsEl.classList.contains('hidden');
  await renderDetails();
  detailsEl.scrollTop = 0;
  if (!wasOpen) revealWhenReady(detailsEl);
}

function openSelectedDetails() {
  const p = selected >= 0 ? state.board[selected]?.piece : null;
  if (!p) return;
  openDetails(p.kind === 'gen' ? { kind: 'gen', gen: p.gen, level: genLevel(p) } : { kind: 'item', chain: p.chain, level: p.level });
}

$('#info-more').addEventListener('click', (e) => { e.stopPropagation(); openSelectedDetails(); });
$('#info-frame').addEventListener('click', (e) => { e.stopPropagation(); openSelectedDetails(); });
$('#btn-details-back').addEventListener('click', () => detailsEl.classList.add('hidden'));
$('#details-body').addEventListener('click', (e) => {
  const t = (e.target as Element).closest<HTMLElement>('[data-focus], [data-open]');
  if (!t) return;
  if (t.dataset.focus) { detailFocus = Number(t.dataset.focus); sfx.pick(); renderDetails(); return; }
  const [kind, id, lv] = t.dataset.open!.split(':');
  if (kind === 'gen') {
    // Open on the player's own station of this kind, if they have one on the board.
    const own = state.board.find((c) => c.piece?.kind === 'gen' && c.piece.gen === id)?.piece;
    openDetails({ kind: 'gen', gen: id as GenId, level: own ? genLevel(own) : 1 });
  } else {
    openDetails({ kind: 'item', chain: id as ChainId, level: Number(lv) });
  }
});

// ------------------------------------------------------------------ actions

function doSpawn(i: number) {
  const r = spawnFrom(state, i);
  if (!r.ok) {
    sfx.error();
    restartAnim(cells[i].firstElementChild!, 'squish');
    toast(r.reason === 'energy' ? 'Out of energy! Wait or collect Energy items.' : 'The board is full! Merge or sell items.');
    return;
  }
  sfx.spawn();
  restartAnim(cells[i].firstElementChild!, 'squish');
  const from = center(cells[i]);
  if (r.free) floater('Free!', from.x, from.y - 20);
  const to = center(cells[r.at]);
  const p = r.piece;
  cellKeys[r.at] = '__pending';
  fly(pieceArt(p), from, to, { ms: 260, color: pieceColor(p) }).then(() => {
    cellKeys[r.at] = '';
    renderCell(r.at, 'pop');
    puff(to.x, to.y, pieceColor(p));
    renderCustomers();
  });
  renderHud();
  persist();
}

function doUpgrade(i: number) {
  const r = upgradeGen(state, i);
  if (!r.ok) {
    sfx.error();
    if (r.reason === 'level') toast(`Reach player level ${r.req} to upgrade.`);
    else if (r.reason === 'coins') toast(`Need ${r.cost} coins. Serve customers to earn more!`);
    return;
  }
  const pt = center(cells[i]);
  fly(iconArt.coin(), center($('#hud-coins img')), pt, { ms: 450, color: '#ffd147', size: 28 }).then(() => {
    renderCell(i, 'merge');
    burst(pt.x, pt.y, pieceColor(state.board[i].piece!), 1.4);
    shower(pt.x, pt.y, [pieceColor(state.board[i].piece!), '#ffe680', '#fff']);
    sfx.levelUp();
    floater(`Lv ${genLevel(state.board[i].piece!)}!`, pt.x, pt.y - 20);
    select(i);
  });
  renderHud();
  persist();
}

function doCollect(i: number) {
  const p = state.board[i].piece;
  const from = center(cells[i]);
  const r = collect(state, i);
  if (!r || !p) return;
  sfx.coin();
  select(-1);
  renderCell(i);
  const hud = r.resource === 'coins' ? $('#hud-coins img') : $('#hud-energy img');
  fly(pieceArt(p), from, center(hud), { ms: 500, color: pieceColor(p) }).then(() => renderHud());
  floater(`+${r.amount}`, from.x, from.y);
  persist();
}

function doSell(i: number) {
  const from = center(cells[i]);
  const v = sell(state, i);
  if (!v) return;
  sfx.coin();
  puff(from.x, from.y, '#ffd147');
  floater(`+${v}`, from.x, from.y);
  select(-1);
  renderCell(i);
  renderHud();
  renderCustomers();
  persist();
}

function onTap(i: number) {
  const c = state.board[i];
  if (!c.piece) { select(-1); return; }
  if (c.piece.kind === 'gen') {
    // First tap selects (free, shows Upgrade); tapping the selected station cooks.
    if (selected === i) doSpawn(i);
    else { sfx.pick(); restartAnim(cells[i].firstElementChild!, 'squish'); select(i); }
    return;
  }
  if (c.piece.kind === 'item' && CHAINS[c.piece.chain].collect && selected === i) { doCollect(i); return; }
  sfx.pick();
  restartAnim(cells[i].firstElementChild!, 'squish');
  select(i);
}

function onDrop(from: number, to: number) {
  const fromPiece = state.board[from].piece!;
  const r = movePiece(state, from, to);
  if (r.type === 'none') {
    sfx.error();
    renderCell(from, 'squish');
    return;
  }
  if (r.type === 'need3') {
    sfx.error();
    renderCell(from, 'squish');
    renderCell(to, 'squish');
    toast(`Need ${MERGE_COUNT} to merge! Put ${MERGE_COUNT} matching items side by side.`);
    return;
  }
  if (r.type === 'merge') {
    const art = pieceArt(fromPiece);
    const color = pieceColor(fromPiece);
    const lvl = (r.result as Extract<Piece, { kind: 'item' }>).level;
    const isMax = lvl === maxLevel((r.result as Extract<Piece, { kind: 'item' }>).chain);
    // Hide the results until the used items have flown together.
    for (const i of r.results) cellKeys[i] = '__pending';
    r.consumed.forEach((i) => { if (!r.results.includes(i)) renderCell(i); });
    renderCell(from);
    const target = center(cells[to]);
    const sources = [center(cells[from]), ...r.consumed.filter((i) => i !== to).map((i) => center(cells[i]))];
    Promise.all(sources.map((src) => fly(art, src, target, { ms: 180, color }))).then(() => {
      for (const i of r.results) {
        cellKeys[i] = '';
        renderCell(i, 'merge');
        const pt = center(cells[i]);
        burst(pt.x, pt.y, color, 0.8 + lvl * 0.12);
        if (isMax) shower(pt.x, pt.y, [color, '#fff', '#ffe680']);
      }
      if (r.results.length > 1) floater('Bonus x2!', target.x, target.y - 24);
      sfx.merge(lvl);
      renderBoard();
      renderCustomers();
      select(to);
      if (tut) setTimeout(tutorialMerged, 500);
    });
    if (tut) handEl.classList.add('hidden');
    persist();
    return;
  } else {
    sfx.drop();
    renderCell(from, r.type === 'swap' ? 'squish' : undefined);
    renderCell(to, 'squish');
    select(to);
  }
  renderCustomers();
  renderBoard();
  persist();
}

// ------------------------------------------------------------------ input

interface Drag { from: number; x0: number; y0: number; active: boolean; ghost?: HTMLElement; over: number; pointer: number }
let drag: Drag | null = null;

function cellAt(x: number, y: number): number {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.cell');
  return el ? Number(el.dataset.i) : -1;
}

function clearHints() {
  cells.forEach((c) => c.classList.remove('hint', 'drop'));
}

boardEl.addEventListener('pointerdown', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('.cell');
  if (!el || drag) return;
  const i = Number(el.dataset.i);
  // The tutorial only lets you pick up the item it points at.
  if (tut && i !== tut.from) return;
  drag = { from: i, x0: e.clientX, y0: e.clientY, active: false, over: -1, pointer: e.pointerId };
});

addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.pointer) return;
  const c = state.board[drag.from];
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    if (!c.piece) return;
    drag.active = true;
    sfx.pick();
    const g = document.createElement('div');
    g.id = 'drag-ghost';
    g.innerHTML = `<img src="${pieceArt(c.piece)}" alt="">`;
    document.body.appendChild(g);
    drag.ghost = g;
    cells[drag.from].firstElementChild?.classList.add('dragging-src');
    // Highlight every merge partner, like the blue glow in Love & Pies.
    state.board.forEach((o, j) => {
      if (j !== drag!.from && o.piece?.kind === 'item' && c.piece?.kind === 'item'
        && o.piece.chain === c.piece.chain && o.piece.level === c.piece.level && c.piece.level < maxLevel(c.piece.chain)) {
        cells[j].classList.add('hint');
      }
    });
  }
  drag.ghost!.style.left = `${e.clientX}px`;
  drag.ghost!.style.top = `${e.clientY}px`;
  fridgeBtn.classList.toggle('target', overFridge(e.clientX, e.clientY));
  const over = cellAt(e.clientX, e.clientY);
  if (over !== drag.over) {
    if (drag.over >= 0) cells[drag.over].classList.remove('drop');
    if (over >= 0 && over !== drag.from) cells[over].classList.add('drop');
    drag.over = over;
  }
});

function endDrag(e: PointerEvent) {
  if (!drag || e.pointerId !== drag.pointer) return;
  const d = drag;
  drag = null;
  if (!d.active) { onTap(d.from); return; }
  d.ghost?.remove();
  cells[d.from].firstElementChild?.classList.remove('dragging-src');
  clearHints();
  fridgeBtn.classList.remove('target');
  const to = cellAt(e.clientX, e.clientY);
  if (tut && to !== tut.to) {
    renderCell(d.from, 'squish');
    restartAnim(cells[tut.to], 'tut-nudge');
    return;
  }
  if (overFridge(e.clientX, e.clientY)) { doStore(d.from); return; }
  if (to >= 0 && to !== d.from) onDrop(d.from, to);
  else renderCell(d.from, 'squish');
}
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', (e) => {
  if (!drag || e.pointerId !== drag.pointer) return;
  drag.ghost?.remove();
  cells[drag.from].firstElementChild?.classList.remove('dragging-src');
  clearHints();
  fridgeBtn.classList.remove('target');
  drag = null;
});

function showSound() {
  $('#btn-sound').textContent = sfx.muted ? '🔇' : '🔊';
  $('#btn-hub-sound').textContent = sfx.muted ? 'Sound: off' : 'Sound: on';
}
for (const id of ['#btn-sound', '#btn-hub-sound']) $(id).addEventListener('click', () => { sfx.toggle(); showSound(); });
showSound();

// Debug helpers for playtesting from the console.
Object.assign(window, {
  kitchen: {
    reset() { state = newGame(); save(state); location.reload(); },
    energy(n = 100) { state.energy += n; renderHud(); persist(); },
    get state() { return state; },
    /** Play any sound from the console, e.g. kitchen.sfx.customerCheer('critic'). */
    sfx,
    /** Diner chapters (read-only reference for testing). */
    chapters: CHAPTERS,
  },
});

// ------------------------------------------------------------------ hub

// The top-right button switches between the kitchen and the hub, which holds
// the restaurant, daily quests, leaderboard and profile. The kitchen keeps
// running underneath while the hub is open.
const hubEl = $('#hub');
const hubBtn = $('#btn-hub');
const inHub = () => !hubEl.classList.contains('hidden');

function setHub(open: boolean) {
  hubEl.classList.toggle('hidden', !open);
  hubBtn.classList.toggle('in-hub', open);
  hubBtn.setAttribute('aria-pressed', String(open));
  hubBtn.setAttribute('aria-label', open ? 'Back to the kitchen' : 'Go to the hub: restaurant, quests, leaderboard and profile');
  if (open) renderHub();
}

/** The status line under each hub entry. */
function renderHub() {
  const ch = CHAPTERS[viewChapter()];
  const done = ch.tasks.filter((t) => state.tasksDone.includes(t.id)).length;
  $('#hub-diner-sub').textContent = $('#btn-diner').classList.contains('ready')
    ? 'Ready to restore!'
    : `${ch.name} · ${done} / ${ch.tasks.length}`;
  const d = state.daily;
  const ready = claimableQuests(state);
  const finished = d ? d.quests.filter((q) => q.claimed || questDone(q)).length : 0;
  $('#hub-quests-sub').textContent = `${ready ? `${ready} reward${ready > 1 ? 's' : ''} ready` : `${finished} of ${d?.quests.length ?? 0} done`} · new in ${untilNewQuests()}`;
  const streak = checkInStreak(state);
  $('#hub-checkin-sub').textContent = checkedInToday(state)
    ? `Day ${streak} streak · come back tomorrow`
    : `Check in for day ${streak + 1} of your streak!`;
  const spins = spinsLeft(state);
  $('#btn-wheel').classList.toggle('ready', spins > 0);
  $('#hub-wheel-sub').textContent = spins ? `${spins} free spin${spins > 1 ? 's' : ''} left today` : `New spins in ${untilNewQuests()}`;
  $('#hub-profile-sub').textContent = online.code ? 'Saved to the cloud · recovery code made' : 'Cloud save · make a recovery code';
}

/** The hub button wears a "!" when quests or the diner have something ready. */
function updateMenuBadge() {
  $('#btn-checkin').classList.toggle('ready', !checkedInToday(state));
  hubBtn.classList.toggle('ready', ['#btn-quests', '#btn-diner', '#btn-checkin'].some((b) => $(b).classList.contains('ready')));
  if (inHub()) renderHub();
}

hubBtn.addEventListener('click', () => {
  sfx.pick();
  setHub(!inHub());
});

// ------------------------------------------------------------------ diner

const dinerEl = $('#diner');
let roomFor = '';

function updateDinerBadge() {
  $('#star-badge').textContent = String(state.stars);
  const t = currentTask(state);
  $('#btn-diner').classList.toggle('ready', !!t && state.stars >= t.cost);
  updateMenuBadge();
}

/** The chapter whose room is shown: the current one, or the last one once all are done. */
const viewChapter = () => Math.min(state.chapter, CHAPTERS.length - 1);

/** The blurred backdrop follows the chapter being restored. */
function updateScene() {
  document.documentElement.style.setProperty('--scene', sceneArt(CHAPTERS[viewChapter()].id));
}

function renderDiner(fresh?: string, chapterIdx = viewChapter()) {
  const idx = chapterIdx;
  const ch = CHAPTERS[idx];
  const allDone = state.chapter > idx;
  $('#diner-chapter').textContent = `Chapter ${idx + 1}`;
  $('#diner-name').textContent = ch.name;
  $('#diner-stars').textContent = String(state.stars);
  const room = $('#room');
  if (roomFor !== ch.id) { room.innerHTML = roomSvg(ch.id); roomFor = ch.id; }
  const done = ch.tasks.filter((t) => state.tasksDone.includes(t.id)).map((t) => t.id);
  updateRoom(room.firstElementChild!, done, ch.tasks.length, fresh);
  $('#diner-fill').style.width = `${(done.length / ch.tasks.length) * 100}%`;
  $('#diner-progress-text').textContent = allDone ? (state.chapter >= CHAPTERS.length ? 'Fully restored! More rooms coming soon' : 'Fully restored!') : `${done.length} / ${ch.tasks.length} restored`;
  const cur = currentTask(state);
  $('#tasks').innerHTML = ch.tasks.map((t, k) => {
    const isDone = done.includes(t.id);
    const isCur = cur?.id === t.id;
    const cls = isDone ? 'done' : isCur ? 'current' : 'locked';
    const action = isCur
      ? `<button class="btn stroked${state.stars < t.cost ? ' off' : ''}" data-restore>Restore</button>`
      : '';
    return `<li class="task ${cls}"><span class="task-num stroked">${isDone ? '✓' : k + 1}</span>`
      + `<span class="task-name">${t.name}</span>`
      + (isDone ? '' : `<span class="task-cost"><img src="${iconArt.gstar()}" alt="stars">${t.cost}</span>`)
      + `${action}</li>`;
  }).join('');
}

function openDiner() {
  sfx.pick();
  renderDiner();
  revealWhenReady(dinerEl);
}

function closeDiner() {
  dinerEl.classList.add('hidden');
}

function doRestore() {
  const r = restore(state);
  if (!r.ok) {
    sfx.error();
    if (r.reason === 'stars') toast(`Need ${r.cost} stars. Serve customers to earn more!`);
    return;
  }
  sfx.levelUp();
  // Keep showing the room this task belongs to, even if the chapter just ended.
  const shown = r.chapterDone ? state.chapter - 1 : state.chapter;
  renderDiner(r.task.id, shown);
  const box = $('#room').firstElementChild!.getBoundingClientRect();
  const [ax, ay] = roomAnchor(CHAPTERS[shown].id, r.task.id);
  const x = box.left + ax * box.width, y = box.top + ay * box.height;
  burst(x, y, '#ffe680', 1.5);
  shower(x, y, ['#ffe680', '#b98cff', '#fff']);
  const lines: StoryLine[] = [{ text: r.task.story }];
  if (r.chapterDone) {
    updateScene();
    for (const t of r.chapterDone.outro) lines.push({ text: t });
    const next = CHAPTERS[state.chapter];
    lines.push({
      text: `Chapter complete: ${r.chapterDone.name}!`,
      extra: `Reward: ${r.chapterDone.rewardText}.`,
      // Move to the next room once the chapter's story is over.
      then: () => renderDiner(),
    });
    if (!online.code && !state.storySeen.includes('code-tip')) {
      state.storySeen.push('code-tip');
      lines.push({ text: 'Squeak, one more thing! Tap your level star to make a recovery code. Then your progress is safe even if you switch devices.' });
    }
    if (next) {
      state.storySeen.push(`${next.id}-intro`);
      for (const t of next.intro) lines.push({ text: t });
    } else {
      lines.push({ text: COMING_SOON });
    }
    renderBoard();
    for (const i of r.upgraded) renderCell(i, 'merge');
    for (const i of r.placed) renderCell(i, 'pop');
    if (state.rewardBag?.length) toast('Board full! Extra rewards are waiting in your reward bag.', true, 2200);
    renderCustomers();
  }
  setTimeout(() => tell(lines), 700);
  renderHud();
  persist();
}

$('#btn-diner').addEventListener('click', openDiner);
$('#btn-back').addEventListener('click', closeDiner);
$('#tasks').addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-restore]')) doRestore();
});

// ------------------------------------------------------------------ leaderboard

const leadersEl = $('#leaders');
let period: Period = 'week';
let boardReq = 0;

const escapeHtml = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function boardMessage(text: string, retry = false) {
  const m = $('#board-msg');
  m.classList.toggle('hidden', !text);
  m.innerHTML = escapeHtml(text) + (retry ? '<br><button class="btn stroked" id="board-retry">Try again</button>' : '');
  if (retry) $('#board-retry').addEventListener('click', loadBoard);
}

function renderMe(b: Board | null) {
  $('#me-name').textContent = b?.me?.name ?? online.name;
  $('#me-rank').textContent = b?.me?.rank ? `#${b.me.rank}` : '–';
  $('#me-score').textContent = String(b?.me?.score ?? (period === 'week' ? 0 : period === 'level' ? state.level : state.served));
  $('#me-unit').textContent = period === 'level' ? 'level' : 'customers';
}

async function loadBoard() {
  const req = ++boardReq;
  $('#leaders-sub').textContent = period === 'week' ? `Customers served · resets in ${untilReset()}`
    : period === 'level' ? 'Highest level' : 'Customers served · all time';
  renderMe(null);
  $('#board-list').innerHTML = '';
  boardMessage('Fetching the scores...');
  try {
    const b = await online.board(period);
    if (req !== boardReq) return;
    renderMe(b);
    boardMessage(b.top.length ? '' : period === 'week' ? 'No customers served yet this week. Be the first on the board!' : 'No scores yet. Be the first on the board!');
    $('#board-list').innerHTML = b.top.map((r) => {
      const medal = r.rank <= 3 ? ` medal r${r.rank}` : '';
      return `<li class="row${r.me ? ' me' : ''}"><span class="row-rank${medal}">${r.rank}</span>`
        + `<span class="row-name"><b>${escapeHtml(r.name)}${r.me ? ' (you)' : ''}</b><small>${period === 'level' ? `${r.served ?? 0} customers served` : `Level ${r.level}`}</small></span>`
        + `<span class="row-score">${period === 'level' ? `Lv ${r.score}` : r.score}</span></li>`;
    }).join('');
  } catch {
    if (req !== boardReq) return;
    boardMessage("Can't reach the leaderboard right now. Check your internet connection.", true);
  }
}

function openLeaders() {
  sfx.pick();
  leadersEl.classList.remove('hidden');
  loadBoard();
}

$('#btn-leaders').addEventListener('click', openLeaders);
$('#btn-leaders-back').addEventListener('click', () => leadersEl.classList.add('hidden'));
leadersEl.querySelectorAll<HTMLButtonElement>('.tab').forEach((t) => t.addEventListener('click', () => {
  period = t.dataset.period as Period;
  leadersEl.querySelectorAll('.tab').forEach((o) => { o.classList.toggle('active', o === t); o.setAttribute('aria-selected', String(o === t)); });
  sfx.pick();
  loadBoard();
}));
// ------------------------------------------------------------------ fridge

const fridgeBtn = $('#btn-fridge');
const fridgeEl = $('#fridge');

function overFridge(x: number, y: number) {
  const r = fridgeBtn.getBoundingClientRect();
  return x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6;
}

function updateFridgeCount() {
  const n = state.fridge?.length ?? 0, max = fridgeSlots(state);
  const el = $('#fridge-count');
  el.textContent = `${n}/${max}`;
  el.classList.toggle('full', n >= max);
}

// Rewards that didn't fit on the board wait here and come out oldest first; the player can't put anything in.
const bagBtn = $('#btn-bag');

function updateRewardBag() {
  const bag = state.rewardBag ?? [], bagBtn = $('#btn-bag');
  bagBtn.classList.toggle('hidden', !bag.length);
  if (!bag.length) return;
  $<HTMLImageElement>('#bag-img').src = pieceArt(bag[0]);
  $('#bag-count').textContent = String(bag.length);
  bagBtn.setAttribute('aria-label', `Reward bag: ${bag.length} waiting. Tap to take out ${pieceName(bag[0])}`);
}

bagBtn.addEventListener('click', () => {
  const r = takeFromRewardBag(state);
  if (!r.ok) {
    sfx.error();
    if (r.reason === 'full') toast('The board is full! Merge or sell something first.');
    return;
  }
  sfx.spawn();
  renderCell(r.at, 'pop');
  restartAnim(bagBtn, 'bump');
  renderCustomers();
  renderBoard();
  persist();
});

/** Drop the dragged piece into the fridge. */
function doStore(i: number) {
  const p = state.board[i].piece;
  const r = storeInFridge(state, i);
  if (!r.ok) {
    sfx.error();
    renderCell(i, 'squish');
    toast(r.reason === 'full' ? 'Your fridge is full! Take something out or buy another slot.' : "That can't go in the fridge.");
    return;
  }
  sfx.pick();
  if (selected === i) select(-1);
  renderCell(i);
  fly(pieceArt(p!), center(cells[i]), center(fridgeBtn), { ms: 300, size: 40 }).then(() => restartAnim(fridgeBtn, 'bump'));
  renderCustomers();
  renderBoard();
  persist();
}

function renderFridge() {
  const fridge = state.fridge ?? [], max = fridgeSlots(state);
  $('#fridge-sub').textContent = `${fridge.length} of ${max} slots used`;
  let html = '';
  for (let k = 0; k < max; k++) {
    const p = fridge[k];
    html += p
      ? `<button class="fridge-slot" data-slot="${k}" aria-label="Take out ${pieceName(p)}${p.kind === 'gen' ? ` (level ${genLevel(p)})` : ''}"><img src="${pieceArt(p)}" alt=""></button>`
      : '<div class="fridge-slot"></div>';
  }
  if (max < FRIDGE_MAX_SLOTS) {
    html += `<button class="fridge-slot buy" data-buy aria-label="Buy another slot for ${fridgeSlotCost(state)} gems"><b>+</b><span><img src="${iconArt.gem()}" alt="gems">${fridgeSlotCost(state)}</span></button>`;
  }
  $('#fridge-grid').innerHTML = html;
}

function openFridge() {
  sfx.pick();
  renderFridge();
  revealWhenReady(fridgeEl);
}

fridgeBtn.addEventListener('click', openFridge);
$('#btn-fridge-back').addEventListener('click', () => fridgeEl.classList.add('hidden'));
$('#fridge-grid').addEventListener('click', async (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('button');
  if (!btn) return;
  if (btn.dataset.buy !== undefined) {
    const cost = fridgeSlotCost(state);
    if (fridgeSlots(state) < FRIDGE_MAX_SLOTS && state.gems >= cost && !await confirmGems(cost, 'Buy another fridge slot')) return;
    const r = buyFridgeSlot(state);
    if (!r.ok) {
      sfx.error();
      toast(r.reason === 'gems' ? `Need ${r.cost} gems for another slot.` : 'Your fridge is as big as it gets!');
      return;
    }
    sfx.levelUp();
    toast(`New fridge slot! (−${r.cost} gems)`);
  } else {
    const r = takeFromFridge(state, Number(btn.dataset.slot));
    if (!r.ok) {
      sfx.error();
      toast(r.reason === 'full' ? 'The board is full! Merge or sell something first.' : "Couldn't take that out.");
      return;
    }
    sfx.spawn();
    renderCell(r.at, 'pop');
    renderCustomers();
    renderBoard();
  }
  renderFridge();
  renderHud();
  persist();
});

// ------------------------------------------------------------------ daily quests

const questsEl = $('#quests');
/** Claimable count last shown, so a newly finished quest can be announced once. */
let questsReady = -1;

function questText(q: Quest): string {
  switch (q.kind) {
    case 'serve': return `Serve ${q.target} customers`;
    case 'merge': return `Merge ${q.target} times`;
    case 'cook': return `Cook ${q.target} ingredients`;
    case 'mergeHigh': return `Merge any item up to level ${q.level}`;
  }
}

function questIcon(q: Quest): string {
  switch (q.kind) {
    case 'serve': return customerImg('cat');
    case 'merge': return itemArt('drinks', 3);
    case 'cook': return generatorArt('bbq', 1);
    case 'mergeHigh': return itemArt('dessert', q.level ?? 4);
  }
}

function untilNewQuests() {
  const m = Math.ceil(msToNextDay() / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function updateQuestBadge() {
  const n = claimableQuests(state);
  $('#btn-quests').classList.toggle('ready', n > 0);
  updateMenuBadge();
  if (questsReady >= 0 && n > questsReady && questsEl.classList.contains('hidden')) {
    restartAnim(hubBtn, 'bump');
    toast('📝 Quest complete! Claim your reward.');
  }
  questsReady = n;
}

const reward = (coins: number, gems: number, energy = 0) =>
  `<span class="quest-reward">${coins ? `<img src="${iconArt.coin()}" alt="coins">${coins} ` : ''}`
  + `${gems ? `<img src="${iconArt.gem()}" alt="gems">${gems} ` : ''}${energy ? `<img src="${iconArt.energy()}" alt="energy">${energy}` : ''}</span>`;

function renderQuests() {
  const d = state.daily;
  if (!d) return;
  $('#quests-sub').textContent = `New quests in ${untilNewQuests()}`;
  $('#quest-list').innerHTML = d.quests.map((q, i) => {
    const done = questDone(q);
    const side = q.claimed ? '<span class="quest-check" aria-label="Claimed">✓</span>'
      : done ? `<button class="btn stroked" data-claim="${i}">Claim</button>` : '';
    return `<li class="task${q.claimed ? ' done' : done ? ' ready' : ''}"><img class="quest-ico" src="${questIcon(q)}" alt="">`
      + `<span class="quest-main"><b>${questText(q)}</b><span class="quest-bar"><i style="width:${(q.progress / q.target) * 100}%"></i><span class="stroked">${q.progress} / ${q.target}</span></span></span>`
      + `<span class="quest-side">${reward(q.coins, q.gems)}${side}</span></li>`;
  }).join('');
  const all = d.quests.every((q) => q.claimed);
  const bonus = $('#quest-bonus');
  bonus.className = `task quest-bonus${d.bonusClaimed ? ' done' : all ? ' ready' : ' locked'}`;
  bonus.innerHTML = `<img class="quest-ico" src="${iconArt.gem()}" alt="">`
    + `<span class="quest-main"><b>Finish every quest</b>${reward(0, DAILY_BONUS.gems, DAILY_BONUS.energy)}</span>`
    + `<span class="quest-side">${d.bonusClaimed ? '<span class="quest-check" aria-label="Claimed">✓</span>' : all ? '<button class="btn stroked" data-bonus>Open</button>' : ''}</span>`;
  renderWeekly();
}

function renderWeekly() {
  const w = weekly(state);
  const goal = WEEKLY_CHESTS[WEEKLY_CHESTS.length - 1].quests;
  const days = Math.ceil(msToNextWeek() / 86400000);
  $('#weekly-sub').textContent = `Resets in ${days > 1 ? `${days} days` : untilNewQuests()}`;
  $('#weekly-bar').innerHTML = `<i style="width:${Math.min(1, w.quests / goal) * 100}%"></i><span class="stroked">${Math.min(w.quests, goal)} / ${goal} quests this week</span>`;
  $('#weekly-list').innerHTML = WEEKLY_CHESTS.map((c, i) => {
    const opened = w.opened.includes(i);
    const ready = !opened && w.quests >= c.quests;
    const side = opened ? '<span class="quest-check" aria-label="Claimed">✓</span>'
      : ready ? `<button class="btn stroked" data-weekly="${i}">Open</button>` : '';
    return `<li class="task${opened ? ' done' : ready ? ' ready' : ' locked'}"><img class="quest-ico" src="${iconArt.gem()}" alt="">`
      + `<span class="quest-main"><b>Claim ${c.quests} quests</b>${reward(c.coins, c.gems, c.energy)}</span>`
      + `<span class="quest-side">${side}</span></li>`;
  }).join('');
}

function openQuests() {
  sfx.pick();
  if (ensureDaily(state)) persist();
  renderQuests();
  revealWhenReady(questsEl);
}

questsEl.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-claim], button[data-bonus], button[data-weekly]');
  if (!btn) return;
  const at = center(btn);
  if (btn.dataset.claim !== undefined) {
    const q = claimQuest(state, Number(btn.dataset.claim));
    if (!q) return;
    shower(at.x, at.y, ['#ffd147', '#7ee08e', '#fff']);
    floater(`+${q.coins}`, at.x, at.y - 20);
  } else if (btn.dataset.weekly !== undefined) {
    const c = claimWeeklyChest(state, Number(btn.dataset.weekly));
    if (!c) return;
    shower(at.x, at.y, ['#ff6fb8', '#ffd147', '#7ee08e', '#fff']);
    const got = [c.coins && `+${c.coins} coins`, c.gems && `+${c.gems} gems`, c.energy && `+${c.energy} energy`].filter(Boolean).join(', ');
    toast(`Weekly chest! ${got}`, true, 2000);
  } else {
    const b = claimDailyBonus(state);
    if (!b) return;
    shower(at.x, at.y, ['#ff6fb8', '#ffd147', '#fff']);
    toast(`Daily chest! +${b.gems} gems, +${b.energy} energy`, true, 2000);
  }
  sfx.levelUp();
  renderQuests();
  renderHud();
  persist();
});
$('#btn-quests').addEventListener('click', openQuests);
$('#btn-quests-back').addEventListener('click', () => questsEl.classList.add('hidden'));

// ------------------------------------------------------------------ profile & cloud save

const profileEl = $('#profile');

/** Swap in a different save (cloud or recovered) and redraw everything. */
function replaceState(next: GameState) {
  state = next;
  tickEnergy(state);
  save(state);
  customerEls.forEach((el) => el.remove());
  customerEls.clear();
  buildBoard();
  renderBoard();
  renderCustomers();
  renderHud();
  select(-1);
  layout();
  roomFor = '';
  updateScene();
  ensureDaily(state);
  questsReady = claimableQuests(state);
  updateQuestBadge();
  updateFridgeCount();
  updateRewardBag();
  showTutorial(state.tutorial ? tutorialStep(state) : null);
}

function ago(ms: number) {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s} seconds ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} minute${m === 1 ? '' : 's'} ago` : `${Math.round(m / 60)} hour(s) ago`;
}

function renderCloudStatus() {
  const c = online.cloud;
  $('#cloud-status').textContent = c.error
    ? "Couldn't reach the cloud. Your progress is safe on this device and will upload when you're back online."
    : c.savedAt ? `Saved to the cloud ${ago(c.savedAt)}.` : 'Your progress uploads to the cloud automatically as you play.';
}
online.onCloudChange = () => { if (!profileEl.classList.contains('hidden')) renderCloudStatus(); };

function renderProfile() {
  $('#profile-name').textContent = online.name;
  $<HTMLInputElement>('#rename-input').value = online.name;
  renderCloudStatus();
  const code = online.code;
  $('#code-box').classList.toggle('hidden', !code);
  $('#code-text').textContent = code ?? '';
  $('#btn-new-code').textContent = code ? 'Make a new code' : 'Create my recovery code';
  $('#code-confirm').classList.add('hidden');
  $('#restore-confirm').classList.add('hidden');
  $('#reset-confirm').classList.add('hidden');
}

function openProfile() {
  sfx.pick();
  profileEl.classList.remove('hidden');
  renderProfile();
}

async function makeCode() {
  try {
    const code = await online.newCode();
    sfx.levelUp();
    renderProfile();
    toast(`Your recovery code: ${code}`, false, 2200);
  } catch {
    sfx.error();
    toast("Couldn't create a code. Check your connection and try again.");
  }
}

$('#hud-level').addEventListener('click', openProfile);
$('#btn-profile').addEventListener('click', openProfile);
$('#btn-profile-from-board').addEventListener('click', () => { leadersEl.classList.add('hidden'); openProfile(); });
$('#btn-profile-back').addEventListener('click', () => profileEl.classList.add('hidden'));
$('#rename-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $<HTMLInputElement>('#rename-input');
  input.blur();
  if (input.value.trim().replace(/\s+/g, ' ') === online.name) return;
  try {
    await online.rename(input.value);
    sfx.pick();
    input.value = online.name;
    $('#profile-name').textContent = online.name;
    toast(`You are now ${online.name}`);
  } catch (err) {
    sfx.error();
    toast(err instanceof Error && err.message.startsWith('Names') ? err.message : "Couldn't save your name. Check your connection.");
  }
});
$('#btn-save-now').addEventListener('click', () => {
  state.savedAt = Date.now();
  save(state);
  online.cloudSave(state, true);
  $('#cloud-status').textContent = 'Saving...';
});
$('#btn-new-code').addEventListener('click', () => {
  if (online.code) $('#code-confirm').classList.remove('hidden');
  else makeCode();
});
$('#btn-new-code-yes').addEventListener('click', makeCode);
$('#btn-copy-code').addEventListener('click', async () => {
  const code = online.code ?? '';
  try {
    await navigator.clipboard.writeText(code);
    toast('Code copied');
  } catch {
    const range = document.createRange();
    range.selectNodeContents($('#code-text'));
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
    toast('Code selected. Copy it from here.');
  }
});

$('#restore-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = $<HTMLInputElement>('#restore-input').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length !== 16) {
    sfx.error();
    toast('Recovery codes have 16 letters and numbers, like ABCD-EFGH-JKLM-NPQR.');
    return;
  }
  $('#restore-loss').textContent = state.served > 0 || state.tasksDone.length
    ? `Your current game here (level ${state.level}, ${state.served} customers served) will be replaced.`
    : '';
  $('#restore-confirm').classList.remove('hidden');
});
$('#btn-restore-no').addEventListener('click', () => $('#restore-confirm').classList.add('hidden'));
$('#btn-restore-yes').addEventListener('click', async () => {
  const code = $<HTMLInputElement>('#restore-input').value;
  try {
    const res = await online.recover(code);
    const next = validateSave(res.save);
    if (next) replaceState(next);
    $<HTMLInputElement>('#restore-input').value = '';
    renderProfile();
    sfx.levelUp();
    toast(next ? `Welcome back, ${online.name}!` : `Linked to ${online.name}. No cloud save was found yet.`, true, 2200);
  } catch (err) {
    sfx.error();
    toast(err instanceof Error && err.message.includes('not found') ? 'That recovery code was not found. Check it and try again.' : "Couldn't restore. Check your connection and try again.");
  }
});

$('#btn-reset').addEventListener('click', () => {
  $('#reset-loss').textContent = `level ${state.level}, ${state.served} customers served, chapter ${Math.min(state.chapter + 1, CHAPTERS.length)}`;
  $('#reset-code-note').textContent = online.code
    ? `Your old game stays in the cloud: recovery code ${online.code} still brings it back.`
    : "You have no recovery code, so the old game can't be brought back.";
  $('#reset-confirm').classList.remove('hidden');
});
$('#btn-reset-no').addEventListener('click', () => $('#reset-confirm').classList.add('hidden'));
$('#btn-reset-yes').addEventListener('click', () => {
  online.reset();
  replaceState(newGame());
  // Hold the tutorial until Chef Pip has said hello.
  showTutorial(null);
  const ch = CHAPTERS[0];
  state.storySeen.push(`${ch.id}-intro`);
  persist();
  renderProfile();
  profileEl.classList.add('hidden');
  sfx.levelUp();
  toast(`A fresh start! Welcome, ${online.name}.`, true, 2200);
  setTimeout(() => tell(introLines(ch.intro)), 600);
});

/** On startup, use the cloud save if it is newer than this device's (e.g. played on another device). */
async function syncFromCloud() {
  try {
    const c = await online.cloudLoad();
    if (!c?.save || !c.save_at) return;
    if (c.save_at <= (state.savedAt ?? 0) + 1000) return;
    const next = validateSave(c.save);
    if (!next) return;
    replaceState(next);
    toast('Loaded your newer progress from the cloud');
  } catch { /* offline: keep playing locally */ }
}

// ------------------------------------------------------------------ version & updates

const VERSION_LABEL = `v${__APP_VERSION__} · ${__APP_BUILD__}`;

$('#about-version').textContent = `Sunny Spoon ${VERSION_LABEL}`;
$('#about-built').textContent = `Released ${new Date(__APP_DATE__).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;

/**
 * Compare this build with version.json on the server (written by each
 * deploy). Shows the update banner when a newer release is live.
 */
async function checkForUpdate(manual = false) {
  const status = $('#update-status');
  if (manual) status.textContent = 'Checking for updates...';
  try {
    const res = await fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const live = await res.json() as { version: string; build: string };
    const newer = live.build !== __APP_BUILD__;
    $('#update-banner').classList.toggle('hidden', !newer);
    status.textContent = newer
      ? `A newer version (v${live.version} · ${live.build}) is available. Tap the banner at the top to update.`
      : "You're playing the latest version.";
  } catch {
    status.textContent = "Couldn't check for updates (this works on the game's website).";
  }
}

$('#update-banner').addEventListener('click', () => location.reload());
$('#btn-check-update').addEventListener('click', () => checkForUpdate(true));
setTimeout(checkForUpdate, 3000);
setInterval(checkForUpdate, 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });

// ------------------------------------------------------------------ story

interface StoryLine { text: string; extra?: string; then?: () => void }
const storyQueue: StoryLine[] = [];
let storyThen: (() => void) | undefined;

/** Queue lines for Chef Pip to say, one card at a time. */
function tell(lines: (string | StoryLine)[]) {
  for (const l of lines) storyQueue.push(typeof l === 'string' ? { text: l } : l);
  if ($('#story').classList.contains('hidden')) nextStory();
}

function nextStory() {
  storyThen?.();
  storyThen = undefined;
  const n = storyQueue.shift();
  const box = $('#story');
  if (!n) { box.classList.add('hidden'); return; }
  $('#story-name').textContent = MENTOR;
  const text = $('#story-text');
  text.textContent = n.text;
  if (n.extra) {
    const r = document.createElement('span');
    r.className = 'story-reward';
    r.textContent = n.extra;
    text.appendChild(r);
  }
  storyThen = n.then;
  $('#story-next').textContent = storyQueue.length ? 'Next' : 'Continue';
  box.classList.remove('hidden');
  restartAnim(box.querySelector('.story-card')!, 'story-card');
  sfx.pick();
}

$('#story-next').addEventListener('click', nextStory);

// ------------------------------------------------------------------ tutorial

// First-time players get a short guided tour: merge three drinks, then five
// desserts. Only the pointed-at drag works until it is done or skipped.
const tutEl = $('#tutorial');
const handEl = $('#tut-hand');
let tut: TutorialStep | null = null;

function showTutorial(step: TutorialStep | null) {
  cells.forEach((c) => c.classList.remove('tut-from', 'tut-to', 'tut-group'));
  tut = step;
  document.body.classList.toggle('tutorial', !!step);
  tutEl.classList.toggle('hidden', !step);
  handEl.classList.toggle('hidden', !step);
  if (!step) return;
  const name = pieceName(step.piece).toLowerCase();
  const others = step.count - 1;
  $('#tut-title').textContent = step.count > 3 ? `Merge ${step.count} for a bonus!` : `Merge ${step.count} to cook!`;
  $('#tut-text').textContent = step.count > 3
    ? `Drag the ${name} next to the other ${others}. Five of a kind make TWO!`
    : `Drag the ${name} next to the other ${others}. Three of a kind make one better dish.`;
  for (const i of step.setup) cells[i].classList.add('tut-group');
  cells[step.from].classList.add('tut-from');
  cells[step.to].classList.add('tut-to');
  $<HTMLImageElement>('#tut-hand-item').src = pieceArt(step.piece);
  restartAnim(tutEl.firstElementChild!, 'tut-card');
  placeHand();
}

/** Point the hand from the item to drag to where it goes (redone on every layout). */
function placeHand() {
  if (!tut || !cells[tut.from]) return;
  const a = center(cells[tut.from]);
  const b = center(cells[tut.to]);
  handEl.style.setProperty('--x0', `${a.x}px`);
  handEl.style.setProperty('--y0', `${a.y}px`);
  handEl.style.setProperty('--x1', `${b.x}px`);
  handEl.style.setProperty('--y1', `${b.y}px`);
}

function startTutorial() {
  const had = state.tutorial;
  const step = tutorialStep(state);
  if (had) persist(false);
  if (step) for (const i of step.setup) renderCell(i);
  showTutorial(step);
}

function tutorialMerged() {
  const step = advanceTutorial(state);
  persist();
  if (step) {
    for (const i of step.setup) renderCell(i, 'pop');
    sfx.pick();
    select(-1);
    showTutorial(step);
    return;
  }
  showTutorial(null);
  tell([
    'Well done, chef! Three of a kind make one better dish, and five make two.',
    'Now tap a kitchen station, then tap it again to cook. Merge up what your customers order and serve them!',
  ]);
}

/** A chapter intro; a new player's tutorial starts once Chef Pip has said hello. */
function introLines(intro: string[]): (string | StoryLine)[] {
  if (!state.tutorial) return intro;
  return [...intro, { text: 'First, let me show you how to cook. Watch my paw!', then: startTutorial }];
}

$('#btn-tut-skip').addEventListener('click', () => {
  skipTutorial(state);
  persist();
  showTutorial(null);
});

// ------------------------------------------------------------------ boot

// ------------------------------------------------------------------ lucky wheel

const wheelEl = $('#wheel');
const wheelDisc = $('#wheel-disc');
const SLICE = 360 / WHEEL.length;
const WHEEL_COLORS = ['#ff6fb8', '#ffb43c', '#6fb8ff', '#7ee08e'];
/** The disc's total rotation so far (degrees), so each spin keeps turning the same way. */
let wheelTurn = 0;
let spinning = false;

function buildWheel() {
  wheelDisc.style.background = `conic-gradient(${WHEEL.map((_, k) => `${WHEEL_COLORS[k % WHEEL_COLORS.length]} ${k * SLICE}deg ${(k + 1) * SLICE}deg`).join(', ')})`;
  wheelDisc.innerHTML = WHEEL.map((w, k) => `<span class="wheel-label stroked" style="transform: rotate(${(k + 0.5) * SLICE}deg)">`
    + `<img src="${w.gems ? iconArt.gem() : iconArt.energy()}" alt="${w.gems ? 'gems' : 'energy'}">${w.gems || w.energy}</span>`).join('');
}

function renderWheel() {
  const n = spinsLeft(state);
  $('#wheel-sub').textContent = n ? `${n} of ${SPINS_PER_DAY} spins left today` : `No spins left · new spins in ${untilNewQuests()}`;
  $<HTMLButtonElement>('#btn-spin').disabled = spinning || n <= 0;
}

function openWheel() {
  sfx.pick();
  if (!wheelDisc.childElementCount) buildWheel();
  renderWheel();
  revealWhenReady(wheelEl);
}

$('#btn-spin').addEventListener('click', () => {
  if (spinning) return;
  const r = spinWheel(state);
  if (!r) { sfx.error(); renderWheel(); return; }
  spinning = true;
  persist();
  sfx.pick();
  // Turn at least five full times, ending with the winning slice under the pointer.
  const stop = 360 - (r.slice + 0.5) * SLICE;
  wheelTurn += 360 * 5 + ((stop - wheelTurn) % 360 + 360) % 360;
  wheelDisc.style.transform = `rotate(${wheelTurn}deg)`;
  renderWheel();
  const done = () => {
    if (!spinning) return;
    spinning = false;
    sfx.levelUp();
    const at = center(wheelDisc);
    shower(at.x, at.y, ['#ffd147', '#ff6fb8', '#fff']);
    toast(r.prize.gems ? `+${r.prize.gems} gems!` : `+${r.prize.energy} energy!`, true, 1600);
    renderWheel();
    renderHud();
    if (inHub()) renderHub();
  };
  // Without a transition (e.g. reduced motion) there is no transitionend.
  if (getComputedStyle(wheelDisc).transitionDuration === '0s') done();
  else {
    // Closing the panel mid-spin cancels the transition; the prize is already paid either way.
    wheelDisc.addEventListener('transitionend', done, { once: true });
    wheelDisc.addEventListener('transitioncancel', done, { once: true });
  }
});
$('#btn-wheel').addEventListener('click', openWheel);
$('#btn-wheel-back').addEventListener('click', () => wheelEl.classList.add('hidden'));

// ------------------------------------------------------------------ gem confirm

const gemConfirmEl = $('#gem-confirm');
let gemAnswer: ((yes: boolean) => void) | null = null;

/** Ask before spending gems. Resolves true if the player agrees. */
function confirmGems(cost: number, what: string): Promise<boolean> {
  gemAnswer?.(false);
  $('#gem-confirm-text').textContent = `${what} for ${cost} gem${cost === 1 ? '' : 's'}? You have ${state.gems}.`;
  $('#btn-gem-yes').innerHTML = `Spend <img class="btn-ico" src="${iconArt.gem()}" alt="gems">${cost}`;
  gemConfirmEl.classList.remove('hidden');
  $('#btn-gem-yes').focus();
  return new Promise((resolve) => { gemAnswer = resolve; });
}

function answerGems(yes: boolean) {
  gemConfirmEl.classList.add('hidden');
  const done = gemAnswer;
  gemAnswer = null;
  done?.(yes);
}

$('#btn-gem-yes').addEventListener('click', () => answerGems(true));
$('#btn-gem-no').addEventListener('click', () => answerGems(false));
// Tapping outside the card cancels.
gemConfirmEl.addEventListener('click', (e) => { if (e.target === gemConfirmEl) answerGems(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && gemAnswer) answerGems(false); });

// ------------------------------------------------------------------ daily check-in

const checkinEl = $('#checkin');

const rewardText = (r: { coins: number; gems: number; energy: number }) =>
  [r.coins && `+${r.coins} coins`, r.gems && `+${r.gems} gems`, r.energy && `+${r.energy} energy`].filter(Boolean).join(', ');

function renderCheckIn() {
  const now = new Date();
  const today = checkedInToday(state);
  const streak = checkInStreak(state);
  $('#checkin-sub').textContent = streak ? `${streak} day streak${today ? ' · see you tomorrow' : ''}` : 'Start a streak today';
  // The 7-day ladder: days already earned in this streak, and the next one.
  const next = today ? streak : streak + 1;
  $('#streak-list').innerHTML = CHECKIN_REWARDS.map((r, k) => {
    const n = k + 1;
    const cls = n < next || (today && n === next) ? 'got' : n === Math.min(next, CHECKIN_REWARDS.length) && !today ? 'next' : '';
    const top = r.gems ? `<img src="${iconArt.gem()}" alt="gems">${r.gems}` : r.energy ? `<img src="${iconArt.energy()}" alt="energy">${r.energy}` : `<img src="${iconArt.coin()}" alt="coins">${r.coins}`;
    return `<li class="${cls}"><small>Day ${n}${n === CHECKIN_REWARDS.length ? '+' : ''}</small>${top}</li>`;
  }).join('');
  const btn = $<HTMLButtonElement>('#btn-checkin-today');
  btn.disabled = today;
  btn.textContent = today ? 'Checked in ✓' : `Check in · day ${next}`;
  btn.title = today ? '' : rewardText(checkInReward(next));

  // This month's calendar, weeks starting on Monday.
  const y = now.getFullYear(), m = now.getMonth();
  $('#cal-month').textContent = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const cost = makeUpCost(state);
  const missed = new Set(missedDays(state));
  const freeLeft = cost ? 0 : FREE_MAKEUPS - (state.checkin?.month === dayKey().slice(0, 7) ? state.checkin.free : 0);
  $('#cal-makeups').textContent = missed.size ? (cost ? `Make-ups cost ${cost} gems` : `${freeLeft} free make-up${freeLeft === 1 ? '' : 's'} left`) : '';
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  let html = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="dow">${d}</span>`).join('') + '<span></span>'.repeat(lead);
  for (let d = 1; d <= days; d++) {
    const key = dayKey(new Date(y, m, d, 12).getTime());
    const isToday = d === now.getDate();
    if (checkedIn(state, key)) html += `<span class="cal-day done${isToday ? ' today' : ''}">${d}</span>`;
    else if (missed.has(key)) {
      html += `<button class="cal-day missed" data-day="${key}" aria-label="Make up day ${d}${cost ? ` for ${cost} gems` : ' for free'}">${d}`
        + `<small>${cost ? `<img src="${iconArt.gem()}" alt="">${cost}` : 'free'}</small></button>`;
    } else html += `<span class="cal-day${isToday ? ' today' : ' future'}">${d}</span>`;
  }
  $('#cal').innerHTML = html;
}

function openCheckIn() {
  sfx.pick();
  renderCheckIn();
  revealWhenReady(checkinEl);
}

$('#btn-checkin-today').addEventListener('click', (e) => {
  const r = checkIn(state);
  if (!r) return;
  const at = center(e.currentTarget as Element);
  shower(at.x, at.y, ['#ffd147', '#7ee08e', '#fff']);
  sfx.levelUp();
  toast(`Day ${r.streak}! ${rewardText(r.reward)}`, true, 2000);
  afterCheckIn();
});

$('#cal').addEventListener('click', async (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-day]');
  if (!btn) return;
  const cost = makeUpCost(state);
  if (cost && state.gems >= cost && !await confirmGems(cost, `Make up ${btn.getAttribute('aria-label')?.match(/day \d+/)?.[0] ?? 'this day'}`)) return;
  const r = makeUpDay(state, btn.dataset.day!);
  if (!r.ok) {
    sfx.error();
    if (r.reason === 'gems') toast(`Not enough gems (${r.cost} needed)`);
    return;
  }
  const at = center(btn);
  shower(at.x, at.y, ['#7ee08e', '#fff']);
  sfx.pick();
  toast(`Day made up${r.cost ? ` for ${r.cost} gems` : ''}! ${rewardText(r.reward)}`, true, 1800);
  afterCheckIn();
});

function afterCheckIn() {
  renderCheckIn();
  renderHud();
  persist();
}

$('#btn-checkin').addEventListener('click', openCheckIn);
$('#btn-checkin-back').addEventListener('click', () => checkinEl.classList.add('hidden'));

// Tapping empty space on a full-screen panel (the dimmed backdrop, the gaps between
// cards, the header) works like its back button. Taps on cards and controls don't.
for (const [panel, back] of [['#diner', '#btn-back'], ['#leaders', '#btn-leaders-back'], ['#quests', '#btn-quests-back'], ['#profile', '#btn-profile-back'], ['#fridge', '#btn-fridge-back'], ['#details', '#btn-details-back'], ['#wheel', '#btn-wheel-back'], ['#checkin', '#btn-checkin-back']]) {
  $(panel).addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t === e.currentTarget || t.matches('.sheet-inner, .sheet-head, .sheet-title, .sheet-title > *, .fridge-hint')) $(back).click();
  });
}

async function boot() {
  await loadArtOverrides();
  updateScene();
  document.querySelectorAll<HTMLImageElement>('img[data-icon]').forEach((img) => {
    img.src = iconArt[img.dataset.icon as keyof typeof iconArt]();
  });

  buildBoard();
  renderBoard();
  renderHud();
  renderCustomers();
  select(-1);
  layout();
  // Relayout when the screen changes (rotation, browser toolbars) or a panel changes height.
  const ro = new ResizeObserver(queueLayout);
  ro.observe($('#app'));
  ro.observe($('#info'));
  document.fonts?.ready.then(layout);

  ensureDaily(state);
  questsReady = claimableQuests(state);
  updateQuestBadge();
  updateFridgeCount();
  updateRewardBag();

  setInterval(() => {
    // Energy refilling on its own is not a player change.
    if (tickEnergy(state)) { renderHud(); persist(false); } else updateTimer();
    // New quests at midnight.
    if (ensureDaily(state)) { questsReady = 0; persist(); }
    if (!questsEl.classList.contains('hidden')) $('#quests-sub').textContent = `New quests in ${untilNewQuests()}`;
    if (inHub()) renderHub();
  }, 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    save(state);
    online.cloudSave(state, true);
  });

  syncFromCloud();

  // Catch up on customers served while offline.
  if (state.served > 0) online.submit(state.served, state.level);

  $<HTMLImageElement>('#story-chef').src = iconArt.chef();
  // Play the current chapter's intro once (also for players who finished
  // the previous chapter before this one existed).
  const ch = CHAPTERS[state.chapter];
  if (ch && !state.storySeen.includes(`${ch.id}-intro`)) {
    state.storySeen.push(`${ch.id}-intro`);
    persist();
    setTimeout(() => tell(introLines(ch.intro)), 500);
  } else if (state.tutorial) startTutorial();
}

boot();
