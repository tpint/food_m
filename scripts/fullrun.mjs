// Plays every chapter from a fresh game: restores all tasks, clicks through
// every story card, and checks rewards and room changes along the way.
// Usage: node scripts/fullrun.mjs <url> <dir>
import { chromium } from '@playwright/test';
const [url, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const lines = [];
const next = async () => {
  for (let i = 0; i < 20 && await p.locator('#story:not(.hidden)').count(); i++) {
    lines.push(await p.locator('#story-text').textContent());
    await p.locator('#story-next').click(); await p.waitForTimeout(120);
  }
};
await p.goto(url); await p.waitForTimeout(1300); await next();
await p.evaluate(() => { window.arcane.state.stars = 999; });
await p.locator('#btn-tower').click(); await p.waitForTimeout(400);
const rooms = [];
for (let k = 0; k < 30; k++) {
  const name = await p.locator('#tower-name').textContent();
  if (!rooms.includes(name)) rooms.push(name);
  await p.locator('[data-restore]').click(); await p.waitForTimeout(950); await next();
}
const s = await p.evaluate(() => {
  const st = window.arcane.state;
  return {
    chapter: st.chapter, tasks: st.tasksDone.length, starBonus: st.starBonus,
    gens: st.board.filter((c) => c.piece?.kind === 'gen').map((c) => c.piece.level ?? 1).join(','),
    flasks: st.board.filter((c) => c.piece?.kind === 'item' && c.piece.chain === 'mana' && c.piece.level === 3).length,
    sealed: st.board.filter((c) => c.lock === 2).length,
  };
});
console.log('rooms visited:', rooms.join(' > '));
console.log('final state:', JSON.stringify(s));
console.log('restore buttons left:', await p.locator('[data-restore]').count(), '| progress:', await p.locator('#tower-progress-text').textContent());
console.log('story cards seen:', lines.length);
console.log('last lines:', lines.slice(-3).map((l) => l.slice(0, 70)));
await p.screenshot({ path: `${dir}/final-tower.png` });
await p.locator('#btn-back').click(); await p.waitForTimeout(400);
await p.screenshot({ path: `${dir}/final-board.png` });
console.log('monster card star text:', await p.locator('.monster .reward').first().textContent());
console.log('errors', errs);
await b.close();
