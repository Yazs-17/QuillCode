<template>
  <div class="code-editor-wrapper">
    <div class="code-editor" ref="containerRef"></div>
    <div class="editor-shortcuts" v-if="showShortcuts">
      <span class="shortcut-item">Ctrl+S 保存</span>
      <span class="shortcut-item">Ctrl+/ 注释</span>
      <span class="shortcut-item">Ctrl+D 复制行</span>
      <span class="shortcut-item">Alt+↑↓ 移动行</span>
      <span class="shortcut-item">Ctrl+Shift+F 格式化</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import loader from '@monaco-editor/loader'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  theme: {
    type: String,
    default: 'vs-dark'
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  minimap: {
    type: Boolean,
    default: false
  },
  lineNumbers: {
    type: String,
    default: 'on'
  },
  fontSize: {
    type: Number,
    default: 14
  },
  tabSize: {
    type: Number,
    default: 2
  },
  showShortcuts: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'ready', 'focus', 'blur', 'save', 'run'])

const containerRef = ref(null)
let editor = null
let monaco = null

// Language mapping for Monaco
const languageMap = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  html: 'html',
  css: 'css',
  vue: 'html',
  json: 'json',
  markdown: 'markdown',
  sql: 'sql',
  shell: 'shell',
  bash: 'shell'
}

function getMonacoLanguage(lang) {
  return languageMap[lang] || lang || 'javascript'
}

async function initEditor() {
  if (!containerRef.value) return

  monaco = await loader.init()

  editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: getMonacoLanguage(props.language),
    theme: props.theme,
    readOnly: props.readOnly,
    minimap: { enabled: props.minimap },
    lineNumbers: props.lineNumbers,
    fontSize: props.fontSize,
    tabSize: props.tabSize,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: 'on',
    folding: true,
    renderLineHighlight: 'line',
    selectOnLineNumbers: true,
    roundedSelection: false,
    cursorStyle: 'line',
    contextmenu: true,
    formatOnPaste: true,
    formatOnType: true
  })

  // Add custom keyboard shortcuts
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    emit('save')
  })

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    emit('run')
  })

  // Listen for content changes
  editor.onDidChangeModelContent(() => {
    const value = editor.getValue()
    emit('update:modelValue', value)
  })

  // Listen for focus/blur
  editor.onDidFocusEditorText(() => {
    emit('focus')
  })

  editor.onDidBlurEditorText(() => {
    emit('blur')
  })

  emit('ready', { editor, monaco })
}

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue || '')
  }
})

// Watch for language changes
watch(() => props.language, (newLang) => {
  if (editor && monaco) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, getMonacoLanguage(newLang))
    }
  }
})

// Watch for theme changes
watch(() => props.theme, (newTheme) => {
  if (monaco) {
    monaco.editor.setTheme(newTheme)
  }
})

// Watch for readOnly changes
watch(() => props.readOnly, (newValue) => {
  if (editor) {
    editor.updateOptions({ readOnly: newValue })
  }
})

// Expose methods for parent components
function getValue() {
  return editor?.getValue() || ''
}

function setValue(value) {
  editor?.setValue(value || '')
}

function focus() {
  editor?.focus()
}

function formatDocument() {
  editor?.getAction('editor.action.formatDocument')?.run()
}

function getEditor() {
  return editor
}

function getMonaco() {
  return monaco
}

defineExpose({
  getValue,
  setValue,
  focus,
  formatDocument,
  getEditor,
  getMonaco
})

onMounted(() => {
  nextTick(() => {
    initEditor()
  })
})

onUnmounted(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
})
</script>

<style scoped>
.code-editor-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.code-editor {
  width: 100%;
  flex: 1;
  min-height: 200px;
}

.editor-shortcuts {
  display: flex;
  gap: 12px;
  padding: 6px 12px;
  background: #1e1e1e;
  border-top: 1px solid #333;
  flex-wrap: wrap;
}

.shortcut-item {
  font-size: 11px;
  color: #888;
  font-family: monospace;
}
</style>
