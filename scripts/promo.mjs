// Renders a 15-second vertical (1080x1920) promo video of the real game.
// Time is virtual: Playwright's fake clock drives timers and animation frames,
// CSS animations are stepped by hand, and each frame is a screenshot, so the
// video is smooth however slow the machine is. The game's own sounds are
// captured by swapping in an OfflineAudioContext whose clock follows the
// virtual time; a music bed is added in the same context, and ffmpeg muxes
// everything into an H.264 MP4.
// Usage: node scripts/promo.mjs [url] [out.mp4]
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const [url = 'http://localhost:5173/', out = 'promo/arcane-merge-promo.mp4'] = process.argv.slice(2);
const FPS = 30, DUR = 15000, RATE = 44100;
const W = 405, H = 720, DPR = 1080 / 405;
const tmp = join(dirname(out), 'frames');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
await ctx.addInitScript(({ rate, secs }) => {
  // Sounds land in an offline buffer at the virtual time they were played.
  window.AudioContext = class extends OfflineAudioContext {
    constructor() { super(2, Math.ceil(rate * secs), rate); window.__ac = this; }
    get currentTime() { return window.__t0 === undefined ? 999 : (performance.now() - window.__t0) / 1000; }
    resume() { return Promise.resolve(); }
    get state() { return 'running'; }
  };
  try { localStorage.removeItem('arcane-muted'); } catch { /* ignore */ }
}, { rate: RATE, secs: DUR / 1000 + 0.5 });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
// Paused: time only moves when the script advances it.
await p.clock.install({ time: new Date('2026-10-12T10:00:00Z') });
await p.clock.pauseAt(new Date('2026-10-12T10:00:01Z'));

const pump = async (ms) => { for (let t = 0; t < ms; t += 50) { await p.clock.runFor(50); await p.waitForTimeout(5); } };
const skipStory = async () => {
  for (let i = 0; i < 10 && await p.locator('#story:not(.hidden)').count(); i++) { await p.locator('#story-next').click(); await pump(150); }
};

// ------------------------------------------------------------------ set the stage
await p.goto(url);
await pump(800);
await p.evaluate(() => {
  const s = window.arcane.state;
  const ch = window.arcane.chapters;
  s.storySeen = [...ch.flatMap((c) => [`${c.id}-intro`, `${c.id}-outro`]), 'code-tip'];
  s.level = 12; s.coins = 1250; s.gems = 40; s.energy = 100; s.stars = 30;
  s.chapter = 1;
  s.tasksDone = [...ch[0].tasks.map((t) => t.id), ...ch[1].tasks.slice(0, 3).map((t) => t.id)];
  const I = (chain, level) => ({ kind: 'item', chain, level });
  const at = (r, c) => r * 7 + c;
  for (let r = 3; r <= 7; r++) for (let c = 0; c < 7; c++) s.board[at(r, c)] = { piece: null, lock: 0 };
  const put = (r, c, chain, level) => (s.board[at(r, c)] = { piece: I(chain, level), lock: 0 });
  put(3, 0, 'coin', 2); put(3, 2, 'mana', 1); put(3, 4, 'wind', 2); put(3, 6, 'earth', 2);
  put(4, 1, 'water', 2); put(4, 5, 'earth', 7);
  put(5, 0, 'coin', 1); put(5, 2, 'fire', 4); put(5, 3, 'fire', 4); put(5, 6, 'wind', 1);
  put(6, 1, 'water', 6); put(6, 2, 'water', 6); put(6, 5, 'mana', 2);
  put(7, 0, 'earth', 1); put(7, 2, 'fire', 1); put(7, 5, 'fire', 4); put(7, 6, 'water', 6);
  const mon = (m, kind, name, chain, level, boss = false) => Object.assign(m, { kind, name, needs: [{ chain, level }], coins: 60, xp: 10, gems: 2, stars: 2, boss });
  mon(s.monsters[0], 'golem', 'Moss Golem', 'fire', 5);
  mon(s.monsters[1], 'imp', 'Cinder Imp', 'water', 7);
  mon(s.monsters[2], 'dragon', 'Ember Wyrmling', 'earth', 7, true);
  localStorage.setItem('arcane-merge-save-v2', JSON.stringify(s));
});
await p.reload();
await pump(1200);
await skipStory();

