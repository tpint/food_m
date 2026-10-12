// The tower room shown on the Tower screen. Every restoration task has a
// "broken" and a "fixed" layer; finishing a task swaps them with a sparkle.
// The whole room also gets brighter as more tasks are done.

import type { ThemeId } from './scene';

const INK = '#2e1d40';
const sw = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;

/** Where each task's sparkle burst plays, in room coordinates (400 x 320). */
const LIBRARY_ANCHORS: Record<string, [number, number]> = {
  cobwebs: [200, 40],
  candles: [200, 175],
  shelf: [75, 150],
  window: [200, 95],
  hearth: [332, 205],
  grimoire: [200, 205],
};

const LAB_ANCHORS: Record<string, [number, number]> = {
  cauldron: [155, 250],
  potions: [68, 150],
  alembic: [330, 180],
  charts: [334, 78],
  crystals: [200, 45],
  vault: [200, 175],
};

const layer = (task: string, state: 'broken' | 'fixed', body: string) =>
  `<g class="rl" data-task="${task}" data-state="${state}">${body}</g>`;

function books(x: number, y: number, w: number, seed: number): string {
  const colors = ['#8a3b5e', '#3b5a8a', '#5e8a3b', '#a8642e', '#5a3b8a', '#2e7a7a', '#b04a3a'];
  let out = '', bx = x, k = seed;
  while (bx < x + w - 8) {
    k = (k * 16807) % 2147483647;
    const bw = 7 + (k % 6), bh = 22 + (k % 13);
    out += `<rect x="${bx}" y="${y - bh}" width="${bw}" height="${bh}" rx="1.5" fill="${colors[k % colors.length]}" ${sw.replace('2.5', '1.6')}/>`;
    out += `<rect x="${bx + 1.5}" y="${y - bh + 5}" width="${bw - 3}" height="2" fill="#f0cc80" opacity=".7"/>`;
    bx += bw + 1;
  }
  return out;
}

function flame(x: number, y: number, s: number): string {
  return `<path d="M${x} ${y - 14 * s}Q${x + 7 * s} ${y - 6 * s} ${x + 5 * s} ${y}Q${x} ${y + 3 * s} ${x - 5 * s} ${y}Q${x - 7 * s} ${y - 6 * s} ${x} ${y - 14 * s}Z" fill="url(#rFire)" stroke="#9c3020" stroke-width="1.5"/>`
    + `<path d="M${x} ${y - 7 * s}Q${x + 3 * s} ${y - 2 * s} ${x} ${y}Q${x - 3 * s} ${y - 2 * s} ${x} ${y - 7 * s}Z" fill="#fff6c4"/>`;
}

function candelabra(x: number, lit: boolean): string {
  let out = `<path d="M${x} 256L${x} 196M${x - 18} 196Q${x - 18} 210 ${x} 210Q${x + 18} 210 ${x + 18} 196" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  out += `<path d="M${x} 256L${x} 196M${x - 18} 196Q${x - 18} 210 ${x} 210Q${x + 18} 210 ${x + 18} 196" fill="none" stroke="#d8a94a" stroke-width="3" stroke-linecap="round"/>`;
  out += `<path d="M${x - 12} 258L${x + 12} 258L${x + 8} 252L${x - 8} 252Z" fill="#d8a94a" ${sw.replace('2.5', '2')}/>`;
  for (const cx of [x - 18, x, x + 18]) {
    const top = cx === x ? 176 : 182;
    out += `<rect x="${cx - 4}" y="${top}" width="8" height="${(cx === x ? 196 : 196) - top}" rx="2" fill="#fff3d6" ${sw.replace('2.5', '1.6')}/>`;
    if (lit) out += `<circle cx="${cx}" cy="${top - 6}" r="16" fill="url(#rGlow)"/>` + flame(cx, top - 1, 0.7);
    else out += `<path d="M${cx} ${top}L${cx} ${top - 4}" stroke="#3a2a20" stroke-width="1.6"/>`;
  }
  return out;
}

function web(x: number, y: number, s: number, flip: number): string {
  let d = '';
  for (const a of [0, 25, 50, 75, 90]) {
    const r = (a * Math.PI) / 180;
    d += `M0 0L${(Math.cos(r) * 60).toFixed(1)} ${(Math.sin(r) * 60).toFixed(1)}`;
  }
  for (const rr of [18, 34, 50]) {
    const pts = [0, 25, 50, 75, 90].map((a) => [Math.cos((a * Math.PI) / 180) * rr, Math.sin((a * Math.PI) / 180) * rr]);
    d += `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}` + pts.slice(1).map((p) => `Q${(p[0] * 0.85).toFixed(1)} ${(p[1] * 0.85).toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
  }
  return `<path d="${d}" transform="translate(${x} ${y}) scale(${s * flip} ${s})" fill="none" stroke="#e8e0f0" stroke-width="${1.6 / s}" opacity=".85"/>`;
}

