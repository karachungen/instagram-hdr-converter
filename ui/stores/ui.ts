/**
 * UI Store
 * Manages UI state like visibility of logs, modals, etc.
 */

import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  // State
  const showLogs = ref(false) // Hidden by default
  const logsOpen = ref(false) // For collapsible logs panel

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

  /**
   * Toggle logs panel collapsible state
   */
  function toggleLogsPanel(): void {
    logsOpen.value = !logsOpen.value
  }

  /**
   * Set logs panel open state
   */
  function setLogsPanelOpen(open: boolean): void {
    logsOpen.value = open
  }

  return {
    // State
    showLogs,
    logsOpen,
    // Actions
    toggleLogs,
    setShowLogs,
    toggleLogsPanel,
    setLogsPanelOpen,
  }
})
