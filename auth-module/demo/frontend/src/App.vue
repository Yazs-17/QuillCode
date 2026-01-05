<!--
  ============================================
  Auth Module Demo - 主应用组件
  ============================================
  
  📌 功能演示：
  - 用户注册
  - 用户登录
  - 获取用户信息
  - Token 存储和使用
-->

<template>
  <div class="app">
    <h1>🔐 Auth Module Demo</h1>
    
    <!-- 未登录状态：显示登录/注册表单 -->
    <div v-if="!user" class="auth-forms">
      
      <!-- 注册表单 -->
      <div class="form-card">
        <h2>📝 注册</h2>
        <form @submit.prevent="handleRegister">
          <input v-model="registerForm.username" placeholder="用户名 (至少3位)" />
          <input v-model="registerForm.email" type="email" placeholder="邮箱" />
          <input v-model="registerForm.password" type="password" placeholder="密码 (至少6位)" />
          <button type="submit" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
      </div>

      <!-- 登录表单 -->
      <div class="form-card">
        <h2>🔑 登录</h2>
        <form @submit.prevent="handleLogin">
          <input v-model="loginForm.username" placeholder="用户名" />
          <input v-model="loginForm.password" type="password" placeholder="密码" />
          <button type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 已登录状态：显示用户信息 -->
    <div v-else class="user-info">
      <h2>👤 用户信息</h2>
      <div class="info-card">
        <p><strong>ID:</strong> {{ user.id }}</p>
        <p><strong>用户名:</strong> {{ user.username }}</p>
        <p><strong>邮箱:</strong> {{ user.email }}</p>
        <p><strong>角色:</strong> {{ user.role }}</p>
        <p><strong>注册时间:</strong> {{ formatDate(user.createdAt) }}</p>
      </div>
      <button @click="handleLogout" class="logout-btn">退出登录</button>
      <button @click="fetchProfile" class="refresh-btn">刷新信息</button>
    </div>

    <!-- 消息提示 -->
    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>

    <!-- Token 显示 -->
    <div v-if="token" class="token-display">
      <h3>🎫 JWT Token</h3>
      <code>{{ token.substring(0, 50) }}...</code>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { authService } from './services/auth.service.js'

// ========== 响应式状态 ==========
const user = ref(null)           // 当前用户信息
const token = ref(null)          // JWT Token
const loading = ref(false)       // 加载状态
const message = ref('')          // 提示消息
const messageType = ref('info')  // 消息类型: success, error, info

// 注册表单
const registerForm = ref({
  username: '',
  email: '',
  password: ''
})

// 登录表单
const loginForm = ref({
  username: '',
  password: ''
})

// ========== 方法 ==========

/**
 * 显示消息提示
 */
const showMessage = (msg, type = 'info') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}

/**
 * 处理注册
 */
const handleRegister = async () => {
  loading.value = true
  try {
    const result = await authService.register(registerForm.value)
    showMessage(`注册成功！欢迎 ${result.user.username}`, 'success')
    // 清空表单
    registerForm.value = { username: '', email: '', password: '' }
  } catch (error) {
    showMessage(error.message || '注册失败', 'error')
  } finally {
    loading.value = false
  }
}

/**
 * 处理登录
 */
const handleLogin = async () => {
  loading.value = true
  try {
    const result = await authService.login(loginForm.value)
    token.value = result.accessToken
    user.value = result.user
    showMessage('登录成功！', 'success')
  } catch (error) {
    showMessage(error.message || '登录失败', 'error')
  } finally {
    loading.value = false
  }
}

/**
 * 获取用户信息
 */
const fetchProfile = async () => {
  try {
    const profile = await authService.getProfile()
    user.value = profile
    showMessage('信息已刷新', 'success')
  } catch (error) {
    showMessage(error.message || '获取信息失败', 'error')
  }
}

/**
 * 退出登录
 */
const handleLogout = () => {
  authService.logout()
  user.value = null
  token.value = null
  showMessage('已退出登录', 'info')
}

/**
 * 格式化日期
 */
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

// ========== 生命周期 ==========

onMounted(() => {
  // 检查是否有保存的 token
  const savedToken = localStorage.getItem('token')
  if (savedToken) {
    token.value = savedToken
    fetchProfile()
  }
})
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  text-align: center;
  margin-bottom: 40px;
  color: #333;
}

.auth-forms {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 600px) {
  .auth-forms {
    grid-template-columns: 1fr;
  }
}

.form-card, .info-card {
  background: #f8f9fa;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-card h2 {
  margin-bottom: 20px;
  color: #333;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: #4a90d9;
}

button {
  padding: 12px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #357abd;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.user-info {
  text-align: center;
}

.user-info h2 {
  margin-bottom: 20px;
}

.info-card {
  text-align: left;
  margin-bottom: 20px;
}

.info-card p {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.logout-btn {
  background: #dc3545;
  margin-right: 10px;
}

.logout-btn:hover {
  background: #c82333;
}

.refresh-btn {
  background: #28a745;
}

.refresh-btn:hover {
  background: #218838;
}

.message {
  margin-top: 20px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.message.success {
  background: #d4edda;
  color: #155724;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
}

.message.info {
  background: #d1ecf1;
  color: #0c5460;
}

.token-display {
  margin-top: 30px;
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
}

.token-display h3 {
  color: #fff;
  margin-bottom: 10px;
}

.token-display code {
  color: #98c379;
  word-break: break-all;
}
</style>
