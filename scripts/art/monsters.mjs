// Painted monsters for Arcane Merge: same cast and personalities as art.ts, with more shading and detail.
import { f1, METAL, path, hl, sparkle, gem, rivet } from './paint-generators.mjs';
import { B, SB, G, circ, WAX, STONE, MOSS, WOOD, FLAME } from './items.mjs';

const HORN = { hi: '#fffaf0', mid: '#f4e2c0', lo: '#cfae7a', ink: '#7a5a2a' };
const COIN = { hi: '#fff6c2', mid: '#ffd147', lo: '#e09a1c', ink: '#8a5a10' };
const HERB = { hi: '#e2f8a8', mid: '#7cc254', lo: '#3e8030', ink: '#22501e' };

/** Big glossy cartoon eyes. `iris` tints the eye; `angry` adds brows. */
function eyes(s, y, gap, r, { cx = 50, iris = '#3a2a5a', look = 0.15 } = {}) {
  let o = '';
  for (const x of [cx - gap, cx + gap]) {
    o += `<ellipse cx="${x}" cy="${y}" rx="${f1(r)}" ry="${f1(r * 1.18)}" fill="${s.rad({ hi: '#6a5a8a', mid: iris, lo: '#1a1028', ink: '#0e0818' }, 'eye' + iris, '40%', '35%')}"/>`;
    o += `<circle cx="${f1(x - r * 0.33)}" cy="${f1(y - r * 0.42)}" r="${f1(r * 0.42)}" fill="#fff"/>`;
    o += `<circle cx="${f1(x + r * 0.38)}" cy="${f1(y + r * 0.42)}" r="${f1(r * 0.18)}" fill="#fff" opacity=".85"/>`;
    o += `<path d="M${f1(x - r * 0.75)} ${f1(y + r * 0.55)}Q${x} ${f1(y + r * 1.15)} ${f1(x + r * 0.75)} ${f1(y + r * 0.55)}" fill="none" stroke="${iris === '#3a2a5a' ? '#8a6ad0' : '#fff'}" stroke-width="${f1(r * 0.2)}" opacity=".45"/>`;
  }
  return o;
}
function cheeks(s, y, gap, cx = 50) {
  return [cx - gap, cx + gap].map((x) => `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="3.4" fill="${s.glowGrad('#ff6a98', 0.75)}"/>`).join('');
}
const mouthLine = (d, w = 2.4) => `<path d="${d}" fill="none" stroke="#2a1a3a" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shine = (x, y, rx, ry, rot, op = 0.6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${x} ${y})"/>`;

