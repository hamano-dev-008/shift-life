# Shift-Life

A cozy idle desktop-companion life sim for Windows.

A small pixel character lives in a floating, always-on-top window on your
desktop. Their life runs in real time: they work, eat, sleep, and go about
their day while you do yours. You don't control everything; you nudge them
by setting goals and answering the speech-bubble events that pop up.

Built with Electron and plain JavaScript.

## Status

Early development. What works so far:

- A small floating window (320x240, frameless, rounded, always on top).
  Drag it by its background; minimize or close it with the buttons in the
  top-right corner. It reopens where you left it.
- A pixel character is born with a random name and look. They wander
  around wherever they are (see Places below), sometimes stopping by
  the tree, the house or the furniture for a moment. They stroll with a four-frame walk (feet planted, arms
  swinging, a small bounce each step) and breathe and blink while
  standing. Their face smiles, looks neutral or frowns depending on how
  happy they are.
- Gently click the character for a little wiggle and playful chatter.
  A poke can give +1 happiness once per 30 real seconds. Four pokes within
  three seconds annoy them (-1 happiness once); more pokes keep them
  annoyed. Leave them alone for five seconds to calm down. Poke chatter
  yields to events and important news, and their current activity continues.
  Only painted character pixels respond; empty background still drags.
- Each character has stats (health, happiness, smarts, money) and is born
  with 2-3 personality traits (bold or careful, social or shy, curious or
  lazy). Hover the name label to see them; click it to keep the panel open.
- Life events: about once or twice a year, a "!" bubble pops up over the
  character's head. Click it to see what's going on and pick what they do.
  Some choices are a gamble. If you don't answer within about a minute,
  they decide for themselves based on their traits, and a little speech
  bubble tells you what they did. Events never steal focus from your other
  windows. There are 26 events across childhood, teen years, adulthood
  (including 9 at work) and old age.
- Life goals: from age 6, the flag button in the top bar opens the goal
  menu. Pick Scholar, Fortune, Heart, Healthy or Free spirit. The goal's
  stat gets a small boost every year, growing the longer you stick with
  it (switching starts it over). When the character decides an event on
  their own, the goal comes before their traits, and events that suit
  the goal come up a bit more often. Each goal has milestones, celebrated
  with a golden bubble, and the character sometimes does a goal activity
  while idle: reading under the tree, counting coins, waving,
  or jogging.
- Jobs: from 18, a character without a job gets job offers in the "!"
  bubble: 2-3 jobs they qualify for (always one that suits their goal,
  if any does). If you don't pick, they choose by goal and traits. There
  are 12 jobs, from barista and farmhand (anyone can start) to developer
  and surgeon (lots of smarts), each with a 3-step career path. Pay comes
  in every in-game year, promotions come with time once they meet the
  next step's smarts or health, and work events bring raises, overtime,
  tough bosses, layoffs and career changes. They wear their job's item
  (hard hat, tie, apron, chef hat...) and now and then walk out the side
  of the window to work, coming back a bit later. At 65 they retire with
  a small yearly pension. Hover the name label to see job, level, pay and
  money. Job data is in `src/data/jobs.js`.
