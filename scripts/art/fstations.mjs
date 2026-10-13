// Painted kitchen stations for Sunny Spoon (food_m), levels 1-10.
// Level dressing follows the game: 2 gold trim, 3 serving plate + gems, 4 sparkles + gold star badge,
// 5 golden rays, 6 orbit of tasty motes, 7 floating hearts (+ more gems), 8 crown, 9 gilded wings, 10 starry sky.
import { f1, METAL, IRON, path, hl, sparkle, gem, rivet } from './paint.mjs';
import { B, SB, G, circ, flame, bubble, WOOD, STONE } from './items.mjs';

const BRICK = { hi: '#ffc4a4', mid: '#d8643a', lo: '#9a3a1e', ink: '#4e1808' };
const MINT = { hi: '#e4fff8', mid: '#5fd0b8', lo: '#2a8a78', ink: '#0e4e42' };
const PINK = { hi: '#ffe6f2', mid: '#ff8ec4', lo: '#e0508e', ink: '#7a1a4a' };
const PAN = { hi: '#9aa0b8', mid: '#4a5068', lo: '#2a2e40', ink: '#10121a' };
const RED = { hi: '#ffb4a0', mid: '#e8503a', lo: '#a02a1a', ink: '#4e0e06' };
const LEMON = { hi: '#fffbd0', mid: '#ffe066', lo: '#e8b020', ink: '#7a5408' };
const BREAD = { hi: '#ffe4ac', mid: '#e3a352', lo: '#a8622a', ink: '#4e2810' };
const MEAT = { hi: '#ffb88a', mid: '#c8643a', lo: '#8a3418', ink: '#3e1606' };

const STATIONS = {
  oven: { glow: '#ffc46a', halo: '#ffd8a0', gemPal: BRICK },
  fountain: { glow: '#8fd8ff', halo: '#b8e4ff', gemPal: { hi: '#d8f2ff', mid: '#4aa8f0', lo: '#1f6fc9', ink: '#0e3a70' } },
  mixer: { glow: '#ff9ec8', halo: '#ffd0e6', gemPal: PINK },
  bbq: { glow: '#ffa060', halo: '#ffc8a0', gemPal: { hi: '#ffe0a0', mid: '#ff9a3c', lo: '#c8501c', ink: '#5a2008' } },
};

const trim = (lv) => (lv >= 2 ? METAL : IRON);
const heart = (x, y, k) => `M${x} ${y + 6 * k}Q${x - 8 * k} ${y} ${x - 6 * k} ${y - 4 * k}Q${x - 3 * k} ${y - 8 * k} ${x} ${y - 3 * k}Q${x + 3 * k} ${y - 8 * k} ${x + 6 * k} ${y - 4 * k}Q${x + 8 * k} ${y} ${x} ${y + 6 * k}Z`;
const star5 = (cx, cy, R, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r : R; p.push(`${f1(cx + Math.cos(a) * rr)} ${f1(cy + Math.sin(a) * rr)}`); } return `M${p.join('L')}Z`; };
const steam = (s, x, y, h = 16) => s.fx.push(`<path d="M${x} ${y}q-5 ${-h / 4} 0 ${-h / 2}t0 ${-h / 2}" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".9"/><path d="M${x} ${y}q-5 ${-h / 4} 0 ${-h / 2}t0 ${-h / 2}" fill="none" stroke="#c8d8e8" stroke-width="1" stroke-linecap="round" opacity=".6" transform="translate(1 .6)"/>`);

