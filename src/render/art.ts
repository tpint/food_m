// Procedural SVG art. Every item is drawn in a 100x100 box with the same
// light source (top-left), a soft colored outline and a ground shadow so all
// items feel like they belong on the same board.
//
// Each merge chain sticks to one palette and each level changes silhouette:
// small round -> tall -> wide -> ornate.

import { ChainId, GenId, MonsterKind } from '../game/config';
import type { Piece } from '../game/state';

interface Pal { hi: string; mid: string; lo: string; ink: string }

const P: Record<string, Pal> = {
  crystal: { hi: '#e4f9ff', mid: '#6fd0f5', lo: '#2f86c9', ink: '#1d5a8f' },
  herb: { hi: '#dcf7b4', mid: '#74c64f', lo: '#3c8a34', ink: '#2c5a27' },
  wood: { hi: '#e7b77d', mid: '#b67a43', lo: '#7c4a24', ink: '#553016' },
  pot: { hi: '#ffc9a3', mid: '#e48a5a', lo: '#b05a34', ink: '#7a3a1e' },
  flame: { hi: '#fff3b0', mid: '#ffa23c', lo: '#e8502e', ink: '#9c3020' },
  wax: { hi: '#fffaf0', mid: '#ffe9c4', lo: '#e8c48f', ink: '#a7773f' },
  arcane: { hi: '#efe0ff', mid: '#ae7bec', lo: '#6a3fb8', ink: '#44287a' },
  paper: { hi: '#fffaf0', mid: '#f4e6c4', lo: '#d7bf8c', ink: '#8a6a3a' },
  coin: { hi: '#fff6c2', mid: '#ffd147', lo: '#e09a1c', ink: '#9a6510' },
  mana: { hi: '#ffe3f4', mid: '#ff85cb', lo: '#d63f98', ink: '#8f2366' },
  stone: { hi: '#e6e2ec', mid: '#b3aec0', lo: '#7d7690', ink: '#524b66' },
  metal: { hi: '#fff4cf', mid: '#e9c46a', lo: '#b8862e', ink: '#7a5418' },
};

let uid = 0;

/**
 * Builds an SVG document in three layers: `back` (halo + ground shadow),
 * `body` (the object, drawn with a chunky sticker outline) and `fx`
 * (sparkles on top). Gradient ids are local to this image.
 */
