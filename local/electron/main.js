const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Configuration file path
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

// Default configuration
const DEFAULT_CONFIG = {
  dataPath: path.join(app.getPath('userData'), 'data'),
  aiMode: 'disabled', // 'ollama', 'byok', 'disabled'
  ollamaEndpoint: 'http://localhost:11434',
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-3.5-turbo',
  firstRun: true
};

let mainWindow;
let config = { ...DEFAULT_CONFIG };

// Load configuration
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
    config = { ...DEFAULT_CONFIG };
  }
  return config;
}

// Save configuration
function saveConfig(newConfig) {
  try {
    config = { ...config, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save config:', error);
    return false;
  }
}

// Ensure data directory exists
function ensureDataDirectory() {
  if (!fs.existsSync(config.dataPath)) {
    fs.mkdirSync(config.dataPath, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
function setupIpcHandlers() {
  // Get configuration
  ipcMain.handle('config:get', () => {
    return loadConfig();
  });

  // Save configuration
  ipcMain.handle('config:save', (event, newConfig) => {
    return saveConfig(newConfig);
  });

  // Check if first run
  ipcMain.handle('config:isFirstRun', () => {
    return config.firstRun;
  });

  // Mark first run complete
  ipcMain.handle('config:completeFirstRun', () => {
    return saveConfig({ firstRun: false });
  });

  // Select directory dialog
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: '选择数据存储目录'
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Get app paths
  ipcMain.handle('app:getPaths', () => {
    return {
      userData: app.getPath('userData'),
      documents: app.getPath('documents'),
      home: app.getPath('home')
    };
  });

  // Check for updates
  ipcMain.handle('updater:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return result;
    } catch (error) {
      console.error('Update check failed:', error);
      return null;
    }
  });

  // Download and install update
  ipcMain.handle('updater:downloadAndInstall', () => {
    autoUpdater.downloadUpdate();
  });

  // Get app version
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });
}

// Auto updater events
function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:update-available', info);
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:update-not-available');
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:download-progress', progress);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('updater:update-downloaded', info);
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('Auto updater error:', error);
    if (mainWindow) {
      mainWindow.webContents.send('updater:error', error.message);
    }
  });
}

// App lifecycle
app.whenReady().then(() => {
  loadConfig();
  ensureDataDirectory();
  setupIpcHandlers();
  setupAutoUpdater();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173' && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
    }
  });
});
