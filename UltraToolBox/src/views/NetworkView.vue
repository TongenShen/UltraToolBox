<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { executeCommand, spawnCommand, type CommandEvent } from '@/composables/useCommand'
import { checkCommandExists } from '@/composables/useCommand'
import LogPanel from '@/components/common/LogPanel.vue'

const activeTab = ref<'ping' | 'iperf3' | 'curl'>('ping')

// ====== 工具可用性 ======
const toolsAvailable = ref({
  ping: false,
  iperf3: false,
  curl: false
})

const toolsChecking = ref(true)

// ====== 日志 ======
const logLines = ref<string[]>([])
const logStatus = ref<'idle' | 'running' | 'completed' | 'error'>('idle')
let runningKill: (() => Promise<void>) | null = null

// ====== Ping ======
const pingTarget = ref('8.8.8.8')
const pingCount = ref('4')
const pinging = ref(false)

async function runPing() {
  if (!pingTarget.value.trim()) return
  pinging.value = true
  logStatus.value = 'running'
  logLines.value.push(`> Ping ${pingTarget.value} (${pingCount.value} 次)...`)

  const { kill } = await spawnCommand(
    `ping -c ${pingCount.value} "${pingTarget.value}" 2>&1`,
    (event: CommandEvent) => {
      if (event.type === 'stdout' || event.type === 'stderr') {
        logLines.value.push(event.data.trimEnd())
      }
    }
  )
  runningKill = kill
}

// ====== iPerf3 ======
const iperfMode = ref<'client' | 'server'>('client')
const iperfServer = ref('')
const iperfPort = ref('5201')
const iperfDuration = ref('10')
const iperfReverse = ref(false)
const iperfRunning = ref(false)

async function runIperf() {
  if (iperfMode.value === 'client' && !iperfServer.value.trim()) return
  iperfRunning.value = true
  logStatus.value = 'running'

  let cmd: string
  if (iperfMode.value === 'server') {
    cmd = `iperf3 -s -p ${iperfPort.value} 2>&1`
    logLines.value.push(`> 启动 iperf3 服务端 (端口 ${iperfPort.value})...`)
  } else {
    cmd = `iperf3 -c "${iperfServer.value}" -p ${iperfPort.value} -t ${iperfDuration.value}`
    if (iperfReverse.value) cmd += ' -R'
    cmd += ' 2>&1'
    logLines.value.push(`> iperf3 测速: ${iperfServer.value}:${iperfPort.value} (${iperfDuration.value}s)${iperfReverse.value ? ' [反向]' : ''}...`)
  }

  const { kill } = await spawnCommand(cmd, (event: CommandEvent) => {
    if (event.type === 'stdout' || event.type === 'stderr') {
      logLines.value.push(event.data.trimEnd())
    }
  })
  runningKill = kill
}

async function stopIperf() {
  if (runningKill) {
    // Kill the iperf3 process
    await executeCommand('pkill -f iperf3 2>/dev/null || true')
    await runningKill()
    runningKill = null
    logStatus.value = 'completed'
    logLines.value.push('⏹️ 已停止 iperf3')
  }
}

// ====== cURL ======
const curlMethod = ref('GET')
const curlUrl = ref('')
const curlHeaders = ref('')
const curlBody = ref('')
const curlTimeout = ref('30')
const curlRunning = ref(false)

const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']

async function runCurl() {
  if (!curlUrl.value.trim()) return
  curlRunning.value = true
  logStatus.value = 'running'

  let cmd = `curl -sS --max-time ${curlTimeout.value}`

  // Method
  if (curlMethod.value !== 'GET') {
    cmd += ` -X ${curlMethod.value}`
  }

  // Headers
  if (curlHeaders.value.trim()) {
    const headers = curlHeaders.value.split('\n').filter(h => h.trim())
    for (const header of headers) {
      cmd += ` -H "${header.trim()}"`
    }
  }

  // Body
  if (curlBody.value.trim()) {
    cmd += ` -d "${curlBody.value.replace(/"/g, '\\"')}"`
  }

  cmd += ` "${curlUrl.value}"`
  logLines.value.push(`> ${curlMethod.value} ${curlUrl.value}`)

  const { kill } = await spawnCommand(cmd + ' 2>&1', (event: CommandEvent) => {
    if (event.type === 'stdout' || event.type === 'stderr') {
      logLines.value.push(event.data.trimEnd())
    }
  })
  runningKill = kill
}

// ====== 通用 ======
async function stopCommand() {
  if (runningKill) {
    await runningKill()
    runningKill = null
    logStatus.value = 'completed'
    logLines.value.push('⏹️ 已停止')
  }
}

