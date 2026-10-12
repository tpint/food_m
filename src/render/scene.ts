// Backdrop art behind the board, one scene per tower chapter so the game feels
// like it is played in the room being restored (shown blurred, so it adds
// atmosphere without competing with the items). All stay bright and saturated.

const url = (svg: string) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;

/** Small deterministic RNG so the scene looks the same on every load. */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function shelf(r: () => number, x: number, y: number, w: number): string {
  const books = ['#7a3b5e', '#3b5a7a', '#5e7a3b', '#8a5a2e', '#5a3b7a', '#2e6a6a', '#9a4a3a'];
  let out = '';
  let bx = x + 4;
  while (bx < x + w - 10) {
    if (r() < 0.22) {
      // potion bottle with a little glow
      const c = ['#ff7fc8', '#7fe0ff', '#9dff7f', '#ffd36a'][Math.floor(r() * 4)];
      out += `<circle cx="${bx + 8}" cy="${y - 10}" r="16" fill="${c}" opacity=".18"/>`;
      out += `<rect x="${bx + 5}" y="${y - 30}" width="6" height="8" fill="#6a4a3a"/>`;
      out += `<circle cx="${bx + 8}" cy="${y - 11}" r="10" fill="${c}" opacity=".85"/>`;
      bx += 20;
    } else {
      const bw = 7 + r() * 7, bh = 26 + r() * 22;
      const tilt = r() < 0.12 ? 8 : 0;
      out += `<rect x="${bx}" y="${y - bh}" width="${bw}" height="${bh}" rx="1.5" fill="${books[Math.floor(r() * books.length)]}" transform="rotate(${tilt} ${bx} ${y})"/>`;
      out += `<rect x="${bx + 1}" y="${y - bh + 5}" width="${bw - 2}" height="2" fill="#e8c27a" opacity=".6"/>`;
      bx += bw + 1;
    }
  }
  out += `<rect x="${x}" y="${y}" width="${w}" height="9" fill="#b07040"/><rect x="${x}" y="${y}" width="${w}" height="3" fill="#d89a5e"/>`;
  return out;
}

