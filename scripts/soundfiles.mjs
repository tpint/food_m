// Renders the spell-flight and monster-cry sounds to WAV files by swapping
// the page's AudioContext for an OfflineAudioContext.
// Usage: node scripts/soundfiles.mjs <url> <dir>
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const [url, dir] = process.argv.slice(2);
const RATE = 44100;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext();
await ctx.addInitScript((rate) => {
  window.AudioContext = class extends OfflineAudioContext {
    constructor() { super(2, rate * 2.6, rate); window.__ac = this; }
    resume() { return Promise.resolve(); }
    get state() { return 'running'; }
  };
}, RATE);
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
async function render(call) {
  await p.goto(url); await p.waitForTimeout(300);
  return p.evaluate(async (code) => {
    // eslint-disable-next-line no-new-func
    new Function('sfx', code)(window.arcane.sfx);
    const buf = await window.__ac.startRendering();
    const ch = buf.getChannelData(0);
    let peak = 0; for (const v of ch) peak = Math.max(peak, Math.abs(v));
    return { data: Array.from(ch), peak };
  }, call);
}
function wav(samples) {
  const n = samples.length, out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(RATE, 24); out.writeUInt32LE(RATE * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  samples.forEach((v, i) => out.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767 | 0, 44 + i * 2));
  return out;
}
const trim = (d, secs) => d.slice(0, Math.floor(RATE * secs));
const gap = (secs) => new Array(Math.floor(RATE * secs)).fill(0);
const report = [];
let spells = [];
for (const el of ['fire', 'water', 'wind', 'earth']) {
  for (const lv of [1, 4, 7]) {
    const r = await render(`sfx.spellFly('${el}', ${lv}, 0.52)`);
    report.push(`${el} L${lv} peak ${r.peak.toFixed(2)}`);
    spells = spells.concat(trim(r.data, 0.7), gap(0.35));
  }
  spells = spells.concat(gap(0.4));
}
let cries = [];
for (const m of ['slime', 'bat', 'mushroom', 'ghost', 'imp', 'golem', 'dragon']) {
  const r = await render(`sfx.monsterCry('${m}')`);
  report.push(`${m} peak ${r.peak.toFixed(2)}`);
  cries = cries.concat(trim(r.data, m === 'dragon' ? 2.5 : m === 'ghost' || m === 'golem' ? 1.8 : 1.0), gap(0.5));
}
writeFileSync(`${dir}/spell-swoops.wav`, wav(spells));
writeFileSync(`${dir}/monster-cries.wav`, wav(cries));
console.log(report.join('\n'));
console.log('errors', errs);
await b.close();
