const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (content) => ipcRenderer.invoke('save-file-dialog', content),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  onMenuEvent: (callback) => ipcRenderer.on('menu-event', callback),
  onOpenFileA: (callback) => ipcRenderer.on('open-file-a', callback),
  onOpenFileB: (callback) => ipcRenderer.on('open-file-b', callback),
  onChangeTheme: (callback) => ipcRenderer.on('change-theme', callback),
  onChangeDiffMode: (callback) => ipcRenderer.on('change-diff-mode', callback),
  onToggleLineNumbers: (callback) => ipcRenderer.on('toggle-line-numbers', callback),
  onToggleSyntaxHighlighting: (callback) => ipcRenderer.on('toggle-syntax-highlighting', callback),
  onSaveDiff: (callback) => ipcRenderer.on('save-diff', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
