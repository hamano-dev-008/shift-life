// preload.js — Exposes a minimal window-control API to the renderer as
// window.shiftLife, without giving the page access to Node or Electron.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shiftLife', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
});
