// Screenshots of chapter rooms at 0, 3 and 6 tasks done.
// Usage: node scripts/roomshots.mjs <url> <dir> <chapterIndex...>
import { chromium } from '@playwright/test';
const [url, dir, ...chs] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 400, height: 380 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url); await p.waitForTimeout(800);
for (const ch of chs.map(Number)) {
  for (const n of [0, 3, 6]) {
    await p.evaluate(({ ch, n }) => {
      const s = window.arcane.state, C = window.arcane.chapters;
      s.chapter = ch;
      s.storySeen = C.map((c) => `${c.id}-intro`);
      s.tasksDone = C.slice(0, ch).flatMap((c) => c.tasks.map((t) => t.id)).concat(C[ch].tasks.slice(0, n).map((t) => t.id));
      localStorage.setItem('arcane-merge-save-v2', JSON.stringify(s));
    }, { ch, n });
    await p.reload(); await p.waitForTimeout(700);

    await p.locator('#btn-tower').click(); await p.waitForTimeout(1300);
    await p.locator('#room').screenshot({ path: `${dir}/room-${ch}-${n}.png` });
  }
}
console.log('errors', errs);
await b.close();
