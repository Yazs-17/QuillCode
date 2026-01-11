<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ isSingleUserMode ? '本地登录' : '登录' }}</h2>
      
      <!-- Single-user mode without password -->
      <div v-if="isSingleUserMode && !isPasswordProtected" class="single-user-mode">
        <p class="mode-description">单用户模式已启用，点击下方按钮直接进入</p>
        <button 
          class="submit-btn" 
          :disabled="loading"
          @click="handleLocalLogin"
        >
          {{ loading ? '登录中...' : '进入系统' }}
        </button>
        <div v-if="errorMsg" class="error-message">
          {{ errorMsg }}
        </div>
      </div>

      <!-- Single-user mode with password protection -->
      <form v-else-if="isSingleUserMode && isPasswordProtected" @submit.prevent="handleLocalLoginWithPassword" class="auth-form">
        <p class="mode-description">本地密码保护已启用</p>
        <div class="form-group">
          <label for="localPassword">本地密码</label>
          <input
            id="localPassword"
            v-model="form.localPassword"
            type="password"
            placeholder="请输入本地密码"
            required
            :disabled="loading"
          />
        </div>

        <div v-if="errorMsg" class="error-message">
          {{ errorMsg }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <!-- Normal multi-user login -->
      <form v-else @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
            :disabled="loading"
          />
        </div>

        <div v-if="errorMsg" class="error-message">
          {{ errorMsg }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div v-if="!isSingleUserMode" class="auth-footer">
        还没有账户？<router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: '',
  localPassword: ''
})

const loading = ref(false)
const errorMsg = ref('')

// Computed properties for auth mode
const isSingleUserMode = computed(() => authStore.isSingleUserMode)
const isPasswordProtected = computed(() => authStore.isPasswordProtected)

onMounted(async () => {
  // Ensure auth mode is loaded
  if (!authStore.authModeLoaded) {
    await authStore.fetchAuthMode()
  }
  
  // Auto-login for single-user mode without password
  if (isSingleUserMode.value && !isPasswordProtected.value) {
    // Don't auto-login, let user click the button
  }
})

async function handleLocalLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.localLogin()
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    errorMsg.value = err.message || '登录失败'
  } finally {
    loading.value = false
  }
}

async function handleLocalLoginWithPassword() {
  if (!form.localPassword) {
    errorMsg.value = '请输入本地密码'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.localLogin(form.localPassword)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    errorMsg.value = err.message || '密码错误'
  } finally {
    loading.value = false
  }
}

async function handleLogin() {
  if (!form.username || !form.password) {
    errorMsg.value = '请填写所有字段'
    return
  }

  loading.value = true
  errorMsg.value = ''

  try {
    await authStore.login(form.username, form.password)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    errorMsg.value = err.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--danhui);
  padding: 20px;
}

.auth-card {
  background: var(--bai);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.auth-card h2 {
  margin: 0 0 24px;
  text-align: center;
  color: #333;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 14px;
  color: #666;
}

.form-group input {
  width: 100%;
}

.error-message {
  color: var(--danger);
  font-size: 14px;
  padding: 8px 12px;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 4px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  margin-top: 8px;
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.single-user-mode {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-description {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 0;
}
</style>
