<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAppStore, type ThemeMode } from '@/stores/app'
import { useBinary } from '@/composables/useBinary'
import { executeCommand } from '@/composables/useCommand'

const appStore = useAppStore()
const { binaries, checkAllBinaries } = useBinary()

const activeSection = ref<'general' | 'binaries'>('general')
const appVersion = ref('v0.1.0')

// ====== 主题 ======
function setTheme(mode: ThemeMode) {
  appStore.setTheme(mode)
  document.documentElement.setAttribute('data-theme', mode)
}

// ====== 重新检测二进制 ======
async function refreshBinaries() {
  await checkAllBinaries()
}

// ====== 获取详细版本 ======
const binaryVersions = ref<Record<string, string>>({})

async function getBinaryVersion(name: string) {
  const result = await executeCommand(`${name} --version 2>&1 | head -1`)
  if (result.code === 0) {
    binaryVersions.value[name] = result.stdout.trim()
  } else {
    binaryVersions.value[name] = '无法获取版本信息'
  }
}

onMounted(async () => {
  await refreshBinaries()
  // Get detailed versions for installed binaries
  for (const bin of binaries.value) {
    if (bin.installed) {
      getBinaryVersion(bin.name)
    }
  }
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-container">
      <div class="tool-header">
        <h2 class="tool-title">⚙️ 设置</h2>
        <p class="tool-desc">应用偏好设置 · 主题切换 · 二进制管理</p>
      </div>

      <!-- Section Tabs -->
      <div class="section-tabs">
        <button
          class="section-btn"
          :class="{ active: activeSection === 'general' }"
          @click="activeSection = 'general'"
        >🎨 通用</button>
        <button
          class="section-btn"
          :class="{ active: activeSection === 'binaries' }"
          @click="activeSection = 'binaries'"
        >🔧 二进制工具</button>
      </div>

      <!-- ====== 通用设置 ====== -->
      <div v-show="activeSection === 'general'" class="content-panel">
        <div class="panel-section">
          <h3>🎨 主题设置</h3>
          <div class="theme-options">
            <label
              class="theme-card"
              :class="{ active: appStore.theme === 'dark' }"
              @click="setTheme('dark')"
            >
              <span class="theme-preview dark-preview">
                <span class="preview-bar"></span>
                <span class="preview-bar"></span>
                <span class="preview-bar"></span>
              </span>
              <span class="theme-name">🌙 深色模式</span>
            </label>
            <label
              class="theme-card"
              :class="{ active: appStore.theme === 'light' }"
              @click="setTheme('light')"
            >
              <span class="theme-preview light-preview">
                <span class="preview-bar"></span>
                <span class="preview-bar"></span>
                <span class="preview-bar"></span>
              </span>
              <span class="theme-name">☀️ 浅色模式</span>
            </label>
          </div>
        </div>

        <div class="panel-section">
          <h3>📱 应用信息</h3>
          <div class="info-list">
            <div class="info-row">
              <span class="info-label">应用版本</span>
              <span class="info-value">{{ appVersion }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">当前主题</span>
              <span class="info-value">{{ appStore.theme === 'dark' ? '深色模式' : '浅色模式' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">侧边栏状态</span>
              <span class="info-value">{{ appStore.sidebarCollapsed ? '收起' : '展开' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ====== 二进制工具管理 ====== -->
      <div v-show="activeSection === 'binaries'" class="content-panel">
        <div class="panel-section">
          <div class="section-header">
            <h3>🔧 已检测的二进制工具</h3>
            <button class="btn btn-sm" @click="refreshBinaries">
              🔄 重新检测
            </button>
          </div>
          <div class="binary-grid">
            <div v-for="binary in binaries" :key="binary.name" class="binary-card">
              <div class="binary-header">
                <span class="binary-name">{{ binary.displayName }}</span>
                <span
                  class="binary-status"
                  :class="binary.installed ? 'installed' : 'missing'"
                >
                  {{ binary.checking ? '⏳' : binary.installed ? '✅' : '❌' }}
                </span>
              </div>
              <div class="binary-desc">{{ binary.description }}</div>
              <div class="binary-meta" v-if="binary.installed">
                <span class="binary-version" v-if="binary.version">
                  {{ binary.version.substring(0, 60) }}
                </span>
              </div>
              <div class="binary-meta" v-if="!binary.installed && binary.downloadUrl">
                <a :href="binary.downloadUrl" target="_blank" class="download-link">
                  📥 下载 ({{ binary.size }})
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  height: 100%;
  overflow-y: auto;
}

.tool-container {
  max-width: 700px;
  margin: 0 auto;
  padding-bottom: 24px;
}

.tool-header {
  margin-bottom: 16px;
}

.tool-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.tool-desc {
  color: var(--text-secondary);
  font-size: 14px;
}

/* Section Tabs */
.section-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
}

.section-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.section-btn:hover {
  background: rgba(124, 58, 237, 0.08);
  color: var(--text-primary);
}

.section-btn.active {
  background: var(--accent);
  color: white;
}

/* Panel */
.panel-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.panel-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin-bottom: 0;
}

/* Theme Options */
.theme-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-primary);
}

.theme-card:hover {
  border-color: var(--accent);
}

.theme-card.active {
  border-color: var(--accent);
  background: rgba(124, 58, 237, 0.08);
}

.theme-preview {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px;
  border-radius: 6px;
  width: 100%;
}

.dark-preview {
  background: #1e1e2e;
}

.light-preview {
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.preview-bar {
  height: 4px;
  border-radius: 2px;
}

.dark-preview .preview-bar:nth-child(1) { background: #7c3aed; width: 60%; }
.dark-preview .preview-bar:nth-child(2) { background: #3b82f6; width: 80%; }
.dark-preview .preview-bar:nth-child(3) { background: #22c55e; width: 40%; }

.light-preview .preview-bar:nth-child(1) { background: #7c3aed; width: 60%; }
.light-preview .preview-bar:nth-child(2) { background: #3b82f6; width: 80%; }
.light-preview .preview-bar:nth-child(3) { background: #22c55e; width: 40%; }

.theme-name {
  font-size: 13px;
  font-weight: 600;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: rgba(124, 58, 237, 0.08);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

/* Info List */
.info-list {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  font-size: 13px;
}

.info-row:not(:last-child) {
  border-bottom: 1px solid var(--border);
}

.info-label {
  color: var(--text-secondary);
}

.info-value {
  font-weight: 500;
}

/* Binary Grid */
.binary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.binary-card {
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: border-color 0.15s;
}

.binary-card:hover {
  border-color: var(--accent);
}

.binary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.binary-name {
  font-size: 14px;
  font-weight: 600;
}

.binary-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.binary-meta {
  font-size: 11px;
}

.binary-version {
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
  word-break: break-all;
}

.download-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 12px;
}

.download-link:hover {
  text-decoration: underline;
}

/* Content Panel */
.content-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>