<template>
  <div class="tag-selector">
    <div class="selected-tags" v-if="selectedTags.length > 0">
      <span
        v-for="tag in selectedTags"
        :key="tag.id"
        class="tag-chip selected"
        @click="removeTag(tag.id)"
      >
        {{ tag.name }}
        <span class="remove-icon">×</span>
      </span>
    </div>

    <div class="tag-input-wrapper">
      <input
        v-model="searchQuery"
        type="text"
        class="tag-input"
        :placeholder="placeholder"
        @focus="showDropdown = true"
        @keydown.enter.prevent="handleEnter"
        @keydown.escape="showDropdown = false"
      />
      <button
        v-if="searchQuery.trim() && !matchingTag"
        class="create-tag-btn"
        @click="createNewTag"
        title="创建新标签"
      >
        +
      </button>
    </div>

    <div v-if="showDropdown && filteredTags.length > 0" class="tag-dropdown">
      <div
        v-for="tag in filteredTags"
        :key="tag.id"
        class="tag-option"
        :class="{ disabled: isSelected(tag.id) }"
        @click="selectTag(tag)"
      >
        <span class="tag-name">{{ tag.name }}</span>
        <span class="tag-count" v-if="tag.articleCount !== undefined">
          {{ tag.articleCount }}
        </span>
      </div>
    </div>

    <div v-if="showDropdown && searchQuery.trim() && filteredTags.length === 0" class="tag-dropdown">
      <div class="no-results">
        没有匹配的标签
        <button class="create-inline-btn" @click="createNewTag">
          创建 "{{ searchQuery.trim() }}"
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTagStore } from '../../stores/tag'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '添加标签...'
  }
})

const emit = defineEmits(['update:modelValue'])

const tagStore = useTagStore()
const { tags, loading } = storeToRefs(tagStore)

const searchQuery = ref('')
const showDropdown = ref(false)

// Computed
const selectedTags = computed(() => {
  return tags.value.filter(tag => props.modelValue.includes(tag.id))
})

const filteredTags = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return tags.value.filter(tag => !props.modelValue.includes(tag.id))
  }
  return tags.value.filter(tag => 
    tag.name.toLowerCase().includes(query) && !props.modelValue.includes(tag.id)
  )
})

const matchingTag = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  return tags.value.find(tag => tag.name.toLowerCase() === query)
})

// Methods
function isSelected(tagId) {
  return props.modelValue.includes(tagId)
}

function selectTag(tag) {
  if (isSelected(tag.id)) return
  emit('update:modelValue', [...props.modelValue, tag.id])
  searchQuery.value = ''
  showDropdown.value = false
}

function removeTag(tagId) {
  emit('update:modelValue', props.modelValue.filter(id => id !== tagId))
}

async function createNewTag() {
  const name = searchQuery.value.trim()
  if (!name) return

  try {
    const newTag = await tagStore.createTag(name)
    emit('update:modelValue', [...props.modelValue, newTag.id])
    searchQuery.value = ''
    showDropdown.value = false
  } catch (err) {
    console.error('Failed to create tag:', err)
  }
}

function handleEnter() {
  if (matchingTag.value) {
    selectTag(matchingTag.value)
  } else if (searchQuery.value.trim()) {
    createNewTag()
  }
}

// Click outside to close dropdown
function handleClickOutside(e) {
  const el = document.querySelector('.tag-selector')
  if (el && !el.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  tagStore.fetchTags()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.tag-selector {
  position: relative;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--primary);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.tag-chip:hover {
  background: var(--primary-hover);
}

.remove-icon {
  font-size: 14px;
  line-height: 1;
  opacity: 0.8;
}

.tag-chip:hover .remove-icon {
  opacity: 1;
}

.tag-input-wrapper {
  display: flex;
  gap: 8px;
}

.tag-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--hui);
  border-radius: 4px;
  font-size: 14px;
}

.tag-input:focus {
  outline: none;
  border-color: var(--primary);
}

.create-tag-btn {
  padding: 8px 12px;
  background: var(--success);
  color: white;
  border-radius: 4px;
  font-size: 16px;
  line-height: 1;
}

.tag-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--bai);
  border: 1px solid var(--hui);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
}

.tag-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.tag-option:hover:not(.disabled) {
  background: var(--danhui);
}

.tag-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-name {
  font-size: 14px;
}

.tag-count {
  font-size: 12px;
  color: #999;
  background: var(--danhui);
  padding: 2px 6px;
  border-radius: 10px;
}

.no-results {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.create-inline-btn {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 8px;
  background: var(--primary);
  color: white;
  border-radius: 4px;
  font-size: 13px;
}
</style>
