// Leaderboard UI with the server mocked (the sandbox cannot reach Supabase).
// Usage: node scripts/leadershots.mjs <url> <dir>
import { chromium } from '@playwright/test';
const [url, dir] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const calls = [];
let myName = 'Apprentice 4821';
const names = ['Moonwhisker', 'Ember Queen', 'ทอฝัน', 'Sir Merlinson', 'Dewdrop', 'Kestrel', 'Bramblewick', 'Nova', 'Pip'];
const top = (me) => names.map((n, i) => ({ rank: i + 1 + (i >= 5 ? 1 : 0), name: n, score: 120 - i * 11, level: 9 - Math.floor(i / 2), me: false }))
  .concat(me ? [{ rank: 6, name: myName, score: 64, level: 4, me: true }] : []).sort((a, z) => a.rank - z.rank);
await ctx.route('**/rest/v1/rpc/**', async (route) => {
  const fn = route.request().url().split('/').pop();
  const body = JSON.parse(route.request().postData() || '{}');
  calls.push(fn);
  if (fn === 'arcane_register') { myName = body.p_name; return route.fulfill({ json: { id: 'x', name: myName } }); }
  if (fn === 'arcane_submit') return route.fulfill({ json: { accepted: 1 } });
  if (fn === 'arcane_board') return route.fulfill({ json: { period: body.p_period, week_start: '2026-10-12', top: top(true), me: { rank: 6, score: 64, name: myName } } });
  return route.abort();
});
await p.goto(url); await p.waitForTimeout(1200);
for (let i = 0; i < 6 && await p.locator('#story:not(.hidden)').count(); i++) { await p.locator('#story-next').click(); await p.waitForTimeout(150); }
await p.screenshot({ path: `${dir}/l0-hud.png`, clip: { x: 0, y: 0, width: 390, height: 90 } });
await p.locator('#btn-leaders').click(); await p.waitForTimeout(600);
await p.screenshot({ path: `${dir}/l1-week.png` });
await p.locator('#btn-rename').click();
await p.locator('#rename-input').fill('Hootsworth');
await p.locator('#rename-form button').click(); await p.waitForTimeout(600);
await p.screenshot({ path: `${dir}/l2-renamed.png` });
await p.locator('.tab[data-period="all"]').click(); await p.waitForTimeout(500);
console.log('sub:', await p.locator('#leaders-sub').textContent(), '| me:', await p.locator('#me-name').textContent(), await p.locator('#me-rank').textContent());
await ctx.unroute('**/rest/v1/rpc/**');
await ctx.route('**/rest/v1/rpc/**', (route) => route.abort());
await p.locator('.tab[data-period="week"]').click(); await p.waitForTimeout(800);
await p.screenshot({ path: `${dir}/l3-offline.png` });
console.log('offline msg:', (await p.locator('#board-msg').textContent()).slice(0, 40));
console.log('calls', calls, 'errors', errs);
await b.close();
