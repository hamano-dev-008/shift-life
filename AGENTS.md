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

> **Status:** the project is just starting. The layout below is the
> **planned** structure. Follow it when adding files, and update this section
> to match reality whenever files are added, moved, or removed.

```
Shift-Life/
├── AGENTS.md          Shared agent instructions (this file)
├── CLAUDE.md          Imports AGENTS.md for Claude Code
├── README.md          Player/developer-facing overview and run steps
├── .gitignore         Keeps node_modules, build output, and OS files out of git
├── package.json       npm scripts and dependencies (Electron)
├── main.js            Electron main process: creates the frameless,
│                      transparent, always-on-top window; app lifecycle
├── preload.js         Safe bridge (contextBridge) between main and renderer
├── src/
│   ├── index.html     Renderer page that hosts the character canvas
│   ├── renderer.js    Entry point for the renderer: starts the game loop
│   ├── game/          Game logic only (no hard-coded content)
│   │   ├── clock.js       Real-time simulation clock / ticks
│   │   ├── character.js   Character state: needs, mood, current activity
│   │   ├── goals.js       Player-set goals and progress
│   │   └── events.js      Event engine: picks and resolves bubble events
│   ├── ui/            Drawing and interface: sprites, speech bubbles
│   └── data/          Pure game data, no logic
│       ├── events.js      Speech-bubble event definitions
│       ├── jobs.js        Jobs/shifts and their effects
│       └── names.js       Name lists
├── assets/
│   └── sprites/       Pixel-art images
└── test/              Automated tests
```

## Install, run, and test

Requirements: Node.js (LTS or newer) and npm on Windows.

**Windows note:** in PowerShell, call npm as **`npm.cmd`**, not `npm`
(the `npm.ps1` shim is blocked by the execution policy on this machine).
The same goes for `npx` → `npx.cmd`. In Git Bash, plain `npm` works.

```powershell
npm.cmd install      # install dependencies
npm.cmd start        # launch the game (runs `electron .`)
npm.cmd test         # run the test suite
```

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
