// Painted merge-chain items (earth / water / wind / fire, levels 1-7) for Arcane Merge.
import { f1, METAL, IRON, Svg, path, hl, sparkle, gem, rivet, crystal, rock, leaf } from './paint.mjs';

export const EARTH = { hi: '#f6dfb4', mid: '#c79056', lo: '#8a5a2c', ink: '#553218' };
export const ROCK = { hi: '#efe5d6', mid: '#b9a387', lo: '#7d6950', ink: '#4a3a28' };
export const GREY = { hi: '#eceaf2', mid: '#b3aec0', lo: '#7d7690', ink: '#4a4460' };
export const MOSS = { hi: '#e6f8b6', mid: '#8cc65a', lo: '#4e8a34', ink: '#2e5a22' };
export const NUT = { hi: '#fae6be', mid: '#dcae6e', lo: '#9a6a34', ink: '#5a3a18' };
export const WOOD = { hi: '#ecc08a', mid: '#b67a43', lo: '#7c4a24', ink: '#4a2a12' };
export const WATER = { hi: '#eefaff', mid: '#5ab8f5', lo: '#1f6fc9', ink: '#12448a' };
export const FOAM = { hi: '#ffffff', mid: '#eef8ff', lo: '#b8dcf5', ink: '#3a6ea8' };
export const SHELL = { hi: '#ffffff', mid: '#d4ecfc', lo: '#86bde8', ink: '#2e5e9a' };
export const WIND = { hi: '#f4fffa', mid: '#a6eed4', lo: '#3cb894', ink: '#1e6e5a' };
export const CLOUD = { hi: '#ffffff', mid: '#eef4fa', lo: '#bccadc', ink: '#56688a' };
export const FLAME = { hi: '#fff3b0', mid: '#ffa23c', lo: '#e8502e', ink: '#7a1a10' };
export const WAX = { hi: '#fffcf4', mid: '#ffeccc', lo: '#e8c48f', ink: '#9a6a34' };
export const STONE = { hi: '#f0eef4', mid: '#c4bfcf', lo: '#8a8399', ink: '#4e4862' };

/** Bevelled shape filled with a lit radial gradient and an ink outline. */
export const B = (s, d, p, w = 2, key = 'b', cx, cy) => `<g filter="url(#bev)">${path(d, s.rad(p, key, cx, cy), p.ink, w)}</g>`;
export const SB = (s, d, p, w = 2, key = 'b', cx, cy) => `<g filter="url(#softbev)">${path(d, s.rad(p, key, cx, cy), p.ink, w)}</g>`;
export const G = (inner, filter) => `<g filter="url(#${filter})">${inner}</g>`;
const circ = (x, y, r) => `M${f1(x)} ${f1(y - r)}A${r} ${r} 0 1 1 ${f1(x - 0.01)} ${f1(y - r)}Z`;
export { circ };

export const extraFilters = `
<filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="5" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -.74" result="dk"/>
  <feComposite in="dk" in2="SourceAlpha" operator="in" result="dk2"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 -1.5 0 0 .6" result="lt"/>
  <feComposite in="lt" in2="SourceAlpha" operator="in" result="lt2"/>
  <feComponentTransfer in="dk2" result="dk3"><feFuncA type="linear" slope=".45"/></feComponentTransfer>
  <feComponentTransfer in="lt2" result="lt3"><feFuncA type="linear" slope=".35"/></feComponentTransfer>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dk3"/><feMergeNode in="lt3"/></feMerge>
</filter>
<filter id="woodgrain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency=".12 1.4" numOctaves="2" seed="9" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 0  1.4 0 0 0 -.62" result="dk"/>
  <feComposite in="dk" in2="SourceAlpha" operator="in" result="dk2"/>
  <feComponentTransfer in="dk2" result="dk3"><feFuncA type="linear" slope=".5"/></feComponentTransfer>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dk3"/></feMerge>
</filter>`;

function glowDot(s, x, y, r, c, layer = s.fx) {
  layer.push(`<circle cx="${x}" cy="${y}" r="${f1(r * 2.4)}" fill="${s.glowGrad(c, 0.7)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#9c3020" stroke-width=".5"/>`);
}

// ------------------------------------------------------------------ shared pieces

function pebble(s, cx, cy, rx, ry, p = ROCK, key = 'pb') {
  const d = `M${cx - rx} ${cy + ry * 0.1}Q${cx - rx * 1.02} ${cy - ry} ${cx - rx * 0.15} ${cy - ry}Q${cx + rx} ${cy - ry * 1.05} ${cx + rx} ${cy - ry * 0.05}Q${cx + rx} ${cy + ry} ${cx + rx * 0.1} ${cy + ry}Q${cx - rx * 0.95} ${cy + ry * 1.05} ${cx - rx} ${cy + ry * 0.1}Z`;
  let o = G(G(path(d, s.rad(p, key), p.ink, 2), 'grain'), 'bev');
  o += hl(`M${cx - rx * 0.66} ${cy - ry * 0.15}Q${cx - rx * 0.52} ${cy - ry * 0.72} ${cx - rx * 0.08} ${cy - ry * 0.75}`, Math.max(1.2, ry * 0.18), 0.7);
  return o;
}

function tuft(s, x, y, k = 1) {
  return B(s, `M${x - 6 * k} ${y}Q${x - 5 * k} ${y - 9 * k} ${x - 2.5 * k} ${y - 12 * k}Q${x - 1 * k} ${y - 6 * k} ${x} ${y - 4 * k}Q${x + 1.5 * k} ${y - 14 * k} ${x + 5 * k} ${y - 11 * k}Q${x + 3.5 * k} ${y - 5 * k} ${x + 6 * k} ${y}Z`, MOSS, 1.4, 'tf');
}

function flower(s, x, y, r, petal = '#fff6fa', mid = '#ffd147') {
  let o = '';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    o += `<circle cx="${f1(x + Math.cos(a) * r)}" cy="${f1(y + Math.sin(a) * r)}" r="${f1(r * 0.75)}" fill="${petal}" stroke="#8a5a7a" stroke-width=".6"/>`;
  }
  return o + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.6)}" fill="${mid}" stroke="#8a5a10" stroke-width=".5"/>`;
}

function flame(s, cx, by, w, h, lean = 0, key = 'fl') {
  const tip = cx + lean;
  const outer = `M${tip} ${by - h}Q${cx + w * 0.12} ${by - h * 0.62} ${cx + w * 0.5} ${by - h * 0.45}Q${cx + w * 0.62} ${by - h * 0.05} ${cx} ${by}Q${cx - w * 0.62} ${by - h * 0.05} ${cx - w * 0.5} ${by - h * 0.45}Q${cx - w * 0.12} ${by - h * 0.62} ${tip} ${by - h}Z`;
  let o = SB(s, outer, { hi: '#ffd27a', mid: '#ff7a2c', lo: '#d8321e', ink: '#7a1a10' }, Math.max(1.2, w * 0.07), key, '50%', '70%');
  o += path(`M${cx + lean * 0.7} ${by - h * 0.78}Q${cx + w * 0.34} ${by - h * 0.4} ${cx + w * 0.3} ${by - h * 0.2}Q${cx + w * 0.3} ${by - h * 0.02} ${cx} ${by - h * 0.02}Q${cx - w * 0.3} ${by - h * 0.02} ${cx - w * 0.3} ${by - h * 0.2}Q${cx - w * 0.34} ${by - h * 0.4} ${cx + lean * 0.7} ${by - h * 0.78}Z`, s.lin(['#ffb43c', '#ffd25a']));
  o += path(`M${cx + lean * 0.4} ${by - h * 0.52}Q${cx + w * 0.2} ${by - h * 0.22} ${cx + w * 0.15} ${by - h * 0.1}Q${cx} ${by - h * 0.02} ${cx - w * 0.15} ${by - h * 0.1}Q${cx - w * 0.2} ${by - h * 0.22} ${cx + lean * 0.4} ${by - h * 0.52}Z`, s.lin(['#fff7c8', '#ffffff']));
  return o;
}

