<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { executeCommand, spawnCommand, type CommandEvent } from '@/composables/useCommand'
import { checkCommandExists } from '@/composables/useCommand'
import LogPanel from '@/components/common/LogPanel.vue'
import TooltipInput from '@/components/common/TooltipInput.vue'

const { t } = useI18n()

// ====== 状态 ======
const aria2Available = ref(false)
const aria2Checking = ref(true)
const aria2Version = ref('')
const aria2Running = ref(false)
const activeTab = ref<'download' | 'server' | 'bt'>('download')

// ====== 日志 ======
const logLines = ref<string[]>([])
const logStatus = ref<'idle' | 'running' | 'completed' | 'error'>('idle')
let aria2Process: { kill: () => Promise<void> } | null = null

// ====== 下载任务 ======
interface DownloadTask {
  url: string
  fileName: string
  status: 'queued' | 'downloading' | 'completed' | 'error'
  progress: string
  speed: string
  size: string
  errorMsg?: string
}

const downloadUrl = ref('')
const downloadDir = ref('~/Downloads')
const isDownloading = ref(false)
const tasks = ref<DownloadTask[]>([])
const selectedTaskIndex = ref<number | null>(null)

// ====== BT 下载 ======
const magnetLink = ref('')
const torrentPath = ref('')
const btDownloading = ref(false)

// ====== 服务器配置 ======
const serverPort = ref('6800')
const rpcSecret = ref('ultratoolbox')
const maxConcurrent = ref('5')
const maxSpeed = ref('0')  // 0 = unlimited
const serverStarted = ref(false)
const serverLog = ref<string[]>([])

// ====== 检查 Aria2 ======
async function checkAria2() {
  aria2Checking.value = true
  aria2Available.value = await checkCommandExists('aria2c')
  if (aria2Available.value) {
    const result = await executeCommand('aria2c --version 2>&1 | head -1')
    if (result.code === 0) {
      aria2Version.value = result.stdout.trim()
    }
  }
  aria2Checking.value = false
}

// ====== RPC 服务器管理 ======
async function startServer() {
  logLines.value.push(t('aria2.server.starting', { port: serverPort.value }))

  const config = [
    `--enable-rpc`,
    `--rpc-listen-port=${serverPort.value}`,
    `--rpc-secret=${rpcSecret.value}`,
    `--max-concurrent-downloads=${maxConcurrent.value}`,
    `--max-overall-download-limit=${maxSpeed.value}`,
    `--dir=${downloadDir.value}`,
    `--continue=true`,
    `--console-log-level=notice`,
    `--log-level=notice`,
    `--summary-interval=5`
  ]

  const cmd = `aria2c ${config.join(' ')} 2>&1`

  try {
    const { kill } = await spawnCommand(cmd, (event: CommandEvent) => {
      if (event.type === 'stdout' || event.type === 'stderr') {
        const line = event.data.trimEnd()
        logLines.value.push(line)
        serverLog.value.push(line)
      }
      if (event.type === 'done' || event.type === 'error') {
        aria2Running.value = false
        serverStarted.value = false
        logStatus.value = 'idle'
      }
    })

    aria2Process = { kill }
    aria2Running.value = true
    serverStarted.value = true
    logStatus.value = 'running'
    logLines.value.push(t('aria2.server.started'))
  } catch (e) {
    logLines.value.push(t('aria2.server.startFailed', { error: e }))
    logStatus.value = 'error'
  }
}

async function stopServer() {
  if (aria2Process) {
    logLines.value.push(t('aria2.server.stopping'))
    await executeCommand('pkill -f "aria2c.*enable-rpc" 2>/dev/null || true')
    await aria2Process.kill()
    aria2Process = null
    aria2Running.value = false
    serverStarted.value = false
    logStatus.value = 'completed'
    logLines.value.push(t('aria2.server.stoppedMsg'))
  }
}

