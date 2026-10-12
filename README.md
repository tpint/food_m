# Arcane Merge

A merge-2 game in the style of Love & Pies / Merge Mansion, with a magic theme:
instead of delivering goods, you brew the magic that monsters are weak to, cast it
to defeat them, and collect the rewards.

Web proof of concept. Built with TypeScript + Vite, with no game engine, so the same
code can be wrapped for iOS and Android with Capacitor.

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (art gallery: /gallery.html)
npm test           # game-logic unit tests
npm run build      # production build in dist/
```

## How to play

- **Generators** (Geode, Planter, Forge, Lectern): tap one to conjure an item. Each tap costs 1 ⚡ mana.
  Mana refills over time (+1 every 20 s, up to 100).
- **Upgrade generators**: select a generator and press **Upgrade** (costs coins, needs a minimum player level).
  Each level (up to 5) raises the odds of higher-level drops and adds a chance of a free conjure. Tuning lives in `GEN_LEVELS`.
- **Merge**: drag an item onto an identical item to make the next level. Items you can merge with glow blue while you drag.
- **Monsters**: each card shows the items the monster is weak to. Items that match get a ✓.
  When you have them all, press **Cast!** to defeat it and collect coins, XP and gems.
  Every 6th monster is a boss.
- **Locked area**: veiled (bubble) items are freed when you merge a matching item onto them. Merging next to
  sealed (shadow) cells turns them into veiled ones.
- **Coins / Mana items**: tap one twice (or press Collect) to cash it in. Other items can be sold for coins.

To package the game as one self-contained HTML page (for sharing), run `node scripts/artifact.mjs`. The output is `dist-artifact/arcane-merge.html`.

Console helpers: `arcane.reset()`, `arcane.energy(100)`.

## Play online

Every push to `main` deploys to GitHub Pages: https://tpint.github.io/magic_m/
(one-time setup: repo **Settings → Pages → Source: GitHub Actions**).

## Code layout

| Path | What |
| --- | --- |
| `src/game/config.ts` | Data: merge chains, generators, monsters, tuning numbers |
| `src/game/state.ts` | Pure game logic (merge, spawn, energy, monsters, save). No DOM. |
| `src/render/art.ts` | Procedural SVG art. Each chain keeps one colour palette, and the silhouette changes at every level |
| `src/render/fx.ts` | Canvas particles (merge bursts, rings, sparkle trails) |
| `src/render/sfx.ts` | Sound effects synthesised with WebAudio (no audio files) |
| `src/main.ts` | UI: board, drag and drop, HUD, monster cards, info bar |

## Art direction

Straight top-down grid with soft 2D art, following the four merge-art rules:
1. **Silhouette progression**: e.g. shard → twin shards → cluster → gem → orb → scrying ball → star.
2. **Strict colour coding**: Crystal = blue, Herbal = green/brown, Flame = orange/red, Arcane = purple, Gold = yellow, Mana = pink.
3. **Low-contrast board**: cream tiles with very little contrast. The dark backdrop sits outside the board.
4. **Juicy VFX**: merge flash + bounce, particle bursts, shockwave rings, items flying to monsters, coin showers and sounds.

The SVG art is a stand-in and can be swapped for illustrated PNGs. `pieceArt()` is the only place art gets looked up.

## iOS / Android (next step)

Capacitor is already configured (`capacitor.config.json`).

```bash
npm run cap:android   # needs Android Studio
npm run cap:ios       # needs macOS + Xcode
npm run cap:sync      # rebuild web + copy into native projects
```
