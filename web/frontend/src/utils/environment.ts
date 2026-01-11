/**
 * Environment Detection Module
 * 
 * Detects the runtime environment to determine which storage backend
 * and features should be used.
 * 
 * @module utils/environment
 */

/**
 * Runtime environment enumeration
 */
export enum RuntimeEnvironment {
  /** Browser-based online demo mode (IndexedDB storage) */
  BROWSER_ONLINE = 'browser_online',
  /** Browser-based local mode */
  BROWSER_LOCAL = 'browser_local',
  /** Electron desktop application */
  ELECTRON = 'electron',
  /** Docker container deployment */
  DOCKER = 'docker'
}

/**
 * Environment feature flags
 */
export interface EnvironmentFeatures {
  /** Whether local storage (IndexedDB) is available */
  hasLocalStorage: boolean;
  /** Whether backend API is available */
  hasBackendAPI: boolean;
  /** Whether Ollama AI is available */
  hasOllamaAI: boolean;
  /** Whether BYOK (Bring Your Own Key) AI mode is available */
  hasBYOKAI: boolean;
  /** Whether data export is available */
  hasExport: boolean;
  /** Whether the app is running in a desktop environment */
  isDesktop: boolean;
}

/**
 * Electron API interface (exposed by preload script)
 */
interface ElectronAPI {
  platform?: string;
  getAppPath?: () => string;
  getVersion?: () => string;
}

/**
 * Extended Window interface with Electron API
 */
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

/**
 * Environment Detector
 * 
 * Detects the current runtime environment and provides feature flags
 * for conditional functionality.
 */
export class EnvironmentDetector {
  private static cachedEnvironment: RuntimeEnvironment | null = null;

  /**
   * Detect the current runtime environment
   * 
   * Detection priority:
   * 1. Electron (check for electronAPI on window)
   * 2. Docker (check for VITE_MODE=docker env variable)
   * 3. Browser Online (check for VITE_MODE=online env variable)
   * 4. Browser Local (default fallback)
   */
  static detect(): RuntimeEnvironment {
    // Return cached result if available
    if (this.cachedEnvironment !== null) {
      return this.cachedEnvironment;
    }

    // Check if running in Node.js (server-side)
    if (typeof window === 'undefined') {
      this.cachedEnvironment = RuntimeEnvironment.DOCKER;
      return this.cachedEnvironment;
    }

    // Check for Electron environment
    if (this.isElectron()) {
      this.cachedEnvironment = RuntimeEnvironment.ELECTRON;
      return this.cachedEnvironment;
    }

    // Check environment variables set by Vite
    const viteMode = this.getViteMode();

    if (viteMode === 'docker') {
      this.cachedEnvironment = RuntimeEnvironment.DOCKER;
      return this.cachedEnvironment;
    }

    if (viteMode === 'online') {
      this.cachedEnvironment = RuntimeEnvironment.BROWSER_ONLINE;
      return this.cachedEnvironment;
    }

    // Default to browser local mode
    this.cachedEnvironment = RuntimeEnvironment.BROWSER_LOCAL;
    return this.cachedEnvironment;
  }

  /**
   * Check if running in Electron environment
   */
  static isElectron(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check for Electron API exposed by preload script
    if (window.electronAPI) {
      return true;
    }

    // Check for Electron-specific user agent
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('electron')) {
      return true;
    }

    // Check for Node.js integration in renderer process
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
      return true;
    }

    return false;
  }

  /**
   * Check if running in browser environment
   */
  static isBrowser(): boolean {
    const env = this.detect();
    return env === RuntimeEnvironment.BROWSER_ONLINE || 
           env === RuntimeEnvironment.BROWSER_LOCAL;
  }

  /**
   * Check if running in online demo mode
   */
  static isOnlineMode(): boolean {
    return this.detect() === RuntimeEnvironment.BROWSER_ONLINE;
  }

  /**
   * Check if running in local/desktop mode (Electron or Docker)
   */
  static isLocalMode(): boolean {
    const env = this.detect();
    return env === RuntimeEnvironment.ELECTRON || 
           env === RuntimeEnvironment.DOCKER;
  }

  /**
   * Get the Vite mode from environment variables
   */
  private static getViteMode(): string | undefined {
    try {
      // @ts-ignore - Vite injects import.meta.env at build time
      return import.meta.env?.VITE_MODE;
    } catch {
      return undefined;
    }
  }

  /**
   * Get feature flags for the current environment
   */
  static getFeatures(): EnvironmentFeatures {
    const env = this.detect();

    switch (env) {
      case RuntimeEnvironment.BROWSER_ONLINE:
        return {
          hasLocalStorage: true,
          hasBackendAPI: false,
          hasOllamaAI: false,
          hasBYOKAI: true,
          hasExport: true,
          isDesktop: false
        };

      case RuntimeEnvironment.BROWSER_LOCAL:
        return {
          hasLocalStorage: true,
          hasBackendAPI: false,
          hasOllamaAI: false,
          hasBYOKAI: true,
          hasExport: true,
          isDesktop: false
        };

      case RuntimeEnvironment.ELECTRON:
        return {
          hasLocalStorage: false,
          hasBackendAPI: true,
          hasOllamaAI: true,
          hasBYOKAI: true,
          hasExport: true,
          isDesktop: true
        };

      case RuntimeEnvironment.DOCKER:
        return {
          hasLocalStorage: false,
          hasBackendAPI: true,
          hasOllamaAI: true,
          hasBYOKAI: true,
          hasExport: true,
          isDesktop: false
        };

      default:
        return {
          hasLocalStorage: true,
          hasBackendAPI: false,
          hasOllamaAI: false,
          hasBYOKAI: true,
          hasExport: true,
          isDesktop: false
        };
    }
  }

  /**
   * Get a human-readable name for the current environment
   */
  static getEnvironmentName(): string {
    const env = this.detect();

    switch (env) {
      case RuntimeEnvironment.BROWSER_ONLINE:
        return 'Online Demo';
      case RuntimeEnvironment.BROWSER_LOCAL:
        return 'Browser Local';
      case RuntimeEnvironment.ELECTRON:
        return 'Desktop App';
      case RuntimeEnvironment.DOCKER:
        return 'Docker';
      default:
        return 'Unknown';
    }
  }

  /**
   * Clear the cached environment (useful for testing)
   */
  static clearCache(): void {
    this.cachedEnvironment = null;
  }
}

// Export convenience functions
export const detectEnvironment = () => EnvironmentDetector.detect();
export const isElectron = () => EnvironmentDetector.isElectron();
export const isBrowser = () => EnvironmentDetector.isBrowser();
export const isOnlineMode = () => EnvironmentDetector.isOnlineMode();
export const isLocalMode = () => EnvironmentDetector.isLocalMode();
export const getFeatures = () => EnvironmentDetector.getFeatures();
export const getEnvironmentName = () => EnvironmentDetector.getEnvironmentName();
