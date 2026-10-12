# Arcane Merge

A merge-3 game in the style of Love & Pies / Merge Mansion, with a magic theme:
instead of delivering goods, you brew the magic that monsters are weak to, cast it
to defeat them, and collect the rewards.

Web proof of concept. Built with TypeScript + Vite, with no game engine, so the same
code can be wrapped for iOS and Android with Capacitor.

<p align="center">
  <a href="https://github.com/tpint/magic_m/raw/main/media/arcane-merge-promo.mp4">
    <img src="media/promo.gif" width="300" alt="Arcane Merge promo: merging items, casting a phoenix, a tidal wave and a meteor at monsters, then restoring the tower">
  </a>
  <br>
  <sub>▶ <a href="https://github.com/tpint/magic_m/raw/main/media/arcane-merge-promo.mp4">Watch the promo with sound (MP4)</a> · 🎮 <a href="https://tpint.github.io/magic_m/">Play it in your browser</a></sub>
</p>

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
  Each level (up to 10) raises the odds of higher-level drops and adds a chance of a free conjure; from level 6 a
  grimoire can drop level 5 items. Tuning lives in `GEN_LEVELS`.
  Each level also dresses the grimoire up: gold corners, then gilt trim and a rune ring, glowing script, golden rays at
  level 5, an orbit of element motes, crystal shards and a gem-studded cover, a crown, gilded wings, and a starry sky at level 10.
- **Merge**: put three identical items side by side (drag one onto or next to the other two) to make one of the next level.
  Five touching items make two. Two alone won't merge. Items you can merge with glow blue while you drag.
- **Monsters**: each card shows the items the monster is weak to. Items that match get a ✓.
  When you have them all, press **Cast!** to defeat it and collect coins, XP and gems.
  The badge on each portrait shows the XP it gives; tap the portrait for its full rewards.
  Every 6th monster is a boss. New monsters join as you level up: Shadow Spider (level 2), Wisp Ghost (3),
  Cinder Imp and Tide Crab (4), Moss Golem (5), Frost Wolf (6), Gnarlroot (8) and Grumble Cyclops (10).
- **New monsters**: don't like the current lineup? The ⟳ button above the monster cards swaps all three for new ones.
  It costs 10 coins, and the price doubles with every refresh until you defeat a monster, which resets it to 10.
  A boss stays a boss when you refresh. Tuning lives in `REFRESH_BASE_COST` / `REFRESH_COST_GROWTH`.
- **Daily quests**: tap the scroll button (top right) for three quests a day, picked from: defeat monsters, merge,
  conjure, merge an item up to a given level, and collect coins from gold items. Targets and rewards scale with your level.
  Claim each for coins and gems; claiming all three opens a chest (+10 gems, +50 mana). New quests arrive at local midnight.
  Tuning lives in `makeQuest` / `DAILY_BONUS` in `src/game/state.ts`.
- **Tower restoration**: monsters also drop **Stars** (bosses drop 3). Tap the tower button (top right) to open the
  Tower screen and spend Stars on restoration tasks, in order. Each task visibly repairs the room and Professor Hoot,
  the Archmage's owl, tells a bit more of the story. Five chapters, one room each:
  1. *The Dusty Library*: the sealed board rows clear.
  2. *The Alchemy Lab* (Earth Seal): every grimoire gains a level.
  3. *The Observatory* (Wind Seal): two Mana Flasks appear on the board.
  4. *The Moonlit Greenhouse* (Water Seal): every monster drops 1 extra Star from then on.
  5. *The Archmage's Sanctum* (Fire Seal, free Elowen from the Shadow Mirror): every grimoire gains another level.
  Each also pays coins and gems.
  Chapters live in `src/game/story.ts`; each chapter's room is drawn in `src/render/room.ts`.
- **Leaderboard**: the trophy button shows the top 50 by monsters defeated, this week (resets Monday 00:00 UTC) or
  all time, or by player level (the Level tab), plus your own rank. Each device gets a hidden player ID and an "Apprentice ####" name you can change.
  Scores are stored in Supabase (`src/online.ts`); the database only accepts score increases at a realistic rate,
  so an edited save cannot jump to the top (a level can only rise by one per monster defeated). The leaderboard works on the public website only.
- **Cloud save & recovery code**: progress uploads to the cloud automatically (a few seconds after changes and when
  you leave). Tap the level star to open your profile: create a recovery code (like `ABCD-EFGH-JKLM-NPQR`) and type it
  on another device, or after clearing the browser, to restore your progress, name and leaderboard scores. When a
  device opens with older progress than the cloud copy, it loads the newer one. Codes are stored hashed on the server.
