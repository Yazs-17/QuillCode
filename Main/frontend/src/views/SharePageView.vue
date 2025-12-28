<template>
  <div class="share-page-view">
    <header class="share-header">
      <router-link to="/" class="logo">QuillCode</router-link>
      <span class="share-badge">分享预览</span>
    </header>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="error-icon">😕</div>
      <h2>{{ errorTitle }}</h2>
      <p>{{ errorMessage }}</p>
      <router-link to="/" class="home-link">返回首页</router-link>
    </div>

    <div v-else-if="share" class="share-content">
      <article class="article-container">
        <div class="article-meta">
          <span class="article-type" :class="share.article.type">{{ typeLabel }}</span>
          <span class="article-language">{{ share.article.language }}</span>
          <span class="article-author">by {{ share.article.user?.username || '匿名' }}</span>
        </div>

        <h1 class="article-title">{{ share.article.title }}</h1>

        <div class="tags" v-if="tags.length">
          <span class="tag" v-for="tag in tags" :key="tag.id">{{ tag.name }}</span>
        </div>

        <div class="content-section" v-if="share.article.content">
          <h3>内容</h3>
          <MarkdownPreview :content="share.article.content" />
        </div>

        <div class="code-section" v-if="share.article.code">
          <div class="code-header">
            <h3>代码</h3>
            <button 
              class="run-btn" 
              :disabled="isRunning || !canRun"
              @click="runCode"
            >
              {{ isRunning ? '运行中...' : '▶ 运行' }}
            </button>
          </div>
          <pre class="code-block"><code>{{ share.article.code }}</code></pre>
        </div>

        <!-- Code execution result -->
        <div v-if="executionLogs.length > 0" class="execution-result">
          <h3>执行结果</h3>
          <div class="logs-container">
            <div 
              v-for="(log, index) in executionLogs" 
              :key="index"
              class="log-item"
              :class="log.type"
            >
              {{ log.text }}
            </div>
          </div>
        </div>

        <!-- HTML Preview -->
        <div v-if="showHtmlPreview" class="preview-section">
          <h3>预览</h3>
          <div class="preview-container">
            <iframe 
              ref="previewFrame"
              class="preview-iframe"
              sandbox="allow-scripts"
              :srcdoc="previewHtml"
            ></iframe>
          </div>
        </div>
      </article>

      <div class="share-info">
        <p>此链接将于 {{ formattedExpiresAt }} 过期</p>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <CommentList 
          :comments="comments" 
          :loading="commentsLoading" 
        />
        <CommentForm 
          ref="commentFormRef"
          :submitting="commentSubmitting"
          @submit="submitComment"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { shareService, commentService } from '../services'
import { CommentList, CommentForm } from '../components/comment'
import { MarkdownPreview } from '../components/editor'

const route = useRoute()

const loading = ref(true)
const error = ref(null)
const share = ref(null)
const executionLogs = ref([])
const isRunning = ref(false)

// Comment state
const comments = ref([])
const commentsLoading = ref(false)
const commentSubmitting = ref(false)
const commentFormRef = ref(null)

const typeLabels = {
  algorithm: '算法',
  snippet: '代码片段',
  html: 'HTML/Vue'
}

const typeLabel = computed(() => {
  if (!share.value?.article) return ''
  return typeLabels[share.value.article.type] || share.value.article.type
})

const tags = computed(() => {
  if (!share.value?.article?.articleTags) return []
  return share.value.article.articleTags.map(at => at.tag).filter(Boolean)
})

