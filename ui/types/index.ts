// Core types for the application
export type FileStatus = 'pending' | 'ready' | 'processing' | 'completed' | 'error'

export type LogType = 'info' | 'success' | 'error' | 'warning'

export type ProcessingStepType = 'decode' | 'encode'

export interface ProcessingStep {
  step: ProcessingStepType
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message: string
  progress?: number
}

export interface HdrMetadata {
  maxContentBoost: number | number[]
  minContentBoost: number | number[]
  gamma: number | number[]
  offsetSdr: number | number[]
  offsetHdr: number | number[]
  hdrCapacityMin: number
  hdrCapacityMax: number
  useBaseColorSpace: number
}

export interface HdrProcessResult {
  success: boolean
  beforeImage: string // Data URL of original image (HDR)
  afterImage: string // Data URL of processed image (HDR)
  beforeImageSdr: string // Data URL of original image (SDR)
  afterImageSdr: string // Data URL of processed image (SDR)
  gainMapImage?: string // Data URL of gain map (extracted from original)
  originalSize: number
  processedSize: number
  width: number
  height: number
  metadataOriginal?: HdrMetadata
  metadataProcessed?: HdrMetadata
  error?: string
}

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
  currentStep?: ProcessingStep
  result?: HdrProcessResult
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
  callMain?: (args?: string[]) => number | void
  [key: string]: unknown
}

export interface WasmModuleConfig {
  noInitialRun?: boolean
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

declare global {

  // Global variable (not on window)

  var UltraHDRModule: ((config: WasmModuleConfig) => Promise<WasmModule>) | undefined
}
