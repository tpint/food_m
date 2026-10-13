// Painted merge items for Sunny Spoon (food_m): bakery, drinks, desserts, grill (1-7), coins (1-4), energy (1-3).
import { f1, METAL, IRON, path, hl, sparkle, gem, rivet } from './paint.mjs';
import { B, SB, G, circ, flame, bubble, WOOD, STONE } from './items.mjs';
import { coin, coinSide, GOLD } from './extras.mjs';

const WHEAT = { hi: '#fff6c0', mid: '#f2c94c', lo: '#c48a1e', ink: '#5a3a0a' };
const BREAD = { hi: '#ffe6b0', mid: '#e3a352', lo: '#a8622a', ink: '#4e2810' };
const CRUST = { hi: '#f8c880', mid: '#c87a34', lo: '#8a4a1a', ink: '#4a2408' };
const SACK = { hi: '#fdf6e6', mid: '#e2cfa4', lo: '#ad9462', ink: '#4e3c1e' };
const DOUGH = { hi: '#fffef8', mid: '#f7e8cc', lo: '#dcc196', ink: '#6a4a24' };
const WICKER = { hi: '#f4cc94', mid: '#c48a4a', lo: '#8a5626', ink: '#40240a' };
const KRAFT = { hi: '#faeacc', mid: '#dcbc8a', lo: '#a88454', ink: '#4e3816' };
const LEMON = { hi: '#fffbd0', mid: '#ffe066', lo: '#e8b020', ink: '#7a5408' };
const CUP = { hi: '#ffffff', mid: '#f2f4fa', lo: '#c8cfe0', ink: '#3a4468' };
const GLASSP = { hi: '#ffffff', mid: '#eef8ff', lo: '#c4e0f4', ink: '#1e4a7a' };
const MUG = { hi: '#ffb0a0', mid: '#e8403a', lo: '#a01a1a', ink: '#4e0808' };
const PINK = { hi: '#ffe6f2', mid: '#ff8ec4', lo: '#e0508e', ink: '#7a1a4a' };
const COOKIE = { hi: '#ffe8bc', mid: '#e0a85e', lo: '#a86c30', ink: '#4e2c0e' };
const CHOC = { hi: '#c8946a', mid: '#7a4a2a', lo: '#4a2814', ink: '#24100a' };
const VANILLA = { hi: '#fffef8', mid: '#fff3d0', lo: '#e8d09a', ink: '#7a5a24' };
const BERRY = { hi: '#ffb4b4', mid: '#ee3a4a', lo: '#a81a28', ink: '#4e0610' };
const MINTICE = { hi: '#eafff6', mid: '#9ce8c8', lo: '#3cb894', ink: '#145a48' };
const EGG = { hi: '#fffffa', mid: '#fbf0dc', lo: '#dcc6a0', ink: '#6a5034' };
const YOLK = { hi: '#fff8c0', mid: '#ffc93c', lo: '#e8901c', ink: '#7a4408' };
const MEAT = { hi: '#ffb88a', mid: '#c8643a', lo: '#8a3418', ink: '#3e1606' };
const PAN = { hi: '#9aa0b8', mid: '#4a5068', lo: '#2a2e40', ink: '#10121a' };
const LETTUCE = { hi: '#e4ffb8', mid: '#7ed04a', lo: '#3c8a2a', ink: '#1e4a14' };
const TOMATO = { hi: '#ffb4a4', mid: '#ef4a3a', lo: '#a82418', ink: '#4e0c06' };
const CHEESE = { hi: '#fff6c0', mid: '#ffd23c', lo: '#e8a01c', ink: '#7a4a08' };
const ROAST = { hi: '#ffd8a0', mid: '#e08a3c', lo: '#a4521c', ink: '#4a2008' };
const ENERGY = { hi: '#f2e6ff', mid: '#a77cf0', lo: '#6a3fb8', ink: '#2e1468' };
const PLATE = { hi: '#ffffff', mid: '#f6f6fa', lo: '#cfd0e0', ink: '#4a4862' };

const steam = (s, x, y, h = 16) => s.fx.push(`<path d="M${x} ${y}q-5 ${-h / 4} 0 ${-h / 2}t0 ${-h / 2}" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".92"/><path d="M${x} ${y}q-5 ${-h / 4} 0 ${-h / 2}t0 ${-h / 2}" fill="none" stroke="#b8c8dc" stroke-width="1" stroke-linecap="round" opacity=".6" transform="translate(1.2 .6)"/>`);
const SPR = ['#ff5a8a', '#4ac8ff', '#ffe066', '#7ee08e', '#b98cff'];
const sprinkles = (pts) => pts.map(([x, y, a], i) => `<rect x="${x - 2.8}" y="${y - 1.1}" width="5.6" height="2.2" rx="1.1" fill="${SPR[i % SPR.length]}" stroke="rgba(60,20,60,.45)" stroke-width=".4" transform="rotate(${a} ${x} ${y})"/>`).join('');
const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;

