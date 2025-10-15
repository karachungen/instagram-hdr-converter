import type { LogEntry, LogType } from '~/types'

/**
 * Composable for managing application logs
 * Provides centralized logging functionality with automatic timestamps
 */
export function useLogs() {
  const logs = useState<LogEntry[]>('logs', () => [])

  /**
   * Add a new log entry
   * @param message - The log message
   * @param type - The log type (info, success, error, warning)
   */
  const add = (message: string, type: LogType = 'info'): void => {
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
  const clear = (): void => {
    logs.value = []
  }

  /**
   * Get logs of a specific type
   */
  const getLogsByType = (type: LogType): LogEntry[] => {
    return logs.value.filter((log: LogEntry) => log.type === type)
  }

  /**
   * Get logs count by type
   */
  const getCountByType = (type: LogType): number => {
    return logs.value.filter((log: LogEntry) => log.type === type).length
  }

  return {
    logs: readonly(logs),
    add,
    clear,
    getLogsByType,
    getCountByType,
  }
}
