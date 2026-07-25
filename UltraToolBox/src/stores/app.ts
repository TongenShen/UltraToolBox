import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'dark' | 'light'

export const useAppStore = defineStore('app', () => {
  const theme = ref<ThemeMode>('dark')
  const sidebarCollapsed = ref(false)

  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    theme,
    sidebarCollapsed,
    isDark,
    toggleTheme,
    setTheme,
    toggleSidebar
  }
})