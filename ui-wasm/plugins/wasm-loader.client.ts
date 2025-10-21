/**
 * WASM Loader Plugin
 * Ensures the WASM script is loaded before the app initializes
 */

export default defineNuxtPlugin({
  name: 'wasm-loader',
  parallel: false,
  async setup() {
    // Only run on client
    if (import.meta.server) {
      return
    }

    // Check if script is already loaded
    if (typeof UltraHDRModule !== 'undefined') {
      console.log('[WASM Loader] UltraHDRModule already available')
      return
    }

    console.log('[WASM Loader] Waiting for WASM script...')

    // Wait for the script to be available
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (typeof UltraHDRModule !== 'undefined') {
          console.log('[WASM Loader] UltraHDRModule found!')
          clearInterval(checkInterval)
          resolve()
        }
      }, 50)

      // Also listen for script load events
      const existingScript = document.querySelector('script[src="/ultrahdr_app.js"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          console.log('[WASM Loader] Script loaded event fired')
          clearInterval(checkInterval)
          resolve()
        }, { once: true })
      }

      // Fallback timeout - just continue even if not loaded
      setTimeout(() => {
        console.warn('[WASM Loader] Timeout waiting for script, continuing anyway')
        clearInterval(checkInterval)
        resolve()
      }, 5000)
    })
  },
})
