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

> **Status:** a pixel character is born, wanders the window, and ages in
> real time, and the life is saved between launches. Items marked
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
│                      restores its position, handles window and save IPC
├── preload.js         Exposes window.shiftLife { minimize, close, loadSave,
│                      save, saveSync } to the renderer via contextBridge
├── src/
│   ├── index.html     Renderer page: scene canvas, label, window buttons
│   ├── styles.css     Rounded frame, drag region, pixelated canvas, label,
│   │                  buttons
│   ├── renderer.js    Renderer entry point (ES module): loads or starts a
│   │                  life, runs clock, autosave, frame loop, dev shortcuts
│   ├── game/          Game logic only (no hard-coded content)
│   │   ├── clock.js       Real-time clock: in-game years, fast-forward
│   │   ├── character.js   Birth (random name/look), mood and expression,
│   │   │                  age, life stage
│   │   ├── save.js        Save format (versioned) and load/save calls
│   │   ├── goals.js       (planned) Player-set goals and progress
│   │   └── events.js      (planned) Event engine for bubble events
│   ├── ui/            Drawing and visual-only behavior
│   │   ├── pixel.js       Low-res layer helpers: paint, outline, scaled draw
│   │   ├── scene.js       Backdrop: dithered sky, grass, props (drawn once)
│   │   ├── props.js       Draws the house and tree
│   │   ├── animator.js    Wandering, prop visits, facing, walk frames,
│   │   │                  breathing, blinking
│   │   └── sprite.js      Draws the character in code (all character
│   │                      drawing lives here, to swap for sprite sheets)
│   └── data/          Pure game data, no logic
│       ├── balance.js     Pacing (minutes per year, fast-forward), default
│       │                  mood and expression thresholds
│       ├── layout.js      Scene size, ground, feet row, sprite scale, prop
│       │                  positions/sizes/visit spots, wander bounds
│       ├── characterShapes.js  Body proportions per life stage
│       ├── animation.js   Walk speeds, stride length, pause and blink timing,
│       │                  visit chance
│       ├── lifeStages.js  Life stages and the age each one starts at
│       ├── names.js       Names a newborn can get
│       ├── appearance.js  Skin, hair, hair style, shirt palettes; fixed
│       │                  character colors (elder hair, clothes, eyes,
│       │                  mouth, outline, shadow)
│       ├── events.js      (planned) Speech-bubble event definitions
│       └── jobs.js        (planned) Jobs/shifts and their effects
├── assets/
│   └── sprites/       (planned) Pixel-art images
└── test/              (planned) Automated tests
```

How it works, for anyone extending it:

- **Modules:** the renderer uses native ES modules (`<script type="module">`
  and relative `import`s with `.js` extensions), with no bundler.
  `main.js` and `preload.js` are CommonJS.
- **Rendering:** the scene is drawn on a 160x120 canvas that CSS scales 2x
  with `image-rendering: pixelated`.
  - Sky and grass are painted in canvas pixels.
  - The character and props are painted on small offscreen layers in
    sprite pixels (`ui/pixel.js`), given a 1px outline, then drawn at
    `SPRITE_SCALE` (2x) with nearest-neighbour. Never smooth or use
    non-integer scales.
  - The backdrop with its props is drawn once and copied in every frame.
    The character is redrawn every frame from `poseOf()` (animator) and
    `drawCharacter()` (sprite), painted facing right and mirrored when
    facing left.
- **Sizes and positions** belong in `src/data/` (`layout.js`,
  `characterShapes.js`, `animation.js`), not in `ui/` code. Colors that are
  pure art (sky, props) may stay in the drawing file.
- **Time:** `game/clock.js` stores in-game time as fractional years and
  advances it on a 250ms timer (not animation frames), so time passes while
  the window is minimized (`backgroundThrottling: false` in `main.js`).
  Gaps over 2s, such as the PC sleeping, are capped. Time does not pass
  while the app is closed. Ages are whole years: `floor(years - bornAt)`.
- **Mood:** `character.mood` (0-100, saved) is a placeholder until events
  affect it. `expressionOf()` maps it to the mouth: smile, neutral, or frown,
  with thresholds in `data/balance.js`.
- **Dev shortcuts** (window focused):
  - Ctrl+Shift+F toggles fast-forward, shown as `>>` in the label. It
    isn't saved.
  - Ctrl+Shift+M cycles mood through 80, 50 and 20 (smile, neutral, frown).
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
  - `save.json` holds the life: `{ version, clock: { years }, character }`.
    The renderer autosaves every 10s and saves synchronously on
    `beforeunload`, so every way of closing is covered. `main.js` writes
    via a temp file and rename.
  - New optional fields can keep the version if `restore*()` fills in a
    default (as `mood` does). For breaking changes, bump `SAVE_VERSION` in
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
3. **Keep the docs current.** Update `AGENTS.md` and `README.md` in the same
   change whenever the folder structure, scripts, dependencies, or run/test
   steps change.
4. If a task is ambiguous or would break these rules (new framework, large
   refactor), ask the user before proceeding.
