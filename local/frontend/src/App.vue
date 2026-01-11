<script setup>
import { RouterView } from 'vue-router'
import AppToast from './components/common/AppToast.vue'
import { FeatureLimitDialog } from './components/download'
import { featureLimitState } from './composables/useFeatureLimit'
</script>

<template>
  <RouterView />
  <AppToast />
  
  <!-- Global Feature Limit Dialog -->
  <Teleport to="body">
    <FeatureLimitDialog 
      v-if="featureLimitState.showDialog.value && featureLimitState.getInfo()"
      :feature-name="featureLimitState.getInfo()?.name"
      :description="featureLimitState.getInfo()?.description"
      @close="featureLimitState.hide()"
      @download="featureLimitState.hide()"
    />
  </Teleport>
</template>

<style>
:root {
  --hui: #ccc;
  --danhui: #f5f5f5;
  --bai: #fff;
  --primary: #4a90d9;
  --primary-hover: #357abd;
  --danger: #dc3545;
  --success: #28a745;
}

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

* {
  box-sizing: border-box;
}

a {
  color: var(--primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: var(--primary-hover);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

input, textarea, select {
  padding: 8px 12px;
  border: 1px solid var(--hui);
  border-radius: 4px;
  font-size: 14px;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.2);
}
</style>
