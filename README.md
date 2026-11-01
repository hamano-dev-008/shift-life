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
- A pixel character is born with a random name and look. They wander the
  grass between a little house and a tree, sometimes stopping by one for
  a moment, with a two-frame walk, breathing and blinking. Their face
  smiles, looks neutral or frowns depending on mood (a placeholder value
  for now).
- Life runs in real time: one in-game year every 3 real minutes. The
  character grows from baby to child, teen, adult, and elder (grey hair),
  and the top-left label shows their name and age.
- The life is saved, so closing and reopening continues it. Time doesn't
  pass while the app is closed.

No goals or events yet.

**Scene size:** `SCENE_SCALE` in `src/data/layout.js` sets how big
everything is drawn (whole numbers; 3 by default, try 2 or 4).

**For testing:** with the window focused, Ctrl+Shift+F toggles
fast-forward (about one year every 5 seconds; the label shows `>>`), and
Ctrl+Shift+M cycles the mood (smile, neutral, frown). To start a new life,
close the app and delete `%APPDATA%\shift-life\save.json`.

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
takes a little longer. There are no tests yet.

## Project layout

See [AGENTS.md](AGENTS.md) for the folder structure, coding conventions,
and workflow rules. It is written for AI coding agents but applies to human
contributors too.