function bubble(s, x, y, r) {
  const p = { hi: '#ffffff', mid: '#bfe6ff', lo: '#4aa8f0', ink: '#12448a' };
  let o = `<circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad(p, 'bub', '38%', '32%')}" fill-opacity=".9" stroke="${p.ink}" stroke-width="${f1(Math.max(1.1, r * 0.12))}"/>`;
  o += `<path d="M${f1(x + r * 0.15)} ${f1(y + r * 0.8)}A${r * 0.82} ${r * 0.82} 0 0 0 ${f1(x + r * 0.8)} ${f1(y + r * 0.1)}" fill="none" stroke="#ff9ad8" stroke-width="${f1(r * 0.1)}" opacity=".55"/>`;
  o += `<path d="M${f1(x + r * 0.35)} ${f1(y + r * 0.72)}A${r * 0.8} ${r * 0.8} 0 0 0 ${f1(x + r * 0.72)} ${f1(y + r * 0.38)}" fill="none" stroke="#9affd8" stroke-width="${f1(r * 0.08)}" opacity=".6"/>`;
  o += `<ellipse cx="${f1(x - r * 0.38)}" cy="${f1(y - r * 0.4)}" rx="${f1(r * 0.34)}" ry="${f1(r * 0.2)}" fill="#fff" transform="rotate(-35 ${f1(x - r * 0.38)} ${f1(y - r * 0.4)})"/>`;
  o += `<circle cx="${f1(x + r * 0.42)}" cy="${f1(y + r * 0.35)}" r="${f1(r * 0.1)}" fill="#fff" opacity=".85"/>`;
  return o;
}

function drop(s, x, y, r) {
  return B(s, `M${x} ${y - r * 1.9}Q${x + r} ${y - r * 0.45} ${x + r} ${y + r * 0.2}Q${x + r} ${y + r} ${x} ${y + r}Q${x - r} ${y + r} ${x - r} ${y + r * 0.2}Q${x - r} ${y - r * 0.45} ${x} ${y - r * 1.9}Z`, WATER, Math.max(1.1, r * 0.35), 'dr')
    + `<ellipse cx="${f1(x - r * 0.4)}" cy="${f1(y)}" rx="${f1(r * 0.24)}" ry="${f1(r * 0.42)}" fill="#fff" opacity=".85"/>`;
}

function swirlD(x, y, r) {
  return `M${x - r} ${y}Q${x - r} ${y - r} ${x} ${y - r}Q${x + r} ${y - r} ${x + r} ${y}Q${x + r} ${y + r * 0.6} ${x + r * 0.1} ${y + r * 0.6}Q${x - r * 0.5} ${y + r * 0.6} ${x - r * 0.4} ${y}Q${x - r * 0.3} ${y - r * 0.35} ${x + r * 0.1} ${y - r * 0.3}`;
}
function ribbon(d, w, ink = WIND.ink, mid = WIND.mid, hi = '#fff') {
  return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${w + 2.8}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${mid}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${hi}" stroke-width="${f1(w * 0.3)}" stroke-linecap="round" opacity=".8" transform="translate(-.5 -.6)"/>`;
}
function gust(x, y, len, flip = 1, w = 3) {
  const d = `M${x} ${y}L${x + flip * len} ${y}Q${x + flip * (len + 8)} ${y} ${x + flip * (len + 8)} ${y - 6}Q${x + flip * (len + 8)} ${y - 11} ${x + flip * (len + 3)} ${y - 11}Q${x + flip * len} ${y - 11} ${x + flip * len} ${y - 8}`;
  return ribbon(d, w, WIND.ink, WIND.hi, '#fff');
}

// ------------------------------------------------------------------ earth

