const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Configuration
  getConfig: () => ipcRenderer.invoke('config:get'),
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  isFirstRun: () => ipcRenderer.invoke('config:isFirstRun'),
  completeFirstRun: () => ipcRenderer.invoke('config:completeFirstRun'),

  // Dialogs
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),

  // App info
  getPaths: () => ipcRenderer.invoke('app:getPaths'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Auto updater
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadAndInstall: () => ipcRenderer.invoke('updater:downloadAndInstall'),

  // Event listeners for updater
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('updater:update-available', (event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('updater:update-not-available', () => callback());
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('updater:download-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('updater:update-downloaded', (event, info) => callback(info));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('updater:error', (event, error) => callback(error));
  },

  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Platform info
  platform: process.platform,
  isElectron: true
});