// ====== 下载 ======
async function startDownload() {
  if (!downloadUrl.value.trim()) return
  if (!aria2Running.value) {
    logLines.value.push(t('aria2.warning.startServerFirst'))
    return
  }

  isDownloading.value = true
  const url = downloadUrl.value.trim()

  // Add to task list
  const task: DownloadTask = {
    url,
    fileName: url.split('/').pop() || url.split('?')[0].split('/').pop() || 'unknown',
    status: 'queued',
    progress: '等待中',
    speed: '-',
    size: '-'
  }
  tasks.value.unshift(task)
  selectedTaskIndex.value = 0

  logLines.value.push(t('aria2.log.addingDownload', { url }))

  // Use aria2c RPC to add URI
  // For simplicity, we use direct aria2c download
  const cmd = `aria2c \
    --dir="${downloadDir.value}" \
    --continue=true \
    --max-connection-per-server=16 \
    --split=16 \
    --console-log-level=notice \
    "${url}" 2>&1`

  await spawnCommand(cmd, (event: CommandEvent) => {
    const line = event.data.trimEnd()
    logLines.value.push(line)

    // Update task progress
    if (tasks.value.length > 0) {
      const currentTask = tasks.value[0]
      if (line.includes('DL:')) {
        currentTask.status = 'downloading'
        currentTask.progress = line
      } else if (line.includes('Download complete')) {
        currentTask.status = 'completed'
        currentTask.progress = '100%'
      } else if (line.includes('ERROR') || line.includes('error')) {
        currentTask.status = 'error'
        currentTask.errorMsg = line
      }
    }

    if (event.type === 'done' || event.type === 'error') {
      isDownloading.value = false
      downloadUrl.value = ''
    }
  })
}

// ====== BT/磁力下载 ======
async function startBtDownload() {
  const link = magnetLink.value.trim() || torrentPath.value.trim()
  if (!link) return
  if (!aria2Running.value) {
    logLines.value.push(t('aria2.warning.startServerFirst'))
    return
  }

  btDownloading.value = true
  logLines.value.push(t('aria2.log.addingBtDownload', { link: link.substring(0, 60) }))

  let cmd: string
  if (link.startsWith('magnet:')) {
    cmd = `aria2c \
      --dir="${downloadDir.value}" \
      --enable-dht=true \
      --dht-listen-port=6881 \
      --enable-peer-exchange=true \
      --bt-enable-lpd=true \
      --console-log-level=notice \
      --seed-time=0 \
      "${link}" 2>&1`
  } else {
    cmd = `aria2c \
      --dir="${downloadDir.value}" \
      --enable-dht=true \
      --dht-listen-port=6881 \
      --enable-peer-exchange=true \
      --bt-enable-lpd=true \
      --console-log-level=notice \
      --seed-time=0 \
      "${link}" 2>&1`
  }

  await spawnCommand(cmd, (event: CommandEvent) => {
    const line = event.data.trimEnd()
    logLines.value.push(line)

    if (event.type === 'done' || event.type === 'error') {
      btDownloading.value = false
      magnetLink.value = ''
      torrentPath.value = ''
    }
  })
}

function clearLog() {
  logLines.value = []
  logStatus.value = 'idle'
}

function clearTasks() {
  tasks.value = []
}

function removeTask(index: number) {
  tasks.value.splice(index, 1)
  if (selectedTaskIndex.value === index) {
    selectedTaskIndex.value = null
  }
}

onMounted(async () => {
  await checkAria2()
})

