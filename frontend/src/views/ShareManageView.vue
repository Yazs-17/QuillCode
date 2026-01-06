<template>
  <AppLayout :show-sidebar="false">
    <div class="share-manage-content">
      <div class="content-header">
        <h2>分享管理</h2>
      </div>

      <LoadingState v-if="loading" text="加载中..." />

      <EmptyState
        v-else-if="shares.length === 0"
        icon="link"
        title="暂无分享链接"
        description="在文章详情页点击分享按钮创建分享链接"
        action-text="浏览文章"
        @action="goHome"
      />

      <div v-else class="shares-list">
        <div 
          v-for="share in shares" 
          :key="share.id" 
          class="share-card"
          :class="{ expired: isExpired(share) }"
        >
          <div class="share-info">
            <h3 class="article-title">{{ share.article?.title || '未知文章' }}</h3>
            <div class="share-meta">
              <span class="share-status" :class="{ expired: isExpired(share) }">
                {{ isExpired(share) ? '已过期' : '有效' }}
              </span>
              <span class="share-date">
                创建于 {{ formatDate(share.createdAt) }}
              </span>
              <span class="share-expires">
                {{ isExpired(share) ? '已于' : '将于' }} {{ formatDate(share.expiresAt) }} {{ isExpired(share) ? '过期' : '过期' }}
              </span>
            </div>
          </div>

          <div class="share-actions">
            <button 
              class="copy-btn" 
              :disabled="isExpired(share)"
              @click="copyShareUrl(share)"
            >
              {{ copiedId === share.id ? '已复制' : '复制链接' }}
            </button>
            <button 
              class="preview-btn"
              :disabled="isExpired(share)"
              @click="previewShare(share)"
            >
              预览
            </button>
            <button 
              class="delete-btn"
              @click="confirmDelete(share)"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click.self="showDeleteDialog = false">
      <div class="dialog">
        <h3>确认删除</h3>
        <p>确定要删除这个分享链接吗？删除后访客将无法通过此链接访问文章。</p>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showDeleteDialog = false">取消</button>
          <button class="confirm-btn" @click="deleteShare">确认删除</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { shareService } from '../services'
import { useUiStore } from '../stores/ui'
import { AppLayout } from '../components/layout'
import { LoadingState, EmptyState } from '../components/common'

const router = useRouter()
const uiStore = useUiStore()

const loading = ref(true)
const shares = ref([])
const showDeleteDialog = ref(false)
const shareToDelete = ref(null)
const copiedId = ref(null)

async function loadShares() {
  loading.value = true
  try {
    shares.value = await shareService.getMyShares()
  } catch (err) {
    console.error('Failed to load shares:', err)
  } finally {
    loading.value = false
  }
}

function isExpired(share) {
  return new Date() > new Date(share.expiresAt)
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getShareUrl(share) {
  return `${window.location.origin}/share/${share.token}`
}

function copyShareUrl(share) {
  const url = getShareUrl(share)
  navigator.clipboard.writeText(url).then(() => {
    copiedId.value = share.id
    uiStore.showToast('链接已复制', 'success')
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  }).catch(() => {
    // Fallback
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copiedId.value = share.id
    uiStore.showToast('链接已复制', 'success')
    setTimeout(() => {
      copiedId.value = null
    }, 2000)
  })
}

function previewShare(share) {
  window.open(`/share/${share.token}`, '_blank')
}

function confirmDelete(share) {
  shareToDelete.value = share
  showDeleteDialog.value = true
}

async function deleteShare() {
  if (!shareToDelete.value) return
  
  try {
    await shareService.deleteShare(shareToDelete.value.id)
    shares.value = shares.value.filter(s => s.id !== shareToDelete.value.id)
    uiStore.showToast('分享链接已删除', 'success')
  } catch (err) {
    console.error('Failed to delete share:', err)
  } finally {
    showDeleteDialog.value = false
    shareToDelete.value = null
  }
}

function goHome() {
  router.push({ name: 'Home' })
}

onMounted(() => {
  loadShares()
})
</script>

<style scoped>
.share-manage-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.content-header {
  margin-bottom: 24px;
}

.content-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.shares-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bai);
  border-radius: 8px;
  border: 1px solid var(--hui);
}

.share-card.expired {
  opacity: 0.7;
}

.share-info {
  flex: 1;
  min-width: 0;
}

.article-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.share-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.share-status {
  padding: 2px 8px;
  border-radius: 4px;
  background: #e8f5e9;
  color: #388e3c;
  font-size: 12px;
}

.share-status.expired {
  background: #ffebee;
  color: #c62828;
}

.share-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.copy-btn, .preview-btn, .delete-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: none;
}

.copy-btn {
  background: var(--primary);
  color: white;
}

.copy-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.copy-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.preview-btn {
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
}

.preview-btn:hover:not(:disabled) {
  background: rgba(74, 144, 217, 0.1);
}

.preview-btn:disabled {
  color: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
}

.delete-btn {
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.delete-btn:hover {
  background: rgba(244, 67, 54, 0.1);
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
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  background: var(--danger);
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

@media (max-width: 640px) {
  .share-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .share-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
