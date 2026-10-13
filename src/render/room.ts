import { hasArt } from './art';

// The restaurant room shown on the Restaurant screen. A chapter with painted
// pictures (see PAINTED) shows one per restoration state. The others are drawn
// here: every task has a "broken" and a "fixed" layer, and finishing a task swaps
// them with a sparkle. The whole room also gets brighter as more tasks are done.

const INK = '#2e1d40';
const sw = `stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"`;
const sw2 = sw.replace('2.5', '1.8');

const layer = (task: string, state: 'broken' | 'fixed', body: string) =>
  `<g class="rl" data-task="${task}" data-state="${state}">${body}</g>`;
const both = (task: string, broken: string, fixed: string) => layer(task, 'broken', broken) + layer(task, 'fixed', fixed);

/** Shared gradients; each room picks its own wall and floor colours. */
function baseDefs(wall: [string, string], floor: [string, string], extra = ''): string {
  return `<defs>
    <linearGradient id="rWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall[0]}"/><stop offset="1" stop-color="${wall[1]}"/></linearGradient>
    <linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${floor[0]}"/><stop offset="1" stop-color="${floor[1]}"/></linearGradient>
    <linearGradient id="rWood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6438"/><stop offset=".5" stop-color="#c8925a"/><stop offset="1" stop-color="#7a4a26"/></linearGradient>
    <linearGradient id="rSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a90a8"/><stop offset=".5" stop-color="#e6e8f2"/><stop offset="1" stop-color="#7a8098"/></linearGradient>
    <linearGradient id="rBrass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8862e"/><stop offset=".5" stop-color="#ffe08a"/><stop offset="1" stop-color="#9a6a1e"/></linearGradient>
    <linearGradient id="rFire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".5" stop-color="#ffa23c"/><stop offset="1" stop-color="#e8502e"/></linearGradient>
    <linearGradient id="rSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ab4ff"/><stop offset="1" stop-color="#bfeaff"/></linearGradient>
    <linearGradient id="rBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>
    <radialGradient id="rGlow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".85"/><stop offset="1" stop-color="#ffc46a" stop-opacity="0"/></radialGradient>
    <radialGradient id="rCard"><stop offset="0" stop-color="#fff6c0" stop-opacity=".95"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>
    ${extra}
  </defs>`;
}

const darkLayer = `<rect id="room-dark" width="400" height="320" fill="#1a0a18" opacity=".5" pointer-events="none"/>`;
const roomOpen = (defs: string, base: string) => `<svg class="room" viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg">${defs}${base}`;

function flame(x: number, y: number, s: number): string {
  return `<path d="M${x} ${y - 14 * s}Q${x + 7 * s} ${y - 6 * s} ${x + 5 * s} ${y}Q${x} ${y + 3 * s} ${x - 5 * s} ${y}Q${x - 7 * s} ${y - 6 * s} ${x} ${y - 14 * s}Z" fill="url(#rFire)" stroke="#9c3020" stroke-width="1.5"/>`
    + `<path d="M${x} ${y - 7 * s}Q${x + 3 * s} ${y - 2 * s} ${x} ${y}Q${x - 3 * s} ${y - 2 * s} ${x} ${y - 7 * s}Z" fill="#fff6c4"/>`;
}

/** Dust and cobwebs, for anything not yet cleaned. */
function dust(x: number, y: number, w: number, h: number): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#a89a88" opacity=".45"/>`
    + `<path d="M${x + w * 0.2} ${y + h * 0.3}l6 3M${x + w * 0.6} ${y + h * 0.6}l-5 4M${x + w * 0.8} ${y + h * 0.2}l4 4" stroke="#7a6a5a" stroke-width="1.6" opacity=".7"/>`;
}

/** Grandma Rosa's recipe card, glowing. */
function recipeCard(x: number, y: number, color: string): string {
  return `<circle cx="${x}" cy="${y}" r="38" fill="url(#rCard)"/>`
    + `<g transform="rotate(-8 ${x} ${y})"><rect x="${x - 22}" y="${y - 15}" width="44" height="30" rx="3" fill="#fffaf0" ${sw}/>`
    + `<rect x="${x - 22}" y="${y - 15}" width="44" height="8" fill="${color}" ${sw2}/>`
    + `<path d="M${x - 16} ${y}H${x + 14}M${x - 16} ${y + 7}H${x + 8}" stroke="#8ab0e0" stroke-width="2.4" stroke-linecap="round"/></g>`;
}

