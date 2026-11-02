// preload.js — Exposes a minimal API to the renderer as window.shiftLife
// (window controls and dragging, save file, Book of past lives, fish collection
// and settings access, the sprite
// file list, and whether it's a dev run), without giving the page access
// to Node or Electron.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shiftLife', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  getPosition: () => ipcRenderer.invoke('window:get-position'),
  setPosition: (x, y) => ipcRenderer.send('window:set-position', x, y),
  endDrag: () => ipcRenderer.send('window:drag-end'),
  loadSave: () => ipcRenderer.invoke('save:load'),
  save: (data) => ipcRenderer.send('save:write', data),
  saveSync: (data) => ipcRenderer.sendSync('save:write-sync', data),
  loadBook: () => ipcRenderer.invoke('book:load'),
  saveBook: (data) => ipcRenderer.send('book:write', data),
  loadCollection: () => ipcRenderer.invoke('collection:load'),
  saveCollection: (data) => ipcRenderer.send('collection:write', data),
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (data) => ipcRenderer.send('settings:write', data),
  isDev: () => ipcRenderer.invoke('app:is-dev'),
  listSprites: () => ipcRenderer.invoke('sprites:list'),
});