- Places: the current one's name shows under the name label.
  - Growing up, there are three: the Fortune Tree, the Parents' Yard
    beside it (walking off the tree's right edge leads there, and back)
    and the Parents' Home inside their house. Click the house and the
    character walks to the front door and goes inside.
  - The Parents' Home is a cozy living room: wallpaper, a wooden floor,
    a window with a bit of sky, the front door and a sofa. Click the
    front door to walk back out into the yard.
  - The Lake is to the left of the Fortune Tree (walking off the tree's
    left edge leads there, and back): a sunset lake with a wooden dock
    and a grassy shore. The character walks on the dock and the shore,
    never past the dock's tip, and the water shimmers softly. Anyone can
    visit, babies included. Work trips leave by the shore side. The
    Lake's numbers (where they walk, the dock, the shimmer) are in
    `src/data/lake.js`.
  - The place button (the map pin in the top bar) opens "Go to", listing
    the other places. Pick one and the character walks there, through
    any places in between (the Lake to the living room goes past the
    Fortune Tree, through the yard and in the front door). Babies crawl the whole way.
    The button is disabled while they're on the way, and travelling
    stops busking or resting.
  - A new life starts in the Parents' Home; a save from before places
    existed continues at the Fortune Tree.
- Moving out and your own home: at 18 the character moves out (a golden
  "Moving out!" bubble). The parents' house is gone from the map; next
  to the Fortune Tree is now My Yard, with just a sleeping bag on the
  grass (if they were in the parents' living room, they end up there).
  Click the sleeping bag to rest in it or buy the next home:
  - Sleeping bag: where they start; resting gives 1 health every 3 real
    minutes.
  - Tent ($200): 1 health every 2 real minutes.
  - House ($1,500): stands in My Yard and has their own living room,
    Home, whose sofa gives 1 health every real minute.
  The upgrade is greyed out with "Need $X more" until they can afford
  it. Buying takes the money, shows a golden bubble, and the yard
  changes right away. A save from before housing existed: adults start
  with the sleeping bag in My Yard, children keep the parents' house.
  Prices and rates are in `src/data/housing.js`.
- While fishing, busking or resting, a small bar at the bottom of the
  window says what's happening (for fishing, "Fishing - 4 fish - $38")
  with a Stop button that works like the menu's (fishing sells the
  bucket).
- Resting: click the sofa (or the sleeping bag or tent) and pick
  "Rest". The character lies down with little z's floating up, gaining
  health (up to 100) until you pick "Get up". No new events come up
  while resting (the event timer waits). The numbers are in
  `src/data/home.js`.
- Fishing at the Lake: from age 6, click the dock to open its menu.
  - First "Buy a fishing rod - $30" (greyed out with "Need $X more"
    until they can afford it).
  - "Start fishing": the character walks to the end of the dock and
    casts to the left. The bobber bobs on the water; after 30 seconds to
    3 real minutes a fish bites, with a splash and a "!" over their head.
    Click the "!" within a few seconds to reel in with better odds of a
    rare fish; otherwise they reel it in themselves at normal odds. They
    hold up the catch, it goes in the bucket, and they cast again.
  - Each catch is revealed on a card: the bobber jerks and a dark
    silhouette flashes, then the card pops in with the fish drawn big
    on light rays in its rarity's color (junk gray, common green,
    uncommon blue, rare purple, legendary gold), its name, size and
    value, and "NEW!" or "NEW RECORD!" badges. Rare fish sparkle; a
    legendary one flashes the window gold with slowly turning rays. The
    card fades by itself (rarer fish stay longer) or when clicked, and
    fishing carries on behind it. An old boot gets a shrug.
  - Catches: junk (an old boot, $0), common (carp, perch, $3-6),
    uncommon (trout, catfish, $15), rare (salmon, pike, $50) and
    legendary (the golden koi, $300). Each fish has a random size in
    cm; bigger ones sell for up to 20% more, smaller ones up to 20%
    less. Left alone, fishing earns about $4 a real minute.
  - The dock menu shows the bucket while fishing. "Stop fishing" sells
    everything and shows the total. Travelling away sells it too.
  - The fish collection (from the dock menu) records the first catch of
    each kind, by whom and at what age, and the biggest one caught. It's
    kept across lives, and the life summary shows the count.
  - While fishing no new events come up (the event timer waits) and
    they don't go to work. Real time only: game speed doesn't change it
    and it pauses while the app is closed.
  The numbers are in `src/data/fishing.js` (the reveal card's in
  `src/data/catchReveal.js`); the activity itself (where,
  from what age, the rod) in `src/data/activities.js`, where future
  activities can be added as data.
