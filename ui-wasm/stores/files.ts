/**
 * Files Store
 * Manages file processing state and operations
 */

import type { ProcessingFile, ProcessingStep } from '~/types'
import { defineStore } from 'pinia'
import { downloadAllImages } from '~/utils/download'

export const useFilesStore = defineStore('files', () => {
  // State
  const files = ref<ProcessingFile[]>([])
  const isProcessing = ref(false)

  // Getters
  /**
   * Count files by status
   */
  const pendingFilesCount = computed(() => files.value.filter(f => f.status === 'pending').length)
  const readyFilesCount = computed(() => files.value.filter(f => f.status === 'ready').length)
  const processingFilesCount = computed(() => files.value.filter(f => f.status === 'processing').length)
  const completedFilesCount = computed(() => files.value.filter(f => f.status === 'completed').length)
  const errorFilesCount = computed(() => files.value.filter(f => f.status === 'error').length)

  /**
   * Get completed files with results
   */
  const completedFilesWithResults = computed(() => files.value.filter(f => f.status === 'completed' && f.result))

  /**
   * File statistics
   */
  const fileStats = computed(() => ({
    total: files.value.length,
    ready: readyFilesCount.value,
    completed: completedFilesCount.value,
    errors: errorFilesCount.value,
  }))

  /**
   * Check if ready to process
   */
  const canProcess = computed(() => {
    const wasmStore = useWasmStore()
    return !!(files.value.length > 0 && wasmStore.wasmReady && !isProcessing.value)
  })

  // Actions
  /**
   * Generate a unique file ID
   */
  function generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Format file size
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0)
      return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const size = (bytes / k ** i).toFixed(2)

    return `${size} ${sizes[i]}`
  }

  /**
   * Read file data as ArrayBuffer
   */
  async function readFileData(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(e.target.result))
        }
        else {
          reject(new Error('Failed to read file as ArrayBuffer'))
        }
      }

      reader.onerror = () => {
        reject(new Error('FileReader error'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Add files to the processing queue
   */
  function addFiles(fileList: FileList | File[]): void {
    const logsStore = useLogsStore()
    const fileArray = Array.from(fileList)
    logsStore.add(`Adding ${fileArray.length} file(s) to list...`, 'info')

    fileArray.forEach((file) => {
      const fileId = generateFileId()
      const fileObj: ProcessingFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        data: null,
        status: 'pending',
        error: null,
        progress: 0,
      }

      files.value.push(fileObj)

      // Load file data asynchronously
      readFileData(file).then((data) => {
        const fileToUpdate = files.value.find(f => f.id === fileId)
        if (fileToUpdate) {
          fileToUpdate.data = data
          fileToUpdate.status = 'ready'
          logsStore.add(`  ✓ Loaded ${fileObj.name}: ${formatFileSize(data.length)}`, 'success')
        }
      }).catch(() => {
        const fileToUpdate = files.value.find(f => f.id === fileId)
        if (fileToUpdate) {
          fileToUpdate.status = 'error'
          fileToUpdate.error = 'Failed to read file'
          logsStore.add(`  ✗ Failed to load ${fileObj.name}`, 'error')
        }
      })
    })

    logsStore.add(`Total files being added: ${fileArray.length}`, 'info')
  }

  /**
   * Remove a file from the queue
   */
  function removeFile(fileId: string): void {
    const logsStore = useLogsStore()
    const index = files.value.findIndex(f => f.id === fileId)

    if (index !== -1) {
      const fileObj = files.value[index]
      if (fileObj) {
        logsStore.add(`Removing file: ${fileObj.name}`, 'info')
        files.value.splice(index, 1)
      }
    }
  }

  /**
   * Clear all files from the queue
   */
  function clearFiles(): void {
    const logsStore = useLogsStore()
    logsStore.add('Clearing all files...', 'info')
    files.value = []
  }

  /**
   * Process a single file with HDR conversion
   */
  async function processSingleFile(fileObj: ProcessingFile, index: number, total: number): Promise<void> {
    const wasmStore = useWasmStore()
    const logsStore = useLogsStore()

    if (!fileObj.data) {
      throw new Error('File not loaded')
    }

    if (!wasmStore.wasmModule) {
      throw new Error('WASM module not ready')
    }

    logsStore.add(`[${index + 1}/${total}] 📸 Processing: ${fileObj.name}`, 'info')
    fileObj.status = 'processing'
    fileObj.progress = 0

    const { processHdrImage } = useHdrProcessor()

    try {
      // Process with HDR conversion
      const result = await processHdrImage(
        wasmStore.wasmModule,
        fileObj.file,
        fileObj.data,
        (step: ProcessingStep) => {
          fileObj.currentStep = step
          fileObj.progress = step.progress || 0
        },
      )

      if (result.success) {
        fileObj.status = 'completed'
        fileObj.progress = 100
        fileObj.result = result
        fileObj.currentStep = undefined
        logsStore.add(`[${index + 1}/${total}] ✅ Completed: ${fileObj.name}`, 'success')
      }
      else {
        throw new Error(result.error || 'Processing failed')
      }
    }
    catch (error) {
      fileObj.currentStep = undefined
      throw error
    }
  }

  /**
   * Process all files in the queue
   */
  async function processAllFiles(): Promise<{ successCount: number, errorCount: number }> {
    const wasmStore = useWasmStore()
    const logsStore = useLogsStore()

    if (files.value.length === 0) {
      logsStore.add('No files selected', 'error')
      return { successCount: 0, errorCount: 0 }
    }

    if (!wasmStore.wasmModule?.FS) {
      logsStore.add('WASM filesystem not available', 'error')
      return { successCount: 0, errorCount: 0 }
    }

    logsStore.add('=== Starting Batch Processing ===', 'info')
    logsStore.add(`Processing ${files.value.length} file(s)...`, 'info')

    isProcessing.value = true
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.value.length; i++) {
      const fileObj = files.value[i]

      if (!fileObj) {
        continue
      }

      if (!fileObj.data) {
        logsStore.add(`Skipping ${fileObj.name}: not loaded`, 'error')
        fileObj.status = 'error'
        fileObj.error = 'File not loaded'
        errorCount++
        continue
      }

      try {
        await processSingleFile(fileObj, i, files.value.length)
        successCount++
      }
      catch (error) {
        const err = error as Error
        logsStore.add(`  ✗ Error processing ${fileObj.name}: ${err.message}`, 'error')
        fileObj.status = 'error'
        fileObj.error = err.message
        errorCount++
      }
    }

    logsStore.add('=== Batch Processing Complete ===', 'success')
    logsStore.add(`✓ Success: ${successCount} file(s)`, 'success')

    if (errorCount > 0) {
      logsStore.add(`✗ Errors: ${errorCount} file(s)`, 'error')
    }

    isProcessing.value = false

    return {
      successCount,
      errorCount,
    }
  }

  /**
   * Download all processed images as ZIP
   */
  async function downloadAll(): Promise<void> {
    await downloadAllImages(files.value)
  }

  return {
    // State
    files,
    isProcessing,
    // Getters
    pendingFilesCount,
    readyFilesCount,
    processingFilesCount,
    completedFilesCount,
    errorFilesCount,
    completedFilesWithResults,
    fileStats,
    canProcess,
    // Actions
    addFiles,
    removeFile,
    clearFiles,
    processAllFiles,
    downloadAll,
  }
})
