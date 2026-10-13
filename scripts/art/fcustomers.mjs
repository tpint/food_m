// Painted customers for Sunny Spoon (food_m): same animals and outfits as art.ts, with painted shading.
import { f1, METAL, path, hl, sparkle } from './paint.mjs';
import { B, SB, G, circ } from './items.mjs';

const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
function eyes(s, y, gap, r, cx = 50) {
  let o = '';
  for (const x of [cx - gap, cx + gap]) {
    o += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 1.18)}" fill="${s.rad({ hi: '#6a5a8a', mid: '#2e2240', lo: '#1a1028', ink: '#0e0818' }, 'eye', '40%', '35%')}"/>`;
    o += `<circle cx="${f1(x - r * 0.33)}" cy="${f1(y - r * 0.42)}" r="${f1(r * 0.42)}" fill="#fff"/><circle cx="${f1(x + r * 0.38)}" cy="${f1(y + r * 0.42)}" r="${f1(r * 0.18)}" fill="#fff" opacity=".85"/>`;
  }
  return o;
}
const cheeks = (s, y, gap) => [50 - gap, 50 + gap].map((x) => `<ellipse cx="${x}" cy="${y}" rx="5.6" ry="3.4" fill="${s.glowGrad('#ff6a98', 0.75)}"/>`).join('');
function smile(y, w = 8) {
  return `<path d="M${50 - w} ${y}Q50 ${y + w * 1.25} ${50 + w} ${y}Z" fill="#6a1a2a" stroke="#2a1a3a" stroke-width="2" stroke-linejoin="round"/><path d="M${50 - w * 0.45} ${y + w * 0.58}Q50 ${y + w * 0.22} ${50 + w * 0.45} ${y + w * 0.58}Q50 ${y + w * 1.02} ${50 - w * 0.45} ${y + w * 0.58}Z" fill="#ff7a8a"/>`;
}
const mouth = (d, w = 2) => `<path d="${d}" fill="none" stroke="#2a1a3a" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shine = (x, y, rx, ry, rot, op = 0.55) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${x} ${y})"/>`;

function napkin(s) {
  s.defs.push('<pattern id="napk" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#fff"/><rect width="2.5" height="2.5" fill="#e8403a" opacity=".75"/><rect x="2.5" y="2.5" width="2.5" height="2.5" fill="#e8403a" opacity=".75"/></pattern>');
  return `<g filter="url(#bev)"><path d="M33 72L67 72L50 99Z" fill="url(#napk)" stroke="#5a2a3a" stroke-width="2" stroke-linejoin="round"/></g><path d="M36 73Q50 77 64 73" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>`;
}

/** Shoulders (with a napkin), ears behind, a round head, then the face. */
function customer(s, fur, ears, face, { useNapkin = true, body = fur } = {}) {
  s.add(SB(s, 'M11 101Q11 73 50 69Q89 73 89 101Z', body, 2.4, 'shoulders', '35%', '20%'));
  if (useNapkin) s.add(napkin(s));
  ears();
  s.add(SB(s, 'M50 15Q83 15 83 46Q83 75 50 75Q17 75 17 46Q17 15 50 15Z', fur, 2.6, 'head', '35%', '22%'));
  s.add(shine(33, 27, 6.4, 3.2, -38));
  face();
  return { shadow: 1 };
}

