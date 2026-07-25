<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { executeCommand, spawnCommand, type CommandEvent } from '@/composables/useCommand'
import { checkCommandExists } from '@/composables/useCommand'
import LogPanel from '@/components/common/LogPanel.vue'
import TooltipInput from '@/components/common/TooltipInput.vue'
import { useProcessStore } from '@/stores/process'

const { t } = useI18n()
const processStore = useProcessStore()

// ====== 状态 ======
const adbAvailable = ref(false)
const adbChecking = ref(true)
const adbVersion = ref('')
const activeTab = ref<'devices' | 'quick' | 'apk' | 'logcat' | 'files'>('devices')
const logLines = ref<string[]>([])
const logStatus = ref<'idle' | 'running' | 'completed' | 'error'>('idle')
let logcatKill: (() => Promise<void>) | null = null

// ====== 设备列表 ======
interface AdbDevice {
  id: string
  status: string
  model?: string
  manufacturer?: string
  androidVersion?: string
  battery?: number
}

const devices = ref<AdbDevice[]>([])
const devicesLoading = ref(false)
const connectIp = ref('')
const connectPort = ref('5555')
const connecting = ref(false)

// ====== APK 管理 ======
const apkInstallPath = ref('')
const installing = ref(false)
const apkUninstallPackage = ref('')
const uninstalling = ref(false)
const packagesList = ref<string[]>([])
const packagesLoading = ref(false)
const apkSearchQuery = ref('')

// ====== 文件浏览 ======
const filePath = ref('/sdcard')
const fileList = ref<FileItem[]>([])
const fileLoading = ref(false)
const fileContent = ref('')

interface FileItem {
  name: string
  isDir: boolean
  size: string
  permissions: string
  date: string
}

// ====== 截图 ======
const screenshotLoading = ref(false)
const screenshotPath = ref('')
const screenshotDest = ref('')

// ====== ADB 检查 ======
async function checkAdb() {
  adbChecking.value = true
  adbAvailable.value = await checkCommandExists('adb')
  if (adbAvailable.value) {
    const result = await executeCommand('adb --version 2>&1 | head -3')
    if (result.code === 0) {
      adbVersion.value = result.stdout.trim().split('\n')[0] || t('common.installed')
    }
  }
  adbChecking.value = false
}

// ====== 设备管理 ======
async function listDevices() {
  devicesLoading.value = true
  logLines.value.push(t('adb.log.scanning'))

  const result = await executeCommand('adb devices -l 2>&1')
  if (result.code === 0) {
    const lines = result.stdout.trim().split('\n')
    const deviceList: AdbDevice[] = []

    for (const line of lines) {
      if (line.startsWith('List') || line.trim() === '') continue
      const parts = line.trim().split(/\s+/)
      if (parts.length >= 2) {
        const device: AdbDevice = {
          id: parts[0],
          status: parts[1]
        }
        // Parse extra info from `adb devices -l`
        const extra = line.match(/model:(\S+)/)
        if (extra) device.model = extra[1]
        const manu = line.match(/manufacturer:(\S+)/)
        if (manu) device.manufacturer = manu[1]

        // Get device details
        if (device.status === 'device') {
          const verResult = await executeCommand(`adb -s ${device.id} shell getprop ro.build.version.release 2>&1`)
          if (verResult.code === 0) device.androidVersion = verResult.stdout.trim()

          const batResult = await executeCommand(`adb -s ${device.id} shell dumpsys battery 2>&1 | grep level`)
          if (batResult.code === 0) {
            const match = batResult.stdout.match(/(\d+)/)
            if (match) device.battery = parseInt(match[1])
          }
        }

        deviceList.push(device)
      }
    }

    devices.value = deviceList
    logLines.value.push(t('adb.log.foundDevices', { n: deviceList.length }))
  } else {
    logLines.value.push(t('adb.log.scanFailed', { error: result.stderr }))
  }

  devicesLoading.value = false
}

