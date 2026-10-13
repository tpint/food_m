// Painted UI icons for Sunny Spoon (food_m). Shared ones (coin, gem, energy, trophy, stars) reuse the Arcane Merge paintings.
import { f1, METAL, IRON, path, hl, sparkle } from './paint.mjs';
import { B, SB, G, circ, WOOD, STONE } from './items.mjs';
import { EXTRAS, coin, GOLD } from './extras.mjs';

const TOQUE = { hi: '#ffffff', mid: '#f6f6fc', lo: '#c8cad8', ink: '#3e4260' };
const MINT = { hi: '#e4fff8', mid: '#5fd0b8', lo: '#2a8a78', ink: '#0e4e42' };
const PAPER = { hi: '#fffdf4', mid: '#f6ead0', lo: '#d7bf8c', ink: '#6a4a1a' };
const RED = { hi: '#ffb4a8', mid: '#e8403a', lo: '#a01a1a', ink: '#4e0606' };

function toque(s, cx, by, k, key = 'toque') {
  const d = `M${cx - 16 * k} ${by}L${cx - 16 * k} ${by - 12 * k}Q${cx - 30 * k} ${by - 16 * k} ${cx - 26 * k} ${by - 30 * k}Q${cx - 20 * k} ${by - 42 * k} ${cx - 6 * k} ${by - 36 * k}Q${cx} ${by - 48 * k} ${cx + 10 * k} ${by - 38 * k}Q${cx + 26 * k} ${by - 44 * k} ${cx + 28 * k} ${by - 28 * k}Q${cx + 30 * k} ${by - 16 * k} ${cx + 16 * k} ${by - 12 * k}L${cx + 16 * k} ${by}Z`;
  let o = SB(s, d, TOQUE, Math.max(1.6, 1.6 * k), key, '35%', '25%');
  o += `<path d="M${cx - 14 * k} ${by - 13 * k}Q${cx - 10 * k} ${by - 24 * k} ${cx - 6 * k} ${by - 30 * k}M${cx + 2 * k} ${by - 13 * k}Q${cx + 4 * k} ${by - 26 * k} ${cx + 8 * k} ${by - 32 * k}" fill="none" stroke="${TOQUE.lo}" stroke-width="${f1(1.2 * k)}"/>`;
  o += B(s, `M${cx - 16.5 * k} ${by - 12 * k}L${cx + 16.5 * k} ${by - 12 * k}L${cx + 16.5 * k} ${by}L${cx - 16.5 * k} ${by}Z`, TOQUE, Math.max(1.4, 1.4 * k), key + 'b', '30%', '20%');
  o += `<path d="M${cx - 6 * k} ${by - 11 * k}L${cx - 6 * k} ${by - 1}M${cx + 6 * k} ${by - 11 * k}L${cx + 6 * k} ${by - 1}" stroke="${TOQUE.lo}" stroke-width="${f1(1.4 * k)}"/>`;
  o += hl(`M${cx - 22 * k} ${by - 26 * k}Q${cx - 18 * k} ${by - 36 * k} ${cx - 8 * k} ${by - 34 * k}`, Math.max(1.2, 1.4 * k), 0.85);
  return o;
}

