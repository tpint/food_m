// Painted gold & mana chains and UI icons for Arcane Merge.
import { f1, METAL, path, hl, sparkle, gem, rivet } from './paint-generators.mjs';
import { B, SB, G, circ, WOOD, WAX, STONE } from './items.mjs';

const GOLD = { hi: '#fff8cc', mid: '#ffd147', lo: '#e09a1c', ink: '#7a4a08' };
const MANA = { hi: '#ffe8f6', mid: '#ff85cb', lo: '#d63f98', ink: '#7a1a56' };
const GLASS = { hi: '#ffffff', mid: '#f4f8ff', lo: '#cfd8f0', ink: '#5a3a7a' };
const ARCANE = { hi: '#f2e4ff', mid: '#ae7bec', lo: '#6a3fb8', ink: '#3a2070' };
const RUBY = { hi: '#ffe0e0', mid: '#e83a3a', lo: '#8a1414', ink: '#4a0808' };

/** A gold coin face with a rim, star emblem and shine. */
function coin(s, cx, cy, r, key = 'cn') {
  let o = B(s, circ(cx, cy, r), GOLD, Math.max(1.4, r * 0.1), key, '35%', '28%');
  o += `<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.74)}" fill="none" stroke="${GOLD.lo}" stroke-width="${f1(r * 0.08)}"/>`;
  o += `<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.74)}" fill="none" stroke="#fff6c2" stroke-width="${f1(r * 0.04)}" transform="translate(${f1(-r * 0.04)} ${f1(-r * 0.05)})"/>`;
  const k = r * 0.42, pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? k * 0.45 : k; pts.push(`${f1(cx + Math.cos(a) * rr)} ${f1(cy + Math.sin(a) * rr)}`); }
  o += `<path d="M${pts.join('L')}Z" fill="${GOLD.lo}" stroke="${GOLD.ink}" stroke-width="${f1(r * 0.05)}" stroke-linejoin="round" opacity=".85"/>`;
  o += `<path d="M${pts.slice(0, 3).join('L')}" fill="none" stroke="#fff6c2" stroke-width="${f1(r * 0.04)}" opacity=".9"/>`;
  o += hl(`M${f1(cx - r * 0.72)} ${f1(cy - r * 0.1)}A${r * 0.74} ${r * 0.74} 0 0 1 ${f1(cx - r * 0.1)} ${f1(cy - r * 0.72)}`, Math.max(1, r * 0.1), 0.85);
  return o;
}

/** A coin seen edge-on, for stacks. */
function coinSide(s, cx, by, w, key = 'cs') {
  let o = B(s, `M${cx - w / 2} ${by - 4}L${cx - w / 2} ${by}Q${cx} ${by + 6} ${cx + w / 2} ${by}L${cx + w / 2} ${by - 4}Z`, GOLD, 1.8, key + 'e', '50%', '100%');
  for (let i = 1; i < 8; i++) { const x = cx - w / 2 + (w * i) / 8; o += `<path d="M${f1(x)} ${f1(by - 3 + Math.abs(i - 4) * -0.2)}L${f1(x)} ${f1(by + 2.5 - Math.abs(i - 4) * 0.6)}" stroke="${GOLD.lo}" stroke-width=".8"/>`; }
  o += B(s, `M${cx - w / 2} ${by - 4}Q${cx} ${by - 10} ${cx + w / 2} ${by - 4}Q${cx} ${by + 2} ${cx - w / 2} ${by - 4}Z`, GOLD, 1.8, key + 't', '35%', '30%');
  o += `<ellipse cx="${cx}" cy="${by - 4}" rx="${f1(w * 0.3)}" ry="2" fill="none" stroke="${GOLD.lo}" stroke-width=".9"/>`;
  o += hl(`M${f1(cx - w * 0.36)} ${by - 4.6}Q${f1(cx - w * 0.15)} ${by - 7} ${f1(cx + w * 0.05)} ${by - 7}`, 1, 0.9);
  return o;
}

