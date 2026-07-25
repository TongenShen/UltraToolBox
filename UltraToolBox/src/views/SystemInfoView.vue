<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { APP_VERSION } from '@/config/app'
import {
  Cpu, HardDrive, Monitor, Server, Clock,
  Disc, Loader, Info, BarChart3, RefreshCw,
  Battery, Zap, Thermometer, Activity
} from '@lucide/vue'

const { t } = useI18n()
const appStore = useAppStore()

interface DiskInfo {
  mount_point: string
  total_space: number
  available_space: number
  file_system: string
}

interface SystemInfo {
  cpu_brand: string
  cpu_cores_physical: number
  cpu_cores_logical: number
  cpu_frequency: number
  cpu_usage: number
  architecture: string
  hostname: string
  os_name: string
  os_version: string
  kernel_version: string
  uptime_seconds: number
  memory_total: number
  memory_used: number
  memory_available: number
  swap_total: number
  swap_used: number
  disks: DiskInfo[]
  process_count: number
  load_average_1: number
  load_average_5: number
  load_average_15: number
}

interface PowerInfo {
  available: boolean
  battery_percent: number | null
  battery_state: string | null
  battery_time_remaining: string | null
  power_source: string | null
  thermal_level: string | null
  cpu_power_mw: number | null
  gpu_power_mw: number | null
  combined_power_mw: number | null
  powermetrics_available: boolean
}

const loading = ref(true)
const refreshing = ref(false)
const error = ref('')
const info = ref<SystemInfo | null>(null)
const powerInfo = ref<PowerInfo | null>(null)
const monitoring = ref(false)
let monitorTimer: ReturnType<typeof setInterval> | null = null

// ---- 翻译函数 ----
function translatePowerSource(source: string): string {
  const map: Record<string, string> = {
    'AC Power': t('systemInfo.power.source.ac'),
    'Battery Power': t('systemInfo.power.source.battery'),
  }
  return map[source] || source
}

function translateBatteryState(state: string): string {
  const map: Record<string, string> = {
    'charging': t('systemInfo.power.state.charging'),
    'discharging': t('systemInfo.power.state.discharging'),
    'charged': t('systemInfo.power.state.charged'),
    'finishing charge': t('systemInfo.power.state.finishing'),
    'AC attached': t('systemInfo.power.state.acAttached'),
  }
  return map[state] || state
}

function formatTimeRemaining(time: string): string {
  return `${time} ${t('systemInfo.power.remaining')}`
}

// ---- 格式化函数 ----
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (days > 0) parts.push(`${days}${t('systemInfo.day')}`)
  if (hours > 0) parts.push(`${hours}${t('systemInfo.hour')}`)
  parts.push(`${minutes}${t('systemInfo.minute')}`)
  return parts.join(' ')
}

function formatFrequency(freq: number): string {
  if (freq >= 1000) {
    return (freq / 1000).toFixed(2) + ' GHz'
  }
  return freq + ' MHz'
}

function cpuUsagePercent(): number {
  if (!info.value) return 0
  return Math.round(info.value.cpu_usage * 100) / 100
}

function memoryUsagePercent(): number {
  if (!info.value || info.value.memory_total === 0) return 0
  return Math.round((info.value.memory_used / info.value.memory_total) * 10000) / 100
}

function diskUsagePercent(disk: DiskInfo): number {
  const used = disk.total_space - disk.available_space
  if (disk.total_space === 0) return 0
  return Math.round((used / disk.total_space) * 10000) / 100
}

function diskUsed(disk: DiskInfo): string {
  return formatBytes(disk.total_space - disk.available_space)
}

// ---- 数据获取 ----
async function fetchSystemInfo() {
  try {
    const pwd = appStore.rootPassword || null
    const [sysResult, powerResult] = await Promise.all([
      invoke<SystemInfo>('get_system_info'),
      invoke<PowerInfo>('get_power_info', { rootPassword: pwd }),
    ])
    info.value = sysResult
    if (powerResult.available) {
      powerInfo.value = powerResult
    } else {
      powerInfo.value = null
    }
    error.value = ''
  } catch (e: any) {
    error.value = e?.toString() || '获取系统信息失败'
  }
}

