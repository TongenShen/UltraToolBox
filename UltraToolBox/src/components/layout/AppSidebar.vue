<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToolsStore, type ToolItem } from '@/stores/tools'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()
const toolsStore = useToolsStore()

// 搜索
const searchQuery = ref('')

// 通用工具折叠状态（默认展开）
const generalExpanded = ref(true)

// 系统工具折叠状态
const systemExpanded = ref(false)

// 导航项定义
const generalTools: ToolItem[] = [
  { path: '/', titleKey: 'nav.home', icon: '🏠' },
  { path: '/adb', titleKey: 'nav.adb', icon: '📱' },
  { path: '/network', titleKey: 'nav.network', icon: '🌐' },
  { path: '/aria2', titleKey: 'nav.aria2', icon: '⬇️' },
  { path: '/benchmark', titleKey: 'nav.benchmark', icon: '🖥️' },
  { path: '/terminal', titleKey: 'nav.terminal', icon: '💻' },
]

const systemTools: ToolItem[] = [
  { path: '/system/macos', titleKey: 'sidebar.system.macos', icon: '🍎' },
  { path: '/system/windows', titleKey: 'sidebar.system.windows', icon: '🪟' },
  { path: '/system/linux', titleKey: 'sidebar.system.linux', icon: '🐧' },
]

const footerItems: ToolItem[] = [
  { path: '/settings', titleKey: 'nav.settings', icon: '⚙️' },
  { path: '/about', titleKey: 'nav.about', icon: 'ℹ️' },
]

// 根据搜索过滤通用工具
const filteredGeneralTools = computed(() => {
  if (!searchQuery.value.trim()) return generalTools
  const q = searchQuery.value.toLowerCase()
  return generalTools.filter(item => {
    const label = item.titleKey.replace('nav.', '')
    return label.includes(q) || item.icon.includes(q)
  })
})

// 固定的工具列表（按 pinnedTools 顺序排列）
const pinnedToolItems = computed(() => {
  return toolsStore.pinnedTools
    .map(p => generalTools.find(t => t.path === p))
    .filter((t): t is ToolItem => t !== undefined)
})

const activePath = computed(() => route.path)

function navigate(item: ToolItem) {
  router.push(item.path)
}

function togglePin(item: ToolItem) {
  toolsStore.togglePin(item.path)
}

function isPinned(item: ToolItem): boolean {
  return toolsStore.isPinned(item.path)
}

function handleSystemClick(item: ToolItem) {
  // 系统工具页面暂未实现，点击后展开/折叠或提示
  navigate(item)
}
</script>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="logo" v-if="!collapsed">
        <span class="logo-icon">🔧</span>
        <span class="logo-text">UltraToolBox</span>
      </div>
      <div class="logo logo-small" v-else>
        <span class="logo-icon">🔧</span>
      </div>
    </div>

    <!-- Search -->
    <div class="sidebar-search" v-if="!collapsed">
      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="$t('sidebar.search.placeholder')"
        />
        <button
          v-if="searchQuery"
          class="search-clear"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Nav Items -->
    <div class="nav-scroll">
      <!-- Section 1: 通用工具 -->
      <div class="nav-section" v-if="!collapsed">
        <div class="section-header collapsible" @click="generalExpanded = !generalExpanded">
          <span class="collapse-arrow">{{ generalExpanded ? '▼' : '▶' }}</span>
          <span class="section-title">{{ $t('sidebar.general') }}</span>
        </div>
        <div class="section-items" v-if="generalExpanded || searchQuery.trim() !== ''">
          <button
            v-for="item in filteredGeneralTools"
            :key="item.path"
            class="nav-item"
            :class="{ active: activePath === item.path }"
            @click="navigate(item)"
            :title="$t(item.titleKey)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ $t(item.titleKey) }}</span>
            <span
              class="pin-btn"
              :class="{ pinned: isPinned(item) }"
              @click.stop="togglePin(item)"
              :title="isPinned(item) ? $t('sidebar.unpin') : $t('sidebar.pin')"
            >
              {{ isPinned(item) ? '📌' : '📍' }}
            </span>
          </button>
          <div v-if="filteredGeneralTools.length === 0" class="search-empty">
            {{ $t('sidebar.search.empty') }}
          </div>
        </div>
      </div>

      <!-- Section 1: 系统工具 -->
      <div class="nav-section" v-if="!collapsed">
        <div class="section-header collapsible" @click="systemExpanded = !systemExpanded">
          <span class="collapse-arrow">{{ systemExpanded ? '▼' : '▶' }}</span>
          <span class="section-title">{{ $t('sidebar.system') }}</span>
        </div>
        <div class="section-items" v-if="systemExpanded">
          <button
            v-for="item in systemTools"
            :key="item.path"
            class="nav-item"
            :class="{ active: activePath === item.path }"
            @click="handleSystemClick(item)"
            :title="$t(item.titleKey)"
          >
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label">{{ $t(item.titleKey) }}</span>
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="section-divider" v-if="!collapsed"></div>

      <!-- Section 2: 固定工具 -->
      <div class="nav-section" v-if="!collapsed">
        <div class="section-header">
          <span class="section-title">{{ $t('sidebar.pinned') }}</span>
        </div>
        <div class="section-items">
          <template v-if="pinnedToolItems.length > 0">
            <button
              v-for="item in pinnedToolItems"
              :key="item.path"
              class="nav-item"
              :class="{ active: activePath === item.path }"
              @click="navigate(item)"
              :title="$t(item.titleKey)"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ $t(item.titleKey) }}</span>
              <span
                class="pin-btn pinned"
                @click.stop="togglePin(item)"
                :title="$t('sidebar.unpin')"
              >✕</span>
            </button>
          </template>
          <div v-else class="pinned-empty">
            {{ $t('sidebar.pinned.empty') }}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="sidebar-footer">
      <button
        v-for="item in footerItems"
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

/* Header */
.sidebar-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 4px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
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

/* Search */
.sidebar-search {
  padding: 8px 8px 4px;
  flex-shrink: 0;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0 8px;
  transition: border-color 0.15s ease;
}

.search-input-wrapper:focus-within {
  border-color: var(--accent);
}

.search-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 7px 0;
  outline: none;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

.search-clear {
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 3px;
}

.search-clear:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

/* Scroll area */
.nav-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

/* Sections */
.nav-section {
  padding: 2px 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
  user-select: none;
}

.section-header.collapsible {
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.section-header.collapsible:hover {
  background: var(--bg-card);
}

.collapse-arrow {
  font-size: 8px;
  width: 12px;
  text-align: center;
  flex-shrink: 0;
}

.section-title {
  flex: 1;
}

.section-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* Divider */
.section-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 12px;
}

/* Nav item */
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
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
  font-size: 16px;
  flex-shrink: 0;
  width: 22px;
  text-align: center;
}

.nav-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Pin button */
.pin-btn {
  font-size: 12px;
  opacity: 0;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: opacity 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.nav-item:hover .pin-btn {
  opacity: 0.4;
}

.pin-btn:hover {
  opacity: 1 !important;
  background: var(--bg-card);
}

.pin-btn.pinned {
  opacity: 0.8;
}

/* Empty states */
.search-empty,
.pinned-empty {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 8px 12px;
  text-align: center;
  font-style: italic;
}

/* Footer */
.sidebar-footer {
  padding: 8px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}
</style>