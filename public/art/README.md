# Painted art overrides

Drop a PNG here named after the art key and list the key in `manifest.json`.
The game then uses the PNG instead of the code-drawn SVG for that item.

- Square images with a transparent background, about 256–384 px (384 stays sharp on 3x phone screens).
- Frame the object the way the SVGs are framed: centred, filling about 80–90% of the square.
- Keys: `earth-1` … `earth-7`, `water-1` … `water-7`, `wind-1` … `wind-7`,
  `fire-1` … `fire-7`, `coin-1` … `coin-4`, `mana-1` … `mana-3`,
  `gen-geode`, `gen-well`, `gen-windmill`, `gen-forge` (level 1, and every level that has no own PNG),
  `gen-geode-2` … `gen-geode-10` (and the same for `well`, `windmill`, `forge`),
  `mon-slime`, `mon-bat`, `mon-mushroom`, `mon-ghost`, `mon-imp`, `mon-golem`, `mon-dragon`,
  `icon-hat`, `icon-coin`, `icon-gem`, `icon-energy`, `icon-star`.

Example `manifest.json` after adding `water-1.png` and `mon-slime.png`:

```json
["water-1", "mon-slime"]
```

## Generators

The grimoire generators (`gen-*`, all four elements, levels 1–10) are painted PNGs made by
`scripts/art/paint-generators.mjs`, which builds a detailed SVG for each one, and
`scripts/art/render-generators.mjs`, which renders them at 3× and downsamples to 384 px:

```bash
npm i -D sharp                                   # one-off; Playwright already comes with @playwright/test
node scripts/art/render-generators.mjs public/art 384           # all 40
node scripts/art/render-generators.mjs public/art 384 forge     # just one element
```