class Svg {
  defs: string[] = [];
  body: string[] = [];
  fx: string[] = [];
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
    const outline = `<filter id="o${uid}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="1.7" result="d"/>
<feFlood flood-color="#3a2350" flood-opacity=".9"/><feComposite in2="d" operator="in" result="ol"/>
<feGaussianBlur in="d" stdDeviation="1.6"/><feOffset dy="2.4" result="b"/>
<feFlood flood-color="#2a1640" flood-opacity=".28"/><feComposite in2="b" operator="in" result="sh"/>
<feMerge><feMergeNode in="sh"/><feMergeNode in="ol"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
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
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(vx)} ${f(vy)} ${f(size)} ${f(size)}"><defs>${defs}</defs>${back.join('')}${body}${this.fx.join('')}</svg>`;
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

// ------------------------------------------------------------------ crystal

/** A pointed hexagonal crystal standing on (cx, by). */
function crystal(s: Svg, cx: number, by: number, w: number, h: number, rot = 0, p = P.crystal) {
  const t = by - h, sh = t + w * 0.55, hw = w / 2;
  s.add(`<g transform="rotate(${rot} ${cx} ${by})">`);
  s.add(shape(`M${cx} ${t}L${cx + hw} ${sh}L${cx + hw} ${by}L${cx} ${by + w * 0.18}L${cx - hw} ${by}L${cx - hw} ${sh}Z`, s.rad(p), p.ink));
  s.add(`<path d="M${cx} ${t}L${cx - hw} ${sh}L${cx - hw} ${by}L${cx - hw * 0.25} ${by + w * 0.12}L${cx - hw * 0.25} ${sh + 3}Z" fill="#fff" opacity=".45"/>`);
  s.add(`<path d="M${cx} ${t}L${cx + hw} ${sh}L${cx + hw} ${by}L${cx + hw * 0.4} ${by + w * 0.1}L${cx + hw * 0.4} ${sh + 4}Z" fill="${p.lo}" opacity=".35"/>`);
  s.add(hl(`M${cx - hw * 0.65} ${sh + 3}L${cx - hw * 0.65} ${by - 4}`, 2.4, 0.8));
  s.add('</g>');
}

// ------------------------------------------------------------------ flame

function fire(s: Svg, cx: number, by: number, w: number, h: number) {
  const p = P.flame;
  s.add(shape(`M${cx} ${by - h}Q${cx + w * 0.15} ${by - h * 0.6} ${cx + w / 2} ${by - h * 0.45}Q${cx + w * 0.6} ${by} ${cx} ${by}Q${cx - w * 0.6} ${by} ${cx - w / 2} ${by - h * 0.45}Q${cx - w * 0.15} ${by - h * 0.6} ${cx} ${by - h}Z`, s.rad({ ...p, hi: '#fff6c4', mid: '#ffb63c', lo: '#ef5a2a' }), p.ink));
  s.add(`<path d="M${cx} ${by - h * 0.55}Q${cx + w * 0.3} ${by - h * 0.2} ${cx} ${by - 2}Q${cx - w * 0.3} ${by - h * 0.2} ${cx} ${by - h * 0.55}Z" fill="#fff6c4"/>`);
}

function candle(s: Svg, cx: number, by: number, w: number, h: number) {
  s.add(shape(`M${cx - w / 2} ${by}L${cx - w / 2} ${by - h + 3}Q${cx} ${by - h - 2} ${cx + w / 2} ${by - h + 3}L${cx + w / 2} ${by}Z`, s.lin(P.wax.hi, P.wax.lo, false), P.wax.ink));
  s.add(`<path d="M${cx - w * 0.15} ${by - h + 3}Q${cx - w * 0.2} ${by - h + 10} ${cx - w * 0.12} ${by - h + 14}" fill="none" stroke="${P.wax.lo}" stroke-width="2.4" stroke-linecap="round"/>`);
  s.add(`<path d="M${cx} ${by - h}L${cx} ${by - h - 4}" stroke="#4a3020" stroke-width="2"/>`);
  fire(s, cx, by - h - 2, w * 0.9, w * 1.5);
}

const flameArt: ((s: Svg) => void)[] = [
  (s) => { s.halo('#ffd27a'); s.shadow(12, 80); fire(s, 50, 78, 30, 44); s.sparkle(70, 34, 4, '#fff6c4'); },
  (s) => {
    s.shadow(18, 88);
    s.add(shape('M30 86Q30 80 50 80Q70 80 70 86Q70 90 50 90Q30 90 30 86Z', s.rad(P.metal), P.metal.ink));
    candle(s, 50, 83, 18, 40);
  },
  (s) => {
    s.shadow(28, 92);
    s.add(shape('M26 66Q26 76 50 76Q74 76 74 66', 'none', P.metal.ink, 'stroke-width="6"'));
    s.add(shape('M26 66Q26 76 50 76Q74 76 74 66', 'none', P.metal.mid, 'stroke-width="3"'));
    s.add(shape('M46 76L44 88L56 88L54 76Z', s.rad(P.metal), P.metal.ink));
    s.add(shape('M34 90Q50 84 66 90Z', s.rad(P.metal), P.metal.ink));
    candle(s, 26, 66, 12, 24); candle(s, 74, 66, 12, 24); candle(s, 50, 74, 14, 38);
  },
  (s) => {
    s.halo('#ffd27a'); s.shadow(22, 92);
    s.add(shape('M44 18Q50 8 56 18', 'none', P.metal.ink, 'stroke-width="3"'));
    s.add(shape('M34 26L66 26L60 18L40 18Z', s.rad({ ...P.flame, hi: '#ff9a6a', mid: '#d84a2a', lo: '#9c3020' }), P.flame.ink));
    s.add(shape('M32 28L68 28L64 82L36 82Z', 'rgba(255,240,200,.55)', P.flame.ink));
    fire(s, 50, 74, 20, 32);
    s.add(`<path d="M41 30L39 80M59 30L61 80" stroke="${P.flame.ink}" stroke-width="2.4"/>`);
    s.add(shape('M30 82L70 82L68 92L32 92Z', s.rad({ ...P.flame, hi: '#ff9a6a', mid: '#d84a2a', lo: '#9c3020' }), P.flame.ink));
    s.add(hl('M35 34L37 76', 2.4, 0.7));
  },
  (s) => {
    s.halo('#ffc46a'); s.shadow(26, 93);
    s.add(shape('M34 70L28 92M66 70L72 92M50 72L50 92', 'none', P.stone.ink, 'stroke-width="5"'));
    fire(s, 50, 58, 50, 56); fire(s, 36, 58, 22, 30); fire(s, 64, 58, 22, 32);
    s.add(shape('M18 54Q50 50 82 54Q78 76 50 76Q22 76 18 54Z', s.rad(P.stone), P.stone.ink));
    s.add(`<path d="M18 54Q50 60 82 54" fill="none" stroke="${P.stone.ink}" stroke-width="2"/>`);
    s.add(hl('M26 60Q32 70 44 72', 2.4, 0.6));
    s.sparkle(80, 22, 4, '#fff6c4'); s.sparkle(22, 26, 3, '#fff6c4');
  },
  (s) => {
    s.halo('#ffb46a'); s.shadow(18, 92);
    s.add('<g transform="rotate(28 50 50)">');
    s.add(shape('M50 8Q74 30 66 62Q60 80 50 86Q40 80 34 62Q26 30 50 8Z', s.rad({ hi: '#fff3b0', mid: '#ff9a3c', lo: '#d8402a', ink: P.flame.ink }), P.flame.ink));
    s.add('<path d="M50 14Q62 34 58 60Q54 74 50 80Q46 74 42 60Q38 34 50 14Z" fill="#ffd56a" opacity=".8"/>');
    s.add(`<path d="M50 20L50 96" stroke="${P.flame.ink}" stroke-width="2.6" stroke-linecap="round"/>`);
    for (let i = 0; i < 4; i++) s.add(`<path d="M50 ${32 + i * 12}L${62 - i} ${26 + i * 12}M50 ${32 + i * 12}L${38 + i} ${26 + i * 12}" stroke="${P.flame.lo}" stroke-width="1.6" opacity=".7"/>`);
    s.add('</g>');
    fire(s, 30, 30, 14, 20); s.sparkle(76, 20, 5, '#fff6c4'); s.sparkle(20, 66, 4, '#fff6c4');
  },
  (s) => {
    s.halo('#ff9a5a'); s.shadow(26, 93);
    fire(s, 24, 86, 22, 36); fire(s, 76, 86, 22, 38);
    s.add(shape('M50 10Q76 12 78 54Q78 88 50 88Q22 88 22 54Q24 12 50 10Z', s.rad({ hi: '#ffd08a', mid: '#f0603a', lo: '#a82a20', ink: '#7a1e18' }), '#7a1e18'));
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 4; i++) {
        const x = 30 + i * 13 + (row % 2) * 6, y = 34 + row * 13;
        s.add(`<path d="M${x - 5} ${y}Q${x} ${y + 8} ${x + 5} ${y}" fill="none" stroke="#7a1e18" stroke-width="1.6" opacity=".45"/>`);
      }
    }
    s.add('<ellipse cx="38" cy="28" rx="8" ry="11" fill="#fff" opacity=".45" transform="rotate(20 38 28)"/>');
    s.add(shape('M42 56L50 46L58 56L50 66Z', s.rad(P.coin), P.coin.ink));
    fire(s, 50, 92, 26, 22); s.sparkle(82, 18, 6, '#fff6c4');
  },
];

// ------------------------------------------------------------------ earth

const EARTH = { hi: '#f4dcb0', mid: '#c79056', lo: '#8a5a2c', ink: '#553218' };
const ROCK = { hi: '#ece0d0', mid: '#b8a286', lo: '#7e6a52', ink: '#4e3e2c' };
const MOSS = { hi: '#e0f5b0', mid: '#8cc65a', lo: '#4e8a34', ink: '#2e5a22' };
const NUT = { hi: '#f8e2b8', mid: '#dcae6e', lo: '#9a6a34', ink: '#5a3a18' };

function stone(s: Svg, cx: number, cy: number, rx: number, ry: number, p = ROCK) {
  s.add(shape(`M${cx - rx} ${cy}Q${cx - rx} ${cy - ry} ${cx - rx * 0.2} ${cy - ry}Q${cx + rx} ${cy - ry * 1.05} ${cx + rx} ${cy - ry * 0.1}Q${cx + rx * 1.02} ${cy + ry} ${cx} ${cy + ry}Q${cx - rx} ${cy + ry} ${cx - rx} ${cy}Z`, s.rad(p), p.ink));
  s.add(hl(`M${cx - rx * 0.65} ${cy - ry * 0.2}Q${cx - rx * 0.5} ${cy - ry * 0.7} ${cx - rx * 0.1} ${cy - ry * 0.72}`, 2.4, 0.6));
}

function tuft(s: Svg, x: number, y: number, k = 1) {
  s.add(shape(`M${x - 6 * k} ${y}Q${x - 5 * k} ${y - 9 * k} ${x - 2 * k} ${y - 12 * k}Q${x - 1 * k} ${y - 6 * k} ${x} ${y - 4 * k}Q${x + 2 * k} ${y - 13 * k} ${x + 5 * k} ${y - 10 * k}Q${x + 4 * k} ${y - 5 * k} ${x + 6 * k} ${y}Z`, s.rad(MOSS), MOSS.ink));
}

