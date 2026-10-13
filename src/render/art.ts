// Procedural SVG art. Every item is drawn in a 100x100 box with the same
// light source (top-left), a soft colored outline and a ground shadow so all
// items feel like they belong on the same board.
//
// Each merge chain sticks to one palette and each level changes silhouette:
// small and simple -> tall -> wide -> a big party piece.

import { ChainId, CustomerKind, GEN_LEVELS, GenId } from '../game/config';
import type { Piece } from '../game/state';

interface Pal { hi: string; mid: string; lo: string; ink: string }

const P: Record<string, Pal> = {
  crystal: { hi: '#e4f9ff', mid: '#6fd0f5', lo: '#2f86c9', ink: '#1d5a8f' },
  herb: { hi: '#dcf7b4', mid: '#74c64f', lo: '#3c8a34', ink: '#2c5a27' },
  wood: { hi: '#e7b77d', mid: '#b67a43', lo: '#7c4a24', ink: '#553016' },
  pot: { hi: '#ffc9a3', mid: '#e48a5a', lo: '#b05a34', ink: '#7a3a1e' },
  flame: { hi: '#fff3b0', mid: '#ffa23c', lo: '#e8502e', ink: '#9c3020' },
  wax: { hi: '#fffaf0', mid: '#ffe9c4', lo: '#e8c48f', ink: '#a7773f' },
  purple: { hi: '#efe0ff', mid: '#ae7bec', lo: '#6a3fb8', ink: '#44287a' },
  paper: { hi: '#fffaf0', mid: '#f4e6c4', lo: '#d7bf8c', ink: '#8a6a3a' },
  coin: { hi: '#fff6c2', mid: '#ffd147', lo: '#e09a1c', ink: '#9a6510' },
  pink: { hi: '#ffe3f4', mid: '#ff85cb', lo: '#d63f98', ink: '#8f2366' },
  stone: { hi: '#e6e2ec', mid: '#b3aec0', lo: '#7d7690', ink: '#524b66' },
  metal: { hi: '#fff4cf', mid: '#e9c46a', lo: '#b8862e', ink: '#7a5418' },
};

let uid = 0;

/** Pixel size the art is drawn at: the largest it is shown (about 100 CSS px) on a 3x screen, plus headroom. */
const RASTER = 384;

/**
 * Builds an SVG document in three layers: `back` (halo + ground shadow),
 * `body` (the object, drawn with a chunky sticker outline) and `fx`
 * (sparkles on top). Gradient ids are local to this image.
 */
class Svg {
  defs: string[] = [];
  body: string[] = [];
  fx: string[] = [];
  /** Drawn behind the body but left out of the framing, so it never shrinks the object. */
  behind: string[] = [];
  haloColor = '';
  shadowRx = 0;
  private g = new Map<string, string>();

  /** Radial gradient lit from the top-left, darkening toward the edge. */
  rad(p: Pal, key = 'r'): string {
    const k = `${key}${p.mid}`;
    if (!this.g.has(k)) {
      const id = `g${uid++}`;
      this.defs.push(`<radialGradient id="${id}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${p.hi}"/><stop offset=".45" stop-color="${p.mid}"/><stop offset=".85" stop-color="${p.lo}"/><stop offset="1" stop-color="${p.ink}"/></radialGradient>`);
      this.g.set(k, id);
    }
    return `url(#${this.g.get(k)})`;
  }

  lin(a: string, b: string, vertical = true): string {
    const k = `l${a}${b}${vertical}`;
    if (!this.g.has(k)) {
      const id = `g${uid++}`;
      const xy = vertical ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"';
      this.defs.push(`<linearGradient id="${id}" ${xy}><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`);
      this.g.set(k, id);
    }
    return `url(#${this.g.get(k)})`;
  }

  add(s: string) { this.body.push(s); return this; }

  /** Soft colored glow behind the object; placed when the image is framed. */
  halo(color: string) { this.haloColor = color; return this; }

  /** Ground shadow under the object; placed when the image is framed. */
  shadow(rx = 26, _cy?: number) { this.shadowRx = rx; return this; }

  sparkle(x: number, y: number, r: number, color = '#fff') {
    const q = r * 0.28;
    this.fx.push(`<path d="M${x} ${y - r}Q${x + q} ${y - q} ${x + r} ${y}Q${x + q} ${y + q} ${x} ${y + r}Q${x - q} ${y + q} ${x - r} ${y}Q${x - q} ${y - q} ${x} ${y - r}Z" fill="${color}" stroke="rgba(90,60,120,.35)" stroke-width=".8"/>`);
    return this;
  }

  inner() {
    // Vibrant and crisp: a solid navy outline, a tight offset shadow, boosted colour and a little extra contrast.
    const outline = `<filter id="o${uid}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="1.5" result="d"/>
<feFlood flood-color="#28306a"/><feComposite in2="d" operator="in" result="ol"/>
<feGaussianBlur in="d" stdDeviation=".5"/><feOffset dy="2.2" result="b"/>
<feFlood flood-color="#1e3a8a" flood-opacity=".28"/><feComposite in2="b" operator="in" result="sh"/>
<feColorMatrix in="SourceGraphic" type="saturate" values="1.25" result="sat"/>
<feComponentTransfer in="sat" result="g"><feFuncR type="linear" slope="1.08" intercept="-.03"/><feFuncG type="linear" slope="1.08" intercept="-.03"/><feFuncB type="linear" slope="1.08" intercept="-.03"/></feComponentTransfer>
<feMerge><feMergeNode in="sh"/><feMergeNode in="ol"/><feMergeNode in="g"/></feMerge></filter>`;
    return { defs: this.defs.join('') + outline, filter: `o${uid++}` };
  }

  /** Frame the body tightly: `fill` is the share of the square the object occupies. */
  toString(fill = 0.86) {
    const { defs, filter } = this.inner();
    const body = `<g id="c" filter="url(#${filter})">${this.body.join('')}</g>`;
    let box = { x: 0, y: 0, width: 100, height: 100 };
    const m = measure(`<defs>${defs}</defs>${body}`);
    if (m && m.width > 0) box = { x: m.x - 3, y: m.y - 3, width: m.width + 6, height: m.height + 6 };
    const size = Math.max(box.width, box.height) / fill;
    const cx = box.x + box.width / 2;
    const bottom = box.y + box.height;
    // Sit the object slightly low so the ground shadow has room.
    const vy = Math.min(box.y + box.height / 2 - size / 2, bottom - size * 0.93);
    const vx = cx - size / 2;
    const back: string[] = [];
    if (this.haloColor) {
      const hid = `h${uid++}`;
      back.push(`<radialGradient id="${hid}"><stop offset="0" stop-color="${this.haloColor}" stop-opacity=".8"/><stop offset=".6" stop-color="${this.haloColor}" stop-opacity=".35"/><stop offset="1" stop-color="${this.haloColor}" stop-opacity="0"/></radialGradient>`);
      back.push(`<circle cx="${cx}" cy="${vy + size / 2}" r="${size / 2}" fill="url(#${hid})"/>`);
    }
    if (this.shadowRx) {
      const rx = Math.min(box.width * 0.42, size * 0.42);
      back.push(`<ellipse cx="${cx}" cy="${bottom - 3}" rx="${rx}" ry="${rx * 0.2}" fill="#3a2350" opacity=".22"/>`);
    }
    const f = (n: number) => n.toFixed(2);
    // A large intrinsic size: WebKit (every iPhone browser) renders the filters above
    // at an SVG image's own size and then scales the result, so a small or default
    // size leaves outlines blurry on high-density screens. CSS sets the shown size.
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${RASTER}" height="${RASTER}" viewBox="${f(vx)} ${f(vy)} ${f(size)} ${f(size)}"><defs>${defs}</defs>${back.join('')}${this.behind.join('')}${body}${this.fx.join('')}</svg>`;
  }
}

let measurer: SVGSVGElement | null = null;

/** Bounding box of the body group, measured in a hidden SVG (browser only). */
function measure(inner: string): DOMRect | null {
  if (typeof document === 'undefined') return null;
  if (!measurer) {
    measurer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    measurer.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:100px;height:100px;visibility:hidden');
    document.body.appendChild(measurer);
  }
  measurer.innerHTML = inner;
  const g = measurer.querySelector('#c') as SVGGElement | null;
  return g ? g.getBBox() : null;
}

