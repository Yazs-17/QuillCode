<!--
  ============================================
  Executor Module Demo - 在线代码编辑器
  ============================================
-->

<template>
  <div class="app">
    <h1>⚡ 在线代码执行器</h1>
    
    <div class="editor-container">
      <!-- 语言选择 -->
      <div class="toolbar">
        <select v-model="language">
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
        </select>
        <button @click="runCode" :disabled="loading" class="run-btn">
          {{ loading ? '执行中...' : '▶ 运行' }}
        </button>
      </div>

      <!-- 代码编辑区 -->
      <div class="editor-wrapper">
        <div class="panel">
          <div class="panel-header">📝 代码</div>
          <textarea
            v-model="code"
            class="code-editor"
            placeholder="在这里输入代码..."
            spellcheck="false"
          ></textarea>
        </div>

        <div class="panel">
          <div class="panel-header">
            📤 输出
            <span v-if="result" :class="['status', result.success ? 'success' : 'error']">
              {{ result.success ? '✓ 成功' : '✗ 失败' }}
              ({{ result.executionTime }}ms)
            </span>
          </div>
          <pre class="output">{{ output || '点击运行查看输出...' }}</pre>
        </div>
      </div>
    </div>

    <!-- 示例代码 -->
    <div class="examples">
      <h3>📚 示例代码</h3>
      <div class="example-buttons">
        <button @click="loadExample('hello')">Hello World</button>
        <button @click="loadExample('loop')">循环</button>
        <button @click="loadExample('async')">异步</button>
        <button @click="loadExample('error')">错误处理</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const language = ref('javascript')
const code = ref('console.log("Hello World!")')
const output = ref('')
const result = ref(null)
const loading = ref(false)

// 示例代码
const examples = {
  hello: 'console.log("Hello World!")\nconsole.log("欢迎使用代码执行器")',
  loop: 'for (let i = 1; i <= 5; i++) {\n  console.log(`第 ${i} 次循环`)\n}',
  async: 'console.log("开始")\nawait new Promise(r => setTimeout(r, 1000))\nconsole.log("1秒后")',
  error: 'try {\n  throw new Error("这是一个错误")\n} catch (e) {\n  console.error("捕获错误:", e.message)\n}',
}

const loadExample = (name) => {
  code.value = examples[name]
}

const runCode = async () => {
  loading.value = true
  output.value = ''
  result.value = null

  try {
    const response = await fetch('/executor/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.value,
        language: language.value,
      }),
    })

    const data = await response.json()
    result.value = data
    output.value = data.output || data.error || '无输出'
  } catch (error) {
    output.value = `请求失败: ${error.message}`
    result.value = { success: false, executionTime: 0 }
  } finally {
    loading.value = false
  }
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }

.app {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

h1 { text-align: center; margin-bottom: 20px; }

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.toolbar select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.run-btn {
  padding: 8px 20px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.run-btn:hover:not(:disabled) { background: #389e0d; }
.run-btn:disabled { background: #ccc; }

.editor-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 768px) {
  .editor-wrapper { grid-template-columns: 1fr; }
}

.panel {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.panel-header {
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status { font-size: 12px; }
.status.success { color: #52c41a; }
.status.error { color: #ff4d4f; }

.code-editor, .output {
  width: 100%;
  height: 300px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
  line-height: 1.5;
  border: none;
  resize: none;
}

.code-editor { background: #1e1e1e; color: #d4d4d4; }
.code-editor:focus { outline: none; }

.output {
  background: #f8f8f8;
  color: #333;
  overflow: auto;
  white-space: pre-wrap;
  margin: 0;
}

.examples {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.examples h3 { margin-bottom: 10px; }

.example-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.example-buttons button {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.example-buttons button:hover { background: #f0f0f0; }
</style>
