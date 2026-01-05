<!--
  ============================================
  登录表单组件 - LoginForm.vue
  ============================================
  
  📌 作用：可复用的登录表单组件
  📌 框架：Vue 3 Composition API
  
  🔧 使用方式：
  <LoginForm @success="handleLoginSuccess" @error="handleError" />
  
  🔧 自定义：
  - 修改样式：覆盖 CSS 变量或添加 class
  - 添加字段：如"记住我"复选框
  - 添加验证：使用 VeeValidate 等库
-->

<template>
  <div class="login-form">
    <h2 class="form-title">{{ title }}</h2>
    
    <form @submit.prevent="handleSubmit">
      <!-- 用户名输入 -->
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="form.username"
          type="text"
          placeholder="请输入用户名"
          :disabled="loading"
          required
        />
      </div>

      <!-- 密码输入 -->
      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          :disabled="loading"
          required
        />
      </div>

      <!-- 🔧 扩展：记住我复选框 -->
      <!-- <div class="form-group checkbox">
        <input id="remember" v-model="form.remember" type="checkbox" />
        <label for="remember">记住我</label>
      </div> -->

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- 提交按钮 -->
      <button type="submit" class="submit-btn" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>

    <!-- 底部链接 -->
    <div class="form-footer">
      <slot name="footer">
        还没有账号？<a href="#" @click.prevent="$emit('switch-to-register')">立即注册</a>
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
    default: '用户登录'
  }
})

// ========== Emits ==========
const emit = defineEmits(['success', 'error', 'switch-to-register'])

// ========== 状态 ==========
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: '',
  // remember: false,  // 🔧 扩展字段
})

// ========== 方法 ==========

/**
 * 处理表单提交
 */
const handleSubmit = async () => {
  // 清除之前的错误
  error.value = ''
  loading.value = true

  try {
    // 调用登录 API
    const result = await authService.login({
      username: form.username,
      password: form.password,
    })

    // 触发成功事件
    emit('success', result)
    
    // 清空表单
    form.username = ''
    form.password = ''
  } catch (err) {
    // 显示错误信息
    error.value = err.message || '登录失败，请重试'
    emit('error', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-form {
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

.form-group input[type="text"],
.form-group input[type="password"] {
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
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #357abd;
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
