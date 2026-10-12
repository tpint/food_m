import './style.css';
import { CHAINS, ElementId, GEN_LEVELS, GENERATORS, isElement, MAX_ENERGY, SPAWN_COST, maxLevel, xpForLevel } from './game/config';
import {
  GameState, MERGE_COUNT, Monster, Piece, canUpgrade, currentTask, restore, cast, collect, findSpell, genLevel, isWanted, load, movePiece, msToNextEnergy,
  newGame, save, sell, sellValue, spawnFrom, tickEnergy, upgradeGen, validateSave,
} from './game/state';
import { iconArt, itemArt, loadArtOverrides, monsterImg, pieceArt } from './render/art';
import { burst, elementHit, elementTrail, puff, shower, trail } from './render/fx';
import { sceneArt, webArt } from './render/scene';
import { magicCircle } from './render/circle';
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

/** Shake the whole game; `px` is the strongest offset. */
function shake(px: number) {
  const app = $('#app');
  app.style.setProperty('--shake', `${px}px`);
  restartAnim(app, 'shake');
}

/** Full-screen tinted flash for big spells. */
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
function fly(src: string, from: { x: number; y: number }, to: { x: number; y: number }, opts: { ms?: number; color?: string; size?: number; delay?: number; trailFn?: (x: number, y: number) => void } = {}) {
  const { ms = 550, color = '#fff', size, delay = 0, trailFn } = opts;
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
        if (trailFn) trailFn(x, y); else trail(x, y, color);
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

function layout() {
  const app = $('#app');
  const wrap = $('#board-wrap');
  document.documentElement.style.setProperty('--mon-extra', '0px');
  const gap = 2, pad = 30; // grid gap; board padding + frame on both sides
  const availW = app.clientWidth - 20 - pad;
  // Height left for the board once everything else is laid out.
  const others = [...app.children].filter((c) => c !== wrap).reduce((h, c) => h + (c as HTMLElement).offsetHeight, 0);
  const availH = app.clientHeight - others - 8 * (app.children.length) - pad - 20;
  const size = Math.floor(Math.min((availW - gap * (state.cols - 1)) / state.cols, (availH - gap * (state.rows - 1)) / state.rows, 72));
  document.documentElement.style.setProperty('--cell', `${Math.max(30, size)}px`);
  // Monster cards scale with --cell, so settle once more.
  requestAnimationFrame(() => {
    const others2 = [...app.children].filter((c) => c !== wrap).reduce((h, c) => h + (c as HTMLElement).offsetHeight, 0);
    const h2 = app.clientHeight - others2 - 8 * app.children.length - pad - 20;
    const s2 = Math.floor(Math.min((availW - gap * (state.cols - 1)) / state.cols, (h2 - gap * (state.rows - 1)) / state.rows, 72));
    document.documentElement.style.setProperty('--cell', `${Math.max(30, s2)}px`);
    // Give leftover height to the monster portraits instead of a dead gap.
    requestAnimationFrame(() => {
      const spare = wrap.clientHeight - boardEl.offsetHeight - 12;
      const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mon-extra')) || 0;
      document.documentElement.style.setProperty('--mon-extra', `${Math.max(0, Math.min(70, cur + spare))}px`);
    });
  });
}

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
  el.classList.toggle('veiled', c.lock === 1);
  el.classList.toggle('sealed', c.lock === 2);
  const p = c.piece;
  const key = p ? (p.kind === 'gen' ? `g${p.gen}${genLevel(p)}` : `${p.chain}${p.level}`) : '';
  if (key !== cellKeys[i]) {
    cellKeys[i] = key;
    el.innerHTML = !p ? '' : p.kind === 'gen'
      ? `<div class="piece gen lv${genLevel(p)}"><img src="${pieceArt(p)}" alt=""><span class="gen-lv stroked">${genLevel(p)}</span></div>`
      : `<div class="piece"><img src="${pieceArt(p)}" alt=""><span class="check"></span></div>`;
  }
  const pe = el.firstElementChild;
  if (pe) {
    pe.classList.toggle('want', !c.lock && isWanted(state, p));
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
  updateTowerBadge();
  // Keep the Upgrade button in sync with coins / level.
  if (selected >= 0 && state.board[selected]?.piece?.kind === 'gen') select(selected);
}

function updateTimer() {
  const ms = msToNextEnergy(state);
  const t = $('#hud-energy .timer');
  if (state.energy >= MAX_ENERGY || !ms) t.textContent = '';
  else t.textContent = `+1 in ${Math.ceil(ms / 1000)}s`;
}

// ------------------------------------------------------------------ monsters

const monsterEls = new Map<number, HTMLElement>();
const dyingIds = new Set<number>();

function monsterCard(m: Monster): HTMLElement {
  const el = document.createElement('div');
  el.className = `monster enter${m.boss ? ' boss' : ''}`;
  el.dataset.id = String(m.id);
  el.innerHTML = `
    <div class="portrait"><img src="${monsterImg(m.kind)}" alt=""></div>
    <div class="name">${m.name}</div>
    <div class="hp">${m.needs.map(() => '<span class="seg"></span>').join('')}</div>
    <div class="needs">${m.needs.map((n) => `<div class="need" data-chain="${n.chain}" data-level="${n.level}"><img src="${itemArt(n.chain, n.level)}" alt=""><span class="check"></span></div>`).join('')}</div>
    <div class="reward"><img src="${iconArt.coin()}" alt="">${m.coins} <img src="${iconArt.gstar()}" alt="stars">${m.stars ?? 1}${m.gems ? ` <img src="${iconArt.gem()}" alt="">${m.gems}` : ''}</div>
    <button class="cast stroked">Cast!</button>`;
  el.querySelector('.cast')!.addEventListener('click', (e) => { e.stopPropagation(); doCast(m.id); });
  el.querySelector('.portrait')!.addEventListener('click', () => showMonsterInfo(m));
  setTimeout(() => el.classList.remove('enter'), 600);
  return el;
}

function renderMonsters() {
  const wrap = $('#monsters');
  const ids = new Set(state.monsters.map((m) => m.id));
  for (const [id, el] of monsterEls) {
    if (!ids.has(id) && !dyingIds.has(id)) { el.remove(); monsterEls.delete(id); }
  }
  state.monsters.forEach((m, i) => {
    let el = monsterEls.get(m.id);
    if (!el) {
      el = monsterCard(m);
      monsterEls.set(m.id, el);
    }
    if (wrap.children[i] !== el && !dyingIds.size) wrap.insertBefore(el, wrap.children[i] ?? null);
    // Mark which needs are on the board.
    const used = new Set<number>();
    el.querySelectorAll<HTMLElement>('.need').forEach((n) => {
      const chain = n.dataset.chain, level = Number(n.dataset.level);
      const at = state.board.findIndex((c, j) => !used.has(j) && !c.lock && c.piece?.kind === 'item' && c.piece.chain === chain && c.piece.level === level);
      if (at >= 0) used.add(at);
      n.classList.toggle('have', at >= 0);
    });
    el.classList.toggle('ready', !!findSpell(state, m));
  });
}

function showMonsterInfo(m: Monster) {
  setInfo(monsterImg(m.kind), m.name, `Weak to: ${m.needs.map((n) => CHAINS[n.chain].levels[n.level - 1]).join(' + ')}. Gather them on the board, then Cast!`);
}

async function doCast(id: number) {
  const m = state.monsters.find((x) => x.id === id);
  const el = monsterEls.get(id);
  if (!m || !el) return;
  const cellsUsed = findSpell(state, m);
  if (!cellsUsed) return;

  // Capture art + positions before the state changes.
  const flights = cellsUsed.map((i) => {
    const p = state.board[i].piece as Extract<Piece, { kind: 'item' }>;
    return { src: pieceArt(p), from: center(cells[i]), color: pieceColor(p), chain: p.chain, level: p.level, cell: i };
  });
  const res = cast(state, id);
  if (!res) return;
  dyingIds.add(id);
  select(-1);

  const target = center(el.querySelector('.portrait')!);
  const segs = el.querySelectorAll('.hp .seg');
  const cell = cells[0].offsetWidth;
  const boardBox = boardEl.getBoundingClientRect();
  const frame = boardEl.clientLeft;
  await Promise.all(flights.map((f, k) => new Promise<void>((done) => {
    setTimeout(() => {
      // Charge: an arcane circle draws itself under the item while it levitates.
      const charge = 380 + f.level * 90;
      const piece = cells[f.cell].firstElementChild;
      piece?.classList.add('charging');
      const circle = isElement(f.chain)
        ? magicCircle(boardEl, f.chain, f.from.x - boardBox.left - frame, f.from.y - boardBox.top - frame, f.level, cell, charge)
        : null;
      sfx.charge(f.level, charge);
      setTimeout(() => {
        circle?.release();
        renderCell(f.cell);
        sfx.cast();
        fly(f.src, f.from, target, {
          ms: 520, color: f.color,
          // Bigger spells fly bigger.
          size: cell * (0.8 + f.level * 0.1),
          trailFn: isElement(f.chain) ? (x, y) => elementTrail(f.chain as ElementId, x, y, f.level) : undefined,
        }).then(() => {
          if (isElement(f.chain)) {
            const fx = elementHit(f.chain, target.x, target.y, f.level);
            sfx.element(f.chain, f.level);
            if (fx.shake) shake(fx.shake);
            if (fx.flash) flash(fx.flash, f.level);
          } else {
            burst(target.x, target.y, f.color, 0.7);
          }
          segs[k]?.classList.add('lost');
          restartAnim(el, 'hit');
          done();
        });
      }, charge);
    }, k * 240);
  })));
  // Let the biggest effect play out before the monster vanishes.
  await new Promise((r) => setTimeout(r, 200 + Math.max(...flights.map((f) => f.level)) * 90));

  sfx.defeat();
  el.classList.add('dying');
  shower(target.x, target.y, m.boss ? ['#ffcf4a', '#ff8a3c', '#fff'] : ['#ffd147', '#b98cff', '#fff']);
  floater(`+${res.monster.coins}`, target.x, target.y - 20);

  online.submit(state.defeated, state.level);

  // A star flies to the Tower button.
  fly(iconArt.gstar(), target, center($('#btn-tower img')), { ms: 700, delay: 250, color: '#ffd23c', size: 30 })
    .then(() => { restartAnim($('#btn-tower'), 'bump'); updateTowerBadge(); });

  // Coins fly to the HUD.
  const hudCoin = center($('#hud-coins img'));
  const n = Math.min(8, 3 + Math.floor(res.monster.coins / 10));
  for (let k = 0; k < n; k++) {
    fly(iconArt.coin(), { x: target.x + (Math.random() - 0.5) * 40, y: target.y }, hudCoin, { ms: 600, delay: 150 + k * 60, color: '#ffd147', size: 26 })
      .then(() => { if (k % 2 === 0) sfx.coin(); });
  }
  setTimeout(() => {
    renderHud();
    dyingIds.delete(id);
    el.remove();
    monsterEls.delete(id);
    renderMonsters();
    renderBoard();
    if (res.levelUp) {
      sfx.levelUp();
      toast(`✨ Level ${state.level}! ✨\nMana refilled, +3 gems`, true, 2200);
      const lv = center($('#hud-level'));
      shower(lv.x, lv.y, ['#7fd0ff', '#b98cff', '#fff']);
    }
  }, 750);
  persist();
}

// ------------------------------------------------------------------ info bar

let selected = -1;

function setInfo(img: string | null, title: string, desc: string, action?: { label: string; fn: () => void; off?: boolean }) {
  const im = $<HTMLImageElement>('#info-img');
  if (img) im.src = img; else im.removeAttribute('src');
  $('#info-title').textContent = title;
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
  if (i < 0) {
    setInfo(iconArt.hat(), 'Defeat the monsters!', 'Merge items to brew the magic each monster is weak to.');
    return;
  }
  cells[i].classList.add('selected');
  const c = state.board[i];
  const p = c.piece;
  if (!p) return;
  const name = pieceName(p);

  if (c.lock === 2) return setInfo(null, 'Sealed by shadow', 'Merge items next to it to lift the seal.');
  if (c.lock === 1) return setInfo(pieceArt(p), `${name} (veiled)`, 'Drag a matching item onto it to free it!');

  if (p.kind === 'gen') {
    const def = GENERATORS[p.gen];
    const gl = genLevel(p);
    const lv = GEN_LEVELS[gl - 1];
    const top = CHAINS[def.chain].levels[lv.odds.length - 1];
    const free = lv.freeChance ? ` ${Math.round(lv.freeChance * 100)}% free conjure.` : '';
    const desc = `Tap again to conjure (⚡${SPAWN_COST}). Drops up to ${top}.${free}`;
    const up = canUpgrade(state, i);
    if (!up.ok && up.reason === 'max') return setInfo(pieceArt(p), `${def.name} · Lv ${gl} (max)`, desc);
    const cost = up.ok ? up.cost : up.cost!;
    return setInfo(pieceArt(p), `${def.name} · Lv ${gl}`, desc,
      { label: `Upgrade <img class="btn-ico" src="${iconArt.coin()}" alt="coins">${cost}`, fn: () => doUpgrade(i), off: !up.ok });
  }

  const def = CHAINS[p.chain];
  const max = maxLevel(p.chain);
  const next = p.level < max ? `Merge ${MERGE_COUNT} → ${def.levels[p.level]}` : 'Max level!';
  const title = `${name} · Lv ${p.level}`;
  if (def.collect) {
    const amt = def.collect.amounts[p.level - 1];
    const what = def.collect.resource === 'coins' ? `${amt} coins` : `${amt} mana`;
    return setInfo(pieceArt(p), title, `${next}. Tap again to collect ${what}.`, { label: 'Collect', fn: () => doCollect(i) });
  }
  const v = sellValue(p);
  setInfo(pieceArt(p), title, `${next}.${isWanted(state, p) ? ' A monster is weak to this!' : ''}`, v ? { label: `Sell +${v}`, fn: () => doSell(i) } : undefined);
}

// ------------------------------------------------------------------ actions

function doSpawn(i: number) {
  const r = spawnFrom(state, i);
  if (!r.ok) {
    sfx.error();
    restartAnim(cells[i].firstElementChild!, 'squish');
    toast(r.reason === 'energy' ? 'Out of mana! Wait or collect Mana items.' : 'The board is full! Merge or sell items.');
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
    renderMonsters();
  });
  renderHud();
  persist();
}

