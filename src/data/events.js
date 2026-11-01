// events.js — Life events, shown as a "!" bubble over the character. Pure
// data: adding an event means adding an entry here, nothing else.
//
// Each event has:
//   id        Unique and saved; don't rename one once it has shipped.
//   stages    Life stages it can happen in (ids from data/lifeStages.js).
//   minAge, maxAge   Optional extra limits, in whole years.
//   employed  Optional: true for work events (only while the character
//             has a job), false for events only without one.
//   prompt    What's happening. {name} becomes the character's name and
//             {job} their job title.
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
//     job       Optional change to the job, next to effects (work events
//               only): { raise: n } changes yearly pay by n dollars
//               (negative for a pay cut), { leave: true } loses the job,
//               { switch: true } moves to another job the character
//               qualifies for, at its first level. In the text, {job} is
//               the old title and {newJob} the new one.
//
// Job offers aren't listed here: game/jobs.js builds them from
// data/jobs.js.
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
    employed: true,
    prompt: 'The boss offers {name} a promotion. More pay, more meetings.',
    choices: [
      { label: 'Take it!', lean: ['bold'], goals: ['fortune'],
        job: { raise: 25 }, effects: { happiness: -4, health: -2 }, text: 'More pay. So many meetings.' },
      { label: 'Ask for just a raise', lean: ['careful', 'shy'], goals: ['fortune'],
        outcomes: [
          { job: { raise: 10 }, effects: { happiness: 4 }, text: 'Got the raise!' },
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

  // ---- Work (adults with a job) ----
  {
    id: 'work-raise',
    stages: ['adult'],
    employed: true,
    prompt: '{name} has been doing great work as {job}. Time to ask for a raise?',
    choices: [
      { label: 'Ask for a big raise', lean: ['bold'], goals: ['fortune'],
        outcomes: [
          { job: { raise: 30 }, effects: { happiness: 8 }, text: 'Got the big raise!' },
          { effects: { happiness: -6 }, text: 'Boss said "not this year."' },
        ] },
      { label: 'Ask for a small one', lean: ['careful', 'shy'], goals: ['fortune'],
        job: { raise: 10 }, effects: { happiness: 3 }, text: 'Small raise. Still counts!' },
      { label: 'Not worth the fuss', lean: ['lazy'], goals: ['heart'],
        effects: { happiness: 2 }, text: 'Kept things comfy.' },
    ],
  },
  {
    id: 'tough-boss',
    stages: ['adult'],
    employed: true,
    prompt: 'The new boss at work is a lot. Today: a 40-minute talk about staplers.',
    choices: [
      { label: 'Stand up to the boss', lean: ['bold'],
        outcomes: [
          { effects: { happiness: 8 }, text: 'The boss backed off. Respect!' },
          { job: { raise: -10 }, effects: { happiness: -6 }, text: 'Pay docked. Ugh.' },
        ] },
      { label: 'Keep head down', lean: ['careful', 'shy'],
        effects: { happiness: -4, health: -2 }, text: 'Survived the stapler talk.' },
      { label: 'Vent to coworkers', lean: ['social'], goals: ['heart'],
        effects: { happiness: 5 }, text: 'Coworkers agree. Bonding!' },
    ],
  },
  {
    id: 'overtime',
    stages: ['adult'],
    employed: true,
    prompt: 'Overtime is up for grabs this month. Double pay, half the sleep.',
    choices: [
      { label: 'Take every shift', lean: ['bold'], goals: ['fortune'],
        effects: { money: 60, health: -8, happiness: -3 }, text: 'Rich-ish and very sleepy.' },
      { label: 'Take a few shifts', lean: ['careful'], goals: ['fortune'],
        effects: { money: 25, health: -2 }, text: 'A little extra. Not bad.' },
      { label: 'Guard the free time', lean: ['lazy', 'social'], goals: ['heart', 'healthy'],
        effects: { happiness: 5, health: 2 }, text: 'Evenings stay free. Bliss.' },
    ],
  },
  {
    id: 'layoff',
    stages: ['adult'],
    employed: true,
    prompt: "Budget cuts! {name}'s job as {job} might be on the chopping block.",
    choices: [
      { label: 'Fight to stay', lean: ['bold'],
        outcomes: [
          { effects: { happiness: 4 }, text: 'Made the case. Job saved!' },
          { job: { leave: true }, effects: { happiness: -10 }, text: 'Laid off anyway. Oof.' },
        ] },
      { label: 'Take the severance', lean: ['curious', 'lazy'],
        job: { leave: true }, effects: { money: 80, happiness: -2 }, text: 'Took the money and ran.' },
      { label: 'Offer to take a pay cut', lean: ['careful', 'shy'], goals: ['fortune'],
        job: { raise: -15 }, effects: { happiness: -3 }, text: 'Kept the job, for less.' },
    ],
  },
  {
    id: 'career-change',
    stages: ['adult'],
    employed: true,
    prompt: 'An old friend says {name} would be great at something totally new.',
    choices: [
      { label: 'Take the leap!', lean: ['bold', 'curious'],
        job: { switch: true }, effects: { happiness: 8 }, text: 'New career: {newJob}!' },
      { label: 'Stay put', lean: ['careful', 'lazy'],
        effects: { happiness: 2 }, text: 'Stayed put. Steady wins.' },
      { label: 'Ask for a counteroffer', lean: ['social'], goals: ['fortune'],
        outcomes: [
          { job: { raise: 15 }, text: 'Counteroffer! Pay went up.' },
          { effects: { happiness: -3 }, text: 'No counteroffer. Awkward.' },
        ] },
    ],
  },
  {
    id: 'big-project',
    stages: ['adult'],
    employed: true,
    prompt: 'The big project at work is due Friday. It is not done. It is barely started.',
    choices: [
      { label: 'Pull all-nighters', lean: ['careful'], goals: ['scholar', 'fortune'],
        outcomes: [
          { job: { raise: 20 }, effects: { smarts: 4, health: -6 }, text: 'Nailed it! Bonus raise.' },
          { effects: { smarts: 4, health: -6 }, text: 'Done on time. Barely.' },
        ] },
      { label: 'Rally the team', lean: ['social', 'bold'], goals: ['heart'],
        effects: { happiness: 6, smarts: 2 }, text: 'Team effort. Pizza helped.' },
      { label: 'Ask for an extension', lean: ['lazy', 'shy'],
        outcomes: [
          { effects: { happiness: 4 }, text: 'Extension granted. Phew.' },
          { effects: { happiness: -6 }, text: 'Extension denied. Panic!' },
        ] },
    ],
  },
  {
    id: 'team-potluck',
    stages: ['adult'],
    employed: true,
    prompt: 'Team potluck at work! {name} signed up to bring "something good."',
    choices: [
      { label: 'Bake a fancy pie', lean: ['bold', 'curious'], goals: ['heart'],
        effects: { happiness: 8, money: -5 }, text: 'The pie was a sensation.' },
      { label: 'Store-bought cookies', lean: ['lazy', 'careful'],
        effects: { happiness: 3 }, text: 'Nobody noticed. Perfect.' },
      { label: 'Eat lunch at the desk', lean: ['shy'], goals: ['scholar'],
        effects: { happiness: -2, smarts: 3 }, text: 'Desk lunch. Got work done.' },
    ],
  },
  {
    id: 'work-training',
    stages: ['adult'],
    employed: true,
    prompt: 'Work will pay for a training course. Evenings only, for a whole year.',
    choices: [
      { label: 'Sign up', lean: ['curious', 'careful'], goals: ['scholar'],
        effects: { smarts: 10, health: -2 }, text: 'Certified! Brain: bigger.' },
      { label: 'Sign up, skip some', lean: ['lazy', 'social'],
        effects: { smarts: 3, happiness: 3 }, text: 'Learned some. Napped more.' },
      { label: 'Keep evenings free', lean: ['shy', 'bold'], goals: ['healthy', 'heart'],
        effects: { happiness: 4, health: 2 }, text: 'Evenings off. Lovely.' },
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
