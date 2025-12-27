<template>
  <div class="editor-view">
    <header class="editor-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">← 返回</button>
        <input
          v-model="title"
          class="title-input"
          placeholder="输入标题..."
          @input="markDirty"
        />
        <span v-if="isProdMode" class="mode-badge">Demo</span>
      </div>
      <div class="header-center">
        <TagSelector
          v-model="tagIds"
          placeholder="添加标签..."
          @update:modelValue="markDirty"
        />
      </div>
      <div class="header-right">
        <select v-model="articleType" class="type-select" @change="markDirty">
          <option value="snippet">代码片段</option>
          <option value="algorithm">算法</option>
          <option value="html">HTML/Vue</option>
        </select>
        <select v-model="language" class="language-select" @change="handleLanguageChange">
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python" :disabled="isProdMode">Python {{ isProdMode ? '(仅Dev)' : '' }}</option>
          <option value="java" :disabled="isProdMode">Java {{ isProdMode ? '(仅Dev)' : '' }}</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="vue">Vue</option>
        </select>
        <button
          class="run-btn"
          :disabled="isRunning || !code.trim() || !canExecute"
          :title="!canExecute ? '当前模式不支持该语言执行' : ''"
          @click="runCode"
        >
          {{ isRunning ? '运行中...' : '▶ 运行' }}
        </button>
        <button
          class="save-btn"
          :disabled="saving || !canSave"
          @click="saveArticle"
        >
          {{ saving ? '保存中...' : (isEdit ? '更新' : '保存') }}
        </button>
      </div>
    </header>

    <div class="editor-main">
      <SplitPane :initial-left-width="40" :min-left-width="20" :max-left-width="60">
        <template #left>
          <div class="panel">
            <div class="panel-header">
              <span>Markdown 内容</span>
              <div class="panel-tabs">
                <button 
                  class="tab-btn" 
                  :class="{ active: mdViewMode === 'edit' }"
                  @click="mdViewMode = 'edit'"
                >
                  编辑
                </button>
                <button 
                  class="tab-btn" 
                  :class="{ active: mdViewMode === 'preview' }"
                  @click="mdViewMode = 'preview'"
                >
                  预览
                </button>
                <button 
                  class="tab-btn" 
                  :class="{ active: mdViewMode === 'split' }"
                  @click="mdViewMode = 'split'"
                >
                  分屏
                </button>
              </div>
            </div>
            <div class="panel-content md-panel-content">
              <!-- Edit only mode -->
              <div v-if="mdViewMode === 'edit'" class="md-edit-area">
                <MarkdownEditor
                  v-model="content"
                  placeholder="在这里写下你的笔记内容..."
                  @update:modelValue="markDirty"
                />
              </div>
              <!-- Preview only mode -->
              <div v-else-if="mdViewMode === 'preview'" class="md-preview-area">
                <MarkdownPreview :content="content" />
              </div>
              <!-- Split mode -->
              <div v-else class="md-split-area">
                <div class="md-split-edit">
                  <MarkdownEditor
                    v-model="content"
                    placeholder="在这里写下你的笔记内容..."
                    @update:modelValue="markDirty"
                  />
                </div>
                <div class="md-split-divider"></div>
                <div class="md-split-preview">
                  <MarkdownPreview :content="content" />
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <template #right>
          <div class="right-panels">
            <!-- Code Editor Panel -->
            <div class="panel code-panel" :style="{ height: codeHeight + '%' }">
              <div class="panel-header">
                <span>代码</span>
                <span v-if="!canExecute" class="lang-warning">⚠️ 当前模式不支持执行</span>
              </div>
              <div class="panel-content">
                <CodeEditor
                  v-model="code"
                  :language="language"
                  @update:modelValue="markDirty"
                  @save="saveArticle"
                  @run="runCode"
                />
              </div>
            </div>
            
            <!-- Horizontal Resizer -->
            <div 
              class="horizontal-resizer"
              @mousedown="startVerticalResize"
            >
              <div class="resizer-handle-h"></div>
            </div>
            
            <!-- Preview Panel -->
            <div class="panel preview-panel" :style="{ height: (100 - codeHeight) + '%' }">
              <HtmlPreview
                v-if="showHtmlPreview"
                :code="code"
                :language="language"
              />
              <CodePreview
                v-else
                :logs="executionLogs"
                :is-running="isRunning"
                @clear="clearLogs"
              />
            </div>
          </div>
        </template>
      </SplitPane>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '../stores/article'
import { useUiStore } from '../stores/ui'
import { executorService } from '../services'
import { 
  CodeEditor, 
  MarkdownEditor,
  MarkdownPreview,
  SplitPane, 
  CodePreview, 
  HtmlPreview 
} from '../components/editor'
import { TagSelector } from '../components/tag'
import { isProdMode, isLanguageSupported } from '../utils/mode'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const uiStore = useUiStore()

// Form state
const title = ref('')
const content = ref('')
const code = ref('')
const articleType = ref('snippet')
const language = ref('javascript')
const tagIds = ref([])
const saving = ref(false)
const isDirty = ref(false)
const mdViewMode = ref('split') // 'edit', 'preview', 'split'

