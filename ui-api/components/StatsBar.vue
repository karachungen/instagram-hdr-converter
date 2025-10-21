<script setup lang="ts">
const filesStore = useFilesStore()
</script>

<template>
  <div v-if="filesStore.files.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="stat-card bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      <div class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ filesStore.files.length }}
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        Total Files
      </div>
    </div>

    <div class="stat-card bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
      <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
        {{ filesStore.readyCount }}
      </div>
      <div class="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
        Ready
      </div>
    </div>

    <div class="stat-card bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
      <div class="text-2xl font-bold text-green-600 dark:text-green-400">
        {{ filesStore.completedCount }}
      </div>
      <div class="text-xs text-green-600 dark:text-green-400 uppercase tracking-wide">
        Completed
      </div>
    </div>

    <div
      v-if="filesStore.errorCount > 0"
      class="stat-card bg-red-50 dark:bg-red-900/20 rounded-lg p-3"
    >
      <div class="text-2xl font-bold text-red-600 dark:text-red-400">
        {{ filesStore.errorCount }}
      </div>
      <div class="text-xs text-red-600 dark:text-red-400 uppercase tracking-wide">
        Errors
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
