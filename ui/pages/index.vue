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
  <div class="page-container h-screen flex flex-col overflow-hidden">
    <!-- Header Section -->
    <header class="page-header bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <PageHeader />
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-hidden flex flex-col lg:flex-row gap-0">
      <!-- Left Panel: Upload & Controls -->
      <aside class="lg:w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- File Upload Section -->
          <FileUploadSection v-model="fileInputValue" />

          <!-- File List Section -->
          <FileListSection />

          <!-- Actions Section -->
          <ActionsBar @process="handleProcess" />
        </div>
      </aside>

      <!-- Center Panel: Image Comparisons -->
      <section class="flex-1 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        <div class="h-full p-6">
          <!-- Image Comparisons Section -->
          <ComparisonSection />
        </div>
      </section>

      <!-- Right Panel: Logs -->
      <Transition
        name="logs-panel"
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-300 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside
          v-if="uiStore.showLogs"
          class="lg:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col"
        >
          <div class="flex-1 overflow-y-auto p-6">
            <ProcessingLogs />
          </div>
        </aside>
      </Transition>
    </main>

    <!-- Footer -->
    <footer class="page-footer bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-800">
      <PageFooter />
    </footer>
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

/* Panel transitions */
.logs-panel-enter-active,
.logs-panel-leave-active {
  transition: all 0.3s ease;
}

.logs-panel-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.logs-panel-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Scrollbar styling for panels */
aside::-webkit-scrollbar,
section::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

aside::-webkit-scrollbar-track,
section::-webkit-scrollbar-track {
  background: transparent;
}

aside::-webkit-scrollbar-thumb,
section::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}

aside::-webkit-scrollbar-thumb:hover,
section::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

/* Dark mode panel borders */
:deep(.dark) aside,
:deep(.dark) section {
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
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

/* Responsive: Stack panels on mobile */
@media (max-width: 1024px) {
  main {
    flex-direction: column;
  }

  aside {
    width: 100% !important;
    max-height: 40vh;
  }

  .logs-panel-enter-from,
  .logs-panel-leave-to {
    transform: translateY(100%);
  }
}
</style>
