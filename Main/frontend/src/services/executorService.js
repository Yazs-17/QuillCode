import api from './api'

/**
 * Execute code on the backend
 * @param {string} code - The code to execute
 * @param {string} language - The programming language
 * @param {string} input - Optional input for the code
 * @returns {Promise<{success: boolean, output: string, error: string|null, executionTime: number, logs: Array}>}
 */
export async function executeCode (code, language, input = '') {
	const response = await api.post('/executor/run', {
		code,
		language,
		input
	})
	return response.data
}

/**
 * Get executor info (mode and supported languages)
 * @returns {Promise<{mode: string, supportedLanguages: string[]}>}
 */
export async function getExecutorInfo () {
	const response = await api.get('/executor/info')
	return response.data
}

export default {
	executeCode,
	getExecutorInfo
}
