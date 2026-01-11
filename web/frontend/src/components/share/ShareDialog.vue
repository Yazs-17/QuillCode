<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="share-dialog">
      <div class="dialog-header">
        <h3>分享文章</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-body">
        <div class="form-group">
          <label>过期时间</label>
          <select v-model="expiresInDays" class="expires-select">
            <option :value="1">1 天</option>
            <option :value="7">7 天</option>
            <option :value="30">30 天</option>
            <option :value="90">90 天</option>
            <option :value="365">1 年</option>
          </select>
        </div>

        <div v-if="shareUrl" class="share-result">
          <label>分享链接</label>
          <div class="share-url-container">
            <input 
              type="text" 
              :value="shareUrl" 
              readonly 
              class="share-url-input"
              ref="urlInput"
            />
            <button class="copy-btn" @click="copyUrl">
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>
          <p class="expires-info">
            链接将于 {{ formattedExpiresAt }} 过期
          </p>
        </div>
      </div>

      <div class="dialog-footer">
        <button 
          v-if="!shareUrl"
          class="create-btn" 
          :disabled="creating"
          @click="createShare"
        >
          {{ creating ? '创建中...' : '创建分享链接' }}
        </button>
        <button 
          v-else
          class="new-btn" 
          @click="resetShare"
        >
          创建新链接
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { shareService } from '../../services'

const props = defineProps({
  articleId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'created'])

const expiresInDays = ref(7)
const creating = ref(false)
const shareData = ref(null)
const copied = ref(false)

const shareUrl = computed(() => {
  if (!shareData.value) return ''
  return `${window.location.origin}/share/${shareData.value.token}`
})

const formattedExpiresAt = computed(() => {
  if (!shareData.value) return ''
  const date = new Date(shareData.value.expiresAt)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

async function createShare() {
  if (creating.value) return
  
  creating.value = true
  try {
    const result = await shareService.createShare(props.articleId, expiresInDays.value)
    shareData.value = result
    emit('created', result)
  } catch (err) {
    console.error('Failed to create share:', err)
    alert('创建分享链接失败: ' + (err.message || '未知错误'))
  } finally {
    creating.value = false
  }
}

function copyUrl() {
  if (!shareUrl.value) return
  
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }).catch(() => {
    // Fallback for older browsers
    const input = document.createElement('input')
    input.value = shareUrl.value
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  })
}

function resetShare() {
  shareData.value = null
  copied.value = false
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

.share-dialog {
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.expires-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.share-result {
  margin-top: 20px;
}

.share-result label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.share-url-container {
  display: flex;
  gap: 8px;
}

.share-url-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 13px;
  background: var(--danhui);
  color: #333;
}

.copy-btn {
  padding: 10px 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.copy-btn:hover {
  background: var(--primary-hover);
}

.expires-info {
  margin: 12px 0 0 0;
  font-size: 13px;
  color: #999;
}

.dialog-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--hui);
  display: flex;
  justify-content: flex-end;
}

.create-btn, .new-btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.create-btn {
  background: var(--primary);
  color: white;
  border: none;
}

.create-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.create-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.new-btn {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}

.new-btn:hover {
  background: rgba(74, 144, 217, 0.1);
}
</style>
