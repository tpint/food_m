// Builds dist-artifact/ and assembles it into one HTML file (no <html>/<head>/<body>,
// the host adds those) so the game can be shared as a single page.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

execSync('npx vite build --config vite.artifact.config.ts', { stdio: 'inherit' });
const dir = 'dist-artifact/assets';
const files = readdirSync(dir);
const css = readFileSync(`${dir}/${files.find((f) => f.endsWith('.css'))}`, 'utf8');
const js = readFileSync(`${dir}/${files.find((f) => f.endsWith('.js'))}`, 'utf8');
const html = readFileSync('index.html', 'utf8');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('<script type="module"'));
const out = `<title>Sunny Spoon</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=swap">
<style>${css}</style>
${body.trim()}
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
writeFileSync('dist-artifact/sunny-spoon.html', out);
console.log('wrote dist-artifact/sunny-spoon.html', (out.length / 1024).toFixed(1), 'KB');
