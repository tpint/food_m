// Arcane casting circle drawn under an item while the player "charges" a
// spell. Higher levels stack more geometry: rune rings, polygrams, tick
// rings, satellite circles and, at the top level, a pillar of light.

import type { ElementId } from '../game/config';

const NS = 'http://www.w3.org/2000/svg';

/** Bright, glow-friendly colors per element (earth uses amber so it reads on the board). */
export const CIRCLE_COLORS: Record<ElementId, { line: string; glow: string; ink: string; fill: string }> = {
  fire: { line: '#ffd27a', glow: '#ff6a2a', ink: '#7a1a08', fill: '255,110,40' },
  water: { line: '#bfeaff', glow: '#2f8fe8', ink: '#0c2f66', fill: '50,140,240' },
  wind: { line: '#c8fff0', glow: '#22b88a', ink: '#0a4a3a', fill: '50,200,150' },
  earth: { line: '#ffe0a0', glow: '#c0802a', ink: '#4a2a0a', fill: '190,130,50' },
};

/** Alchemical symbols: fire and air point up, water and earth point down; air and earth are crossed. */
const SYMBOL: Record<ElementId, string> = {
  fire: 'M0 -34L30 18L-30 18Z',
  water: 'M0 34L30 -18L-30 -18Z',
  wind: 'M0 -34L30 18L-30 18ZM-20 -2L20 -2',
  earth: 'M0 34L30 -18L-30 -18ZM-20 2L20 2',
};

let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/** A small made-up rune: 2-3 strokes inside a box of size k. */
function rune(k: number): string {
  const p = () => `${((rnd() - 0.5) * k).toFixed(1)} ${((rnd() - 0.5) * k * 1.3).toFixed(1)}`;
  let d = `M0 ${(-k * 0.65).toFixed(1)}L0 ${(k * 0.65).toFixed(1)}`;
  for (let i = 0; i < 1 + Math.floor(rnd() * 2); i++) d += `M${p()}L${p()}`;
  return d;
}

function polygram(r: number, n: number, step: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + ((i * step) % n) * ((Math.PI * 2) / n);
    pts.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

const circle = (r: number, w: number, extra = '') => `<circle r="${r}" fill="none" stroke-width="${w * 1.5}" pathLength="1" class="draw" ${extra}/>`;

function runeRing(r: number, count: number, k: number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * 360;
    out += `<path d="${rune(k)}" transform="rotate(${a}) translate(0 ${-r})" fill="none" stroke-width="2.4" stroke-linecap="round" class="fade"/>`;
  }
  return out;
}

function ticks(r: number, count: number, len: number): string {
  let d = '';
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2, long = i % 4 === 0 ? 1.8 : 1;
    d += `M${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}L${(Math.cos(a) * (r - len * long)).toFixed(1)} ${(Math.sin(a) * (r - len * long)).toFixed(1)}`;
  }
  return `<path d="${d}" stroke-width="1.8" class="fade"/>`;
}

const spin = (body: string, dur: number, dir = 1) => `<g class="spin${dir < 0 ? ' rev' : ''}" style="--dur:${dur}s">${body}</g>`;

/** Build the circle's SVG markup for an element at a level (1-7). */
export function circleSvg(el: ElementId, level: number): string {
  const L = Math.max(1, Math.min(7, level));
  seed = 7 + L * 13 + el.length;
  const c = CIRCLE_COLORS[el];
  const layers: string[] = [];
  // Tinted base disc so the bright lines glow against the light board.
  layers.push(`<radialGradient id="mcg"><stop offset="0" stop-color="rgb(${c.fill})" stop-opacity=".55"/><stop offset=".75" stop-color="rgb(${c.fill})" stop-opacity=".35"/><stop offset="1" stop-color="rgb(${c.fill})" stop-opacity=".1"/></radialGradient>`);
  layers.push(`<circle r="96" fill="url(#mcg)" class="fade"/>`);
  layers.push(spin(circle(92, 2.6) + circle(78, 1.2) + runeRing(85, 8 + L * 2, 7), 14 - L, 1));
  layers.push(`<path d="${SYMBOL[el]}" fill="none" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" pathLength="1" class="draw sym"/>`);
  if (L >= 2) layers.push(spin(`<path d="${polygram(78, 6, 1)}" fill="none" stroke-width="2" pathLength="1" class="draw"/>` + circle(20, 1.4), 18, -1));
  if (L >= 3) {
    let dots = '';
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; dots += `<circle cx="${(Math.cos(a) * 92).toFixed(1)}" cy="${(Math.sin(a) * 92).toFixed(1)}" r="4" class="dot"/>`; }
    layers.push(spin(circle(62, 1.2) + runeRing(54, 10, 6) + dots, 10, -1));
  }
  if (L >= 4) layers.push(spin(`<path d="${polygram(78, 7, 3)}" fill="none" stroke-width="2.2" pathLength="1" class="draw"/>` + ticks(100, 48, 5) + circle(100, 1), 22, 1));
  if (L >= 5) {
    let sats = '';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 360 + 45;
      sats += `<g transform="rotate(${a}) translate(0 -112)">${circle(14, 1.6)}${runeRing(9, 5, 4)}<circle r="3" class="dot"/></g>`;
    }
    layers.push(spin(sats, 16, -1));
  }
  if (L >= 6) {
    layers.push(spin(`<path d="${polygram(48, 5, 2)}" fill="none" stroke-width="2.4" pathLength="1" class="draw"/>` + circle(48, 1), 8, 1));
    layers.push(spin('<circle r="122" fill="none" stroke-width="1.4" pathLength="1" stroke-dasharray=".008 .012" class="fade"/>' + runeRing(130, 24, 6), 30, -1));
  }
  if (L >= 7) layers.push(spin(circle(140, 2.4) + ticks(146, 72, 6), 40, 1));
  const box = L >= 7 ? 160 : L >= 6 ? 145 : L >= 5 ? 130 : 108;
  return `<svg xmlns="${NS}" viewBox="${-box} ${-box} ${box * 2} ${box * 2}">${layers.join('')}</svg>`;
}

/**
 * Show a casting circle centred at (x, y) inside `parent` (local coords).
 * It draws itself in over `chargeMs`; call `release()` when the spell launches.
 */
export function magicCircle(parent: HTMLElement, el: ElementId, x: number, y: number, level: number, cell: number, chargeMs: number) {
  const L = Math.max(1, Math.min(7, level));
  const wrap = document.createElement('div');
  wrap.className = `mcircle lv${L}`;
  // The inner circle (r=92) is about 1.2 tiles at level 1, 3 tiles at level 7.
  const box = L >= 7 ? 160 : L >= 6 ? 145 : L >= 5 ? 130 : 108;
  const inner = cell * (1.8 + (L - 1) * 0.25);
  const size = (inner * box) / 92;
  Object.assign(wrap.style, { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` });
  wrap.style.setProperty('--charge', `${chargeMs}ms`);
  wrap.style.setProperty('--line', CIRCLE_COLORS[el].line);
  wrap.style.setProperty('--glow', CIRCLE_COLORS[el].glow);
  wrap.style.setProperty('--ink', CIRCLE_COLORS[el].ink);
  wrap.innerHTML = circleSvg(el, L);
  if (L >= 7) {
    const pillar = document.createElement('div');
    pillar.className = 'mpillar';
    wrap.appendChild(pillar);
  }
  parent.appendChild(wrap);
  return {
    release() {
      wrap.classList.add('release');
      setTimeout(() => wrap.remove(), 500);
    },
  };
}