const coinArt = [
  (s) => { s.back.push(`<circle cx="50" cy="54" r="30" fill="${s.glowGrad('#ffe58a', 0.6)}"/>`); s.add(coin(s, 50, 54, 22)); sparkle(s, 71, 31, 5); sparkle(s, 28, 74, 2.6); return { shadow: 1 }; },
  (s) => {
    for (let i = 0; i < 5; i++) s.add(coinSide(s, 40, 86 - i * 8, 34));
    for (let i = 0; i < 3; i++) s.add(coinSide(s, 65, 87 - i * 8, 30, 'cs2'));
    s.add(`<g transform="rotate(-18 72 52)">${coin(s, 72, 52, 10, 'cnl')}</g>`);
    sparkle(s, 82, 34, 5); sparkle(s, 20, 40, 3);
    return { shadow: 1 };
  },
  (s) => {
    const BAG = { hi: '#f6e0b4', mid: '#c99a5a', lo: '#8a5e2e', ink: '#4a2e10' };
    s.add(G(SB(s, 'M50 33Q81 37 81 66Q81 89 50 89Q19 89 19 66Q19 37 50 33Z', BAG, 2.4, 'bag', '35%', '25%'), 'grain'));
    s.add(`<path d="M30 48Q34 62 32 78M68 48Q66 62 70 78" fill="none" stroke="${BAG.lo}" stroke-width="1.4" opacity=".6"/>`);
    s.add(`<path d="M24 74Q50 82 76 74" fill="none" stroke="${BAG.hi}" stroke-width="1" stroke-dasharray="2 1.6" opacity=".8"/>`);
    s.add(G(SB(s, 'M40 34Q35 21 44 17Q50 23 56 17Q65 21 60 34Z', BAG, 2.2, 'bagt'), 'grain'));
    s.add(`<path d="M44 18Q46 26 45 32M56 18Q54 26 55 32" fill="none" stroke="${BAG.lo}" stroke-width="1"/>`);
    s.add(path('M37 34Q50 41 63 34', 'none', '#5a1018', 5.6) + path('M37 34Q50 41 63 34', 'none', '#e04a52', 3));
    s.add(B(s, 'M58 36L66 46L60 47L56 39Z', { hi: '#ffb0b0', mid: '#e04a52', lo: '#9a1a24', ink: '#5a1018' }, 1.2, 'tie'));
    s.add(coin(s, 50, 64, 12, 'bc'));
    // coins spilling from the top
    s.add(coin(s, 77, 82, 6, 'bc2')); s.add(coin(s, 24, 86, 4.6, 'bc3'));
    s.add(hl('M27 56Q27 72 37 81', 2.6, 0.45));
    sparkle(s, 76, 30, 4.4);
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="48" r="44" fill="${s.glowGrad('#ffe58a', 0.75)}"/>`);
    s.back.push(`<path d="M30 46L22 8M50 40L50 0M70 46L78 8" stroke="#fff3a8" stroke-width="6" stroke-linecap="round" opacity=".5" filter="url(#glowf)"/>`);
    s.add(G(SB(s, 'M17 50L83 50L81 89L19 89Z', WOOD, 2.4, 'chest'), 'woodgrain'));
    // heap of coins and a gem inside the open chest
    s.add(B(s, 'M18 52Q30 34 50 38Q70 34 82 52Z', GOLD, 2, 'heap'));
    for (const [x, y, r] of [[30, 44, 7], [46, 38, 8], [63, 40, 7.4], [74, 48, 5]]) s.add(coin(s, x, y, r, 'hc'));
    s.add(gem(s, 54, 46, 4, RUBY, RUBY.ink));
    s.add(`<g transform="rotate(-10 16 50) translate(0 -7)">${G(SB(s, 'M16 50Q16 23 50 21Q84 23 84 50Z', WOOD, 2.4, 'lid'), 'woodgrain')}<path d="M16 50Q16 23 50 21Q84 23 84 50" fill="none" stroke="${METAL.ink}" stroke-width="5"/><path d="M16 50Q16 23 50 21Q84 23 84 50" fill="none" stroke="${METAL.mid}" stroke-width="2.4"/><path d="M30 46Q30 28 32 25M70 46Q70 28 68 25" stroke="${METAL.ink}" stroke-width="4.4" fill="none"/><path d="M30 46Q30 28 32 25M70 46Q70 28 68 25" stroke="${METAL.mid}" stroke-width="2" fill="none"/></g>`);
    s.add(`<path d="M18 62L82 62M30 50L30 89M70 50L70 89" stroke="${METAL.ink}" stroke-width="5.4"/><path d="M18 62L82 62M30 50L30 89M70 50L70 89" stroke="${METAL.mid}" stroke-width="2.6"/>`);
    for (const [x, y] of [[30, 56], [70, 56], [30, 82], [70, 82], [22, 62], [78, 62]]) s.add(rivet(s, x, y, 1.2, METAL));
    s.add(B(s, 'M43.5 59L56.5 59L56.5 73L43.5 73Z', METAL, 1.8, 'lock'));
    s.add(`<circle cx="50" cy="64.6" r="1.8" fill="${METAL.ink}"/><path d="M50 65L50 69" stroke="${METAL.ink}" stroke-width="1.6"/>`);
    sparkle(s, 82, 16, 6); sparkle(s, 20, 18, 4.4); sparkle(s, 60, 6, 3.4);
    return { shadow: 1 };
  },
];

function manaLiquid(s, d, key) {
  return path(d, s.rad(MANA, key, '40%', '20%')) + `<g opacity=".9">${path(d, 'none', '#fff', 0)}</g>`;
}

const manaArt = [
  (s) => {
    s.back.push(`<circle cx="50" cy="58" r="26" fill="${s.glowGrad('#ffb0dc', 0.75)}"/>`);
    s.add(SB(s, 'M50 24Q69 49 69 62Q69 79 50 79Q31 79 31 62Q31 49 50 24Z', MANA, 2.4, 'md', '38%', '45%'));
    s.add(`<path d="M50 34Q60 50 61 60" fill="none" stroke="${MANA.lo}" stroke-width="1.2" opacity=".55"/>`);
    s.add(`<ellipse cx="42" cy="60" rx="4" ry="7.4" fill="#fff" opacity=".75"/><circle cx="57" cy="70" r="1.8" fill="#fff" opacity=".7"/>`);
    s.add(`<path d="M50 50l1.6 3.4l3.6.4l-2.7 2.4l.8 3.6l-3.3 -1.9l-3.3 1.9l.8 -3.6l-2.7 -2.4l3.6 -.4z" fill="#fff" opacity=".9"/>`);
    sparkle(s, 68, 33, 4.4, '#ffe8f6'); sparkle(s, 30, 40, 2.6, '#ffe8f6');
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="62" r="28" fill="${s.glowGrad('#ffb0dc', 0.7)}"/>`);
    const body = 'M42 22L58 22L58 40Q70 50 70 66Q70 86 50 86Q30 86 30 66Q30 50 42 40Z';
    s.add(path(body, s.rad(GLASS, 'gl', '35%', '30%'), GLASS.ink, 2.4, 'fill-opacity=".75"'));
    s.defs.push(`<clipPath id="vialc"><path d="${body}"/></clipPath>`);
    s.add(`<g clip-path="url(#vialc)"><path d="M28 60Q40 55 50 60T72 59L72 90L28 90Z" fill="${s.rad(MANA, 'vl', '40%', '20%')}"/><path d="M28 60Q40 55 50 60T72 59" fill="none" stroke="#ffd0ec" stroke-width="1.6"/>`
      + `<circle cx="42" cy="74" r="2" fill="#fff" opacity=".7"/><circle cx="56" cy="78" r="1.4" fill="#fff" opacity=".6"/><circle cx="50" cy="68" r="1" fill="#fff" opacity=".7"/></g>`);
    s.add(`<path d="${body}" fill="none" stroke="${GLASS.ink}" stroke-width="2.4" stroke-linejoin="round"/>`);
    s.add(`<path d="M42 40L58 40" stroke="${GLASS.lo}" stroke-width="1.2"/>`);
    s.add(G(B(s, 'M40 13L60 13L59 23L41 23Z', WOOD, 2, 'cork'), 'woodgrain'));
    s.add(hl('M37 52Q33 64 37 76', 2.6, 0.85)); s.add(hl('M45 26L45 38', 1.6, 0.8));
    sparkle(s, 71, 28, 5, '#ffe8f6');
    return { shadow: 1 };
  },
  (s) => {
    s.back.push(`<circle cx="50" cy="58" r="40" fill="${s.glowGrad('#ffb0dc', 0.75)}"/>`);
    const body = 'M42 14L58 14L58 34Q82 42 82 64Q82 90 50 90Q18 90 18 64Q18 42 42 34Z';
    s.add(path(body, s.rad(GLASS, 'gl2', '35%', '30%'), GLASS.ink, 2.4, 'fill-opacity=".75"'));
    s.defs.push(`<clipPath id="flaskc"><path d="${body}"/></clipPath>`);
    s.add(`<g clip-path="url(#flaskc)"><path d="M14 58Q30 50 44 57T86 55L86 94L14 94Z" fill="${s.rad(MANA, 'fl', '40%', '20%')}"/><path d="M14 58Q30 50 44 57T86 55" fill="none" stroke="#ffd0ec" stroke-width="1.8"/>`
      + `<path d="M50 62l2.4 5l5.4.6l-4 3.6l1.2 5.4l-5 -2.8l-5 2.8l1.2 -5.4l-4 -3.6l5.4 -.6z" fill="#fff" opacity=".85"/>`
      + `<circle cx="34" cy="72" r="3" fill="#fff" opacity=".65"/><circle cx="66" cy="80" r="2" fill="#fff" opacity=".6"/><circle cx="62" cy="66" r="1.4" fill="#fff" opacity=".7"/></g>`);
    s.add(`<path d="${body}" fill="none" stroke="${GLASS.ink}" stroke-width="2.4" stroke-linejoin="round"/>`);
    s.add(path('M40 33Q50 39 60 33', 'none', METAL.ink, 5) + path('M40 33Q50 39 60 33', 'none', METAL.mid, 2.4));
    s.add(gem(s, 50, 36.4, 2.4, MANA, MANA.ink));
    s.add(G(B(s, 'M38 6L62 6L60 15L40 15Z', WOOD, 2, 'cork2'), 'woodgrain'));
    s.add(`<path d="M38 6Q50 3 62 6" fill="none" stroke="${METAL.mid}" stroke-width="1.4"/>`);
    s.add(hl('M26 52Q21 66 27 79', 3, 0.85)); s.add(hl('M45 18L45 31', 1.6, 0.8));
    sparkle(s, 81, 25, 6, '#ffe8f6'); sparkle(s, 16, 36, 4, '#ffe8f6');
    return { shadow: 1 };
  },
];