const formattedExpiresAt = computed(() => {
  if (!share.value) return ''
  const date = new Date(share.value.expiresAt)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const errorTitle = computed(() => {
  if (!error.value) return ''
  if (error.value.code === 4002) return '链接已过期'
  if (error.value.code === 4001) return '链接不存在'
  return '加载失败'
})

const errorMessage = computed(() => {
  if (!error.value) return ''
  if (error.value.code === 4002) return '此分享链接已过期，请联系作者获取新的链接。'
  if (error.value.code === 4001) return '找不到此分享链接，可能已被删除。'
  return error.value.message || '未知错误'
})

const canRun = computed(() => {
  if (!share.value?.article) return false
  const lang = share.value.article.language
  return ['javascript', 'typescript'].includes(lang)
})

const showHtmlPreview = computed(() => {
  if (!share.value?.article) return false
  const type = share.value.article.type
  const lang = share.value.article.language
  return type === 'html' || lang === 'html' || lang === 'vue'
})

const previewHtml = computed(() => {
  if (!share.value?.article?.code) return ''
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>body { margin: 0; padding: 16px; font-family: sans-serif; }</style>
    </head>
    <body>${share.value.article.code}</body>
    </html>
  `
})

async function loadShare() {
  const token = route.params.token
  if (!token) {
    error.value = { message: '无效的分享链接' }
    loading.value = false
    return
  }

  try {
    share.value = await shareService.getShareByToken(token)
    // Load comments after share is loaded
    await loadComments()
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
}

async function loadComments() {
  const token = route.params.token
  if (!token) return
  
  commentsLoading.value = true
  try {
    comments.value = await commentService.getComments(token)
  } catch (err) {
    console.error('Failed to load comments:', err)
    comments.value = []
  } finally {
    commentsLoading.value = false
  }
}

async function submitComment({ authorName, content }) {
  const token = route.params.token
  if (!token || commentSubmitting.value) return
  
  commentSubmitting.value = true
  try {
    const newComment = await commentService.addComment(token, authorName, content)
    comments.value.push(newComment)
    // Reset form
    if (commentFormRef.value) {
      commentFormRef.value.reset()
    }
  } catch (err) {
    console.error('Failed to submit comment:', err)
    alert('评论提交失败: ' + (err.message || '未知错误'))
  } finally {
    commentSubmitting.value = false
  }
}

function runCode() {
  if (isRunning.value || !share.value?.article?.code) return
  
  isRunning.value = true
  executionLogs.value = []
  
  const workerCode = `
    function stringify(value) {
      if (value instanceof Error) return value.stack || value.message;
      if (typeof value === 'function') return value.toString();
      try { return JSON.stringify(value, null, 2); } catch { return String(value); }
    }
    self.onmessage = async (e) => {
      const consoleProxy = {
        log: (...args) => self.postMessage({ type: 'log', text: args.map(stringify).join(' ') }),
        info: (...args) => self.postMessage({ type: 'info', text: args.map(stringify).join(' ') }),
        warn: (...args) => self.postMessage({ type: 'warn', text: args.map(stringify).join(' ') }),
        error: (...args) => self.postMessage({ type: 'error', text: args.map(stringify).join(' ') }),
      };
      try {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const result = await new AsyncFunction('console', e.data)(consoleProxy);
        if (result !== undefined) self.postMessage({ type: 'result', text: stringify(result) });
        else self.postMessage({ type: 'success', text: '执行完成' });
      } catch (error) {
        self.postMessage({ type: 'error', text: stringify(error) });
      }
      self.postMessage({ type: 'done' });
    };
  `
  
  const blob = new Blob([workerCode], { type: 'application/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  const worker = new Worker(workerUrl)
  
  const timeout = setTimeout(() => {
    worker.terminate()
    executionLogs.value.push({ type: 'error', text: '执行超时 (10秒)' })
    isRunning.value = false
    URL.revokeObjectURL(workerUrl)
  }, 10000)
  
  worker.onmessage = (e) => {
    const { type, text } = e.data
    if (type === 'done') {
      clearTimeout(timeout)
      isRunning.value = false
      URL.revokeObjectURL(workerUrl)
      return
    }
    executionLogs.value.push({ type, text })
  }
  
  worker.onerror = (e) => {
    clearTimeout(timeout)
    executionLogs.value.push({ type: 'error', text: e.message || '执行错误' })
    isRunning.value = false
    URL.revokeObjectURL(workerUrl)
  }
  
  worker.postMessage(share.value.article.code)
}

onMounted(() => {
  loadShare()
})
</script>

<style scoped>
.share-page-view {
  min-height: 100vh;
  background: var(--danhui);
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--bai);
  border-bottom: 1px solid var(--hui);
}

.logo {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
  text-decoration: none;
}

.share-badge {
  font-size: 12px;
  padding: 4px 12px;
  background: var(--danhui);
  border-radius: 12px;
  color: #666;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--hui);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 40px;
  text-align: center;
  background: var(--bai);
  border-radius: 12px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-container h2 {
  margin: 0 0 12px 0;
  color: #333;
}

.error-container p {
  margin: 0 0 24px 0;
  color: #666;
}

.home-link {
  display: inline-block;
  padding: 10px 24px;
  background: var(--primary);
  color: white;
  border-radius: 6px;
  text-decoration: none;
}

.home-link:hover {
  background: var(--primary-hover);
}

.share-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.article-container {
  background: var(--bai);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 16px;
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

.article-author {
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

.content-section, .code-section, .execution-result, .preview-section {
  margin-bottom: 24px;
}

.content-section h3, .code-section h3, .execution-result h3, .preview-section h3 {
  font-size: 16px;
  color: #666;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.code-header h3 {
  margin: 0;
}

.run-btn {
  padding: 6px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.run-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.run-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
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
  margin: 0;
}

.code-block code {
  white-space: pre;
}

.logs-container {
  background: #1e1e1e;
  border-radius: 8px;
  padding: 12px 16px;
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
}

.log-item.error {
  color: #f44336;
}

.log-item.warn {
  color: #ff9800;
}

.log-item.info {
  color: #2196f3;
}

.log-item.result {
  color: #4caf50;
}

.log-item.success {
  color: #888;
}

.preview-container {
  border: 1px solid var(--hui);
  border-radius: 8px;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 300px;
  border: none;
  background: white;
}

.share-info {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
}

.comments-section {
  background: var(--bai);
  border-radius: 12px;
  padding: 24px;
  margin-top: 16px;
}
</style>