const C = {
  bunny(s) {
    const fur = { hi: '#ffffff', mid: '#f4eef6', lo: '#c8b8d8', ink: '#4e3e64' };
    return customer(s, fur, () => {
      for (const fl of [-1, 1]) {
        const x = 50 + fl * 14;
        s.add(`<g transform="rotate(${fl * 10} ${x} 26)">${SB(s, `M${x - 8} 26Q${x - 10} -6 ${x} -10Q${x + 10} -6 ${x + 8} 26Z`, fur, 2.2, 'ear', '35%', '20%')}<path d="M${x - 4} 22Q${x - 5} 0 ${x} -4Q${x + 5} 0 ${x + 4} 22Z" fill="${s.lin(['#ffd0e0', '#ff9ec0'])}"/></g>`);
      }
    }, () => {
      s.add(eyes(s, 44, 12, 5)); s.add(cheeks(s, 56, 21));
      s.add('<path d="M46 52L54 52L50 56Z" fill="#ff7aa8" stroke="#8a2458" stroke-width="1.4" stroke-linejoin="round"/>');
      s.add(mouth('M50 56L50 60M44 60Q47 64 50 60Q53 64 56 60'));
      s.add('<rect x="47" y="61" width="6" height="6" rx="1" fill="#fff" stroke="#2a1a3a" stroke-width="1.3"/><path d="M50 61L50 67" stroke="#c8c8d8" stroke-width=".8"/>');
      s.add('<path d="M28 52L38 54M28 57L38 56M72 52L62 54M72 57L62 56" stroke="#a898b8" stroke-width="1.1" stroke-linecap="round"/>');
    });
  },
  cat(s) {
    const fur = { hi: '#ffe4b8', mid: '#ffa64a', lo: '#d0701e', ink: '#5a2a08' };
    return customer(s, fur, () => {
      s.add(SB(s, 'M22 34L20 5L45 22Z', fur, 2.2, 'ce1') + SB(s, 'M78 34L80 5L55 22Z', fur, 2.2, 'ce2'));
      s.add('<path d="M25 28L24 13L36 22ZM75 28L76 13L64 22Z" fill="#ffb8c8"/>');
    }, () => {
      s.add(`<path d="M44 19L46 30M50 17L50 30M56 19L54 30M20 40L28 42M80 40L72 42" stroke="${fur.lo}" stroke-width="3" stroke-linecap="round"/>`);
      s.add(`<path d="M32 62Q50 76 68 62Q66 72 50 74Q34 72 32 62Z" fill="#fff2e0" opacity=".9"/>`);
      s.add(eyes(s, 44, 12, 5)); s.add(cheeks(s, 56, 21));
      s.add('<path d="M47 52L53 52L50 55Z" fill="#ff7aa8"/>' + mouth('M44 58Q47 61 50 57Q53 61 56 58'));
      s.add('<path d="M23 52L36 54M23 58L36 57M77 52L64 54M77 58L64 57" stroke="#6a3410" stroke-width="1.2" stroke-linecap="round"/>');
    });
  },
  bear(s) {
    const fur = { hi: '#ecc4a0', mid: '#a86e42', lo: '#704422', ink: '#341c08' };
    return customer(s, fur, () => {
      for (const x of [26, 74]) s.add(SB(s, circ(x, 22, 11), fur, 2.2, 'be') + `<circle cx="${x}" cy="22" r="5.6" fill="${s.rad({ hi: '#ffe0c0', mid: '#e8b890', lo: '#b88860', ink: '#5a3418' }, 'bei')}"/>`);
    }, () => {
      s.add(eyes(s, 40, 13, 4.6));
      s.add(B(s, ell(50, 56, 15, 11), { hi: '#fff4e4', mid: '#f0d0aa', lo: '#c8a070', ink: fur.ink }, 1.8, 'muz'));
      s.add(`<ellipse cx="50" cy="51" rx="5.2" ry="3.6" fill="${s.rad({ hi: '#6a5a5a', mid: '#2a1a1a', lo: '#1a0e0e', ink: '#0a0404' }, 'nose')}"/><ellipse cx="48.4" cy="50" rx="1.6" ry="1" fill="#fff" opacity=".8"/>`);
      s.add(smile(57, 6)); s.add(cheeks(s, 52, 24));
    });
  },
  fox(s) {
    const fur = { hi: '#ffd4a8', mid: '#ff8a3a', lo: '#c8521a', ink: '#4e1e06' };
    return customer(s, fur, () => {
      s.add(SB(s, 'M20 36L16 -1L47 22Z', fur, 2.2, 'fe1') + SB(s, 'M80 36L84 -1L53 22Z', fur, 2.2, 'fe2'));
      s.add('<path d="M18 13L16 -1L26 7ZM82 13L84 -1L74 7Z" fill="#3a2010"/><path d="M24 30L22 12L36 22ZM76 30L78 12L64 22Z" fill="#fff0e0"/>');
    }, () => {
      s.add(`<path d="M18 50Q30 45 40 56Q50 74 60 56Q70 45 82 50Q80 74 50 75Q20 74 18 50Z" fill="${s.lin(['#ffffff', '#fff0e0'])}"/>`);
      s.add(eyes(s, 42, 13, 4.6));
      s.add(`<ellipse cx="50" cy="56" rx="4.6" ry="3.2" fill="#2a1a1a"/><ellipse cx="48.8" cy="55" rx="1.4" ry=".8" fill="#fff" opacity=".8"/>`);
      s.add(smile(61, 6)); s.add(cheeks(s, 54, 24));
    }, { body: { hi: '#ffe0c0', mid: '#ff9a50', lo: '#c8521a', ink: '#4e1e06' } });
  },
  penguin(s) {
    const fur = { hi: '#6a7090', mid: '#2e3248', lo: '#181a28', ink: '#06080e' };
    return customer(s, fur, () => {
      s.add(path('M46 18Q48 5 57 7Q50 12 54 18Z', '#2e3248', '#06080e', 2));
    }, () => {
      s.add(`<path d="M50 34Q58 24 70 30Q78 40 74 54Q70 70 50 72Q30 70 26 54Q22 40 30 30Q42 24 50 34Z" fill="${s.rad({ hi: '#ffffff', mid: '#ffffff', lo: '#dfe2ee', ink: '#999' }, 'pf', '40%', '30%')}"/>`);
      s.add(eyes(s, 44, 11, 4.6)); s.add(cheeks(s, 56, 18));
      s.add(B(s, 'M41.5 54L58.5 54L50 64.5Z', { hi: '#ffe4a8', mid: '#ffa63c', lo: '#e0701a', ink: '#6a3008' }, 1.8, 'beak'));
    });
  },
  pig(s) {
    const fur = { hi: '#ffe8f0', mid: '#ffb0c8', lo: '#e07898', ink: '#7a2848' };
    return customer(s, fur, () => {
      s.add(`<g transform="rotate(-20 30 20)">${SB(s, 'M22 28L18 7L43 20Z', fur, 2.2, 'pe1')}</g><g transform="rotate(20 70 20)">${SB(s, 'M78 28L82 7L57 20Z', fur, 2.2, 'pe2')}</g>`);
    }, () => {
      s.add(eyes(s, 40, 13, 4.6)); s.add(cheeks(s, 52, 26));
      s.add(SB(s, ell(50, 54, 12.4, 8.8), { hi: '#ffd8e4', mid: '#ff8eb0', lo: '#d85a84', ink: fur.ink }, 2.2, 'snout', '40%', '30%'));
      s.add('<ellipse cx="45.5" cy="54" rx="2.2" ry="3.2" fill="#7a2848"/><ellipse cx="54.5" cy="54" rx="2.2" ry="3.2" fill="#7a2848"/>');
      s.add(mouth('M42 66Q50 72 58 66', 2.4));
    });
  },
  frog(s) {
    const fur = { hi: '#dcffb8', mid: '#6ccc4a', lo: '#3a8a2a', ink: '#163e0e' };
    return customer(s, fur, () => {
      for (const x of [32, 68]) s.add(SB(s, circ(x, 20, 13), fur, 2.2, 'fe'));
    }, () => {
      for (const x of [32, 68]) s.add(`<circle cx="${x}" cy="20" r="8.4" fill="${s.rad({ hi: '#ffffff', mid: '#ffffff', lo: '#e2e8dc', ink: '#888' }, 'few')}" stroke="${fur.ink}" stroke-width="2"/><circle cx="${x + 1}" cy="21" r="4.6" fill="#1a1a2a"/><circle cx="${x - 1}" cy="18.8" r="1.7" fill="#fff"/>`);
      s.add(`<path d="M30 60Q50 74 70 60Q64 72 50 73Q36 72 30 60Z" fill="#f0ffd8" opacity=".8"/>`);
      s.add(mouth('M28 52Q50 70 72 52', 3));
      s.add('<path d="M52 59Q60 58 62 66Q56 70 52 62Z" fill="#ff7a8a" stroke="#7a2a3a" stroke-width="1.5"/>');
      s.add('<circle cx="46" cy="40" r="1.6" fill="#163e0e"/><circle cx="54" cy="40" r="1.6" fill="#163e0e"/>');
      s.add(cheeks(s, 50, 26));
      for (const [x, y, r] of [[26, 36, 2], [74, 38, 1.6], [70, 30, 1.2]]) s.add(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fur.lo}" opacity=".5"/>`);
    });
  },
  panda(s) {
    const fur = { hi: '#ffffff', mid: '#f2f2f6', lo: '#c8c8d8', ink: '#1e1e2e' };
    const black = { hi: '#6a6a7a', mid: '#2e2e3a', lo: '#18181f', ink: '#06060c' };
    return customer(s, fur, () => {
      for (const x of [26, 74]) s.add(SB(s, circ(x, 22, 11), black, 2.2, 'pe'));
    }, () => {
      s.add(`<ellipse cx="36" cy="44" rx="9" ry="11" fill="${s.rad(black, 'patch')}" transform="rotate(-25 36 44)"/><ellipse cx="64" cy="44" rx="9" ry="11" fill="${s.rad(black, 'patch')}" transform="rotate(25 64 44)"/>`);
      for (const x of [37, 63]) s.add(`<circle cx="${x}" cy="44" r="4.2" fill="#fff"/><circle cx="${x}" cy="45" r="2.6" fill="#1a1a2a"/><circle cx="${x - 1}" cy="43.4" r="1" fill="#fff"/>`);
      s.add(`<ellipse cx="50" cy="55" rx="5.2" ry="3.6" fill="#1a1a1a"/><ellipse cx="48.6" cy="54" rx="1.4" ry=".8" fill="#fff" opacity=".8"/>`);
      s.add(smile(60, 6)); s.add(cheeks(s, 58, 24));
    }, { body: black });
  },
  dog(s) {
    const fur = { hi: '#fff4e0', mid: '#e8b878', lo: '#b07a3a', ink: '#4a2c0c' };
    const ear = { hi: '#cc9a70', mid: '#8a5a32', lo: '#5a3418', ink: '#2e1604' };
    return customer(s, fur, () => {}, () => {
      s.add(SB(s, 'M22 26Q7 30 9 56Q11 67 22 62Q26 44 30 30Z', ear, 2.2, 'de1') + SB(s, 'M78 26Q93 30 91 56Q89 67 78 62Q74 44 70 30Z', ear, 2.2, 'de2'));
      s.add(`<ellipse cx="62" cy="36" rx="9" ry="7" fill="${ear.mid}" opacity=".5"/>`);
      s.add(eyes(s, 40, 12, 4.6));
      s.add(B(s, ell(50, 56, 14, 10), { hi: '#ffffff', mid: '#fff8ee', lo: '#e8d8c0', ink: fur.ink }, 1.8, 'dmuz'));
      s.add(`<ellipse cx="50" cy="50" rx="6.2" ry="4.2" fill="${s.rad({ hi: '#6a5a5a', mid: '#2a1a1a', lo: '#1a0e0e', ink: '#0a0404' }, 'dn')}"/><circle cx="48" cy="48.8" r="1.4" fill="#fff" opacity=".8"/>`);
      s.add(mouth('M44 58Q47 61 50 57Q53 61 56 58'));
      s.add('<path d="M47 60Q47 70 50 70Q53 70 53 60Z" fill="#ff7a8a" stroke="#7a2a3a" stroke-width="1.5"/><path d="M50 61L50 67" stroke="#d84a5a" stroke-width=".8"/>');
      s.add(cheeks(s, 50, 24));
    });
  },
  raccoon(s) {
    const fur = { hi: '#e4e4ee', mid: '#9a9aae', lo: '#62627a', ink: '#1e1e30' };
    return customer(s, fur, () => {
      s.add(SB(s, 'M22 32L22 9L43 22Z', fur, 2.2, 're1') + SB(s, 'M78 32L78 9L57 22Z', fur, 2.2, 're2'));
      s.add('<path d="M25 26L25 15L35 22ZM75 26L75 15L65 22Z" fill="#3a3a4e"/>');
    }, () => {
      s.add(`<path d="M20 40Q34 32 50 42Q66 32 80 40Q78 54 64 52Q56 50 50 48Q44 50 36 52Q22 54 20 40Z" fill="${s.rad({ hi: '#5a5a6e', mid: '#2e2e3e', lo: '#1a1a26', ink: '#000' }, 'mask')}"/>`);
      s.add('<path d="M50 29L50 42" stroke="#2e2e3e" stroke-width="5" stroke-linecap="round"/>');
      for (const x of [37, 63]) s.add(`<circle cx="${x}" cy="44" r="4.8" fill="#fff"/><circle cx="${x}" cy="45" r="2.9" fill="#1a1a2a"/><circle cx="${x - 1}" cy="43.4" r="1.1" fill="#fff"/>`);
      s.add(`<path d="M30 56Q50 50 70 56Q66 74 50 74Q34 74 30 56Z" fill="${s.lin(['#ffffff', '#e8e8f0'])}"/>`);
      s.add(`<ellipse cx="50" cy="58" rx="4.6" ry="3.2" fill="#1a1a2a"/><ellipse cx="48.8" cy="57" rx="1.3" ry=".8" fill="#fff" opacity=".8"/>`);
      s.add(smile(62, 5));
    });
  },
  lion(s) {
    const fur = { hi: '#fff4c0', mid: '#ffc84a', lo: '#d89020', ink: '#5a3606' };
    const mane = { hi: '#ffb878', mid: '#e0702a', lo: '#a04412', ink: '#4a1a04' };
    return customer(s, fur, () => {
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2, x = +f1(50 + Math.cos(a) * 34), y = +f1(46 + Math.sin(a) * 34);
        s.add(SB(s, circ(x, y, 12), mane, 2.2, 'mane', '35%', '25%'));
        s.add(`<path d="M${f1(x - Math.cos(a) * 6)} ${f1(y - Math.sin(a) * 6)}L${f1(x + Math.cos(a) * 6)} ${f1(y + Math.sin(a) * 6)}" stroke="${mane.lo}" stroke-width="1.2" opacity=".6"/>`);
      }
      for (const x of [28, 72]) s.add(SB(s, circ(x, 22, 7), fur, 2, 'le') + `<circle cx="${x}" cy="22" r="3.4" fill="#e8a040"/>`);
    }, () => {
      s.add(eyes(s, 42, 12, 4.6));
      s.add(B(s, ell(50, 57, 13, 9), { hi: '#ffffff', mid: '#fff8e0', lo: '#f0d8a0', ink: fur.ink }, 1.8, 'lmuz'));
      s.add('<path d="M44 51L56 51L50 57Z" fill="#8a4a2a" stroke="#3a1a08" stroke-width="1.5" stroke-linejoin="round"/>');
      s.add(mouth('M44 61Q47 64 50 60Q53 64 56 61'));
      for (const [x, y] of [[42, 58], [40, 61], [58, 58], [60, 61]]) s.add(`<circle cx="${x}" cy="${y}" r=".8" fill="#8a5a2a"/>`);
      s.add(cheeks(s, 52, 24));
    });
  },
  critic(s) {
    const fur = { hi: '#ecccac', mid: '#a87a5a', lo: '#704a30', ink: '#30180a' };
    s.back.push(`<circle cx="50" cy="50" r="46" fill="${s.glowGrad('#ffe08a', 0.75)}"/>`);
    const SUIT = { hi: '#6a6a8a', mid: '#2e2e44', lo: '#18182a', ink: '#06060e' };
    const o = customer(s, fur, () => {}, () => {
      // top hat
      s.add(B(s, 'M27 22L73 22L75 27L25 27Z', SUIT, 1.8, 'brim'));
      s.add(SB(s, 'M34 22L36 -7L64 -7L66 22Z', SUIT, 2.2, 'hat', '30%', '20%'));
      s.add(`<path d="M35 13L65 13" stroke="#5a0808" stroke-width="6"/><path d="M35 13L65 13" stroke="#e8403a" stroke-width="4"/>`);
      s.add(hl('M39 -3L40 10', 1.6, 0.5));
      s.add(eyes(s, 40, 12, 4));
      s.add(`<circle cx="62" cy="40" r="8.2" fill="${s.rad({ hi: '#ffffff', mid: '#e8f4ff', lo: '#b8d8f0', ink: '#456' }, 'mono')}" fill-opacity=".55" stroke="${METAL.ink}" stroke-width="3"/><circle cx="62" cy="40" r="8.2" fill="none" stroke="${METAL.mid}" stroke-width="1.4"/><path d="M57 36A6 6 0 0 1 62 33.5" fill="none" stroke="#fff" stroke-width="1.4"/>`);
      s.add(`<path d="M70 42Q76 56 72 70" fill="none" stroke="${METAL.mid}" stroke-width="1.4"/>`);
      s.add(mouth('M35.5 32L44 34.4M56 34L64 31', 2.4));
      s.add(B(s, ell(50, 56, 20, 10), { hi: '#faecdc', mid: '#d8b898', lo: '#a88060', ink: fur.ink }, 1.8, 'cmuz'));
      s.add(`<ellipse cx="50" cy="50" rx="5.2" ry="3.6" fill="#1a1010"/><ellipse cx="48.6" cy="49" rx="1.4" ry=".8" fill="#fff" opacity=".8"/>`);
      s.add(B(s, 'M29 58Q40 49 50 56Q60 49 71 58Q64 67 50 62Q36 67 29 58Z', { hi: '#ffffff', mid: '#ffffff', lo: '#d8d8e8', ink: '#6a6a88' }, 1.6, 'stache'));
      s.add(B(s, 'M40 62L37.5 81L44.5 64Z', { hi: '#fffef8', mid: '#fffaf0', lo: '#e0d4b8', ink: '#7a6a50' }, 1.4, 'tusk') + B(s, 'M60 62L62.5 81L55.5 64Z', { hi: '#fffef8', mid: '#fffaf0', lo: '#e0d4b8', ink: '#7a6a50' }, 1.4, 'tusk'));
    }, { useNapkin: false, body: SUIT });
    // shirt front and bow tie
    s.add(path('M38 72L62 72L50 99Z', '#fff', '#6a6a88', 1.6));
    s.add(B(s, 'M50 79L35.5 70.5L35.5 87.5Z', { hi: '#ffb0a0', mid: '#e8403a', lo: '#a01a1a', ink: '#4e0606' }, 1.8, 'bow') + B(s, 'M50 79L64.5 70.5L64.5 87.5Z', { hi: '#ffb0a0', mid: '#e8403a', lo: '#a01a1a', ink: '#4e0606' }, 1.8, 'bow'));
    s.add(B(s, circ(50, 79, 3.6), { hi: '#ff9a8a', mid: '#c82a2a', lo: '#8a1010', ink: '#4e0606' }, 1.4, 'knot'));
    sparkle(s, 88, 14, 5, '#fff6c4'); sparkle(s, 12, 20, 4, '#fff6c4');
    return o;
  },
};

export const SPRITES = {};
for (const [k, d] of Object.entries(C)) SPRITES[`cus-${k}`] = { draw: d, fill: 0.94 };