export const MONSTERS = {
  slime(s) {
    const p = { hi: '#e0fff6', mid: '#5fe0c0', lo: '#1e9e86', ink: '#0e6252' };
    s.add(SB(s, 'M13 86Q9 60 29 40Q41 23 50 21Q59 23 71 40Q91 60 87 86Q50 93 13 86Z', p, 2.6, 'sl', '35%', '25%'));
    // jelly depth: a darker core and bubbles suspended inside
    s.add(`<ellipse cx="54" cy="72" rx="26" ry="12" fill="${p.lo}" opacity=".3"/>`);
    for (const [x, y, r] of [[24, 74, 2.6], [76, 66, 1.8], [68, 80, 1.4], [30, 60, 1.2]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#fff" stroke-width=".9" opacity=".75"/>`);
    s.add(shine(33, 39, 8, 4.4, -38, 0.75)); s.add(shine(42, 30, 2.4, 1.6, -38, 0.8));
    s.add(eyes(s, 60, 12, 5.2)); s.add(cheeks(s, 71, 22));
    s.add(mouthLine('M44 72Q50 78 56 72'));
    s.add(path('M10 88Q14 84 20 87Q18 91 12 91Z', s.rad(p, 'sl2'), p.ink, 1.4));
  },
  bat(s) {
    const p = { hi: '#dccaff', mid: '#7a5ac8', lo: '#45307a', ink: '#2a1a50' };
    const M = { hi: '#c8b0f8', mid: '#5e3ea8', lo: '#34206a', ink: '#2a1a50' };
    for (const fl of [1, -1]) {
      const x = (n) => f1(50 + fl * n);
      s.add(SB(s, `M${x(10)} 50Q${x(30)} 28 ${x(46)} 38Q${x(36)} 45 ${x(40)} 58Q${x(30)} 54 ${x(26)} 64Q${x(20)} 56 ${x(10)} 62Z`, M, 2.2, 'wg' + fl, fl > 0 ? '30%' : '70%', '20%'));
      s.add(`<path d="M${x(12)} 52L${x(44)} 39M${x(14)} 55L${x(39)} 57M${x(16)} 57L${x(27)} 63" stroke="${M.ink}" stroke-width="1.3" opacity=".55" fill="none"/>`);
      s.add(`<path d="M${x(44)} 39l${fl * 2} -3" stroke="${M.ink}" stroke-width="1.6" stroke-linecap="round"/>`);
    }
    s.add(B(s, 'M34 31L37 15L47 28Z', p, 2, 'ear1') + B(s, 'M66 31L63 15L53 28Z', p, 2, 'ear2'));
    s.add('<path d="M37 28L38.4 20L43 27ZM63 28L61.6 20L57 27Z" fill="#ffb0d8" opacity=".85"/>');
    s.add(SB(s, 'M50 25Q71 25 71 52Q71 77 50 77Q29 77 29 52Q29 25 50 25Z', p, 2.4, 'bb', '35%', '25%'));
    s.add(`<ellipse cx="50" cy="64" rx="12" ry="10" fill="#b8a0f0" opacity=".45"/>`);
    s.add(`<path d="M42 66l3 2M50 63l0 3M58 66l-3 2" stroke="${p.lo}" stroke-width="1" opacity=".6"/>`);
    s.add(shine(38, 36, 5, 2.6, -40, 0.55));
    s.add(eyes(s, 48, 9, 4.6, { iris: '#c83a5a' })); s.add(cheeks(s, 58, 15));
    s.add('<path d="M44 61.5L46 67L48 61.5M52 61.5L54 67L56 61.5" fill="#fff" stroke="#2a1a3a" stroke-width="1.3" stroke-linejoin="round"/>');
    s.add(mouthLine('M42 61Q50 64 58 61', 1.8));
    s.add(`<path d="M44 77L44 81M56 77L56 81" stroke="${p.ink}" stroke-width="2.4" stroke-linecap="round"/>`);
  },
  ghost(s) {
    const p = { hi: '#ffffff', mid: '#efeaff', lo: '#b6a8e6', ink: '#6a5aa8' };
    s.back.push(`<ellipse cx="50" cy="50" rx="40" ry="42" fill="${s.glowGrad('#e8deff', 0.8)}"/>`);
    s.add(path('M22 50Q10 54 7 42', 'none', p.ink, 6) + path('M22 50Q10 54 7 42', 'none', p.mid, 3));
    s.add(path('M78 50Q90 52 93 40', 'none', p.ink, 6) + path('M78 50Q90 52 93 40', 'none', p.mid, 3));
    s.add(SB(s, 'M22 84L22 46Q22 13 50 13Q78 13 78 46L78 84L70 76L62 87L54 76L46 87L38 76L30 87Z', p, 2.6, 'gh', '35%', '20%'));
    s.add(`<path d="M28 80L28 50M72 78L72 52" stroke="${p.lo}" stroke-width="3" stroke-linecap="round" opacity=".35"/>`);
    s.add(shine(34, 26, 6, 3.4, -38, 0.9));
    s.add(eyes(s, 44, 11, 5.2, { iris: '#4a3a8a' })); s.add(cheeks(s, 55, 19));
    s.add(`<ellipse cx="50" cy="61" rx="5" ry="6.4" fill="${s.rad({ hi: '#6a3a6a', mid: '#3a1a3a', lo: '#2a1028', ink: '#1a0818' }, 'gm')}"/><ellipse cx="50" cy="64" rx="2.6" ry="2" fill="#ff7aa8"/>`);
    sparkle(s, 86, 20, 3.6, '#f4eeff'); sparkle(s, 14, 26, 2.8, '#f4eeff');
  },
  mushroom(s) {
    const cap = { hi: '#ffc0b0', mid: '#f0584a', lo: '#b02a2a', ink: '#6a1414' };
    const stem = { hi: '#fffcf4', mid: '#f6e6c8', lo: '#d8bf94', ink: '#7a5a2a' };
    s.add(SB(s, 'M29 54Q27 89 50 91Q73 89 71 54Z', stem, 2.4, 'stem', '35%', '30%'));
    s.add(`<path d="M34 58Q50 64 66 58" fill="none" stroke="${stem.lo}" stroke-width="1.4"/>`);
    // gills just under the cap
    s.add(path('M14 57Q50 66 86 57Q78 63 50 64Q22 63 14 57Z', '#e8c89a', stem.ink, 1.4));
    s.add(`<path d="M26 60L30 63M38 61L40 64M50 62L50 64.5M62 61L60 64M74 60L70 63" stroke="${stem.lo}" stroke-width="1"/>`);
    s.add(SB(s, 'M7 56Q7 13 50 11Q93 13 93 56Q50 64 7 56Z', cap, 2.6, 'cap', '35%', '20%'));
    for (const [x, y, r] of [[28, 34, 6.4], [53, 22, 7.4], [75, 38, 5.2], [45, 45, 4.2], [16, 48, 3], [84, 52, 2.6]]) {
      s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad({ hi: '#ffffff', mid: '#fff6ee', lo: '#f0d8c8', ink: '#a85a4a' }, 'spot', '35%', '30%')}" stroke="${cap.ink}" stroke-width=".9" opacity=".95"/>`);
    }
    s.add(shine(28, 22, 7, 3.4, -30, 0.45));
    s.add(eyes(s, 71, 9, 4.2));
    s.add(mouthLine('M35.5 63L44 67.5M64.5 63L56 67.5', 2.6));
    s.add(mouthLine('M45 82Q50 78 55 82', 2.4));
    s.add(cheeks(s, 78, 15));
  },
  imp(s) {
    const p = { hi: '#ffb8a8', mid: '#ef5a4a', lo: '#a82a2a', ink: '#5a1010' };
    s.add(path('M70 76Q92 80 88 60', 'none', p.ink, 5) + path('M70 76Q92 80 88 60', 'none', p.mid, 2.4));
    s.add(B(s, 'M88 50L95 60L88 63L82 58Z', p, 1.8, 'tail'));
    s.add(B(s, 'M30 31Q21 18 25 5Q34 17 41 24Z', HORN, 2, 'horn1') + B(s, 'M70 31Q79 18 75 5Q66 17 59 24Z', HORN, 2, 'horn2'));
    s.add(`<path d="M27 16l4 2M29 22l4 1M73 16l-4 2M71 22l-4 1" stroke="${HORN.lo}" stroke-width="1.2"/>`);
    s.add(SB(s, 'M50 17Q78 17 78 50Q78 86 50 86Q22 86 22 50Q22 17 50 17Z', p, 2.6, 'imp', '35%', '25%'));
    s.add(`<ellipse cx="50" cy="74" rx="15" ry="9" fill="#ffb070" opacity=".35"/>`);
    s.add(shine(34, 30, 6, 3, -40, 0.5));
    s.add(eyes(s, 48, 11, 5.2, { iris: '#e8a020' }));
    s.add(mouthLine('M31 37.5L44 42M69 37.5L56 42', 3));
    s.add('<path d="M37 63Q50 75 63 63Q50 67 37 63Z" fill="#fff" stroke="#2a1a3a" stroke-width="2.2" stroke-linejoin="round"/><path d="M42 64.5L44 68L46 65.2M54 65.2L56 68L58 64.5" fill="none" stroke="#2a1a3a" stroke-width="1"/>');
    s.add(cheeks(s, 58, 19));
    const fl = (cx, by, w, h) => SB(s, `M${cx} ${by - h}Q${cx + w * 0.15} ${by - h * 0.6} ${cx + w / 2} ${by - h * 0.45}Q${cx + w * 0.6} ${by} ${cx} ${by}Q${cx - w * 0.6} ${by} ${cx - w / 2} ${by - h * 0.45}Q${cx - w * 0.15} ${by - h * 0.6} ${cx} ${by - h}Z`, { hi: '#fff6c4', mid: '#ffb63c', lo: '#ef5a2a', ink: '#7a1a10' }, 1.6, 'impf', '50%', '75%')
      + path(`M${cx} ${by - h * 0.55}Q${cx + w * 0.3} ${by - h * 0.2} ${cx} ${by - 1.5}Q${cx - w * 0.3} ${by - h * 0.2} ${cx} ${by - h * 0.55}Z`, '#fff6c4');
    s.add(fl(50, 19, 13, 16));
  },
  golem(s) {
    const ST = { hi: '#eeebf4', mid: '#b3aec0', lo: '#7a7390', ink: '#3e3854' };
    s.add(G(SB(s, 'M10 60Q5 80 19 88L30 70Z', ST, 2.4, 'ga1'), 'grain') + G(SB(s, 'M90 60Q95 80 81 88L70 70Z', ST, 2.4, 'ga2'), 'grain'));
    s.add(G(SB(s, 'M22 89L18 40Q18 15 50 13Q82 15 82 40L78 89Z', ST, 2.6, 'gb', '35%', '25%'), 'grain'));
    // stone blocks / cracks
    s.add(`<path d="M20 58Q50 63 80 58M24 76Q36 78 44 77M58 78Q70 78 78 75M50 63L48 77" fill="none" stroke="${ST.lo}" stroke-width="1.4" opacity=".7"/>`);
    s.add(`<path d="M36 70L42 61L38 53M66 74L60 66" stroke="${ST.ink}" stroke-width="1.6" fill="none" opacity=".55"/>`);
    // glowing rune on the chest
    s.add(`<path d="M50 66L44 72L50 78L56 72Z" fill="none" stroke="#7ae8ff" stroke-width="4" opacity=".6" filter="url(#glows)"/><path d="M50 66L44 72L50 78L56 72Z" fill="none" stroke="#e0fbff" stroke-width="1.4"/>`);
    for (const [x, y, r] of [[30, 22, 10], [55, 16, 12.5], [74, 25, 8.5]]) s.add(B(s, `M${x - r} ${y + 4}Q${x - r * 0.6} ${y - r * 0.8} ${x} ${y - r * 0.7}Q${x + r * 0.7} ${y - r * 0.8} ${x + r} ${y + 4}Q${x} ${y + 1} ${x - r} ${y + 4}Z`, HERB, 1.8, 'moss'));
    s.add(`<path d="M40 22l0 6M60 20l0 8M28 26l0 4" stroke="${HERB.ink}" stroke-width="1.2" stroke-linecap="round"/>`);
    for (const x of [38, 62]) s.add(`<ellipse cx="${x}" cy="46" rx="8" ry="5.6" fill="${s.glowGrad('#9ff0ff', 0.9)}"/><ellipse cx="${x}" cy="46" rx="5.6" ry="3.8" fill="#bff6ff" stroke="#2a8aa8" stroke-width="1"/><ellipse cx="${x - 1.4}" cy="45" rx="1.8" ry="1.1" fill="#fff"/>`);
    s.add(mouthLine('M30 37L45 40M70 37L55 40', 3));
    s.add(mouthLine('M42 57L58 57', 3));
    s.add(flowerTiny(66, 18));
  },
  spider(s) {
    const p = { hi: '#c0a8e8', mid: '#5a3a8a', lo: '#33204f', ink: '#1a0e2c' };
    s.back.push(`<path d="M50 -6L50 30" stroke="#e8e0f4" stroke-width="1.4"/><path d="M50 -6L50 30" stroke="#8a7aa8" stroke-width=".5"/>`);
    for (const fl of [1, -1]) {
      const x = (n) => f1(50 + fl * n);
      for (const [a, b, c, d] of [[18, 46, 36, 34], [20, 56, 42, 52], [20, 64, 40, 74], [16, 72, 30, 90]]) {
        const dd = `M${x(a)} ${b}Q${x(c)} ${d - 14} ${x(c + 4)} ${d}`;
        s.add(path(dd, 'none', p.ink, 7.4) + path(dd, 'none', p.mid, 3.8) + `<path d="${dd}" fill="none" stroke="#c0a8e8" stroke-width="1" opacity=".6" transform="translate(-.4 -1)"/>`);
        s.add(`<circle cx="${x(c + 4)}" cy="${d}" r="2.2" fill="#ff5a8a" stroke="${p.ink}" stroke-width="1"/>`);
      }
    }
    s.add(SB(s, 'M50 30Q76 30 76 58Q76 86 50 86Q24 86 24 58Q24 30 50 30Z', p, 2.6, 'sp', '35%', '25%'));
    s.add(`<path d="M50 70L46 76L50 82L54 76Z" fill="#ff5a8a" opacity=".85"/>`);
    s.add(`<path d="M44 34Q50 40 56 34" fill="none" stroke="#9a7ad0" stroke-width="2" opacity=".7"/>`);
    s.add(shine(36, 42, 5.4, 2.8, -40, 0.45));
    s.add(eyes(s, 54, 9, 5, { iris: '#e8406a' }));
    for (const [x, y, r] of [[38, 44, 2.4], [62, 44, 2.4], [44, 41.5, 1.8], [56, 41.5, 1.8]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${s.rad({ hi: '#ffd0e0', mid: '#ff5a8a', lo: '#a82050', ink: '#5a0828' }, 'se')}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.35}" fill="#fff"/>`);
    s.add('<path d="M44 67.5L46 75L49 68.5M56 67.5L54 75L51 68.5" fill="#fff" stroke="#2a1a3a" stroke-width="1.5" stroke-linejoin="round"/>');
    s.add(cheeks(s, 64, 18));
  },
  crab(s) {
    const p = { hi: '#ffc8a8', mid: '#f0603a', lo: '#b0301e', ink: '#5a1408' };
    for (const fl of [1, -1]) {
      const x = (n) => f1(50 + fl * n);
      for (const y of [70, 78, 86]) { const d = `M${x(22)} ${y - 4}L${x(38)} ${y}L${x(42)} ${y + 6}`; s.add(path(d, 'none', p.ink, 5) + path(d, 'none', p.mid, 2.2)); }
      s.add(path(`M${x(22)} 54Q${x(32)} 44 ${x(34)} 36`, 'none', p.ink, 7) + path(`M${x(22)} 54Q${x(32)} 44 ${x(34)} 36`, 'none', p.mid, 3.4));
      s.add(SB(s, `M${x(30)} 38Q${x(26)} 14 ${x(40)} 10Q${x(48)} 10 ${x(46)} 22L${x(38)} 24L${x(44)} 30Q${x(42)} 40 ${x(30)} 38Z`, p, 2.2, 'claw' + fl, fl > 0 ? '30%' : '70%', '25%'));
      s.add(`<path d="M${x(39)} 14l${fl * 1.5} 2M${x(42)} 30l${fl * -1.5} 1" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".7"/>`);
      s.add(path(`M${x(10)} 46L${x(12)} 30`, 'none', p.ink, 4.4) + path(`M${x(10)} 46L${x(12)} 30`, 'none', p.mid, 1.8));
    }
    s.add(SB(s, 'M50 44Q84 44 86 66Q84 86 50 86Q16 86 14 66Q16 44 50 44Z', p, 2.6, 'cb', '35%', '25%'));
    for (const [x, y, r] of [[30, 62, 1.8], [70, 62, 1.8], [24, 72, 1.3], [76, 72, 1.3], [50, 52, 1.4]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${p.lo}" opacity=".55"/>`);
    s.add(`<path d="M24 78Q50 88 76 78" fill="none" stroke="#ffd0b0" stroke-width="1.6" opacity=".6"/>`);
    s.add(shine(34, 53, 8, 3.4, -15, 0.5));
    for (const x of [38, 62]) s.add(`<path d="M${x} 44L${x} 33" stroke="${p.ink}" stroke-width="3.6" stroke-linecap="round"/><path d="M${x} 44L${x} 33" stroke="${p.mid}" stroke-width="1.6"/><circle cx="${x}" cy="28" r="7" fill="${s.rad({ hi: '#ffffff', mid: '#ffffff', lo: '#e0e4f0', ink: '#9aa' }, 'ceye')}" stroke="${p.ink}" stroke-width="2.4"/><circle cx="${x + 1}" cy="29" r="3.6" fill="#2a1a3a"/><circle cx="${x}" cy="27.4" r="1.3" fill="#fff"/>`);
    s.add(cheeks(s, 68, 20));
    s.add(mouthLine('M42 70Q50 77 58 70'));
    for (const [x, y] of [[80, 92], [18, 92]]) s.fx.push(`<circle cx="${x}" cy="${y}" r="2" fill="#dff4ff" stroke="#3a6ea8" stroke-width=".8"/>`);
  },
  wolf(s) {
    const p = { hi: '#f4faff', mid: '#a8c0de', lo: '#6a86ae', ink: '#2a3c5e' };
    const W = { hi: '#ffffff', mid: '#eef4ff', lo: '#c8d6ec', ink: '#2a3c5e' };
    s.back.push(`<circle cx="50" cy="50" r="42" fill="${s.glowGrad('#cfe8ff', 0.8)}"/>`);
    s.add(B(s, 'M24 40L20 7L44 28Z', p, 2.2, 'we1') + B(s, 'M76 40L80 7L56 28Z', p, 2.2, 'we2'));
    s.add('<path d="M26.5 32L24 15L36.5 28ZM73.5 32L76 15L63.5 28Z" fill="#ffb8c8" opacity=".85"/>');
    s.add(SB(s, 'M50 21Q82 21 84 52Q86 70 74 80L64 74L60 87L50 80L40 87L36 74L26 80Q14 70 16 52Q18 21 50 21Z', p, 2.6, 'wh', '35%', '25%'));
    // fur tufts and frosty markings
    s.add(`<path d="M50 21L46 30L50 28L54 30Z" fill="${p.lo}" opacity=".55"/>`);
    s.add(`<path d="M20 56L26 58L21 62M80 56L74 58L79 62" fill="none" stroke="${p.lo}" stroke-width="1.4" stroke-linejoin="round"/>`);
    s.add(SB(s, 'M50 55Q65 55 67 70Q65 85 50 87Q35 85 33 70Q35 55 50 55Z', W, 2.4, 'muz', '40%', '30%'));
    s.add(`<ellipse cx="50" cy="61.5" rx="5.4" ry="3.8" fill="${s.rad({ hi: '#6a6a8a', mid: '#2a2a3a', lo: '#1a1a28', ink: '#0a0a14' }, 'nose')}"/><ellipse cx="48.4" cy="60.4" rx="1.6" ry="1" fill="#fff" opacity=".8"/>`);
    s.add(`<path d="M50 65L50 69" stroke="#2a1a3a" stroke-width="1.6"/>`);
    for (const x of [36, 64]) s.add(`<ellipse cx="${x}" cy="46" rx="5.2" ry="5.8" fill="${s.rad({ hi: '#e0f8ff', mid: '#7ad8ff', lo: '#2a8ac8', ink: '#14507a' }, 'weye')}"/><circle cx="${x + (x < 50 ? 1 : -1)}" cy="46.5" r="2.7" fill="#1a2a4a"/><circle cx="${x - 1.2}" cy="44.4" r="1.4" fill="#fff"/>`);
    s.add(mouthLine('M28 37.5L42 42M72 37.5L58 42', 2.8));
    s.add('<path d="M44 73L47 79L50 73L53 79L56 73" fill="#fff" stroke="#2a1a3a" stroke-width="1.5" stroke-linejoin="round"/>');
    s.add(shine(32, 30, 5, 2.4, -35, 0.6));
    for (const [x, y, r] of [[10, 24, 4], [90, 30, 3.5], [86, 8, 3]]) sparkle(s, x, y, r, '#e8f6ff');
    s.fx.push(`<path d="M14 40l3 0M15.5 38.5l0 3M88 46l3 0M89.5 44.5l0 3" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`);
  },
  treant(s) {
    const bark = { hi: '#dcac7c', mid: '#8a5a32', lo: '#5a361a', ink: '#341c0a' };
    s.add(path('M20 30Q8 22 6 10M80 30Q92 22 94 10', 'none', bark.ink, 7.4) + path('M20 30Q8 22 6 10M80 30Q92 22 94 10', 'none', bark.mid, 3.6));
    for (const [x, y, r] of [[14, 12, 8], [86, 12, 8], [30, 16, 14], [70, 16, 14], [50, 8, 16]]) s.add(SB(s, circ(x, y, r), HERB, 2.4, 'can', '35%', '25%'));
    for (const [x, y] of [[44, 0], [26, 10], [72, 8], [58, 14], [86, 8]]) s.add(`<path d="M${x} ${y}q2 -2 4 0q-2 2 -4 0z" fill="#e2f8a8" opacity=".8"/>`);
    for (const [x, y] of [[36, 20], [62, 4], [78, 20]]) s.add(`<circle cx="${x}" cy="${y}" r="1.8" fill="#ff6a5a" stroke="#7a1a10" stroke-width=".6"/>`);
    s.add(G(SB(s, 'M24 92L28 50Q28 24 50 24Q72 24 72 50L76 92L62 84L56 94L50 86L44 94L38 84Z', bark, 2.6, 'trunk', '35%', '25%'), 'woodgrain'));
    s.add(`<path d="M36 34Q34 46 38 56M64 36Q68 48 62 58M44 72Q42 80 46 88M58 74Q60 82 56 86" fill="none" stroke="${bark.lo}" stroke-width="2.4" stroke-linecap="round"/>`);
    s.add(`<path d="M36 34Q34 46 38 56M64 36Q68 48 62 58" fill="none" stroke="${bark.hi}" stroke-width=".8" stroke-linecap="round" opacity=".6" transform="translate(-1.2 0)"/>`);
    for (const x of [40, 60]) s.add(`<ellipse cx="${x}" cy="50" rx="6.4" ry="5.4" fill="#2a1408"/><circle cx="${x}" cy="50" r="5" fill="${s.glowGrad('#ffe066', 0.9)}"/><circle cx="${x}" cy="50" r="2.8" fill="#ffe066"/><circle cx="${x - 0.8}" cy="49.2" r="1" fill="#fff"/>`);
    s.add(mouthLine('M32 41L45 44M68 41L55 44', 2.8));
    s.add('<path d="M40 66Q50 60 60 66Q56 72 50 72Q44 72 40 66Z" fill="#2a1408"/>');
    s.add(B(s, 'M76 62Q86 58 88 66Q84 70 78 68Z', HERB, 1.6, 'tl'));
    s.add(B(s, 'M30 84Q36 78 40 86Z', { hi: '#f4e4c0', mid: '#c8a070', lo: '#8a6a3a', ink: '#4a3218' }, 1.2, 'shroom'));
    s.add(path('M20 90Q24 86 28 90', 'none', HERB.ink, 1.4));
  },
  cyclops(s) {
    const p = { hi: '#e6c8ff', mid: '#9a5ad8', lo: '#5e2e9a', ink: '#30145a' };
    s.add(SB(s, 'M18 58Q4 66 8 82Q16 86 22 76Z', p, 2.4, 'ca1') + SB(s, 'M82 58Q96 66 92 82Q84 86 78 76Z', p, 2.4, 'ca2'));
    s.add(B(s, 'M42 16Q42 1 55 -5Q50 6 58 14Z', HORN, 2, 'chorn'));
    s.add(`<path d="M46 8l4 1M47 3l4 0" stroke="${HORN.lo}" stroke-width="1.1"/>`);
    s.add(SB(s, 'M50 10Q86 10 86 52Q86 92 50 92Q14 92 14 52Q14 10 50 10Z', p, 2.6, 'cyb', '35%', '22%'));
    for (const [x, y, r] of [[24, 40, 2], [76, 46, 2.4], [70, 30, 1.4], [28, 58, 1.6]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${p.lo}" opacity=".5"/>`);
    s.add(shine(30, 24, 7, 3.4, -38, 0.5));
    s.add(G(B(s, 'M18 72Q50 82 82 72L80 82Q50 92 20 82Z', WOOD, 2.2, 'belt'), 'woodgrain'));
    s.add(B(s, 'M44.5 79.5L55.5 79.5L55.5 88.5L44.5 88.5Z', METAL, 1.8, 'buckle'));
    s.add(`<rect x="47.5" y="82.5" width="5" height="3" fill="${WOOD.lo}"/>`);
    s.add(`<circle cx="50" cy="40" r="15.5" fill="${s.rad({ hi: '#ffffff', mid: '#ffffff', lo: '#e2dcf0', ink: '#9a8ac0' }, 'cey', '40%', '35%')}" stroke="${p.ink}" stroke-width="3"/>`);
    s.add(`<circle cx="52" cy="42" r="8.4" fill="${s.rad({ hi: '#c8f8a8', mid: '#4aaa5a', lo: '#1e6a2e', ink: '#0e3a18' }, 'iris')}"/><circle cx="52" cy="42" r="4.2" fill="#140e1e"/><circle cx="48" cy="37.6" r="2.8" fill="#fff"/><circle cx="55" cy="45" r="1.2" fill="#fff" opacity=".8"/>`);
    s.add(mouthLine('M33 23Q50 17 67 23', 3.2));
    s.add(mouthLine('M36 60Q50 68 64 60', 2.6));
    s.add('<path d="M42 62L44 56L46 63.2M54 63.2L56 56L58 62" fill="#fff" stroke="#2a1a3a" stroke-width="1.4" stroke-linejoin="round"/>');
    s.add(cheeks(s, 58, 26));
  },
  dragon(s) {
    const p = { hi: '#ffd690', mid: '#f07a3a', lo: '#b8402a', ink: '#5a160c' };
    const wingP = { hi: '#ffc08a', mid: '#e0583a', lo: '#9a2a1e', ink: '#5a160c' };
    s.back.push(`<circle cx="50" cy="50" r="44" fill="${s.glowGrad('#ffb46a', 0.8)}"/>`);
    for (const fl of [1, -1]) {
      const x = (n) => f1(50 + fl * n);
      s.add(SB(s, `M${x(20)} 50Q${x(42)} 26 ${x(48)} 40Q${x(38)} 46 ${x(44)} 58Q${x(32)} 54 ${x(30)} 66Z`, wingP, 2.2, 'dw' + fl, fl > 0 ? '30%' : '70%', '20%'));
      s.add(`<path d="M${x(22)} 50L${x(47)} 39M${x(24)} 54L${x(43)} 57M${x(26)} 58L${x(31)} 65" stroke="${wingP.ink}" stroke-width="1.3" opacity=".6" fill="none"/>`);
    }
    s.add(B(s, 'M34 26Q30 10 22 6Q38 10 42 22Z', HORN, 2, 'dh1') + B(s, 'M66 26Q70 10 78 6Q62 10 58 22Z', HORN, 2, 'dh2'));
    s.add(SB(s, 'M50 18Q80 18 80 50Q80 88 50 88Q20 88 20 50Q20 18 50 18Z', p, 2.6, 'dg', '35%', '25%'));
    // scales on the brow and cheeks
    const sc = [];
    for (const [x, y] of [[44, 26], [50, 24], [56, 26], [28, 52], [72, 52], [26, 60], [74, 60]]) sc.push(`M${x - 2.6} ${y}Q${x} ${y + 3} ${x + 2.6} ${y}`);
    s.add(`<path d="${sc.join('')}" fill="none" stroke="${p.lo}" stroke-width="1.2" opacity=".7"/>`);
    s.add(SB(s, 'M36 62Q50 56 64 62Q66 82 50 84Q34 82 36 62Z', { hi: '#fffaf0', mid: '#ffe6b8', lo: '#e0b07a', ink: '#7a4a1a' }, 2.2, 'dbelly', '40%', '30%'));
    s.add(`<path d="M38 70Q50 73 62 70M39 77Q50 80 61 77" fill="none" stroke="#e0b07a" stroke-width="1.2"/>`);
    s.add(shine(32, 30, 6, 3, -40, 0.55));
    s.add(eyes(s, 44, 12, 5.6, { iris: '#c87a10' }));
    s.add(mouthLine('M29.5 33.5L42 38M70.5 33.5L58 38', 2.8));
    s.add('<ellipse cx="45" cy="64" rx="1.6" ry="2" fill="#2a1a3a"/><ellipse cx="55" cy="64" rx="1.6" ry="2" fill="#2a1a3a"/>');
    s.add(`<path d="M42 58Q45 52 44 48M58 58Q55 52 56 48" fill="none" stroke="#bbb" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`);
    s.add(cheeks(s, 56, 22));
    s.add(B(s, 'M37 13L43.5 1.5L50 10L56.5 1.5L63 13Q50 16 37 13Z', COIN, 2, 'crown'));
    s.add(gem(s, 50, 10.5, 1.8, { hi: '#ffe0e0', mid: '#e83a3a', lo: '#8a1414', ink: '#4a0808' }));
    s.add(`<circle cx="43.5" cy="2" r="1.2" fill="#8fe0ff" stroke="${COIN.ink}" stroke-width=".5"/><circle cx="56.5" cy="2" r="1.2" fill="#8fe0ff" stroke="${COIN.ink}" stroke-width=".5"/>`);
    for (const [x, y, r] of [[14, 24, 1.6], [86, 22, 1.4], [90, 70, 1.2]]) s.fx.push(`<circle cx="${x}" cy="${y}" r="${r * 2.4}" fill="${s.glowGrad('#ffd27a', 0.7)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd27a" stroke="#9c3020" stroke-width=".5"/>`);
  },
};

function flowerTiny(x, y) {
  let o = '';
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 - Math.PI / 2; o += `<circle cx="${f1(x + Math.cos(a) * 1.8)}" cy="${f1(y + Math.sin(a) * 1.8)}" r="1.4" fill="#fff6fa" stroke="#8a5a7a" stroke-width=".5"/>`; }
  return o + `<circle cx="${x}" cy="${y}" r="1.1" fill="#ffd147"/>`;
}