async function refresh() {
  refreshing.value = true
  await fetchSystemInfo()
  refreshing.value = false
}

// ---- 实时监控 ----
async function fetchPowerOnly() {
  try {
    const pwd = appStore.rootPassword || null
    const result = await invoke<PowerInfo>('get_power_info', { rootPassword: pwd })
    if (result.available) {
      powerInfo.value = result
    }
  } catch {
    // 静默失败，不中断监控
  }
}

function toggleMonitoring() {
  if (monitoring.value) {
    // 停止监控
    if (monitorTimer !== null) {
      clearInterval(monitorTimer)
      monitorTimer = null
    }
    monitoring.value = false
    invoke('stop_power_monitoring')
  } else {
    // 开始监控 — 启动后台 powermetrics 进程
    const pwd = appStore.rootPassword
    if (!pwd) {
      // 没有密码时提示
      return
    }
    invoke('start_power_monitoring', { rootPassword: pwd }).then(() => {
      monitoring.value = true
      // 立即刷新一次
      fetchPowerOnly()
      // 每 10 秒轮询（只从缓存读，不额外跑 powermetrics）
      monitorTimer = setInterval(fetchPowerOnly, 10000)
    }).catch((e) => {
      console.error('启动功率监控失败:', e)
    })
  }
}

onMounted(async () => {
  await fetchSystemInfo()
  loading.value = false
})

onUnmounted(() => {
  if (monitorTimer !== null) {
    clearInterval(monitorTimer)
    monitorTimer = null
  }
  invoke('stop_power_monitoring')
})
</script>