function libraryRoom(): string {
  const defs = `<defs>
    <linearGradient id="rWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3a6a"/><stop offset="1" stop-color="#6a5488"/></linearGradient>
    <linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5236"/><stop offset="1" stop-color="#4a2e1c"/></linearGradient>
    <linearGradient id="rWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6438"/><stop offset=".5" stop-color="#c8925a"/><stop offset="1" stop-color="#7a4a26"/></linearGradient>
    <linearGradient id="rStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8b0c8"/><stop offset="1" stop-color="#7d7690"/></linearGradient>
    <linearGradient id="rFire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".5" stop-color="#ffa23c"/><stop offset="1" stop-color="#e8502e"/></linearGradient>
    <linearGradient id="rSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2a6a"/><stop offset="1" stop-color="#4a3a9a"/></linearGradient>
    <linearGradient id="rBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>
    <radialGradient id="rGlow"><stop offset="0" stop-color="#ffc46a" stop-opacity=".8"/><stop offset="1" stop-color="#ffc46a" stop-opacity="0"/></radialGradient>
    <radialGradient id="rMagic"><stop offset="0" stop-color="#d8b8ff" stop-opacity=".9"/><stop offset="1" stop-color="#9a6aff" stop-opacity="0"/></radialGradient>
  </defs>`;

  let base = `<rect width="400" height="320" fill="url(#rWall)"/>`;
  for (let y = 0; y < 250; y += 26) {
    for (let x = (y / 26) % 2 ? -24 : 0; x < 400; x += 48) base += `<rect x="${x + 2}" y="${y + 2}" width="44" height="22" rx="4" fill="#fff" opacity=".05"/>`;
  }
  base += `<rect y="248" width="400" height="72" fill="url(#rFloor)"/>`;
  for (let x = -20; x < 420; x += 40) base += `<path d="M${x} 248L${x - 24} 320" stroke="#3a2214" stroke-width="2"/>`;
  base += `<rect y="244" width="400" height="7" fill="#5a3a26"/>`;
  base += `<ellipse cx="200" cy="290" rx="150" ry="22" fill="#6a2a4a" ${sw}/><ellipse cx="200" cy="290" rx="132" ry="15" fill="none" stroke="#e8b04a" stroke-width="2.5"/>`;
  // Window frame (always there).
  base += `<path d="M150 150V80a50 50 0 0 1 100 0v70z" fill="#140c24" stroke="#5a3a26" stroke-width="9"/>`;
  base += `<rect x="142" y="148" width="116" height="10" rx="3" fill="#6a4630" ${sw}/>`;
  // Shelf frame, hearth stone, lectern stand (always there).
  base += `<rect x="20" y="58" width="112" height="190" rx="4" fill="#3a2418" ${sw}/>`;
  base += `<path d="M282 248L282 140L388 140L388 248Z" fill="url(#rStone)" ${sw}/><path d="M298 248L298 186Q335 158 372 186L372 248Z" fill="#1e1214" ${sw}/>`;
  base += `<rect x="274" y="130" width="122" height="14" rx="3" fill="#6a4630" ${sw}/>`;
  base += `<path d="M190 258L194 218L206 218L210 258Z" fill="url(#rWood)" ${sw}/><path d="M176 260L224 260L220 266L180 266Z" fill="#6a4630" ${sw}/>`;
  base += `<path d="M168 222L200 208L232 222L228 228L200 216L172 228Z" fill="url(#rWood)" ${sw}/>`;

  // --- cobwebs
  const cobB = web(0, 0, 1.6, 1) + web(400, 0, 1.6, -1) + web(132, 58, 0.8, -1) + web(282, 140, 0.7, 1)
    + `<rect width="400" height="320" fill="#b8b0c8" opacity=".18"/>`;
  const cobF = `<g fill="#fff" opacity=".6"><circle cx="90" cy="40" r="1.4"/><circle cx="260" cy="60" r="1.2"/><circle cx="330" cy="110" r="1.5"/><circle cx="160" cy="200" r="1.1"/></g>`;

  // --- candles
  const canB = candelabra(140, false) + candelabra(260, false);
  const canF = candelabra(140, true) + candelabra(260, true);

  // --- shelf
  const shelfB = `<path d="M24 120L128 132M24 182L128 168" stroke="#7a4a26" stroke-width="7" stroke-linecap="round"/>`
    + books(30, 120, 40, 3) + `<g transform="rotate(-12 80 250)">${books(40, 250, 50, 9)}</g>` + books(90, 250, 34, 5)
    + `<path d="M26 240L128 200" stroke="#7a4a26" stroke-width="7" stroke-linecap="round"/>`;
  let shelfF = '';
  for (const y of [100, 150, 200, 246]) {
    shelfF += books(26, y, 100, y);
    shelfF += `<rect x="22" y="${y}" width="108" height="7" rx="2" fill="url(#rWood)" ${sw.replace('2.5', '1.8')}/>`;
  }
  shelfF += `<circle cx="112" cy="88" r="7" fill="#7fe0ff" ${sw.replace('2.5', '1.8')}/><rect x="109" y="76" width="6" height="6" fill="#6a4a3a"/>`;

  // --- window
  const winB = `<path d="M158 145L186 70L210 150M200 60L230 145" stroke="#3a2a50" stroke-width="2"/>`
    + `<rect x="140" y="80" width="120" height="12" rx="2" fill="url(#rWood)" transform="rotate(-8 200 86)" ${sw}/>`
    + `<rect x="140" y="112" width="120" height="12" rx="2" fill="url(#rWood)" transform="rotate(6 200 118)" ${sw}/>`;
  const panes = ['#e8502e', '#3a98e8', '#5fd0aa', '#c79056'];
  let winF = `<path d="M150 150V80a50 50 0 0 1 100 0v70z" fill="url(#rSky)"/>`;
  winF += `<circle cx="214" cy="72" r="13" fill="#fff4d0"/><circle cx="220" cy="68" r="11" fill="#3a3a8a" opacity=".25"/>`;
  winF += `<path d="M150 150V80a50 50 0 0 1 50 -50V150Z" fill="${panes[0]}" opacity=".35"/><path d="M200 30a50 50 0 0 1 50 50V150H200Z" fill="${panes[1]}" opacity=".35"/>`;
  winF += `<path d="M150 112H250" stroke="${panes[2]}" stroke-width="6" opacity=".7"/><path d="M200 30V150" stroke="#5a3a26" stroke-width="5"/><path d="M150 112H250" stroke="#5a3a26" stroke-width="3"/>`;
  winF += `<path d="M155 150L245 150L300 290L100 290Z" fill="url(#rBeam)"/>`;

  // --- hearth
  const hearthB = `<path d="M312 244Q335 236 358 244" stroke="#6a6070" stroke-width="6" stroke-linecap="round"/><path d="M314 240L330 236M340 238L356 242" stroke="#3a2a20" stroke-width="5" stroke-linecap="round"/>`;
  const hearthF = `<circle cx="335" cy="226" r="60" fill="url(#rGlow)"/>` + `<path d="M314 240L330 236M340 238L356 242" stroke="#3a2a20" stroke-width="5" stroke-linecap="round"/>`
    + flame(335, 240, 2.2) + flame(320, 242, 1.2) + flame(350, 242, 1.3);

  // --- grimoire
  const grimB = `<g transform="rotate(-6 200 210)"><rect x="182" y="200" width="36" height="12" rx="2" fill="#6a5a7a" ${sw}/><rect x="184" y="198" width="32" height="4" fill="#9a8aa8"/></g>`;
  const grimF = `<circle cx="200" cy="188" r="44" fill="url(#rMagic)"/>`
    + `<path d="M200 194Q186 186 168 190L170 210Q186 206 200 214Q214 206 230 210L232 190Q214 186 200 194Z" fill="#6a3fb8" ${sw}/>`
    + `<path d="M200 190Q186 182 172 186L174 204Q186 202 200 208Z" fill="#fffaf0" ${sw.replace('2.5', '1.8')}/><path d="M200 190Q214 182 228 186L226 204Q214 202 200 208Z" fill="#f4e6c4" ${sw.replace('2.5', '1.8')}/>`
    + `<path d="M200 172L200 162M186 176L180 168M214 176L220 168" stroke="#f3e6ff" stroke-width="3" stroke-linecap="round"/>`;

  // Gets lighter as the room is restored (opacity set from code).
  const dark = `<rect id="room-dark" width="400" height="320" fill="#0a0518" opacity=".5" pointer-events="none"/>`;

  return `<svg class="room" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">${defs}${base}`
    + layer('window', 'broken', winB) + layer('window', 'fixed', winF)
    + layer('shelf', 'broken', shelfB) + layer('shelf', 'fixed', shelfF)
    + layer('hearth', 'broken', hearthB) + layer('hearth', 'fixed', hearthF)
    + layer('candles', 'broken', canB) + layer('candles', 'fixed', canF)
    + layer('grimoire', 'broken', grimB) + layer('grimoire', 'fixed', grimF)
    + dark
    + layer('cobwebs', 'broken', cobB) + layer('cobwebs', 'fixed', cobF)
    + `</svg>`;
}

function bottle(x: number, y: number, color: string, tall: boolean): string {
  if (tall) {
    return `<rect x="${x - 4}" y="${y - 26}" width="8" height="8" fill="#6a4a3a"/>`
      + `<path d="M${x - 5} ${y - 18}L${x + 5} ${y - 18}L${x + 7} ${y}L${x - 7} ${y}Z" fill="${color}" ${sw.replace('2.5', '1.6')}/>`
      + `<rect x="${x - 4}" y="${y - 14}" width="2.5" height="10" fill="#fff" opacity=".5"/>`;
  }
  return `<rect x="${x - 3}" y="${y - 24}" width="6" height="7" fill="#6a4a3a"/>`
    + `<circle cx="${x}" cy="${y - 9}" r="9" fill="${color}" ${sw.replace('2.5', '1.6')}/>`
    + `<circle cx="${x - 3}" cy="${y - 12}" r="2.5" fill="#fff" opacity=".6"/>`;
}

function floatCrystal(x: number, y: number, h: number, color: string, glow: boolean): string {
  const w = h * 0.45;
  return (glow ? `<circle cx="${x}" cy="${y}" r="${h}" fill="url(#rMagic)"/>` : '')
    + `<path d="M${x} ${y - h / 2}L${x + w / 2} ${y}L${x} ${y + h / 2}L${x - w / 2} ${y}Z" fill="${color}" ${sw.replace('2.5', '1.8')}/>`
    + `<path d="M${x} ${y - h / 2}L${x - w / 2} ${y}L${x} ${y + h / 2}Z" fill="#fff" opacity=".35"/>`;
}

