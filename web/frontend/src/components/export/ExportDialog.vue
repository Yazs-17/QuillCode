<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="export-dialog">
      <div class="dialog-header">
        <h3>导出数据</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <p class="export-description">
          选择导出格式，将您的笔记数据导出到本地。
        </p>

        <div class="export-options">
          <div 
            class="export-option" 
            :class="{ selected: selectedFormat === 'json' }"
            @click="selectedFormat = 'json'"
          >
            <div class="option-icon">📄</div>
            <div class="option-content">
              <div class="option-title">JSON 格式</div>
              <div class="option-desc">包含完整元数据，可用于数据迁移和备份</div>
            </div>
            <div class="option-check" v-if="selectedFormat === 'json'">✓</div>
          </div>

          <div 
            class="export-option" 
            :class="{ selected: selectedFormat === 'markdown' }"
            @click="selectedFormat = 'markdown'"
          >
            <div class="option-icon">📦</div>
            <div class="option-content">
              <div class="option-title">Markdown ZIP</div>
              <div class="option-desc">每篇笔记导出为独立 Markdown 文件</div>
            </div>
            <div class="option-check" v-if="selectedFormat === 'markdown'">✓</div>
          </div>
        </div>

        <div v-if="exportStatus" class="export-status" :class="exportStatus.type">
          {{ exportStatus.message }}
        </div>
      </div>

      <div class="dialog-footer">
        <button class="cancel-btn" @click="$emit('close')">取消</button>
        <button 
          class="export-btn" 
          :disabled="exporting"
          @click="handleExport"
        >
          {{ exporting ? '导出中...' : '导出' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  getExportService, 
  downloadBlob, 
  getExportFileName 
} from '../../services/exportService'

const emit = defineEmits(['close', 'exported'])

const selectedFormat = ref('json')
const exporting = ref(false)
const exportStatus = ref(null)

async function handleExport() {
  if (exporting.value) return
  
  exporting.value = true
  exportStatus.value = null
  
  try {
    const exportService = getExportService()
    let blob
    let fileName
    
    if (selectedFormat.value === 'json') {
      blob = await exportService.exportToJSON()
      fileName = getExportFileName('json')
    } else {
      blob = await exportService.exportToMarkdown()
      fileName = getExportFileName('zip')
    }
    
    downloadBlob(blob, fileName)
    
    exportStatus.value = {
      type: 'success',
      message: `导出成功！文件已下载: ${fileName}`
    }
    
    emit('exported', { format: selectedFormat.value, fileName })
    
    // Auto close after success
    setTimeout(() => {
      emit('close')
    }, 2000)
  } catch (err) {
    console.error('Export failed:', err)
    exportStatus.value = {
      type: 'error',
      message: '导出失败: ' + (err.message || '未知错误')
    }
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
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

.export-dialog {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--hui);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.dialog-body {
  padding: 20px;
}

.export-description {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 14px;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid var(--hui);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  border-color: #bbb;
  background: var(--danhui);
}

.export-option.selected {
  border-color: var(--primary);
  background: rgba(74, 144, 217, 0.05);
}

.option-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}

.option-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 13px;
  color: #999;
}

.option-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.export-status {
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.export-status.success {
  background: #d4edda;
  color: #155724;
}

.export-status.error {
  background: #f8d7da;
  color: #721c24;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--hui);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  padding: 10px 20px;
  background: transparent;
  color: #666;
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.cancel-btn:hover {
  background: var(--danhui);
  border-color: #bbb;
}

.export-btn {
  padding: 10px 24px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.export-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.export-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