function clearLog() {
  logLines.value = []
  logStatus.value = 'idle'
}

function switchTab(tab: 'ping' | 'iperf3' | 'curl') {
  // Stop any running command when switching tabs
  if (logStatus.value === 'running' && runningKill) {
    runningKill()
    runningKill = null
  }
  activeTab.value = tab
  clearLog()
}

onMounted(async () => {
  toolsChecking.value = true
  toolsAvailable.value.ping = await checkCommandExists('ping')
  toolsAvailable.value.curl = await checkCommandExists('curl')
  toolsAvailable.value.iperf3 = await checkCommandExists('iperf3')
  toolsChecking.value = false
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-container">
      <!-- Header -->
      <div class="tool-header">
        <h2 class="tool-title">🌐 网络工具</h2>
        <p class="tool-desc">Ping · iPerf3 测速 · cURL HTTP 请求</p>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'ping' }"
          @click="switchTab('ping')"
        >
          <span class="tab-icon">📶</span>
          <span class="tab-label">Ping</span>
          <span class="tab-badge" :class="toolsAvailable.ping ? 'ok' : 'no'">
            {{ toolsAvailable.ping ? '就绪' : '不可用' }}
          </span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'iperf3' }"
          @click="switchTab('iperf3')"
        >
          <span class="tab-icon">🚀</span>
          <span class="tab-label">iPerf3</span>
          <span class="tab-badge" :class="toolsAvailable.iperf3 ? 'ok' : 'no'">
            {{ toolsAvailable.iperf3 ? '就绪' : '不可用' }}
          </span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'curl' }"
          @click="switchTab('curl')"
        >
          <span class="tab-icon">🔗</span>
          <span class="tab-label">cURL</span>
          <span class="tab-badge" :class="toolsAvailable.curl ? 'ok' : 'no'">
            {{ toolsAvailable.curl ? '就绪' : '不可用' }}
          </span>
        </button>
      </div>

      <div class="tab-content">
        <!-- ====== PING ====== -->
        <div v-show="activeTab === 'ping'" class="content-panel">
          <div class="panel-section">
            <h3>📶 网络连通性测试</h3>
            <div class="form-row">
              <input
                v-model="pingTarget"
                placeholder="目标地址 (IP 或域名)"
                class="input"
                :disabled="pinging"
              />
              <input
                v-model="pingCount"
                placeholder="次数"
                class="input"
                style="width: 70px; text-align: center"
                :disabled="pinging"
              />
              <button
                class="btn btn-primary"
                @click="runPing"
                :disabled="pinging || !pingTarget.trim() || !toolsAvailable.ping"
              >
                {{ pinging ? '⏳ Ping 中...' : '▶️ 开始 Ping' }}
              </button>
              <button
                v-if="pinging"
                class="btn btn-danger"
                @click="stopCommand"
              >⏹️ 停止</button>
            </div>
            <div class="hint" v-if="!toolsAvailable.ping">⚠️ ping 命令在当前系统不可用</div>
          </div>
        </div>

        <!-- ====== IPERF3 ====== -->
        <div v-show="activeTab === 'iperf3'" class="content-panel">
          <div class="panel-section">
            <h3>🚀 iPerf3 网络带宽测试</h3>

            <div class="mode-toggle">
              <button
                class="mode-btn"
                :class="{ active: iperfMode === 'client' }"
                @click="iperfMode = 'client'"
              >📤 客户端模式</button>
              <button
                class="mode-btn"
                :class="{ active: iperfMode === 'server' }"
                @click="iperfMode = 'server'"
              >📥 服务端模式</button>
            </div>

            <div v-if="iperfMode === 'client'" class="form-group">
              <div class="form-row">
                <input
                  v-model="iperfServer"
                  placeholder="服务器地址"
                  class="input"
                  :disabled="iperfRunning"
                />
                <input
                  v-model="iperfPort"
                  placeholder="端口"
                  class="input"
                  style="width: 80px; text-align: center"
                  :disabled="iperfRunning"
                />
              </div>
              <div class="form-row" style="margin-top: 8px">
                <input
                  v-model="iperfDuration"
                  placeholder="时长(秒)"
                  class="input"
                  style="width: 100px"
                  :disabled="iperfRunning"
                />
                <label class="checkbox-label">
                  <input type="checkbox" v-model="iperfReverse" :disabled="iperfRunning" />
                  反向模式 (-R)
                </label>
              </div>
              <div class="form-actions" style="margin-top: 8px">
                <button
                  class="btn btn-primary"
                  @click="runIperf"
                  :disabled="iperfRunning || !toolsAvailable.iperf3 || !iperfServer.trim()"
                >
                  {{ iperfRunning ? '⏳ 测速中...' : '▶️ 开始测速' }}
                </button>
                <button
                  v-if="iperfRunning"
                  class="btn btn-danger"
                  @click="stopIperf"
                >⏹️ 停止</button>
              </div>
            </div>

            <div v-else class="form-group">
              <div class="form-row">
                <input
                  v-model="iperfPort"
                  placeholder="监听端口"
                  class="input"
                  style="width: 120px"
                  :disabled="iperfRunning"
                />
              </div>
              <div class="form-actions" style="margin-top: 8px">
                <button
                  class="btn btn-primary"
                  @click="runIperf"
                  :disabled="iperfRunning || !toolsAvailable.iperf3"
                >
                  {{ iperfRunning ? '⏳ 运行中...' : '▶️ 启动服务端' }}
                </button>
                <button
                  v-if="iperfRunning"
                  class="btn btn-danger"
                  @click="stopIperf"
                >⏹️ 停止</button>
              </div>
            </div>

            <div class="hint" v-if="!toolsAvailable.iperf3">
              ⚠️ iperf3 未安装。安装方式：<code>brew install iperf3</code> (macOS) 或
              <code>sudo apt install iperf3</code> (Linux)
            </div>
          </div>
        </div>

        <!-- ====== CURL ====== -->
        <div v-show="activeTab === 'curl'" class="content-panel">
          <div class="panel-section">
            <h3>🔗 HTTP 请求工具</h3>

            <div class="form-group">
              <div class="form-row">
                <select v-model="curlMethod" class="input" style="width: 100px; flex: none" :disabled="curlRunning">
                  <option v-for="m in httpMethods" :key="m" :value="m">{{ m }}</option>
                </select>
                <input
                  v-model="curlUrl"
                  placeholder="请求 URL (https://...)"
                  class="input"
                  :disabled="curlRunning"
                />
              </div>

              <div class="form-field" style="margin-top: 8px">
                <label class="field-label">请求头 (每行一个)</label>
                <textarea
                  v-model="curlHeaders"
                  placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                  class="textarea"
                  rows="3"
                  :disabled="curlRunning"
                ></textarea>
              </div>

              <div class="form-field" style="margin-top: 8px" v-if="['POST', 'PUT', 'PATCH'].includes(curlMethod)">
                <label class="field-label">请求体</label>
                <textarea
                  v-model="curlBody"
                  placeholder='{"key": "value"}'
                  class="textarea"
                  rows="3"
                  :disabled="curlRunning"
                ></textarea>
              </div>

              <div class="form-row" style="margin-top: 8px">
                <input
                  v-model="curlTimeout"
                  placeholder="超时(秒)"
                  class="input"
                  style="width: 80px"
                  :disabled="curlRunning"
                />
                <button
                  class="btn btn-primary"
                  @click="runCurl"
                  :disabled="curlRunning || !curlUrl.trim() || !toolsAvailable.curl"
                >
                  {{ curlRunning ? '⏳ 请求中...' : '▶️ 发送请求' }}
                </button>
                <button
                  v-if="curlRunning"
                  class="btn btn-danger"
                  @click="stopCommand"
                >⏹️ 停止</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== 日志面板 ====== -->
        <div class="panel-section">
          <div class="section-header">
            <h3>📋 输出日志</h3>
            <button
              v-if="logStatus === 'running'"
              class="btn btn-sm btn-danger"
              @click="stopCommand"
            >⏹️ 停止</button>
          </div>
          <LogPanel
            :lines="logLines"
            :status="logStatus"
            :maxHeight="'400px'"
            @clear="clearLog"
          />
        </div>
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

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.tab-btn:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.tab-btn.active {
  border-color: var(--accent);
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), transparent);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
}

.tab-icon {
  font-size: 24px;
}

.tab-label {
  font-size: 14px;
  font-weight: 600;
}

.tab-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 6px;
  font-weight: 500;
}

.tab-badge.ok {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.tab-badge.no {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-panel {
  min-height: 200px;
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

select.input {
  cursor: pointer;
}

/* Textarea */
.textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: var(--bg-primary);
  color: var(--text-primary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  font-family: 'SF Mono', 'Fira Code', monospace;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.textarea:focus {
  border-color: var(--accent);
}

/* Form */
.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.form-group {
  margin-bottom: 4px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-actions {
  display: flex;
  gap: 8px;
}

/* Mode Toggle */
.mode-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 3px;
}

.mode-btn {
  flex: 1;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-btn.active {
  background: var(--accent);
  color: white;
}

.mode-btn:hover:not(.active) {
  color: var(--text-primary);
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
}

/* Hint */
.hint {
  margin-top: 8px;
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
</style>