// Backdrop art: a wizard's study behind the board (shown blurred, so it adds
// atmosphere without competing with the items) and the cobweb that covers
// sealed tiles.

export type ThemeId = 'sunny' | 'garden' | 'night';

interface ScenePalette {
  wall: [string, string, string];
  sky: [string, string];
  /** Sun by day, moon by night. */
  sun: boolean;
  /** Stars in the window, or clouds. */
  stars: boolean;
  blocks: number;
  frame: string;
  floor: [string, string, string];
  rug: [string, string];
  glow: number;
  vignette: [string, number];
  /** Flowers growing up the walls (the garden). */
  flowers: boolean;
}

export const THEMES: Record<ThemeId, { name: string; color: string; scene: ScenePalette }> = {
  sunny: {
    name: 'Sunny Study',
    color: '#f0a060',
    scene: {
      wall: ['#ffe9c2', '#ffd29c', '#f6b278'], sky: ['#4ab8ff', '#bdeaff'], sun: true, stars: false, blocks: 0.12,
      frame: '#a8683a', floor: ['#c98a52', '#a86a3a', '#e0a66a'], rug: ['#ff5a8a', '#ffe066'], glow: 0.45,
      vignette: ['#a0501a', 0.22], flowers: false,
    },
  },
  garden: {
    name: 'Fairy Garden',
    color: '#5cc896',
    scene: {
      wall: ['#d6f6c8', '#b4ecb8', '#8ad6a0'], sky: ['#ff9ad0', '#ffe4b0'], sun: true, stars: false, blocks: 0.14,
      frame: '#7a5a30', floor: ['#9a7a40', '#7a5a2a', '#b89458'], rug: ['#8a5ae0', '#ffd0f0'], glow: 0.35,
      vignette: ['#1a5a3a', 0.25], flowers: true,
    },
  },
  night: {
    name: 'Moonlit Night',
    color: '#3b2a55',
    scene: {
      wall: ['#2a2050', '#3e2c62', '#2a1d40'], sky: ['#1a2a6a', '#5a4aa0'], sun: false, stars: true, blocks: 0.025,
      frame: '#5a3a26', floor: ['#3a2418', '#2a180e', '#5a3a26'], rug: ['#6a2a4a', '#e8b04a'], glow: 0.75,
      vignette: ['#0c0618', 0.75], flowers: false,
    },
  },
};

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
  out += `<rect x="${x}" y="${y}" width="${w}" height="9" fill="#5a3a26"/><rect x="${x}" y="${y}" width="${w}" height="3" fill="#7a5236"/>`;
  return out;
}

export function sceneArt(theme: ThemeId = 'sunny'): string {
  const t = THEMES[theme].scene;
  const r = rng(7);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.wall[0]}"/><stop offset=".7" stop-color="${t.wall[1]}"/><stop offset="1" stop-color="${t.wall[2]}"/></linearGradient>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky[0]}"/><stop offset="1" stop-color="${t.sky[1]}"/></linearGradient>
  <radialGradient id="warm"><stop offset="0" stop-color="#ffc46a" stop-opacity="${t.glow}"/><stop offset="1" stop-color="#ffc46a" stop-opacity="0"/></radialGradient>
  <radialGradient id="moonglow"><stop offset="0" stop-color="#fff6d8" stop-opacity=".9"/><stop offset="1" stop-color="${t.sun ? '#ffe680' : '#b8b0ff'}" stop-opacity="0"/></radialGradient>
  <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="${t.vignette[0]}" stop-opacity="${t.vignette[1]}"/></radialGradient>
