# Shift-Life

A cozy idle desktop-companion life sim for Windows.

A small pixel character lives in a floating, always-on-top window on your
desktop. Their life runs in real time: they work, eat, sleep, and go about
their day while you do yours. You don't control everything; you nudge them
by setting goals and answering the speech-bubble events that pop up.

Built with Electron and plain JavaScript.

## Status

Early development. The app is not runnable yet; the steps below describe
how it will work once `package.json` and the Electron entry point exist.

## Requirements

- Windows
- Node.js (LTS or newer) and npm

## Install and run

In PowerShell, use `npm.cmd` instead of `npm`:

```powershell
npm.cmd install      # install dependencies
npm.cmd start        # launch the game
npm.cmd test         # run the tests
```

In Git Bash, plain `npm` works.

## Project layout

See [AGENTS.md](AGENTS.md) for the folder structure, coding conventions,
and workflow rules. It is written for AI coding agents but applies to human
contributors too.
