<template>
	<AppLayout :show-sidebar="false">
		<div class="search-content">
			<div class="search-header">
				<h2>搜索文章</h2>
				<div class="search-box">
					<input v-model="searchQuery" type="text" placeholder="输入关键词搜索..." @keyup.enter="performSearch"
						class="search-input" />
					<button @click="performSearch" class="search-btn" :disabled="loading">
						{{ loading ? '搜索中...' : '搜索' }}
					</button>
				</div>
				<div v-if="!esAvailable" class="es-warning">
					<span class="css-icon icon-warning warning-icon"></span>
					Elasticsearch 未连接，搜索功能不可用
				</div>
				<div v-else class="es-status">
					<span class="status-dot online"></span>
					<span>Elasticsearch 已连接</span>
					<button class="reindex-btn" @click="handleReindex" :disabled="reindexing">
						<span class="css-icon icon-refresh btn-icon"></span>
						{{ reindexing ? '重建中...' : '重建索引' }}
					</button>
				</div>
			</div>

			<div class="search-results">
				<LoadingState v-if="loading" text="正在搜索..." />

				<EmptyState v-else-if="searched && results.length === 0" icon="search" title="未找到匹配的文章" description="尝试使用不同的关键词" />

				<div v-else-if="results.length > 0" class="results-list">
					<p class="results-count">找到 {{ results.length }} 篇相关文章</p>

					<div v-for="result in results" :key="result.id" class="result-card" @click="goToArticle(result.id)">
						<div class="result-header">
							<h3 class="result-title" v-html="getHighlightedTitle(result)"></h3>
							<span class="result-type" :class="result.type">{{ getTypeLabel(result.type) }}</span>
						</div>

						<div class="result-content" v-html="getHighlightedContent(result)"></div>

						<div v-if="result.highlights?.code?.length" class="result-code">
							<code v-html="result.highlights.code[0]"></code>
						</div>

						<div class="result-meta">
							<span class="result-language">{{ result.language }}</span>
							<div v-if="result.tags?.length" class="result-tags">
								<span v-for="tag in result.tags" :key="tag" class="tag">{{ tag }}</span>
							</div>
						</div>
					</div>
				</div>

				<div v-else class="search-hint">
					<p>输入关键词搜索您的代码笔记</p>
					<ul>
						<li>支持标题、内容、代码搜索</li>
						<li>支持标签筛选</li>
						<li>支持模糊匹配</li>
					</ul>
				</div>
			</div>
		</div>
	</AppLayout>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchService } from '../services'
import { useUiStore } from '../stores/ui'
import { AppLayout } from '../components/layout'
import { LoadingState, EmptyState } from '../components/common'

const router = useRouter()
const route = useRoute()
const uiStore = useUiStore()

const searchQuery = ref('')
const results = ref([])
const loading = ref(false)
const searched = ref(false)
const esAvailable = ref(true)
const reindexing = ref(false)

const typeLabels = {
	algorithm: '算法',
	snippet: '代码片段',
	html: 'HTML/Vue'
}

onMounted(async () => {
	// Check ES status
	try {
		const status = await searchService.getStatus()
		esAvailable.value = status.available
	} catch {
		esAvailable.value = false
	}

	// Check for query param
	if (route.query.q) {
		searchQuery.value = route.query.q
		performSearch()
	}
})

async function performSearch () {
	if (!searchQuery.value.trim()) return

	loading.value = true
	searched.value = true

	try {
		const response = await searchService.search(searchQuery.value.trim())
		results.value = response.results || []
		esAvailable.value = response.available

		// Update URL with search query
		router.replace({ query: { q: searchQuery.value } })
	} catch (error) {
		console.error('Search failed:', error)
		results.value = []
	} finally {
		loading.value = false
	}
}

async function handleReindex () {
	reindexing.value = true
	try {
		const result = await searchService.reindex()
		uiStore.showToast(`索引重建完成，已索引 ${result.count || 0} 篇文章`, 'success')
	} catch (error) {
		console.error('Reindex failed:', error)
		uiStore.showToast('索引重建失败', 'error')
	} finally {
		reindexing.value = false
	}
}

function getHighlightedTitle (result) {
	if (result.highlights?.title?.length) {
		return result.highlights.title[0]
	}
	return escapeHtml(result.title)
}

function getHighlightedContent (result) {
	if (result.highlights?.content?.length) {
		return result.highlights.content.join('...')
	}
	// Truncate content if no highlight
	const content = result.content || ''
	return escapeHtml(content.substring(0, 200)) + (content.length > 200 ? '...' : '')
}

function escapeHtml (text) {
	const div = document.createElement('div')
	div.textContent = text
	return div.innerHTML
}