function dressBack(s, lv, glow, halo) {
  if (lv >= 10) {
    s.back.push(`<circle cx="50" cy="56" r="49" fill="${s.lin(['#3a2478', '#1e1450'])}" opacity=".78"/><circle cx="50" cy="56" r="49" fill="none" stroke="${glow}" stroke-width="1.8" opacity=".9"/><circle cx="50" cy="56" r="45.5" fill="none" stroke="#fff" stroke-width=".7" stroke-dasharray="1.5 3" opacity=".6"/>`);
    for (let k = 0; k < 26; k++) {
      const a = k * 2.39996, r = 14 + ((k * 37) % 32), x = 50 + Math.cos(a) * r, y = 56 + Math.sin(a) * r, rr = 0.5 + (k % 3) * 0.4;
      if (k % 5 === 0) sparkle(s, +f1(x), +f1(y), rr * 2.4, '#fff', s.back);
      else s.back.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="#fff" opacity="${0.6 + (k % 4) * 0.1}"/>`);
    }
  }
  if (lv >= 5) {
    s.defs.push('<radialGradient id="raymg"><stop offset=".25" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="raym"><circle cx="50" cy="58" r="52" fill="url(#raymg)"/></mask>');
    const rays = [];
    for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 - 0.05, b = a + 0.14; rays.push(`M50 58L${f1(50 + Math.cos(a) * 60)} ${f1(58 + Math.sin(a) * 60)}L${f1(50 + Math.cos(b) * 60)} ${f1(58 + Math.sin(b) * 60)}Z`); }
    let r = `<g mask="url(#raym)"><path d="${rays.join('')}" fill="#ffd84a" opacity=".9"/>`;
    if (lv >= 10) { const m = []; for (let k = 0; k < 14; k++) { const a = ((k + 0.5) / 14) * Math.PI * 2 - 0.05, b = a + 0.09; m.push(`M50 58L${f1(50 + Math.cos(a) * 56)} ${f1(58 + Math.sin(a) * 56)}L${f1(50 + Math.cos(b) * 56)} ${f1(58 + Math.sin(b) * 56)}Z`); } r += `<path d="${m.join('')}" fill="${glow}" opacity=".85"/>`; }
    s.back.push(r + '</g>');
  }
  s.back.push(`<circle cx="50" cy="52" r="44" fill="${s.glowGrad(halo, 0.75)}"/>`);
  if (lv >= 9) {
    for (const fl of [1, -1]) {
      const P2 = (str) => str.replace(/(-?[\d.]+) (-?[\d.]+)/g, (_, a, b) => `${f1(fl > 0 ? +a : 100 - +a)} ${b}`);
      s.back.push(`<g filter="url(#bev)">${path(P2('M83 68Q83 42 95 25Q101 17 107 15Q106.5 23 101.5 27Q107.5 30 103.5 36Q107.5 40.5 100.5 44.5Q104.5 49.5 96.5 52.5Q98.5 58 90.5 60Q89.5 66 83 68Z'), s.rad(METAL, 'wing' + fl, fl > 0 ? '25%' : '75%', '20%'), METAL.ink, 1.6)}</g>`);
      s.back.push(`<path d="${P2('M86 64Q92 40 104 18M86.5 64Q95 44 101 30M87 64Q96 50 101 39M87.5 64Q94 55 98 47M88 64Q92 59 93 55')}" stroke="${METAL.lo}" stroke-width="1" stroke-linecap="round" fill="none"/>`);
      s.back.push(hl(P2('M85 60Q86 42 95 28'), 1.3, 0.85));
    }
  }
  if (lv >= 6) s.back.push(`<path d="M5 62A46 14 -12 0 1 95 43" fill="none" stroke="${glow}" stroke-width="2.2" opacity=".9"/><path d="M5 62A46 14 -12 0 1 95 43" fill="none" stroke="#fff" stroke-width=".8" opacity=".9"/>`);
  if (lv >= 3) {
    // the big serving plate the station stands on
    s.back.push(`<ellipse cx="50" cy="96" rx="49" ry="9.6" fill="${s.rad({ hi: '#ffffff', mid: '#f6f6fa', lo: '#d0d0e0', ink: '#4e4862' }, 'plate', '40%', '30%')}" stroke="${STONE.ink}" stroke-width="1.8"/>`);
    s.back.push(`<ellipse cx="50" cy="95.4" rx="40" ry="6.6" fill="none" stroke="${glow}" stroke-width="2.4"/><ellipse cx="50" cy="95.4" rx="44.5" ry="8.2" fill="none" stroke="${glow}" stroke-width=".8" stroke-dasharray="2 2.4" opacity=".8"/>`);
    s.back.push(`<path d="M8 93Q20 89 36 88" fill="none" stroke="#fff" stroke-width="1.4" opacity=".9"/>`);
  } else s.back.push(`<ellipse cx="50" cy="96" rx="38" ry="5.5" fill="#3a2350" opacity=".25"/>`);
}

function dressFront(s, lv, glow) {
  if (lv >= 7) for (const [x, y, k] of [[11, 34, 1.1], [89, 28, 1], [20, 14, 0.6]]) s.fx.push(`<g filter="url(#bev)">${path(heart(x, y, k), s.rad({ hi: '#ffd0e0', mid: '#ff6a9a', lo: '#c82a5a', ink: '#6a0a2e' }, 'hrt'), '#6a0a2e', 1.3)}</g><path d="M${f1(x - 4 * k)} ${f1(y - 3 * k)}q${f1(1.5 * k)} ${f1(-2 * k)} ${f1(3 * k)} 0" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`);
  if (lv >= 6) {
    s.fx.push(`<path d="M95 43A46 14 -12 0 1 5 62" fill="none" stroke="${glow}" stroke-width="2.6" opacity=".95"/><path d="M95 43A46 14 -12 0 1 5 62" fill="none" stroke="#fff" stroke-width="1" opacity=".95"/>`);
    for (const [x, y, r] of [[17, 67, 3], [61, 72.5, 2.5], [89, 52, 2.1]]) s.fx.push(`<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${s.glowGrad(glow, 0.8)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad({ hi: '#ffffff', mid: glow, lo: glow, ink: '#555' }, 'mote')}" stroke="#fff" stroke-width=".9"/>`);
  }
  if (lv >= 8) {
    s.fx.push(`<g filter="url(#bev)">${path('M41 9L42.4 0.5L46.6 4.8L50 -2.5L53.4 4.8L57.6 0.5L59 9Q50 11 41 9Z', s.rad(METAL, 'crown'), METAL.ink, 1.5)}</g>`);
    s.fx.push(gem(s, 50, 6, 1.7, { hi: '#ffd0e0', mid: '#ff6a9a', lo: '#c82a5a', ink: '#6a0a2e' }));
  }
  if (lv >= 4) {
    for (const [x, y, r] of [[11, 20, 3.6], [90, 12, 3], [82, 2, 2.6]]) sparkle(s, x, y, r, glow);
    s.fx.push(`<g filter="url(#bev)">${path(star5(82, 81, 7.6, 3.4), s.rad(METAL, 'badge'), METAL.ink, 1.4)}</g><circle cx="82" cy="81.4" r="1.4" fill="#fff" opacity=".9"/>`);
  }
  if (lv >= 5) for (const [x, y, r] of [[26, -1, 3.4], [70, -4, 3], [95, 66, 2.6]]) sparkle(s, x, y, r, '#fff6b0');
}

function roll(s, cx, cy, r) {
  let o = SB(s, `M${cx - r} ${cy + r * 0.5}Q${cx - r * 1.05} ${cy - r * 0.8} ${cx} ${cy - r * 0.85}Q${cx + r * 1.05} ${cy - r * 0.8} ${cx + r} ${cy + r * 0.5}Q${cx} ${cy + r * 0.85} ${cx - r} ${cy + r * 0.5}Z`, BREAD, Math.max(1.2, r * 0.12), 'roll', '35%', '25%');
  o += `<path d="M${cx - r * 0.45} ${cy - r * 0.35}Q${cx - r * 0.2} ${cy - r * 0.55} ${cx} ${cy - r * 0.4}M${cx + r * 0.05} ${cy - r * 0.15}Q${cx + r * 0.3} ${cy - r * 0.35} ${cx + r * 0.55} ${cy - r * 0.2}" fill="none" stroke="${BREAD.ink}" stroke-width="${f1(r * 0.12)}" stroke-linecap="round" opacity=".6"/>`;
  return o;
}
function lemon(s, x, y, r) {
  let o = `<circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad(LEMON, 'lem')}" stroke="${LEMON.ink}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.74)}" fill="#fff6b0"/>`;
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; o += `<path d="M${x} ${y}L${f1(x + Math.cos(a) * r * 0.7)} ${f1(y + Math.sin(a) * r * 0.7)}" stroke="${LEMON.lo}" stroke-width="1"/>`; }
  return o;
}
function sausage(s, cx, cy, len, rot) {
  const h = len * 0.32;
  return `<g transform="rotate(${rot} ${cx} ${cy})">${SB(s, `M${cx - len / 2 + h / 2} ${cy - h / 2}L${cx + len / 2 - h / 2} ${cy - h / 2}A${h / 2} ${h / 2} 0 0 1 ${cx + len / 2 - h / 2} ${cy + h / 2}L${cx - len / 2 + h / 2} ${cy + h / 2}A${h / 2} ${h / 2} 0 0 1 ${cx - len / 2 + h / 2} ${cy - h / 2}Z`, MEAT, 1.6, 'saus', '40%', '20%')}`
    + `<path d="M${cx - len * 0.25} ${cy - h * 0.45}L${cx - len * 0.15} ${cy + h * 0.45}M${cx} ${cy - h * 0.45}L${cx + len * 0.1} ${cy + h * 0.45}M${cx + len * 0.25} ${cy - h * 0.45}L${cx + len * 0.35} ${cy + h * 0.45}" stroke="${MEAT.ink}" stroke-width="1.6" opacity=".7"/>`
    + hl(`M${cx - len * 0.35} ${cy - h * 0.2}L${cx + len * 0.3} ${cy - h * 0.2}`, 1.2, 0.55) + '</g>';
}

