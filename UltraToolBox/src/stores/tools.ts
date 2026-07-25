import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ToolBinary {
  name: string
  displayName: string
  version: string
  installed: boolean
  path: string
}

export interface ToolItem {
  path: string
  titleKey: string
  icon: string
}

export const useToolsStore = defineStore('tools', () => {
  const binaries = ref<ToolBinary[]>([])

  // 固定工具 - 持久化到 localStorage
  const savedPinned = typeof localStorage !== 'undefined'
    ? localStorage.getItem('ultratoolbox-pinned-tools')
    : null
  const pinnedTools = ref<string[]>(savedPinned ? JSON.parse(savedPinned) : [])

  // 自动持久化
  watch(pinnedTools, (val) => {
    localStorage.setItem('ultratoolbox-pinned-tools', JSON.stringify(val))
  }, { deep: true })

  function setBinaries(list: ToolBinary[]) {
    binaries.value = list
  }

  function updateBinaryStatus(name: string, installed: boolean, path: string) {
    const bin = binaries.value.find(b => b.name === name)
    if (bin) {
      bin.installed = installed
      bin.path = path
    }
  }

  function togglePin(path: string) {
    const idx = pinnedTools.value.indexOf(path)
    if (idx >= 0) {
      pinnedTools.value.splice(idx, 1)
    } else {
      pinnedTools.value.push(path)
    }
  }

  function isPinned(path: string): boolean {
    return pinnedTools.value.includes(path)
  }

  return {
    binaries,
    pinnedTools,
    setBinaries,
    updateBinaryStatus,
    togglePin,
    isPinned
  }
})