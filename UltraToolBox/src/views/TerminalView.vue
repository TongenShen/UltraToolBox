<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { executeCommand } from '@/composables/useCommand'

interface PlatformInfo {
  os: string
  shell: string
  defaultTerminal: string
  icon: string
}

const platformInfo = ref<PlatformInfo>({
  os: '检测中...',
  shell: '检测中...',
  defaultTerminal: '检测中...',
  icon: '💻'
})

const terminalOutput = ref<string[]>([])
const terminalStatus = ref<'idle' | 'running' | 'completed' | 'error'>('idle')

async function detectPlatform() {
  // Detect OS
  const platform = navigator.platform.toLowerCase()
  const userAgent = navigator.userAgent.toLowerCase()

  if (platform.includes('mac') || userAgent.includes('mac')) {
    platformInfo.value = {
      os: 'macOS',
      shell: 'zsh (默认) / bash',
      defaultTerminal: 'Terminal.app',
      icon: '🍎'
    }
  } else if (platform.includes('win') || userAgent.includes('windows')) {
    platformInfo.value = {
      os: 'Windows',
      shell: 'PowerShell / CMD',
      defaultTerminal: 'Windows Terminal',
      icon: '🪟'
    }
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    platformInfo.value = {
      os: 'Linux',
      shell: 'bash (默认) / zsh',
      defaultTerminal: 'GNOME Terminal',
      icon: '🐧'
    }
  }
}

async function openTerminal(terminalName: string, command: string) {
  terminalStatus.value = 'running'
  terminalOutput.value.push(`> 正在打开 ${terminalName}...`)

  const result = await executeCommand(command)

  if (result.code === 0) {
    terminalOutput.value.push(`✅ ${terminalName} 已启动`)
    terminalStatus.value = 'completed'
  } else {
    terminalOutput.value.push(`❌ 启动失败: ${result.stderr || result.stdout}`)
    terminalStatus.value = 'error'
  }
}

function openDefaultTerminal() {
  const { os } = platformInfo.value

  if (os === 'macOS') {
    openTerminal('Terminal.app', 'open -a Terminal')
  } else if (os === 'Windows') {
    openTerminal('CMD', 'start cmd')
  } else if (os === 'Linux') {
    openTerminal('GNOME Terminal', 'x-terminal-emulator 2>/dev/null || gnome-terminal 2>/dev/null || xterm')
  }
}

function openITerm2() {
  openTerminal('iTerm2', 'open -a iTerm2 2>/dev/null || echo "iTerm2 not installed"')
}

function openPowerShell() {
  openTerminal('PowerShell', 'start powershell')
}

function openBash() {
  openTerminal('Bash', 'open -a Terminal')
}

function clearOutput() {
  terminalOutput.value = []
  terminalStatus.value = 'idle'
}

onMounted(() => {
  detectPlatform()
})
</script>

<template>
  <div class="tool-page">
    <div class="tool-container">
      <!-- Header -->
      <div class="tool-header">
        <h2 class="tool-title">💻 终端快捷入口</h2>
        <p class="tool-desc">一键打开系统终端，无需离开应用</p>
      </div>

      <!-- Platform Info Card -->
      <div class="platform-card">
        <div class="platform-icon">{{ platformInfo.icon }}</div>
        <div class="platform-details">
          <div class="platform-row">
            <span class="label">操作系统</span>
            <span class="value">{{ platformInfo.os }}</span>
          </div>
          <div class="platform-row">
            <span class="label">默认 Shell</span>
            <span class="value">{{ platformInfo.shell }}</span>
          </div>
          <div class="platform-row">
            <span class="label">默认终端</span>
            <span class="value">{{ platformInfo.defaultTerminal }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Launch Buttons -->
      <div class="section">
        <h3 class="section-title">🚀 快速启动</h3>
        <div class="button-grid">
          <button class="action-btn primary" @click="openDefaultTerminal">
            <span class="btn-icon">🖥️</span>
            <span class="btn-label">默认终端</span>
            <span class="btn-desc">{{ platformInfo.defaultTerminal }}</span>
          </button>

          <button
            v-if="platformInfo.os === 'macOS'"
            class="action-btn"
            @click="openITerm2"
          >
            <span class="btn-icon">⬛</span>
            <span class="btn-label">iTerm2</span>
            <span class="btn-desc">如已安装</span>
          </button>

          <button
            v-if="platformInfo.os === 'Windows'"
            class="action-btn"
            @click="openPowerShell"
          >
            <span class="btn-icon">⚡</span>
            <span class="btn-label">PowerShell</span>
            <span class="btn-desc">Windows 现代终端</span>
          </button>
        </div>
      </div>

      <!-- Output Log -->
      <div class="section">
        <h3 class="section-title">📋 操作日志</h3>
        <div class="log-box">
          <div v-if="terminalOutput.length === 0" class="log-empty">
            点击上方的按钮打开终端，操作日志将在此显示
          </div>
          <div
            v-for="(line, index) in terminalOutput"
            :key="index"
            class="log-line"
            :class="{
              'log-success': line.startsWith('✅'),
              'log-error': line.startsWith('❌'),
              'log-info': line.startsWith('>')
            }"
          >
            {{ line }}
          </div>
        </div>
        <div class="log-actions" v-if="terminalOutput.length > 0">
          <span class="status-badge" :class="terminalStatus">
            {{ terminalStatus === 'idle' ? '空闲' : terminalStatus === 'running' ? '运行中' : terminalStatus === 'completed' ? '已完成' : '错误' }}
          </span>
          <button class="text-btn" @click="clearOutput">清空日志</button>
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
  max-width: 700px;
  margin: 0 auto;
}

.tool-header {
  margin-bottom: 24px;
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

/* Platform Info Card */
.platform-card {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.platform-icon {
  font-size: 40px;
  flex-shrink: 0;
}

.platform-details {
  flex: 1;
  min-width: 0;
}

.platform-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}

.platform-row:not(:last-child) {
  border-bottom: 1px solid var(--border);
}

.platform-row .label {
  color: var(--text-secondary);
}

.platform-row .value {
  color: var(--text-primary);
  font-weight: 500;
}

/* Sections */
.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

/* Button Grid */
.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 20px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-primary);
}

.action-btn:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15);
}

.action-btn.primary {
  border-color: var(--accent);
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), transparent);
}

.btn-icon {
  font-size: 28px;
}

.btn-label {
  font-size: 14px;
  font-weight: 600;
}

.btn-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

/* Log Box */
.log-box {
  background: #0d0d1a;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  min-height: 80px;
  max-height: 200px;
  overflow-y: auto;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.log-empty {
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
  font-size: 13px;
}

.log-line {
  padding: 1px 0;
  color: #d4d4d4;
  word-break: break-all;
}

.log-line.log-success {
  color: #22c55e;
}

.log-line.log-error {
  color: #ef4444;
}

.log-line.log-info {
  color: #888899;
}

.log-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.status-badge {
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.status-badge.idle {
  background: rgba(136, 136, 153, 0.15);
  color: var(--text-secondary);
}

.status-badge.running {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-badge.completed {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.text-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
}

.text-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

/* Scrollbar */
.log-box::-webkit-scrollbar {
  width: 4px;
}

.log-box::-webkit-scrollbar-track {
  background: transparent;
}

.log-box::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}
</style>