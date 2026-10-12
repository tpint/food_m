import type { ChainId } from './config';

// Tower restoration: chapters, tasks and the story told by Professor Hoot.
// Each chapter is one room of the Archmage's tower. Tasks are done in order
// and paid for with Stars, which monsters drop.

export interface TaskDef {
  id: string;
  name: string;
  cost: number;
  /** Shown by Professor Hoot right after the task is done. */
  story: string;
}

export interface ChapterDef {
  id: string;
  name: string;
  intro: string[];
  tasks: TaskDef[];
  outro: string[];
  /** Plain-language list of what finishing the chapter gives. */
  rewardText: string;
  reward: {
    coins: number;
    gems: number;
    unsealBoard?: boolean;
    upgradeGens?: boolean;
    /** Items placed on free board cells. */
    items?: { chain: ChainId; level: number; count: number }[];
    /** Extra Stars every monster drops from now on. */
    starBonus?: number;
  };
}

export const MENTOR = 'Professor Hoot';

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'library',
    name: 'The Dusty Library',
    intro: [
      'Hoo! You came back, apprentice! I was beginning to think the whole tower had been forgotten.',
      'The night the Shadow Hex struck, Archmage Elowen vanished and the four elemental seals shattered. Monsters have been creeping in ever since.',
      'Defeat them with elemental magic and they leave Stars behind. Spend those Stars to bring this tower back to life. We start with the library.',
    ],
    tasks: [
      { id: 'cobwebs', name: 'Sweep away the cobwebs', cost: 1, story: 'Much better! I could hardly see my own feathers under all that dust.' },
      { id: 'candles', name: 'Light the reading candles', cost: 2, story: 'Ah, candlelight. Elowen read here every night. Her notes must still be somewhere on these shelves.' },
      { id: 'shelf', name: 'Mend the great bookshelf', cost: 2, story: 'Look at this, a page from her journal. "The Hex feeds on silence. Keep the tower singing." Curious...' },
      { id: 'window', name: 'Restore the moon window', cost: 3, story: 'Moonlight! The window was enchanted to show the sky above the seals. One of them still glimmers, far to the east.' },
      { id: 'hearth', name: 'Rekindle the hearth', cost: 3, story: 'Warmth at last. The monsters always gather where the tower is cold. That is why they keep coming back.' },
      { id: 'grimoire', name: 'Awaken the Great Grimoire', cost: 4, story: 'The Great Grimoire is awake! It remembers every spell Elowen ever cast, and it is pointing us downstairs.' },
    ],
    outro: [
      'The library breathes again, and the tower feels a little less afraid.',
      'The Grimoire showed me the Alchemy Lab below us. Elowen sealed something there before she vanished. We will need stronger magic for that, so keep merging!',
    ],
    rewardText: '100 coins, 10 gems, and the sealed rows on your board start to clear',
    reward: { coins: 100, gems: 10, unsealBoard: true },
  },
  {
    id: 'lab',
    name: 'The Alchemy Lab',
    intro: [
      'Mind the steps, apprentice. This is where Elowen brewed her greatest elixirs, and where she was working the night the Hex struck.',
      'Everything is smashed. Something came down here looking for... hoo, I do not know what. Whatever it was, Elowen locked it in her vault first.',
      'The monsters down here are hungrier, so you will need more Stars. Let us get this lab bubbling again.',
    ],
    tasks: [
      { id: 'cauldron', name: 'Scrub the great cauldron', cost: 3, story: 'Listen to it bubble! Elowen always said a happy cauldron makes a happy tower.' },
      { id: 'potions', name: 'Restock the potion shelves', cost: 3, story: 'Calming draughts, glow tonics, a bottle labelled "do NOT open"... I will leave that one where it is.' },
      { id: 'alembic', name: 'Repair the brass alembic', cost: 4, story: 'It is distilling again. Wait, it is dripping all four colours at once: earth, water, wind and fire. It is trying to tell us something.' },
      { id: 'charts', name: 'Hang the star charts', cost: 4, story: 'These are maps of the four seals! One is marked right here in the tower, behind the vault door.' },
      { id: 'crystals', name: 'Calm the floating crystals', cost: 5, story: 'The crystals are humming in tune. Hear that? The vault lock hums the same note.' },
      { id: 'vault', name: "Open Elowen's sealed vault", cost: 6, story: 'Hoo... a shard of the Earth Seal! She hid it so the Hex could never take all four. The tower trembles, the good kind of tremble.' },
    ],
    outro: [
      'With the shard back in the light, your grimoires feel it too. Their pages are glowing brighter than ever.',
      'The star charts show the next seal high above us, in the Observatory. The stairs up there have not been climbed in years...',
    ],
    rewardText: '200 coins, 15 gems, and every grimoire gains a level',
    reward: { coins: 200, gems: 15, upgradeGens: true },
  },
  {
    id: 'observatory',
    name: 'The Observatory',
    intro: [
      'Up, up, up! Mind the loose steps. Elowen came here every night to read the winds.',
      'The roof caved in when the Hex struck. Since then the winds around the tower have gone wild, and the Wind Seal is somewhere in this mess.',
      'The monsters up here ride the storms, so they are tougher. We will need plenty of Stars.',
    ],
    tasks: [
      { id: 'beams', name: 'Clear the fallen roof beams', cost: 4, story: 'Oof. Beams cleared. Look at the floor: a star map is painted under all that rubble!' },
      { id: 'telescope', name: 'Raise the great telescope', cost: 4, story: 'Still in one piece! Elowen used it to watch the seals from afar. The lens is cloudy, but it points due north... toward the storm.' },
      { id: 'orrery', name: 'Restart the orrery', cost: 5, story: 'Tick, tick, whirr. The little planets turn again. When they line up, the Wind Seal is said to sing.' },
      { id: 'dome', name: 'Open the star dome', cost: 5, story: 'The night sky! I had almost forgotten how many stars there are. The winds are calming already.' },
      { id: 'chimes', name: 'Tune the wind chimes', cost: 6, story: 'Hear that? Each chime matches a planet. The orrery and the chimes are playing the same song.' },
      { id: 'windseal', name: 'Free the Wind Seal', cost: 7, story: 'The Wind Seal! It was caught in the dome all along, spinning too fast for anyone to see. Two seals home, two to go.' },
    ],
    outro: [
      'The skies are clear and the tower stands a little taller. I swear I can see all the way to the sea.',
      'The Wind Seal whispered something: "beneath the moonflowers". That must be the greenhouse in the east wing.',
    ],
    rewardText: '300 coins, 20 gems, and two Mana Flasks appear on your board',
    reward: { coins: 300, gems: 20, items: [{ chain: 'mana', level: 3, count: 2 }] },
  },
  {
    id: 'greenhouse',
    name: 'The Moonlit Greenhouse',
    intro: [
      'The east wing greenhouse. Elowen grew moonflowers here, flowers that only bloom when the tower is safe.',
      'The glass is shattered and the pond has run dry. Without water the Water Seal cannot rest, and without the seal there is no water. A sad little circle.',
      'Let us break it. The monsters here are slippery, but every one you beat brings us closer.',
    ],
    tasks: [
      { id: 'glass', name: 'Sweep up the shattered glass', cost: 5, story: 'Careful of your paws... I mean feet. All swept! The moon can shine in properly now.' },
      { id: 'rain', name: 'Repair the rain pipes', cost: 5, story: 'Drip, drip, splash! The pipes still carry rainwater from the roof. Listen to that lovely patter.' },
      { id: 'flowers', name: 'Replant the moonflower beds', cost: 6, story: 'They are opening! Moonflowers only bloom when the tower feels safe. That means it trusts us now.' },
      { id: 'lanterns', name: 'Rehang the firefly lanterns', cost: 6, story: 'The fireflies came back the moment the lanterns were up. Elowen used to read their glow like a map.' },
      { id: 'pond', name: 'Refill the koi pond', cost: 7, story: 'The koi! They were sleeping in the mud the whole time. Something is glowing under the water...' },
      { id: 'waterseal', name: 'Raise the Water Seal', cost: 8, story: 'The Water Seal rises! The koi guarded it all this time. Three seals home. Only Fire remains, and the Hex knows it.' },
    ],
    outro: [
      'The greenhouse is singing with water and light. With three seals glowing, the monsters are weaker, and you will find more Stars on every one you defeat.',
      'The last seal is in the Archmage\'s Sanctum at the very top of the tower. That is where Elowen was when the Hex struck. Be brave, apprentice.',
    ],
    rewardText: '400 coins, 25 gems, and every monster drops 1 extra Star from now on',
    reward: { coins: 400, gems: 25, starBonus: 1 },
  },
  {
    id: 'sanctum',
    name: "The Archmage's Sanctum",
    intro: [
      'This is it, the Sanctum. Shadow vines everywhere, and a cold that no fire should allow. The Hex lives here now.',
      'Look, in the great mirror. Is that... Elowen? She is trapped inside! The Hex sealed her in her own looking-glass.',
      'Restore the Sanctum, rekindle the Fire Seal, and we can break that mirror. The monsters will fight hardest here. I believe in you.',
    ],
    tasks: [
      { id: 'vines', name: 'Burn away the shadow vines', cost: 6, story: 'The vines are shrinking back! They hate the light. The room feels warmer already.' },
      { id: 'braziers', name: 'Relight the twin braziers', cost: 6, story: 'Twin flames for the twin guardians of the Sanctum. The shadows are hiding in the corners now.' },
      { id: 'desk', name: "Restore Elowen's desk", cost: 7, story: 'Her last note: "If the mirror takes me, the four seals together can break it." She planned for this!' },
      { id: 'runes', name: 'Redraw the rune circle', cost: 7, story: 'The circle glows gold. Earth, water and wind seals are already in their places. Only the fire point is empty.' },
      { id: 'fireseal', name: 'Rekindle the Fire Seal', cost: 8, story: 'The Fire Seal blazes! All four seals shine together, and look at the mirror: it is cracking!' },
      { id: 'mirror', name: 'Shatter the Shadow Mirror', cost: 10, story: 'ELOWEN! She is free! "Thank you, apprentice. And you, Hoot, you dear old feather-duster."' },
    ],
    outro: [
      'Elowen: "The Hex is broken, but not destroyed. It fled into the Shadow Wood below the tower. It will be back."',
      'Elowen: "Until then, my tower is yours to tend. Your grimoires have earned a power I can finally share."',
    ],
    rewardText: '600 coins, 40 gems, and every grimoire gains another level',
    reward: { coins: 600, gems: 40, upgradeGens: true },
  },
];

/** Shown once every chapter written so far is done. */
export const COMING_SOON = 'Chapter 6: The Shadow Wood is coming soon. Until then, keep defeating monsters and climbing the leaderboard!';