async function connectDevice() {
  if (!connectIp.value.trim()) return
  connecting.value = true
  const addr = `${connectIp.value.trim()}:${connectPort.value}`
  logLines.value.push(t('adb.log.connecting', { ip: connectIp.value.trim(), port: connectPort.value }))

  const result = await executeCommand(`adb connect ${addr} 2>&1`)
  if (result.code === 0) {
    logLines.value.push(t('adb.log.connected'))
    await listDevices()
  } else {
    logLines.value.push(t('adb.log.connectFailed', { error: result.stderr }))
  }
  connecting.value = false
}

async function disconnectDevice(deviceId: string) {
  logLines.value.push(t('adb.log.disconnecting', { serial: deviceId }))
  const result = await executeCommand(`adb disconnect ${deviceId} 2>&1`)
  if (result.code === 0) {
    logLines.value.push(t('adb.log.disconnected', { serial: deviceId }))
    await listDevices()
  } else {
    logLines.value.push(t('adb.log.disconnectFailed', { error: result.stderr }))
  }
}

function getDeviceIcon(device: AdbDevice): string {
  if (device.status === 'device') return '📱'
  if (device.status === 'offline') return '📴'
  if (device.status === 'unauthorized') return '🔒'
  return '❓'
}

// ====== 快捷操作 ======
async function takeScreenshot() {
  const device = getSelectedDevice()
  if (!device) return

  screenshotLoading.value = true
  logLines.value.push(t('adb.log.screenshotting'))

  const remotePath = `/sdcard/screenshot_${Date.now()}.png`
  const result = await executeCommand(`adb -s ${device.id} shell screencap -p ${remotePath} 2>&1`)
  if (result.code === 0) {
    screenshotPath.value = remotePath
    logLines.value.push(t('adb.log.screenshotSaved', { path: remotePath }))

    // Pull to local
    const localPath = `/tmp/screenshot_${Date.now()}.png`
    const pullResult = await executeCommand(`adb -s ${device.id} pull ${remotePath} ${localPath} 2>&1`)
    if (pullResult.code === 0) {
      logLines.value.push(t('adb.log.screenshotPulled', { path: localPath }))
      screenshotDest.value = localPath
    }
  } else {
    logLines.value.push(t('adb.log.screenshotFailed', { error: result.stderr }))
  }
  screenshotLoading.value = false
}

async function rebootDevice(mode: 'normal' | 'bootloader' | 'recovery') {
  const device = getSelectedDevice()
  if (!device) return

  const cmd = mode === 'normal' ? 'reboot' : `reboot ${mode}`
  logLines.value.push(t('adb.log.rebooting', { serial: device.id }))
  const result = await executeCommand(`adb -s ${device.id} ${cmd} 2>&1`)
  logLines.value.push(result.code === 0 ? t('adb.log.rebootSent') : t('adb.log.rebootFailed', { error: result.stderr }))
}

async function startScreenrecord() {
  const device = getSelectedDevice()
  if (!device) return

  logLines.value.push(t('adb.log.screenrecordStart'))

  const remotePath = `/sdcard/record_${Date.now()}.mp4`

  // 使用 spawn 运行 screenrecord，持续到手动停止
  const { kill } = await spawnCommand(
    `adb -s ${device.id} shell screenrecord ${remotePath}`,
    (event: CommandEvent) => {
      if (event.type === 'stdout' || event.type === 'stderr') {
        logLines.value.push(event.data)
      }
      if (event.type === 'done' || event.type === 'error') {
        logStatus.value = 'idle'
      }
    }
  )

  logcatKill = kill
  logStatus.value = 'running'
}

async function stopScreenrecord() {
  if (logcatKill) {
    await logcatKill()
    logcatKill = null
    logStatus.value = 'completed'
    logLines.value.push(t('adb.log.screenrecordStopped'))
  }
}

