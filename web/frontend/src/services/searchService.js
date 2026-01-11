/**
 * Search Service
 * 
 * Provides search operations with dual-mode support:
 * - Online mode (VITE_MODE=online): Uses browser search engine (MiniSearch)
 * - Server mode: Uses REST API (ElasticSearch/SQLite FTS)
 * 
 * @module services/searchService
 */

import api from './api'
import { getDataAdapter } from './dataAdapter'
import { isOnlineMode } from '../utils/environment'

/**
 * Get current user ID from localStorage
 * In online mode, we use a default user ID for browser storage
 */
const getCurrentUserId = () => {
	// Try to get user from localStorage (set by auth)
	const userStr = localStorage.getItem('user')
	if (userStr) {
		try {
			const user = JSON.parse(userStr)
			return user.id || user.userId
		} catch {
			// Ignore parse errors
		}
	}
	// Default user ID for online demo mode
	return 'demo-user'
}

export const searchService = {
	/**
	 * Search articles by query
	 */
	async search(query, options = {}) {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const userId = getCurrentUserId()
			
			const results = await adapter.search(query, {
				userId,
				limit: options.limit || 20,
				offset: options.offset || 0
			})
			
			// Transform results to match API response format
			return results.map(result => ({
				id: result.id,
				title: result.title,
				score: result.score,
				highlights: result.highlights
			}))
		}
		return api.get('/search', { params: { q: query, ...options } })
	},

	/**
	 * Get search engine status
	 */
	async getStatus() {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			const status = adapter.getStatus()
			return {
				available: status.initialized,
				mode: 'browser',
				engine: 'MiniSearch',
				environment: status.environment
			}
		}
		return api.get('/search/status')
	},

	/**
	 * Get article recommendations
	 * In online mode, this returns empty array as recommendations
	 * require server-side ML processing
	 */
	async getRecommendations(articleId) {
		if (isOnlineMode()) {
			// Recommendations not available in online mode
			// Could implement simple tag-based recommendations in future
			return []
		}
		return api.get(`/search/recommend`, { params: { articleId } })
	},

	/**
	 * Rebuild search index for current user
	 */
	async reindex() {
		if (isOnlineMode()) {
			const adapter = getDataAdapter()
			await adapter.initialize()
			const userId = getCurrentUserId()
			await adapter.reindexSearch(userId)
			return { success: true, message: '索引重建完成' }
		}
		return api.get('/search/reindex')
	}
}