function doUpgrade(i: number) {
  const r = upgradeGen(state, i);
  if (!r.ok) {
    sfx.error();
    if (r.reason === 'level') toast(`Reach player level ${r.req} to upgrade.`);
    else if (r.reason === 'coins') toast(`Need ${r.cost} coins. Defeat monsters to earn more!`);
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
  renderMonsters();
  persist();
}

function onTap(i: number) {
  const c = state.board[i];
  if (!c.piece) { select(-1); return; }
  if (!c.lock && c.piece.kind === 'gen') {
    // First tap selects (free, shows Upgrade); tapping the selected generator conjures.
    if (selected === i) doSpawn(i);
    else { sfx.pick(); restartAnim(cells[i].firstElementChild!, 'squish'); select(i); }
    return;
  }
  if (!c.lock && c.piece.kind === 'item' && CHAINS[c.piece.chain].collect && selected === i) { doCollect(i); return; }
  sfx.pick();
  if (!c.lock) restartAnim(cells[i].firstElementChild!, 'squish');
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
      for (const u of r.unveiled) {
        renderCell(u, 'squish');
        const up = center(cells[u]);
        puff(up.x, up.y, '#b8d8ff');
      }
      renderBoard();
      renderMonsters();
      select(to);
    });
    persist();
    return;
  } else {
    sfx.drop();
    renderCell(from, r.type === 'swap' ? 'squish' : undefined);
    renderCell(to, 'squish');
    select(to);
  }
  renderMonsters();
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
  drag = { from: i, x0: e.clientX, y0: e.clientY, active: false, over: -1, pointer: e.pointerId };
});

