# AGENTS.md — Shift-Life

Instructions for any AI coding agent (Claude Code, ChatGPT Codex, Cursor,
Copilot, etc.) working on this project. This file is the single source of
truth; `CLAUDE.md` just imports it.

## What the game is

Shift-Life is a **cozy idle desktop-companion life sim for Windows**, built
with **Electron and plain JavaScript**.

- A small pixel character lives in a floating, frameless, **always-on-top**
  window that sits on the player's desktop.
- Life runs in **real time**: the character works, eats, sleeps, and goes
  about their day whether or not the player is watching.
- The player does not control everything. They **nudge** the character by
  setting goals and by responding to **speech-bubble events** (small prompts
  and choices that pop up over the character).
- Tone: calm, low-pressure, and charming. Nothing punishes the player for
  leaving it running in the background.

## Folder structure

> **Status:** a pixel character is born with stats and personality
> traits, wanders the window, ages in real time, meets life events as
> speech bubbles, pursues a life goal the player picks, works jobs from
> 18 (pay, promotions, work events) and retires at 65, and walks
> between places: the Lake (fishing from the dock: a rod to buy, bites,
> catches of random sizes revealed on a card and sold from the bucket,
> a fish collection with the biggest of each kind, kept across lives;
> the first of the data-defined place activities), the Fortune Tree
> (busking, the golden apple), the
> Parents' Yard and Home (resting on the sofa) while growing up, then
> from 18 My Yard (sleeping bag, tent or house, bought by the player)
> and their own Home. From 50 health fades with age; the life ends
> gently (no health left, or a yearly chance from 70 up to 100) with a
> life summary, goes into the Book of past lives, and a new life can
> begin. The life, the Book and the fish collection are saved between
> launches. While fishing, busking or resting a bar at the bottom says
> what's happening, with Stop. Items marked
> *(planned)* don't exist yet; follow the planned layout when adding them,
> and update this section whenever files are added, moved, or removed.

