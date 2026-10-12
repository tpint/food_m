// Painted grimoire generators for Arcane Merge.
// Builds a detailed, painterly SVG for each generator/level; render.mjs rasterises them to PNG.
// Same conventions as src/render/art.ts: light from the top-left, navy sticker outline,
// one colour family per element, and the same per-level upgrade flourishes.

let uid = 0;
const id = (p) => `${p}${uid++}`;
const f1 = (n) => (+n).toFixed(2).replace(/\.?0+$/, '');

const METAL = { hi: '#fff7d6', mid: '#ecc45e', lo: '#b07c22', ink: '#6a4510' };
const IRON = { hi: '#eef0f4', mid: '#a9adbb', lo: '#6c7083', ink: '#3d4053' };
const PAPER = { hi: '#fffdf4', mid: '#f6e9c8', lo: '#dcc391', ink: '#8a6a3a' };

const ELEMENTS = {
  geode: {
    el: 'earth', halo: '#f2d08a', glow: '#ffd27a',
    cover: { hi: '#e9c08a', mid: '#a06a3c', lo: '#603a1e', ink: '#3a2210' },
    script: '#7a4a22',
  },
  well: {
    el: 'water', halo: '#9fdcff', glow: '#8fe0ff',
    cover: { hi: '#a6d8ff', mid: '#2f7fd8', lo: '#174a8c', ink: '#0e2e5a' },
    script: '#1f5fa8',
  },
  windmill: {
    el: 'wind', halo: '#b8f5e0', glow: '#a8ffe0',
    cover: { hi: '#d8fff0', mid: '#36b08c', lo: '#1c6a56', ink: '#0e4438' },
    script: '#1f7a62',
  },
  forge: {
    el: 'fire', halo: '#ffb46a', glow: '#ffb04a',
    cover: { hi: '#ffa080', mid: '#d43e28', lo: '#861c12', ink: '#560f08' },
    script: '#a8321e',
  },
};

class Svg {
  constructor() { this.defs = []; this.back = []; this.body = []; this.fx = []; this.g = new Map(); }
  rad(p, key = 'r', cx = '35%', cy = '28%') {
    const k = `${key}${p.mid}${cx}${cy}`;
    if (!this.g.has(k)) {
      const i = id('g');
      this.defs.push(`<radialGradient id="${i}" cx="${cx}" cy="${cy}" r="80%"><stop offset="0" stop-color="${p.hi}"/><stop offset=".42" stop-color="${p.mid}"/><stop offset=".84" stop-color="${p.lo}"/><stop offset="1" stop-color="${p.ink}"/></radialGradient>`);
      this.g.set(k, i);
    }
    return `url(#${this.g.get(k)})`;
  }
  lin(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
    const k = `l${stops.join()}${x1}${y1}${x2}${y2}`;
    if (!this.g.has(k)) {
      const i = id('g');
      const n = stops.length - 1;
      this.defs.push(`<linearGradient id="${i}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map((c, j) => {
        const [col, op] = c.split('@');
        return `<stop offset="${f1(j / n)}" stop-color="${col}"${op ? ` stop-opacity="${op}"` : ''}/>`;
      }).join('')}</linearGradient>`);
      this.g.set(k, i);
    }
    return `url(#${this.g.get(k)})`;
  }
  /** Radial fade from a colour to transparent. */
  glowGrad(color, op = 0.8) {
    const k = `h${color}${op}`;
    if (!this.g.has(k)) {
      const i = id('g');
      this.defs.push(`<radialGradient id="${i}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset=".55" stop-color="${color}" stop-opacity="${op * 0.4}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`);
      this.g.set(k, i);
    }
    return `url(#${this.g.get(k)})`;
  }
  add(s) { this.body.push(s); }
}

// ------------------------------------------------------------------ filters

