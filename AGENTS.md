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
> 18 (pay, promotions, work events) and retires at 65; the life is
> saved between launches. Items marked
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
│                      restores its position, handles window and save IPC,
│                      lists the PNGs in assets/sprites/, reports dev
│                      runs (!app.isPackaged)
├── preload.js         Exposes window.shiftLife { minimize, close, loadSave,
│                      save, saveSync, isDev, listSprites } to the
│                      renderer via contextBridge
├── src/
│   ├── index.html     Renderer page: scene canvas, label, stats panel,
│   │                  event bubble/card, goal menu, dev menu, text
│   │                  bubble, top-right buttons (goal, gear, -, x)
│   ├── styles.css     Rounded frame, drag region, pixelated canvas, label,
│   │                  stats panel, panels (event card, goal menu, dev
│   │                  menu), top-right buttons, text bubble
│   ├── renderer.js    Renderer entry point (ES module): loads or starts a
│   │                  life, runs clock, events, goals, jobs, autosave,
│   │                  frame loop, text bubble queue, dev menu wiring,
│   │                  dev shortcuts
│   ├── game/          Game logic only (no hard-coded content)
│   │   ├── clock.js       Real-time clock: in-game years, speed
│   │   ├── character.js   Birth (random name/look/traits), stats,
│   │   │                  expression, age, life stage
│   │   ├── events.js      Event engine: scheduling, picking, choices,
│   │   │                  outcomes, goal- and trait-based auto-decide
│   │   ├── goals.js       Active goal, yearly stat drift, milestones,
│   │   │                  the goal menu's view
│   │   ├── jobs.js        Job offers, the job held and its level, yearly
│   │   │                  pay, promotions, job changes, retirement and
│   │   │                  pension, the stats panel's job view
│   │   ├── dev.js         Dev actions: new life, speed, skip years,
│   │   │                  trigger event, add money, read-out (with job)
│   │   └── save.js        Save format (versioned) and load/save calls
│   ├── ui/            Drawing and visual-only behavior
│   │   ├── pixel.js       Low-res layer helpers: paint, outline, scaled draw
│   │   ├── assets.js      Sprite loader (PNGs from assets/sprites/ at
│   │   │                  startup), frame picking, crisp sprite drawing
│   │   ├── scene.js       computeLayout() (data → canvas pixels) and the
│   │   │                  scenery: sky, grass, tree, each a sprite
│   │   │                  or code-drawn; still pieces cached, animated
│   │   │                  sprites drawn every frame
│   │   ├── props.js       Draws the tree in code
│   │   ├── animator.js    Wandering, prop visits, goal activities,
│   │   │                  trips off-screen to work and back,
│   │   │                  turning, the walk cycle, breathing, blinking;
│   │   │                  gaits by age (crawl, toddle, walk), baby
│   │   │                  fidgets, toddler plops
│   │   ├── sprite.js      Draws the character (standing, sitting,
│   │   │                  crawling, toddling) from a sprite sheet where
│   │   │                  one exists, otherwise in code, including
│   │   │                  activity props (book, coins, hearts, sweat) and
│   │   │                  job items (hats, tie, apron, lab coat...); all
│   │   │                  character drawing lives here
│   │   ├── bubble.js      The "!" bubble (canvas art + click target) and
│   │   │                  the text bubble, both following the head
│   │   ├── eventCard.js   The event card: prompt and choice buttons
│   │   ├── goalMenu.js    The goal menu: pick a goal, boost, milestones
│   │   ├── devMenu.js     The dev settings menu (gear; dev runs only)
│   │   └── statsPanel.js  Stats, job and traits panel under the name label
│   └── data/          Pure game data, no logic
│       ├── balance.js     Pacing (minutes per year, clock speeds), mood
│       │                  thresholds, event gap, auto-decide wait, whim,
│       │                  goal weights for decisions and event picks
│       ├── stats.js       Starting stats, stat names and short tags
│       ├── dev.js         Dev menu amounts (skip-ahead years, money)
│       ├── traits.js      Personality trait pairs, how many a newborn gets
│       ├── goals.js       Life goals: stat, yearly drift, activity,
│       │                  milestones (format documented in the file)
│       ├── layout.js      SCENE_SCALE (scene size), CHARACTER_SCALE (the
│       │                  character's own size), ground, feet row, prop
│       │                  edges/sizes/visit spots, margins, bubble size
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
│                          duration, anchor) and the list of sprite names
│                          drawing code looks for
├── assets/
│   └── sprites/       Pixel-art PNGs that replace code-drawn art (empty
│                      for now, apart from a short README)
└── test/              (planned) Automated tests
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
  - The scenery (sky, grass, tree, back to front) comes from
    `createScenery()` in `ui/scene.js`. Still pieces next to each other
    are drawn once onto a cached canvas; an animated sprite is drawn live
    every frame in its place in the order. The canvas is cleared each
    frame before the scenery is drawn.
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
    of `data/sprites.js`: `sky`, `grass`, `tree` (scene pixels,
    drawn at `SCENE_SCALE`) and `character.<body>.<animation>` with an
    optional `.<expression>` (character pixels, at `CHARACTER_SCALE`).
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
    saved with the age they happened, for the end-of-life summary (not
    built yet; there is no end of life yet), and celebrated with a golden
    text bubble.
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
  - There's no end of life yet; when the summary is built, it should
    read the job, level and money from `careerView()` and `history`.
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
    an adult without a job), add $1,000, and a read-out of stats,
    traits, goal and job.
  - `ui/devMenu.js` only calls the actions it's given; the work lives in
    `game/dev.js`, and the renderer wraps it to keep the screen in step.
    Amounts are in `data/dev.js`.
  - Skipping years doesn't replay events: the character ages, goal
    boosts and paydays (with promotions and retirement) catch up, and at
    most one due event comes up.
  - The event card, goal menu and dev menu share the same spot, so
    opening one closes the others.
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
- **Dragging:** `#app` has `-webkit-app-region: drag`, so the whole window
  background drags the window. Any element that needs clicks (buttons,
  the character later) must set `-webkit-app-region: no-drag`.
