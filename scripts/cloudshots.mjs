// Cloud save + recovery code across two "devices", with the server mocked
// in memory (the sandbox cannot reach Supabase).
// Usage: node scripts/cloudshots.mjs <url> <dir>
import { chromium } from '@playwright/test';
const [url, dir] = process.argv.slice(2);
const server = { players: {}, devices: {}, codes: {} };
let nextId = 1;
const handle = (fn, b) => {
  const pid = server.devices[b.p_token];
  switch (fn) {
    case 'arcane_register': {
      const id = pid ?? `p${nextId++}`;
      server.devices[b.p_token] = id;
      server.players[id] = { ...(server.players[id] ?? {}), name: b.p_name };
      return { id, name: b.p_name };
    }
    case 'arcane_submit': return { accepted: 1 };
    case 'arcane_board': return { period: 'week', week_start: '2026-10-12', top: [], me: null };
    case 'arcane_cloud_save': {
      const p = server.players[pid];
      if (!p.save_at || p.save_at <= b.p_save_at) { p.save = b.p_save; p.save_at = b.p_save_at; }
      return { ok: true };
    }
    case 'arcane_cloud_load': { const p = server.players[pid]; return p ? { save: p.save ?? null, save_at: p.save_at ?? null, name: p.name } : null; }
    case 'arcane_new_code': { const code = 'MOON-7KQ2-FIRE-93XA'; server.codes[code.replace(/-/g, '')] = pid; return { code }; }
    case 'arcane_recover': {
      const id = server.codes[b.p_code.toUpperCase().replace(/[^A-Z0-9]/g, '')];
      if (!id) return { __error: 'That recovery code was not found' };
      server.devices[b.p_token] = id;
      const p = server.players[id];
      return { name: p.name, save: p.save, save_at: p.save_at };
    }
  }
};
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const errs = [];
async function device(name) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('**/rest/v1/rpc/**', (route) => {
    const fn = route.request().url().split('/').pop();
    const out = handle(fn, JSON.parse(route.request().postData() || '{}'));
    if (out?.__error) return route.fulfill({ status: 400, json: { message: out.__error } });
    return route.fulfill({ json: out ?? null });
  });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(`${name}: ${e.message}`));
  await p.goto(url); await p.waitForTimeout(1200);
  for (let i = 0; i < 6 && await p.locator('#story:not(.hidden)').count(); i++) { await p.locator('#story-next').click(); await p.waitForTimeout(150); }
  return { p, ctx };
}
const stateOf = (p) => p.evaluate(() => { const s = window.arcane.state; return { coins: s.coins, level: s.level, chapter: s.chapter, tasks: s.tasksDone.length }; });

// Device A: make some progress, open the profile, create a code.
const A = await device('A');
await A.p.evaluate(() => { const s = window.arcane.state; s.coins = 4321; s.level = 6; s.tasksDone = ['cobwebs', 'candles']; });
await A.p.locator('#hud-level').click(); await A.p.waitForTimeout(300);
await A.p.locator('#btn-save-now').click(); await A.p.waitForTimeout(800);
await A.p.locator('#btn-new-code').click(); await A.p.waitForTimeout(600);
await A.p.screenshot({ path: `${dir}/cs1-profile.png` });
console.log('A:', await stateOf(A.p), '| status:', await A.p.locator('#cloud-status').textContent(), '| code:', await A.p.locator('#code-text').textContent());

// Device B: fresh game, wrong code first, then the right one.
const B = await device('B');
await B.p.locator('#hud-level').click(); await B.p.waitForTimeout(300);
await B.p.locator('#restore-input').fill('aaaa bbbb cccc dddd');
await B.p.locator('#restore-form button').click(); await B.p.waitForTimeout(200);
await B.p.locator('#btn-restore-yes').click(); await B.p.waitForTimeout(500);
console.log('B wrong code toast:', await B.p.locator('#toast').textContent());
await B.p.locator('#restore-input').fill('moon 7kq2 fire 93xa');
await B.p.locator('#restore-form button').click(); await B.p.waitForTimeout(300);
await B.p.screenshot({ path: `${dir}/cs2-confirm.png` });
await B.p.locator('#btn-restore-yes').click(); await B.p.waitForTimeout(800);
await B.p.screenshot({ path: `${dir}/cs3-restored.png` });
console.log('B after restore:', await stateOf(B.p), '| name:', await B.p.locator('#profile-name').textContent());

// B plays on and saves; A reopens later and picks up B's newer save.
await B.p.evaluate(() => { window.arcane.state.coins = 9999; });
await B.p.locator('#btn-save-now').click(); await B.p.waitForTimeout(800);
await A.p.reload(); await A.p.waitForTimeout(1500);
console.log('A after reload:', await stateOf(A.p), '| toast:', await A.p.locator('#toast').textContent());
console.log('errors', errs);
await b.close();
