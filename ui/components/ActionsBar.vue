<script setup lang="ts">
interface Emits {
  (e: 'process'): void
  (e: 'downloadAll'): void
}

const emit = defineEmits<Emits>()

// Stores
const wasmStore = useWasmStore()
const filesStore = useFilesStore()
const uiStore = useUiStore()

function handleProcess(): void {
  emit('process')
}

function handleDownloadAll(): void {
  emit('downloadAll')
}

function handleToggleLogs(): void {
  uiStore.toggleLogs()
}
</script>

<template>
  <section aria-label="Actions" class="actions-section">
    <div class="flex flex-col sm:flex-row gap-3">
      <UButton
        label="Process All Images"
        icon="i-lucide-play"
        color="primary"
        size="lg"
        class="flex-1"
        :disabled="!filesStore.canProcess"
        :loading="filesStore.isProcessing"
        @click="handleProcess"
      >
        <template #trailing>
          <kbd
            v-if="!filesStore.isProcessing"
            class="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded"
          >
            ⌘P
          </kbd>
        </template>
      </UButton>

      <UButton
        label="Download All"
        icon="i-lucide-download"
        color="success"
        variant="outline"
        size="lg"
        :disabled="filesStore.completedFilesCount === 0"
        @click="handleDownloadAll"
      >
        <template #trailing>
          <UBadge v-if="filesStore.completedFilesCount > 0" color="success" variant="solid" size="xs">
            {{ filesStore.completedFilesCount }}
          </UBadge>
        </template>
      </UButton>

      <UButton
        :label="uiStore.showLogs ? 'Hide Logs' : 'Show Logs'"
        :icon="uiStore.showLogs ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        color="neutral"
        variant="outline"
        size="lg"
        @click="handleToggleLogs"
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
    <p v-if="!wasmStore.wasmReady" class="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
      <UIcon name="i-lucide-loader-2" class="animate-spin inline mr-1" />
      Initializing WebAssembly module...
    </p>
  </section>
</template>