function sparkles(pts: [number, number][]): string {
  return pts.map(([x, y]) => `<path d="M${x} ${y - 6}L${x + 1.6} ${y - 1.6}L${x + 6} ${y}L${x + 1.6} ${y + 1.6}L${x} ${y + 6}L${x - 1.6} ${y + 1.6}L${x - 6} ${y}L${x - 1.6} ${y - 1.6}Z" fill="#fffbe0"/>`).join('');
}

/** A round café table seen from the front, with or without a cloth. */
function table(x: number, y: number, cloth: boolean, flowers: boolean): string {
  let out = `<path d="M${x} ${y}V${y + 50}M${x - 18} ${y + 52}H${x + 18}" stroke="#5a3a26" stroke-width="5" stroke-linecap="round"/>`;
  out += `<ellipse cx="${x}" cy="${y}" rx="40" ry="10" fill="url(#rWood)" ${sw}/>`;
  if (cloth) {
    out += `<path d="M${x - 44} ${y}L${x - 40} ${y + 24}L${x + 40} ${y + 24}L${x + 44} ${y}Z" fill="#fff" ${sw}/><ellipse cx="${x}" cy="${y}" rx="44" ry="11" fill="#fff" ${sw}/>`;
    for (let k = -36; k < 40; k += 12) out += `<rect x="${x + k}" y="${y}" width="6" height="24" fill="#e8403a" opacity=".6"/>`;
    for (let k = -30; k < 34; k += 14) out += `<rect x="${x + k}" y="${y - 6}" width="7" height="4" fill="#e8403a" opacity=".5"/>`;
  }
  if (flowers) {
    out += `<rect x="${x - 6}" y="${y - 18}" width="12" height="14" rx="3" fill="#bfeaff" ${sw2}/>`;
    for (const [dx, dy] of [[-6, -26], [0, -32], [6, -26]]) out += `<path d="M${x} ${y - 16}L${x + dx} ${y + dy + 4}" stroke="#3c8a2a" stroke-width="2"/><circle cx="${x + dx}" cy="${y + dy}" r="5" fill="#fff" stroke="#e8b020" stroke-width="2.5"/><circle cx="${x + dx}" cy="${y + dy}" r="2" fill="#ffd84a"/>`;
  }
  return out;
}

// ------------------------------------------------------------------ 1 dining room

const DINING_ANCHORS: Record<string, [number, number]> = {
  dust: [200, 230], cloths: [200, 240], lamps: [200, 50], window: [200, 110], flowers: [110, 205], sign: [330, 60],
};