// ------------------------------------------------------------------ icons (shown small in the HUD, so bold shapes)

const star = (cx, cy, R, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; p.push(`${f1(cx + Math.cos(a) * rr)} ${f1(cy + Math.sin(a) * rr)}`); } return `M${p.join('L')}Z`; };

const icons = {
  owl(s) {
    const fur = { hi: '#dcc6f4', mid: '#8a6ab8', lo: '#4e3478', ink: '#2a1a46' };
    const belly = { hi: '#fffaee', mid: '#f0dcb8', lo: '#c8a878', ink: '#6a5236' };
    s.add(B(s, 'M22 40L18 18L36 30Z', fur, 2.2, 'oe1') + B(s, 'M78 40L82 18L64 30Z', fur, 2.2, 'oe2'));
    s.add(SB(s, 'M50 22Q84 22 84 58Q84 92 50 92Q16 92 16 58Q16 22 50 22Z', fur, 2.6, 'ob', '35%', '25%'));
    s.add(SB(s, 'M14 56Q8 74 22 86Q26 70 24 58Z', fur, 2, 'ow1') + SB(s, 'M86 56Q92 74 78 86Q74 70 76 58Z', fur, 2, 'ow2'));
    s.add(`<path d="M16 64Q20 74 22 80M84 64Q80 74 78 80" fill="none" stroke="${fur.lo}" stroke-width="1.2"/>`);
    s.add(SB(s, 'M50 54Q70 56 70 74Q70 90 50 90Q30 90 30 74Q30 56 50 54Z', belly, 2.2, 'obl', '40%', '30%'));
    s.add(`<path d="M38 70Q42 74 46 70M54 70Q58 74 62 70M44 80Q48 84 52 80M50 80Q54 84 58 80M40 62Q44 65 48 62M52 62Q56 65 60 62" fill="none" stroke="${belly.lo}" stroke-width="1.6"/>`);
    for (const x of [37, 63]) {
      s.add(`<circle cx="${x}" cy="46" r="11" fill="${s.rad({ hi: '#ffffff', mid: '#ffffff', lo: '#e6e0f0', ink: '#9a8ac0' }, 'oeye')}" stroke="${fur.ink}" stroke-width="2.4"/>`);
      s.add(`<circle cx="${x + 1}" cy="47" r="5.8" fill="${s.rad({ hi: '#ffe8a0', mid: '#e8a020', lo: '#8a5010', ink: '#4a2a08' }, 'oiris')}"/><circle cx="${x + 1}" cy="47" r="3" fill="#1a1028"/><circle cx="${x - 1}" cy="44.6" r="1.8" fill="#fff"/>`);
      s.add(`<circle cx="${x}" cy="46" r="13" fill="none" stroke="${METAL.ink}" stroke-width="4"/><circle cx="${x}" cy="46" r="13" fill="none" stroke="${METAL.mid}" stroke-width="2"/>`);
      s.add(`<path d="M${x - 9} 39A12 12 0 0 1 ${x - 2} 34" fill="none" stroke="#fff" stroke-width="2" opacity=".85"/>`);
    }
    s.add(`<path d="M48 46L52 46" stroke="${METAL.ink}" stroke-width="4"/><path d="M48 46L52 46" stroke="${METAL.mid}" stroke-width="2"/>`);
    s.add(B(s, 'M46 56L54 56L50 64Z', { hi: '#ffe0a0', mid: '#ffb43c', lo: '#c8761c', ink: '#7a4a10' }, 1.8, 'beak'));
    s.add(SB(s, 'M30 24Q46 -6 70 6Q58 12 60 26Q46 20 30 24Z', ARCANE, 2.4, 'hat'));
    s.add(B(s, 'M26 26Q48 18 66 28L64 32Q48 24 28 30Z', GOLD, 1.8, 'band'));
    sparkle(s, 66, 10, 3.6, '#ffe680'); s.add(`<circle cx="44" cy="12" r="1.4" fill="#ffe680"/>`);
    return { shadow: 1, fill: 0.86 };
  },
  tower(s) {
    s.add(G(SB(s, 'M30 92L34 40L66 40L70 92Z', STONE, 2.4, 'tw', '30%', '30%'), 'grain'));
    s.add(`<path d="M32 56L68 56M31 72L69 72M42 40L41 56M58 40L59 56M50 56L50 72M38 72L37 92M62 72L63 92" stroke="${STONE.lo}" stroke-width="1.2" opacity=".75"/>`);
    s.add(B(s, 'M28 44L72 44L72 39L28 39Z', STONE, 1.8, 'tb'));
    s.add(SB(s, 'M24 41L50 3L76 41Z', ARCANE, 2.4, 'roof', '35%', '30%'));
    s.add(`<path d="M50 3L42 41M50 3L58 41" stroke="${ARCANE.lo}" stroke-width="1.2" opacity=".6"/><path d="M30 38L44 18" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>`);
    for (const [x, y] of [[40, 30], [58, 26], [50, 16]]) s.add(`<path d="${star(x, y, 2.2, 1)}" fill="#ffe680"/>`);
    s.add(B(s, 'M43 92L43 76Q50 69 57 76L57 92Z', WOOD, 1.8, 'door'));
    s.add(`<path d="M50 72L50 92" stroke="${WOOD.ink}" stroke-width="1"/><circle cx="54" cy="84" r="1" fill="${METAL.mid}"/>`);
    s.add(`<path d="M45 52Q50 45 55 52L55 62L45 62Z" fill="${s.glowGrad('#ffd36a', 1)}"/>`);
    s.add(path('M45 52Q50 45 55 52L55 62L45 62Z', '#ffd36a', STONE.ink, 1.8));
    s.add(`<path d="M50 47L50 62M45 56L55 56" stroke="${STONE.ink}" stroke-width="1"/>`);
    s.add(`<path d="M50 3L50 -7" stroke="${STONE.ink}" stroke-width="2"/>` + B(s, 'M50 -7L61 -3L50 1Z', { hi: '#ffd0a0', mid: '#ff8a3c', lo: '#c8501c', ink: '#6a2a0c' }, 1.6, 'flag'));
    return { shadow: 0 };
  },
  hat(s) {
    s.add(SB(s, 'M13 80Q50 63 87 80Q87 91 50 91Q13 91 13 80Z', ARCANE, 2.4, 'brim', '40%', '30%'));
    s.add(SB(s, 'M28 78Q36 50 48 30Q56 11 79 9Q62 22 64 40Q68 60 72 78Q50 84 28 78Z', ARCANE, 2.4, 'cone', '30%', '35%'));
    s.add(`<path d="M60 18Q56 30 58 44M66 54Q68 66 70 76" fill="none" stroke="${ARCANE.lo}" stroke-width="1.4" opacity=".7"/>`);
    s.add(B(s, 'M28 73Q50 80 72 73L73 80Q50 87 28 80Z', GOLD, 1.8, 'hband'));
    s.add(gem(s, 50, 79.5, 2.6, { hi: '#e6fbff', mid: '#38c2e8', lo: '#14709a', ink: '#0a3a5a' }));
    for (const [x, y, r] of [[48, 53, 5], [58, 35, 4], [39, 65, 3.2]]) sparkle(s, x, y, r, '#ffe680', s.body);
    s.add(hl('M35 66Q41 46 51 31', 2.6, 0.45));
    s.add(`<circle cx="79" cy="9" r="2.6" fill="${s.rad(GOLD, 'tip')}" stroke="${GOLD.ink}" stroke-width="1"/>`);
    return { shadow: 1 };
  },
  coin(s) { s.add(coin(s, 50, 50, 38, 'icn')); return { shadow: 0 }; },
  gem(s) {
    const p = { hi: '#ffe4f6', mid: '#ff6fb8', lo: '#c0247a', ink: '#6a0c42' };
    s.add(SB(s, 'M13 38L30 15L70 15L87 38L50 89Z', p, 2.6, 'gm', '35%', '25%'));
    s.add(`<path d="M13 38L87 38M30 15L38 38L50 15L62 38L70 15M38 38L50 89L62 38" fill="none" stroke="${p.ink}" stroke-width="1.6" opacity=".55"/>`);
    s.add(path('M30 15L38 38L13 38Z', '#fff', 'none', 0, 'opacity=".55"'));
    s.add(path('M50 15L62 38L38 38Z', '#fff', 'none', 0, 'opacity=".3"'));
    s.add(path('M62 38L87 38L50 89Z', p.lo, 'none', 0, 'opacity=".35"'));
    s.add(hl('M20 40L44 74', 2.2, 0.6));
    sparkle(s, 33, 25, 4.4, '#fff', s.body);
    return { shadow: 0 };
  },
  energy(s) {
    const p = { hi: '#fff8c0', mid: '#ffd23c', lo: '#e89a1c', ink: '#7a4a08' };
    s.back.push(`<path d="M58 6L20 56L46 56L38 94L82 40L54 40Z" fill="#fff3a0" opacity=".7" filter="url(#glowf)"/>`);
    s.add(SB(s, 'M58 6L20 56L46 56L38 94L82 40L54 40Z', p, 2.6, 'en', '40%', '30%'));
    s.add(`<path d="M54 14L28 52" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".75"/><path d="M46 60L42 82" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`);
    s.add(path('M54 40L82 40L38 94L46 56Z', p.lo, 'none', 0, 'opacity=".3"'));
    return { shadow: 0 };
  },
  trophy(s) {
    for (const d of ['M28 22Q8 22 12 40Q16 54 34 54', 'M72 22Q92 22 88 40Q84 54 66 54']) s.add(path(d, 'none', GOLD.ink, 7.4) + path(d, 'none', GOLD.mid, 3.8) + `<path d="${d}" fill="none" stroke="#fff6c2" stroke-width="1.2" transform="translate(-.6 -.8)"/>`);
    s.add(SB(s, 'M25 12L75 12L73 40Q71 63 50 67Q29 63 27 40Z', GOLD, 2.6, 'cup', '35%', '25%'));
    s.add(`<ellipse cx="50" cy="13" rx="24" ry="3" fill="${GOLD.lo}" stroke="${GOLD.ink}" stroke-width="1.4"/>`);
    s.add(B(s, 'M44 64L56 64L58 78L42 78Z', GOLD, 2, 'stem'));
    s.add(G(B(s, 'M29 78L71 78L73 93L27 93Z', WOOD, 2.2, 'base'), 'woodgrain'));
    s.add(B(s, 'M38 82.5L62 82.5L62 88.5L38 88.5Z', GOLD, 1.2, 'plate'));
    s.add(B(s, star(50, 36, 12, 5.4), { hi: '#ffffff', mid: '#fff8d0', lo: '#f0d070', ink: GOLD.ink }, 1.6, 'tst'));
    s.add(`<path d="M33 18L36 46" stroke="#fff" stroke-width="3" opacity=".65" stroke-linecap="round"/>`);
    sparkle(s, 80, 12, 4); sparkle(s, 18, 66, 3);
    return { shadow: 0 };
  },
  gstar(s) {
    const p = { hi: '#fffad0', mid: '#ffd23c', lo: '#e8961c', ink: '#7a4a08' };
    s.add(SB(s, 'M50 4L62 34L95 36L69 57L78 90L50 72L22 90L31 57L5 36L38 34Z', p, 2.6, 'gs', '40%', '30%'));
    s.add(`<path d="M50 4L50 50M95 36L50 50M78 90L50 50M22 90L50 50M5 36L50 50" stroke="${p.lo}" stroke-width="1.2" opacity=".5"/>`);
    s.add(path('M38 34L50 4L50 50L5 36Z', '#fff', 'none', 0, 'opacity=".4"'));
    s.add(path('M50 50L78 90L50 72Z M50 50L95 36L69 57Z', p.lo, 'none', 0, 'opacity=".3"'));
    s.add(`<circle cx="50" cy="50" r="3" fill="#fff" opacity=".9"/>`);
    return { shadow: 0 };
  },
  scroll(s) {
    const P = { hi: '#fffdf4', mid: '#f4e6c4', lo: '#d7bf8c', ink: '#6a4a1a' };
    s.add(G(SB(s, 'M23 18L77 18L77 82L23 82Z', P, 2.2, 'pp', '30%', '20%'), 'paper'));
    for (const y of [32, 42, 52, 62]) s.add(`<path d="M31 ${y}L${y === 62 ? 54 : 69} ${y}" stroke="${P.lo}" stroke-width="3" stroke-linecap="round"/><path d="M31 ${y}L${y === 62 ? 54 : 69} ${y}" stroke="#8a6a3a" stroke-width="1" stroke-linecap="round" stroke-dasharray="3 1.4 1.4 1.4" opacity=".6"/>`);
    for (const y of [16, 84]) {
      s.add(G(B(s, `M17 ${y - 7}L83 ${y - 7}Q89 ${y} 83 ${y + 7}L17 ${y + 7}Q11 ${y} 17 ${y - 7}Z`, WOOD, 2, 'rod', '40%', '20%'), 'woodgrain'));
      for (const x of [12, 88]) s.add(B(s, circ(x, y, 4), GOLD, 1.4, 'knob'));
    }
    s.add(SB(s, 'M66 66Q76 59 80 70Q84 80 72 82Q61 82 64 72Z', RUBY, 2, 'seal'));
    s.add(`<path d="${star(72, 72, 4.4, 2)}" fill="${RUBY.lo}" opacity=".8"/>`);
    s.add(B(s, 'M66 80L62 93L68 89L70 95L73 82Z', RUBY, 1.4, 'rib'));
    return { shadow: 0 };
  },
  star(s) {
    const p = { hi: '#d4f0ff', mid: '#5aaaf0', lo: '#2a6ac8', ink: '#123a7a' };
    s.add(SB(s, 'M50 4L62 34L95 36L69 57L78 90L50 72L22 90L31 57L5 36L38 34Z', p, 2.6, 'bs', '40%', '30%'));
    s.add(path('M38 34L50 4L50 50L5 36Z', '#fff', 'none', 0, 'opacity=".4"'));
    s.add(path('M50 50L78 90L50 72Z M50 50L95 36L69 57Z', p.lo, 'none', 0, 'opacity=".3"'));
    s.add(`<circle cx="50" cy="50" r="3" fill="#fff" opacity=".9"/>`);
    return { shadow: 0 };
  },
};

export const EXTRAS = {};
coinArt.forEach((d, i) => { EXTRAS[`coin-${i + 1}`] = { draw: d, fill: Math.min(0.95, 0.68 + (i + 1) * 0.04) }; });
manaArt.forEach((d, i) => { EXTRAS[`mana-${i + 1}`] = { draw: d, fill: Math.min(0.95, 0.68 + (i + 1) * 0.04) }; });
for (const [k, d] of Object.entries(icons)) EXTRAS[`icon-${k}`] = { draw: d, fill: 0.86 };