const earthArt: ((s: Svg) => void)[] = [
  (s) => { s.shadow(16); stone(s, 50, 66, 18, 12); s.add(`<circle cx="56" cy="70" r="1.6" fill="${ROCK.lo}"/><circle cx="46" cy="72" r="1.2" fill="${ROCK.lo}"/>`); },
  (s) => {
    s.shadow(14);
    s.add(shape('M37 50Q36 82 50 88Q64 82 63 50Z', s.rad(NUT), NUT.ink));
    s.add(hl('M42 56Q41 72 47 80', 2.6, 0.6));
    s.add(shape('M30 52Q29 34 50 31Q71 34 70 52Q50 58 30 52Z', s.rad(EARTH), EARTH.ink));
    s.add(`<path d="M36 44L44 50M44 38L54 50M54 36L63 48M40 50L48 40M50 50L60 38" stroke="${EARTH.ink}" stroke-width="1.4" opacity=".4"/>`);
    s.add(shape('M50 32Q51 24 58 21', 'none', EARTH.ink, 'stroke-width="3.5"'));
  },
  (s) => {
    s.shadow(28);
    stone(s, 50, 80, 30, 11); stone(s, 48, 61, 22, 9); stone(s, 52, 45, 15, 8); stone(s, 50, 32, 9, 6);
    tuft(s, 26, 88, 0.9); tuft(s, 76, 88, 0.8);
  },
  (s) => {
    s.shadow(24);
    s.add(shape('M40 20L60 20L58 30Q80 36 80 60Q80 86 50 88Q20 86 20 60Q20 36 42 30Z', s.rad(EARTH), EARTH.ink));
    s.add(shape('M37 16L63 16L63 23L37 23Z', s.lin(EARTH.hi, EARTH.mid), EARTH.ink));
    s.add(shape('M24 44Q12 46 14 58Q16 66 24 64', 'none', EARTH.ink, 'stroke-width="4"'));
    s.add(shape('M76 44Q88 46 86 58Q84 66 76 64', 'none', EARTH.ink, 'stroke-width="4"'));
    s.add(`<path d="M24 50Q50 58 76 50M22 70Q50 78 78 70" fill="none" stroke="${EARTH.lo}" stroke-width="2.4" opacity=".7"/>`);
    s.add(shape('M50 50L60 66L40 66Z', MOSS.mid, MOSS.ink, 'stroke-width="2.4"'));
    s.add(`<path d="M44 60L56 60" stroke="${MOSS.ink}" stroke-width="2"/>`);
    s.add(hl('M28 44Q24 60 30 76', 3, 0.5));
  },
  (s) => {
    s.halo('#c6f08a'); s.shadow(26);
    s.add(shape('M32 88L28 40Q28 14 50 10Q72 14 72 40L68 88Z', s.rad(ROCK), ROCK.ink));
    s.add(`<path d="M50 28L50 62M40 36L50 46L60 36M42 56L58 56" fill="none" stroke="#b8f070" stroke-width="5" stroke-linecap="round" opacity=".55"/>`);
    s.add(`<path d="M50 28L50 62M40 36L50 46L60 36M42 56L58 56" fill="none" stroke="#f0ffd0" stroke-width="2.4" stroke-linecap="round"/>`);
    s.add(shape('M30 76Q40 70 46 78Q52 70 62 74Q70 76 70 88L30 88Z', s.rad(MOSS), MOSS.ink));
    s.add(hl('M34 40Q33 26 42 18', 3, 0.5));
    tuft(s, 22, 90); tuft(s, 78, 90);
  },
  (s) => {
    s.shadow(36);
    s.add(shape('M10 86L36 34L50 52L64 22L92 86Z', s.rad(ROCK), ROCK.ink));
    s.add(shape('M36 34L28 50L34 48L38 54L44 46Z', '#fff', ROCK.ink, 'stroke-width="2"'));
    s.add(shape('M64 22L54 42L60 40L64 47L70 40L74 44Z', '#fff', ROCK.ink, 'stroke-width="2"'));
    s.add(`<path d="M64 22L70 52L66 86M36 34L42 60" fill="none" stroke="${ROCK.lo}" stroke-width="2" opacity=".55"/>`);
    s.add(shape('M10 86Q30 72 50 80Q72 70 92 86Z', s.rad(MOSS), MOSS.ink));
  },
  (s) => {
    s.halo('#ffe39a'); s.shadow(26, 96);
    // roots
    s.add(`<path d="M40 74Q38 86 32 92M56 76Q58 88 64 94M48 78L48 92" fill="none" stroke="${EARTH.ink}" stroke-width="2.6" stroke-linecap="round"/>`);
    s.add(shape('M14 54Q50 46 86 54Q76 70 60 78Q50 86 40 78Q24 70 14 54Z', s.rad(EARTH), EARTH.ink));
    s.add(shape('M14 54Q50 44 86 54Q50 62 14 54Z', s.rad(MOSS), MOSS.ink));
    s.add(shape('M46 54Q44 40 50 32', 'none', '#7c4a24', 'stroke-width="6"'));
    s.add(shape('M46 54Q44 40 50 32', 'none', '#b67a43', 'stroke-width="3"'));
    for (const [x, y, r] of [[38, 28, 11], [52, 18, 13], [64, 30, 10], [50, 32, 9]] as const) {
      s.add(shape(`M${x} ${y - r}A${r} ${r} 0 1 1 ${x - 0.1} ${y - r}Z`, s.rad(MOSS), MOSS.ink));
    }
    stone(s, 72, 52, 6, 4); stone(s, 26, 53, 5, 3);
    s.sparkle(86, 20, 6); s.sparkle(14, 30, 4);
  },
];

// ------------------------------------------------------------------ water

const WATER = { hi: '#e6f8ff', mid: '#5ab8f5', lo: '#1f6fc9', ink: '#12448a' };
const FOAM = { hi: '#ffffff', mid: '#eaf6ff', lo: '#b8dcf5', ink: '#3a6ea8' };
const SHELL = { hi: '#ffffff', mid: '#cfeafc', lo: '#7fb8e6', ink: '#2e5e9a' };

function bubble(s: Svg, x: number, y: number, r: number) {
  s.add(shape(`M${x} ${y - r}A${r} ${r} 0 1 1 ${x - 0.1} ${y - r}Z`, s.rad(WATER), WATER.ink));
  s.add(`<ellipse cx="${x - r * 0.35}" cy="${y - r * 0.4}" rx="${r * 0.32}" ry="${r * 0.22}" fill="#fff" opacity=".85" transform="rotate(-30 ${x - r * 0.35} ${y - r * 0.4})"/>`);
}

function drop(s: Svg, x: number, y: number, r: number) {
  s.add(shape(`M${x} ${y - r * 1.8}Q${x + r} ${y - r * 0.4} ${x + r} ${y + r * 0.2}Q${x + r} ${y + r} ${x} ${y + r}Q${x - r} ${y + r} ${x - r} ${y + r * 0.2}Q${x - r} ${y - r * 0.4} ${x} ${y - r * 1.8}Z`, s.rad(WATER), WATER.ink));
  s.add(`<ellipse cx="${x - r * 0.4}" cy="${y}" rx="${r * 0.22}" ry="${r * 0.4}" fill="#fff" opacity=".7"/>`);
}

