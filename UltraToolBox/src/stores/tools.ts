import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToolBinary {
  name: string
  displayName: string
  version: string
  installed: boolean
  path: string
}

export const useToolsStore = defineStore('tools', () => {
  const binaries = ref<ToolBinary[]>([])

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

  return {
    binaries,
    setBinaries,
    updateBinaryStatus
  }
})