const sw = 'stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const shape = (d: string, fill: string, ink: string, extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${ink}" ${extra.includes('stroke-width') ? sw.replace('stroke-width="3" ', '') : sw} ${extra}/>`;
const hl = (d: string, w = 3, op = 0.75) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
const ell = (cx: number, cy: number, rx: number, ry: number, fill: string, ink: string, extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${ink}" ${extra.includes('stroke-width') ? sw.replace('stroke-width="3" ', '') : sw} ${extra}/>`;
const circ = (cx: number, cy: number, r: number, fill: string, ink: string, extra = '') => ell(cx, cy, r, r, fill, ink, extra);

/** Glass: a see-through fill that still reads on the light board. */
const GLASS = 'rgba(226,244,255,.72)';
const GLASS_INK = '#2a5a8a';

/** A few coloured sprinkles scattered over an area. */
function sprinkles(s: Svg, pts: [number, number, number][], colors = ['#ff5a8a', '#4ac8ff', '#ffe066', '#7ee08e', '#b98cff']) {
  pts.forEach(([x, y, a], i) => s.add(`<rect x="${x - 3}" y="${y - 1.1}" width="6" height="2.2" rx="1.1" fill="${colors[i % colors.length]}" transform="rotate(${a} ${x} ${y})"/>`));
}

/** Wavy steam rising from (x, y). */
function steam(s: Svg, x: number, y: number, h = 18) {
  s.fx.push(`<path d="M${x} ${y}q-5 ${-h / 4} 0 ${-h / 2}t0 ${-h / 2}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>`);
}

// ------------------------------------------------------------------ bakery

const WHEAT = { hi: '#fff4b8', mid: '#f2c94c', lo: '#c48a1e', ink: '#6a4410' };
const BREAD = { hi: '#ffe2a8', mid: '#e3a352', lo: '#a8622a', ink: '#5a3012' };
const SACK = { hi: '#fbf3e0', mid: '#e2cfa4', lo: '#ad9462', ink: '#5e4a2a' };
const DOUGH = { hi: '#fffdf6', mid: '#f7e8cc', lo: '#dcc196', ink: '#7a5a30' };
const WICKER = { hi: '#f0c890', mid: '#c48a4a', lo: '#8a5626', ink: '#4e2e10' };

/** One ear of wheat from (x, by) up to height h, leaning by `rot` degrees. */
function wheatStalk(s: Svg, x: number, by: number, h: number, rot: number) {
  s.add(`<g transform="rotate(${rot} ${x} ${by})">`);
  s.add(shape(`M${x} ${by}L${x} ${by - h}`, 'none', WHEAT.ink, 'stroke-width="3"'));
  for (let i = 0; i < 5; i++) {
    const y = by - h * 0.45 - i * h * 0.11;
    for (const f of [-1, 1]) s.add(ell(x + f * 4, y, 3.6, 6, s.rad(WHEAT), WHEAT.ink, `stroke-width="1.8" transform="rotate(${f * 28} ${x + f * 4} ${y})"`));
  }
  s.add(ell(x, by - h * 0.97, 3.2, 5.5, s.rad(WHEAT), WHEAT.ink, 'stroke-width="1.8"'));
  s.add('</g>');
}

function roll(s: Svg, cx: number, cy: number, r: number) {
  s.add(shape(`M${cx - r} ${cy + r * 0.5}Q${cx - r * 1.05} ${cy - r * 0.8} ${cx} ${cy - r * 0.85}Q${cx + r * 1.05} ${cy - r * 0.8} ${cx + r} ${cy + r * 0.5}Q${cx} ${cy + r * 0.85} ${cx - r} ${cy + r * 0.5}Z`, s.rad(BREAD), BREAD.ink));
  s.add(`<path d="M${cx - r * 0.45} ${cy - r * 0.35}Q${cx - r * 0.2} ${cy - r * 0.55} ${cx} ${cy - r * 0.4}M${cx + r * 0.05} ${cy - r * 0.15}Q${cx + r * 0.3} ${cy - r * 0.35} ${cx + r * 0.55} ${cy - r * 0.2}" fill="none" stroke="${BREAD.ink}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`);
  s.add(hl(`M${cx - r * 0.7} ${cy}Q${cx - r * 0.6} ${cy - r * 0.5} ${cx - r * 0.25} ${cy - r * 0.62}`, 2.4, 0.6));
}

function croissant(s: Svg, cx: number, cy: number, k: number) {
  const segs: [number, number, number, number, number][] = [[-26, 14, 9, 13, -55], [26, 14, 9, 13, 55], [-14, 4, 12, 16, -28], [14, 4, 12, 16, 28], [0, 0, 14, 19, 0]];
  for (const [dx, dy, rx, ry, a] of segs) {
    const x = cx + dx * k, y = cy + dy * k;
    s.add(ell(x, y, rx * k, ry * k, s.rad(BREAD), BREAD.ink, `transform="rotate(${a} ${x} ${y})"`));
    s.add(`<path d="M${x - rx * k * 0.5} ${y - ry * k * 0.45}Q${x} ${y - ry * k * 0.75} ${x + rx * k * 0.5} ${y - ry * k * 0.45}" fill="none" stroke="#fff" stroke-width="${2 * k}" opacity=".5" transform="rotate(${a} ${x} ${y})"/>`);
  }
}

function baguette(s: Svg, cx: number, cy: number, len: number, rot: number) {
  const h = len * 0.2;
  s.add(`<g transform="rotate(${rot} ${cx} ${cy})">`);
  s.add(shape(`M${cx - len / 2} ${cy}Q${cx - len / 2} ${cy - h / 2} ${cx - len / 2 + h} ${cy - h / 2}L${cx + len / 2 - h} ${cy - h / 2}Q${cx + len / 2} ${cy - h / 2} ${cx + len / 2} ${cy}Q${cx + len / 2} ${cy + h / 2} ${cx + len / 2 - h} ${cy + h / 2}L${cx - len / 2 + h} ${cy + h / 2}Q${cx - len / 2} ${cy + h / 2} ${cx - len / 2} ${cy}Z`, s.rad(BREAD), BREAD.ink));
  for (let i = 0; i < 4; i++) {
    const x = cx - len * 0.3 + i * len * 0.2;
    s.add(`<path d="M${x - h * 0.3} ${cy - h * 0.28}L${x + h * 0.3} ${cy + h * 0.1}" stroke="${BREAD.ink}" stroke-width="2.4" stroke-linecap="round" opacity=".6"/><path d="M${x - h * 0.15} ${cy - h * 0.3}L${x + h * 0.35} ${cy}" stroke="#ffe8b8" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`);
  }
  s.add('</g>');
}

const bakeryArt: ((s: Svg) => void)[] = [
  (s) => {
    s.shadow(14);
    wheatStalk(s, 50, 88, 62, -20); wheatStalk(s, 50, 88, 62, 20); wheatStalk(s, 50, 88, 70, 0);
    s.add(shape('M44 72Q50 76 56 72L56 78Q50 82 44 78Z', '#7ee08e', '#2e6a2e', 'stroke-width="2"'));
  },
  (s) => {
    s.shadow(24);
    s.add(shape('M26 88Q20 60 30 40L36 32Q50 28 64 32L70 40Q80 60 74 88Q50 93 26 88Z', s.rad(SACK), SACK.ink));
    s.add(shape('M36 32Q30 18 40 15Q50 21 60 15Q70 18 64 32Z', s.rad(SACK), SACK.ink));
    s.add(`<path d="M35 32Q50 37 65 32" fill="none" stroke="#c0503a" stroke-width="4" stroke-linecap="round"/>`);
    s.add(circ(50, 62, 13, '#fff8e8', SACK.ink, 'stroke-width="2"'));
    wheatStalk(s, 50, 72, 18, 0);
    s.add(hl('M32 50Q28 66 32 80', 2.6, 0.6));
    s.add('<g fill="#fff"><circle cx="44" cy="12" r="2.6"/><circle cx="54" cy="9" r="2"/><circle cx="60" cy="13" r="1.6"/></g>');
  },
  (s) => {
    s.shadow(30);
    s.add(shape('M10 82L90 82L86 92L14 92Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M20 80Q16 58 34 52Q50 42 66 52Q84 58 80 80Q50 88 20 80Z', s.rad(DOUGH), DOUGH.ink));
    s.add(hl('M28 66Q34 56 46 54', 3, 0.8));
    s.add('<g fill="#fff"><circle cx="62" cy="62" r="1.6"/><circle cx="70" cy="70" r="1.2"/><circle cx="30" cy="74" r="1.4"/><circle cx="24" cy="86" r="1.6"/><circle cx="78" cy="86" r="1.3"/></g>');
    s.add(`<g transform="rotate(-12 50 46)">${shape('M28 42L72 42L72 50L28 50Z', s.rad(P.wood), P.wood.ink)}${shape('M14 44L28 44L28 48L14 48Z', s.rad(P.wood), P.wood.ink, 'stroke-width="2"')}${shape('M72 44L86 44L86 48L72 48Z', s.rad(P.wood), P.wood.ink, 'stroke-width="2"')}</g>`);
  },
  (s) => {
    s.shadow(28);
    roll(s, 50, 62, 30);
    s.add('<g fill="#fff8e0" stroke="#a8622a" stroke-width=".8"><ellipse cx="40" cy="44" rx="2.2" ry="1.3"/><ellipse cx="54" cy="40" rx="2.2" ry="1.3" transform="rotate(30 54 40)"/><ellipse cx="62" cy="48" rx="2.2" ry="1.3" transform="rotate(-20 62 48)"/><ellipse cx="46" cy="52" rx="2.2" ry="1.3"/></g>');
  },
  (s) => { s.shadow(34); croissant(s, 50, 58, 1.35); s.sparkle(80, 30, 4.5, '#fff6c4'); },
  (s) => {
    s.shadow(34);
    baguette(s, 50, 56, 84, -40);
    baguette(s, 54, 62, 80, -62);
    s.add(shape('M30 92L30 64L70 64L70 92Z', s.rad({ hi: '#f8e6c4', mid: '#dcbc8a', lo: '#a88454', ink: '#5e4420' }), '#5e4420'));
    s.add(`<path d="M30 70L70 70" stroke="#c0503a" stroke-width="4"/><circle cx="50" cy="80" r="5" fill="#fff8e8" stroke="#5e4420" stroke-width="1.6"/>`);
  },
  (s) => {
    s.halo('#ffe2a0'); s.shadow(40);
    baguette(s, 36, 34, 60, -62);
    croissant(s, 64, 44, 0.75);
    roll(s, 44, 50, 16);
    s.add(shape('M10 56L90 56L80 92L20 92Z', s.rad(WICKER), WICKER.ink));
    for (let i = 0; i < 4; i++) s.add(`<path d="M${14 + i * 2} ${64 + i * 8}L${86 - i * 2} ${64 + i * 8}" stroke="${WICKER.ink}" stroke-width="1.6" opacity=".55"/>`);
    for (let x = 22; x < 82; x += 8) s.add(`<path d="M${x} 58L${x + (x - 50) * 0.08} 90" stroke="${WICKER.lo}" stroke-width="1.6" opacity=".7"/>`);
    s.add(shape('M8 54L92 54L90 62L10 62Z', s.rad(WICKER), WICKER.ink));
    // Checked cloth hanging over the rim.
    s.add(shape('M14 56L40 56L32 76L20 70Z', '#fff', '#8a2a2a', 'stroke-width="2"'));
    s.add('<path d="M18 58L36 58M17 63L33 63M18 68L30 68M22 56L22 72M28 56L26 74M34 56L31 70" stroke="#e8403a" stroke-width="2.4" opacity=".75"/>');
    s.sparkle(84, 22, 5, '#fff6c4'); s.sparkle(14, 30, 3.5, '#fff6c4');
  },
];

// ------------------------------------------------------------------ drinks

const LEMON = { hi: '#fffbd0', mid: '#ffe066', lo: '#e8b020', ink: '#8a6410' };
const CUP = { hi: '#ffffff', mid: '#f2f4fa', lo: '#c8cfe0', ink: '#4a5478' };
const COFFEE = '#7a4626';

/** A tumbler from y=top to y=bottom with liquid from y=level down. */
function tumbler(s: Svg, top: number, bottom: number, wTop: number, wBot: number, level: number, liquid: string) {
  const t = (y: number) => wTop + (wBot - wTop) * ((y - top) / (bottom - top));
  const lw = t(level);
  s.add(shape(`M${50 - wTop / 2} ${top}L${50 + wTop / 2} ${top}L${50 + wBot / 2} ${bottom}L${50 - wBot / 2} ${bottom}Z`, GLASS, GLASS_INK));
  s.add(`<path d="M${50 - lw / 2 + 2} ${level}L${50 + lw / 2 - 2} ${level}L${50 + wBot / 2 - 2} ${bottom - 2}L${50 - wBot / 2 + 2} ${bottom - 2}Z" fill="${liquid}"/>`);
  s.add(`<ellipse cx="50" cy="${level}" rx="${lw / 2 - 2}" ry="2.6" fill="#fff" opacity=".45"/>`);
  s.add(hl(`M${50 - wTop / 2 + 5} ${top + 6}L${50 - wBot / 2 + 5} ${bottom - 6}`, 3, 0.85));
}

function straw(s: Svg, x1: number, y1: number, x2: number, y2: number, color = '#ff5a8a') {
  s.add(shape(`M${x1} ${y1}L${x2} ${y2}`, 'none', '#7a2a4a', 'stroke-width="7"'));
  s.add(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`);
  s.add(`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#fff" stroke-width="4" stroke-dasharray="3 5" opacity=".9"/>`);
}

function lemonSlice(s: Svg, x: number, y: number, r: number) {
  s.add(circ(x, y, r, s.rad(LEMON), LEMON.ink, 'stroke-width="2"'));
  s.add(`<circle cx="${x}" cy="${y}" r="${r * 0.72}" fill="#fff6b0"/>`);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    s.add(`<path d="M${x} ${y}L${(x + Math.cos(a) * r * 0.7).toFixed(1)} ${(y + Math.sin(a) * r * 0.7).toFixed(1)}" stroke="${LEMON.lo}" stroke-width="1.2"/>`);
  }
}

function cream(s: Svg, cx: number, cy: number, w: number) {
  const k = w / 40;
  s.add(shape(`M${cx - 20 * k} ${cy}Q${cx - 24 * k} ${cy - 10 * k} ${cx - 12 * k} ${cy - 11 * k}Q${cx - 12 * k} ${cy - 22 * k} ${cx} ${cy - 20 * k}Q${cx + 4 * k} ${cy - 30 * k} ${cx + 8 * k} ${cy - 20 * k}Q${cx + 20 * k} ${cy - 22 * k} ${cx + 13 * k} ${cy - 11 * k}Q${cx + 24 * k} ${cy - 10 * k} ${cx + 20 * k} ${cy}Z`, s.rad(CUP), CUP.ink, 'stroke-width="2.4"'));
}

const drinksArt: ((s: Svg) => void)[] = [
  (s) => {
    s.shadow(18);
    tumbler(s, 30, 88, 38, 30, 46, 'rgba(110,190,248,.75)');
    s.add(shape('M42 50L56 47L58 60L44 62Z', 'rgba(255,255,255,.85)', GLASS_INK, 'stroke-width="2"'));
    s.add('<g fill="#fff" opacity=".9"><circle cx="54" cy="72" r="2"/><circle cx="46" cy="78" r="1.6"/><circle cx="56" cy="82" r="1.3"/></g>');
  },
  (s) => {
    s.shadow(20);
    straw(s, 58, 60, 70, 14);
    tumbler(s, 26, 90, 40, 32, 38, 'rgba(255,224,90,.9)');
    lemonSlice(s, 30, 28, 11);
    s.add('<g fill="#fff" opacity=".9"><circle cx="46" cy="60" r="2"/><circle cx="54" cy="74" r="1.6"/><circle cx="44" cy="80" r="1.3"/></g>');
  },
  (s) => {
    s.shadow(30);
    s.add(ell(50, 84, 36, 8, s.rad(CUP), CUP.ink));
    s.add(shape('M72 54Q88 54 86 64Q84 74 68 72', 'none', CUP.ink, 'stroke-width="8"') + shape('M72 54Q88 54 86 64Q84 74 68 72', 'none', CUP.mid, 'stroke-width="4"'));
    s.add(shape('M26 48L74 48Q74 80 50 82Q26 80 26 48Z', s.rad(CUP), CUP.ink));
    s.add(ell(50, 48, 24, 5.5, COFFEE, CUP.ink, 'stroke-width="2.4"'));
    s.add('<path d="M44 47Q50 44 56 47Q50 50 44 47Z" fill="#e8c8a0"/>');
    s.add(hl('M32 56Q32 70 40 76', 2.6, 0.7));
    steam(s, 42, 38, 18); steam(s, 56, 34, 20);
  },
  (s) => {
    s.shadow(28);
    const red = { hi: '#ffb8a8', mid: '#ef4a4a', lo: '#a82424', ink: '#5a1010' };
    s.add(shape('M70 46Q88 46 86 60Q84 74 68 72', 'none', red.ink, 'stroke-width="9"') + shape('M70 46Q88 46 86 60Q84 74 68 72', 'none', red.mid, 'stroke-width="4.5"'));
    s.add(shape('M24 38L72 38L70 86Q48 92 26 86Z', s.rad(red), red.ink));
    s.add(ell(48, 38, 24, 5.5, '#8a5232', red.ink, 'stroke-width="2.4"'));
    for (const [x, y, c] of [[38, 34, '#fff'], [48, 31, '#ffd0e0'], [58, 34, '#fff'], [46, 37, '#fff']] as const) s.add(shape(`M${x - 4} ${y - 3}L${x + 4} ${y - 3}L${x + 4} ${y + 3}L${x - 4} ${y + 3}Z`, c, '#a07a6a', 'stroke-width="1.6"'));
    s.add('<path d="M30 60Q48 66 66 60" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="2 6" stroke-linecap="round" opacity=".8"/>');
    steam(s, 40, 26, 16); steam(s, 56, 24, 18);
  },
  (s) => {
    s.shadow(22);
    straw(s, 56, 30, 70, 2, '#ff5a8a');
    const glass = 'M30 30L70 30L60 72L54 76L54 84L66 88L34 88L46 84L46 76L40 72Z';
    s.add(shape(glass, GLASS, GLASS_INK));
    s.add('<path d="M33 34L67 34L58.5 70L41.5 70Z" fill="#ff9ec8"/>');
    s.add('<path d="M36 44L64 44M38 54L62 54" stroke="#fff" stroke-width="2" opacity=".5"/>');
    cream(s, 50, 32, 42);
    s.add(circ(52, 8, 6, s.rad({ hi: '#ffb0b0', mid: '#e8203a', lo: '#a01020', ink: '#5a0a10' }), '#5a0a10', 'stroke-width="2"'));
    s.add('<path d="M53 3Q56 -4 62 -4" fill="none" stroke="#3a6a2a" stroke-width="2"/>');
    sprinkles(s, [[40, 22, 20], [58, 20, -30], [48, 16, 70], [62, 26, 10]]);
    s.add(hl('M35 36L42 66', 2.6, 0.8));
  },
  (s) => {
    s.shadow(22);
    s.add(shape('M57 8L63 8L60 60L54 60Z', '#ff8ac0', '#7a2a4a', 'stroke-width="2.4"'));
    s.add(shape('M30 36L70 36L64 90L36 90Z', GLASS, GLASS_INK));
    s.add('<path d="M33 46L67 46L62 88L38 88Z" fill="#d8a878"/>');
    for (const [x, y] of [[42, 82], [50, 84], [58, 82], [46, 76], [55, 76], [40, 70]]) s.add(`<circle cx="${x}" cy="${y}" r="3.6" fill="#3a2418"/><circle cx="${x - 1}" cy="${y - 1.2}" r="1" fill="#fff" opacity=".7"/>`);
    s.add(shape('M28 36Q50 14 72 36Z', 'rgba(255,255,255,.6)', GLASS_INK, 'stroke-width="2.4"'));
    s.add(shape('M26 34L74 34L74 39L26 39Z', 'rgba(255,255,255,.8)', GLASS_INK, 'stroke-width="2"'));
    s.add(hl('M35 42L39 84', 2.6, 0.8));
  },
  (s) => {
    s.halo('#ffc0c0'); s.shadow(36);
    s.add(shape('M40 84L60 84L64 92L36 92Z', GLASS, GLASS_INK));
    s.add(shape('M46 76L54 76L54 86L46 86Z', GLASS, GLASS_INK, 'stroke-width="2.4"'));
    s.add(shape('M76 20L66 52', 'none', '#8a8aa0', 'stroke-width="5"'));
    s.add(shape('M8 40Q10 78 50 80Q90 78 92 40Z', GLASS, GLASS_INK));
    s.add('<path d="M12 48Q16 74 50 76Q84 74 88 48Z" fill="#ff5a6a"/>');
    s.add(ell(50, 48, 38, 6, '#ff8a8a', GLASS_INK, 'stroke-width="1.6"'));
    lemonSlice(s, 30, 46, 8);
    s.add(circ(64, 46, 8, s.rad({ hi: '#ffe0b0', mid: '#ff9a3c', lo: '#d8601a', ink: '#7a3410' }), '#7a3410', 'stroke-width="2"'));
    s.add('<path d="M44 42L52 40L54 48L46 50Z" fill="#fff" stroke="#2a5a8a" stroke-width="1.4" opacity=".9"/>');
    s.add(circ(76, 20, 5, s.rad(P.stone), P.stone.ink, 'stroke-width="2"'));
    s.add(hl('M16 50Q20 68 34 74', 3, 0.8));
    s.sparkle(88, 18, 6); s.sparkle(14, 24, 4);
  },
];

// ------------------------------------------------------------------ desserts

const PINK = { hi: '#ffe3f0', mid: '#ff8ec4', lo: '#e0508e', ink: '#8a2458' };
const COOKIE = { hi: '#ffe6b8', mid: '#e0a85e', lo: '#a86c30', ink: '#5a3414' };
const CHOC = { hi: '#c8946a', mid: '#7a4a2a', lo: '#4a2814', ink: '#2a1408' };
const VANILLA = { hi: '#fffef6', mid: '#fff3d0', lo: '#e8d09a', ink: '#8a6a30' };
const BERRY = { hi: '#ffb0b0', mid: '#ee3a4a', lo: '#a81a28', ink: '#5a0a14' };

function strawberry(s: Svg, x: number, y: number, k: number) {
  s.add(shape(`M${x} ${y + 9 * k}Q${x - 9 * k} ${y + 2 * k} ${x - 7 * k} ${y - 4 * k}Q${x} ${y - 7 * k} ${x + 7 * k} ${y - 4 * k}Q${x + 9 * k} ${y + 2 * k} ${x} ${y + 9 * k}Z`, s.rad(BERRY), BERRY.ink, 'stroke-width="2"'));
  s.add(`<path d="M${x - 5 * k} ${y - 5 * k}L${x} ${y - 2 * k}L${x + 5 * k} ${y - 5 * k}L${x} ${y - 8 * k}Z" fill="#5ab84a" stroke="#2e6a2e" stroke-width="1.2"/>`);
  s.add(`<g fill="#ffe8a0"><circle cx="${x - 3 * k}" cy="${y}" r="${0.8 * k}"/><circle cx="${x + 3 * k}" cy="${y + 1 * k}" r="${0.8 * k}"/><circle cx="${x}" cy="${y + 4 * k}" r="${0.8 * k}"/></g>`);
}

function cherry(s: Svg, x: number, y: number, r = 5) {
  s.add(`<path d="M${x + 1} ${y - r + 1}Q${x + 3} ${y - r - 8} ${x + 9} ${y - r - 9}" fill="none" stroke="#3a6a2a" stroke-width="2"/>`);
  s.add(circ(x, y, r, s.rad(BERRY), BERRY.ink, 'stroke-width="2"'));
  s.add(`<circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="#fff" opacity=".8"/>`);
}

function scoop(s: Svg, x: number, y: number, r: number, p: { hi: string; mid: string; lo: string; ink: string }) {
  s.add(shape(`M${x - r} ${y + r * 0.3}Q${x - r} ${y - r} ${x} ${y - r}Q${x + r} ${y - r} ${x + r} ${y + r * 0.3}Q${x + r * 0.6} ${y + r * 0.6} ${x + r * 0.3} ${y + r * 0.3}Q${x} ${y + r * 0.7} ${x - r * 0.3} ${y + r * 0.35}Q${x - r * 0.7} ${y + r * 0.65} ${x - r} ${y + r * 0.3}Z`, s.rad(p), p.ink, 'stroke-width="2.4"'));
  s.add(hl(`M${x - r * 0.6} ${y - r * 0.2}Q${x - r * 0.45} ${y - r * 0.65} ${x - r * 0.05} ${y - r * 0.7}`, 2.2, 0.7));
}

const dessertArt: ((s: Svg) => void)[] = [
  (s) => {
    s.shadow(20);
    s.add(shape('M30 50L14 38L16 62Z', s.rad(PINK), PINK.ink) + shape('M70 50L86 38L84 62Z', s.rad(PINK), PINK.ink));
    s.add(circ(50, 50, 20, s.rad(PINK), PINK.ink));
    s.add('<path d="M50 50m-14 0a14 14 0 0 1 28 0a10 10 0 0 1 -20 0a6 6 0 0 1 12 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>');
    s.add(hl('M38 40Q42 34 50 33', 2.6, 0.8));
  },
  (s) => {
    s.shadow(24);
    s.add(shape('M50 22Q78 22 80 50Q80 78 50 80Q20 80 20 52Q22 20 50 22Z', s.rad(COOKIE), COOKIE.ink));
    for (const [x, y, r] of [[38, 38, 4], [58, 34, 3.5], [66, 52, 4.5], [44, 58, 4], [34, 66, 3], [56, 68, 3.6], [50, 46, 2.8]]) {
      s.add(`<path d="M${x - r} ${y}Q${x - r} ${y - r} ${x} ${y - r}Q${x + r} ${y - r * 0.8} ${x + r} ${y + r * 0.2}Q${x} ${y + r * 1.1} ${x - r} ${y}Z" fill="${CHOC.mid}" stroke="${CHOC.ink}" stroke-width="1.2"/>`);
    }
    s.add(`<path d="M30 46L33 44M62 62L65 64M44 28L47 30" stroke="${COOKIE.lo}" stroke-width="2" stroke-linecap="round"/>`);
    s.add(hl('M28 44Q32 30 46 27', 2.6, 0.6));
  },
  (s) => {
    s.shadow(24);
    s.add(shape('M28 56L72 56L64 90L36 90Z', s.rad({ hi: '#e0f4ff', mid: '#8ccff8', lo: '#3a8ad8', ink: '#1a4a80' }), '#1a4a80'));
    for (const x of [36, 44, 52, 60]) s.add(`<path d="M${x + 1} 58L${x + 1 - (x - 50) * 0.1} 88" stroke="#fff" stroke-width="2.6" opacity=".7"/>`);
    s.add(shape('M24 58Q20 46 32 42Q30 30 44 30Q46 20 56 22Q68 22 66 32Q80 34 76 46Q82 52 76 58Q50 64 24 58Z', s.rad(PINK), PINK.ink));
    s.add('<path d="M30 50Q50 56 70 48M36 38Q50 44 62 36" fill="none" stroke="#fff" stroke-width="2.4" opacity=".6"/>');
    sprinkles(s, [[36, 46, 20], [48, 40, -30], [60, 44, 60], [42, 52, -10], [64, 52, 30], [54, 32, 0]]);
    cherry(s, 54, 20, 6);
  },
  (s) => {
    s.shadow(30);
    s.add(`<path d="M50 24A30 28 0 1 1 49.9 24ZM50 42A11 9 0 1 0 50.1 42Z" fill="${s.rad(COOKIE)}" fill-rule="evenodd" stroke="${COOKIE.ink}" ${sw}/>`);
    s.add(`<path d="M50 28Q66 26 74 38Q80 48 74 56Q76 64 68 66Q60 74 50 70Q40 74 32 66Q24 64 26 56Q20 48 26 38Q34 26 50 28ZM50 42A11 9 0 1 0 50.1 42Z" fill="${s.rad(PINK)}" fill-rule="evenodd" stroke="${PINK.ink}" stroke-width="2.4" stroke-linejoin="round"/>`);
    sprinkles(s, [[36, 38, 20], [62, 36, -40], [70, 52, 80], [32, 54, -20], [56, 64, 10], [42, 64, 50], [50, 32, 90], [66, 44, 30]]);
    s.add(hl('M32 42Q36 32 46 30', 2.6, 0.7));
  },
  (s) => {
    s.shadow(24);
    s.add(shape('M24 50L76 50Q74 70 56 74L54 82L64 86L64 90L36 90L36 86L46 82L44 74Q26 70 24 50Z', GLASS, GLASS_INK));
    scoop(s, 38, 46, 13, VANILLA); scoop(s, 62, 46, 13, PINK); scoop(s, 50, 34, 14, CHOC);
    s.add(`<path d="M40 38Q44 46 40 52M58 34Q62 44 60 50M50 24Q46 32 50 38" fill="none" stroke="${CHOC.lo}" stroke-width="3" stroke-linecap="round"/>`);
    s.add(shape('M70 14L80 40L76 41L66 15Z', s.rad(COOKIE), COOKIE.ink, 'stroke-width="2"'));
    cherry(s, 50, 18, 6);
    sprinkles(s, [[34, 40, 30], [64, 40, -30], [44, 30, 70], [58, 28, 10]]);
    s.add(hl('M30 54Q34 64 42 68', 2.6, 0.8));
  },
  (s) => {
    s.shadow(36);
    s.add(ell(50, 84, 42, 9, s.rad(CUP), CUP.ink));
    s.add(shape('M14 48L14 76Q50 90 86 76L86 48Z', s.rad(VANILLA), VANILLA.ink));
    s.add('<path d="M15 62Q50 74 85 62L85 68Q50 80 15 68Z" fill="#ff7aa8"/>');
    s.add(ell(50, 48, 36, 10, s.rad(VANILLA), VANILLA.ink));
    for (let i = 0; i < 7; i++) { const x = 18 + i * 10.7, y = 52 + Math.sin((i / 6) * Math.PI) * 6; s.add(circ(x, y, 4, s.rad(CUP), CUP.ink, 'stroke-width="1.6"')); }
    strawberry(s, 36, 42, 1.1); strawberry(s, 52, 38, 1.25); strawberry(s, 66, 43, 1.05);
    s.add(hl('M20 56L20 72', 2.6, 0.6));
  },
  (s) => {
    s.halo('#ffd8ec'); s.shadow(36);
    const tier = (y: number, w: number, h: number) => {
      s.add(shape(`M${50 - w / 2} ${y - h}L${50 - w / 2} ${y}Q50 ${y + 6} ${50 + w / 2} ${y}L${50 + w / 2} ${y - h}Z`, s.rad(VANILLA), VANILLA.ink));
      s.add(ell(50, y - h, w / 2, 4.5, s.rad(VANILLA), VANILLA.ink, 'stroke-width="2.4"'));
      s.add(`<path d="M${50 - w / 2 + 1} ${y - h * 0.35}Q50 ${y - h * 0.35 + 6} ${50 + w / 2 - 1} ${y - h * 0.35}" fill="none" stroke="#ff8ec4" stroke-width="4"/>`);
      for (let x = 50 - w / 2 + 5; x < 50 + w / 2 - 2; x += 7) s.add(`<circle cx="${x}" cy="${y - h + 6}" r="1.6" fill="#fff" stroke="${VANILLA.lo}" stroke-width=".8"/>`);
    };
    s.add(ell(50, 90, 40, 6, s.rad(P.metal), P.metal.ink));
    tier(88, 74, 22); tier(64, 54, 18); tier(44, 34, 15);
    for (const [x, y] of [[22, 66], [78, 66], [32, 46], [68, 46]]) s.add(circ(x, y, 4, s.rad(PINK), PINK.ink, 'stroke-width="1.6"'));
    s.add(shape('M50 26Q44 18 40 22Q36 26 50 34Q64 26 60 22Q56 18 50 26Z', s.rad(BERRY), BERRY.ink, 'stroke-width="2"'));
    s.sparkle(84, 20, 6); s.sparkle(16, 28, 4); s.sparkle(72, 8, 3.5);
  },
];

// ------------------------------------------------------------------ grill

const EGG = { hi: '#fffef8', mid: '#fbf0dc', lo: '#dcc6a0', ink: '#7a6040' };
const YOLK = { hi: '#fff6b0', mid: '#ffc93c', lo: '#e8901c', ink: '#8a5010' };
const MEAT = { hi: '#ffb88a', mid: '#c8643a', lo: '#8a3418', ink: '#4a1a08' };
const PAN = { hi: '#8a90a8', mid: '#4a5068', lo: '#2a2e40', ink: '#14161e' };
const LETTUCE = { hi: '#e0ffb0', mid: '#7ed04a', lo: '#3c8a2a', ink: '#24561a' };
const TOMATO = { hi: '#ffb0a0', mid: '#ef4a3a', lo: '#a82418', ink: '#5a1008' };

function sausage(s: Svg, cx: number, cy: number, len: number, rot: number) {
  const h = len * 0.32;
  s.add(`<g transform="rotate(${rot} ${cx} ${cy})">`);
  s.add(shape(`M${cx - len / 2 + h / 2} ${cy - h / 2}L${cx + len / 2 - h / 2} ${cy - h / 2}A${h / 2} ${h / 2} 0 0 1 ${cx + len / 2 - h / 2} ${cy + h / 2}L${cx - len / 2 + h / 2} ${cy + h / 2}A${h / 2} ${h / 2} 0 0 1 ${cx - len / 2 + h / 2} ${cy - h / 2}Z`, s.rad(MEAT), MEAT.ink));
  for (let i = -1; i <= 1; i++) s.add(`<path d="M${cx + i * len * 0.22 - 3} ${cy - h * 0.35}L${cx + i * len * 0.22 + 3} ${cy + h * 0.35}" stroke="${MEAT.ink}" stroke-width="2.6" stroke-linecap="round" opacity=".7"/>`);
  s.add(hl(`M${cx - len / 2 + h * 0.6} ${cy - h * 0.25}L${cx + len / 2 - h * 0.8} ${cy - h * 0.25}`, 2.4, 0.55));
  s.add('</g>');
}

const grillArt: ((s: Svg) => void)[] = [
  (s) => {
    s.shadow(16);
    s.add(shape('M50 26Q68 26 70 56Q70 80 50 80Q30 80 30 56Q32 26 50 26Z', s.rad(EGG), EGG.ink));
    s.add('<ellipse cx="42" cy="44" rx="5" ry="8" fill="#fff" opacity=".9" transform="rotate(20 42 44)"/>');
    s.add(`<g fill="${EGG.lo}"><circle cx="58" cy="62" r="1.2"/><circle cx="54" cy="70" r="1"/></g>`);
  },
  (s) => {
    s.shadow(30);
    s.add(shape('M70 58L96 46L98 52L74 66Z', s.rad(P.wood), P.wood.ink));
    s.add(ell(46, 60, 36, 26, s.rad(PAN), PAN.ink));
    s.add(ell(46, 58, 30, 21, '#30344a', PAN.ink, 'stroke-width="2"'));
    s.add(shape('M26 58Q22 44 36 42Q44 34 56 40Q70 42 66 56Q70 70 54 72Q40 76 32 68Q22 68 26 58Z', s.rad(EGG), EGG.ink, 'stroke-width="2.4"'));
    s.add(circ(46, 56, 9, s.rad(YOLK), YOLK.ink, 'stroke-width="2"'));
    s.add('<circle cx="43" cy="53" r="2.6" fill="#fff" opacity=".85"/>');
  },
  (s) => {
    s.shadow(28);
    sausage(s, 46, 60, 60, -24);
    sausage(s, 54, 66, 58, 18);
    s.add(shape('M76 18L82 18L80 46L78 46Z', s.rad(P.stone), P.stone.ink, 'stroke-width="2"'));
    s.add(shape('M72 10L72 22Q79 28 86 22L86 10', 'none', P.stone.ink, 'stroke-width="2.4"'));
    steam(s, 40, 40, 16);
  },
  (s) => {
    s.shadow(24);
    s.add(shape('M14 86L86 14', 'none', '#7a5a3a', 'stroke-width="6"'));
    s.add(`<path d="M14 86L86 14" stroke="#e8c890" stroke-width="2.6" stroke-linecap="round"/>`);
    const chunks: [number, number, string][] = [[28, 72, 'meat'], [40, 60, 'pepper'], [52, 48, 'meat'], [64, 36, 'tomato'], [74, 26, 'meat']];
    for (const [x, y, k] of chunks) {
      if (k === 'meat') s.add(shape(`M${x - 9} ${y - 6}L${x + 7} ${y - 9}L${x + 9} ${y + 6}L${x - 7} ${y + 9}Z`, s.rad(MEAT), MEAT.ink, `transform="rotate(${x} ${x} ${y})"`));
      else if (k === 'pepper') s.add(shape(`M${x - 8} ${y - 8}L${x + 8} ${y - 8}L${x + 8} ${y + 8}L${x - 8} ${y + 8}Z`, s.rad(LETTUCE), LETTUCE.ink, `transform="rotate(45 ${x} ${y})"`));
      else s.add(circ(x, y, 8, s.rad(TOMATO), TOMATO.ink));
    }
    s.add(`<path d="M24 70L30 76M50 46L56 52M72 24L78 30" stroke="${MEAT.ink}" stroke-width="2" opacity=".6"/>`);
    steam(s, 46, 30, 14);
  },
  (s) => {
    s.shadow(34);
    s.add(shape('M16 74Q16 66 24 66L76 66Q84 66 84 74Q84 86 70 86L30 86Q16 86 16 74Z', s.rad(BREAD), BREAD.ink));
    s.add(shape('M14 64Q50 58 86 64L84 72Q50 78 16 72Z', s.rad(MEAT), MEAT.ink));
    s.add(shape('M12 58L88 58L82 66L72 60L62 67L52 60L42 67L32 60L20 66Z', s.rad(YOLK), YOLK.ink, 'stroke-width="2.4"'));
    s.add(shape('M10 54Q20 48 30 54Q40 48 50 54Q60 48 70 54Q80 48 90 54L88 58L12 58Z', s.rad(LETTUCE), LETTUCE.ink, 'stroke-width="2.4"'));
    s.add(ell(36, 51, 12, 4, s.rad(TOMATO), TOMATO.ink, 'stroke-width="2"') + ell(64, 51, 12, 4, s.rad(TOMATO), TOMATO.ink, 'stroke-width="2"'));
    s.add(shape('M14 50Q14 22 50 20Q86 22 86 50Z', s.rad(BREAD), BREAD.ink));
    s.add('<g fill="#fff8e0" stroke="#a8622a" stroke-width=".8"><ellipse cx="38" cy="32" rx="2.4" ry="1.4"/><ellipse cx="52" cy="28" rx="2.4" ry="1.4" transform="rotate(30 52 28)"/><ellipse cx="64" cy="36" rx="2.4" ry="1.4" transform="rotate(-20 64 36)"/><ellipse cx="46" cy="40" rx="2.4" ry="1.4"/><ellipse cx="28" cy="42" rx="2.4" ry="1.4"/></g>');
    s.add(hl('M24 40Q28 28 40 25', 3, 0.6));
  },
  (s) => {
    s.shadow(40);
    s.add(circ(50, 52, 40, s.rad(BREAD), BREAD.ink));
    s.add(`<circle cx="50" cy="52" r="33" fill="#e8402a" stroke="${MEAT.ink}" stroke-width="1.6"/>`);
    s.add(`<path d="M50 20Q62 22 70 30Q80 36 78 46Q84 56 76 64Q74 76 62 78Q52 86 42 80Q30 80 26 70Q16 62 22 52Q18 40 28 34Q36 22 50 20Z" fill="${s.rad({ hi: '#fffbd0', mid: '#ffe07a', lo: '#f0b030', ink: '#8a5a10' })}"/>`);
    for (const [x, y] of [[38, 38], [62, 36], [50, 54], [34, 62], [66, 62], [52, 74]]) s.add(circ(x, y, 6, s.rad(TOMATO), TOMATO.ink, 'stroke-width="1.8"') + `<circle cx="${x - 2}" cy="${y - 2}" r="1.5" fill="#fff" opacity=".6"/>`);
    for (const [x, y, a] of [[48, 40, 20], [60, 50, -30], [42, 70, 60]]) s.add(`<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="#3c9a2a" transform="rotate(${a} ${x} ${y})"/>`);
    s.add(`<path d="M50 52L90 52A40 40 0 0 0 78 24Z" fill="none" stroke="${BREAD.ink}" stroke-width="2.4" stroke-linejoin="round"/>`);
  },
  (s) => {
    s.halo('#ffd8a0'); s.shadow(42);
    s.add(ell(50, 80, 44, 13, s.rad(CUP), CUP.ink));
    s.add(ell(50, 78, 36, 9, '#e8ecf6', CUP.ink, 'stroke-width="1.6"'));
    for (const [x, y] of [[16, 76], [84, 76], [24, 84], [76, 84]]) s.add(circ(x, y, 5, s.rad(LETTUCE), LETTUCE.ink, 'stroke-width="1.8"'));
    const roast = { hi: '#ffe0a0', mid: '#e8964a', lo: '#a85a22', ink: '#5a2a0a' };
    // Drumsticks with paper frills.
    for (const f of [-1, 1]) {
      const x = (n: number) => 50 + f * n;
      s.add(shape(`M${x(18)} 60Q${x(30)} 44 ${x(36)} 34L${x(40)} 36Q${x(36)} 50 ${x(28)} 66Z`, s.rad(roast), roast.ink));
      s.add(shape(`M${x(34)} 34L${x(40)} 26L${x(44)} 30L${x(40)} 37Z`, '#fff', '#7a7a8a', 'stroke-width="1.8"'));
    }
    s.add(shape('M18 70Q14 46 34 40Q50 34 66 40Q86 46 82 70Q50 80 18 70Z', s.rad(roast), roast.ink));
    s.add(hl('M28 52Q36 44 48 42', 3, 0.7));
    s.add(`<path d="M40 60Q50 64 60 60" fill="none" stroke="${roast.lo}" stroke-width="2" opacity=".6"/>`);
    steam(s, 40, 32, 16); steam(s, 60, 30, 18);
    s.sparkle(86, 30, 5, '#fff6c4');
  },
];

// ------------------------------------------------------------------ rewards

function coinShape(s: Svg, cx: number, cy: number, r: number) {
  s.add(shape(`M${cx} ${cy - r}A${r} ${r * 0.98} 0 1 1 ${cx - 0.1} ${cy - r}Z`, s.rad(P.coin), P.coin.ink));
  s.add(`<circle cx="${cx}" cy="${cy}" r="${r * 0.66}" fill="none" stroke="${P.coin.lo}" stroke-width="2"/>`);
  s.add(`<path d="M${cx - r * 0.2} ${cy - r * 0.35}L${cx + r * 0.2} ${cy - r * 0.35}M${cx} ${cy - r * 0.35}L${cx} ${cy + r * 0.35}" stroke="${P.coin.ink}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`);
}

function coinSide(s: Svg, cx: number, by: number, w: number) {
  s.add(shape(`M${cx - w / 2} ${by - 4}L${cx - w / 2} ${by}Q${cx} ${by + 6} ${cx + w / 2} ${by}L${cx + w / 2} ${by - 4}`, s.lin(P.coin.mid, P.coin.lo), P.coin.ink));
  s.add(shape(`M${cx - w / 2} ${by - 4}Q${cx} ${by - 10} ${cx + w / 2} ${by - 4}Q${cx} ${by + 2} ${cx - w / 2} ${by - 4}Z`, s.rad(P.coin), P.coin.ink));
}

const coinArt: ((s: Svg) => void)[] = [
  (s) => { s.shadow(16, 80); coinShape(s, 50, 54, 22); s.sparkle(70, 32, 5); },
  (s) => {
    s.shadow(24, 86);
    for (let i = 0; i < 5; i++) coinSide(s, 42, 84 - i * 8, 34);
    for (let i = 0; i < 3; i++) coinSide(s, 64, 84 - i * 8, 30);
    s.sparkle(76, 42, 5);
  },
  (s) => {
    s.shadow(24, 90);
    s.add(shape('M28 30L72 30L74 86Q50 92 26 86Z', GLASS, GLASS_INK));
    for (const [x, y, r] of [[38, 78, 7], [54, 80, 7], [64, 72, 6], [44, 68, 6.5], [58, 62, 6]]) coinShape(s, x, y, r);
    s.add(shape('M24 22L76 22L76 31L24 31Z', s.rad(P.metal), P.metal.ink));
    s.add(shape('M32 40L68 40L68 54L32 54Z', '#fff8e8', '#8a6a3a', 'stroke-width="2"'));
    s.add('<text x="50" y="51" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, sans-serif" font-weight="700" font-size="11" fill="#c0503a">TIPS</text>');
    s.add(hl('M32 36L31 80', 2.6, 0.8));
    s.sparkle(80, 18, 5);
  },
  (s) => {
    s.halo('#ffe58a'); s.shadow(36, 92);
    const body = { hi: '#ffd0e0', mid: '#ff7aa8', lo: '#c83a6a', ink: '#6a1438' };
    s.add(shape('M12 70L88 70L86 92L14 92Z', s.rad(body), body.ink));
    s.add(shape('M18 44L82 44L88 70L12 70Z', s.rad(body), body.ink));
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) s.add(`<rect x="${26 + c * 13 + r * 2}" y="${50 + r * 8}" width="9" height="5" rx="1.5" fill="#fff" stroke="${body.ink}" stroke-width="1.2"/>`);
    s.add(shape('M30 20L70 20L70 40L30 40Z', '#2a3a4a', body.ink));
    s.add('<text x="50" y="35" text-anchor="middle" font-family="Fredoka, Arial Rounded MT Bold, sans-serif" font-weight="700" font-size="12" fill="#7effa0">$$$</text>');
    s.add(shape('M46 40L54 40L54 44L46 44Z', s.rad(P.stone), P.stone.ink, 'stroke-width="2"'));
    s.add(shape('M24 76L76 76L76 84L24 84Z', s.rad(P.metal), P.metal.ink, 'stroke-width="2"'));
    coinShape(s, 20, 30, 8); coinShape(s, 82, 28, 7);
    s.sparkle(88, 12, 6); s.sparkle(10, 14, 4);
  },
];