// Art for the title and end cards, taken from the game itself.
const art = await p.evaluate(() => ({
  grimoires: [...document.querySelectorAll('#board .cell')].slice(56).map((c) => c.querySelector('img')?.src).filter(Boolean),
  monsters: [...document.querySelectorAll('.monster .portrait img')].map((i) => i.src),
}));

// ------------------------------------------------------------------ overlay
await p.addStyleTag({ content: `
#promo, #promo * { box-sizing: border-box; }
#promo { position: fixed; inset: 0; z-index: 9000; pointer-events: none; font-family: Fredoka, system-ui, sans-serif; }
.pr-card { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0;
  background: radial-gradient(ellipse at 50% 42%, #5a3a8c 0%, #2c1a4a 55%, #120a22 100%); }
.pr-card.show { animation: pr-in .45s ease-out forwards; }
.pr-card.hide { animation: pr-out .45s ease-in forwards; }
@keyframes pr-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes pr-out { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.25); } }
.pr-circle { position: absolute; width: 330px; height: 330px; left: 50%; top: 50%; margin: -215px 0 0 -165px; opacity: 0; }
.show .pr-circle { animation: pr-circle-in .9s cubic-bezier(.2,1.4,.4,1) forwards, pr-spin 14s linear infinite; }
@keyframes pr-circle-in { from { opacity: 0; scale: .2; } to { opacity: 1; scale: 1; } }
@keyframes pr-spin { to { rotate: 360deg; } }
.pr-title { position: relative; text-align: center; line-height: .9; font-weight: 700; color: #ffe08a; letter-spacing: 1px;
  -webkit-text-stroke: 7px #3a1c5c; paint-order: stroke fill; text-shadow: 0 6px 0 #22103a, 0 0 30px rgba(255,200,90,.6); margin-top: -40px; }
.pr-title span { display: block; opacity: 0; }
.pr-title .a { font-size: 74px; }
.pr-title .b { font-size: 92px; color: #fff3c4; }
.show .pr-title .a { animation: pr-pop .55s .25s cubic-bezier(.2,1.6,.4,1) forwards; }
.show .pr-title .b { animation: pr-pop .55s .45s cubic-bezier(.2,1.6,.4,1) forwards; }
@keyframes pr-pop { from { opacity: 0; transform: scale(.2) rotate(-8deg); } to { opacity: 1; transform: scale(1) rotate(0); } }
.pr-sub { margin-top: 26px; font-size: 25px; font-weight: 600; color: #fff; -webkit-text-stroke: 4px #3a1c5c; paint-order: stroke fill; opacity: 0; text-align: center; }
.show .pr-sub { animation: pr-rise .5s .8s ease-out forwards; }
@keyframes pr-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
.pr-orbit { position: absolute; width: 64px; height: 64px; left: 50%; top: 50%; opacity: 0; filter: drop-shadow(0 4px 6px rgba(0,0,0,.5)); }
.show .pr-orbit { animation: pr-pop .5s cubic-bezier(.2,1.6,.4,1) forwards, pr-bob 1.6s ease-in-out infinite alternate; }
@keyframes pr-bob { to { translate: 0 -8px; } }
.pr-cap { position: absolute; left: 0; right: 0; bottom: 92px; text-align: center; font-weight: 700; font-size: 40px; line-height: 1;
  color: #fff; -webkit-text-stroke: 7px #3a1c5c; paint-order: stroke fill; text-shadow: 0 5px 0 #22103a, 0 0 22px rgba(185,140,255,.9); opacity: 0; }
.pr-cap.high { bottom: 330px; }
.pr-cap small { display: block; font-size: 25px; color: #ffe08a; margin-top: 8px; -webkit-text-stroke: 5px #3a1c5c; }
.pr-cap.show { animation: pr-cap-in .5s cubic-bezier(.2,1.6,.4,1) forwards; }
.pr-cap.hide { animation: pr-cap-out .3s ease-in forwards; }
@keyframes pr-cap-in { from { opacity: 0; transform: scale(.3) rotate(-6deg); } to { opacity: 1; transform: scale(1) rotate(-3deg); } }
@keyframes pr-cap-out { from { opacity: 1; transform: scale(1) rotate(-3deg); } to { opacity: 0; transform: scale(1.3) rotate(-3deg); } }
.pr-hand { position: absolute; left: 0; top: 0; width: 58px; height: 58px; opacity: 0; transition: opacity .2s; filter: drop-shadow(0 4px 4px rgba(0,0,0,.45)); }
.pr-hand.on { opacity: 1; }
.pr-hand svg { width: 100%; height: 100%; transform-origin: 30% 10%; transition: transform .12s; }
.pr-hand.press svg { transform: scale(.82); }
.pr-mons { display: flex; gap: 6px; margin-top: 34px; }
.pr-mons img { width: 84px; height: 84px; opacity: 0; filter: drop-shadow(0 4px 6px rgba(0,0,0,.5)); }
.show .pr-mons img { animation: pr-pop .5s cubic-bezier(.2,1.6,.4,1) forwards; }
.pr-play { margin-top: 30px; padding: 14px 44px 16px; border-radius: 999px; font-size: 38px; font-weight: 700; color: #fff; opacity: 0;
  background: linear-gradient(#ffb547, #f07a1a); border: 4px solid #fff3c4; box-shadow: 0 6px 0 #9a3e08, 0 0 30px rgba(255,170,60,.8);
  -webkit-text-stroke: 5px #8a3206; paint-order: stroke fill; }
.show .pr-play { animation: pr-pop .5s 1s cubic-bezier(.2,1.6,.4,1) forwards, pr-pulse .7s 1.5s ease-in-out infinite alternate; }
@keyframes pr-pulse { from { transform: scale(1); } to { transform: scale(1.08); } }
.pr-url { margin-top: 22px; font-size: 21px; font-weight: 600; color: #e8dcff; opacity: 0; letter-spacing: .5px; }
.show .pr-url { animation: pr-rise .5s 1.3s ease-out forwards; }
#pr-flash { position: absolute; inset: 0; background: #fff; opacity: 0; }
#pr-flash.go { animation: pr-flash .35s ease-out; }
@keyframes pr-flash { from { opacity: .85; } to { opacity: 0; } }
` });

