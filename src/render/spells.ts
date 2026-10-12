// Element spells take a different form at every level (level 1 is always the
// plain orb that formed during the charge):
//   Wind:  sphere, twin wisps, wind blade, arrow volley, tornado, wind laser, storm lance
//   Fire:  fireball, fire darts, flame wheel, meteor shower, phoenix, flamethrower, sunfall
//   Water: bubble, bubble barrage, ice star, ice spears, water serpent, hydro jet, tidal wave
//   Earth: pebble, twin rocks, boulder, stone spikes, golem fist, crystal spire, meteor
// Each returns a promise that resolves when the attack lands.

import type { ElementId } from '../game/config';
import { burst, elementBeam, elementTrail, ELEMENT_COLORS, puff } from './fx';

type Pt = { x: number; y: number };

const STROKE: Record<ElementId, string> = { wind: '#2fa080', fire: '#a8320f', water: '#1a5aa8', earth: '#3e2410' };

/** Shared flight path: an arc from `from` to `to`, `lift` scales its height. */
function arc(from: Pt, to: Pt, t: number, lift = 1): Pt {
  const h = Math.min(120, Math.abs(to.y - from.y) * 0.35 + 40) * lift;
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - Math.sin(Math.PI * t) * h };
}

/** Run `frame(t)` from 0 to 1 over `ms`, then resolve. */
function animate(ms: number, frame: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      frame(t);
      if (t < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function sprite(el: ElementId, svg: string, size: number, glow = true): HTMLElement {
  const d = document.createElement('div');
  d.className = `spell-sprite el-${el}${glow ? ' glow' : ''}`;
  d.style.width = d.style.height = `${size}px`;
  d.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
  d.style.transform = 'scale(0)';
  d.innerHTML = svg;
  document.body.appendChild(d);
  return d;
}

/** Gradients for an element: `${el}-lg` fades in along x, `${el}-rg` glows from the centre. */
function defs(el: ElementId): string {
  const c = ELEMENT_COLORS[el];
  return `<defs><linearGradient id="${el}-lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c[2]}" stop-opacity="0"/><stop offset=".5" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/></linearGradient>
  <radialGradient id="${el}-rg"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[2]}"/></radialGradient></defs>`;
}

// ------------------------------------------------------------------ art

const ORB = (el: ElementId) => `<svg viewBox="-50 -50 100 100">${defs(el)}<circle r="40" fill="url(#${el}-rg)"/><circle cx="-12" cy="-14" r="10" fill="#fff" opacity=".7"/></svg>`;

// Wind
const BLADE = `<svg viewBox="-50 -50 100 100">${defs('wind')}<path d="M0 -44A44 44 0 1 1 0 44A30 44 0 1 0 0 -44Z" fill="url(#wind-rg)" stroke="${STROKE.wind}" stroke-width="2.5"/><path d="M6 -34A34 34 0 0 1 6 34" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/></svg>`;
const ARROW = `<svg viewBox="0 -12 120 24">${defs('wind')}<path d="M0 0H96" stroke="url(#wind-lg)" stroke-width="5" stroke-linecap="round"/><path d="M84 -11L120 0L84 11L92 0Z" fill="#ffffff" stroke="${STROKE.wind}" stroke-width="2"/><path d="M8 -7L30 0M8 7L30 0M24 -6L44 0M24 6L44 0" stroke="#c8fff0" stroke-width="2" opacity=".8"/></svg>`;
const TORNADO = `<svg viewBox="-50 -60 100 120">${defs('wind')}${[[-44, 40, 9], [-26, 33, 8], [-9, 26, 7], [7, 19, 6], [22, 13, 5], [35, 8, 4], [46, 4, 3]]
  .map(([y, rx, ry]) => `<ellipse cx="0" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#wind-rg)" fill-opacity=".85" stroke="${STROKE.wind}" stroke-width="2"/>`).join('')}
  <path d="M-30 -40Q0 -30 30 -44M-18 -8Q0 0 18 -10M-8 22Q0 26 8 20" fill="none" stroke="#fff" stroke-width="2.4" opacity=".8"/></svg>`;

// Fire (projectiles point along +x)
const DART = `<svg viewBox="0 -14 100 28">${defs('fire')}<path d="M100 0C82 -12 40 -13 0 0C40 13 82 12 100 0Z" fill="url(#fire-lg)"/><ellipse cx="80" cy="0" rx="14" ry="5" fill="#fff6d0"/></svg>`;
const WHEEL = `<svg viewBox="-55 -55 110 110">${defs('fire')}${Array.from({ length: 10 }, (_, i) => `<path d="M0 -50Q10 -38 0 -28Q-10 -38 0 -50Z" fill="#ffb03a" stroke="${STROKE.fire}" stroke-width="1.5" transform="rotate(${i * 36})"/>`).join('')}
  <circle r="30" fill="none" stroke="#ff7a22" stroke-width="12"/><circle r="30" fill="none" stroke="#fff1b0" stroke-width="4"/><circle r="12" fill="url(#fire-rg)"/></svg>`;
const METEOR = `<svg viewBox="0 -24 120 48">${defs('fire')}<path d="M0 0L84 -20A20 20 0 0 1 84 20Z" fill="url(#fire-lg)"/><circle cx="96" cy="0" r="18" fill="url(#fire-rg)" stroke="${STROKE.fire}" stroke-width="2"/><circle cx="90" cy="-6" r="5" fill="#fff" opacity=".8"/></svg>`;
const PHOENIX = `<svg viewBox="-64 -48 112 96">${defs('fire')}
  <path d="M-12 0C-30 -12 -50 -6 -62 -16C-52 -2 -52 2 -62 16C-50 6 -30 12 -12 0Z" fill="url(#fire-lg)" stroke="${STROKE.fire}" stroke-width="1.5"/>
  <g class="flap"><path d="M6 -4C-2 -38 -26 -46 -40 -40C-22 -32 -12 -20 -8 -4Z" fill="url(#fire-rg)" stroke="${STROKE.fire}" stroke-width="2"/>
  <path d="M6 4C-2 38 -26 46 -40 40C-22 32 -12 20 -8 4Z" fill="url(#fire-rg)" stroke="${STROKE.fire}" stroke-width="2"/></g>
  <ellipse cx="10" cy="0" rx="22" ry="9" fill="#ffb03a" stroke="${STROKE.fire}" stroke-width="2"/>
  <circle cx="32" cy="-2" r="8" fill="#ffd36a" stroke="${STROKE.fire}" stroke-width="2"/><path d="M39 -4L48 0L39 2Z" fill="#fff1b0" stroke="${STROKE.fire}" stroke-width="1.2"/>
  <circle cx="34" cy="-4" r="1.8" fill="#3a0a00"/><path d="M28 -9Q30 -20 22 -24Q26 -14 24 -9" fill="#ff7a22"/></svg>`;
const SUN = `<svg viewBox="-60 -60 120 120">${defs('fire')}${Array.from({ length: 12 }, (_, i) => `<path d="M0 -58L7 -36L-7 -36Z" fill="#ffb03a" stroke="${STROKE.fire}" stroke-width="1.5" transform="rotate(${i * 30})"/>`).join('')}
  <circle r="36" fill="url(#fire-rg)" stroke="${STROKE.fire}" stroke-width="2.5"/><circle r="26" fill="none" stroke="#fff6d0" stroke-width="2" opacity=".7"/></svg>`;

// Water
const BUBBLE = `<svg viewBox="-50 -50 100 100">${defs('water')}<circle r="40" fill="#7cc8f8" fill-opacity=".45" stroke="#d8f2ff" stroke-width="5"/><path d="M-22 -16A26 26 0 0 1 2 -30" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></svg>`;
const ICESTAR = `<svg viewBox="-50 -50 100 100">${defs('water')}<path d="M0 -46L10 -10L46 0L10 10L0 46L-10 10L-46 0L-10 -10Z" fill="url(#water-rg)" stroke="${STROKE.water}" stroke-width="2.5"/><path d="M0 -30V30M-30 0H30" stroke="#fff" stroke-width="2" opacity=".8"/></svg>`;
const SPEAR = `<svg viewBox="0 -12 120 24">${defs('water')}<path d="M0 0H70" stroke="url(#water-lg)" stroke-width="6" stroke-linecap="round"/><path d="M60 -9L120 0L60 9L66 0Z" fill="#e8f8ff" stroke="${STROKE.water}" stroke-width="2"/><path d="M68 -3L110 0" stroke="#fff" stroke-width="2"/></svg>`;
const SERPENT = `<svg viewBox="-40 -30 80 60">${defs('water')}<path d="M-30 -16C0 -26 24 -16 34 0C24 16 0 26 -30 16Z" fill="url(#water-rg)" stroke="${STROKE.water}" stroke-width="2.5"/>
  <path d="M-20 -20Q-10 -34 4 -22M-20 20Q-10 34 4 22" fill="#7cc8f8" stroke="${STROKE.water}" stroke-width="2"/><circle cx="12" cy="-7" r="4" fill="#fff"/><circle cx="13" cy="-7" r="2" fill="#0a2a50"/><path d="M24 4L34 0" stroke="${STROKE.water}" stroke-width="2"/></svg>`;
const WAVE = `<svg viewBox="-60 -50 120 100">${defs('water')}<path d="M-58 46C-50 0 -20 -44 22 -44C50 -44 60 -20 46 -6C40 -24 22 -26 12 -12C2 2 18 20 40 18C30 36 -10 50 -58 46Z" fill="url(#water-rg)" stroke="${STROKE.water}" stroke-width="3"/>
  <path d="M-40 34C-30 4 -10 -26 20 -34" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/><circle cx="44" cy="-30" r="4" fill="#fff"/><circle cx="52" cy="-18" r="3" fill="#fff"/></svg>`;

// Earth
const ROCK = `<svg viewBox="-50 -50 100 100">${defs('earth')}<path d="M-40 -14L-14 -42L28 -36L44 4L20 40L-26 36Z" fill="#a8743e" stroke="${STROKE.earth}" stroke-width="4"/><path d="M-20 -26L10 -30L18 -8" fill="none" stroke="#f4dcb0" stroke-width="4" opacity=".7"/><path d="M-6 6L10 16L4 30M-24 10L-12 18" fill="none" stroke="${STROKE.earth}" stroke-width="3"/></svg>`;
const SPIKE = `<svg viewBox="-30 -100 60 100"><path d="M-26 0L-6 -96L4 -60L10 -80L26 0Z" fill="#a8743e" stroke="${STROKE.earth}" stroke-width="4"/><path d="M-8 -80L-16 -10" stroke="#f4dcb0" stroke-width="4" opacity=".6"/></svg>`;
const FIST = `<svg viewBox="-50 -40 100 80">${defs('earth')}<path d="M-48 -14L-10 -18L-10 18L-48 14Z" fill="#8a5a2c" stroke="${STROKE.earth}" stroke-width="4"/>
  <rect x="-14" y="-30" width="50" height="60" rx="12" fill="#a8743e" stroke="${STROKE.earth}" stroke-width="4"/>${[-18, -3, 12].map((y) => `<path d="M36 ${y}H20" stroke="${STROKE.earth}" stroke-width="3"/>`).join('')}
  <path d="M-4 -30Q-6 -40 10 -36L18 -22" fill="#a8743e" stroke="${STROKE.earth}" stroke-width="4"/><path d="M-6 -20L-2 20" stroke="#f4dcb0" stroke-width="4" opacity=".6"/><circle cx="10" cy="4" r="5" fill="#ffb03a" opacity=".9"/></svg>`;
const SPIRE = `<svg viewBox="-60 -120 120 120"><defs><linearGradient id="earth-cg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8c8ff"/><stop offset="1" stop-color="#9a6ad8"/></linearGradient></defs>
  <path d="M-56 0L-30 -46L-16 0M18 0L34 -56L54 0" fill="url(#earth-cg)" stroke="#4a2a70" stroke-width="3"/>
  <path d="M-22 0L-8 -116L8 -116L22 0Z" fill="url(#earth-cg)" stroke="#4a2a70" stroke-width="3.5"/><path d="M-8 -116L0 -100L8 -116M0 -100V-4" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/>
  <path d="M-58 0Q0 -14 58 0Z" fill="#8a5a2c" stroke="${STROKE.earth}" stroke-width="3"/></svg>`;
const BIGMETEOR = `<svg viewBox="0 -30 140 60"><defs><linearGradient id="earth-mg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8461e" stop-opacity="0"/><stop offset=".6" stop-color="#ff8a2a"/><stop offset="1" stop-color="#ffd36a"/></linearGradient></defs>
  <path d="M0 0L96 -28A28 28 0 0 1 96 28Z" fill="url(#earth-mg)"/><path d="M84 -18L106 -28L130 -12L134 12L112 28L86 18Z" fill="#8a5a2c" stroke="${STROKE.earth}" stroke-width="4"/>
  <path d="M100 -12L118 -8M96 6L112 14" stroke="#ffb03a" stroke-width="3.5"/><path d="M110 -24L126 -14" stroke="#f4dcb0" stroke-width="3" opacity=".6"/></svg>`;

// ------------------------------------------------------------------ motion

interface FlyOpts { spin?: number; grow?: number; orient?: boolean; lift?: number; trail?: number; scale?: (t: number) => number }

/** A projectile flying along the arc, leaving an element trail. */
async function fly(el: ElementId, d: HTMLElement, from: Pt, to: Pt, ms: number, level: number, o: FlyOpts = {}) {
  const { spin = 0, grow = 0.3, orient = false, lift = 1, trail = 1 } = o;
  let rot = 0;
  let prev = arc(from, to, 0, lift);
  await animate(ms, (t) => {
    const p = arc(from, to, t, lift);
    rot += spin;
    const ang = orient ? (Math.atan2(p.y - prev.y, p.x - prev.x) * 180) / Math.PI : rot;
    const s = o.scale ? o.scale(t) : 1 + Math.sin(Math.PI * t) * grow;
    d.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${ang}deg) scale(${s})`;
    for (let i = 0; i < trail; i++) elementTrail(el, p.x, p.y, level);
    prev = p;
  });
  d.remove();
}