function libraryScene(): string {
  const r = rng(7);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffeccc"/><stop offset=".7" stop-color="#ffd8a8"/><stop offset="1" stop-color="#f8bb80"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3ab4ff"/><stop offset="1" stop-color="#bfeaff"/></linearGradient>
  <radialGradient id="warm"><stop offset="0" stop-color="#ffe08a" stop-opacity=".5"/><stop offset="1" stop-color="#ffc46a" stop-opacity="0"/></radialGradient>
  <radialGradient id="moonglow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe680" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#a0601a" stop-opacity=".2"/></radialGradient>
</defs>
<rect width="400" height="860" fill="url(#wall)"/>`;
  // stone blocks
  for (let y = 0; y < 760; y += 34) {
    for (let x = (y / 34) % 2 ? -30 : 0; x < 400; x += 60) {
      s += `<rect x="${x + 2}" y="${y + 2}" width="56" height="30" rx="5" fill="#fff" opacity="${0.12 + r() * 0.04}"/>`;
    }
  }
  // arched window with the sun and clouds
  s += `<path d="M120 300V150a80 80 0 0 1 160 0v150z" fill="url(#sky)" stroke="#b07040" stroke-width="10"/>`;
  s += `<circle cx="235" cy="135" r="80" fill="url(#moonglow)"/><circle cx="235" cy="135" r="28" fill="#fff2a0"/><circle cx="235" cy="135" r="22" fill="#ffd84a"/>`;
  for (const [cx, cy, k] of [[160, 190, 1], [250, 240, 0.8], [190, 110, 0.6]]) {
    s += `<g fill="#fff" opacity=".95"><ellipse cx="${cx}" cy="${cy}" rx="${26 * k}" ry="${10 * k}"/><circle cx="${cx - 8 * k}" cy="${cy - 8 * k}" r="${11 * k}"/><circle cx="${cx + 9 * k}" cy="${cy - 6 * k}" r="${9 * k}"/></g>`;
  }
  s += `<path d="M200 70v230M120 210h160" stroke="#b07040" stroke-width="6"/>`;
  s += `<rect x="108" y="296" width="184" height="14" rx="4" fill="#c08050"/>`;
  // shelves on both sides
  for (const y of [190, 300, 410, 520, 630]) {
    s += shelf(r, -10, y, 110);
    s += shelf(r, 300, y, 110);
  }
  // candles / lanterns glow
  for (const [x, y, rad] of [[60, 120, 90], [340, 140, 90], [200, 330, 110], [40, 560, 80], [360, 600, 80]]) {
    s += `<circle cx="${x}" cy="${y}" r="${rad}" fill="url(#warm)"/>`;
  }
  for (const [x, y] of [[60, 120], [340, 140]]) {
    s += `<path d="M${x} 0V${y - 18}" stroke="#2a1a1a" stroke-width="2"/><rect x="${x - 9}" y="${y - 18}" width="18" height="26" rx="4" fill="#ffd27a" stroke="#5a3a26" stroke-width="3"/>`;
  }
  // floor
  s += `<rect y="740" width="400" height="120" fill="#d8985a"/>`;
  for (let x = -20; x < 420; x += 46) s += `<path d="M${x} 740L${x - 30} 860" stroke="#b07440" stroke-width="3"/>`;
  s += `<rect y="736" width="400" height="8" fill="#e8b070"/>`;
  // rug
  s += `<ellipse cx="200" cy="800" rx="170" ry="40" fill="#ff5a8a"/><ellipse cx="200" cy="800" rx="150" ry="32" fill="none" stroke="#ffe066" stroke-width="3" opacity=".7"/>`;
  s += `<rect width="400" height="860" fill="url(#vig)"/></svg>`;
  return s;
}

const svgOpen = (defs: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>`;
const glow = (id: string, color: string, op: number) =>
  `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const lin = (id: string, stops: string[]) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;

/** Chapter 2: a bubbly alchemy lab. Mint stone, potion shelves, a green cauldron. */
function labScene(): string {
  const r = rng(11);
  let s = svgOpen(lin('wall', ['#d6f7ec', '#a8e8d4', '#7fd0bc']) + glow('brew', '#9dff7f', 0.7) + glow('pot', '#ffffff', 0.6)
    + `<radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-opacity="0"/><stop offset="1" stop-color="#0e5a4a" stop-opacity=".25"/></radialGradient>`);
  s += `<rect width="400" height="860" fill="url(#wall)"/>`;
  for (let y = 0; y < 760; y += 30) for (let x = (y / 30) % 2 ? -24 : 0; x < 400; x += 48) {
    s += `<rect x="${x + 2}" y="${y + 2}" width="44" height="26" rx="6" fill="#fff" opacity="${0.14 + r() * 0.06}"/>`;
  }
  // brass pipes snaking along the walls
  s += `<path d="M-10 90H120Q140 90 140 110V250M410 150H300Q280 150 280 170V300" fill="none" stroke="#a8742a" stroke-width="16"/>`;
  s += `<path d="M-10 90H120Q140 90 140 110V250M410 150H300Q280 150 280 170V300" fill="none" stroke="#ffd56a" stroke-width="6" opacity=".8"/>`;
  // a round porthole window with daylight
  s += `<circle cx="200" cy="170" r="70" fill="#7fd4ff" stroke="#a8742a" stroke-width="12"/><circle cx="200" cy="170" r="70" fill="url(#pot)"/>`;
  s += `<path d="M130 170H270M200 100V240" stroke="#a8742a" stroke-width="6"/>`;
  // shelves of glowing potions
  const colors = ['#ff7fc8', '#7fe0ff', '#9dff7f', '#ffd36a', '#b98cff', '#ff9a5a'];
  for (const y of [300, 410, 520, 630]) {
    for (const [x0, x1] of [[-10, 110], [290, 410]]) {
      for (let x = x0 + 10; x < x1 - 10; x += 22) {
        const c = colors[Math.floor(r() * colors.length)], h = 20 + r() * 18;
        s += `<circle cx="${x + 8}" cy="${y - h / 2}" r="${h * 0.9}" fill="${c}" opacity=".22"/>`;
        s += `<rect x="${x + 5}" y="${y - h - 8}" width="6" height="9" fill="#8a6a3a"/><rect x="${x}" y="${y - h}" width="16" height="${h}" rx="6" fill="${c}"/>`;
        s += `<rect x="${x + 3}" y="${y - h + 4}" width="3" height="${h * 0.5}" rx="1.5" fill="#fff" opacity=".6"/>`;
      }
      s += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="9" fill="#a8742a"/><rect x="${x0}" y="${y}" width="${x1 - x0}" height="3" fill="#ffd56a"/>`;
    }
  }
  // the bubbling cauldron
  s += `<circle cx="200" cy="560" r="150" fill="url(#brew)"/>`;
  s += `<path d="M120 560Q120 680 200 690Q280 680 280 560Z" fill="#3a4a5a"/><ellipse cx="200" cy="560" rx="84" ry="18" fill="#7dff6a"/><ellipse cx="200" cy="560" rx="84" ry="18" fill="none" stroke="#2a3440" stroke-width="8"/>`;
  for (const [x, y, rr] of [[180, 520, 10], [215, 495, 14], [200, 455, 8], [230, 430, 6]]) s += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#c8ffb0" opacity=".85"/>`;
  s += `<rect y="736" width="400" height="124" fill="#5eae9a"/><rect y="732" width="400" height="8" fill="#8fd8c4"/>`;
  s += `<rect width="400" height="860" fill="url(#vig)"/></svg>`;
  return s;
}

