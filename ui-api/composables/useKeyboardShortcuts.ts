/**
 * Composable for keyboard shortcuts management
 */

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description: string
}

export function useKeyboardShortcuts() {
  const shortcuts = ref<KeyboardShortcut[]>([])
  const isEnabled = ref(true)

  /**
   * Register a keyboard shortcut
   */
  const register = (shortcut: KeyboardShortcut): void => {
    shortcuts.value.push(shortcut)
  }

  /**
   * Unregister a keyboard shortcut
   */
  const unregister = (key: string): void => {
    const index = shortcuts.value.findIndex((s: KeyboardShortcut) => s.key === key)
    if (index !== -1) {
      shortcuts.value.splice(index, 1)
    }
  }

  /**
   * Handle keydown event
   */
  const handleKeydown = (event: KeyboardEvent): void => {
    if (!isEnabled.value)
      return

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    shortcuts.value.forEach((shortcut: KeyboardShortcut) => {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesCtrl = shortcut.ctrl ? event.ctrlKey : true
      const matchesMeta = shortcut.meta ? event.metaKey : true
      const matchesShift = shortcut.shift ? event.shiftKey : true
      const matchesAlt = shortcut.alt ? event.altKey : true

      if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
        event.preventDefault()
        shortcut.handler()
      }
    })
  }

  /**
   * Enable shortcuts
   */
  const enable = (): void => {
    isEnabled.value = true
  }

  /**
   * Disable shortcuts
   */
  const disable = (): void => {
    isEnabled.value = false
  }

  /**
   * Get formatted shortcut key
   */
  const getFormattedKey = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = []

    if (shortcut.ctrl)
      parts.push('Ctrl')
    if (shortcut.meta)
      parts.push('⌘')
    if (shortcut.alt)
      parts.push('Alt')
    if (shortcut.shift)
      parts.push('Shift')
    parts.push(shortcut.key.toUpperCase())

    return parts.join('+')
  }

  // Setup and cleanup
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    shortcuts: readonly(shortcuts),
    isEnabled: readonly(isEnabled),
    register,
    unregister,
    enable,
    disable,
    getFormattedKey,
  }
}
