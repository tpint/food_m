// Screenshots of each element's spell effect at a few levels.
// Usage: node scripts/fxshots.mjs <url> <dir> [element...]
import { chromium } from '@playwright/test';
const [url, dir, ...only] = process.argv.slice(2);
const elements = only.length ? only : ['fire', 'water', 'wind', 'earth'];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url);
for (const el of elements) {
  for (const level of [1, 4, 7]) {
    await p.evaluate(() => localStorage.clear());
    await p.reload(); await p.waitForTimeout(400);
    await p.evaluate(({ el, level }) => {
      const s = window.arcane.state;
      s.monsters[1].needs = [{ chain: el, level }];
      s.board[31] = { piece: { kind: 'item', chain: el, level }, lock: 0 };
      localStorage.setItem('arcane-merge-save-v2', JSON.stringify(s));
    }, { el, level });
    await p.reload(); await p.waitForTimeout(500);
    await p.locator('.monster.ready .cast').first().click();
    await p.waitForTimeout(560 + 170);
    await p.screenshot({ path: `${dir}/fx-${el}-${level}.png`, clip: { x: 0, y: 0, width: 390, height: 520 } });
    await p.waitForTimeout(1600);
  }
}
console.log('errors', errs);
await b.close();