function labRoom(): string {
  const defs = `<defs>
    <linearGradient id="rWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a5a"/><stop offset="1" stop-color="#46507a"/></linearGradient>
    <linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5a72"/><stop offset="1" stop-color="#34344a"/></linearGradient>
    <linearGradient id="rWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6438"/><stop offset=".5" stop-color="#c8925a"/><stop offset="1" stop-color="#7a4a26"/></linearGradient>
    <linearGradient id="rStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8a8c0"/><stop offset="1" stop-color="#6a6a88"/></linearGradient>
    <linearGradient id="rIron" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a4a5a"/><stop offset=".5" stop-color="#7a7a90"/><stop offset="1" stop-color="#3a3a48"/></linearGradient>
    <linearGradient id="rBrass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8862e"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#9a6a1e"/></linearGradient>
    <linearGradient id="rFire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".5" stop-color="#ffa23c"/><stop offset="1" stop-color="#e8502e"/></linearGradient>
    <linearGradient id="rBrew" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8ffb0"/><stop offset="1" stop-color="#4ec86a"/></linearGradient>
    <radialGradient id="rGlow"><stop offset="0" stop-color="#ffc46a" stop-opacity=".8"/><stop offset="1" stop-color="#ffc46a" stop-opacity="0"/></radialGradient>
    <radialGradient id="rGreen"><stop offset="0" stop-color="#a8ff9a" stop-opacity=".75"/><stop offset="1" stop-color="#4ec86a" stop-opacity="0"/></radialGradient>
    <radialGradient id="rMagic"><stop offset="0" stop-color="#d8b8ff" stop-opacity=".9"/><stop offset="1" stop-color="#9a6aff" stop-opacity="0"/></radialGradient>
    <radialGradient id="rGold"><stop offset="0" stop-color="#fff2b0" stop-opacity=".95"/><stop offset="1" stop-color="#ffb43c" stop-opacity="0"/></radialGradient>
  </defs>`;

  let base = `<rect width="400" height="320" fill="url(#rWall)"/>`;
  for (let y = 0; y < 250; y += 26) {
    for (let x = (y / 26) % 2 ? -24 : 0; x < 400; x += 48) base += `<rect x="${x + 2}" y="${y + 2}" width="44" height="22" rx="4" fill="#fff" opacity=".05"/>`;
  }
  base += `<rect y="248" width="400" height="72" fill="url(#rFloor)"/>`;
  for (let x = 0; x < 400; x += 50) base += `<path d="M${x} 248L${x - 20} 320" stroke="#26263a" stroke-width="2"/>`;
  base += `<path d="M0 282H400" stroke="#26263a" stroke-width="2"/><rect y="244" width="400" height="7" fill="#3a3a52"/>`;
  // Vault arch, shelf frame, worktable and the cauldron's tripod are always there.
  base += `<path d="M154 248V108a46 46 0 0 1 92 0V248Z" fill="url(#rStone)" ${sw}/>`;
  base += `<rect x="18" y="56" width="104" height="190" rx="4" fill="#3a2418" ${sw}/>`;
  base += `<rect x="266" y="196" width="128" height="10" rx="3" fill="url(#rWood)" ${sw}/><path d="M276 206L272 250M384 206L388 250" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M276 206L272 250M384 206L388 250" stroke="#7a4a26" stroke-width="3" stroke-linecap="round"/>`;
  base += `<path d="M120 296L134 262M190 296L176 262" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  base += `<circle cx="286" cy="40" r="3" fill="#b8862e"/><circle cx="382" cy="40" r="3" fill="#b8862e"/>`;

  // --- vault
  const vaultB = `<path d="M166 246V112a34 34 0 0 1 68 0V246Z" fill="url(#rIron)" ${sw}/>`
    + `<path d="M166 120L234 220M234 120L166 220" stroke="#8a8aa0" stroke-width="7" stroke-linecap="round" stroke-dasharray="8 5"/>`
    + `<rect x="188" y="156" width="24" height="22" rx="4" fill="url(#rBrass)" ${sw}/><path d="M194 156V148a6 6 0 0 1 12 0V156" fill="none" stroke="${INK}" stroke-width="3"/>`
    + `<path d="M200 162L200 172M195 167L205 167" stroke="#7a1a1a" stroke-width="2.5"/>`;
  const vaultF = `<path d="M166 246V112a34 34 0 0 1 68 0V246Z" fill="#140a1e"/>`
    + `<circle cx="200" cy="170" r="70" fill="url(#rGold)"/>`
    + `<path d="M166 246V112a34 34 0 0 1 10 -24L176 246Z" fill="url(#rIron)" ${sw}/>`
    + `<path d="M200 146L214 170L200 194L186 170Z" fill="#e6b066" ${sw}/><path d="M200 146L186 170L200 194Z" fill="#fff0c8" opacity=".6"/>`
    + `<path d="M200 128V118M178 140L172 134M222 140L228 134" stroke="#fff2b0" stroke-width="3" stroke-linecap="round"/>`;

  // --- potions
  let potB = '';
  for (const y of [110, 170, 240]) potB += `<rect x="20" y="${y}" width="100" height="7" rx="2" fill="url(#rWood)" ${sw.replace('2.5', '1.8')}/>`;
  potB += bottle(40, 110, '#8a8aa0', false) + `<g transform="rotate(80 90 240)">${bottle(90, 240, '#8a8aa0', true)}</g>`;
  potB += `<path d="M40 300L48 292L52 302ZM70 304L76 296L82 306ZM100 298L104 292L110 300Z" fill="#c8d8f0" opacity=".8" ${sw.replace('2.5', '1.2')}/>`;
  let potF = '';
  const pc = ['#ff7fc8', '#7fd0ff', '#9dff7f', '#ffd36a', '#b98cff', '#ff8a5a'];
  [110, 170, 240].forEach((y, r) => {
    potF += `<rect x="20" y="${y}" width="100" height="7" rx="2" fill="url(#rWood)" ${sw.replace('2.5', '1.8')}/>`;
    for (let k = 0; k < 5; k++) potF += bottle(32 + k * 19, y, pc[(k + r * 2) % pc.length], (k + r) % 2 === 0);
  });
  potF += `<circle cx="70" cy="150" r="56" fill="url(#rMagic)" opacity=".5"/>`;

  // --- star charts
  const chartB = `<path d="M296 46L326 50L318 96L300 88Z" fill="#e8dcc0" ${sw.replace('2.5', '1.8')} transform="rotate(-8 310 70)"/>`
    + `<path d="M350 44L378 48L372 70L356 74Z" fill="#e8dcc0" ${sw.replace('2.5', '1.8')}/>`
    + `<path d="M338 92L360 98L352 116Z" fill="#d8ccb0" ${sw.replace('2.5', '1.8')}/>`;
  let chartF = `<rect x="282" y="38" width="104" height="80" rx="3" fill="#1c2450" stroke="url(#rBrass)" stroke-width="5"/>`;
  const stars = [[300, 60], [318, 52], [332, 70], [352, 58], [370, 74], [344, 96], [312, 92]];
  chartF += `<path d="M${stars.map((p) => p.join(' ')).join('L')}" fill="none" stroke="#9ab8ff" stroke-width="1.4" opacity=".8"/>`;
  for (const [x, y] of stars) chartF += `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff6c4"/>`;
  [['#e8502e', 296, 108], ['#3a98e8', 316, 108], ['#5fd0aa', 352, 108], ['#e6b066', 372, 108]].forEach(([c, x, y]) => {
    chartF += `<circle cx="${x}" cy="${y}" r="4.5" fill="none" stroke="${c}" stroke-width="2.2"/>`;
  });

  // --- alembic
  const alemB = `<g transform="rotate(-70 320 190)"><circle cx="320" cy="180" r="13" fill="#c8d8f0" opacity=".8" ${sw}/><rect x="316" y="160" width="8" height="10" fill="#c8d8f0" ${sw.replace('2.5', '1.6')}/></g>`
    + `<path d="M350 196Q356 176 372 180Q380 186 376 196" fill="none" stroke="#9a6a1e" stroke-width="4" stroke-linecap="round"/>`;
  const alemF = `<circle cx="306" cy="182" r="24" fill="url(#rGlow)"/>` + flame(306, 194, 0.9)
    + `<circle cx="306" cy="168" r="14" fill="#b98cff" ${sw}/><circle cx="301" cy="164" r="4" fill="#fff" opacity=".6"/>`
    + `<path d="M306 154V140Q306 132 316 132H350Q362 132 362 144V166" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`
    + `<path d="M306 154V140Q306 132 316 132H350Q362 132 362 144V166" fill="none" stroke="url(#rBrass)" stroke-width="3" stroke-linecap="round"/>`
    + `<path d="M352 176L372 176L370 196L354 196Z" fill="#dce8ff" opacity=".85" ${sw.replace('2.5', '1.8')}/>`
    + `<circle cx="358" cy="190" r="2.6" fill="#e8502e"/><circle cx="363" cy="186" r="2.6" fill="#3a98e8"/><circle cx="366" cy="191" r="2.6" fill="#5fd0aa"/><circle cx="361" cy="193" r="2.4" fill="#e6b066"/>`
    + `<circle cx="362" cy="172" r="2.4" fill="#b98cff"/>`;

  // --- cauldron
  const pot = `<path d="M104 262Q104 300 155 302Q206 300 206 262Z" fill="#2e2a3a" ${sw}/><ellipse cx="155" cy="262" rx="52" ry="12" fill="#3e3a4e" ${sw}/>`;
  const caulB = pot + `<ellipse cx="155" cy="263" rx="44" ry="8" fill="#5a4a2a"/>`
    + `<path d="M128 280L140 290L134 298M176 276L170 288" stroke="#8a8aa0" stroke-width="2" fill="none"/>`
    + `<path d="M120 314L190 304M126 304L184 314" stroke="#4a2e1c" stroke-width="7" stroke-linecap="round"/>`;
  const caulF = `<circle cx="155" cy="262" r="64" fill="url(#rGreen)"/>` + flame(140, 314, 1.1) + flame(170, 314, 1.2) + pot
    + `<ellipse cx="155" cy="263" rx="44" ry="8" fill="url(#rBrew)"/>`
    + `<circle cx="140" cy="260" r="4" fill="#d8ffb0" ${sw.replace('2.5', '1.2')}/><circle cx="166" cy="258" r="5" fill="#d8ffb0" ${sw.replace('2.5', '1.2')}/><circle cx="154" cy="263" r="3" fill="#d8ffb0"/>`
    + `<path d="M144 248Q136 236 146 226Q156 216 148 204M166 246Q174 232 164 222" fill="none" stroke="#e8fff0" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;

  // --- crystals
  const crysB = floatCrystal(262, 296, 18, '#8a8aa0', false) + `<g transform="rotate(70 300 298)">${floatCrystal(300, 298, 20, '#7a7a90', false)}</g>` + floatCrystal(334, 300, 14, '#8a8aa0', false);
  let crysF = '';
  const cc = ['#e8502e', '#3a98e8', '#b98cff', '#5fd0aa', '#e6b066'];
  [[130, 46], [164, 30], [200, 24], [236, 30], [270, 46]].forEach(([x, y], k) => { crysF += floatCrystal(x, y, 20, cc[k], true); });

  const dark = `<rect id="room-dark" width="400" height="320" fill="#0a0518" opacity=".5" pointer-events="none"/>`;
  return `<svg class="room" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">${defs}${base}`
    + layer('vault', 'broken', vaultB) + layer('vault', 'fixed', vaultF)
    + layer('potions', 'broken', potB) + layer('potions', 'fixed', potF)
    + layer('charts', 'broken', chartB) + layer('charts', 'fixed', chartF)
    + layer('alembic', 'broken', alemB) + layer('alembic', 'fixed', alemF)
    + layer('cauldron', 'broken', caulB) + layer('cauldron', 'fixed', caulF)
    + layer('crystals', 'broken', crysB) + layer('crystals', 'fixed', crysF)
    + dark + `</svg>`;
}