const ENERGY = { hi: '#efe0ff', mid: '#a77cf0', lo: '#6a3fb8', ink: '#3a1e7a' };

function bolt(s: Svg, cx: number, cy: number, k: number) {
  s.add(shape(`M${cx + 3 * k} ${cy - 12 * k}L${cx - 7 * k} ${cy + 2 * k}L${cx - 1 * k} ${cy + 2 * k}L${cx - 4 * k} ${cy + 12 * k}L${cx + 7 * k} ${cy - 3 * k}L${cx + 1 * k} ${cy - 3 * k}Z`, s.rad({ hi: '#fff6b0', mid: '#ffd23c', lo: '#e89a1c', ink: '#8a5a10' }), '#8a5a10', 'stroke-width="2"'));
}

const energyArt: ((s: Svg) => void)[] = [
  (s) => {
    s.shadow(22);
    s.add(`<g transform="rotate(-24 50 54)">${shape('M20 42L80 42L80 66L20 66Z', s.rad(ENERGY), ENERGY.ink)}`
      + `${shape('M14 40L20 42L20 66L14 68L17 54Z', s.rad(ENERGY), ENERGY.ink, 'stroke-width="2"')}${shape('M86 40L80 42L80 66L86 68L83 54Z', s.rad(ENERGY), ENERGY.ink, 'stroke-width="2"')}`
      + `${hl('M26 47L74 47', 2.4, 0.7)}</g>`);
    bolt(s, 50, 54, 1.1);
  },
  (s) => {
    s.shadow(30);
    s.add(shape('M38 32Q38 18 50 18Q62 18 62 32', 'none', ENERGY.ink, 'stroke-width="8"') + shape('M38 32Q38 18 50 18Q62 18 62 32', 'none', ENERGY.mid, 'stroke-width="4"'));
    s.add(shape('M18 34L82 34L82 86Q82 90 78 90L22 90Q18 90 18 86Z', s.rad(ENERGY), ENERGY.ink));
    s.add(shape('M16 32L84 32L84 44L16 44Z', s.rad(ENERGY), ENERGY.ink));
    s.add(shape('M44 40L56 40L56 48L44 48Z', s.rad(P.metal), P.metal.ink, 'stroke-width="2"'));
    bolt(s, 50, 68, 1.3);
    s.add(hl('M24 52L24 82', 2.6, 0.6));
  },
  (s) => {
    s.halo('#e0ccff'); s.shadow(40);
    s.add(shape('M28 44Q28 16 50 16Q72 16 72 44', 'none', WICKER.ink, 'stroke-width="8"') + shape('M28 44Q28 16 50 16Q72 16 72 44', 'none', WICKER.mid, 'stroke-width="4"'));
    s.add(shape('M12 50L88 50L80 92L20 92Z', s.rad(WICKER), WICKER.ink));
    for (let i = 0; i < 4; i++) s.add(`<path d="M${16 + i * 2} ${58 + i * 9}L${84 - i * 2} ${58 + i * 9}" stroke="${WICKER.ink}" stroke-width="1.6" opacity=".55"/>`);
    s.add(shape('M8 42L92 42L90 52L10 52Z', s.rad(WICKER), WICKER.ink));
    s.add(shape('M24 50L50 50L44 70L30 66Z', '#fff', ENERGY.ink, 'stroke-width="2"'));
    s.add(`<path d="M28 52L46 52M28 57L44 57M30 62L42 62M30 50L32 66M36 50L36 68M42 50L40 68" stroke="${ENERGY.mid}" stroke-width="2.4" opacity=".8"/>`);
    s.add(circ(66, 70, 11, s.rad(ENERGY), ENERGY.ink, 'stroke-width="2.4"'));
    bolt(s, 66, 70, 0.75);
    s.sparkle(86, 22, 6); s.sparkle(14, 26, 4);
  },
];

