<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { executeCommand } from '@/composables/useCommand'

const appVersion = ref('v0.1.0')
const tauriVersion = ref('')
const osInfo = ref('')

onMounted(async () => {
  // Get Tauri version
  const tauriResult = await executeCommand('cargo metadata --format-version 1 2>/dev/null | head -1 || echo ""')
  // Get OS info
  const platform = navigator.platform || 'unknown'
  const userAgent = navigator.userAgent || ''
  if (platform.includes('Mac') || userAgent.includes('Mac')) {
    osInfo.value = 'macOS (Apple Silicon)'
  } else if (platform.includes('Win') || userAgent.includes('Windows')) {
    osInfo.value = 'Windows'
  } else if (platform.includes('Linux') || userAgent.includes('Linux')) {
    osInfo.value = 'Linux'
  } else {
    osInfo.value = platform
  }
})
</script>

<template>
  <div class="tool-page">
    <div class="about-container">
      <!-- Logo & Title -->
      <div class="about-hero">
        <div class="about-logo">🔧</div>
        <h1 class="about-title">UltraToolBox</h1>
        <p class="about-version">{{ appVersion }}</p>
        <p class="about-desc">
          跨平台命令行工具箱
        </p>
      </div>

      <!-- Info Cards -->
      <div class="about-cards">
        <div class="about-card">
          <div class="card-icon">🎯</div>
          <div class="card-text">
            <strong>产品定位</strong>
            一站式收纳开发/运维/搞机常用命令行工具，免配置开箱即用
          </div>
        </div>
        <div class="about-card">
          <div class="card-icon">🛠️</div>
          <div class="card-text">
            <strong>内置工具</strong>
            ADB · iPerf3 · Aria2 · Ping · cURL
          </div>
        </div>
        <div class="about-card">
          <div class="card-icon">💻</div>
          <div class="card-text">
            <strong>当前平台</strong>
            {{ osInfo }}
          </div>
        </div>
      </div>

      <!-- Tech Stack -->
      <div class="about-section">
        <h3>技术栈</h3>
        <div class="tech-grid">
          <div class="tech-item">
            <span class="tech-icon">⚡</span>
            <span class="tech-name">Tauri 2</span>
            <span class="tech-desc">跨平台桌面框架</span>
          </div>
          <div class="tech-item">
            <span class="tech-icon">💚</span>
            <span class="tech-name">Vue 3</span>
            <span class="tech-desc">前端 UI 框架</span>
          </div>
          <div class="tech-item">
            <span class="tech-icon">📘</span>
            <span class="tech-name">TypeScript</span>
            <span class="tech-desc">类型安全</span>
          </div>
          <div class="tech-item">
            <span class="tech-icon">🦀</span>
            <span class="tech-name">Rust</span>
            <span class="tech-desc">后端 & 系统调用</span>
          </div>
          <div class="tech-item">
            <span class="tech-icon">📦</span>
            <span class="tech-name">Pinia</span>
            <span class="tech-desc">状态管理</span>
          </div>
          <div class="tech-item">
            <span class="tech-icon">🧭</span>
            <span class="tech-name">Vue Router</span>
            <span class="tech-desc">路由管理</span>
          </div>
        </div>
      </div>

      <!-- License -->
      <div class="about-section">
        <h3>开源许可</h3>
        <div class="license-box">
          <p>本软件使用 <strong>MIT 许可证</strong> 开源。</p>
          <p class="license-note">
            内置的 CLI 工具（adb、iperf3、aria2、curl 等）分别遵循其各自的开源许可证。
            请在使用前查阅各工具的许可证条款。
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="about-footer">
        <p>Copyright &copy; 2026 Shentongen</p>
        <p class="footer-links">
          <span>Made with ❤️</span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  height: 100%;
  overflow-y: auto;
}

.about-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 0 60px;
}

/* Hero */
.about-hero {
  text-align: center;
  margin-bottom: 32px;
}

.about-logo {
  font-size: 64px;
  margin-bottom: 12px;
}

.about-title {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa, #7c3aed);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.about-version {
  color: var(--text-secondary);
  font-size: 14px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  margin-bottom: 8px;
}

.about-desc {
  color: var(--text-secondary);
  font-size: 15px;
}

/* Info Cards */
.about-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 28px;
}

.about-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.card-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.card-text strong {
  display: block;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.card-text {
  color: var(--text-secondary);
}

/* Sections */
.about-section {
  margin-bottom: 24px;
}

.about-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

/* Tech Grid */
.tech-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tech-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  text-align: center;
}

.tech-icon {
  font-size: 24px;
}

.tech-name {
  font-size: 14px;
  font-weight: 600;
}

.tech-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

/* License */
.license-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.license-box strong {
  color: var(--text-primary);
}

.license-note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* Footer */
.about-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
}

.footer-links {
  margin-top: 4px;
}
</style>