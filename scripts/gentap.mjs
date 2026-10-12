// Checks that selecting a generator is free and the second tap conjures.
import { chromium } from '@playwright/test';
const [url] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
const energy = () => p.evaluate(() => window.arcane.state.energy);
const r = await p.locator('.cell[data-i="56"]').boundingBox();
const tap = () => p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
const e0 = await energy();
await tap(); await p.waitForTimeout(300);
const e1 = await energy();
const btn = await p.locator('#info-action').textContent();
await tap(); await p.waitForTimeout(300);
const e2 = await energy();
await tap(); await p.waitForTimeout(300);
console.log({ start: e0, afterSelect: e1, button: btn, afterConjure: e2, afterSecondConjure: await energy(), errs });
await b.close();
