import { Command } from '@tauri-apps/plugin-shell'

export interface CommandResult {
  code: number
  stdout: string
  stderr: string
}

export interface CommandEvent {
  type: 'stdout' | 'stderr' | 'error' | 'done'
  data: string
}

export interface SpawnedProcess {
  pid: number
  kill: () => Promise<void>
}

export type ProcessCallback = (event: CommandEvent) => void

/**
 * 获取当前平台的 shell 命令
 */
function getPlatformShell(): { cmd: string; args: string[] } {
  // In Tauri 2 shell plugin, we use 'sh -c' on Unix and 'cmd /c' on Windows
  // The shell plugin handles platform detection automatically
  return { cmd: 'sh', args: ['-c'] }
}

/**
 * 执行命令并等待结果
 */
export async function executeCommand(command: string): Promise<CommandResult> {
  try {
    const { cmd, args } = getPlatformShell()
    const fullArgs = [...args, command]
    const result = await Command.create(cmd, fullArgs).execute()
    return {
      code: result.code ?? -1,
      stdout: result.stdout?.toString() ?? '',
      stderr: result.stderr?.toString() ?? ''
    }
  } catch (error) {
    return {
      code: -1,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * 执行命令并实时获取输出流
 * 返回一个包含终止函数的对象
 */
export async function spawnCommand(
  command: string,
  callback: ProcessCallback
): Promise<{ kill: () => Promise<void> }> {
  const { cmd, args } = getPlatformShell()
  const fullArgs = [...args, command]

  const commandObj = Command.create(cmd, fullArgs)

  let killed = false

  commandObj.stdout.on('data', (data: string) => {
    if (!killed) {
      callback({ type: 'stdout', data })
    }
  })

  commandObj.stderr.on('data', (data: string) => {
    if (!killed) {
      callback({ type: 'stderr', data })
    }
  })

  commandObj.on('error', (error: string) => {
    if (!killed) {
      callback({ type: 'error', data: error })
    }
  })

  // Spawn the command
  const child = await commandObj.spawn()

  // The close event is on Command, not Child, in Tauri 2
  commandObj.on('close', () => {
    if (!killed) {
      callback({ type: 'done', data: '' })
    }
  })

  return {
    kill: async () => {
      killed = true
      try {
        await child.kill()
      } catch {
        // Process may already be dead
      }
    }
  }
}

/**
 * 执行 sidecar 二进制命令
 */
export async function executeSidecar(
  binaryName: string,
  args: string[] = []
): Promise<CommandResult> {
  try {
    // In Tauri 2, sidecar binaries are referenced by name without target triple
    const command = Command.sidecar(`binaries/${binaryName}`, args)
    const result = await command.execute()
    return {
      code: result.code ?? -1,
      stdout: result.stdout?.toString() ?? '',
      stderr: result.stderr?.toString() ?? ''
    }
  } catch (error) {
    return {
      code: -1,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * 检查命令是否存在
 */
export async function checkCommandExists(name: string): Promise<boolean> {
  const result = await executeCommand(`which ${name} 2>/dev/null || command -v ${name} 2>/dev/null`)
  return result.code === 0 && result.stdout.trim().length > 0
}