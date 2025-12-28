<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'

const props = defineProps({
	title: {
		type: String,
		default: 'QuillCode'
	},
	showBack: {
		type: Boolean,
		default: false
	},
	showNav: {
		type: Boolean,
		default: true
	}
})

const emit = defineEmits(['back'])

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()
const { isAuthenticated, user } = storeToRefs(authStore)

const showLogoutDialog = ref(false)

const appMode = computed(() => import.meta.env.VITE_APP_MODE || 'dev')
const isProdMode = computed(() => appMode.value === 'prod')
const isAdmin = computed(() => user.value?.role === 'admin')

function confirmLogout () {
	showLogoutDialog.value = true
}

function handleLogout () {
	showLogoutDialog.value = false
	authStore.logout()
	uiStore.showToast('已退出登录', 'success')
	router.push({ name: 'Home' })
}

function cancelLogout () {
	showLogoutDialog.value = false
}

function handleBack () {
	emit('back')
}

function isActive (name) {
	return route.name === name
}
</script>

<template>
	<header class="app-header">
		<div class="header-left">
			<button v-if="showBack" class="back-btn" @click="handleBack">
				← 返回
			</button>
			<router-link v-else to="/" class="logo">
				<span class="logo-icon">🪶</span>
				<span class="logo-text">{{ title }}</span>
			</router-link>

			<span v-if="isProdMode" class="mode-badge prod">Demo</span>
			<span v-else class="mode-badge dev">Dev</span>
		</div>

		<nav v-if="showNav && isAuthenticated" class="header-nav">
			<router-link to="/" class="nav-link" :class="{ active: isActive('Home') }">
				📝 片段
			</router-link>
			<router-link to="/search" class="nav-link" :class="{ active: isActive('Search') }">
				🔍 搜索
			</router-link>
			<router-link to="/shares" class="nav-link" :class="{ active: isActive('ShareManage') }">
				🔗 分享
			</router-link>
			<router-link v-if="isAdmin" to="/admin" class="nav-link" :class="{ active: isActive('Admin') }">
				📊 统计
			</router-link>
		</nav>

		<div class="header-right">
			<template v-if="isAuthenticated">
				<span class="user-info">
					<span class="user-avatar">{{ user?.username?.charAt(0)?.toUpperCase() }}</span>
					<span class="user-name">{{ user?.username }}</span>
				</span>
				<button class="logout-btn" @click="confirmLogout">退出</button>
			</template>
			<template v-else>
				<router-link to="/login" class="auth-link">登录</router-link>
				<router-link to="/register" class="auth-link primary">注册</router-link>
			</template>
		</div>

		<!-- Logout confirmation dialog -->
		<Teleport to="body">
			<div v-if="showLogoutDialog" class="dialog-overlay" @click.self="cancelLogout">
				<div class="dialog">
					<h3>确认退出</h3>
					<p>确定要退出登录吗？</p>
					<div class="dialog-actions">
						<button class="cancel-btn" @click="cancelLogout">取消</button>
						<button class="confirm-btn" @click="handleLogout">确认退出</button>
					</div>
				</div>
			</div>
		</Teleport>
	</header>
</template>

<style scoped>
.app-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 24px;
	height: 56px;
	background: var(--bai);
	border-bottom: 1px solid var(--hui);
	flex-shrink: 0;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 12px;
}

.logo {
	display: flex;
	align-items: center;
	gap: 8px;
	text-decoration: none;
	color: inherit;
}

.logo:hover {
	text-decoration: none;
}

.logo-icon {
	font-size: 24px;
}

.logo-text {
	font-size: 18px;
	font-weight: 600;
	color: var(--primary);
}

.back-btn {
	background: transparent;
	color: var(--primary);
	padding: 8px 12px;
	border: none;
}

.back-btn:hover {
	background: var(--danhui);
}

.mode-badge {
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;
}

.mode-badge.prod {
	background: #fff3cd;
	color: #856404;
}

.mode-badge.dev {
	background: #d4edda;
	color: #155724;
}

.header-nav {
	display: flex;
	align-items: center;
	gap: 4px;
}

.nav-link {
	padding: 8px 16px;
	border-radius: 6px;
	color: #666;
	font-size: 14px;
	text-decoration: none;
	transition: all 0.2s;
}

.nav-link:hover {
	background: var(--danhui);
	color: var(--primary);
	text-decoration: none;
}

.nav-link.active {
	background: rgba(74, 144, 217, 0.1);
	color: var(--primary);
}

.header-right {
	display: flex;
	align-items: center;
	gap: 12px;
}

.user-info {
	display: flex;
	align-items: center;
	gap: 8px;
}

.user-avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: var(--primary);
	color: white;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	font-weight: 600;
}

.user-name {
	color: #666;
	font-size: 14px;
}

.logout-btn {
	background: transparent;
	color: #666;
	padding: 6px 12px;
	border: 1px solid var(--hui);
	font-size: 13px;
}

.logout-btn:hover {
	background: var(--danhui);
	border-color: #bbb;
}

.auth-link {
	padding: 8px 16px;
	border-radius: 6px;
	font-size: 14px;
	color: #666;
	text-decoration: none;
}

.auth-link:hover {
	background: var(--danhui);
	text-decoration: none;
}

.auth-link.primary {
	background: var(--primary);
	color: white;
}

.auth-link.primary:hover {
	background: var(--primary-hover);
}

/* Dialog styles */
.dialog-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.dialog {
	background: var(--bai, #fff);
	border-radius: 8px;
	padding: 24px;
	min-width: 320px;
	max-width: 90%;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.dialog h3 {
	margin: 0 0 12px 0;
	font-size: 18px;
	color: #333;
}

.dialog p {
	margin: 0 0 20px 0;
	color: #666;
	font-size: 14px;
}

.dialog-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
}

.cancel-btn {
	background: transparent;
	color: #666;
	padding: 8px 16px;
	border: 1px solid var(--hui, #e0e0e0);
	border-radius: 4px;
	cursor: pointer;
}

.cancel-btn:hover {
	background: var(--danhui, #f5f5f5);
}

.confirm-btn {
	background: #dc3545;
	color: white;
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	cursor: pointer;
}

.confirm-btn:hover {
	background: #c82333;
}

@media (max-width: 768px) {
	.app-header {
		padding: 0 16px;
	}

	.logo-text {
		display: none;
	}

	.header-nav {
		display: none;
	}

	.user-name {
		display: none;
	}
}
</style>
