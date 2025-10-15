// Core types for the application
export type FileStatus = 'pending' | 'ready' | 'processing' | 'completed' | 'error'

export type LogType = 'info' | 'success' | 'error' | 'warning'

export interface ProcessingFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  data: Uint8Array | null
  status: FileStatus
  error: string | null
  progress?: number
}

export interface LogEntry {
  id: string
  timestamp: Date
  type: LogType
  message: string
}

export interface WasmModule {
  FS: {
    writeFile: (path: string, data: Uint8Array) => void
    readFile: (path: string) => Uint8Array
    unlink: (path: string) => void
    mkdir: (path: string) => void
    readdir: (path: string) => string[]
    stat: (path: string) => { size: number, mode: number }
  }
  HEAP8?: Int8Array
  _main?: () => void
  callMain?: () => void
  [key: string]: unknown
}

export interface WasmModuleConfig {
  print?: (text: string) => void
  printErr?: (text: string) => void
  onRuntimeInitialized?: () => void
  onAbort?: (error: unknown) => void
  monitorRunDependencies?: (left: number) => void
  setStatus?: (text: string) => void
  locateFile?: (path: string, prefix: string) => string
}

export interface StatusConfig {
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  icon: string
  label: string
}

// UltraHDRModule is defined globally by the WASM script, not on window
declare const UltraHDRModule: ((config: WasmModuleConfig) => Promise<WasmModule>) | undefined

declare global {
  interface Window {
    UltraHDRModule?: (config: WasmModuleConfig) => Promise<WasmModule>
  }

  // Global variable (not on window)
  const UltraHDRModule: ((config: WasmModuleConfig) => Promise<WasmModule>) | undefined
}
