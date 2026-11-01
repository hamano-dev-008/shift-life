// preload.js — Exposes a minimal API to the renderer as window.shiftLife
// (window controls and save file access), without giving the page access
// to Node or Electron.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shiftLife', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  loadSave: () => ipcRenderer.invoke('save:load'),
  save: (data) => ipcRenderer.send('save:write', data),
  saveSync: (data) => ipcRenderer.sendSync('save:write-sync', data),
});
