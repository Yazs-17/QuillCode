// Type definitions for Electron API exposed via preload script

export interface ElectronConfig {
  dataPath: string;
  aiMode: 'ollama' | 'byok' | 'disabled';
  ollamaEndpoint: string;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  firstRun: boolean;
}

export interface AppPaths {
  userData: string;
  documents: string;
  home: string;
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export interface DownloadProgress {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export interface ElectronAPI {
  // Configuration
  getConfig: () => Promise<ElectronConfig>;
  saveConfig: (config: Partial<ElectronConfig>) => Promise<boolean>;
  isFirstRun: () => Promise<boolean>;
  completeFirstRun: () => Promise<boolean>;

  // Dialogs
  selectDirectory: () => Promise<string | null>;

  // App info
  getPaths: () => Promise<AppPaths>;
  getVersion: () => Promise<string>;

  // Auto updater
  checkForUpdates: () => Promise<any>;
  downloadAndInstall: () => void;

  // Event listeners
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => void;
  onUpdateNotAvailable: (callback: () => void) => void;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
  onUpdateDownloaded: (callback: (info: UpdateInfo) => void) => void;
  onUpdateError: (callback: (error: string) => void) => void;

  // Cleanup
  removeAllListeners: (channel: string) => void;

  // Platform info
  platform: NodeJS.Platform;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
