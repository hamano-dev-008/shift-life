// preload.js — Exposes a minimal API to the renderer as window.shiftLife
// (window controls, save file, Book of past lives and fish collection
// access, the sprite
// file list, and whether it's a dev run), without giving the page access
// to Node or Electron.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shiftLife', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  loadSave: () => ipcRenderer.invoke('save:load'),
  save: (data) => ipcRenderer.send('save:write', data),
  saveSync: (data) => ipcRenderer.sendSync('save:write-sync', data),
  loadBook: () => ipcRenderer.invoke('book:load'),
  saveBook: (data) => ipcRenderer.send('book:write', data),
  loadCollection: () => ipcRenderer.invoke('collection:load'),
  saveCollection: (data) => ipcRenderer.send('collection:write', data),
  isDev: () => ipcRenderer.invoke('app:is-dev'),
  listSprites: () => ipcRenderer.invoke('sprites:list'),
});