async function getDeviceInfo() {
  const device = getSelectedDevice()
  if (!device) return

  logLines.value.push(t('adb.log.gettingInfo'))
  const props = [
    'ro.product.model',
    'ro.product.manufacturer',
    'ro.build.version.release',
    'ro.build.version.sdk',
    'ro.serialno',
    'ro.product.cpu.abi',
    'ro.product.board',
    'ro.build.display.id'
  ]

  for (const prop of props) {
    const result = await executeCommand(`adb -s ${device.id} shell getprop ${prop} 2>&1`)
    if (result.code === 0 && result.stdout.trim()) {
      const label = prop.replace(/^ro\./, '').replace(/\./g, ' ')
      logLines.value.push(`  ${label}: ${result.stdout.trim()}`)
    }
  }
  logLines.value.push(t('adb.log.infoComplete'))
}

function getSelectedDevice(): AdbDevice | undefined {
  return devices.value.find(d => d.status === 'device')
}

// ====== APK 管理 ======
async function installApk() {
  if (!apkInstallPath.value.trim()) return
  installing.value = true
  const device = devices.value.find(d => d.status === 'device')
  if (!device) {
    logLines.value.push(t('adb.log.noDevice'))
    installing.value = false
    return
  }

  logLines.value.push(t('adb.log.installingApk', { path: apkInstallPath.value }))
  const result = await executeCommand(`adb -s ${device.id} install -r "${apkInstallPath.value}" 2>&1`)
  if (result.code === 0) {
    logLines.value.push(t('adb.log.installSuccess'))
  } else {
    logLines.value.push(t('adb.log.installFailed', { error: result.stderr || result.stdout }))
  }
  installing.value = false
}

async function uninstallApk() {
  if (!apkUninstallPackage.value.trim()) return
  uninstalling.value = true
  const device = devices.value.find(d => d.status === 'device')
  if (!device) {
    logLines.value.push(t('adb.log.noDevice'))
    uninstalling.value = false
    return
  }

  logLines.value.push(t('adb.log.uninstalling', { pkg: apkUninstallPackage.value }))
  const result = await executeCommand(`adb -s ${device.id} uninstall ${apkUninstallPackage.value} 2>&1`)
  if (result.code === 0) {
    logLines.value.push(t('adb.log.uninstallSuccess'))
  } else {
    logLines.value.push(t('adb.log.uninstallFailed', { error: result.stderr || result.stdout }))
  }
  uninstalling.value = false
}

async function listPackages() {
  packagesLoading.value = true
  const device = devices.value.find(d => d.status === 'device')
  if (!device) {
    logLines.value.push(t('adb.log.noDevice'))
    packagesLoading.value = false
    return
  }

  logLines.value.push(t('adb.log.fetchingPackages'))
  const result = await executeCommand(`adb -s ${device.id} shell pm list packages -f 2>&1`)
  if (result.code === 0) {
    packagesList.value = result.stdout.trim().split('\n').filter(l => l.trim())
    logLines.value.push(t('adb.log.totalPackages', { n: packagesList.value.length }))
  } else {
    logLines.value.push(t('adb.log.packagesFailed', { error: result.stderr }))
  }
  packagesLoading.value = false
}

const filteredPackages = computed(() => {
  if (!apkSearchQuery.value.trim()) return packagesList.value
  const q = apkSearchQuery.value.toLowerCase()
  return packagesList.value.filter(p => p.toLowerCase().includes(q))
})

// ====== 文件浏览 ======
async function listFiles(path: string) {
  fileLoading.value = true
  const device = devices.value.find(d => d.status === 'device')
  if (!device) {
    logLines.value.push(t('adb.log.noDevice'))
    fileLoading.value = false
    return
  }

  const result = await executeCommand(`adb -s ${device.id} shell ls -la "${path}" 2>&1`)
  if (result.code === 0) {
    const lines = result.stdout.trim().split('\n')
    const items: FileItem[] = []
    let total = 0

    for (const line of lines) {
      if (line.startsWith('total')) {
        const m = line.match(/\d+/)
        if (m) total = parseInt(m[0])
        continue
      }
      if (!line.trim()) continue

      const parts = line.split(/\s+/)
      if (parts.length >= 8) {
        const isDir = parts[0].startsWith('d')
        const name = parts.slice(7).join(' ')
        if (name === '.' || name === '..') continue

        items.push({
          name,
          isDir,
          size: parts[4],
          permissions: parts[0],
          date: `${parts[5]} ${parts[6]} ${parts[7]}`
        })
      }
    }

    fileList.value = items
    filePath.value = path
  } else {
    logLines.value.push(t('adb.log.listDirFailed', { path }))
    fileList.value = []
  }
  fileLoading.value = false
}