// Execution state
const executionLogs = ref([])
const isRunning = ref(false)
let worker = null
let executionTimeout = null

// Layout state
const codeHeight = ref(60)
let isVerticalResizing = false

// Computed
const isEdit = computed(() => !!route.params.id)
const canSave = computed(() => title.value.trim().length > 0)
const showHtmlPreview = computed(() => {
  return articleType.value === 'html' || language.value === 'html' || language.value === 'vue'
})

// Check if current language can be executed
const canExecute = computed(() => {
  // HTML/Vue/CSS are for preview, not execution
  if (['html', 'vue', 'css'].includes(language.value)) {
    return true
  }
  return isLanguageSupported(language.value)
})

// Check if language should use backend execution
const useBackendExecution = computed(() => {
  return ['python', 'java'].includes(language.value)
})

function markDirty() {
  isDirty.value = true
}

function handleLanguageChange() {
  markDirty()
  // Show warning if language not supported in current mode
  if (!canExecute.value && !['html', 'vue', 'css'].includes(language.value)) {
    uiStore.showToast('当前模式不支持该语言执行，请切换到Dev模式', 'warning')
  }
}

// Code execution
async function runCode() {
  if (isRunning.value || !code.value.trim()) return
  
  // Check if language is supported
  if (!canExecute.value) {
    uiStore.showToast('当前模式不支持该语言执行', 'error')
    return
  }
  
  // For HTML/Vue, just refresh the preview
  if (showHtmlPreview.value) {
    return
  }
  
  isRunning.value = true
  executionLogs.value = []
  
  // Use backend API for Python/Java or when explicitly needed
  if (useBackendExecution.value) {
    await runCodeOnBackend()
  } else {
    // For JS/TS, use web worker for faster execution
    runCodeInWorker()
  }
}

async function runCodeOnBackend() {
  try {
    const result = await executorService.executeCode(code.value, language.value)
    
    // Process logs from backend
    if (result.logs && result.logs.length > 0) {
      result.logs.forEach(log => {
        executionLogs.value.push({
          type: log.type,
          text: log.text
        })
      })
    } else if (result.output) {
      // If no logs but has output, show as log
      executionLogs.value.push({
        type: result.success ? 'log' : 'error',
        text: result.output
      })
    }
    
    // Show execution time
    if (result.executionTime) {
      executionLogs.value.push({
        type: 'info',
        text: `执行耗时: ${result.executionTime}ms`
      })
    }
    
    if (!result.success && result.error) {
      executionLogs.value.push({
        type: 'error',
        text: result.error
      })
    }
  } catch (err) {
    const errorMessage = err.message || err.data?.message || '执行失败'
    executionLogs.value.push({
      type: 'error',
      text: errorMessage
    })
  } finally {
    isRunning.value = false
  }
}