// ------------------------------------------------------------------ chapters 3-5

/** Shared gradients; each room picks its own wall and floor colours. */
function baseDefs(wall: [string, string], floor: [string, string], extra = ''): string {
  return `<defs>
    <linearGradient id="rWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall[0]}"/><stop offset="1" stop-color="${wall[1]}"/></linearGradient>
    <linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${floor[0]}"/><stop offset="1" stop-color="${floor[1]}"/></linearGradient>
    <linearGradient id="rWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6438"/><stop offset=".5" stop-color="#c8925a"/><stop offset="1" stop-color="#7a4a26"/></linearGradient>
    <linearGradient id="rStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8b0c8"/><stop offset="1" stop-color="#7d7690"/></linearGradient>
    <linearGradient id="rBrass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8862e"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#9a6a1e"/></linearGradient>
    <linearGradient id="rFire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".5" stop-color="#ffa23c"/><stop offset="1" stop-color="#e8502e"/></linearGradient>
    <linearGradient id="rSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a4a"/><stop offset="1" stop-color="#3a3a8a"/></linearGradient>
    <radialGradient id="rGlow"><stop offset="0" stop-color="#ffc46a" stop-opacity=".8"/><stop offset="1" stop-color="#ffc46a" stop-opacity="0"/></radialGradient>
    <radialGradient id="rMagic"><stop offset="0" stop-color="#d8b8ff" stop-opacity=".9"/><stop offset="1" stop-color="#9a6aff" stop-opacity="0"/></radialGradient>
    ${extra}
  </defs>`;
}

function stoneWall(gap = 26): string {
  let out = `<rect width="400" height="320" fill="url(#rWall)"/>`;
  for (let y = 0; y < 250; y += gap) {
    for (let x = (y / gap) % 2 ? -24 : 0; x < 400; x += 48) out += `<rect x="${x + 2}" y="${y + 2}" width="44" height="${gap - 4}" rx="4" fill="#fff" opacity=".05"/>`;
  }
  return out;
}

const darkLayer = `<rect id="room-dark" width="400" height="320" fill="#0a0518" opacity=".5" pointer-events="none"/>`;
const roomOpen = (defs: string, base: string) => `<svg class="room" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">${defs}${base}`;

function stars(n: number, x0: number, y0: number, w: number, h: number, seed: number): string {
  let out = '', k = seed;
  for (let i = 0; i < n; i++) {
    k = (k * 16807) % 2147483647;
    const x = x0 + (k % 1000) / 1000 * w;
    k = (k * 16807) % 2147483647;
    const y = y0 + (k % 1000) / 1000 * h;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.8 + (k % 7) / 5).toFixed(1)}" fill="#fff" opacity="${(0.5 + (k % 5) / 10).toFixed(2)}"/>`;
  }
  return out;
}

function sealShard(x: number, y: number, h: number, color: string, light: string, glow: string): string {
  const w = h * 0.5;
  return `<circle cx="${x}" cy="${y}" r="${h * 1.4}" fill="url(#${glow})"/>`
    + `<path d="M${x} ${y - h / 2}L${x + w / 2} ${y - h * 0.1}L${x + w * 0.35} ${y + h / 2}L${x - w * 0.35} ${y + h / 2}L${x - w / 2} ${y - h * 0.1}Z" fill="${color}" ${sw}/>`
    + `<path d="M${x} ${y - h / 2}L${x - w / 2} ${y - h * 0.1}L${x - w * 0.35} ${y + h / 2}L${x} ${y + h * 0.2}Z" fill="${light}" opacity=".6"/>`
    + `<path d="M${x} ${y - h * 0.9}V${y - h * 0.7}M${x - h * 0.7} ${y - h * 0.4}L${x - h * 0.55} ${y - h * 0.3}M${x + h * 0.7} ${y - h * 0.4}L${x + h * 0.55} ${y - h * 0.3}" stroke="${light}" stroke-width="3" stroke-linecap="round"/>`;
}

function pedestal(x: number, y: number): string {
  return `<path d="M${x - 22} ${y + 34}L${x + 22} ${y + 34}L${x + 16} ${y + 26}L${x + 12} ${y + 4}L${x + 18} ${y}L${x - 18} ${y}L${x - 12} ${y + 4}L${x - 16} ${y + 26}Z" fill="url(#rStone)" ${sw}/>`;
}

const OBSERVATORY_ANCHORS: Record<string, [number, number]> = {
  beams: [200, 270], telescope: [260, 170], orrery: [80, 175], dome: [200, 60], chimes: [358, 120], windseal: [200, 225],
};

