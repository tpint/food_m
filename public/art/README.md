# Painted art overrides

Drop a PNG here named after the art key and list the key in `manifest.json`.
The game then uses the PNG instead of the code-drawn SVG for that item.

- Square images with a transparent background, about 256×256 px.
- Frame the object the way the SVGs are framed: centred, filling about 80–90% of the square.
- Keys: `crystal-1` … `crystal-7`, `herb-1` … `herb-7`, `flame-1` … `flame-7`,
  `arcane-1` … `arcane-7`, `coin-1` … `coin-4`, `mana-1` … `mana-3`,
  `gen-geode`, `gen-planter`, `gen-forge`, `gen-lectern`,
  `mon-slime`, `mon-bat`, `mon-mushroom`, `mon-ghost`, `mon-imp`, `mon-golem`, `mon-dragon`,
  `icon-coin`, `icon-gem`, `icon-energy`, `icon-star`.

Example `manifest.json` after adding `crystal-1.png` and `mon-slime.png`:

```json
["crystal-1", "mon-slime"]
```
