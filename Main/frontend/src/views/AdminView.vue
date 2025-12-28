<template>
	<AppLayout>
		<div class="admin-content">
			<div class="content-header">
				<h2><span class="header-icon css-icon icon-chart"></span> 管理员统计面板</h2>
			</div>

			<LoadingState v-if="loading" text="加载统计数据..." />

			<template v-else>
				<!-- 全站概览 -->
				<section class="stats-section">
					<h3>全站概览</h3>
					<div class="stats-grid">
						<div class="stat-card">
							<span class="stat-icon css-icon icon-users"></span>
							<div class="stat-info">
								<span class="stat-value">{{ siteStats?.totalUsers || 0 }}</span>
								<span class="stat-label">总用户数</span>
							</div>
						</div>
						<div class="stat-card">
							<span class="stat-icon css-icon icon-document"></span>
							<div class="stat-info">
								<span class="stat-value">{{ siteStats?.totalArticles || 0 }}</span>
								<span class="stat-label">总文章数</span>
							</div>
						</div>
						<div class="stat-card">
							<span class="stat-icon css-icon icon-tag"></span>
							<div class="stat-info">
								<span class="stat-value">{{ siteStats?.totalTags || 0 }}</span>
								<span class="stat-label">总标签数</span>
							</div>
						</div>
						<div class="stat-card">
							<span class="stat-icon css-icon icon-link"></span>
							<div class="stat-info">
								<span class="stat-value">{{ siteStats?.totalShares || 0 }}</span>
								<span class="stat-label">总分享数</span>
							</div>
						</div>
						<div class="stat-card">
							<span class="stat-icon css-icon icon-comment"></span>
							<div class="stat-info">
								<span class="stat-value">{{ siteStats?.totalComments || 0 }}</span>
								<span class="stat-label">总评论数</span>
							</div>
						</div>
						<div class="stat-card highlight">
							<span class="stat-icon css-icon icon-trending"></span>
							<div class="stat-info">
								<span class="stat-value">{{ siteStats?.recentArticles || 0 }}</span>
								<span class="stat-label">近7天新文章</span>
							</div>
						</div>
					</div>
				</section>

				<!-- 文章类型分布 -->
				<section class="stats-section">
					<h3>文章类型分布</h3>
					<div class="type-stats">
						<div class="type-item">
							<span class="type-label"><span class="type-icon css-icon icon-algorithm"></span> 算法题解</span>
							<div class="type-bar">
								<div class="type-fill algorithm" :style="{ width: getTypePercent('algorithm') + '%' }"></div>
							</div>
							<span class="type-count">{{ siteStats?.articlesByType?.algorithm || 0 }}</span>
						</div>
						<div class="type-item">
							<span class="type-label"><span class="type-icon css-icon icon-code"></span> 代码片段</span>
							<div class="type-bar">
								<div class="type-fill snippet" :style="{ width: getTypePercent('snippet') + '%' }"></div>
							</div>
							<span class="type-count">{{ siteStats?.articlesByType?.snippet || 0 }}</span>
						</div>
						<div class="type-item">
							<span class="type-label"><span class="type-icon css-icon icon-globe"></span> HTML页面</span>
							<div class="type-bar">
								<div class="type-fill html" :style="{ width: getTypePercent('html') + '%' }"></div>
							</div>
							<span class="type-count">{{ siteStats?.articlesByType?.html || 0 }}</span>
						</div>
					</div>
				</section>

				<!-- 热门标签（视图 v_popular_tags） -->
				<section class="stats-section">
					<h3><span class="section-icon css-icon icon-tag"></span> 热门标签 TOP 10 <span class="db-badge">视图: v_popular_tags</span></h3>
					<div class="tags-list">
						<div v-for="(tag, index) in popularTags.slice(0, 10)" :key="tag.tagId" class="tag-item">
							<span class="tag-rank">#{{ index + 1 }}</span>
							<span class="tag-name">{{ tag.tagName }}</span>
							<span class="tag-count">{{ tag.usageCount }} 篇文章</span>
						</div>
						<div v-if="popularTags.length === 0" class="empty-hint">暂无标签数据</div>
					</div>
				</section>

				<!-- 用户统计（视图 v_user_statistics） -->
				<section class="stats-section">
					<h3><span class="section-icon css-icon icon-users"></span> 用户统计 <span class="db-badge">视图: v_user_statistics</span></h3>
					<div class="table-container">
						<table class="stats-table">
							<thead>
								<tr>
									<th>用户名</th>
									<th>邮箱</th>
									<th>文章数</th>
									<th>算法</th>
									<th>片段</th>
									<th>HTML</th>
									<th>分享数</th>
									<th>注册时间</th>
									<th>操作</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="user in userStatistics" :key="user.userId">
									<td>{{ user.username }}</td>
									<td>{{ user.email }}</td>
									<td>{{ user.articleCount }}</td>
									<td>{{ user.algorithmCount }}</td>
									<td>{{ user.snippetCount }}</td>
									<td>{{ user.htmlCount }}</td>
									<td>{{ user.totalShares }}</td>
									<td>{{ formatDate(user.registeredAt) }}</td>
									<td>
										<button class="detail-btn" @click="showUserArticles(user)">查看文章</button>
									</td>
								</tr>
								<tr v-if="userStatistics.length === 0">
									<td colspan="9" class="empty-hint">暂无用户数据</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<!-- 文章详情列表（视图 v_article_details） -->
				<section class="stats-section">
					<h3><span class="section-icon css-icon icon-document"></span> 文章详情列表 <span class="db-badge">视图: v_article_details</span></h3>
					<div class="table-container">
						<table class="stats-table">
							<thead>
								<tr>
									<th>标题</th>
									<th>作者</th>
									<th>类型</th>
									<th>语言</th>
									<th>标签</th>
									<th>分享数</th>
									<th>创建时间</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="article in articleDetails" :key="article.articleId">
									<td class="title-cell">{{ article.title }}</td>
									<td>{{ article.authorName }}</td>
									<td>
										<span :class="['type-badge', article.type]">{{ getTypeName(article.type) }}</span>
									</td>
									<td>{{ article.language }}</td>
									<td class="tags-cell">{{ article.tagNames || '-' }}</td>
									<td>{{ article.shareCount }}</td>
									<td>{{ formatDate(article.createdAt) }}</td>
								</tr>
								<tr v-if="articleDetails.length === 0">
									<td colspan="7" class="empty-hint">暂无文章数据</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				<!-- 操作日志（触发器自动记录） -->
				<section class="stats-section">
					<h3><span class="section-icon css-icon icon-document"></span> 操作日志 <span class="db-badge">触发器自动记录</span></h3>
					<div class="table-container">
						<table class="stats-table">
							<thead>
								<tr>
									<th>时间</th>
									<th>表名</th>
									<th>操作</th>
									<th>记录ID</th>
									<th>详情</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="log in operationLogs" :key="log.id">
									<td>{{ formatDateTime(log.operatedAt) }}</td>
									<td>{{ log.tableName }}</td>
									<td>
										<span :class="['op-badge', log.operationType.toLowerCase()]">
											{{ log.operationType }}
										</span>
									</td>
									<td class="record-id">{{ log.recordId.slice(0, 8) }}...</td>
									<td>
										<button class="detail-btn" @click="showLogDetail(log)">查看</button>
									</td>
								</tr>
								<tr v-if="operationLogs.length === 0">
									<td colspan="5" class="empty-hint">暂无操作日志</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="pagination" v-if="logsTotal > 20">
						<button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
						<span>第 {{ currentPage }} 页 / 共 {{ Math.ceil(logsTotal / 20) }} 页</span>
						<button :disabled="currentPage >= Math.ceil(logsTotal / 20)"
							@click="changePage(currentPage + 1)">下一页</button>
					</div>
				</section>

				<!-- 维护操作 -->
				<section class="stats-section">
					<h3><span class="section-icon css-icon icon-settings"></span> 维护操作 <span class="db-badge">存储过程: sp_cleanup_expired_shares</span></h3>
					<div class="maintenance-actions">
						<button class="action-btn" @click="handleCleanup" :disabled="cleaning">
							<span class="btn-icon css-icon icon-trash"></span>
							{{ cleaning ? '清理中...' : '清理过期分享' }}
						</button>
						<button class="action-btn" @click="refreshData">
							<span class="btn-icon css-icon icon-refresh"></span>
							刷新数据
						</button>
					</div>
				</section>
			</template>

			<!-- 日志详情弹窗 -->
			<div v-if="selectedLog" class="modal-overlay" @click="selectedLog = null">
				<div class="modal-content" @click.stop>
					<h4>操作日志详情</h4>
					<div class="log-detail">
						<p><strong>操作类型:</strong> {{ selectedLog.operationType }}</p>
						<p><strong>表名:</strong> {{ selectedLog.tableName }}</p>
						<p><strong>记录ID:</strong> {{ selectedLog.recordId }}</p>
						<p><strong>时间:</strong> {{ formatDateTime(selectedLog.operatedAt) }}</p>
						<div v-if="selectedLog.oldData">
							<strong>旧数据:</strong>
							<pre>{{ JSON.stringify(selectedLog.oldData, null, 2) }}</pre>
						</div>
						<div v-if="selectedLog.newData">
							<strong>新数据:</strong>
							<pre>{{ JSON.stringify(selectedLog.newData, null, 2) }}</pre>
						</div>
					</div>
					<button class="close-btn" @click="selectedLog = null">关闭</button>
				</div>
			</div>

			<!-- 用户文章弹窗（存储过程 sp_get_user_articles） -->
			<div v-if="selectedUser" class="modal-overlay" @click="selectedUser = null">
				<div class="modal-content wide" @click.stop>
					<h4>{{ selectedUser.username }} 的文章列表 <span class="db-badge">存储过程: sp_get_user_articles</span></h4>
					<div class="table-container">
						<table class="stats-table">
							<thead>
								<tr>
									<th>标题</th>
									<th>类型</th>
									<th>语言</th>
									<th>标签</th>
									<th>更新时间</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="article in userArticles" :key="article.id">
									<td>{{ article.title }}</td>
									<td>
										<span :class="['type-badge', article.type]">{{ getTypeName(article.type) }}</span>
									</td>
									<td>{{ article.language }}</td>
									<td>{{ article.tags || '-' }}</td>
									<td>{{ formatDateTime(article.updated_at) }}</td>
								</tr>
								<tr v-if="userArticles.length === 0">
									<td colspan="5" class="empty-hint">该用户暂无文章</td>
								</tr>
							</tbody>
						</table>
					</div>
					<button class="close-btn" @click="selectedUser = null">关闭</button>
				</div>
			</div>
		</div>
	</AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useAdminStore } from '../stores/admin'
