import { defineStore } from 'pinia'
import type { ProcessingFile } from '~/types'

export const useFilesStore = defineStore('files', {
  state: () => ({
    files: [] as ProcessingFile[],
    isProcessing: false,
  }),

  getters: {
    pendingFiles: (state) => state.files.filter(f => f.status === 'pending'),
    readyFiles: (state) => state.files.filter(f => f.status === 'ready'),
    processingFiles: (state) => state.files.filter(f => f.status === 'processing'),
    completedFiles: (state) => state.files.filter(f => f.status === 'completed'),
    errorFiles: (state) => state.files.filter(f => f.status === 'error'),

    pendingCount: (state) => state.files.filter(f => f.status === 'pending').length,
    readyCount: (state) => state.files.filter(f => f.status === 'ready').length,
    processingCount: (state) => state.files.filter(f => f.status === 'processing').length,
    completedCount: (state) => state.files.filter(f => f.status === 'completed').length,
    errorCount: (state) => state.files.filter(f => f.status === 'error').length,
  },

  actions: {
    addFile(file: ProcessingFile) {
      this.files.push(file)
    },

    removeFile(fileId: string) {
      const index = this.files.findIndex(f => f.id === fileId)
      if (index !== -1) {
        this.files.splice(index, 1)
      }
    },

    updateFile(fileId: string, updates: Partial<ProcessingFile>) {
      const file = this.files.find(f => f.id === fileId)
      if (file) {
        Object.assign(file, updates)
      }
    },

    clearFiles() {
      this.files = []
    },

    setProcessing(value: boolean) {
      this.isProcessing = value
    },
  },
})

