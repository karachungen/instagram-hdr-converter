import type { WasmModule, WasmModuleConfig } from '~/types'

interface UseWasmReturn {
  wasmModule: Readonly<Ref<WasmModule | null>>
  wasmReady: Readonly<Ref<boolean>>
  wasmError: Readonly<Ref<string | null>>
  initWasm: () => Promise<void>
  resetWasm: () => void
  reinitWasm: () => Promise<WasmModule>
}

/**
 * Composable for managing WASM module initialization and lifecycle
 * Handles loading, initialization, and error management of the UltraHDR WASM module
 */
export function useWasm(): UseWasmReturn {
  const wasmModule = useState<WasmModule | null>('wasmModule', () => null)
  const wasmReady = useState<boolean>('wasmReady', () => false)
  const wasmError = useState<string | null>('wasmError', () => null)
  const logsStore = useLogsStore()

  /**
   * Check if WASM file is accessible
   */
  const checkWasmFile = async (): Promise<void> => {
    logsStore.add('Step 2: Checking WASM file availability...', 'info')

    try {
      const wasmResponse = await fetch('/ultrahdr_app.wasm', { method: 'HEAD' })
      logsStore.add(`✓ WASM file status: ${wasmResponse.status} ${wasmResponse.statusText}`, 'success')

      const contentLength = wasmResponse.headers.get('content-length')
      if (contentLength) {
        const sizeKB = (Number.parseInt(contentLength, 10) / 1024).toFixed(2)
        logsStore.add(`  WASM file size: ${sizeKB} KB`, 'info')
      }
    }
    catch (error) {
      logsStore.add(`✗ WASM file check failed: ${(error as Error).message}`, 'error')
      throw new Error('Cannot access ultrahdr_app.wasm. Make sure you are using a web server!')
    }
  }

  /**
   * Setup WASM filesystem
   */
  const setupFilesystem = (module: WasmModule): void => {
    if (!module.FS) {
      logsStore.add('✗ Filesystem API (FS) not available!', 'error')
      return
    }

    logsStore.add('✓ Filesystem API (FS) is available', 'success')

    try {
      const rootContents = module.FS.readdir('/')
      logsStore.add(`  Root directory: ${rootContents.join(', ')}`, 'info')

      logsStore.add('  Creating /data directory...', 'info')
      try {
        module.FS.mkdir('/data')
        logsStore.add('  ✓ Created /data directory', 'success')
      }
      catch (error) {
        const errMsg = (error as Error).message
        if (errMsg && errMsg.includes('exist')) {
          logsStore.add('  /data directory already exists', 'info')
        }
        else {
          throw error
        }
      }

      const dataDir = module.FS.stat('/data')
      logsStore.add(`  /data mode: ${dataDir.mode.toString(8)}`, 'info')
    }
    catch (error) {
      logsStore.add(`  Warning with FS operations: ${(error as Error).message}`, 'error')
    }
  }

  /**
   * Validate module exports
   */
  const validateModule = (module: WasmModule): void => {
    logsStore.add('Step 5: Checking module exports...', 'info')

    const exports = Object.keys(module).filter(k => !k.startsWith('_') || k === '_main')
    logsStore.add(`  Available exports: ${exports.length} items`, 'info')

    const preview = exports.slice(0, 15).join(', ')
    const suffix = exports.length > 15 ? '...' : ''
    logsStore.add(`  Key exports: ${preview}${suffix}`, 'info')

    // Check for main function
    if (typeof module._main === 'function') {
      logsStore.add('✓ _main function is available', 'success')
    }
    else if (typeof module.callMain === 'function') {
      logsStore.add('✓ callMain function is available', 'success')
    }
    else {
      logsStore.add('⚠ No main function found (this may be OK)', 'warning')
    }

    // Check memory
    if (module.HEAP8) {
      logsStore.add(`  HEAP8 size: ${module.HEAP8.length} bytes`, 'info')
    }
  }

  /**
   * Wait for UltraHDRModule to be available
   * Note: UltraHDRModule is a global const, not explicitly on window object
   */
  const waitForUltraHDRModule = async (maxAttempts: number = 30): Promise<void> => {
    logsStore.add('Step 1: Waiting for ultrahdr_app.js to load...', 'info')

    for (let i = 0; i < maxAttempts; i++) {
      // Check both window.UltraHDRModule and global UltraHDRModule
      if (typeof UltraHDRModule !== 'undefined' || typeof window.UltraHDRModule !== 'undefined') {
        logsStore.add(`✓ UltraHDRModule loaded after ${(i + 1) * 200}ms`, 'success')
        return
      }

      if (i % 5 === 0 || i === maxAttempts - 1) {
        logsStore.add(`  Waiting for UltraHDRModule... ${i + 1} of ${maxAttempts}`, 'info')
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    throw new Error('UltraHDRModule not found. Please ensure ultrahdr_app.js is in public/ directory.')
  }

  /**
   * Initialize the WASM module
   */
  const initWasm = async (): Promise<void> => {
    try {
      wasmError.value = null
      logsStore.add('=== WASM Module Initialization Started ===', 'info')
      logsStore.add(`Timestamp: ${new Date().toISOString()}`, 'info')
      logsStore.add(`Browser: ${navigator.userAgent}`, 'info')

      // Step 1: Wait for UltraHDRModule to be loaded
      await waitForUltraHDRModule()
      logsStore.add(`✓ UltraHDRModule type: ${typeof window.UltraHDRModule}`, 'success')

      // Step 2: Check WASM file
      await checkWasmFile()

      // Step 3: Create module configuration
      logsStore.add('Step 3: Configuring module...', 'info')

      const moduleConfig: WasmModuleConfig = {
        // Prevent automatic execution of main() on initialization
        noInitialRun: true,
        print: (text: string) => logsStore.add(`[WASM-OUT] ${text}`, 'info'),
        printErr: (text: string) => logsStore.add(`[WASM-ERR] ${text}`, 'error'),
        onRuntimeInitialized: () => logsStore.add('✓ onRuntimeInitialized callback triggered!', 'success'),
        onAbort: (error: unknown) => {
          const errorMsg = `Module aborted: ${error}`
          logsStore.add(`✗ ${errorMsg}`, 'error')
          wasmError.value = errorMsg
        },
        monitorRunDependencies: (left: number) =>
          logsStore.add(`  Dependencies remaining: ${left}`, 'info'),
        setStatus: (text: string) => {
          if (text)
            logsStore.add(`  [Module Status] ${text}`, 'info')
        },
        locateFile: (path: string, prefix: string) => {
          const fullPath = prefix + path
          logsStore.add(`  Locating: ${path} → ${fullPath}`, 'info')
          return fullPath
        },
      }

      // Step 4: Initialize the module
      logsStore.add('Step 4: Calling UltraHDRModule() [this may take a few seconds]...', 'info')

      // Get UltraHDRModule from global scope (it's not on window object)
      const moduleFactory = (typeof UltraHDRModule !== 'undefined')
        ? UltraHDRModule
        : globalThis.UltraHDRModule

      if (!moduleFactory) {
        throw new Error('UltraHDRModule disappeared after successful wait!')
      }

      const startTime = performance.now()
      const module = await moduleFactory(moduleConfig)
      const loadTime = ((performance.now() - startTime) / 1000).toFixed(2)

      logsStore.add(`✓ UltraHDRModule loaded in ${loadTime}s!`, 'success')

      // Step 5: Validate module
      validateModule(module)

      // Setup filesystem
      setupFilesystem(module)

      logsStore.add('=== WASM Module Initialization Complete ===', 'success')

      wasmModule.value = module
      wasmReady.value = true

      // Display ready message
      logsStore.add('---', 'info')
      logsStore.add('✨ Ready to process images!', 'success')
      logsStore.add('📝 Instructions:', 'info')
      logsStore.add('  1. Upload one or more HDR image files (drag & drop or click)', 'info')
      logsStore.add('  2. Wait for files to load into memory', 'info')
      logsStore.add('  3. Click "Process All Images" for batch conversion', 'info')
      logsStore.add('  4. Watch the progress in the file list and this log', 'info')
    }
    catch (error) {
      const err = error as Error
      logsStore.add('=== WASM Module Initialization FAILED ===', 'error')
      logsStore.add(`❌ Error: ${err.message}`, 'error')

      if (err.stack) {
        logsStore.add('Stack trace:', 'error')
        err.stack.split('\n').forEach(line => logsStore.add(`  ${line}`, 'error'))
      }

      wasmError.value = err.message

      // Troubleshooting guide
      logsStore.add('---', 'error')
      logsStore.add('🔧 Troubleshooting Steps:', 'error')
      logsStore.add('  1. Verify WASM files exist:', 'error')
      logsStore.add('     ls -la ultrahdr_app.wasm ultrahdr_app.js', 'error')
      logsStore.add('  2. Build the WASM module if missing:', 'error')
      logsStore.add('     ./build-wasm.sh OR ./build-wasm-docker.sh', 'error')
      logsStore.add('  3. Make sure you are using a web server:', 'error')
      logsStore.add('     npm run dev', 'error')
      logsStore.add('  4. Check browser console (F12) for errors', 'error')
      logsStore.add('  5. Try a different browser (Chrome/Firefox recommended)', 'error')
    }
  }

  /**
   * Reset WASM state
   */
  const resetWasm = (): void => {
    wasmModule.value = null
    wasmReady.value = false
    wasmError.value = null
  }

  /**
   * Reinitialize WASM module (create fresh instance)
   */
  const reinitWasm = async (): Promise<WasmModule> => {
    console.log('[WASM] Creating fresh instance')

    // Get UltraHDRModule from global scope
    const moduleFactory = (typeof UltraHDRModule !== 'undefined')
      ? UltraHDRModule
      : globalThis.UltraHDRModule

    if (!moduleFactory) {
      throw new Error('UltraHDRModule not available')
    }

    const moduleConfig: WasmModuleConfig = {
      noInitialRun: true,
      print: (text: string) => logsStore.add(`[WASM] ${text}`, 'info'),
      printErr: (text: string) => logsStore.add(`[WASM] ${text}`, 'error'),
    }

    const freshModule = await moduleFactory(moduleConfig)
    console.log('[WASM] Fresh module ready')
    return freshModule
  }

  return {
    wasmModule: readonly(wasmModule),
    wasmReady: readonly(wasmReady),
    wasmError: readonly(wasmError),
    initWasm,
    resetWasm,
    reinitWasm,
  }
}