function filters() {
  return `
<filter id="bev" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="erode" radius="1.1" result="e"/>
  <feGaussianBlur in="e" stdDeviation="1.3" result="b"/>
  <feOffset in="b" dx="1.3" dy="1.7" result="bd"/>
  <feComposite in="e" in2="bd" operator="out" result="hiE"/>
  <feFlood flood-color="#ffffff" flood-opacity=".6"/><feComposite in2="hiE" operator="in" result="hi"/>
  <feOffset in="b" dx="-1.3" dy="-1.7" result="bu"/>
  <feComposite in="e" in2="bu" operator="out" result="loE"/>
  <feFlood flood-color="#1a0a2a" flood-opacity=".38"/><feComposite in2="loE" operator="in" result="lo"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="lo"/><feMergeNode in="hi"/></feMerge>
</filter>
<filter id="softbev" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceAlpha" operator="erode" radius=".6" result="e"/>
  <feGaussianBlur in="e" stdDeviation="2.4" result="b"/>
  <feOffset in="b" dx="-2" dy="-2.6" result="bu"/>
  <feComposite in="e" in2="bu" operator="out" result="loE"/>
  <feFlood flood-color="#1a0a2a" flood-opacity=".3"/><feComposite in2="loE" operator="in" result="lo"/>
  <feOffset in="b" dx="1.6" dy="2" result="bd"/>
  <feComposite in="e" in2="bd" operator="out" result="hiE"/>
  <feFlood flood-color="#ffffff" flood-opacity=".35"/><feComposite in2="hiE" operator="in" result="hi"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="lo"/><feMergeNode in="hi"/></feMerge>
</filter>
<filter id="leather" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="11" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -.78" result="dk"/>
  <feComposite in="dk" in2="SourceAlpha" operator="in" result="dk2"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 -1.6 0 0 .62" result="lt"/>
  <feComposite in="lt" in2="SourceAlpha" operator="in" result="lt2"/>
  <feComponentTransfer in="dk2" result="dk3"><feFuncA type="linear" slope=".55"/></feComponentTransfer>
  <feComponentTransfer in="lt2" result="lt3"><feFuncA type="linear" slope=".35"/></feComponentTransfer>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dk3"/><feMergeNode in="lt3"/></feMerge>
</filter>
<filter id="paper" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".35 2.2" numOctaves="2" seed="4" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 .55  0 0 0 0 .4  0 0 0 0 .2  1.2 0 0 0 -.55" result="dk"/>
  <feComposite in="dk" in2="SourceAlpha" operator="in" result="dk2"/>
  <feComponentTransfer in="dk2" result="dk3"><feFuncA type="linear" slope=".22"/></feComponentTransfer>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dk3"/></feMerge>
</filter>
<filter id="glowf" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="glows" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1"/></filter>
<filter id="blur4" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="sticker" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".28 1.5" numOctaves="2" seed="21" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1 0 0 0 -.6" result="br"/>
  <feComposite in="br" in2="SourceAlpha" operator="in" result="br2"/>
  <feComponentTransfer in="br2" result="br3"><feFuncA type="linear" slope=".18"/></feComponentTransfer>
  <feColorMatrix in="SourceGraphic" type="saturate" values="1.18" result="sat"/>
  <feComponentTransfer in="sat" result="g"><feFuncR type="linear" slope="1.06" intercept="-.02"/><feFuncG type="linear" slope="1.06" intercept="-.02"/><feFuncB type="linear" slope="1.06" intercept="-.02"/></feComponentTransfer>
  <feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="d"/>
  <feFlood flood-color="#28306a"/><feComposite in2="d" operator="in" result="ol"/>
  <feGaussianBlur in="d" stdDeviation=".7"/><feOffset dy="2.2" result="b"/>
  <feFlood flood-color="#1e3a8a" flood-opacity=".3"/><feComposite in2="b" operator="in" result="sh"/>
  <feMerge><feMergeNode in="sh"/><feMergeNode in="ol"/><feMergeNode in="g"/><feMergeNode in="br3"/></feMerge>
</filter>`;
}

// ------------------------------------------------------------------ helpers

const SW = 'stroke-linejoin="round" stroke-linecap="round"';
const path = (d, fill, stroke = 'none', w = 2.2, extra = '') =>
  `<path d="${d}" fill="${fill}"${stroke !== 'none' ? ` stroke="${stroke}" stroke-width="${w}" ${SW}` : ''} ${extra}/>`;
const hl = (d, w = 2.4, op = 0.75, col = '#fff') =>
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;

function sparkle(s, x, y, r, color = '#fff', layer = s.fx) {
  const q = r * 0.26;
  layer.push(`<path d="M${x} ${y - r}Q${x + q} ${y - q} ${x + r} ${y}Q${x + q} ${y + q} ${x} ${y + r}Q${x - q} ${y + q} ${x - r} ${y}Q${x - q} ${y - q} ${x} ${y - r}Z" fill="${color}" stroke="rgba(70,40,110,.45)" stroke-width=".7"/>`);
  layer.push(`<circle cx="${x}" cy="${y}" r="${r * 0.28}" fill="#fff"/>`);
}

function gem(s, x, y, r, pal, ink = METAL.ink) {
  return `<g filter="url(#bev)"><circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad(pal, 'gem', '35%', '30%')}" stroke="${ink}" stroke-width="${f1(Math.max(0.8, r * 0.38))}"/></g>`
    + `<path d="M${f1(x - r * 0.55)} ${f1(y - r * 0.1)}Q${f1(x - r * 0.45)} ${f1(y - r * 0.55)} ${f1(x - r * 0.05)} ${f1(y - r * 0.6)}" fill="none" stroke="#fff" stroke-width="${f1(r * 0.32)}" stroke-linecap="round" opacity=".9"/>`
    + `<circle cx="${f1(x + r * 0.35)}" cy="${f1(y + r * 0.35)}" r="${f1(r * 0.16)}" fill="#fff" opacity=".7"/>`;
}

function rivet(s, x, y, r, pal) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad(pal, 'riv', '30%', '28%')}" stroke="${pal.ink}" stroke-width=".8"/><circle cx="${f1(x - r * 0.35)}" cy="${f1(y - r * 0.35)}" r="${f1(r * 0.35)}" fill="#fff" opacity=".85"/>`;
}

// ------------------------------------------------------------------ alchemy

