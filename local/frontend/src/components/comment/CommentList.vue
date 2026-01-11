<template>
  <div class="comment-list">
    <h4>评论 ({{ comments.length }})</h4>
    
    <div v-if="loading" class="loading">
      <span>加载评论中...</span>
    </div>
    
    <div v-else-if="comments.length === 0" class="empty">
      <span>暂无评论，来发表第一条评论吧！</span>
    </div>
    
    <div v-else class="comments">
      <div 
        v-for="comment in comments" 
        :key="comment.id" 
        class="comment-item"
      >
        <div class="comment-header">
          <span class="author-name">{{ comment.authorName }}</span>
          <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  comments: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

function formatTime(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  
  // Less than 1 minute
  if (diff < 60000) {
    return '刚刚'
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)} 天前`
  }
  
  // Format as date
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.comment-list {
  margin-top: 24px;
}

.comment-list h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.loading,
.empty {
  padding: 24px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.comments {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  background: var(--danhui);
  border-radius: 8px;
  padding: 16px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.author-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-content {
  font-size: 14px;
  color: #555;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
