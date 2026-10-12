import { CHAINS, ChainId, CRITIC, CUSTOMERS, GEN_LEVELS, GENERATORS, GenId } from './game/config';
import { customerImg, generatorArt, iconArt, itemArt } from './render/art';

const g = document.getElementById('g')!;
const cell = (src: string, label: string) => `<div class="c"><div><img src="${src}"></div>${label}</div>`;
for (const c of Object.keys(CHAINS) as ChainId[]) {
  g.insertAdjacentHTML('beforeend', `<div class="row">${CHAINS[c].levels.map((n, i) => cell(itemArt(c, i + 1), n)).join('')}</div>`);
}
for (const k of Object.keys(GENERATORS) as GenId[]) {
  g.insertAdjacentHTML('beforeend', `<div class="row">${GEN_LEVELS.map((_, i) => cell(generatorArt(k, i + 1), `${GENERATORS[k].name} Lv ${i + 1}`)).join('')}</div>`);
}
g.insertAdjacentHTML('beforeend', `<div class="row">${[...CUSTOMERS, CRITIC].map((m) => cell(customerImg(m.kind), m.name)).join('')}</div>`);
g.insertAdjacentHTML('beforeend', `<div class="row">${(Object.keys(iconArt) as (keyof typeof iconArt)[]).map((k) => cell(iconArt[k](), k)).join('')}</div>`);
