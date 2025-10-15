<script setup lang="ts">
const filesStore = useFilesStore()
</script>

<template>
  <section
    v-if="filesStore.completedFilesWithResults.length > 0"
    aria-labelledby="comparisons-heading"
    class="comparisons-section"
  >
    <div class="flex items-center justify-between mb-4">
      <h2 id="comparisons-heading" class="text-lg font-semibold flex items-center">
        <UIcon name="i-lucide-images" class="mr-2" />
        Before & After Comparison
        <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
          ({{ filesStore.completedFilesWithResults.length }})
        </span>
      </h2>
    </div>

    <!-- Comparison List -->
    <div class="space-y-6">
      <ImageComparison
        v-for="file in filesStore.completedFilesWithResults"
        :key="`comparison-${file.id}`"
        :file-name="file.name"
        :result="file.result!"
      />
    </div>
  </section>
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
