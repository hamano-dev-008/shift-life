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

> **Status:** the app shell exists: a floating window showing a placeholder
> pixel scene. Items marked *(planned)* don't exist yet; follow the planned
> layout when adding them, and update this section whenever files are added,
> moved, or removed.

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
│                      restores its position, handles minimize/close IPC
├── preload.js         Exposes window.shiftLife { minimize, close } to the
│                      renderer via contextBridge
├── src/
│   ├── index.html     Renderer page: scene canvas and window buttons
│   ├── styles.css     Rounded frame, drag region, pixelated canvas, buttons
│   ├── renderer.js    Renderer entry point: draws the placeholder scene
│   │                  (dithered sky, grass, pixel text), wires up buttons
│   ├── game/          (planned) Game logic only (no hard-coded content)
│   │   ├── clock.js       Real-time simulation clock / ticks
│   │   ├── character.js   Character state: needs, mood, current activity
│   │   ├── goals.js       Player-set goals and progress
│   │   └── events.js      Event engine: picks and resolves bubble events
│   ├── ui/            (planned) Drawing and interface: sprites, bubbles
│   └── data/          (planned) Pure game data, no logic
│       ├── events.js      Speech-bubble event definitions
│       ├── jobs.js        Jobs/shifts and their effects
│       └── names.js       Name lists
├── assets/
│   └── sprites/       (planned) Pixel-art images
└── test/              (planned) Automated tests
```

How the shell works, for anyone extending it:

- **Rendering:** the scene is drawn on a 160x120 canvas that CSS scales 2x
  with `image-rendering: pixelated`. Draw in canvas pixels at integer
  coordinates. Text goes through `drawPixelText()` in `renderer.js`, which
  removes anti-aliasing.
- **Font:** "Press Start 2P" comes from the `@fontsource/press-start-2p`
  npm package and is linked from `node_modules`, so no network is needed.
  Use it at multiples of 8px.
- **Dragging:** `#app` has `-webkit-app-region: drag`, so the whole window
  background drags the window. Any element that needs clicks (buttons,
  the character later) must set `-webkit-app-region: no-drag`.
- **Renderer ↔ main:** the renderer has no Node access. Add new
  capabilities as named IPC channels in `main.js` and expose them through
  `window.shiftLife` in `preload.js`.
- **Saved state:** the window position is stored in
  `%APPDATA%\shift-life\window-state.json`. It's ignored if it would put
  the window off every connected screen.

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
