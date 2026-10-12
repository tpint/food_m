// The tower room shown on the Tower screen. Every restoration task has a
// "broken" and a "fixed" layer; finishing a task swaps them with a sparkle.
// The whole room also gets brighter as more tasks are done.

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

/** One room per chapter: its drawing and where each task's sparkle plays. */
const ROOMS: Record<string, { svg: () => string; anchors: Record<string, [number, number]> }> = {
  library: { svg: libraryRoom, anchors: LIBRARY_ANCHORS },
  lab: { svg: labRoom, anchors: LAB_ANCHORS },
};

export const roomSvg = (chapterId: string) => (ROOMS[chapterId] ?? ROOMS.library).svg();
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
  if (dark) dark.style.opacity = String(0.5 * (1 - done.length / Math.max(1, total)));
}
