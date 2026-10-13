// Renders all Sunny Spoon painted sprites to lossless PNG (stations in a fixed frame; others framed like art.ts).
import { chromium } from '@playwright/test'; // also needs: npm i -D sharp
import sharp from 'sharp';
import fs from 'fs';
import { Svg, filters, resetUid } from './paint.mjs';
import { extraFilters } from './items.mjs';
const out = process.argv[2] || 'public/art', OUT = +process.argv[3] || 384, SS = +process.env.SS || 3;
const want = process.env.ONLY ? process.env.ONLY.split(',') : null;
const jobs = [];
const build = (key, draw, opt) => {
  if (want && !want.some((w) => key.startsWith(w))) return;
  resetUid(); const s = new Svg(); const o = draw(s) || {};
  jobs.push({ key, fill: o.fill ?? opt.fill, vb: opt.vb, shadow: o.shadow === 1, defs: filters() + extraFilters + s.defs.join(''), back: s.back.join(''), body: s.body.join(''), fx: s.fx.join('') });
};
const { stationParts, STATION_KEYS } = await import('./fstations.mjs');
for (const g of STATION_KEYS) for (let lv = 1; lv <= 10; lv++) build(lv > 1 ? `gen-${g}-${lv}` : `gen-${g}`, (s) => stationParts(s, g, lv), { vb: '-8 -7 116 116' });
for (const mod of ['./fitems.mjs', './fcustomers.mjs', './ficons.mjs']) {
  if (!fs.existsSync(new URL(mod, import.meta.url))) continue;
  const { SPRITES } = await import(mod);
  for (const [k, e] of Object.entries(SPRITES)) build(k, e.draw, { fill: e.fill });
}
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent('<html><body><svg id="m" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:-9999px;width:100px;height:100px"></svg></body></html>');
for (const j of jobs) {
  const S = OUT * SS;
  const png = await p.evaluate(async ([j, S]) => {
    let vb = j.vb, sh = '';
    if (!vb) {
      const m = document.getElementById('m');
      m.innerHTML = `<defs>${j.defs}</defs><g id="c">${j.body}</g>`;
      const bb = m.querySelector('#c').getBBox();
      const box = { x: bb.x - 3, y: bb.y - 3, w: bb.width + 6, h: bb.height + 6 };
      const size = Math.max(box.w, box.h) / j.fill, cx = box.x + box.w / 2, bottom = box.y + box.h;
      const vy = Math.min(box.y + box.h / 2 - size / 2, bottom - size * 0.93), vx = cx - size / 2;
      vb = `${vx.toFixed(2)} ${vy.toFixed(2)} ${size.toFixed(2)} ${size.toFixed(2)}`;
      if (j.shadow) { const rx = Math.min(box.w * 0.42, size * 0.42); sh = `<ellipse cx="${cx}" cy="${bottom - 3}" rx="${rx}" ry="${rx * 0.2}" fill="#3a2350" opacity=".22"/>`; }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="${vb}"><defs>${j.defs}</defs><g>${j.back}</g>${sh}<g filter="url(#sticker)">${j.body}</g><g>${j.fx}</g></svg>`;
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = S; c.getContext('2d').drawImage(img, 0, 0, S, S);
    return c.toDataURL('image/png');
  }, [j, S]);
  await sharp(Buffer.from(png.split(',')[1], 'base64')).resize(OUT, OUT, { kernel: 'lanczos3' }).png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toFile(`${out}/${j.key}.png`);
}
await b.close(); console.log(jobs.length, 'done');
