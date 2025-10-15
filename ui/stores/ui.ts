/**
 * UI Store
 * Manages UI state like visibility of logs, modals, etc.
 */

import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  // State
  const showLogs = ref(true)

  // Actions
  /**
   * Toggle logs visibility
   */
  function toggleLogs(): void {
    showLogs.value = !showLogs.value
  }

  /**
   * Set logs visibility
   */
  function setShowLogs(show: boolean): void {
    showLogs.value = show
  }

  return {
    // State
    showLogs,
    // Actions
    toggleLogs,
    setShowLogs,
  }
})
