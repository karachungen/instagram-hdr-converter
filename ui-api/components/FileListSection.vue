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
  <UCard
    v-if="filesStore.files.length > 0"
    class="file-list-section"
  >
    <div class="space-y-4 mb-4">
      <div class="flex items-center justify-between">
        <h2 id="files-heading" class="text-lg font-semibold flex items-center">
          <UIcon name="i-lucide-files" class="mr-2" />
          Files
          <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
            ({{ filesStore.files.length }})
          </span>
        </h2>

        <UButton
          label="Clear All"
          icon="i-lucide-trash-2"
          color="gray"
          variant="outline"
          size="xs"
          :disabled="filesStore.isProcessing"
          aria-label="Clear all files"
          @click="handleClearAll"
        />
      </div>

      <!-- Process All Button -->
      <UButton
        label="Process All Images"
        icon="i-lucide-play"
        :loading="filesStore.isProcessing"
        :disabled="filesStore.files.length === 0 || filesStore.isProcessing"
        color="primary"
        variant="solid"
        size="lg"
        block
        @click="handleProcessAll"
      >
        <template v-if="filesStore.isProcessing" #trailing>
          <span class="text-xs ml-2">
            {{ filesStore.processingCount }}/{{ filesStore.files.length }}
          </span>
        </template>
      </UButton>
    </div>

    <!-- File List -->
    <div class="space-y-2 max-h-[400px] overflow-y-auto pr-2" role="list">
      <FileItem
        v-for="file in filesStore.files"
        :key="file.id"
        :file="file"
        role="listitem"
        @remove="handleRemove(file.id)"
      />
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