// ------------------------------------------------------------------ kitchen stations

/**
 * Dress a kitchen station up for its level, around the station itself (drawn
 * by `body`, which also adds its own gold trim from level 2 and gems from
 * level 3). Shared extras: 3 a serving plate it stands on, 4 sparkles and a
 * gold star badge, 5 golden rays, 6 an orbit of tasty motes, 7 floating
 * hearts, 8 a little crown, 9 gilded wings, 10 a starry sky with rays in the
 * station's colour.
 */
function dress(s: Svg, lv: number, glow: string, body: () => void) {
  if (lv >= 10) {
    s.behind.push(`<circle cx="50" cy="56" r="56" fill="#2a1a5a" opacity=".55"/><circle cx="50" cy="56" r="56" fill="none" stroke="${glow}" stroke-width="2" opacity=".8"/>`);
    for (let k = 0; k < 18; k++) {
      const a = k * 2.39996, r = 18 + ((k * 37) % 36);
      s.behind.push(`<circle cx="${(50 + Math.cos(a) * r).toFixed(1)}" cy="${(56 + Math.sin(a) * r).toFixed(1)}" r="${(0.8 + (k % 3) * 0.5).toFixed(1)}" fill="#fff"/>`);
    }
  }
  if (lv >= 9) {
    for (const f of [1, -1]) {
      const x = (n: number) => (50 + f * n).toFixed(1);
      s.behind.push(`<path d="M${x(30)} 66C${x(36)} 34 ${x(44)} 18 ${x(50)} 6Q${x(47)} 20 ${x(50)} 26Q${x(44)} 30 ${x(48)} 38Q${x(42)} 40 ${x(45)} 48Q${x(39)} 50 ${x(40)} 58Z" fill="${s.rad(P.metal)}" stroke="${P.metal.ink}" stroke-width="1.8" stroke-linejoin="round"/>`);
      s.behind.push(`<path d="M${x(34)} 58L${x(46)} 24M${x(36)} 60L${x(45)} 38M${x(37)} 62L${x(42)} 50" stroke="${P.metal.lo}" stroke-width="1.3" stroke-linecap="round"/>`);
    }
  }
  if (lv >= 5) {
    const rays: string[] = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2, b = a + 0.13;
      rays.push(`M50 58L${(50 + Math.cos(a) * 70).toFixed(1)} ${(58 + Math.sin(a) * 70).toFixed(1)}L${(50 + Math.cos(b) * 70).toFixed(1)} ${(58 + Math.sin(b) * 70).toFixed(1)}Z`);
    }
    s.behind.push(`<path d="${rays.join('')}" fill="#ffd84a" opacity=".6"/>`);
    if (lv >= 10) {
      const more: string[] = [];
      for (let k = 0; k < 12; k++) {
        const a = ((k + 0.5) / 12) * Math.PI * 2, b = a + 0.09;
        more.push(`M50 58L${(50 + Math.cos(a) * 64).toFixed(1)} ${(58 + Math.sin(a) * 64).toFixed(1)}L${(50 + Math.cos(b) * 64).toFixed(1)} ${(58 + Math.sin(b) * 64).toFixed(1)}Z`);
      }
      s.behind.push(`<path d="${more.join('')}" fill="${glow}" opacity=".7"/>`);
    }
  }
  if (lv >= 6) s.behind.push(`<path d="M6 60A44 14 -12 0 1 94 42" fill="none" stroke="${glow}" stroke-width="2" opacity=".85"/>`);
  if (lv >= 3) {
    // A big serving plate the station stands on.
    s.behind.push(`<ellipse cx="50" cy="95" rx="50" ry="10" fill="#fff" stroke="${P.stone.ink}" stroke-width="2"/>`);
    s.behind.push(`<ellipse cx="50" cy="95" rx="40" ry="7" fill="none" stroke="${glow}" stroke-width="2.4"/>`);
  }
  body();
  if (lv >= 7) {
    for (const [x, y] of [[12, 34], [88, 30]]) {
      s.fx.push(`<path d="M${x} ${y + 6}Q${x - 8} ${y} ${x - 6} ${y - 4}Q${x - 3} ${y - 8} ${x} ${y - 3}Q${x + 3} ${y - 8} ${x + 6} ${y - 4}Q${x + 8} ${y} ${x} ${y + 6}Z" fill="#ff6a9a" stroke="#8a1a48" stroke-width="1.4" stroke-linejoin="round"/>`);
    }
  }
  if (lv >= 6) {
    s.fx.push(`<path d="M94 42A44 14 -12 0 1 6 60" fill="none" stroke="${glow}" stroke-width="2.4" opacity=".95"/>`);
    for (const [x, y, r] of [[18, 66, 3.2], [62, 70, 2.6], [88, 50, 2.2]]) s.fx.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${glow}" stroke="#fff" stroke-width="1"/>`);
  }
  if (lv >= 8) {
    s.fx.push(`<path d="M41 12L42.5 4L46.5 8L50 1L53.5 8L57.5 4L59 12Z" fill="${s.rad(P.metal)}" stroke="${P.metal.ink}" stroke-width="1.8" stroke-linejoin="round"/>`);
    s.fx.push(`<circle cx="50" cy="9" r="1.8" fill="#ff6a9a" stroke="${P.metal.ink}" stroke-width="1"/>`);
  }
  if (lv >= 4) {
    for (const [x, y, r] of [[12, 22, 4], [88, 20, 3.5], [80, 6, 3]]) s.sparkle(x, y, r, glow);
    s.fx.push(`<path d="M80 72L82.4 77L88 77.6L83.8 81.4L85 87L80 84.2L75 87L76.2 81.4L72 77.6L77.6 77Z" fill="${s.rad(P.metal)}" stroke="${P.metal.ink}" stroke-width="1.4" stroke-linejoin="round"/>`);
  }
  if (lv >= 5) for (const [x, y, r] of [[22, 4, 4], [66, -2, 3.5], [94, 58, 3]]) s.sparkle(x, y, r, '#fff6b0');
}