function diningRoom(): string {
  const defs = baseDefs(['#ffe6c4', '#f6c890'], ['#c8844a', '#8a5226']);
  let base = `<rect width="400" height="320" fill="url(#rWall)"/>`;
  for (let x = 0; x < 400; x += 24) base += `<rect x="${x}" width="12" height="240" fill="#fff" opacity=".18"/>`;
  base += `<rect y="180" width="400" height="60" fill="#b0683a"/><rect y="176" width="400" height="6" fill="#d89a5e"/>`;
  base += `<rect y="240" width="400" height="80" fill="url(#rFloor)"/>`;
  for (let x = -20; x < 420; x += 40) base += `<path d="M${x} 240L${x - 24} 320" stroke="#5a3214" stroke-width="2"/>`;
  base += `<rect x="130" y="60" width="140" height="100" rx="6" fill="#3a2a40" stroke="#7a4a26" stroke-width="8"/>`;
  base += `<rect x="290" y="30" width="90" height="60" rx="8" fill="#5a3a26" ${sw}/>`;

  const winB = `<rect x="134" y="64" width="132" height="92" fill="#8a8a90" opacity=".85"/><path d="M140 70L190 120M210 80L260 140M150 140L180 110" stroke="#5a5a62" stroke-width="3"/>`;
  const winF = `<rect x="134" y="64" width="132" height="92" fill="url(#rSky)"/><circle cx="230" cy="92" r="14" fill="#ffd84a"/>`
    + `<g fill="#fff"><ellipse cx="170" cy="120" rx="20" ry="8"/><circle cx="164" cy="113" r="8"/></g>`
    + `<path d="M200 64V156M134 110H266" stroke="#7a4a26" stroke-width="4"/><path d="M134 156L266 156L330 300L70 300Z" fill="url(#rBeam)"/>`;
  const signB = `<text x="335" y="68" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" fill="#6a5a50">SU  NY</text>`;
  const signF = `<circle cx="335" cy="60" r="60" fill="url(#rGlow)"/><text x="335" y="58" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" fill="#ffd84a" stroke="#e8403a" stroke-width=".8">SUNNY</text>`
    + `<text x="335" y="78" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="12" fill="#fff">SPOON</text>`;
  const lampB = `<path d="M70 0V40M330 0V30" stroke="#3a2a20" stroke-width="2"/><path d="M58 52L82 40L84 46L60 58Z" fill="#8a7a6a" ${sw2}/>`;
  let lampF = '';
  for (const x of [70, 200]) lampF += `<path d="M${x} 0V36" stroke="#3a2a20" stroke-width="2"/><circle cx="${x}" cy="56" r="40" fill="url(#rGlow)"/><path d="M${x - 18} 52Q${x} 26 ${x + 18} 52Z" fill="#e8403a" ${sw}/><circle cx="${x}" cy="54" r="5" fill="#fff6c4"/>`;
  const tablesB = table(110, 230, false, false) + table(290, 230, false, false);
  const clothF = table(110, 230, true, false) + table(290, 230, true, false);
  const flowersF = table(110, 230, true, true) + table(290, 230, true, true);
  const dustB = dust(0, 0, 400, 320) + `<path d="M0 0Q30 20 10 50M400 0Q370 20 390 50" fill="none" stroke="#e8e0f0" stroke-width="1.6"/>`;
  const dustF = sparkles([[60, 120], [340, 140], [200, 200]]);

  return roomOpen(defs, base)
    + both('window', winB, winF) + both('sign', signB, signF) + both('lamps', lampB, lampF)
    + layer('cloths', 'broken', tablesB) + layer('cloths', 'fixed', clothF) + layer('flowers', 'fixed', flowersF)
    + darkLayer + both('dust', dustB, dustF) + `</svg>`;
}

// ------------------------------------------------------------------ 2 kitchen

const KITCHEN_ANCHORS: Record<string, [number, number]> = {
  pots: [80, 70], tiles: [200, 280], herbs: [200, 40], stove: [110, 200], oven: [300, 180], pantry: [340, 120],
};

