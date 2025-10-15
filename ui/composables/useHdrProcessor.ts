/**
 * HDR Image Processing Service
 * Handles two-step HDR conversion process
 */

import type { WasmModule } from '~/types'

export interface ProcessingStep {
  step: 'decode' | 'encode'
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message: string
  progress?: number
}

export interface HdrProcessResult {
  success: boolean
  beforeImage: string // Data URL of original image
  afterImage: string // Data URL of processed image
  originalSize: number
  processedSize: number
  width: number
  height: number
  error?: string
}

export function useHdrProcessor() {
  const { add: addLog } = useLogs()

  /**
   * Get image dimensions from file
   */
  async function getImageDimensions(file: File): Promise<{ width: number, height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        const dimensions = { width: img.width, height: img.height }
        URL.revokeObjectURL(url)
        resolve(dimensions)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Step 1: Decode HDR to RAW
   * Command: ultrahdr_app -m 1 -j image.jpg -z image.raw
   */
  async function decodeHdrToRaw(
    wasmModule: WasmModule,
    inputPath: string,
    outputPath: string,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<void> {
    onProgress({
      step: 'decode',
      status: 'in_progress',
      message: 'Decoding HDR image to RAW format...',
      progress: 0,
    })

    addLog(`[HDR Decode] Starting: ${inputPath} → ${outputPath}`, 'info')

    try {
      // Verify input file exists
      try {
        wasmModule.FS.stat(inputPath)
      }
      catch {
        throw new Error(`Input file not found: ${inputPath}`)
      }

      // Run decode command: -m 1 (mode 1), -j input, -z output
      const decodeArgs = ['-m', '1', '-j', inputPath, '-z', outputPath]
      addLog(`[HDR Decode] Calling: ultrahdr_app ${decodeArgs.join(' ')}`, 'info')
      console.log('[WASM CMD] Decode:', decodeArgs)

      if (wasmModule.callMain) {
        try {
          const result = wasmModule.callMain(decodeArgs)
          console.log('[WASM RESULT] Decode returned:', result)
          addLog(`[HDR Decode] Command returned: ${result}`, 'info')
        }
        catch (error) {
          const err = error as Error
          console.error('[WASM ERROR] Decode failed:', err)
          addLog(`[HDR Decode] WASM execution error: ${err.message}`, 'warning')
        }
      }

      // Check if output was created
      try {
        const stats = wasmModule.FS.stat(outputPath)
        addLog(`[HDR Decode] Success: ${outputPath} (${stats.size} bytes)`, 'success')
      }
      catch {
        throw new Error('Decode failed: output file not created')
      }

      onProgress({
        step: 'decode',
        status: 'completed',
        message: 'HDR decoded successfully',
        progress: 100,
      })
    }
    catch (error: any) {
      const errorMsg = error?.message || String(error)
      addLog(`[HDR Decode] Error: ${errorMsg}`, 'error')
      onProgress({
        step: 'decode',
        status: 'error',
        message: errorMsg,
      })
      throw error
    }
  }

  /**
   * Step 2: Encode RAW to HDR
   * Command: ultrahdr_app -m 0 -p image.raw -w 1080 -h 1080
   */
  async function encodeRawToHdr(
    wasmModule: WasmModule,
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<void> {
    onProgress({
      step: 'encode',
      status: 'in_progress',
      message: `Encoding RAW to HDR (${width}x${height})...`,
      progress: 0,
    })

    addLog(`[HDR Encode] Starting: ${inputPath} → ${outputPath} (${width}x${height})`, 'info')

    try {
      // Verify input file exists
      try {
        wasmModule.FS.stat(inputPath)
      }
      catch {
        throw new Error(`Input file not found: ${inputPath}`)
      }

      // Run encode command: -m 0 (mode 0), -p input, -w width, -h height, - output (if needed)
      const encodeArgs = [
        '-m',
        '0',
        '-p',
        inputPath,
        '-w',
        String(width),
        '-h',
        String(height),
      ]

      // Some versions may need output path specified
      if (outputPath !== '/output.jpg') {
        encodeArgs.push('-z', outputPath)
      }

      addLog(`[HDR Encode] Calling: ultrahdr_app ${encodeArgs.join(' ')}`, 'info')
      console.log('[WASM CMD] Encode:', encodeArgs)

      if (wasmModule.callMain) {
        try {
          const result = wasmModule.callMain(encodeArgs)
          console.log('[WASM RESULT] Encode returned:', result)
          addLog(`[HDR Encode] Command returned: ${result}`, 'info')
        }
        catch (error) {
          const err = error as Error
          console.error('[WASM ERROR] Encode failed:', err)
          addLog(`[HDR Encode] WASM execution error: ${err.message}`, 'warning')
        }
      }

      // Check if output was created
      try {
        const stats = wasmModule.FS.stat(outputPath)
        addLog(`[HDR Encode] Success: ${outputPath} (${stats.size} bytes)`, 'success')
      }
      catch {
        throw new Error('Encode failed: output file not created')
      }

      onProgress({
        step: 'encode',
        status: 'completed',
        message: 'HDR encoded successfully',
        progress: 100,
      })
    }
    catch (error: any) {
      const errorMsg = error?.message || String(error)
      addLog(`[HDR Encode] Error: ${errorMsg}`, 'error')
      onProgress({
        step: 'encode',
        status: 'error',
        message: errorMsg,
      })
      throw error
    }
  }

  /**
   * Process complete HDR conversion pipeline
   */
  async function processHdrImage(
    wasmModule: WasmModule,
    file: File,
    fileData: Uint8Array,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<HdrProcessResult> {
    const startTime = performance.now()
    addLog(`\n=== HDR Processing Started: ${file.name} ===`, 'info')
    console.log('[HDR] Starting processing for:', file.name, 'size:', file.size)

    try {
      // Get image dimensions
      const { width, height } = await getImageDimensions(file)
      addLog(`Image dimensions: ${width}x${height}`, 'info')

      // Create unique filenames
      const timestamp = Date.now()
      const inputPath = `/input_${timestamp}.jpg`
      const rawPath = `/temp_${timestamp}.raw`
      const outputPath = `/output_${timestamp}.jpg`

      // Write input file to WASM filesystem
      wasmModule.FS.writeFile(inputPath, fileData)
      addLog(`Input file written: ${inputPath}`, 'info')

      // Step 1: Decode HDR to RAW
      await decodeHdrToRaw(wasmModule, inputPath, rawPath, onProgress)

      // Step 2: Encode RAW to HDR with proper dimensions
      await encodeRawToHdr(wasmModule, rawPath, outputPath, width, height, onProgress)

      // Read processed file
      const processedData = wasmModule.FS.readFile(outputPath)

      // Create data URLs for comparison
      const beforeBlob = new Blob([fileData as BlobPart], { type: file.type })
      const afterBlob = new Blob([processedData as BlobPart], { type: 'image/jpeg' })

      const beforeImage = URL.createObjectURL(beforeBlob)
      const afterImage = URL.createObjectURL(afterBlob)

      // Cleanup WASM filesystem
      try {
        wasmModule.FS.unlink(inputPath)
        wasmModule.FS.unlink(rawPath)
        wasmModule.FS.unlink(outputPath)
        addLog('Temporary files cleaned up', 'info')
      }
      catch (e) {
        addLog(`Cleanup warning: ${e}`, 'warning')
      }

      const duration = ((performance.now() - startTime) / 1000).toFixed(2)
      addLog(`=== HDR Processing Complete: ${file.name} (${duration}s) ===\n`, 'success')

      return {
        success: true,
        beforeImage,
        afterImage,
        originalSize: fileData.length,
        processedSize: processedData.length,
        width,
        height,
      }
    }
    catch (error: any) {
      const errorMsg = error?.message || String(error)
      addLog(`=== HDR Processing Failed: ${file.name} - ${errorMsg} ===\n`, 'error')

      return {
        success: false,
        beforeImage: '',
        afterImage: '',
        originalSize: file.size,
        processedSize: 0,
        width: 0,
        height: 0,
        error: errorMsg,
      }
    }
  }

  return {
    processHdrImage,
  }
}