addEventListener('pointermove', (e) => {
  if (!drag || e.pointerId !== drag.pointer) return;
  const c = state.board[drag.from];
  if (!drag.active) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    if (!c.piece || c.lock) return;
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
      if (j !== drag!.from && o.lock !== 2 && o.piece?.kind === 'item' && c.piece?.kind === 'item'
        && o.piece.chain === c.piece.chain && o.piece.level === c.piece.level && c.piece.level < maxLevel(c.piece.chain)) {
        cells[j].classList.add('hint');
      }
    });
  }
  drag.ghost!.style.left = `${e.clientX}px`;
  drag.ghost!.style.top = `${e.clientY}px`;
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
  const to = cellAt(e.clientX, e.clientY);
  if (to >= 0 && to !== d.from) onDrop(d.from, to);
  else renderCell(d.from, 'squish');
}
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', (e) => {
  if (!drag || e.pointerId !== drag.pointer) return;
  drag.ghost?.remove();
  cells[drag.from].firstElementChild?.classList.remove('dragging-src');
  clearHints();
  drag = null;
});

$('#btn-sound').addEventListener('click', () => {
  $('#btn-sound').textContent = sfx.toggle() ? '🔇' : '🔊';
});
$('#btn-sound').textContent = sfx.muted ? '🔇' : '🔊';

