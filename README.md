# Sunny Spoon

A merge-3 cooking game in the style of Love & Pies / Merge Mansion: merge ingredients
into food, drinks and desserts, serve each customer their order, and use the Stars
they leave to restore Grandma Rosa's old restaurant.

Forked from [magic_m](https://github.com/tpint/magic_m) (Arcane Merge): same game
loop, with the magic theme (brew spells, fight monsters) swapped for cooking
(cook dishes, serve customers).

Web proof of concept. Built with TypeScript + Vite, with no game engine, so the same
code can be wrapped for iOS and Android with Capacitor.

🎮 Play it in your browser: https://tpint.github.io/food_m/

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (art gallery: /gallery.html)
npm test           # game-logic unit tests
npm run build      # production build in dist/
node scripts/play.mjs http://localhost:5173/ shots   # scripted playtest with screenshots
```

## How to play

- **Food**: Bakery, Drinks, Desserts and Grill. Each has a 7-level merge chain and its own kitchen station:
  - Bakery (Bread Oven): wheat → flour sack → dough → bread roll → croissant → baguette → bread basket.
  - Drinks (Drink Fountain): water → lemonade → coffee → hot cocoa → milkshake → bubble tea → party punch.
  - Desserts (Dessert Mixer): candy → cookie → cupcake → donut → sundae → strawberry cake → wedding cake.
  - Grill (BBQ Grill): egg → fried egg → sausage → kebab → burger → pizza → roast chicken.
- **Kitchen stations**: tap one to select it (free; shows its info and Upgrade button), then tap it again to cook an
  ingredient. Each one costs 1 ⚡ energy. Energy refills over time (+1 every 20 s, up to 100).
- **Upgrade stations**: select a station and press **Upgrade** (costs coins, needs a minimum player level).
  Each level (up to 10) raises the odds of higher-level drops and adds a chance of cooking for free; from level 6 a
  station can drop level 5 items. Tuning lives in `GEN_LEVELS`. Each level also dresses the station up: gold trim,
  a serving plate and gems, a star badge, golden rays, an orbit of tasty motes, floating hearts, a crown,
  gilded wings, and a starry sky at level 10.
- **Merge**: put three identical items side by side (drag one onto or next to the other two) to make one of the next level.
  Five touching items make two. Two alone won't merge. Items you can merge with glow blue while you drag.
- **Customers**: each customer's order is shown in front of them. Items you have on the board get a ✓ and sit on a
  green tile. When the whole order is ready, a round Serve button (a serving cloche) pops up at the customer's
  top right: press it and a plate draws itself under each dish, the dish flies over, the customer takes a happy bite and pays coins, XP and Stars. Badges stacked down the customer's left edge show the XP, coins
  and stars they give; tap them for their name and full order. Every 6th customer is **Sir Walrus, the food critic**,
  with a bigger order and bigger rewards. Six customers wait at once: three fit across the screen and you swipe the
  row sideways for the rest. Benny Bunny, Mittens, Bruno Bear, Felix Fox and Woolly Sheep come from the start, and more
  arrive as you level up: Dash Deer and Sammy Squirrel (4), Bao Panda (5), Rex Wolf (6), Rocco Raccoon (8) and Tora Tiger (10).
- **Details**: select an item or station, then tap the blue "i" on its picture in the info box (or the picture
  itself). The panel shows every level of the item's merge chain and the station that makes it, or every level of
  the station and what it makes at each level, with the odds. Tap a level to read about it, and tap a station or
  item to jump to its own panel.
- **Fridge**: drag any item or station onto the fridge (bottom left) to store it and free up the board. Tap the fridge
  to see what is inside, and tap a stored piece to put it back on the nearest free tile. The fridge starts with 5 slots;
  more cost gems (10, then 5 more each time, up to 15 slots).
- **Menu**: the ☰ button at the top right opens Daily quests, the Leaderboard and the Restaurant. It shows a red "!"
  when a quest reward or a restoration is ready.
- **Daily quests**: three quests a day, picked from: serve customers, merge, cook, and merge an item up to a given
  level. Claim each for coins and gems; claiming all three opens a chest (+10 gems, +50 energy). New quests arrive at
  local midnight. Tuning lives in `makeQuest` / `DAILY_BONUS` in `src/game/state.ts`.
- **Restaurant restoration**: open **Restaurant** from the menu and spend Stars on restoration tasks, in order. Each task
  visibly fixes up the room and Chef Pip, the kitchen mouse, tells a bit more of the story of Grandma Rosa's
  four lost recipe cards. Five chapters, one room each:
  1. *The Dusty Dining Room*: a Tip Jar and a Lunch Box appear on the board.
  2. *The Old Kitchen* (Rosa's bread recipe): every station gains a level.
  3. *The Sunny Patio* (Rosa's lemonade recipe): two Picnic Baskets appear on the board.
  4. *The Ice Cream Parlor* (Rosa's cake recipe): every customer gives 1 extra Star from then on.
  5. *The Rooftop Terrace* (Rosa's roast recipe, and the Grand Reopening): every station gains another level.
  Each also pays coins and gems. The blurred backdrop behind the board is the room you are restoring.
  Chapters live in `src/game/story.ts`; each room is drawn in `src/render/room.ts`, each backdrop in `src/render/scene.ts`.
- **Leaderboard**: top 50 by customers served, this week (resets Monday 00:00 UTC) or all time, or by player level.
- **Cloud save & recovery code**: progress uploads automatically, and the profile screen (tap the level star) makes
  a recovery code to restore your progress, name and scores.
- **Coins / Energy items**: tap one twice (or press Collect) to cash it in. Other items can be sold for coins.

Console helpers: `kitchen.reset()`, `kitchen.energy(100)`, `kitchen.sfx.customerCheer('critic')`.

## Online features (Supabase)

The leaderboard, cloud save and recovery codes run on the Supabase project **food_m**. `src/online.ts` calls a
handful of database functions (`register`, `submit_score`, `leaderboard`, `cloud_save`, `cloud_load`,
`new_code`, `recover`) through Supabase's REST API with the project's publishable key. The tables have row
level security on and no direct access from the browser, so those functions are the only way in. A player is
a random token kept on the device (stored only as a hash on the server), and score reports can only add a
few customers at a time, so a tampered client can't post a huge score. The schema lives in
`supabase/migrations/`.

For offline work, open the game with `?mock=1` to use the old mock backend that lives in this browser's
localStorage, seeded with a few rival chefs.

## Code layout

| Path | What |
| --- | --- |
| `src/game/config.ts` | Data: merge chains, kitchen stations, customers, tuning numbers |
| `src/game/state.ts` | Pure game logic (merge, cook, energy, customers, quests, fridge, save). No DOM. |
| `src/game/story.ts` | Restaurant chapters, restoration tasks and story text |
| `src/render/art.ts` | Procedural SVG art. Each chain keeps one colour palette, and the silhouette changes at every level |
| `src/render/serve.ts` | Serving: the plate that draws itself under a dish, and the dish flying to the customer |
| `src/render/fx.ts` | Canvas particles (merge bursts, steam, bubbles, sprinkles, sparks, hearts) |
| `src/render/sfx.ts` | Sound effects synthesised with WebAudio (no audio files) |
| `src/render/scene.ts` | Blurred backdrop behind the board, one scene per chapter |
| `src/render/room.ts` | The restaurant room scene with a broken and a fixed layer per task |
| `src/online.ts` | Leaderboard, cloud save and recovery codes (Supabase, with a local mock for `?mock=1`) |
| `supabase/migrations/` | Database schema and functions behind the online features |
| `src/main.ts` | UI: board, drag and drop, HUD, customer cards, info bar, panels |
| `build-info.ts` | Version/commit/date baked into each build, and the `version.json` it publishes |

## Art direction

Straight top-down grid with soft 2D sticker-style art:
1. **Silhouette progression**: e.g. water → lemonade → coffee → hot cocoa → milkshake → bubble tea → party punch.
2. **Strict colour coding**: Bakery = golden brown, Drinks = blue, Desserts = pink, Grill = orange/red,
   Coins = yellow, Energy = purple.
3. **Bright, warm board**: a checked-tablecloth board in a tomato-red frame; tiles holding an item a customer
   ordered turn green.
4. **Sound**: all synthesised live (`src/render/sfx.ts`): a sizzle and rising pings while a dish is plated, a crunch,
   slurp, sparkle or sizzle when a customer tastes it (by food), a happy sound for every customer (squeaks, meows,
   oinks, ribbits, a woof, and a pompous "hm-HMM!" fanfare from the critic) and a cash-register ka-ching.
5. **Juicy VFX**: plating draws a plate under each dish (rim pattern, ring of hearts, sparkles, golden rays and, at
   level 7, a spotlight), then steam, bubbles, sprinkles or sparks trail the dish to the customer, who bursts into
   hearts. Level 4+ adds confetti, level 5+ a coloured flash, level 7 a star nova.

To swap any drawing for painted art, see `public/art/README.md`.

## Play online

Every push to `main` deploys to GitHub Pages (one-time setup: repo **Settings → Pages → Source: GitHub Actions**).

## Versions

The game shows its version in the corner of the info bar and on the Profile screen, e.g. `v0.1.0 · e9973fd`
(the `package.json` version and the git commit it was built from). Each deploy also publishes `version.json`;
the game checks it every few minutes and shows a "New version available" banner when a newer release is live.

## iOS / Android (next step)

Capacitor is already configured (`capacitor.config.json`).

```bash
npm run cap:android   # needs Android Studio
npm run cap:ios       # needs macOS + Xcode
npm run cap:sync      # rebuild web + copy into native projects
```