import { useUiStore } from '../stores/ui'
import { AppLayout } from '../components/layout'
import { LoadingState } from '../components/common'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const uiStore = useUiStore()

const { user } = storeToRefs(authStore)
const { siteStats, userStatistics, popularTags, articleDetails, userArticles, operationLogs, logsTotal, loading } = storeToRefs(adminStore)

const currentPage = ref(1)
const cleaning = ref(false)
const selectedLog = ref(null)
const selectedUser = ref(null)

const isAdmin = computed(() => user.value?.role === 'admin')

function getTypePercent (type) {
	if (!siteStats.value?.totalArticles) return 0
	const count = siteStats.value.articlesByType?.[type] || 0
	return Math.round((count / siteStats.value.totalArticles) * 100)
}

function getTypeName (type) {
	const names = { algorithm: '算法', snippet: '片段', html: 'HTML' }
	return names[type] || type
}

function formatDate (date) {
	if (!date) return '-'
	return new Date(date).toLocaleDateString('zh-CN')
}

function formatDateTime (date) {
	if (!date) return '-'
	return new Date(date).toLocaleString('zh-CN')
}

function showLogDetail (log) {
	selectedLog.value = log
}

async function showUserArticles (user) {
	selectedUser.value = user
	await adminStore.fetchUserArticles(user.userId, 1, 20)
}

