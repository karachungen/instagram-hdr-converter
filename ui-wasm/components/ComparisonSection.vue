<script setup lang="ts">
import { downloadAllImages } from '~/utils/download'

const filesStore = useFilesStore()
const toast = useToast()

/**
 * Handle download all images
 */
async function handleDownloadAll(): Promise<void> {
  try {
    await downloadAllImages(filesStore.completedFilesWithResults)
    toast.add({
      title: 'Success',
      description: `Downloaded ${filesStore.completedFilesWithResults.length} image(s) as ZIP`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  }
  catch (error) {
    console.error('Download all failed:', error)
    toast.add({
      title: 'Download Failed',
      description: error instanceof Error ? error.message : 'Failed to download images',
      color: 'error',
      icon: 'i-lucide-alert-circle',
    })
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header when images exist -->
    <div v-if="filesStore.completedFilesWithResults.length > 0" class="flex items-center justify-between mb-6">
      <h2 id="comparisons-heading" class="text-lg font-semibold flex items-center">
        <UIcon name="i-lucide-images" class="mr-2" />
        Converted Files
        <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
          ({{ filesStore.completedFilesWithResults.length }})
        </span>
      </h2>

      <!-- Download All Button -->
      <UButton
        icon="i-lucide-download"
        label="Download All"
        color="primary"
        variant="solid"
        size="md"
        :disabled="filesStore.completedFilesWithResults.length === 0"
        @click="handleDownloadAll"
      />
    </div>

    <!-- Comparison List -->
    <div v-if="filesStore.completedFilesWithResults.length > 0" class="flex-1 space-y-6 overflow-y-auto">
      <ImageComparison
        v-for="file in filesStore.completedFilesWithResults"
        :key="`comparison-${file.id}`"
        :file-name="file.name"
        :result="file.result!"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="h-full flex items-center justify-center">
      <div class="text-center max-w-md px-6">
        <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <UIcon name="i-lucide-image" class="text-5xl text-white" />
        </div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No Images Processed Yet
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          Upload HDR images and click "Process All Images" to see before/after comparisons here.
        </p>
        <div class="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <UIcon name="i-lucide-zap" class="text-lg" />
          <span>Powered by Google's libultrahdr WASM</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comparisons-section {
  animation: fadeIn 0.4s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