const body = {
  oven(s, lv) {
    const t = trim(lv), G2 = STATIONS.oven.gemPal;
    // chimney
    s.add(G(SB(s, 'M62 24L62 7L75 7L75 31Z', BRICK, 2, 'chim'), 'grain'));
    s.add(B(s, 'M60 4L77 4L77 9L60 9Z', STONE, 1.6, 'chimcap'));
    // dome
    s.add(G(SB(s, 'M9 92L9 58Q9 19 50 19Q91 19 91 58L91 92Z', BRICK, 2.6, 'dome', '35%', '22%'), 'grain'));
    s.defs.push('<clipPath id="domec"><path d="M9 92L9 58Q9 19 50 19Q91 19 91 58L91 92Z"/></clipPath>');
    const bricks = [];
    for (const [y, off] of [[34, 0], [46, 9], [58, 0], [70, 9], [82, 0]]) {
      bricks.push(`M8 ${y}L92 ${y}`);
      for (let x = 18 + off; x < 90; x += 18) bricks.push(`M${x} ${y - 12}L${x} ${y}`);
    }
    s.add(`<g clip-path="url(#domec)"><path d="${bricks.join('')}" stroke="${BRICK.lo}" stroke-width="1.8" opacity=".8"/><path d="${bricks.join('')}" stroke="${BRICK.hi}" stroke-width=".7" opacity=".5" transform="translate(.8 1.2)"/></g>`);
    // stone arch and the glowing mouth
    s.add(G(B(s, 'M21 92L21 66Q21 40 50 40Q79 40 79 66L79 92L73 92L73 66Q73 47 50 47Q27 47 27 66L27 92Z', STONE, 2, 'arch'), 'grain'));
    s.add(path('M27 92L27 66Q27 47 50 47Q73 47 73 66L73 92Z', s.lin(['#3a1608', '#1a0804']), BRICK.ink, 1.6));
    s.add(`<ellipse cx="50" cy="80" rx="22" ry="14" fill="${s.glowGrad('#ff9a2a', 0.9)}"/>`);
    s.add(flame(s, 36, 91, 11, 16, -1, 'of1')); s.add(flame(s, 64, 91, 11, 17, 1, 'of2'));
    s.add(roll(s, 50, 80, 13));
    // trim band across the arch top
    s.add(path('M21 47Q21 38 50 38Q79 38 79 47', 'none', t.ink, 6.4) + path('M21 47Q21 38 50 38Q79 38 79 47', 'none', t.mid, 3.2) + hl('M24 44Q26 40 40 39', 1, 0.8));
    if (lv >= 3) s.add(gem(s, 50, 38, 3.2, G2));
    if (lv >= 7) for (const x of [16, 84]) s.add(gem(s, x, 86, 2.8, G2));
    s.add(G(B(s, 'M5 89L95 89L95 95L5 95Z', STONE, 1.8, 'hearth'), 'grain'));
    s.add(hl('M17 56Q19 36 35 28', 3, 0.5));
    steam(s, 68.5, 2, 14);
  },
  fountain(s, lv) {
    const t = trim(lv), G2 = STATIONS.fountain.gemPal;
    s.add(G(SB(s, 'M17 76L83 76L85 93L15 93Z', MINT, 2.4, 'fbase'), 'grain'));
    s.add(`<path d="M18 82L82 82" stroke="${MINT.lo}" stroke-width="1.2"/>`);
    // glass tank with drink
    const tank = 'M23 25L77 25L79 77L21 77Z';
    s.add(path(tank, s.rad({ hi: '#ffffff', mid: '#eef8ff', lo: '#c4e0f4', ink: '#2a5a8a' }, 'tank', '30%', '30%'), '#1e4a7a', 2.4, 'fill-opacity=".8"'));
    s.defs.push(`<clipPath id="tankc"><path d="${tank}"/></clipPath>`);
    s.add(`<g clip-path="url(#tankc)"><path d="M20 41Q35 37 50 41T80 40L80 80L20 80Z" fill="${s.lin(['#7cc8ff', '#2a7ad8'])}"/><path d="M20 41Q35 37 50 41T80 40" fill="none" stroke="#fff" stroke-width="1.6" opacity=".9"/>`
      + lemon(s, 37, 57, 7) + lemon(s, 61, 64, 6)
      + `<g filter="url(#bev)"><rect x="52" y="44" width="9" height="9" rx="2" fill="#e8f8ff" fill-opacity=".85" stroke="#4a8ac8" stroke-width="1" transform="rotate(12 56 48)"/><rect x="28" y="66" width="8" height="8" rx="2" fill="#e8f8ff" fill-opacity=".85" stroke="#4a8ac8" stroke-width="1" transform="rotate(-10 32 70)"/></g>`
      + bubble(s, 49, 52, 1.8) + bubble(s, 67, 50, 1.4) + bubble(s, 44, 70, 1.3) + bubble(s, 70, 70, 1.6) + '</g>');
    s.add(`<path d="${tank}" fill="none" stroke="#1e4a7a" stroke-width="2.4" stroke-linejoin="round"/>`);
    s.add(hl('M28 30L27 72', 3, 0.85)); s.add(hl('M33 30L32.5 44', 1.4, 0.7));
    // lid and tap
    s.add(B(s, 'M19 15L81 15L81 26L19 26Z', t, 2.2, 'lid'));
    s.add(`<path d="M21 20.5L79 20.5" stroke="${t.lo}" stroke-width="1"/>`);
    if (lv >= 3) s.add(gem(s, 50, 20.5, 3, G2));
    s.add(B(s, 'M43.5 76L56.5 76L56.5 84L52.5 84L52.5 89L47.5 89L47.5 84L43.5 84Z', t, 1.8, 'tap'));
    s.add(B(s, 'M40 72L60 72L60 77L40 77Z', t, 1.4, 'tapbar'));
    s.add(`<path d="M50 89L50 92" stroke="#4aa8f0" stroke-width="2" stroke-linecap="round"/>`);
    if (lv >= 7) for (const x of [24, 76]) s.add(gem(s, x, 86, 2.8, G2));
    for (const x of [26, 74]) s.add(rivet(s, x, 79.5, 1.1, t));
  },
  mixer(s, lv) {
    const t = trim(lv), G2 = STATIONS.mixer.gemPal;
    s.add(SB(s, 'M13 84L87 84L89 93L11 93Z', PINK, 2.2, 'mbase'));
    s.add(SB(s, 'M61 44L61 85L85 85L85 44Z', PINK, 2.2, 'mcol', '30%', '20%'));
    // bowl with batter
    s.add(B(s, 'M16 57L60 57Q60 87 38 87Q16 87 16 57Z', { hi: '#ffffff', mid: '#dcdfe8', lo: '#9a9eb4', ink: '#3e4258' }, 2.2, 'bowl', '30%', '30%'));
    s.add(path('M19 59.5L57 59.5Q56 66 51 68Q38 72 24 66Q19 64 19 59.5Z', s.rad({ hi: '#fff0f6', mid: '#ffb6d4', lo: '#e07aa8', ink: '#7a1a4a' }, 'batter', '40%', '20%')));
    s.add(`<path d="M26 62Q32 66 38 62Q44 66 50 62" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`);
    s.add(hl('M21 64Q24 78 34 84', 2.4, 0.75));
    s.add(`<path d="M16 57L60 57" stroke="#3e4258" stroke-width="1.4"/>`);
    // whisk
    s.add(`<path d="M38 46L38 60" stroke="${IRON.ink}" stroke-width="3.6"/><path d="M38 46L38 60" stroke="${IRON.mid}" stroke-width="1.6"/>`);
    s.add(`<path d="M33 50Q29 61 38 67Q47 61 43 50M35.5 50Q33 61 38 66Q43 61 40.5 50" fill="none" stroke="${IRON.ink}" stroke-width="1.8"/>`);
    // head
    s.add(SB(s, 'M11 30Q11 15 30 15L70 15Q87 15 87 32L87 42Q87 49 78 49L20 49Q11 49 11 40Z', PINK, 2.4, 'mhead', '30%', '20%'));
    s.add(path('M13 32L85 32', 'none', t.ink, 5.4) + path('M13 32L85 32', 'none', t.mid, 2.6));
    s.add(B(s, circ(74, 40.5, 4.2), t, 1.6, 'knob'));
    s.add(`<path d="M74 37.5L74 40.5" stroke="${t.ink}" stroke-width="1.2"/>`);
    s.add(hl('M17 26Q21 19 34 19', 3, 0.75));
    if (lv >= 3) s.add(gem(s, 50, 24, 3, G2));
    if (lv >= 7) for (const x of [67, 80]) s.add(gem(s, x, 64, 2.8, G2));
    const sp = [[24, 9, 30, '#ff5a8a'], [62, 7, -20, '#4ac8ff'], [44, 5, 80, '#ffe066'], [80, 6, 15, '#7ee08e'], [34, 2, -40, '#b98cff']];
    for (const [x, y, a, c] of sp) s.fx.push(`<rect x="${x - 3.2}" y="${y - 1.2}" width="6.4" height="2.4" rx="1.2" fill="${c}" stroke="rgba(60,20,60,.5)" stroke-width=".5" transform="rotate(${a} ${x} ${y})"/>`);
  },
  bbq(s, lv) {
    const t = trim(lv), G2 = STATIONS.bbq.gemPal;
    s.add('<g transform="translate(6 9.5) scale(.88)">');
    s.add(`<path d="M32 74L22 96M68 74L78 96M50 76L50 96" stroke="${PAN.ink}" stroke-width="5.6" stroke-linecap="round"/><path d="M32 74L22 96M68 74L78 96M50 76L50 96" stroke="${PAN.hi}" stroke-width="1.8" stroke-linecap="round"/>`);
    s.add(`<path d="M27 86L73 86" stroke="${PAN.ink}" stroke-width="2.4"/>`);
    // lid tilted open behind
    s.add(`<g transform="rotate(-14 20 30) translate(-4 -6)">${SB(s, 'M16 26Q16 6 50 6Q84 6 84 26L80 30L20 30Z', PAN, 2.2, 'blid', '35%', '20%')}${hl('M24 20Q30 10 46 9', 2, 0.6)}<path d="M20 26L80 26" stroke="${t.mid}" stroke-width="1.6"/></g>`);
    s.add(B(s, circ(40, -9, 4.4), t, 1.6, 'lidknob'));
    s.add(`<ellipse cx="50" cy="50" rx="34" ry="10" fill="${s.glowGrad('#ff9a2a', 0.9)}"/>`);
    s.add(flame(s, 29, 52, 14, 22, -2, 'b1')); s.add(flame(s, 50, 52, 18, 28, 1, 'b2')); s.add(flame(s, 71, 52, 14, 22, 2, 'b3'));
    s.add(sausage(s, 38, 46, 26, -8)); s.add(sausage(s, 62, 46, 26, 10));
    s.add(`<path d="M20 49L80 49M22 51L78 51" stroke="${IRON.ink}" stroke-width=".9" opacity=".7"/>`);
    // kettle bowl
    s.add(SB(s, 'M11 50Q11 81 50 81Q89 81 89 50Z', RED, 2.6, 'kettle', '35%', '20%'));
    s.add(`<path d="M11 50L89 50" stroke="${PAN.ink}" stroke-width="4.4"/><path d="M12 50L88 50" stroke="${PAN.hi}" stroke-width="1.2"/>`);
    for (const x of [22, 32, 68, 78]) s.add(`<circle cx="${x}" cy="${x < 50 ? 63 + (32 - x) * 0.2 : 63 + (x - 68) * 0.2}" r="1.6" fill="${RED.lo}"/>`);
    s.add(B(s, 'M43 61L57 61L57 68L43 68Z', t, 1.8, 'vent'));
    s.add(`<path d="M46 63L46 66M50 63L50 66M54 63L54 66" stroke="${t.ink}" stroke-width="1"/>`);
    s.add(hl('M19 58Q23 71 36 75', 3, 0.6));
    if (lv >= 3) s.add(gem(s, 50, 74, 3, G2));
    if (lv >= 7) for (const x of [22, 78]) s.add(gem(s, x, 57, 2.8, G2));
    s.add('</g>');
    steam(s, 45, 31, 13); steam(s, 59, 29, 14);
  },
};

export function stationParts(s, key, lv) {
  const st = STATIONS[key];
  dressBack(s, lv, st.glow, st.halo);
  body[key](s, lv);
  dressFront(s, lv, st.glow);
}
export const STATION_KEYS = Object.keys(STATIONS);