// Debug helpers for playtesting from the console.
Object.assign(window, {
  arcane: {
    reset() { state = newGame(); save(state); location.reload(); },
    energy(n = 100) { state.energy += n; renderHud(); persist(); },
    get state() { return state; },
  },
});

// ------------------------------------------------------------------ tower

const towerEl = $('#tower');
let roomFor = '';

function updateTowerBadge() {
  $('#star-badge').textContent = String(state.stars);
  const t = currentTask(state);
  $('#btn-tower').classList.toggle('ready', !!t && state.stars >= t.cost);
}

/** The chapter whose room is shown: the current one, or the last one once all are done. */
const viewChapter = () => Math.min(state.chapter, CHAPTERS.length - 1);

function renderTower(fresh?: string, chapterIdx = viewChapter()) {
  const idx = chapterIdx;
  const ch = CHAPTERS[idx];
  const allDone = state.chapter > idx;
  $('#tower-chapter').textContent = `Chapter ${idx + 1}`;
  $('#tower-name').textContent = ch.name;
  $('#tower-stars').textContent = String(state.stars);
  const room = $('#room');
  if (roomFor !== ch.id) { room.innerHTML = roomSvg(ch.id); roomFor = ch.id; }
  const done = ch.tasks.filter((t) => state.tasksDone.includes(t.id)).map((t) => t.id);
  updateRoom(room.querySelector('svg')!, done, ch.tasks.length, fresh);
  $('#tower-fill').style.width = `${(done.length / ch.tasks.length) * 100}%`;
  $('#tower-progress-text').textContent = allDone ? (state.chapter >= CHAPTERS.length ? 'Fully restored! More rooms coming soon' : 'Fully restored!') : `${done.length} / ${ch.tasks.length} restored`;
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

function openTower() {
  sfx.pick();
  towerEl.classList.remove('hidden');
  renderTower();
}

function closeTower() {
  towerEl.classList.add('hidden');
}

function doRestore() {
  const r = restore(state);
  if (!r.ok) {
    sfx.error();
    if (r.reason === 'stars') toast(`Need ${r.cost} stars. Defeat monsters to earn more!`);
    return;
  }
  sfx.levelUp();
  // Keep showing the room this task belongs to, even if the chapter just ended.
  const shown = r.chapterDone ? state.chapter - 1 : state.chapter;
  renderTower(r.task.id, shown);
  const svg = $('#room svg');
  const box = svg.getBoundingClientRect();
  const [ax, ay] = roomAnchor(CHAPTERS[shown].id, r.task.id);
  const x = box.left + (ax / 400) * box.width, y = box.top + (ay / 320) * box.height;
  burst(x, y, '#ffe680', 1.5);
  shower(x, y, ['#ffe680', '#b98cff', '#fff']);
  const lines: StoryLine[] = [{ text: r.task.story }];
  if (r.chapterDone) {
    for (const t of r.chapterDone.outro) lines.push({ text: t });
    const next = CHAPTERS[state.chapter];
    lines.push({
      text: `Chapter complete: ${r.chapterDone.name}!`,
      extra: `Reward: ${r.chapterDone.rewardText}.`,
      // Move to the next room once the chapter's story is over.
      then: () => renderTower(),
    });
    if (!online.code) {
      lines.push({ text: 'Hoo, one more thing! Tap your level star to make a recovery code. Then your progress is safe even if you switch devices.' });
    }
    if (next) {
      state.storySeen.push(`${next.id}-intro`);
      for (const t of next.intro) lines.push({ text: t });
    } else {
      lines.push({ text: COMING_SOON });
    }
    renderBoard();
    for (const i of r.unsealed) renderCell(i, 'squish');
    for (const i of r.upgraded) renderCell(i, 'merge');
  }
  setTimeout(() => tell(lines), 700);
  renderHud();
  persist();
}

$('#btn-tower').addEventListener('click', openTower);
$('#btn-back').addEventListener('click', closeTower);
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
  $('#me-score').textContent = String(b?.me?.score ?? (period === 'week' ? 0 : state.defeated));
}

