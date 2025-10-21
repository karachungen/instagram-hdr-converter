import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: false,
    theme: 'auto' as 'light' | 'dark' | 'auto',
    logsExpanded: false,
  }),

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setSidebarCollapsed(value: boolean) {
      this.sidebarCollapsed = value
    },

    setTheme(theme: 'light' | 'dark' | 'auto') {
      this.theme = theme
    },

    toggleLogs() {
      this.logsExpanded = !this.logsExpanded
    },
  },
})