function wheat(s, x, by, h, rot) {
  let o = `<g transform="rotate(${rot} ${x} ${by})"><path d="M${x} ${by}L${x} ${by - h}" stroke="${WHEAT.ink}" stroke-width="3.4" stroke-linecap="round"/><path d="M${x} ${by}L${x} ${by - h}" stroke="${WHEAT.mid}" stroke-width="1.4" stroke-linecap="round"/>`;
  for (let i = 0; i < 5; i++) {
    const y = by - h * 0.45 - i * h * 0.11;
    for (const f of [-1, 1]) o += `<g transform="rotate(${f * 28} ${x + f * 4} ${y})">${B(s, ell(x + f * 4, y, 3.6, 6), WHEAT, 1.3, 'grain')}<path d="M${x + f * 4 - 1} ${y - 3}Q${x + f * 4 - 1.6} ${y} ${x + f * 4 - 0.6} ${y + 3}" fill="none" stroke="#fff" stroke-width=".8" opacity=".8"/></g>`;
    o += `<path d="M${x - 3} ${y - 4}l-3 -6M${x + 3} ${y - 4}l3 -6" stroke="${WHEAT.lo}" stroke-width=".8"/>`;
  }
  o += B(s, ell(x, by - h * 0.97, 3.2, 5.5), WHEAT, 1.3, 'grain');
  return o + '</g>';
}
function roll(s, cx, cy, r, key = 'roll') {
  let o = G(SB(s, `M${cx - r} ${cy + r * 0.5}Q${cx - r * 1.05} ${cy - r * 0.8} ${cx} ${cy - r * 0.85}Q${cx + r * 1.05} ${cy - r * 0.8} ${cx + r} ${cy + r * 0.5}Q${cx} ${cy + r * 0.85} ${cx - r} ${cy + r * 0.5}Z`, BREAD, Math.max(1.4, r * 0.08), key, '35%', '25%'), 'grain');
  o += `<path d="M${cx - r * 0.5} ${cy - r * 0.3}Q${cx - r * 0.25} ${cy - r * 0.55} ${cx - r * 0.02} ${cy - r * 0.42}M${cx + r * 0.05} ${cy - r * 0.15}Q${cx + r * 0.3} ${cy - r * 0.38} ${cx + r * 0.58} ${cy - r * 0.2}" fill="none" stroke="${BREAD.ink}" stroke-width="${f1(r * 0.1)}" stroke-linecap="round" opacity=".7"/>`;
  o += `<path d="M${cx - r * 0.48} ${cy - r * 0.36}Q${cx - r * 0.24} ${cy - r * 0.6} ${cx} ${cy - r * 0.48}" fill="none" stroke="#fff2c8" stroke-width="${f1(r * 0.05)}" stroke-linecap="round"/>`;
  o += hl(`M${cx - r * 0.72} ${cy + r * 0.05}Q${cx - r * 0.62} ${cy - r * 0.5} ${cx - r * 0.3} ${cy - r * 0.64}`, Math.max(1.2, r * 0.08), 0.6);
  return o;
}
function croissant(s, cx, cy, k) {
  const segs = [[-26, 14, 9, 13, -55], [26, 14, 9, 13, 55], [-14, 4, 12, 16, -28], [14, 4, 12, 16, 28], [0, 0, 14, 19, 0]];
  let o = '';
  for (const [dx, dy, rx, ry, a] of segs) {
    const x = cx + dx * k, y = cy + dy * k;
    o += `<g transform="rotate(${a} ${x} ${y})">${G(SB(s, ell(x, y, rx * k, ry * k), CRUST, 1.8, 'cro', '40%', '25%'), 'grain')}<path d="M${f1(x - rx * k * 0.55)} ${f1(y - ry * k * 0.45)}Q${x} ${f1(y - ry * k * 0.78)} ${f1(x + rx * k * 0.55)} ${f1(y - ry * k * 0.45)}" fill="none" stroke="#ffe0a8" stroke-width="${f1(1.8 * k)}" opacity=".75"/><path d="M${f1(x - rx * k * 0.7)} ${f1(y + ry * k * 0.2)}Q${x} ${f1(y + ry * k * 0.5)} ${f1(x + rx * k * 0.7)} ${f1(y + ry * k * 0.2)}" fill="none" stroke="${CRUST.lo}" stroke-width="${f1(1.2 * k)}" opacity=".6"/></g>`;
  }
  return o;
}
function baguette(s, cx, cy, len, rot) {
  const h = len * 0.2;
  let o = `<g transform="rotate(${rot} ${cx} ${cy})">` + G(SB(s, `M${cx - len / 2} ${cy}Q${cx - len / 2} ${cy - h / 2} ${cx - len / 2 + h} ${cy - h / 2}L${cx + len / 2 - h} ${cy - h / 2}Q${cx + len / 2} ${cy - h / 2} ${cx + len / 2} ${cy}Q${cx + len / 2} ${cy + h / 2} ${cx + len / 2 - h} ${cy + h / 2}L${cx - len / 2 + h} ${cy + h / 2}Q${cx - len / 2} ${cy + h / 2} ${cx - len / 2} ${cy}Z`, CRUST, 2, 'bag', '40%', '20%'), 'grain');
  for (let i = 0; i < 4; i++) {
    const x = cx - len * 0.3 + i * len * 0.2;
    o += `<path d="M${f1(x - h * 0.3)} ${f1(cy - h * 0.28)}L${f1(x + h * 0.3)} ${f1(cy + h * 0.1)}" stroke="${CRUST.ink}" stroke-width="2.4" stroke-linecap="round" opacity=".55"/><path d="M${f1(x - h * 0.2)} ${f1(cy - h * 0.32)}L${f1(x + h * 0.32)} ${f1(cy)}" stroke="#ffe4b0" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  return o + hl(`M${cx - len * 0.4} ${cy - h * 0.3}L${cx + len * 0.35} ${cy - h * 0.3}`, 1.2, 0.4) + '</g>';
}
function lemon(s, x, y, r) {
  let o = `<circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad(LEMON, 'lem')}" stroke="${LEMON.ink}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.76)}" fill="#fff6b0"/>`;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; o += `<path d="M${x} ${y}L${f1(x + Math.cos(a) * r * 0.72)} ${f1(y + Math.sin(a) * r * 0.72)}" stroke="${LEMON.lo}" stroke-width="1.1"/>`; }
  return o + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.12)}" fill="${LEMON.lo}"/>`;
}
function straw(x1, y1, x2, y2, color = '#ff5a8a') {
  return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#5a1a3a" stroke-width="7.4" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${color}" stroke-width="4.4" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#fff" stroke-width="4.4" stroke-dasharray="3 5"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="#fff" stroke-width="1" opacity=".6" transform="translate(-1 0)"/>`;
}
function cream(s, cx, cy, w, key = 'cream') {
  const k = w / 40;
  return SB(s, `M${cx - 20 * k} ${cy}Q${cx - 24 * k} ${cy - 10 * k} ${cx - 12 * k} ${cy - 11 * k}Q${cx - 12 * k} ${cy - 22 * k} ${cx} ${cy - 20 * k}Q${cx + 4 * k} ${cy - 30 * k} ${cx + 8 * k} ${cy - 20 * k}Q${cx + 20 * k} ${cy - 22 * k} ${cx + 13 * k} ${cy - 11 * k}Q${cx + 24 * k} ${cy - 10 * k} ${cx + 20 * k} ${cy}Z`, CUP, 2, key, '35%', '25%')
    + `<path d="M${cx - 12 * k} ${cy - 11 * k}Q${cx - 4 * k} ${cy - 8 * k} ${cx + 4 * k} ${cy - 12 * k}M${cx - 2 * k} ${cy - 20 * k}Q${cx + 4 * k} ${cy - 17 * k} ${cx + 8 * k} ${cy - 20 * k}" fill="none" stroke="${CUP.lo}" stroke-width="1.1"/>`;
}
function cherry(s, x, y, r = 5) {
  return `<path d="M${x} ${y - r}Q${x + 2} ${y - r * 2.6} ${x + r * 1.4} ${y - r * 3}" fill="none" stroke="#2e5a1a" stroke-width="2.6" stroke-linecap="round"/><path d="M${x} ${y - r}Q${x + 2} ${y - r * 2.6} ${x + r * 1.4} ${y - r * 3}" fill="none" stroke="#6aa83a" stroke-width="1" stroke-linecap="round"/>` + B(s, circ(x, y, r), BERRY, 1.6, 'cherry') + `<circle cx="${f1(x - r * 0.35)}" cy="${f1(y - r * 0.35)}" r="${f1(r * 0.3)}" fill="#fff" opacity=".9"/>`;
}
function strawberry(s, x, y, k) {
  let o = B(s, `M${x} ${y + 9 * k}Q${x - 9 * k} ${y + 2 * k} ${x - 7 * k} ${y - 4 * k}Q${x} ${y - 7 * k} ${x + 7 * k} ${y - 4 * k}Q${x + 9 * k} ${y + 2 * k} ${x} ${y + 9 * k}Z`, BERRY, 1.4, 'sb');
  for (const [dx, dy] of [[-3, -1], [2, -2], [0, 3], [-4, 3], [4, 2]]) o += `<ellipse cx="${f1(x + dx * k)}" cy="${f1(y + dy * k)}" rx="${f1(0.7 * k)}" ry="${f1(1 * k)}" fill="#fff2a0"/>`;
  o += path(`M${x - 6 * k} ${y - 4.5 * k}L${x - 2 * k} ${y - 4 * k}L${x} ${y - 8 * k}L${x + 2 * k} ${y - 4 * k}L${x + 6 * k} ${y - 4.5 * k}L${x + 2 * k} ${y - 2 * k}L${x} ${y - 3 * k}L${x - 2 * k} ${y - 2 * k}Z`, '#5ac84a', '#1e4a14', 1);
  return o;
}
function scoop(s, x, y, r, p, key) {
  return SB(s, `M${x - r} ${y + r * 0.3}Q${x - r} ${y - r} ${x} ${y - r}Q${x + r} ${y - r} ${x + r} ${y + r * 0.3}Q${x + r * 0.6} ${y + r * 0.1} ${x + r * 0.3} ${y + r * 0.45}Q${x} ${y + r * 0.15} ${x - r * 0.3} ${y + r * 0.45}Q${x - r * 0.6} ${y + r * 0.1} ${x - r} ${y + r * 0.3}Z`, p, 1.8, key, '35%', '25%')
    + `<ellipse cx="${f1(x - r * 0.4)}" cy="${f1(y - r * 0.45)}" rx="${f1(r * 0.28)}" ry="${f1(r * 0.16)}" fill="#fff" opacity=".7" transform="rotate(-30 ${f1(x - r * 0.4)} ${f1(y - r * 0.45)})"/>`;
}
function sausage(s, cx, cy, len, rot, key = 'saus') {
  const h = len * 0.32;
  return `<g transform="rotate(${rot} ${cx} ${cy})">${SB(s, `M${cx - len / 2 + h / 2} ${cy - h / 2}L${cx + len / 2 - h / 2} ${cy - h / 2}A${h / 2} ${h / 2} 0 0 1 ${cx + len / 2 - h / 2} ${cy + h / 2}L${cx - len / 2 + h / 2} ${cy + h / 2}A${h / 2} ${h / 2} 0 0 1 ${cx - len / 2 + h / 2} ${cy - h / 2}Z`, MEAT, 2, key, '40%', '20%')}`
    + `<path d="M${cx - len * 0.25} ${cy - h * 0.45}L${cx - len * 0.15} ${cy + h * 0.45}M${cx} ${cy - h * 0.45}L${cx + len * 0.1} ${cy + h * 0.45}M${cx + len * 0.25} ${cy - h * 0.45}L${cx + len * 0.35} ${cy + h * 0.45}" stroke="${MEAT.ink}" stroke-width="${f1(h * 0.14)}" opacity=".65"/>`
    + hl(`M${cx - len * 0.36} ${cy - h * 0.22}L${cx + len * 0.32} ${cy - h * 0.22}`, Math.max(1, h * 0.1), 0.55) + '</g>';
}
function checkCloth(s, d, clip) {
  s.defs.push(`<pattern id="chk${clip}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#fff"/><rect width="3" height="3" fill="#e8403a" opacity=".8"/><rect x="3" y="3" width="3" height="3" fill="#e8403a" opacity=".8"/></pattern>`);
  return B(s, d, { hi: '#fff', mid: '#fff', lo: '#ddd', ink: '#6a1a1a' }, 1.6, 'cl' + clip).replace(/fill="url\(#[^)]+\)"/, `fill="url(#chk${clip})"`);
}
const glassD = (top, bottom, wTop, wBot) => `M${50 - wTop / 2} ${top}L${50 + wTop / 2} ${top}L${50 + wBot / 2} ${bottom}L${50 - wBot / 2} ${bottom}Z`;
function tumbler(s, id, top, bottom, wTop, wBot, level, liquid) {
  const d = glassD(top, bottom, wTop, wBot);
  const t = (y) => wTop + (wBot - wTop) * ((y - top) / (bottom - top)), lw = t(level);
  s.defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  let o = path(d, s.rad(GLASSP, 'tg', '30%', '30%'), GLASSP.ink, 2.4, 'fill-opacity=".72"');
  o += `<g clip-path="url(#${id})"><path d="M${50 - lw / 2 - 2} ${level}Q50 ${level - 2} ${50 + lw / 2 + 2} ${level}L${50 + wBot} ${bottom + 2}L${50 - wBot} ${bottom + 2}Z" fill="${liquid}"/><ellipse cx="50" cy="${level}" rx="${f1(lw / 2 - 1)}" ry="2.4" fill="#fff" opacity=".45"/></g>`;
  return o;
}
const glassFront = (top, bottom, wTop, wBot) => `<path d="${glassD(top, bottom, wTop, wBot)}" fill="none" stroke="${GLASSP.ink}" stroke-width="2.4" stroke-linejoin="round"/>` + hl(`M${50 - wTop / 2 + 5} ${top + 6}L${50 - wBot / 2 + 5} ${bottom - 6}`, 3, 0.85) + hl(`M${50 - wTop / 2 + 9.5} ${top + 6}L${50 - wTop / 2 + 9} ${top + 16}`, 1.4, 0.7);

