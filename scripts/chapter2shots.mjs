// Plays through chapter 1 into chapter 2 and screenshots the lab.
// Usage: node scripts/chapter2shots.mjs <url> <dir>
import { chromium } from '@playwright/test';
const [url, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const texts = [];
const next = async () => {
  for (let i = 0; i < 15 && await p.locator('#story:not(.hidden)').count(); i++) {
    texts.push((await p.locator('#story-text').textContent()).slice(0, 50));
    await p.locator('#story-next').click(); await p.waitForTimeout(200);
  }
};
const restoreN = async (n) => { for (let k = 0; k < n; k++) { await p.locator('[data-restore]').click(); await p.waitForTimeout(1300); await next(); } };
await p.goto(url); await p.waitForTimeout(1300); await next();
await p.evaluate(() => { window.arcane.state.stars = 999; });
await p.locator('#btn-tower').click(); await p.waitForTimeout(500);
await restoreN(5);
// Last library task: stop on the "chapter complete" card to check the room has not switched yet.
await p.locator('[data-restore]').click(); await p.waitForTimeout(1300);
for (let i = 0; i < 3; i++) { await p.locator('#story-next').click(); await p.waitForTimeout(200); }
console.log('during outro:', await p.locator('#tower-name').textContent(), '|', (await p.locator('#story-text').textContent()).slice(0, 40));
await p.locator('#story-next').click(); await p.waitForTimeout(400);
console.log('after chapter card:', await p.locator('#tower-name').textContent(), '| next card:', (await p.locator('#story-text').textContent()).slice(0, 40));
await p.screenshot({ path: `${dir}/c2-intro.png` });
await next();
await p.waitForTimeout(400);
await p.screenshot({ path: `${dir}/c2-lab.png` });
await restoreN(3);
await p.screenshot({ path: `${dir}/c2-half.png` });
await restoreN(3);
await p.waitForTimeout(600);
await p.screenshot({ path: `${dir}/c2-done.png` });
await p.locator('#btn-back').click(); await p.waitForTimeout(500);
console.log('chapter', await p.evaluate(() => window.arcane.state.chapter), 'gen levels', await p.evaluate(() => window.arcane.state.board.filter((c) => c.piece?.kind === 'gen').map((c) => c.piece.level ?? 1).join(',')));
await p.screenshot({ path: `${dir}/c2-board.png` });
console.log('last story lines:', texts.slice(-4));
console.log('errors', errs);
await b.close();