const I = {
  chef(s) {
    const fur = { hi: '#f4f2fa', mid: '#b8b4cc', lo: '#7e7896', ink: '#2e2a46' };
    s.add(SB(s, 'M13 101Q13 75 50 71Q87 75 87 101Z', TOQUE, 2.4, 'coat', '35%', '20%'));
    s.add(`<path d="M50 74L50 100" stroke="${TOQUE.lo}" stroke-width="1.2"/>${[80, 88, 96].map((y) => `<circle cx="44" cy="${y}" r="1.6" fill="${TOQUE.lo}"/><circle cx="56" cy="${y}" r="1.6" fill="${TOQUE.lo}"/>`).join('')}`);
    s.add(B(s, 'M43.5 73.5L50 85L56.5 73.5Z', RED, 1.8, 'scarf'));
    for (const x of [22, 78]) s.add(SB(s, circ(x, 34, 16), fur, 2.2, 'mear') + `<circle cx="${x}" cy="34" r="9.4" fill="${s.rad({ hi: '#ffe0ea', mid: '#ffc0d0', lo: '#e890a8', ink: '#8a3a5a' }, 'mein')}"/>`);
    s.add(SB(s, 'M50 29Q79 29 79 54Q79 77 50 79Q21 77 21 54Q21 29 50 29Z', fur, 2.4, 'mhead', '35%', '25%'));
    s.add(`<ellipse cx="34" cy="40" rx="5" ry="2.4" fill="#fff" opacity=".55" transform="rotate(-35 34 40)"/>`);
    for (const x of [39, 61]) s.add(`<ellipse cx="${x}" cy="50" rx="4.5" ry="5.3" fill="${s.rad({ hi: '#6a5a8a', mid: '#2e2240', lo: '#1a1028', ink: '#0e0818' }, 'eye', '40%', '35%')}"/><circle cx="${x - 1.5}" cy="48.2" r="1.9" fill="#fff"/>`);
    s.add(['31', '69'].map((x) => `<ellipse cx="${x}" cy="62" rx="5.4" ry="3.2" fill="${s.glowGrad('#ff6a98', 0.75)}"/>`).join(''));
    s.add(B(s, circ(50, 60, 4.2), { hi: '#ffc0d8', mid: '#ff7aa8', lo: '#c84a7a', ink: '#6a1a3e' }, 1.3, 'mnose'));
    s.add('<path d="M44 66Q47 69 50 65Q53 69 56 66" fill="none" stroke="#2a1a3a" stroke-width="2" stroke-linecap="round"/>');
    s.add(`<path d="M25 58L37 60M25 64L37 63M75 58L63 60M75 64L63 63" stroke="${fur.ink}" stroke-width="1.2" stroke-linecap="round"/>`);
    s.add(toque(s, 50, 35, 0.75, 'ctq'));
    return { shadow: 1 };
  },
  diner(s) {
    const WALL = { hi: '#fffaee', mid: '#f6e4c4', lo: '#d0b88a', ink: '#5a3a14' };
    s.add(G(SB(s, 'M13 46L87 46L87 92L13 92Z', WALL, 2.4, 'wall', '30%', '20%'), 'grain'));
    s.add(`<path d="M13 82L87 82" stroke="${WALL.lo}" stroke-width="1.4"/>`);
    s.add(G(B(s, 'M40 92L40 64Q40 61 43 61L57 61Q60 61 60 64L60 92Z', WOOD, 2, 'door'), 'woodgrain'));
    s.add(`<path d="M43 66L57 66L57 76L43 76Z" fill="#9fdcff" stroke="${WOOD.ink}" stroke-width="1"/><circle cx="56" cy="80" r="1.4" fill="${METAL.mid}"/>`);
    for (const x of [19, 65]) {
      s.add(path(`M${x} 56L${x + 16} 56L${x + 16} 73L${x} 73Z`, s.lin(['#cfeeff', '#7cc8f4']), '#1e4a7a', 2));
      s.add(`<path d="M${x + 8} 56L${x + 8} 73M${x} 64.5L${x + 16} 64.5" stroke="#1e4a7a" stroke-width="1.2"/><path d="M${x + 2} 58L${x + 6} 58" stroke="#fff" stroke-width="1.4"/>`);
      s.add(B(s, `M${x - 1.5} 73L${x + 17.5} 73L${x + 17.5} 76L${x - 1.5} 76Z`, WOOD, 1.2, 'sill'));
      for (const fx of [x + 3, x + 8, x + 13]) s.add(`<circle cx="${fx}" cy="72" r="1.6" fill="#ff6a8a" stroke="#6a1a2a" stroke-width=".5"/>`);
    }
    // striped awning
    s.defs.push('<pattern id="awn" width="12" height="20" patternUnits="userSpaceOnUse"><rect width="12" height="20" fill="#fff"/><rect width="6" height="20" fill="#e8403a"/></pattern>');
    s.add(`<g filter="url(#bev)"><path d="M7 30L93 30L95 46L5 46Z" fill="url(#awn)" stroke="#5a1010" stroke-width="2.2" stroke-linejoin="round"/></g>`);
    s.add(`<g filter="url(#bev)"><path d="M5 46Q11 53 17 46Q23 53 29 46Q35 53 41 46Q47 53 53 46Q59 53 65 46Q71 53 77 46Q83 53 95 46Z" fill="url(#awn)" stroke="#5a1010" stroke-width="2" stroke-linejoin="round"/></g>`);
    s.add(`<path d="M7 30L93 30" stroke="#fff" stroke-width="1" opacity=".6"/>`);
    // sign with a cloche
    s.add(B(s, 'M29 7L71 7L71 27L29 27Z', GOLD, 2.2, 'sign'));
    s.add(`<path d="M42 21Q42 13 50 13Q58 13 58 21Z" fill="#fff6c4" stroke="${GOLD.ink}" stroke-width="1.2"/><path d="M40 21L60 21" stroke="${GOLD.ink}" stroke-width="1.6" stroke-linecap="round"/><circle cx="50" cy="12" r="1.4" fill="#fff6c4" stroke="${GOLD.ink}" stroke-width=".8"/>`);
    s.add(`<path d="M38 27L38 30M62 27L62 30" stroke="${IRON.ink}" stroke-width="2"/>`);
    return { shadow: 0 };
  },
  toque(s) { s.add(toque(s, 50, 88, 1.6, 'tq')); sparkle(s, 82, 20, 5, '#ffe680'); return { shadow: 1 }; },
  pad(s) {
    s.add(G(SB(s, 'M21 16L75 16L75 91L21 91Z', PAPER, 2.2, 'pad', '30%', '20%'), 'paper'));
    s.add(`<path d="M23 89L73 89" stroke="${PAPER.lo}" stroke-width="1"/>`);
    for (const y of [36, 48, 60, 72]) s.add(`<path d="M${y === 36 ? 44 : 30} ${y}L${y === 72 ? 52 : 66} ${y}" stroke="#8ab0e0" stroke-width="3" stroke-linecap="round"/><path d="M${y === 36 ? 44 : 30} ${y}L${y === 72 ? 52 : 66} ${y}" stroke="#4a6aa0" stroke-width="1" stroke-linecap="round" stroke-dasharray="3 1.4 1.4 1.4" opacity=".6"/>`);
    s.add('<path d="M30 36L34 40L40 32" fill="none" stroke="#3aa04a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>');
    s.add(B(s, 'M19 11L77 11L77 22L19 22Z', RED, 2, 'padtop'));
    for (const x of [30, 42, 54, 66]) s.add(`<circle cx="${x}" cy="16.5" r="2.6" fill="${s.rad(IRON, 'ring')}" stroke="${IRON.ink}" stroke-width="1.1"/>`);
    s.add(`<g transform="rotate(-60 77 72)">${B(s, 'M60 68L94 68L94 76L60 76Z', GOLD, 1.8, 'pencil', '30%', '10%')}${B(s, 'M94 68L101 72L94 76Z', { hi: '#fff4e0', mid: '#f0d0a0', lo: '#c8a070', ink: '#5a3a14' }, 1.2, 'tip')}<path d="M98.6 70.6L101 72L98.6 73.4Z" fill="#2a2a2a"/>${B(s, 'M55 68L60 68L60 76L55 76Z', { hi: '#ffd0e0', mid: '#ff8eb0', lo: '#d85a84', ink: '#6a1a3e' }, 1.2, 'eraser')}<path d="M62 70.5L92 70.5" stroke="#fff" stroke-width="1" opacity=".7"/></g>`);
    return { shadow: 0 };
  },
  fridge(s) {
    s.add(SB(s, 'M21 10Q21 3 28 3L72 3Q79 3 79 10L79 90Q79 97 72 97L28 97Q21 97 21 90Z', MINT, 2.6, 'fr', '30%', '20%'));
    s.add(`<path d="M21 38L79 38" stroke="${MINT.ink}" stroke-width="3"/><path d="M22 40L78 40" stroke="${MINT.hi}" stroke-width="1" opacity=".7"/>`);
    for (const [y1, y2] of [[13, 30], [46, 70]]) s.add(path(`M66 ${y1}L66 ${y2}`, 'none', IRON.ink, 6.4) + `<path d="M66 ${y1}L66 ${y2}" stroke="${IRON.hi}" stroke-width="3" stroke-linecap="round"/>`);
    s.add(hl('M27 12L27 32M27 46L27 88', 3, 0.6));
    // fridge magnets
    s.add(B(s, circ(40, 56, 7), { hi: '#ffb4b4', mid: '#ee3a4a', lo: '#a81a28', ink: '#4e0610' }, 1.6, 'mag1') + `<path d="M40 49Q42 45 46 44" fill="none" stroke="#2e5a1a" stroke-width="1.8" stroke-linecap="round"/><circle cx="38" cy="54" r="1.6" fill="#fff" opacity=".8"/>`);
    s.add(B(s, 'M34 72L48 72L48 83L34 83Z', { hi: '#fffbd0', mid: '#ffe066', lo: '#e8b020', ink: '#7a5408' }, 1.6, 'mag2') + `<path d="M36 76L46 76M36 79L42 79" stroke="#a87810" stroke-width="1"/>`);
    s.add(`<g transform="rotate(8 46 22)">${G(B(s, 'M36 14L56 14L56 30L36 30Z', PAPER, 1.4, 'note'), 'paper')}<path d="M39 19L53 19M39 23L51 23M39 27L47 27" stroke="#8ab0e0" stroke-width="1.2"/></g>`);
    s.add(`<circle cx="46" cy="15" r="2" fill="#4ac8ff" stroke="#1e4a7a" stroke-width=".8"/>`);
    for (const x of [28, 72]) s.add(`<rect x="${x - 4}" y="96" width="8" height="3" rx="1" fill="${IRON.mid}" stroke="${IRON.ink}" stroke-width="1"/>`);
    sparkle(s, 86, 14, 4.4, '#fff');
    return { shadow: 1 };
  },
};

export const SPRITES = {};
for (const [k, d] of Object.entries(I)) SPRITES[`icon-${k}`] = { draw: d, fill: 0.86 };
for (const k of ['coin', 'gem', 'energy', 'trophy', 'gstar', 'star']) SPRITES[`icon-${k}`] = EXTRAS[`icon-${k}`];