/** Chapter 3: the observatory under a starry dome. */
function observatoryScene(): string {
  const r = rng(23);
  let s = svgOpen(lin('dome', ['#2a2a8a', '#4a3aa8', '#7a5ac8', '#b48ae0']) + glow('moon', '#fff6c8', 0.9) + glow('neb', '#ff8ad8', 0.45) + glow('neb2', '#7fe0ff', 0.45));
  s += `<rect width="400" height="860" fill="url(#dome)"/>`;
  s += `<circle cx="110" cy="220" r="140" fill="url(#neb)"/><circle cx="300" cy="420" r="160" fill="url(#neb2)"/>`;
  for (let i = 0; i < 90; i++) {
    const x = r() * 400, y = r() * 640, rr = 0.8 + r() * 2.2;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="#fff" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
  }
  // a couple of constellations
  for (const pts of [[[60, 90], [100, 70], [140, 100], [170, 80], [210, 120]], [[260, 250], [300, 230], [330, 270], [360, 250]]]) {
    s += `<path d="M${pts.map((p) => p.join(' ')).join('L')}" fill="none" stroke="#dff0ff" stroke-width="1.6" opacity=".7"/>`;
    for (const [x, y] of pts) s += `<circle cx="${x}" cy="${y}" r="3.4" fill="#fff"/>`;
  }
  s += `<circle cx="320" cy="110" r="90" fill="url(#moon)"/><circle cx="320" cy="110" r="34" fill="#fff4c8"/><circle cx="334" cy="102" r="30" fill="#4a3aa8" opacity=".9"/>`;
  s += `<circle cx="70" cy="420" r="22" fill="#ffb86a"/><ellipse cx="70" cy="420" rx="38" ry="8" fill="none" stroke="#ffe0a8" stroke-width="3"/>`;
  // the dome's ribs and the great telescope
  s += `<path d="M0 640Q200 520 400 640" fill="none" stroke="#c8a8f0" stroke-width="6" opacity=".6"/>`;
  for (const x of [80, 200, 320]) s += `<path d="M${x} 0V600" stroke="#c8a8f0" stroke-width="3" opacity=".25"/>`;
  s += `<g transform="rotate(-32 200 640)"><rect x="150" y="430" width="100" height="44" rx="12" fill="#c89a3a"/><rect x="230" y="438" width="120" height="28" rx="8" fill="#e8c06a"/><rect x="340" y="434" width="18" height="36" rx="4" fill="#a8742a"/></g>`;
  s += `<path d="M200 560L160 700M200 560L240 700M200 560V700" stroke="#8a6a3a" stroke-width="8"/>`;
  s += `<rect y="700" width="400" height="160" fill="#3a2a78"/><rect y="696" width="400" height="8" fill="#6a5ab8"/>`;
  for (let x = -20; x < 420; x += 50) s += `<path d="M${x} 700L${x - 30} 860" stroke="#2a1e5a" stroke-width="3"/>`;
  s += `<ellipse cx="200" cy="790" rx="160" ry="34" fill="none" stroke="#ffe066" stroke-width="3" opacity=".6"/>`;
  s += '</svg>';
  return s;
}

