<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()

interface NavItem {
  path: string
  titleKey: string
  icon: string
}

const navItems: NavItem[] = [
  { path: '/', titleKey: 'nav.home', icon: '🏠' },
  { path: '/adb', titleKey: 'nav.adb', icon: '📱' },
  { path: '/network', titleKey: 'nav.network', icon: '🌐' },
  { path: '/aria2', titleKey: 'nav.aria2', icon: '⬇️' },
  { path: '/benchmark', titleKey: 'nav.benchmark', icon: '🖥️' },
  { path: '/terminal', titleKey: 'nav.terminal', icon: '💻' },
]

const bottomItems: NavItem[] = [
  { path: '/settings', titleKey: 'nav.settings', icon: '⚙️' },
  { path: '/about', titleKey: 'nav.about', icon: 'ℹ️' },
]

const activePath = computed(() => route.path)

function navigate(item: NavItem) {
  router.push(item.path)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo" v-if="!collapsed">
        <span class="logo-icon">🔧</span>
        <span class="logo-text">UltraToolBox</span>
      </div>
      <div class="logo logo-small" v-else>
        <span class="logo-icon">🔧</span>
      </div>
    </div>

    <nav class="nav-items">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: activePath === item.path }"
        @click="navigate(item)"
        :title="$t(item.titleKey)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label" v-if="!collapsed">{{ $t(item.titleKey) }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <button
        v-for="item in bottomItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: activePath === item.path }"
        @click="navigate(item)"
        :title="$t(item.titleKey)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label" v-if="!collapsed">{{ $t(item.titleKey) }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease, min-width 0.2s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  min-width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-small {
  justify-content: center;
  width: 100%;
}

.logo-icon {
  font-size: 20px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
}

.nav-items {
  flex: 1;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.15s ease;
  white-space: nowrap;
  width: 100%;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent);
  color: #ffffff;
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 24px;
  text-align: center;
}

.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>