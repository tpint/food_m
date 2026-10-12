import { chromium } from 'playwright'; // npm i -D sharp (playwright comes with @playwright/test)
import sharp from 'sharp';
import fs from 'fs';
import { genSvg, GENS, keyFor } from './paint-generators.mjs';
const out = process.argv[2] || 'public/art', OUT = +process.argv[3] || 384, SS = +process.env.SS || 3;
const only = process.argv[4]; // optional filter e.g. "forge"
fs.mkdirSync(out, { recursive: true }); 
const jobs = [];
const LV = process.env.LV ? process.env.LV.split(',').map(Number) : [1,2,3,4,5,6,7,8,9,10];
for (const g of GENS) for (const lv of LV) if (!only || only.split(',').includes(g)) jobs.push([keyFor(g, lv), genSvg(g, lv, OUT * SS)]);
const b = await chromium.launch(); const p = await b.newPage();
await p.setContent('<html><body></body></html>');
for (const [k, svg] of jobs) {

  const d = await p.evaluate(async ([svg, S]) => {
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = S; c.getContext('2d').drawImage(img, 0, 0, S, S);
    return c.toDataURL('image/png');
  }, [svg, OUT * SS]);
  const big = Buffer.from(d.split(',')[1], 'base64');
  await sharp(big).resize(OUT, OUT, { kernel: 'lanczos3' }).png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toFile(`${out}/${k}.png`);
}
await b.close(); console.log(jobs.length, 'done');
