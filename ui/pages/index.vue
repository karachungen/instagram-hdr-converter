<script setup lang="ts">
import type { StatusConfig } from '~/types'

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
 * Handle file selection
 */
function handleFilesSelected(filesOrEvent: File[] | Event): void {
  let selectedFiles: FileList | File[] | null = null

  // Check if it's an array of files (from UFileUpload drag-and-drop)
  if (Array.isArray(filesOrEvent)) {
    selectedFiles = filesOrEvent
  }
  // Check if it's an Event (from input change)
  else if (filesOrEvent && 'target' in filesOrEvent) {
    const input = (filesOrEvent as Event).target as HTMLInputElement | null
    selectedFiles = input?.files || null
  }

  if (selectedFiles && selectedFiles.length > 0) {
    addFiles(selectedFiles)
    fileInputValue.value = []
  }
}

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
 * File statistics
 */
const fileStats = computed(() => ({
  total: files.value.length,
  ready: readyFilesCount.value,
  completed: completedFilesCount.value,
  errors: errorFilesCount.value,
}))

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
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3">
                <div
                  class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                >
                  <UIcon name="i-lucide-image" class="text-2xl text-white" />
                </div>
                <div>
                  <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Instagram HDR Converter
                  </h1>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Powered by Google's libultrahdr WebAssembly
                  </p>
                </div>
              </div>
            </div>

            <!-- Status Badge -->
            <UBadge
              :color="statusBadge.color"
              size="lg"
              variant="subtle"
              class="status-badge flex-shrink-0"
            >
              <UIcon
                :name="statusBadge.icon"
                class="mr-2"
                :class="{ 'animate-spin': !wasmReady && !wasmError }"
              />
              {{ statusBadge.label }}
            </UBadge>
          </div>

          <!-- Stats Bar -->
          <div v-if="showFileStats" class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="stat-card bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ fileStats.total }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Total Files
              </div>
            </div>

            <div class="stat-card bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ fileStats.ready }}
              </div>
              <div class="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Ready
              </div>
            </div>

            <div class="stat-card bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ fileStats.completed }}
              </div>
              <div class="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">
                Completed
              </div>
            </div>

            <div
              v-if="fileStats.errors > 0"
              class="stat-card bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
            >
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ fileStats.errors }}
              </div>
              <div class="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">
                Errors
              </div>
            </div>
          </div>
        </template>

        <!-- Body -->
        <div class="space-y-6">
          <!-- File Upload Section -->
          <section aria-labelledby="upload-heading">
            <h2 id="upload-heading" class="text-lg font-semibold mb-3 flex items-center">
              <UIcon name="i-lucide-folder-open" class="mr-2" />
              Upload Files
            </h2>

            <UFileUpload
              v-model="fileInputValue"
              icon="i-lucide-image"
              label="Drop your HDR images here"
              description="AVIF, HEIF, JPG - Multiple files supported"
              multiple
              accept="image/*"
              layout="grid"
              :disabled="isInitializing || !!wasmError"
              @change="handleFilesSelected"
            />
          </section>

          <!-- File List Section -->
          <section
            v-if="files.length > 0"
            aria-labelledby="files-heading"
            class="file-list-section"
          >
            <div class="flex items-center justify-between mb-3">
              <h2 id="files-heading" class="text-lg font-semibold flex items-center">
                <UIcon name="i-lucide-files" class="mr-2" />
                Files
                <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({{ files.length }})
                </span>
              </h2>

              <UButton
                label="Clear All"
                icon="i-lucide-trash-2"
                color="neutral"
                variant="outline"
                size="xs"
                :disabled="isProcessing"
                aria-label="Clear all files"
                @click="clearFiles"
              />
            </div>

            <!-- File List -->
            <div class="space-y-2 max-h-[400px] overflow-y-auto pr-2" role="list">
              <FileItem
                v-for="file in files"
                :key="file.id"
                :file="file"
                role="listitem"
                @remove="removeFile(file.id)"
              />
            </div>
          </section>

          <!-- Actions Section -->
          <section aria-label="Actions" class="actions-section">
            <div class="flex flex-col sm:flex-row gap-3">
              <UButton
                label="Process All Images"
                icon="i-lucide-play"
                color="primary"
                size="lg"
                class="flex-1"
                :disabled="!canProcess"
                :loading="isProcessing"
                @click="handleProcess"
              >
                <template #trailing>
                  <kbd
                    v-if="!isProcessing"
                    class="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                  >
                    ⌘P
                  </kbd>
                </template>
              </UButton>

              <UButton
                :label="showLogs ? 'Hide Logs' : 'Show Logs'"
                :icon="showLogs ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                color="neutral"
                variant="outline"
                size="lg"
                @click="toggleLogs"
              >
                <template #trailing>
                  <kbd
                    class="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
                  >
                    ⌘L
                  </kbd>
                </template>
              </UButton>
            </div>

            <!-- Help Text -->
            <p v-if="!wasmReady" class="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
              <UIcon name="i-lucide-loader-2" class="animate-spin inline mr-1" />
              Initializing WebAssembly module...
            </p>
          </section>

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
      <div class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        <p>All processing happens locally in your browser. Your images never leave your device.</p>
        <p class="mt-2 flex items-center justify-center gap-2">
          <UIcon name="i-lucide-shield-check" />
          <span>Private • Secure • Fast</span>
        </p>
      </div>
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

.stat-card {
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-badge {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.file-list-section {
  animation: fadeIn 0.3s ease-in;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
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
