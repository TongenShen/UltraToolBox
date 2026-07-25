import { spawnCommand, executeCommand, type ProcessCallback } from './useCommand'

export interface BenchmarkResult {
  /** Sysbench events per second (single-core) */
  sysbenchSingle: number | null
  /** Sysbench events per second (multi-core) */
  sysbenchMulti: number | null
  /** Estimated CPU-Z single-core score */
  cpuZSingle: number | null
  /** Estimated CPU-Z multi-core score */
  cpuZMulti: number | null
  /** Estimated SPEC CPU reference range */
  specRange: { min: number; max: number } | null
  /** CPU architecture (x86_64, aarch64, etc.) */
  architecture: string
  /** OS platform (linux, darwin, win32) */
  platform: string
  /** Number of logical CPU cores */
  cpuCores: number
}

export interface BenchmarkEvent {
  type: 'log' | 'phase' | 'progress' | 'error' | 'done'
  data: string
  progress?: { current: number; total: number; phase: string }
}

export type BenchmarkCallback = (event: BenchmarkEvent) => void

/**
 * 拟合系数（占位，需采集真实数据校准）
 * 线性回归模型: CPU-Z = a * sysbench_eps + b
 *
 * 基于多款主流处理器的 sysbench cpu 与 CPU-Z 跑分数据，
 * 通过最小二乘法线性回归拟合。当前系数为占位值，
 * 后续需采集更多数据校准。
 */
const X86_COEFF = {
  single: { a: 0.09, b: 50 },
  multi: { a: 0.09, b: 50 }
}

const ARM_COEFF = {
  single: { a: 0.08, b: 40 },
  multi: { a: 0.08, b: 40 }
}

/**
 * 检测系统架构、平台和 CPU 核心数
 */
async function detectSystem(): Promise<{ arch: string; platform: string; cores: number }> {
  const platformResult = await executeCommand('uname -s')
  const platform = platformResult.stdout.trim().toLowerCase()

  const archResult = await executeCommand('uname -m')
  const arch = archResult.stdout.trim().toLowerCase()

  let cores = 1
  if (platform === 'darwin') {
    const coresResult = await executeCommand('sysctl -n hw.ncpu')
    cores = parseInt(coresResult.stdout.trim()) || 1
  } else {
    const coresResult = await executeCommand('nproc')
    cores = parseInt(coresResult.stdout.trim()) || 1
  }

  return { arch, platform, cores }
}

/**
 * 检查 sysbench 是否可用，优先 sidecar 再回退系统 PATH
 */
async function checkSysbench(): Promise<{ available: boolean; method: 'sidecar' | 'system' | 'none' }> {
  try {
    const { executeSidecar } = await import('./useCommand')
    const result = await executeSidecar('sysbench', ['--version'])
    if (result.code === 0) return { available: true, method: 'sidecar' }
  } catch {
    // Sidecar not available, fall through
  }

  const result = await executeCommand('sysbench --version')
  if (result.code === 0) return { available: true, method: 'system' }

  return { available: false, method: 'none' }
}

/**
 * 从 sysbench 输出中解析 events per second
 */
export function parseSysbenchOutput(output: string): number | null {
  const match = output.match(/events per second:\s+([\d.]+)/)
  return match ? parseFloat(match[1]) : null
}

/**
 * 估算 CPU-Z 分数
 */
export function estimateCpuZ(eps: number, arch: string, isMulti: boolean): number {
  const isArm = arch.includes('aarch64') || arch.includes('arm')
  const coeff = isArm
    ? (isMulti ? ARM_COEFF.multi : ARM_COEFF.single)
    : (isMulti ? X86_COEFF.multi : X86_COEFF.single)
  return Math.round(Math.max(0, eps * coeff.a + coeff.b))
}

/**
 * 估算 SPEC CPU 参考区间
 */
export function estimateSpecRange(cpuZMulti: number): { min: number; max: number } {
  const base = Math.round(cpuZMulti / 50)
  return { min: Math.max(1, base - 2), max: base + 3 }
}

/**
 * 运行一次 sysbench 测试，返回完整输出文本
 */
function runSysbenchTest(
  command: string,
  method: 'sidecar' | 'system',
  time: number,
  callback: BenchmarkCallback
): Promise<string> {
  return new Promise((resolve) => {
    const logBuffer: string[] = []

    const handler: ProcessCallback = (event) => {
      if (event.type === 'stdout' || event.type === 'stderr') {
        logBuffer.push(event.data)
        callback({ type: 'log', data: event.data })
      } else if (event.type === 'error') {
        callback({ type: 'error', data: event.data })
      } else if (event.type === 'done') {
        resolve(logBuffer.join(''))
      }
    }

    if (method === 'sidecar') {
      import('./useCommand').then(({ spawnSidecar }) => {
        spawnSidecar('sysbench', command.split(' ').filter(Boolean), handler)
          .catch(() => resolve(logBuffer.join('')))
      }).catch(() => resolve(logBuffer.join('')))
    } else {
      spawnCommand(command, handler).catch(() => resolve(logBuffer.join('')))
    }

    // Safety timeout: test time + 60s buffer
    setTimeout(() => resolve(logBuffer.join('')), (time + 60) * 1000)
  })
}

