<template>
  <div class="markdown-preview" v-html="renderedContent"></div>
</template>

<script setup>
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedContent = computed(() => {
  if (!props.content) {
    return '<p class="empty-hint">在左侧输入Markdown内容，这里会实时预览...</p>'
  }
  return marked.parse(props.content)
})
</script>

<style scoped>
.markdown-preview {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.markdown-preview :deep(h1) {
  font-size: 2em;
  font-weight: 600;
  margin: 0.67em 0;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--hui, #e0e0e0);
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.83em 0;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--hui, #e0e0e0);
}

.markdown-preview :deep(h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 1em 0;
}

.markdown-preview :deep(h4) {
  font-size: 1em;
  font-weight: 600;
  margin: 1.33em 0;
}

.markdown-preview :deep(p) {
  margin: 1em 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-preview :deep(li) {
  margin: 0.5em 0;
}

.markdown-preview :deep(code) {
  background: var(--danhui, #f5f5f5);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9em;
}

.markdown-preview :deep(pre) {
  background: var(--danhui, #f5f5f5);
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-preview :deep(blockquote) {
  margin: 1em 0;
  padding: 0.5em 1em;
  border-left: 4px solid var(--primary, #1890ff);
  background: var(--danhui, #f5f5f5);
  color: #666;
}

.markdown-preview :deep(a) {
  color: var(--primary, #1890ff);
  text-decoration: none;
}

.markdown-preview :deep(a:hover) {
  text-decoration: underline;
}

.markdown-preview :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid var(--hui, #e0e0e0);
  padding: 8px 12px;
  text-align: left;
}

.markdown-preview :deep(th) {
  background: var(--danhui, #f5f5f5);
  font-weight: 600;
}

.markdown-preview :deep(hr) {
  border: none;
  border-top: 1px solid var(--hui, #e0e0e0);
  margin: 2em 0;
}

.markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
}

.markdown-preview :deep(.empty-hint) {
  color: #999;
  font-style: italic;
}
</style>