function getTypeLabel (type) {
	return typeLabels[type] || type
}

function goToArticle (id) {
	router.push({ name: 'Article', params: { id } })
}
</script>


<style scoped>
.search-content {
	max-width: 900px;
	margin: 0 auto;
	padding: 2rem;
}

.search-header {
	margin-bottom: 2rem;
}

.search-header h2 {
	margin-bottom: 1rem;
	color: #333;
}

.search-box {
	display: flex;
	gap: 0.5rem;
}

.search-input {
	flex: 1;
	padding: 0.75rem 1rem;
	font-size: 1rem;
	border: 2px solid #e0e0e0;
	border-radius: 8px;
	outline: none;
	transition: border-color 0.2s;
}

.search-input:focus {
	border-color: #4a90d9;
}

.search-btn {
	padding: 0.75rem 1.5rem;
	font-size: 1rem;
	background: #4a90d9;
	color: white;
	border: none;
	border-radius: 8px;
	cursor: pointer;
	transition: background 0.2s;
}

.search-btn:hover:not(:disabled) {
	background: #357abd;
}

.search-btn:disabled {
	background: #ccc;
	cursor: not-allowed;
}

.es-warning {
	margin-top: 0.5rem;
	padding: 0.5rem 0.75rem;
	background: #fff3cd;
	color: #856404;
	border-radius: 4px;
	font-size: 0.9rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.warning-icon {
	font-size: 14px;
}

.btn-icon {
	font-size: 12px;
}

.es-status {
	margin-top: 0.5rem;
	padding: 0.5rem 0.75rem;
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.9rem;
	color: #666;
}

.status-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
}

.status-dot.online {
	background: #4caf50;
	box-shadow: 0 0 4px #4caf50;
}

.reindex-btn {
	margin-left: auto;
	padding: 0.35rem 0.75rem;
	font-size: 0.85rem;
	background: #f0f0f0;
	border: 1px solid #ddd;
	border-radius: 4px;
	cursor: pointer;
	transition: background 0.2s;
	display: flex;
	align-items: center;
	gap: 0.35rem;
}

.reindex-btn:hover:not(:disabled) {
	background: #e0e0e0;
}

.reindex-btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.no-results {
	text-align: center;
	padding: 2rem;
	color: #666;
}

.no-results .hint {
	font-size: 0.9rem;
	color: #999;
}

.results-count {
	margin-bottom: 1rem;
	color: #666;
	font-size: 0.9rem;
}

.result-card {
	padding: 1rem;
	margin-bottom: 1rem;
	background: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	cursor: pointer;
	transition: box-shadow 0.2s, transform 0.2s;
}

.result-card:hover {
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	transform: translateY(-2px);
}

.result-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 0.5rem;
}

.result-title {
	margin: 0;
	font-size: 1.1rem;
	color: #333;
}

.result-title :deep(mark) {
	background: #fff3cd;
	padding: 0 2px;
	border-radius: 2px;
}

.result-type {
	padding: 0.25rem 0.5rem;
	font-size: 0.75rem;
	border-radius: 4px;
	background: #e0e0e0;
	color: #666;
}

.result-type.algorithm {
	background: #d4edda;
	color: #155724;
}

.result-type.snippet {
	background: #cce5ff;
	color: #004085;
}

.result-type.html {
	background: #f8d7da;
	color: #721c24;
}

.result-content {
	color: #666;
	font-size: 0.9rem;
	line-height: 1.5;
	margin-bottom: 0.5rem;
}

.result-content :deep(mark) {
	background: #fff3cd;
	padding: 0 2px;
	border-radius: 2px;
}

.result-code {
	padding: 0.5rem;
	background: #f5f5f5;
	border-radius: 4px;
	margin-bottom: 0.5rem;
	overflow-x: auto;
}

.result-code code {
	font-family: 'Fira Code', monospace;
	font-size: 0.85rem;
	color: #333;
}

.result-code :deep(mark) {
	background: #fff3cd;
	padding: 0 2px;
	border-radius: 2px;
}

.result-meta {
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.8rem;
	color: #999;
}

.result-language {
	padding: 0.15rem 0.4rem;
	background: #f0f0f0;
	border-radius: 3px;
}

.result-tags {
	display: flex;
	gap: 0.25rem;
}

.tag {
	padding: 0.15rem 0.4rem;
	background: #e8f4fd;
	color: #4a90d9;
	border-radius: 3px;
}

.search-hint {
	text-align: center;
	padding: 2rem;
	color: #666;
}

.search-hint ul {
	list-style: none;
	padding: 0;
	margin-top: 1rem;
}

.search-hint li {
	margin: 0.5rem 0;
	font-size: 0.9rem;
}
</style>
