// Usage: node scripts/shot.mjs <url> <out.png> [width] [height]
import { chromium } from '@playwright/test';
const [url, out, w = '420', h = '860'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.error('PAGEERROR', e.message));
p.on('console', (m) => m.type() === 'error' && console.error('CONSOLE', m.text()));
await p.goto(url);
await p.waitForTimeout(800);
await p.screenshot({ path: out, fullPage: true });
await b.close();