function navigateToDir(dirName: string) {
  const newPath = filePath.value === '/' ? `/${dirName}` : `${filePath.value}/${dirName}`
  listFiles(newPath)
}

function goBack() {
  if (filePath.value === '/' || filePath.value === '/sdcard') return
  const parent = filePath.value.substring(0, filePath.value.lastIndexOf('/'))
  listFiles(parent || '/')
}

async function pullFile(fileName: string) {
  const device = devices.value.find(d => d.status === 'device')
  if (!device) return

  const remotePath = `${filePath.value}/${fileName}`
  logLines.value.push(t('adb.log.pullingFile', { path: remotePath }))
  const result = await executeCommand(`adb -s ${device.id} pull "${remotePath}" ./ 2>&1`)
  if (result.code === 0) {
    logLines.value.push(t('adb.log.filePulled', { path: fileName }))
  } else {
    logLines.value.push(t('adb.log.pullFailed', { error: result.stderr }))
  }
}

// ====== Logcat ======
async function startLogcat() {
  const device = devices.value.find(d => d.status === 'device')
  if (!device) {
    logLines.value.push(t('adb.log.noDevice'))
    return
  }

  logStatus.value = 'running'
  logLines.value.push(t('adb.log.logcatStarting'))

  try {
    const { kill } = await spawnCommand(
      `adb -s ${device.id} logcat -v time 2>&1`,
      (event: CommandEvent) => {
        if (event.type === 'stdout' || event.type === 'stderr') {
          logLines.value.push(event.data)
        }
        if (event.type === 'done' || event.type === 'error') {
          logStatus.value = 'idle'
        }
      }
    )
    logcatKill = kill
  } catch (e) {
    logStatus.value = 'error'
    logLines.value.push(t('adb.log.logcatStartFailed', { error: e }))
  }
}

async function stopLogcat() {
  if (logcatKill) {
    await logcatKill()
    logcatKill = null
    logStatus.value = 'completed'
    logLines.value.push(t('adb.log.logcatStopped'))
  }
}

async function clearLogcat() {
  const device = devices.value.find(d => d.status === 'device')
  if (!device) return

  const result = await executeCommand(`adb -s ${device.id} logcat -c 2>&1`)
  if (result.code === 0) {
    logLines.value.push(t('adb.log.logcatCleared'))
  } else {
    logLines.value.push(t('adb.log.logcatClearFailed', { error: result.stderr }))
  }
}

function clearLog() {
  logLines.value = []
  logStatus.value = 'idle'
}

// ====== 生命周期 ======
onMounted(async () => {
  await checkAdb()
  if (adbAvailable.value) {
    await listDevices()
  }
})

