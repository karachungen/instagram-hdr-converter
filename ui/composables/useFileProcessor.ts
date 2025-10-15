import type { ProcessingFile, WasmModule } from '~/types'

interface UseFileProcessorReturn {
  files: Ref<ProcessingFile[]>
  isProcessing: Readonly<Ref<boolean>>
  addFiles: (fileList: FileList | File[]) => void
  removeFile: (fileId: string) => void
  clearFiles: () => void
  processAllFiles: (wasmModule: WasmModule, toast: any) => Promise<void>
  pendingFilesCount: ComputedRef<number>
  readyFilesCount: ComputedRef<number>
  processingFilesCount: ComputedRef<number>
  completedFilesCount: ComputedRef<number>
  errorFilesCount: ComputedRef<number>
}

/**
 * Composable for managing file processing operations
 * Handles file upload, validation, processing, and state management
 */
export function useFileProcessor(): UseFileProcessorReturn {
  const files = useState<ProcessingFile[]>('files', () => [])
  const isProcessing = useState<boolean>('isProcessing', () => false)
  const { add: addLog } = useLogs()

  /**
   * Generate a unique file ID
   */
  const generateFileId = (): string => {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Format file size in human-readable format
   */
  const formatFileSize = (bytes: number): string => {
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
  const readFileData = async (file: File): Promise<Uint8Array> => {
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
  const addFiles = (fileList: FileList | File[]): void => {
    const fileArray = Array.from(fileList)
    addLog(`Adding ${fileArray.length} file(s) to list...`, 'info')

    fileArray.forEach(async (file) => {
      const fileObj: ProcessingFile = {
        id: generateFileId(),
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

      try {
        fileObj.data = await readFileData(file)
        fileObj.status = 'ready'
        addLog(`  ✓ Loaded ${fileObj.name}: ${formatFileSize(fileObj.data.length)}`, 'success')
      }
      catch {
        addLog(`  ✗ Failed to load ${fileObj.name}`, 'error')
        fileObj.status = 'error'
        fileObj.error = 'Failed to read file'
      }
    })

    addLog(`Total files: ${files.value.length}`, 'info')
  }

  /**
   * Remove a file from the queue
   */
  const removeFile = (fileId: string): void => {
    const index = files.value.findIndex((f: ProcessingFile) => f.id === fileId)

    if (index !== -1) {
      const fileObj = files.value[index]
      if (fileObj) {
        addLog(`Removing file: ${fileObj.name}`, 'info')
        files.value.splice(index, 1)
      }
    }
  }

  /**
   * Clear all files from the queue
   */
  const clearFiles = (): void => {
    addLog('Clearing all files...', 'info')
    files.value = []
  }

  /**
   * Process a single file
   */
  const processSingleFile = async (
    fileObj: ProcessingFile,
    wasmModule: WasmModule,
    index: number,
    total: number,
  ): Promise<void> => {
    if (!fileObj.data) {
      throw new Error('File not loaded')
    }

    addLog(`[${index + 1}/${total}] Processing: ${fileObj.name}`, 'info')
    fileObj.status = 'processing'
    fileObj.progress = 0

    // Create unique paths for this file
    const inputPath = `/input_${fileObj.id}.jpg`
    // const outputPath = `/output_${fileObj.id}.jpg` // Reserved for future use

    try {
      // Write file to WASM filesystem
      addLog(`  Writing to WASM FS: ${inputPath}`, 'info')
      wasmModule.FS.writeFile(inputPath, fileObj.data)

      // Verify file was written
      const stat = wasmModule.FS.stat(inputPath)
      addLog(`  ✓ File written: ${formatFileSize(stat.size)}`, 'success')

      fileObj.progress = 50

      // Process HDR conversion (actual implementation would call WASM function)
      addLog('  Processing HDR conversion...', 'info')

      // Simulate processing - replace with actual WASM call
      await new Promise(resolve => setTimeout(resolve, 500))

      fileObj.progress = 100
      addLog('  ✓ Processing complete!', 'success')
      fileObj.status = 'completed'

      // Clean up input file from WASM FS
      try {
        wasmModule.FS.unlink(inputPath)
        addLog(`  Cleaned up: ${inputPath}`, 'info')
      }
      catch {
        // File might not exist or already deleted
      }
    }
    catch (error) {
      throw error
    }
  }

  /**
   * Process all files in the queue
   */
  const processAllFiles = async (wasmModule: WasmModule, toast: any): Promise<void> => {
    if (files.value.length === 0) {
      addLog('No files selected', 'error')
      return
    }

    if (!wasmModule?.FS) {
      addLog('WASM filesystem not available', 'error')
      return
    }

    addLog('=== Starting Batch Processing ===', 'info')
    addLog(`Processing ${files.value.length} file(s)...`, 'info')

    isProcessing.value = true
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < files.value.length; i++) {
      const fileObj = files.value[i]

      if (!fileObj) {
        continue
      }

      if (!fileObj.data) {
        addLog(`Skipping ${fileObj.name}: not loaded`, 'error')
        fileObj.status = 'error'
        fileObj.error = 'File not loaded'
        errorCount++
        continue
      }

      try {
        await processSingleFile(fileObj, wasmModule, i, files.value.length)
        successCount++
      }
      catch (error) {
        const err = error as Error
        addLog(`  ✗ Error processing ${fileObj.name}: ${err.message}`, 'error')
        fileObj.status = 'error'
        fileObj.error = err.message
        errorCount++
      }
    }

    addLog('=== Batch Processing Complete ===', 'success')
    addLog(`✓ Success: ${successCount} file(s)`, 'success')

    if (errorCount > 0) {
      addLog(`✗ Errors: ${errorCount} file(s)`, 'error')
    }

    toast.add({
      title: 'Processing Complete',
      description: `${successCount} files processed successfully${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
      icon: 'i-lucide-check-circle',
      color: errorCount > 0 ? 'warning' : 'success',
    })

    isProcessing.value = false
  }

  // Computed properties for file counts by status
  const pendingFilesCount = computed(
    () => files.value.filter((f: ProcessingFile) => f.status === 'pending').length,
  )

  const readyFilesCount = computed(
    () => files.value.filter((f: ProcessingFile) => f.status === 'ready').length,
  )

  const processingFilesCount = computed(
    () => files.value.filter((f: ProcessingFile) => f.status === 'processing').length,
  )

  const completedFilesCount = computed(
    () => files.value.filter((f: ProcessingFile) => f.status === 'completed').length,
  )

  const errorFilesCount = computed(
    () => files.value.filter((f: ProcessingFile) => f.status === 'error').length,
  )

  return {
    files,
    isProcessing: readonly(isProcessing),
    addFiles,
    removeFile,
    clearFiles,
    processAllFiles,
    pendingFilesCount,
    readyFilesCount,
    processingFilesCount,
    completedFilesCount,
    errorFilesCount,
  }
}