```
Shift-Life/
├── AGENTS.md          Shared agent instructions (this file)
├── CLAUDE.md          Imports AGENTS.md for Claude Code
├── README.md          Player/developer-facing overview and run steps
├── .gitignore         Keeps node_modules, build output, and OS files out of git
├── package.json       npm scripts and dependencies
├── package-lock.json  Locked dependency versions (commit it)
├── main.js            Electron main process: creates the frameless,
│                      transparent, always-on-top 320x240 window, saves and
│                      restores its position, handles window, save and
│                      Book of past lives and fish collection IPC,
│                      lists the PNGs in
│                      assets/sprites/, reports dev runs (!app.isPackaged)
├── preload.js         Exposes window.shiftLife { minimize, close, loadSave,
│                      save, saveSync, loadBook, saveBook,
│                      loadCollection, saveCollection, isDev,
│                      listSprites } to the renderer via contextBridge
├── src/
│   ├── index.html     Renderer page: scene canvas, prop click areas,
│   │                  label, place name, stats panel, event bubble/card,
│   │                  bite bubble, the reveal card's click area, the
│   │                  activity bar, goal, tree, rest, activity (dock),
│   │                  Go to and dev menus, life summary
│   │                  card, Book of past lives, text bubble, top-right
│   │                  buttons (goal, book, place, gear, -, x)
│   ├── styles.css     Rounded frame, drag region, pixelated canvas, label,
│   │                  place name (with the label's backing), stats
│   │                  panel, prop click areas, the reveal's click
│   │                  area, the activity bar, panels (event card, goal,
│   │                  tree, rest, activity with the fish collection, Go
│   │                  to and dev menus, life summary, Book; the tall
│   │                  ones scroll),
│   │                  top-right buttons, text bubble (and the farewell
│   │                  bubble)
│   ├── renderer.js    Renderer entry point (ES module): loads or starts a
│   │                  life and the Book, builds each place's scene, runs
│   │                  clock, ageing and the end of life, events, goals,
│   │                  jobs, the Fortune Tree, resting, activities
│   │                  (fishing) and moving out (real-time tick), trips
│   │                  between places (selling the bucket), following
│   │                  map changes, prop clicks (the dock opens the
│   │                  activity menu), fishing's drawing and bite "!",
│   │                  the catch reveal, the fish collection, the
│   │                  activity bar (Stop), buying housing, the
│   │                  goodbye (sitting, fade, farewell bubble, summary
│   │                  card) and new lives, autosave, frame loop, text
│   │                  bubble queue, menu wiring, dev shortcuts
│   ├── game/          Game logic only (no hard-coded content)
│   │   ├── interaction.js Unsaved real-time poke rules and happiness changes
│   │   ├── clock.js       Real-time clock: in-game years, speed, stopped
│   │   │                  once the life has ended
│   │   ├── character.js   Birth (random name/look/traits), stats,
│   │   │                  expression, age, life stage
│   │   ├── events.js      Event engine: scheduling, picking, choices,
│   │   │                  outcomes, goal- and trait-based auto-decide,
│   │   │                  freezing while busking or resting
│   │   ├── goals.js       Active goal, yearly stat drift, milestones,
│   │   │                  the goal menu's view
│   │   ├── jobs.js        Job offers, the job held and its level, yearly
│   │   │                  pay, promotions, job changes, retirement and
│   │   │                  pension, the stats panel's job view
│   │   ├── places.js      The current place (game.place): look-up,
│   │   │                  restoring, which places exist now and what
│   │   │                  they show (housing), exits, routes, the rest
│   │   │                  spot, entering, leaving and settling (ends
│   │   │                  busking/resting), moving out
│   │   ├── home.js        Resting (sofa, sleeping bag, tent): real-time
│   │   │                  health gain at the housing's rate, the rest
│   │   │                  menu's view
│   │   ├── housing.js     Moving out at 18, the housing tier, place
│   │   │                  requirements, which tier prop shows, rest
│   │   │                  rate, upgrade offer and buying
│   │   ├── activities.js  Place activities (data/activities.js): the
│   │   │                  item to buy, starting and stopping, real-time
│   │   │                  progress and rewards (periodic, on finishing a
│   │   │                  fixed-time run, catches), the event freeze,
│   │   │                  the activity menu's view, per-life totals
│   │   ├── fishing.js     Fishing's bites and catches: the real-time
│   │   │                  wait, the bite (click odds), reeling, landing
│   │   │                  into the bucket (a random size, which nudges
│   │   │                  the value; what the reveal shows), selling it,
│   │   │                  the menu status, a preview catch; the fish
│   │   │                  collection (first catch of each kind and the
│   │   │                  biggest, across lives)
│   │   ├── catchReveal.js The catch reveal's timing (suspense, pop-in,
│   │   │                  hold, fade, a click fading it sooner, the
│   │   │                  legendary flash and turning rays) and its text
│   │   │                  (banner, name, size and value, badges, junk)
│   │   ├── activityBar.js The activity bar: what's running (an
│   │   │                  activity, busking, resting), its text (the
│   │   │                  bucket for fishing), and stopping it
│   │   ├── fortuneTree.js The Fortune Tree: busking sessions and pay,
│   │   │                  the golden apple (growth, pick chance, pick),
│   │   │                  real-time timers, the tree menu's view, life
│   │   │                  totals (sessions played, apples won)
│   │   ├── endOfLife.js   Ageing (health from 50, by home), when a life
│   │   │                  ends (no health, yearly chance, natural
│   │   │                  limit), ending it (stops busking/resting/
│   │   │                  fishing, events, the clock), life summary
│   │   │                  (with fish caught and the collection) and title,
│   │   │                  the Book of past lives, starting a new life
│   │   │                  (with the hook for continuing as a child)
│   │   ├── dev.js         Dev actions: new life, speed, skip years,
│   │   │                  trigger event, add money, finish a busking
│   │   │                  session, apple now, rest a minute, go to a
│   │   │                  place instantly, set the housing tier, jump
│   │   │                  to 18, end life now, set health, give a rod,
│   │   │                  a bite now, catch a rarity now, preview a
│   │   │                  rarity's reveal card, read-out (job,
│   │   │                  tree, place, housing, fishing, life)
│   │   └── save.js        Save format (versioned) and load/save calls,
│   │                      for the life, the Book of past lives and the
│   │                      fish collection
│   ├── ui/            Drawing and visual-only behavior
│   │   ├── interaction.js Pixel-shaped click targets and reaction poses
│   │   ├── pixel.js       Low-res layer helpers: paint, outline, scaled draw
│   │   ├── assets.js      Sprite loader (PNGs from assets/sprites/ at
│   │   │                  startup), frame picking, crisp sprite drawing
│   │   ├── scene.js       computeLayout() (data → canvas pixels, for a
│   │   │                  place: its props, feet row, walking limits
│   │   │                  and open sides), where props are drawn and
│   │   │                  clicked (propRect, propClickRect), and the
│   │   │                  place's scenery (sky, grass, tree, houses,
│   │   │                  sleeping bag, tent; Home's wall, floor,
│   │   │                  window, door, sofa; the Lake's background and
│   │   │                  shimmer), each a
│   │   │                  sprite or code-drawn; still pieces cached,
│   │   │                  animated sprites and live pieces drawn every
│   │   │                  frame
│   │   ├── props.js       Draws the tree and the houses (parents' and
│   │   │                  own) in code; the shared prop painter and
│   │   │                  house colors
│   │   ├── housing.js     Draws the sleeping bag and the tent in code
│   │   ├── room.js        Draws Home's living room in code: wallpaper,
│   │   │                  wooden floor, window, front door, sofa
│   │   ├── lake.js        Draws the Lake: the code-drawn background
│   │   │                  (when lake.png is missing) and the water
│   │   │                  shimmer (sparkles that twinkle and drift)
│   │   ├── animator.js    Wandering, prop visits, goal activities,
│   │   │                  trips off-screen to work and back (by an open
│   │                  side), staying put
│   │   │                  to busk or rest, sitting for good (eyes
│   │   │                  closing) when a life ends, walking out of a
│   │   │                  place and into the next,
│   │   │                  turning, the walk cycle, breathing, blinking;
│   │   │                  gaits by age (crawl, toddle, walk), baby
│   │   │                  fidgets, toddler plops
│   │   ├── sprite.js      Draws the character (standing, sitting,
│   │   │                  lying, crawling, toddling) from a sprite sheet
│   │   │                  where one exists, otherwise in code, including
│   │   │                  activity props (book, coins, hearts, sweat),
│   │   │                  job items (hats, tie, apron, lab coat...),
│   │   │                  busking (guitar, notes) and resting (z's); all
│   │   │                  character drawing lives here
│   │   ├── bubble.js      The "!" bubble (canvas art + click target) and
│   │   │                  the text bubble, both following the head
│   │   ├── eventCard.js   The event card: prompt and choice buttons
│   │   ├── goalMenu.js    The goal menu: pick a goal, boost, milestones
│   │   ├── goldenApple.js The golden apple on the tree (sprite or code)
│   │   ├── treeMenu.js    The Fortune Tree menu: play/stop, pick the
│   │   │                  apple, progress and pick chance
│   │   ├── restMenu.js    The rest menu (sofa, sleeping bag, tent):
│   │   │                  rest/get up, rest progress, health, the next
│   │   │                  housing upgrade
│   │   ├── goMenu.js      The Go to menu (place button): the other
│   │   │                  places that exist now; disabled while
│   │   │                  travelling
│   │   ├── activityMenu.js The activity menu (the dock): buy the item,
│   │   │                  start/stop, status (the bucket), and the fish
│   │   │                  collection view (icons, who caught each first,
│   │   │                  the biggest)
│   │   ├── fishing.js     Draws fishing: the rod, line, bobber (cast,
│   │   │                  bobbing, bite splash, reeled in, jerking as
│   │   │                  it lands), the catch held up, and the fish
│   │   │                  icons (sprite or code) and their silhouettes
│   │   ├── catchReveal.js The catch reveal over the scene: the dark
│   │   │                  silhouette flashing, then the card (rays in
│   │   │                  the rarity's color, the fish big, banner,
│   │   │                  name, size, value, badges, sparkles, the
│   │   │                  legendary flash), fading; its queue
│   │   ├── farewell.js    The goodbye's fade: a pale veil over the scene,
│   │   │                  thickening in steps
│   │   ├── lifeSummary.js The life summary card ("Start a new life"), and
│   │   │                  the summary rows the Book reuses
│   │   ├── pastLives.js   The Book of past lives (book button): the list
│   │   │                  of finished lives and each one's summary
│   │   ├── devMenu.js     The dev settings menu (gear; dev runs only)
│   │   └── statsPanel.js  Stats, job and traits panel under the name label
│   └── data/          Pure game data, no logic
│       ├── interaction.js Poke dialogue, timing, thresholds and rewards
│       ├── balance.js     Pacing (minutes per year, clock speeds), mood
│       │                  thresholds, event gap, auto-decide wait, whim,
│       │                  goal weights for decisions and event picks
│       ├── stats.js       Starting stats, stat names and short tags
│       ├── dev.js         Dev menu amounts (skip-ahead years, money,
│       │                  set-health values)
│       ├── endOfLife.js   Ageing loss by home, when a life ends (ages,
│       │                  chances), goodbye timing, life title rules
│       │                  (trait adjectives, nouns), Book size, text
│       ├── places.js      Places (id, name, requirement, where to go
│       │                  when gone, scenery pieces, exits, clickable
│       │                  props, own feet row and walking limits),
│       │                  where a new life starts, the default place,
│       │                  travel distances, Go to text
│       ├── activities.js  Place activities (fishing so far): place,
│       │                  prop, facing, minimum age, item and price,
│       │                  how long it runs, rewards, event freeze,
│       │                  animation, menu and activity bar text (format
│       │                  in the file); the bar's Stop label
│       ├── fishing.js     Fishing: bite wait, bite window, reel/show/
│       │                  cast times, rarities (weights, click bonus),
│       │                  the fish, their values and sizes, how size
│       │                  changes value, visual loops, text
│       ├── catchReveal.js The catch reveal: timing (suspense, flash,
│       │                  pop-in, fade), per-rarity colors, hold time,
│       │                  rays, spin, sparkles and gold flash, the
│       │                  card's layout, colors and text
│       ├── lake.js        The Lake's numbers and text: its feet row,
│       │                  walking limits, the dock's click area and
│       │                  fishing spot, where the bobber lands, the
│       │                  water shimmer (area,
│       │                  sparkles, colors, timing), the dock bubble
│       ├── home.js        Resting numbers and text: what can be rested
│       │                  on and its seat height, rest health gain, z's,
│       │                  rest menu
│       ├── housing.js     Moving-out age, housing tiers (name, price,
│       │                  prop, rest rate), the parents' rest rate,
│       │                  upgrade and bubble text
│       ├── fortuneTree.js Fortune Tree numbers and text: min age,
│       │                  session length and pay, apple timing, pick
│       │                  chance and reward, apple spot, busking loops
│       ├── traits.js      Personality trait pairs, how many a newborn gets
│       ├── goals.js       Life goals: stat, yearly drift, activity,
│       │                  milestones (format documented in the file)
│       ├── layout.js      SCENE_SCALE (scene size), CHARACTER_SCALE (the
│       │                  character's own size), ground, the usual feet
│       │                  row, props (edges, sizes, bases, visit spots;
│       │                  the Lake's dock from data/lake.js) for every
│       │                  place, margins, bubble size
│       │                  and head clearance
│       ├── characterShapes.js  Body proportions per life stage, the
│       │                  toddler's body, crawl and sit poses
│       ├── infant.js      Crawl/toddle ages, speeds, strides and trip
│       │                  lengths, plop and fidget timing, first-steps
│       │                  bubble text
│       ├── animation.js   Walk speeds and stride (character pixels),
│       │                  pause/turn/blink timing,
│       │                  visit chance, bubble bob and times, goal
│       │                  activities (chance, place, duration, loops),
│       │                  work trips (chance, time away, exit distance)
│       ├── lifeStages.js  Life stages and the age each one starts at
│       ├── names.js       Names a newborn can get
│       ├── appearance.js  Skin, hair, hair style, shirt palettes; fixed
│       │                  character colors (elder hair, clothes, eyes,
│       │                  mouth, outline, shadow)
│       ├── events.js      Life and work event definitions (format
│       │                  documented at the top of the file)
│       ├── jobs.js        Jobs (career paths, pay, needs, goals, item),
│       │                  job offer, promotion and retirement numbers,
│       │                  job bubble and stats panel text
│       └── sprites.js     Sprite sheet info (frames, frame size and
│                          duration, anchor, scale) and the list of sprite
│                          names drawing code looks for
├── assets/
│   └── sprites/       Pixel-art PNGs that replace code-drawn art (tree.png,
│                      goldenApple.png, lake.png, fish.<id>.png so far)
│                      and a short README
└── test/              interaction.test.mjs (rules/poses), endOfLife.test.mjs
                       (ageing, endings, summary, Book, new life),
                       lake.test.mjs (the Lake: routes, feet row, walking
                       limits, dock, work trips, shimmer),
                       activities.test.mjs (activities and fishing:
                       rod, bites, odds, earnings, sizes, selling,
                       collection and records, saving, a data-only
                       activity, the reveal's timing and text, the
                       activity bar, dev), smoke.cjs (Electron clicks,
                       end of life flow, the Lake, fishing, the reveal,
                       the activity bar)
```

