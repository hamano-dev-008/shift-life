# AGENTS.md — Shift-Life

Rules for every AI coding agent on this project (Codex, Claude Code,
Cursor, Copilot). `CLAUDE.md` imports this file. Keep it short: rules and
a map live here; how each system works lives in `docs/`.

## The game

A cozy idle desktop-companion life sim for Windows, built with Electron and
plain JavaScript. A pixel character lives in a small floating, always-on-top
window and lives a whole life in real time. The player nudges (goals,
speech-bubble events, clicking places) rather than controlling everything,
and mostly watches while doing other work.

## Where things are

- `main.js`, `preload.js`: Electron main process and the safe bridge.
- `src/game/`: game logic only. No drawing, no hard-coded content.
- `src/ui/`: drawing and visual behavior. No game rules.
- `src/data/`: all content and every tunable number. No logic.
- `assets/sprites/`: pixel-art PNGs; a missing PNG falls back to code art.
- `test/`: logic tests and the Electron smoke test.
- `docs/architecture.md`: how each system works (places, events, jobs,
  activities, fishing, farm, weather, parallax, saving). Read the section
  you're touching before changing it.

## Run and test

PowerShell on this machine: always `npm.cmd` / `npx.cmd`, never `npm`
(the `npm.ps1` shim is blocked by the execution policy). In Git Bash,
plain `npm` works.

```powershell
npm.cmd install        # install dependencies
npm.cmd start          # launch the game
npm.cmd test           # logic tests
npm.cmd run test:smoke # Electron smoke test with real mouse clicks
node --check <file>    # syntax-check every edited script or test file
```

Put text that may contain apostrophes ("the tree's") in backticks or double
quotes, never single quotes. A syntax error in `test/smoke.cjs` makes
Electron show an error dialog and hang instead of failing.

## Workflow

1. One feature or fix per change.
2. Before committing: `node --check` edited files, `npm.cmd test`, and
   `npm.cmd run test:smoke` if anything visible or clickable changed.
   All must pass. Never commit failing or skipped tests.
3. Commit with a clear message saying what changed and why, then
   `git push` straight away. Branch `main`. The repo is public: never
   commit secrets or personal data.
4. Restart the game after each change so the player can try it. Never let
   a new copy open on top of an old one. From the project folder:
   ```powershell
   $exe = (Resolve-Path 'node_modules\electron\dist\electron.exe').Path
   $running = { Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $exe } }
   & $running | ForEach-Object { $null = $_.CloseMainWindow() }
   $until = (Get-Date).AddSeconds(5)
   while ((& $running) -and (Get-Date) -lt $until) { Start-Sleep -Milliseconds 250 }
   & $running | Stop-Process -Force
   npm.cmd start   # in the background
   ```
   Don't do this while the smoke test is running (same `electron.exe`).
5. Update `docs/architecture.md` (and this file only if a rule or the map
   changed) in the same change.

## When to ask the player

- **Ask first** about anything the player will see or feel: gameplay,
  balance and prices, pacing, art style, layout, wording, what a feature
  should do. Offer 2-4 concrete options with a recommendation.
- **Decide yourself** on technical details: structure, naming, algorithms,
  tests, refactors needed by the task. Mention notable choices in the
  final summary.
- **Always ask** before adding a dependency, framework, build step, or a
  large refactor, and before deleting or redrawing existing art.

## Anti-slop rules

### Code
- Plain JavaScript, built-in Electron, DOM and Canvas APIs. No TypeScript,
  frameworks, game engines or bundlers.
- Keep Electron secure: `contextIsolation: true`, `nodeIntegration: false`.
  The renderer gets new abilities only as named IPC channels in `main.js`
  exposed through `preload.js`.
- Write the simplest code that does the job. No speculative options,
  abstraction layers, factories or "future-proofing" nobody asked for.
- Touch only what the task needs. No drive-by reformatting or renames.
- No dead code, commented-out code, unused exports, or leftover debug logs.
- Don't copy-paste a block a third time; extract a small helper instead.
- Keep files focused. If a file passes ~500 lines, ask whether to split.
- Every new file starts with a one-line header comment saying its job.
- Numbers and text go in `src/data/`, never inline in logic or drawing.

### Comments and docs
- Comments explain *why*, not *what* the next line obviously does.
- No restating the code, no filler ("This function is responsible for..."),
  no changelog-style comments ("Added X", "Fixed Y"). Git holds history.
- Docs are short, specific and current. Delete outdated text instead of
  adding a correction next to it. No marketing tone, no emoji.
- Commit messages: one plain summary line, then brief detail if needed.

### Art and UI
- Pixel art only, crisp: whole-number scales, nearest-neighbour, whole-pixel
  positions. Never blur or smooth (only the catch card's pop-in is briefly
  fractional). Scales: scenery `SCENE_SCALE` (3), characters
  `CHARACTER_SCALE` (2); exceptions: Fortune Tree and apple (5), catch card
  fish (up to 6). Nothing new at another scale without asking.
- Art matches the existing look: warm, cozy palette; 1-pixel dark outline on
  props and characters; limited colors; flat colors with simple shading.
- AI-generated art must be cleaned before use: exact size, reduced palette,
  hard edges, transparent background, aligned to the place's feet row.
- UI uses the existing pixel style (Press Start 2P at multiples of 8px,
  existing panel look). No generic web-app styling, gradients-for-the-sake-
  of-it, or default browser controls.
- Every menu fits the window, has a close X, and never covers what it
  doesn't need to.

### Honest progress
- Only say something works after running it and checking. Report exactly
  what was tested and what wasn't.
- Never weaken, skip or delete a test to make it pass. Fix the cause.
  A flaky test is a bug: find why.
- Tests must check real behavior: real mouse clicks at screen coordinates
  (`sendInputEvent`), not `element.click()`; check what's actually on top
  with `elementFromPoint`.
- If something is unfinished, broken, or a workaround, say so plainly in
  the final message. No "should work" without evidence.
- Work isn't done until it's committed, pushed and the game restarted.

## Game design rules

### Cozy tone
- Never punishing or stressful. Nothing harsh: no starving, dying animals,
  lost progress, debt spirals, or scary events.
- Life's end is gentle. Setbacks are small and recoverable.
- Nothing nags. Ignored events get decided by the character.

### Player first
- Never steal focus, flash the taskbar, or raise the window.
- Everything running can be stopped (activity bar Stop, menus, settings).
- Intense or optional effects get a setting (e.g. lightning flashes,
  parallax, work trips, the character choosing activities).
- Activities only start once the character reaches the spot.
- The character never leaves the window except on work trips or travel.
- Clicks must always reach what's under the pointer. Never use
  `-webkit-app-region`; window dragging is done in JS.

### Economy (targets in real hours of running, about 8 hours a day)

These are the official targets, and the game is built to them
(`test/economy.test.mjs` checks them).

- One life lasts about a month: childhood ~1 real hour per year,
  adulthood ~4 hours per year, old age ~3 hours per year.
- Entry job about $25 per real hour, top jobs about $120.
- Side income stays below a career: fishing about $12/h, busking about $5/h.
- Tent after about 1 real day of entry work; house after about 1 week.
- Money must always have something worth spending on. New income sources
  need a matching sink.
- Any new reward or price comes with a test that checks it against these
  targets, and a comment in `src/data/` saying what it targets.
