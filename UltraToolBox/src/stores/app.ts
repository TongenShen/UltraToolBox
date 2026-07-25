import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'dark' | 'light'
export type Locale = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'

export const useAppStore = defineStore('app', () => {
  // 从 localStorage 初始化
  const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('ultratoolbox-theme') : null
  const theme = ref<ThemeMode>(savedTheme === 'light' ? 'light' : 'dark')

  const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('ultratoolbox-locale') : null
  const locale = ref<Locale>((savedLocale as Locale) || 'zh-CN')

  const savedSidebar = typeof localStorage !== 'undefined' ? localStorage.getItem('ultratoolbox-sidebar') : null
  const sidebarCollapsed = ref(savedSidebar === 'true')

  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('ultratoolbox-theme', theme.value)
  }

  function setTheme(mode: ThemeMode) {
    theme.value = mode
    localStorage.setItem('ultratoolbox-theme', mode)
  }

  function setLocale(loc: Locale) {
    locale.value = loc
    localStorage.setItem('ultratoolbox-locale', loc)
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('ultratoolbox-sidebar', String(sidebarCollapsed.value))
  }

  return {
    theme,
    locale,
    sidebarCollapsed,
    isDark,
    toggleTheme,
    setTheme,
    setLocale,
    toggleSidebar
  }
})