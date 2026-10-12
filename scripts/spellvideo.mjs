// Records casting high-level spells (charge circle, flight, impact) to a
// WebM video by capturing the browser's live frames (CDP screencast) and
// encoding them with ffmpeg; also grabs key frames for a still overview.
// Usage: node scripts/spellvideo.mjs <url> <dir> [level|1-7] [ffmpeg] [elements]
//   e.g. node scripts/spellvideo.mjs URL DIR 1-7 '' wind   (every wind level)
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
const [url, dir, lv = '7', ff = '', els = 'fire,water,wind,earth'] = process.argv.slice(2);
const ffmpeg = ff || '/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux';
const levels = lv.includes('-') ? Array.from({ length: Number(lv.split('-')[1]) - Number(lv.split('-')[0]) + 1 }, (_, i) => Number(lv.split('-')[0]) + i) : [Number(lv)];
const runs = els.split(',').flatMap((el) => levels.map((level) => ({ el, level })));
const FPS = 30;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const skip = async () => { for (let i = 0; i < 8 && await p.locator('#story:not(.hidden)').count(); i++) { await p.locator('#story-next').click(); await p.waitForTimeout(100); } };

const frames = [];
let recording = false;
const cdp = await p.context().newCDPSession(p);
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  if (recording) frames.push({ data: Buffer.from(data, 'base64'), t: metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});

await p.goto(url); await p.waitForTimeout(1000); await skip();
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 390, maxHeight: 844, everyNthFrame: 1 });
for (const { el, level } of runs) {
  const charge = 380 + level * 90;
  const tag = levels.length > 1 ? `${el}${level}` : el;
  recording = false;
  await p.evaluate(({ el, level }) => {
    const s = window.arcane.state;
    s.storySeen = window.arcane.chapters.map((c) => `${c.id}-intro`);
    s.monsters[1].needs = [{ chain: el, level }];
    s.board[38] = { piece: { kind: 'item', chain: el, level }, lock: 0 };
    localStorage.setItem('arcane-merge-save-v2', JSON.stringify(s));
  }, { el, level });
  await p.reload(); await p.waitForTimeout(900); await skip();
  recording = true;
  await p.waitForTimeout(400);
  await p.locator('.monster.ready .cast').first().click();
  await p.waitForTimeout(charge * 0.45); await p.screenshot({ path: `${dir}/k-${tag}-0.png` });
  await p.waitForTimeout(charge * 0.4); await p.screenshot({ path: `${dir}/k-${tag}-1.png` });
  await p.waitForTimeout(charge * 0.15 + 230); await p.screenshot({ path: `${dir}/k-${tag}-2.png` });
  await p.waitForTimeout(330); await p.screenshot({ path: `${dir}/k-${tag}-3.png` });
  await p.waitForTimeout(350); await p.screenshot({ path: `${dir}/k-${tag}-4.png` });
  await p.waitForTimeout(1500);
}
recording = false;
await cdp.send('Page.stopScreencast');
await b.close();

// Resample to a steady frame rate (repeat frames to fill gaps, within each clip).
const out = [];
for (let i = 0; i < frames.length; i++) {
  const gap = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 1 / FPS;
  const reps = Math.max(1, Math.min(10, Math.round(gap * FPS)));
  for (let k = 0; k < reps; k++) out.push(frames[i].data);
}
const file = `${dir}/spells-${els.replace(/,/g, '-')}-level${lv}.webm`;
// This ffmpeg build has no pipe input, so the frames go through a file.
const tmp = `${dir}/frames.mjpeg`;
writeFileSync(tmp, Buffer.concat(out));
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', tmp, '-c:v', 'libvpx', '-b:v', '3M', '-pix_fmt', 'yuv420p', file], { stdio: 'inherit' });
rmSync(tmp);
console.log(`captured ${frames.length} frames -> ${out.length} at ${FPS}fps (${(out.length / FPS).toFixed(1)}s): ${file}`);
console.log('errors', errs);