const earth = [
  // 1 Pebble
  (s) => {
    s.add(pebble(s, 50, 64, 20, 13, ROCK, 'pb1'));
    s.add(`<path d="M56 58l4 5l-1 5" fill="none" stroke="${ROCK.lo}" stroke-width="1.1" stroke-linecap="round"/>`);
    for (const [x, y, r] of [[58, 70, 1.5], [44, 72, 1.1], [62, 64, 0.9], [40, 66, 0.8]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${ROCK.lo}" opacity=".8"/>`);
    s.add(`<ellipse cx="44" cy="59" rx="4" ry="1.6" fill="#fff" opacity=".55" transform="rotate(-15 44 59)"/>`);
    return { shadow: 1 };
  },
  // 2 Acorn
  (s) => {
    s.add(G(B(s, 'M36 50Q34 80 50 90Q66 80 64 50Z', NUT, 2.2, 'nut'), 'woodgrain'));
    s.add(`<path d="M50 54L50 86" stroke="${NUT.lo}" stroke-width="1" opacity=".45"/>`);
    s.add(hl('M41 56Q40 72 46 82', 2.6, 0.65));
    s.add(`<path d="M50 90l0 2.5" stroke="${NUT.ink}" stroke-width="2" stroke-linecap="round"/>`);
    s.add(B(s, 'M29 52Q28 33 50 30Q72 33 71 52Q50 58 29 52Z', EARTH, 2.2, 'cap'));
    // scale pattern on the cap
    const sc = [];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6 - (r === 2 ? 2 : 0); i++) {
      const x = 33 + i * 7 + r * 3.5 + (r === 2 ? 3.5 : 0), y = 49 - r * 6;
      sc.push(`M${x - 3.5} ${y}Q${x} ${y + 3.6} ${x + 3.5} ${y}`);
    }
    s.add(`<path d="${sc.join('')}" fill="none" stroke="${EARTH.ink}" stroke-width="1.2" opacity=".55"/>`);
    s.add(hl('M34 44Q38 36 46 34', 1.8, 0.55));
    s.add(path('M50 31Q51 22 58 19', 'none', EARTH.ink, 4.2));
    s.add(path('M50 31Q51 22 58 19', 'none', WOOD.mid, 1.8));
    s.add(leaf(s, 57, 21, 13, -28));
    return { shadow: 1 };
  },
  // 3 Rock Cairn
  (s) => {
    s.add(pebble(s, 50, 80, 30, 10, ROCK, 'c1'));
    s.add(pebble(s, 48, 62, 22, 8.5, GREY, 'c2'));
    s.add(pebble(s, 52, 46.5, 15, 7.5, ROCK, 'c3'));
    s.add(pebble(s, 49.5, 33.5, 9, 6, GREY, 'c4'));
    s.add(path('M36 58Q40 53 46 55Q44 58 40 58Z', MOSS.mid, MOSS.ink, 1.1));
    s.add(path('M56 76Q62 70 70 73Q66 77 60 77Z', MOSS.mid, MOSS.ink, 1.1));
    s.add(tuft(s, 22, 88, 0.95)); s.add(tuft(s, 77, 88, 0.85));
    s.add(pebble(s, 80, 89, 4, 2.6, GREY, 'c5'));
    s.add(flower(s, 30, 86, 1.6));
    return { shadow: 1 };
  },
  // 4 Clay Urn
  (s) => {
    const CLAY = { hi: '#ffd2a8', mid: '#d6844c', lo: '#9a4c26', ink: '#5a2a12' };
    s.add(path('M25 44Q12 46 14 58Q16 66 25 64', 'none', CLAY.ink, 5.5));
    s.add(path('M75 44Q88 46 86 58Q84 66 75 64', 'none', CLAY.ink, 5.5));
    s.add(path('M25 44Q12 46 14 58Q16 66 25 64', 'none', CLAY.mid, 2.6));
    s.add(path('M75 44Q88 46 86 58Q84 66 75 64', 'none', CLAY.mid, 2.6));
    s.add(G(B(s, 'M40 22L60 22L58 31Q80 37 80 61Q80 87 50 89Q20 87 20 61Q20 37 42 31Z', CLAY, 2.4, 'urn'), 'grain'));
    // painted band with a zigzag and the earth sigil
    s.add(path('M23 50Q50 58 77 50L78 56Q50 64 22 56Z', '#3a2210', 'none', 0, 'opacity=".55"'));
    s.add(`<path d="M24 53L28 57L32 54L36 58L40 55L44 59L48 56L52 59L56 56L60 59L64 55L68 58L72 54L76 56" fill="none" stroke="#ffd9a8" stroke-width="1.2" stroke-linejoin="round"/>`);
    s.add(path('M22 71Q50 79 78 71', 'none', CLAY.lo, 2));
    s.add(path('M50 64L58.5 77L41.5 77Z', s.rad(MOSS, 'urs'), MOSS.ink, 1.8));
    s.add(`<path d="M45 72.5L55 72.5" stroke="${MOSS.ink}" stroke-width="1.6"/>`);
    s.add(B(s, 'M37 16L63 16L64 23L36 23Z', CLAY, 2, 'rim'));
    s.add(`<ellipse cx="50" cy="16.6" rx="12" ry="1.8" fill="${CLAY.ink}"/>`);
    s.add(hl('M28 45Q23 61 30 78', 3, 0.55));
    s.add(hl('M40 18L52 18', 1.2, 0.7));
    s.add(path('M70 80l3 -3l1 4z', CLAY.lo, CLAY.ink, 0.8));
    return { shadow: 1 };
  },
  // 5 Standing Stone
  (s) => {
    s.back.push(`<ellipse cx="50" cy="48" rx="26" ry="34" fill="${s.glowGrad('#c6f08a', 0.6)}"/>`);
    s.add(G(B(s, 'M31 89L27 42Q27 14 50 9Q73 14 73 42L69 89Z', GREY, 2.4, 'mh'), 'grain'));
    s.add(`<path d="M62 20l-3 9l4 6M35 64l5 5" fill="none" stroke="${GREY.lo}" stroke-width="1.1" stroke-linecap="round"/>`);
    s.add(path('M27 42Q27 14 50 9Q40 16 36 30Q33 44 33 60L31 89', 'none', '#fff', 0, ''));
    s.add(hl('M33 44Q32 24 42 16', 2.6, 0.5));
    const rune = 'M50 26L50 62M39 35L50 46L61 35M41 55L59 55';
    s.add(`<path d="${rune}" fill="none" stroke="#9ae85a" stroke-width="6" stroke-linecap="round" opacity=".55" filter="url(#glowf)"/>`);
    s.add(`<path d="${rune}" fill="none" stroke="${GREY.ink}" stroke-width="4" stroke-linecap="round" opacity=".5"/>`);
    s.add(`<path d="${rune}" fill="none" stroke="#f0ffd0" stroke-width="2.2" stroke-linecap="round"/>`);
    s.add(B(s, 'M29 77Q38 70 45 78Q52 69 62 74Q70 76 71 89L29 89Z', MOSS, 1.8, 'ms5'));
    s.add(path('M58 15Q66 13 70 22Q64 20 60 22Z', MOSS.mid, MOSS.ink, 1.1));
    s.add(tuft(s, 22, 91)); s.add(tuft(s, 78, 91, 0.9));
    s.add(flower(s, 37, 79, 1.8, '#f6e8ff')); s.add(flower(s, 65, 82, 1.5));
    s.fx.push(`<circle cx="22" cy="30" r="1.4" fill="#e8ffb0"/><circle cx="80" cy="22" r="1.1" fill="#e8ffb0"/><circle cx="76" cy="48" r="1.6" fill="#e8ffb0"/>`);
    return { shadow: 1 };
  },
  // 6 Mountain Peak
  (s) => {
    s.add(G(B(s, 'M8 87L35 34L46 47L63 20L93 87Z', ROCK, 2.4, 'mt'), 'grain'));
    s.add(path('M63 20L69 50L64 87L93 87Z', ROCK.lo, 'none', 0, 'opacity=".45"'));
    s.add(path('M35 34L40 56L32 87L8 87Z', ROCK.lo, 'none', 0, 'opacity=".25"'));
    s.add(B(s, 'M35 34L27 49L32 47L36 53L41 46L45 49L46 47Z', SHELL, 1.8, 'sn1'));
    s.add(B(s, 'M63 20L52 41L58 38L62 45L67 39L72 44L75 41L69 30Z', SHELL, 1.8, 'sn2'));
    s.add(hl('M60 26L54 38', 1.6, 0.9));
    s.add(`<path d="M69 50L76 70M44 56l-4 12M58 48l2 10" fill="none" stroke="${ROCK.ink}" stroke-width="1" opacity=".4"/>`);
    s.add(B(s, 'M8 87Q22 72 36 77Q50 68 64 76Q80 70 93 87Z', MOSS, 2, 'mtg'));
    const pine = (x, y, k) => B(s, `M${x} ${y - 14 * k}L${x + 5 * k} ${y - 7 * k}L${x + 3 * k} ${y - 7 * k}L${x + 7 * k} ${y}L${x - 7 * k} ${y}L${x - 3 * k} ${y - 7 * k}L${x - 5 * k} ${y - 7 * k}Z`, { hi: '#bfe890', mid: '#4f9a4a', lo: '#2a6a34', ink: '#163e1e' }, 1.4, 'pn') + `<path d="M${x} ${y}l0 ${2.5 * k}" stroke="${WOOD.ink}" stroke-width="${1.8 * k}"/>`;
    s.add(pine(24, 83, 0.9)); s.add(pine(32, 85, 0.7)); s.add(pine(74, 82, 0.85)); s.add(pine(82, 85, 0.65));
    s.fx.push(`<path d="M14 36Q18 30 25 33Q29 29 34 33Q37 35 34 38L16 38Q12 38 14 36Z" fill="#fff" stroke="${CLOUD.ink}" stroke-width="1" opacity=".95"/>`);
    return { shadow: 1 };
  },
  // 7 Floating Isle
  (s) => {
    s.back.push(`<ellipse cx="50" cy="44" rx="40" ry="34" fill="${s.glowGrad('#ffe39a', 0.7)}"/>`);
    s.add(`<path d="M38 74Q36 86 30 92M56 77Q58 88 63 94M47 79L47 93M64 70Q70 78 72 86" fill="none" stroke="${WOOD.ink}" stroke-width="2.2" stroke-linecap="round"/>`);
    s.add(`<path d="M38 74Q36 86 30 92M56 77Q58 88 63 94M47 79L47 93M64 70Q70 78 72 86" fill="none" stroke="${WOOD.mid}" stroke-width=".9" stroke-linecap="round"/>`);
    s.add(G(B(s, 'M13 55Q50 47 87 55Q78 70 61 79Q50 87 39 79Q22 70 13 55Z', EARTH, 2.4, 'isl'), 'grain'));
    s.add(`<path d="M18 61Q50 66 82 61M27 69Q50 74 72 69" fill="none" stroke="${EARTH.lo}" stroke-width="1.4" opacity=".7"/>`);
    s.add(B(s, 'M13 55Q50 44 87 55Q83 60 76 58Q70 62 62 59Q54 63 46 59Q38 62 30 58Q22 61 13 55Z', MOSS, 2, 'isg'));
    // a little waterfall spilling off the edge
    // tree
    s.add(path('M46 55Q44 40 50 31', 'none', WOOD.ink, 6.5));
    s.add(path('M46 55Q44 40 50 31', 'none', WOOD.mid, 3));
    const TREE = { hi: '#e2f8a8', mid: '#7cc254', lo: '#3e8030', ink: '#22501e' };
    for (const [x, y, r] of [[37, 28, 10], [63, 29, 9.5], [50, 17, 12.5], [49, 31, 9]]) s.add(B(s, circ(x, y, r), TREE, 2, 'tr'));
    s.add(`<circle cx="44" cy="14" r="2.4" fill="#fff" opacity=".45"/><circle cx="33" cy="24" r="1.8" fill="#fff" opacity=".4"/>`);
    for (const [x, y] of [[58, 22], [40, 33], [66, 33]]) s.add(`<circle cx="${x}" cy="${y}" r="1.6" fill="#ff6a5a" stroke="#7a1a10" stroke-width=".6"/>`);
    s.add(pebble(s, 73, 53, 5, 4, ROCK, 'is2')); s.add(pebble(s, 25, 54, 4.2, 3.4, GREY, 'is3'));
    s.add(flower(s, 32, 54, 1.5)); s.add(flower(s, 59, 55, 1.4, '#ffe0f0'));
    sparkle(s, 87, 22, 5); sparkle(s, 13, 30, 3.6);
    return { shadow: 1 };
  },
];

// ------------------------------------------------------------------ water

const water = [
  // 1 Bubbles
  (s) => { s.add(bubble(s, 44, 64, 13)); s.add(bubble(s, 62, 54, 8.5)); s.add(bubble(s, 60, 73, 5.5)); s.add(bubble(s, 30, 46, 3.5)); return { shadow: 1 }; },
  // 2 Seashell
  (s) => {
    s.add(B(s, 'M50 84L20 47Q22 25 50 21Q78 25 80 47Z', SHELL, 2.4, 'sh', '40%', '20%'));
    const ribs = [];
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.13 + i * 0.0925); ribs.push(`M50 82L${f1(50 - Math.cos(a) * 32)} ${f1(52 - Math.sin(a) * 30)}`); }
    s.add(`<path d="${ribs.join('')}" stroke="${SHELL.lo}" stroke-width="2.4" opacity=".6"/>`);
    s.add(`<path d="${ribs.join('')}" stroke="#fff" stroke-width=".9" opacity=".8" transform="translate(-1 0)"/>`);
    s.add(`<path d="M22 46Q50 40 78 46" fill="none" stroke="#f5b8d8" stroke-width="1.4" opacity=".6"/>`);
    s.add(B(s, 'M38 84L62 84L58 92L42 92Z', SHELL, 2, 'sh2'));
    s.add(`<path d="M44 86L44 90M50 86L50 91M56 86L56 90" stroke="${SHELL.lo}" stroke-width="1.1"/>`);
    s.add(`<circle cx="70" cy="85" r="5" fill="${s.rad({ hi: '#ffffff', mid: '#f8eef6', lo: '#d8b8d0', ink: '#7a5a7a' }, 'pearl', '35%', '30%')}" stroke="#7a5a7a" stroke-width="1.4"/><circle cx="68.4" cy="83.4" r="1.4" fill="#fff"/>`);
    s.add(hl('M28 44Q32 32 42 28', 2.4, 0.85));
    return { shadow: 1 };
  },
  // 3 Splash
  (s) => {
    s.add(B(s, 'M12 78Q12 66 50 66Q88 66 88 78Q88 89 50 89Q12 89 12 78Z', WATER, 2.4, 'pd', '40%', '30%'));
    s.add(`<ellipse cx="50" cy="78" rx="28" ry="6" fill="none" stroke="#fff" stroke-width="1.6" opacity=".6"/><ellipse cx="50" cy="78" rx="18" ry="3.6" fill="none" stroke="#fff" stroke-width="1.2" opacity=".5"/>`);
    s.add(B(s, 'M23 75Q26 52 33 45Q37 59 41 70Q45 40 52 33Q56 56 59 70Q64 47 69 42Q73 60 77 75Q50 83 23 75Z', FOAM, 2, 'spf'));
    s.add(`<path d="M30 70Q32 58 34 52M48 68Q50 50 52 40M64 70Q66 58 68 50" fill="none" stroke="${FOAM.lo}" stroke-width="1.2" opacity=".8"/>`);
    s.add(drop(s, 32, 33, 3.6)); s.add(drop(s, 53, 19, 4.6)); s.add(drop(s, 71, 30, 3.2)); s.add(drop(s, 82, 50, 2.2)); s.add(drop(s, 18, 52, 2.2));
    return { shadow: 1 };
  },
  // 4 Tide Orb
  (s) => {
    s.back.push(`<circle cx="50" cy="44" r="38" fill="${s.glowGrad('#9fdcff', 0.6)}"/>`);
    s.add(B(s, 'M34 82Q34 74 50 74Q66 74 66 82L70 90L30 90Z', METAL, 2, 'stand'));
    s.add(`<path d="M32 86Q50 89 68 86" fill="none" stroke="${METAL.lo}" stroke-width="1.2"/>`);
    s.add(s.rad ? `<circle cx="50" cy="46" r="29" fill="${s.rad({ hi: '#f4fcff', mid: '#cdeeff', lo: '#7ac4f2', ink: '#2a6ab0' }, 'orb', '38%', '30%')}" stroke="${WATER.ink}" stroke-width="2.4"/>` : '');
    // water inside the globe with waves on top
    s.defs.push('<clipPath id="orbclip"><circle cx="50" cy="46" r="27.6"/></clipPath>');
    s.add(`<g clip-path="url(#orbclip)"><path d="M18 48Q26 41 34 48T50 48T66 48T84 47L84 80L18 80Z" fill="${s.lin(['#4aa8f0', '#1a5cb0'])}"/>`
      + `<path d="M18 48Q26 41 34 48T50 48T66 48T84 47" fill="none" stroke="#fff" stroke-width="2" opacity=".9"/>`
      + `<path d="M18 58Q30 54 42 58T66 58T84 57" fill="none" stroke="#8fd4ff" stroke-width="1.2" opacity=".7"/>`
      + bubble(s, 40, 64, 2.4) + bubble(s, 58, 60, 1.8) + bubble(s, 50, 70, 1.4) + '</g>');
    s.add(`<ellipse cx="38" cy="32" rx="9" ry="5.4" fill="#fff" opacity=".85" transform="rotate(-35 38 32)"/><circle cx="64" cy="64" r="2.4" fill="#fff" opacity=".6"/>`);
    s.add(`<path d="M24 54A27 27 0 0 0 46 73" fill="none" stroke="#fff" stroke-width="1.6" opacity=".6"/>`);
    sparkle(s, 80, 20, 5.5); sparkle(s, 20, 24, 3.4);
    return { shadow: 1 };
  },
  // 5 Fountain
  (s) => {
    s.add(G(B(s, 'M12 74L88 74L82 89L18 89Z', STONE, 2.4, 'fb'), 'grain'));
    s.add(`<path d="M16 80L84 80" stroke="${STONE.lo}" stroke-width="1.2"/><path d="M30 74L28 89M50 74L50 89M70 74L72 89" stroke="${STONE.lo}" stroke-width="1" opacity=".7"/>`);
    s.add(B(s, 'M12 71Q50 64 88 71L88 76Q50 83 12 76Z', WATER, 2, 'fw'));
    s.add(`<path d="M20 73Q50 68 80 73" fill="none" stroke="#fff" stroke-width="1.4" opacity=".75"/>`);
    s.add(G(B(s, 'M44 73L42 50L58 50L56 73Z', STONE, 2, 'fp'), 'grain'));
    s.add(G(B(s, 'M27 50Q50 41 73 50Q71 58 50 58Q29 58 27 50Z', STONE, 2.2, 'ft'), 'grain'));
    s.add(`<ellipse cx="50" cy="49" rx="19" ry="3.4" fill="${WATER.mid}" stroke="${WATER.ink}" stroke-width="1"/>`);
    // arcs of water
    const arcs = 'M50 44Q50 24 50 14M50 20Q33 20 27 49M50 20Q67 20 73 49M28 54Q22 62 20 72M72 54Q78 62 80 72';
    s.add(`<path d="${arcs}" fill="none" stroke="${WATER.ink}" stroke-width="6.4" stroke-linecap="round"/><path d="${arcs}" fill="none" stroke="${WATER.mid}" stroke-width="3.6" stroke-linecap="round"/><path d="${arcs}" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>`);
    s.add(B(s, 'M46 16Q50 8 54 16Q52 19 50 18Q48 19 46 16Z', FOAM, 1.4, 'ftop'));
    s.add(drop(s, 18, 60, 2.4)); s.add(drop(s, 84, 60, 2.4)); s.add(drop(s, 40, 12, 2)); s.add(drop(s, 62, 10, 2));
    return { shadow: 1 };
  },
  // 6 Trident
  (s) => {
    s.back.push(`<circle cx="50" cy="48" r="40" fill="${s.glowGrad('#9fdcff', 0.65)}"/>`);
    const SIL = { hi: '#ffffff', mid: '#a6d4ff', lo: '#3a7ac8', ink: '#1e3e78' };
    s.add(`<path d="M18 74Q32 58 50 70T84 62" fill="none" stroke="${WATER.ink}" stroke-width="7.4" stroke-linecap="round"/><path d="M18 74Q32 58 50 70T84 62" fill="none" stroke="${WATER.mid}" stroke-width="4.4" stroke-linecap="round"/>`);
    s.add('<g transform="rotate(26 50 50)">');
    s.add(B(s, 'M47.6 34L52.4 34L52.4 97L47.6 97Z', { hi: '#ffe8b8', mid: '#c8963c', lo: '#8a5a1c', ink: '#4a2e0c' }, 1.6, 'shaft', '20%', '50%'));
    for (const y of [60, 72, 84]) s.add(`<rect x="46.6" y="${y}" width="6.8" height="3" rx="1" fill="${s.rad(METAL, 'band')}" stroke="${METAL.ink}" stroke-width="1"/>`);
    s.add(B(s, 'M29 32L29 14L33 5L37 14L37 29Q50 35 63 29L63 14L67 5L71 14L71 32Q61 43 50 41Q39 43 29 32Z', SIL, 2, 'tri'));
    s.add(B(s, 'M45.5 41L50 2L54.5 41Z', SIL, 2, 'tri2'));
    s.add(hl('M31 30L31 15M48.2 36L49.6 9', 1.2, 0.9));
    s.add(gem(s, 50, 37, 3, { hi: '#e6fbff', mid: '#38c2e8', lo: '#14709a', ink: '#0a3a5a' }));
    s.add('</g>');
    s.add(`<path d="M18 74Q32 58 50 70" fill="none" stroke="${WATER.ink}" stroke-width="7.4" stroke-linecap="round"/><path d="M18 74Q32 58 50 70" fill="none" stroke="${WATER.mid}" stroke-width="4.4" stroke-linecap="round"/><path d="M21 70Q32 61 44 66" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`);
    s.add(drop(s, 80, 44, 3.6)); s.add(drop(s, 86, 56, 2.2));
    sparkle(s, 20, 24, 5); sparkle(s, 76, 14, 3.4);
    return { shadow: 1 };
  },
  // 7 Great Wave
  (s) => {
    s.back.push(`<circle cx="50" cy="50" r="42" fill="${s.glowGrad('#7fd0ff', 0.6)}"/>`);
    const DEEP = { hi: '#bfe8ff', mid: '#3a9ae8', lo: '#14509e', ink: '#0c3470' };
    s.add(SB(s, 'M8 88Q12 50 42 26Q70 8 88 26Q70 22 60 34Q78 34 80 50Q70 42 58 46Q48 52 50 66Q52 80 70 88Z', DEEP, 2.6, 'gw', '60%', '20%'));
    s.add('<path d="M16 82Q20 56 38 40M28 86Q30 66 44 54M40 86Q40 74 48 66" fill="none" stroke="#fff" stroke-width="1.6" opacity=".5"/>');
    s.add(`<path d="M60 34Q66 32 72 36M58 46Q62 44 66 46" fill="none" stroke="${DEEP.lo}" stroke-width="1.2" opacity=".7"/>`);
    s.add(B(s, 'M40 27Q70 6 90 26Q80 30 72 26Q78 34 68 34Q60 28 54 36Q52 28 40 27Z', FOAM, 2, 'gf'));
    s.add(`<path d="M50 22Q60 16 70 18M76 22Q82 22 86 24" fill="none" stroke="${FOAM.lo}" stroke-width="1.1"/>`);
    s.add(B(s, 'M56 88Q68 79 92 85L92 92L52 92Z', FOAM, 2, 'gf2'));
    s.add(B(s, 'M8 86Q14 82 22 85L24 92L6 92Z', FOAM, 1.6, 'gf3'));
    s.add(drop(s, 92, 40, 3.4)); s.add(drop(s, 82, 12, 2.8)); s.add(drop(s, 94, 56, 2.2));
    for (const [x, y, r] of [[30, 30, 1.6], [26, 40, 1.1], [96, 30, 1.2]]) s.fx.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${WATER.ink}" stroke-width=".6"/>`);
    sparkle(s, 16, 20, 5.5); sparkle(s, 70, 60, 3.4);
    return { shadow: 1 };
  },
];

