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

    // Validate AVIF file
    const fileName = file.name || 'input.avif'
    if (!fileName.toLowerCase().endsWith('.avif')) {
      throw new Error('Only AVIF files are supported')
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

    // Generate timestamp for output filename
    const timestamp = Date.now()
    const outputFileName = `origin_${timestamp}.jpg`
    const outputJpgPath = join(convertedDir, outputFileName)
    const inputPath = join(convertedDir, `input_${timestamp}.avif`)

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

      // Convert AVIF to HDR JPEG using ImageMagick with UHDR support
      logs.push('Starting AVIF to HDR JPEG conversion with ImageMagick...')
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
      const outputJpgBuffer = await readFile(outputJpgPath)
      logs.push(`Converted JPG size: ${outputJpgBuffer.length} bytes`)

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

