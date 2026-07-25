<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { APP_VERSION } from '@/config/app'
import { Menu } from '@lucide/vue'

const route = useRoute()
const appStore = useAppStore()
const sidebarCollapsed = ref(false)

const pageTitle = computed(() => {
  return (route.meta?.title as string) || 'UltraToolBox'
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

onMounted(() => {
  // 应用保存的主题
  document.documentElement.setAttribute('data-theme', appStore.theme)
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    <div class="main-area">
      <header class="app-header">
        <button class="menu-btn" @click="toggleSidebar" :title="$t('app.toggleSidebar')">
          <Menu :size="20" />
        </button>
        <h2 class="page-title">{{ pageTitle }}</h2>
      </header>
      <main class="content-area">
        <router-view />
      </main>
      <footer class="status-bar">
        <span class="status-indicator">{{ $t('app.status.idle') }}</span>
        <span class="status-version">v{{ APP_VERSION }}</span>
      </footer>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 60px;
  --header-height: 48px;
  --status-bar-height: 28px;
  --bg-primary: #1e1e2e;
  --bg-sidebar: #16162a;
  --bg-header: #1a1a30;
  --bg-status: #1a1a30;
  --bg-card: #252540;
  --text-primary: #e8e8e8;
  --text-secondary: #888899;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  --border: #3a3a55;
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
}

[data-theme="light"] {
  --bg-primary: #f8f9fa;
  --bg-sidebar: #ffffff;
  --bg-header: #ffffff;
  --bg-status: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  --border: #e5e7eb;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
}

#app {
  height: 100%;
  width: 100%;
}

.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.2s ease;
}

.app-header {
  height: var(--header-height);
  background: var(--bg-header);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
  -webkit-app-region: drag;
}

.menu-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 18px;
  -webkit-app-region: no-drag;
  transition: all 0.15s ease;
}

.menu-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.menu-icon {
  display: block;
  line-height: 1;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  -webkit-app-region: no-drag;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.status-bar {
  height: var(--status-bar-height);
  background: var(--bg-status);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-indicator::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--success);
}

/* Scrollbar styles */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Transition for route changes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>