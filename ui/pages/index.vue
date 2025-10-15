<script setup lang="ts">
import type { StatusConfig } from '~/types'
import { downloadAllImages } from '~/utils/download'

// Meta tags for SEO
useHead({
  title: 'Instagram HDR Converter - libultrahdr WASM',
  meta: [
    {
      name: 'description',
      content:
        'Convert HDR images using Google\'s Ultra HDR library compiled to WebAssembly. Fast, secure, and private - all processing happens in your browser.',
    },
  ],
})

const toast = useToast()
const { initWasm, wasmModule, wasmReady, wasmError } = useWasm()
const {
  files,
  addFiles,
  removeFile,
  clearFiles,
  processAllFiles,
  isProcessing,
  readyFilesCount,
  completedFilesCount,
  errorFilesCount,
} = useFileProcessor()

const fileInputValue = ref<File[]>([])
const showLogs = ref(true)
const isInitializing = ref(false)

/**
 * Initialize WASM on mount
 */
onMounted(async () => {
  isInitializing.value = true
  await initWasm()
  isInitializing.value = false
})

/**
 * Watch fileInputValue and automatically add files
 */
watch(fileInputValue, (newFiles) => {
  console.log('[DEBUG] fileInputValue changed:', newFiles.length, 'files')
  if (newFiles && newFiles.length > 0) {
    console.log('[DEBUG] Adding files via watch')
    addFiles(newFiles)
    fileInputValue.value = []
  }
}, { deep: true })

/**
 * Watch for WASM readiness
 */
watch(wasmReady, (ready) => {
  if (ready) {
    toast.add({
      title: 'WASM Module Ready',
      description: 'Ready to process HDR images!',
      icon: 'i-lucide-check-circle',
      color: 'success',
    })
  }
})

/**
 * Watch for WASM errors
 */
watch(wasmError, (error) => {
  if (error) {
    toast.add({
      title: 'WASM Module Error',
      description: error,
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  }
})

/**
 * Process files
 */
async function handleProcess(): Promise<void> {
  if (!wasmModule.value) {
    toast.add({
      title: 'WASM Not Ready',
      description: 'Please wait for WASM module to initialize',
      icon: 'i-lucide-alert-circle',
      color: 'warning',
    })
    return
  }

  await processAllFiles(wasmModule.value, toast)
}

/**
 * Status badge configuration
 */
const statusBadge = computed<StatusConfig>(() => {
  if (wasmError.value) {
    return {
      label: 'Error',
      color: 'error',
      icon: 'i-lucide-x-circle',
    }
  }

  if (!wasmReady.value) {
    return {
      label: 'Loading...',
      color: 'warning',
      icon: 'i-lucide-loader-2',
    }
  }

  return {
    label: 'Ready',
    color: 'success',
    icon: 'i-lucide-check-circle',
  }
})

/**
 * Check if ready to process
 */
const canProcess = computed(() => {
  return files.value.length > 0 && wasmReady.value && !isProcessing.value
})

/**
 * Toggle logs visibility
 */
function toggleLogs(): void {
  showLogs.value = !showLogs.value
}

/**
 * Download all processed images as ZIP
 */
async function handleDownloadAll(): Promise<void> {
  try {
    await downloadAllImages(files.value)
    toast.add({
      title: 'Download Started',
      description: `Downloading ${completedFilesCount.value} processed image(s) as ZIP`,
      icon: 'i-lucide-download',
      color: 'success',
    })
  }
  catch (error) {
    toast.add({
      title: 'Download Failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  }
}

/**
 * File statistics
 */
const fileStats = computed(() => ({
  total: files.value.length,
  ready: readyFilesCount.value,
  completed: completedFilesCount.value,
  errors: errorFilesCount.value,
}))

/**
 * Get completed files with results for comparison
 */
const completedFilesWithResults = computed(() => {
  return files.value.filter(f => f.status === 'completed' && f.result)
})

/**
 * Show file stats badge
 */
const showFileStats = computed(() => fileStats.value.total > 0)

/**
 * Keyboard shortcuts
 */
function handleKeyPress(event: KeyboardEvent): void {
  // Cmd/Ctrl + P to process
  if ((event.metaKey || event.ctrlKey) && event.key === 'p' && canProcess.value) {
    event.preventDefault()
    handleProcess()
  }

  // Cmd/Ctrl + L to toggle logs
  if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
    event.preventDefault()
    toggleLogs()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<template>
  <div class="page-container min-h-screen flex items-center justify-center p-4 sm:p-6">
    <div class="w-full max-w-5xl">
      <!-- Main Card -->
      <UCard
        class="main-card bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-2xl"
        :ui="{
          body: 'space-y-6 p-6 sm:p-8',
          header: 'p-6 sm:p-8',
        }"
      >
        <!-- Header -->
        <template #header>
          <PageHeader
            :status-badge="statusBadge"
            :wasm-ready="wasmReady"
            :wasm-error="wasmError"
          />

          <!-- Stats Bar -->
          <StatsBar :stats="fileStats" :show="showFileStats" />
        </template>

        <!-- Body -->
        <div class="space-y-6">
          <!-- File Upload Section -->
          <FileUploadSection
            v-model="fileInputValue"
            :is-initializing="isInitializing"
            :wasm-error="wasmError"
          />

          <!-- File List Section -->
          <FileListSection
            :files="files"
            :is-processing="isProcessing"
            @remove="removeFile"
            @clear-all="clearFiles"
          />

          <!-- Image Comparisons Section -->
          <ComparisonSection :completed-files="completedFilesWithResults" />

          <!-- Actions Section -->
          <ActionsBar
            :can-process="canProcess"
            :is-processing="isProcessing"
            :show-logs="showLogs"
            :wasm-ready="wasmReady"
            :completed-files-count="completedFilesCount"
            @process="handleProcess"
            @toggle-logs="toggleLogs"
            @download-all="handleDownloadAll"
          />

          <!-- Processing Logs Section -->
          <Transition
            name="logs"
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 transform translate-y-4"
            enter-to-class="opacity-100 transform translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 transform translate-y-0"
            leave-to-class="opacity-0 transform translate-y-4"
          >
            <section v-if="showLogs" aria-labelledby="logs-heading">
              <ProcessingLogs />
            </section>
          </Transition>
        </div>
      </UCard>

      <!-- Footer Info -->
      <PageFooter />
    </div>
  </div>
</template>

<style scoped>
.page-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  animation: gradientShift 15s ease infinite;
  background-size: 200% 200%;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.main-card {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Dark mode adjustments */
:deep(.dark) .main-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Transitions */
.logs-enter-active,
.logs-leave-active {
  transition: all 0.3s ease;
}

.logs-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.logs-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .page-container {
    padding: 1rem;
  }
}
</style>
