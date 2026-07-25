<script setup lang="ts">
import { ref } from 'vue'
import LogPanel from '@/components/common/LogPanel.vue'
import { runBenchmark, getArchLabel, type BenchmarkResult, type BenchmarkEvent } from '@/composables/useBenchmark'

const status = ref<'idle' | 'running' | 'completed' | 'error'>('idle')
const logLines = ref<string[]>([])
const progress = ref<string>('')
const result = ref<BenchmarkResult | null>(null)
const currentPhase = ref<string>('')

function addLog(data: string) {
  const timestamp = new Date().toLocaleTimeString()
  logLines.value.push(`[${timestamp}] ${data}`)
  if (logLines.value.length > 1000) {
    logLines.value = logLines.value.slice(-500)
  }
}

async function startBenchmark() {
  status.value = 'running'
  result.value = null
  logLines.value = []
  progress.value = ''
  currentPhase.value = ''

  const benchmarkResult = await runBenchmark((event: BenchmarkEvent) => {
    switch (event.type) {
      case 'log':
        addLog(event.data)
        break
      case 'phase':
        currentPhase.value = event.data
        addLog(event.data)
        break
      case 'progress':
        if (event.progress) {
          const pct = Math.round((event.progress.current / event.progress.total) * 100)
          progress.value = `${event.progress.phase} (${pct}%)`
        }
        break
      case 'error':
        addLog(`❌ ${event.data}`)
        break
      case 'done':
        status.value = event.data === 'completed' ? 'completed' : 'error'
        progress.value = ''
        break
    }
  })

  if (benchmarkResult) {
    result.value = benchmarkResult
  }
}

function clearLogs() {
  logLines.value = []
  result.value = null
  status.value = 'idle'
  progress.value = ''
  currentPhase.value = ''
}

function formatScore(val: number | null): string {
  if (val === null) return '---'
  return val.toLocaleString()
}
</script>

<template>
  <div class="benchmark-view">
    <div class="view-header">
      <h1 class="view-title">🖥️ CPU 基准测试</h1>
      <p class="view-desc">基于 sysbench 的 CPU 性能基准测试，支持单核与多核跑分</p>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button
        class="btn btn-primary"
        :disabled="status === 'running'"
        @click="startBenchmark"
      >
        🚀 开始跑分
      </button>
      <button
        class="btn"
        @click="clearLogs"
      >
        🗑️ 清空
      </button>
    </div>

    <!-- Status & Progress -->
    <div class="status-bar" v-if="status === 'running'">
      <span class="status-dot running"></span>
      <span class="status-text">{{ currentPhase || '初始化中...' }}</span>
      <span class="progress-text" v-if="progress">{{ progress }}</span>
    </div>

    <!-- Log Panel -->
    <LogPanel
      :lines="logLines"
      :status="status"
    />

    <!-- Results -->
    <div class="results-section" v-if="result">
      <h2 class="results-title">📊 测试结果</h2>

      <!-- Native Scores -->
      <div class="result-card native">
        <h3 class="result-card-title">【原生实测分数】</h3>
        <div class="result-row">
          <span class="result-label">Sysbench 单核：</span>
          <span class="result-value highlight">{{ formatScore(result.sysbenchSingle) }}</span>
          <span class="result-unit">events/sec</span>
        </div>
        <div class="result-row">
          <span class="result-label">Sysbench 多核：</span>
          <span class="result-value highlight">{{ formatScore(result.sysbenchMulti) }}</span>
          <span class="result-unit">events/sec</span>
        </div>
        <div class="result-note">
          <p>📌 系统信息：{{ getArchLabel(result.architecture) }} · {{ result.cpuCores }} 核 · {{ result.platform }}</p>
          <p>✅ 说明：本次程序直接测出，无估算</p>
        </div>
      </div>

      <!-- Estimated Scores -->
      <div class="result-card estimated">
        <h3 class="result-card-title">【参考估算分数】</h3>
        <div class="result-row">
          <span class="result-label">估算 CPU-Z 单核：</span>
          <span class="result-value">{{ result.cpuZSingle !== null ? result.cpuZSingle : '---' }}</span>
        </div>
        <div class="result-row">
          <span class="result-label">估算 CPU-Z 多核：</span>
          <span class="result-value">{{ result.cpuZMulti !== null ? result.cpuZMulti : '---' }}</span>
        </div>
        <div class="result-row">
          <span class="result-label">估算 SPEC 参考区间：</span>
          <span class="result-value" v-if="result.specRange">
            {{ result.specRange.min }} - {{ result.specRange.max }}
          </span>
          <span class="result-value" v-else>---</span>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
          <p>⚠️ 估算值仅作横向参考，不同基准负载不同，结果存在明显误差，不具备严谨等效性。</p>
          <p class="disclaimer-detail">
            本数值由 sysbench 跑分通过拟合公式推算得出。Sysbench、CPU-Z、SPEC 使用完全不同的运算负载，
            无法精准等价换算；跨 Intel/AMD/ARM 架构时误差会进一步扩大，仅适合粗略参考，不可作为严谨性能判定依据。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.benchmark-view {
  max-width: 900px;
  margin: 0 auto;
}

.view-header {
  margin-bottom: 20px;
}

.view-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 4px;
}

.view-desc {
  color: var(--text-secondary);
  font-size: 14px;
}

.controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
  white-space: nowrap;
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
  color: #fff;
  border-color: var(--accent);
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.running {
  background: #22c55e;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-text {
  color: var(--text-primary);
  font-weight: 500;
}

.progress-text {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 12px;
}

/* Results */
.results-section {
  margin-top: 20px;
}

.results-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}

.result-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 12px;
}

.result-card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.result-card.native {
  border-left: 3px solid #22c55e;
}

.result-card.estimated {
  border-left: 3px solid #f59e0b;
}

.result-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;
}

.result-label {
  color: var(--text-secondary);
  min-width: 160px;
}

.result-value {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
}

.result-value.highlight {
  color: var(--accent);
  font-size: 18px;
}

.result-unit {
  color: var(--text-secondary);
  font-size: 12px;
}

.result-note {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.result-note p {
  margin: 0;
}

.disclaimer {
  margin-top: 12px;
  padding: 12px 14px;
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
}

.disclaimer p {
  margin: 0 0 6px 0;
  color: #b45309;
  font-weight: 500;
}

.disclaimer .disclaimer-detail {
  font-weight: 400;
  color: #92400e;
  font-size: 11px;
  margin-bottom: 0;
}

:global(.dark) .disclaimer p {
  color: #fbbf24;
}

:global(.dark) .disclaimer .disclaimer-detail {
  color: #f59e0b;
}
</style>