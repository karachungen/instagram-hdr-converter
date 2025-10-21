import { readFormData } from 'h3'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile, readFile, mkdir, rm, access } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { H3Event } from 'h3'
import type { ConversionResult } from '~/types'

const execAsync = promisify(exec)

export default defineEventHandler(async (event: H3Event): Promise<ConversionResult> => {
  try {
    // Parse multipart form data
    const formData = await readFormData(event)

    const file = formData.get('file') as File | null
    if (!file) {
      throw new Error('No file uploaded')
    }

    // Validate file type (AVIF or JPEG)
    const fileName = file.name || 'input'
    const isAVIF = fileName.toLowerCase().endsWith('.avif')
    const isJPEG = fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')

    if (!isAVIF && !isJPEG) {
      throw new Error('Only AVIF and JPEG files are supported')
    }

    // Read file data
    const arrayBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(arrayBuffer)

    // Setup paths
    const serverDir = resolve(process.cwd(), 'server')
    const cmdDir = join(serverDir, 'cmd')
    const convertedDir = join(serverDir, 'converted')
    const convertScript = join(cmdDir, 'convert-to-iso-hdr.sh')

    // Create converted directory if it doesn't exist
    await mkdir(convertedDir, { recursive: true })

    const logs: string[] = []
    logs.push(`Server directory: ${serverDir}`)
    logs.push(`Command directory: ${cmdDir}`)
    logs.push(`Converted directory: ${convertedDir}`)
    logs.push(`Input file type: ${isAVIF ? 'AVIF' : 'JPEG'}`)

    // Generate timestamp for output filename
    const timestamp = Date.now()
    const outputFileName = `origin_${timestamp}.jpg`
    const outputJpgPath = join(convertedDir, outputFileName)
    const inputExt = isAVIF ? '.avif' : '.jpg'
    const inputPath = join(convertedDir, `input_${timestamp}${inputExt}`)

    try {
      // Save uploaded file to converted directory
      await writeFile(inputPath, fileData)
      logs.push(`Saved input file: ${inputPath}`)
      logs.push(`File size: ${fileData.length} bytes`)

      // Verify script exists
      try {
        await access(convertScript)
        logs.push(`Found conversion script: ${convertScript}`)
      } catch {
        throw new Error(`Conversion script not found: ${convertScript}`)
      }

      let outputJpgBuffer: Buffer

      // Process both JPEG and AVIF through the conversion script
      const fileTypeLabel = isJPEG ? 'JPEG HDR' : 'AVIF'
      logs.push(`Starting ${fileTypeLabel} to Instagram-compatible HDR JPEG conversion...`)

      const convertCmd = `cd "${cmdDir}" && bash "${convertScript}" -o "${outputJpgPath}" "${inputPath}"`
      logs.push(`Executing: ${convertCmd}`)

      const { stdout: convertStdout, stderr: convertStderr } = await execAsync(convertCmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        env: {
          ...process.env,
          PATH: `${cmdDir}:${process.env.PATH}`,
        },
      })

      if (convertStdout) logs.push(`Conversion stdout: ${convertStdout.trim()}`)
      if (convertStderr) logs.push(`Conversion stderr: ${convertStderr.trim()}`)

      logs.push(`Output file: ${outputJpgPath}`)

      // Read converted JPG
      outputJpgBuffer = await readFile(outputJpgPath)
      logs.push(`Converted ${fileTypeLabel} size: ${outputJpgBuffer.length} bytes`)

      // Extract gain map as separate image using exiftool
      logs.push('Attempting to extract gain map image...')

      const gainmapPath = join(convertedDir, `gainmap_${timestamp}.jpg`)
      const extractGainMapCmd = `exiftool -b -MPImage2 "${outputJpgPath}" > "${gainmapPath}"`
      logs.push(`Executing gain map extraction: ${extractGainMapCmd}`)

      try {
        await execAsync(extractGainMapCmd, { maxBuffer: 10 * 1024 * 1024 })
        // Check if file was created and has content
        try {
          await access(gainmapPath)
          logs.push('Gain map extracted successfully')
        } catch {
          logs.push('Gain map file not created')
        }
      } catch (gmError: any) {
        logs.push(`Gain map extraction info: ${gmError.message}`)
      }

      // Read all output files
      const results: ConversionResult = {
        success: true,
        logs,
      }

      // Read converted JPG (required)
      results.outputJpg = outputJpgBuffer.toString('base64')

      // Try to read gain map image (optional)
      try {
        const gainMapBuffer = await readFile(gainmapPath)
        results.gainMap = gainMapBuffer.toString('base64')
        logs.push(`Gain map extracted: ${gainMapBuffer.length} bytes`)
      } catch {
        logs.push('Gain map not extracted separately (will decode on client)')
      }

      // Extract HDR metadata using ultrahdr_app -f
      logs.push('Extracting HDR metadata...')
      try {
        const ultrahdrApp = join(cmdDir, 'ultrahdr_app')
        const metadataFile = join(convertedDir, `metadata_${timestamp}.txt`)
        const metadataCmd = `cd "${cmdDir}" && "${ultrahdrApp}" -m 1 -j "${outputJpgPath}" -f "${metadataFile}"`

        await execAsync(metadataCmd, {
          maxBuffer: 1024 * 1024,
          env: {
            ...process.env,
            PATH: `${cmdDir}:${process.env.PATH}`,
          },
        })

        // Read metadata from file
        const metadataContent = await readFile(metadataFile, 'utf-8')
        logs.push(`Metadata extracted from file`)

        // Parse metadata from file content
        const metadata: any = {}
        const lines = metadataContent.split('\n')

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('--maxContentBoost')) {
            const values = trimmed.replace('--maxContentBoost', '').trim().split(/\s+/).map(Number)
            metadata.maxContentBoost = values.length === 1 ? values[0] : values.reduce((a, b) => a + b) / values.length
          }
          else if (trimmed.startsWith('--minContentBoost')) {
            const values = trimmed.replace('--minContentBoost', '').trim().split(/\s+/).map(Number)
            metadata.minContentBoost = values.length === 1 ? values[0] : values.reduce((a, b) => a + b) / values.length
          }
          else if (trimmed.startsWith('--gamma')) {
            const values = trimmed.replace('--gamma', '').trim().split(/\s+/).map(Number)
            metadata.gamma = values.length === 1 ? values[0] : values.reduce((a, b) => a + b) / values.length
          }
          else if (trimmed.startsWith('--offsetSdr')) {
            const values = trimmed.replace('--offsetSdr', '').trim().split(/\s+/).map(Number)
            metadata.offsetSdr = values.length === 1 ? values[0] : values.reduce((a, b) => a + b) / values.length
          }
          else if (trimmed.startsWith('--offsetHdr')) {
            const values = trimmed.replace('--offsetHdr', '').trim().split(/\s+/).map(Number)
            metadata.offsetHdr = values.length === 1 ? values[0] : values.reduce((a, b) => a + b) / values.length
          }
          else if (trimmed.startsWith('--hdrCapacityMin')) {
            metadata.hdrCapacityMin = Number(trimmed.replace('--hdrCapacityMin', '').trim())
          }
          else if (trimmed.startsWith('--hdrCapacityMax')) {
            metadata.hdrCapacityMax = Number(trimmed.replace('--hdrCapacityMax', '').trim())
          }
          else if (trimmed.startsWith('--useBaseColorSpace')) {
            metadata.useBaseColorSpace = Number(trimmed.replace('--useBaseColorSpace', '').trim())
          }
        }

        if (Object.keys(metadata).length > 0) {
          results.metadata = metadata
          logs.push(`HDR metadata extracted successfully`)
        } else {
          logs.push('No HDR metadata found in output')
        }

        // Cleanup metadata file
        try {
          await rm(metadataFile, { force: true })
        } catch {
          // Ignore cleanup errors
        }
      } catch (metaError: any) {
        logs.push(`Metadata extraction warning: ${metaError.message}`)
      }

      logs.push('Conversion completed successfully!')
      logs.push(`Output saved to: ${outputJpgPath}`)

      // Cleanup temporary files (keep only the main output file)
      try {
        await rm(inputPath, { force: true })
        logs.push('Cleaned up temporary files')
      } catch (cleanupError: any) {
        logs.push(`Cleanup warning: ${cleanupError.message}`)
      }

      return results
    } catch (error: any) {
      // Cleanup on error
      try {
        await rm(inputPath, { force: true })
      } catch {
        // Ignore cleanup errors
      }
      throw error
    }
  } catch (error: any) {
    console.error('Conversion error:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      logs: [error.message, error.stack].filter(Boolean),
    }
  }
})

