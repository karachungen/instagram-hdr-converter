import { defineStore } from 'pinia'
import type { LogEntry, LogLevel } from '~/types'

export const useLogsStore = defineStore('logs', {
  state: () => ({
    logs: [] as LogEntry[],
    maxLogs: 1000, // Limit log entries to prevent memory issues
  }),

  getters: {
    recentLogs: (state) => state.logs.slice(-100), // Last 100 logs
    errorLogs: (state) => state.logs.filter(log => log.level === 'error'),
    warningLogs: (state) => state.logs.filter(log => log.level === 'warning'),
  },

  actions: {
    add(message: string, level: LogLevel = 'info') {
      const entry: LogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        timestamp: new Date(),
        message,
        level,
      }

      this.logs.push(entry)

      // Keep only the most recent logs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(-this.maxLogs)
      }

      // Also log to console for debugging
      const prefix = `[${level.toUpperCase()}]`
      switch (level) {
        case 'error':
          console.error(prefix, message)
          break
        case 'warning':
          console.warn(prefix, message)
          break
        case 'success':
          console.log(prefix, message)
          break
        default:
          console.log(prefix, message)
      }
    },

    clear() {
      this.logs = []
    },

    removeOldLogs(beforeDate: Date) {
      this.logs = this.logs.filter(log => log.timestamp >= beforeDate)
    },
  },
})

