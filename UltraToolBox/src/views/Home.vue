<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const quickTools = [
  { path: '/adb', title: 'ADB 工具', icon: '📱', desc: 'Android 调试和管理' },
  { path: '/network', title: '网络工具', icon: '🌐', desc: 'iperf3 测速、Ping、curl' },
  { path: '/aria2', title: 'Aria2 下载', icon: '⬇️', desc: '多协议下载管理器' },
  { path: '/terminal', title: '终端', icon: '💻', desc: '快捷打开系统终端' },
]
</script>

<template>
  <div class="home-page">
    <div class="welcome-section">
      <h1 class="welcome-title">欢迎使用 UltraToolBox</h1>
      <p class="welcome-desc">跨平台命令行工具箱 · 内置 adb/iperf3/aria2 · 免配置开箱即用</p>
    </div>

    <div class="tool-grid">
      <div
        v-for="tool in quickTools"
        :key="tool.path"
        class="tool-card"
        @click="router.push(tool.path)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <div class="tool-info">
          <h3 class="tool-name">{{ tool.title }}</h3>
          <p class="tool-desc">{{ tool.desc }}</p>
        </div>
        <span class="tool-arrow">→</span>
      </div>
    </div>

    <div class="info-section">
      <div class="info-card">
        <h3>💡 快速开始</h3>
        <p>选择左侧工具栏中的工具开始使用。所有工具均内置命令行程序，无需额外配置。</p>
      </div>
      <div class="info-card">
        <h3>🔌 跨平台支持</h3>
        <p>Windows / macOS / Linux 三平台统一体验，二进制自动适配当前系统。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  max-width: 800px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  padding: 40px 20px 32px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-desc {
  color: var(--text-secondary);
  font-size: 15px;
}

.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 20px;
  margin-bottom: 24px;
}

.tool-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tool-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
}

.tool-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.tool-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.tool-arrow {
  font-size: 18px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.info-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 0 20px;
}

.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
}

.info-card h3 {
  font-size: 15px;
  margin-bottom: 8px;
}

.info-card p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>