// ------------------------------------------------------------------ bakery
const bakery = [
  (s) => {
    s.add(wheat(s, 50, 88, 62, -20)); s.add(wheat(s, 50, 88, 62, 20)); s.add(wheat(s, 50, 88, 70, 0));
    s.add(B(s, 'M43 71Q50 75 57 71L57 79Q50 83 43 79Z', { hi: '#c8ffd0', mid: '#5ac86a', lo: '#2e8a3e', ink: '#164a1e' }, 1.6, 'rib'));
    s.add(path('M57 75Q64 76 66 84L62 82L60 86Q58 79 57 77Z', '#5ac86a', '#164a1e', 1.2));
    return { shadow: 1 };
  },
  (s) => {
    s.add(G(SB(s, 'M25 88Q19 60 29 40L35 32Q50 28 65 32L71 40Q81 60 75 88Q50 93 25 88Z', SACK, 2.4, 'sack', '35%', '25%'), 'grain'));
    s.add(`<path d="M30 46Q34 64 31 80M70 46Q66 64 69 80" fill="none" stroke="${SACK.lo}" stroke-width="1.4" opacity=".7"/>`);
    s.add(G(SB(s, 'M35 32Q29 18 40 15Q50 21 60 15Q71 18 65 32Z', SACK, 2.2, 'sackt'), 'grain'));
    s.add(path('M34 32Q50 38 66 32', 'none', '#5a1a10', 5.4) + path('M34 32Q50 38 66 32', 'none', '#d0503a', 2.8));
    s.add(B(s, circ(50, 62, 13.5), { hi: '#ffffff', mid: '#fff8e8', lo: '#e8dcc0', ink: SACK.ink }, 1.8, 'label'));
    s.add(`<circle cx="50" cy="62" r="11" fill="none" stroke="#d0503a" stroke-width="1" stroke-dasharray="2 1.4"/>`);
    s.add(wheat(s, 50, 72, 18, 0));
    s.add(hl('M31 50Q27 66 31 80', 2.6, 0.6));
    for (const [x, y, r] of [[43, 11, 3], [53, 8, 2.4], [60, 12, 1.8], [36, 14, 1.6]]) s.fx.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#d8ccb0" stroke-width=".6"/>`);
    return { shadow: 1 };
  },
  (s) => {
    s.add(G(B(s, 'M8 82L92 82L88 92L12 92Z', WOOD, 2.2, 'board'), 'woodgrain'));
    s.add(SB(s, 'M19 80Q15 57 34 51Q50 41 66 51Q85 57 81 80Q50 88 19 80Z', DOUGH, 2.4, 'dough', '35%', '25%'));
    s.add(`<path d="M30 70Q40 74 52 70" fill="none" stroke="${DOUGH.lo}" stroke-width="1.2"/>`);
    s.add(hl('M27 66Q33 56 45 53', 3, 0.85));
    for (const [x, y, r] of [[62, 62, 1.6], [70, 70, 1.2], [30, 74, 1.4], [22, 87, 1.6], [79, 87, 1.3], [48, 60, 1]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>`);
    s.add(`<g transform="rotate(-12 50 46)">${G(B(s, 'M27 41.5L73 41.5L73 50.5L27 50.5Z', WOOD, 2, 'pin', '30%', '10%'), 'woodgrain')}${G(B(s, 'M13 43.5L27 43.5L27 48.5L13 48.5Z', WOOD, 1.6, 'pinh'), 'woodgrain')}${G(B(s, 'M73 43.5L87 43.5L87 48.5L73 48.5Z', WOOD, 1.6, 'pinh'), 'woodgrain')}${hl('M30 43.5L70 43.5', 1.2, 0.7)}</g>`);
    return { shadow: 1 };
  },
  (s) => {
    s.add(roll(s, 50, 62, 30));
    for (const [x, y, a] of [[40, 44, 0], [54, 40, 30], [62, 48, -20], [46, 52, 0], [33, 54, 20], [58, 56, 60]]) s.add(`<ellipse cx="${x}" cy="${y}" rx="2.3" ry="1.4" fill="#fffaec" stroke="#a8622a" stroke-width=".7" transform="rotate(${a} ${x} ${y})"/>`);
    return { shadow: 1 };
  },
  (s) => { s.add(croissant(s, 50, 58, 1.35)); sparkle(s, 81, 30, 4.6, '#fff6c4'); return { shadow: 1 }; },
  (s) => {
    s.add(baguette(s, 50, 56, 84, -40)); s.add(baguette(s, 54, 62, 80, -62));
    s.add(G(SB(s, 'M29 92L29 63L71 63L71 92Z', KRAFT, 2.2, 'paperbag', '30%', '20%'), 'paper'));
    s.add(path('M29 63L33 67L37 63L41 67L45 63L49 67L53 63L57 67L61 63L65 67L71 63', 'none', KRAFT.ink, 1.4));
    s.add(`<path d="M29 71L71 71" stroke="#c0503a" stroke-width="4"/>`);
    s.add(B(s, circ(50, 81, 5.4), { hi: '#ffffff', mid: '#fff8e8', lo: '#e8dcc0', ink: KRAFT.ink }, 1.4, 'bl'));
    s.add(wheat(s, 50, 85, 7, 0));
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="50" r="42" fill="${s.glowGrad('#ffe2a0', 0.7)}"/>`);
    s.add(baguette(s, 36, 34, 60, -62)); s.add(croissant(s, 64, 44, 0.75)); s.add(roll(s, 44, 50, 16, 'roll2'));
    s.add(G(SB(s, 'M10 56L90 56L80 92L20 92Z', WICKER, 2.4, 'bask', '35%', '20%'), 'woodgrain'));
    s.defs.push('<clipPath id="baskc"><path d="M10 56L90 56L80 92L20 92Z"/></clipPath>');
    const weave = [];
    for (let i = 0; i < 4; i++) weave.push(`M${14 + i * 2} ${64 + i * 8}L${86 - i * 2} ${64 + i * 8}`);
    s.add(`<g clip-path="url(#baskc)"><path d="${weave.join('')}" stroke="${WICKER.ink}" stroke-width="1.6" opacity=".6"/>`
      + Array.from({ length: 8 }, (_, i) => { const x = 22 + i * 8; return `<path d="M${x} 58L${f1(x + (x - 50) * 0.08)} 92" stroke="${WICKER.lo}" stroke-width="1.8" opacity=".75"/>`; }).join('') + '</g>');
    s.add(G(B(s, 'M8 53L92 53L90 62L10 62Z', WICKER, 2, 'rim'), 'woodgrain'));
    s.add(`<path d="M10 57.5L90 57.5" stroke="${WICKER.lo}" stroke-width="1" stroke-dasharray="3 2"/>`);
    s.add(checkCloth(s, 'M13 55L41 55L33 77L19 71Z', 'b7'));
    sparkle(s, 85, 22, 5, '#fff6c4'); sparkle(s, 14, 30, 3.6, '#fff6c4');
    return { shadow: 1 };
  },
];

// ------------------------------------------------------------------ drinks
const drinks = [
  (s) => {
    s.add(tumbler(s, 'd1', 24, 90, 40, 32, 40, s.lin(['#bfe6ff', '#6abef6'])));
    s.add(`<g clip-path="url(#d1)"><g filter="url(#bev)"><rect x="40" y="38" width="13" height="13" rx="2.6" fill="#f2fbff" fill-opacity=".9" stroke="#4a8ac8" stroke-width="1.2" transform="rotate(14 46 44)"/><rect x="52" y="48" width="11" height="11" rx="2.2" fill="#f2fbff" fill-opacity=".85" stroke="#4a8ac8" stroke-width="1.1" transform="rotate(-10 57 53)"/></g>${bubble(s, 42, 72, 1.8)}${bubble(s, 58, 78, 1.4)}${bubble(s, 50, 64, 1.2)}</g>`);
    s.add(glassFront(24, 90, 40, 32));
    return { shadow: 1 };
  },
  (s) => {
    s.add(straw(64, 4, 54, 50));
    s.add(tumbler(s, 'd2', 22, 90, 40, 32, 34, s.lin(['#fff6a0', '#ffd23c'])));
    s.add(`<g clip-path="url(#d2)">${bubble(s, 42, 66, 1.8)}${bubble(s, 56, 76, 1.5)}${bubble(s, 48, 52, 1.3)}<rect x="38" y="40" width="11" height="11" rx="2.2" fill="#fffbe8" fill-opacity=".7" stroke="#c8a020" stroke-width="1" transform="rotate(12 43 45)"/></g>`);
    s.add(glassFront(22, 90, 40, 32));
    s.add(lemon(s, 30, 24, 9.5));
    s.add(leafSm(s, 70, 22));
    return { shadow: 1 };
  },
  (s) => {
    s.add(B(s, 'M12 80Q12 72 50 72Q88 72 88 80Q88 90 50 90Q12 90 12 80Z', CUP, 2.2, 'saucer', '40%', '30%'));
    s.add(`<ellipse cx="50" cy="80" rx="22" ry="4" fill="none" stroke="${CUP.lo}" stroke-width="1.2"/>`);
    s.add(path('M76 46Q92 44 90 58Q88 70 72 70', 'none', CUP.ink, 7.4) + path('M76 46Q92 44 90 58Q88 70 72 70', 'none', CUP.mid, 3.6));
    s.add(SB(s, 'M20 40L80 40Q80 82 50 82Q20 82 20 40Z', CUP, 2.4, 'cup', '30%', '25%'));
    s.add(`<path d="M24 58Q50 64 76 58" fill="none" stroke="#5aaaf0" stroke-width="2" opacity=".7"/>`);
    s.add(`<ellipse cx="50" cy="41" rx="28" ry="6" fill="${s.rad({ hi: '#c88a5a', mid: '#7a4626', lo: '#4a2410', ink: '#2a1206' }, 'coffee')}" stroke="${CUP.ink}" stroke-width="1.6"/>`);
    s.add(`<path d="M50 38.5Q44 40 47 42Q50 44 53 42Q56 40 50 38.5ZM50 42L50 44.5" fill="#f8e0c0" stroke="#f8e0c0" stroke-width="1.2"/>`);
    s.add(hl('M26 48Q28 66 38 76', 2.6, 0.75));
    steam(s, 42, 30, 18); steam(s, 56, 28, 20);
    return { shadow: 1 };
  },
  (s) => {
    s.add(path('M74 42Q94 40 92 58Q90 74 72 72', 'none', MUG.ink, 9) + path('M74 42Q94 40 92 58Q90 74 72 72', 'none', MUG.mid, 4.6));
    s.add(SB(s, 'M17 32L77 32L74 84Q74 90 66 90L28 90Q20 90 20 84Z', MUG, 2.4, 'mug', '30%', '25%'));
    s.add(`<ellipse cx="47" cy="33" rx="29" ry="6" fill="${s.rad({ hi: '#c88a5a', mid: '#7a4626', lo: '#4a2410', ink: '#2a1206' }, 'cocoa')}" stroke="${MUG.ink}" stroke-width="1.6"/>`);
    for (const [x, y, a] of [[36, 30, -10], [50, 28, 15], [60, 32, -25], [44, 34, 30]]) s.add(`<g transform="rotate(${a} ${x} ${y})">${B(s, `M${x - 4.4} ${y - 3.6}L${x + 4.4} ${y - 3.6}L${x + 4.4} ${y + 3.6}L${x - 4.4} ${y + 3.6}Z`, { hi: '#ffffff', mid: '#fff6fa', lo: '#e8d0dc', ink: '#8a5a6a' }, 1.1, 'mm')}</g>`);
    s.add(`<path d="M27 52L67 52" stroke="#fff" stroke-width="1" stroke-dasharray="5 4" opacity=".8"/>${[30, 40, 50, 60].map((x) => `<circle cx="${x + 4}" cy="62" r="2.4" fill="#fff"/>`).join('')}<path d="M27 72L67 72" stroke="#fff" stroke-width="1" stroke-dasharray="5 4" opacity=".8"/>`);
    s.add(hl('M23 40L25 82', 3, 0.6));
    steam(s, 40, 22, 16); steam(s, 56, 20, 18);
    return { shadow: 1 };
  },
  (s) => {
    s.add(straw(62, 4, 54, 40, '#4ac8ff'));
    const ML = { hi: '#fff0f8', mid: '#ffb0d4', lo: '#e070a8', ink: '#7a1a4a' };
    s.add(path('M26 34L74 34Q72 62 56 68L54 84L64 88L64 92L36 92L36 88L46 84L44 68Q28 62 26 34Z', s.rad(GLASSP, 'mg', '30%', '30%'), GLASSP.ink, 2.4, 'fill-opacity=".72"'));
    s.add(path('M29 38L71 38Q69 60 55 65L45 65Q31 60 29 38Z', s.rad(ML, 'shake', '40%', '20%')));
    s.add(`<path d="M32 46Q50 50 68 46" fill="none" stroke="#fff" stroke-width="1.4" opacity=".7"/>`);
    s.add(path('M26 34L74 34Q72 62 56 68L54 84L64 88L64 92L36 92L36 88L46 84L44 68Q28 62 26 34Z', 'none', GLASSP.ink, 2.4));
    s.add(hl('M31 40Q33 56 42 62', 2.4, 0.85));
    s.add(cream(s, 50, 36, 46));
    s.add(sprinkles([[40, 22, 30], [56, 20, -20], [48, 16, 80], [62, 26, 15]]));
    s.add(cherry(s, 50, 13, 4.6));
    return { shadow: 1 };
  },
  (s) => {
    const TEA = s.lin(['#f4d8b0', '#c89060']);
    s.add(straw(58, 2, 54, 36, '#ff5a8a'));
    s.add(SB(s, 'M24 34Q24 16 50 16Q76 16 76 34Z', { hi: '#ffffff', mid: '#f4f8ff', lo: '#c8d8ec', ink: '#3a4a6a' }, 2.2, 'dome', '35%', '25%'));
    s.add(tumbler(s, 'd6', 34, 92, 52, 38, 40, TEA));
    s.add(`<g clip-path="url(#d6)">${Array.from({ length: 13 }, (_, i) => { const x = 34 + (i % 5) * 8 + (i > 4 ? 4 : 0) - (i > 9 ? 2 : 0), y = 88 - Math.floor(i / 5) * 6; return `<circle cx="${x}" cy="${y}" r="3.2" fill="${s.rad({ hi: '#8a6a6a', mid: '#3a2420', lo: '#1a0e0c', ink: '#0a0404' }, 'pearl')}"/><circle cx="${x - 1}" cy="${y - 1}" r=".9" fill="#fff" opacity=".8"/>`; }).join('')}</g>`);
    s.add(glassFront(34, 92, 52, 38));
    s.add(B(s, 'M22 32L78 32L77 38L23 38Z', { hi: '#ffffff', mid: '#f4f8ff', lo: '#c8d8ec', ink: '#3a4a6a' }, 1.6, 'rim'));
    s.add(B(s, 'M36 52L64 52L63 66L37 66Z', PINK, 1.4, 'band'));
    s.add(`<path d="M45 59Q50 55 55 59Q50 64 45 59Z" fill="#fff"/>`);
    s.add(hl('M30 22Q36 18 44 18', 1.6, 0.8));
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="56" r="40" fill="${s.glowGrad('#ffc0e0', 0.65)}"/>`);
    // ladle
    s.add(`<path d="M68 8L58 48" stroke="${IRON.ink}" stroke-width="5.4" stroke-linecap="round"/><path d="M68 8L58 48" stroke="${IRON.hi}" stroke-width="2" stroke-linecap="round"/>`);
    s.add(B(s, circ(68, 8, 3.6), IRON, 1.4, 'ladk'));
    const bowl = 'M8 44L92 44Q90 78 64 84L36 84Q10 78 8 44Z';
    s.add(path(bowl, s.rad(GLASSP, 'pb', '30%', '30%'), GLASSP.ink, 2.4, 'fill-opacity=".72"'));
    s.defs.push(`<clipPath id="pbc"><path d="${bowl}"/></clipPath>`);
    s.add(`<g clip-path="url(#pbc)"><path d="M6 50Q50 44 94 50L94 90L6 90Z" fill="${s.lin(['#ff8ab8', '#e8306a'])}"/><path d="M6 50Q50 44 94 50" fill="none" stroke="#ffd0e4" stroke-width="1.6"/>${bubble(s, 30, 66, 2)}${bubble(s, 66, 72, 1.6)}${bubble(s, 50, 62, 1.4)}</g>`);
    s.add(lemon(s, 26, 50, 7.4));
    s.add(B(s, circ(46, 50, 6), { hi: '#ffe0a0', mid: '#ffa63c', lo: '#e0701a', ink: '#6a3008' }, 1.4, 'orange'));
    s.add(`<circle cx="46" cy="50" r="4.2" fill="#ffd08a"/>`);
    s.add(cherry(s, 72, 52, 4));
    s.add(`<path d="${bowl}" fill="none" stroke="${GLASSP.ink}" stroke-width="2.4" stroke-linejoin="round"/>`);
    s.add(B(s, 'M36 84L64 84L68 92L32 92Z', GLASSP, 2, 'pfoot'));
    s.add(hl('M14 52Q18 70 32 78', 2.8, 0.85));
    sparkle(s, 86, 26, 5); sparkle(s, 14, 32, 3.6);
    return { shadow: 1 };
  },
];
function leafSm(s, x, y) {
  return B(s, `M${x} ${y}Q${x + 6} ${y - 8} ${x + 14} ${y - 6}Q${x + 10} ${y + 2} ${x} ${y}Z`, { hi: '#e4ffb8', mid: '#5ac84a', lo: '#2e8a2e', ink: '#164a14' }, 1.2, 'mint') + `<path d="M${x + 1} ${y - 0.5}Q${x + 7} ${y - 4} ${x + 12} ${y - 5}" fill="none" stroke="#2e8a2e" stroke-width=".7"/>`;
}

// ------------------------------------------------------------------ desserts
const dessert = [
  (s) => {
    s.add(B(s, 'M30 50L14 38L16 62Z', PINK, 2, 'wr1') + B(s, 'M70 50L86 38L84 62Z', PINK, 2, 'wr2'));
    s.add(`<path d="M18 44L24 48M18 56L24 52M82 44L76 48M82 56L76 52" stroke="${PINK.lo}" stroke-width="1"/>`);
    s.add(B(s, circ(50, 50, 20), { hi: '#ffffff', mid: '#fff0f6', lo: '#f4c0d8', ink: PINK.ink }, 2.2, 'candy', '35%', '30%'));
    s.add(`<path d="M50 50m0 -3a3 3 0 1 1 -3 3a6 6 0 1 1 6 6a9 9 0 1 1 -9 -9a12 12 0 1 1 12 12a15 15 0 0 1 -15 -15" fill="none" stroke="#ff5a9a" stroke-width="3.2" stroke-linecap="round"/>`);
    s.add(`<ellipse cx="42" cy="40" rx="5" ry="2.6" fill="#fff" opacity=".85" transform="rotate(-35 42 40)"/>`);
    return { shadow: 1 };
  },
  (s) => {
    s.add(G(SB(s, 'M50 22Q78 22 80 50Q80 78 50 80Q20 78 20 50Q22 22 50 22Z', COOKIE, 2.4, 'cookie', '35%', '25%'), 'grain'));
    s.add(`<path d="M28 42Q34 36 40 40M60 68Q66 66 70 60" fill="none" stroke="${COOKIE.lo}" stroke-width="1.2"/>`);
    for (const [x, y, r] of [[36, 38, 4.4], [58, 34, 3.8], [66, 52, 4.6], [44, 56, 4.2], [54, 70, 3.6], [32, 62, 3.2], [50, 45, 2.6]]) s.add(B(s, `M${x - r} ${y}Q${x - r} ${y - r} ${x} ${y - r * 0.9}Q${x + r} ${y - r} ${x + r} ${y}Q${x + r * 0.8} ${y + r} ${x} ${y + r * 0.9}Q${x - r * 0.9} ${y + r} ${x - r} ${y}Z`, CHOC, 1, 'chip'));
    s.add(hl('M28 36Q34 28 44 26', 2.4, 0.55));
    return { shadow: 1 };
  },
  (s) => {
    s.add(B(s, 'M26 58L74 58L67 90L33 90Z', PINK, 2.2, 'liner', '30%', '20%'));
    s.add(`<path d="M32 60L37 89M40 60L42.5 89M50 60L50 89M60 60L57.5 89M68 60L63 89" stroke="${PINK.lo}" stroke-width="1.6"/>`);
    const FR = { hi: '#fffaff', mid: '#ffd0e8', lo: '#f090c0', ink: '#7a1a4a' };
    s.add(SB(s, 'M22 60Q14 50 26 44Q24 32 38 32Q42 20 54 24Q66 20 68 32Q82 32 78 46Q88 52 78 60Z', FR, 2.2, 'frost', '35%', '20%'));
    s.add(`<path d="M26 52Q40 56 54 50Q66 46 76 52M36 40Q46 42 56 36" fill="none" stroke="${FR.lo}" stroke-width="1.4"/>`);
    s.add(sprinkles([[32, 50, 30], [46, 44, -20], [62, 44, 60], [70, 54, -40], [40, 34, 10], [56, 32, 80], [50, 54, 45]]));
    s.add(cherry(s, 54, 22, 5));
    return { shadow: 1 };
  },
  (s) => {
    s.add(G(SB(s, ell(50, 54, 32, 28), COOKIE, 2.4, 'donut', '35%', '25%'), 'grain'));
    const IC = { hi: '#ffeaf4', mid: '#ff8ec4', lo: '#e0508e', ink: '#7a1a4a' };
    s.add(SB(s, 'M20 50Q20 28 50 28Q80 28 80 50Q82 58 76 60Q72 66 66 62Q60 70 52 64Q44 72 38 64Q30 68 26 60Q18 60 20 50Z', IC, 2, 'icing', '35%', '25%'));
    s.add(path(ell(50, 50, 9, 7), COOKIE.lo, COOKIE.ink, 2) + `<ellipse cx="50" cy="51.5" rx="6" ry="4" fill="${COOKIE.ink}" opacity=".5"/>`);
    s.add(sprinkles([[32, 40, 30], [44, 34, -20], [60, 36, 60], [68, 46, -40], [30, 52, 10], [62, 56, 80], [40, 58, 45], [54, 42, 0]]));
    s.add(`<ellipse cx="34" cy="36" rx="6" ry="2.6" fill="#fff" opacity=".7" transform="rotate(-30 34 36)"/>`);
    return { shadow: 1 };
  },
  (s) => {
    s.add(path('M22 52L78 52Q76 74 56 78L54 86L64 90L64 93L36 93L36 90L46 86L44 78Q24 74 22 52Z', s.rad(GLASSP, 'sg', '30%', '30%'), GLASSP.ink, 2.4, 'fill-opacity=".72"'));
    s.add(scoop(s, 38, 46, 13, { hi: '#fff0f6', mid: '#ffb0d4', lo: '#e070a8', ink: '#7a1a4a' }, 'sc1'));
    s.add(scoop(s, 62, 46, 13, MINTICE, 'sc2'));
    s.add(scoop(s, 50, 32, 14, CHOC, 'sc3'));
    s.add(`<path d="M42 22Q50 28 58 22Q60 30 54 32Q50 36 46 32Q40 30 42 22Z" fill="${CHOC.ink}" opacity=".6"/>`);
    s.add(`<g transform="rotate(20 74 26)">${B(s, 'M70 10L78 10L78 40L70 40Z', COOKIE, 1.4, 'wafer')}<path d="M70 16L78 16M70 22L78 22M70 28L78 28M70 34L78 34M74 10L74 40" stroke="${COOKIE.lo}" stroke-width=".8"/></g>`);
    s.add(path('M22 52L78 52Q76 74 56 78L54 86L64 90L64 93L36 93L36 90L46 86L44 78Q24 74 22 52Z', 'none', GLASSP.ink, 2.4));
    s.add(hl('M27 56Q30 68 40 74', 2.4, 0.85));
    s.add(sprinkles([[40, 30, 30], [58, 26, -20], [34, 42, 60]]));
    s.add(cherry(s, 50, 16, 5));
    return { shadow: 1 };
  },
  (s) => {
    s.add(B(s, 'M8 84Q8 78 50 78Q92 78 92 84Q92 92 50 92Q8 92 8 84Z', PLATE, 2, 'cplate', '40%', '30%'));
    const SP = { hi: '#fff8e8', mid: '#ffe6b8', lo: '#e8c088', ink: '#6a4418' };
    s.add(SB(s, 'M16 50L84 50L84 80Q50 88 16 80Z', SP, 2.2, 'sponge', '30%', '20%'));
    s.add(`<path d="M16 64Q50 70 84 64" fill="none" stroke="#ee3a4a" stroke-width="4"/><path d="M16 64Q50 70 84 64" fill="none" stroke="#fff" stroke-width="1.6"/>`);
    s.add(SB(s, 'M14 50Q14 36 50 36Q86 36 86 50Q86 56 80 54Q76 60 70 55Q64 61 58 56Q52 62 46 56Q40 62 34 55Q28 60 22 54Q14 56 14 50Z', VANILLA, 2.2, 'cream', '35%', '25%'));
    s.add(`<ellipse cx="50" cy="42" rx="30" ry="5" fill="#fff" opacity=".5"/>`);
    for (const [x, y, k] of [[30, 38, 0.9], [50, 34, 1.05], [70, 38, 0.9]]) s.add(strawberry(s, x, y, k));
    for (const [x, y] of [[40, 42], [60, 42]]) s.add(`<circle cx="${x}" cy="${y}" r="2.2" fill="#fff" stroke="${VANILLA.lo}" stroke-width=".8"/>`);
    s.add(hl('M20 56L20 76', 2.2, 0.7));
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="50" r="42" fill="${s.glowGrad('#ffd0e8', 0.7)}"/>`);
    const ICE = { hi: '#ffffff', mid: '#fff6fa', lo: '#f0d0e0', ink: '#7a3a5a' };
    for (const [y, w, h, key] of [[90, 72, 22, 't1'], [68, 54, 20, 't2'], [48, 38, 18, 't3']]) {
      s.add(SB(s, `M${50 - w / 2} ${y}L${50 - w / 2} ${y - h + 3}Q${50 - w / 2} ${y - h} ${50 - w / 2 + 3} ${y - h}L${50 + w / 2 - 3} ${y - h}Q${50 + w / 2} ${y - h} ${50 + w / 2} ${y - h + 3}L${50 + w / 2} ${y}Z`, ICE, 2.2, key, '30%', '20%'));
      const sc = []; for (let x = 50 - w / 2 + 4; x < 50 + w / 2 - 2; x += 6) sc.push(`M${x - 3} ${y - h}Q${x} ${y - h + 5} ${x + 3} ${y - h}`);
      s.add(`<path d="${sc.join('')}" fill="none" stroke="#ff8ec4" stroke-width="2"/>`);
      s.add(`<path d="M${50 - w / 2 + 2} ${y - 3}L${50 + w / 2 - 2} ${y - 3}" stroke="#ff8ec4" stroke-width="1.4" stroke-dasharray="1 2.4" stroke-linecap="round"/>`);
      for (const x of [50 - w / 4, 50 + w / 4]) s.add(`<circle cx="${x}" cy="${y - h / 2}" r="2" fill="#fff" stroke="#e0a0c0" stroke-width=".8"/>`);
    }
    s.add(B(s, 'M50 32Q40 22 44 16Q48 12 50 18Q52 12 56 16Q60 22 50 32Z', BERRY, 1.8, 'topper'));
    s.add(`<path d="M46 18q1 -2 3 -1" fill="none" stroke="#fff" stroke-width="1"/>`);
    for (const [x, y] of [[20, 76], [80, 76], [30, 58], [70, 58]]) s.add(`<circle cx="${x}" cy="${y}" r="2.4" fill="${s.rad({ hi: '#fff', mid: '#f8eef6', lo: '#d8b8d0', ink: '#7a5a7a' }, 'pearl')}" stroke="#7a5a7a" stroke-width=".7"/>`);
    sparkle(s, 82, 24, 5); sparkle(s, 18, 32, 3.6);
    return { shadow: 1 };
  },
];

