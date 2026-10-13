// Builds all 10 levels of a kitchen station from one painted picture of it
// (scripts/art/station-src/<id>.png, transparent background), adding the
// game's own level decorations around it (stationDressing in src/render/art.ts):
// a plate from level 3, a star badge, golden rays, an orbit of motes, hearts,
// a crown, wings and a starry sky at level 10.
//
// Usage (with `npm run dev` running):
//   node scripts/art/compose-stations.mjs http://localhost:5173/ oven mixer fountain
// Writes public/art/gen-<id>.png and gen-<id>-2.png ... gen-<id>-10.png (384 px).
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const [url = 'http://localhost:5173/', ...ids] = process.argv.slice(2);
/** Glow colour of each station's decorations (matches genArt in art.ts). */
const GLOW = { oven: '#ffc46a', fountain: '#8fd8ff', mixer: '#ff9ec8', bbq: '#ffa060' };
const SIZE = 384, SS = 3;

const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.goto(url);
for (const id of ids) {
  const src = `data:image/png;base64,${readFileSync(new URL(`./station-src/${id}.png`, import.meta.url)).toString('base64')}`;
  for (let lv = 1; lv <= 10; lv++) {
    const png = await p.evaluate(async ([src, lv, glow, S, SS]) => {
      const { stationDressing } = await import('/src/render/art.ts');
      const d = stationDressing(lv, glow);
      const img = new Image(); img.src = src; await img.decode();
      // The station sits in the same box the code-drawn stations use, standing on y = 93.
      const box = { x: 8, y: 12, w: 84, h: 81 };
      const k = Math.min(box.w / img.width, box.h / img.height);
      const w = img.width * k, h = img.height * k, x = 50 - w / 2, y = box.y + box.h - h;
      // Levels 2-3 have no plate or rays yet, so give them the star badge early.
      const badge = lv === 2 || lv === 3
        ? '<path d="M80 72L82.4 77L88 77.6L83.8 81.4L85 87L80 84.2L75 87L76.2 81.4L72 77.6L77.6 77Z" fill="#ffd147" stroke="#7a5418" stroke-width="1.4" stroke-linejoin="round"/>'
        : '';
      const shadow = lv < 3 ? `<ellipse cx="50" cy="93" rx="${w * 0.45}" ry="${w * 0.08}" fill="#3a2350" opacity=".22"/>` : '';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S * SS}" height="${S * SS}" viewBox="-8 -7 116 116"><defs>${d.defs}</defs>${d.behind}${shadow}`
        + `<image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}"/>${d.fx}${badge}</svg>`;
      const pic = new Image(); pic.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await pic.decode();
      const big = document.createElement('canvas'); big.width = big.height = S * SS;
      big.getContext('2d').drawImage(pic, 0, 0);
      const c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, S, S);
      return c.toDataURL('image/png');
    }, [src, lv, GLOW[id], SIZE, SS]);
    const key = lv > 1 ? `gen-${id}-${lv}` : `gen-${id}`;
    writeFileSync(`public/art/${key}.png`, Buffer.from(png.split(',')[1], 'base64'));
  }
  console.log(id, 'done');
}
await b.close();
