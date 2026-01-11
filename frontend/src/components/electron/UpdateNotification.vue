<template>
  <div class="update-notification" v-if="visible">
    <div class="notification-content">
      <!-- Update Available -->
      <template v-if="status === 'available'">
        <div class="notification-icon">🎉</div>
        <div class="notification-text">
          <h4>发现新版本 {{ updateInfo?.version }}</h4>
          <p>点击下载以获取最新功能和修复</p>
        </div>
        <div class="notification-actions">
          <button @click="downloadUpdate" class="btn btn-primary">下载更新</button>
          <button @click="dismiss" class="btn btn-secondary">稍后提醒</button>
        </div>
      </template>

      <!-- Downloading -->
      <template v-if="status === 'downloading'">
        <div class="notification-icon">⬇️</div>
        <div class="notification-text">
          <h4>正在下载更新...</h4>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress.percent + '%' }"></div>
          </div>
          <p class="progress-text">{{ formatProgress }}</p>
        </div>
      </template>

      <!-- Downloaded -->
      <template v-if="status === 'downloaded'">
        <div class="notification-icon">✅</div>
        <div class="notification-text">
          <h4>更新已下载完成</h4>
          <p>重启应用以完成安装</p>
        </div>
        <div class="notification-actions">
          <button @click="installUpdate" class="btn btn-primary">立即重启</button>
          <button @click="dismiss" class="btn btn-secondary">稍后</button>
        </div>
      </template>

      <!-- Error -->
      <template v-if="status === 'error'">
        <div class="notification-icon">❌</div>
        <div class="notification-text">
          <h4>更新检查失败</h4>
          <p>{{ errorMessage }}</p>
        </div>
        <div class="notification-actions">
          <button @click="checkForUpdates" class="btn btn-secondary">重试</button>
          <button @click="dismiss" class="btn btn-secondary">关闭</button>
        </div>
      </template>
    </div>

    <button @click="dismiss" class="close-btn" v-if="status !== 'downloading'">×</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const visible = ref(false);
const status = ref(''); // 'available', 'downloading', 'downloaded', 'error'
const updateInfo = ref(null);
const progress = ref({ percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 });
const errorMessage = ref('');

const formatProgress = computed(() => {
  const { transferred, total, bytesPerSecond } = progress.value;
  const transferredMB = (transferred / 1024 / 1024).toFixed(1);
  const totalMB = (total / 1024 / 1024).toFixed(1);
  const speedMB = (bytesPerSecond / 1024 / 1024).toFixed(1);
  return `${transferredMB} MB / ${totalMB} MB (${speedMB} MB/s)`;
});

onMounted(() => {
  if (window.electronAPI) {
    window.electronAPI.onUpdateAvailable((info) => {
      updateInfo.value = info;
      status.value = 'available';
      visible.value = true;
    });

    window.electronAPI.onUpdateNotAvailable(() => {
      // Silently ignore - no update available
    });

    window.electronAPI.onDownloadProgress((prog) => {
      progress.value = prog;
      status.value = 'downloading';
      visible.value = true;
    });

    window.electronAPI.onUpdateDownloaded((info) => {
      updateInfo.value = info;
      status.value = 'downloaded';
      visible.value = true;
    });

    window.electronAPI.onUpdateError((error) => {
      errorMessage.value = error;
      status.value = 'error';
      visible.value = true;
    });

    // Check for updates on mount
    checkForUpdates();
  }
});

onUnmounted(() => {
  if (window.electronAPI) {
    window.electronAPI.removeAllListeners('updater:update-available');
    window.electronAPI.removeAllListeners('updater:update-not-available');
    window.electronAPI.removeAllListeners('updater:download-progress');
    window.electronAPI.removeAllListeners('updater:update-downloaded');
    window.electronAPI.removeAllListeners('updater:error');
  }
});

async function checkForUpdates() {
  if (window.electronAPI) {
    await window.electronAPI.checkForUpdates();
  }
}

function downloadUpdate() {
  if (window.electronAPI) {
    window.electronAPI.downloadAndInstall();
    status.value = 'downloading';
  }
}

function installUpdate() {
  // The app will quit and install the update
  if (window.electronAPI) {
    window.electronAPI.downloadAndInstall();
  }
}

function dismiss() {
  visible.value = false;
}

// Expose method to manually check for updates
function show() {
  checkForUpdates();
}

defineExpose({ show, checkForUpdates });
</script>

<style scoped>
.update-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 16px 20px;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-icon {
  font-size: 32px;
  text-align: center;
}

.notification-text h4 {
  margin: 0 0 4px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.notification-text p {
  margin: 0;
  color: #888;
  font-size: 13px;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #333;
  color: #aaa;
}

.btn-secondary:hover {
  background: #444;
  color: #fff;
}

.progress-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
  margin: 8px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: #666;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #666;
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #333;
  color: #fff;
}
</style>
