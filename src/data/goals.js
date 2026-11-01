// goals.js — Life goals the player can set for the character, with the
// stat each one nudges every year, its idle activity, and its milestones.
// Pure data: game/goals.js reads it.

// Goals can be picked from this age (whole years). Before that, and in new
// lives, the goal is DEFAULT_GOAL.
export const GOAL_MIN_AGE = 6;
export const DEFAULT_GOAL = 'free';

// Each goal has:
//   id          Unique and saved; don't rename one once it has shipped.
//   label       Name in the goal menu (11 characters at most).
//   blurb       One line shown when hovering the goal's button.
//   stat        Stat (data/stats.js) the goal boosts a little each in-game
//               year, or null.
//   drift       Boost to `stat` at the end of the 1st, 2nd, 3rd... year
//               since the goal was picked; the last value repeats. Picking
//               a goal (even the same one again later) starts back at the
//               first value, so switching back and forth doesn't pay.
//   activity    Idle activity id (ACTIVITIES in data/animation.js), or null.
//   milestones  3-4 milestones, checked only while this goal is active:
//               { id, label, when }, where `when` is one of
//                 { stat, atLeast }   a stat reaches a value
//                 { goalYears }       total years spent with this goal
//                 { variety }         different events experienced
//               Milestone ids are saved, so don't rename them either.
//               Labels: 16 characters at most.
export const GOALS = [
  {
    id: 'scholar',
    label: 'Scholar',
    blurb: 'Books, puzzles and big ideas.',
    stat: 'smarts',
    drift: [1, 2, 3, 4],
    activity: 'read',
    milestones: [
      { id: 'scholar-curious', label: 'Curious mind', when: { stat: 'smarts', atLeast: 50 } },
      { id: 'scholar-bookworm', label: 'Bookworm', when: { goalYears: 5 } },
      { id: 'scholar-top', label: 'Top of the class', when: { stat: 'smarts', atLeast: 90 } },
      { id: 'scholar-owl', label: 'Wise old owl', when: { goalYears: 25 } },
    ],
  },
  {
    id: 'fortune',
    label: 'Fortune',
    blurb: 'Save up, invest, count coins.',
    stat: 'money',
    drift: [5, 10, 15, 25],
    activity: 'coins',
    milestones: [
      { id: 'fortune-piggy', label: 'Piggy bank', when: { stat: 'money', atLeast: 50 } },
      { id: 'fortune-nest', label: 'Nest egg', when: { stat: 'money', atLeast: 250 } },
      { id: 'fortune-comfy', label: 'Comfortable', when: { stat: 'money', atLeast: 750 } },
      { id: 'fortune-tycoon', label: 'Tycoon', when: { stat: 'money', atLeast: 1500 } },
    ],
  },
  {
    id: 'heart',
    label: 'Heart',
    blurb: 'Friends, kindness, good times.',
    stat: 'happiness',
    drift: [1, 2, 3],
    activity: 'wave',
    milestones: [
      { id: 'heart-sunny', label: 'Sunny side', when: { stat: 'happiness', atLeast: 80 } },
      { id: 'heart-company', label: 'Good company', when: { goalYears: 5 } },
      { id: 'heart-full', label: 'Full heart', when: { stat: 'happiness', atLeast: 100 } },
      { id: 'heart-kindred', label: 'Kindred spirit', when: { goalYears: 20 } },
    ],
  },
  {
    id: 'healthy',
    label: 'Healthy',
    blurb: 'Fresh air, long jogs, veggies.',
    stat: 'health',
    drift: [1, 2, 3],
    activity: 'jog',
    milestones: [
      { id: 'healthy-fresh', label: 'Fresh air', when: { goalYears: 1 } },
      { id: 'healthy-fiddle', label: 'Fit as a fiddle', when: { stat: 'health', atLeast: 95 } },
      { id: 'healthy-peak', label: 'Peak shape', when: { stat: 'health', atLeast: 100 } },
      { id: 'healthy-mover', label: 'Lifelong mover', when: { goalYears: 20 } },
    ],
  },
  {
    id: 'free',
    label: 'Free spirit',
    blurb: 'No plan. Follow the breeze.',
    stat: null,
    drift: [],
    activity: null,
    milestones: [
      { id: 'free-sampler', label: 'Bit of it all', when: { variety: 5 } },
      { id: 'free-flow', label: 'Go with the flow', when: { goalYears: 10 } },
      { id: 'free-seen', label: 'Seen it all', when: { variety: 12 } },
    ],
  },
];
