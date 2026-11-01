// events.js — Life events, shown as a "!" bubble over the character. Pure
// data: adding an event means adding an entry here, nothing else.
//
// Each event has:
//   id        Unique and saved; don't rename one once it has shipped.
//   stages    Life stages it can happen in (ids from data/lifeStages.js).
//   minAge, maxAge   Optional extra limits, in whole years.
//   prompt    What's happening. {name} becomes the character's name.
//   choices   2-3 options. Each has:
//     label     Button text.
//     lean      Traits (data/traits.js) that favor this choice when the
//               character decides alone.
//     goals     Optional goals (data/goals.js) this choice serves. When
//               deciding alone, the active goal outweighs traits, and
//               events with a choice for the active goal come up more.
//     needs     Optional minimum stats to pick it, e.g. { money: 50 }.
//               At least one choice per event must have no needs.
//     effects + text   The outcome: stat changes (data/stats.js ids) and
//               a short line saying what happened.
//     outcomes  Instead of effects + text, possible outcomes picked at
//               random: [{ weight, effects, text }]. weight defaults to 1,
//               so two outcomes are a coin flip.
//
// Fit the 320x240 window: prompts up to ~100 characters, labels up to ~28,
// texts up to ~30. Avoid pronouns for the character; use {name} instead.

export const EVENTS = [
  // ---- Child (4-12) ----
  {
    id: 'puppy',
    stages: ['child'],
    prompt: 'A scruffy puppy has followed {name} all the way home from the park.',
    choices: [
      { label: 'Adopt the puppy', lean: ['social', 'bold'], goals: ['heart'],
        effects: { happiness: 15, health: 3 }, text: 'Adopted the puppy!' },
      { label: 'Find its owner', lean: ['careful', 'curious'], goals: ['fortune'],
        effects: { happiness: 5, money: 5 }, text: 'Found the owner. Got $5!' },
      { label: 'Wave goodbye', lean: ['shy', 'lazy'],
        effects: { happiness: -5 }, text: 'Waved bye. Sniff.' },
    ],
  },
  {
    id: 'big-tree',
    stages: ['child'],
    prompt: 'The big tree out front looks extremely climbable today.',
    choices: [
      { label: 'Climb to the very top', lean: ['bold'], goals: ['healthy'],
        outcomes: [
          { effects: { happiness: 12 }, text: 'Top of the tree! Great view.' },
          { effects: { health: -10, happiness: -3 }, text: 'Fell out of the tree. Ow.' },
        ] },
      { label: 'Just the lowest branch', lean: ['careful'], goals: ['healthy'],
        effects: { happiness: 5, health: 2 }, text: 'One branch. Still counts.' },
      { label: 'Read in its shade', lean: ['curious', 'lazy'], goals: ['scholar'],
        effects: { smarts: 6 }, text: 'Read a whole book outside.' },
    ],
  },
  {
    id: 'lemonade',
    stages: ['child'],
    minAge: 6,
    prompt: '{name} wants to run a lemonade stand this weekend.',
    choices: [
      { label: 'Go big: add cookies!', lean: ['bold', 'social'], goals: ['fortune'],
        outcomes: [
          { effects: { money: 25, happiness: 8 }, text: 'Sold out! Cookie tycoon.' },
          { effects: { happiness: -4, health: -2 }, text: 'Ate all the cookies. Oops.' },
        ] },
      { label: 'Keep it simple', lean: ['careful'], goals: ['fortune'],
        effects: { money: 8, happiness: 3 }, text: 'Made $8 in lemonade.' },
      { label: 'Too much work', lean: ['lazy', 'shy'],
        effects: { happiness: 4 }, text: 'Napped instead. Cozy.' },
    ],
  },
  {
    id: 'school-play',
    stages: ['child'],
    prompt: 'The school play needs a lead, a cloud, and someone to paint the sets.',
    choices: [
      { label: 'Audition for the lead', lean: ['bold', 'social'], goals: ['heart'],
        outcomes: [
          { effects: { happiness: 15 }, text: 'Got the lead role! Bravo!' },
          { effects: { happiness: -4 }, text: 'Cast as Tree #3. Proud.' },
        ] },
      { label: 'Be the cloud', lean: ['shy', 'lazy'],
        effects: { happiness: 6 }, text: 'Drifted across the stage.' },
      { label: 'Paint the sets', lean: ['curious', 'careful'], goals: ['scholar'],
        effects: { smarts: 5, happiness: 4 }, text: 'Painted a lovely sunset.' },
    ],
  },
  {
    id: 'science-fair',
    stages: ['child'],
    minAge: 8,
    prompt: 'Science fair week! {name} needs a project by Friday.',
    choices: [
      { label: 'Baking soda volcano', lean: ['bold'], goals: ['scholar'],
        effects: { happiness: 8, smarts: 4 }, text: 'The volcano erupted on cue!' },
      { label: 'Grow beans in the dark', lean: ['curious', 'careful'], goals: ['scholar'],
        effects: { smarts: 10 }, text: 'Sad beans. Great science.' },
      { label: "Borrow a friend's idea", lean: ['lazy', 'social'],
        outcomes: [
          { effects: { happiness: 3 }, text: 'Got a ribbon. Felt weird.' },
          { effects: { happiness: -8 }, text: 'Caught copying. Awkward.' },
        ] },
    ],
  },

  // ---- Teen (13-17) ----
  {
    id: 'cafe-job',
    stages: ['teen'],
    prompt: 'The cafe down the road is hiring weekend help. Free muffins, apparently.',
    choices: [
      { label: 'Apply for the job', lean: ['bold', 'social'], goals: ['fortune'],
        effects: { money: 40, health: -3, happiness: 3 }, text: 'Hired! Latte art: wobbly.' },
      { label: 'Study instead', lean: ['careful', 'curious'], goals: ['scholar'],
        effects: { smarts: 10 }, text: 'Hit the books instead.' },
      { label: 'Sleep in', lean: ['lazy', 'shy'], goals: ['healthy'],
        effects: { happiness: 6, health: 2 }, text: 'Slept till noon. No regrets.' },
    ],
  },
  {
    id: 'big-party',
    stages: ['teen'],
    prompt: "There's a big party on Saturday and everyone is going. Allegedly.",
    choices: [
      { label: 'Dance all night', lean: ['social', 'bold'], goals: ['heart'],
        outcomes: [
          { effects: { happiness: 14, health: -2 }, text: 'Danced till sunrise!' },
          { effects: { happiness: -4, health: -5 }, text: 'Tripped into the snacks.' },
        ] },
      { label: 'Go for one hour', lean: ['careful'],
        effects: { happiness: 6 }, text: 'One hour. Perfect amount.' },
      { label: 'Stay home and game', lean: ['shy', 'lazy'],
        effects: { happiness: 5 }, text: 'Beat the final boss!' },
    ],
  },
  {
    id: 'big-exam',
    stages: ['teen'],
    prompt: 'Big exam tomorrow. The textbook stares at {name}. {name} stares back.',
    choices: [
      { label: 'Study all night', lean: ['careful', 'curious'], goals: ['scholar'],
        effects: { smarts: 12, health: -6 }, text: 'Aced it. Very sleepy.' },
      { label: 'Form a study group', lean: ['social'], goals: ['scholar', 'heart'],
        effects: { smarts: 7, happiness: 4 }, text: 'Study group! Mostly snacks.' },
      { label: 'Wing it', lean: ['bold', 'lazy'],
        outcomes: [
          { effects: { happiness: 8, smarts: 2 }, text: 'Winged it. Somehow passed!' },
          { effects: { happiness: -10 }, text: 'Winged it. Did not fly.' },
        ] },
    ],
  },
  {
    id: 'garage-band',
    stages: ['teen'],
    prompt: 'A garage band needs a drummer. Experience: optional. Volume: mandatory.',
    choices: [
      { label: 'Join the band', lean: ['bold', 'social'], goals: ['heart'],
        effects: { happiness: 12, smarts: 2 }, text: 'Joined the band. LOUD.' },
      { label: 'Learn guitar alone', lean: ['shy', 'curious'], goals: ['scholar'],
        effects: { smarts: 6, happiness: 6 }, text: 'Learned three whole chords.' },
      { label: 'Earplugs, please', lean: ['careful', 'lazy'], goals: ['healthy'],
        effects: { health: 3 }, text: 'Ears: still working.' },
    ],
  },

  // ---- Adult (18-64) ----
  {
    id: 'promotion',
    stages: ['adult'],
    prompt: 'The boss offers {name} a promotion. More pay, more meetings.',
    choices: [
      { label: 'Take it!', lean: ['bold'], goals: ['fortune'],
        effects: { money: 120, happiness: -4, health: -2 }, text: 'Promoted! So many meetings.' },
      { label: 'Ask for just a raise', lean: ['careful', 'shy'], goals: ['fortune'],
        outcomes: [
          { effects: { money: 60, happiness: 4 }, text: 'Got the raise!' },
          { effects: { happiness: -3 }, text: 'Raise denied. Still cozy.' },
        ] },
      { label: 'Keep the cozy desk', lean: ['lazy', 'social'], goals: ['heart'],
        effects: { happiness: 6 }, text: 'Kept the desk by the window.' },
    ],
  },
  {
    id: 'food-truck',
    stages: ['adult'],
    prompt: "A friend pitches a 'can't-lose' taco truck and needs $50 to start.",
    choices: [
      { label: 'Invest $50', lean: ['bold'], goals: ['fortune'], needs: { money: 50 },
        outcomes: [
          { effects: { money: 100, happiness: 8 }, text: 'Taco truck hit! Rich-ish.' },
          { effects: { money: -50, happiness: -6 }, text: 'The truck... rolled away.' },
        ] },
      { label: 'Politely decline', lean: ['careful', 'shy'],
        effects: { smarts: 2 }, text: 'Declined. Wallet relieved.' },
      { label: 'Help on weekends', lean: ['social', 'curious'], goals: ['heart', 'fortune'],
        effects: { money: 15, happiness: 8, health: -2 }, text: 'Flipped tortillas. Fun!' },
    ],
  },
  {
    id: 'fun-run',
    stages: ['adult'],
    prompt: 'The town fun-run is this weekend. There are medals shaped like bananas.',
    choices: [
      { label: 'Run the whole thing', lean: ['bold'], goals: ['healthy'],
        outcomes: [
          { effects: { health: 12, happiness: 8 }, text: 'Finished! Legs: jelly.' },
          { effects: { health: -8 }, text: 'Pulled a muscle at mile 2.' },
        ] },
      { label: 'Walk it with friends', lean: ['social', 'careful'], goals: ['healthy', 'heart'],
        effects: { health: 5, happiness: 6 }, text: 'Walked and chatted the route.' },
      { label: 'Cheer from a bench', lean: ['lazy', 'shy'],
        effects: { happiness: 3 }, text: 'Cheered loudly. Snacked more.' },
    ],
  },
  {
    id: 'night-class',
    stages: ['adult'],
    prompt: 'The library offers night classes: coding or pottery. $10 either way.',
    choices: [
      { label: 'Coding class', lean: ['curious', 'careful'], goals: ['scholar'], needs: { money: 10 },
        effects: { smarts: 12, money: -10 }, text: 'First program printed "hi".' },
      { label: 'Pottery class', lean: ['social', 'bold'], goals: ['heart'], needs: { money: 10 },
        effects: { happiness: 10, money: -10 }, text: 'Made a lumpy, perfect mug.' },
      { label: 'Couch, please', lean: ['lazy', 'shy'],
        effects: { happiness: 4, health: -2 }, text: 'Watched a pottery show.' },
    ],
  },
  {
    id: 'week-off',
    stages: ['adult'],
    prompt: '{name} has a whole week off. Where to?',
    choices: [
      { label: 'Beach trip ($80)', lean: ['bold', 'social'], goals: ['heart'], needs: { money: 80 },
        effects: { money: -80, happiness: 18, health: 4 }, text: 'Beach week! Mild sunburn.' },
      { label: 'Hike the hills', lean: ['curious'], goals: ['healthy'],
        effects: { health: 8, happiness: 6 }, text: 'Hiked a hill. Met a goat.' },
      { label: 'Staycation', lean: ['lazy', 'careful', 'shy'],
        effects: { happiness: 8 }, text: 'Built a pillow fort.' },
    ],
  },

  // ---- Elder (65+) ----
  {
    id: 'garden',
    stages: ['elder'],
    prompt: 'Spring is here and the garden could use some love.',
    choices: [
      { label: 'Grow a giant pumpkin', lean: ['bold', 'curious'], goals: ['fortune'],
        outcomes: [
          { effects: { happiness: 14, money: 30 }, text: 'Prize pumpkin! Blue ribbon!' },
          { effects: { happiness: -4 }, text: 'Squirrels ate the pumpkin.' },
        ] },
      { label: 'Plant some herbs', lean: ['careful'], goals: ['healthy'],
        effects: { health: 5, happiness: 5 }, text: 'Fresh mint for tea.' },
      { label: 'Admire the weeds', lean: ['lazy', 'shy'],
        effects: { happiness: 4 }, text: 'Weeds are flowers too.' },
    ],
  },
  {
    id: 'story-time',
    stages: ['elder'],
    prompt: 'The neighbor kids knock on the door and ask {name} for a story.',
    choices: [
      { label: 'Tell a wild tall tale', lean: ['bold', 'social'], goals: ['heart'],
        effects: { happiness: 10 }, text: 'Told of the dragon. Again.' },
      { label: 'Teach them chess', lean: ['curious', 'careful'], goals: ['scholar'],
        effects: { smarts: 5, happiness: 6 }, text: 'Lost to a seven-year-old.' },
      { label: 'Pretend to nap', lean: ['lazy', 'shy'], goals: ['healthy'],
        effects: { health: 3, happiness: 2 }, text: 'Fake nap became real nap.' },
    ],
  },
  {
    id: 'new-phone',
    stages: ['elder'],
    prompt: 'A shiny new phone arrives as a gift. It has 47 buttons, somehow.',
    choices: [
      { label: 'Master it alone', lean: ['curious', 'bold'], goals: ['scholar'],
        effects: { smarts: 8 }, text: 'Sent a duck emoji. Nailed it.' },
      { label: 'Call the family', lean: ['social'], goals: ['heart'],
        effects: { happiness: 8 }, text: 'Video call! Mostly forehead.' },
      { label: 'Use it as a coaster', lean: ['lazy', 'careful', 'shy'],
        effects: { happiness: 3 }, text: 'Excellent coaster.' },
    ],
  },
  {
    id: 'dance-night',
    stages: ['elder'],
    prompt: 'The community center is hosting a dance night. There will be cocoa.',
    choices: [
      { label: 'Dance every song', lean: ['bold', 'social'], goals: ['heart'],
        outcomes: [
          { effects: { happiness: 14, health: 3 }, text: 'Danced every song!' },
          { effects: { happiness: 4, health: -6 }, text: 'Threw out a hip. Worth it.' },
        ] },
      { label: 'One slow dance', lean: ['careful'], goals: ['heart'],
        effects: { happiness: 8 }, text: 'One slow dance. Lovely.' },
      { label: 'Watch with cocoa', lean: ['shy', 'lazy', 'curious'],
        effects: { happiness: 5 }, text: 'Cocoa and people-watching.' },
    ],
  },
];