How it works, for anyone extending it:

- **Modules:** the renderer uses native ES modules (`<script type="module">`
  and relative `import`s with `.js` extensions), with no bundler.
  `main.js` and `preload.js` are CommonJS.
- **Rendering:** the canvas matches the window (320x240 CSS pixels).
  - All art is pixel art. The scene (sky, grass, props, the "!" bubble)
    is on a grid of "scene pixels", each drawn as a `SCENE_SCALE` x
    `SCENE_SCALE` block (`data/layout.js`, default 3). The character has
    its own size, `CHARACTER_SCALE` (default 2): its art is in "character
    pixels", each a `CHARACTER_SCALE` x `CHARACTER_SCALE` block, so it can
    be resized without touching the scene. Art is painted on small
    offscreen layers (`ui/pixel.js`), or comes from sprite PNGs (see
    **Sprites**), then drawn scaled with nearest-neighbour at whole-pixel
    positions. Code-drawn props and the character get a 1px outline.
    Never smooth or use non-integer scales.
  - Sizes and positions in `data/` are in scene pixels, measured from the
    window edges, except the character's own measurements
    (`characterShapes.js`, walk/crawl/toddle speed and stride, head
    clearance), which
    are in character pixels. `computeLayout()` in `ui/scene.js` turns them into
    canvas pixels. Code that places things (animator, sprite, props) uses
    that layout, never raw canvas numbers, so changing `SCENE_SCALE`
    resizes the whole scene and props stay at the edges.
  - The scenery comes from `createScenery(layout, place)` in
    `ui/scene.js`: the place's `scenery` pieces (data/places.js), back
    to front. Still pieces next to each other
    are drawn once onto a cached canvas; an animated sprite, or a live
    piece drawn in code (`drawLive`, the Lake's shimmer), is drawn every
    frame in its place in the order. The canvas is cleared each frame
    before the scenery is drawn.
  - The character is redrawn every frame from `poseOf()` (animator) and
    `drawCharacter()` (sprite), painted facing right and mirrored when
    facing left. Its position is snapped to whole character pixels, so it
    moves in crisp 1px steps.
- **Sprites:** any piece of art can be replaced by a pixel-art PNG in
  `assets/sprites/`, one thing at a time; whatever has no PNG stays
  code-drawn.
  - At startup the renderer asks the main process for the PNGs in that
    folder (`sprites:list`) and `loadSprites()` (`ui/assets.js`) loads
    them before anything is drawn, so missing files never cause errors.
    A file that won't load, or is too small for its frames, is skipped
    with a console warning.
  - A file's name without `.png` is its sprite name. Drawing code calls
    `getSprite(name)` and falls back to its code-drawn art on null. The
    names it looks for, and where each is placed, are listed at the top
    of `data/sprites.js`: `sky`, `grass`, `tree`, `yard.house`,
    `home.wall`, `home.floor`, `home.window`, `home.door`, `home.sofa`,
    `lake` (scene pixels, drawn at `SCENE_SCALE`), `goldenApple` (at the
    tree's scale) and
    `character.<body>.<animation>` with an optional `.<expression>`
    (character pixels, at `CHARACTER_SCALE`).
  - Sheets have their frames side by side in one row. `SPRITES` in
    `data/sprites.js` gives `frames`, and optionally `frameWidth`,
    `frameHeight`, `frameDuration`, (characters) `anchorX`, and `scale`
    (whole screen pixels per sprite pixel, to draw one sprite bigger
    than the scene or character scale; it stays anchored at its edge and
    base, or the feet); a still image needs no entry. Scenery and idle-type character animations
    play by time; walk, crawl and jog frames follow the walk cycle
    (`pose.walk.cycle`), so feet stay in step with movement.
  - A character sprite replaces the whole figure for that animation:
    job items, activity props, blinking and breathing are only drawn in
    the code-drawn version. The shadow is drawn either way, and bubbles
    still sit at the code-drawn figure's height.
  - **Adding a sprite:** save the PNG as `assets/sprites/<name>.png`
    (e.g. `tree.png`, `character.adult.idle.png`), drawn at 1 pixel per
    scene or character pixel, and restart the app. For an animation, put
    the frames side by side and add an entry to `SPRITES`, e.g.
    `grass: { frames: 4, frameDuration: 0.5 }`. **Adding a new kind of
    sprite** (something drawing code doesn't look for yet) needs code:
    a new entry in `SCENERY` in `ui/scene.js` for scenery, or a
    `getSprite()` check with a code fallback where the thing is drawn;
    then list the name in `data/sprites.js`.
- **Walking:** a 4-frame cycle (contact, passing, contact with the other
  leg, passing) driven by whole character pixels walked, not time. It
  advances one frame per `STRIDE` pixels. Speed and stride are in
  character pixels, so they scale with `CHARACTER_SCALE` and the feet stay
  planted at any size.
  - While a foot is planted, its reach shrinks 1px per pixel the body
    moves, so it stays fixed on the ground. Keep `STRIDE` equal to the
    feet's reach at contact if you change the leg art.
  - Passing frames bob the body up 1px and lift the swinging foot. Arms
    swing opposite the legs.
  - Standing, the legs are drawn in 3/4 view; walking, in side view from
    the hips. The contact poses put the feet on the standing spots.
  - Before walking off the other way, the character turns and waits a
    `TURN_BEAT`.
- **Infants:** `gaitOf(age)` (animator) picks the gait: crawl until
  `CRAWL_UNTIL_AGE`, toddle until `WALK_FROM_AGE`, then walk
  (`data/infant.js`).
  - Crawling uses the same 4-frame, distance-driven cycle as walking,
    with hands and knees in place of feet: the near hand moves with the
    far knee and the far hand with the near knee, and planted ones stay
    put. Crawlers move slower and only make short trips (`maxTrip`), and
    sit upright between trips, sometimes looking around or wobbling.
  - Toddlers use the `toddler` body (longer legs), take short wobbly
    steps with a hand out for balance, and now and then plop down to sit
    (`PLOP_CHANCE`) before getting up again.
  - Reaching `CRAWL_UNTIL_AGE` while the app runs shows a "First steps!"
    celebration bubble (not when a save loads or years are skipped past
    it).
  - `figureHeight()` (sprite) gives the figure's height for the pose, so
    bubbles sit just above the head whether he's crawling, sitting or
    standing.
- **Sizes and positions** belong in `src/data/` (`layout.js`,
  `characterShapes.js`, `animation.js`, `infant.js`), not in `ui/` code. Colors that are
  pure art (sky, props) may stay in the drawing file.
- **Time:** `game/clock.js` stores in-game time as fractional years and
  advances it on a 250ms timer (not animation frames), so time passes while
  the window is minimized (`backgroundThrottling: false` in `main.js`).
  Gaps over 2s, such as the PC sleeping, are capped. Time does not pass
  while the app is closed. Ages are whole years: `floor(years - bornAt)`.
  Once the life has ended the clock is `stopped` (not saved: it follows
  `endOfLife.ended`) and stands still.
- **Stats and traits:** `character.stats` holds health, happiness and
  smarts (whole numbers, 0-100) and money (whole dollars, never below 0).
  Change them only through `setStat()` / `changeStats()`, which clamp.
  The mouth follows happiness: `expressionOf()` maps it to smile, neutral
  or frown, with thresholds in `data/balance.js`. `character.traits` is
  2-3 trait ids rolled at birth, at most one from each opposite pair in
  `data/traits.js`.
- **Events:** `game/events.js` runs on its own 250ms timer in the renderer,
  so events keep coming (and get auto-decided) while minimized.
  - After each event, the next is due a random `EVENT_GAP_YEARS` later. It
    picks an event whose `stages` (and optional `minAge`/`maxAge`) fit,
    favoring the least-seen and never the same one twice in a row. Babies
    have none.
  - Among the fitting, least-seen events, ones with a choice whose
    `goals` include the active goal are `GOAL_EVENT_WEIGHT` times as
    likely.
  - The waiting event shows a "!" bubble over the head. Clicking it opens
    the card. If no choice is made within `AUTO_DECIDE_SECONDS` (in-game
    time, so fast-forward shortens it), the character picks: each trait in
    a choice's `lean` scores 1, serving the active goal scores
    `GOAL_DECISION_WEIGHT` (enough to always beat traits), plus a random
    whim up to `DECISION_WHIM`. The timer is held while the card is open
    and restarts if it's closed with "x".
  - A choice either has `effects` + `text`, or `outcomes` picked at random
    by `weight`. The result text and the actual stat changes show in a
    text bubble for `RESULT_BUBBLE_SECONDS`. Choices with unmet `needs`
    are disabled and never auto-picked.
  - Events never focus, flash or raise the window, so they don't take
    keyboard focus from other apps.
  - Events with `employed: true` (work events) only fire while the
    character has a job. A choice can carry a `job` change next to its
    `effects`: `raise` (yearly pay, negative for a cut), `leave`
    (layoff) or `switch` (a new job they qualify for). `{job}` in text is
    the job title; `{newJob}` the new one after a switch.
- **Goals:** `game.goals` holds the active goal (Free spirit by default).
  From `GOAL_MIN_AGE` the goal button (flag + goal name, top bar) appears
  and opens the goal menu, which shows the yearly boost and milestones.
  - Each in-game year after a goal is picked, its `stat` gets the next
    `drift` value; picking a goal starts the drift over, so switching back
    and forth gains little or nothing.
  - `updateGoals()` runs on the same 250ms timer as events. It applies the
    drift and checks the active goal's milestones (stat thresholds, years
    with the goal, or variety of events seen). Reached milestones are
    saved with the age they happened, for the life summary (see **End
    of life**), and celebrated with a golden text bubble.
  - Text bubbles (event results, milestones) are queued in the renderer
    and shown one at a time; at most `MAX_QUEUED_BUBBLES` wait, dropping
    the oldest event results first.
  - While idle, the character sometimes (`ACTIVITY_CHANCE`) does the
    goal's activity for a few seconds: reads under the tree, counts coins
    wherever they are, waves with floating hearts, or jogs. This is purely
    visual (`ui/animator.js`, drawn in `ui/sprite.js`).
- **Jobs:** `game.jobs` holds the job held (`current`: id, 0-based
  `level`, `since`, `hiredAge`, `bonus` from raises), whether they've
  `retired`, the `pension`, `nextPayAt`, and the `history` of jobs left
  (ages and last pay, kept for the end-of-life summary).
  - From `JOB_MIN_AGE` (18), an adult without a job gets job offers
    instead of regular events. `game/jobs.js` builds each as an event
    (one choice per job, with the job's `lean` and `goals`), so the event
    engine shows, auto-decides and resolves it like any other. An offer
    lists `OFFER_SIZE` jobs whose first level's `needs` are met, always
    including one that suits the active goal when one qualifies. The
    pending offer saves its job ids (`pending.offer`).
  - `updateJobs()` runs on the 250ms life timer. Every in-game year after
    hiring it pays the level's pay plus `bonus` (never below
    `MIN_PAY_SHARE` of the level's pay), then promotes if they've spent
    `PROMOTION_YEARS` at the level and meet the next level's `needs`.
    Skipped years catch up, with one combined payday bubble.
  - At `RETIRE_AGE` (65) the job ends and a yearly pension starts:
    `PENSION_SHARE` of the last pay, at least `PENSION_MIN`.
  - Paydays, promotions and retirement show as text bubbles (promotions
    and retirement golden).
  - While employed, the character wears or carries the job's `item`
    (drawn in `ui/sprite.js`, standing and walking only). Now and then
    (`WORK_TRIP_CHANCE`) they walk out the nearest side "to work" and
    come back `WORK_AWAY` seconds later. They don't leave while
    something needs them on screen (an event, a bubble, the card open),
    and come back early if it does. Purely visual.
  - The life summary (see **End of life**) lists the jobs held from
    `history` and `current`, and the highest title reached.
- **Places:** the scene is a place (`data/places.js`: id, name, the
  `scenery` pieces it shows back to front, `exits`, and clickable
  `targets`, plus `requires` and `gone`, see **Housing**). Growing up
  there are four: the Lake (`lake`), the Fortune Tree and the Parents'
  Yard (`yard`) side by side (walking off the tree's left edge comes
  into the Lake from its right, off its right edge into the yard from
  its left, and back), and the Parents' Home (`home`), the living room,
  entered through the house's front door. From 18 the parents' places
  are gone and My Yard (`myYard`) is beside the tree, with Home
  (`myHome`, the own living room) once they own the house. The Lake is
  there at every age.
  - A place can have its own feet row (`feetFromBottom`, rows above the
    window bottom; default `FEET_FROM_BOTTOM`) and walking limits
    (`walk: { minX, maxX }`, scene pixels; null keeps `WANDER_MARGIN`).
    `computeLayout()` turns them into `feetY`, `wanderMinX`/`wanderMaxX`
    and `openSides`; the character, shadow, bubbles, the poke hit mask
    and resting all use the layout, so they follow. A side with a limit
    is closed: work trips leave by the other one (`goToWork()` in the
    animator).
  - `game.place` holds the current place's id (saved; a save without one
    or with an unknown one goes to `DEFAULT_PLACE`, the Fortune Tree). A
    new life starts at `NEW_LIFE_PLACE` (the Parents' Home).
  - `placeView(game, id)` (`game/places.js`) is the place as it is now:
    only the scenery that shows (one housing tier prop), the exits to
    places that exist through props that show, and those props'
    targets. `currentPlace()` and `existingPlaces()` use it; routing and
    exits take `game` for the same reason.
  - The renderer builds each place's scene (`computeLayout(width,
    height, place)` with only the props it shows, and `createScenery()`)
    the first time it's shown with that scenery (cached by id and
    pieces), and shows the place's name under the name label ("From >
    To" while travelling).
  - Map changes (moving out, buying a tier, the dev tier buttons): each
    frame the renderer compares the current place's view with the one
    shown (`followMapChanges()`). If it changed, any trip ends; if the
    character had to leave the place, they're put in the new one
    (`placeIn()`), otherwise the new layout is swapped in where they
    stand (`setLayout()`), walking back in if they were past an edge.
  - Exits are `{ to, via }`: `via` is `'left'`/`'right'` (a window edge)
    or a prop id (a door). Each link needs an exit back in the
    destination, which is also where the character comes in.
    `routeBetween()` (`game/places.js`) finds the places on the way.
  - Trips (renderer + animator): `startTrip()` ends busking or resting
    (`leavePlace()`), then the animator walks to the exit
    (`travelTo()`: `TRAVEL.exitPast` beyond the edge, or to the door's
    visit spot). Once there (`hasExited()`), `enterPlace()` switches
    `game.place` (saved) and the scene, and `enterScene()` puts the
    character at the way back in: past the edge, walking `entryWalk` in,
    or standing at the door. The next leg starts at once. Travel ignores
    events and bubbles, works at any age (babies crawl, toddlers still
    plop), and starts from wherever they are (even away at work). Only
    the place reached is saved; closing mid-trip ends it there.
  - The place button (map pin, top bar) opens Go to (`ui/goMenu.js`),
    listing the other places that exist now; it's disabled, and the
    prop click areas hidden, while travelling.
  - Click areas: the renderer puts an invisible no-drag button in
    `#targets` over each of the place's `targets` (the prop's visible
    pixels, `propClickRect()`). Clicking an exit's prop (a house, the
    front door) travels through it; the tree opens its menu, anything
    in `REST_SEATS` (sofa, sleeping bag, tent) the rest menu, and an
    activity's prop (`activityAt()`, the Lake's dock) the activity
    menu.
  - The Lake (`data/lake.js`, `ui/lake.js`): its scenery is `lake`, one
    picture (`assets/sprites/lake.png`, 107 x 80) drawn from the
    window's bottom-left corner instead of sky and grass (code-drawn if
    it's missing); `lake.shimmer`, a live piece; and `lake.dock`, a prop
    with no art of its own (it's in the picture), only the click area
    and the fishing spot as its visit spot. Its numbers are in the
    picture's pixels (x from the left, rows from the top): `DOCK` (the
    click area, x 25-80 around row 68), `FISHING_SPOT_X` (27), the feet
    row (`LAKE_FEET_FROM_BOTTOM`, 12: the dock top and shore, row 68),
    `LAKE_WALK` (from the dock tip, x 25, to the right edge) and
    `SHIMMER`. The shimmer (`shimmerSparkles(seconds)`) is a few
    highlight pixels on the water area, off the dock: each twinkles up
    through its colors and back once per cycle while drifting sideways,
    then shows up somewhere else; positions come from deterministic
    noise, so it's the same every run. The dock is where fishing
    happens (see **Activities and fishing**); `BOBBER_SPOT` is where
    the bobber lands, to the left in the open water.
  - Work trips work the same everywhere (out the nearest side and back).
  - A new place needs an entry in `PLACES` (with exits both ways), any
    new scenery pieces in `SCENERY` (`ui/scene.js`, with code-drawn
    art) and props in `PROPS` (`data/layout.js`), and its sprite names
    in `data/sprites.js`. Place-specific features check the place id
    (`FORTUNE_TREE_PLACE`) or the props it shows (`REST_SEATS`).
