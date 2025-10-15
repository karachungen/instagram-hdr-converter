/**
 * Logs Store
 * Manages application logs with centralized logging functionality
 */

import type { LogEntry, LogType } from '~/types'
import { defineStore } from 'pinia'

export const useLogsStore = defineStore('logs', () => {
  // State
  const logs = ref<LogEntry[]>([])

  // Getters
  /**
   * Get logs of a specific type
   */
  function getLogsByType(type: LogType): LogEntry[] {
    return logs.value.filter(log => log.type === type)
  }

  /**
   * Get logs count by type
   */
  function getCountByType(type: LogType): number {
    return logs.value.filter(log => log.type === type).length
  }

  // Actions
  /**
   * Add a new log entry
   */
  function add(message: string, type: LogType = 'info'): void {
    logs.value.push({
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date(),
      type,
      message,
    })
  }

  /**
   * Clear all logs
   */
  function clear(): void {
    logs.value = []
  }

  return {
    // State
    logs,
    // Getters
    getLogsByType,
    getCountByType,
    // Actions
    add,
    clear,
  }
})
