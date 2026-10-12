// Walk through the tower: intro, open tower, restore tasks, finish the chapter.
// Usage: node scripts/towershots.mjs <url> <dir>
import { chromium } from '@playwright/test';
const [url, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload();
await p.waitForTimeout(1200);
await p.screenshot({ path: `${dir}/t1-intro.png` });
const next = async () => { for (let i = 0; i < 10 && await p.locator('#story:not(.hidden)').count(); i++) { await p.locator('#story-next').click(); await p.waitForTimeout(200); } };
await next();
await p.evaluate(() => { window.arcane.state.stars = 4; });
await p.evaluate(() => window.dispatchEvent(new Event('resize')));
await p.locator('#btn-tower').click(); await p.waitForTimeout(600);
await p.screenshot({ path: `${dir}/t2-tower.png` });
await p.locator('[data-restore]').click(); await p.waitForTimeout(250);
await p.screenshot({ path: `${dir}/t3-restore.png` });
await p.waitForTimeout(900);
await p.screenshot({ path: `${dir}/t4-story.png` });
await next();
await p.locator('[data-restore]').click(); await p.waitForTimeout(1500); await next();
console.log('stars after 2 tasks:', await p.evaluate(() => window.arcane.state.stars), 'button off:', await p.locator('[data-restore].off').count());
await p.evaluate(() => { window.arcane.state.stars = 20; });
for (let k = 0; k < 4; k++) { await p.locator('[data-restore]').click(); await p.waitForTimeout(1500); if (k < 3) await next(); }
await p.screenshot({ path: `${dir}/t5-done-story.png` });
await next();
await p.waitForTimeout(800);
await p.screenshot({ path: `${dir}/t6-room-done.png` });
await p.locator('#btn-back').click(); await p.waitForTimeout(500);
await p.screenshot({ path: `${dir}/t7-board.png` });
console.log('chapter', await p.evaluate(() => window.arcane.state.chapter), 'sealed left', await p.evaluate(() => window.arcane.state.board.filter((c) => c.lock === 2).length), 'errors', errs);
await b.close();
