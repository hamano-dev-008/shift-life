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
  grass around a big tree in the middle, sometimes stopping by it for
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
- Babies crawl on hands and knees in short trips and sit up in between,
  looking around and wobbling. At 3 they take their first steps (with a
  little celebration) and toddle with arms out, sometimes plopping down
  to sit; from 4 they walk normally. Crawl and toddle speeds and the
  ages are in `src/data/infant.js`.
- Life runs in real time: one in-game year every 3 real minutes. The
  character grows from baby to child, teen, adult, and elder (grey hair),
  and the top-left label shows their name and age.
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
$1,000, and see the character's stats, traits, goal and job. It's hidden
in packaged builds.

Keyboard shortcuts (window focused): Ctrl+Shift+F toggles fast speed (the
label shows `>>`), Ctrl+Shift+M cycles happiness (smile, neutral,
frown), Ctrl+Shift+E starts an event right away (children and older
only), Ctrl+Shift+A starts the goal's idle activity, and Ctrl+Shift+W
sends the character off to work (if they have a job). You can also
start a new life by closing the app and deleting
`%APPDATA%\shift-life\save.json`.

**Adding sprites:** every graphic is drawn in code for now, but any of
them can be replaced by your own pixel art, one at a time, without
code. Save a PNG in `assets/sprites/` named after what it replaces:
`sky.png`, `grass.png`, `tree.png`, or
`character.<body>.<animation>.png` (for example
`character.adult.walk.png`; bodies are baby, toddler, child, teen,
adult, elder; animations are idle, walk, sit, crawl, read, coins, wave,
jog). Draw at 1 pixel per game pixel: the game scales it up crisply
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
takes a little longer. There are no tests yet.

## Project layout

See [AGENTS.md](AGENTS.md) for the folder structure, coding conventions,
and workflow rules. It is written for AI coding agents but applies to human
contributors too.
