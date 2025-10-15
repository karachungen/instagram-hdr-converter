<script setup lang="ts">
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

// Stores
const toast = useToast()
const wasmStore = useWasmStore()
const filesStore = useFilesStore()
const uiStore = useUiStore()

const fileInputValue = ref<File[]>([])

/**
 * Initialize WASM on mount
 */
onMounted(async () => {
  // Wait a tick to ensure DOM and scripts are ready
  await nextTick()

  // If document is still loading, wait for it
  if (document.readyState === 'loading') {
    await new Promise<void>((resolve) => {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
    })
  }

  await wasmStore.initWasm()
})

/**
 * Watch fileInputValue and automatically add files
 */
watch(fileInputValue, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    filesStore.addFiles(newFiles)
    fileInputValue.value = []
  }
}, { deep: true })

/**
 * Watch for WASM readiness
 */
watch(() => wasmStore.wasmReady, (ready) => {
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
watch(() => wasmStore.wasmError, (error) => {
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
  if (!wasmStore.wasmModule) {
    toast.add({
      title: 'WASM Not Ready',
      description: 'Please wait for WASM module to initialize',
      icon: 'i-lucide-alert-circle',
      color: 'warning',
    })
    return
  }

  const result = await filesStore.processAllFiles()

  toast.add({
    title: 'Processing Complete',
    description: `${result.successCount} files processed successfully${result.errorCount > 0 ? `, ${result.errorCount} errors` : ''}`,
    icon: 'i-lucide-check-circle',
    color: result.errorCount > 0 ? 'warning' : 'success',
  })
}

/**
 * Download all processed images as ZIP
 */
async function handleDownloadAll(): Promise<void> {
  try {
    await filesStore.downloadAll()
    toast.add({
      title: 'Download Started',
      description: `Downloading ${filesStore.completedFilesCount} processed image(s) as ZIP`,
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
 * Keyboard shortcuts
 */
function handleKeyPress(event: KeyboardEvent): void {
  // Cmd/Ctrl + P to process
  if ((event.metaKey || event.ctrlKey) && event.key === 'p' && filesStore.canProcess) {
    event.preventDefault()
    handleProcess()
  }

  // Cmd/Ctrl + L to toggle logs
  if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
    event.preventDefault()
    uiStore.toggleLogs()
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
          <PageHeader />

          <!-- Stats Bar -->
          <StatsBar />
        </template>

        <!-- Body -->
        <div class="space-y-6">
          <!-- File Upload Section -->
          <FileUploadSection v-model="fileInputValue" />

          <!-- File List Section -->
          <FileListSection />

          <!-- Image Comparisons Section -->
          <ComparisonSection />

          <!-- Actions Section -->
          <ActionsBar
            @process="handleProcess"
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
            <section v-if="uiStore.showLogs" aria-labelledby="logs-heading">
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
