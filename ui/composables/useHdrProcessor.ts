/**
 * HDR Image Processing Service
 * Handles two-step HDR conversion process with metadata extraction
 */

import type { HdrMetadata, HdrProcessResult, WasmModule } from '~/types'
import { useHdrConfigStore } from '~/stores/hdrConfig'
import { removeXmpMetadata } from '~/utils/jpegMetadataCleaner'
import { extractBaseSdrJpeg, extractGainMapJpeg } from '~/utils/jpegParser'

export interface ProcessingStep {
  step: 'decode' | 'encode'
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message: string
  progress?: number
}

export function useHdrProcessor() {
  const logsStore = useLogsStore()

  /**
   * Format metadata for display in logs
   */
  function formatMetadata(metadata: HdrMetadata): string {
    const formatValues = (values: number | number[]): string => {
      const arr = Array.isArray(values) ? values : [values]
      return arr.length > 1 ? arr.join(' ') : String(arr[0])
    }

    return `
    Max Content Boost: ${formatValues(metadata.maxContentBoost)}
    Min Content Boost: ${formatValues(metadata.minContentBoost)}
    Gamma: ${formatValues(metadata.gamma)}
    Offset SDR: ${formatValues(metadata.offsetSdr)}
    Offset HDR: ${formatValues(metadata.offsetHdr)}
    HDR Capacity Min: ${metadata.hdrCapacityMin}
    HDR Capacity Max: ${metadata.hdrCapacityMax}
    Use Base Color Space: ${metadata.useBaseColorSpace}`
  }

  /**
   * Parse HDR metadata from file content
   */
  function parseHdrMetadata(metadataContent: string): HdrMetadata | null {
    try {
      const lines = metadataContent.split('\n')
      const metadata: any = {}

      // Fields that can have multiple values (RGB channels)
      const arrayFields = ['maxContentBoost', 'minContentBoost', 'gamma', 'offsetSdr', 'offsetHdr']

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#'))
          continue

        const match = trimmed.match(/--(\w+)\s+(.+)/)
        if (match && match[1] && match[2]) {
          const key = match[1]
          const valueString = match[2].trim()

          if (arrayFields.includes(key)) {
            // Parse multiple space-separated values
            const values = valueString.split(/\s+/).map(v => Number.parseFloat(v))
            metadata[key] = values
          }
          else {
            // Single value
            metadata[key] = Number.parseFloat(valueString)
          }
        }
      }

      // Validate all required fields exist
      const required = [
        'maxContentBoost',
        'minContentBoost',
        'gamma',
        'offsetSdr',
        'offsetHdr',
        'hdrCapacityMin',
        'hdrCapacityMax',
        'useBaseColorSpace',
      ]

      for (const field of required) {
        if (!(field in metadata)) {
          logsStore.add(`Missing required metadata field: ${field}`, 'warning')
          return null
        }
      }

      // Ensure array fields are arrays (even if single value)
      for (const field of arrayFields) {
        if (field in metadata && !Array.isArray(metadata[field])) {
          metadata[field] = [metadata[field]]
        }
      }

      return metadata as HdrMetadata
    }
    catch (error) {
      logsStore.add(`Failed to parse metadata: ${error}`, 'error')
      return null
    }
  }

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
   * Normalize multichannel metadata to single-channel by averaging
   * libultrahdr doesn't support multichannel metadata in XMP mode
   */
  function normalizeMetadata(metadata: HdrMetadata): HdrMetadata {
    const average = (value: number | number[]): number => {
      if (Array.isArray(value)) {
        return value.reduce((sum, v) => sum + v, 0) / value.length
      }
      return value
    }

    return {
      maxContentBoost: average(metadata.maxContentBoost),
      minContentBoost: average(metadata.minContentBoost),
      gamma: average(metadata.gamma),
      offsetSdr: average(metadata.offsetSdr),
      offsetHdr: average(metadata.offsetHdr),
      hdrCapacityMin: metadata.hdrCapacityMin,
      hdrCapacityMax: metadata.hdrCapacityMax,
      useBaseColorSpace: metadata.useBaseColorSpace,
    }
  }

  /**
   * Create blob URL from RGBA8888 data for display
   * Currently unused - keeping for potential future use
   */
  function _createBlobUrlFromRGBA(rgba: Uint8Array, width: number, height: number): string {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Create ImageData from RGBA array
    const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height)
    ctx.putImageData(imageData, 0, 0)

    // Convert canvas to blob URL
    return canvas.toDataURL('image/png')
  }

  /**
   * Extract SDR base image from UltraHDR JPEG using browser's JPEG decoder
   * The browser automatically decodes the base (SDR) image, ignoring gain map
   * Returns RGBA8888 format (4 bytes per pixel) for ultrahdr_app encoding
   * Currently unused - keeping for potential future use
   */
  async function _extractSdrFromJpeg(
    file: File,
    width: number,
    height: number,
  ): Promise<Uint8Array | null> {
    try {
      logsStore.add('[SDR Extract] Using browser to decode base image...', 'info')

      return await new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
          try {
            // Create canvas to extract pixel data
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              URL.revokeObjectURL(url)
              reject(new Error('Failed to get canvas context'))
              return
            }

            // Draw image (browser decodes SDR base image)
            ctx.drawImage(img, 0, 0, width, height)

            // Get RGBA pixel data
            const imageData = ctx.getImageData(0, 0, width, height)
            const rgba = imageData.data

            console.log(`[SDR Extract] Canvas size: ${width}x${height}`)
            console.log(`[SDR Extract] RGBA8888 data size: ${rgba.length} bytes (${width * height * 4})`)

            // Convert Uint8ClampedArray to Uint8Array for WASM
            const rgba8888 = new Uint8Array(rgba)

            URL.revokeObjectURL(url)
            logsStore.add(`[SDR Extract] ✓ Extracted RGBA8888: ${rgba8888.length} bytes (${width}x${height})`, 'success')
            resolve(rgba8888)
          }
          catch (error) {
            URL.revokeObjectURL(url)
            reject(error)
          }
        }

        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load image for SDR extraction'))
        }

        img.src = url
      })
    }
    catch (error) {
      logsStore.add(`[SDR Extract] Failed: ${error}`, 'error')
      return null
    }
  }

  /**
   * Convert JPEG to 4:2:0 chroma subsampling using Canvas
   * This ensures the SDR image uses 4:2:0 subsampling for optimal compatibility
   */
  async function convertTo420Subsampling(jpegData: Uint8Array, quality: number = 0.95): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      // Create blob from JPEG data
      const blob = new Blob([new Uint8Array(jpegData)], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)

      const img = new Image()

      img.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Draw image to canvas
          ctx.drawImage(img, 0, 0)

          // Convert to JPEG blob with 4:2:0 subsampling (default for JPEG)
          canvas.toBlob(
            (resultBlob) => {
              URL.revokeObjectURL(url)

              if (!resultBlob) {
                reject(new Error('Failed to convert canvas to blob'))
                return
              }

              // Convert blob to Uint8Array
              resultBlob.arrayBuffer().then((buffer) => {
                resolve(new Uint8Array(buffer))
              }).catch(reject)
            },
            'image/jpeg',
            quality,
          )
        }
        catch (error) {
          URL.revokeObjectURL(url)
          reject(error)
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  /**
   * Step 1: Extract components from UltraHDR JPEG and metadata
   *
   * NEW APPROACH - API-4 (Compressed SDR + Gain Map):
   * Instead of decoding to RAW and re-encoding, we extract:
   * - Base SDR JPEG (primary image)
   * - Gain Map JPEG (secondary image in MPF)
   * - Metadata (gain map parameters)
   *
   * Then re-encode using: -m 0 -i sdr.jpg -g gainmap.jpg -f metadata.cfg
   *
   * Benefits:
   * - Preserves original JPEG quality
   * - Metadata is properly applied
   * - Much faster (no RAW conversion)
   */
  async function decodeHdrToRaw(
    inputData: Uint8Array,
    inputPath: string,
    outputPath: string,
    metadataPath: string,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<{
    baseSdrJpeg: Uint8Array | null
    gainMapJpeg: Uint8Array | null
    metadata: HdrMetadata | null
  }> {
    onProgress({
      step: 'decode',
      status: 'in_progress',
      message: 'Decoding HDR image to RAW format...',
      progress: 0,
    })

    logsStore.add(`[HDR Decode] Starting extraction: ${inputPath}`, 'info')

    const { reinitWasm } = useWasm()

    try {
      // Step 1: Extract Gain Map JPEG using parser
      logsStore.add('[Gain Map] Step 1/3: Extracting gain map from JPEG...', 'info')
      let gainMapJpeg = extractGainMapJpeg(inputData)

      if (!gainMapJpeg) {
        logsStore.add('[Gain Map] ⚠ No gain map found - not an UltraHDR image', 'warning')
        return { baseSdrJpeg: null, gainMapJpeg: null, metadata: null }
      }

      logsStore.add(`[HDR Decode] ✓ Extracted gain map: ${gainMapJpeg.length} bytes`, 'success')

      // Clean XMP metadata from gain map
      try {
        const originalSize = gainMapJpeg.length
        gainMapJpeg = removeXmpMetadata(gainMapJpeg)
        const cleanedSize = gainMapJpeg.length
        const removed = originalSize - cleanedSize

        if (removed > 0) {
          logsStore.add(`[Metadata Cleaner] ✓ Removed ${removed} bytes of XMP metadata from gain map`, 'success')
        }
        else {
          logsStore.add('[Metadata Cleaner] No XMP metadata found in gain map', 'info')
        }
      }
      catch (error) {
        logsStore.add(`[Metadata Cleaner] ⚠ Failed to clean gain map: ${error}`, 'warning')
        // Continue with original gain map if cleaning fails
      }

      logsStore.add(`[Gain Map] ✓ Gain map extracted: ${gainMapJpeg.length} bytes`, 'success')

      // Step 2: Extract Base SDR JPEG using parser
      logsStore.add('[Base SDR] Step 2/3: Extracting base SDR JPEG...', 'info')
      const baseSdrJpeg = extractBaseSdrJpeg(inputData)

      if (!baseSdrJpeg) {
        logsStore.add('[Base SDR] ⚠ Could not extract base SDR', 'warning')
        return { baseSdrJpeg: null, gainMapJpeg, metadata: null }
      }

      logsStore.add(`[Base SDR] ✓ Extracted base SDR: ${baseSdrJpeg.length} bytes`, 'success')

      // Step 3: Extract metadata using WASM mode 1
      logsStore.add('[Metadata] Step 3/3: Extracting gain map metadata...', 'info')
      logsStore.add('[Metadata] Creating WASM instance for metadata extraction...', 'info')
      const freshModule = await reinitWasm()

      // Write input file to fresh FS
      freshModule.FS.writeFile(inputPath, inputData)

      const tempRaw = outputPath.replace('.raw', '_temp.raw')
      const decodeArgs = ['-m', '1', '-j', inputPath, '-z', tempRaw, '-f', metadataPath]
      logsStore.add(`[Metadata] Calling: ultrahdr_app ${decodeArgs.join(' ')}`, 'info')

      if (freshModule.callMain) {
        const result = freshModule.callMain(decodeArgs)
        logsStore.add(`[Metadata] Command returned: ${result}`, 'info')
      }

      // Read and parse metadata file
      let metadata: HdrMetadata | null = null
      try {
        const metadataData = freshModule.FS.readFile(metadataPath)
        const metadataText = new TextDecoder().decode(metadataData)
        console.log('[FS] Read metadata file:', metadataPath)
        logsStore.add(`[Metadata] Extracted (${metadataData.length} bytes)`, 'info')

        metadata = parseHdrMetadata(metadataText)
        if (metadata) {
          logsStore.add('[Metadata] ✓ Original Gain Map Metadata:', 'success')
          logsStore.add(formatMetadata(metadata), 'info')
          console.log('[Metadata]:', metadata)
        }
      }
      catch (error) {
        logsStore.add(`[Metadata] Warning: Could not read metadata file: ${error}`, 'warning')
      }

      onProgress({
        step: 'decode',
        status: 'completed',
        message: 'Components extracted successfully',
        progress: 100,
      })

      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
      logsStore.add('✓ EXTRACTION COMPLETE (API-4 Mode)', 'success')
      logsStore.add(`  • Base SDR JPEG: ${baseSdrJpeg.length} bytes`, 'info')
      logsStore.add(`  • Gain Map JPEG: ${gainMapJpeg.length} bytes`, 'info')
      logsStore.add(`  • Metadata: ${metadata ? 'extracted' : 'not found'}`, metadata ? 'success' : 'warning')
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')

      return { baseSdrJpeg, gainMapJpeg, metadata }
    }
    catch (error) {
      const err = error as Error
      const errorMsg = err?.message || String(error)
      logsStore.add(`[HDR Decode] Error: ${errorMsg}`, 'error')
      onProgress({
        step: 'decode',
        status: 'error',
        message: errorMsg,
      })
      throw err
    }
  }

  /**
   * Extract metadata from processed image
   * Command: ultrahdr_app -m 1 -j processed.jpg -z temp.raw -f metadata.cfg
   */
  async function extractMetadataFromProcessed(
    processedData: Uint8Array,
    inputPath: string,
    rawPath: string,
    metadataPath: string,
  ): Promise<HdrMetadata | null> {
    logsStore.add('[HDR Verify] Extracting metadata from processed image...', 'info')

    const { reinitWasm } = useWasm()

    try {
      // Create fresh WASM module for metadata extraction
      const freshModule = await reinitWasm()

      // Write processed image to FS
      freshModule.FS.writeFile(inputPath, processedData)
      console.log('[FS] Wrote processed image for metadata extraction:', inputPath)

      // Run decode command to extract metadata only
      const decodeArgs = ['-m', '1', '-j', inputPath, '-z', rawPath, '-f', metadataPath]
      console.log('[WASM CMD] Extract metadata:', decodeArgs)

      if (freshModule.callMain) {
        const result = freshModule.callMain(decodeArgs)
        console.log('[WASM RESULT] Metadata extraction returned:', result)
      }

      // Read and parse metadata file
      const metadataData = freshModule.FS.readFile(metadataPath)
      const metadataText = new TextDecoder().decode(metadataData)
      console.log('[FS] Read processed metadata file:', metadataPath)

      const metadata = parseHdrMetadata(metadataText)
      if (metadata) {
        logsStore.add('[HDR Verify] ✓ Processed Image Metadata:', 'success')
        logsStore.add(formatMetadata(metadata), 'info')
        console.log('[Processed Metadata]:', metadata)
      }

      return metadata
    }
    catch (error) {
      logsStore.add(`[HDR Verify] Warning: Could not extract processed metadata: ${error}`, 'warning')
      return null
    }
  }

  /**
   * Step 2: Encode using API-4 (Compressed SDR + Gain Map + Metadata)
   *
   * API-4 is the OPTIMAL approach for preserving metadata:
   * -i : Base SDR JPEG (compressed)
   * -g : Gain Map JPEG (compressed)
   * -f : Metadata config (gain map parameters)
   *
   * This approach:
   * - Preserves original JPEG quality
   * - Applies metadata to gain map correctly
   * - Much faster than RAW conversion
   *
   * Command: ultrahdr_app -m 0 -i base_sdr.jpg -g gainmap.jpg -f metadata.cfg -z output.jpg
   */
  async function encodeRawToHdr(
    baseSdrJpeg: Uint8Array | null,
    gainMapJpeg: Uint8Array | null,
    baseSdrPath: string,
    gainMapPath: string,
    outputPath: string,
    metadata: HdrMetadata | null,
    metadataPath: string,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<Uint8Array> {
    onProgress({
      step: 'encode',
      status: 'in_progress',
      message: 'Encoding UltraHDR with gain map...',
      progress: 0,
    })

    logsStore.add(`[HDR Encode] Starting API-4 encoding: ${outputPath}`, 'info')

    const { reinitWasm } = useWasm()

    try {
      // Validate inputs
      if (!baseSdrJpeg || !gainMapJpeg) {
        throw new Error('Missing base SDR or gain map JPEG for API-4 encoding')
      }

      // Create fresh WASM module for encode
      logsStore.add('[HDR Encode] Creating fresh WASM instance...', 'info')
      const freshModule = await reinitWasm()

      // Convert base SDR to 4:2:0 chroma subsampling before encoding
      let finalBaseSdrJpeg = baseSdrJpeg
      try {
        const originalSize = baseSdrJpeg.length
        logsStore.add('[Chroma Subsampling] Converting base SDR to 4:2:0 before encoding...', 'info')

        finalBaseSdrJpeg = await convertTo420Subsampling(baseSdrJpeg, 0.95)

        const newSize = finalBaseSdrJpeg.length
        const diff = originalSize - newSize
        const diffPercent = ((diff / originalSize) * 100).toFixed(1)

        if (diff > 0) {
          logsStore.add(`[Chroma Subsampling] ✓ Converted to 4:2:0: ${newSize} bytes (saved ${diff} bytes, ${diffPercent}%)`, 'success')
        }
        else if (diff < 0) {
          logsStore.add(`[Chroma Subsampling] ✓ Converted to 4:2:0: ${newSize} bytes (increased ${Math.abs(diff)} bytes)`, 'info')
        }
        else {
          logsStore.add(`[Chroma Subsampling] ✓ Converted to 4:2:0: ${newSize} bytes (no size change)`, 'info')
        }
      }
      catch (error) {
        logsStore.add(`[Chroma Subsampling] ⚠ Failed to convert: ${error}`, 'warning')
        logsStore.add('[Chroma Subsampling] Using original base SDR for encoding', 'info')
        // Continue with original if conversion fails
      }

      // Write Base SDR JPEG to FS
      freshModule.FS.writeFile(baseSdrPath, finalBaseSdrJpeg)
      console.log('[FS] Wrote base SDR JPEG to FS:', baseSdrPath, 'size:', finalBaseSdrJpeg.length)
      logsStore.add(`[HDR Encode] Base SDR JPEG: ${finalBaseSdrJpeg.length} bytes`, 'info')

      // Write Gain Map JPEG to FS
      freshModule.FS.writeFile(gainMapPath, gainMapJpeg)
      console.log('[FS] Wrote gain map JPEG to FS:', gainMapPath, 'size:', gainMapJpeg.length)
      logsStore.add(`[HDR Encode] Gain Map JPEG: ${gainMapJpeg.length} bytes`, 'info')

      // Check if custom config should be used
      const hdrConfigStore = useHdrConfigStore()
      let metadataToUse = metadata

      if (hdrConfigStore.useCustomConfig) {
        logsStore.add('[HDR Config] Using custom HDR configuration', 'info')
        metadataToUse = hdrConfigStore.customConfig
      }
      else if (metadata) {
        logsStore.add('[HDR Config] Using extracted metadata from original image', 'info')
      }
      else {
        logsStore.add('[HDR Config] No metadata available, using defaults', 'info')
        metadataToUse = hdrConfigStore.customConfig
      }

      // Normalize metadata if needed (check for multichannel values)
      let normalizedMetadata = metadataToUse
      if (metadataToUse) {
        const hasMultichannel
          = Array.isArray(metadataToUse.maxContentBoost)
            || Array.isArray(metadataToUse.minContentBoost)
            || Array.isArray(metadataToUse.gamma)
            || Array.isArray(metadataToUse.offsetSdr)
            || Array.isArray(metadataToUse.offsetHdr)

        if (hasMultichannel) {
          logsStore.add('[Metadata] ⚠ Multichannel metadata detected - converting to single-channel', 'warning')
          logsStore.add('[Metadata] Averaging per-channel values (libultrahdr XMP limitation)', 'info')
          normalizedMetadata = normalizeMetadata(metadataToUse)
        }
      }

      // Write metadata file if available
      if (normalizedMetadata) {
        const metadataContent = `--maxContentBoost ${normalizedMetadata.maxContentBoost}
--minContentBoost ${normalizedMetadata.minContentBoost}
--gamma ${normalizedMetadata.gamma}
--offsetSdr ${normalizedMetadata.offsetSdr}
--offsetHdr ${normalizedMetadata.offsetHdr}
--hdrCapacityMin ${normalizedMetadata.hdrCapacityMin}
--hdrCapacityMax ${normalizedMetadata.hdrCapacityMax}
--useBaseColorSpace ${normalizedMetadata.useBaseColorSpace}`

        const metadataBytes = new TextEncoder().encode(metadataContent)
        freshModule.FS.writeFile(metadataPath, metadataBytes)
        console.log('[FS] Wrote metadata file to fresh FS:', metadataPath)
        logsStore.add('[HDR Encode] Metadata file written (single-channel)', 'info')
      }

      // Build API-4 encode command
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      logsStore.add('✓ API-4 MODE: Compressed SDR + Gain Map + Metadata', 'success')
      logsStore.add(`  • Base SDR (-i): ${baseSdrPath} [${baseSdrJpeg.length} bytes]`, 'info')
      logsStore.add(`  • Gain Map (-g): ${gainMapPath} [${gainMapJpeg.length} bytes]`, 'info')
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')

      const encodeArgs = [
        '-m',
        '0',
        '-i',
        baseSdrPath, // Base SDR JPEG (compressed)
        '-g',
        gainMapPath, // Gain Map JPEG (compressed)
        '-z',
        outputPath, // Output UltraHDR JPEG
      ]

      // Add metadata flag if available
      if (normalizedMetadata) {
        encodeArgs.push('-f', metadataPath)
        logsStore.add('✓ Custom metadata will be applied to gain map:', 'success')
        logsStore.add(`  • maxContentBoost: ${normalizedMetadata.maxContentBoost}`, 'info')
        logsStore.add(`  • minContentBoost: ${normalizedMetadata.minContentBoost}`, 'info')
        logsStore.add(`  • gamma: ${normalizedMetadata.gamma}`, 'info')
      }
      else {
        logsStore.add('ℹ No metadata override - using existing gain map metadata', 'info')
      }

      logsStore.add(`[HDR Encode] Calling: ultrahdr_app ${encodeArgs.join(' ')}`, 'info')
      console.log('[WASM CMD] Encode:', encodeArgs)

      if (freshModule.callMain) {
        const result = freshModule.callMain(encodeArgs)
        console.log('[WASM RESULT] Encode returned:', result)
        logsStore.add(`[HDR Encode] Command returned: ${result}`, 'info')
      }

      // Read output from FS and save to browser memory
      const outputData = freshModule.FS.readFile(outputPath)
      console.log('[FS] Read output from FS, size:', outputData.length)
      logsStore.add(`[HDR Encode] ✓ Output generated: ${outputData.length} bytes`, 'success')

      // Summary
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
      logsStore.add('✓ ENCODING COMPLETE (API-4)', 'success')
      logsStore.add('  Mode: Compressed SDR + Gain Map + Metadata', 'success')
      logsStore.add('  Result: Metadata applied to gain map!', 'success')
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')

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
      logsStore.add(`[HDR Encode] Error: ${errorMsg}`, 'error')
      onProgress({
        step: 'encode',
        status: 'error',
        message: errorMsg,
      })
      throw err
    }
  }

  /**
   * Process complete HDR conversion pipeline with metadata extraction
   * Uses fresh WASM instances and browser memory for data transfer
   */
  async function processHdrImage(
    _wasmModule: WasmModule,
    file: File,
    fileData: Uint8Array,
    onProgress: (step: ProcessingStep) => void,
  ): Promise<HdrProcessResult> {
    const startTime = performance.now()
    logsStore.add(`\n=== HDR Processing Started: ${file.name} ===`, 'info')
    console.log('[HDR] Starting processing for:', file.name, 'size:', file.size)

    try {
      // Get image dimensions
      const { width, height } = await getImageDimensions(file)
      logsStore.add(`Image dimensions: ${width}x${height}`, 'info')

      // Create unique filenames
      const timestamp = Date.now()
      const inputJpgPath = `/input_${timestamp}.jpg`
      const rawPath = `/temp_${timestamp}.raw`
      const outputPath = `/output_${timestamp}.jpg`
      const metadataPath = `/metadata_${timestamp}.cfg`

      // Step 1: Extract components (Base SDR, Gain Map, Metadata)
      console.log('[HDR] Step 1/2: Extracting UltraHDR components...')
      const { baseSdrJpeg, gainMapJpeg, metadata } = await decodeHdrToRaw(fileData, inputJpgPath, rawPath, metadataPath, onProgress)

      if (baseSdrJpeg) {
        console.log('[HDR] Base SDR JPEG extracted:', baseSdrJpeg.length, 'bytes')
      }
      if (gainMapJpeg) {
        console.log('[HDR] Gain Map JPEG extracted:', gainMapJpeg.length, 'bytes')
      }
      if (metadata) {
        console.log('[HDR] Metadata extracted:', metadata)
      }

      // Step 2: Re-encode using API-4 (SDR + Gain Map + Metadata)
      console.log('[HDR] Step 2/2: Re-encoding with API-4...')
      const baseSdrPath = `/base_sdr_${timestamp}.jpg`
      const gainMapPath = `/gainmap_${timestamp}.jpg`
      const processedData = await encodeRawToHdr(baseSdrJpeg, gainMapJpeg, baseSdrPath, gainMapPath, outputPath, metadata, metadataPath, onProgress)
      console.log('[HDR] Processed data in browser:', processedData.length, 'bytes')

      // Step 3: Extract metadata from processed image to verify preservation
      console.log('[HDR] Step 3/3: Verifying metadata in processed image...')
      const processedJpgPath = `/processed_verify_${timestamp}.jpg`
      const processedRawPath = `/processed_verify_${timestamp}.raw`
      const processedMetadataPath = `/processed_metadata_${timestamp}.cfg`

      const metadataProcessed = await extractMetadataFromProcessed(
        processedData,
        processedJpgPath,
        processedRawPath,
        processedMetadataPath,
      )

      // Log metadata comparison
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      logsStore.add('METADATA VERIFICATION', 'info')
      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')

      if (metadata && metadataProcessed) {
        const isIdentical = JSON.stringify(metadata) === JSON.stringify(metadataProcessed)
        if (isIdentical) {
          logsStore.add('✓✓✓ SUCCESS! All metadata values preserved correctly!', 'success')
          logsStore.add('  Original and processed metadata are identical', 'success')
        }
        else {
          logsStore.add('⚠ Values differ between original and processed', 'warning')

          // Check which fields differ
          const fields: (keyof HdrMetadata)[] = ['maxContentBoost', 'minContentBoost', 'gamma', 'offsetSdr', 'offsetHdr', 'hdrCapacityMin', 'hdrCapacityMax', 'useBaseColorSpace']
          fields.forEach((field) => {
            const origStr = JSON.stringify(metadata[field])
            const procStr = JSON.stringify(metadataProcessed[field])
            if (origStr !== procStr) {
              logsStore.add(`  • ${field}: ${origStr} → ${procStr}`, 'warning')
            }
          })
        }

        logsStore.add('✓ Used API-4 mode (Compressed SDR + Gain Map + Metadata)', 'info')
      }
      else if (metadata && !metadataProcessed) {
        logsStore.add('⚠ Original metadata exists but processed metadata missing', 'warning')
      }
      else if (!metadata && metadataProcessed) {
        logsStore.add('ℹ No original metadata, but processed image has metadata', 'info')
      }
      else {
        logsStore.add('ℹ No metadata available for comparison', 'info')
      }

      logsStore.add('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')

      // Create HDR data URLs for comparison
      const beforeBlob = new Blob([fileData as BlobPart], { type: file.type })
      const afterBlob = new Blob([processedData as BlobPart], { type: 'image/jpeg' })

      const beforeImage = URL.createObjectURL(beforeBlob)
      const afterImage = URL.createObjectURL(afterBlob)

      // Create Gain Map URL from extracted JPEG
      logsStore.add('[Gain Map] Creating gain map preview...', 'info')
      let gainMapImage: string | undefined

      if (gainMapJpeg) {
        try {
          const gainMapBlob = new Blob([gainMapJpeg as BlobPart], { type: 'image/jpeg' })
          gainMapImage = URL.createObjectURL(gainMapBlob)
          logsStore.add('[Gain Map] ✓ Gain map preview created', 'success')
        }
        catch (error) {
          logsStore.add(`[Gain Map] ⚠ Failed to create gain map preview: ${error}`, 'warning')
        }
      }
      else {
        logsStore.add('[Gain Map] ℹ No gain map available', 'info')
      }

      // Create SDR URLs from extracted JPEGs
      logsStore.add('[SDR URLs] Creating SDR preview images...', 'info')
      let beforeImageSdr = ''
      let afterImageSdr = ''

      if (baseSdrJpeg) {
        // Create blob URL from base SDR JPEG
        try {
          const sdrBlob = new Blob([baseSdrJpeg as BlobPart], { type: 'image/jpeg' })
          beforeImageSdr = URL.createObjectURL(sdrBlob)
          logsStore.add('[SDR URLs] ✓ Original SDR preview created', 'success')
        }
        catch (error) {
          logsStore.add(`[SDR URLs] ⚠ Failed to create original SDR preview: ${error}`, 'warning')
        }
      }

      // Extract SDR from processed image (browser will decode base image)
      try {
        const processedSdrJpeg = extractBaseSdrJpeg(processedData)
        if (processedSdrJpeg) {
          const sdrBlob = new Blob([processedSdrJpeg as BlobPart], { type: 'image/jpeg' })
          afterImageSdr = URL.createObjectURL(sdrBlob)
          logsStore.add('[SDR URLs] ✓ Processed SDR preview created', 'success')
        }
      }
      catch (error) {
        logsStore.add(`[SDR URLs] ⚠ Failed to create processed SDR preview: ${error}`, 'warning')
      }

      // No FS cleanup needed - each step uses fresh WASM instance
      logsStore.add('Using fresh WASM instances - no cleanup needed', 'info')

      const duration = ((performance.now() - startTime) / 1000).toFixed(2)
      const sizeChangeNum = (processedData.length - fileData.length) / fileData.length * 100
      const sizeChange = sizeChangeNum.toFixed(1)

      logsStore.add('', 'info')
      logsStore.add('═══════════════════════════════════════════', 'success')
      logsStore.add('✓ HDR PROCESSING COMPLETE!', 'success')
      logsStore.add('═══════════════════════════════════════════', 'success')
      logsStore.add(`File: ${file.name}`, 'info')
      logsStore.add(`Duration: ${duration}s`, 'info')
      logsStore.add(`Original: ${(fileData.length / 1024).toFixed(2)} KB`, 'info')
      logsStore.add(`Processed: ${(processedData.length / 1024).toFixed(2)} KB (${sizeChangeNum > 0 ? '+' : ''}${sizeChange}%)`, 'info')
      logsStore.add(`Resolution: ${width}x${height}`, 'info')
      logsStore.add('Mode: ✓ API-4 (Compressed SDR + Gain Map + Metadata)', 'success')
      if (gainMapJpeg) {
        logsStore.add(`Gain Map: ${(gainMapJpeg.length / 1024).toFixed(2)} KB`, 'info')
      }
      logsStore.add('═══════════════════════════════════════════', 'success')
      logsStore.add('', 'info')

      return {
        success: true,
        beforeImage,
        afterImage,
        beforeImageSdr,
        afterImageSdr,
        gainMapImage,
        originalSize: fileData.length,
        processedSize: processedData.length,
        width,
        height,
        metadataOriginal: metadata || undefined,
        metadataProcessed: metadataProcessed || undefined,
      }
    }
    catch (error: any) {
      const errorMsg = error?.message || String(error)
      logsStore.add(`=== HDR Processing Failed: ${file.name} - ${errorMsg} ===\n`, 'error')

      return {
        success: false,
        beforeImage: '',
        afterImage: '',
        beforeImageSdr: '',
        afterImageSdr: '',
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
