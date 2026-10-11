import { CHAINS, ChainId, GENERATORS, GenId, MONSTERS, BOSS } from './game/config';
import { generatorArt, itemArt, monsterImg } from './render/art';

const g = document.getElementById('g')!;
const cell = (src: string, label: string) => `<div class="c"><div><img src="${src}"></div>${label}</div>`;
for (const c of Object.keys(CHAINS) as ChainId[]) {
  g.insertAdjacentHTML('beforeend', `<div class="row">${CHAINS[c].levels.map((n, i) => cell(itemArt(c, i + 1), n)).join('')}</div>`);
}
g.insertAdjacentHTML('beforeend', `<div class="row">${(Object.keys(GENERATORS) as GenId[]).map((k) => cell(generatorArt(k), GENERATORS[k].name)).join('')}</div>`);
g.insertAdjacentHTML('beforeend', `<div class="row">${[...MONSTERS, BOSS].map((m) => cell(monsterImg(m.kind), m.name)).join('')}</div>`);
