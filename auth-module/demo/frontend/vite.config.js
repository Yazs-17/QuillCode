import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	plugins: [vue()],
	server: {
		port: 5173,
		proxy: {
			'/auth': 'http://localhost:3000'
		}
	}
})
