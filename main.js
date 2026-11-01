// main.js — Electron main process: creates the floating, frameless,
// always-on-top companion window and remembers where the player left it.

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');

const WINDOW_WIDTH = 320;
const WINDOW_HEIGHT = 240;

function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
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

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