onUnmounted(() => {
  if (logcatKill) {
    logcatKill()
    logcatKill = null
  }
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-container">
      <!-- Header -->
      <div class="tool-header">
        <h2 class="tool-title">{{ $t('adb.title') }}</h2>
        <p class="tool-desc">{{ $t('adb.subtitle') }}</p>
      </div>

      <!-- ADB Status -->
      <div class="adb-status-bar" v-if="!adbChecking">
        <div v-if="adbAvailable" class="status-ok">
          {{ $t('adb.ready') }}
          <span class="version" v-if="adbVersion">| {{ adbVersion }}</span>
        </div>
        <div v-else class="status-fail">
          {{ $t('adb.notInstalled') }}
          <a href="https://developer.android.com/studio/releases/platform-tools" target="_blank" class="download-link">{{ $t('adb.downloadTools') }}</a>
        </div>
      </div>
      <div class="adb-status-bar" v-else>
        {{ $t('adb.checking') }}
      </div>

      <!-- Tab Navigation -->
      <div class="tab-bar" v-if="adbAvailable">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'devices' }"
          @click="activeTab = 'devices'"
        >{{ $t('adb.tab.devices') }}</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'quick' }"
          @click="activeTab = 'quick'"
        >{{ $t('adb.tab.quick') }}</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'apk' }"
          @click="activeTab = 'apk'"
        >{{ $t('adb.tab.apk') }}</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'logcat' }"
          @click="activeTab = 'logcat'"
        >{{ $t('adb.tab.logcat') }}</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'files' }"
          @click="activeTab = 'files'"
        >{{ $t('adb.tab.files') }}</button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content" v-if="adbAvailable">
        <!-- ====== 设备管理 ====== -->
        <div v-show="activeTab === 'devices'" class="content-panel">
          <div class="panel-section">
            <div class="section-header">
              <h3>{{ $t('adb.devices.title') }}</h3>
              <div class="header-actions">
                <button class="btn btn-sm" @click="listDevices" :disabled="devicesLoading">
                  {{ devicesLoading ? $t('adb.devices.scanning') : $t('adb.devices.refresh') }}
                </button>
              </div>
            </div>

            <div v-if="devices.length === 0" class="empty-state">
              {{ $t('adb.devices.empty') }}
            </div>

            <div v-for="device in devices" :key="device.id" class="device-card">
              <div class="device-icon">{{ getDeviceIcon(device) }}</div>
              <div class="device-info">
                <div class="device-id">{{ device.id }}</div>
                <div class="device-meta">
                  <span class="device-status" :class="device.status">
                    {{ device.status === 'device' ? $t('adb.device.connected') : device.status === 'offline' ? $t('adb.device.offline') : device.status === 'unauthorized' ? $t('adb.device.unauthorized') : device.status }}
                  </span>
                  <span v-if="device.model" class="device-model">{{ device.model }}</span>
                  <span v-if="device.androidVersion" class="device-android">Android {{ device.androidVersion }}</span>
                  <span v-if="device.battery !== undefined" class="device-battery">🔋 {{ device.battery }}%</span>
                </div>
              </div>
              <div class="device-actions">
                <button class="btn btn-sm btn-danger" @click="disconnectDevice(device.id)" v-if="device.id.includes(':')">
                  {{ $t('adb.device.disconnect') }}
                </button>
              </div>
            </div>
          </div>

          <div class="panel-section">
            <h3>{{ $t('adb.wifi.title') }}</h3>
            <div class="connect-form">
              <TooltipInput :tooltip="$t('adb.tooltip.connectIp')">
                <input
                  v-model="connectIp"
                  :placeholder="$t('adb.wifi.ipPlaceholder')"
                  class="input"
                  :disabled="connecting"
                />
              </TooltipInput>
              <TooltipInput :tooltip="$t('adb.tooltip.connectPort')">
                <input
                  v-model="connectPort"
                  :placeholder="$t('adb.wifi.port')"
                  class="input input-sm"
                  style="width: 80px"
                  :disabled="connecting"
                />
              </TooltipInput>
              <button class="btn" @click="connectDevice" :disabled="connecting || !connectIp.trim()">
                {{ connecting ? $t('adb.wifi.connecting') : $t('adb.wifi.connect') }}
              </button>
            </div>
            <div class="hint">{{ $t('adb.wifi.hint') }} <code>adb tcpip 5555</code>{{ $t('adb.wifi.hint2') }}</div>
          </div>
        </div>

        <!-- ====== 快捷操作 ====== -->
        <div v-show="activeTab === 'quick'" class="content-panel">
          <div class="panel-section">
            <h3>{{ $t('adb.quick.title') }}</h3>
            <div class="quick-grid">
              <button class="quick-btn" @click="takeScreenshot" :disabled="screenshotLoading || !getSelectedDevice()">
                <span class="quick-icon">📸</span>
                <span class="quick-label">{{ $t('adb.quick.screenshot') }}</span>
                <span class="quick-desc">{{ $t('adb.quick.screenshot.desc') }}</span>
              </button>

              <button class="quick-btn" @click="startScreenrecord" :disabled="logStatus === 'running' || !getSelectedDevice()">
                <span class="quick-icon">🎬</span>
                <span class="quick-label">{{ $t('adb.quick.screenrecord') }}</span>
                <span class="quick-desc">{{ $t('adb.quick.screenrecord.desc') }}</span>
              </button>

              <button class="quick-btn danger" @click="stopScreenrecord" :disabled="logStatus !== 'running'">
                <span class="quick-icon">⏹️</span>
                <span class="quick-label">{{ $t('adb.quick.stopScreenrecord') }}</span>
                <span class="quick-desc">{{ $t('adb.quick.stopScreenrecord.desc') }}</span>
              </button>

              <button class="quick-btn" @click="getDeviceInfo" :disabled="!getSelectedDevice()">
                <span class="quick-icon">ℹ️</span>
                <span class="quick-label">{{ $t('adb.quick.deviceInfo') }}</span>
                <span class="quick-desc">{{ $t('adb.quick.deviceInfo.desc') }}</span>
              </button>

              <button class="quick-btn" @click="rebootDevice('normal')" :disabled="!getSelectedDevice()">
                <span class="quick-icon">🔄</span>
                <span class="quick-label">{{ $t('adb.quick.reboot') }}</span>
                <span class="quick-desc">{{ $t('adb.quick.reboot.desc') }}</span>
              </button>

              <button class="quick-btn warning" @click="rebootDevice('bootloader')" :disabled="!getSelectedDevice()">
                <span class="quick-icon">🔧</span>
                <span class="quick-label">{{ $t('adb.quick.rebootBootloader') }}</span>
                <span class="quick-desc">{{ $t('adb.quick.rebootBootloader.desc') }}</span>
              </button>

              <button class="quick-btn warning" @click="rebootDevice('recovery')" :disabled="!getSelectedDevice()">
                <span class="quick-icon">🛠️</span>
                <span class="quick-label">{{ $t('adb.quick.rebootRecovery') }}</span>
                <span class="quick-desc">{{ $t('adb.quick.rebootRecovery.desc') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ====== APK 管理 ====== -->
        <div v-show="activeTab === 'apk'" class="content-panel">
          <div class="panel-section">
            <h3>{{ $t('adb.apk.install.title') }}</h3>
            <div class="form-row">
              <TooltipInput :tooltip="$t('adb.tooltip.installPath')">
                <input
                  v-model="apkInstallPath"
                  :placeholder="$t('adb.apk.install.placeholder')"
                  class="input"
                  :disabled="installing"
                />
              </TooltipInput>
              <button class="btn" @click="installApk" :disabled="installing || !apkInstallPath.trim()">
                {{ installing ? $t('adb.apk.installing') : $t('adb.apk.install') }}
              </button>
            </div>
          </div>

          <div class="panel-section">
            <h3>{{ $t('adb.apk.uninstall.title') }}</h3>
            <div class="form-row">
              <TooltipInput :tooltip="$t('adb.tooltip.uninstallPkg')">
                <input
                  v-model="apkUninstallPackage"
                  :placeholder="$t('adb.apk.uninstall.placeholder')"
                  class="input"
                  :disabled="uninstalling"
                />
              </TooltipInput>
              <button class="btn btn-danger" @click="uninstallApk" :disabled="uninstalling || !apkUninstallPackage.trim()">
                {{ uninstalling ? $t('adb.apk.uninstalling') : $t('adb.apk.uninstall') }}
              </button>
            </div>
          </div>

          <div class="panel-section">
            <div class="section-header">
              <h3>{{ $t('adb.apk.list.title') }}</h3>
              <button class="btn btn-sm" @click="listPackages" :disabled="packagesLoading">
                {{ packagesLoading ? $t('adb.apk.loading') : $t('adb.devices.refresh') }}
              </button>
            </div>
            <div class="search-box" v-if="packagesList.length > 0">
              <TooltipInput :tooltip="$t('adb.tooltip.searchPkg')">
                <input
                  v-model="apkSearchQuery"
                  :placeholder="$t('adb.apk.searchPlaceholder')"
                  class="input"
                />
              </TooltipInput>
            </div>
            <div class="package-list" v-if="packagesList.length > 0">
              <div
                v-for="pkg in filteredPackages"
                :key="pkg"
                class="package-item"
                @click="apkUninstallPackage = pkg.split(':').pop() || pkg"
              >
                <span class="pkg-name">{{ pkg.includes(':') ? pkg.split(':').pop() : pkg }}</span>
                <span class="pkg-path" v-if="pkg.includes(':')">{{ pkg.split(':')[0] }}</span>
              </div>
              <div v-if="filteredPackages.length === 0" class="empty-state">{{ $t('adb.apk.searchEmpty') }}</div>
            </div>
            <div v-else class="empty-state">{{ $t('adb.apk.listEmpty') }}</div>
          </div>
        </div>

        <!-- ====== Logcat ====== -->
        <div v-show="activeTab === 'logcat'" class="content-panel">
          <div class="panel-section">
            <div class="section-header">
              <h3>{{ $t('adb.logcat.title') }}</h3>
              <div class="header-actions">
                <button
                  v-if="logStatus !== 'running'"
                  class="btn btn-sm"
                  @click="startLogcat"
                  :disabled="!getSelectedDevice()"
                >{{ $t('adb.logcat.start') }}</button>
                <button
                  v-else
                  class="btn btn-sm btn-danger"
                  @click="stopLogcat"
                >{{ $t('adb.logcat.stop') }}</button>
                <button class="btn btn-sm" @click="clearLogcat">{{ $t('adb.logcat.clear') }}</button>
              </div>
            </div>
            <LogPanel
              :lines="logLines"
              :status="logStatus"
              :maxHeight="'400px'"
              @clear="clearLog"
            />
          </div>
        </div>

        <!-- ====== 文件浏览 ====== -->
        <div v-show="activeTab === 'files'" class="content-panel">
          <div class="panel-section">
            <div class="section-header">
              <h3>{{ $t('adb.files.title') }}</h3>
              <div class="header-actions">
                <button class="btn btn-sm" @click="listFiles('/sdcard')">{{ $t('adb.files.home') }}</button>
                <button class="btn btn-sm" @click="listFiles('/')">{{ $t('adb.files.root') }}</button>
              </div>
            </div>
            <div class="file-path-bar">
              <button class="path-btn" @click="goBack" :disabled="filePath === '/' || filePath === '/sdcard'">⬅️</button>
              <span class="current-path">{{ filePath }}</span>
              <button class="btn btn-sm" @click="listFiles(filePath)" :disabled="fileLoading">
                {{ fileLoading ? '⏳' : '🔄' }}
              </button>
            </div>
            <div class="file-grid">
              <div v-if="fileList.length === 0 && !fileLoading" class="empty-state">
                {{ $t('adb.files.empty') }}
              </div>
              <div
                v-for="item in fileList"
                :key="item.name"
                class="file-item"
                :class="{ 'is-dir': item.isDir }"
                @dblclick="item.isDir && navigateToDir(item.name)"
              >
                <span class="file-icon">{{ item.isDir ? '📁' : '📄' }}</span>
                <div class="file-info">
                  <span class="file-name">{{ item.name }}</span>
                  <span class="file-meta" v-if="!item.isDir">{{ item.size }} B</span>
                </div>
                <button
                  v-if="!item.isDir"
                  class="btn btn-sm"
                  @click.stop="pullFile(item.name)"
                  :title="$t('adb.files.pull')"
                >⬇️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ADB not available -->
      <div v-if="!adbChecking && !adbAvailable && activeTab !== 'devices'" class="adb-required">
        {{ $t('adb.required') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  height: 100%;
  overflow-y: auto;
}

.tool-container {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 24px;
}

.tool-header {
  margin-bottom: 16px;
}

.tool-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.tool-desc {
  color: var(--text-secondary);
  font-size: 14px;
}

/* ADB Status Bar */
.adb-status-bar {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
}

.status-ok { color: #22c55e; }
.status-fail { color: #ef4444; }

.version {
  color: var(--text-secondary);
  font-weight: 400;
  margin-left: 8px;
}

.download-link {
  color: var(--accent);
  margin-left: 8px;
  text-decoration: underline;
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  overflow-x: auto;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(124, 58, 237, 0.08);
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--accent);
  color: white;
}

/* Tab Content */
.tab-content {
  min-height: 300px;
}

.content-panel {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
}

.panel-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin-bottom: 0;
}

.header-actions {
  display: flex;
  gap: 6px;
}

/* Empty State */
.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: rgba(124, 58, 237, 0.08);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-danger {
  color: #ef4444;
}

.btn-danger:hover:not(:disabled) {
  border-color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.08) !important;
}

/* Input */
.input {
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  flex: 1;
  min-width: 0;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--accent);
}

.input-sm {
  padding: 8px 8px;
  text-align: center;
}

/* Device Cards */
.device-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: border-color 0.15s;
}

