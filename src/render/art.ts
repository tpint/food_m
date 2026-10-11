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

/** Builds an SVG document; `defs` are gradient ids local to this image. */
class Svg {
  defs: string[] = [];
  body: string[] = [];
  private g = new Map<string, string>();

  /** Radial gradient lit from the top-left. */
  rad(p: Pal, key = 'r'): string {
    const k = `${key}${p.mid}`;
    if (!this.g.has(k)) {
      const id = `g${uid++}`;
      this.defs.push(`<radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="${p.hi}"/><stop offset=".55" stop-color="${p.mid}"/><stop offset="1" stop-color="${p.lo}"/></radialGradient>`);
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

  glow(color: string): string {
    const k = `glow${color}`;
    if (!this.g.has(k)) {
      const id = `g${uid++}`;
      this.defs.push(`<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity=".75"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`);
      this.g.set(k, id);
    }
    return `url(#${this.g.get(k)})`;
  }

  add(s: string) { this.body.push(s); return this; }

  shadow(rx = 26, cy = 90) {
    return this.add(`<ellipse cx="50" cy="${cy}" rx="${rx}" ry="${rx * 0.2}" fill="#4a3358" opacity=".18"/>`);
  }

  sparkle(x: number, y: number, r: number, color = '#fff') {
    const q = r * 0.28;
    return this.add(`<path d="M${x} ${y - r}Q${x + q} ${y - q} ${x + r} ${y}Q${x + q} ${y + q} ${x} ${y + r}Q${x - q} ${y + q} ${x - r} ${y}Q${x - q} ${y - q} ${x} ${y - r}Z" fill="${color}"/>`);
  }

  toString() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${this.defs.join('')}</defs>${this.body.join('')}</svg>`;
  }
}

const sw = 'stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
const shape = (d: string, fill: string, ink: string, extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${ink}" ${extra.includes('stroke-width') ? sw.replace('stroke-width="2.6" ', '') : sw} ${extra}/>`;
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

function rockBase(s: Svg, cx: number, by: number, w: number) {
  s.add(shape(`M${cx - w / 2} ${by}Q${cx - w / 2 - 2} ${by - 9} ${cx - w / 4} ${by - 11}Q${cx} ${by - 15} ${cx + w / 4} ${by - 11}Q${cx + w / 2 + 2} ${by - 9} ${cx + w / 2} ${by}Q${cx} ${by + 5} ${cx - w / 2} ${by}Z`, s.rad(P.stone), P.stone.ink));
}

const crystalArt: ((s: Svg) => void)[] = [
  (s) => { s.shadow(12, 82); crystal(s, 50, 78, 18, 40, 12); s.sparkle(66, 40, 5); },
  (s) => { s.shadow(18, 84); crystal(s, 40, 80, 18, 42, -14); crystal(s, 58, 82, 20, 52, 10); s.sparkle(28, 36, 5); },
  (s) => {
    s.shadow(30, 88); rockBase(s, 50, 88, 60);
    crystal(s, 32, 80, 16, 34, -28); crystal(s, 68, 80, 16, 36, 26); crystal(s, 50, 78, 22, 60, 0); s.sparkle(76, 30, 6);
  },
  (s) => {
    s.shadow(26, 88); const p = P.crystal;
    s.add(shape('M22 40L36 22L64 22L78 40L50 84Z', s.rad(p), p.ink));
    s.add(`<path d="M22 40L78 40M36 22L42 40L50 84L58 40L64 22M42 40L50 22L58 40" fill="none" stroke="${p.ink}" stroke-width="1.6" opacity=".55"/>`);
    s.add('<path d="M36 22L42 40L22 40Z" fill="#fff" opacity=".55"/><path d="M42 40L50 84L22 40Z" fill="#fff" opacity=".25"/><path d="M58 40L78 40L50 84Z" fill="#1d5a8f" opacity=".2"/>');
    s.sparkle(72, 22, 7); s.sparkle(26, 70, 4);
  },
  (s) => {
    s.add(`<circle cx="50" cy="50" r="42" fill="${s.glow('#8fe3ff')}"/>`); s.shadow(22, 88);
    s.add(shape('M50 18A30 30 0 1 1 49.9 18Z', s.rad(P.crystal), P.crystal.ink));
    s.add('<path d="M34 54Q44 38 62 44Q52 50 50 66Q40 66 34 54Z" fill="#fff" opacity=".35"/>');
    s.add('<ellipse cx="39" cy="34" rx="9" ry="6" fill="#fff" opacity=".8" transform="rotate(-30 39 34)"/>');
    s.sparkle(76, 24, 6); s.sparkle(22, 72, 4);
  },
  (s) => {
    s.add(`<circle cx="50" cy="42" r="40" fill="${s.glow('#a6ecff')}"/>`); s.shadow(28, 90);
    s.add(shape('M28 88L34 72L66 72L72 88Z', s.rad(P.metal), P.metal.ink));
    s.add(shape('M36 74Q50 64 64 74', 'none', P.metal.ink));
    s.add(shape('M50 10A30 30 0 1 1 49.9 10Z', s.rad(P.crystal), P.crystal.ink));
    s.add('<path d="M36 46Q42 30 58 32Q48 40 56 52Q42 58 36 46Z" fill="#fff" opacity=".4"/><path d="M50 26Q66 30 64 46" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>');
    s.add('<ellipse cx="38" cy="25" rx="8" ry="5" fill="#fff" opacity=".85" transform="rotate(-30 38 25)"/>');
    s.sparkle(80, 18, 6); s.sparkle(18, 54, 5);
  },
  (s) => {
    s.add(`<circle cx="50" cy="48" r="46" fill="${s.glow('#bff3ff')}"/>`); s.shadow(26, 92);
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 17 : 40;
      pts.push(`${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`);
    }
    s.add(shape(`M${pts.join('L')}Z`, s.rad(P.crystal), P.crystal.ink));
    s.add(`<path d="M50 10L50 50L88 38M50 50L74 82M50 50L26 82M50 50L12 38" fill="none" stroke="${P.crystal.ink}" stroke-width="1.4" opacity=".4"/>`);
    s.add('<path d="M50 10L50 50L12 38L33 44Z" fill="#fff" opacity=".5"/>');
    s.sparkle(84, 14, 7); s.sparkle(16, 16, 5); s.sparkle(86, 70, 4);
  },
];

// ------------------------------------------------------------------ herb

function leaf(s: Svg, x: number, y: number, len: number, rot: number, p = P.herb) {
  s.add(`<g transform="translate(${x} ${y}) rotate(${rot})">`);
  s.add(shape(`M0 0Q${len * 0.45} ${-len * 0.38} ${len} 0Q${len * 0.45} ${len * 0.38} 0 0Z`, s.rad(p), p.ink));
  s.add(`<path d="M2 0L${len * 0.8} 0" stroke="${p.ink}" stroke-width="1.4" opacity=".5"/>`);
  s.add('</g>');
}

function pot(s: Svg, cx: number, top: number, w: number, h: number) {
  const p = P.pot;
  s.add(shape(`M${cx - w * 0.42} ${top + 6}L${cx - w * 0.32} ${top + h}L${cx + w * 0.32} ${top + h}L${cx + w * 0.42} ${top + 6}Z`, s.rad(p), p.ink));
  s.add(shape(`M${cx - w / 2} ${top}L${cx + w / 2} ${top}L${cx + w / 2} ${top + 9}L${cx - w / 2} ${top + 9}Z`, s.lin(p.hi, p.mid), p.ink, 'rx="3"'));
  s.add(hl(`M${cx - w * 0.3} ${top + 14}L${cx - w * 0.25} ${top + h - 5}`, 2.5, 0.5));
}

const herbArt: ((s: Svg) => void)[] = [
  (s) => {
    s.shadow(14, 76);
    s.add(shape('M50 44Q64 48 63 62Q61 76 50 76Q39 76 37 62Q36 48 50 44Z', s.rad(P.wood), P.wood.ink));
    s.add('<path d="M50 48Q58 56 52 72" fill="none" stroke="#553016" stroke-width="1.5" opacity=".4"/>');
    leaf(s, 50, 46, 14, -70); s.add('<ellipse cx="44" cy="56" rx="3" ry="5" fill="#fff" opacity=".6"/>');
  },
  (s) => {
    s.shadow(22, 84);
    s.add(shape('M28 84Q30 70 50 68Q70 70 72 84Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M50 70Q49 54 51 42', 'none', P.herb.ink));
    leaf(s, 50, 50, 24, -150); leaf(s, 51, 44, 26, -30);
  },
  (s) => {
    s.shadow(20, 88);
    s.add(shape('M50 88Q46 66 52 38', 'none', P.herb.ink, 'stroke-width="4"'));
    const heart = (x: number, y: number, r: number) => {
      s.add(`<g transform="translate(${x} ${y}) rotate(${r})">`);
      s.add(shape('M0 0C-14 -6 -16 -22 -6 -24C-2 -24 0 -20 0 -18C0 -20 2 -24 6 -24C16 -22 14 -6 0 0Z', s.rad(P.herb), P.herb.ink));
      s.add('<path d="M0 -2L0 -16" stroke="#2c5a27" stroke-width="1.4" opacity=".5"/></g>');
    };
    heart(52, 40, 0); heart(50, 42, -100); heart(54, 42, 100);
    leaf(s, 49, 70, 18, -160); s.sparkle(76, 20, 5);
  },
  (s) => {
    s.shadow(26, 90);
    for (const [r, l] of [[-120, 30], [-95, 36], [-75, 38], [-55, 32], [-105, 34]] as const) {
      s.add(shape(`M50 82L${50 + Math.cos((r * Math.PI) / 180) * 30} ${82 + Math.sin((r * Math.PI) / 180) * 30}`, 'none', P.herb.ink));
      leaf(s, 50 + Math.cos((r * Math.PI) / 180) * 26, 82 + Math.sin((r * Math.PI) / 180) * 26, l * 0.6, r - 10);
    }
    leaf(s, 50, 52, 26, -100); leaf(s, 48, 54, 22, -130); leaf(s, 52, 54, 22, -50);
    s.add(shape('M38 70L62 70L60 78L40 78Z', s.lin('#f1d29a', '#c7964e'), '#7c4a24'));
    s.add('<path d="M41 74L59 74" stroke="#7c4a24" stroke-width="1.5"/>');
  },
  (s) => {
    s.shadow(26, 92); pot(s, 50, 58, 50, 32);
    s.add(shape('M36 60Q34 46 50 44Q66 46 64 60Z', s.rad({ hi: '#f6e0b8', mid: '#dcb57c', lo: '#a87a42', ink: '#6b4423' }), '#6b4423'));
    s.add('<circle cx="44" cy="53" r="2.2" fill="#3a2414"/><circle cx="56" cy="53" r="2.2" fill="#3a2414"/><path d="M46 58Q50 61 54 58" fill="none" stroke="#3a2414" stroke-width="1.6" stroke-linecap="round"/>');
    leaf(s, 50, 46, 30, -125); leaf(s, 50, 46, 30, -55); leaf(s, 50, 46, 26, -90);
  },
  (s) => {
    s.add(`<circle cx="50" cy="34" r="34" fill="${s.glow('#e8ffd0')}"/>`); s.shadow(26, 92); pot(s, 50, 62, 46, 28);
    s.add(shape('M50 64Q48 50 50 40', 'none', P.herb.ink, 'stroke-width="3.5"'));
    leaf(s, 50, 60, 26, -160); leaf(s, 50, 58, 26, -20);
    for (let i = 0; i < 6; i++) {
      s.add(`<g transform="rotate(${i * 60} 50 32)">`);
      s.add(shape('M50 32Q41 20 50 10Q59 20 50 32Z', s.rad({ hi: '#ffffff', mid: '#eaffd8', lo: '#a6d98a', ink: '#4a7d3a' }), '#4a7d3a'));
      s.add('</g>');
    }
    s.add(`<circle cx="50" cy="32" r="6" fill="${s.rad(P.coin)}" stroke="${P.coin.ink}" stroke-width="2"/>`);
    s.sparkle(80, 16, 5); s.sparkle(18, 30, 4);
  },
  (s) => {
    s.add(`<circle cx="50" cy="40" r="44" fill="${s.glow('#d6ffb0')}"/>`); s.shadow(30, 93);
    s.add(shape('M24 82L76 82L70 93L30 93Z', s.rad(P.stone), P.stone.ink));
    s.add(shape('M48 82Q44 70 50 60Q54 52 46 46M50 64Q60 60 64 52', 'none', P.wood.ink, 'stroke-width="6"'));
    s.add(shape('M48 82Q44 70 50 60Q54 52 46 46M50 64Q60 60 64 52', 'none', P.wood.mid, 'stroke-width="3"'));
    for (const [x, y, r] of [[30, 42, 16], [52, 30, 20], [72, 44, 15], [42, 50, 12], [62, 54, 12]] as const) {
      s.add(shape(`M${x} ${y - r}A${r} ${r} 0 1 1 ${x - 0.1} ${y - r}Z`, s.rad(P.herb), P.herb.ink));
    }
    s.add('<ellipse cx="44" cy="20" rx="7" ry="4" fill="#fff" opacity=".6" transform="rotate(-20 44 20)"/>');
    for (const [x, y] of [[36, 36], [60, 26], [70, 46], [48, 46]]) s.add(`<circle cx="${x}" cy="${y}" r="2.6" fill="#ffe6f4" stroke="#d63f98" stroke-width="1"/>`);
    s.sparkle(86, 18, 6); s.sparkle(14, 22, 4);
  },
];

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
  (s) => { s.add(`<circle cx="50" cy="56" r="26" fill="${s.glow('#ffd27a')}"/>`); s.shadow(12, 80); fire(s, 50, 78, 30, 44); s.sparkle(70, 34, 4, '#fff6c4'); },
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
    s.add(`<circle cx="50" cy="56" r="30" fill="${s.glow('#ffd27a')}"/>`); s.shadow(22, 92);
    s.add(shape('M44 18Q50 8 56 18', 'none', P.metal.ink, 'stroke-width="3"'));
    s.add(shape('M34 26L66 26L60 18L40 18Z', s.rad({ ...P.flame, hi: '#ff9a6a', mid: '#d84a2a', lo: '#9c3020' }), P.flame.ink));
    s.add(shape('M32 28L68 28L64 82L36 82Z', 'rgba(255,240,200,.55)', P.flame.ink));
    fire(s, 50, 74, 20, 32);
    s.add(`<path d="M41 30L39 80M59 30L61 80" stroke="${P.flame.ink}" stroke-width="2.4"/>`);
    s.add(shape('M30 82L70 82L68 92L32 92Z', s.rad({ ...P.flame, hi: '#ff9a6a', mid: '#d84a2a', lo: '#9c3020' }), P.flame.ink));
    s.add(hl('M35 34L37 76', 2.4, 0.7));
  },
  (s) => {
    s.add(`<circle cx="50" cy="40" r="40" fill="${s.glow('#ffc46a')}"/>`); s.shadow(26, 93);
    s.add(shape('M34 70L28 92M66 70L72 92M50 72L50 92', 'none', P.stone.ink, 'stroke-width="5"'));
    fire(s, 50, 58, 50, 56); fire(s, 36, 58, 22, 30); fire(s, 64, 58, 22, 32);
    s.add(shape('M18 54Q50 50 82 54Q78 76 50 76Q22 76 18 54Z', s.rad(P.stone), P.stone.ink));
    s.add(`<path d="M18 54Q50 60 82 54" fill="none" stroke="${P.stone.ink}" stroke-width="2"/>`);
    s.add(hl('M26 60Q32 70 44 72', 2.4, 0.6));
    s.sparkle(80, 22, 4, '#fff6c4'); s.sparkle(22, 26, 3, '#fff6c4');
  },
  (s) => {
    s.add(`<circle cx="50" cy="48" r="44" fill="${s.glow('#ffb46a')}"/>`); s.shadow(18, 92);
    s.add('<g transform="rotate(28 50 50)">');
    s.add(shape('M50 8Q74 30 66 62Q60 80 50 86Q40 80 34 62Q26 30 50 8Z', s.rad({ hi: '#fff3b0', mid: '#ff9a3c', lo: '#d8402a', ink: P.flame.ink }), P.flame.ink));
    s.add('<path d="M50 14Q62 34 58 60Q54 74 50 80Q46 74 42 60Q38 34 50 14Z" fill="#ffd56a" opacity=".8"/>');
    s.add(`<path d="M50 20L50 96" stroke="${P.flame.ink}" stroke-width="2.6" stroke-linecap="round"/>`);
    for (let i = 0; i < 4; i++) s.add(`<path d="M50 ${32 + i * 12}L${62 - i} ${26 + i * 12}M50 ${32 + i * 12}L${38 + i} ${26 + i * 12}" stroke="${P.flame.lo}" stroke-width="1.6" opacity=".7"/>`);
    s.add('</g>');
    fire(s, 30, 30, 14, 20); s.sparkle(76, 20, 5, '#fff6c4'); s.sparkle(20, 66, 4, '#fff6c4');
  },
  (s) => {
    s.add(`<circle cx="50" cy="50" r="46" fill="${s.glow('#ff9a5a')}"/>`); s.shadow(26, 93);
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

// ------------------------------------------------------------------ arcane

function rune(s: Svg, x: number, y: number, k: number, color = '#fff') {
  const d = [
    `M${x} ${y - k}L${x} ${y + k}M${x} ${y - k * 0.3}L${x + k * 0.7} ${y - k}M${x} ${y + k * 0.1}L${x - k * 0.7} ${y - k * 0.5}`,
    `M${x - k * 0.6} ${y + k}L${x} ${y - k}L${x + k * 0.6} ${y + k}M${x - k * 0.35} ${y + k * 0.2}L${x + k * 0.35} ${y + k * 0.2}`,
  ][Math.round(x + y) % 2];
  s.add(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`);
}

function book(s: Svg, cx: number, cy: number, w: number, h: number, p: Pal) {
  s.add(shape(`M${cx - w / 2 + 4} ${cy - h / 2 + 6}L${cx + w / 2} ${cy - h / 2 + 6}L${cx + w / 2} ${cy + h / 2 + 4}L${cx - w / 2 + 4} ${cy + h / 2 + 4}Z`, s.lin(P.paper.hi, P.paper.lo), P.paper.ink));
  s.add(shape(`M${cx - w / 2} ${cy - h / 2}L${cx + w / 2 - 4} ${cy - h / 2}L${cx + w / 2 - 4} ${cy + h / 2}L${cx - w / 2} ${cy + h / 2}Z`, s.rad(p), p.ink, 'rx="4"'));
  s.add(`<path d="M${cx - w / 2 + 6} ${cy - h / 2}L${cx - w / 2 + 6} ${cy + h / 2}" stroke="${p.ink}" stroke-width="2" opacity=".6"/>`);
}

const arcaneArt: ((s: Svg) => void)[] = [
  (s) => {
    s.shadow(16, 80);
    s.add(shape('M50 50Q68 50 68 64Q68 78 50 78Q32 78 32 64Q32 50 50 50Z', s.rad(P.arcane), P.arcane.ink));
    rune(s, 51, 64, 7, '#f6eaff'); s.add('<ellipse cx="41" cy="57" rx="5" ry="3" fill="#fff" opacity=".6"/>');
  },
  (s) => {
    s.shadow(20, 88);
    s.add(shape('M34 86L32 34Q32 22 50 22Q68 22 68 34L66 86Z', s.rad(P.arcane), P.arcane.ink));
    rune(s, 50, 44, 8, '#f6eaff'); rune(s, 50, 68, 7, '#f6eaff');
    s.add(hl('M38 36L38 80', 2.4, 0.5)); s.sparkle(76, 26, 5, '#f6eaff');
  },
  (s) => {
    s.shadow(28, 86);
    s.add(shape('M22 30L78 30L78 74L22 74Z', s.lin(P.paper.hi, P.paper.mid), P.paper.ink));
    for (let i = 0; i < 4; i++) s.add(`<path d="M30 ${40 + i * 8}L${70 - (i % 2) * 10} ${40 + i * 8}" stroke="${P.arcane.mid}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`);
    for (const y of [30, 74]) {
      s.add(shape(`M16 ${y}A6 7 0 1 1 16 ${y + 0.1}Z`, s.rad(P.arcane), P.arcane.ink, `transform="translate(0 ${-0.05})"`));
      s.add(shape(`M18 ${y - 6}L82 ${y - 6}Q88 ${y} 82 ${y + 6}L18 ${y + 6}Q12 ${y} 18 ${y - 6}Z`, s.lin(P.paper.hi, P.paper.lo), P.paper.ink));
      s.add(`<circle cx="15" cy="${y}" r="5" fill="${s.rad(P.arcane)}" stroke="${P.arcane.ink}" stroke-width="2"/><circle cx="85" cy="${y}" r="5" fill="${s.rad(P.arcane)}" stroke="${P.arcane.ink}" stroke-width="2"/>`);
    }
    s.add(`<circle cx="66" cy="62" r="6" fill="#d8404a" stroke="#8a1e28" stroke-width="2"/>`);
  },
  (s) => {
    s.shadow(28, 90);
    book(s, 50, 52, 54, 64, P.arcane);
    s.add(shape('M44 36L50 26L56 36L66 40L58 48L60 58L50 52L40 58L42 48L34 40Z', s.rad(P.coin), P.coin.ink, 'transform="translate(2 8) scale(.94)"'));
    s.add(hl('M30 28L30 80', 2.4, 0.5));
    s.add(`<path d="M24 76L74 76" stroke="${P.metal.mid}" stroke-width="4"/>`);
  },
  (s) => {
    s.add(`<circle cx="70" cy="30" r="26" fill="${s.glow('#e6ccff')}"/>`); s.shadow(18, 90);
    s.add(shape('M24 86L64 40', 'none', P.wood.ink, 'stroke-width="9"'));
    s.add(shape('M24 86L64 40', 'none', s.lin(P.wood.hi, P.wood.lo), 'stroke-width="5"'));
    s.add(shape('M28 82L36 73', 'none', P.metal.ink, 'stroke-width="9"'));
    s.add(shape('M28 82L36 73', 'none', P.metal.mid, 'stroke-width="5"'));
    s.add(shape('M70 12L75 26L90 28L78 37L82 52L70 43L58 52L62 37L50 28L65 26Z', s.rad(P.arcane), P.arcane.ink));
    s.add('<ellipse cx="66" cy="28" rx="4" ry="3" fill="#fff" opacity=".7"/>');
    s.sparkle(36, 26, 5, '#f3e6ff'); s.sparkle(88, 64, 4, '#f3e6ff');
  },
  (s) => {
    s.shadow(32, 90);
    s.add(shape('M14 80Q50 64 86 80Q86 90 50 90Q14 90 14 80Z', s.rad(P.arcane), P.arcane.ink));
    s.add(shape('M28 78Q36 50 48 30Q56 12 78 10Q62 22 64 40Q68 60 72 78Q50 84 28 78Z', s.rad(P.arcane), P.arcane.ink));
    s.add(shape('M28 74Q50 80 72 74L73 80Q50 86 28 80Z', s.rad(P.coin), P.coin.ink));
    for (const [x, y, r] of [[48, 54, 5], [58, 36, 4], [40, 66, 3]]) s.sparkle(x, y, r, '#ffe680');
    s.add(hl('M36 66Q42 46 52 32', 2.6, 0.45));
  },
  (s) => {
    s.add(`<circle cx="50" cy="44" r="46" fill="${s.glow('#d9b8ff')}"/>`); s.shadow(26, 94);
    s.add(shape('M50 34Q34 24 12 30L14 72Q34 66 50 76Q66 66 86 72L88 30Q66 24 50 34Z', s.rad(P.arcane), P.arcane.ink));
    s.add(shape('M50 30Q34 20 16 26L18 66Q34 62 50 70Z', s.lin(P.paper.hi, P.paper.mid), P.paper.ink));
    s.add(shape('M50 30Q66 20 84 26L82 66Q66 62 50 70Z', s.lin(P.paper.mid, P.paper.hi, false), P.paper.ink));
    for (let i = 0; i < 3; i++) {
      s.add(`<path d="M24 ${36 + i * 8}Q34 ${33 + i * 8} 44 ${38 + i * 8}" fill="none" stroke="${P.arcane.mid}" stroke-width="2" opacity=".8"/>`);
    }
    s.add(`<circle cx="66" cy="44" r="9" fill="none" stroke="${P.arcane.mid}" stroke-width="2.4"/>`);
    rune(s, 66, 44, 5, P.arcane.lo);
    s.add(`<path d="M50 14L50 6M34 16L30 9M66 16L70 9" stroke="#f3e6ff" stroke-width="3" stroke-linecap="round"/>`);
    s.sparkle(16, 14, 5, '#f3e6ff'); s.sparkle(86, 12, 6, '#f3e6ff'); s.sparkle(88, 86, 4, '#f3e6ff');
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
    s.add(`<circle cx="50" cy="44" r="40" fill="${s.glow('#ffe58a')}"/>`); s.shadow(32, 92);
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
    s.add(`<circle cx="50" cy="58" r="40" fill="${s.glow('#ffb0dc')}"/>`); s.shadow(26, 92);
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
    s.add(shape('M12 86Q8 50 30 32Q50 20 70 32Q92 50 88 86Z', s.rad(P.stone), P.stone.ink));
    s.add(shape('M22 84Q22 56 36 44Q50 36 64 44Q78 56 78 84Z', '#5b4f78', P.stone.ink));
    crystal(s, 36, 84, 14, 30, -24); crystal(s, 64, 84, 14, 32, 22); crystal(s, 50, 84, 18, 40, 0);
    s.add(hl('M18 70Q18 50 30 40', 3, 0.55)); s.sparkle(80, 22, 6);
  },
  planter: (s) => {
    s.shadow(36, 92);
    leaf(s, 30, 52, 22, -120); leaf(s, 44, 50, 26, -80); leaf(s, 58, 52, 24, -100); leaf(s, 70, 52, 22, -50);
    s.add(shape('M50 52Q48 30 52 22', 'none', P.herb.ink, 'stroke-width="3"'));
    for (let i = 0; i < 5; i++) {
      s.add(`<g transform="rotate(${i * 72} 52 20)">`);
      s.add(shape('M52 20Q46 12 52 6Q58 12 52 20Z', s.rad({ hi: '#fff', mid: '#ffd6ec', lo: '#f28cc4', ink: '#a8487a' }), '#a8487a'));
      s.add('</g>');
    }
    s.add('<circle cx="52" cy="20" r="3.5" fill="#ffe680" stroke="#9a6510" stroke-width="1.5"/>');
    s.add(shape('M12 54L88 54L82 90L18 90Z', s.rad(P.wood), P.wood.ink));
    s.add(`<path d="M15 66L85 66M17 78L83 78" stroke="${P.wood.ink}" stroke-width="2" opacity=".5"/>`);
    s.add(shape('M10 50L90 50L90 58L10 58Z', s.lin(P.wood.hi, P.wood.mid), P.wood.ink));
  },
  forge: (s) => {
    s.add(`<circle cx="50" cy="56" r="36" fill="${s.glow('#ffb46a')}"/>`); s.shadow(36, 93);
    s.add(shape('M14 90L14 40Q14 16 50 14Q86 16 86 40L86 90Z', s.rad(P.stone), P.stone.ink));
    for (const [x, y, w] of [[18, 36, 18], [40, 26, 20], [64, 36, 18], [18, 60, 12], [72, 60, 12]] as const) {
      s.add(`<rect x="${x}" y="${y}" width="${w}" height="10" rx="3" fill="#fff" opacity=".18"/>`);
    }
    s.add(shape('M30 90L30 62Q30 46 50 46Q70 46 70 62L70 90Z', '#4a2a2a', P.stone.ink));
    fire(s, 50, 88, 34, 38); fire(s, 40, 88, 14, 18); fire(s, 60, 88, 14, 20);
    s.add(shape('M10 90L90 90L90 94L10 94Z', P.stone.lo, P.stone.ink));
  },
  lectern: (s) => {
    s.add(`<circle cx="50" cy="30" r="30" fill="${s.glow('#d9b8ff')}"/>`); s.shadow(30, 93);
    s.add(shape('M44 50L40 86L60 86L56 50Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M26 88L74 88L70 94L30 94Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M14 54L50 44L86 54L82 60L50 52L18 60Z', s.rad(P.wood), P.wood.ink));
    s.add(shape('M50 46Q34 38 18 42L20 52Q36 48 50 54Q64 48 80 52L82 42Q66 38 50 46Z', s.lin(P.paper.hi, P.paper.mid), P.paper.ink));
    for (const [x, y, r] of [[50, 22, 7], [32, 28, 4], [68, 26, 5]]) {
      s.add(shape(`M${x} ${y - r * 1.4}L${x + r} ${y}L${x} ${y + r * 1.4}L${x - r} ${y}Z`, s.rad(P.arcane), P.arcane.ink));
    }
    s.sparkle(84, 16, 5, '#f3e6ff');
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
    s.add(`<circle cx="50" cy="50" r="44" fill="${s.glow('#e8deff')}"/>`); s.shadow(22, 94);
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
    s.add(`<circle cx="50" cy="50" r="48" fill="${s.glow('#ffb46a')}"/>`); s.shadow(36, 94);
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
  crystal: crystalArt, herb: herbArt, flame: flameArt, arcane: arcaneArt, coin: coinArt, mana: manaArt,
};

const cache = new Map<string, string>();

function toUrl(key: string, draw: (s: Svg) => void): string {
  let url = cache.get(key);
  if (!url) {
    const s = new Svg();
    draw(s);
    url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s.toString())}`;
    cache.set(key, url);
  }
  return url;
}

export const itemArt = (chain: ChainId, level: number) => toUrl(`${chain}${level}`, chainArt[chain][level - 1]);
export const generatorArt = (g: GenId) => toUrl(`gen-${g}`, genArt[g]);
export const monsterImg = (k: MonsterKind) => toUrl(`mon-${k}`, monsterArt[k]);
export const pieceArt = (p: Piece) => (p.kind === 'gen' ? generatorArt(p.gen) : itemArt(p.chain, p.level));

export const iconArt = {
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

/** Every art key, for preloading and the art gallery test page. */
export function allArt(): string[] {
  const out: string[] = [];
  for (const c of Object.keys(chainArt) as ChainId[]) chainArt[c].forEach((_, i) => out.push(itemArt(c, i + 1)));
  for (const g of Object.keys(genArt) as GenId[]) out.push(generatorArt(g));
  for (const m of Object.keys(monsterArt) as MonsterKind[]) out.push(monsterImg(m));
  return out;
}
