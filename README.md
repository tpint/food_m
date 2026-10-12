# Arcane Merge

A merge-3 game in the style of Love & Pies / Merge Mansion, with a magic theme:
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

- **Elements**: Earth, Water, Wind and Fire. Each has a 7-level merge chain and its own generator
  (a grimoire for each element).
- **Generators**: tap one to select it (free; shows its info and Upgrade button), then tap it again to conjure an item. Each conjure costs 1 ⚡ mana.
  Mana refills over time (+1 every 20 s, up to 100).
- **Upgrade generators**: select a generator and press **Upgrade** (costs coins, needs a minimum player level).
  Each level (up to 5) raises the odds of higher-level drops and adds a chance of a free conjure. Tuning lives in `GEN_LEVELS`.
- **Merge**: put three identical items side by side (drag one onto or next to the other two) to make one of the next level.
  Five touching items make two. Two alone won't merge. Items you can merge with glow blue while you drag.
- **Monsters**: each card shows the items the monster is weak to. Items that match get a ✓.
  When you have them all, press **Cast!** to defeat it and collect coins, XP and gems.
  Every 6th monster is a boss.
- **Tower restoration**: monsters also drop **Stars** (bosses drop 3). Tap the tower button (top right) to open the
  Tower screen and spend Stars on restoration tasks, in order. Each task visibly repairs the room and Professor Hoot,
  the Archmage's owl, tells a bit more of the story. Chapter 1 is *The Dusty Library* (6 tasks; reward: coins, gems and the sealed board rows
  start to clear). Chapter 2 is *The Alchemy Lab* (6 tasks; reward: coins, gems and every grimoire gains a level).
  Chapters live in `src/game/story.ts`; each chapter's room is drawn in `src/render/room.ts`.
- **Leaderboard**: the trophy button shows the top 50 by monsters defeated, this week (resets Monday 00:00 UTC) or
  all time, plus your own rank. Each device gets a hidden player ID and an "Apprentice ####" name you can change.
  Scores are stored in Supabase (`src/online.ts`); the database only accepts score increases at a realistic rate,
  so an edited save cannot jump to the top. The leaderboard works on the public website only.
- **Cloud save & recovery code**: progress uploads to the cloud automatically (a few seconds after changes and when
  you leave). Tap the level star to open your profile: create a recovery code (like `ABCD-EFGH-JKLM-NPQR`) and type it
  on another device, or after clearing the browser, to restore your progress, name and leaderboard scores. When a
  device opens with older progress than the cloud copy, it loads the newer one. Codes are stored hashed on the server.
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
| `src/render/scene.ts` | Blurred wizard's-study backdrop and the cobweb on sealed tiles |
| `src/game/story.ts` | Tower chapters, restoration tasks and story text |
| `src/render/room.ts` | The tower room scene with a broken and a fixed layer per task |
| `src/online.ts` | Online features: leaderboard, cloud save and recovery codes (Supabase database functions `arcane_*`) |
| `src/render/circle.ts` | Arcane casting circle shown while a spell charges |
| `src/render/fx.ts` | Canvas particles (merge bursts, rings, sparkle trails) |
| `src/render/sfx.ts` | Sound effects synthesised with WebAudio (no audio files) |
| `src/main.ts` | UI: board, drag and drop, HUD, monster cards, info bar |

## Art direction

Straight top-down grid with soft 2D art, following the four merge-art rules:
1. **Silhouette progression**: e.g. bubbles → seashell → splash → tide orb → fountain → trident → great wave.
2. **Strict colour coding**: Earth = brown, Water = blue, Wind = mint/white, Fire = orange/red, Gold = yellow, Mana = pink.
3. **Low-contrast board**: cream tiles with very little contrast. The dark backdrop sits outside the board.
4. **Juicy VFX**: casting draws an arcane circle under each item while it charges (more rings, runes,
   polygrams and satellite circles at higher levels; a pillar of light at level 7), then merge flash + bounce, particle bursts, shockwave rings, coin showers and sounds. Each element has its own
   spell hit when cast at a monster (fire burst, water splash, wind vortex, earth rocks), and it grows with item level:
   level 4+ adds a fire pillar / geyser / tornado / ground cracks and screen shake, level 5+ a coloured flash, level 7 a finale.

The SVG art is a stand-in. Items are auto-framed to fill their tile and get a sticker outline and drop shadow, so the set stays consistent.
To replace any item with painted art, drop a PNG into `public/art/` and list its key in `public/art/manifest.json`
(see `public/art/README.md` for the key names). Anything not listed keeps its SVG.

## iOS / Android (next step)

Capacitor is already configured (`capacitor.config.json`).

```bash
npm run cap:android   # needs Android Studio
npm run cap:ios       # needs macOS + Xcode
npm run cap:sync      # rebuild web + copy into native projects
```
