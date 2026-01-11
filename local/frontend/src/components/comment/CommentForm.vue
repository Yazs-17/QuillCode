<template>
  <div class="comment-form">
    <h4>发表评论</h4>
    <div class="form-group">
      <input
        v-model="authorName"
        type="text"
        placeholder="您的昵称"
        class="name-input"
        maxlength="100"
      />
    </div>
    <div class="form-group">
      <textarea
        v-model="content"
        placeholder="写下您的评论..."
        class="content-input"
        rows="4"
        maxlength="2000"
      ></textarea>
    </div>
    <div class="form-actions">
      <span class="char-count">{{ content.length }}/2000</span>
      <button
        class="submit-btn"
        :disabled="!canSubmit || submitting"
        @click="submitComment"
      >
        {{ submitting ? '提交中...' : '提交评论' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit'])

const authorName = ref('')
const content = ref('')

const canSubmit = computed(() => {
  return authorName.value.trim().length > 0 && content.value.trim().length > 0
})

function submitComment() {
  if (!canSubmit.value || props.submitting) return
  
  emit('submit', {
    authorName: authorName.value.trim(),
    content: content.value.trim()
  })
}

function reset() {
  content.value = ''
}

defineExpose({ reset })
</script>

<style scoped>
.comment-form {
  background: var(--danhui);
  border-radius: 8px;
  padding: 20px;
}

.comment-form h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.form-group {
  margin-bottom: 12px;
}

.name-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 14px;
  background: white;
  box-sizing: border-box;
}

.content-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--hui);
  border-radius: 6px;
  font-size: 14px;
  background: white;
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
  font-family: inherit;
}

.name-input:focus,
.content-input:focus {
  outline: none;
  border-color: var(--primary);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 12px;
  color: #999;
}

.submit-btn {
  padding: 8px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
