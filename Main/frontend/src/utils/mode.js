/**
 * Application mode utilities
 * Handles Prod/Dev mode detection and feature flags
 */

// Get current app mode from environment
export const APP_MODE = import.meta.env.VITE_APP_MODE || 'dev'

// Check if running in production (demo) mode
export const isProdMode = APP_MODE === 'prod'

// Check if running in development (full feature) mode
export const isDevMode = APP_MODE === 'dev'

/**
 * Feature flags based on mode
 * Prod mode: Limited features for online demo
 * Dev mode: Full features for local deployment
 */
export const features = {
	// Code execution
	dockerExecution: isDevMode,        // Docker-based multi-language execution
	sandboxExecution: true,            // JS/TS sandbox execution (always available)

	// Languages supported
	supportedLanguages: isProdMode
		? ['javascript', 'typescript']
		: ['javascript', 'typescript', 'python', 'java'],

	// Search & AI
	elasticsearchSearch: true,         // Basic search (always available)
	ragRecommendation: isDevMode,      // Ollama-based RAG recommendations

	// Other features
	multiLanguageExecution: isDevMode, // Execute Python, Java, etc.
}

/**
 * Check if a language is supported for execution
 */
export function isLanguageSupported (language) {
	return features.supportedLanguages.includes(language)
}

/**
 * Get mode display name
 */
export function getModeDisplayName () {
	return isProdMode ? 'Demo' : 'Dev'
}

/**
 * Get mode description
 */
export function getModeDescription () {
	return isProdMode
		? '在线演示模式，部分功能受限'
		: '完整功能模式，支持所有特性'
}