await p.evaluate(({ art }) => {
  const circle = `<svg class="pr-circle" viewBox="-100 -100 200 200">
    <g fill="none" stroke="#ffd98a" stroke-opacity=".85">
      <circle r="96" stroke-width="2.5"/><circle r="88" stroke-width="1"/><circle r="62" stroke-width="2"/><circle r="30" stroke-width="1.5"/>
      ${Array.from({ length: 36 }, (_, i) => `<path d="M0 -96V-${i % 3 ? 91 : 86}" stroke-width="1.6" transform="rotate(${i * 10})"/>`).join('')}
      <path d="${Array.from({ length: 6 }, (_, i) => { const a = (i * 2 * 360 / 6 - 90) * Math.PI / 180; return `${i ? 'L' : 'M'}${(62 * Math.cos(a)).toFixed(1)} ${(62 * Math.sin(a)).toFixed(1)}`; }).join('')}Z" stroke-width="1.6"/>
      <path d="${Array.from({ length: 6 }, (_, i) => { const a = ((i * 2 + 1) * 360 / 6 - 90) * Math.PI / 180; return `${i ? 'L' : 'M'}${(62 * Math.cos(a)).toFixed(1)} ${(62 * Math.sin(a)).toFixed(1)}`; }).join('')}Z" stroke-width="1.6"/>
      ${Array.from({ length: 8 }, (_, i) => `<circle cx="0" cy="-75" r="6" stroke-width="1.4" transform="rotate(${i * 45})"/>`).join('')}
    </g></svg>`;
  const orbit = art.grimoires.slice(0, 4).map((src, i) => {
    const a = (-135 + i * 90) * Math.PI / 180;
    const x = Math.cos(a) * 138 - 32, y = Math.sin(a) * 150 - 82;
    return `<img class="pr-orbit" src="${src}" style="margin:${y}px 0 0 ${x}px; animation-delay:${0.6 + i * 0.12}s, ${0.6 + i * 0.12}s">`;
  }).join('');
  const hand = `<svg viewBox="0 0 64 64"><path d="M22 6c3 0 5 2 5 5v17l3-1c3-1 6 1 7 1l2-1c3-1 6 1 7 2l2 0c3 0 5 2 5 5v10c0 9-7 15-15 15H35c-5 0-9-2-12-6L12 40c-2-2-1-5 1-6 2-2 5-1 7 1l-3-3V11c0-3 2-5 5-5z" fill="#fff" stroke="#3a1c5c" stroke-width="3.5" stroke-linejoin="round"/></svg>`;
  const root = document.createElement('div');
  root.id = 'promo';
  root.innerHTML = `
    <div class="pr-card" id="pr-intro">${circle}${orbit}
      <div class="pr-title"><span class="a">ARCANE</span><span class="b">MERGE</span></div>
      <div class="pr-sub">Merge magic. Banish monsters!</div></div>
    <div class="pr-cap" id="pr-cap"></div>
    <div class="pr-hand" id="pr-hand">${hand}</div>
    <div class="pr-card" id="pr-end">${circle}
      <div class="pr-title" style="margin-top:-10px"><span class="a" style="font-size:56px">ARCANE</span><span class="b" style="font-size:70px">MERGE</span></div>
      <div class="pr-mons">${art.monsters.slice(0, 3).map((s, i) => `<img src="${s}" style="animation-delay:${0.5 + i * 0.12}s">`).join('')}</div>
      <div class="pr-play">PLAY FREE</div>
      <div class="pr-url">tpint.github.io/magic_m</div></div>
    <div id="pr-flash"></div>`;
  document.body.appendChild(root);

  const restart = (el, cls) => { el.classList.remove('show', 'hide', 'go'); void el.offsetWidth; el.classList.add(cls); };
  window.__promo = {
    show: (id) => restart(document.getElementById(id), 'show'),
    hide: (id) => restart(document.getElementById(id), 'hide'),
    flash: () => restart(document.getElementById('pr-flash'), 'go'),
    caption(html, high = false) { const c = document.getElementById('pr-cap'); c.innerHTML = html; c.classList.toggle('high', high); restart(c, 'show'); },
    hand(x, y, on, press) {
      const h = document.getElementById('pr-hand');
      h.style.transform = `translate(${x - 17}px, ${y - 4}px)`;
      h.classList.toggle('on', on); h.classList.toggle('press', press);
    },
    // CSS animations follow the virtual clock: pause them all and step by hand.
    step(dt) {
      for (const a of document.getAnimations()) {
        // Chrome keeps a paused CSS animation alive after its rule stops
        // applying, so cancel any whose element no longer names it.
        if (a.animationName) {
          const fx = a.effect;
          const names = fx?.target ? getComputedStyle(fx.target, fx.pseudoElement).animationName.split(',').map((s) => s.trim()) : [];
          if (!names.includes(a.animationName)) { a.cancel(); continue; }
        }
        if (a.playState !== 'paused') a.pause();
        a.currentTime = (Number(a.currentTime) || 0) + dt;
      }
    },
  };
}, { art });