/** Gold (from level 2) or plain steel for knobs, handles and trims. */
const trim = (lv: number) => (lv >= 2 ? P.metal : P.stone);
/** A gem (from level 3) set in a trim. */
function gem(s: Svg, lv: number, x: number, y: number, color: { hi: string; mid: string; lo: string; ink: string }) {
  if (lv < 3) return;
  s.add(`<circle cx="${x}" cy="${y}" r="3" fill="${s.rad(color, 'gem')}" stroke="${P.metal.ink}" stroke-width="1.2"/><circle cx="${x - 1}" cy="${y - 1}" r="1" fill="#fff"/>`);
}

const BRICK = { hi: '#ffc0a0', mid: '#d8643a', lo: '#9a3a1e', ink: '#5a1e0a' };
const MINT = { hi: '#e0fff6', mid: '#5fd0b8', lo: '#2a8a78', ink: '#145a4e' };

const genArt: Record<GenId, (s: Svg, lv: number) => void> = {
  oven: (s, lv) => {
    s.halo('#ffd8a0'); s.shadow(38, 96);
    dress(s, lv, '#ffc46a', () => {
      const t = trim(lv);
      s.add(shape('M62 22L62 8L74 8L74 30Z', s.rad(BRICK), BRICK.ink));
      s.add(shape('M10 92L10 58Q10 20 50 20Q90 20 90 58L90 92Z', s.rad(BRICK), BRICK.ink));
      for (const [y, off] of [[34, 0], [46, 9], [58, 0], [70, 9], [82, 0]] as const) {
        s.add(`<path d="M${y < 40 ? 24 : 12} ${y}L${y < 40 ? 76 : 88} ${y}" stroke="${BRICK.lo}" stroke-width="1.6" opacity=".6"/>`);
        for (let x = 18 + off; x < 86; x += 18) s.add(`<path d="M${x} ${y - 12}L${x} ${y}" stroke="${BRICK.lo}" stroke-width="1.6" opacity=".5"/>`);
      }
      s.add(shape('M26 92L26 66Q26 46 50 46Q74 46 74 66L74 92Z', '#2a1408', BRICK.ink));
      s.add('<path d="M30 92L30 70Q30 52 50 52Q70 52 70 70L70 92Z" fill="#ff8a2a" opacity=".55"/>');
      fire(s, 38, 90, 10, 14); fire(s, 62, 90, 10, 15);
      roll(s, 50, 78, 13);
      s.add(shape('M22 46Q22 40 50 40Q78 40 78 46', 'none', t.ink, 'stroke-width="6"') + shape('M22 46Q22 40 50 40Q78 40 78 46', 'none', t.mid, 'stroke-width="3"'));
      gem(s, lv, 50, 40, BRICK);
      if (lv >= 7) for (const x of [20, 80]) gem(s, lv, x, 86, BRICK);
      s.add(hl('M18 56Q20 36 36 28', 3, 0.5));
      steam(s, 68, 6, 14);
    });
  },
  fountain: (s, lv) => {
    s.halo('#b8e4ff'); s.shadow(38, 96);
    dress(s, lv, '#8fd8ff', () => {
      const t = trim(lv);
      s.add(shape('M18 76L82 76L84 92L16 92Z', s.rad(MINT), MINT.ink));
      s.add(shape('M24 24L76 24L78 76L22 76Z', GLASS, GLASS_INK));
      s.add('<path d="M26 40L74 40L76 74L24 74Z" fill="rgba(80,170,245,.75)"/>');
      s.add('<ellipse cx="50" cy="40" rx="24" ry="2.6" fill="#fff" opacity=".5"/>');
      lemonSlice(s, 38, 56, 7); lemonSlice(s, 60, 64, 6);
      s.add('<g fill="#fff" opacity=".9"><circle cx="50" cy="50" r="2"/><circle cx="66" cy="48" r="1.6"/><circle cx="32" cy="68" r="1.4"/></g>');
      s.add(shape('M20 16L80 16L80 26L20 26Z', s.rad(t), t.ink));
      s.add(shape('M44 76L56 76L56 84L52 84L52 88L48 88L48 84L44 84Z', s.rad(t), t.ink, 'stroke-width="2"'));
      s.add(hl('M29 30L28 70', 3, 0.85));
      gem(s, lv, 50, 21, { hi: '#d8f2ff', mid: '#4aa8f0', lo: '#1f6fc9', ink: '#0e3a70' });
      if (lv >= 7) for (const x of [24, 76]) gem(s, lv, x, 84, { hi: '#d8f2ff', mid: '#4aa8f0', lo: '#1f6fc9', ink: '#0e3a70' });
    });
  },
  mixer: (s, lv) => {
    s.halo('#ffd0e6'); s.shadow(38, 96);
    dress(s, lv, '#ff9ec8', () => {
      const t = trim(lv);
      s.add(shape('M14 84L86 84L88 92L12 92Z', s.rad(PINK), PINK.ink));
      s.add(shape('M62 46L62 84L84 84L84 46Z', s.rad(PINK), PINK.ink));
      s.add(shape('M18 58L58 58Q58 86 38 86Q18 86 18 58Z', s.rad(P.stone), P.stone.ink));
      s.add('<path d="M21 60L55 60Q54 66 50 68Q38 72 24 66Q21 64 21 60Z" fill="#ffb0d0"/>');
      s.add(`<path d="M38 46L38 62M34 50Q30 60 38 66Q46 60 42 50" fill="none" stroke="${P.stone.ink}" stroke-width="2.2"/>`);
      s.add(shape('M12 30Q12 16 30 16L70 16Q86 16 86 32L86 42Q86 48 78 48L20 48Q12 48 12 40Z', s.rad(PINK), PINK.ink));
      s.add(shape('M14 32L84 32', 'none', t.ink, 'stroke-width="5"') + `<path d="M14 32L84 32" stroke="${t.mid}" stroke-width="2.4"/>`);
      s.add(circ(74, 40, 4, s.rad(t), t.ink, 'stroke-width="1.8"'));
      s.add(hl('M18 26Q22 20 34 20', 3, 0.7));
      gem(s, lv, 50, 24, PINK);
      if (lv >= 7) for (const x of [66, 80]) gem(s, lv, x, 64, PINK);
      sprinkles(s, [[24, 10, 30], [62, 8, -20], [44, 6, 80]]);
    });
  },
  bbq: (s, lv) => {
    s.halo('#ffc8a0'); s.shadow(38, 96);
    dress(s, lv, '#ffa060', () => {
      const t = trim(lv);
      s.add(shape('M32 74L22 96M68 74L78 96M50 76L50 96', 'none', PAN.ink, 'stroke-width="5"'));
      s.add(shape('M16 26Q16 6 50 6Q84 6 84 26L80 30L20 30Z', s.rad(PAN), PAN.ink, 'transform="rotate(-14 20 30) translate(-4 -6)"'));
      s.add(circ(40, -9, 4, s.rad(P.stone), P.stone.ink, 'stroke-width="2"'));
      fire(s, 30, 52, 14, 22); fire(s, 50, 52, 18, 28); fire(s, 70, 52, 14, 22);
      sausage(s, 38, 46, 26, -8); sausage(s, 62, 46, 26, 10);
      s.add(shape('M12 50Q12 80 50 80Q88 80 88 50Z', s.rad(BRICK), BRICK.ink));
      s.add(`<path d="M12 50L88 50" stroke="${PAN.ink}" stroke-width="4"/>`);
      s.add(shape('M44 62L56 62L56 68L44 68Z', s.rad(t), t.ink, 'stroke-width="2"'));
      s.add(hl('M20 58Q24 70 36 74', 3, 0.6));
      gem(s, lv, 50, 72, BRICK);
      if (lv >= 7) for (const x of [24, 76]) gem(s, lv, x, 58, BRICK);
      steam(s, 44, 26, 14); steam(s, 60, 24, 16);
    });
  },
};

