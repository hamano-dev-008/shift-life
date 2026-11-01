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
  a moment. They stroll with a four-frame walk (feet planted, arms
  swinging, a small bounce each step) and breathe and blink while
  standing. Their face smiles, looks neutral or frowns depending on how
  happy they are.
- Each character has stats (health, happiness, smarts, money) and is born
  with 2-3 personality traits (bold or careful, social or shy, curious or
  lazy). Hover the name label to see them; click it to keep the panel open.
- Life events: about once or twice a year, a "!" bubble pops up over the
  character's head. Click it to see what's going on and pick what they do.
  Some choices are a gamble. If you don't answer within about a minute,
  they decide for themselves based on their traits, and a little speech
  bubble tells you what they did. Events never steal focus from your other
  windows. There are 18 starter events across childhood, teen years,
  adulthood and old age.
- Life goals: from age 6, the flag button in the top bar opens the goal
  menu. Pick Scholar, Fortune, Heart, Healthy or Free spirit. The goal's
  stat gets a small boost every year, growing the longer you stick with
  it (switching starts it over). When the character decides an event on
  their own, the goal comes before their traits, and events that suit
  the goal come up a bit more often. Each goal has milestones, celebrated
  with a golden bubble, and the character sometimes does a goal activity
  while idle: reading under the tree, counting coins by the house, waving,
  or jogging.
- Life runs in real time: one in-game year every 3 real minutes. The
  character grows from baby to child, teen, adult, and elder (grey hair),
  and the top-left label shows their name and age.
- The life is saved, so closing and reopening continues it. Time doesn't
  pass while the app is closed.

**Scene size:** `SCENE_SCALE` in `src/data/layout.js` sets how big
everything is drawn (whole numbers; 3 by default, try 2 or 4).

**For testing:** with the window focused, Ctrl+Shift+F toggles
fast-forward (about one year every 5 seconds; the label shows `>>`),
Ctrl+Shift+M cycles happiness (smile, neutral, frown), Ctrl+Shift+E
starts an event right away (children and older only), and Ctrl+Shift+A
starts the goal's idle activity. To start a new life, close the app and
delete `%APPDATA%\shift-life\save.json`.

**Adding events and goals:** add an entry to `src/data/events.js` or
`src/data/goals.js`; each file describes its format at the top. Event
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
takes a little longer. There are no tests yet.

## Project layout

See [AGENTS.md](AGENTS.md) for the folder structure, coding conventions,
and workflow rules. It is written for AI coding agents but applies to human
contributors too.