// ------------------------------------------------------------------ positions
const pos = await p.evaluate(() => {
  const c = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const cells = [...document.querySelectorAll('#board .cell')].map(c);
  const casts = [...document.querySelectorAll('.monster .cast')].map(c);
  return { cells, casts, tower: c(document.querySelector('#btn-tower')) };
});
const cell = (r, c) => pos.cells[r * 7 + c];

// ------------------------------------------------------------------ timeline
const acts = [];
const at = (t, fn) => acts.push({ t, fn });
const handSegs = []; // { t0, t1, a, b }
let handOn = false, press = false, dragging = false;
const handTo = (t0, t1, a, b) => handSegs.push({ t0, t1, a, b });
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
function handAt(t) {
  let pt = handSegs[0]?.a ?? { x: 0, y: 0 };
  for (const s of handSegs) {
    if (t < s.t0) break;
    const k = Math.min(1, (t - s.t0) / Math.max(1, s.t1 - s.t0));
    pt = { x: s.a.x + (s.b.x - s.a.x) * ease(k), y: s.a.y + (s.b.y - s.a.y) * ease(k) };
  }
  return pt;
}
/** Drag from cell a to cell b: hand arrives, presses, drags, releases. */
function drag(t, from, to, arriveFrom) {
  handTo(t - 350, t, arriveFrom, from);
  at(t, async () => { press = true; dragging = true; await p.mouse.move(from.x, from.y); await p.mouse.down(); });
  handTo(t + 120, t + 620, from, to);
  at(t + 660, async () => { await p.mouse.move(to.x, to.y); await p.mouse.up(); press = false; dragging = false; });
}
function tap(t, target, arriveFrom) {
  handTo(t - 300, t, arriveFrom, target);
  at(t, async () => { press = true; await p.mouse.click(target.x, target.y); });
  at(t + 140, () => { press = false; });
}