<template>
  <div class="tool-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">
          <Monitor :size="24" />
          {{ $t('systemInfo.title') }}
        </h1>
        <p class="page-desc">{{ $t('systemInfo.subtitle') }}</p>
      </div>
      <button class="refresh-btn" :disabled="refreshing" @click="refresh" :title="$t('common.refresh')">
        <RefreshCw :size="18" :class="{ spin: refreshing }" />
        <span>{{ $t('common.refresh') }}</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <Loader :size="32" class="spin" />
      <span>{{ $t('common.loading') }}</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <!-- 系统信息内容 -->
    <div v-else-if="info" class="system-info-container">
      <!-- 第一行：CPU + 内存 -->
      <div class="info-row">
        <!-- CPU 信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <Cpu :size="20" />
            <span>{{ $t('systemInfo.cpu.title') }}</span>
          </div>
          <div class="card-body">
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.cpu.model') }}</span>
              <span class="info-value">{{ info.cpu_brand }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.cpu.architecture') }}</span>
              <span class="info-value">{{ info.architecture }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.cpu.cores') }}</span>
              <span class="info-value">{{ info.cpu_cores_physical }}P / {{ info.cpu_cores_logical }}L</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.cpu.frequency') }}</span>
              <span class="info-value">{{ formatFrequency(info.cpu_frequency) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.cpu.usage') }}</span>
              <span class="info-value">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: cpuUsagePercent() + '%' }" :class="{ 'fill-warning': cpuUsagePercent() > 70, 'fill-danger': cpuUsagePercent() > 90 }"></div>
                </div>
                <span class="progress-text">{{ cpuUsagePercent() }}%</span>
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.cpu.loadAverage') }}</span>
              <span class="info-value">{{ info.load_average_1.toFixed(2) }} / {{ info.load_average_5.toFixed(2) }} / {{ info.load_average_15.toFixed(2) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.processCount') }}</span>
              <span class="info-value">{{ info.process_count }}</span>
            </div>
          </div>
        </div>

        <!-- 内存信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <BarChart3 :size="20" />
            <span>{{ $t('systemInfo.memory.title') }}</span>
          </div>
          <div class="card-body">
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.memory.total') }}</span>
              <span class="info-value">{{ formatBytes(info.memory_total) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.memory.used') }}</span>
              <span class="info-value">{{ formatBytes(info.memory_used) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.memory.available') }}</span>
              <span class="info-value">{{ formatBytes(info.memory_available) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.memory.usage') }}</span>
              <span class="info-value">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: memoryUsagePercent() + '%' }" :class="{ 'fill-warning': memoryUsagePercent() > 70, 'fill-danger': memoryUsagePercent() > 90 }"></div>
                </div>
                <span class="progress-text">{{ memoryUsagePercent() }}%</span>
              </span>
            </div>
            <div class="info-item" v-if="info.swap_total > 0">
              <span class="info-label">{{ $t('systemInfo.memory.swap') }}</span>
              <span class="info-value">{{ formatBytes(info.swap_used) }} / {{ formatBytes(info.swap_total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 功率信息 (macOS 专用) -->
      <div class="info-card full-width" v-if="powerInfo">
        <div class="card-header">
          <div class="card-header-left">
            <Zap :size="20" />
            <span>{{ $t('systemInfo.power.title') }}</span>
          </div>
          <button
            class="monitor-btn"
            :class="{ active: monitoring }"
            @click="toggleMonitoring"
            :title="monitoring ? $t('systemInfo.power.stopMonitor') : $t('systemInfo.power.startMonitor')"
          >
            <Activity :size="16" :class="{ 'pulse': monitoring }" />
            <span>{{ monitoring ? $t('systemInfo.power.monitoring') : $t('systemInfo.power.monitor') }}</span>
          </button>
        </div>
        <div class="card-body">
          <div class="power-grid">
            <div class="power-item" v-if="powerInfo.power_source">
              <span class="power-label"><Battery :size="14" /> {{ $t('systemInfo.power.source') }}</span>
              <span class="power-value">{{ translatePowerSource(powerInfo.power_source) }}</span>
            </div>
            <div class="power-item" v-if="powerInfo.battery_percent !== null">
              <span class="power-label">{{ $t('systemInfo.power.batteryPercent') }}</span>
              <span class="power-value">{{ powerInfo.battery_percent }}%</span>
            </div>
            <div class="power-item" v-if="powerInfo.battery_state">
              <span class="power-label">{{ $t('systemInfo.power.batteryState') }}</span>
              <span class="power-value">{{ translateBatteryState(powerInfo.battery_state) }}</span>
            </div>
            <div class="power-item" v-if="powerInfo.battery_time_remaining">
              <span class="power-label">{{ $t('systemInfo.power.timeRemaining') }}</span>
              <span class="power-value">{{ formatTimeRemaining(powerInfo.battery_time_remaining) }}</span>
            </div>
            <div class="power-item" v-if="powerInfo.thermal_level">
              <span class="power-label"><Thermometer :size="14" /> {{ $t('systemInfo.power.thermal') }}</span>
              <span class="power-value" :class="{ 'thermal-hot': powerInfo.thermal_level !== 'Nominal' && powerInfo.thermal_level !== 'Fair' }">{{ powerInfo.thermal_level }}</span>
            </div>
            <div class="power-item" v-if="powerInfo.cpu_power_mw !== null">
              <span class="power-label"><Cpu :size="14" /> {{ $t('systemInfo.power.cpuPower') }}</span>
              <span class="power-value">{{ (powerInfo.cpu_power_mw / 1000).toFixed(2) }} W</span>
            </div>
            <div class="power-item" v-if="powerInfo.gpu_power_mw !== null">
              <span class="power-label"><Monitor :size="14" /> {{ $t('systemInfo.power.gpuPower') }}</span>
              <span class="power-value">{{ (powerInfo.gpu_power_mw / 1000).toFixed(2) }} W</span>
            </div>
            <div class="power-item" v-if="powerInfo.combined_power_mw !== null" :title="$t('systemInfo.power.combinedPowerDesc')">
              <span class="power-label"><Zap :size="14" /> {{ $t('systemInfo.power.combinedPower') }}</span>
              <span class="power-value">{{ (powerInfo.combined_power_mw / 1000).toFixed(2) }} W</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行：系统信息 + 应用信息 -->
      <div class="info-row">
        <!-- 系统信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <Server :size="20" />
            <span>{{ $t('systemInfo.system.title') }}</span>
          </div>
          <div class="card-body">
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.system.hostname') }}</span>
              <span class="info-value">{{ info.hostname }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.system.os') }}</span>
              <span class="info-value">{{ info.os_name }} {{ info.os_version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.system.kernel') }}</span>
              <span class="info-value">{{ info.kernel_version }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.system.uptime') }}</span>
              <span class="info-value">
                <Clock :size="14" />
                {{ formatUptime(info.uptime_seconds) }}
              </span>
            </div>
          </div>
        </div>

        <!-- 应用信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <Info :size="20" />
            <span>{{ $t('systemInfo.app.title') }}</span>
          </div>
          <div class="card-body">
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.app.name') }}</span>
              <span class="info-value">UltraToolBox</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.app.version') }}</span>
              <span class="info-value">v{{ APP_VERSION }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('systemInfo.app.framework') }}</span>
              <span class="info-value">Tauri 2 + Vue 3</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 磁盘信息 -->
      <div class="info-card full-width">
        <div class="card-header">
          <Disc :size="20" />
          <span>{{ $t('systemInfo.disk.title') }}</span>
        </div>
        <div class="card-body">
          <div v-for="(disk, index) in info.disks" :key="index" class="disk-item">
            <div class="disk-header">
              <span class="disk-label">
                <HardDrive :size="16" />
                {{ disk.mount_point }}
              </span>
              <span class="disk-fs">{{ disk.file_system }}</span>
            </div>
            <div class="disk-details">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: diskUsagePercent(disk) + '%' }" :class="{ 'fill-warning': diskUsagePercent(disk) > 70, 'fill-danger': diskUsagePercent(disk) > 90 }"></div>
              </div>
              <span class="progress-text">{{ diskUsagePercent(disk) }}%</span>
            </div>
            <div class="disk-size">
              <span>{{ $t('systemInfo.disk.total') }}: {{ formatBytes(disk.total_space) }}</span>
              <span>{{ $t('systemInfo.disk.used') }}: {{ diskUsed(disk) }}</span>
              <span>{{ $t('systemInfo.disk.available') }}: {{ formatBytes(disk.available_space) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
}

.page-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin-left: 34px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
  margin-top: 2px;
}

.refresh-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--bg-card));
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.error-state {
  text-align: center;
  padding: 40px 20px;
  color: #ef4444;
}

.spin {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.system-info-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 960px;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 700px) {
  .info-row {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}

.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
  color: var(--text-primary);
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.info-label {
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.info-value {
  color: var(--text-primary);
  text-align: right;
  display: flex;
  align-items: center;
  gap: 6px;
  word-break: break-all;
  overflow-wrap: break-word;
  max-width: 70%;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.fill-warning {
  background: #f59e0b;
}

.progress-fill.fill-danger {
  background: #ef4444;
}

.progress-text {
  font-size: 12px;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: right;
}

/* 磁盘列表 */
.disk-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.disk-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.disk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.disk-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
}

.disk-fs {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--border);
  padding: 1px 6px;
  border-radius: 4px;
}

.disk-details {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.disk-details .progress-bar {
  flex: 1;
  width: auto;
}

.disk-size {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 功率信息 */
.power-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.power-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--bg-primary);
  border-radius: 8px;
}

.power-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.power-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.power-value.thermal-hot {
  color: #ef4444;
}

/* 实时监控按钮 */
.monitor-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.monitor-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.monitor-btn.active {
  color: #22c55e;
  border-color: #22c55e;
  background: color-mix(in srgb, #22c55e 10%, var(--bg-primary));
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>