async function loadBoard() {
  const req = ++boardReq;
  $('#leaders-sub').textContent = period === 'week' ? `Monsters defeated · resets in ${untilReset()}` : 'Monsters defeated · all time';
  renderMe(null);
  $('#board-list').innerHTML = '';
  boardMessage('Summoning the scores...');
  try {
    const b = await online.board(period);
    if (req !== boardReq) return;
    renderMe(b);
    boardMessage(b.top.length ? '' : period === 'week' ? 'No monsters defeated yet this week. Be the first on the board!' : 'No scores yet. Be the first on the board!');
    $('#board-list').innerHTML = b.top.map((r) => {
      const medal = r.rank <= 3 ? ` medal r${r.rank}` : '';
      return `<li class="row${r.me ? ' me' : ''}"><span class="row-rank${medal}">${r.rank}</span>`
        + `<span class="row-name"><b>${escapeHtml(r.name)}${r.me ? ' (you)' : ''}</b><small>Level ${r.level}</small></span>`
        + `<span class="row-score">${r.score}</span></li>`;
    }).join('');
  } catch {
    if (req !== boardReq) return;
    boardMessage("Can't reach the leaderboard right now. Check your internet connection. (It only works on the game's website.)", true);
  }
}

function openLeaders() {
  sfx.pick();
  leadersEl.classList.remove('hidden');
  $('#rename-form').classList.add('hidden');
  $('#me-name').classList.remove('hidden');
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
$('#btn-rename').addEventListener('click', () => {
  const form = $('#rename-form');
  const open = form.classList.toggle('hidden') === false;
  $('#me-name').classList.toggle('hidden', open);
  if (open) {
    const input = $<HTMLInputElement>('#rename-input');
    input.value = online.name;
    input.focus();
    input.select();
  }
});
$('#rename-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = $<HTMLInputElement>('#rename-input');
  try {
    await online.rename(input.value);
    $('#rename-form').classList.add('hidden');
    $('#me-name').classList.remove('hidden');
    toast(`You are now ${online.name}`);
    loadBoard();
  } catch (err) {
    sfx.error();
    toast(err instanceof Error && err.message.startsWith('Names') ? err.message : "Couldn't save your name. Check your connection.");
  }
});