/** A straight dive from `from` to `to` (meteors), oriented along the line. */
async function dive(el: ElementId, d: HTMLElement, from: Pt, to: Pt, ms: number, level: number, trail = 2) {
  const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  await animate(ms, (t) => {
    const e = t * t;
    const x = from.x + (to.x - from.x) * e, y = from.y + (to.y - from.y) * e;
    d.style.transform = `translate(${x}px, ${y}px) rotate(${ang}deg) scale(${0.6 + t * 0.4})`;
    for (let i = 0; i < trail; i++) elementTrail(el, x, y, level);
  });
  d.remove();
}

/** A beam of element energy from `from` to `to` that flares and fades. */
function beam(el: ElementId, from: Pt, to: Pt, thickness: number, ms: number, level: number) {
  const d = document.createElement('div');
  d.className = `spell-beam el-${el}`;
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  Object.assign(d.style, { width: `${len}px`, height: `${thickness}px`, marginTop: `${-thickness / 2}px`, transform: `translate(${from.x}px, ${from.y}px) rotate(${ang}deg)` });
  d.style.setProperty('--beam-ms', `${ms}ms`);
  document.body.appendChild(d);
  setTimeout(() => d.remove(), ms + 50);
  elementBeam(el, from.x, from.y, to.x, to.y, level);
}

