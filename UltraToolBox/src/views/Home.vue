<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Smartphone, Globe, Download, Terminal } from '@lucide/vue'

const router = useRouter()

const quickTools = [
  { path: '/adb', titleKey: 'home.tool.adb', icon: Smartphone, descKey: 'home.tool.adb.desc' },
  { path: '/network', titleKey: 'home.tool.network', icon: Globe, descKey: 'home.tool.network.desc' },
  { path: '/aria2', titleKey: 'home.tool.aria2', icon: Download, descKey: 'home.tool.aria2.desc' },
  { path: '/terminal', titleKey: 'home.tool.terminal', icon: Terminal, descKey: 'home.tool.terminal.desc' },
]
</script>

<template>
  <div class="home-page">
    <div class="welcome-section">
      <h1 class="welcome-title">{{ $t('home.welcome.title') }}</h1>
      <p class="welcome-desc">{{ $t('home.welcome.subtitle') }}</p>
    </div>

    <div class="tool-grid">
      <div
        v-for="tool in quickTools"
        :key="tool.path"
        class="tool-card"
        @click="router.push(tool.path)"
      >
        <span class="tool-icon">
          <component :is="tool.icon" :size="32" stroke-width="1.5" />
        </span>
        <div class="tool-info">
          <h3 class="tool-name">{{ $t(tool.titleKey) }}</h3>
          <p class="tool-desc">{{ $t(tool.descKey) }}</p>
        </div>
        <span class="tool-arrow">→</span>
      </div>
    </div>

    <div class="info-section">
      <div class="info-card">
        <h3>{{ $t('home.quickstart.title') }}</h3>
        <p>{{ $t('home.quickstart.desc') }}</p>
      </div>
      <div class="info-card">
        <h3>{{ $t('home.crossplatform.title') }}</h3>
        <p>{{ $t('home.crossplatform.desc') }}</p>
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