function observatoryRoom(): string {
  const defs = baseDefs(['#1e2450', '#3a3a70'], ['#6a4a3a', '#3a2418'], `
    <radialGradient id="rWind"><stop offset="0" stop-color="#c8fff0" stop-opacity=".9"/><stop offset="1" stop-color="#5fd0aa" stop-opacity="0"/></radialGradient>
    <linearGradient id="rBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".5"/><stop offset="1" stop-color="#e8f0ff" stop-opacity="0"/></linearGradient>`);
  let base = stoneWall();
  // Dome shell, floor with a star map, worktable and the seal pedestal.
  base += `<path d="M20 120Q20 6 200 6Q380 6 380 120Z" fill="#141a3e" ${sw}/>`;
  base += `<rect y="248" width="400" height="72" fill="url(#rFloor)"/>`;
  base += `<ellipse cx="200" cy="286" rx="160" ry="26" fill="#2a2050" ${sw}/><ellipse cx="200" cy="286" rx="140" ry="19" fill="none" stroke="#e8c27a" stroke-width="2"/>`;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; base += `<circle cx="${(200 + Math.cos(a) * 120).toFixed(1)}" cy="${(286 + Math.sin(a) * 16).toFixed(1)}" r="2" fill="#e8c27a"/>`; }
  base += `<rect y="244" width="400" height="7" fill="#5a3a26"/>`;
  base += `<rect x="24" y="214" width="112" height="9" rx="3" fill="url(#rWood)" ${sw}/><path d="M34 223L32 250M126 223L128 250" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  base += `<rect x="334" y="64" width="44" height="80" rx="6" fill="#141a3e" stroke="#5a3a26" stroke-width="5"/>`;
  base += pedestal(200, 236);

  const domeB = `<path d="M60 116Q70 40 140 24M260 22Q330 40 342 116M200 8V116" fill="none" stroke="#3a3060" stroke-width="5"/>`
    + `<path d="M120 60L150 90L135 110M270 50L250 86" fill="none" stroke="#5a5080" stroke-width="2"/>`;
  const domeF = `<path d="M150 116V22Q200 6 250 22V116Z" fill="url(#rSky)"/>` + stars(26, 152, 20, 96, 92, 11)
    + `<circle cx="222" cy="44" r="11" fill="#fff4d0"/><circle cx="227" cy="40" r="9" fill="#3a3a8a" opacity=".25"/>`
    + `<path d="M150 116L250 116L300 250L100 250Z" fill="url(#rBeam)"/>`
    + `<path d="M60 116Q70 40 140 24M260 22Q330 40 342 116M150 116V24M250 116V24" fill="none" stroke="url(#rBrass)" stroke-width="5"/>`;

  const beamsB = `<rect x="70" y="252" width="190" height="14" rx="3" fill="url(#rWood)" transform="rotate(-12 165 259)" ${sw}/>`
    + `<rect x="160" y="262" width="170" height="13" rx="3" fill="url(#rWood)" transform="rotate(9 245 268)" ${sw}/>`
    + `<path d="M110 300L120 292L128 302ZM300 298L306 290L314 300ZM60 288L66 282L72 290Z" fill="#8a7a6a" ${sw.replace('2.5', '1.4')}/>`;
  const beamsF = `<g fill="#fff6c4" opacity=".7"><circle cx="120" cy="286" r="1.6"/><circle cx="280" cy="290" r="1.4"/><circle cx="200" cy="300" r="1.8"/></g>`;

  const teleB = `<g transform="rotate(8 260 236)"><rect x="200" y="226" width="110" height="20" rx="8" fill="#8a8aa0" ${sw}/><rect x="300" y="222" width="18" height="28" rx="4" fill="#6a6a80" ${sw}/></g>`
    + `<path d="M236 246L226 252M270 248L282 252" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  const teleF = `<path d="M262 196L240 246M262 196L284 246M262 196L262 248" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`
    + `<path d="M262 196L240 246M262 196L284 246M262 196L262 248" stroke="#7a4a26" stroke-width="3" stroke-linecap="round"/>`
    + `<g transform="rotate(-32 262 192)"><rect x="210" y="180" width="118" height="22" rx="9" fill="url(#rBrass)" ${sw}/><rect x="318" y="175" width="20" height="32" rx="5" fill="url(#rBrass)" ${sw}/><rect x="200" y="184" width="14" height="14" rx="3" fill="#7a5418" ${sw.replace('2.5', '1.6')}/><circle cx="337" cy="191" r="7" fill="#9fd4ff" opacity=".8"/></g>`;

  const orrB = `<circle cx="80" cy="206" r="9" fill="#a89060" ${sw}/><ellipse cx="80" cy="210" rx="38" ry="6" fill="none" stroke="#8a7a60" stroke-width="3" transform="rotate(14 80 210)"/>`
    + `<circle cx="40" cy="212" r="4" fill="#8a8aa0"/><circle cx="118" cy="211" r="5" fill="#8a8aa0"/><circle cx="60" cy="246" r="4" fill="#8a8aa0"/>`;
  const orrF = `<path d="M80 212V170" stroke="${INK}" stroke-width="5"/><path d="M80 212V170" stroke="url(#rBrass)" stroke-width="2.5"/>`
    + `<ellipse cx="80" cy="168" rx="44" ry="12" fill="none" stroke="url(#rBrass)" stroke-width="2.5"/><ellipse cx="80" cy="168" rx="28" ry="7" fill="none" stroke="url(#rBrass)" stroke-width="2"/>`
    + `<circle cx="80" cy="168" r="18" fill="url(#rGlow)"/><circle cx="80" cy="168" r="9" fill="#ffd36a" ${sw}/>`
    + `<circle cx="124" cy="168" r="5" fill="#3a98e8" ${sw.replace('2.5', '1.6')}/><circle cx="54" cy="174" r="4" fill="#e8502e" ${sw.replace('2.5', '1.6')}/><circle cx="98" cy="161" r="3.5" fill="#5fd0aa" ${sw.replace('2.5', '1.6')}/><circle cx="40" cy="164" r="4.5" fill="#c79056" ${sw.replace('2.5', '1.6')}/>`;

  const chimeB = `<path d="M338 74L376 76" stroke="${INK}" stroke-width="4"/><path d="M346 76L340 120M356 76L362 112M366 76L350 130" stroke="#8a8aa0" stroke-width="5" stroke-linecap="round"/>`;
  let chimeF = `<circle cx="356" cy="104" r="34" fill="url(#rWind)" opacity=".6"/><path d="M336 72L378 72" stroke="url(#rBrass)" stroke-width="5" stroke-linecap="round"/>`;
  [[342, 40], [350, 54], [358, 46], [366, 60], [374, 36]].forEach(([x, len]) => {
    chimeF += `<path d="M${x} 74V${80}" stroke="#c8d8f0" stroke-width="1.4"/><rect x="${x - 3}" y="80" width="6" height="${len}" rx="2" fill="#bff0e0" ${sw.replace('2.5', '1.6')}/>`;
  });
  chimeF += `<path d="M300 140Q320 130 330 140Q340 150 352 142M290 170Q312 160 326 170" fill="none" stroke="#bff0e0" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;

  const sealB = `<path d="M186 236L186 206L200 196L214 206L214 236" fill="#2a2440" ${sw}/><path d="M186 216H214M186 226H214M193 200V236M207 200V236" stroke="#5a5080" stroke-width="2"/>`;
  const sealF = sealShard(200, 210, 34, '#7fe8c8', '#e8fff8', 'rWind')
    + `<path d="M168 206Q160 190 176 182M232 206Q240 190 224 182" fill="none" stroke="#c8fff0" stroke-width="3" stroke-linecap="round"/>`;

  return roomOpen(defs, base)
    + layer('dome', 'broken', domeB) + layer('dome', 'fixed', domeF)
    + layer('chimes', 'broken', chimeB) + layer('chimes', 'fixed', chimeF)
    + layer('orrery', 'broken', orrB) + layer('orrery', 'fixed', orrF)
    + layer('telescope', 'broken', teleB) + layer('telescope', 'fixed', teleF)
    + layer('windseal', 'broken', sealB) + layer('windseal', 'fixed', sealF)
    + layer('beams', 'broken', beamsB) + layer('beams', 'fixed', beamsF)
    + darkLayer + `</svg>`;
}

const GREENHOUSE_ANCHORS: Record<string, [number, number]> = {
  glass: [200, 90], rain: [200, 50], flowers: [70, 225], lanterns: [300, 110], pond: [200, 270], waterseal: [200, 255],
};

function moonflower(x: number, y: number, s: number, open: boolean): string {
  if (!open) return `<path d="M${x} ${y}Q${x - 2} ${y - 20 * s} ${x + 6 * s} ${y - 28 * s}" fill="none" stroke="#7a6a3a" stroke-width="3" stroke-linecap="round"/><path d="M${x + 6 * s} ${y - 28 * s}Q${x + 12 * s} ${y - 24 * s} ${x + 10 * s} ${y - 18 * s}" fill="#8a7a50" stroke="#5a4a2a" stroke-width="1.5"/>`;
  let out = `<path d="M${x} ${y}Q${x - 2} ${y - 18 * s} ${x} ${y - 30 * s}" fill="none" stroke="#3c8a34" stroke-width="3"/>`;
  out += `<path d="M${x} ${y - 10 * s}Q${x - 12 * s} ${y - 16 * s} ${x - 14 * s} ${y - 8 * s}Q${x - 6 * s} ${y - 6 * s} ${x} ${y - 10 * s}Z" fill="#74c64f" stroke="#2c5a27" stroke-width="1.5"/>`;
  out += `<circle cx="${x}" cy="${y - 32 * s}" r="${14 * s}" fill="url(#rMoonGlow)"/>`;
  for (let i = 0; i < 6; i++) out += `<ellipse cx="${x}" cy="${y - 38 * s}" rx="${3.5 * s}" ry="${7 * s}" fill="#f0f8ff" stroke="#6a8ac8" stroke-width="1.2" transform="rotate(${i * 60} ${x} ${y - 32 * s})"/>`;
  return out + `<circle cx="${x}" cy="${y - 32 * s}" r="${3 * s}" fill="#ffe680"/>`;
}

function greenhouseRoom(): string {
  const defs = baseDefs(['#0e2a3a', '#1e4a5a'], ['#5a6a6a', '#2e3a3a'], `
    <radialGradient id="rWater"><stop offset="0" stop-color="#bfeaff" stop-opacity=".9"/><stop offset="1" stop-color="#3a98e8" stop-opacity="0"/></radialGradient>
    <radialGradient id="rMoonGlow"><stop offset="0" stop-color="#e0f0ff" stop-opacity=".9"/><stop offset="1" stop-color="#8ab8ff" stop-opacity="0"/></radialGradient>
    <linearGradient id="rPond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ab8f5"/><stop offset="1" stop-color="#1f6fc9"/></linearGradient>`);
  let base = `<rect width="400" height="320" fill="url(#rWall)"/>` + stars(30, 10, 10, 380, 200, 7);
  base += `<circle cx="320" cy="50" r="16" fill="#fff4d0" opacity=".9"/>`;
  base += `<rect y="244" width="400" height="76" fill="url(#rFloor)"/>`;
  for (let x = 0; x < 400; x += 40) base += `<path d="M${x} 244L${x - 16} 320" stroke="#26302e" stroke-width="2"/>`;
  // Greenhouse frame: an arched roof of iron ribs.
  base += `<path d="M10 244V90Q200 -10 390 90V244" fill="none" stroke="#2e3e3a" stroke-width="8"/>`;
  for (const x of [80, 140, 200, 260, 320]) base += `<path d="M${x} 244V${x === 200 ? 40 : x === 140 || x === 260 ? 52 : 70}" stroke="#2e3e3a" stroke-width="5"/>`;
  base += `<path d="M10 160H390" stroke="#2e3e3a" stroke-width="5"/>`;
  base += `<rect x="16" y="226" width="110" height="20" rx="3" fill="#6a4630" ${sw}/><rect x="274" y="226" width="110" height="20" rx="3" fill="#6a4630" ${sw}/>`;
  base += `<ellipse cx="200" cy="276" rx="96" ry="24" fill="#4a5a5a" ${sw}/>`;

  const glassB = `<path d="M90 100L110 130L96 150L120 156M170 60L160 90L186 100M270 70L296 96L280 120M330 110L350 140" fill="none" stroke="#9ab8c8" stroke-width="2" opacity=".8"/>`
    + `<path d="M84 110L136 100L130 150L92 154ZM264 80L316 86L310 150L262 146Z" fill="#081820" opacity=".7"/>`
    + `<path d="M60 300L68 292L72 302ZM150 306L156 298L162 308ZM330 300L338 292L342 304ZM250 310L256 300L262 312Z" fill="#c8e8f0" opacity=".8" ${sw.replace('2.5', '1.2')}/>`;
  const glassF = `<path d="M10 90Q200 -10 390 90V160H10Z" fill="#bfeaff" opacity=".08"/>`
    + `<path d="M90 80L110 70M170 50L196 42M270 56L296 62M330 90L350 100" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`;

  const rainB = `<path d="M60 30Q200 10 300 24" fill="none" stroke="#6a7a7a" stroke-width="6" stroke-dasharray="40 14"/><path d="M300 24L312 46" stroke="#6a7a7a" stroke-width="6" stroke-linecap="round"/>`;
  let rainF = `<path d="M60 30Q200 10 340 30" fill="none" stroke="#7a8a8a" stroke-width="6"/>`;
  for (let i = 0; i < 14; i++) { const x = 70 + i * 19, y = 34 + (i % 3) * 30; rainF += `<path d="M${x} ${y}L${x - 2} ${y + 10}" stroke="#bfeaff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`; }

  const flowB = moonflower(36, 228, 1, false) + moonflower(66, 228, 1.1, false) + moonflower(98, 228, 0.9, false) + moonflower(302, 228, 1, false) + moonflower(334, 228, 1.1, false) + moonflower(364, 228, 0.9, false);
  const flowF = moonflower(36, 228, 1, true) + moonflower(68, 228, 1.15, true) + moonflower(100, 228, 0.9, true) + moonflower(300, 228, 1, true) + moonflower(334, 228, 1.15, true) + moonflower(366, 228, 0.9, true);

  const lantB = `<path d="M290 160L300 176L284 180Z" fill="#4a4a3a" ${sw}/><path d="M250 100V112M350 120V132" stroke="#2e3e3a" stroke-width="2"/><rect x="244" y="112" width="12" height="16" rx="3" fill="#4a4a3a" ${sw.replace('2.5', '1.6')}/><rect x="344" y="132" width="12" height="16" rx="3" fill="#4a4a3a" ${sw.replace('2.5', '1.6')}/>`;
  let lantF = '';
  for (const [x, y] of [[250, 100], [300, 86], [350, 120], [120, 96], [70, 120]]) {
    lantF += `<path d="M${x} ${y - 14}V${y}" stroke="#2e3e3a" stroke-width="2"/><circle cx="${x}" cy="${y + 9}" r="20" fill="url(#rGlow)"/><rect x="${x - 7}" y="${y}" width="14" height="18" rx="4" fill="#ffe08a" ${sw.replace('2.5', '1.6')}/>`;
  }
  for (const [x, y] of [[180, 150], [220, 130], [150, 190], [250, 180], [320, 190], [90, 170]]) lantF += `<circle cx="${x}" cy="${y}" r="2.4" fill="#f0ff9a"/><circle cx="${x}" cy="${y}" r="6" fill="#f0ff9a" opacity=".25"/>`;

  const pondB = `<ellipse cx="200" cy="276" rx="84" ry="18" fill="#6a5a3a"/><path d="M150 272L170 280L162 290M220 268L240 278M190 284L210 290" fill="none" stroke="#3a2e1e" stroke-width="2"/>`;
  const pondF = `<ellipse cx="200" cy="276" rx="84" ry="18" fill="url(#rPond)"/>`
    + `<ellipse cx="200" cy="276" rx="60" ry="11" fill="none" stroke="#fff" stroke-width="1.6" opacity=".5"/>`
    + `<path d="M150 276q8 -6 16 0q-8 6 -16 0ZM232 282q8 -6 16 0q-8 6 -16 0Z" fill="#ff8a3c" ${sw.replace('2.5', '1.2')}/>`
    + `<ellipse cx="176" cy="270" rx="10" ry="4" fill="#74c64f" ${sw.replace('2.5', '1.2')}/><ellipse cx="236" cy="268" rx="8" ry="3.5" fill="#74c64f" ${sw.replace('2.5', '1.2')}/>`;

  const sealB = `<circle cx="200" cy="268" r="9" fill="#2a3a4a" opacity=".8"/>`;
  const sealF = sealShard(200, 232, 34, '#5ab8f5', '#e6f8ff', 'rWater')
    + `<ellipse cx="200" cy="270" rx="28" ry="6" fill="none" stroke="#bfeaff" stroke-width="2.5"/><ellipse cx="200" cy="270" rx="44" ry="9" fill="none" stroke="#bfeaff" stroke-width="1.6" opacity=".6"/>`;

  return roomOpen(defs, base)
    + layer('glass', 'broken', glassB) + layer('glass', 'fixed', glassF)
    + layer('rain', 'broken', rainB) + layer('rain', 'fixed', rainF)
    + layer('lanterns', 'broken', lantB) + layer('lanterns', 'fixed', lantF)
    + layer('flowers', 'broken', flowB) + layer('flowers', 'fixed', flowF)
    + layer('pond', 'broken', pondB) + layer('pond', 'fixed', pondF)
    + layer('waterseal', 'broken', sealB) + layer('waterseal', 'fixed', sealF)
    + darkLayer + `</svg>`;
}