/**
 * 运行完整的 CPU 基准测试流程
 * 热身(5s) → 单核(15s) → 多核(15s)
 */
export async function runBenchmark(
  callback: BenchmarkCallback
): Promise<BenchmarkResult | null> {
  let sysbenchSingle: number | null = null
  let sysbenchMulti: number | null = null
  let sysbenchMethod: 'sidecar' | 'system' = 'system'

  try {
    // Phase 1: 检测系统
    callback({ type: 'phase', data: '🔍 检测系统信息...' })
    const { arch, platform, cores } = await detectSystem()
    callback({ type: 'log', data: `平台: ${platform} | 架构: ${arch} | CPU 核心数: ${cores}` })

    // Phase 2: 检查 sysbench
    callback({ type: 'phase', data: '🔎 检查 sysbench...' })
    const sbCheck = await checkSysbench()
    if (!sbCheck.available) {
      callback({ type: 'error', data: '❌ 未找到 sysbench。请通过包管理器安装或放置 sidecar 二进制。' })
      callback({ type: 'done', data: 'error' })
      return null
    }
    sysbenchMethod = sbCheck.method as 'sidecar' | 'system'
    callback({ type: 'log', data: `✅ sysbench 可用 (${sbCheck.method === 'sidecar' ? '内置 sidecar' : '系统 PATH'})` })

    // Phase 3: 热身
    callback({ type: 'phase', data: '🔥 CPU 热身中 (5 秒)...' })
    callback({ type: 'progress', data: '热身中', progress: { current: 0, total: 3, phase: 'warmup' } })
    const warmupCmd = sysbenchMethod === 'sidecar'
      ? `cpu --threads=1 --cpu-max-prime=20000 --time=5 run`
      : `sysbench cpu --threads=1 --cpu-max-prime=20000 --time=5 run`
    await runSysbenchTest(warmupCmd, sysbenchMethod, 5, callback)
    callback({ type: 'log', data: '✅ 热身完成' })

    // Phase 4: 单核测试
    callback({ type: 'phase', data: '🧪 单核测试 (15 秒)...' })
    callback({ type: 'progress', data: '单核测试', progress: { current: 1, total: 3, phase: 'single' } })
    const singleCmd = sysbenchMethod === 'sidecar'
      ? `cpu --threads=1 --cpu-max-prime=20000 --time=15 run`
      : `sysbench cpu --threads=1 --cpu-max-prime=20000 --time=15 run`
    const singleOutput = await runSysbenchTest(singleCmd, sysbenchMethod, 15, callback)
    sysbenchSingle = parseSysbenchOutput(singleOutput)
    callback({ type: 'log', data: `✅ 单核: ${sysbenchSingle?.toFixed(2) ?? 'N/A'} events/sec` })

    // Phase 5: 多核测试
    callback({ type: 'phase', data: `🧪 多核测试 (${cores} 线程, 15 秒)...` })
    callback({ type: 'progress', data: '多核测试', progress: { current: 2, total: 3, phase: 'multi' } })
    const multiCmd = sysbenchMethod === 'sidecar'
      ? `cpu --threads=${cores} --cpu-max-prime=20000 --time=15 run`
      : `sysbench cpu --threads=${cores} --cpu-max-prime=20000 --time=15 run`
    const multiOutput = await runSysbenchTest(multiCmd, sysbenchMethod, 15, callback)
    sysbenchMulti = parseSysbenchOutput(multiOutput)
    callback({ type: 'log', data: `✅ 多核: ${sysbenchMulti?.toFixed(2) ?? 'N/A'} events/sec` })

    // Phase 6: 计算结果
    callback({ type: 'phase', data: '📊 计算结果中...' })
    callback({ type: 'progress', data: '完成', progress: { current: 3, total: 3, phase: 'done' } })

    const cpuZSingle = sysbenchSingle !== null ? estimateCpuZ(sysbenchSingle, arch, false) : null
    const cpuZMulti = sysbenchMulti !== null ? estimateCpuZ(sysbenchMulti, arch, true) : null
    const specRange = cpuZMulti !== null ? estimateSpecRange(cpuZMulti) : null

    const result: BenchmarkResult = {
      sysbenchSingle, sysbenchMulti,
      cpuZSingle, cpuZMulti, specRange,
      architecture: arch, platform, cpuCores: cores
    }

    callback({ type: 'log', data: '✅ 基准测试全部完成！' })
    callback({ type: 'done', data: 'completed' })
    return result
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    callback({ type: 'error', data: `❌ 测试出错: ${msg}` })
    callback({ type: 'done', data: 'error' })
    return null
  }
}

/**
 * 获取 CPU 架构的中文描述
 */
export function getArchLabel(arch: string): string {
  if (arch.includes('x86_64') || arch.includes('amd64')) return 'x86 (Intel/AMD)'
  if (arch.includes('aarch64') || arch.includes('arm64')) return 'ARM (Apple Silicon)'
  return arch
}