import { ref, computed } from 'vue'
import { checkCommandExists, executeCommand } from '@/composables/useCommand'

export interface BinaryInfo {
  name: string          // 内部名称，如 adb, iperf3
  displayName: string   // 显示名称，如 ADB, iPerf3
  descriptionKey: string   // i18n key for description
  version: string       // 版本号
  installed: boolean    // 是否已安装
  checking: boolean     // 正在检查中
  downloadUrl: string   // 下载地址
  sizeKey: string       // i18n key for size
}

const knownBinaries: BinaryInfo[] = [
  {
    name: 'adb',
    displayName: 'ADB',
    descriptionKey: 'binary.adb.description',
    version: '',
    installed: false,
    checking: false,
    downloadUrl: 'https://developer.android.com/studio/releases/platform-tools',
    sizeKey: 'binary.adb.size'
  },
  {
    name: 'iperf3',
    displayName: 'iPerf3',
    descriptionKey: 'binary.iperf3.description',
    version: '',
    installed: false,
    checking: false,
    downloadUrl: 'https://iperf.fr/iperf-download.php',
    sizeKey: 'binary.iperf3.size'
  },
  {
    name: 'aria2c',
    displayName: 'Aria2',
    descriptionKey: 'binary.aria2.description',
    version: '',
    installed: false,
    checking: false,
    downloadUrl: 'https://github.com/aria2/aria2/releases',
    sizeKey: 'binary.aria2.size'
  },
  {
    name: 'curl',
    displayName: 'cURL',
    descriptionKey: 'binary.curl.description',
    version: '',
    installed: false,
    checking: false,
    downloadUrl: 'https://curl.se/download.html',
    sizeKey: 'binary.builtin'
  },
  {
    name: 'ping',
    displayName: 'Ping',
    descriptionKey: 'binary.ping.description',
    version: '',
    installed: false,
    checking: false,
    downloadUrl: '',
    sizeKey: 'binary.builtin'
  }
]

export function useBinary() {
  const binaries = ref<BinaryInfo[]>(JSON.parse(JSON.stringify(knownBinaries)))

  const installedBinaries = computed(() =>
    binaries.value.filter(b => b.installed)
  )

  const missingBinaries = computed(() =>
    binaries.value.filter(b => !b.installed && b.downloadUrl)
  )

  /**
   * 检查所有已知二进制工具是否可用
   */
  async function checkAllBinaries(): Promise<void> {
    const checks = binaries.value.map(async (binary) => {
      binary.checking = true
      try {
        binary.installed = await checkCommandExists(binary.name)
        if (binary.installed) {
          // 获取版本信息
          const result = await executeCommand(`${binary.name} --version 2>&1 | head -1`)
          if (result.code === 0) {
            binary.version = result.stdout.trim()
          }
        }
      } catch {
        binary.installed = false
      } finally {
        binary.checking = false
      }
    })

    await Promise.all(checks)
  }

  /**
   * 检查单个二进制工具
   */
  async function checkBinary(name: string): Promise<boolean> {
    const binary = binaries.value.find(b => b.name === name)
    if (!binary) return false

    binary.checking = true
    try {
      binary.installed = await checkCommandExists(name)
      if (binary.installed) {
        const result = await executeCommand(`${name} --version 2>&1 | head -1`)
        if (result.code === 0) {
          binary.version = result.stdout.trim()
        }
      }
      return binary.installed
    } catch {
      binary.installed = false
      return false
    } finally {
      binary.checking = false
    }
  }

  /**
   * 获取二进制信息
   */
  function getBinaryInfo(name: string): BinaryInfo | undefined {
    return binaries.value.find(b => b.name === name)
  }

  return {
    binaries,
    installedBinaries,
    missingBinaries,
    checkAllBinaries,
    checkBinary,
    getBinaryInfo
  }
}