// Playtest for merge-3: five matching items should merge into two.
// Usage: node scripts/merge3.mjs <url> <screenshot-dir>
import { chromium } from '@playwright/test';
const [url, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(500);
const c = async (i) => { const r = await p.locator(`.cell[data-i="${i}"]`).boundingBox(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; };
const drag = async (a, z) => {
  const s = await c(a), e = await c(z);
  await p.mouse.move(s.x, s.y); await p.mouse.down();
  await p.mouse.move(s.x + 10, s.y + 10, { steps: 3 }); await p.mouse.move(e.x, e.y, { steps: 8 }); await p.mouse.up();
};
// Four herbs in a row on the first open row, a fifth further down; then reload so they render.
await p.evaluate(() => {
  const s = window.arcane.state;
  for (const i of [22, 23, 24, 25, 49]) s.board[i] = { piece: { kind: 'item', chain: 'herb', level: 2 }, lock: 0 };
  localStorage.setItem('arcane-merge-save-v1', JSON.stringify(s));
});
await p.reload(); await p.waitForTimeout(500);
await drag(49, 22);
await p.waitForTimeout(120);
await p.screenshot({ path: `${dir}/m3a.png` });
await p.waitForTimeout(800);
await p.screenshot({ path: `${dir}/m3b.png` });
const row = await p.evaluate(() => window.arcane.state.board.slice(21, 28).map((x) => (x.piece ? x.piece.chain + x.piece.level : '-')).join(' '));
console.log('row after 5-merge:', row, '| errors:', errs);
await b.close();