// ------------------------------------------------------------------ grill
const grill = [
  (s) => {
    s.add(SB(s, 'M50 20Q70 20 72 54Q72 84 50 84Q28 84 28 54Q30 20 50 20Z', EGG, 2.4, 'egg', '35%', '25%'));
    for (const [x, y] of [[58, 40], [44, 62], [62, 66], [40, 46]]) s.add(`<circle cx="${x}" cy="${y}" r="1" fill="${EGG.lo}"/>`);
    s.add(`<ellipse cx="41" cy="36" rx="5" ry="8.4" fill="#fff" opacity=".9" transform="rotate(20 41 36)"/>`);
    return { shadow: 1 };
  },
  (s) => {
    s.add(path('M74 66L94 80', 'none', PAN.ink, 8.6) + path('M74 66L94 80', 'none', '#a86a3a', 4.6));
    s.add(SB(s, ell(46, 60, 34, 24), PAN, 2.4, 'pan', '35%', '25%'));
    s.add(path(ell(46, 58, 28, 19), s.rad({ hi: '#5a607a', mid: '#2a2e40', lo: '#14161e', ink: '#0a0c10' }, 'pani'), '#0a0c10', 1));
    s.add(SB(s, 'M24 58Q22 44 36 44Q42 36 52 42Q66 40 66 52Q72 62 62 68Q52 76 40 70Q24 70 24 58Z', EGG, 1.8, 'white', '35%', '30%'));
    s.add(SB(s, circ(46, 56, 9), YOLK, 1.8, 'yolk', '35%', '30%'));
    s.add(`<ellipse cx="43" cy="52" rx="3.2" ry="2" fill="#fff" opacity=".85" transform="rotate(-30 43 52)"/>`);
    s.add(hl('M16 56Q18 46 28 40', 2, 0.5));
    return { shadow: 1 };
  },
  (s) => {
    s.add(`<path d="M74 10L60 50" stroke="${IRON.ink}" stroke-width="4.4" stroke-linecap="round"/><path d="M74 10L60 50" stroke="${IRON.hi}" stroke-width="1.6" stroke-linecap="round"/><path d="M70 8L76 14M68 14L64 6M78 8L72 18" stroke="${IRON.ink}" stroke-width="2.4" stroke-linecap="round"/>`);
    s.add(sausage(s, 46, 70, 48, -10)); s.add(sausage(s, 52, 54, 46, 14, 'saus2'));
    steam(s, 40, 44, 14);
    return { shadow: 1 };
  },
  (s) => {
    s.add(`<g transform="rotate(-38 50 50)">`);
    s.add(`<path d="M50 4L50 98" stroke="${WOOD.ink}" stroke-width="4.4" stroke-linecap="round"/><path d="M50 4L50 98" stroke="${WOOD.hi}" stroke-width="1.6" stroke-linecap="round"/>`);
    const pieces = [[18, MEAT, 'm'], [32, { hi: '#e4ffb8', mid: '#7ed04a', lo: '#3c8a2a', ink: '#1e4a14' }, 'p'], [46, MEAT, 'm'], [60, TOMATO, 't'], [74, MEAT, 'm']];
    for (const [y, p, k] of pieces) {
      if (k === 't') s.add(B(s, circ(50, y, 7.6), p, 1.8, 'kt') + `<circle cx="47.5" cy="${y - 2.4}" r="1.8" fill="#fff" opacity=".7"/>`);
      else if (k === 'p') s.add(B(s, `M41 ${y - 5}L59 ${y - 5}L57 ${y + 5}L43 ${y + 5}Z`, p, 1.8, 'kp'));
      else s.add(G(B(s, `M41 ${y - 6}Q50 ${y - 9} 59 ${y - 6}L60 ${y + 5}Q50 ${y + 8} 40 ${y + 5}Z`, p, 1.8, 'km'), 'grain') + `<path d="M43 ${y - 2}L57 ${y - 2}M42 ${y + 2}L58 ${y + 2}" stroke="${MEAT.ink}" stroke-width="1.6" opacity=".6"/>`);
    }
    s.add(B(s, 'M46 84L54 84L54 92L46 92Z', TOMATO, 1.2, 'kend'));
    s.add('</g>');
    steam(s, 62, 18, 12);
    return { shadow: 1 };
  },
  (s) => {
    const BUN = { hi: '#ffe0a8', mid: '#e8a24a', lo: '#b06a24', ink: '#4e2808' };
    s.add(SB(s, 'M16 76Q16 90 50 90Q84 90 84 76Z', BUN, 2.2, 'bunb'));
    s.add(G(B(s, 'M14 70Q14 62 50 62Q86 62 86 70Q86 78 50 78Q14 78 14 70Z', { hi: '#a86a4a', mid: '#6a3a1e', lo: '#3e1e0c', ink: '#200c04' }, 2, 'patty'), 'grain'));
    s.add(`<path d="M22 70Q30 66 38 70M50 68Q58 64 66 68" fill="none" stroke="#a86a4a" stroke-width="1.2"/>`);
    s.add(B(s, 'M14 60L86 60L82 68L74 63L66 70L58 63L50 70L42 63L34 70L26 63L18 68Z', CHEESE, 1.8, 'cheese'));
    s.add(B(s, 'M10 58Q20 50 30 56Q40 48 50 55Q60 48 70 56Q80 50 90 58Q80 62 70 60Q60 64 50 60Q40 64 30 60Q20 62 10 58Z', LETTUCE, 1.8, 'let'));
    for (const x of [32, 58]) s.add(B(s, ell(x, 54, 12, 3.4), TOMATO, 1.4, 'tom'));
    s.add(SB(s, 'M14 52Q14 22 50 22Q86 22 86 52Z', BUN, 2.4, 'bunt', '35%', '25%'));
    for (const [x, y, a] of [[36, 32, 10], [50, 28, -20], [62, 34, 30], [44, 40, -40], [58, 42, 0], [28, 42, 50], [72, 44, -10]]) s.add(`<ellipse cx="${x}" cy="${y}" rx="2.3" ry="1.3" fill="#fffaec" stroke="${BUN.lo}" stroke-width=".6" transform="rotate(${a} ${x} ${y})"/>`);
    s.add(hl('M22 44Q26 30 40 26', 2.6, 0.6));
    return { shadow: 1 };
  },
  (s) => {
    const CR = { hi: '#ffe4a8', mid: '#e8a24a', lo: '#b06a24', ink: '#4e2808' };
    s.add(G(SB(s, circ(50, 52, 38), CR, 2.4, 'crust', '35%', '25%'), 'grain'));
    s.add(path(circ(50, 52, 32), s.rad({ hi: '#ffb090', mid: '#e8502e', lo: '#a82a14', ink: '#4e0c06' }, 'sauce'), 'none'));
    s.add(`<path d="${circ(50, 52, 30)}" fill="${s.rad(CHEESE, 'chz', '40%', '30%')}" opacity=".88"/>`);
    s.add(`<path d="M50 52L50 20M50 52L78 68M50 52L22 68" stroke="${CR.lo}" stroke-width="1.8" opacity=".8"/>`);
    for (const [x, y] of [[38, 36], [62, 38], [66, 58], [40, 62], [52, 74], [30, 52]]) s.add(B(s, circ(x, y, 5), { hi: '#ff9a7a', mid: '#d83a2a', lo: '#8a1a10', ink: '#4a0806' }, 1.2, 'pep') + `<circle cx="${x - 1.4}" cy="${y - 1.6}" r="1.2" fill="#fff" opacity=".6"/>`);
    for (const [x, y, a] of [[52, 44, 20], [44, 50, -30], [58, 66, 60], [34, 44, 0], [70, 48, 40]]) s.add(`<path d="M${x - 3} ${y}Q${x} ${y - 3} ${x + 3} ${y}Q${x} ${y + 1} ${x - 3} ${y}Z" fill="#4ab03a" stroke="#1e4a14" stroke-width=".8" transform="rotate(${a} ${x} ${y})"/>`);
    for (const [x, y] of [[46, 30], [60, 50], [36, 70]]) s.add(`<circle cx="${x}" cy="${y}" r="2.2" fill="#2a2a2a" stroke="#000" stroke-width=".6"/><circle cx="${x}" cy="${y}" r=".8" fill="#ffd23c"/>`);
    s.add(hl('M20 40Q26 24 42 18', 2.6, 0.55));
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="56" r="40" fill="${s.glowGrad('#ffc890', 0.6)}"/>`);
    s.add(B(s, 'M6 78Q6 68 50 68Q94 68 94 78Q94 92 50 92Q6 92 6 78Z', PLATE, 2.2, 'platter', '40%', '30%'));
    s.add(`<ellipse cx="50" cy="78" rx="38" ry="8" fill="none" stroke="#5aaaf0" stroke-width="1.4" opacity=".7"/>`);
    for (const [x, y] of [[18, 74], [82, 74], [28, 82], [72, 82], [50, 84]]) s.add(B(s, circ(x, y, 4), LETTUCE, 1.2, 'pea'));
    // drumsticks
    for (const fl of [1, -1]) {
      const x = (n) => f1(50 + fl * n);
      s.add(`<path d="M${x(24)} 46L${x(36)} 26" stroke="${EGG.ink}" stroke-width="7" stroke-linecap="round"/><path d="M${x(24)} 46L${x(36)} 26" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/>`);
      s.add(B(s, `M${x(33)} 24Q${x(36)} 18 ${x(40)} 22Q${x(42)} 28 ${x(37)} 29Z`, EGG, 1.2, 'bone'));
      s.add(path(`M${x(36)} 26l${fl * 4} -3`, 'none', EGG.ink, 1.2));
    }
    s.add(G(SB(s, 'M18 62Q14 40 34 34Q50 28 66 34Q86 40 82 62Q76 74 50 74Q24 74 18 62Z', ROAST, 2.6, 'chick', '35%', '20%'), 'grain'));
    s.add(G(SB(s, 'M14 58Q10 46 20 42Q30 44 30 56Q26 64 14 58Z', ROAST, 2, 'leg1'), 'grain') + G(SB(s, 'M86 58Q90 46 80 42Q70 44 70 56Q74 64 86 58Z', ROAST, 2, 'leg2'), 'grain'));
    s.add(`<path d="M30 44Q40 38 50 40M36 52Q48 46 62 50" fill="none" stroke="${ROAST.lo}" stroke-width="1.6"/>`);
    s.add(`<ellipse cx="38" cy="42" rx="8" ry="3.4" fill="#fff" opacity=".55" transform="rotate(-20 38 42)"/>`);
    for (const [x, y] of [[44, 34], [60, 40], [54, 56]]) s.add(`<path d="M${x} ${y}l2 -1l1 2z" fill="#3e8a2a"/>`);
    steam(s, 42, 26, 14); steam(s, 58, 24, 16);
    return { shadow: 1 };
  },
];

// ------------------------------------------------------------------ coins & energy
const coins = [
  (s) => { s.back.push(`<circle cx="50" cy="54" r="30" fill="${s.glowGrad('#ffe58a', 0.6)}"/>`); s.add(coin(s, 50, 54, 22)); sparkle(s, 71, 31, 5); sparkle(s, 28, 74, 2.6); return { shadow: 1 }; },
  (s) => {
    for (let i = 0; i < 5; i++) s.add(coinSide(s, 40, 86 - i * 8, 34));
    for (let i = 0; i < 3; i++) s.add(coinSide(s, 65, 87 - i * 8, 30, 'cs2'));
    s.add(`<g transform="rotate(-18 72 52)">${coin(s, 72, 52, 10, 'cnl')}</g>`);
    sparkle(s, 82, 34, 5); sparkle(s, 20, 40, 3);
    return { shadow: 1 };
  },
  (s) => {
    const jar = 'M26 26L74 26L74 34Q82 38 82 50L82 82Q82 92 72 92L28 92Q18 92 18 82L18 50Q18 38 26 34Z';
    s.add(path(jar, s.rad(GLASSP, 'jar', '30%', '30%'), GLASSP.ink, 2.4, 'fill-opacity=".7"'));
    s.defs.push(`<clipPath id="jarc"><path d="${jar}"/></clipPath>`);
    s.add(`<g clip-path="url(#jarc)">${[[30, 86, 8], [48, 88, 8], [66, 86, 8], [38, 74, 7.4], [58, 76, 7.6], [28, 66, 6.4], [70, 66, 6.8], [48, 62, 7]].map(([x, y, r], i) => `<g transform="rotate(${(i * 37) % 50 - 25} ${x} ${y})">${coin(s, x, y, r, 'jc')}</g>`).join('')}</g>`);
    s.add(`<path d="${jar}" fill="none" stroke="${GLASSP.ink}" stroke-width="2.4" stroke-linejoin="round"/>`);
    s.add(B(s, 'M22 18L78 18L78 28L22 28Z', { hi: '#ffb4a0', mid: '#e8503a', lo: '#a02a1a', ink: '#4e0e06' }, 2, 'jlid'));
    s.add(G(B(s, 'M28 40L72 40L72 54L28 54Z', { hi: '#fffef8', mid: '#fff6e0', lo: '#e8d8b0', ink: '#6a4a1a' }, 1.6, 'jl'), 'paper'));
    s.add(`<text x="50" y="51" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="10" fill="#e8403a" stroke="#6a1010" stroke-width=".6">TIPS</text>`);
    s.add(hl('M23 40L23 84', 3, 0.85));
    sparkle(s, 84, 18, 5);
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="50" r="42" fill="${s.glowGrad('#ffe58a', 0.7)}"/>`);
    const RP = { hi: '#ffe6f2', mid: '#ff7ab4', lo: '#d8408a', ink: '#6a0e3e' };
    s.add(SB(s, 'M14 52L86 52L90 90L10 90Z', RP, 2.4, 'reg', '30%', '20%'));
    s.add(B(s, 'M8 86L92 86L92 93L8 93Z', RP, 1.8, 'drawerbase'));
    s.add(B(s, 'M22 74L78 74L78 86L22 86Z', { hi: '#ffffff', mid: '#f4f4fa', lo: '#c8cad8', ink: '#4a4e6a' }, 1.6, 'drawer'));
    s.add(B(s, 'M44 78L56 78L56 81L44 81Z', GOLD, 1, 'pull'));
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) s.add(B(s, `M${22 + c * 12} ${57 + r * 8}L${30 + c * 12} ${57 + r * 8}L${30 + c * 12} ${62 + r * 8}L${22 + c * 12} ${62 + r * 8}Z`, { hi: '#ffffff', mid: '#fff0f6', lo: '#e0b0c8', ink: RP.ink }, 1, 'key'));
    s.add(SB(s, 'M28 26L72 26L76 50L24 50Z', RP, 2.2, 'disp'));
    s.add(path('M32 30L68 30L70 44L30 44Z', s.lin(['#1a3a2a', '#0e2418']), RP.ink, 1.4));
    s.add(`<text x="50" y="42" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="11" fill="#7cff9a">$$$</text>`);
    s.add(coin(s, 18, 30, 8, 'rc1')); s.add(coin(s, 84, 34, 7, 'rc2'));
    s.add(hl('M18 58L16 84', 2.6, 0.6));
    sparkle(s, 88, 16, 5); sparkle(s, 50, 12, 3.4);
    return { shadow: 1 };
  },
];
function boltD(cx, cy, k) { return `M${cx + 4 * k} ${cy - 14 * k}L${cx - 8 * k} ${cy + 2 * k}L${cx} ${cy + 2 * k}L${cx - 4 * k} ${cy + 14 * k}L${cx + 8 * k} ${cy - 2 * k}L${cx} ${cy - 2 * k}Z`; }
const BOLT = { hi: '#fff8c0', mid: '#ffd23c', lo: '#e89a1c', ink: '#6a3e08' };
const energy = [
  (s) => {
    s.add(`<g transform="rotate(-22 50 52)">`);
    s.add(SB(s, 'M18 40L82 40L82 64L18 64Z', ENERGY, 2.4, 'bar', '30%', '20%'));
    for (const x of [18, 82]) s.add(B(s, `M${x - 6} 38L${x + 6} 38L${x + 6} 66L${x - 6} 66Z`, { hi: '#e6d8ff', mid: '#8a64d8', lo: '#5030a0', ink: '#2e1468' }, 1.6, 'crimp') + `<path d="M${x - 6} 42L${x + 6} 42M${x - 6} 47L${x + 6} 47M${x - 6} 52L${x + 6} 52M${x - 6} 57L${x + 6} 57M${x - 6} 62L${x + 6} 62" stroke="#2e1468" stroke-width=".8" opacity=".6"/>`);
    s.add(B(s, boltD(50, 52, 0.7), BOLT, 1.4, 'b1'));
    s.add(hl('M26 44L74 44', 1.6, 0.7));
    s.add('</g>');
    sparkle(s, 80, 28, 4);
    return { shadow: 1 };
  },
  (s) => {
    s.add(path('M34 32Q34 16 50 16Q66 16 66 32', 'none', ENERGY.ink, 8) + path('M34 32Q34 16 50 16Q66 16 66 32', 'none', ENERGY.mid, 4));
    s.add(SB(s, 'M16 34Q16 28 22 28L78 28Q84 28 84 34L84 84Q84 90 78 90L22 90Q16 90 16 84Z', ENERGY, 2.4, 'lunch', '30%', '20%'));
    s.add(`<path d="M16 46L84 46" stroke="${ENERGY.ink}" stroke-width="2"/><path d="M17 48L83 48" stroke="${ENERGY.hi}" stroke-width=".8" opacity=".7"/>`);
    for (const x of [22, 78]) s.add(B(s, `M${x - 4} 42L${x + 4} 42L${x + 4} 52L${x - 4} 52Z`, METAL, 1.2, 'latch'));
    s.add(B(s, circ(50, 68, 14), { hi: '#ffffff', mid: '#f6eeff', lo: '#d0c0f0', ink: ENERGY.ink }, 1.8, 'badge'));
    s.add(B(s, boltD(50, 68, 0.75), BOLT, 1.4, 'b2'));
    s.add(hl('M22 36L22 82', 2.6, 0.6));
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="54" r="40" fill="${s.glowGrad('#d8c0ff', 0.6)}"/>`);
    s.add(path('M26 46Q26 14 50 14Q74 14 74 46', 'none', WICKER.ink, 8) + path('M26 46Q26 14 50 14Q74 14 74 46', 'none', WICKER.mid, 4) + `<path d="M26 46Q26 14 50 14Q74 14 74 46" fill="none" stroke="${WICKER.lo}" stroke-width="4" stroke-dasharray="2 3"/>`);
    s.add(G(SB(s, 'M12 46L88 46L80 90L20 90Z', WICKER, 2.4, 'pic', '35%', '20%'), 'woodgrain'));
    s.defs.push('<clipPath id="picc"><path d="M12 46L88 46L80 90L20 90Z"/></clipPath>');
    const w = []; for (let i = 0; i < 5; i++) w.push(`M10 ${54 + i * 8}L90 ${54 + i * 8}`);
    s.add(`<g clip-path="url(#picc)"><path d="${w.join('')}" stroke="${WICKER.ink}" stroke-width="1.6" opacity=".6"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${18 + i * 8} 46L${18 + i * 8 + (i - 4) * 0.8} 90" stroke="${WICKER.lo}" stroke-width="1.8" opacity=".7"/>`).join('')}</g>`);
    s.add(checkCloth(s, 'M10 44Q50 36 90 44L86 56Q50 50 14 56Z', 'pc'));
    s.add(G(B(s, 'M8 44L92 44L90 50L10 50Z', WICKER, 1.8, 'prim'), 'woodgrain'));
    s.add(B(s, circ(50, 70, 12.5), { hi: '#ffffff', mid: '#f6eeff', lo: '#d0c0f0', ink: ENERGY.ink }, 1.8, 'pbadge'));
    s.add(B(s, boltD(50, 70, 0.66), { ...ENERGY, hi: '#e6d8ff' }, 1.4, 'b3'));
    sparkle(s, 86, 22, 5); sparkle(s, 14, 30, 3.4);
    return { shadow: 1 };
  },
];

export const SPRITES = {};
const fill = (lv) => Math.min(0.95, 0.68 + lv * 0.04);
for (const [name, arr] of Object.entries({ bakery, drinks, dessert, grill, coin: coins, energy })) arr.forEach((d, i) => { SPRITES[`${name}-${i + 1}`] = { draw: d, fill: fill(i + 1) }; });
