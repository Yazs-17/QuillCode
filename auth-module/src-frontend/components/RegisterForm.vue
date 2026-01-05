<!--
  ============================================
  注册表单组件 - RegisterForm.vue
  ============================================
  
  📌 作用：可复用的注册表单组件
  📌 框架：Vue 3 Composition API
  
  🔧 使用方式：
  <RegisterForm @success="handleRegisterSuccess" @error="handleError" />
-->

<template>
  <div class="register-form">
    <h2 class="form-title">{{ title }}</h2>
    
    <form @submit.prevent="handleSubmit">
      <!-- 用户名 -->
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          placeholder="3-20个字符"
          :disabled="loading"
          required
          minlength="3"
          maxlength="20"
        />
      </div>

      <!-- 邮箱 -->
      <div class="form-group">
        <label for="email">邮箱</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="请输入邮箱"
          :disabled="loading"
          required
        />
      </div>

      <!-- 密码 -->
      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="至少6个字符"
          :disabled="loading"
          required
          minlength="6"
        />
      </div>

      <!-- 确认密码 -->
      <div class="form-group">
        <label for="confirmPassword">确认密码</label>
        <input
          id="confirmPassword"
          v-model="form.confirmPassword"
          type="password"
          placeholder="再次输入密码"
          :disabled="loading"
          required
        />
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- 提交按钮 -->
      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? '注册中...' : '注册' }}
      </button>
    </form>

    <!-- 底部链接 -->
    <div class="form-footer">
      <slot name="footer">
        已有账号？<a href="#" @click.prevent="$emit('switch-to-login')">立即登录</a>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { authService } from '../services/auth.service.js'

// ========== Props ==========
const props = defineProps({
  title: {
    type: String,
    default: '用户注册'
  }
})

// ========== Emits ==========
const emit = defineEmits(['success', 'error', 'switch-to-login'])

// ========== 状态 ==========
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

// ========== 方法 ==========

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  error.value = ''

  // 验证密码一致性
  if (form.password !== form.confirmPassword) {
    error.value = '两次输入的密码不一致'
    return
  }

  loading.value = true

  try {
    const result = await authService.register({
      username: form.username,
      email: form.email,
      password: form.password,
    })

    emit('success', result)
    
    // 清空表单
    form.username = ''
    form.email = ''
    form.password = ''
    form.confirmPassword = ''
  } catch (err) {
    error.value = err.message || '注册失败，请重试'
    emit('error', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.form-title {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
  font-size: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #666;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #4a90d9;
}

.form-group input:disabled {
  background: #f5f5f5;
}

.error-message {
  padding: 10px;
  margin-bottom: 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 6px;
  color: #ff4d4f;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: #52c41a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #389e0d;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.form-footer {
  margin-top: 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.form-footer a {
  color: #4a90d9;
  text-decoration: none;
}

.form-footer a:hover {
  text-decoration: underline;
}
</style>