</defs>
<rect width="400" height="860" fill="url(#wall)"/>`;
  // stone blocks
  for (let y = 0; y < 760; y += 34) {
    for (let x = (y / 34) % 2 ? -30 : 0; x < 400; x += 60) {
      s += `<rect x="${x + 2}" y="${y + 2}" width="56" height="30" rx="5" fill="#fff" opacity="${t.blocks + r() * 0.03}"/>`;
    }
  }
  // arched window with the moon, or the sun and clouds by day
  s += `<path d="M120 300V150a80 80 0 0 1 160 0v150z" fill="url(#sky)" stroke="${t.frame}" stroke-width="10"/>`;
  if (t.stars) {
    for (let i = 0; i < 26; i++) s += `<circle cx="${130 + r() * 140}" cy="${80 + r() * 210}" r="${0.8 + r() * 1.6}" fill="#fff" opacity="${0.5 + r() * 0.5}"/>`;
  }
  if (t.sun) {
    s += `<circle cx="235" cy="135" r="80" fill="url(#moonglow)"/><circle cx="235" cy="135" r="28" fill="#fff2a0"/><circle cx="235" cy="135" r="22" fill="#ffd84a"/>`;
    for (const [cx, cy, k] of [[160, 190, 1], [250, 240, 0.8], [190, 110, 0.6]]) {
      s += `<g fill="#fff" opacity=".92"><ellipse cx="${cx}" cy="${cy}" rx="${26 * k}" ry="${10 * k}"/><circle cx="${cx - 8 * k}" cy="${cy - 8 * k}" r="${11 * k}"/><circle cx="${cx + 9 * k}" cy="${cy - 6 * k}" r="${9 * k}"/></g>`;
    }
  } else {
    s += `<circle cx="235" cy="135" r="70" fill="url(#moonglow)"/><circle cx="235" cy="135" r="26" fill="#fff4d0"/><circle cx="246" cy="128" r="22" fill="#3a3a8a" opacity=".25"/>`;
  }
  s += `<path d="M200 70v230M120 210h160" stroke="${t.frame}" stroke-width="6"/>`;
  s += `<rect x="108" y="296" width="184" height="14" rx="4" fill="${t.frame}"/>`;
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
  if (t.flowers) {
    // Vines with blossoms climbing the walls.
    for (const x of [20, 110, 290, 380]) {
      s += `<path d="M${x} 740Q${x - 18} 600 ${x} 460Q${x + 18} 320 ${x} 180" fill="none" stroke="#3a9a5a" stroke-width="5"/>`;
      for (let y = 200; y < 740; y += 60) {
        const fx = x + (r() - 0.5) * 30, c = ['#ff7fc8', '#ffd84a', '#ffffff', '#b98cff'][Math.floor(r() * 4)];
        s += `<g fill="${c}">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(fx + Math.cos((a * Math.PI) / 180) * 6).toFixed(1)}" cy="${(y + Math.sin((a * Math.PI) / 180) * 6).toFixed(1)}" r="5"/>`).join('')}</g><circle cx="${fx}" cy="${y}" r="3.5" fill="#ffb03a"/>`;
      }
    }
  }
  // floor
  s += `<rect y="740" width="400" height="120" fill="${t.floor[0]}"/>`;
  for (let x = -20; x < 420; x += 46) s += `<path d="M${x} 740L${x - 30} 860" stroke="${t.floor[1]}" stroke-width="3"/>`;
  s += `<rect y="736" width="400" height="8" fill="${t.floor[2]}"/>`;
  // rug
  s += `<ellipse cx="200" cy="800" rx="170" ry="40" fill="${t.rug[0]}"/><ellipse cx="200" cy="800" rx="150" ry="32" fill="none" stroke="${t.rug[1]}" stroke-width="3" opacity=".7"/>`;
  s += `<rect width="400" height="860" fill="url(#vig)"/></svg>`;
  return url(s);
}

/** Cobweb drawn over sealed tiles: one web spun from the top-left corner. */
export function webArt(): string {
  const angles = [4, 26, 48, 70, 88];
  const pt = (a: number, r: number) => [Math.cos((a * Math.PI) / 180) * r, Math.sin((a * Math.PI) / 180) * r];
  const spokes = angles.map((a) => { const [x, y] = pt(a, 120); return `M2 2L${x.toFixed(1)} ${y.toFixed(1)}`; }).join('');
  let rings = '';
  for (const r of [26, 52, 80]) {
    const pts = angles.map((a) => pt(a, r));
    rings += `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      // Threads sag toward the corner between spokes.
      const mid = pt((angles[i - 1] + angles[i]) / 2, r * 0.86);
      rings += `Q${mid[0].toFixed(1)} ${mid[1].toFixed(1)} ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    }
  }
  const d = spokes + rings;
  return url(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="${d}" fill="none" stroke="#5a3e80" stroke-width="3.4" stroke-linecap="round" opacity=".18"/><path d="${d}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".85"/></svg>`);
}