// 0.0  Title card
at(0, () => p.evaluate(() => { window.__promo.show('pr-intro'); }));
at(2300, () => p.evaluate(() => { window.__promo.hide('pr-intro'); window.__promo.flash(); }));
// 2.5  Merge three of a kind
at(2550, () => p.evaluate(() => window.__promo.caption('MERGE 3<small>to grow your magic</small>')));
at(2600, () => { handOn = true; });
drag(3000, cell(7, 5), cell(5, 4), { x: 330, y: 700 });
drag(4100, cell(7, 6), cell(6, 3), cell(5, 4));
// 5.0  Cast spells
at(5050, () => p.evaluate(() => window.__promo.caption('UNLEASH SPELLS<small>every level a new attack</small>')));
tap(5300, pos.casts[0], cell(6, 3));
tap(6700, pos.casts[1], pos.casts[0]);
tap(8100, pos.casts[2], pos.casts[1]);
at(8400, () => { handOn = false; });
at(9700, () => p.evaluate(() => window.__promo.caption('BANISH MONSTERS<small>win coins, gems &amp; stars</small>')));
// 11.0 Restore the tower
at(10700, () => { handOn = true; });
tap(11000, pos.tower, { x: 300, y: 360 });
at(11000, () => p.evaluate(() => window.__promo.hide('pr-cap')));
at(11200, () => p.evaluate(() => window.__promo.caption('RESTORE THE TOWER<small>five chapters of mystery</small>', true)));
at(11500, async () => {
  const r = await p.evaluate(() => { const b = document.querySelector('[data-restore]'); if (!b) return null; const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; });
  if (r) tap(11850, r, pos.tower);
});
at(12300, () => { handOn = false; });
// 13.0 End card
at(13000, () => p.evaluate(() => { window.__promo.hide('pr-cap'); window.__promo.show('pr-end'); }));

