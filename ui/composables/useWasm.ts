import type { WasmModule, WasmModuleConfig } from '~/types'

interface UseWasmReturn {
  wasmModule: Readonly<Ref<WasmModule | null>>
  wasmReady: Readonly<Ref<boolean>>
  wasmError: Readonly<Ref<string | null>>
  initWasm: () => Promise<void>
  resetWasm: () => void
}

/**
 * Composable for managing WASM module initialization and lifecycle
 * Handles loading, initialization, and error management of the UltraHDR WASM module
 */
export function useWasm(): UseWasmReturn {
  const wasmModule = useState<WasmModule | null>('wasmModule', () => null)
  const wasmReady = useState<boolean>('wasmReady', () => false)
  const wasmError = useState<string | null>('wasmError', () => null)
  const { add: addLog } = useLogs()

  /**
   * Check if WASM file is accessible
   */
  const checkWasmFile = async (): Promise<void> => {
    addLog('Step 2: Checking WASM file availability...', 'info')

    try {
      const wasmResponse = await fetch('/ultrahdr_app.wasm', { method: 'HEAD' })
      addLog(`✓ WASM file status: ${wasmResponse.status} ${wasmResponse.statusText}`, 'success')

      const contentLength = wasmResponse.headers.get('content-length')
      if (contentLength) {
        const sizeKB = (Number.parseInt(contentLength, 10) / 1024).toFixed(2)
        addLog(`  WASM file size: ${sizeKB} KB`, 'info')
      }
    }
    catch (error) {
      addLog(`✗ WASM file check failed: ${(error as Error).message}`, 'error')
      throw new Error('Cannot access ultrahdr_app.wasm. Make sure you are using a web server!')
    }
  }

  /**
   * Setup WASM filesystem
   */
  const setupFilesystem = (module: WasmModule): void => {
    if (!module.FS) {
      addLog('✗ Filesystem API (FS) not available!', 'error')
      return
    }

    addLog('✓ Filesystem API (FS) is available', 'success')

    try {
      const rootContents = module.FS.readdir('/')
      addLog(`  Root directory: ${rootContents.join(', ')}`, 'info')

      addLog('  Creating /data directory...', 'info')
      try {
        module.FS.mkdir('/data')
        addLog('  ✓ Created /data directory', 'success')
      }
      catch (error) {
        const errMsg = (error as Error).message
        if (errMsg && errMsg.includes('exist')) {
          addLog('  /data directory already exists', 'info')
        }
        else {
          throw error
        }
      }

      const dataDir = module.FS.stat('/data')
      addLog(`  /data mode: ${dataDir.mode.toString(8)}`, 'info')
    }
    catch (error) {
      addLog(`  Warning with FS operations: ${(error as Error).message}`, 'error')
    }
  }

  /**
   * Validate module exports
   */
  const validateModule = (module: WasmModule): void => {
    addLog('Step 5: Checking module exports...', 'info')

    const exports = Object.keys(module).filter(k => !k.startsWith('_') || k === '_main')
    addLog(`  Available exports: ${exports.length} items`, 'info')

    const preview = exports.slice(0, 15).join(', ')
    const suffix = exports.length > 15 ? '...' : ''
    addLog(`  Key exports: ${preview}${suffix}`, 'info')

    // Check for main function
    if (typeof module._main === 'function') {
      addLog('✓ _main function is available', 'success')
    }
    else if (typeof module.callMain === 'function') {
      addLog('✓ callMain function is available', 'success')
    }
    else {
      addLog('⚠ No main function found (this may be OK)', 'warning')
    }

    // Check memory
    if (module.HEAP8) {
      addLog(`  HEAP8 size: ${module.HEAP8.length} bytes`, 'info')
    }
  }

  /**
   * Wait for UltraHDRModule to be available
   * Note: UltraHDRModule is a global const, not explicitly on window object
   */
  const waitForUltraHDRModule = async (maxAttempts: number = 30): Promise<void> => {
    addLog('Step 1: Waiting for ultrahdr_app.js to load...', 'info')

    for (let i = 0; i < maxAttempts; i++) {
      // Check both window.UltraHDRModule and global UltraHDRModule
      if (typeof UltraHDRModule !== 'undefined' || typeof window.UltraHDRModule !== 'undefined') {
        addLog(`✓ UltraHDRModule loaded after ${(i + 1) * 200}ms`, 'success')
        return
      }

      if (i % 5 === 0 || i === maxAttempts - 1) {
        addLog(`  Waiting for UltraHDRModule... ${i + 1} of ${maxAttempts}`, 'info')
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
      addLog('=== WASM Module Initialization Started ===', 'info')
      addLog(`Timestamp: ${new Date().toISOString()}`, 'info')
      addLog(`Browser: ${navigator.userAgent}`, 'info')

      // Step 1: Wait for UltraHDRModule to be loaded
      await waitForUltraHDRModule()
      addLog(`✓ UltraHDRModule type: ${typeof window.UltraHDRModule}`, 'success')

      // Step 2: Check WASM file
      await checkWasmFile()

      // Step 3: Create module configuration
      addLog('Step 3: Configuring module...', 'info')

      const moduleConfig: WasmModuleConfig = {
        // Prevent automatic execution of main() on initialization
        noInitialRun: true,
        print: (text: string) => addLog(`[WASM-OUT] ${text}`, 'info'),
        printErr: (text: string) => addLog(`[WASM-ERR] ${text}`, 'error'),
        onRuntimeInitialized: () => addLog('✓ onRuntimeInitialized callback triggered!', 'success'),
        onAbort: (error: unknown) => {
          const errorMsg = `Module aborted: ${error}`
          addLog(`✗ ${errorMsg}`, 'error')
          wasmError.value = errorMsg
        },
        monitorRunDependencies: (left: number) =>
          addLog(`  Dependencies remaining: ${left}`, 'info'),
        setStatus: (text: string) => {
          if (text)
            addLog(`  [Module Status] ${text}`, 'info')
        },
        locateFile: (path: string, prefix: string) => {
          const fullPath = prefix + path
          addLog(`  Locating: ${path} → ${fullPath}`, 'info')
          return fullPath
        },
      }

      // Step 4: Initialize the module
      addLog('Step 4: Calling UltraHDRModule() [this may take a few seconds]...', 'info')

      // Get UltraHDRModule from global scope (it's not on window object)
      const moduleFactory = (typeof UltraHDRModule !== 'undefined')
        ? UltraHDRModule
        : window.UltraHDRModule

      if (!moduleFactory) {
        throw new Error('UltraHDRModule disappeared after successful wait!')
      }

      const startTime = performance.now()
      const module = await moduleFactory(moduleConfig)
      const loadTime = ((performance.now() - startTime) / 1000).toFixed(2)

      addLog(`✓ UltraHDRModule loaded in ${loadTime}s!`, 'success')

      // Step 5: Validate module
      validateModule(module)

      // Setup filesystem
      setupFilesystem(module)

      addLog('=== WASM Module Initialization Complete ===', 'success')

      wasmModule.value = module
      wasmReady.value = true

      // Display ready message
      addLog('---', 'info')
      addLog('✨ Ready to process images!', 'success')
      addLog('📝 Instructions:', 'info')
      addLog('  1. Upload one or more HDR image files (drag & drop or click)', 'info')
      addLog('  2. Wait for files to load into memory', 'info')
      addLog('  3. Click "Process All Images" for batch conversion', 'info')
      addLog('  4. Watch the progress in the file list and this log', 'info')
    }
    catch (error) {
      const err = error as Error
      addLog('=== WASM Module Initialization FAILED ===', 'error')
      addLog(`❌ Error: ${err.message}`, 'error')

      if (err.stack) {
        addLog('Stack trace:', 'error')
        err.stack.split('\n').forEach(line => addLog(`  ${line}`, 'error'))
      }

      wasmError.value = err.message

      // Troubleshooting guide
      addLog('---', 'error')
      addLog('🔧 Troubleshooting Steps:', 'error')
      addLog('  1. Verify WASM files exist:', 'error')
      addLog('     ls -la ultrahdr_app.wasm ultrahdr_app.js', 'error')
      addLog('  2. Build the WASM module if missing:', 'error')
      addLog('     ./build-wasm.sh OR ./build-wasm-docker.sh', 'error')
      addLog('  3. Make sure you are using a web server:', 'error')
      addLog('     npm run dev', 'error')
      addLog('  4. Check browser console (F12) for errors', 'error')
      addLog('  5. Try a different browser (Chrome/Firefox recommended)', 'error')
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

  return {
    wasmModule: readonly(wasmModule),
    wasmReady: readonly(wasmReady),
    wasmError: readonly(wasmError),
    initWasm,
    resetWasm,
  }
}