const waterArt: ((s: Svg) => void)[] = [
  (s) => { s.shadow(16); bubble(s, 44, 66, 12); bubble(s, 60, 58, 8); bubble(s, 58, 74, 5); },
  (s) => {
    s.shadow(24);
    s.add(shape('M50 84L22 46Q24 26 50 22Q76 26 78 46Z', s.rad(SHELL), SHELL.ink));
    s.add(`<path d="M50 84L30 30M50 84L40 24M50 84L50 22M50 84L60 24M50 84L70 30" stroke="${SHELL.ink}" stroke-width="1.8" opacity=".45"/>`);
    s.add(shape('M40 84L60 84L56 92L44 92Z', s.rad(SHELL), SHELL.ink));
    s.add(hl('M30 44Q34 32 44 28', 2.6, 0.8));
  },
  (s) => {
    s.shadow(28);
    s.add(shape('M14 78Q14 66 50 66Q86 66 86 78Q86 88 50 88Q14 88 14 78Z', s.rad(WATER), WATER.ink));
    s.add(shape('M24 74Q28 52 34 46Q38 60 42 70Q46 42 52 36Q56 58 58 70Q64 48 68 44Q72 60 76 74Q50 82 24 74Z', s.rad(FOAM), FOAM.ink));
    drop(s, 34, 34, 4); drop(s, 54, 22, 5); drop(s, 70, 32, 3.5);
    s.add(`<ellipse cx="50" cy="80" rx="22" ry="4" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>`);
  },
  (s) => {
    s.halo('#9fdcff'); s.shadow(22);
    s.add(shape('M50 18A30 30 0 1 1 49.9 18Z', s.rad(WATER), WATER.ink));
    s.add('<path d="M22 54Q30 46 38 54T54 54T70 54T80 52L78 62Q64 78 50 78Q30 78 22 62Z" fill="#1f6fc9" opacity=".55"/>');
    s.add('<path d="M22 54Q30 46 38 54T54 54T70 54T80 52" fill="none" stroke="#fff" stroke-width="2.6" opacity=".85"/>');
    s.add('<ellipse cx="38" cy="32" rx="9" ry="6" fill="#fff" opacity=".8" transform="rotate(-30 38 32)"/>');
    s.sparkle(80, 22, 6);
  },
  (s) => {
    s.shadow(32);
    s.add(shape('M14 74L86 74L80 88L20 88Z', s.rad(FOAM), FOAM.ink));
    s.add(shape('M14 70Q50 64 86 70L86 76Q50 82 14 76Z', s.rad(WATER), WATER.ink));
    s.add(shape('M44 72L42 46L58 46L56 72Z', s.rad(FOAM), FOAM.ink));
    s.add(shape('M28 48Q50 40 72 48Q70 56 50 56Q30 56 28 48Z', s.rad(FOAM), FOAM.ink));
    s.add(shape('M50 46Q48 28 50 16Q52 28 50 46', 'none', WATER.ink, 'stroke-width="5"'));
    s.add(`<path d="M50 20Q30 22 26 48M50 20Q70 22 74 48" fill="none" stroke="${WATER.ink}" stroke-width="6" stroke-linecap="round"/>`);
    s.add(`<path d="M50 20Q30 22 26 48M50 20Q70 22 74 48M50 44L50 18" fill="none" stroke="${WATER.mid}" stroke-width="3" stroke-linecap="round"/>`);
    drop(s, 26, 58, 3); drop(s, 74, 58, 3);
  },
  (s) => {
    s.halo('#9fdcff'); s.shadow(16);
    s.add('<g transform="rotate(28 50 50)">');
    s.add(shape('M48 30L52 30L52 96L48 96Z', s.lin('#cfe8ff', '#6a8ab8', false), '#2e4a7a'));
    s.add(shape('M30 34L30 14L34 6L38 14L38 30Q50 36 62 30L62 14L66 6L70 14L70 34Q60 44 50 42Q40 44 30 34Z', s.rad({ hi: '#ffffff', mid: '#9fd4ff', lo: '#3a7ac8', ink: '#1e3e78' }), '#1e3e78'));
    s.add(shape('M46 42L50 4L54 42Z', s.rad({ hi: '#ffffff', mid: '#9fd4ff', lo: '#3a7ac8', ink: '#1e3e78' }), '#1e3e78'));
    s.add('</g>');
    s.add(`<path d="M20 72Q34 58 50 70T80 64" fill="none" stroke="${WATER.mid}" stroke-width="5" stroke-linecap="round" opacity=".8"/>`);
    drop(s, 78, 44, 4); s.sparkle(22, 24, 5);
  },
  (s) => {
    s.halo('#7fd0ff'); s.shadow(36);
    s.add(shape('M8 88Q12 50 42 26Q70 8 88 26Q70 22 60 34Q78 34 80 50Q70 42 58 46Q48 52 50 66Q52 80 70 88Z', s.rad(WATER), WATER.ink));
    s.add(shape('M42 26Q70 8 88 26Q78 30 70 26Q76 34 66 34Q58 28 52 36Q50 28 42 26Z', s.rad(FOAM), FOAM.ink));
    s.add('<path d="M18 80Q22 56 40 40M30 84Q32 66 46 54" fill="none" stroke="#fff" stroke-width="2.4" opacity=".55"/>');
    s.add(shape('M60 88Q70 80 92 86L92 92L56 92Z', s.rad(FOAM), FOAM.ink));
    drop(s, 90, 40, 3.5); drop(s, 80, 12, 3); s.sparkle(16, 20, 6); s.sparkle(92, 60, 4);
  },
];

// ------------------------------------------------------------------ wind

const WIND = { hi: '#f2fff9', mid: '#9ce8cc', lo: '#3cb894', ink: '#1e6e5a' };
const CLOUD = { hi: '#ffffff', mid: '#eef4fa', lo: '#bccadc', ink: '#56688a' };

function swirl(s: Svg, x: number, y: number, r: number, w = 3.4) {
  const d = `M${x - r} ${y}Q${x - r} ${y - r} ${x} ${y - r}Q${x + r} ${y - r} ${x + r} ${y}Q${x + r} ${y + r * 0.6} ${x + r * 0.1} ${y + r * 0.6}Q${x - r * 0.5} ${y + r * 0.6} ${x - r * 0.4} ${y}Q${x - r * 0.3} ${y - r * 0.35} ${x + r * 0.1} ${y - r * 0.3}`;
  s.add(`<path d="${d}" fill="none" stroke="${WIND.ink}" stroke-width="${w + 3}" stroke-linecap="round"/>`);
  s.add(`<path d="${d}" fill="none" stroke="${WIND.mid}" stroke-width="${w}" stroke-linecap="round"/>`);
}

