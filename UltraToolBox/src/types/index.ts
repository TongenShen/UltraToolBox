export interface ToolResult {
  code: number
  stdout: string
  stderr: string
}

export interface ToolConfig {
  name: string
  displayName: string
  binary: string
  description: string
}

export interface CommandTemplate {
  id: string
  name: string
  command: string
  description?: string
}