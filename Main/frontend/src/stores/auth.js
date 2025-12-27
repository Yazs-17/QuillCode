import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
	const user = ref(null)
	const token = ref(localStorage.getItem('token') || null)
	const loading = ref(false)
	const error = ref(null)

	const isAuthenticated = computed(() => !!token.value)

	function setToken (newToken) {
		token.value = newToken
		if (newToken) {
			localStorage.setItem('token', newToken)
		} else {
			localStorage.removeItem('token')
		}
	}

	function setUser (userData) {
		user.value = userData
	}

	function clearError () {
		error.value = null
	}

	async function register (username, email, password) {
		loading.value = true
		error.value = null
		try {
			const response = await authService.register(username, email, password)
			return response
		} catch (err) {
			error.value = err.message || 'Registration failed'
			throw err
		} finally {
			loading.value = false
		}
	}

	async function login (username, password) {
		loading.value = true
		error.value = null
		try {
			const response = await authService.login(username, password)
			const { accessToken, user: userData } = response
			setToken(accessToken)
			setUser(userData)
			return userData
		} catch (err) {
			error.value = err.message || 'Login failed'
			throw err
		} finally {
			loading.value = false
		}
	}

	async function fetchProfile () {
		if (!token.value) return null
		loading.value = true
		try {
			const response = await authService.getProfile()
			setUser(response)
			return response
		} catch (err) {
			// Token invalid, clear it
			logout()
			return null
		} finally {
			loading.value = false
		}
	}

	function logout () {
		user.value = null
		setToken(null)
	}

	// Initialize: fetch profile if token exists
	async function init () {
		if (token.value && !user.value) {
			await fetchProfile()
		}
	}

	return {
		user,
		token,
		loading,
		error,
		isAuthenticated,
		setToken,
		setUser,
		clearError,
		register,
		login,
		fetchProfile,
		logout,
		init
	}
})
