<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'

const props = defineProps<{
  lines: string[]
  status?: 'idle' | 'running' | 'completed' | 'error' | 'killed'
  maxHeight?: string
  showLineNumbers?: boolean
  showTimestamp?: boolean
}>()

const emit = defineEmits<{
  clear: []
}>()

const logContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)

const statusColors: Record<string, string> = {
  idle: 'var(--text-secondary)',
  running: '#22c55e',
  completed: '#3b82f6',
  error: '#ef4444',
  killed: '#f59e0b'
}

const statusLabels: Record<string, string> = {
  idle: '空闲',
  running: '运行中',
  completed: '已完成',
  error: '错误',
  killed: '已终止'
}

const displayLines = computed(() => {
  const maxLines = 500
  if (props.lines.length > maxLines) {
    return props.lines.slice(-maxLines)
  }
  return props.lines
})

// 自动滚动到底部
watch(
  () => props.lines.length,
  async () => {
    if (autoScroll.value) {
      await nextTick()
      scrollToBottom()
    }
  }
)

function scrollToBottom() {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

function handleScroll() {
  if (!logContainer.value) return
  const el = logContainer.value
  // 如果用户滚到了底部，开启自动滚动
  autoScroll.value = el.scrollHeight - el.scrollTop - el.clientHeight < 50
}

function copyContent() {
  const text = props.lines.join('\n')
  navigator.clipboard.writeText(text).catch(() => {
    // Fallback for environments without clipboard API
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  })
}

function formatTimestamp(): string {
  const now = new Date()
  return now.toLocaleTimeString('zh-CN', { hour12: false })
}
</script>

<template>
  <div class="log-panel" :style="{ maxHeight: maxHeight }">
    <div class="log-header">
      <div class="log-status">
        <span
          class="status-dot"
          :style="{ backgroundColor: statusColors[props.status || 'idle'] }"
        ></span>
        <span class="status-text">
          {{ statusLabels[props.status || 'idle'] }}
        </span>
        <span class="line-count" v-if="lines.length > 0">
          ({{ lines.length }} 行)
        </span>
      </div>
      <div class="log-actions">
        <label class="auto-scroll-label">
          <input type="checkbox" v-model="autoScroll" />
          自动滚动
        </label>
        <button class="log-btn" @click="copyContent" title="复制输出">
          📋
        </button>
        <button class="log-btn" @click="scrollToBottom" title="滚动到底部">
          ⬇️
        </button>
        <button class="log-btn" @click="$emit('clear')" title="清空">
          🗑️
        </button>
      </div>
    </div>
    <div
      class="log-content"
      ref="logContainer"
      @scroll="handleScroll"
    >
      <div v-if="lines.length === 0" class="log-empty">
        暂无输出，运行命令后将在此显示
      </div>
      <div
        v-for="(line, index) in displayLines"
        :key="index"
        class="log-line"
        :class="{
          'log-error': line.startsWith('[错误]'),
          'log-warn': line.startsWith('[警告]'),
          'log-info': line.startsWith('[信息]')
        }"
      >
        <span class="line-num" v-if="showLineNumbers">{{ index + 1 }}</span>
        <span class="line-time" v-if="showTimestamp">[{{ formatTimestamp() }}]</span>
        <span class="line-text">{{ line }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #0d0d1a;
  overflow: hidden;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.log-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  color: var(--text-primary);
  font-weight: 500;
}

.line-count {
  color: var(--text-secondary);
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.auto-scroll-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.auto-scroll-label:hover {
  background: var(--bg-card);
}

.log-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.15s ease;
}

.log-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  min-height: 100px;
  max-height: 400px;
}

.log-empty {
  color: var(--text-secondary);
  text-align: center;
  padding: 40px 16px;
  font-size: 13px;
}

.log-line {
  display: flex;
  padding: 1px 12px;
  line-height: 1.6;
  color: #d4d4d4;
  word-break: break-all;
}

.log-line:hover {
  background: rgba(255, 255, 255, 0.03);
}

.log-line.log-error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

.log-line.log-warn {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
}

.log-line.log-info {
  color: #3b82f6;
}

.line-num {
  color: var(--text-secondary);
  min-width: 32px;
  text-align: right;
  padding-right: 12px;
  user-select: none;
  opacity: 0.5;
}

.line-time {
  color: var(--text-secondary);
  padding-right: 8px;
  opacity: 0.6;
  font-size: 12px;
  white-space: nowrap;
}

.line-text {
  flex: 1;
  white-space: pre-wrap;
}

/* Custom scrollbar */
.log-content::-webkit-scrollbar {
  width: 4px;
}

.log-content::-webkit-scrollbar-track {
  background: transparent;
}

.log-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}
</style>