function gust(s: Svg, x: number, y: number, len: number) {
  const d = `M${x} ${y}L${x + len} ${y}Q${x + len + 8} ${y} ${x + len + 8} ${y - 6}Q${x + len + 8} ${y - 11} ${x + len + 3} ${y - 11}`;
  s.add(`<path d="${d}" fill="none" stroke="${WIND.ink}" stroke-width="6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${WIND.hi}" stroke-width="3" stroke-linecap="round"/>`);
}

const windArt: ((s: Svg) => void)[] = [
  (s) => { s.shadow(14); swirl(s, 50, 62, 12); gust(s, 30, 78, 16); },
  (s) => {
    s.shadow(16);
    s.add(shape('M50 88Q48 70 50 52', 'none', WIND.ink, 'stroke-width="3.5"'));
    s.add(`<path d="M50 72Q40 68 36 60" fill="none" stroke="${WIND.lo}" stroke-width="3" stroke-linecap="round"/>`);
    s.add(`<circle cx="50" cy="38" r="20" fill="#fff" stroke="${CLOUD.ink}" stroke-width="2.4" opacity=".95"/>`);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2, x = 50 + Math.cos(a) * 18, y = 38 + Math.sin(a) * 18;
      s.add(`<path d="M50 38L${x.toFixed(1)} ${y.toFixed(1)}" stroke="${WIND.lo}" stroke-width="1.2" opacity=".7"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${WIND.mid}"/>`);
    }
    s.add(`<circle cx="50" cy="38" r="4" fill="${WIND.lo}"/>`);
    s.add(`<path d="M74 22L80 18M78 30L86 28" stroke="${WIND.lo}" stroke-width="2" stroke-linecap="round"/><circle cx="82" cy="18" r="2" fill="${WIND.mid}"/>`);
  },
  (s) => {
    s.shadow(16);
    s.add(shape('M48 50L46 92L54 92L52 50Z', s.lin('#e7b77d', '#7c4a24', false), '#553016'));
    for (let i = 0; i < 4; i++) {
      s.add(`<g transform="rotate(${i * 90} 50 44)">`);
      s.add(shape('M50 44L50 14Q70 18 68 36Z', s.rad(i % 2 ? WIND : CLOUD), WIND.ink));
      s.add('</g>');
    }
    s.add(`<circle cx="50" cy="44" r="4.5" fill="#ffd147" stroke="${WIND.ink}" stroke-width="2"/>`);
  },
  (s) => {
    s.shadow(20);
    s.add(`<path d="M50 74Q44 82 52 88Q60 94 50 100" fill="none" stroke="${WIND.ink}" stroke-width="2.4"/>`);
    for (const y of [82, 92]) s.add(shape(`M44 ${y}L50 ${y - 3}L56 ${y}L50 ${y + 3}Z`, s.rad(WIND), WIND.ink, 'stroke-width="2"'));
    s.add(shape('M50 10L78 40L50 74L22 40Z', s.rad(WIND), WIND.ink));
    s.add('<path d="M50 10L50 74L22 40Z" fill="#fff" opacity=".45"/>');
    s.add(`<path d="M50 10L50 74M22 40L78 40" stroke="${WIND.ink}" stroke-width="2" opacity=".6"/>`);
    swirl(s, 64, 52, 5, 2);
  },
  (s) => {
    s.shadow(24);
    s.add(shape('M20 22Q50 10 80 22L78 28Q50 18 22 28Z', s.rad(P.wood), P.wood.ink));
    s.add(`<path d="M50 4L50 16" stroke="${P.wood.ink}" stroke-width="3"/>`);
    for (const [x, len] of [[30, 44], [42, 56], [54, 50], [66, 38]] as const) {
      s.add(`<path d="M${x} 24L${x} 30" stroke="${CLOUD.ink}" stroke-width="1.6"/>`);
      s.add(shape(`M${x - 4} 30L${x + 4} 30L${x + 4} ${30 + len}L${x - 4} ${30 + len}Z`, s.lin(WIND.hi, WIND.lo, false), WIND.ink, 'stroke-width="2.4"'));
    }
    s.add(`<path d="M48 26L48 70" stroke="${CLOUD.ink}" stroke-width="1.4"/>`);
    s.add(shape('M42 70L54 70L48 84Z', s.rad(WIND), WIND.ink, 'stroke-width="2.2"'));
    gust(s, 10, 52, 8); gust(s, 74, 62, 10);
  },
  (s) => {
    s.halo('#b8f5e0'); s.shadow(18);
    const bands = [[50, 18, 34, 8], [52, 32, 28, 7], [50, 45, 22, 6], [48, 57, 16, 5], [50, 68, 11, 4], [50, 78, 7, 3]];
    for (const [x, y, rx, ry] of bands) {
      s.add(shape(`M${x - rx} ${y}Q${x - rx} ${y + ry * 1.5} ${x} ${y + ry * 1.5}Q${x + rx} ${y + ry * 1.5} ${x + rx} ${y}Q${x + rx} ${y - ry} ${x} ${y - ry}Q${x - rx} ${y - ry} ${x - rx} ${y}Z`, s.rad(WIND), WIND.ink, 'stroke-width="2.4"'));
    }
    s.add(`<path d="M50 86L50 90" stroke="${WIND.ink}" stroke-width="3" stroke-linecap="round"/>`);
    stone(s, 20, 46, 4, 3); stone(s, 82, 34, 3.5, 2.5);
    s.add(shape('M78 62L86 58L84 66Z', '#8cc65a', '#2e5a22', 'stroke-width="1.6"'));
  },
  (s) => {
    s.halo('#b8f5e0'); s.shadow(34, 96);
    s.add(shape('M46 58L36 76L46 76L40 94L60 70L50 70L58 58Z', s.rad({ hi: '#fffbd0', mid: '#ffe060', lo: '#e8a820', ink: '#8a5a10' }), '#8a5a10'));
    for (const [x, y, r] of [[26, 46, 14], [44, 34, 18], [64, 36, 16], [78, 48, 12], [52, 50, 14], [34, 52, 11]] as const) {
      s.add(shape(`M${x} ${y - r}A${r} ${r} 0 1 1 ${x - 0.1} ${y - r}Z`, s.rad(CLOUD), CLOUD.ink));
    }
    s.add(`<path d="M16 56Q50 64 88 56L86 60Q50 70 16 60Z" fill="${CLOUD.lo}" opacity=".6"/>`);
    swirl(s, 46, 40, 7, 2.6); swirl(s, 68, 42, 5, 2.2);
    gust(s, 4, 70, 12); gust(s, 70, 78, 12);
    s.sparkle(86, 20, 5);
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
    s.shadow(26, 90);
    const bag = { hi: '#f2d9a8', mid: '#c99a5a', lo: '#8a5e2e', ink: '#5a3a18' };
    s.add(shape('M50 34Q80 38 80 66Q80 88 50 88Q20 88 20 66Q20 38 50 34Z', s.rad(bag), bag.ink));
    s.add(shape('M40 34Q36 22 44 18Q50 24 56 18Q64 22 60 34Z', s.rad(bag), bag.ink));
    s.add(`<path d="M38 34Q50 40 62 34" stroke="#d8404a" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    coinShape(s, 50, 64, 12); s.add(hl('M28 56Q28 72 38 80', 2.6, 0.5));
  },
  (s) => {
    s.halo('#ffe58a'); s.shadow(32, 92);
    s.add(shape('M18 50L82 50L80 88L20 88Z', s.rad(P.wood), P.wood.ink));
    for (let i = 0; i < 3; i++) coinShape(s, 34 + i * 16, 44 - (i % 2) * 6, 10);
    s.add(shape('M16 50Q16 24 50 22Q84 24 84 50Z', s.rad(P.wood), P.wood.ink, 'transform="rotate(-8 16 50) translate(0 -6)"'));
    s.add(`<path d="M18 62L82 62M30 50L30 88M70 50L70 88" stroke="${P.metal.ink}" stroke-width="5"/><path d="M18 62L82 62M30 50L30 88M70 50L70 88" stroke="${P.metal.mid}" stroke-width="2.4"/>`);
    s.add(shape('M44 60L56 60L56 72L44 72Z', s.rad(P.metal), P.metal.ink));
    s.sparkle(80, 18, 6); s.sparkle(22, 20, 4);
  },
];

const manaArt: ((s: Svg) => void)[] = [
  (s) => {
    s.shadow(14, 82);
    s.add(shape('M50 26Q68 50 68 62Q68 78 50 78Q32 78 32 62Q32 50 50 26Z', s.rad(P.mana), P.mana.ink));
    s.add('<ellipse cx="42" cy="60" rx="4" ry="7" fill="#fff" opacity=".7"/>'); s.sparkle(68, 34, 4);
  },
  (s) => {
    s.shadow(18, 88);
    s.add(shape('M42 22L58 22L58 40Q70 50 70 66Q70 86 50 86Q30 86 30 66Q30 50 42 40Z', 'rgba(255,255,255,.7)', P.mana.ink));
    s.add(`<path d="M32 62Q50 56 68 62Q68 84 50 84Q32 84 32 62Z" fill="${s.rad(P.mana)}"/>`);
    s.add(shape('M40 14L60 14L60 22L40 22Z', s.rad(P.wood), P.wood.ink));
    s.add(hl('M38 52Q34 64 38 74', 2.6, 0.8)); s.sparkle(70, 28, 5);
  },
  (s) => {
    s.halo('#ffb0dc'); s.shadow(26, 92);
    s.add(shape('M42 14L58 14L58 34Q82 42 82 64Q82 90 50 90Q18 90 18 64Q18 42 42 34Z', 'rgba(255,255,255,.7)', P.mana.ink));
    s.add(`<path d="M20 60Q50 50 80 60Q82 88 50 88Q18 88 20 60Z" fill="${s.rad(P.mana)}"/>`);
    s.add('<circle cx="40" cy="70" r="3" fill="#fff" opacity=".7"/><circle cx="58" cy="76" r="2" fill="#fff" opacity=".7"/>');
    s.add(shape('M38 8L62 8L60 16L40 16Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M40 32Q50 38 60 32', 'none', P.metal.ink, 'stroke-width="4"'));
    s.add(hl('M26 52Q22 66 28 78', 3, 0.8)); s.sparkle(80, 26, 6); s.sparkle(16, 36, 4);
  },
];

// ------------------------------------------------------------------ generators

const genArt: Record<GenId, (s: Svg) => void> = {
  geode: (s) => {
    s.shadow(36, 92);
    s.add(shape('M12 86Q8 50 30 32Q50 20 70 32Q92 50 88 86Z', s.rad(ROCK), ROCK.ink));
    s.add(shape('M22 84Q22 56 36 44Q50 36 64 44Q78 56 78 84Z', '#4a3424', ROCK.ink));
    const amber = { hi: '#fff0c8', mid: '#e6b066', lo: '#a8662c', ink: '#5a3214' };
    crystal(s, 36, 84, 14, 30, -24, amber); crystal(s, 64, 84, 14, 32, 22, amber); crystal(s, 50, 84, 18, 40, 0, amber);
    tuft(s, 16, 88); tuft(s, 84, 88, 0.8);
    s.add(hl('M18 70Q18 50 30 40', 3, 0.55)); s.sparkle(80, 22, 6);
  },
  well: (s) => {
    s.shadow(36, 94);
    s.add(shape('M22 30L22 64M78 30L78 64', 'none', P.wood.ink, 'stroke-width="7"'));
    s.add(shape('M22 30L22 64M78 30L78 64', 'none', P.wood.mid, 'stroke-width="3.5"'));
    s.add(shape('M10 32L50 10L90 32L84 36L50 18L16 36Z', s.rad({ hi: '#9fd4ff', mid: '#4a8ad8', lo: '#24508a', ink: '#163460' }), '#163460'));
    s.add(`<path d="M50 28L50 48" stroke="#553016" stroke-width="1.6"/>`);
    s.add(shape('M44 48L56 48L54 58L46 58Z', s.rad(P.wood), P.wood.ink, 'stroke-width="2.2"'));
    s.add(shape('M16 62Q50 54 84 62L80 92L20 92Z', s.rad(ROCK), ROCK.ink));
    for (const [x, y, w] of [[22, 70, 18], [44, 68, 18], [66, 70, 14], [28, 80, 20], [52, 80, 20]] as const) {
      s.add(`<rect x="${x}" y="${y}" width="${w}" height="7" rx="2.5" fill="#fff" opacity=".2"/>`);
    }
    s.add(shape('M18 62Q50 54 82 62Q50 70 18 62Z', s.rad(WATER), WATER.ink, 'stroke-width="2.4"'));
    s.add('<path d="M34 62Q50 58 66 62" stroke="#fff" stroke-width="2" opacity=".7" fill="none"/>');
    s.sparkle(86, 50, 5);
  },
  windmill: (s) => {
    s.shadow(30, 94);
    s.add(shape('M36 92L40 40L60 40L64 92Z', s.rad({ hi: '#fffaf0', mid: '#f0e2c8', lo: '#c8b08a', ink: '#6a5236' }), '#6a5236'));
    s.add(shape('M34 42L50 26L66 42Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M45 92L45 78Q50 72 55 78L55 92Z', '#7c4a24', '#553016', 'stroke-width="2"'));
    s.add(`<circle cx="50" cy="58" r="4" fill="#9fd4ff" stroke="#6a5236" stroke-width="2"/>`);
    for (let i = 0; i < 4; i++) {
      s.add(`<g transform="rotate(${20 + i * 90} 50 38)">`);
      s.add(shape('M48 38L48 4L60 6L58 36Z', s.rad(i % 2 ? WIND : CLOUD), WIND.ink, 'stroke-width="2.4"'));
      s.add(`<path d="M52 10L56 10M52 18L57 18M52 26L57 26" stroke="${WIND.ink}" stroke-width="1.2" opacity=".5"/>`);
      s.add('</g>');
    }
    s.add(`<circle cx="50" cy="38" r="4.5" fill="#ffd147" stroke="${WIND.ink}" stroke-width="2"/>`);
    gust(s, 4, 70, 10);
  },
  forge: (s) => {
    s.halo('#ffb46a'); s.shadow(36, 93);
    s.add(shape('M14 90L14 40Q14 16 50 14Q86 16 86 40L86 90Z', s.rad(P.stone), P.stone.ink));
    for (const [x, y, w] of [[18, 36, 18], [40, 26, 20], [64, 36, 18], [18, 60, 12], [72, 60, 12]] as const) {
      s.add(`<rect x="${x}" y="${y}" width="${w}" height="10" rx="3" fill="#fff" opacity=".18"/>`);
    }
    s.add(shape('M30 90L30 62Q30 46 50 46Q70 46 70 62L70 90Z', '#4a2a2a', P.stone.ink));
    fire(s, 50, 88, 34, 38); fire(s, 40, 88, 14, 18); fire(s, 60, 88, 14, 20);
    s.add(shape('M10 90L90 90L90 94L10 94Z', P.stone.lo, P.stone.ink));
  },
};

// ------------------------------------------------------------------ monsters

function eyes(s: Svg, y: number, gap: number, r: number, cx = 50) {
  for (const x of [cx - gap, cx + gap]) {
    s.add(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="#2a1a3a"/>`);
    s.add(`<circle cx="${x - r * 0.35}" cy="${y - r * 0.4}" r="${r * 0.4}" fill="#fff"/>`);
  }
}

