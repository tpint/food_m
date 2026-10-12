// Scripted playtest: serve a customer, then open the restaurant, leaderboard,
// quests and fridge. Saves screenshots to the given dir.
// Usage: node scripts/play.mjs [url] [dir]   (with `npm run dev` running)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const [url = 'http://localhost:5173/', dir = 'shots'] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(m.text()));

/** Click through Chef Pip's story cards if any are showing. */
async function skipStory() {
  await p.waitForTimeout(700);
  for (let i = 0; i < 12 && await p.locator('#story:not(.hidden)').count(); i++) {
    await p.locator('#story-next').click();
    await p.waitForTimeout(150);
  }
}

await p.goto(url);
await skipStory();

// Put the first customer's whole order on the board, then serve them.
await p.evaluate(() => {
  const k = window.kitchen;
  const s = k.state;
  s.customers[0].order.forEach((n, i) => { s.board[14 + i].piece = { kind: 'item', chain: n.chain, level: Math.max(n.level, 1) }; });
  s.customers[0].order = s.customers[0].order.map((n) => ({ ...n, level: Math.max(n.level, 1) }));
  localStorage.setItem('food-merge-save-v1', JSON.stringify(s));
});
await p.reload();
await skipStory();
await p.screenshot({ path: `${dir}/1-ready.png` });
await p.locator('.customer.ready .serve').first().click();
await p.waitForTimeout(450);
await p.screenshot({ path: `${dir}/2-plating.png` });
await p.waitForTimeout(500);
await p.screenshot({ path: `${dir}/3-serving.png` });
await p.waitForTimeout(2000);
await p.screenshot({ path: `${dir}/4-served.png` });

// Restaurant, with a few tasks done.
await p.evaluate(() => { window.kitchen.state.stars = 20; });
await p.locator('#btn-menu').click();
await p.locator('#btn-diner').click();
for (let i = 0; i < 3; i++) {
  await p.locator('[data-restore]').click();
  await p.waitForTimeout(900);
  await skipStory();
}
await p.screenshot({ path: `${dir}/5-restaurant.png` });
await p.locator('#btn-back').click();

await p.locator('#btn-menu').click();
await p.locator('#btn-leaders').click();
await p.waitForTimeout(1200);
await p.screenshot({ path: `${dir}/6-leaderboard.png` });
await p.locator('#btn-leaders-back').click();

await p.locator('#btn-menu').click();
await p.locator('#btn-quests').click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${dir}/7-quests.png` });
await p.locator('#btn-quests-back').click();

await p.locator('#btn-fridge').click();
await p.waitForTimeout(400);
await p.screenshot({ path: `${dir}/8-fridge.png` });

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no page errors');
await b.close();