// ------------------------------------------------------------------ profile & cloud save

const profileEl = $('#profile');

/** Swap in a different save (cloud or recovered) and redraw everything. */
function replaceState(next: GameState) {
  state = next;
  tickEnergy(state);
  save(state);
  monsterEls.forEach((el) => el.remove());
  monsterEls.clear();
  buildBoard();
  renderBoard();
  renderMonsters();
  renderHud();
  select(-1);
  layout();
  roomFor = '';
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
    ? "Couldn't reach the cloud. Your progress is safe on this device and will upload when you're back online. (Cloud save only works on the game's website.)"
    : c.savedAt ? `Saved to the cloud ${ago(c.savedAt)}.` : 'Your progress uploads to the cloud automatically as you play.';
}
online.onCloudChange = () => { if (!profileEl.classList.contains('hidden')) renderCloudStatus(); };

function renderProfile() {
  $('#profile-name').textContent = online.name;
  renderCloudStatus();
  const code = online.code;
  $('#code-box').classList.toggle('hidden', !code);
  $('#code-text').textContent = code ?? '';
  $('#btn-new-code').textContent = code ? 'Make a new code' : 'Create my recovery code';
  $('#code-confirm').classList.add('hidden');
  $('#restore-confirm').classList.add('hidden');
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
    toast("Couldn't create a code. Check your connection; this works on the game's website.");
  }
}