/** `n` projectiles launched `gap` ms apart; resolves when the last one lands. */
async function volley(n: number, gap: number, shot: (i: number) => Promise<void>) {
  await Promise.all(Array.from({ length: n }, (_, i) => wait(i * gap).then(() => shot(i))));
}

/** Something erupting from the ground with its base at `at` (spikes, spires). */
async function erupt(el: ElementId, svg: string, at: Pt, w: number, h: number, upMs: number, holdMs: number) {
  const d = sprite(el, svg, w, false);
  d.style.height = `${h}px`;
  d.style.margin = `${-h}px 0 0 ${-w / 2}px`;
  d.style.transformOrigin = '50% 100%';
  await animate(upMs, (t) => { d.style.transform = `translate(${at.x}px, ${at.y}px) scaleY(${1 - Math.pow(1 - t, 3)})`; });
  wait(holdMs).then(() => animate(160, (t) => { d.style.transform = `translate(${at.x}px, ${at.y}px) scaleY(${1 - t})`; d.style.opacity = `${1 - t}`; }).then(() => d.remove()));
}

// ------------------------------------------------------------------ per element

async function wind(L: number, from: Pt, to: Pt, cell: number) {
  if (L === 2) {
    // Twin wisps spiralling around each other.
    const a = sprite('wind', ORB('wind'), cell * 0.5);
    const b = sprite('wind', ORB('wind'), cell * 0.5);
    await animate(560, (t) => {
      const p = arc(from, to, t);
      const off = Math.sin(t * Math.PI * 4) * cell * 0.35 * (1 - t * 0.6);
      a.style.transform = `translate(${p.x + off}px, ${p.y}px)`;
      b.style.transform = `translate(${p.x - off}px, ${p.y}px)`;
      elementTrail('wind', p.x + off, p.y, L);
      elementTrail('wind', p.x - off, p.y, L);
    });
    a.remove(); b.remove();
  } else if (L === 3) {
    // A spinning crescent blade.
    await fly('wind', sprite('wind', BLADE, cell * 1.1), from, to, 480, L, { spin: 38, grow: 0.35 });
  } else if (L === 4) {
    // A volley of three wind arrows, each landing with a puff.
    await volley(3, 110, async (i) => {
      const k = i - 1;
      const end = { x: to.x + k * cell * 0.25, y: to.y };
      await fly('wind', sprite('wind', ARROW, cell * 1.3), { x: from.x + k * cell * 0.4, y: from.y }, end, 380, L, { grow: 0, orient: true });
      if (i < 2) burst(end.x, end.y, '#9ce8cc', 0.45);
    });
  } else if (L === 5) {
    // A tornado tearing across, wobbling and growing.
    const d = sprite('wind', TORNADO, cell * 1.6);
    await animate(640, (t) => {
      const p = arc(from, to, t);
      d.style.transform = `translate(${p.x + Math.sin(t * 40) * 6}px, ${p.y}px) scale(${0.7 + t * 0.6}) skewX(${Math.sin(t * 30) * 8}deg)`;
      elementTrail('wind', p.x, p.y + cell * 0.4, L);
      elementTrail('wind', p.x, p.y - cell * 0.2, L);
    });
    d.remove();
  } else {
    // 6: wind laser. 7: storm lance, a thicker beam wrapped in spiralling blades.
    beam('wind', from, to, L === 6 ? cell * 0.32 : cell * 0.55, L === 6 ? 520 : 760, L);
    if (L >= 7) {
      const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1;
      for (let i = 0; i < 4; i++) {
        wait(i * 90).then(() => {
          const bl = sprite('wind', BLADE, cell * 0.7);
          animate(420, (t) => {
            const r = Math.sin(t * Math.PI * 3 + i) * cell * 0.45;
            bl.style.transform = `translate(${from.x + dx * t - (dy / len) * r}px, ${from.y + dy * t + (dx / len) * r}px) rotate(${t * 900}deg)`;
          }).then(() => bl.remove());
        });
      }
    }
    await wait(140);
  }
}

