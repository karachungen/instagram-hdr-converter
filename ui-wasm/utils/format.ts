/**
 * Utility functions for formatting data
 */

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = Number.parseFloat((bytes / k ** i).toFixed(dm))

  return `${size} ${sizes[i]}`
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000)
    return `${ms}ms`
  if (ms < 60000)
    return `${(ms / 1000).toFixed(2)}s`
  if (ms < 3600000)
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

/**
 * Format date to relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0)
    return `${days}d ago`
  if (hours > 0)
    return `${hours}h ago`
  if (minutes > 0)
    return `${minutes}m ago`
  if (seconds > 0)
    return `${seconds}s ago`
  return 'just now'
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (str.length <= length)
    return str
  return str.substring(0, length - suffix.length) + suffix
}