onUnmounted(() => {
  if (aria2Process) {
    executeCommand('pkill -f "aria2c.*enable-rpc" 2>/dev/null || true')
    aria2Process.kill()
  }
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-container">
      <!-- Header -->
      <div class="tool-header">
        <h2 class="tool-title">{{ $t('aria2.title') }}</h2>
        <p class="tool-desc">{{ $t('aria2.subtitle') }}</p>
      </div>

      <!-- Aria2 Status -->
      <div class="status-bar">
        <div v-if="aria2Checking" class="status-checking">{{ $t('aria2.checking') }}</div>
        <template v-else>
          <div class="status-left">
            <span v-if="aria2Available" class="status-ok">{{ $t('aria2.ready') }}</span>
            <span v-else class="status-fail">{{ $t('aria2.notInstalled') }}</span>
            <span class="status-version" v-if="aria2Version">{{ aria2Version }}</span>
          </div>
          <div class="status-right">
            <span class="server-status" :class="{ running: serverStarted }">
              {{ serverStarted ? $t('aria2.server.running') : $t('aria2.server.stopped') }}
            </span>
          </div>
        </template>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar" v-if="aria2Available">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'download' }"
          @click="activeTab = 'download'"
        >{{ $t('aria2.tab.http') }}</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'bt' }"
          @click="activeTab = 'bt'"
        >{{ $t('aria2.tab.bt') }}</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'server' }"
          @click="activeTab = 'server'"
        >{{ $t('aria2.tab.server') }}</button>
      </div>

      <div class="tab-content" v-if="aria2Available">
        <!-- ====== HTTP 下载 ====== -->
        <div v-show="activeTab === 'download'" class="content-panel">
          <div class="panel-section">
            <h3>{{ $t('aria2.addDownload.title') }}</h3>
            <div class="form-row">
              <TooltipInput :tooltip="$t('aria2.tooltip.url')">
                <input
                  v-model="downloadUrl"
                  :placeholder="$t('aria2.addDownload.urlPlaceholder')"
                  class="input"
                  :disabled="isDownloading"
                />
              </TooltipInput>
              <button
                class="btn btn-primary"
                @click="startDownload"
                :disabled="isDownloading || !downloadUrl.trim() || !serverStarted"
              >
                {{ isDownloading ? $t('aria2.downloading') : $t('aria2.download') }}
              </button>
            </div>
            <div class="form-row" style="margin-top: 8px">
              <TooltipInput :tooltip="$t('aria2.tooltip.downloadDir')">
                <input
                  v-model="downloadDir"
                  :placeholder="$t('aria2.downloadDir')"
                  class="input"
                  :disabled="isDownloading"
                />
              </TooltipInput>
              <span class="hint-text">{{ $t('aria2.downloadDir.hint') }}</span>
            </div>
          </div>

          <!-- Download Tasks -->
          <div class="panel-section">
            <div class="section-header">
              <h3>{{ $t('aria2.tasks.title') }}</h3>
              <button class="btn btn-sm" @click="clearTasks" v-if="tasks.length > 0">{{ $t('aria2.tasks.clear') }}</button>
            </div>
            <div v-if="tasks.length === 0" class="empty-state">{{ $t('aria2.tasks.empty') }}</div>
            <div v-for="(task, index) in tasks" :key="index" class="task-card">
              <div class="task-info">
                <div class="task-name">{{ task.fileName }}</div>
                <div class="task-url">{{ task.url.substring(0, 80) }}{{ task.url.length > 80 ? '...' : '' }}</div>
                <div class="task-meta">
                  <span class="task-status" :class="task.status">
                    {{ task.status === 'queued' ? $t('aria2.task.queued') : task.status === 'downloading' ? $t('aria2.task.downloading') : task.status === 'completed' ? $t('aria2.task.completed') : $t('aria2.task.error') }}
                  </span>
                  <span v-if="task.progress" class="task-progress">{{ task.progress }}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-danger" @click="removeTask(index)">✕</button>
            </div>
          </div>
        </div>

        <!-- ====== BT/磁力 ====== -->
        <div v-show="activeTab === 'bt'" class="content-panel">
          <div class="panel-section">
            <h3>{{ $t('aria2.magnet.title') }}</h3>
            <div class="form-row">
              <TooltipInput :tooltip="$t('aria2.tooltip.magnet')">
                <input
                  v-model="magnetLink"
                  placeholder="magnet:?xt=urn:btih:..."
                  class="input"
                  :disabled="btDownloading"
                />
              </TooltipInput>
              <button
                class="btn btn-primary"
                @click="startBtDownload"
                :disabled="btDownloading || !magnetLink.trim() || !serverStarted"
              >
                {{ btDownloading ? $t('aria2.adding') : $t('aria2.download') }}
              </button>
            </div>
          </div>

          <div class="panel-section">
            <h3>{{ $t('aria2.torrent.title') }}</h3>
            <div class="form-row">
              <TooltipInput :tooltip="$t('aria2.tooltip.torrent')">
                <input
                  v-model="torrentPath"
                  :placeholder="$t('aria2.torrent.placeholder')"
                  class="input"
                  :disabled="btDownloading"
                />
              </TooltipInput>
              <button
                class="btn btn-primary"
                @click="startBtDownload"
                :disabled="btDownloading || !torrentPath.trim() || !serverStarted"
              >
                {{ btDownloading ? $t('aria2.adding') : $t('aria2.download') }}
              </button>
            </div>
          </div>
        </div>

        <!-- ====== 服务器管理 ====== -->
        <div v-show="activeTab === 'server'" class="content-panel">
          <div class="panel-section">
            <h3>{{ $t('aria2.serverConfig.title') }}</h3>
            <div class="config-grid">
              <div class="config-item">
                <label class="config-label">{{ $t('aria2.serverConfig.port') }}</label>
                <TooltipInput :tooltip="$t('aria2.tooltip.port')">
                  <input v-model="serverPort" class="input" style="width: 100px" :disabled="serverStarted" />
                </TooltipInput>
              </div>
              <div class="config-item">
                <label class="config-label">RPC Secret</label>
                <TooltipInput :tooltip="$t('aria2.tooltip.secret')">
                  <input v-model="rpcSecret" class="input" style="width: 160px" :disabled="serverStarted" />
                </TooltipInput>
              </div>
              <div class="config-item">
                <label class="config-label">{{ $t('aria2.serverConfig.maxConcurrent') }}</label>
                <TooltipInput :tooltip="$t('aria2.tooltip.maxConcurrent')">
                  <input v-model="maxConcurrent" class="input" style="width: 80px" :disabled="serverStarted" />
                </TooltipInput>
              </div>
              <div class="config-item">
                <label class="config-label">{{ $t('aria2.serverConfig.speedLimit') }}</label>
                <TooltipInput :tooltip="$t('aria2.tooltip.maxSpeed')">
                  <input v-model="maxSpeed" class="input" style="width: 100px" :disabled="serverStarted" />
                </TooltipInput>
                <span class="hint-text">KB/s</span>
              </div>
              <div class="config-item">
                <label class="config-label">{{ $t('aria2.serverConfig.downloadDir') }}</label>
                <TooltipInput :tooltip="$t('aria2.tooltip.downloadDir')">
                  <input v-model="downloadDir" class="input" :disabled="serverStarted" />
                </TooltipInput>
              </div>
            </div>
            <div class="form-actions" style="margin-top: 12px">
              <button
                v-if="!serverStarted"
                class="btn btn-primary"
                @click="startServer"
                :disabled="!aria2Available"
              >{{ $t('aria2.server.start') }}</button>
              <button
                v-else
                class="btn btn-danger"
                @click="stopServer"
              >{{ $t('aria2.server.stop') }}</button>
            </div>
          </div>

          <!-- RPC Info -->
          <div class="panel-section" v-if="serverStarted">
            <h3>{{ $t('aria2.rpcInfo.title') }}</h3>
            <div class="rpc-info">
              <div class="rpc-row">
                <span class="rpc-label">{{ $t('aria2.rpcInfo.address') }}</span>
                <code>http://localhost:{{ serverPort }}/jsonrpc</code>
              </div>
              <div class="rpc-row">
                <span class="rpc-label">{{ $t('aria2.rpcInfo.secret') }}</span>
                <code>{{ rpcSecret }}</code>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== 日志 ====== -->
        <div class="panel-section">
          <div class="section-header">
            <h3>{{ $t('aria2.log.title') }}</h3>
            <button
              v-if="serverStarted"
              class="btn btn-sm btn-danger"
              @click="stopServer"
            >{{ $t('aria2.server.stop') }}</button>
          </div>
          <LogPanel
            :lines="logLines"
            :status="logStatus"
            :maxHeight="'350px'"
            @clear="clearLog"
          />
        </div>
      </div>

      <!-- Aria2 not available -->
      <div v-if="!aria2Checking && !aria2Available" class="not-available">
        <div class="not-available-icon">⚠️</div>
        <h3>{{ $t('aria2.notInstalled.title') }}</h3>
        <p>{{ $t('aria2.notInstalled.help') }}</p>
        <div class="install-cmd">brew install aria2</div>
        <p class="hint-text">{{ $t('aria2.notInstalled.hint') }}</p>
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