const SANCTUM_ANCHORS: Record<string, [number, number]> = {
  vines: [200, 140], braziers: [200, 200], desk: [330, 220], runes: [200, 285], fireseal: [80, 190], mirror: [200, 130],
};

function brazier(x: number, lit: boolean): string {
  let out = `<path d="M${x - 8} 252L${x - 4} 214L${x + 4} 214L${x + 8} 252Z" fill="url(#rBrass)" ${sw}/>`
    + `<path d="M${x - 22} 200Q${x} 222 ${x + 22} 200Z" fill="url(#rBrass)" ${sw}/>`;
  if (lit) out = `<circle cx="${x}" cy="184" r="44" fill="url(#rGlow)"/>` + out + flame(x, 202, 1.6) + flame(x - 9, 204, 0.9) + flame(x + 9, 204, 1);
  else out += `<path d="M${x - 12} 202Q${x} 196 ${x + 12} 202" stroke="#4a4050" stroke-width="5" stroke-linecap="round"/>`;
  return out;
}

function sanctumRoom(): string {
  const defs = baseDefs(['#2a1430', '#4a2440'], ['#4a3040', '#24141e'], `
    <radialGradient id="rFireGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset="1" stop-color="#ff6a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="rHolyLight"><stop offset="0" stop-color="#fffbe8" stop-opacity="1"/><stop offset=".6" stop-color="#ffe9a0" stop-opacity=".7"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="rMirror" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a5a"/><stop offset="1" stop-color="#140a24"/></linearGradient>`);
  let base = stoneWall();
  base += `<path d="M30 140V70a24 24 0 0 1 48 0V140Z" fill="#140a24" stroke="#5a3a4a" stroke-width="5"/><path d="M322 140V70a24 24 0 0 1 48 0V140Z" fill="#140a24" stroke="#5a3a4a" stroke-width="5"/>`;
  base += `<rect y="248" width="400" height="72" fill="url(#rFloor)"/><rect y="244" width="400" height="7" fill="#3a2030"/>`;
  base += `<ellipse cx="200" cy="286" rx="150" ry="26" fill="#3a2436" ${sw}/>`;
  // Mirror frame, seal pedestal and the desk legs are always there.
  base += `<path d="M146 236V86a54 54 0 0 1 108 0V236Z" fill="url(#rBrass)" ${sw}/>`;
  base += pedestal(80, 214);
  base += `<path d="M298 250L302 230M372 250L368 230" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M298 250L302 230M372 250L368 230" stroke="#7a4a26" stroke-width="3" stroke-linecap="round"/>`;

  const mirrorB = `<path d="M156 232V88a44 44 0 0 1 88 0V232Z" fill="url(#rMirror)"/>`
    + `<path d="M200 70Q170 110 190 150Q210 190 180 220M200 70Q230 110 214 150" fill="none" stroke="#7a4a9a" stroke-width="3" opacity=".8"/>`
    + `<path d="M190 110a12 14 0 1 1 20 0l2 40h-24Z" fill="#c8b8e8" opacity=".25"/>`
    + `<path d="M150 120L250 200M250 120L150 200" stroke="#8a8aa0" stroke-width="5" stroke-dasharray="9 5"/>`;
  const mirrorF = `<path d="M156 232V88a44 44 0 0 1 88 0V232Z" fill="#fff6dc"/><circle cx="200" cy="150" r="90" fill="url(#rHolyLight)"/>`
    + `<path d="M160 120L182 140L172 170M240 110L220 136L234 160M170 210L190 196M230 214L214 196" fill="none" stroke="#e8c87a" stroke-width="1.6" opacity=".8"/>`
    // Elowen stepping out: pointed hat, robe and staff.
    + `<path d="M188 120L200 82L214 118Z" fill="#6a3fb8" ${sw}/><path d="M182 122Q200 114 218 122L216 126Q200 120 184 126Z" fill="#ffd147" ${sw.replace('2.5', '1.6')}/>`
    + `<circle cx="200" cy="132" r="9" fill="#ffe6d0" ${sw}/><path d="M186 142Q200 136 214 142L224 228H176Z" fill="#8a5ae0" ${sw}/>`
    + `<path d="M198 146L202 146L204 226L196 226Z" fill="#ffd147" opacity=".7"/><path d="M226 120L232 230" stroke="${INK}" stroke-width="4"/><circle cx="225" cy="116" r="6" fill="#7fe8c8" ${sw.replace('2.5', '1.6')}/>`;

  const vinesB = `<path d="M0 40Q40 60 30 110Q20 160 60 200M400 30Q350 70 372 120Q390 170 340 210M120 0Q130 40 110 70M290 0Q280 50 300 80M0 250Q60 230 120 250M400 250Q330 236 270 252" fill="none" stroke="#1a0a24" stroke-width="9" stroke-linecap="round"/>`
    + `<path d="M0 40Q40 60 30 110Q20 160 60 200M400 30Q350 70 372 120Q390 170 340 210" fill="none" stroke="#6a3a8a" stroke-width="3" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M30 110l-12 -6M28 150l12 -4M372 120l12 -8M380 170l-12 0" stroke="#1a0a24" stroke-width="5" stroke-linecap="round"/>`;
  const vinesF = `<g fill="#ffe9a0" opacity=".7"><circle cx="40" cy="90" r="1.8"/><circle cx="360" cy="100" r="1.6"/><circle cx="110" cy="40" r="1.4"/><circle cx="300" cy="50" r="1.6"/></g>`;

  const brazB = brazier(120, false) + brazier(280, false);
  const brazF = brazier(120, true) + brazier(280, true);

  const deskB = `<g transform="rotate(14 335 238)"><rect x="292" y="222" width="86" height="12" rx="3" fill="url(#rWood)" ${sw}/></g>`
    + `<path d="M300 300L314 292L320 304ZM340 306L352 300L356 310ZM360 296L372 292L370 304Z" fill="#f4e6c4" ${sw.replace('2.5', '1.2')}/>`;
  const deskF = `<rect x="292" y="220" width="86" height="12" rx="3" fill="url(#rWood)" ${sw}/>`
    + `<path d="M310 220Q322 212 336 218L336 222Q322 216 310 224Z" fill="#fffaf0" ${sw.replace('2.5', '1.4')}/><path d="M336 218Q350 212 362 220L362 224Q350 216 336 222Z" fill="#f4e6c4" ${sw.replace('2.5', '1.4')}/>`
    + `<rect x="300" y="204" width="7" height="16" rx="2" fill="#fff3d6" ${sw.replace('2.5', '1.4')}/><circle cx="303" cy="198" r="12" fill="url(#rGlow)"/>` + flame(303, 203, 0.6)
    + `<path d="M366 218L380 196" stroke="#f4e6c4" stroke-width="3" stroke-linecap="round"/>`;

  const runesB = `<ellipse cx="200" cy="286" rx="110" ry="17" fill="none" stroke="#6a4a6a" stroke-width="2.5" stroke-dasharray="20 18" opacity=".7"/>`;
  let runesF = `<ellipse cx="200" cy="286" rx="118" ry="19" fill="none" stroke="#ffd36a" stroke-width="3"/><ellipse cx="200" cy="286" rx="98" ry="14" fill="none" stroke="#ffd36a" stroke-width="1.6"/>`;
  [['#c79056', 0], ['#5ab8f5', 90], ['#7fe8c8', 180], ['#ff8a3c', 270]].forEach(([c, a]) => {
    const r = (Number(a) * Math.PI) / 180;
    runesF += `<circle cx="${(200 + Math.cos(r) * 108).toFixed(1)}" cy="${(286 + Math.sin(r) * 16.5).toFixed(1)}" r="5.5" fill="${c}" ${sw.replace('2.5', '1.6')}/>`;
  });
  for (let i = 0; i < 16; i++) { const r = (i / 16) * Math.PI * 2; runesF += `<path d="M${(200 + Math.cos(r) * 108).toFixed(1)} ${(286 + Math.sin(r) * 16.5).toFixed(1)}l0 -3" stroke="#fff2b0" stroke-width="1.6"/>`; }

  const fireB = `<path d="M70 214L80 196L90 214Z" fill="#3a2a2a" ${sw}/>`;
  const fireF = sealShard(80, 186, 32, '#ff8a3c', '#fff3b0', 'rFireGlow') + flame(68, 210, 0.8) + flame(92, 210, 0.9);

  return roomOpen(defs, base)
    + layer('mirror', 'broken', mirrorB) + layer('mirror', 'fixed', mirrorF)
    + layer('braziers', 'broken', brazB) + layer('braziers', 'fixed', brazF)
    + layer('fireseal', 'broken', fireB) + layer('fireseal', 'fixed', fireF)
    + layer('desk', 'broken', deskB) + layer('desk', 'fixed', deskF)
    + layer('runes', 'broken', runesB) + layer('runes', 'fixed', runesF)
    + darkLayer
    + layer('vines', 'broken', vinesB) + layer('vines', 'fixed', vinesF)
    + `</svg>`;
}