/** A small flame standing on (cx, by). */
function fire(s: Svg, cx: number, by: number, w: number, h: number) {
  const p = P.flame;
  s.add(shape(`M${cx} ${by - h}Q${cx + w * 0.15} ${by - h * 0.6} ${cx + w / 2} ${by - h * 0.45}Q${cx + w * 0.6} ${by} ${cx} ${by}Q${cx - w * 0.6} ${by} ${cx - w / 2} ${by - h * 0.45}Q${cx - w * 0.15} ${by - h * 0.6} ${cx} ${by - h}Z`, s.rad({ ...p, hi: '#fff6c4', mid: '#ffb63c', lo: '#ef5a2a' }), p.ink, 'stroke-width="2"'));
  s.add(`<path d="M${cx} ${by - h * 0.55}Q${cx + w * 0.3} ${by - h * 0.2} ${cx} ${by - 2}Q${cx - w * 0.3} ${by - h * 0.2} ${cx} ${by - h * 0.55}Z" fill="#fff6c4"/>`);
}

// ------------------------------------------------------------------ customers

function eyes(s: Svg, y: number, gap: number, r: number, cx = 50) {
  for (const x of [cx - gap, cx + gap]) {
    s.add(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="#2a1a3a"/>`);
    s.add(`<circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.4}" fill="#fff"/>`);
  }
}

function cheeks(s: Svg, y: number, gap: number) {
  s.add(`<ellipse cx="${50 - gap}" cy="${y}" rx="5" ry="3" fill="#ff7fa8" opacity=".5"/><ellipse cx="${50 + gap}" cy="${y}" rx="5" ry="3" fill="#ff7fa8" opacity=".5"/>`);
}

/** A big hungry smile with a little tongue. */
function smile(s: Svg, y: number, w = 8) {
  s.add(`<path d="M${50 - w} ${y}Q50 ${y + w * 1.2} ${50 + w} ${y}Z" fill="#7a2a3a" stroke="#2a1a3a" stroke-width="2.2" stroke-linejoin="round"/>`);
  s.add(`<path d="M${50 - w * 0.45} ${y + w * 0.55}Q50 ${y + w * 0.2} ${50 + w * 0.45} ${y + w * 0.55}Q50 ${y + w * 1} ${50 - w * 0.45} ${y + w * 0.55}Z" fill="#ff7a8a"/>`);
}


/**
 * A customer: shoulders with a napkin tucked in, a round head, and whatever
 * `ears` (drawn behind the head) and `face` add.
 */
function customer(s: Svg, fur: Pal, ears: () => void, face: () => void, napkin = true) {
  s.shadow(34, 96);
  s.add(shape('M12 100Q12 74 50 70Q88 74 88 100Z', s.rad(fur), fur.ink));
  if (napkin) {
    s.add(shape('M34 72L66 72L50 98Z', '#fff', '#6a6a8a', 'stroke-width="2.2"'));
    s.add('<path d="M38 76L62 76M42 82L58 82M46 88L54 88M42 72L46 86M50 72L50 92M58 72L54 86" stroke="#e8403a" stroke-width="2" opacity=".6"/>');
  }
  ears();
  s.add(shape('M50 16Q82 16 82 46Q82 74 50 74Q18 74 18 46Q18 16 50 16Z', s.rad(fur), fur.ink));
  face();
}

