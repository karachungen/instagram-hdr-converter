<script setup lang="ts">
const filesStore = useFilesStore()

function handleRemove(fileId: string): void {
  filesStore.removeFile(fileId)
}

function handleClearAll(): void {
  filesStore.clearFiles()
}
</script>

<template>
  <section
    v-if="filesStore.files.length > 0"
    aria-labelledby="files-heading"
    class="file-list-section"
  >
    <div class="flex items-center justify-between mb-3">
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
        color="neutral"
        variant="outline"
        size="xs"
        :disabled="filesStore.isProcessing"
        aria-label="Clear all files"
        @click="handleClearAll"
      />
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
  </section>
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