// ------------------------------------------------------------------ render
await p.evaluate(() => { window.__t0 = performance.now(); });
const frames = Math.round((DUR / 1000) * FPS);
const dt = 1000 / FPS;
for (let f = 0; f < frames; f++) {
  const t = f * dt;
  for (const a of acts.filter((x) => !x.done && x.t <= t)) { a.done = true; await a.fn(); }
  const h = handAt(t);
  if (dragging) await p.mouse.move(h.x, h.y);
  await p.evaluate(({ h, on, press }) => window.__promo.hand(h.x, h.y, on, press), { h, on: handOn, press });
  await p.clock.runFor(dt);
  await p.evaluate((dt) => window.__promo.step(dt), dt);
  await p.screenshot({ path: join(tmp, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  if (f % 60 === 0) console.log(`frame ${f}/${frames}`);
}

// ------------------------------------------------------------------ music + sound
const audio = await p.evaluate(async (dur) => {
  const a = window.__ac;
  if (!a) return null;
  const master = a.createGain(); master.gain.value = 0.32; master.connect(a.destination);
  const note = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const env = (g, t, atk, peak, rel) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + atk); g.gain.exponentialRampToValueAtTime(0.0001, t + atk + rel); };
  const voice = (type, f, t, atk, peak, rel, cutoff = 2400, dest = master) => {
    const o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    o.type = type; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = cutoff;
    env(g, t, atk, peak, rel); o.connect(lp).connect(g).connect(dest); o.start(t); o.stop(t + atk + rel + 0.05);
  };
  const noise = (t, len, peak, type, freq) => {
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * len), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    s.buffer = buf; f.type = type; f.frequency.value = freq; env(g, t, 0.005, peak, len);
    s.connect(f).connect(g).connect(master); s.start(t);
  };
  const kick = (t, v = 1) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.18); env(g, t, 0.003, 0.9 * v, 0.28); o.connect(g).connect(master); o.start(t); o.stop(t + 0.35); };
  // 120 bpm, D minor: Dm - Bb - F - C, one chord per bar (2 s).
  const chords = [[50, 53, 57, 62], [46, 50, 53, 58], [53, 57, 60, 65], [48, 52, 55, 60]];
  const beat = 0.5;
  for (let bar = 0; bar * 2 < dur; bar++) {
    const t0 = bar * 2, ch = chords[bar % 4];
    for (const m of ch) { voice('sawtooth', note(m) * 0.997, t0, 0.3, 0.035, 1.9, 1200); voice('sawtooth', note(m) * 1.003, t0, 0.3, 0.035, 1.9, 1200); }
    voice('triangle', note(ch[0] - 12), t0, 0.02, 0.22, 1.8, 600);
    // Sparkly arpeggio in 16ths after the title.
    if (t0 >= 2) for (let i = 0; i < 16; i++) { const m = ch[i % 4] + 12 + (i % 8 >= 4 ? 12 : 0); voice('triangle', note(m), t0 + i * beat / 4, 0.005, 0.07, 0.22, 5000); }
    if (t0 >= 2) for (let k = 0; k < 4; k++) { kick(t0 + k * beat, 0.8); noise(t0 + k * beat + beat / 2, 0.06, 0.12, 'highpass', 7000); }
  }
  // Title: rising shimmer into a boom; a whoosh at each scene change.
  for (let i = 0; i < 12; i++) voice('sine', note(74 + i * 2), 0.1 + i * 0.07, 0.01, 0.06, 0.6, 8000);
  kick(0.75, 1.3); noise(0.75, 1.2, 0.25, 'lowpass', 900);
  for (const t of [2.3, 5.05, 9.7, 11.2]) noise(t - 0.15, 0.45, 0.18, 'bandpass', 1800);
  // End card: a big final chord.
  for (const m of [50, 57, 62, 65, 69, 74]) voice('sawtooth', note(m), 13, 0.05, 0.05, 2.0, 2600);
  kick(13, 1.4); noise(13, 1.5, 0.22, 'lowpass', 1200);
  const buf = await a.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  let peak = 0; for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.89 / peak : 1;
  const pcm = new Int16Array(L.length * 2);
  for (let i = 0; i < L.length; i++) { pcm[i * 2] = Math.max(-1, Math.min(1, L[i] * g)) * 32767; pcm[i * 2 + 1] = Math.max(-1, Math.min(1, R[i] * g)) * 32767; }
  let s = ''; const u8 = new Uint8Array(pcm.buffer);
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return { b64: btoa(s), peak };
}, DUR / 1000);
await b.close();

const wavFile = join(dirname(out), 'promo.wav');
if (audio) {
  const data = Buffer.from(audio.b64, 'base64');
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVEfmt ', 8);
  hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(RATE, 24);
  hdr.writeUInt32LE(RATE * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
  writeFileSync(wavFile, Buffer.concat([hdr, data]));
}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(tmp, 'f%04d.jpg'),
  ...(audio ? ['-i', wavFile] : []), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  ...(audio ? ['-c:a', 'aac', '-b:a', '192k', '-shortest'] : []), '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log(`wrote ${out}${audio ? ` (audio peak ${audio.peak.toFixed(2)})` : ' (no audio)'}`);
console.log('errors', errs);