const customerArt: Record<CustomerKind, (s: Svg) => void> = {
  bunny: (s) => {
    const fur = { hi: '#ffffff', mid: '#f4eef6', lo: '#cbbcd8', ink: '#5a4a6e' };
    customer(s, fur, () => {
      for (const f of [-1, 1]) {
        const x = 50 + f * 14;
        s.add(shape(`M${x - 8} 26Q${x - 10} -6 ${x} -10Q${x + 10} -6 ${x + 8} 26Z`, s.rad(fur), fur.ink, `transform="rotate(${f * 10} ${x} 26)"`));
        s.add(`<path d="M${x - 4} 22Q${x - 5} 0 ${x} -4Q${x + 5} 0 ${x + 4} 22Z" fill="#ffb8d0" transform="rotate(${f * 10} ${x} 26)"/>`);
      }
    }, () => {
      eyes(s, 44, 12, 5); cheeks(s, 56, 21);
      s.add('<path d="M46 52L54 52L50 56Z" fill="#ff7aa8" stroke="#8a2458" stroke-width="1.4" stroke-linejoin="round"/>');
      s.add('<path d="M50 56L50 60M44 60Q47 64 50 60Q53 64 56 60" fill="none" stroke="#2a1a3a" stroke-width="2" stroke-linecap="round"/>');
      s.add('<rect x="47" y="61" width="6" height="6" rx="1" fill="#fff" stroke="#2a1a3a" stroke-width="1.4"/>');
    });
  },
  cat: (s) => {
    const fur = { hi: '#ffe0b0', mid: '#ffa64a', lo: '#d0701e', ink: '#6a3410' };
    customer(s, fur, () => {
      s.add(shape('M22 34L20 6L44 22Z', s.rad(fur), fur.ink) + shape('M78 34L80 6L56 22Z', s.rad(fur), fur.ink));
      s.add('<path d="M25 28L24 13L36 22ZM75 28L76 13L64 22Z" fill="#ffb8c8"/>');
    }, () => {
      s.add(`<path d="M44 20L46 30M50 18L50 30M56 20L54 30" stroke="${fur.lo}" stroke-width="3" stroke-linecap="round"/>`);
      eyes(s, 44, 12, 5); cheeks(s, 56, 21);
      s.add('<path d="M47 52L53 52L50 55Z" fill="#ff7aa8"/><path d="M44 58Q47 61 50 57Q53 61 56 58" fill="none" stroke="#2a1a3a" stroke-width="2" stroke-linecap="round"/>');
      s.add('<path d="M24 52L36 54M24 58L36 57M76 52L64 54M76 58L64 57" stroke="#6a3410" stroke-width="1.4" stroke-linecap="round"/>');
    });
  },
  bear: (s) => {
    const fur = { hi: '#e8c09a', mid: '#a86e42', lo: '#704422', ink: '#3e220c' };
    customer(s, fur, () => {
      s.add(circ(26, 22, 11, s.rad(fur), fur.ink) + circ(74, 22, 11, s.rad(fur), fur.ink));
      s.add('<circle cx="26" cy="22" r="5.5" fill="#e8b890"/><circle cx="74" cy="22" r="5.5" fill="#e8b890"/>');
    }, () => {
      eyes(s, 40, 13, 4.5);
      s.add(ell(50, 56, 15, 11, s.rad({ hi: '#fff0dc', mid: '#f0d0aa', lo: '#c8a070', ink: fur.ink }), fur.ink, 'stroke-width="2"'));
      s.add('<ellipse cx="50" cy="51" rx="5" ry="3.5" fill="#2a1a1a"/>');
      smile(s, 57, 6); cheeks(s, 52, 24);
    });
  },
  fox: (s) => {
    const fur = { hi: '#ffd0a0', mid: '#ff8a3a', lo: '#c8521a', ink: '#5e2408' };
    customer(s, fur, () => {
      s.add(shape('M20 36L16 0L46 22Z', s.rad(fur), fur.ink) + shape('M80 36L84 0L54 22Z', s.rad(fur), fur.ink));
      s.add('<path d="M18 14L16 0L26 8ZM82 14L84 0L74 8Z" fill="#3a2010"/><path d="M24 30L22 12L36 22ZM76 30L78 12L64 22Z" fill="#fff0e0"/>');
    }, () => {
      s.add('<path d="M19 50Q30 46 40 56Q50 74 60 56Q70 46 81 50Q80 72 50 74Q20 72 19 50Z" fill="#fff8f0"/>');
      eyes(s, 42, 13, 4.5);
      s.add('<ellipse cx="50" cy="56" rx="4.5" ry="3.2" fill="#2a1a1a"/>');
      smile(s, 61, 6); cheeks(s, 54, 24);
    });
  },
  penguin: (s) => {
    const fur = { hi: '#6a7090', mid: '#2e3248', lo: '#181a28', ink: '#0a0c14' };
    customer(s, fur, () => {
      s.add('<path d="M46 18Q48 6 56 8Q50 12 54 18Z" fill="#2e3248" stroke="#0a0c14" stroke-width="2"/>');
    }, () => {
      s.add('<path d="M50 34Q58 24 70 30Q78 40 74 54Q70 70 50 72Q30 70 26 54Q22 40 30 30Q42 24 50 34Z" fill="#fff"/>');
      eyes(s, 44, 11, 4.5); cheeks(s, 56, 18);
      s.add(shape('M42 54L58 54L50 64Z', s.rad({ hi: '#ffe0a0', mid: '#ffa63c', lo: '#e0701a', ink: '#7a3a08' }), '#7a3a08', 'stroke-width="2"'));
    });
  },
  pig: (s) => {
    const fur = { hi: '#ffe4ee', mid: '#ffb0c8', lo: '#e07898', ink: '#8a3454' };
    customer(s, fur, () => {
      s.add(shape('M22 28L18 8L42 20Z', s.rad(fur), fur.ink, 'transform="rotate(-20 30 20)"') + shape('M78 28L82 8L58 20Z', s.rad(fur), fur.ink, 'transform="rotate(20 70 20)"'));
    }, () => {
      eyes(s, 40, 13, 4.5); cheeks(s, 52, 26);
      s.add(ell(50, 54, 12, 8.5, s.rad({ hi: '#ffd0de', mid: '#ff8eb0', lo: '#d85a84', ink: fur.ink }), fur.ink, 'stroke-width="2.4"'));
      s.add('<ellipse cx="45.5" cy="54" rx="2.2" ry="3.2" fill="#8a3454"/><ellipse cx="54.5" cy="54" rx="2.2" ry="3.2" fill="#8a3454"/>');
      s.add('<path d="M42 66Q50 72 58 66" fill="none" stroke="#2a1a3a" stroke-width="2.4" stroke-linecap="round"/>');
    });
  },
  frog: (s) => {
    const fur = { hi: '#d8ffb0', mid: '#6ccc4a', lo: '#3a8a2a', ink: '#1e4a14' };
    customer(s, fur, () => {
      s.add(circ(32, 20, 13, s.rad(fur), fur.ink) + circ(68, 20, 13, s.rad(fur), fur.ink));
    }, () => {
      for (const x of [32, 68]) s.add(`<circle cx="${x}" cy="20" r="8" fill="#fff" stroke="${fur.ink}" stroke-width="2"/><circle cx="${x + 1}" cy="21" r="4.5" fill="#1a1a2a"/><circle cx="${x - 1}" cy="19" r="1.6" fill="#fff"/>`);
      s.add('<path d="M28 52Q50 70 72 52" fill="none" stroke="#1e4a14" stroke-width="3" stroke-linecap="round"/>');
      s.add('<path d="M52 59Q60 58 62 66Q56 70 52 62Z" fill="#ff7a8a" stroke="#7a2a3a" stroke-width="1.6"/>');
      s.add('<circle cx="46" cy="40" r="1.6" fill="#1e4a14"/><circle cx="54" cy="40" r="1.6" fill="#1e4a14"/>');
      cheeks(s, 50, 26);
    });
  },
  panda: (s) => {
    const fur = { hi: '#ffffff', mid: '#f2f2f6', lo: '#c8c8d8', ink: '#2a2a3a' };
    const black = { hi: '#6a6a7a', mid: '#2e2e3a', lo: '#18181f', ink: '#0a0a10' };
    s.shadow(34, 96);
    s.add(shape('M12 100Q12 74 50 70Q88 74 88 100Z', s.rad(black), black.ink));
    s.add(shape('M34 72L66 72L50 98Z', '#fff', '#6a6a8a', 'stroke-width="2.2"'));
    s.add('<path d="M38 76L62 76M42 82L58 82M46 88L54 88M42 72L46 86M50 72L50 92M58 72L54 86" stroke="#e8403a" stroke-width="2" opacity=".6"/>');
    s.add(circ(26, 22, 11, s.rad(black), black.ink) + circ(74, 22, 11, s.rad(black), black.ink));
    s.add(shape('M50 16Q82 16 82 46Q82 74 50 74Q18 74 18 46Q18 16 50 16Z', s.rad(fur), fur.ink));
    s.add('<ellipse cx="36" cy="44" rx="9" ry="11" fill="#2e2e3a" transform="rotate(-25 36 44)"/><ellipse cx="64" cy="44" rx="9" ry="11" fill="#2e2e3a" transform="rotate(25 64 44)"/>');
    for (const x of [37, 63]) s.add(`<circle cx="${x}" cy="44" r="4" fill="#fff"/><circle cx="${x}" cy="45" r="2.4" fill="#1a1a2a"/>`);
    s.add('<ellipse cx="50" cy="55" rx="5" ry="3.5" fill="#2a1a1a"/>');
    smile(s, 60, 6); cheeks(s, 58, 24);
  },
  dog: (s) => {
    const fur = { hi: '#fff0d8', mid: '#e8b878', lo: '#b07a3a', ink: '#5a3814' };
    const ear = { hi: '#c8946a', mid: '#8a5a32', lo: '#5a3418', ink: '#3a1e08' };
    customer(s, fur, () => {}, () => {
      s.add(shape('M22 26Q8 30 10 56Q12 66 22 62Q26 44 30 30Z', s.rad(ear), ear.ink) + shape('M78 26Q92 30 90 56Q88 66 78 62Q74 44 70 30Z', s.rad(ear), ear.ink));
      eyes(s, 40, 12, 4.5);
      s.add(ell(50, 56, 14, 10, '#fff8ee', fur.ink, 'stroke-width="2"'));
      s.add('<ellipse cx="50" cy="50" rx="6" ry="4" fill="#2a1a1a"/><circle cx="48" cy="49" r="1.4" fill="#fff" opacity=".7"/>');
      s.add('<path d="M44 58Q47 61 50 57Q53 61 56 58" fill="none" stroke="#2a1a3a" stroke-width="2" stroke-linecap="round"/>');
      s.add('<path d="M47 60Q47 70 50 70Q53 70 53 60Z" fill="#ff7a8a" stroke="#7a2a3a" stroke-width="1.6"/>');
      cheeks(s, 50, 24);
    });
  },
  raccoon: (s) => {
    const fur = { hi: '#e0e0ea', mid: '#9a9aae', lo: '#62627a', ink: '#2a2a3e' };
    customer(s, fur, () => {
      s.add(shape('M22 32L22 10L42 22Z', s.rad(fur), fur.ink) + shape('M78 32L78 10L58 22Z', s.rad(fur), fur.ink));
      s.add('<path d="M25 26L25 15L35 22ZM75 26L75 15L65 22Z" fill="#3a3a4e"/>');
    }, () => {
      s.add('<path d="M20 40Q34 32 50 42Q66 32 80 40Q78 54 64 52Q56 50 50 48Q44 50 36 52Q22 54 20 40Z" fill="#2e2e3e"/>');
      s.add('<path d="M50 30L50 42" stroke="#2e2e3e" stroke-width="5" stroke-linecap="round"/>');
      for (const x of [37, 63]) s.add(`<circle cx="${x}" cy="44" r="4.6" fill="#fff"/><circle cx="${x}" cy="45" r="2.8" fill="#1a1a2a"/><circle cx="${x - 1}" cy="43.5" r="1" fill="#fff"/>`);
      s.add('<path d="M30 56Q50 50 70 56Q66 74 50 74Q34 74 30 56Z" fill="#f2f2f6"/>');
      s.add('<ellipse cx="50" cy="58" rx="4.5" ry="3.2" fill="#1a1a2a"/>');
      smile(s, 62, 5);
    });
  },
  lion: (s) => {
    const fur = { hi: '#fff0b0', mid: '#ffc84a', lo: '#d89020', ink: '#6a420a' };
    const mane = { hi: '#ffb070', mid: '#e0702a', lo: '#a04412', ink: '#5a2008' };
    customer(s, fur, () => {
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2, x = 50 + Math.cos(a) * 34, y = 46 + Math.sin(a) * 34;
        s.add(circ(Number(x.toFixed(1)), Number(y.toFixed(1)), 12, s.rad(mane), mane.ink, 'stroke-width="2.4"'));
      }
      s.add(circ(28, 22, 7, s.rad(fur), fur.ink, 'stroke-width="2.4"') + circ(72, 22, 7, s.rad(fur), fur.ink, 'stroke-width="2.4"'));
    }, () => {
      eyes(s, 42, 12, 4.5);
      s.add(ell(50, 57, 13, 9, '#fff8e0', fur.ink, 'stroke-width="2"'));
      s.add('<path d="M44 51L56 51L50 57Z" fill="#8a4a2a" stroke="#3a1a08" stroke-width="1.6" stroke-linejoin="round"/>');
      s.add('<path d="M44 61Q47 64 50 60Q53 64 56 61" fill="none" stroke="#2a1a3a" stroke-width="2" stroke-linecap="round"/>');
      cheeks(s, 52, 24);
    });
  },
  critic: (s) => {
    const fur = { hi: '#e8c8a8', mid: '#a87a5a', lo: '#704a30', ink: '#3a2212' };
    s.halo('#ffe08a');
    customer(s, fur, () => {}, () => {
      // Top hat.
      s.add(shape('M28 22L72 22L74 26L26 26Z', '#2a2a3a', '#0a0a14'));
      s.add(shape('M34 22L36 -6L64 -6L66 22Z', s.rad({ hi: '#6a6a7a', mid: '#2e2e3a', lo: '#18181f', ink: '#0a0a10' }), '#0a0a10'));
      s.add('<path d="M35 14L65 14" stroke="#e8403a" stroke-width="5"/>');
      eyes(s, 40, 12, 4);
      s.add(circ(62, 40, 8, 'rgba(220,240,255,.5)', P.metal.ink, 'stroke-width="2.4"'));
      s.add(`<path d="M70 42Q76 56 72 70" fill="none" stroke="${P.metal.mid}" stroke-width="1.4"/>`);
      s.add('<path d="M36 32L44 34M56 34L64 31" stroke="#2a1a3a" stroke-width="2.4" stroke-linecap="round"/>');
      s.add(ell(50, 56, 20, 10, s.rad({ hi: '#f8e8d8', mid: '#d8b898', lo: '#a88060', ink: fur.ink }), fur.ink, 'stroke-width="2"'));
      s.add('<ellipse cx="50" cy="50" rx="5" ry="3.5" fill="#2a1a1a"/>');
      s.add(shape('M30 58Q40 50 50 56Q60 50 70 58Q64 66 50 62Q36 66 30 58Z', '#fff', '#8a8aa0', 'stroke-width="1.8"'));
      s.add(shape('M40 62L38 80L44 64Z', '#fffaf0', '#8a7a60', 'stroke-width="1.8"') + shape('M60 62L62 80L56 64Z', '#fffaf0', '#8a7a60', 'stroke-width="1.8"'));
    }, false);
    // A bow tie instead of a napkin.
    s.add(shape('M50 78L36 70L36 86Z', '#e8403a', '#6a1010', 'stroke-width="2"') + shape('M50 78L64 70L64 86Z', '#e8403a', '#6a1010', 'stroke-width="2"'));
    s.add(circ(50, 78, 3.5, '#c82a2a', '#6a1010', 'stroke-width="1.6"'));
    s.sparkle(88, 14, 5, '#fff6c4'); s.sparkle(12, 20, 4, '#fff6c4');
  },
};

// ------------------------------------------------------------------ API

const chainArt: Record<ChainId, ((s: Svg) => void)[]> = {
  bakery: bakeryArt, drinks: drinksArt, dessert: dessertArt, grill: grillArt, coin: coinArt, energy: energyArt,
};

const cache = new Map<string, string>();

/**
 * Painted art overrides. Any key listed in public/art/manifest.json is served
 * from public/art/<key>.png instead of the code-drawn SVG, so real art can be
 * swapped in one item at a time. Keys: `bakery-1`, `gen-oven`, `cus-bunny`,
 * `icon-coin`, ... (see artKeys()).
 */
const overrides = new Set<string>();