function runCodeInWorker() {
  // Create worker from inline code
  const workerCode = `
    let isRunning = false;

    function stringify(value) {
      if (value instanceof Error) {
        return value.stack || value.message;
      }
      if (typeof value === 'function') {
        return value.toString();
      }
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    self.onmessage = async (e) => {
      if (isRunning) {
        self.postMessage({ type: 'error', text: '已有代码在执行中' });
        return;
      }
      isRunning = true;

      const code = e.data;

      const collect = (type, args) => {
        const text = args.map(item => stringify(item)).join(' ');
        self.postMessage({ type, text });
      };

      const consoleProxy = {
        log: (...args) => collect('log', args),
        info: (...args) => collect('info', args),
        warn: (...args) => collect('warn', args),
        error: (...args) => collect('error', args),
      };

      try {
        const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
        const executor = new AsyncFunction('console', code);
        const result = await executor(consoleProxy);
        if (result !== undefined) {
          self.postMessage({ type: 'result', text: stringify(result) });
        } else {
          self.postMessage({ type: 'success', text: '执行完成' });
        }
      } catch (error) {
        self.postMessage({ type: 'error', text: stringify(error) });
      } finally {
        isRunning = false;
        self.postMessage({ type: 'done' });
      }
    };
  `
  
  const blob = new Blob([workerCode], { type: 'application/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  
  if (worker) {
    worker.terminate()
  }
  
  worker = new Worker(workerUrl)
  
  // Set timeout (10 seconds)
  executionTimeout = setTimeout(() => {
    if (worker) {
      worker.terminate()
      worker = null
    }
    executionLogs.value.push({ type: 'error', text: '执行超时 (10秒)' })
    isRunning.value = false
  }, 10000)
  
  worker.onmessage = (e) => {
    const { type, text } = e.data
    
    if (type === 'done') {
      clearTimeout(executionTimeout)
      isRunning.value = false
      URL.revokeObjectURL(workerUrl)
      return
    }
    
    executionLogs.value.push({ type, text })
  }
  
  worker.onerror = (e) => {
    clearTimeout(executionTimeout)
    executionLogs.value.push({ type: 'error', text: e.message || '执行错误' })
    isRunning.value = false
    URL.revokeObjectURL(workerUrl)
  }
  
  worker.postMessage(code.value)
}

function clearLogs() {
  executionLogs.value = []
}

// Vertical resizer functionality
function startVerticalResize(e) {
  e.preventDefault()
  isVerticalResizing = true
  document.addEventListener('mousemove', handleVerticalResize)
  document.addEventListener('mouseup', stopVerticalResize)
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

function handleVerticalResize(e) {
  if (!isVerticalResizing) return
  
  const container = document.querySelector('.right-panels')
  if (!container) return
  
  const containerRect = container.getBoundingClientRect()
  const percentage = ((e.clientY - containerRect.top) / containerRect.height) * 100
  codeHeight.value = Math.min(Math.max(percentage, 20), 80)
}

function stopVerticalResize() {
  isVerticalResizing = false
  document.removeEventListener('mousemove', handleVerticalResize)
  document.removeEventListener('mouseup', stopVerticalResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

async function loadArticle(id) {
  try {
    const article = await articleStore.fetchArticle(id)
    title.value = article.title || ''
    content.value = article.content || ''
    code.value = article.code || ''
    articleType.value = article.type || 'snippet'
    language.value = article.language || 'javascript'
    // Load tag IDs from article
    tagIds.value = article.articleTags?.map(at => at.tag?.id || at.tagId).filter(Boolean) || []
    isDirty.value = false
  } catch (err) {
    console.error('Failed to load article:', err)
    router.push({ name: 'Home' })
  }
}

async function saveArticle() {
  if (!canSave.value || saving.value) return

  saving.value = true
  try {
    const data = {
      title: title.value.trim(),
      content: content.value,
      code: code.value,
      type: articleType.value,
      language: language.value,
      tagIds: tagIds.value
    }

    if (isEdit.value) {
      await articleStore.updateArticle(route.params.id, data)
    } else {
      const article = await articleStore.createArticle(data)
      router.replace({ name: 'EditorWithId', params: { id: article.id } })
    }
    
    isDirty.value = false
  } catch (err) {
    console.error('Save failed:', err)
    alert('保存失败: ' + (err.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (isDirty.value) {
    if (!confirm('有未保存的更改，确定要离开吗？')) {
      return
    }
  }
  router.push({ name: 'Home' })
}

onMounted(async () => {
  if (route.params.id) {
    await loadArticle(route.params.id)
  }
})

onUnmounted(() => {
  if (worker) {
    worker.terminate()
  }
  if (executionTimeout) {
    clearTimeout(executionTimeout)
  }
  document.removeEventListener('mousemove', handleVerticalResize)
  document.removeEventListener('mouseup', stopVerticalResize)
})
</script>

<style scoped>
.editor-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--danhui);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bai);
  border-bottom: 1px solid var(--hui);
  gap: 16px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.header-center {
  flex: 0 0 250px;
  min-width: 200px;
}

.back-btn {
  background: transparent;
  color: var(--primary);
  padding: 8px 0;
  white-space: nowrap;
}

.back-btn:hover {
  background: transparent;
  text-decoration: underline;
}

.title-input {
  flex: 1;
  font-size: 18px;
  font-weight: 500;
  border: none;
  background: transparent;
  padding: 8px 0;
}

.title-input:focus {
  outline: none;
  border: none;
  box-shadow: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-select, .language-select {
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.run-btn {
  background: var(--primary, #1890ff);
  color: white;
  padding: 8px 16px;
}

.run-btn:disabled {
  background: #ccc;
}

.save-btn {
  background: var(--success);
  padding: 8px 20px;
}

.save-btn:disabled {
  background: #ccc;
}

.editor-main {
  flex: 1;
  overflow: hidden;
}

.right-panels {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel {
  display: flex;
  flex-direction: column;
  background: var(--bai);
  overflow: hidden;
  height: 100%;
}

.code-panel {
  min-height: 100px;
}

.preview-panel {
  min-height: 100px;
  border-top: 1px solid var(--hui);
}

.panel-header {
  padding: 8px 16px;
  background: var(--danhui);
  border-bottom: 1px solid var(--hui);
  font-size: 13px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 4px 10px;
  font-size: 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--bai);
}

.tab-btn.active {
  background: var(--bai);
  border-color: var(--primary);
  color: var(--primary);
}

.md-panel-content {
  display: flex;
  flex-direction: column;
}

.md-edit-area,
.md-preview-area {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.md-split-area {
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.md-split-edit,
.md-split-preview {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.md-split-divider {
  width: 1px;
  background: var(--hui);
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  height: 100%;
}

.horizontal-resizer {
  height: 6px;
  background: var(--hui, #e0e0e0);
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.horizontal-resizer:hover {
  background: var(--primary, #1890ff);
}

.resizer-handle-h {
  width: 30px;
  height: 2px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 1px;
}

.horizontal-resizer:hover .resizer-handle-h {
  background: rgba(255, 255, 255, 0.5);
}

.mode-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: #fff3cd;
  color: #856404;
  text-transform: uppercase;
}

.lang-warning {
  margin-left: auto;
  font-size: 12px;
  color: #856404;
}

.language-select option:disabled {
  color: #999;
}
</style>
