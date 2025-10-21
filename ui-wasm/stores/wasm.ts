/**
 * WASM Store
 * Manages WebAssembly module state and initialization
 */

import type { WasmModule } from '~/types'
import { defineStore } from 'pinia'

export const useWasmStore = defineStore('wasm', () => {
  // State
  const wasmModule = ref<WasmModule | null>(null)
  const wasmReady = ref(false)
  const wasmError = ref<string | null>(null)
  const isInitializing = ref(false)

  // Getters
  const statusBadge = computed<{ label: string, color: 'error' | 'warning' | 'success', icon: string }>(() => {
    if (wasmError.value) {
      return {
        label: 'Error',
        color: 'error' as const,
        icon: 'i-lucide-x-circle',
      }
    }

    if (!wasmReady.value) {
      return {
        label: 'Loading...',
        color: 'warning' as const,
        icon: 'i-lucide-loader-2',
      }
    }

    return {
      label: 'Ready',
      color: 'success' as const,
      icon: 'i-lucide-check-circle',
    }
  })

  // Actions
  /**
   * Initialize WASM module
   */
  async function initWasm() {
    if (wasmReady.value || isInitializing.value) {
      return
    }

    isInitializing.value = true
    wasmError.value = null

    const logsStore = useLogsStore()
    logsStore.add('Initializing WASM module...', 'info')

    try {
      if (typeof window === 'undefined') {
        throw new TypeError('Window is not defined')
      }

      // Wait for the WASM script to load if not already available
      if (typeof UltraHDRModule === 'undefined') {
        logsStore.add('Waiting for WASM script to load...', 'info')

        await new Promise<void>((resolve, reject) => {
          let attempts = 0
          const maxAttempts = 150 // 15 seconds (150 * 100ms)

          const checkInterval = setInterval(() => {
            attempts++

            if (typeof UltraHDRModule !== 'undefined') {
              clearInterval(checkInterval)
              logsStore.add(`WASM script loaded after ${attempts * 100}ms`, 'info')
              resolve()
              return
            }

            if (attempts >= maxAttempts) {
              clearInterval(checkInterval)

              // Check if script tag exists
              const scriptTag = document.querySelector('script[src="/ultrahdr_app.js"]')
              const errorMsg = scriptTag
                ? 'WASM script tag found but UltraHDRModule not initialized. The script might be failing to load.'
                : 'WASM script tag not found. Make sure ultrahdr_app.js is in the public directory.'

              logsStore.add(`✗ Timeout after ${attempts * 100}ms: ${errorMsg}`, 'error')
              reject(new Error(errorMsg))
            }
          }, 100)
        })
      }

      // Initialize the WASM module
      if (!UltraHDRModule) {
        throw new Error('UltraHDRModule is not available')
      }

      logsStore.add('Calling UltraHDRModule factory...', 'info')

      const Module = await UltraHDRModule({
        noInitialRun: true,
        print: (text: string) => console.log('[WASM]', text),
        printErr: (text: string) => console.error('[WASM]', text),
      })

      // Verify essential WASM methods
      if (!Module.FS) {
        throw new Error('WASM FS not available')
      }

      wasmModule.value = Module
      wasmReady.value = true
      logsStore.add('✓ WASM module initialized successfully', 'success')
    }
    catch (error) {
      const err = error as Error
      wasmError.value = err.message
      logsStore.add(`✗ WASM initialization failed: ${err.message}`, 'error')
      throw error
    }
    finally {
      isInitializing.value = false
    }
  }

  /**
   * Reset WASM state
   */
  function reset() {
    wasmModule.value = null
    wasmReady.value = false
    wasmError.value = null
    isInitializing.value = false
  }

  return {
    // State
    wasmModule,
    wasmReady,
    wasmError,
    isInitializing,
    // Getters
    statusBadge,
    // Actions
    initWasm,
    reset,
  }
})