// ------------------------------------------------------------------ wind

const wind = [
  // 1 Wisp
  (s) => {
    s.back.push(`<circle cx="50" cy="64" r="22" fill="${s.glowGrad('#a8ffe0', 0.7)}"/>`);
    s.add(ribbon(swirlD(50, 62, 13), 4));
    s.add(gust(28, 80, 18, 1, 3));
    s.fx.push('<path d="M66 48q3 -2 6 0" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>');
    sparkle(s, 70, 40, 3.4, '#e6fff4'); sparkle(s, 30, 52, 2.4, '#e6fff4');
    return { shadow: 1 };
  },
  // 2 Dandelion
  (s) => {
    s.add(path('M50 90Q47 72 50 54', 'none', '#2e5a22', 4.4));
    s.add(path('M50 90Q47 72 50 54', 'none', '#7cc254', 2));
    s.add(leaf(s, 49, 82, 14, 205)); s.add(leaf(s, 50, 76, 12, -30));
    s.add(`<circle cx="50" cy="38" r="21" fill="${s.glowGrad('#ffffff', 0.9)}"/>`);
    const seeds = [];
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2, x = 50 + Math.cos(a) * 18, y = 38 + Math.sin(a) * 18;
      seeds.push(`<path d="M50 38L${f1(x)} ${f1(y)}" stroke="#d6e6de" stroke-width=".7"/>`);
      for (const da of [-0.22, 0, 0.22]) seeds.push(`<path d="M${f1(x)} ${f1(y)}L${f1(x + Math.cos(a + da) * 4)} ${f1(y + Math.sin(a + da) * 4)}" stroke="#fff" stroke-width=".9" stroke-linecap="round"/>`);
      seeds.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="1.1" fill="#fff" stroke="${CLOUD.ink}" stroke-width=".4"/>`);
    }
    s.add(`<circle cx="50" cy="38" r="22" fill="#f4fbff" fill-opacity=".5"/>`);
    s.add(seeds.join(''));
    s.add(B(s, circ(50, 38, 4.2), { hi: '#f4fff0', mid: '#b8d8a0', lo: '#6a9a50', ink: '#2e5a22' }, 1.2, 'dc'));
    for (const [x, y, r] of [[80, 18, 0], [86, 30, 30], [74, 8, -20]]) {
      s.fx.push(`<g transform="rotate(${r} ${x} ${y})"><path d="M${x} ${y}L${x - 5} ${y + 4}" stroke="#9ab8a8" stroke-width=".8"/><path d="M${x} ${y}l-2 -3M${x} ${y}l0 -3.6M${x} ${y}l2 -3" stroke="#fff" stroke-width="1" stroke-linecap="round"/><path d="M${x} ${y}l-2 -3M${x} ${y}l0 -3.6M${x} ${y}l2 -3" stroke="${CLOUD.ink}" stroke-width=".3"/></g>`);
    }
    s.fx.push(gust(70, 44, 6, 1, 2.2));
    return { shadow: 1 };
  },
  // 3 Pinwheel
  (s) => {
    s.add(G(B(s, 'M48 50L46 92L54 92L52 50Z', WOOD, 1.8, 'stk', '20%', '50%'), 'woodgrain'));
    const cols = [WIND, { hi: '#fff8e0', mid: '#ffe08a', lo: '#e0a83c', ink: '#7a5418' }, { hi: '#e8faff', mid: '#8fd8f8', lo: '#3a9ad0', ink: '#1e5a8a' }, { hi: '#fff0f6', mid: '#ffb0d0', lo: '#d86a9a', ink: '#7a2a52' }];
    for (let i = 0; i < 4; i++) {
      s.add(`<g transform="rotate(${i * 90 + 10} 50 44)">`);
      s.add(B(s, 'M50 44L50 13Q71 17 69 37Z', cols[i], 2, `pw${i}`));
      s.add(path('M50 44L69 37Q60 32 50 44Z', cols[i].lo, 'none', 0, 'opacity=".55"'));
      s.add(hl('M53 18Q64 21 66 30', 1.2, 0.8));
      s.add('</g>');
    }
    s.add(B(s, circ(50, 44, 4.6), METAL, 1.6, 'pin'));
    s.add(`<circle cx="48.6" cy="42.6" r="1.4" fill="#fff"/>`);
    s.fx.push(gust(76, 70, 6, 1, 2.2)); s.fx.push(gust(10, 30, 6, 1, 2.2));
    return { shadow: 1 };
  },
  // 4 Kite
  (s) => {
    s.add(`<path d="M50 74Q42 82 52 88Q62 94 50 100" fill="none" stroke="${WIND.ink}" stroke-width="1.8"/>`);
    for (const [y, c] of [[82, '#ffb0d0'], [93, '#ffe08a']]) s.add(path(`M44 ${y}L50 ${y - 3}L56 ${y}L50 ${y + 3}Z`, c, WIND.ink, 1.4) + path(`M48 ${y - 3.5}L52 ${y + 3.5}`, 'none', WIND.ink, 0.8));
    s.add(B(s, 'M50 9L79 40L50 74L21 40Z', WIND, 2.4, 'kite'));
    s.add(path('M50 9L50 40L21 40Z', '#fff', 'none', 0, 'opacity=".5"'));
    s.add(path('M50 40L79 40L50 74Z', WIND.lo, 'none', 0, 'opacity=".35"'));
    s.add(path('M50 9L79 40L50 40Z', '#ffe08a', 'none', 0, 'opacity=".5"'));
    s.add(`<path d="M50 9L50 74M21 40L79 40" stroke="${WOOD.ink}" stroke-width="2.4"/><path d="M50 9L50 74M21 40L79 40" stroke="${WOOD.mid}" stroke-width="1"/>`);
    s.add(`<path d="M50 9L79 40L50 74L21 40Z" fill="none" stroke="#fff" stroke-width=".8" stroke-dasharray="1.6 1.4" opacity=".75" transform="translate(50 41) scale(.88) translate(-50 -41)"/>`);
    s.add(ribbon(swirlD(64, 52, 5), 1.8));
    s.add(B(s, circ(50, 40, 2.6), METAL, 1.2, 'kc'));
    s.fx.push(gust(8, 64, 8, 1, 2.4)); s.fx.push(gust(78, 18, 6, 1, 2.2));
    return { shadow: 1 };
  },
  // 5 Wind Chime
  (s) => {
    s.add(`<path d="M50 4L50 16" stroke="${WOOD.ink}" stroke-width="2.6"/><circle cx="50" cy="4" r="2.4" fill="none" stroke="${WOOD.ink}" stroke-width="1.6"/>`);
    s.add(G(B(s, 'M18 22Q50 9 82 22L80 29Q50 18 20 29Z', WOOD, 2.2, 'cht'), 'woodgrain'));
    const TUBE = { hi: '#f4fffa', mid: '#9ce8cc', lo: '#2e9a7a', ink: '#145a48' };
    for (const [x, len] of [[29, 42], [40, 54], [60, 50], [71, 38]]) {
      s.add(`<path d="M${x} 25L${x} 31" stroke="${CLOUD.ink}" stroke-width="1.2"/>`);
      s.add(B(s, `M${x - 4} 31L${x + 4} 31L${x + 4} ${31 + len}L${x - 4} ${31 + len}Z`, TUBE, 1.8, 'tube', '20%', '30%'));
      s.add(`<ellipse cx="${x}" cy="31" rx="4" ry="1.2" fill="${TUBE.ink}"/>`);
      s.add(hl(`M${x - 2} 34L${x - 2} ${29 + len}`, 1.2, 0.9));
    }
    s.add(`<path d="M50 23L50 64" stroke="${CLOUD.ink}" stroke-width="1.2"/>`);
    s.add(B(s, circ(50, 52, 4.2), WOOD, 1.4, 'clap'));
    s.add(B(s, 'M43 64L57 64L50 82Z', { hi: '#fff8e0', mid: '#ffe08a', lo: '#e0a83c', ink: '#7a5418' }, 1.8, 'sail'));
    s.add(`<path d="M50 66L50 77" stroke="#7a5418" stroke-width=".8" opacity=".6"/>`);
    s.fx.push(gust(4, 52, 8)); s.fx.push(gust(76, 64, 9));
    s.fx.push(`<path d="M22 72q2 -3 0 -6M78 30q2 -3 0 -6" fill="none" stroke="${WIND.lo}" stroke-width="1.2" stroke-linecap="round"/>`);
    return { shadow: 1 };
  },
  // 6 Tornado
  (s) => {
    s.back.push(`<ellipse cx="50" cy="48" rx="40" ry="38" fill="${s.glowGrad('#b8f5e0', 0.6)}"/>`);
    const bands = [[50, 17, 34, 7.6], [52, 30, 28, 6.6], [50, 42, 22, 5.8], [48, 53.5, 16.5, 4.8], [50, 64, 12, 4], [50, 73, 8, 3.2], [50, 80.5, 4.8, 2.4]];
    bands.forEach(([x, y, rx, ry], i) => {
      const d = `M${x - rx} ${y}Q${x - rx} ${y + ry * 1.6} ${x} ${y + ry * 1.6}Q${x + rx} ${y + ry * 1.6} ${x + rx} ${y}Q${x + rx} ${y - ry} ${x} ${y - ry}Q${x - rx} ${y - ry} ${x - rx} ${y}Z`;
      s.add(B(s, d, WIND, 2, 'tw', '30%', '25%'));
      s.add(hl(`M${x - rx * 0.75} ${y + ry * 0.2}Q${x - rx * 0.5} ${y + ry * 1.1} ${x} ${y + ry * 1.15}`, 1.5, 0.85));
      s.add(`<path d="M${f1(x + rx * 0.2)} ${f1(y - ry * 0.35)}Q${f1(x + rx * 0.65)} ${f1(y - ry * 0.2)} ${f1(x + rx * 0.8)} ${f1(y + ry * 0.4)}" fill="none" stroke="${WIND.lo}" stroke-width="1.1" opacity=".55"/>`);
      if (i === 0) s.add(`<ellipse cx="${x}" cy="${y - 0.5}" rx="${rx * 0.75}" ry="${ry * 0.5}" fill="${WIND.lo}" opacity=".4"/>`);
    });
    s.add(`<path d="M50 86L50 91" stroke="${WIND.ink}" stroke-width="2.6" stroke-linecap="round"/>`);
    s.add(pebble(s, 18, 46, 4, 3, GREY, 'td1')); s.add(pebble(s, 84, 34, 3.4, 2.4, ROCK, 'td2'));
    s.add(leaf(s, 78, 60, 7, 30)); s.add(leaf(s, 16, 66, 6, -150, { hi: '#fff2b8', mid: '#e6c04a', lo: '#a8801c', ink: '#5a4210' }));
    s.add(G(B(s, 'M76 76L84 76L83 80L77 80Z', WOOD, 1, 'pl'), 'woodgrain'));
    return { shadow: 1 };
  },
  // 7 Storm Cloud
  (s) => {
    s.back.push(`<ellipse cx="50" cy="48" rx="44" ry="38" fill="${s.glowGrad('#b8f5e0', 0.55)}"/>`);
    const BOLT = { hi: '#fffbd0', mid: '#ffe060', lo: '#e8a820', ink: '#8a5a10' };
    s.add(`<path d="M46 58L36 76L46 76L40 94L60 70L50 70L58 58Z" fill="#fff6a0" opacity=".8" filter="url(#glowf)"/>`);
    s.add(B(s, 'M46 58L36 76L46 76L40 94L60 70L50 70L58 58Z', BOLT, 2, 'bolt'));
    s.add(hl('M46 60L39 74', 1.2, 0.9));
    for (const [x, y] of [[26, 70], [70, 74], [32, 82], [76, 86]]) s.add(drop(s, x, y, 2.2));
    const STORM = { hi: '#ffffff', mid: '#e2e8f4', lo: '#9aa8c4', ink: '#4a5a7e' };
    for (const [x, y, r] of [[25, 47, 13.5], [44, 34, 18], [65, 35, 16], [80, 48, 12], [53, 50, 14], [35, 53, 11]]) s.add(SB(s, circ(x, y, r), STORM, 2.2, 'cl', '35%', '25%'));
    s.add(`<path d="M14 54Q50 64 90 55L88 60Q50 70 15 60Z" fill="${STORM.lo}" opacity=".7"/>`);
    s.add(ribbon(swirlD(46, 38, 7), 2.4));
    s.add(ribbon(swirlD(68, 41, 5), 2));
    s.fx.push(gust(2, 70, 12)); s.fx.push(gust(72, 80, 12));
    sparkle(s, 88, 18, 5);
    return { shadow: 1 };
  },
];

// ------------------------------------------------------------------ fire

const fire = [
  // 1 Ember
  (s) => {
    s.back.push(`<circle cx="50" cy="62" r="26" fill="${s.glowGrad('#ffd27a', 0.8)}"/>`);
    s.add(flame(s, 50, 76, 30, 44, 1));
    const COAL = { hi: '#ffc070', mid: '#a8402a', lo: '#4a1a14', ink: '#2a0e0a' };
    s.add(G(B(s, 'M34 80Q36 70 46 71Q56 68 64 73Q70 78 66 84Q50 89 36 86Z', COAL, 2, 'coal'), 'grain'));
    s.add(`<path d="M42 78l5 2l4 -3M56 75l3 4" fill="none" stroke="#ffb040" stroke-width="1.4" stroke-linecap="round"/>`);
    glowDot(s, 70, 34, 1.6, '#ffd27a'); glowDot(s, 30, 44, 1.2, '#ffb63c');
    sparkle(s, 70, 46, 3.4, '#fff6c4');
    return { shadow: 1 };
  },
  // 2 Candle
  (s) => {
    s.back.push(`<circle cx="50" cy="30" r="18" fill="${s.glowGrad('#ffd27a', 0.7)}"/>`);
    s.add(B(s, 'M27 85Q27 78 50 78Q73 78 73 85Q73 91 50 91Q27 91 27 85Z', METAL, 2, 'dish'));
    s.add(path('M71 83Q80 80 80 86Q80 90 72 88', 'none', METAL.ink, 3.6));
    s.add(path('M71 83Q80 80 80 86Q80 90 72 88', 'none', METAL.mid, 1.6));
    s.add(`<ellipse cx="50" cy="81" rx="13" ry="3" fill="${METAL.lo}"/>`);
    s.add(B(s, 'M40 82L40 42Q50 37 60 42L60 82Z', WAX, 2, 'wax', '25%', '30%'));
    s.add(path('M40 44Q40 54 43 55Q45 56 45 48Q47 52 49 51Q50 46 52 47Q54 58 57 56Q58 50 60 46L60 42Q50 37 40 42Z', WAX.hi, WAX.lo, 1));
    s.add(hl('M43 58L43 78', 2, 0.8));
    s.add(`<ellipse cx="50" cy="41.5" rx="8" ry="2" fill="${WAX.lo}" opacity=".6"/>`);
    s.add(`<path d="M50 41L50 36" stroke="#3a2010" stroke-width="1.6"/>`);
    s.add(flame(s, 50, 38, 14, 24, 1));
    return { shadow: 1 };
  },
  // 3 Candelabra
  (s) => {
    s.back.push(`<ellipse cx="50" cy="34" rx="34" ry="18" fill="${s.glowGrad('#ffd27a', 0.7)}"/>`);
    s.add(path('M25 64Q25 76 50 76Q75 76 75 64', 'none', METAL.ink, 6));
    s.add(path('M25 64Q25 76 50 76Q75 76 75 64', 'none', METAL.mid, 3));
    s.add(hl('M27 66Q30 73 40 74', 1, 0.8));
    s.add(B(s, 'M46 76L44 87L56 87L54 76Z', METAL, 1.8, 'cs'));
    s.add(B(s, 'M33 91Q34 85 50 85Q66 85 67 91Z', METAL, 1.8, 'cb'));
    s.add(gem(s, 50, 80, 2, { hi: '#ffe0e0', mid: '#e83a3a', lo: '#8a1414', ink: '#4a0808' }));
    for (const [x, by, h, w] of [[25, 64, 22, 10], [75, 64, 22, 10], [50, 74, 34, 12]]) {
      s.add(B(s, `M${x - 7} ${by}Q${x} ${by + 4} ${x + 7} ${by}L${x + 6} ${by - 2}L${x - 6} ${by - 2}Z`, METAL, 1.4, 'cup'));
      s.add(B(s, `M${x - w / 2} ${by - 2}L${x - w / 2} ${by - h}Q${x} ${by - h - 3} ${x + w / 2} ${by - h}L${x + w / 2} ${by - 2}Z`, WAX, 1.6, 'wax', '25%', '30%'));
      s.add(path(`M${x - w / 2} ${by - h + 1}Q${x - w / 2} ${by - h + 7} ${x - w * 0.2} ${by - h + 7}Q${x} ${by - h + 4} ${x + w * 0.2} ${by - h + 9}Q${x + w / 2} ${by - h + 8} ${x + w / 2} ${by - h + 1}Z`, WAX.hi, 'none', 0, 'opacity=".9"'));
      s.add(hl(`M${x - w * 0.25} ${by - h + 8}L${x - w * 0.25} ${by - 4}`, 1.3, 0.8));
      s.add(`<path d="M${x} ${by - h - 1}L${x} ${by - h - 4}" stroke="#3a2010" stroke-width="1.4"/>`);
      s.add(flame(s, x, by - h - 2, w * 0.95, w * 1.6, 0.6));
    }
    return { shadow: 1 };
  },
  // 4 Lantern
  (s) => {
    s.back.push(`<circle cx="50" cy="56" r="34" fill="${s.glowGrad('#ffd27a', 0.75)}"/>`);
    const RED = { hi: '#ffa080', mid: '#d84a2a', lo: '#8a2418', ink: '#4a1008' };
    s.add(path('M43 18Q50 5 57 18', 'none', IRON.ink, 4)); s.add(path('M43 18Q50 5 57 18', 'none', IRON.mid, 1.8));
    s.add(B(s, 'M33 27L67 27L60 17L40 17Z', RED, 2, 'lt'));
    s.add(`<circle cx="50" cy="15.6" r="2.6" fill="${s.rad(METAL, 'kn')}" stroke="${METAL.ink}" stroke-width="1"/>`);
    s.add(path('M32 29L68 29L64 82L36 82Z', s.lin(['#fff2c8@.85', '#ffd27a@.75']), RED.ink, 2.2));
    s.add(`<ellipse cx="50" cy="62" rx="12" ry="14" fill="${s.glowGrad('#fff6c4', 1)}"/>`);
    s.add(flame(s, 50, 72, 18, 30, 1));
    s.add(B(s, 'M45 74L55 74L56 78L44 78Z', WAX, 1, 'lw'));
    s.add(`<path d="M41 30L39 81M59 30L61 81" stroke="${RED.ink}" stroke-width="3"/><path d="M41 30L39 81M59 30L61 81" stroke="${RED.mid}" stroke-width="1.2"/>`);
    s.add(B(s, 'M30 26L70 26L70 31L30 31Z', RED, 1.6, 'lband'));
    s.add(B(s, 'M29 81L71 81L68 92L32 92Z', RED, 2, 'lbase'));
    s.add(`<path d="M31 86.5L69 86.5" stroke="${METAL.mid}" stroke-width="1.4"/>`);
    for (const x of [33, 67]) s.add(rivet(s, x, 28.5, 1.1, METAL));
    s.add(hl('M35 34L37.5 78', 2.2, 0.8));
    return { shadow: 1 };
  },
  // 5 Brazier
  (s) => {
    s.back.push(`<ellipse cx="50" cy="40" rx="36" ry="30" fill="${s.glowGrad('#ffc46a', 0.75)}"/>`);
    s.add(`<path d="M33 70L26 93M67 70L74 93M50 72L50 93" stroke="${IRON.ink}" stroke-width="5.4" stroke-linecap="round"/><path d="M33 70L26 93M67 70L74 93M50 72L50 93" stroke="${IRON.mid}" stroke-width="2.2" stroke-linecap="round"/>`);
    s.add(path('M30 86Q50 90 70 86', 'none', IRON.ink, 2));
    s.add(flame(s, 50, 58, 48, 54, 1)); s.add(flame(s, 34, 58, 22, 30, -3)); s.add(flame(s, 66, 58, 22, 32, 3));
    s.add(G(B(s, 'M17 53Q50 49 83 53Q79 76 50 76Q21 76 17 53Z', IRON, 2.4, 'bowl'), 'grain'));
    s.add(`<path d="M17 53Q50 59 83 53" fill="none" stroke="${IRON.ink}" stroke-width="2"/>`);
    const COAL = '#3a1a14';
    for (const [x, y, r] of [[30, 55, 4], [42, 56.5, 4.6], [56, 56.5, 4.4], [69, 55, 3.8]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${COAL}" stroke="#ff8a3c" stroke-width="1.2"/>`);
    s.add(`<path d="M22 62Q50 68 78 62" fill="none" stroke="${IRON.lo}" stroke-width="1.2"/>`);
    for (const x of [26, 38, 50, 62, 74]) s.add(rivet(s, x, x === 50 ? 66.5 : 64 + Math.abs(50 - x) * -0.08, 1.1, IRON));
    s.add(hl('M24 60Q30 70 42 73', 2, 0.55));
    glowDot(s, 80, 22, 1.6, '#ffd27a'); glowDot(s, 20, 28, 1.3, '#ffb63c'); glowDot(s, 60, 6, 1.1, '#ffe9a8');
    return { shadow: 1 };
  },
  // 6 Phoenix Feather
  (s) => {
    s.back.push(`<circle cx="50" cy="48" r="38" fill="${s.glowGrad('#ffb46a', 0.7)}"/>`);
    s.add('<g transform="rotate(28 50 50)">');
    const FE = { hi: '#fff3b0', mid: '#ff9a3c', lo: '#d8402a', ink: '#7a1a10' };
    s.add(SB(s, 'M50 6Q75 28 67 61Q61 80 50 86Q39 80 33 61Q25 28 50 6Z', FE, 2.4, 'fe', '50%', '25%'));
    s.add(path('M50 12Q63 34 59 60Q55 74 50 80Q45 74 41 60Q37 34 50 12Z', s.lin(['#ffe27a', '#ffb43c']), 'none', 0, 'opacity=".85"'));
    s.add(path('M50 20Q56 36 54 54Q52 64 50 68Q48 64 46 54Q44 36 50 20Z', '#fff6c8', 'none', 0, 'opacity=".75"'));
    // barbs
    const barbs = [];
    for (let i = 0; i < 9; i++) { const y = 22 + i * 7; barbs.push(`M50 ${y + 5}Q${58 + (i < 5 ? i : 9 - i)} ${y} ${64 - Math.abs(i - 4) * 1.2} ${y - 2}M50 ${y + 5}Q${42 - (i < 5 ? i : 9 - i)} ${y} ${36 + Math.abs(i - 4) * 1.2} ${y - 2}`); }
    s.add(`<path d="${barbs.join('')}" fill="none" stroke="${FE.lo}" stroke-width="1.1" opacity=".7"/>`);
    // notches in the vane
    s.add(path('M67 50L60 52L66 56Z', '#fff0', 'none'));
    s.add(`<path d="M50 14L50 98" stroke="${FE.ink}" stroke-width="3" stroke-linecap="round"/><path d="M50 14L50 98" stroke="#ffd27a" stroke-width="1.2" stroke-linecap="round"/>`);
    s.add(path('M47 86Q44 92 47 96M53 86Q56 92 53 96', 'none', FE.lo, 1.4));
    s.add('</g>');
    s.add(flame(s, 31, 32, 15, 22, -2, 'pf')); s.add(flame(s, 24, 46, 8, 12, -1, 'pf2'));
    glowDot(s, 78, 20, 1.6, '#ffd27a'); glowDot(s, 74, 70, 1.3, '#ffb63c');
    sparkle(s, 80, 32, 5, '#fff6c4'); sparkle(s, 20, 70, 4, '#fff6c4');
    return { shadow: 1 };
  },
  // 7 Dragon Egg
  (s) => {
    s.back.push(`<circle cx="50" cy="50" r="42" fill="${s.glowGrad('#ff9a5a', 0.7)}"/>`);
    s.add(flame(s, 23, 86, 22, 36, -3, 'de1')); s.add(flame(s, 77, 86, 22, 38, 3, 'de2'));
    const EGG = { hi: '#ffd08a', mid: '#f0603a', lo: '#a82a20', ink: '#6a1410' };
    s.add(SB(s, 'M50 9Q77 11 79 53Q79 88 50 88Q21 88 21 53Q23 11 50 9Z', EGG, 2.6, 'egg', '35%', '25%'));
    s.defs.push('<clipPath id="eggclip"><path d="M50 9Q77 11 79 53Q79 88 50 88Q21 88 21 53Q23 11 50 9Z"/></clipPath>');
    const sc = [];
    for (let row = 0; row < 7; row++) for (let i = 0; i < 7; i++) {
      const x = 22 + i * 9.5 + (row % 2) * 4.75, y = 22 + row * 9.4;
      sc.push(`M${x - 4.8} ${y}Q${x} ${y + 7} ${x + 4.8} ${y}`);
    }
    s.add(`<g clip-path="url(#eggclip)"><path d="${sc.join('')}" fill="none" stroke="${EGG.ink}" stroke-width="1.3" opacity=".45"/><path d="${sc.join('')}" fill="none" stroke="#ffd08a" stroke-width=".8" opacity=".5" transform="translate(-.6 -1.4)"/></g>`);
    // glowing cracks
    const crack = 'M47 34L53 44L45 52L54 62L48 72M53 44L63 42L67 50M45 52L35 54L32 60M54 62L63 66';
    s.add(`<ellipse cx="50" cy="52" rx="16" ry="22" fill="${s.glowGrad('#ffd27a', 0.55)}"/>`);
    s.add(`<path d="${crack}" fill="none" stroke="#ffd27a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".9" filter="url(#glowf)"/><path d="${crack}" fill="none" stroke="${EGG.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${crack}" fill="none" stroke="#fff3b0" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`);
    s.add(`<ellipse cx="38" cy="27" rx="7" ry="11" fill="#fff" opacity=".45" transform="rotate(22 38 27)"/>`);
    const COAL = { hi: '#ffb070', mid: '#7a2a1a', lo: '#3a120c', ink: '#200806' };
    s.add(G(B(s, 'M24 84Q28 77 38 80Q46 76 54 80Q64 76 72 81Q80 83 77 90Q50 95 23 90Z', COAL, 2, 'nest'), 'grain'));
    s.add(`<path d="M32 84l4 2M48 82l4 3l3 -2M64 83l4 2" fill="none" stroke="#ffb040" stroke-width="1.2" stroke-linecap="round"/>`);
    sparkle(s, 82, 18, 6, '#fff6c4');
    glowDot(s, 16, 30, 1.6, '#ffd27a'); glowDot(s, 86, 44, 1.3, '#ffb63c');
    return { shadow: 1 };
  },
];

export const ITEMS = { earth, water, wind, fire };
export const itemFill = (lv) => Math.min(0.95, 0.68 + lv * 0.04);
export { flame, bubble, drop, pebble, glowDot, ribbon, gust, swirlD, flower };