- **Renderer ↔ main:** the renderer has no Node access. Add new
  capabilities as named IPC channels in `main.js` and expose them through
  `window.shiftLife` in `preload.js`.
- **Saved state:** both files live in `%APPDATA%\shift-life\`.
  - `window-state.json` holds the window position. It's ignored if it
    would put the window off every connected screen.
  - `save.json` holds the life: `{ version, clock: { years }, character,
    events, goals, jobs }`. `character` includes `stats` and `traits`; `events`
    holds `nextAt`, the `pending` event, how often each was `seen`, and
    `lastId`; `goals` holds the `active` goal, `since` and `nextDriftAt`,
    `pastYears` per goal, and reached `milestones` ({ goal, id, age });
    `jobs` is described under **Jobs** above.
    The renderer autosaves every 10s and saves synchronously on
    `beforeunload`, so every way of closing is covered. `main.js` writes
    via a temp file and rename.
  - New optional fields can keep the version if `restore*()` fills in a
    default (as `stats`, `traits`, `events`, `goals` and `jobs` do; older saves'
    `mood` becomes happiness). For breaking changes, bump `SAVE_VERSION` in
    `game/save.js` and handle old versions. Right now an unrecognised save
    is replaced by a new life.
  - Delete `save.json` to start a new life.

## Install, run, and test

Requirements: Node.js (LTS or newer) and npm on Windows.

**Windows note:** in PowerShell, call npm as **`npm.cmd`**, not `npm`
(the `npm.ps1` shim is blocked by the execution policy on this machine).
The same goes for `npx` → `npx.cmd`. In Git Bash, plain `npm` works.

```powershell
npm.cmd install      # install dependencies
npm.cmd start        # launch the game (runs `electron .`)
npm.cmd test         # run the test suite (not set up yet)
```

The first `npm.cmd start` after a fresh install downloads the Electron
binary, so it takes longer than later starts.

There are no tests yet. When you add the first ones, wire them up to
`npm.cmd test` and update this section. Before committing, at least launch
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