function alchemy(el, cx, cy, k, color, width = 2.4) {
  const up = el === 'fire' || el === 'wind', dir = up ? -1 : 1;
  let d = `M${cx} ${cy + dir * k}L${f1(cx + k * 0.9)} ${f1(cy - dir * k * 0.55)}L${f1(cx - k * 0.9)} ${f1(cy - dir * k * 0.55)}Z`;
  if (el === 'wind' || el === 'earth') d += `M${f1(cx - k * 0.62)} ${f1(cy + dir * 0.05 * k)}L${f1(cx + k * 0.62)} ${f1(cy + dir * 0.05 * k)}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

// ------------------------------------------------------------------ emerging elements

function crystal(s, cx, by, w, h, rot, p) {
  const t = by - h, sh = t + w * 0.6, hw = w / 2;
  let o = `<g transform="rotate(${rot} ${cx} ${by})">`;
  o += `<g filter="url(#bev)">${path(`M${cx} ${t}L${cx + hw} ${sh}L${cx + hw} ${by}L${cx} ${by + w * 0.2}L${cx - hw} ${by}L${cx - hw} ${sh}Z`, s.rad(p, 'cr', '30%', '20%'), p.ink, 2)}</g>`;
  // facets: lit left face, shaded right face, top bevels
  o += path(`M${cx} ${t}L${cx - hw} ${sh}L${cx - hw} ${by}L${cx - hw * 0.2} ${by + w * 0.14}L${cx - hw * 0.2} ${sh + 2}Z`, '#fff', 'none', 0, 'opacity=".38"');
  o += path(`M${cx} ${t}L${cx + hw} ${sh}L${cx + hw} ${by}L${cx + hw * 0.35} ${by + w * 0.12}L${cx + hw * 0.35} ${sh + 3}Z`, p.lo, 'none', 0, 'opacity=".4"');
  o += path(`M${cx} ${t}L${cx - hw * 0.2} ${sh + 2}L${cx + hw * 0.35} ${sh + 3}Z`, '#fff', 'none', 0, 'opacity=".55"');
  o += hl(`M${cx - hw * 0.62} ${sh + 2.5}L${cx - hw * 0.62} ${by - 3}`, 1.8, 0.9);
  o += `<path d="M${cx + hw * 0.6} ${sh + h * 0.25}l1.2 2.6l-1.2 2.6l-1.2 -2.6z" fill="#fff" opacity=".85"/>`;
  o += '</g>';
  return o;
}

function rock(s, cx, cy, rx, ry, moss = true) {
  const R = { hi: '#efe4d4', mid: '#b9a387', lo: '#7d6950', ink: '#4a3a28' };
  const M = { hi: '#e6f8b6', mid: '#8cc65a', lo: '#4e8a34', ink: '#2e5a22' };
  let o = `<g filter="url(#bev)">${path(`M${cx - rx} ${cy + ry * 0.1}Q${cx - rx * 1.02} ${cy - ry} ${cx - rx * 0.15} ${cy - ry}Q${cx + rx} ${cy - ry * 1.05} ${cx + rx} ${cy - ry * 0.05}Q${cx + rx} ${cy + ry} ${cx + rx * 0.1} ${cy + ry}Q${cx - rx * 0.95} ${cy + ry * 1.05} ${cx - rx} ${cy + ry * 0.1}Z`, s.rad(R, 'rk'), R.ink, 1.6)}</g>`;
  o += `<path d="M${cx + rx * 0.1} ${cy - ry * 0.2}l${rx * 0.35} ${ry * 0.5}" stroke="${R.lo}" stroke-width=".9" opacity=".7"/>`;
  if (moss) o += path(`M${cx - rx * 0.9} ${cy - ry * 0.25}Q${cx - rx * 0.6} ${cy - ry * 1.2} ${cx + rx * 0.1} ${cy - ry * 1.05}Q${cx + rx * 0.8} ${cy - ry * 1.1} ${cx + rx * 0.85} ${cy - ry * 0.45}Q${cx + rx * 0.5} ${cy - ry * 0.1} ${cx + rx * 0.2} ${cy - ry * 0.45}Q${cx - rx * 0.2} ${cy - ry * 0.05} ${cx - rx * 0.45} ${cy - ry * 0.4}Q${cx - rx * 0.7} ${cy - ry * 0.05} ${cx - rx * 0.9} ${cy - ry * 0.25}Z`, s.rad(M, 'ms'), M.ink, 1.2);
  return o;
}

function leaf(s, x, y, len, rot, pal = { hi: '#e6f8b6', mid: '#8cc65a', lo: '#4e8a34', ink: '#2e5a22' }) {
  return `<g transform="rotate(${rot} ${x} ${y})">${path(`M${x} ${y}Q${x + len * 0.5} ${y - len * 0.42} ${x + len} ${y}Q${x + len * 0.5} ${y + len * 0.42} ${x} ${y}Z`, s.rad(pal, 'lf'), pal.ink, 1.3)}<path d="M${x + 1} ${y}L${x + len - 1.5} ${y}" stroke="${pal.lo}" stroke-width=".8"/></g>`;
}

const emerge = {
  geode(s, lv) {
    const amber = { hi: '#fff4d2', mid: '#efb767', lo: '#b06a2a', ink: '#5a3214' };
    const topaz = { hi: '#fff8e0', mid: '#ffd88a', lo: '#d08a34', ink: '#6a3e14' };
    // glow pooled on the pages
    s.add(`<ellipse cx="50" cy="50" rx="20" ry="7" fill="${s.glowGrad('#ffd27a', 0.9)}"/>`);
    // a chunk of bedrock the crystals grow from
    s.add(rock(s, 50, 50, 15, 5.5, false));
    s.add(crystal(s, 36, 50, 9, 18, -30, topaz));
    s.add(crystal(s, 64, 50, 9, 20, 28, topaz));
    s.add(crystal(s, 42, 50, 11, 27, -12, amber));
    s.add(crystal(s, 58.5, 50, 11, 25, 13, amber));
    s.add(crystal(s, 50, 51, 14, 38, 0, amber));
    s.add(leaf(s, 30, 50, 9, 200));
    s.add(leaf(s, 70, 50, 9, -20));
    // floating mossy stones
    s.add(rock(s, 20, 26, 5.5, 3.8));
    s.add(rock(s, 82, 20, 6.5, 4.2));
    s.add(rock(s, 76, 38, 3.6, 2.6));
    s.add(rock(s, 26, 40, 3, 2.2, false));
    for (const [x, y, r] of [[34, 16, 1.4], [68, 10, 1.1], [16, 44, 1], [88, 34, 1.2]]) s.fx.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#ffe9a8" stroke="#8a5a18" stroke-width=".5"/>`);
  },
  well(s, lv) {
    const W = { hi: '#eefaff', mid: '#5ab8f5', lo: '#1f6fc9', ink: '#12448a' };
    const FOAM = { hi: '#ffffff', mid: '#eef8ff', lo: '#b8dcf5', ink: '#3a6ea8' };
    s.add(`<ellipse cx="50" cy="50" rx="21" ry="7" fill="${s.glowGrad('#8fe0ff', 0.9)}"/>`);
    // a spout of water curling up out of the pages into a breaking wave
    s.add(`<g filter="url(#softbev)">${path('M34 52Q30 40 36 30Q42 18 54 14Q66 11 72 20Q64 18 59 22Q66 24 67 32Q61 28 55 31Q49 34 50 41Q51 47 60 52Z', s.rad(W, 'wv', '30%', '20%'), W.ink, 2)}</g>`);
    // inner current lines
    s.add(hl('M38 46Q35 36 41 28Q46 22 53 19', 1.8, 0.75));
    s.add(hl('M44 48Q42 40 46 34', 1.4, 0.5));
    s.add(path('M52 34Q56 30 62 31', 'none', W.lo, 1.2, 'opacity=".6"'));
    // foam crest
    s.add(`<g filter="url(#bev)">${path('M41 24Q47 15 56 13Q66 11 72 20Q67 19 63 21Q65 15 58 16Q60 21 55 22Q53 17 48 21Q47 25 41 24Z', s.rad(FOAM, 'fm'), FOAM.ink, 1.6)}</g>`);
    // splash ring where it meets the page
    s.add(path('M30 52Q33 47 37 50Q40 45 44 50Q50 47 56 50Q61 46 64 50Q68 47 71 52Q50 56 30 52Z', s.rad(FOAM, 'fm'), FOAM.ink, 1.5));
    const drop = (x, y, r) => `<g filter="url(#bev)">${path(`M${x} ${y - r * 1.9}Q${x + r} ${y - r * 0.45} ${x + r} ${y + r * 0.2}Q${x + r} ${y + r} ${x} ${y + r}Q${x - r} ${y + r} ${x - r} ${y + r * 0.2}Q${x - r} ${y - r * 0.45} ${x} ${y - r * 1.9}Z`, s.rad(W, 'dr'), W.ink, 1.3)}</g><ellipse cx="${f1(x - r * 0.4)}" cy="${f1(y)}" rx="${f1(r * 0.24)}" ry="${f1(r * 0.42)}" fill="#fff" opacity=".85"/>`;
    const bub = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad({ hi: '#ffffff', mid: '#bfe6ff', lo: '#5ab8f5', ink: '#12448a' }, 'bb')}" fill-opacity=".85" stroke="${W.ink}" stroke-width="1.1"/><ellipse cx="${f1(x - r * 0.35)}" cy="${f1(y - r * 0.38)}" rx="${f1(r * 0.34)}" ry="${f1(r * 0.22)}" fill="#fff" transform="rotate(-30 ${f1(x - r * 0.35)} ${f1(y - r * 0.38)})"/>`;
    s.add(drop(24, 32, 3.4)); s.add(drop(80, 30, 3)); s.add(drop(73, 42, 2.2));
    s.add(bub(26, 46, 2.6)); s.add(bub(78, 12, 2.4)); s.add(bub(30, 20, 1.8)); s.add(bub(66, 44, 1.8));
  },
  windmill(s, lv) {
    const WD = { hi: '#f4fffa', mid: '#a6eed4', lo: '#3cb894', ink: '#1e6e5a' };
    s.add(`<ellipse cx="50" cy="50" rx="18" ry="6" fill="${s.glowGrad('#a8ffe0', 0.9)}"/>`);
    // a little tornado of translucent bands, widest at the top
    const bands = [[51, 14, 19, 4.4], [49.5, 22, 16, 3.9], [51, 29.5, 12.6, 3.4], [49.6, 36.5, 9.4, 2.9], [50.6, 42.6, 6.4, 2.4], [50, 47.6, 3.8, 1.9]];
    bands.forEach(([x, y, rx, ry], i) => {
      const d = `M${x - rx} ${y}Q${x - rx} ${y + ry * 1.6} ${x} ${y + ry * 1.6}Q${x + rx} ${y + ry * 1.6} ${x + rx} ${y}Q${x + rx} ${y - ry} ${x} ${y - ry}Q${x - rx} ${y - ry} ${x - rx} ${y}Z`;
      s.add(`<g filter="url(#bev)">${path(d, s.rad(WD, 'tw', '30%', '25%'), WD.ink, 1.8)}</g>`);
      s.add(hl(`M${x - rx * 0.75} ${y + ry * 0.2}Q${x - rx * 0.5} ${y + ry * 1.1} ${x} ${y + ry * 1.15}`, 1.3, 0.8));
      s.add(`<path d="M${f1(x + rx * 0.2)} ${f1(y - ry * 0.35)}Q${f1(x + rx * 0.65)} ${f1(y - ry * 0.2)} ${f1(x + rx * 0.8)} ${f1(y + ry * 0.4)}" fill="none" stroke="${WD.lo}" stroke-width="1" opacity=".55"/>`);
      if (i === 0) s.add(`<ellipse cx="${x}" cy="${y - 0.3}" rx="${rx * 0.72}" ry="${ry * 0.5}" fill="${WD.lo}" opacity=".35"/>`);
    });
    // gust curls
    const gust = (x, y, len, flip = 1) => {
      const d = `M${x} ${y}L${x + flip * len} ${y}Q${x + flip * (len + 7)} ${y} ${x + flip * (len + 7)} ${y - 5.5}Q${x + flip * (len + 7)} ${y - 10} ${x + flip * (len + 2.5)} ${y - 10}Q${x + flip * len} ${y - 10} ${x + flip * len} ${y - 7.5}`;
      return `<path d="${d}" fill="none" stroke="${WD.ink}" stroke-width="4.6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${WD.hi}" stroke-width="2.2" stroke-linecap="round"/>`;
    };
    s.add(gust(8, 34, 9)); s.add(gust(92, 42, 8, -1)); s.add(gust(66, 24, 6));
    // leaves caught in the wind
    s.add(leaf(s, 22, 20, 8, -30));
    s.add(leaf(s, 78, 14, 7, 40));
    s.add(leaf(s, 72, 34, 5.5, 160, { hi: '#fff2b8', mid: '#e6c04a', lo: '#a8801c', ink: '#5a4210' }));
    s.fx.push(`<path d="M14 46q4 -2 8 0M80 50q3 -2 6 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".9"/>`);
  },
  forge(s, lv) {
    s.add(`<ellipse cx="50" cy="50" rx="22" ry="8" fill="${s.glowGrad('#ffb04a', 1)}"/>`);
    const flame = (cx, by, w, h, lean = 0) => {
      const tip = cx + lean;
      const outer = `M${tip} ${by - h}Q${cx + w * 0.12} ${by - h * 0.62} ${cx + w * 0.5} ${by - h * 0.45}Q${cx + w * 0.62} ${by - h * 0.05} ${cx} ${by}Q${cx - w * 0.62} ${by - h * 0.05} ${cx - w * 0.5} ${by - h * 0.45}Q${cx - w * 0.12} ${by - h * 0.62} ${tip} ${by - h}Z`;
      let o = `<g filter="url(#softbev)">${path(outer, s.rad({ hi: '#ffd27a', mid: '#ff7a2c', lo: '#d8321e', ink: '#7a1a10' }, 'fl1', '50%', '70%'), '#7a1a10', 1.8)}</g>`;
      const mid = `M${cx + lean * 0.7} ${by - h * 0.78}Q${cx + w * 0.34} ${by - h * 0.4} ${cx + w * 0.3} ${by - h * 0.2}Q${cx + w * 0.3} ${by - h * 0.02} ${cx} ${by - h * 0.02}Q${cx - w * 0.3} ${by - h * 0.02} ${cx - w * 0.3} ${by - h * 0.2}Q${cx - w * 0.34} ${by - h * 0.4} ${cx + lean * 0.7} ${by - h * 0.78}Z`;
      o += path(mid, s.lin(['#ffb43c', '#ffd25a']), 'none');
      const core = `M${cx + lean * 0.4} ${by - h * 0.52}Q${cx + w * 0.2} ${by - h * 0.22} ${cx + w * 0.15} ${by - h * 0.1}Q${cx} ${by - h * 0.02} ${cx - w * 0.15} ${by - h * 0.1}Q${cx - w * 0.2} ${by - h * 0.22} ${cx + lean * 0.4} ${by - h * 0.52}Z`;
      o += path(core, s.lin(['#fff7c8', '#ffffff']), 'none');
      return o;
    };
    s.add(flame(33, 51, 13, 18, -3));
    s.add(flame(67, 51, 13, 20, 3));
    s.add(flame(50, 52, 30, 44, 1));
    // licks of flame curling off the main fire
    // embers
    for (const [x, y, r, c] of [[24, 28, 1.8, '#ffd27a'], [76, 18, 1.5, '#ffd27a'], [62, 6, 1.3, '#ffb63c'], [30, 12, 1.1, '#ffe9a8'], [84, 34, 1.2, '#ffb63c'], [18, 42, 1, '#ffd27a']]) {
      s.fx.push(`<circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${s.glowGrad(c, 0.7)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#9c3020" stroke-width=".5"/>`);
    }
  },
};

