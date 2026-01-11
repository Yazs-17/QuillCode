import { ref, computed, onMounted } from 'vue';
import type { ElectronConfig, AppPaths } from '../types/electron';

/**
 * Composable for accessing Electron API features
 */
export function useElectron() {
  const isElectron = computed(() => !!window.electronAPI?.isElectron);
  const platform = computed(() => window.electronAPI?.platform || 'unknown');
  
  const config = ref<ElectronConfig | null>(null);
  const appPaths = ref<AppPaths | null>(null);
  const appVersion = ref<string>('');
  const isFirstRun = ref(false);
  const isLoading = ref(true);

  /**
   * Load configuration from Electron
   */
  async function loadConfig(): Promise<ElectronConfig | null> {
    if (!window.electronAPI) return null;
    
    try {
      const loadedConfig = await window.electronAPI.getConfig();
      config.value = loadedConfig;
      return loadedConfig;
    } catch (error) {
      console.error('Failed to load Electron config:', error);
      return null;
    }
  }

  /**
   * Save configuration to Electron
   */
  async function saveConfig(newConfig: Partial<ElectronConfig>): Promise<boolean> {
    if (!window.electronAPI) return false;
    
    try {
      const success = await window.electronAPI.saveConfig(newConfig);
      if (success) {
        config.value = { ...config.value, ...newConfig } as ElectronConfig;
      }
      return success;
    } catch (error) {
      console.error('Failed to save Electron config:', error);
      return false;
    }
  }

  /**
   * Check if this is the first run
   */
  async function checkFirstRun(): Promise<boolean> {
    if (!window.electronAPI) return false;
    
    try {
      isFirstRun.value = await window.electronAPI.isFirstRun();
      return isFirstRun.value;
    } catch (error) {
      console.error('Failed to check first run:', error);
      return false;
    }
  }

  /**
   * Mark first run as complete
   */
  async function completeFirstRun(): Promise<boolean> {
    if (!window.electronAPI) return false;
    
    try {
      const success = await window.electronAPI.completeFirstRun();
      if (success) {
        isFirstRun.value = false;
      }
      return success;
    } catch (error) {
      console.error('Failed to complete first run:', error);
      return false;
    }
  }

  /**
   * Open directory selection dialog
   */
  async function selectDirectory(): Promise<string | null> {
    if (!window.electronAPI) return null;
    
    try {
      return await window.electronAPI.selectDirectory();
    } catch (error) {
      console.error('Failed to select directory:', error);
      return null;
    }
  }

  /**
   * Get app paths
   */
  async function getPaths(): Promise<AppPaths | null> {
    if (!window.electronAPI) return null;
    
    try {
      appPaths.value = await window.electronAPI.getPaths();
      return appPaths.value;
    } catch (error) {
      console.error('Failed to get app paths:', error);
      return null;
    }
  }

  /**
   * Get app version
   */
  async function getVersion(): Promise<string> {
    if (!window.electronAPI) return '';
    
    try {
      appVersion.value = await window.electronAPI.getVersion();
      return appVersion.value;
    } catch (error) {
      console.error('Failed to get app version:', error);
      return '';
    }
  }

  /**
   * Check for updates
   */
  async function checkForUpdates(): Promise<any> {
    if (!window.electronAPI) return null;
    
    try {
      return await window.electronAPI.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return null;
    }
  }

  /**
   * Download and install update
   */
  function downloadAndInstall(): void {
    if (window.electronAPI) {
      window.electronAPI.downloadAndInstall();
    }
  }

  /**
   * Initialize Electron features
   */
  async function initialize(): Promise<void> {
    if (!window.electronAPI) {
      isLoading.value = false;
      return;
    }

    try {
      await Promise.all([
        loadConfig(),
        checkFirstRun(),
        getPaths(),
        getVersion()
      ]);
    } catch (error) {
      console.error('Failed to initialize Electron:', error);
    } finally {
      isLoading.value = false;
    }
  }

  // Auto-initialize on mount
  onMounted(() => {
    initialize();
  });

  return {
    // State
    isElectron,
    platform,
    config,
    appPaths,
    appVersion,
    isFirstRun,
    isLoading,

    // Methods
    loadConfig,
    saveConfig,
    checkFirstRun,
    completeFirstRun,
    selectDirectory,
    getPaths,
    getVersion,
    checkForUpdates,
    downloadAndInstall,
    initialize
  };
}

export default useElectron;
