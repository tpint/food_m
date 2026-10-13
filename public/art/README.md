# Painted art overrides

Every item, kitchen station, customer and icon is drawn in code as an SVG
(`src/render/art.ts`). To replace any of them with painted art, drop a PNG
here named after the art key and list the key in `manifest.json`. The game
then uses the PNG instead of the code-drawn SVG for that piece.

- Square images with a transparent background, about 256–384 px (384 stays sharp on 3x phone screens).
- Frame the object centred and filling about 97% of the square: items fill their board tile edge to edge.
- Customers (`cus-*`) are the exception: 512×448, a 384 px square at the bottom centre holding the
  customer (face 128 px wide, body touching the bottom), plus 64 px of room left, right and above
  where ears and tails can spill over the neighbouring customers untrimmed.
- Keys: `bakery-1` … `bakery-7`, `drinks-1` … `drinks-7`, `dessert-1` … `dessert-7`,
  `grill-1` … `grill-7`, `coin-1` … `coin-4`, `energy-1` … `energy-3`,
  `gen-oven`, `gen-fountain`, `gen-mixer`, `gen-bbq` (level 1, and every level that has no own PNG),
  `gen-oven-2` … `gen-oven-10` (and the same for `fountain`, `mixer`, `bbq`),
  `cus-bunny`, `cus-cat`, `cus-bear`, `cus-fox`, `cus-penguin`, `cus-pig`, `cus-frog`,
  `cus-panda`, `cus-dog`, `cus-raccoon`, `cus-lion`, `cus-critic`,
  `icon-chef`, `icon-diner`, `icon-toque`, `icon-coin`, `icon-gem`, `icon-energy`,
  `icon-trophy`, `icon-gstar`, `icon-pad`, `icon-fridge`, `icon-star`.

Example `manifest.json` after adding `drinks-1.png` and `cus-bunny.png`:

```json
["drinks-1", "cus-bunny"]
```

## Painted set

Every key above now has a painted PNG (384 px), and all of them are listed in
`manifest.json`; the code-drawn SVGs remain as the fallback. The PNGs are made by the
scripts in `scripts/art/`: `fitems.mjs`, `fcustomers.mjs`, `ficons.mjs` and
`fstations.mjs` build a detailed SVG for each sprite (with shared helpers in
`paint.mjs`, `items.mjs` and `extras.mjs`), and `render-art.mjs` draws it at 3× in
Chromium and downsamples it to 384 px.

```bash
npm i -D sharp                                        # one-off; Playwright already comes with @playwright/test
node scripts/art/render-art.mjs public/art 384        # every sprite
ONLY=gen-bbq,cus-critic node scripts/art/render-art.mjs   # only keys starting with these
```

### Station art from a single picture

All four kitchen stations use one painted picture each
(`scripts/art/station-src/<id>.png`, transparent background). All 10 levels are built
from it by adding the game's own level decorations around it:

```bash
npm run dev    # in another terminal
node scripts/art/compose-stations.mjs http://localhost:5173/ oven fountain mixer bbq
```