function kitchenRoom(): string {
  const defs = baseDefs(['#e8f8f2', '#b8e4d4'], ['#ffffff', '#e8e8f0']);
  let base = `<rect width="400" height="320" fill="url(#rWall)"/>`;
  for (let y = 0; y < 240; y += 20) for (let x = 0; x < 400; x += 20) base += `<rect x="${x + 1}" y="${y + 1}" width="18" height="18" rx="2" fill="#fff" opacity=".3"/>`;
  base += `<rect y="240" width="400" height="80" fill="url(#rFloor)"/>`;
  base += `<rect x="20" y="88" width="120" height="8" fill="#8a8aa0"/>`;
  base += `<rect x="240" y="120" width="120" height="120" rx="6" fill="#d8643a" ${sw}/>`;
  base += `<rect x="40" y="170" width="140" height="70" rx="4" fill="#3a3e50" ${sw}/>`;

  const tilesB = `<rect y="240" width="400" height="80" fill="#9a8a7a" opacity=".5"/><ellipse cx="120" cy="290" rx="40" ry="8" fill="#7a6a4a" opacity=".6"/><ellipse cx="290" cy="270" rx="26" ry="6" fill="#7a6a4a" opacity=".6"/>`;
  let tilesF = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 20; c++) if ((r + c) % 2) tilesF += `<rect x="${c * 20}" y="${240 + r * 20}" width="20" height="20" fill="#e04a3a"/>`;
  const potsB = `<path d="M40 88l14 -18h20l-6 18z" fill="#7a6a5a" ${sw2}/><ellipse cx="110" cy="84" rx="16" ry="6" fill="#6a5a4a" ${sw2}/>`;
  let potsF = '';
  for (const [x, c] of [[46, '#d8803a'], [80, '#c8c8d8'], [114, '#d8803a']] as const) potsF += `<path d="M${x - 14} 66h28v14a14 12 0 0 1 -28 0z" fill="${c}" ${sw}/><rect x="${x - 17}" y="62" width="34" height="6" rx="3" fill="${c}" ${sw2}/>`;
  potsF += sparkles([[60, 50], [100, 46]]);
  const herbsB = `<path d="M150 20H260" stroke="#5a3a26" stroke-width="3"/><path d="M180 20v14M230 20v10" stroke="#8a7a50" stroke-width="5"/>`;
  let herbsF = `<path d="M150 20H260" stroke="#5a3a26" stroke-width="3"/>`;
  for (const [x, c] of [[170, '#4aa83a'], [200, '#7ed07a'], [230, '#3c8a2a']] as const) herbsF += `<path d="M${x} 20v10" stroke="#8a5a2a" stroke-width="2"/><path d="M${x - 10} 30Q${x} 64 ${x + 10} 30Z" fill="${c}" ${sw2}/>`;
  const stoveB = `<rect x="48" y="160" width="124" height="10" fill="#5a5a6a"/><path d="M60 200h30M120 210h40" stroke="#6a6a7a" stroke-width="4"/>`;
  let stoveF = `<rect x="44" y="162" width="132" height="10" rx="2" fill="url(#rSteel)" ${sw2}/>`;
  for (const x of [80, 140]) stoveF += `<ellipse cx="${x}" cy="164" rx="20" ry="4" fill="#ff6a2a" opacity=".7"/>${flame(x - 8, 166, 0.7)}${flame(x + 8, 166, 0.7)}`;
  for (const x of [70, 110, 150]) stoveF += `<circle cx="${x}" cy="186" r="5" fill="url(#rBrass)" ${sw2}/>`;
  stoveF += `<rect x="60" y="196" width="100" height="36" rx="3" fill="#2a2e3a" ${sw2}/>`;
  const ovenB = `<path d="M262 240V200Q262 170 300 170Q338 170 338 200V240Z" fill="#2a1a10" ${sw}/>`;
  const ovenF = `<circle cx="300" cy="210" r="56" fill="url(#rGlow)"/><path d="M262 240V200Q262 170 300 170Q338 170 338 200V240Z" fill="#3a1a08" ${sw}/>`
    + flame(288, 236, 1.2) + flame(312, 236, 1.3) + `<ellipse cx="300" cy="222" rx="14" ry="8" fill="#e3a352" ${sw2}/>`;
  const pantryB = `<rect x="310" y="20" width="70" height="96" rx="4" fill="#7a4a26" ${sw}/><path d="M320 40L370 90M370 40L320 90" stroke="#5a3a26" stroke-width="5"/>`;
  const pantryF = `<rect x="310" y="20" width="70" height="96" rx="4" fill="#3a2418" ${sw}/><path d="M314 24H346V112H314Z" fill="#8a5a32" ${sw2} transform="skewY(-8)"/>`
    + `<rect x="340" y="40" width="34" height="6" fill="#c8925a"/><rect x="340" y="80" width="34" height="6" fill="#c8925a"/>` + recipeCard(356, 64, '#d99a4e');

  return roomOpen(defs, base)
    + both('tiles', tilesB, tilesF) + both('pots', potsB, potsF) + both('herbs', herbsB, herbsF)
    + both('stove', stoveB, stoveF) + both('oven', ovenB, ovenF) + both('pantry', pantryB, pantryF)
    + darkLayer + `</svg>`;
}

// ------------------------------------------------------------------ 3 patio

const PATIO_ANCHORS: Record<string, [number, number]> = {
  weeds: [200, 280], umbrellas: [260, 130], lights: [200, 30], tree: [70, 120], stand: [330, 200], drinkcard: [330, 170],
};

