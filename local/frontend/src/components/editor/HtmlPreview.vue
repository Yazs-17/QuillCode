<template>
  <div class="html-preview">
    <div class="preview-header">
      <span class="preview-title">页面预览</span>
      <div class="preview-actions">
        <button class="refresh-btn" @click="refresh" title="刷新">
          ↻ 刷新
        </button>
      </div>
    </div>
    
    <div class="preview-content">
      <iframe
        ref="iframeRef"
        class="preview-iframe"
        sandbox="allow-scripts allow-same-origin"
        :srcdoc="htmlContent"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'html'
  }
})

const iframeRef = ref(null)
const refreshKey = ref(0)

// Generate full HTML document from code
const htmlContent = computed(() => {
  const code = props.code || ''
  
  // If it's already a complete HTML document, use it directly
  if (code.trim().toLowerCase().startsWith('<!doctype') || 
      code.trim().toLowerCase().startsWith('<html')) {
    return code
  }
  
  // For Vue-like code, wrap in a basic template
  if (props.language === 'vue') {
    return generateVuePreview(code)
  }
  
  // For plain HTML, wrap in a basic document
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 16px; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body>
${code}
</body>
</html>`
})

function generateVuePreview(code) {
  // Extract template, script, and style sections
  const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/i)
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  
  const template = templateMatch ? templateMatch[1].trim() : code
  const script = scriptMatch ? scriptMatch[1].trim() : ''
  const style = styleMatch ? styleMatch[1].trim() : ''
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 16px; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    ${style}
  </style>
</head>
<body>
  <div id="app">${template}</div>
  <script>
    const { createApp, ref, reactive, computed, watch, onMounted } = Vue;
    
    try {
      ${script ? `
        const componentOptions = (function() {
          ${script}
        })();
        
        if (componentOptions && typeof componentOptions === 'object') {
          createApp(componentOptions).mount('#app');
        } else {
          createApp({}).mount('#app');
        }
      ` : `
        createApp({}).mount('#app');
      `}
    } catch (e) {
      document.getElementById('app').innerHTML = '<div style="color: red;">Error: ' + e.message + '</div>';
      console.error(e);
    }
  <\/script>
</body>
</html>`
}

function refresh() {
  refreshKey.value++
  // Force iframe reload by updating srcdoc
  if (iframeRef.value) {
    const content = htmlContent.value
    iframeRef.value.srcdoc = ''
    setTimeout(() => {
      if (iframeRef.value) {
        iframeRef.value.srcdoc = content
      }
    }, 50)
  }
}

// Watch for code changes and auto-refresh (debounced)
let debounceTimer = null
watch(() => props.code, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    refreshKey.value++
  }, 500)
})

defineExpose({
  refresh
})
</script>

<style scoped>
.html-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--danhui, #f5f5f5);
  border-bottom: 1px solid var(--hui, #e0e0e0);
  flex-shrink: 0;
}

.preview-title {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.refresh-btn {
  padding: 4px 8px;
  font-size: 12px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
}

.refresh-btn:hover {
  background: #eee;
  color: #333;
}

.preview-content {
  flex: 1;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
</style>
