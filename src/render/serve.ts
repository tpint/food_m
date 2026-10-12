// Serving a dish: while it is plated up, a plate draws itself under the item
// on the board (fancier at higher levels: a rim pattern, a ring of hearts,
// sparkles, golden rays and, at the top level, a spotlight). Then the dish
// flies to the customer on its plate, trailing steam, bubbles or sprinkles.

import type { FoodId } from '../game/config';
import { foodTrail } from './fx';

type Pt = { x: number; y: number };

const NS = 'http://www.w3.org/2000/svg';

/** Line, glow and outline colours for each food's plate. */
export const PLATE_COLORS: Record<FoodId, { line: string; glow: string; ink: string }> = {
  bakery: { line: '#ffd890', glow: '#e8a040', ink: '#6a3a10' },
  drinks: { line: '#bfeaff', glow: '#2f8fe8', ink: '#0c2f66' },
  dessert: { line: '#ffc8e2', glow: '#ff5a9a', ink: '#7a1446' },
  grill: { line: '#ffd0a0', glow: '#ff6a2a', ink: '#7a1a08' },
};

const ring = (r: number, w: number, extra = '') => `<circle r="${r}" fill="none" stroke-width="${w * 1.5}" pathLength="1" class="draw" ${extra}/>`;
const spin = (body: string, dur: number, dir = 1) => `<g class="spin${dir < 0 ? ' rev' : ''}" style="--dur:${dur}s">${body}</g>`;

function around(n: number, r: number, item: (x: number, y: number, a: number) => string): string {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out += item(Math.cos(a) * r, Math.sin(a) * r, (a * 180) / Math.PI);
  }
  return out;
}

const heart = (x: number, y: number, k: number) =>
  `<path d="M${x} ${y + 4 * k}C${x - 7 * k} ${y - 1 * k} ${x - 4 * k} ${y - 7 * k} ${x} ${y - 3 * k}C${x + 4 * k} ${y - 7 * k} ${x + 7 * k} ${y - 1 * k} ${x} ${y + 4 * k}Z" class="dot"/>`;
const star = (x: number, y: number, k: number) =>
  `<path d="M${x} ${y - 6 * k}L${x + 1.6 * k} ${y - 1.6 * k}L${x + 6 * k} ${y}L${x + 1.6 * k} ${y + 1.6 * k}L${x} ${y + 6 * k}L${x - 1.6 * k} ${y + 1.6 * k}L${x - 6 * k} ${y}L${x - 1.6 * k} ${y - 1.6 * k}Z" class="dot"/>`;

const boxFor = (L: number) => (L >= 7 ? 150 : L >= 6 ? 136 : L >= 5 ? 128 : 112);

/** The plate's SVG markup for a food at a level (1-7). */
export function plateSvg(food: FoodId, level: number): string {
  const L = Math.max(1, Math.min(7, level));
  const layers: string[] = [];
  if (L >= 5) {
    let rays = '';
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, b = a + 0.12;
      rays += `M0 0L${(Math.cos(a) * 124).toFixed(1)} ${(Math.sin(a) * 124).toFixed(1)}L${(Math.cos(b) * 124).toFixed(1)} ${(Math.sin(b) * 124).toFixed(1)}Z`;
    }
    layers.push(spin(`<path d="${rays}" fill="#ffd84a" stroke="none" opacity=".45" class="fade"/>`, 18, 1));
  }
  // The plate itself: a white disc, its rim and a pattern around the rim.
  layers.push('<circle r="92" fill="#ffffff" fill-opacity=".92" stroke="none" class="fade"/>');
  layers.push('<circle r="66" fill="#f2f5ff" stroke="none" class="fade"/>');
  layers.push(ring(92, 2.4) + ring(66, 1.4));
  layers.push(spin(`<circle r="79" fill="none" stroke-width="3" stroke-dasharray=".02 .03" pathLength="1" class="fade"/>`, 20 - L, 1));
  if (L >= 2) layers.push(spin(around(8, 104, (x, y) => heart(x, y, 1.3)), 12, -1));
  if (L >= 3) layers.push(spin(around(6, 79, (x, y) => star(x, y, 1.3)), 9, 1));
  if (L >= 4) layers.push(spin(ring(114, 1) + around(36, 114, (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.2" class="dot"/>`), 24, 1));
  if (L >= 6) layers.push(spin(around(12, 128, (x, y) => star(x, y, 1.6)), 16, -1));
  if (L >= 7) layers.push(spin(ring(142, 2.2) + around(10, 142, (x, y) => heart(x, y, 1.6)), 30, 1));
  const box = boxFor(L);
  return `<svg xmlns="${NS}" viewBox="${-box} ${-box} ${box * 2} ${box * 2}" data-food="${food}">${layers.join('')}</svg>`;
}

/**
 * Show a plate centred at (x, y) inside `parent` (local coords). It draws
 * itself in over `chargeMs`; call `release()` when the dish leaves.
 */
export function plateRing(parent: HTMLElement, food: FoodId, x: number, y: number, level: number, cell: number, chargeMs: number) {
  const L = Math.max(1, Math.min(7, level));
  const wrap = document.createElement('div');
  wrap.className = `plate lv${L}`;
  const box = boxFor(L);
  const inner = cell * (1.5 + (L - 1) * 0.2);
  const size = (inner * box) / 92;
  Object.assign(wrap.style, { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` });
  const c = PLATE_COLORS[food];
  wrap.style.setProperty('--charge', `${chargeMs}ms`);
  wrap.style.setProperty('--line', c.line);
  wrap.style.setProperty('--glow', c.glow);
  wrap.style.setProperty('--ink', c.ink);
  wrap.innerHTML = plateSvg(food, L);
  if (L >= 7) {
    const spot = document.createElement('div');
    spot.className = 'spotlight';
    wrap.appendChild(spot);
  }
  parent.appendChild(wrap);
  return {
    release() {
      wrap.classList.add('release');
      setTimeout(() => wrap.remove(), 500);
    },
  };
}

/**
 * Fly the dish (its art `src`, on a little plate) from the board to the
 * customer. Bigger dishes are bigger and take a touch longer; resolves when
 * it arrives.
 */
export function serveDish(food: FoodId, level: number, src: string, from: Pt, to: Pt, cell: number): Promise<void> {
  const size = cell * (0.85 + level * 0.08);
  const ms = 480 + level * 30;
  const d = document.createElement('div');
  d.className = `dish food-${food}${level >= 6 ? ' glow' : ''}`;
  Object.assign(d.style, { width: `${size}px`, height: `${size}px`, margin: `${-size / 2}px 0 0 ${-size / 2}px` });
  d.innerHTML = `<img src="${src}" alt="">`;
  document.body.appendChild(d);
  const lift = Math.min(130, Math.abs(to.y - from.y) * 0.35 + 50);
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e - Math.sin(Math.PI * t) * lift;
      d.style.transform = `translate(${x}px, ${y}px) scale(${1 + Math.sin(Math.PI * t) * 0.2 - t * 0.25}) rotate(${Math.sin(t * Math.PI * 2) * 8}deg)`;
      foodTrail(food, x, y, level);
      if (t < 1) requestAnimationFrame(step);
      else { d.remove(); resolve(); }
    };
    requestAnimationFrame(step);
  });
}
