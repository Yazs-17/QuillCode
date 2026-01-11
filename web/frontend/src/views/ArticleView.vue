<template>
	<div class="article-view">
		<div class="article-header">
			<button class="back-btn" @click="goBack">← 返回</button>
			<div class="header-actions" v-if="isOwner">
				<button class="share-btn" @click="showShareDialog = true">分享</button>
				<button class="edit-btn" @click="editArticle">编辑</button>
				<button class="delete-btn" @click="confirmDelete">删除</button>
			</div>
		</div>

		<div v-if="loading" class="loading">加载中...</div>

		<div v-else-if="error" class="error">
			{{ error }}
			<button @click="retry">重试</button>
		</div>

		<div v-else-if="article" class="article-content">
			<div class="article-meta">
				<span class="article-type" :class="article.type">{{ typeLabel }}</span>
				<span class="article-language">{{ article.language }}</span>
				<span class="article-date">{{ formattedDate }}</span>
			</div>

			<h1 class="article-title">{{ article.title }}</h1>

			<div class="tags" v-if="tags.length">
				<span class="tag" v-for="tag in tags" :key="tag.id">{{ tag.name }}</span>
			</div>

			<div class="content-section" v-if="article.content">
				<h3>内容</h3>
				<MarkdownPreview :content="article.content" />
			</div>

			<div class="code-section" v-if="article.code">
				<h3>代码</h3>
				<pre class="code-block"><code>{{ article.code }}</code></pre>
			</div>

			<!-- Recommendations section -->
			<div class="recommendations-section" v-if="recommendations.length > 0">
				<h3>
					相关推荐
					<span v-if="aiEnhanced" class="ai-badge">AI 增强</span>
				</h3>
				<div class="recommendations-list">
					<div v-for="rec in recommendations" :key="rec.id" class="recommendation-card" @click="goToArticle(rec.id)">
						<div class="rec-header">
							<span class="rec-title">{{ rec.title }}</span>
							<span class="rec-type" :class="rec.type">{{ getTypeLabel(rec.type) }}</span>
						</div>
						<div class="rec-reason">{{ rec.reason }}</div>
						<div class="rec-tags" v-if="rec.tags?.length">
							<span v-for="tag in rec.tags.slice(0, 3)" :key="tag" class="rec-tag">{{ tag }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Delete confirmation dialog -->
		<div v-if="showDeleteDialog" class="dialog-overlay" @click.self="showDeleteDialog = false">
			<div class="dialog">
				<h3>确认删除</h3>
				<p>确定要删除这个 Quill 吗？此操作不可撤销。</p>
				<div class="dialog-actions">
					<button class="cancel-btn" @click="showDeleteDialog = false">取消</button>
					<button class="confirm-btn" @click="deleteArticle">确认删除</button>
				</div>
			</div>
		</div>

		<!-- Share dialog -->
		<ShareDialog v-if="showShareDialog && article" :article-id="article.id" @close="showShareDialog = false"
			@created="onShareCreated" />
	</div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useArticleStore } from '../stores/article'
import { useAuthStore } from '../stores/auth'
import { searchService } from '../services'
import { ShareDialog } from '../components/share'
import { MarkdownPreview } from '../components/editor'
import { isDevMode } from '../utils/mode'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const authStore = useAuthStore()

const { currentArticle: article, loading, error } = storeToRefs(articleStore)
const showDeleteDialog = ref(false)
const showShareDialog = ref(false)
const recommendations = ref([])
const aiEnhanced = ref(false)

const typeLabels = {
	algorithm: '算法',
	snippet: 'Quill',
	html: 'HTML/Vue'
}

const isOwner = computed(() => {
	return authStore.user && article.value && article.value.userId === authStore.user.id
})

const typeLabel = computed(() => {
	if (!article.value) return ''
	return typeLabels[article.value.type] || article.value.type
})

const tags = computed(() => {
	if (!article.value?.articleTags) return []
	return article.value.articleTags.map(at => at.tag).filter(Boolean)
})

const formattedDate = computed(() => {
	if (!article.value) return ''
	const date = new Date(article.value.updatedAt || article.value.createdAt)
	return date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})
})

onMounted(() => {
	const id = route.params.id
	if (id) {
		articleStore.fetchArticle(id)
	}
})

// Fetch recommendations when article loads
watch(article, async (newArticle) => {
	if (newArticle?.id && authStore.isAuthenticated) {
		try {
			const result = await searchService.getRecommendations(newArticle.id)
			recommendations.value = result.recommendations || []
			// AI enhanced only available in Dev mode
			aiEnhanced.value = isDevMode && (result.aiEnhanced || false)
		} catch {
			recommendations.value = []
		}
	}
}, { immediate: true })

function getTypeLabel (type) {
	return typeLabels[type] || type
}

function goBack () {
	router.back()
}

