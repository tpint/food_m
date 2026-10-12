import { chromium } from '@playwright/test';
const [url, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = []; p.on('pageerror', (e) => errors.push(e.message));
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
const tap = async (i) => { const r = await p.locator(`.cell[data-i="${i}"]`).boundingBox(); await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); };
await tap(56); await p.waitForTimeout(400);
await p.screenshot({ path: `${dir}/u1-locked.png` });
await p.locator('#info-action').click(); await p.waitForTimeout(300);
console.log('toast:', await p.locator('#toast').textContent());
await p.evaluate(() => { const s = window.arcane.state; s.level = 9; s.coins = 2000; });
for (let k = 0; k < 4; k++) { await p.locator('#info-action').click(); await p.waitForTimeout(700); }
await p.screenshot({ path: `${dir}/u2-upgraded.png` });
console.log('gen', await p.evaluate(() => JSON.stringify(window.arcane.state.board[56].piece)), 'coins', await p.evaluate(() => window.arcane.state.coins));
console.log('label', await p.locator('#info-title').textContent(), '| btn hidden:', await p.locator('#info-action.hidden').count());
for (let k = 0; k < 15; k++) { await tap(56); await p.waitForTimeout(60); }
await p.waitForTimeout(500);
await p.screenshot({ path: `${dir}/u3-spawn.png` });
console.log('errors', errors);
await b.close();