async function changePage (page) {
	currentPage.value = page
	await adminStore.fetchOperationLogs(page, 20)
}

async function handleCleanup () {
	cleaning.value = true
	try {
		const result = await adminStore.cleanupExpiredShares()
		uiStore.showToast(`已清理 ${result.deletedCount} 个过期分享`, 'success')
		await adminStore.fetchSiteStats()
	} catch (err) {
		uiStore.showToast('清理失败', 'error')
	} finally {
		cleaning.value = false
	}
}

async function refreshData () {
	await Promise.all([
		adminStore.fetchSiteStats(),
		adminStore.fetchUserStatistics(),
		adminStore.fetchPopularTags(),
		adminStore.fetchArticleDetails(),
		adminStore.fetchOperationLogs(currentPage.value, 20)
	])
	uiStore.showToast('数据已刷新', 'success')
}

onMounted(async () => {
	if (!user.value) {
		await authStore.fetchProfile()
	}

	if (!isAdmin.value) {
		uiStore.showToast('无权访问管理页面', 'error')
		router.push({ name: 'Home' })
		return
	}

	// 并行加载所有数据
	await Promise.all([
		adminStore.fetchSiteStats(),
		adminStore.fetchUserStatistics(),
		adminStore.fetchPopularTags(),
		adminStore.fetchArticleDetails(),
		adminStore.fetchOperationLogs(1, 20)
	])
})
</script>

<style scoped>
.admin-content {
	padding: 24px;
	max-width: 1200px;
	margin: 0 auto;
}

.content-header h2 {
	margin: 0 0 24px 0;
	font-size: 24px;
	color: #333;
}

.stats-section {
	background: var(--bai);
	border: 1px solid var(--hui);
	border-radius: 8px;
	padding: 20px;
	margin-bottom: 20px;
}

.stats-section h3 {
	margin: 0 0 16px 0;
	font-size: 16px;
	color: #333;
	border-bottom: 1px solid var(--hui);
	padding-bottom: 10px;
	display: flex;
	align-items: center;
	gap: 10px;
}

