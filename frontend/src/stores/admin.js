import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminService } from '../services/adminService'

export const useAdminStore = defineStore('admin', () => {
	const siteStats = ref(null)
	const userStatistics = ref([])
	const popularTags = ref([])
	const articleDetails = ref([])
	const userArticles = ref([])
	const operationLogs = ref([])
	const logsTotal = ref(0)
	const loading = ref(false)

	// 获取全站统计
	async function fetchSiteStats () {
		loading.value = true
		try {
			siteStats.value = await adminService.getSiteStats()
		} finally {
			loading.value = false
		}
	}

	// 【视图】获取用户统计列表（v_user_statistics）
	async function fetchUserStatistics () {
		loading.value = true
		try {
			userStatistics.value = await adminService.getUserStatistics()
		} finally {
			loading.value = false
		}
	}

	// 【视图】获取热门标签（v_popular_tags）
	async function fetchPopularTags (limit = 20) {
		loading.value = true
		try {
			popularTags.value = await adminService.getPopularTags(limit)
		} finally {
			loading.value = false
		}
	}

	// 【视图】获取文章详情列表（v_article_details）
	async function fetchArticleDetails (limit = 50) {
		loading.value = true
		try {
			articleDetails.value = await adminService.getArticleDetails(limit)
		} finally {
			loading.value = false
		}
	}

	// 【存储过程】获取用户文章列表（sp_get_user_articles）
	async function fetchUserArticles (userId, page = 1, pageSize = 10, type = '') {
		loading.value = true
		try {
			userArticles.value = await adminService.getUserArticles(userId, page, pageSize, type)
		} finally {
			loading.value = false
		}
	}

	// 获取操作日志（触发器记录）
	async function fetchOperationLogs (page = 1, pageSize = 20) {
		loading.value = true
		try {
			const result = await adminService.getOperationLogs(page, pageSize)
			operationLogs.value = result.logs
			logsTotal.value = result.total
		} finally {
			loading.value = false
		}
	}

	// 【存储过程】清理过期分享（sp_cleanup_expired_shares）
	async function cleanupExpiredShares () {
		loading.value = true
		try {
			return await adminService.cleanupExpiredShares()
		} finally {
			loading.value = false
		}
	}

	return {
		siteStats,
		userStatistics,
		popularTags,
		articleDetails,
		userArticles,
		operationLogs,
		logsTotal,
		loading,
		fetchSiteStats,
		fetchUserStatistics,
		fetchPopularTags,
		fetchArticleDetails,
		fetchUserArticles,
		fetchOperationLogs,
		cleanupExpiredShares
	}
})
