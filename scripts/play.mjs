// Scripted playtest: merge, spawn, cast. Saves screenshots to the given dir.
import { chromium } from '@playwright/test';
const [url, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto(url);
await p.evaluate(() => localStorage.clear());
await p.reload();
await p.waitForTimeout(600);
await p.screenshot({ path: `${dir}/p1.png` });

const cellCenter = async (i) => {
  const r = await p.locator(`.cell[data-i="${i}"]`).boundingBox();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
};
const dragCells = async (a, z) => {
  const s = await cellCenter(a), e = await cellCenter(z);
  await p.mouse.move(s.x, s.y); await p.mouse.down();
  await p.mouse.move(s.x + 10, s.y + 10, { steps: 3 });
  await p.mouse.move(e.x, e.y, { steps: 8 });
  await p.mouse.up();
};
// Two shards alone won't merge; the third (cell 54) completes the set.
await dragCells(36, 37);
await p.waitForTimeout(300);
console.log('two-only toast:', await p.locator('#toast').textContent());
await dragCells(54, 37);
await p.waitForTimeout(120);
await p.screenshot({ path: `${dir}/p2-merge.png` });
await p.waitForTimeout(500);
// Tap generators a bunch.
for (let k = 0; k < 6; k++) { const c = await cellCenter(60); await p.mouse.click(c.x, c.y); await p.waitForTimeout(80); }
for (let k = 0; k < 6; k++) { const c = await cellCenter(56); await p.mouse.click(c.x, c.y); await p.waitForTimeout(80); }
await p.waitForTimeout(500);
await p.screenshot({ path: `${dir}/p3-spawn.png` });
// Make every monster castable by placing needed items via state, then cast the first.
await p.evaluate(() => {
  const s = window.arcane.state; const m = s.monsters[0];
  m.needs.forEach((n, k) => { s.board[21 + 7 + k].piece = { kind: 'item', chain: n.chain, level: n.level }; });
});
await p.evaluate(() => window.dispatchEvent(new Event('resize')));
// Force re-render by a no-op drag-tap on empty cell
const c = await cellCenter(30); await p.mouse.click(c.x, c.y);
await p.waitForTimeout(300);
const ready = await p.locator('.monster.ready .cast').count();
console.log('ready monsters', ready);
if (ready) {
  await p.locator('.monster.ready .cast').first().click();
  await p.waitForTimeout(450);
  await p.screenshot({ path: `${dir}/p4-cast.png` });
  await p.waitForTimeout(1200);
}
await p.screenshot({ path: `${dir}/p5-after.png` });
console.log('state', await p.evaluate(() => JSON.stringify({ c: window.arcane.state.coins, e: window.arcane.state.energy, xp: window.arcane.state.xp, d: window.arcane.state.defeated })));
console.log('errors', errors);
await b.close();
