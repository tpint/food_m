// Backdrop art behind the board, one scene per restaurant chapter so the game
// feels like it is played in the room being restored (shown blurred, so it
// adds atmosphere without competing with the items). All stay bright and warm.

const url = (svg: string) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;

/** Small deterministic RNG so the scene looks the same on every load. */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

const svgOpen = (defs: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>`;
const glow = (id: string, color: string, op: number) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const lin = (id: string, stops: string[]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const vig = (color: string) => `<radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-opacity="0"/><stop offset="1" stop-color="${color}" stop-opacity=".22"/></radialGradient>`;

/** A row of jars, pots and bottles on a shelf. */
function shelf(r: () => number, x: number, y: number, w: number): string {
  const colors = ['#ff7a5a', '#ffd04a', '#7ed07a', '#5ab4f0', '#ff8ec4', '#c88a4a'];
  let out = '', bx = x + 4;
  while (bx < x + w - 14) {
    const c = colors[Math.floor(r() * colors.length)];
    if (r() < 0.5) {
      out += `<rect x="${bx}" y="${y - 26}" width="16" height="26" rx="4" fill="${c}"/><rect x="${bx - 1}" y="${y - 30}" width="18" height="6" rx="2" fill="#fff"/>`;
      bx += 22;
    } else {
      out += `<rect x="${bx + 3}" y="${y - 40}" width="6" height="10" fill="${c}"/><path d="M${bx} ${y}L${bx} ${y - 24}Q${bx + 6} ${y - 34} ${bx + 12} ${y - 24}L${bx + 12} ${y}Z" fill="${c}" opacity=".85"/>`;
      bx += 18;
    }
  }
  return out + `<rect x="${x}" y="${y}" width="${w}" height="8" fill="#b07040"/><rect x="${x}" y="${y}" width="${w}" height="3" fill="#d89a5e"/>`;
}

function checkerFloor(y: number, a: string, b: string): string {
  let s = `<rect y="${y}" width="400" height="${860 - y}" fill="${a}"/>`;
  for (let row = 0; row * 40 < 860 - y; row++) {
    for (let col = 0; col < 10; col++) if ((row + col) % 2) s += `<rect x="${col * 40}" y="${y + row * 40}" width="40" height="40" fill="${b}"/>`;
  }
  return s;
}

function cloud(cx: number, cy: number, k: number): string {
  return `<g fill="#fff" opacity=".95"><ellipse cx="${cx}" cy="${cy}" rx="${26 * k}" ry="${10 * k}"/><circle cx="${cx - 8 * k}" cy="${cy - 8 * k}" r="${11 * k}"/><circle cx="${cx + 9 * k}" cy="${cy - 6 * k}" r="${9 * k}"/></g>`;
}

/** Chapter 1: a cosy dining room with checked tablecloths and a sunny window. */
function diningScene(): string {
  let s = svgOpen(lin('wall', ['#fff1d6', '#ffe0b0', '#f8c890']) + lin('sky', ['#3ab4ff', '#bfeaff']) + glow('warm', '#ffe08a', 0.55) + vig('#a0601a'));
  s += `<rect width="400" height="860" fill="url(#wall)"/>`;
  for (let x = 0; x < 400; x += 28) s += `<rect x="${x}" y="0" width="14" height="560" fill="#fff" opacity=".18"/>`;
  s += `<rect y="540" width="400" height="16" fill="#c87a4a"/>`;
  s += `<rect x="110" y="120" width="180" height="200" rx="10" fill="url(#sky)" stroke="#b07040" stroke-width="10"/>`;
  s += `<circle cx="240" cy="170" r="26" fill="#ffd84a"/>` + cloud(160, 220, 1) + cloud(250, 270, 0.8);
  s += `<path d="M200 120v200M110 220h180" stroke="#b07040" stroke-width="6"/>`;
  s += `<path d="M100 110Q150 160 110 330L96 330Q130 180 100 110ZM300 110Q250 160 290 330L304 330Q270 180 300 110Z" fill="#e8403a"/>`;
  for (const x of [60, 200, 340]) s += `<path d="M${x} 0V60" stroke="#5a3a26" stroke-width="2"/><path d="M${x - 22} 80Q${x} 50 ${x + 22} 80Z" fill="#ffcf4a"/><circle cx="${x}" cy="110" r="80" fill="url(#warm)"/>`;
  s += checkerFloor(556, '#d89a5a', '#c8844a');
  for (const [x, y] of [[80, 640], [320, 640], [200, 760]]) {
    s += `<ellipse cx="${x}" cy="${y}" rx="70" ry="22" fill="#fff"/><path d="M${x - 70} ${y}L${x - 64} ${y + 40}L${x + 64} ${y + 40}L${x + 70} ${y}" fill="#fff"/>`;
    for (let k = -60; k < 64; k += 20) s += `<rect x="${x + k}" y="${y - 6}" width="10" height="44" fill="#e8403a" opacity=".55"/>`;
  }
  return s + `<rect width="400" height="860" fill="url(#vig)"/></svg>`;
}

/** Chapter 2: a busy kitchen with tiles, copper pots and a glowing oven. */
function kitchenScene(): string {
  const r = rng(11);
  let s = svgOpen(lin('wall', ['#e8f8f2', '#c8ecdf', '#a8dcc8']) + glow('oven', '#ffb04a', 0.7) + vig('#0e5a4a'));
  s += `<rect width="400" height="860" fill="url(#wall)"/>`;
  for (let y = 0; y < 560; y += 30) for (let x = 0; x < 400; x += 30) s += `<rect x="${x + 1.5}" y="${y + 1.5}" width="27" height="27" rx="3" fill="#fff" opacity=".35"/>`;
  s += `<rect x="20" y="40" width="360" height="10" fill="#8a8aa0"/>`;
  for (let x = 40; x < 380; x += 48) {
    const c = r() < 0.5 ? '#d8803a' : '#c8c8d8';
    s += `<path d="M${x} 50V70" stroke="#5a5a6a" stroke-width="2"/><path d="M${x - 16} 70h32v14a16 16 0 0 1 -32 0z" fill="${c}"/>`;
  }
  s += shelf(r, 10, 240, 160) + shelf(r, 230, 240, 160);
  s += `<circle cx="200" cy="420" r="150" fill="url(#oven)"/><path d="M110 560V420Q110 330 200 330Q290 330 290 420V560Z" fill="#d8643a"/><path d="M150 560V450Q150 400 200 400Q250 400 250 450V560Z" fill="#3a1a08"/><path d="M160 560V460Q160 420 200 420Q240 420 240 460V560Z" fill="#ff8a2a" opacity=".6"/>`;
  s += checkerFloor(560, '#ffffff', '#e04a3a');
  s += `<rect y="556" width="400" height="8" fill="#8a8aa0"/>`;
  return s + `<rect width="400" height="860" fill="url(#vig)"/></svg>`;
}

/** Chapter 3: a sunny patio with striped umbrellas, a lemon tree and fairy lights. */
function patioScene(): string {
  let s = svgOpen(lin('sky', ['#4ac0ff', '#a8e4ff', '#e8f8ff']) + glow('sun', '#fff2a0', 0.9) + vig('#2a7a3a'));
  s += `<rect width="400" height="860" fill="url(#sky)"/>`;
  s += `<circle cx="320" cy="90" r="110" fill="url(#sun)"/><circle cx="320" cy="90" r="34" fill="#ffd84a"/>`;
  s += cloud(90, 100, 1.4) + cloud(220, 180, 1);
  s += `<path d="M0 300Q100 260 200 300T400 290V420H0Z" fill="#8ad070"/>`;
  s += `<path d="M0 60Q100 110 200 70T400 70" fill="none" stroke="#5a4a3a" stroke-width="2"/>`;
  for (let k = 0; k < 9; k++) s += `<circle cx="${20 + k * 45}" cy="${78 + Math.sin(k) * 16}" r="6" fill="${['#ffe066', '#ff8ec4', '#8ad8ff'][k % 3]}"/>`;
  s += `<path d="M60 560V360" stroke="#7a4a26" stroke-width="16"/><circle cx="60" cy="330" r="70" fill="#5ab84a"/><circle cx="20" cy="360" r="40" fill="#4aa83a"/><circle cx="100" cy="350" r="44" fill="#4aa83a"/>`;
  for (const [x, y] of [[40, 320], [80, 300], [100, 350], [30, 370], [70, 360]]) s += `<ellipse cx="${x}" cy="${y}" rx="9" ry="7" fill="#ffe066"/>`;
  for (const x of [240, 350]) {
    s += `<path d="M${x} 600V420" stroke="#e8e8f0" stroke-width="6"/><path d="M${x - 70} 430Q${x} 360 ${x + 70} 430Z" fill="#fff"/>`;
    for (let k = -2; k < 3; k += 2) s += `<path d="M${x} 380L${x + k * 18 - 9} 430L${x + k * 18 + 9} 430Z" fill="#ff5a6a"/>`;
  }
  s += `<rect y="560" width="400" height="300" fill="#e8b878"/>`;
  for (let y = 560; y < 860; y += 34) for (let x = (y / 34) % 2 ? -30 : 0; x < 400; x += 60) s += `<rect x="${x + 2}" y="${y + 2}" width="56" height="30" rx="4" fill="#f4c88a"/>`;
  return s + `<rect width="400" height="860" fill="url(#vig)"/></svg>`;
}

/** Chapter 4: a pastel ice cream parlor with a jukebox glow. */
function parlorScene(): string {
  let s = svgOpen(lin('wall', ['#ffe8f4', '#ffd0e6', '#ffb8d8']) + glow('juke', '#ff8ec4', 0.7) + glow('neon', '#8ae8ff', 0.6) + vig('#a0306a'));
  s += `<rect width="400" height="860" fill="url(#wall)"/>`;
  for (let x = 0; x < 400; x += 40) s += `<path d="M${x} 0V560" stroke="#fff" stroke-width="14" opacity=".35"/>`;
  s += `<path d="M0 90Q50 130 100 90T200 90T300 90T400 90V0H0Z" fill="#8ad8ff"/><path d="M0 90Q50 130 100 90T200 90T300 90T400 90" fill="none" stroke="#fff" stroke-width="6"/>`;
  s += `<circle cx="200" cy="200" r="90" fill="url(#neon)"/><path d="M170 250L200 160L230 250Z" fill="#e8b878"/><circle cx="200" cy="150" r="28" fill="#ff8ec4"/><circle cx="185" cy="128" r="22" fill="#fff3d0"/><circle cx="215" cy="128" r="22" fill="#9a5a32"/>`;
  s += `<circle cx="330" cy="420" r="120" fill="url(#juke)"/><path d="M280 560V400Q280 340 330 340Q380 340 380 400V560Z" fill="#ff5a8a"/><path d="M296 470H364V400Q364 360 330 360Q296 360 296 400Z" fill="#ffe066"/>`;
  s += `<rect x="0" y="420" width="240" height="140" fill="#fff"/><rect x="0" y="410" width="250" height="16" rx="6" fill="#ff8ec4"/>`;
  for (const [x, c] of [[40, '#fff3d0'], [100, '#ff8ec4'], [160, '#9a5a32'], [210, '#7ed07a']]) s += `<ellipse cx="${x}" cy="470" rx="22" ry="12" fill="${c}"/>`;
  s += checkerFloor(560, '#ffffff', '#ffc0dc');
  return s + `<rect width="400" height="860" fill="url(#vig)"/></svg>`;
}

/** Chapter 5: a rooftop terrace at sunset, lanterns and a party table. */
function rooftopScene(): string {
  const r = rng(23);
  let s = svgOpen(lin('sky', ['#ff9a6a', '#ffc08a', '#ffe2a8']) + glow('lan', '#ffd27a', 0.7) + vig('#8a3a1a'));
  s += `<rect width="400" height="860" fill="url(#sky)"/>`;
  s += `<circle cx="200" cy="380" r="70" fill="#fff0a0" opacity=".8"/>`;
  for (let x = 0; x < 400; x += 40) {
    const h = 80 + r() * 140;
    s += `<rect x="${x}" y="${420 - h}" width="38" height="${h + 140}" fill="#c87a8a" opacity=".55"/>`;
    for (let y = 440 - h; y < 540; y += 24) if (r() < 0.5) s += `<rect x="${x + 8}" y="${y}" width="8" height="10" fill="#ffe08a"/>`;
  }
  s += `<path d="M0 80Q100 140 200 90T400 100" fill="none" stroke="#5a3a26" stroke-width="2"/>`;
  for (let k = 0; k < 6; k++) {
    const x = 30 + k * 68, y = 104 + Math.sin(k * 1.3) * 18;
    s += `<circle cx="${x}" cy="${y + 20}" r="50" fill="url(#lan)"/><ellipse cx="${x}" cy="${y + 20}" rx="16" ry="20" fill="${['#ff8ec4', '#ffe066', '#8ad8ff'][k % 3]}"/>`;
  }
  s += `<rect y="540" width="400" height="320" fill="#b88a6a"/>`;
  for (let x = 0; x < 400; x += 50) s += `<path d="M${x} 540V860" stroke="#9a6a4a" stroke-width="3"/>`;
  s += `<rect y="520" width="400" height="22" fill="#fff"/>`;
  for (let x = 10; x < 400; x += 26) s += `<rect x="${x}" y="470" width="6" height="52" fill="#fff"/>`;
  s += `<rect x="40" y="640" width="320" height="30" rx="8" fill="#fff"/><rect x="40" y="664" width="320" height="16" fill="#ff5a6a" opacity=".6"/>`;
  return s + `<rect width="400" height="860" fill="url(#vig)"/></svg>`;
}

const SCENES: Record<string, () => string> = {
  dining: diningScene, kitchen: kitchenScene, patio: patioScene, parlor: parlorScene, rooftop: rooftopScene,
};

const cache = new Map<string, string>();

/** The backdrop for a chapter, as a CSS url(...) value. */
export function sceneArt(chapterId = 'dining'): string {
  const id = SCENES[chapterId] ? chapterId : 'dining';
  if (!cache.has(id)) cache.set(id, url(SCENES[id]()));
  return cache.get(id)!;
}
