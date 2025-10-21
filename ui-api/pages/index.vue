<script setup lang="ts">
const filesStore = useFilesStore()
const logsStore = useLogsStore()
const uiStore = useUiStore()

const logsExpanded = computed({
  get: () => uiStore.logsExpanded,
  set: (value) => {
    if (!value) {
      uiStore.toggleLogs()
    }
  },
})

// Initialize on mount
onMounted(() => {
  logsStore.add('Instagram HDR Converter initialized', 'success')
  logsStore.add('Upload AVIF files to convert to Instagram-compatible HDR JPEG', 'info')
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <PageHeader />

    <!-- Main Content - Full Width -->
    <div class="flex-1 flex">
      <!-- Left Panel: 30% - Upload & File List -->
      <div class="w-[30%] border-r border-gray-200 dark:border-gray-800 p-6 space-y-6 overflow-y-auto">
        <UCard>
          <FileUploadSection />
        </UCard>

        <FileListSection />
      </div>

      <!-- Right Panel: 70% - Comparisons -->
      <div class="flex-1 p-6 overflow-y-auto">
        <UCard class="h-full min-h-[600px]">
          <ComparisonSection />
        </UCard>
      </div>
    </div>

    <!-- Footer -->
    <PageFooter />

    <!-- Processing Logs Slideover -->
    <USlideover v-model:open="logsExpanded" side="bottom">
      <template #body>
        <ProcessingLogs />
      </template>
    </USlideover>
  </div>
</template>

<style scoped>
/* Page-specific styles */
</style>