function goToArticle (id) {
	router.push({ name: 'Article', params: { id } })
}

function editArticle () {
	router.push({ name: 'EditorWithId', params: { id: article.value.id } })
}

function confirmDelete () {
	showDeleteDialog.value = true
}

async function deleteArticle () {
	try {
		await articleStore.deleteArticle(article.value.id)
		router.push({ name: 'Home' })
	} catch (err) {
		console.error('Delete failed:', err)
	}
	showDeleteDialog.value = false
}

function retry () {
	articleStore.clearError()
	articleStore.fetchArticle(route.params.id)
}

function onShareCreated () {
	// Share created successfully, dialog will show the link
}
</script>

<style scoped>
.article-view {
	max-width: 900px;
	margin: 0 auto;
	padding: 24px;
}

.article-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
}

.back-btn {
	background: transparent;
	color: var(--primary);
	padding: 8px 0;
}

.back-btn:hover {
	background: transparent;
	text-decoration: underline;
}

.header-actions {
	display: flex;
	gap: 8px;
}

.share-btn {
	background: #9c27b0;
}

.share-btn:hover {
	background: #7b1fa2;
}

.edit-btn {
	background: var(--primary);
}

.delete-btn {
	background: var(--danger);
}

.loading,
.error {
	text-align: center;
	padding: 48px;
	color: #666;
}

.error {
	color: var(--danger);
}

.article-meta {
	display: flex;
	gap: 12px;
	align-items: center;
	margin-bottom: 16px;
}

.article-type {
	font-size: 12px;
	padding: 4px 10px;
	border-radius: 4px;
	font-weight: 500;
}

.article-type.algorithm {
	background: #e3f2fd;
	color: #1976d2;
}

.article-type.snippet {
	background: #e8f5e9;
	color: #388e3c;
}

.article-type.html {
	background: #fff3e0;
	color: #f57c00;
}

.article-language {
	font-size: 13px;
	color: #666;
}

.article-date {
	font-size: 13px;
	color: #999;
}

.article-title {
	margin: 0 0 16px 0;
	font-size: 28px;
	color: #333;
}

.tags {
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-bottom: 24px;
}

.tag {
	font-size: 12px;
	padding: 4px 10px;
	background: var(--danhui);
	border-radius: 4px;
	color: #666;
}

.content-section,
.code-section {
	margin-bottom: 24px;
}

.content-section h3,
.code-section h3 {
	font-size: 16px;
	color: #666;
	margin: 0 0 12px 0;
	font-weight: 500;
}

.code-block {
	background: #1e1e1e;
	color: #d4d4d4;
	padding: 16px;
	border-radius: 8px;
	overflow-x: auto;
	font-family: 'Consolas', 'Monaco', monospace;
	font-size: 14px;
	line-height: 1.5;
}

.code-block code {
	white-space: pre;
}

/* Dialog styles */
.dialog-overlay {
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

.dialog {
	background: white;
	padding: 24px;
	border-radius: 8px;
	max-width: 400px;
	width: 90%;
}

.dialog h3 {
	margin: 0 0 12px 0;
}

.dialog p {
	margin: 0 0 20px 0;
	color: #666;
}

.dialog-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
}

.cancel-btn {
	background: #e0e0e0;
	color: #333;
}

.confirm-btn {
	background: var(--danger);
}

/* Recommendations styles */
.recommendations-section {
	margin-top: 32px;
	padding-top: 24px;
	border-top: 1px solid var(--hui);
}

.recommendations-section h3 {
	font-size: 16px;
	color: #666;
	margin: 0 0 16px 0;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 8px;
}

.ai-badge {
	font-size: 11px;
	padding: 2px 8px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
	border-radius: 10px;
	font-weight: 500;
}

.recommendations-list {
	display: grid;
	gap: 12px;
}

.recommendation-card {
	padding: 12px 16px;
	background: var(--danhui);
	border-radius: 8px;
	cursor: pointer;
	transition: transform 0.2s, box-shadow 0.2s;
}

.recommendation-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.rec-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 6px;
}

.rec-title {
	font-weight: 500;
	color: #333;
}

.rec-type {
	font-size: 11px;
	padding: 2px 8px;
	border-radius: 4px;
	background: #e0e0e0;
	color: #666;
}

.rec-type.algorithm {
	background: #e3f2fd;
	color: #1976d2;
}

.rec-type.snippet {
	background: #e8f5e9;
	color: #388e3c;
}

.rec-type.html {
	background: #fff3e0;
	color: #f57c00;
}

.rec-reason {
	font-size: 13px;
	color: #666;
	margin-bottom: 8px;
}

.rec-tags {
	display: flex;
	gap: 6px;
}

.rec-tag {
	font-size: 11px;
	padding: 2px 8px;
	background: white;
	border-radius: 4px;
	color: #888;
}
</style>