.db-badge {
	font-size: 11px;
	font-weight: normal;
	background: #e3f2fd;
	color: #1976d2;
	padding: 2px 8px;
	border-radius: 4px;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
	gap: 16px;
}

.stat-card {
	background: var(--danhui);
	border-radius: 8px;
	padding: 16px;
	display: flex;
	align-items: center;
	gap: 12px;
}

.stat-card.highlight {
	background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.stat-icon {
	font-size: 24px;
	color: var(--primary);
}

.header-icon {
	font-size: 20px;
	margin-right: 8px;
}

.section-icon {
	font-size: 16px;
	margin-right: 6px;
}

.type-icon {
	font-size: 14px;
	margin-right: 4px;
}

.btn-icon {
	font-size: 14px;
	margin-right: 6px;
}

.stat-info {
	display: flex;
	flex-direction: column;
}

.stat-value {
	font-size: 24px;
	font-weight: 600;
	color: #333;
}

.stat-label {
	font-size: 12px;
	color: #666;
}

.type-stats {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.type-item {
	display: flex;
	align-items: center;
	gap: 12px;
}

.type-label {
	width: 120px;
	font-size: 14px;
	display: flex;
	align-items: center;
}

.type-bar {
	flex: 1;
	height: 20px;
	background: var(--danhui);
	border-radius: 10px;
	overflow: hidden;
}

.type-fill {
	height: 100%;
	border-radius: 10px;
	transition: width 0.3s;
}

.type-fill.algorithm {
	background: #4caf50;
}

.type-fill.snippet {
	background: #2196f3;
}

.type-fill.html {
	background: #ff9800;
}

.type-count {
	width: 40px;
	text-align: right;
	font-weight: 500;
}

.type-badge {
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 12px;
}

.type-badge.algorithm {
	background: #e8f5e9;
	color: #2e7d32;
}

.type-badge.snippet {
	background: #e3f2fd;
	color: #1565c0;
}

.type-badge.html {
	background: #fff3e0;
	color: #ef6c00;
}

.tags-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.tag-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 12px;
	background: var(--danhui);
	border-radius: 6px;
}

.tag-rank {
	font-weight: 600;
	color: var(--primary);
	width: 30px;
}

.tag-name {
	flex: 1;
	font-weight: 500;
}

.tag-count {
	color: #666;
	font-size: 13px;
}

.table-container {
	overflow-x: auto;
}

.stats-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
}

.stats-table th,
.stats-table td {
	padding: 10px 12px;
	text-align: left;
	border-bottom: 1px solid var(--hui);
}

.stats-table th {
	background: var(--danhui);
	font-weight: 500;
}

.stats-table tr:hover {
	background: var(--danhui);
}

.title-cell {
	max-width: 200px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tags-cell {
	max-width: 150px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.record-id {
	font-family: monospace;
	font-size: 12px;
}

.op-badge {
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 12px;
	font-weight: 500;
}

.op-badge.insert {
	background: #e8f5e9;
	color: #2e7d32;
}

.op-badge.update {
	background: #fff3e0;
	color: #ef6c00;
}

.op-badge.delete {
	background: #ffebee;
	color: #c62828;
}

.detail-btn {
	padding: 4px 10px;
	font-size: 12px;
	background: var(--primary);
	color: white;
	border-radius: 4px;
}

.pagination {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 16px;
	margin-top: 16px;
}

.pagination button {
	padding: 6px 12px;
	border: 1px solid var(--hui);
	border-radius: 4px;
	background: white;
}

.pagination button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.maintenance-actions {
	display: flex;
	gap: 12px;
	margin-top: 12px;
}

.action-btn {
	padding: 10px 20px;
	border-radius: 6px;
	font-weight: 500;
	background: var(--primary);
	color: white;
	display: flex;
	align-items: center;
}

.action-btn.secondary {
	background: #6c757d;
}

.action-btn:hover {
	opacity: 0.9;
}

.action-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.empty-hint {
	text-align: center;
	color: #999;
	padding: 20px;
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background: white;
	border-radius: 8px;
	padding: 24px;
	max-width: 500px;
	width: 90%;
	max-height: 80vh;
	overflow-y: auto;
}

.modal-content.wide {
	max-width: 800px;
}

.modal-content h4 {
	margin: 0 0 16px 0;
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
}

.log-detail pre {
	background: var(--danhui);
	padding: 12px;
	border-radius: 4px;
	overflow-x: auto;
	font-size: 12px;
}

.close-btn {
	margin-top: 16px;
	padding: 8px 20px;
	background: var(--hui);
	border-radius: 4px;
}

@media (max-width: 768px) {
	.stats-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}
</style>
