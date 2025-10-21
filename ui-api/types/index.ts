/**
 * Type definitions for Instagram HDR Converter
 */

// File processing status
export type FileStatus = 'pending' | 'ready' | 'processing' | 'completed' | 'error'

// Log levels
export type LogLevel = 'info' | 'success' | 'warning' | 'error'

// Processing file object
export interface ProcessingFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  data: Uint8Array | null
  status: FileStatus
  error: string | null
  progress: number
  result?: ProcessResult
  dimensions?: {
    width: number
    height: number
  }
  sizeWarning?: boolean
  hdrInfo?: HdrValidationInfo
  createdAt?: number // Timestamp for analytics tracking
}

// HDR validation info
export interface HdrValidationInfo {
  isHDR: boolean
  fileType: 'jpeg' | 'avif'
  bitDepth?: number
  colorSpace?: string
  details?: string
}

// API conversion response
export interface ConversionResult {
  success: boolean
  outputJpg?: string // Base64 encoded JPG
  sdrImage?: string // Base64 encoded SDR
  gainMap?: string // Base64 encoded gain map
  metadata?: HdrMetadata
  error?: string
  logs?: string[]
}

// Processing result for UI display
export interface ProcessResult {
  success: boolean
  originalImage: string // Blob URL for original AVIF
  finalJpg: string // Blob URL for final JPG
  sdrImage: string // Blob URL for SDR extraction
  gainMapImage: string // Blob URL for gain map
  originalSize: number
  processedSize: number
  metadata?: HdrMetadata
  error?: string
}

// HDR metadata structure
export interface HdrMetadata {
  maxContentBoost: number
  minContentBoost: number
  gamma: number
  offsetSdr: number
  offsetHdr: number
  hdrCapacityMin: number
  hdrCapacityMax: number
  useBaseColorSpace: number
}

// Log entry
export interface LogEntry {
  id: string
  timestamp: Date
  message: string
  level: LogLevel
}

// Note: UiState interface removed - state is now defined directly in the store

// Google Analytics TypeScript declarations
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'set' | 'get',
      action: string,
      parameters?: {
        [key: string]: any;
      }
    ) => void;
  }
}