// ------------------------------------------------------------------ the grimoire

function grimoire(s, key, lv) {
  const E = ELEMENTS[key];
  const { cover, glow, el } = E;
  const fit = lv >= 2 ? METAL : IRON;

  // ---- things behind the book
  if (lv >= 10) {
    s.back.push(`<circle cx="50" cy="56" r="49" fill="${s.lin(['#3a2478', '#1e1450'])}" opacity=".78"/>`);
    s.back.push(`<circle cx="50" cy="56" r="49" fill="none" stroke="${glow}" stroke-width="1.8" opacity=".9"/>`);
    s.back.push(`<circle cx="50" cy="56" r="45.5" fill="none" stroke="#fff" stroke-width=".7" stroke-dasharray="1.5 3" opacity=".6"/>`);
    for (let k = 0; k < 26; k++) {
      const a = k * 2.39996, r = 14 + ((k * 37) % 32);
      const x = 50 + Math.cos(a) * r, y = 56 + Math.sin(a) * r;
      const rr = 0.5 + (k % 3) * 0.4;
      if (k % 5 === 0) sparkle(s, +f1(x), +f1(y), rr * 2.4, '#fff', s.back);
      else s.back.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="#fff" opacity="${0.6 + (k % 4) * 0.1}"/>`);
    }
  }
  if (lv >= 5) {
    const mask = id('m');
    s.defs.push(`<radialGradient id="${mask}g"><stop offset=".25" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="${mask}"><circle cx="50" cy="58" r="52" fill="url(#${mask}g)"/></mask>`);
    const rays = [];
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 - 0.05, b = a + 0.14;
      rays.push(`M50 58L${f1(50 + Math.cos(a) * 60)} ${f1(58 + Math.sin(a) * 60)}L${f1(50 + Math.cos(b) * 60)} ${f1(58 + Math.sin(b) * 60)}Z`);
    }
    let r = `<g mask="url(#${mask})"><path d="${rays.join('')}" fill="#ffd84a" opacity=".9"/>`;
    if (lv >= 10) {
      const more = [];
      for (let k = 0; k < 14; k++) {
        const a = ((k + 0.5) / 14) * Math.PI * 2 - 0.05, b = a + 0.09;
        more.push(`M50 58L${f1(50 + Math.cos(a) * 56)} ${f1(58 + Math.sin(a) * 56)}L${f1(50 + Math.cos(b) * 56)} ${f1(58 + Math.sin(b) * 56)}Z`);
      }
      r += `<path d="${more.join('')}" fill="${glow}" opacity=".85"/>`;
    }
    s.back.push(r + '</g>');
  }
  // soft element-coloured halo
  s.back.push(`<circle cx="50" cy="52" r="44" fill="${s.glowGrad(E.halo, 0.75)}"/>`);
  if (lv >= 9) {
    // gilded wings
    for (const fl of [1, -1]) {
      const x = (n) => f1(50 + fl * n);
      const X = (n) => f1(fl > 0 ? n : 100 - n);
      const P2 = (str) => str.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, a, b) => `${X(+a)} ${b}`);
      const wing = P2('M83 68Q83 42 95 25Q101 17 107 15Q106.5 23 101.5 27Q107.5 30 103.5 36Q107.5 40.5 100.5 44.5Q104.5 49.5 96.5 52.5Q98.5 58 90.5 60Q89.5 66 83 68Z');
      s.back.push(`<g filter="url(#bev)">${path(wing, s.rad(METAL, 'wing' + fl, fl > 0 ? '25%' : '75%', '20%'), METAL.ink, 1.6)}</g>`);
      s.back.push(`<path d="${P2('M86 64Q92 40 104 18M86.5 64Q95 44 101 30M87 64Q96 50 101 39M87.5 64Q94 55 98 47M88 64Q92 59 93 55')}" stroke="${METAL.lo}" stroke-width="1" stroke-linecap="round" fill="none"/>`);
      s.back.push(hl(P2('M85 60Q86 42 95 28'), 1.3, 0.85));
    }
  }
  if (lv >= 6) s.back.push(`<path d="M5 62A46 14 -12 0 1 95 43" fill="none" stroke="${glow}" stroke-width="2.2" opacity=".9"/><path d="M5 62A46 14 -12 0 1 95 43" fill="none" stroke="#fff" stroke-width=".8" opacity=".9"/>`);
  if (lv >= 3) {
    // rune ring the book hovers over
    s.back.push(`<ellipse cx="50" cy="95" rx="47" ry="9.5" fill="${glow}" fill-opacity=".28" stroke="${glow}" stroke-width="2.4"/>`);
    s.back.push(`<ellipse cx="50" cy="95" rx="40" ry="7" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.5 3.5" opacity=".95"/>`);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.2;
      const x = 50 + Math.cos(a) * 43.5, y = 95 + Math.sin(a) * 8.2;
      s.back.push(`<path d="M${f1(x - 1.2)} ${f1(y + 1)}L${f1(x)} ${f1(y - 1.2)}L${f1(x + 1.2)} ${f1(y + 1)}" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".95"/>`);
    }
  } else {
    s.back.push(`<ellipse cx="50" cy="96" rx="38" ry="5.5" fill="#3a2350" opacity=".25"/>`);
  }

  // ---- the book
  // bookmark ribbons hanging below the spine
  s.add(`<g filter="url(#bev)">${path('M46.5 88L46.5 101L49.5 98L52.5 101L52.5 88Z', s.rad(cover, 'rb'), cover.ink, 1.8)}</g>`);
  if (lv >= 4) s.add(`<g filter="url(#bev)">${path('M54 87L57.5 99L59.5 95.5L62.5 97.5L59 86Z', s.rad(METAL, 'rb2'), METAL.ink, 1.6)}</g>`);

  // cover: thickness lip then the leather face
  const coverD = 'M50 51Q31 41 6 47L8.5 91Q31 85 50 95Q69 85 91.5 91L94 47Q69 41 50 51Z';
  s.add(path('M50 55Q31 45 6.5 51L9 94Q31 88.5 50 98.5Q69 88.5 91 94L93.5 51Q69 45 50 55Z', cover.ink, cover.ink, 2));
  s.add(`<g filter="url(#bev)"><g filter="url(#leather)">${path(coverD, s.rad(cover, 'cv', '30%', '25%'), cover.ink, 2.4)}</g></g>`);
  // stitching inside the cover edge
  s.add(`<path d="M50 54Q31 44.5 9 50L11.2 88.5Q31 83 50 92.5Q69 83 88.8 88.5L91 50Q69 44.5 50 54" fill="none" stroke="${cover.hi}" stroke-width=".9" stroke-dasharray="2 1.6" opacity=".75"/>`);
  if (lv >= 3) s.add(`<path d="M50 52.6Q31 43 7.6 48.6L10 89.6Q31 84 50 93.8Q69 84 90 89.6L92.4 48.6Q69 43 50 52.6" fill="none" stroke="${METAL.mid}" stroke-width="1.5" opacity=".95"/>`);

  // page block: stacked page edges below the open pages
  s.add(path('M12 86Q32 81 50 90Q68 81 88 86L88 89Q68 84 50 93Q32 84 12 89Z', s.lin([PAPER.mid, PAPER.lo]), PAPER.ink, 1.4));
  for (const y of [0, 1.4]) s.add(`<path d="M13 ${86.6 + y}Q32 ${81.6 + y} 50 ${90.6 + y}Q68 ${81.6 + y} 87 ${86.6 + y}" fill="none" stroke="${PAPER.lo}" stroke-width=".6"/>`);

  // open pages
  const leftD = 'M50 48Q33 38 13 44L15 83Q33 78.5 50 87Z';
  const rightD = 'M50 48Q67 38 87 44L85 83Q67 78.5 50 87Z';
  s.add(`<g filter="url(#paper)">${path(leftD, s.lin([PAPER.hi, PAPER.mid, PAPER.lo], 0, 0, 1, 0), PAPER.ink, 2)}</g>`);
  s.add(`<g filter="url(#paper)">${path(rightD, s.lin([PAPER.lo, PAPER.mid, PAPER.hi], 0, 0, 1, 0), PAPER.ink, 2)}</g>`);
  // page curl highlight + gutter shadow
  s.add(hl('M18 47Q33 42.5 46 49', 1.2, 0.9));
  s.add(hl('M54 49Q67 42.5 82 47', 1.2, 0.7));
  s.add(path('M50 48Q46 46 43 46L44 85Q47 85.5 50 87Z', s.lin([`${PAPER.ink}@0`, `${PAPER.ink}@.35`], 0, 0, 1, 0), 'none'));
  s.add(path('M50 48Q54 46 57 46L56 85Q53 85.5 50 87Z', s.lin([`${PAPER.ink}@.35`, `${PAPER.ink}@0`], 0, 0, 1, 0), 'none'));
  s.add(`<path d="M50 48L50 87" stroke="${PAPER.ink}" stroke-width="1" opacity=".6"/>`);

  // left page: a drawn magic circle with the element's alchemical sign
  const ink = E.script;
  if (lv >= 4) s.add(`<circle cx="31.5" cy="63.5" r="14" fill="${s.glowGrad(glow, 0.95)}"/>`);
  s.add(`<circle cx="31.5" cy="63.5" r="10.5" fill="none" stroke="${ink}" stroke-width="1" opacity=".55"/>`);
  s.add(`<circle cx="31.5" cy="63.5" r="8.6" fill="none" stroke="${ink}" stroke-width=".6" stroke-dasharray="1 1.4" opacity=".55"/>`);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    s.add(`<circle cx="${f1(31.5 + Math.cos(a) * 10.5)}" cy="${f1(63.5 + Math.sin(a) * 10.5)}" r="1.1" fill="${ink}" opacity=".6"/>`);
  }
  s.add(alchemy(el, 31.5, 64, 6.4, lv >= 4 ? cover.mid : cover.lo, 2.2));
  // small caption lines under the circle
  s.add(`<path d="M21 78.5Q27 77.4 33 78.2M24 81Q30 80 37 80.8" fill="none" stroke="${ink}" stroke-width=".8" stroke-linecap="round" opacity=".45"/>`);

  // right page: illuminated capital and lines of script
  const cap = lv >= 4 ? METAL.mid : cover.mid;
  s.add(`<rect x="56.5" y="57.4" width="7" height="7.4" rx="1" fill="${cap}" stroke="${lv >= 4 ? METAL.ink : cover.ink}" stroke-width=".8" transform="rotate(-6 60 61.1)"/>`);
  s.add(`<path d="M58.6 63L60.2 59L61.8 63M59.2 61.6L61.2 61.6" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" transform="rotate(-6 60 61.1)"/>`);
  const lines = [];
  for (let i = 0; i < 7; i++) {
    const y0 = 50 + i * 4.3, x0 = i === 2 || i === 3 ? 65.5 : 56.5, x1 = i === 6 ? 72 : 81 - (i % 3);
    const sag = -2 + i * 0.05;
    // wobbly "handwriting": short dashes along a gently curved line
    lines.push(`M${f1(x0)} ${f1(y0 + (x0 - 56) * -0.12)}Q${f1((x0 + x1) / 2)} ${f1(y0 + sag - 1)} ${f1(x1)} ${f1(y0 - 0.6 - (i % 2) * 0.8)}`);
  }
  const scriptCol = lv >= 4 ? cover.mid : ink;
  if (lv >= 4) s.add(`<path d="${lines.join('')}" fill="none" stroke="${glow}" stroke-width="2.6" stroke-linecap="round" opacity=".55" filter="url(#glows)"/>`);
  s.add(`<path d="${lines.join('')}" fill="none" stroke="${scriptCol}" stroke-width="1.05" stroke-linecap="round" stroke-dasharray="2.6 .9 1.2 .9 3.4 1.1" opacity="${lv >= 4 ? 0.95 : 0.6}"/>`);

  // corner fittings: iron at level 1, gold from level 2, with rivets
  for (const [x, fl] of [[8.5, 1], [91.5, -1]]) {
    const bot = `M${x} 91.5L${x} 79.5L${x + fl * 3} 80.2L${x + fl * 11.5} 88.2L${x + fl * 11.2} 89.8Q${x + fl * 5} 88.6 ${x} 91.5Z`;
    const top = `M${x - fl * 2.4} 47.2L${x - fl * 1.8} 58L${x + fl * 1.2} 57L${x + fl * 9} 46.2L${x + fl * 8.6} 44.8Q${x + fl * 3} 45.4 ${x - fl * 2.4} 47.2Z`;
    if (lv >= 2) {
      s.add(`<g filter="url(#bev)">${path(bot, s.rad(fit, 'ft'), fit.ink, 1.6)}</g>`);
      s.add(`<g filter="url(#bev)">${path(top, s.rad(fit, 'ft'), fit.ink, 1.6)}</g>`);
      s.add(rivet(s, x + fl * 2.6, 87, 1.1, fit));
      s.add(rivet(s, x + fl * 1.2, 50.5, 1, fit));
      s.add(`<path d="M${x + fl * 2} 82.5Q${x + fl * 5} 84 ${x + fl * 8.2} 87.6" fill="none" stroke="${fit.lo}" stroke-width=".7"/>`);
    } else {
      // plain iron clasps
      s.add(`<g filter="url(#bev)">${path(`M${x} 91.5L${x} 84L${x + fl * 6} 88.6Q${x + fl * 3} 89.6 ${x} 91.5Z`, s.rad(fit, 'ft'), fit.ink, 1.4)}</g>`);
      s.add(`<g filter="url(#bev)">${path(`M${x - fl * 2.2} 47.4L${x - fl * 1.9} 53L${x + fl * 4.6} 45.6Q${x + fl * 1} 46 ${x - fl * 2.2} 47.4Z`, s.rad(fit, 'ft'), fit.ink, 1.4)}</g>`);
    }
  }
  if (lv >= 7) for (const [x, y] of [[8, 63], [8.3, 74], [92, 63], [91.7, 74]]) s.add(gem(s, x, y, 1.9, cover));
  if (lv >= 5) for (const x of [13.2, 86.8]) s.add(gem(s, x, 86, 2.2, cover));

  // spine stud: iron, then gold, then a gem
  s.add(`<g filter="url(#bev)"><circle cx="50" cy="91.5" r="${lv >= 3 ? 4.6 : 3.6}" fill="${s.rad(fit, 'st')}" stroke="${fit.ink}" stroke-width="1.4"/></g>`);
  if (lv >= 3) s.add(gem(s, 50, 91.5, 2.4, cover, cover.ink));
  else s.add(`<circle cx="49" cy="90.5" r="1" fill="#fff" opacity=".85"/>`);

  // ---- the element rising from the pages
  emerge[key](s, lv);

  // ---- flourishes in front
  if (lv >= 7) {
    for (const [x, y, t] of [[12, 32, -18], [88, 28, 16]]) {
      s.fx.push(`<g transform="rotate(${t} ${x} ${y})"><circle cx="${x}" cy="${y}" r="9" fill="${s.glowGrad(glow, 0.6)}"/>${path(`M${x} ${y - 8.5}L${x + 3.8} ${y}L${x} ${y + 8.5}L${x - 3.8} ${y}Z`, s.lin(['#ffffff', glow, cover.mid]), cover.ink, 1.3)}${path(`M${x} ${y - 8.5}L${x - 3.8} ${y}L${x} ${y}Z`, '#fff', 'none', 0, 'opacity=".65"')}</g>`);
    }
  }
  if (lv >= 6) {
    s.fx.push(`<path d="M95 43A46 14 -12 0 1 5 62" fill="none" stroke="${glow}" stroke-width="2.6" opacity=".95"/><path d="M95 43A46 14 -12 0 1 5 62" fill="none" stroke="#fff" stroke-width="1" opacity=".95"/>`);
    for (const [x, y, r] of [[17, 67, 3], [61, 72.5, 2.5], [89, 52, 2.1]]) {
      s.fx.push(`<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${s.glowGrad(glow, 0.8)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad({ hi: '#ffffff', mid: glow, lo: cover.mid, ink: cover.ink }, 'mote')}" stroke="#fff" stroke-width=".9"/>`);
    }
  }
  if (lv >= 8) {
    s.fx.push(`<g filter="url(#bev)">${path('M41 15L42.4 6.5L46.6 10.8L50 3.5L53.4 10.8L57.6 6.5L59 15Q50 17 41 15Z', s.rad(METAL, 'crown'), METAL.ink, 1.5)}</g>`);
    s.fx.push(`<path d="M41.6 13.2Q50 15 58.4 13.2" fill="none" stroke="${METAL.lo}" stroke-width=".8"/>`);
    s.fx.push(gem(s, 50, 12, 1.7, cover));
    s.fx.push(`<circle cx="42.4" cy="6.5" r="1" fill="${glow}" stroke="${METAL.ink}" stroke-width=".5"/><circle cx="57.6" cy="6.5" r="1" fill="${glow}" stroke="${METAL.ink}" stroke-width=".5"/><circle cx="50" cy="3.5" r="1.2" fill="#fff" stroke="${METAL.ink}" stroke-width=".5"/>`);
  }
  if (lv >= 4) {
    for (const [x, y, r] of [[11, 22, 3.6], [90, 12, 3], [84, 60, 2.6]]) sparkle(s, x, y, r, glow);
    s.fx.push(`<g opacity=".95" fill="none" stroke="${glow}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" filter="url(#glows)"><path d="M14 10l3.5 -5l3.5 5M15.5 7.6h4M80 66l2.6 -4.4l2.6 4.4l-2.6 2.6z"/></g>`);
    s.fx.push(`<g opacity="1" fill="none" stroke="#fff" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 10l3.5 -5l3.5 5M15.5 7.6h4M80 66l2.6 -4.4l2.6 4.4l-2.6 2.6z"/></g>`);
  }
  if (lv >= 5) for (const [x, y, r] of [[26, 4, 3.4], [72, 2, 3], [94, 70, 2.6]]) sparkle(s, x, y, r, '#fff6b0');
}

// ------------------------------------------------------------------ document

/** Full SVG document for generator `key` at level `lv`, `size` px square. */
export function genSvg(key, lv, size = 1024) {
  uid = 0;
  const s = new Svg();
  grimoire(s, key, lv);
  // One frame for every level so the book never jumps or shrinks as it levels up.
  const vb = '-8 -7 116 116';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${vb}"><defs>${filters()}${s.defs.join('')}</defs>`
    + `<g>${s.back.join('')}</g>`
    + `<g filter="url(#sticker)">${s.body.join('')}</g>`
    + `<g>${s.fx.join('')}</g></svg>`;
}

export const GENS = Object.keys(ELEMENTS);
export const keyFor = (g, lv) => (lv > 1 ? `gen-${g}-${lv}` : `gen-${g}`);
