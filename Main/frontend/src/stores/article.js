import { defineStore } from 'pinia'
import { ref } from 'vue'
import { articleService } from '../services/articleService'

export const useArticleStore = defineStore('article', () => {
	const articles = ref([])
	const currentArticle = ref(null)
	const loading = ref(false)
	const error = ref(null)

	function setArticles (list) {
		articles.value = list
	}

	function setCurrentArticle (article) {
		currentArticle.value = article
	}

	function addArticle (article) {
		articles.value.unshift(article)
	}

	function updateArticleInList (id, updates) {
		const index = articles.value.findIndex(a => a.id === id)
		if (index !== -1) {
			articles.value[index] = { ...articles.value[index], ...updates }
		}
		if (currentArticle.value?.id === id) {
			currentArticle.value = { ...currentArticle.value, ...updates }
		}
	}

	function removeArticleFromList (id) {
		articles.value = articles.value.filter(a => a.id !== id)
		if (currentArticle.value?.id === id) {
			currentArticle.value = null
		}
	}

	function setLoading (value) {
		loading.value = value
	}

	function clearError () {
		error.value = null
	}

	// API actions
	async function fetchArticles () {
		loading.value = true
		error.value = null
		try {
			const response = await articleService.getArticles()
			setArticles(response.data || response)
			return articles.value
		} catch (err) {
			error.value = err.message || 'Failed to fetch articles'
			throw err
		} finally {
			loading.value = false
		}
	}

	async function fetchArticle (id) {
		loading.value = true
		error.value = null
		try {
			const response = await articleService.getArticle(id)
			const article = response.data || response
			setCurrentArticle(article)
			return article
		} catch (err) {
			error.value = err.message || 'Failed to fetch article'
			throw err
		} finally {
			loading.value = false
		}
	}

	async function createArticle (data) {
		loading.value = true
		error.value = null
		try {
			const response = await articleService.createArticle(data)
			const article = response.data || response
			addArticle(article)
			return article
		} catch (err) {
			error.value = err.message || 'Failed to create article'
			throw err
		} finally {
			loading.value = false
		}
	}

	async function updateArticle (id, data) {
		loading.value = true
		error.value = null
		try {
			const response = await articleService.updateArticle(id, data)
			const article = response.data || response
			updateArticleInList(id, article)
			return article
		} catch (err) {
			error.value = err.message || 'Failed to update article'
			throw err
		} finally {
			loading.value = false
		}
	}

	async function deleteArticle (id) {
		loading.value = true
		error.value = null
		try {
			await articleService.deleteArticle(id)
			removeArticleFromList(id)
		} catch (err) {
			error.value = err.message || 'Failed to delete article'
			throw err
		} finally {
			loading.value = false
		}
	}

	return {
		articles,
		currentArticle,
		loading,
		error,
		setArticles,
		setCurrentArticle,
		addArticle,
		updateArticleInList,
		removeArticleFromList,
		setLoading,
		clearError,
		fetchArticles,
		fetchArticle,
		createArticle,
		updateArticle,
		deleteArticle
	}
})