- **Start over**: the About panel on the profile screen has a button to reset your account. After a confirmation it
  wipes this device's game and starts a new one as a new apprentice. The old player's cloud save and leaderboard
  entry are kept, so a recovery code made beforehand still brings the old game back.
- **Locked area**: the top rows start sealed under cobwebs. Merging next to a sealed cell opens it, and its item
  can then be moved and merged like any other.
- **Coins / Mana items**: tap one twice (or press Collect) to cash it in. Other items can be sold for coins.

To package the game as one self-contained HTML page (for sharing), run `node scripts/artifact.mjs`. The output is `dist-artifact/arcane-merge.html`.

Console helpers: `arcane.reset()`, `arcane.energy(100)`.

## Play online

Every push to `main` deploys to GitHub Pages: https://tpint.github.io/magic_m/
(one-time setup: repo **Settings → Pages → Source: GitHub Actions**).

## Versions

The game shows its version in the corner of the info bar and on the Profile screen, e.g. `v0.9.0 · e9973fd`
(the `package.json` version and the git commit it was built from). Each deploy also publishes `version.json`;
the game checks it every few minutes and shows a "New version available" banner when a newer release is live.
Bump `version` in `package.json` for each release.

## Code layout

| Path | What |
| --- | --- |
| `src/game/config.ts` | Data: merge chains, generators, monsters, tuning numbers |
| `src/game/state.ts` | Pure game logic (merge, spawn, energy, monsters, save). No DOM. |
| `src/render/art.ts` | Procedural SVG art. Each chain keeps one colour palette, and the silhouette changes at every level |
| `src/render/scene.ts` | Blurred wizard's-study backdrop and the cobweb on sealed tiles |
| `src/game/story.ts` | Tower chapters, restoration tasks and story text |
| `src/render/room.ts` | The tower room scene with a broken and a fixed layer per task |
| `scripts/promo.mjs` | Renders the promo video in `media/` (`node scripts/promo.mjs <url> <out.mp4>` with the dev server running) |
| `build-info.ts` | Version/commit/date baked into each build, and the `version.json` it publishes |
| `src/online.ts` | Online features: leaderboard, cloud save and recovery codes (Supabase database functions `arcane_*`) |
| `src/render/circle.ts` | Arcane casting circle shown while a spell charges |
| `src/render/spells.ts` | Element attacks, a different form at each level |
| `src/render/fx.ts` | Canvas particles (merge bursts, rings, sparkle trails) |
| `src/render/sfx.ts` | Sound effects synthesised with WebAudio (no audio files) |
| `src/main.ts` | UI: board, drag and drop, HUD, monster cards, info bar |

## Art direction

Straight top-down grid with soft 2D art, following the four merge-art rules:
1. **Silhouette progression**: e.g. bubbles → seashell → splash → tide orb → fountain → trident → great wave.
2. **Strict colour coding**: Earth = brown, Water = blue, Wind = mint/white, Fire = orange/red, Gold = yellow, Mana = pink.
3. **Low-contrast board**: cream tiles with very little contrast. The dark backdrop sits outside the board.
4. **Sound**: all sounds are synthesised live with WebAudio (`src/render/sfx.ts`): each element has its own swoop while a
   spell flies (roaring fire, rushing water with bubbles, whistling wind, rumbling earth) and every monster has its own
   parting cry, with echo, distortion and bass for the tougher ones. `node scripts/spellvideo.mjs <url> <dir> [level|1-7] [ffmpeg] [elements]` records a video of each element's spell at a level, and
   `node scripts/soundfiles.mjs <url> <dir>` renders the sounds
   to WAV files for listening. In the console, `arcane.sfx.monsterCry('dragon')` plays one.
5. **Juicy VFX**: casting draws an arcane circle under each item while it charges (more rings, runes,
   polygrams and satellite circles at higher levels; a pillar of light at level 7), then merge flash + bounce, particle bursts, shockwave rings, coin showers and sounds. Each element has its own
   spell hit when cast at a monster (fire burst, water splash, wind vortex, earth rocks), and it grows with item level:
   level 4+ adds a fire pillar / geyser / tornado / ground cracks and screen shake, level 5+ a coloured flash, level 7 a finale.
   Every element spell also changes form by level (level 1 is the plain orb):
   - Wind: sphere, twin wisps, wind blade, arrow volley, tornado, wind laser, storm lance.
   - Fire: fireball, fire darts, flame wheel, meteor shower, phoenix, flamethrower, sunfall.
   - Water: bubble, bubble barrage, ice star, ice spears, water serpent, hydro jet, tidal wave.
   - Earth: pebble, twin rocks, boulder, stone spikes, golem fist, crystal spire, meteor.
   `node scripts/spellvideo.mjs <url> <dir> 1-7 '' fire,water,wind,earth` records all of them.

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
