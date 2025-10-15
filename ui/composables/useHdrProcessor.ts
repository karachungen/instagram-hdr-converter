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
   * Step 1: Decode HDR to RAW (with fresh WASM module)
   * Command: ultrahdr_app -m 1 -j image.jpg -z image.raw
   */
  async function decodeHdrToRaw(
    inputData: Uint8Array,
    inputPath: string,
    outputPath: string,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<Uint8Array> {
    onProgress({
      step: 'decode',
      status: 'in_progress',
      message: 'Decoding HDR image to RAW format...',
      progress: 0,
    })

    addLog(`[HDR Decode] Starting: ${inputPath} → ${outputPath}`, 'info')

    const { reinitWasm } = useWasm()

    try {
      // Create fresh WASM module for decode
      addLog('[HDR Decode] Creating fresh WASM instance...', 'info')
      const freshModule = await reinitWasm()

      // Write input file to fresh FS
      freshModule.FS.writeFile(inputPath, inputData)
      console.log('[FS] Wrote input file:', inputPath)

      // Run decode command
      const decodeArgs = ['-m', '1', '-j', inputPath, '-z', outputPath]
      addLog(`[HDR Decode] Calling: ultrahdr_app ${decodeArgs.join(' ')}`, 'info')
      console.log('[WASM CMD] Decode:', decodeArgs)

      if (freshModule.callMain) {
        const result = freshModule.callMain(decodeArgs)
        console.log('[WASM RESULT] Decode returned:', result)
        addLog(`[HDR Decode] Command returned: ${result}`, 'info')
      }

      // Read RAW output from FS and save to browser memory
      const rawData = freshModule.FS.readFile(outputPath)
      console.log('[FS] Read RAW from FS, size:', rawData.length)
      addLog(`[HDR Decode] Success: RAW data (${rawData.length} bytes)`, 'success')

      onProgress({
        step: 'decode',
        status: 'completed',
        message: 'HDR decoded successfully',
        progress: 100,
      })

      return rawData
    }
    catch (error) {
      const err = error as Error
      const errorMsg = err?.message || String(error)
      addLog(`[HDR Decode] Error: ${errorMsg}`, 'error')
      onProgress({
        step: 'decode',
        status: 'error',
        message: errorMsg,
      })
      throw err
    }
  }

  /**
   * Step 2: Encode RAW to HDR (with fresh WASM module)
   * Command: ultrahdr_app -m 0 -p image.raw -w 1080 -h 1080
   */
  async function encodeRawToHdr(
    rawData: Uint8Array,
    inputPath: string,
    outputPath: string,
    width: number,
    height: number,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<Uint8Array> {
    onProgress({
      step: 'encode',
      status: 'in_progress',
      message: `Encoding RAW to HDR (${width}x${height})...`,
      progress: 0,
    })

    addLog(`[HDR Encode] Starting: ${inputPath} → ${outputPath} (${width}x${height})`, 'info')

    const { reinitWasm } = useWasm()

    try {
      // Create fresh WASM module for encode
      addLog('[HDR Encode] Creating fresh WASM instance...', 'info')
      const freshModule = await reinitWasm()

      // Write RAW file from browser memory to fresh FS
      freshModule.FS.writeFile(inputPath, rawData)
      console.log('[FS] Wrote RAW file to fresh FS:', inputPath, 'size:', rawData.length)
      addLog(`[HDR Encode] RAW file restored: ${rawData.length} bytes`, 'info')

      // Run encode command
      const encodeArgs = [
        '-m',
        '0',
        '-p',
        inputPath,
        '-w',
        String(width),
        '-h',
        String(height),
        '-z',
        outputPath,
      ]

      addLog(`[HDR Encode] Calling: ultrahdr_app ${encodeArgs.join(' ')}`, 'info')
      console.log('[WASM CMD] Encode:', encodeArgs)

      if (freshModule.callMain) {
        const result = freshModule.callMain(encodeArgs)
        console.log('[WASM RESULT] Encode returned:', result)
        addLog(`[HDR Encode] Command returned: ${result}`, 'info')
      }

      // Read output from FS and save to browser memory
      const outputData = freshModule.FS.readFile(outputPath)
      console.log('[FS] Read output from FS, size:', outputData.length)
      addLog(`[HDR Encode] Success: output data (${outputData.length} bytes)`, 'success')

      onProgress({
        step: 'encode',
        status: 'completed',
        message: 'HDR encoded successfully',
        progress: 100,
      })

      return outputData
    }
    catch (error) {
      const err = error as Error
      const errorMsg = err?.message || String(error)
      addLog(`[HDR Encode] Error: ${errorMsg}`, 'error')
      onProgress({
        step: 'encode',
        status: 'error',
        message: errorMsg,
      })
      throw err
    }
  }

  /**
   * Process complete HDR conversion pipeline
   * Uses fresh WASM instances and browser memory for data transfer
   */
  async function processHdrImage(
    _wasmModule: WasmModule,
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
      const inputJpgPath = `/input_${timestamp}.jpg`
      const rawPath = `/temp_${timestamp}.raw`
      const outputPath = `/output_${timestamp}.jpg`

      // Step 1: Decode with fresh WASM instance
      // Returns RAW data stored in browser memory
      console.log('[HDR] Step 1/2: Decoding...')
      const rawData = await decodeHdrToRaw(fileData, inputJpgPath, rawPath, onProgress)
      console.log('[HDR] RAW data saved in browser:', rawData.length, 'bytes')

      // Step 2: Encode with fresh WASM instance
      // Uses RAW data from browser memory
      console.log('[HDR] Step 2/2: Encoding...')
      const processedData = await encodeRawToHdr(rawData, rawPath, outputPath, width, height, onProgress)
      console.log('[HDR] Processed data in browser:', processedData.length, 'bytes')

      // Create data URLs for comparison
      const beforeBlob = new Blob([fileData as BlobPart], { type: file.type })
      const afterBlob = new Blob([processedData as BlobPart], { type: 'image/jpeg' })

      const beforeImage = URL.createObjectURL(beforeBlob)
      const afterImage = URL.createObjectURL(afterBlob)

      // No FS cleanup needed - each step uses fresh WASM instance
      addLog('Using fresh WASM instances - no cleanup needed', 'info')

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
