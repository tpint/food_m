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
  reward: { coins: number; gems: number; unsealBoard?: boolean; upgradeGens?: boolean };
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
];

/** Shown once every chapter written so far is done. */
export const COMING_SOON = 'Chapter 3: The Observatory is coming soon. Until then, keep defeating monsters and upgrading your grimoires!';