/** Chapter 4: a sunlit greenhouse full of leaves, flowers and a koi pond. */
function greenhouseScene(): string {
  const r = rng(31);
  let s = svgOpen(lin('glass', ['#bff0ff', '#d8fbe8', '#b8f0c8']) + glow('sunb', '#fff8c0', 0.8) + lin('pond', ['#5ac8f0', '#2a8ad0']));
  s += `<rect width="400" height="860" fill="url(#glass)"/>`;
  s += `<circle cx="300" cy="80" r="200" fill="url(#sunb)"/>`;
  // glass panes and frames
  for (let x = 0; x <= 400; x += 80) s += `<path d="M${x} 0V720" stroke="#fff" stroke-width="7" opacity=".9"/><path d="M${x} 0V720" stroke="#8ad0b0" stroke-width="2"/>`;
  for (let y = 120; y < 720; y += 150) s += `<path d="M0 ${y}H400" stroke="#fff" stroke-width="6" opacity=".9"/>`;
  s += `<path d="M0 120Q200 -40 400 120" fill="none" stroke="#fff" stroke-width="10"/>`;
  // sunbeams
  s += `<path d="M240 0L120 720L220 720L330 0Z" fill="#fffbe0" opacity=".35"/>`;
  // vines and big leaves
  const leaf = (x: number, y: number, k: number, rot: number, c: string) =>
    `<path d="M0 0Q${12 * k} ${-14 * k} ${30 * k} 0Q${12 * k} ${14 * k} 0 0Z" transform="translate(${x} ${y}) rotate(${rot})" fill="${c}"/>`;
  for (const x of [30, 120, 280, 370]) {
    s += `<path d="M${x} 0Q${x + 20} 160 ${x - 10} 320Q${x - 30} 460 ${x} 560" fill="none" stroke="#3aa860" stroke-width="5"/>`;
    for (let y = 30; y < 560; y += 46) s += leaf(x + (r() - 0.5) * 16, y, 0.9 + r() * 0.6, (r() - 0.5) * 120 + (y % 92 ? 20 : 160), ['#5acc6a', '#7ee07a', '#3aa860'][Math.floor(r() * 3)]);
  }
  // flowers
  for (let i = 0; i < 26; i++) {
    const x = r() * 400, y = 80 + r() * 560, c = ['#ff7fc8', '#ffd84a', '#ffffff', '#b98cff', '#ff9a5a'][Math.floor(r() * 5)];
    s += `<g fill="${c}">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos((a * Math.PI) / 180) * 6).toFixed(1)}" cy="${(y + Math.sin((a * Math.PI) / 180) * 6).toFixed(1)}" r="5"/>`).join('')}</g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="#ffb03a"/>`;
  }
  // planters, then the koi pond on the floor
  for (const x of [20, 300]) s += `<rect x="${x}" y="640" width="80" height="50" rx="8" fill="#d8844c"/><path d="M${x} 640Q${x + 40} 600 ${x + 80} 640" fill="#5acc6a"/>`;
  s += `<rect y="700" width="400" height="160" fill="#c8b48a"/>`;
  s += `<ellipse cx="200" cy="790" rx="170" ry="50" fill="url(#pond)" stroke="#e8dcc0" stroke-width="8"/>`;
  for (const [x, y, rot] of [[160, 780, 20], [240, 800, -30]]) s += `<ellipse cx="${x}" cy="${y}" rx="16" ry="7" fill="#ff8a3c" transform="rotate(${rot} ${x} ${y})"/>`;
  s += `<circle cx="120" cy="770" r="14" fill="#5acc6a"/><circle cx="280" cy="776" r="12" fill="#5acc6a"/><circle cx="280" cy="772" r="4" fill="#ff9ad0"/>`;
  s += '</svg>';
  return s;
}

/** Chapter 5: the Archmage's sanctum, royal purple and gold with the great mirror. */
function sanctumScene(): string {
  const r = rng(47);
  let s = svgOpen(lin('wall', ['#5a2a9a', '#8a4ac8', '#c88ae8']) + glow('fireg', '#ffb04a', 0.75) + glow('magic', '#ffe8ff', 0.7) + lin('mirror', ['#e8f4ff', '#b8c8f0', '#d8b8ff']));
  s += `<rect width="400" height="860" fill="url(#wall)"/>`;
  // gold-trimmed wall panels
  for (const x of [10, 290]) s += `<rect x="${x}" y="60" width="100" height="560" rx="14" fill="#fff" opacity=".1" stroke="#ffd56a" stroke-width="4"/>`;
  // banners
  for (const x of [40, 320]) s += `<path d="M${x} 0H${x + 40}V180L${x + 20} 160L${x} 180Z" fill="#e8403a"/><path d="M${x + 20} 70l6 12l13 2l-9 9l2 13l-12 -6l-12 6l2 -13l-9 -9l13 -2z" fill="#ffd56a"/>`;
  // the great mirror with a soft magic glow
  s += `<circle cx="200" cy="300" r="190" fill="url(#magic)"/>`;
  s += `<path d="M120 480V220a80 100 0 0 1 160 0v260z" fill="url(#mirror)" stroke="#ffd56a" stroke-width="14"/>`;
  s += `<path d="M150 260l40 -50M160 330l60 -80" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/>`;
  s += `<circle cx="200" cy="112" r="14" fill="#ff7fc8" stroke="#ffd56a" stroke-width="5"/>`;
  // floating candles
  for (let i = 0; i < 9; i++) {
    const x = 30 + r() * 340, y = 60 + r() * 380;
    s += `<circle cx="${x.toFixed(1)}" cy="${(y - 8).toFixed(1)}" r="20" fill="url(#fireg)"/><rect x="${(x - 4).toFixed(1)}" y="${y.toFixed(1)}" width="8" height="22" rx="2" fill="#fff6e0"/><path d="M${x.toFixed(1)} ${(y - 12).toFixed(1)}q5 7 0 11q-5 -4 0 -11z" fill="#ffb03a"/>`;
  }
  // braziers either side
  for (const x of [60, 340]) s += `<circle cx="${x}" cy="560" r="80" fill="url(#fireg)"/><path d="M${x - 30} 580H${x + 30}L${x + 18} 610H${x - 18}Z" fill="#c89a3a"/><path d="M${x} 520q20 30 10 60h-20q-10 -30 10 -60z" fill="#ff8a3c"/><rect x="${x - 4}" y="610" width="8" height="90" fill="#a8742a"/>`;
  // floor with a glowing rune circle
  s += `<rect y="700" width="400" height="160" fill="#4a2278"/><rect y="696" width="400" height="8" fill="#ffd56a"/>`;
  s += `<ellipse cx="200" cy="790" rx="170" ry="48" fill="none" stroke="#ffd56a" stroke-width="4"/><ellipse cx="200" cy="790" rx="140" ry="36" fill="none" stroke="#ff9af0" stroke-width="2" stroke-dasharray="8 8"/>`;
  for (const [x, c] of [[110, '#c79056'], [170, '#5ab8f5'], [230, '#7fe8c8'], [290, '#ff8a3c']]) s += `<circle cx="${x}" cy="790" r="9" fill="${c}" stroke="#fff" stroke-width="2"/>`;
  s += '</svg>';
  return s;
}

const SCENES: Record<string, () => string> = {
  library: libraryScene, lab: labScene, observatory: observatoryScene, greenhouse: greenhouseScene, sanctum: sanctumScene,
};

/** The blurred backdrop for a tower chapter (`library`, `lab`, ...), as a CSS url(). */
export function sceneArt(chapterId = 'library'): string {
  return url((SCENES[chapterId] ?? libraryScene)());
}