/* Status Bar */
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 13px;
}

.status-checking {
  color: var(--text-secondary);
}

.status-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-ok { color: #22c55e; font-weight: 500; }
.status-fail { color: #ef4444; font-weight: 500; }
.status-version { color: var(--text-secondary); font-size: 12px; }

.server-status {
  font-size: 12px;
  font-weight: 500;
}

.server-status.running { color: #22c55e; }
.server-status:not(.running) { color: var(--text-secondary); }

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
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
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Panel */
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

.btn-primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.btn-primary:hover:not(:disabled) {
  background: #6d28d9;
  border-color: #6d28d9;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-danger {
  color: #ef4444;
  border-color: #ef4444;
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1) !important;
  border-color: #ef4444 !important;
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

/* Forms */
.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.hint-text {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Empty State */
.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

/* Task Card */
.task-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 6px;
}

.task-card:last-child {
  margin-bottom: 0;
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-url {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Fira Code', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 2px 0;
}

.task-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.task-status {
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.task-status.queued { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.task-status.downloading { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.task-status.completed { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.task-status.error { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.task-progress {
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 11px;
}

/* Config Grid */
.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-item:last-child {
  grid-column: 1 / -1;
}

.config-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* RPC Info */
.rpc-info {
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px;
}

.rpc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.rpc-label {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.rpc-info code {
  background: rgba(124, 58, 237, 0.1);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* Not Available */
.not-available {
  text-align: center;
  padding: 60px 20px;
}

.not-available-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.not-available h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

.not-available p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 12px;
}

.install-cmd {
  display: inline-block;
  padding: 8px 20px;
  background: #0d0d1a;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 14px;
  color: var(--accent);
}
</style>