export async function loadArtOverrides(): Promise<void> {
  try {
    const res = await fetch('art/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return;
    const keys = (await res.json()) as unknown;
    if (Array.isArray(keys)) keys.forEach((k) => typeof k === 'string' && overrides.add(k));
  } catch { /* no overrides (e.g. single-file build) */ }
}

/** Whether a painted file for `key` is listed in the manifest. */
export const hasArt = (key: string) => overrides.has(key);

function toUrl(key: string, draw: (s: Svg) => void, fill = 0.86): string {
  if (overrides.has(key)) return `art/${key}.png`;
  let url = cache.get(key);
  if (!url) {
    const s = new Svg();
    draw(s);
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.toString(fill))}`;
    cache.set(key, url);
  }
  return url;
}

// Every level fills the tile edge to edge.
export const itemArt = (chain: ChainId, level: number) =>
  toUrl(`${chain}-${level}`, chainArt[chain][level - 1], 0.97);
/** Level 1 uses the plain key; a painted `gen-x` override covers every level unless `gen-x-N` exists. */
export const generatorArt = (g: GenId, lv = 1) =>
  lv > 1 && !overrides.has(`gen-${g}-${lv}`) && overrides.has(`gen-${g}`)
    ? toUrl(`gen-${g}`, (s) => genArt[g](s, 1), 0.9)
    : toUrl(lv > 1 ? `gen-${g}-${lv}` : `gen-${g}`, (s) => genArt[g](s, lv), 0.9);
/**
 * The level decorations dress() puts around a station, without the station
 * itself, as SVG fragments in station coordinates. scripts/art/compose-stations.mjs
 * uses it to dress painted station art.
 */
export function stationDressing(lv: number, glow: string): { defs: string; behind: string; fx: string } {
  const s = new Svg();
  dress(s, lv, glow, () => {});
  return { defs: s.defs.join(''), behind: s.behind.join(''), fx: s.fx.join('') };
}

export const customerImg = (k: CustomerKind) => toUrl(`cus-${k}`, customerArt[k], 0.94);
export const pieceArt = (p: Piece) => (p.kind === 'gen' ? generatorArt(p.gen, p.level ?? 1) : itemArt(p.chain, p.level));

const TOQUE = { hi: '#ffffff', mid: '#f4f4fa', lo: '#c8cad8', ink: '#4a4e6a' };

function toque(s: Svg, cx: number, by: number, k: number) {
  s.add(shape(`M${cx - 16 * k} ${by}L${cx - 16 * k} ${by - 12 * k}Q${cx - 30 * k} ${by - 16 * k} ${cx - 26 * k} ${by - 30 * k}Q${cx - 20 * k} ${by - 42 * k} ${cx - 6 * k} ${by - 36 * k}Q${cx} ${by - 48 * k} ${cx + 10 * k} ${by - 38 * k}Q${cx + 26 * k} ${by - 44 * k} ${cx + 28 * k} ${by - 28 * k}Q${cx + 30 * k} ${by - 16 * k} ${cx + 16 * k} ${by - 12 * k}L${cx + 16 * k} ${by}Z`, s.rad(TOQUE), TOQUE.ink));
  s.add(`<path d="M${cx - 16 * k} ${by - 6 * k}L${cx + 16 * k} ${by - 6 * k}M${cx - 6 * k} ${by - 12 * k}L${cx - 6 * k} ${by - 1}M${cx + 6 * k} ${by - 12 * k}L${cx + 6 * k} ${by - 1}" stroke="${TOQUE.lo}" stroke-width="${1.8 * k}"/>`);
}

export const iconArt = {
  /** Chef Pip, the kitchen mouse who tells the story. */
  chef: () => toUrl('icon-chef', (s) => {
    const fur = { hi: '#f0eef8', mid: '#b8b4cc', lo: '#7e7896', ink: '#3e3a56' };
    s.shadow(30);
    s.add(shape('M14 100Q14 76 50 72Q86 76 86 100Z', s.rad(TOQUE), TOQUE.ink));
    s.add('<path d="M44 74L50 84L56 74" fill="#e8403a" stroke="#6a1010" stroke-width="2" stroke-linejoin="round"/>');
    s.add(circ(22, 34, 16, s.rad(fur), fur.ink) + circ(78, 34, 16, s.rad(fur), fur.ink));
    s.add('<circle cx="22" cy="34" r="9" fill="#ffc0d0"/><circle cx="78" cy="34" r="9" fill="#ffc0d0"/>');
    s.add(shape('M50 30Q78 30 78 54Q78 76 50 78Q22 76 22 54Q22 30 50 30Z', s.rad(fur), fur.ink));
    eyes(s, 50, 11, 4.5); cheeks(s, 62, 19);
    s.add('<circle cx="50" cy="60" r="4" fill="#ff7aa8" stroke="#8a2458" stroke-width="1.4"/>');
    s.add('<path d="M44 66Q47 69 50 65Q53 69 56 66" fill="none" stroke="#2a1a3a" stroke-width="2" stroke-linecap="round"/>');
    s.add('<path d="M26 58L38 60M26 64L38 63M74 58L62 60M74 64L62 63" stroke="#3e3a56" stroke-width="1.4" stroke-linecap="round"/>');
    toque(s, 50, 34, 0.75);
  }),
  diner: () => toUrl('icon-diner', (s) => {
    s.add(shape('M14 46L86 46L86 92L14 92Z', s.rad({ hi: '#fff8e8', mid: '#f6e4c4', lo: '#d0b88a', ink: '#6a4a24' }), '#6a4a24'));
    s.add(shape('M40 92L40 64L60 64L60 92Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M20 56L34 56L34 72L20 72Z', '#9fdcff', '#2a5a8a', 'stroke-width="2"') + shape('M66 56L80 56L80 72L66 72Z', '#9fdcff', '#2a5a8a', 'stroke-width="2"'));
    s.add(shape('M8 30L92 30L94 46L6 46Z', '#fff', '#8a2a2a'));
    s.add('<path d="M18 30L16 46M30 30L29 46M42 30L42 46M54 30L54 46M66 30L67 46M78 30L80 46" stroke="#e8403a" stroke-width="7"/>');
    s.add(shape('M6 46Q12 52 18 46Q24 52 30 46Q36 52 42 46Q48 52 54 46Q60 52 66 46Q72 52 78 46Q84 52 94 46', 'none', '#8a2a2a', 'stroke-width="2.4"'));
    s.add(shape('M30 8L70 8L70 26L30 26Z', s.rad(P.coin), P.coin.ink, 'stroke-width="2.4"'));
    s.add(`<path d="M50 12Q45 12 45 17Q45 22 50 22Q55 22 55 17Q55 12 50 12Z" fill="#fff6c4"/><path d="M50 22L50 26" stroke="${P.coin.ink}" stroke-width="2"/>`);
  }),
  toque: () => toUrl('icon-toque', (s) => { s.shadow(30, 90); toque(s, 50, 88, 1.6); s.sparkle(80, 20, 5, '#ffe680'); }),
  coin: () => toUrl('icon-coin', (s) => coinShape(s, 50, 50, 38)),
  gem: () => toUrl('icon-gem', (s) => {
    const p = { hi: '#ffe0f4', mid: '#ff6fb8', lo: '#c0247a', ink: '#7a1450' };
    s.add(shape('M14 38L30 16L70 16L86 38L50 88Z', s.rad(p), p.ink));
    s.add('<path d="M30 16L38 38L14 38Z" fill="#fff" opacity=".55"/><path d="M14 38L86 38" stroke="#7a1450" stroke-width="2" opacity=".5"/>');
  }),
  energy: () => toUrl('icon-energy', (s) => {
    s.add(shape('M58 6L20 56L46 56L38 94L82 40L54 40Z', s.rad({ hi: '#fff6b0', mid: '#ffd23c', lo: '#e89a1c', ink: '#8a5a10' }), '#8a5a10'));
  }),
  trophy: () => toUrl('icon-trophy', (s) => {
    const gold = { hi: '#fff6c2', mid: '#ffd147', lo: '#e09a1c', ink: '#8a5a10' };
    s.add(shape('M28 22Q8 22 12 40Q16 54 34 54', 'none', gold.ink, 'stroke-width="7"') + shape('M72 22Q92 22 88 40Q84 54 66 54', 'none', gold.ink, 'stroke-width="7"'));
    s.add(shape('M28 22Q8 22 12 40Q16 54 34 54', 'none', gold.mid, 'stroke-width="3.5"') + shape('M72 22Q92 22 88 40Q84 54 66 54', 'none', gold.mid, 'stroke-width="3.5"'));
    s.add(shape('M26 12L74 12L72 40Q70 62 50 66Q30 62 28 40Z', s.rad(gold), gold.ink));
    s.add(shape('M44 64L56 64L58 78L42 78Z', s.rad(gold), gold.ink));
    s.add(shape('M30 78L70 78L72 92L28 92Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M50 22L54 32L65 33L57 40L59 51L50 45L41 51L43 40L35 33L46 32Z', '#fff8d0', gold.ink, 'stroke-width="2"'));
    s.add('<path d="M33 18L36 44" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>');
  }),
  gstar: () => toUrl('icon-gstar', (s) => {
    s.add(shape('M50 4L62 34L95 36L69 57L78 90L50 72L22 90L31 57L5 36L38 34Z', s.rad({ hi: '#fff8c8', mid: '#ffd23c', lo: '#e8961c', ink: '#8a5a10' }), '#8a5a10'));
    s.add('<path d="M38 34L50 10L46 40Z" fill="#fff" opacity=".5"/>');
  }),
  /** An order pad, for the daily quests. */
  pad: () => toUrl('icon-pad', (s) => {
    s.add(shape('M22 16L74 16L74 90L22 90Z', s.lin(P.paper.hi, P.paper.mid), P.paper.ink));
    for (const y of [36, 48, 60, 72]) s.add(`<path d="M30 ${y}L${y === 72 ? 52 : 66} ${y}" stroke="#8ab0e0" stroke-width="3" stroke-linecap="round"/>`);
    s.add('<path d="M30 36L34 40L40 32" fill="none" stroke="#3aa04a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>');
    s.add(shape('M20 12L76 12L76 22L20 22Z', s.rad({ hi: '#ffb0b0', mid: '#e8403a', lo: '#a01a1a', ink: '#5a0a0a' }), '#5a0a0a'));
    for (const x of [30, 42, 54, 66]) s.add(`<circle cx="${x}" cy="17" r="2.4" fill="${P.stone.mid}" stroke="${P.stone.ink}" stroke-width="1.2"/>`);
    s.add(shape('M66 88L88 50L94 54L72 92L64 94Z', s.rad(P.coin), P.coin.ink, 'stroke-width="2.4"'));
    s.add('<path d="M64 94L66 88L72 92Z" fill="#3a2a1a"/>');
  }),
  /** The fridge where spare pieces are kept. */
  fridge: () => toUrl('icon-fridge', (s) => {
    s.shadow(34);
    s.add(shape('M22 10Q22 4 28 4L72 4Q78 4 78 10L78 90Q78 96 72 96L28 96Q22 96 22 90Z', s.rad(MINT), MINT.ink));
    s.add(`<path d="M22 38L78 38" stroke="${MINT.ink}" stroke-width="3"/>`);
    s.add(shape('M66 14L66 30', 'none', P.stone.ink, 'stroke-width="6"') + shape('M66 46L66 70', 'none', P.stone.ink, 'stroke-width="6"'));
    s.add('<path d="M66 14L66 30M66 46L66 70" stroke="#e6e2ec" stroke-width="3" stroke-linecap="round"/>');
    s.add(hl('M28 12L28 32M28 46L28 88', 3, 0.6));
    s.add(circ(40, 56, 7, s.rad(BERRY), BERRY.ink, 'stroke-width="2"'));
    s.add(shape('M36 72L48 72L48 82L36 82Z', s.rad(LEMON), LEMON.ink, 'stroke-width="2"'));
    s.sparkle(84, 14, 4, '#fff');
  }),
  star: () => toUrl('icon-star', (s) => {
    s.add(shape('M50 4L62 34L95 36L69 57L78 90L50 72L22 90L31 57L5 36L38 34Z', s.rad({ hi: '#c9ecff', mid: '#5aaaf0', lo: '#2a6ac8', ink: '#163e80' }), '#163e80'));
  }),
};

/** Every override key, i.e. the PNG file names the game will look for. */
export function artKeys(): string[] {
  const out: string[] = [];
  for (const c of Object.keys(chainArt) as ChainId[]) chainArt[c].forEach((_, i) => out.push(`${c}-${i + 1}`));
  for (const g of Object.keys(genArt) as GenId[]) for (let lv = 1; lv <= GEN_LEVELS.length; lv++) out.push(lv > 1 ? `gen-${g}-${lv}` : `gen-${g}`);
  for (const m of Object.keys(customerArt) as CustomerKind[]) out.push(`cus-${m}`);
  out.push(...Object.keys(iconArt).map((k) => `icon-${k}`));
  return out;
}

/** Every art key, for preloading and the art gallery test page. */
export function allArt(): string[] {
  const out: string[] = [];
  for (const c of Object.keys(chainArt) as ChainId[]) chainArt[c].forEach((_, i) => out.push(itemArt(c, i + 1)));
  for (const g of Object.keys(genArt) as GenId[]) for (let lv = 1; lv <= GEN_LEVELS.length; lv++) out.push(generatorArt(g, lv));
  for (const m of Object.keys(customerArt) as CustomerKind[]) out.push(customerImg(m));
  return out;
}
