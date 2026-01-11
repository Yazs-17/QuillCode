import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
	const user = ref(null)
	const token = ref(localStorage.getItem('token') || null)
	const loading = ref(false)
	const error = ref(null)

	// Single-user mode state
	const authMode = ref({
		singleUserMode: false,
		passwordProtected: false
	})
	const authModeLoaded = ref(false)

	const isAuthenticated = computed(() => !!token.value)
	const isSingleUserMode = computed(() => authMode.value.singleUserMode)
	const isPasswordProtected = computed(() => authMode.value.passwordProtected)

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

	/**
	 * Fetch authentication mode from server
	 */
	async function fetchAuthMode () {
		try {
			const response = await authService.getAuthMode()
			authMode.value = response
			authModeLoaded.value = true
			return response
		} catch (err) {
			// Default to multi-user mode if server doesn't support auth mode endpoint
			authMode.value = { singleUserMode: false, passwordProtected: false }
			authModeLoaded.value = true
			return authMode.value
		}
	}

	/**
	 * Login for single-user mode (password-free or with local password)
	 */
	async function localLogin (password = null) {
		loading.value = true
		error.value = null
		try {
			const response = await authService.localLogin(password)
			const { accessToken, user: userData } = response
			setToken(accessToken)
			setUser(userData)
			return userData
		} catch (err) {
			error.value = err.message || 'Local login failed'
			throw err
		} finally {
			loading.value = false
		}
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

	// Initialize: fetch auth mode and profile if token exists
	async function init () {
		// Fetch auth mode first
		await fetchAuthMode()

		if (token.value && !user.value) {
			await fetchProfile()
		}
	}

	return {
		user,
		token,
		loading,
		error,
		authMode,
		authModeLoaded,
		isAuthenticated,
		isSingleUserMode,
		isPasswordProtected,
		setToken,
		setUser,
		clearError,
		fetchAuthMode,
		localLogin,
		register,
		login,
		fetchProfile,
		logout,
		init
	}
})