$('#hud-level').addEventListener('click', openProfile);
$('#btn-profile-from-board').addEventListener('click', () => { leadersEl.classList.add('hidden'); openProfile(); });
$('#btn-profile-back').addEventListener('click', () => profileEl.classList.add('hidden'));
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
  $('#restore-loss').textContent = state.defeated > 0 || state.tasksDone.length
    ? `Your current game here (level ${state.level}, ${state.defeated} monsters defeated) will be replaced.`
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
    toast(err instanceof Error && err.message.includes('not found') ? 'That recovery code was not found. Check it and try again.' : "Couldn't restore. Check your connection; this works on the game's website.");
  }
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

// ------------------------------------------------------------------ story

interface StoryLine { text: string; extra?: string; then?: () => void }
const storyQueue: StoryLine[] = [];
let storyThen: (() => void) | undefined;

/** Queue lines for Professor Hoot to say, one card at a time. */
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

// ------------------------------------------------------------------ boot

async function boot() {
  await loadArtOverrides();
  document.documentElement.style.setProperty('--scene', sceneArt());
  document.documentElement.style.setProperty('--web', webArt());
  document.querySelectorAll<HTMLImageElement>('img[data-icon]').forEach((img) => {
    img.src = iconArt[img.dataset.icon as keyof typeof iconArt]();
  });

  buildBoard();
  renderBoard();
  renderHud();
  renderMonsters();
  select(-1);
  layout();
  addEventListener('resize', layout);
  document.fonts?.ready.then(layout);

  setInterval(() => {
    // Energy refilling on its own is not a player change.
    if (tickEnergy(state)) { renderHud(); persist(false); } else updateTimer();
  }, 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    save(state);
    online.cloudSave(state, true);
  });

  syncFromCloud();

  // Catch up on monsters defeated while offline.
  if (state.defeated > 0) online.submit(state.defeated, state.level);

  $<HTMLImageElement>('#story-owl').src = iconArt.owl();
  // Play the current chapter's intro once (also for players who finished
  // the previous chapter before this one existed).
  const ch = CHAPTERS[state.chapter];
  if (ch && !state.storySeen.includes(`${ch.id}-intro`)) {
    state.storySeen.push(`${ch.id}-intro`);
    persist();
    setTimeout(() => tell(ch.intro), 500);
  }
}

boot();