function cheeks(s: Svg, y: number, gap: number) {
  s.add(`<ellipse cx="${50 - gap}" cy="${y}" rx="5" ry="3" fill="#ff7fa8" opacity=".45"/><ellipse cx="${50 + gap}" cy="${y}" rx="5" ry="3" fill="#ff7fa8" opacity=".45"/>`);
}

const monsterArt: Record<MonsterKind, (s: Svg) => void> = {
  slime: (s) => {
    const p = { hi: '#d8fff4', mid: '#5fe0c0', lo: '#20a088', ink: '#106858' };
    s.shadow(36, 90);
    s.add(shape('M14 86Q10 60 30 40Q42 24 50 22Q58 24 70 40Q90 60 86 86Q50 92 14 86Z', s.rad(p), p.ink));
    s.add('<ellipse cx="34" cy="40" rx="7" ry="4" fill="#fff" opacity=".7" transform="rotate(-35 34 40)"/>');
    eyes(s, 60, 12, 5); cheeks(s, 70, 22);
    s.add('<path d="M44 72Q50 78 56 72" fill="none" stroke="#2a1a3a" stroke-width="2.6" stroke-linecap="round"/>');
  },
  bat: (s) => {
    const p = { hi: '#d8c4ff', mid: '#7a5ac8', lo: '#45307a', ink: '#2a1a50' };
    s.shadow(24, 92);
    s.add(shape('M40 50Q20 30 4 40Q14 46 10 58Q20 54 24 64Q30 56 40 62Z', s.rad(p), p.ink));
    s.add(shape('M60 50Q80 30 96 40Q86 46 90 58Q80 54 76 64Q70 56 60 62Z', s.rad(p), p.ink));
    s.add(shape('M34 30L38 16L46 28Z', s.rad(p), p.ink) + shape('M66 30L62 16L54 28Z', s.rad(p), p.ink));
    s.add(shape('M50 26Q70 26 70 52Q70 76 50 76Q30 76 30 52Q30 26 50 26Z', s.rad(p), p.ink));
    eyes(s, 48, 9, 4.5); cheeks(s, 58, 15);
    s.add('<path d="M44 62L46 67L48 62M52 62L54 67L56 62" fill="#fff" stroke="#2a1a3a" stroke-width="1.4" stroke-linejoin="round"/>');
  },
  ghost: (s) => {
    const p = { hi: '#ffffff', mid: '#eee8ff', lo: '#b6a8e6', ink: '#6a5aa8' };
    s.halo('#e8deff'); s.shadow(22, 94);
    s.add(shape('M22 84L22 46Q22 14 50 14Q78 14 78 46L78 84L70 76L62 86L54 76L46 86L38 76L30 86Z', s.rad(p), p.ink));
    s.add(shape('M22 50Q10 52 8 42', 'none', p.ink) + shape('M78 50Q90 52 92 42', 'none', p.ink));
    eyes(s, 44, 11, 5); cheeks(s, 54, 19);
    s.add('<ellipse cx="50" cy="60" rx="5" ry="6" fill="#2a1a3a"/>');
  },
  mushroom: (s) => {
    const cap = { hi: '#ffb8a8', mid: '#f0584a', lo: '#b02a2a', ink: '#7a1a1a' };
    const stem = { hi: '#fffaf0', mid: '#f6e6c8', lo: '#d8bf94', ink: '#8a6a3a' };
    s.shadow(28, 92);
    s.add(shape('M30 54Q28 88 50 90Q72 88 70 54Z', s.rad(stem), stem.ink));
    s.add(shape('M8 56Q8 14 50 12Q92 14 92 56Q50 64 8 56Z', s.rad(cap), cap.ink));
    for (const [x, y, r] of [[30, 34, 6], [54, 24, 7], [74, 40, 5], [46, 46, 4]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".9"/>`);
    eyes(s, 70, 9, 4);
    s.add('<path d="M36 62L44 66M64 62L56 66" stroke="#2a1a3a" stroke-width="2.6" stroke-linecap="round"/>');
    s.add('<path d="M45 81Q50 77 55 81" fill="none" stroke="#2a1a3a" stroke-width="2.4" stroke-linecap="round"/>');
  },
  imp: (s) => {
    const p = { hi: '#ffb0a0', mid: '#ef5a4a', lo: '#a82a2a', ink: '#6a1414' };
    s.shadow(26, 94);
    s.add(shape('M70 76Q92 80 88 60L94 58L86 52L84 60Q84 72 68 70', 'none', p.ink, 'stroke-width="4"'));
    s.add(shape('M30 30Q22 18 26 6Q34 18 40 24Z', s.rad(P.wax), P.wax.ink) + shape('M70 30Q78 18 74 6Q66 18 60 24Z', s.rad(P.wax), P.wax.ink));
    s.add(shape('M50 18Q78 18 78 50Q78 86 50 86Q22 86 22 50Q22 18 50 18Z', s.rad(p), p.ink));
    eyes(s, 48, 11, 5);
    s.add('<path d="M32 38L44 42M68 38L56 42" stroke="#2a1a3a" stroke-width="2.8" stroke-linecap="round"/>');
    s.add('<path d="M38 64Q50 74 62 64" fill="#fff" stroke="#2a1a3a" stroke-width="2.4" stroke-linejoin="round"/>');
    fire(s, 50, 18, 12, 14);
  },
  golem: (s) => {
    s.shadow(38, 94);
    s.add(shape('M10 60Q6 80 20 88L30 70Z', s.rad(P.stone), P.stone.ink) + shape('M90 60Q94 80 80 88L70 70Z', s.rad(P.stone), P.stone.ink));
    s.add(shape('M22 88L18 40Q18 16 50 14Q82 16 82 40L78 88Z', s.rad(P.stone), P.stone.ink));
    for (const [x, y, r] of [[30, 22, 10], [56, 16, 12], [74, 26, 8]] as const) {
      s.add(shape(`M${x - r} ${y + 4}Q${x} ${y - r} ${x + r} ${y + 4}Z`, s.rad(P.herb), P.herb.ink));
    }
    s.add(`<path d="M36 70L42 60L38 52M66 74L60 66" stroke="${P.stone.ink}" stroke-width="2" fill="none" opacity=".5"/>`);
    s.add('<ellipse cx="38" cy="46" rx="6" ry="4" fill="#9ff0ff"/><ellipse cx="62" cy="46" rx="6" ry="4" fill="#9ff0ff"/>');
    s.add('<path d="M42 64L58 64" stroke="#2a1a3a" stroke-width="3" stroke-linecap="round"/>');
  },
  dragon: (s) => {
    const p = { hi: '#ffd08a', mid: '#f07a3a', lo: '#b8402a', ink: '#6a1e14' };
    s.halo('#ffb46a'); s.shadow(36, 94);
    s.add(shape('M30 50Q8 26 2 40Q12 46 6 58Q18 54 20 66Z', s.rad({ ...p, mid: '#e8603a' }), p.ink));
    s.add(shape('M70 50Q92 26 98 40Q88 46 94 58Q82 54 80 66Z', s.rad({ ...p, mid: '#e8603a' }), p.ink));
    s.add(shape('M34 26Q30 10 22 6Q38 10 42 22Z', s.rad(P.wax), P.wax.ink) + shape('M66 26Q70 10 78 6Q62 10 58 22Z', s.rad(P.wax), P.wax.ink));
    s.add(shape('M50 18Q80 18 80 50Q80 88 50 88Q20 88 20 50Q20 18 50 18Z', s.rad(p), p.ink));
    s.add(shape('M36 62Q50 56 64 62Q66 82 50 84Q34 82 36 62Z', s.rad(P.wax), P.wax.ink));
    eyes(s, 44, 12, 5.5);
    s.add('<path d="M30 34L42 38M70 34L58 38" stroke="#2a1a3a" stroke-width="2.8" stroke-linecap="round"/>');
    s.add('<circle cx="45" cy="64" r="1.8" fill="#2a1a3a"/><circle cx="55" cy="64" r="1.8" fill="#2a1a3a"/>');
    s.add(shape('M38 12L44 2L50 10L56 2L62 12Z', s.rad(P.coin), P.coin.ink));
  },
};

// ------------------------------------------------------------------ API

const chainArt: Record<ChainId, ((s: Svg) => void)[]> = {
  earth: earthArt, water: waterArt, wind: windArt, fire: flameArt, coin: coinArt, mana: manaArt,
};

const cache = new Map<string, string>();

/**
 * Painted art overrides. Any key listed in public/art/manifest.json is served
 * from public/art/<key>.png instead of the code-drawn SVG, so real art can be
 * swapped in one item at a time. Keys: `crystal-1`, `gen-geode`, `mon-slime`,
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

// Higher levels fill a little more of the tile, so size grows with the chain too.
export const itemArt = (chain: ChainId, level: number) =>
  toUrl(`${chain}-${level}`, chainArt[chain][level - 1], Math.min(0.95, 0.68 + level * 0.04));
export const generatorArt = (g: GenId) => toUrl(`gen-${g}`, genArt[g], 0.9);
export const monsterImg = (k: MonsterKind) => toUrl(`mon-${k}`, monsterArt[k], 0.94);
export const pieceArt = (p: Piece) => (p.kind === 'gen' ? generatorArt(p.gen) : itemArt(p.chain, p.level));

export const iconArt = {
  hat: () => toUrl('icon-hat', (s) => {
    s.shadow(32, 90);
    s.add(shape('M14 80Q50 64 86 80Q86 90 50 90Q14 90 14 80Z', s.rad(P.arcane), P.arcane.ink));
    s.add(shape('M28 78Q36 50 48 30Q56 12 78 10Q62 22 64 40Q68 60 72 78Q50 84 28 78Z', s.rad(P.arcane), P.arcane.ink));
    s.add(shape('M28 74Q50 80 72 74L73 80Q50 86 28 80Z', s.rad(P.coin), P.coin.ink));
    for (const [x, y, r] of [[48, 54, 5], [58, 36, 4], [40, 66, 3]]) s.sparkle(x, y, r, '#ffe680');
    s.add(hl('M36 66Q42 46 52 32', 2.6, 0.45));
  }),
  coin: () => toUrl('icon-coin', (s) => coinShape(s, 50, 50, 38)),
  gem: () => toUrl('icon-gem', (s) => {
    const p = { hi: '#ffe0f4', mid: '#ff6fb8', lo: '#c0247a', ink: '#7a1450' };
    s.add(shape('M14 38L30 16L70 16L86 38L50 88Z', s.rad(p), p.ink));
    s.add('<path d="M30 16L38 38L14 38Z" fill="#fff" opacity=".55"/><path d="M14 38L86 38" stroke="#7a1450" stroke-width="2" opacity=".5"/>');
  }),
  energy: () => toUrl('icon-energy', (s) => {
    s.add(shape('M58 6L20 56L46 56L38 94L82 40L54 40Z', s.rad({ hi: '#fff6b0', mid: '#ffd23c', lo: '#e89a1c', ink: '#8a5a10' }), '#8a5a10'));
  }),
  star: () => toUrl('icon-star', (s) => {
    s.add(shape('M50 4L62 34L95 36L69 57L78 90L50 72L22 90L31 57L5 36L38 34Z', s.rad({ hi: '#c9ecff', mid: '#5aaaf0', lo: '#2a6ac8', ink: '#163e80' }), '#163e80'));
  }),
};

/** Every override key, i.e. the PNG file names the game will look for. */
export function artKeys(): string[] {
  const out: string[] = [];
  for (const c of Object.keys(chainArt) as ChainId[]) chainArt[c].forEach((_, i) => out.push(`${c}-${i + 1}`));
  for (const g of Object.keys(genArt) as GenId[]) out.push(`gen-${g}`);
  for (const m of Object.keys(monsterArt) as MonsterKind[]) out.push(`mon-${m}`);
  out.push(...Object.keys(iconArt).map((k) => `icon-${k}`));
  return out;
}

/** Every art key, for preloading and the art gallery test page. */
export function allArt(): string[] {
  const out: string[] = [];
  for (const c of Object.keys(chainArt) as ChainId[]) chainArt[c].forEach((_, i) => out.push(itemArt(c, i + 1)));
  for (const g of Object.keys(genArt) as GenId[]) out.push(generatorArt(g));
  for (const m of Object.keys(monsterArt) as MonsterKind[]) out.push(monsterImg(m));
  return out;
}
