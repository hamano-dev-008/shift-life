// main.js — Electron main process: creates the floating, frameless,
// always-on-top companion window, remembers where the player left it,
// reads/writes the game save file for the renderer, and tells it whether
// it's running from source (for developer settings).

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');

const WINDOW_WIDTH = 320;
const WINDOW_HEIGHT = 240;

function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function saveFile() {
  return path.join(app.getPath('userData'), 'save.json');
}

// Returns the saved { x, y }, or {} to let Electron center the window.
function loadPosition() {
  try {
    const { x, y } = JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
    if (Number.isInteger(x) && Number.isInteger(y) && isOnScreen(x, y)) {
      return { x, y };
    }
  } catch {
    // No saved state yet, or it's unreadable: use the default position.
  }
  return {};
}

// True if the window's center lands inside a display's work area, so a
// position saved on a since-disconnected monitor isn't reused.
function isOnScreen(x, y) {
  const cx = x + WINDOW_WIDTH / 2;
  const cy = y + WINDOW_HEIGHT / 2;
  return screen.getAllDisplays().some(({ workArea: a }) =>
    cx >= a.x && cx < a.x + a.width && cy >= a.y && cy < a.y + a.height);
}

function savePosition(win) {
  // A minimized window reports an off-screen position on Windows.
  if (win.isMinimized()) return;
  const [x, y] = win.getPosition();
  try {
    fs.writeFileSync(stateFile(), JSON.stringify({ x, y }));
  } catch (err) {
    console.error('Could not save window position:', err);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    ...loadPosition(),
    title: 'Shift-Life',
    frame: false,
    transparent: true, // lets the CSS rounded corners show through
    hasShadow: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // Keep timers running at full rate while minimized so life goes on.
      backgroundThrottling: false,
    },
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.on('moved', () => savePosition(win));
  win.on('close', () => savePosition(win));
}

ipcMain.on('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.on('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

// True when running from source (npm start) rather than a packaged build;
// the renderer only shows developer settings then.
ipcMain.handle('app:is-dev', () => !app.isPackaged);

// Returns the parsed save, or null if there is none or it can't be read.
ipcMain.handle('save:load', () => {
  try {
    return JSON.parse(fs.readFileSync(saveFile(), 'utf8'));
  } catch {
    return null;
  }
});

// Writes to a temp file first so a crash mid-write can't corrupt the save.
function writeSave(data) {
  const file = saveFile();
  try {
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(data));
    fs.renameSync(`${file}.tmp`, file);
  } catch (err) {
    console.error('Could not write save:', err);
  }
}

ipcMain.on('save:write', (event, data) => writeSave(data));

ipcMain.on('save:write-sync', (event, data) => {
  writeSave(data);
  event.returnValue = true;
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
