<script setup lang="ts">
const filesStore = useFilesStore()
const toast = useToast()
const { removeFile, clearFiles, processAllFiles } = useFileProcessor()

function handleRemove(fileId: string): void {
  removeFile(fileId)
}

function handleClearAll(): void {
  clearFiles()
}

async function handleProcessAll(): Promise<void> {
  await processAllFiles(toast)
}
</script>

<template>
  <UCard v-if="filesStore.files.length > 0" class="file-list-section">
    <div class="space-y-4 mb-4">
      <div class="flex items-center justify-between">
        <h2 id="files-heading" class="text-lg font-semibold flex items-center">
          <UIcon name="i-lucide-files" class="mr-2" />
          Files
          <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
            ({{ filesStore.files.length }})
          </span>
        </h2>

        <UButton label="Clear All" icon="i-lucide-trash-2" color="neutral" variant="outline" size="xs"
          :disabled="filesStore.isProcessing" aria-label="Clear all files" @click="handleClearAll" />
      </div>

      <!-- Process All Button -->
      <UButton label="Process All Images" icon="i-lucide-play" :loading="filesStore.isProcessing"
        :disabled="filesStore.files.length === 0 || filesStore.isProcessing" color="primary" variant="solid" size="xl"
        block @click="handleProcessAll">
        <template v-if="filesStore.isProcessing" #trailing>
          <span class="text-xs ml-2">
            {{ filesStore.processingCount }}/{{ filesStore.files.length }}
          </span>
        </template>
      </UButton>
    </div>

    <!-- File List -->
    <div class="space-y-2 max-h-[400px] overflow-y-auto pr-2" role="list">
      <FileItem v-for="file in filesStore.files" :key="file.id" :file="file" role="listitem"
        @remove="handleRemove(file.id)" />
    </div>
  </UCard>

  <!-- Export Instructions - Always visible -->
  <UCard class="mt-4">
    <div class="flex items-center gap-2 mb-4">
      <UIcon name="i-lucide-book-open" class="text-primary" />
      <h3 class="font-semibold text-base">Export Instructions (Lightroom → HDR JPEG)</h3>
    </div>

    <div class="space-y-4 text-sm">
      <UAlert color="warning" variant="subtle" icon="i-lucide-alert-triangle" title="SDR vs HDR on export"
        description="The SDR version can match the Lightroom preview; the HDR view may look brighter than the preview in some cases." />

      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <UBadge color="warning" variant="solid" size="lg" class="mt-0.5">1</UBadge>
          <div class="flex-1">
            <p class="font-medium mb-2">Export from Lightroom</p>
            <ul class="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="text-green-500" />
                <span><strong>Format:</strong> JPEG</span>
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="text-green-500" />
                <span><strong>Enable HDR Output</strong> ✅</span>
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-check" class="text-green-500" />
                <span><strong>Color Space:</strong> sRGB (not HDR sRGB)</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <UBadge color="warning" variant="solid" size="lg" class="mt-0.5">2</UBadge>
          <div class="flex-1">
            <p class="font-medium mb-1">Upload and process</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Upload your HDR JPEG files above and click "Process All Images"
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <UBadge color="warning" variant="solid" size="lg" class="mt-0.5">3</UBadge>
          <div class="flex-1">
            <p class="font-medium mb-1">Download results</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Download your Instagram-compatible HDR JPEGs from the comparison view
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>

  <!-- Instagram Upload Instructions -->
  <UCard class="mt-4">
    <div class="flex items-center gap-2 mb-4">
      <UIcon name="i-lucide-upload" class="text-pink-500" />
      <h3 class="font-semibold text-base">Upload to Instagram</h3>
    </div>

    <div class="space-y-3 text-sm">
      <p class="text-gray-700 dark:text-gray-300">
        Upload the converted <code
          class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">image-hdr_iso.jpg</code> through
        Instagram's website:
      </p>

      <ul class="space-y-2 text-gray-600 dark:text-gray-400">
        <li class="flex items-start gap-2">
          <UIcon name="i-lucide-image" class="mt-0.5 shrink-0" />
          <span><strong>Select Original Ratio</strong> - don't crop the photo</span>
        </li>
        <li class="flex items-start gap-2">
          <UIcon name="i-lucide-maximize" class="mt-0.5 shrink-0" />
          <div>
            <strong>Keep within Instagram's supported sizes:</strong>
            <ul class="mt-1 ml-4 space-y-0.5 text-xs">
              <li>• Square (1:1): 1080 × 1080 px</li>
              <li>• Landscape (1.91:1): 1080 × 566 px</li>
              <li>• Portrait (4:5): 1080 × 1350 px</li>
            </ul>
          </div>
        </li>
        <li class="flex items-start gap-2">
          <UIcon name="i-lucide-sparkles" class="mt-0.5 shrink-0" />
          <span><strong>Don't apply filters</strong> or corrections</span>
        </li>
      </ul>

      <UAlert color="info" variant="soft" icon="i-lucide-info" class="mt-3">
        <template #description>
          <span class="text-xs">Preview shows as SDR during upload, but will display as HDR after completion</span>
        </template>
      </UAlert>
    </div>
  </UCard>
</template>

<style scoped>
.file-list-section {
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
</style>
