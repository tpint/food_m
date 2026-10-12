import { CHAINS, ChainId, GEN_LEVELS, GENERATORS, GenId, MONSTERS, BOSS } from './game/config';
import { generatorArt, iconArt, itemArt, monsterImg, setArtTheme } from './render/art';
import { THEMES, ThemeId } from './render/scene';

// ?theme=garden shows the art in another theme.
const theme = (new URLSearchParams(location.search).get('theme') ?? 'sunny') as ThemeId;
setArtTheme(theme in THEMES ? theme : 'sunny');

const g = document.getElementById('g')!;
g.insertAdjacentHTML('beforeend', `<p>${(Object.keys(THEMES) as ThemeId[]).map((t) => `<a href="?theme=${t}">${THEMES[t].name}</a>`).join(' · ')}</p>`);
const cell = (src: string, label: string) => `<div class="c"><div><img src="${src}"></div>${label}</div>`;
for (const c of Object.keys(CHAINS) as ChainId[]) {
  g.insertAdjacentHTML('beforeend', `<div class="row">${CHAINS[c].levels.map((n, i) => cell(itemArt(c, i + 1), n)).join('')}</div>`);
}
for (const k of Object.keys(GENERATORS) as GenId[]) {
  g.insertAdjacentHTML('beforeend', `<div class="row">${GEN_LEVELS.map((_, i) => cell(generatorArt(k, i + 1), `${GENERATORS[k].name} Lv ${i + 1}`)).join('')}</div>`);
}
g.insertAdjacentHTML('beforeend', `<div class="row">${[...MONSTERS, BOSS].map((m) => cell(monsterImg(m.kind), m.name)).join('')}</div>`);
g.insertAdjacentHTML('beforeend', `<div class="row">${(Object.keys(iconArt) as (keyof typeof iconArt)[]).map((k) => cell(iconArt[k](), k)).join('')}</div>`);