/** One room per chapter: its drawing and where each task's sparkle plays. */
const ROOMS: Record<string, { svg: () => string; anchors: Record<string, [number, number]> }> = {
  library: { svg: libraryRoom, anchors: LIBRARY_ANCHORS },
  lab: { svg: labRoom, anchors: LAB_ANCHORS },
  observatory: { svg: observatoryRoom, anchors: OBSERVATORY_ANCHORS },
  greenhouse: { svg: greenhouseRoom, anchors: GREENHOUSE_ANCHORS },
  sanctum: { svg: sanctumRoom, anchors: SANCTUM_ANCHORS },
};

/** Day skies for the window and dome in the bright themes. */
const DAY_SKY: Partial<Record<ThemeId, [string, string]>> = { sunny: ['#4ab8ff', '#c4ecff'], garden: ['#ff9ad0', '#ffe4b0'] };

/** Theme light over a room: a tint, plus sunbeams, vines or moonlight. */
function roomAmbience(theme: ThemeId): string {
  if (theme === 'sunny') {
    return `<defs><linearGradient id="tSun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b0" stop-opacity=".55"/><stop offset="1" stop-color="#ffb060" stop-opacity=".25"/></linearGradient>`
      + `<linearGradient id="tBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c8" stop-opacity=".5"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient></defs>`
      + `<rect width="400" height="320" fill="url(#tSun)" style="mix-blend-mode:soft-light" pointer-events="none"/>`
      + `<rect width="400" height="320" fill="#ffe0a0" opacity=".18" style="mix-blend-mode:screen" pointer-events="none"/>`
      + `<path d="M160 40L240 40L330 320L90 320Z" fill="url(#tBeam)" style="mix-blend-mode:screen" pointer-events="none"/>`;
  }
  if (theme === 'garden') {
    let vines = '';
    for (const [x, len] of [[18, 90], [70, 50], [330, 60], [384, 100]]) {
      vines += `<path d="M${x} 0Q${x + 10} ${len / 2} ${x} ${len}" fill="none" stroke="#3a9a5a" stroke-width="4" stroke-linecap="round"/>`;
      for (let y = 14; y < len; y += 18) {
        vines += `<path d="M${x + 2} ${y}q10 -4 12 4q-8 4 -12 -4z" fill="#7ad66a" stroke="#1e5a2a" stroke-width="1"/>`;
      }
      vines += `<g fill="#ff9ad0">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * 4).toFixed(1)}" cy="${(len + Math.sin((a * Math.PI) / 180) * 4).toFixed(1)}" r="3.6"/>`).join('')}</g><circle cx="${x}" cy="${len}" r="2.4" fill="#ffd84a"/>`;
    }
    return `<rect width="400" height="320" fill="#b8ffd0" opacity=".35" style="mix-blend-mode:soft-light" pointer-events="none"/>`
      + `<rect width="400" height="320" fill="#d0ffe0" opacity=".16" style="mix-blend-mode:screen" pointer-events="none"/>`
      + `<rect width="400" height="320" fill="#ffc8ec" opacity=".12" pointer-events="none"/>` + `<g pointer-events="none">${vines}</g>`;
  }
  return `<rect width="400" height="320" fill="#3a3aa0" opacity=".18" style="mix-blend-mode:multiply" pointer-events="none"/>`
    + `<rect width="400" height="320" fill="#a8c8ff" opacity=".12" style="mix-blend-mode:screen" pointer-events="none"/>`;
}

export function roomSvg(chapterId: string, theme: ThemeId = 'sunny'): string {
  let svg = (ROOMS[chapterId] ?? ROOMS.library).svg();
  const sky = DAY_SKY[theme];
  if (sky) {
    svg = svg.replace(/<linearGradient id="rSky"[^]*?<\/linearGradient>/,
      `<linearGradient id="rSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>`);
  }
  // Daylight themes keep unrestored rooms less gloomy.
  svg = svg.replace('<svg class="room"', `<svg class="room" data-dim="${theme === 'night' ? 1 : 0.45}"`);
  // Over the room but under the darkness that lifts as it is restored.
  const at = svg.lastIndexOf('<rect id="room-dark"');
  const amb = roomAmbience(theme);
  return at >= 0 ? svg.slice(0, at) + amb + svg.slice(at) : svg.replace(/<\/svg>$/, amb + '</svg>');
}
export const roomAnchor = (chapterId: string, task: string): [number, number] =>
  (ROOMS[chapterId] ?? ROOMS.library).anchors[task] ?? [200, 160];

/** Show each task's broken or fixed layer; `fresh` is the task just finished (it pops in). */
export function updateRoom(svg: SVGSVGElement, done: string[], total: number, fresh?: string) {
  svg.querySelectorAll<SVGGElement>('.rl').forEach((g) => {
    const isDone = done.includes(g.dataset.task!);
    const show = (g.dataset.state === 'fixed') === isDone;
    g.style.opacity = show ? '1' : '0';
    if (fresh && g.dataset.task === fresh && g.dataset.state === 'fixed') {
      g.classList.remove('pop');
      void g.getBoundingClientRect();
      g.classList.add('pop');
    }
  });
  const dark = svg.querySelector<SVGRectElement>('#room-dark');
  const dim = Number(svg.dataset.dim ?? 1);
  if (dark) dark.style.opacity = String(0.5 * dim * (1 - done.length / Math.max(1, total)));
}
