/**
 * Feature Limitation Composable
 * 
 * Provides functionality to check if features are available in the current
 * environment and show appropriate prompts for online-only users.
 * 
 * @module composables/useFeatureLimit
 */

import { ref, readonly } from 'vue'
import { isOnlineMode, getFeatures } from '../utils/environment'

/**
 * Features that are only available in the local/desktop version
 */
export enum LocalOnlyFeature {
  /** Local Ollama AI integration */
  OLLAMA_AI = 'ollama_ai',
  /** SQLite database storage */
  SQLITE_STORAGE = 'sqlite_storage',
  /** Advanced search with FTS5 */
  ADVANCED_SEARCH = 'advanced_search',
  /** Offline mode */
  OFFLINE_MODE = 'offline_mode',
  /** Auto-update functionality */
  AUTO_UPDATE = 'auto_update',
  /** Local file system access */
  FILE_SYSTEM_ACCESS = 'file_system_access'
}

/**
 * Feature information for display
 */
export interface FeatureInfo {
  name: string
  description: string
}

/**
 * Feature information mapping
 */
const FEATURE_INFO: Record<LocalOnlyFeature, FeatureInfo> = {
  [LocalOnlyFeature.OLLAMA_AI]: {
    name: '本地 AI 推理',
    description: '使用 Ollama 在本地运行 AI 模型，无需网络连接，保护数据隐私。'
  },
  [LocalOnlyFeature.SQLITE_STORAGE]: {
    name: 'SQLite 数据库',
    description: '使用 SQLite 本地数据库存储，支持更大的数据量和更快的查询速度。'
  },
  [LocalOnlyFeature.ADVANCED_SEARCH]: {
    name: '高级搜索',
    description: '使用 SQLite FTS5 全文搜索引擎，支持中文分词和更精确的搜索结果。'
  },
  [LocalOnlyFeature.OFFLINE_MODE]: {
    name: '离线模式',
    description: '完全离线使用，无需网络连接即可访问所有功能。'
  },
  [LocalOnlyFeature.AUTO_UPDATE]: {
    name: '自动更新',
    description: '自动检测并下载最新版本，保持应用始终最新。'
  },
  [LocalOnlyFeature.FILE_SYSTEM_ACCESS]: {
    name: '文件系统访问',
    description: '直接访问本地文件系统，支持导入导出本地文件。'
  }
}

/**
 * State for the feature limit dialog
 */
const showDialog = ref(false)
const currentFeature = ref<LocalOnlyFeature | null>(null)

/**
 * Composable for handling feature limitations
 */
export function useFeatureLimit() {
  const features = getFeatures()

  /**
   * Check if a feature is available in the current environment
   */
  function isFeatureAvailable(feature: LocalOnlyFeature): boolean {
    // In online mode, local-only features are not available
    if (isOnlineMode()) {
      return false
    }

    // Check specific feature availability based on environment
    switch (feature) {
      case LocalOnlyFeature.OLLAMA_AI:
        return features.hasOllamaAI
      case LocalOnlyFeature.SQLITE_STORAGE:
        return features.hasBackendAPI
      case LocalOnlyFeature.ADVANCED_SEARCH:
        return features.hasBackendAPI
      case LocalOnlyFeature.OFFLINE_MODE:
        return features.isDesktop
      case LocalOnlyFeature.AUTO_UPDATE:
        return features.isDesktop
      case LocalOnlyFeature.FILE_SYSTEM_ACCESS:
        return features.isDesktop
      default:
        return false
    }
  }

  /**
   * Get feature information for display
   */
  function getFeatureInfo(feature: LocalOnlyFeature): FeatureInfo {
    return FEATURE_INFO[feature]
  }

  /**
   * Show the feature limitation dialog
   */
  function showFeatureLimitDialog(feature: LocalOnlyFeature): void {
    currentFeature.value = feature
    showDialog.value = true
  }

  /**
   * Hide the feature limitation dialog
   */
  function hideFeatureLimitDialog(): void {
    showDialog.value = false
    currentFeature.value = null
  }

  /**
   * Check feature and show dialog if not available
   * Returns true if feature is available, false otherwise
   */
  function checkFeature(feature: LocalOnlyFeature): boolean {
    if (isFeatureAvailable(feature)) {
      return true
    }
    showFeatureLimitDialog(feature)
    return false
  }

  /**
   * Get the current feature info for the dialog
   */
  function getCurrentFeatureInfo(): FeatureInfo | null {
    if (!currentFeature.value) return null
    return getFeatureInfo(currentFeature.value)
  }

  return {
    // State
    showDialog: readonly(showDialog),
    currentFeature: readonly(currentFeature),
    
    // Methods
    isFeatureAvailable,
    getFeatureInfo,
    showFeatureLimitDialog,
    hideFeatureLimitDialog,
    checkFeature,
    getCurrentFeatureInfo,
    
    // Convenience
    isOnlineMode
  }
}

/**
 * Global feature limit state (for use in App.vue or similar)
 */
export const featureLimitState = {
  showDialog,
  currentFeature,
  show: (feature: LocalOnlyFeature) => {
    currentFeature.value = feature
    showDialog.value = true
  },
  hide: () => {
    showDialog.value = false
    currentFeature.value = null
  },
  getInfo: () => currentFeature.value ? FEATURE_INFO[currentFeature.value] : null
}
