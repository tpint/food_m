// Renders measured, tightly framed items/monsters (same framing rule as art.ts) to lossless PNG.
import { chromium } from 'playwright'; // npm i -D sharp
import sharp from 'sharp';
import fs from 'fs';
import { Svg, filters, resetUid } from './paint-generators.mjs';
import { ITEMS, itemFill, extraFilters } from './items.mjs';
const out = process.argv[2] || 'public/art', OUT = +process.argv[3] || 384, SS = +process.env.SS || 3;
const want = process.env.ONLY ? process.env.ONLY.split(',') : null;
let MON = {}; try { MON = (await import('./monsters.mjs')).MONSTERS; } catch (e) { if (!String(e).includes('Cannot find')) throw e; }
const jobs = [];
const build = (key, draw, fill) => {
  if (want && !want.some((w) => key.startsWith(w))) return;
  resetUid(); const s = new Svg(); const o = draw(s) || {};
  jobs.push({ key, fill, shadow: o.shadow !== 0, defs: filters() + extraFilters + s.defs.join(''), back: s.back.join(''), body: s.body.join(''), fx: s.fx.join('') });
};
for (const [c, arr] of Object.entries(ITEMS)) arr.forEach((d, i) => build(`${c}-${i + 1}`, d, itemFill(i + 1)));
for (const [k, d] of Object.entries(MON)) build(`mon-${k}`, d, 0.94);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent('<html><body><svg id="m" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:-9999px;width:100px;height:100px"></svg></body></html>');
for (const j of jobs) {
  const S = OUT * SS;
  const { svg, png } = await p.evaluate(async ([j, S]) => {
    const m = document.getElementById('m');
    m.innerHTML = `<defs>${j.defs}</defs><g id="c">${j.body}</g>`;
    const bb = m.querySelector('#c').getBBox();
    const box = { x: bb.x - 3, y: bb.y - 3, w: bb.width + 6, h: bb.height + 6 };
    const size = Math.max(box.w, box.h) / j.fill, cx = box.x + box.w / 2, bottom = box.y + box.h;
    const vy = Math.min(box.y + box.h / 2 - size / 2, bottom - size * 0.93), vx = cx - size / 2;
    let sh = '';
    if (j.shadow) { const rx = Math.min(box.w * 0.42, size * 0.42); sh = `<ellipse cx="${cx}" cy="${bottom - 3}" rx="${rx}" ry="${rx * 0.2}" fill="#3a2350" opacity=".22"/>`; }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="${vx.toFixed(2)} ${vy.toFixed(2)} ${size.toFixed(2)} ${size.toFixed(2)}"><defs>${j.defs}</defs><g>${j.back}</g>${sh}<g filter="url(#sticker)">${j.body}</g><g>${j.fx}</g></svg>`;
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = S; c.getContext('2d').drawImage(img, 0, 0, S, S);
    return { svg, png: c.toDataURL('image/png') };
  }, [j, S]);
  await sharp(Buffer.from(png.split(',')[1], 'base64')).resize(OUT, OUT, { kernel: 'lanczos3' }).png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toFile(`${out}/${j.key}.png`);
}
await b.close(); console.log(jobs.length, 'done');
