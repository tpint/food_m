import type { ChainId } from './config';

// Restaurant restoration: chapters, tasks and the story told by Chef Pip.
// Each chapter is one room of Grandma Rosa's old restaurant. Tasks are done in
// order and paid for with Stars, which happy customers give.

export interface TaskDef {
  id: string;
  name: string;
  cost: number;
  /** Shown by Chef Pip right after the task is done. */
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
    upgradeGens?: boolean;
    /** Items placed on free board cells. */
    items?: { chain: ChainId; level: number; count: number }[];
    /** Extra Stars every customer gives from now on. */
    starBonus?: number;
  };
}

export const MENTOR = 'Chef Pip';

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'dining',
    name: 'The Dusty Dining Room',
    intro: [
      'Squeak! You must be Rosa\'s grandchild! I\'m Pip. I have looked after this kitchen ever since your grandma went off on her world tasting tour.',
      'The Sunny Spoon used to be the busiest restaurant in town. Then the doors closed, the dust moved in, and Grandma\'s four secret recipe cards went missing.',
      'Customers are already peeking through the window! Cook what they order and they will leave Stars for good service. Spend those Stars to fix the place up. Let\'s start with the dining room.',
    ],
    tasks: [
      { id: 'dust', name: 'Dust off the tables', cost: 1, story: 'Achoo! Much better. I could hardly see my own whiskers under all that dust.' },
      { id: 'cloths', name: 'Lay fresh tablecloths', cost: 2, story: 'Red and white checks, just like Rosa liked them. She always said a happy table makes a happy tummy.' },
      { id: 'lamps', name: 'Hang the pendant lamps', cost: 2, story: 'Oh, look at that warm glow! I found a note tucked in a lampshade: "The first card is where the bread is born." Curious...' },
      { id: 'window', name: 'Wash the big front window', cost: 3, story: 'Sunshine! And more customers waving at us from the street. Word is getting around.' },
      { id: 'flowers', name: 'Put flowers on every table', cost: 3, story: 'Daisies in little jam jars. Rosa grew these in the patio garden, so the garden must still be out there somewhere.' },
      { id: 'sign', name: 'Relight the Sunny Spoon sign', cost: 4, story: 'The sign is shining again! Everyone in town can see we are open. Now, about that note: bread is born in the kitchen!' },
    ],
    outro: [
      'The dining room looks lovely, and the customers keep coming back for more.',
      'The kitchen is through those swinging doors. It has not been cooked in for years, but the first recipe card must be hiding in there. Keep cooking!',
    ],
    rewardText: '100 coins, 10 gems, a Tip Jar and a Lunch Box',
    reward: { coins: 100, gems: 10, items: [{ chain: 'coin', level: 3, count: 1 }, { chain: 'energy', level: 2, count: 1 }] },
  },
  {
    id: 'kitchen',
    name: 'The Old Kitchen',
    intro: [
      'Mind the slippery tiles! This is where Rosa cooked every single day for forty years.',
      'Pots everywhere, a cold oven, and the pantry door is stuck. Hmm, the pantry... Rosa never let anyone in there.',
      'Orders are getting bigger, so you will need more Stars. Let\'s get this kitchen sizzling again!',
    ],
    tasks: [
      { id: 'pots', name: 'Scrub the pots and pans', cost: 3, story: 'Sparkling! I can see my reflection in the big soup pot. Hello, handsome.' },
      { id: 'tiles', name: 'Mop the checkered floor', cost: 3, story: 'No more sticky paws. Er, feet. You know what I mean.' },
      { id: 'herbs', name: 'Hang the herb bundles', cost: 4, story: 'Basil, thyme and rosemary. The whole kitchen smells like Rosa\'s Sunday lunch.' },
      { id: 'stove', name: 'Fix the old iron stove', cost: 4, story: 'It roars! Four burners, all working. Rosa named them Huey, Dewey, Louie and Bob.' },
      { id: 'oven', name: 'Fire up the brick oven', cost: 5, story: 'The brick oven is warm! Wait... I hear something rattling behind the pantry door.' },
      { id: 'pantry', name: 'Open the secret pantry', cost: 6, story: 'Squeak! The first recipe card: "Rosa\'s Golden Bread". She hid it in the flour tin! Three more to find.' },
    ],
    outro: [
      'With Rosa\'s bread recipe back in the kitchen, every station in your kitchen feels it too. Everything cooks a little better!',
      'The card has a doodle on the back: a sun, an umbrella and a lemon. That must be the patio out back!',
    ],
    rewardText: '200 coins, 15 gems, and every kitchen station gains a level',
    reward: { coins: 200, gems: 15, upgradeGens: true },
  },
  {
    id: 'patio',
    name: 'The Sunny Patio',
    intro: [
      'Out we go, into the sunshine! On summer evenings this patio used to be full of laughter and clinking glasses.',
      'Now the umbrellas are torn, the lemon tree is thirsty and the lemonade stand is falling over. The second card must be out here.',
      'Patio customers are thirsty and picky, so we will need plenty of Stars.',
    ],
    tasks: [
      { id: 'weeds', name: 'Pull up the weeds', cost: 4, story: 'Weeds gone! And look, a path of painted tiles leads straight to the lemon tree.' },
      { id: 'umbrellas', name: 'Open the striped umbrellas', cost: 4, story: 'Shade! The customers love it. One of them asked if we serve lemonade. Not yet...' },
      { id: 'lights', name: 'String up the fairy lights', cost: 5, story: 'Twinkle twinkle! Rosa used to hold dances out here under these lights.' },
      { id: 'tree', name: 'Water the lemon tree', cost: 5, story: 'Lemons! Big, sunny, sour lemons. Now we just need somewhere to squeeze them.' },
      { id: 'stand', name: 'Rebuild the lemonade stand', cost: 6, story: 'Freshly painted and ready to pour. There is a little drawer under the counter that will not open.' },
      { id: 'drinkcard', name: 'Find the second recipe card', cost: 7, story: 'Got it! "Rosa\'s Sunshine Lemonade", taped under the drawer. Two cards home, two to go!' },
    ],
    outro: [
      'The patio is buzzing, and the lemonade is the talk of the town.',
      'The lemonade card has a sticky pink smudge on it. Strawberry? That smells like the ice cream parlor next door!',
    ],
    rewardText: '300 coins, 20 gems, and two Picnic Baskets appear on your board',
    reward: { coins: 300, gems: 20, items: [{ chain: 'energy', level: 3, count: 2 }] },
  },
  {
    id: 'parlor',
    name: 'The Ice Cream Parlor',
    intro: [
      'Rosa\'s little ice cream parlor! Kids used to line up around the block for a scoop.',
      'The freezer is warm, the glass counter is cracked and the jukebox has gone quiet. Without dessert, a meal is just... dinner.',
      'Dessert lovers are the happiest customers of all. Every one you serve brings us closer to the third card.',
    ],
    tasks: [
      { id: 'counter', name: 'Fix the glass counter', cost: 5, story: 'Shiny and new! Now we need something sweet to put in it.' },
      { id: 'freezer', name: 'Defrost the big freezer', cost: 5, story: 'Brrr! Cold and humming again. I may have eaten a forgotten tub of vanilla. For science.' },
      { id: 'stools', name: 'Polish the spinning stools', cost: 6, story: 'Wheee! I spun around six times. The customers spin even faster.' },
      { id: 'jukebox', name: 'Repair the jukebox', cost: 6, story: 'Music! Rosa\'s favorite song is still loaded on track seven. Everyone is dancing.' },
      { id: 'cones', name: 'Stack the waffle cones', cost: 7, story: 'A tower of crunchy cones. Wait, there is a card rolled up inside the bottom one!' },
      { id: 'sweetcard', name: 'Unroll the third recipe card', cost: 8, story: '"Rosa\'s Strawberry Dream Cake"! Three cards home. Only one left, and it is the most famous of all.' },
    ],
    outro: [
      'The parlor is full of giggles and brain freezes. Customers are so happy they leave an extra Star every time!',
      'The last card is Rosa\'s legendary grill recipe. She cooked it on the rooftop terrace for the grand opening, fifty years ago...',
    ],
    rewardText: '400 coins, 25 gems, and every customer gives 1 extra Star from now on',
    reward: { coins: 400, gems: 25, starBonus: 1 },
  },
  {
    id: 'rooftop',
    name: 'The Rooftop Terrace',
    intro: [
      'All the way to the top! The rooftop terrace has the best view in town. It\'s where Rosa threw her famous parties.',
      'Today it is a jungle of old crates and a rusty grill. But I just got a postcard: Rosa is coming home for a Grand Reopening!',
      'Let\'s make the rooftop shine before she arrives. The fanciest customers dine up here, so give it everything you\'ve got!',
    ],
    tasks: [
      { id: 'crates', name: 'Clear away the old crates', cost: 6, story: 'Crates gone! There is room for a long party table now.' },
      { id: 'grill', name: 'Restore the big grill', cost: 6, story: 'The grill is hot! The smell is drifting all over town. People on the street are looking up and sniffing.' },
      { id: 'table', name: 'Set the long party table', cost: 7, story: 'Plates, glasses, napkins folded like swans. Rosa will be so proud of you.' },
      { id: 'lanterns', name: 'Hang the paper lanterns', cost: 7, story: 'Pink, yellow and blue lanterns, swaying in the breeze. It looks like a festival!' },
      { id: 'grillcard', name: 'Find the fourth recipe card', cost: 8, story: 'Under the grill\'s warming rack: "Rosa\'s Sunday Roast"! All four cards are home at last!' },
      { id: 'reopening', name: 'Throw the Grand Reopening!', cost: 10, story: 'GRANDMA ROSA! She\'s here! "Oh, sweetheart, look at my Sunny Spoon. And Pip, you dear old crumb-snatcher!"' },
    ],
    outro: [
      'Rosa: "You found all four cards and brought my restaurant back to life. I could not have done it better myself."',
      'Rosa: "The Sunny Spoon is yours now. And I have one last secret for you: those four recipes make every station cook better!"',
    ],
    rewardText: '600 coins, 40 gems, and every kitchen station gains another level',
    reward: { coins: 600, gems: 40, upgradeGens: true },
  },
];

/** Shown once every chapter written so far is done. */
export const COMING_SOON = 'Chapter 6: The Food Truck is coming soon. Until then, keep serving customers and climbing the leaderboard!';
