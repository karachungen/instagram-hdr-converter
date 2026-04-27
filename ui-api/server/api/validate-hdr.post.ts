import { readFormData } from 'h3'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile, rm, mkdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { H3Event } from 'h3'

const execAsync = promisify(exec)

interface ValidationResult {
  isHDR: boolean
  fileType: 'jpeg'
  bitDepth?: number
  colorSpace?: string
  error?: string
  details?: string
}

export default defineEventHandler(async (event: H3Event): Promise<ValidationResult> => {
  try {
    // Parse multipart form data
    const formData = await readFormData(event)
    const file = formData.get('file') as File | null

    if (!file) {
      throw new Error('No file uploaded')
    }

    const fileName = file.name.toLowerCase()
    const isJPEG = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')

    if (!isJPEG) {
      throw new Error('Only JPEG files are supported')
    }

    // Read file data
    const arrayBuffer = await file.arrayBuffer()
    const fileData = Buffer.from(arrayBuffer)

    // Setup paths
    const serverDir = resolve(process.cwd(), 'server')
    const cmdDir = join(serverDir, 'cmd')
    const tempDir = join(cmdDir, 'temp')
    await mkdir(tempDir, { recursive: true })

    const timestamp = Date.now()
    const tempFilePath = join(tempDir, `validate_${timestamp}.jpg`)

    try {
      // Save file temporarily
      await writeFile(tempFilePath, fileData)
      return await validateJPEGHDR(tempFilePath, cmdDir)
    } finally {
      // Cleanup
      try {
        await rm(tempFilePath, { force: true })
      } catch {
        // Ignore cleanup errors
      }
    }
  } catch (error: any) {
    console.error('Validation error:', error)
    return {
      isHDR: false,
      fileType: 'jpeg',
      error: error.message || 'Unknown error occurred',
    }
  }
})

/**
 * Validate JPEG has HDR using ultrahdr_app -P command
 */
async function validateJPEGHDR(filePath: string, cmdDir: string): Promise<ValidationResult> {
  try {
    const ultrahdrApp = join(cmdDir, 'ultrahdr_app')
    const checkCmd = `cd "${cmdDir}" && ./ultrahdr_app -m 1 -j "${filePath}" -P`

    const { stdout, stderr } = await execAsync(checkCmd, {
      maxBuffer: 1024 * 1024, // 1MB buffer
      env: {
        ...process.env,
        PATH: `${cmdDir}:${process.env.PATH}`,
      },
    })

    const output = (stdout + stderr).toLowerCase()

    // Check if ultrahdr_app confirms it's an HDR image
    const isHDR = output.includes('ultra hdr image: yes') ||
                  output.includes('gainmap metadata') ||
                  output.includes('hdr image') ||
                  output.includes('ultrahdr')

    return {
      isHDR,
      fileType: 'jpeg',
      details: isHDR ? 'HDR JPEG with gain map detected' : 'Standard JPEG without HDR gain map',
    }
  } catch (error: any) {
    // If ultrahdr_app fails or returns error, it's likely not an HDR image
    return {
      isHDR: false,
      fileType: 'jpeg',
      details: 'Not an HDR JPEG',
    }
  }
}
