import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { spawnCommand, type ProcessCallback } from '@/composables/useCommand'

export interface RunningProcess {
  id: string
  name: string
  command: string
  status: 'running' | 'completed' | 'error' | 'killed'
  startTime: number
  endTime?: number
  exitCode?: number
  stdout: string[]
  stderr: string[]
}

export const useProcessStore = defineStore('process', () => {
  const processes = ref<Map<string, RunningProcess>>(new Map())
  const maxLogLines = ref(1000)

  // 计算属性
  const runningProcesses = computed(() => {
    return Array.from(processes.value.values()).filter(p => p.status === 'running')
  })

  const completedProcesses = computed(() => {
    return Array.from(processes.value.values()).filter(p => p.status !== 'running')
  })

  const allProcesses = computed(() => {
    return Array.from(processes.value.values())
  })

  /**
   * 启动一个新命令进程
   * @returns 进程ID，可用于后续终止
   */
  async function startProcess(
    name: string,
    command: string,
    onData?: (line: string) => void
  ): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const process: RunningProcess = {
      id,
      name,
      command,
      status: 'running',
      startTime: Date.now(),
      stdout: [],
      stderr: []
    }

    processes.value.set(id, process)

    const callback: ProcessCallback = (event) => {
      const p = processes.value.get(id)
      if (!p) return

      switch (event.type) {
        case 'stdout': {
          const lines = event.data.split('\n').filter(l => l)
          p.stdout.push(...lines)
          while (p.stdout.length > maxLogLines.value) {
            p.stdout.shift()
          }
          lines.forEach(line => onData?.(line))
          break
        }
        case 'stderr': {
          const lines = event.data.split('\n').filter(l => l)
          p.stderr.push(...lines)
          while (p.stderr.length > maxLogLines.value) {
            p.stderr.shift()
          }
          lines.forEach(line => onData?.(line))
          break
        }
        case 'error': {
          p.status = 'error'
          p.endTime = Date.now()
          onData?.(`[错误] ${event.data}`)
          break
        }
        case 'done': {
          p.status = 'completed'
          p.endTime = Date.now()
          break
        }
      }
    }

    try {
      const { kill } = await spawnCommand(command, callback)

      // 存储 kill 函数到进程对象
      ;(process as any)._kill = kill

      return id
    } catch (error) {
      const p = processes.value.get(id)
      if (p) {
        p.status = 'error'
        p.endTime = Date.now()
        p.stderr.push(error instanceof Error ? error.message : String(error))
      }
      return id
    }
  }

  /**
   * 终止运行中的进程
   */
  async function killProcess(id: string): Promise<void> {
    const process = processes.value.get(id)
    if (!process || process.status !== 'running') return

    const killFn = (process as any)._kill
    if (killFn) {
      try {
        await killFn()
      } catch {
        // ignore
      }
    }

    process.status = 'killed'
    process.endTime = Date.now()
  }

  /**
   * 清除所有已完成的进程
   */
  function clearCompleted(): void {
    for (const [id, p] of processes.value) {
      if (p.status !== 'running') {
        processes.value.delete(id)
      }
    }
  }

  /**
   * 清除所有进程
   */
  function clearAll(): void {
    // 先终止所有运行中的进程
    for (const [id, p] of processes.value) {
      if (p.status === 'running') {
        killProcess(id)
      }
    }
    processes.value.clear()
  }

  /**
   * 获取进程输出文本
   */
  function getOutput(id: string): string {
    const p = processes.value.get(id)
    if (!p) return ''
    return [...p.stdout, ...p.stderr].join('\n')
  }

  /**
   * 获取进程状态文本
   */
  function getStatusText(id: string): string {
    const p = processes.value.get(id)
    if (!p) return '未知'

    switch (p.status) {
      case 'running':
        return `● 运行中 (${Math.floor((Date.now() - p.startTime) / 1000)}s)`
      case 'completed':
        return `● 已完成 (${p.endTime ? Math.floor((p.endTime - p.startTime) / 1000) : '?'}s)`
      case 'error':
        return '● 错误'
      case 'killed':
        return '● 已终止'
      default:
        return '● 空闲'
    }
  }

  return {
    processes,
    runningProcesses,
    completedProcesses,
    allProcesses,
    maxLogLines,
    startProcess,
    killProcess,
    clearCompleted,
    clearAll,
    getOutput,
    getStatusText
  }
})