import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tagService } from '../services/tagService'

export const useTagStore = defineStore('tag', () => {
	const tags = ref([])
	const loading = ref(false)
	const error = ref(null)
	const selectedTagId = ref(null)
	const tagArticles = ref([])

	// Computed
	const sortedTags = computed(() => {
		return [...tags.value].sort((a, b) => a.name.localeCompare(b.name))
	})

	const tagsWithCount = computed(() => {
		return tags.value.map(tag => ({
			...tag,
			articleCount: tag.articleCount || 0
		}))
	})

	// Mutations
	function setTags (list) {
		tags.value = list
	}

	function addTag (tag) {
		tags.value.push(tag)
	}

	function removeTag (id) {
		tags.value = tags.value.filter(t => t.id !== id)
	}

	function setLoading (value) {
		loading.value = value
	}

	function setError (err) {
		error.value = err
	}

	function clearError () {
		error.value = null
	}

	function setSelectedTagId (id) {
		selectedTagId.value = id
	}

	function setTagArticles (articles) {
		tagArticles.value = articles
	}

	// API Actions
	async function fetchTags () {
		loading.value = true
		error.value = null
		try {
			const response = await tagService.getTags()
			setTags(response.data || response)
			return tags.value
		} catch (err) {
			error.value = err.message || 'Failed to fetch tags'
			throw err
		} finally {
			loading.value = false
		}
	}

	async function createTag (name) {
		loading.value = true
		error.value = null
		try {
			const response = await tagService.createTag(name)
			const tag = response.data || response
			addTag(tag)
			return tag
		} catch (err) {
			error.value = err.message || 'Failed to create tag'
			throw err
		} finally {
			loading.value = false
		}
	}

	async function fetchTagArticles (tagId) {
		loading.value = true
		error.value = null
		try {
			const response = await tagService.getTagArticles(tagId)
			const articles = response.data || response
			setTagArticles(articles)
			setSelectedTagId(tagId)
			return articles
		} catch (err) {
			error.value = err.message || 'Failed to fetch tag articles'
			throw err
		} finally {
			loading.value = false
		}
	}

	function clearTagFilter () {
		selectedTagId.value = null
		tagArticles.value = []
	}

	return {
		tags,
		loading,
		error,
		selectedTagId,
		tagArticles,
		sortedTags,
		tagsWithCount,
		setTags,
		addTag,
		removeTag,
		setLoading,
		setError,
		clearError,
		setSelectedTagId,
		setTagArticles,
		fetchTags,
		createTag,
		fetchTagArticles,
		clearTagFilter
	}
})
