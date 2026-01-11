import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
	const sidebarOpen = ref(true)
	const theme = ref(localStorage.getItem('theme') || 'light')
	const toast = ref(null)

	function toggleSidebar () {
		sidebarOpen.value = !sidebarOpen.value
	}

	function setSidebarOpen (value) {
		sidebarOpen.value = value
	}

	function setTheme (newTheme) {
		theme.value = newTheme
		localStorage.setItem('theme', newTheme)
	}

	function showToast (message, type = 'info', duration = 3000) {
		toast.value = { message, type, duration }
		setTimeout(() => {
			toast.value = null
		}, duration)
	}

	return {
		sidebarOpen,
		theme,
		toast,
		toggleSidebar,
		setSidebarOpen,
		setTheme,
		showToast
	}
})