- The Fortune Tree: from age 6, click the tree to open its menu:
  - "Play an instrument": the character sits under the tree with a
    guitar, notes floating up. Every 8 real minutes of playing pays $10
    and counts as a full session, until you stop. Stopping early pays
    nothing for the unfinished session. While playing they don't wander
    or go to work, and no new events (or job offers) come up: the event
    timer waits until they stop. An event already waiting stays waiting.
    Yearly pay and goal boosts carry on.
  - "Pick the golden apple": a golden apple grows on the tree every 2
    real hours (one at a time). Picking it works 10% of the time, plus 1%
    per full busking session since the last golden apple, up to 50%.
    The menu shows the current chance. A golden apple pays $888; a miss
    loses the apple. Either way the next one is 2 hours away.
  These timers use real time (game speed doesn't change them) and pause
  while the app is closed. The numbers are in `src/data/fortuneTree.js`.
- Babies crawl on hands and knees in short trips and sit up in between,
  looking around and wobbling. At 3 they take their first steps (with a
  little celebration) and toddle with arms out, sometimes plopping down
  to sit; from 4 they walk normally. Crawl and toddle speeds and the
  ages are in `src/data/infant.js`.
- Life runs in real time: one in-game year every 3 real minutes. The
  character grows from baby to child, teen, adult, and elder (grey hair),
  and the top-left label shows their name and age.
- Growing old and the end of life:
  - From 50, health drops a little every in-game year. A better home
    slows it: 3 a year in the sleeping bag, 2 in the tent, 1 in the
    house. Resting still restores health.
  - A life ends when health reaches 0, or, from 70, by a yearly chance
    that grows with age and shrinks with good health; nobody lives past
    100. Babies, children and teens never die.
  - There's no game-over screen. Busking or resting stops, the character
    sits down and closes their eyes, the scene slowly fades, and a soft
    bubble says "Mia drifted off peacefully at 82." Time, events, jobs
    and timers stop.
  - A moment later the life summary opens: a life title such as "The
    Steady Farmer" or "The Friendly Busker" (from their strongest trait
    and what their life was about), name and age, goal and milestones,
    jobs and highest title, money, home, golden apples won and fish
    (caught, and the collection's count). Close it
    and click the farewell bubble to see it again.
  - "Start a new life" on the summary starts a fresh baby at the
    parents' home.
  - Every finished life goes into the Book of past lives: the book
    button in the top bar lists them (name, ages, life title); click one
    to read its summary. The Book is kept across new lives.
  The numbers and the title rules are in `src/data/endOfLife.js`.
- The place name under the name label has the same light backing, so
  it reads on any background.
- The life is saved, so closing and reopening continues it. Time doesn't
  pass while the app is closed.

**Sizes:** in `src/data/layout.js`, `SCENE_SCALE` sets how big the scene
(sky, grass, tree) is drawn, and `CHARACTER_SCALE` sets the
character's size on its own. Both are whole numbers, so pixels stay
crisp: the scene is 3 by default and the character 2 (try 3 to match the
scene).

**For testing:** when you run from source (`npm.cmd start`), a gear
button next to minimize opens the dev settings: start a new life, set
the speed (normal, fast at about one year every 5 seconds, or very fast
at one year a second), skip ahead 1 or 10 years, trigger an event, add
$1,000, finish a busking session instantly, grow a golden apple now,
rest a minute instantly, jump to age 18 to test moving out, set the
housing tier (sleeping bag, tent, house), jump to any place without
walking (the Lake included), give a fishing rod, make a fish bite
now, catch a fish of a chosen rarity now, preview the catch reveal
card for each rarity, end the life now (adults only), set health (0, 10, 50 or 100;
0 ends an adult's life), and see the character's stats, traits, goal,
job, tree progress, place, housing, yearly ageing and the chance of the
life ending on the next birthday, and how fishing is going.
It's hidden in packaged builds.

Keyboard shortcuts (window focused): Ctrl+Shift+F toggles fast speed (the
label shows `>>`), Ctrl+Shift+M cycles happiness (smile, neutral,
frown), Ctrl+Shift+E starts an event right away (children and older
only), Ctrl+Shift+A starts the goal's idle activity, and Ctrl+Shift+W
sends the character off to work (if they have a job). You can also
start a new life by closing the app and deleting
`%APPDATA%\shift-life\save.json`. The Book of past lives is in
`past-lives.json` next to it, and the fish collection in
`collection.json`.

**Adding sprites:** every graphic is drawn in code for now, but any of
them can be replaced by your own pixel art, one at a time, without
code. Save a PNG in `assets/sprites/` named after what it replaces:
`sky.png`, `grass.png`, `tree.png`, `parents.house.png`,
`yard.sleepingBag.png`, `yard.tent.png`, `yard.house.png`, `home.wall.png`,
`home.floor.png`, `home.window.png`, `home.door.png`, `home.sofa.png`,
`lake.png` (the Lake's whole background, 107 x 80; there's one already),
`fish.<id>.png` for the fish icons, also drawn big on the catch reveal
card (`fish.boot`, `fish.carp`, `fish.perch`, `fish.trout`,
`fish.catfish`, `fish.salmon`, `fish.pike`, `fish.goldenKoi`; there's
one for each already),
`goldenApple.png` (drawn at the
tree's scale unless it has its own `scale`, as the current 40 x 40 apple
does, its middle on the spot set by `APPLE_SPOT` in
`src/data/fortuneTree.js`), or
`character.<body>.<animation>.png` (for example
`character.adult.walk.png`; bodies are baby, toddler, child, teen,
adult, elder; animations are idle, walk, sit, crawl, read, coins, wave,
jog, busk, rest, fish). Draw at 1 pixel per game pixel: the game scales it up
crisply
(scenery at the scene scale, the character at its own scale). Add
`.smile`, `.neutral` or `.frown` before `.png` for a version that
matches the mood. For an animation, put the frames side by side in one
row and add a line to `src/data/sprites.js` with the frame count and,
if you like, the frame size and seconds per frame, e.g.
`grass: { frames: 4, frameDuration: 0.5 }`. To draw one sprite bigger
than the rest, give it a whole-number `scale` there (screen pixels per
pixel; the scene uses 3), like the tree's `tree: { scale: 5 }`. Restart
the app to pick up new PNGs and changes. `src/data/sprites.js` explains where each sprite is placed
and the sizes that line up with the current art. A character sprite
replaces the whole figure for that animation, including job items.

**Adding events, goals and jobs:** add an entry to `src/data/events.js`,
`src/data/goals.js` or `src/data/jobs.js`; each file describes its
format. A new job item also needs a drawing in `src/ui/sprite.js`. Event
pacing, the auto-decide wait and goal weights are in
`src/data/balance.js`.

## Requirements

- Windows
- Node.js (LTS or newer) and npm

## Install and run

In PowerShell, use `npm.cmd` instead of `npm`:

```powershell
npm.cmd install      # install dependencies
npm.cmd start        # launch the game
```

In Git Bash, plain `npm` works. The first start downloads Electron, so it
takes a little longer. Run `npm.cmd test` for interaction rules, pose
checks, end-of-life logic, the Lake and fishing (Node 22.7+), and
`npm.cmd run test:smoke` for isolated Electron click/renderer checks,
including a whole goodbye, a new life, a visit to the Lake, a catch
with its reveal card, and the activity bar's Stop.
The smoke check uses in-memory saves, leaving your life, Book and
collection untouched.

## Project layout

See [AGENTS.md](AGENTS.md) for the folder structure, coding conventions,
and workflow rules. It is written for AI coding agents but applies to human
contributors too.