.device-card:hover {
  border-color: var(--accent);
}

.device-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.device-info {
  flex: 1;
  min-width: 0;
}

.device-id {
  font-size: 14px;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', monospace;
  word-break: break-all;
}

.device-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
}

.device-status {
  padding: 1px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.device-status.device { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.device-status.offline { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.device-status.unauthorized { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }

.device-model, .device-android, .device-battery {
  color: var(--text-secondary);
}

.device-actions {
  flex-shrink: 0;
}

/* Connect Form */
.connect-form {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.hint code {
  background: rgba(124, 58, 237, 0.1);
  color: var(--accent);
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
}

/* Quick Actions Grid */
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.quick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.quick-btn:hover:not(:disabled) {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
}

.quick-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.quick-btn.danger:hover:not(:disabled) {
  border-color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.quick-btn.warning:hover:not(:disabled) {
  border-color: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.quick-icon {
  font-size: 26px;
}

.quick-label {
  font-size: 13px;
  font-weight: 600;
}

.quick-desc {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
}

/* Form Row */
.form-row {
  display: flex;
  gap: 8px;
}

/* Search */
.search-box {
  margin-bottom: 8px;
}

/* Package List */
.package-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 6px;
}

.package-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.1s;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.package-item:hover {
  background: rgba(124, 58, 237, 0.08);
}

.package-item:not(:last-child) {
  border-bottom: 1px solid var(--border);
}

.pkg-name {
  color: var(--text-primary);
}

.pkg-path {
  color: var(--text-secondary);
  font-size: 11px;
}

/* File Browser */
.file-path-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 8px;
}

.path-btn {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 16px;
  padding: 2px 4px;
}

.path-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.current-path {
  flex: 1;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--text-primary);
}

.file-grid {
  border: 1px solid var(--border);
  border-radius: 6px;
  max-height: 350px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.1s;
}

.file-item:hover {
  background: rgba(124, 58, 237, 0.05);
}

.file-item:not(:last-child) {
  border-bottom: 1px solid var(--border);
}

.file-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  display: block;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 11px;
  color: var(--text-secondary);
}

.file-item.is-dir .file-name {
  font-weight: 500;
}

/* ADB Required */
.adb-required {
  text-align: center;
  padding: 40px;
  color: #f59e0b;
  font-size: 15px;
}

/* Scrollbar */
.package-list::-webkit-scrollbar,
.file-grid::-webkit-scrollbar {
  width: 4px;
}

.package-list::-webkit-scrollbar-track,
.file-grid::-webkit-scrollbar-track {
  background: transparent;
}

.package-list::-webkit-scrollbar-thumb,
.file-grid::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}
</style>