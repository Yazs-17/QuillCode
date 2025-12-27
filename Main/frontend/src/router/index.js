import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		name: 'Home',
		component: () => import('../views/HomeView.vue')
	},
	{
		path: '/login',
		name: 'Login',
		component: () => import('../views/LoginView.vue')
	},
	{
		path: '/register',
		name: 'Register',
		component: () => import('../views/RegisterView.vue')
	},
	{
		path: '/editor',
		name: 'Editor',
		component: () => import('../views/EditorView.vue'),
		meta: { requiresAuth: true }
	},
	{
		path: '/editor/:id',
		name: 'EditorWithId',
		component: () => import('../views/EditorView.vue'),
		meta: { requiresAuth: true }
	},
	{
		path: '/article/:id',
		name: 'Article',
		component: () => import('../views/ArticleView.vue')
	},
	{
		path: '/search',
		name: 'Search',
		component: () => import('../views/SearchView.vue'),
		meta: { requiresAuth: true }
	},
	{
		path: '/share/:token',
		name: 'SharePage',
		component: () => import('../views/SharePageView.vue')
	},
	{
		path: '/shares',
		name: 'ShareManage',
		component: () => import('../views/ShareManageView.vue'),
		meta: { requiresAuth: true }
	}
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

// Navigation guard for protected routes
router.beforeEach((to, from, next) => {
	const token = localStorage.getItem('token')

	if (to.meta.requiresAuth && !token) {
		next({ name: 'Login', query: { redirect: to.fullPath } })
	} else {
		next()
	}
})

export default router