- **Yard and Home art:** the Parents' Yard is sky, grass and the house
  (`parents.house`, the old code-drawn house, `ui/props.js`). My Yard is
  sky, grass and one housing tier: the sleeping bag (`yard.sleepingBag`)
  or tent (`yard.tent`), both in `ui/housing.js`, or the house
  (`yard.house`, the same art as the parents' for now). Both living
  rooms (`ui/room.js`) are drawn in the
  house's colors (`HOUSE_COLORS`): striped wallpaper with a baseboard,
  a wooden plank floor (feet on the usual row), a window with curtains
  and a bit of sky, the front door and a red sofa. Props can sit higher
  than the floor (the window) or lower (the sleeping bag) with `base`
  in `PROPS`. Each piece has a sprite name (`parents.house`,
  `yard.sleepingBag`, `yard.tent`, `yard.house`, `home.wall`,
  `home.floor`, `home.window`, `home.door`, `home.sofa`).
- **Resting:** `game.home` holds `resting` and `restMs` (real time
  towards the next gain; saved as `home` from when only the sofa
  existed). Numbers and text in `data/home.js`; logic in
  `game/home.js`.
  - Anything in `REST_SEATS` can be rested on: the sofa (both living
    rooms), the sleeping bag and the tent. A place's first one that
    shows is its rest spot (`restSpotOf()`). Clicking it opens the rest
    menu (`ui/restMenu.js`, titled with the prop's target name): Rest or
    Get up, with progress and health, and in My Yard the next housing
    upgrade (below). Any age can rest.
  - While resting, the animator (`stay` option, mode `'resting'`) walks
    the character to the rest spot's visit spot and lays them on it: the
    pose is `lying` with `activity: 'rest'`, raised `lift` canvas
    pixels so the figure lies on it (`REST_SEATS` scene pixels above
    the prop's base), with z's rising. No wandering, activities or work
    trips.
  - Every `restMinutes(game)` real minutes (`game/housing.js`: the
    parents' sofa before moving out, then the tier's rate) adds
    `REST_HEALTH` health, up to `REST_HEALTH_MAX`, through the same
    real-time life tick as the Fortune Tree (`updateHome()`); resting
    carries on at full health until "Get up". Getting up drops the time
    towards the next gain.
  - Events are frozen while resting, as while busking (below).
  - `settlePlace()` ends busking away from the Fortune Tree and resting
    where there's no rest spot (e.g. a save from elsewhere).
- **Housing:** `game.housing` holds `movedOut` and the `tier` id.
  Numbers and text in `data/housing.js`; logic in `game/housing.js`.
  - Places say when they exist with `requires`: `'parents'` (before
    moving out), `'movedOut'`, or `'tier:<id>'` (that tier or better);
    `gone` is where someone in a place that no longer exists goes
    (`settlePlace()` follows it). The tier props in a place's scenery
    show only at their own tier (`showsPiece()`).
  - `updatePlaces()` runs on the life tick: at `MOVE_OUT_AGE` (also when
    years are skipped past it) `updateHousing()` sets `movedOut`, returns
    the golden "Moving out!" bubble, and the character is settled out of
    the parents' house into My Yard.
  - Tiers (`HOUSING_TIERS`): sleeping bag (free, the start), tent and
    house, each with a `price`, its `prop` in My Yard and `restMinutes`.
    The house's tier unlocks `myHome`.
  - The rest menu shows `upgradeView()`: "Upgrade to <tier> - $<price>",
    disabled with "Need $X more" when they can't afford it. Buying
    (`buyUpgrade()`) gets them up, takes the money, shows a golden
    bubble and sets the tier; the renderer settles them and the yard
    changes at once (map changes, under **Places**).
  - Saves from before housing: adults have moved out (sleeping bag, and
    out of the parents' house), children still live with their parents.
    No bubble for that.
- **Fortune Tree:** `game.fortuneTree` holds `playing`, `sessionMs`
  (real time into the current session), `sessions` (full sessions since
  the last successful pick), `appleReady`, `appleInMs`, and life totals
  for the summary: `sessionsPlayed` and `applesWon`. Numbers and
  text are in `data/fortuneTree.js`; logic in `game/fortuneTree.js`.
  - Clicking the tree (its click area, see **Places**) opens the tree
    menu (`ui/treeMenu.js`), which shares the panels' spot. Under
    `TREE_MIN_AGE` (6) it only says to come back later.
  - Busking: "Play an instrument" sets `playing`. The renderer's life
    tick passes `updateFortuneTree()` the real milliseconds since the
    last tick (capped at 2s, so a sleeping PC doesn't count); game speed
    doesn't change it, and nothing runs while the app is closed. Every
    `SESSION_MINUTES` pays `SESSION_PAY` (a text bubble) and counts a
    session. Stopping drops the unfinished session's time.
  - While playing, the animator (`stay` option, mode `'busking'`) walks
    the character to the tree's visit spot (coming back from work if
    away) and sits them there playing (`activity: 'busk'` in the pose):
    no wandering, activities or work trips, even when something needs
    them on screen. Travelling elsewhere stops busking.
  - Event freeze: while playing (or resting, or doing an activity with
    `freezeEvents`, such as fishing),
    `updateEvents(game, { freeze: true })`
    starts nothing and records `events.frozenAt`. On the first update
    after, `nextAt` and a waiting event's `shownAt` move forward by the
    frozen time, so the wait picks up where it was and events don't pile
    up. A waiting event can still be opened and answered meanwhile (its
    next event is scheduled from `frozenAt`). Goals, pay and jobs carry
    on as normal.
  - The golden apple grows over `APPLE_EVERY_HOURS` real hours, one at a
    time (the timer waits while one is ready), and is drawn on the tree
    (`ui/goldenApple.js`) at `APPLE_SPOT`: the `goldenApple` sprite if
    there is one, else a code-drawn apple with a glint, at the tree's
    scale. Picking succeeds with `PICK_CHANCE` (base + perSession x
    sessions, capped): `APPLE_REWARD` dollars, a golden bubble, and
    `sessions` back to 0. A miss shows "The apple slipped away...".
    Either way the apple is gone and the next one starts growing.
- **End of life:** `game.endOfLife` holds `checkedAge` (the last
  birthday whose ageing and chance have run) and `ended` (null while
  alive; then `{ id, endedOn, at, cause, summary }`). Numbers and text
  in `data/endOfLife.js`; logic in `game/endOfLife.js`.
  - `updateEndOfLife()` runs first on the life tick. On each birthday not
    yet checked (catching up after skipped years) it takes
    `AGEING_LOSS` health from `AGEING_FROM_AGE` (50) by where they live
    (sleeping bag most, house least), then rolls `deathChance(age,
    health)`: 0 before `DEATH.fromAge` (70), rising each year, lower with
    more health, 1 at `DEATH.maxAge` (100). At any time an adult with 0
    health dies. Nobody under `DEATH.minAge` (18) dies, whatever their
    health. An ending found while catching up moves the clock back to
    that year. Tests pass their own `random`.
  - `endLife()` ends it gently: busking or resting stops, a waiting
    event goes, the clock stops, and `lifeSummary()` is stored. After
    that the life tick does nothing (events, goals, jobs, pay, the
    tree's and resting's timers all stand still) and pokes, prop clicks,
    Go to, the goal button and the dev shortcuts are off.
  - The goodbye (renderer, frame loop): any trip ends
    (`stopTravelling()`), the animator's `farewell` stay mode sits the
    character where they are (walking back in if they were out) and
    closes their eyes after `FAREWELL.eyesCloseAfter`; `ui/farewell.js`
    fades the scene to a pale veil over `fadeSeconds`; the soft
    lavender bubble says "{name} drifted off peacefully at {age}." and
    stays. After `summaryAfter` seconds the summary card opens; once
    seen, clicking the bubble opens it again. A save of an ended life
    opens already faded.
  - The summary card (`ui/lifeSummary.js`) shows the life title, name
    and ages, the goal and milestones reached, jobs held and the top
    title, money, the home, golden apples won and fish (caught this
    life, and the collection's count when it ended; lives from before
    fishing have no fish row), and scrolls if needed.
    The title is "The {adjective} {noun}": the adjective from the
    strongest trait (`TRAIT_SCORE`: jobs held that lean to it, the goal),
    the noun from busking (`BUSKER`), else the top job (`JOB_NOUNS`),
    else the goal (`GOAL_NOUNS`).
  - The Book of past lives is its own file (`past-lives.json`, via
    `book:load`/`book:write`), so it outlasts each life. Each ended life
    is added once by id (`recordLife()`), also on load if it was missed;
    at most `BOOK_MAX_LIVES`. The book button (top bar) shows once
    there's a life in it and opens `ui/pastLives.js`: newest first, each
    opening its summary with Back.
  - "Start a new life" (`startNewLife()`) replaces the life in place
    with a newborn at the Parents' Home and restarts the clock. Its
    `options.parent` is the hook for continuing as a child of the life
    that ended; it's ignored for now.
- **Activities and fishing:** place activities are data
  (`PLACE_ACTIVITIES` in `data/activities.js`, format documented there):
  the place and prop, which way the character faces, the minimum age,
  an item to buy first (`{ id, name, price }`, once per life), how long
  it runs (`'untilStopped'` or `{ minutes }`), rewards (`every: {
  minutes, stats }`, `onFinish` stats, or `catches` for fishing),
  `freezeEvents`, the pose's `animation`, and the menu text. A new
  activity is a new entry, a place and prop to do it at, and its
  animation (in `ui/sprite.js`, or a `character.<body>.<animation>`
  sprite); a test adds a fixed-time one with data only. Busking and
  resting keep their own code for now.
  - `game.activities` holds `current` (the running one: `{ id, ms,
    everyMs, fishing }`), `items` bought this life, and per-activity
    `totals` (`sessions`, `caught`, `earned`). `game/activities.js` runs
    it on the real-time life tick (`updateActivities(game, realMs)`, so
    game speed doesn't change it and nothing passes while the app is
    closed); only one runs at a time. `stopActivity()` ends it (for
    catches, selling the bucket) and returns its bubble; `leavePlace()`
    calls it too (trips, the dev Go to and the end of a life sell the
    bucket; the renderer stops it first to show the sale), and
    `settlePlace()` ends an activity away from its place.
  - While one runs the animator stays put (`stay` mode `'doing'`, with
    the pose's `activity` and `facing`): it walks to the prop's visit
    spot, faces that way and stays; no wandering or work trips. Events
    are frozen when `freezeEvents` is set.
  - The activity bar (`#activity-bar`, `game/activityBar.js`): while an
    activity, busking or resting runs, a small bar at the bottom of the
    window (below the feet row, centered) says what's happening (text
    `bar` in `data/activities.js`, `TREE_TEXT.bar`, `REST_TEXT.bar`;
    fishing: "Fishing - 4 fish - $38", busking the session's time,
    resting the health) with a Stop button (`ACTIVITY_BAR_TEXT`).
    `stopFromBar()` stops it as its own menu does (fishing sells the
    bucket and shows the sale). Hidden while travelling and once the
    life has ended; panels open over it.
  - The activity menu (`ui/activityMenu.js`, `#activity-menu`) opens from
    the prop: under `minAge` it says to come back; without the item
    "Buy a fishing rod - $30" (disabled, with "Need $X more", when it's
    too dear); then "Start fishing" / "Stop fishing" with the status
    (what's happening, the bucket and what it's worth); and for fishing
    a "Fish collection" view.
  - Fishing (`game/fishing.js`, `data/fishing.js`): from 6, with a rod,
    at the Lake's dock, facing left. Each cast starts a wait of
    `FISHING_TIMES.biteWait` real seconds (30-180); then a bite: a "!"
    over the head (canvas art like the event "!", with `#bite-bubble`
    over it) for `biteWindow` seconds. Clicking it reels in with the
    click odds (`clickBonus` per rarity: rarer fish more likely);
    ignored, they reel in at normal odds. Reeling takes `reel` seconds,
    then the catch lands in the bucket with a random whole `size` in
    cm in its `FISH` range (none for junk); its value is scaled by up
    to `SIZE_VALUE` (+-20%) by where the size falls in that range, so
    the average stays the same. They hold it up for `show` seconds and
    cast again. `RARITIES` (junk, common, uncommon, rare, legendary)
    have weights tuned to about $4 a real minute when every bite is
    ignored (the sum is in `data/fishing.js`; a test checks it); `FISH`
    are the catches with their values (a number or a [min, max] range)
    and sizes. Stopping sells the bucket: "Sold 3 for $65." While a
    bite's "!" is up it takes the spot over the head (text bubbles and
    the event "!" wait).
  - The catch reveal (`game/catchReveal.js` times it, `ui/catchReveal.js`
    draws it, `data/catchReveal.js` has the numbers, colors and text):
    a landed catch's `reveal` (`{ fish, size, value, isNew, record }`)
    goes to the reveal instead of a bubble. First the suspense
    (`REVEAL_TIMES.suspense`, 0.5s): the bobber jerks at the dock tip
    (`fishingLook()` phase `'land'`, the first part of `show`) and a
    dark silhouette of the fish flashes where the card will be. Then
    the card pops in (scaled with nearest-neighbour, overshooting a
    little): the fish drawn big at a whole-number scale (fitting the
    art, sprite or code-drawn) on light rays in the rarity's color
    (`REVEAL_RARITIES`: junk gray, common green, uncommon blue, rare
    purple, legendary gold), the rarity banner, the name, "57 cm -
    $298", and NEW! (first of its kind) or NEW RECORD! (beat the
    biggest) badges. Rare and legendary get sparkles; legendary also a
    gold flash over the window, slowly turning rays and the longest
    hold. Junk is low-key: gray, "Just an old boot...". It fades after
    its rarity's `hold` (longer for rarer); clicking the card
    (`#reveal-close`, an invisible button) fades it sooner. It never
    focuses the window, fishing carries on behind it, news bubbles and
    the event "!" wait while it's up, and up to `REVEAL_MAX_QUEUED` wait
    their turn. Nothing about it is saved.
  - Drawing (`ui/fishing.js`, after the character): the rod from the hand
    (`fishingHand()` in `ui/sprite.js`, which also draws the arm: out
    holding the rod, or raised with the catch): swung back and up for
    the cast, out while waiting, jiggling at a bite, bent while reeling;
    the line (sagging while waiting) to the bobber at `BOBBER_SPOT`
    (data/lake.js), which flies out in an arc, bobs with ripples, dips
    with a splash at a bite and is pulled toward the dock while reeling;
    jerks at the dock tip as it lands; then the catch held up in front.
    Fish icons are `fish.<id>` sprites or code-drawn (`FISH_ART`), used
    on the scene, on the reveal card and in the collection (unknown
    ones as a plain silhouette, the sprite's shape if there is one, and
    "???"); `fishIconSize()` gives an icon's size.
  - The fish collection (`game.collection`, not part of the life's save)
    is its own file, `collection.json` (`collection:load`/
    `collection:write`), so it lasts across lives: the first catch of
    each kind ever, `{ name, age, on, best }`, with `best` the biggest
    one (`{ size, name, age }`; none for junk). `recordCatch()` returns
    `{ isNew, record, changed }`: a record only when an earlier biggest
    is beaten (a kind first caught before sizes just gets its first
    biggest). The view shows "Biggest: 54 cm (Mia)". The renderer
    loads it at start, keeps it through new lives and saves it when it
    changes.
- **Stats panel:** hovering the name label shows stats, the job (title,
  level, pay; "Looking" or "Retired" with the pension) from age 18, and
  traits; clicking it pins the panel open.
- **Dev settings menu:** a gear button (left of minimize) opens it, but
  only when running from source: `main.js` answers `app:is-dev` with
  `!app.isPackaged`, so a packaged build never shows it.
  - It offers: New life (confirmed in the menu with Yes/No, then replaces
    the life in place and saves over the old one), clock speed (normal,
    fast, very fast; `SPEEDS` in `data/balance.js`), skip ahead +1/+10
    years, trigger a fitting event now (opens its card; a job offer for
    an adult without a job, even while busking), add $1,000, finish the
    busking session now (paid; "Not playing." otherwise), make a golden
    apple ready now, rest one more real minute now ("Rest 1 min": any
    health it earns; "Not resting." otherwise), jump to 18 ("To 18" in
    the Skip row: the clock moves to the 18th birthday and moving out
    follows on the next tick), set the housing tier directly (Sleeping
    bag, Tent, House; ends resting, leaves Home if the house goes; a
    child stays with their parents), Go to any place that exists
    instantly (no walking, the Lake included; ends busking, resting,
    fishing (selling the bucket) and any trip), give a fishing rod, a
    bite now and catch a fish of a chosen rarity now ("Not fishing."
    unless fishing), preview a rarity's reveal card ("Reveal" row: a
    made-up catch from `previewCatch()`, nothing changes), End
    life now (adults only, otherwise a note; plays the goodbye), set
    health (0, 10, 50, 100; 0 ends an adult's life on the next tick), and
    a read-out of stats, traits, goal, job, the tree, the place and
    housing, fishing (the wait, the bucket, fish caught), and the yearly
    ageing and the next birthday's chance (or how
    the life ended). The dev New life doesn't add the old life to the
    Book. Skipping years does nothing once the life has ended. The menu
    scrolls (no scrollbar) if it's taller than the window, and rebuilds
    when the places change.
  - `ui/devMenu.js` only calls the actions it's given; the work lives in
    `game/dev.js`, and the renderer wraps it to keep the screen in step.
    Amounts are in `data/dev.js`.
  - Skipping years doesn't replay events: the character ages, goal
    boosts and paydays (with promotions and retirement) catch up, and at
    most one due event comes up.
  - The event card, the life summary and the goal, tree, rest, Go to,
    Book and dev menus share the same spot, so opening one closes the others (`closePanels()` in
    the renderer).
- **Dev shortcuts** (window focused; these work in any build):
  - Ctrl+Shift+F toggles between normal and fast speed. The label shows
    `>>` for fast and `>>>` for very fast. Speed isn't saved.
  - Ctrl+Shift+M cycles happiness through 80, 50 and 20 (smile, neutral,
    frown).
  - Ctrl+Shift+E starts a fitting event now (if none is waiting).
  - Ctrl+Shift+A starts the active goal's idle activity now.
  - Ctrl+Shift+W sends the character off to work now (with a job).
- **Game vs. visuals:** wandering, blinking, etc. in `ui/animator.js` are
  cosmetic and never saved. Anything that affects the life belongs in
  `game/` and the save.
- **Font:** "Press Start 2P" comes from the `@fontsource/press-start-2p`
  npm package and is linked from `node_modules`, so no network is needed.
  Use it at multiples of 8px.
- **Character pokes:** `data/interaction.js` holds dialogue and all pacing.
  `game/interaction.js` keeps unsaved state outside the game save, uses
  real monotonic milliseconds and `changeStats()`: +1 happiness at most
  every 30 seconds, -1 once on four pokes within three seconds, calm after
  five seconds without a poke. Continued spam gives no more penalties or
  messages. `ui/interaction.js` applies a temporary expression and whole
  character-pixel wiggle without changing the animator. The renderer paints
  a shadow/effect-free hit mask with `drawCharacter(..., hitOnly)` and
  places no-drag DOM runs only over opaque pixels, following each pose and
  sprite frame. Short presses with little pointer movement count as pokes.
  Poke bubbles never queue, yield immediately to news/events, and do not
  hold the character home from work. Event buttons and menus remain above
  the character target.
- **Dragging:** `#app` has `-webkit-app-region: drag`, so the whole window
  background drags the window. Any element that needs clicks (buttons,
  the character) must set `-webkit-app-region: no-drag`.
- **Renderer ↔ main:** the renderer has no Node access. Add new
  capabilities as named IPC channels in `main.js` and expose them through
  `window.shiftLife` in `preload.js`.
- **Saved state:** all four files live in `%APPDATA%\shift-life\`.
  - `window-state.json` holds the window position. It's ignored if it
    would put the window off every connected screen.
  - `save.json` holds the life: `{ version, clock: { years }, character,
    events, goals, jobs, place, fortuneTree, home, housing, endOfLife,
    activities }`.
    `character` includes
    `stats` and `traits`; `events`
    holds `nextAt`, the `pending` event, how often each was `seen`,
    `lastId`, and `frozenAt` (while busking or resting); `goals` holds the `active` goal, `since` and `nextDriftAt`,
    `pastYears` per goal, and reached `milestones` ({ goal, id, age });
    `jobs` is described under **Jobs** above; `place`, `fortuneTree`,
    `home`, `housing`, `endOfLife` and `activities` under **Places**,
    **Fortune Tree**, **Resting**, **Housing**, **End of life** and
    **Activities and fishing**.
    The renderer autosaves every 10s and saves synchronously on
    `beforeunload`, so every way of closing is covered. `main.js` writes
    via a temp file and rename.
  - New optional fields can keep the version if `restore*()` fills in a
    default (as `stats`, `traits`, `events`, `goals`, `jobs`, `place`,
    `fortuneTree`, `home`, `housing`, `endOfLife` and `activities` do (ageing starts
    from the age at load); older saves'
    `mood` becomes happiness). For breaking changes, bump `SAVE_VERSION` in
    `game/save.js` and handle old versions. Right now an unrecognised save
    is replaced by a new life.
  - `past-lives.json` holds the Book of past lives: `{ version, lives:
    [{ id, endedOn, summary }] }`, written the same way. Starting a new
    life keeps it.
  - `collection.json` holds the fish collection: `{ version, fish: {
    <fish id>: { name, age, on, best: { size, name, age } } } }`,
    written the same way and kept across lives (entries from before
    sizes have no `best`).
  - The bucket in `activities.current.fishing` keeps each catch as `{
    id, value, size }` (size null for junk and for catches from before
    sizes).
  - Delete `save.json` to start a new life (the Book and the collection
    stay; delete `past-lives.json` or `collection.json` to clear them).

## Install, run, and test

Requirements: Node.js (LTS or newer) and npm on Windows.

**Windows note:** in PowerShell, call npm as **`npm.cmd`**, not `npm`
(the `npm.ps1` shim is blocked by the execution policy on this machine).
The same goes for `npx` → `npx.cmd`. In Git Bash, plain `npm` works.

```powershell
npm.cmd install      # install dependencies
npm.cmd start        # launch the game (runs `electron .`)
npm.cmd test         # run interaction and end-of-life logic tests (Node 22.7+)
npm.cmd run test:smoke # isolated Electron renderer/click checks
```

The first `npm.cmd start` after a fresh install downloads the Electron
binary, so it takes longer than later starts.

The Electron smoke check uses in-memory saves and never changes the player save.
Before committing, at least launch
the app with `npm.cmd start` and confirm the window opens without errors in
the DevTools console.

## Coding conventions

- **Plain JavaScript.** No TypeScript, UI frameworks, game engines, or
  bundlers unless you **ask the user first**. Prefer built-in Electron, DOM,
  and Canvas APIs over adding dependencies.
- **Keep game data separate from logic.** Events, jobs, names, dialogue, and
  balance numbers go in `src/data/`. Logic in `src/game/` reads that data
  and must not hard-code content. Adding a new event or job should mean
  editing a data file only.
- **Header comment on every new file** saying what the file is for, e.g.:
  ```js
  // goals.js — Tracks player-set goals and updates their progress each tick.
  ```
- **Small, focused changes.** Touch only what the task needs. Don't
  reformat or refactor unrelated code in the same change.
- Keep Electron secure: `contextIsolation: true`, `nodeIntegration: false`
  in the renderer. Expose only what the renderer needs through `preload.js`.

## Workflow rules

1. **One feature per change.** Don't bundle unrelated work together.
2. **Commit after each working feature** with a clear message that says
   what changed and why (e.g. `Add speech-bubble event engine`). Only commit
   code that runs.
3. **Push to GitHub after every commit:** run `git push` right after each
   commit, without asking. The branch is `main`, tracking `origin/main` at
   https://github.com/hamano-dev-008/shift-life. The repo is **public**, so
   never commit secrets, credentials, or personal data.
4. **Keep the docs current.** Update `AGENTS.md` and `README.md` in the same
   change whenever the folder structure, scripts, dependencies, or run/test
   steps change.
5. If a task is ambiguous or would break these rules (new framework, large
   refactor), ask the user before proceeding.
6. **Restart the game after every completed change.** Gracefully close the
   running Shift-Life window so its life saves, then launch `npm.cmd start`
   again and confirm the updated game opens. Do this automatically so the
   player can try the latest changes; avoid leaving duplicate instances.