function patioRoom(): string {
  const defs = baseDefs(['#5ac0ff', '#d8f4ff'], ['#e8b878', '#c8925a']);
  let base = `<rect width="400" height="320" fill="url(#rWall)"/><circle cx="350" cy="40" r="20" fill="#ffd84a"/>`;
  base += `<path d="M0 200Q100 170 200 200T400 195V240H0Z" fill="#8ad070"/>`;
  base += `<rect y="240" width="400" height="80" fill="url(#rFloor)"/>`;
  for (let x = 0; x < 400; x += 40) base += `<rect x="${x + 2}" y="242" width="36" height="36" rx="3" fill="#f4c88a" opacity=".6"/>`;
  base += `<path d="M70 250V120" stroke="#7a4a26" stroke-width="12"/>`;

  const weedsB = Array.from({ length: 10 }, (_, i) => `<path d="M${20 + i * 38} 300q-6 -20 0 -30q6 10 4 30z" fill="#6a8a3a" ${sw2}/>`).join('');
  const weedsF = sparkles([[100, 290], [260, 280]]);
  const treeB = `<circle cx="70" cy="110" r="44" fill="#9a9a5a" ${sw}/>`;
  const treeF = `<circle cx="70" cy="110" r="50" fill="#5ab84a" ${sw}/><circle cx="40" cy="130" r="26" fill="#4aa83a" ${sw2}/><circle cx="100" cy="126" r="26" fill="#4aa83a" ${sw2}/>`
    + [[50, 96], [84, 100], [64, 126], [96, 120], [40, 120]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5.5" fill="#ffe066" ${sw2}/>`).join('');
  const umbB = `<path d="M240 250V150" stroke="#9a9aa0" stroke-width="5"/><path d="M200 170L240 140L250 170Z" fill="#c8b8b8" ${sw}/>`;
  let umbF = `<path d="M240 250V140" stroke="#e8e8f0" stroke-width="5"/><path d="M180 160Q240 100 300 160Z" fill="#fff" ${sw}/>`;
  for (const k of [-2, 0, 2]) umbF += `<path d="M240 118L${240 + k * 15 - 8} 158L${240 + k * 15 + 8} 158Z" fill="#ff5a6a"/>`;
  umbF += table(240, 240, true, false);
  const lightsB = `<path d="M0 30Q100 70 200 40" fill="none" stroke="#5a4a3a" stroke-width="2"/>`;
  let lightsF = `<path d="M0 30Q100 70 200 40T400 30" fill="none" stroke="#5a4a3a" stroke-width="2"/>`;
  for (let k = 0; k < 9; k++) lightsF += `<circle cx="${20 + k * 45}" cy="${40 + Math.sin(k) * 10}" r="12" fill="url(#rGlow)"/><circle cx="${20 + k * 45}" cy="${40 + Math.sin(k) * 10}" r="4" fill="${['#ffe066', '#ff8ec4', '#8ad8ff'][k % 3]}"/>`;
  const standB = `<path d="M290 250L300 190L370 196L360 250Z" fill="#9a7a5a" ${sw} transform="rotate(6 330 220)"/>`;
  const standF = `<rect x="290" y="190" width="80" height="60" fill="#ffe066" ${sw}/><rect x="290" y="190" width="80" height="14" fill="#fff" ${sw2}/>`
    + `<text x="330" y="232" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="12" fill="#e8403a">LEMONADE</text>`
    + `<rect x="300" y="168" width="16" height="22" rx="3" fill="#bfeaff" ${sw2}/><rect x="301" y="176" width="14" height="13" fill="#ffe066"/>`;
  const cardB = `<rect x="340" y="236" width="18" height="10" fill="#7a5a3a" ${sw2}/>`;
  const cardF = recipeCard(342, 160, '#4aa8f0');

  return roomOpen(defs, base)
    + both('tree', treeB, treeF) + both('umbrellas', umbB, umbF) + both('stand', standB, standF) + both('drinkcard', cardB, cardF)
    + both('lights', lightsB, lightsF) + darkLayer + both('weeds', weedsB, weedsF) + `</svg>`;
}

// ------------------------------------------------------------------ 4 ice cream parlor

const PARLOR_ANCHORS: Record<string, [number, number]> = {
  counter: [140, 200], freezer: [60, 150], stools: [140, 270], jukebox: [340, 180], cones: [250, 100], sweetcard: [250, 70],
};

function parlorRoom(): string {
  const defs = baseDefs(['#ffb8d8', '#ff94c4'], ['#f6e6f0', '#e8d0e0']);
  let base = `<rect width="400" height="320" fill="url(#rWall)"/>`;
  for (let x = 0; x < 400; x += 30) base += `<rect x="${x}" width="15" height="240" fill="#fff" opacity=".35"/>`;
  base += `<path d="M0 40Q25 60 50 40T100 40T150 40T200 40T250 40T300 40T350 40T400 40V0H0Z" fill="#8ad8ff" ${sw2}/>`;
  base += `<rect y="240" width="400" height="80" fill="url(#rFloor)"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 20; c++) if ((r + c) % 2) base += `<rect x="${c * 20}" y="${240 + r * 20}" width="20" height="20" fill="#ff9ec8"/>`;
  base += `<rect x="20" y="90" width="80" height="150" rx="6" fill="#c8e8ff" ${sw}/>`;

  const counterB = `<rect x="70" y="190" width="160" height="50" fill="#d8c8d0" ${sw}/><path d="M80 170L140 150L150 190M180 160L220 190" fill="none" stroke="#9a8a90" stroke-width="3"/>`;
  const counterF = `<rect x="70" y="190" width="160" height="50" fill="#fff" ${sw}/><rect x="70" y="190" width="160" height="10" fill="#ff8ec4" ${sw2}/>`
    + `<path d="M74 150H226V190H74Z" fill="#bfeaff" opacity=".6" ${sw2}/>`
    + [[100, '#fff3d0'], [140, '#ff8ec4'], [180, '#9a5a32'], [212, '#7ed07a']].map(([x, c]) => `<ellipse cx="${x}" cy="184" rx="14" ry="7" fill="${c}" ${sw2}/>`).join('');
  const freezerB = `<rect x="28" y="100" width="64" height="130" fill="#8aa8b8" opacity=".7"/><path d="M40 130q8 8 0 16M70 170q8 8 0 16" stroke="#5a7a8a" stroke-width="3" fill="none"/>`;
  const freezerF = `<rect x="28" y="100" width="64" height="130" fill="#e8f8ff"/><path d="M28 160H92" stroke="${INK}" stroke-width="2"/>`
    + `<path d="M38 100l6 10 6 -10 6 10 6 -10 6 10 6 -10 6 10 6 -10" fill="#fff" ${sw2}/>` + sparkles([[50, 130], [76, 196]]);
  let stoolsB = '', stoolsF = '';
  for (const x of [100, 160, 220]) {
    stoolsB += `<path d="M${x} 300V268" stroke="#6a6a7a" stroke-width="4"/><ellipse cx="${x}" cy="268" rx="16" ry="5" fill="#8a7a80" ${sw2} transform="rotate(14 ${x} 268)"/>`;
    stoolsF += `<path d="M${x} 300V264" stroke="url(#rSteel)" stroke-width="5"/><ellipse cx="${x}" cy="262" rx="18" ry="7" fill="#ff5a8a" ${sw}/>`;
  }
  const jukeB = `<path d="M300 240V170Q300 130 340 130Q380 130 380 170V240Z" fill="#8a7a80" ${sw}/>`;
  const jukeF = `<circle cx="340" cy="180" r="60" fill="url(#rGlow)"/><path d="M300 240V170Q300 130 340 130Q380 130 380 170V240Z" fill="#ff5a8a" ${sw}/>`
    + `<path d="M312 200H368V172Q368 146 340 146Q312 146 312 172Z" fill="#ffe066" ${sw2}/><circle cx="340" cy="222" r="9" fill="url(#rBrass)" ${sw2}/>`
    + `<path d="M380 140l8 -10M384 160l10 -4" stroke="#ff5a8a" stroke-width="3" stroke-linecap="round"/><text x="392" y="128" font-size="14" fill="#8a2458">♪</text>`;
  const conesB = `<path d="M240 140L256 120L262 140Z" fill="#c8a878" ${sw2}/>`;
  let conesF = '';
  for (let k = 0; k < 5; k++) conesF += `<path d="M${238} ${140 - k * 8}L${250} ${110 - k * 8}L${262} ${140 - k * 8}Z" fill="#e8b878" ${sw2}/>`;
  const cardB = '';
  const cardF = recipeCard(250, 62, '#ff7fb8');

  return roomOpen(defs, base)
    + both('freezer', freezerB, freezerF) + both('counter', counterB, counterF) + both('cones', conesB, conesF)
    + both('sweetcard', cardB, cardF) + both('jukebox', jukeB, jukeF) + both('stools', stoolsB, stoolsF)
    + darkLayer + `</svg>`;
}

// ------------------------------------------------------------------ 5 rooftop

const ROOFTOP_ANCHORS: Record<string, [number, number]> = {
  crates: [200, 260], grill: [70, 200], table: [220, 230], lanterns: [200, 40], grillcard: [70, 140], reopening: [200, 150],
};

function rooftopRoom(): string {
  const defs = baseDefs(['#ff9a6a', '#ffe2a8'], ['#b88a6a', '#8a5a3a']);
  let base = `<rect width="400" height="320" fill="url(#rWall)"/><circle cx="200" cy="170" r="40" fill="#fff0a0" opacity=".85"/>`;
  for (let x = 0, k = 7; x < 400; x += 34) {
    k = (k * 16807) % 2147483647;
    const h = 40 + (k % 80);
    base += `<rect x="${x}" y="${210 - h}" width="32" height="${h + 30}" fill="#c87a8a" opacity=".6"/>`;
  }
  base += `<rect y="240" width="400" height="80" fill="url(#rFloor)"/><rect y="226" width="400" height="14" fill="#fff" ${sw2}/>`;
  for (let x = 6; x < 400; x += 22) base += `<rect x="${x}" y="196" width="5" height="32" fill="#fff"/>`;

  const cratesB = [[160, 250], [200, 236], [240, 252], [300, 260]].map(([x, y]) => `<rect x="${x}" y="${y}" width="40" height="34" fill="#a8743e" ${sw}/><path d="M${x} ${y}L${x + 40} ${y + 34}M${x + 40} ${y}L${x} ${y + 34}" stroke="#6a4420" stroke-width="2"/>`).join('');
  const cratesF = sparkles([[180, 290], [300, 280]]);
  const grillB = `<path d="M40 210Q40 240 70 240Q100 240 100 210Z" fill="#7a5a4a" ${sw}/><path d="M50 240L44 270M90 240L96 270" stroke="#5a4a40" stroke-width="4"/>`;
  const grillF = `<circle cx="70" cy="200" r="50" fill="url(#rGlow)"/>${flame(58, 210, 1)}${flame(72, 208, 1.2)}${flame(86, 210, 1)}`
    + `<path d="M36 210Q36 244 70 244Q104 244 104 210Z" fill="#e8403a" ${sw}/><path d="M36 210H104" stroke="${INK}" stroke-width="3"/><path d="M50 244L44 280M90 244L96 280" stroke="#3a3e50" stroke-width="5"/>`;
  const tableF = `<rect x="140" y="236" width="180" height="12" rx="3" fill="#fff" ${sw}/><path d="M150 248V290M310 248V290" stroke="#5a3a26" stroke-width="5"/>`
    + `<rect x="140" y="246" width="180" height="16" fill="#ff5a6a" opacity=".55"/>`
    + [170, 210, 250, 290].map((x) => `<ellipse cx="${x}" cy="234" rx="12" ry="4" fill="#fff" ${sw2}/><rect x="${x + 10}" y="218" width="6" height="14" rx="2" fill="#bfeaff" ${sw2}/>`).join('');
  const tableB = `<rect x="150" y="250" width="100" height="10" fill="#8a6a4a" transform="rotate(-10 200 255)" ${sw2}/>`;
  const lanB = `<path d="M0 30Q100 70 200 40" fill="none" stroke="#5a3a26" stroke-width="2"/>`;
  let lanF = `<path d="M0 30Q100 70 200 40T400 30" fill="none" stroke="#5a3a26" stroke-width="2"/>`;
  for (let k = 0; k < 6; k++) {
    const x = 30 + k * 68, y = 44 + Math.sin(k * 1.3) * 10;
    lanF += `<circle cx="${x}" cy="${y + 14}" r="26" fill="url(#rGlow)"/><ellipse cx="${x}" cy="${y + 14}" rx="11" ry="14" fill="${['#ff8ec4', '#ffe066', '#8ad8ff'][k % 3]}" ${sw2}/>`;
  }
  const cardF = recipeCard(70, 138, '#ff7a3c');
  const partyB = '';
  let partyF = `<path d="M120 90H280V122H120Z" fill="#fff" ${sw}/><text x="200" y="113" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="16" fill="#e8403a">GRAND REOPENING!</text>`;
  for (let k = 0; k < 24; k++) partyF += `<rect x="${(k * 53) % 400}" y="${(k * 37) % 200}" width="6" height="3" fill="${['#ff5a8a', '#4ac8ff', '#ffe066', '#7ee08e'][k % 4]}" transform="rotate(${k * 30} ${(k * 53) % 400} ${(k * 37) % 200})"/>`;

  return roomOpen(defs, base)
    + both('grill', grillB, grillF) + both('table', tableB, tableF) + both('grillcard', '', cardF)
    + both('lanterns', lanB, lanF) + both('reopening', partyB, partyF)
    + darkLayer + both('crates', cratesB, cratesF) + `</svg>`;
}

/** One room per chapter: its drawing and where each task's sparkle plays. */
const ROOMS: Record<string, { svg: () => string; anchors: Record<string, [number, number]> }> = {
  dining: { svg: diningRoom, anchors: DINING_ANCHORS },
  kitchen: { svg: kitchenRoom, anchors: KITCHEN_ANCHORS },
  patio: { svg: patioRoom, anchors: PATIO_ANCHORS },
  parlor: { svg: parlorRoom, anchors: PARLOR_ANCHORS },
  rooftop: { svg: rooftopRoom, anchors: ROOFTOP_ANCHORS },
};

/**
 * Painted rooms: one picture per restoration state (`room-<chapter>-0.jpg` with nothing
 * fixed, up to `-<tasks>.jpg` fully restored), cross-faded as tasks finish. Tasks are always
 * done in order, so the number done picks the picture. Anchors are fractions of the picture.
 * A chapter uses them only when all its pictures are in art/manifest.json.
 */
const PAINTED: Record<string, { states: number; anchors: Record<string, [number, number]> }> = {
  dining: {
    states: 7,
    anchors: { dust: [0.55, 0.75], cloths: [0.55, 0.8], lamps: [0.6, 0.22], window: [0.72, 0.45], flowers: [0.56, 0.68], sign: [0.86, 0.3] },
  },
};

const painted = (chapterId: string) => {
  const p = PAINTED[chapterId];
  return p && Array.from({ length: p.states }, (_, n) => hasArt(`room-${chapterId}-${n}`)).every(Boolean) ? p : null;
};

/** The room's markup: a painted picture stack, or the code-drawn SVG. */
export function roomSvg(chapterId: string): string {
  const p = painted(chapterId);
  if (!p) return (ROOMS[chapterId] ?? ROOMS.dining).svg();
  return `<div class="room painted">${Array.from({ length: p.states }, (_, n) =>
    `<img class="rs" data-n="${n}" src="art/room-${chapterId}-${n}.jpg" alt="">`).join('')}</div>`;
}

/** Where a task's sparkle goes, as fractions of the room's width and height. */
export function roomAnchor(chapterId: string, task: string): [number, number] {
  const p = painted(chapterId);
  if (p) return p.anchors[task] ?? [0.5, 0.5];
  const [x, y] = (ROOMS[chapterId] ?? ROOMS.dining).anchors[task] ?? [200, 160];
  return [x / 400, y / 320];
}

/** Show each task's broken or fixed layer; `fresh` is the task just finished (it pops in). */
export function updateRoom(room: Element, done: string[], total: number, fresh?: string) {
  if (room.classList.contains('painted')) {
    // Earlier states stay shown underneath, so the new picture fades in over the last one.
    room.querySelectorAll<HTMLImageElement>('.rs').forEach((img) => img.classList.toggle('on', Number(img.dataset.n) <= done.length));
    return;
  }
  room.querySelectorAll<SVGGElement>('.rl').forEach((g) => {
    const isDone = done.includes(g.dataset.task!);
    const show = (g.dataset.state === 'fixed') === isDone;
    g.style.opacity = show ? '1' : '0';
    if (fresh && g.dataset.task === fresh && g.dataset.state === 'fixed') {
      g.classList.remove('pop');
      void g.getBoundingClientRect();
      g.classList.add('pop');
    }
  });
  const dark = room.querySelector<SVGRectElement>('#room-dark');
  if (dark) dark.style.opacity = String(0.5 * (1 - done.length / Math.max(1, total)));
}
