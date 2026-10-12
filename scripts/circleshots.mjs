// Screenshots of the casting circle mid-charge.
// Usage: node scripts/circleshots.mjs <url> <dir>
import { chromium } from '@playwright/test';

/** Click through Professor Hoot's story cards if any are showing. */
async function skipStory(p) {
  await p.waitForTimeout(700);
  for (let i = 0; i < 10 && await p.locator('#story:not(.hidden)').count(); i++) {
    await p.locator('#story-next').click();
    await p.waitForTimeout(150);
  }
}

const [url, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url);
const runs = [['wind', 1], ['earth', 4], ['fire', 6], ['water', 7]];
for (const [el, level] of runs) {
  await p.evaluate(() => localStorage.clear());
  await p.reload(); await p.waitForTimeout(400); await skipStory(p);
  await p.evaluate(({ el, level }) => {
    const s = window.arcane.state;
    s.monsters[1].needs = [{ chain: el, level }];
    s.board[38] = { piece: { kind: 'item', chain: el, level }, lock: 0 };
    localStorage.setItem('arcane-merge-save-v2', JSON.stringify(s));
  }, { el, level });
  await p.reload(); await p.waitForTimeout(500); await skipStory(p);
  await p.locator('.monster.ready .cast').first().click();
  await p.waitForTimeout((380 + level * 90) * 0.85);
  await p.screenshot({ path: `${dir}/circle-${level}.png` });
  await p.waitForTimeout(2500);
}
// The upgrade button with its coin icon.
await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400); await skipStory(p);
const r = await p.locator('.cell[data-i="56"]').boundingBox();
await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2); await p.waitForTimeout(400);
await p.locator('#info').screenshot({ path: `${dir}/upgrade-btn.png` });
console.log('errors', errs);
await b.close();