async function fire(L: number, from: Pt, to: Pt, cell: number) {
  if (L === 2) {
    // Three fire darts fanning out and converging.
    await volley(3, 60, async (i) => {
      await fly('fire', sprite('fire', DART, cell * 0.9), from, to, 420, L, { orient: true, grow: 0, lift: [1.6, 1, 0.4][i] });
    });
  } else if (L === 3) {
    // A spinning wheel of flame.
    await fly('fire', sprite('fire', WHEEL, cell * 1.1), from, to, 500, L, { spin: 30, grow: 0.3, trail: 2 });
  } else if (L === 4) {
    // Meteors rain down on the monster from the sky.
    await volley(3, 130, async (i) => {
      const end = { x: to.x + (i - 1) * cell * 0.3, y: to.y + (i % 2) * 6 };
      await dive('fire', sprite('fire', METEOR, cell * 1.2), { x: end.x - 160 + i * 40, y: -60 }, end, 420, L);
      if (i < 2) burst(end.x, end.y, '#ff8a2a', 0.6);
    });
  } else if (L === 5) {
    // A phoenix swoops in on beating wings.
    await fly('fire', sprite('fire', PHOENIX, cell * 1.7), from, to, 640, L, { orient: true, grow: 0.25, lift: 1.4, trail: 3 });
  } else if (L === 6) {
    // A roaring stream of fire.
    beam('fire', from, to, cell * 0.42, 620, L);
    await wait(150);
  } else {
    // Sunfall: a blazing sun rises from the circle, swells and crashes down.
    const d = sprite('fire', SUN, cell * 2.2);
    let rot = 0;
    await animate(760, (t) => {
      const p = arc(from, to, t, 1.6);
      rot += 4;
      d.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${rot}deg) scale(${0.3 + Math.sin(Math.PI * Math.min(1, t * 1.4) * 0.5) * 0.9})`;
      for (let i = 0; i < 4; i++) elementTrail('fire', p.x + (Math.random() - 0.5) * cell, p.y + (Math.random() - 0.5) * cell, L);
    });
    d.remove();
  }
}

async function water(L: number, from: Pt, to: Pt, cell: number) {
  if (L === 2) {
    // A barrage of bubbles, each popping on the monster.
    await volley(5, 70, async (i) => {
      const end = { x: to.x + (Math.random() - 0.5) * cell * 0.5, y: to.y + (Math.random() - 0.5) * cell * 0.4 };
      await fly('water', sprite('water', BUBBLE, cell * (0.35 + Math.random() * 0.2)), from, end, 440, L, { grow: 0.2, lift: 0.6 + i * 0.2 });
      puff(end.x, end.y, '#d8f2ff');
    });
  } else if (L === 3) {
    // A spinning star of ice.
    await fly('water', sprite('water', ICESTAR, cell * 1.0), from, to, 470, L, { spin: 26, grow: 0.3 });
  } else if (L === 4) {
    // A volley of ice spears.
    await volley(3, 100, async (i) => {
      const k = i - 1;
      const end = { x: to.x + k * cell * 0.25, y: to.y };
      await fly('water', sprite('water', SPEAR, cell * 1.3), { x: from.x + k * cell * 0.4, y: from.y }, end, 400, L, { grow: 0, orient: true, lift: 0.7 });
      if (i < 2) burst(end.x, end.y, '#d8f2ff', 0.5);
    });
  } else if (L === 5) {
    // A water serpent weaving through the air, its body trailing behind.
    const head = sprite('water', SERPENT, cell * 1.0);
    const body = Array.from({ length: 8 }, (_, i) => sprite('water', ORB('water'), cell * (0.55 - i * 0.04)));
    const hist: Pt[] = [];
    const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1;
    await animate(700, (t) => {
      const p = arc(from, to, t, 0.8);
      const w = Math.sin(t * Math.PI * 3) * cell * 0.6 * (1 - t);
      const q = { x: p.x - (dy / len) * w, y: p.y + (dx / len) * w };
      const prev = hist[hist.length - 1] ?? q;
      hist.push(q);
      head.style.transform = `translate(${q.x}px, ${q.y}px) rotate(${(Math.atan2(q.y - prev.y, q.x - prev.x) * 180) / Math.PI}deg)`;
      body.forEach((b, i) => {
        const s = hist[Math.max(0, hist.length - 1 - (i + 1) * 2)];
        b.style.transform = `translate(${s.x}px, ${s.y}px)`;
      });
      elementTrail('water', q.x, q.y, L);
    });
    head.remove();
    body.forEach((b, i) => wait(i * 25).then(() => b.remove()));
  } else if (L === 6) {
    // A high-pressure hydro jet.
    beam('water', from, to, cell * 0.4, 600, L);
    await wait(150);
  } else {
    // A tidal wave surges up from the board and crashes over the monster.
    const d = sprite('water', WAVE, cell * 2.6);
    const start = { x: from.x - cell * 1.2, y: from.y + cell * 0.6 };
    await animate(780, (t) => {
      const e = 1 - Math.pow(1 - t, 2);
      const x = start.x + (to.x - start.x) * e, y = start.y + (to.y - start.y) * e;
      d.style.transform = `translate(${x}px, ${y}px) scale(${0.5 + e * 0.8}) rotate(${-10 + t * 25}deg)`;
      for (let i = 0; i < 4; i++) elementTrail('water', x + (Math.random() - 0.5) * cell * 1.5, y + cell * 0.6, L);
    });
    d.remove();
  }
}

async function earth(L: number, from: Pt, to: Pt, cell: number) {
  if (L === 2) {
    // Two rocks lobbed in high arcs.
    await volley(2, 120, async (i) => {
      const end = { x: to.x + (i ? 1 : -1) * cell * 0.2, y: to.y };
      await fly('earth', sprite('earth', ROCK, cell * 0.6), from, end, 480, L, { spin: i ? 12 : -12, grow: 0.25, lift: 1.5 });
      if (!i) burst(end.x, end.y, '#c79056', 0.5);
    });
  } else if (L === 3) {
    // A heavy spinning boulder.
    await fly('earth', sprite('earth', ROCK, cell * 1.1), from, to, 520, L, { spin: 14, grow: 0.35, lift: 1.3, trail: 2 });
  } else if (L === 4) {
    // A line of stone spikes bursts out of the ground toward the monster.
    const n = 6;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const at = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t + cell * 0.45 };
      const s = 0.8 + t * 0.9;
      elementTrail('earth', at.x, at.y, L);
      if (i < n) { erupt('earth', SPIKE, at, cell * 0.5 * s, cell * 0.8 * s, 110, 120); await wait(55); }
      else await erupt('earth', SPIKE, at, cell * 0.5 * s, cell * 0.9 * s, 120, 200);
    }
  } else if (L === 5) {
    // A stone golem's fist punches across.
    await fly('earth', sprite('earth', FIST, cell * 1.6), from, to, 560, L, { orient: true, lift: 0.6, trail: 2, scale: (t) => 0.6 + t * 0.6 });
  } else if (L === 6) {
    // The ground rumbles toward the monster, then a crystal spire erupts beneath it.
    await animate(320, (t) => {
      const x = from.x + (to.x - from.x) * t, y = from.y + (to.y - from.y) * t;
      elementTrail('earth', x, y, L);
      elementTrail('earth', x, y, L);
    });
    await erupt('earth', SPIRE, { x: to.x, y: to.y + cell * 0.7 }, cell * 1.6, cell * 1.6, 160, 380);
  } else {
    // A flaming meteor plummets from the sky.
    const start = { x: to.x + 220, y: -120 };
    await dive('earth', sprite('earth', BIGMETEOR, cell * 2.4), start, to, 700, L, 3);
    for (let i = 0; i < 10; i++) elementTrail('fire', to.x + (Math.random() - 0.5) * cell, to.y, L);
  }
}

/**
 * Play the element attack for `level` from the casting circle to the monster.
 * `orb` is the sphere formed during the charge: level 1 throws it, every other
 * form absorbs it at launch. Resolves when the attack hits.
 */
export async function spellAttack(el: ElementId, level: number, from: Pt, to: Pt, cell: number, orb?: HTMLElement): Promise<void> {
  const L = Math.max(1, Math.min(7, level));
  if (L <= 1) {
    const d = orb ?? sprite(el, ORB(el), cell * 0.8);
    await fly(el, d, from, to, 520, L, { grow: 0.25, trail: 2 });
    return;
  }
  orb?.remove();
  await { wind, fire, water, earth }[el](L, from, to, cell);
}
