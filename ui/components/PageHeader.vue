<script setup lang="ts">
const wasmStore = useWasmStore()
const uiStore = useUiStore()
const logsStore = useLogsStore()

const logCount = computed(() => logsStore.logs.length)
</script>

<template>
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div class="flex-1">
      <div class="flex items-center gap-3">
        <div
          class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
        >
          <UIcon name="i-lucide-image" class="text-2xl text-white" />
        </div>
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Instagram HDR Converter
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Powered by Google's libultrahdr WebAssembly
          </p>
        </div>
      </div>
    </div>

    <!-- Right side: Status Badge & Logs Toggle -->
    <div class="flex items-center gap-3 flex-shrink-0">
      <!-- Status Badge -->
      <UBadge
        :color="(wasmStore.statusBadge.color as any)"
        size="lg"
        variant="subtle"
        class="status-badge"
      >
        <UIcon
          :name="wasmStore.statusBadge.icon"
          class="mr-2"
          :class="{ 'animate-spin': !wasmStore.wasmReady && !wasmStore.wasmError }"
        />
        {{ wasmStore.statusBadge.label }}
      </UBadge>

      <!-- Logs Toggle Button -->
      <UButton
        :icon="uiStore.showLogs ? 'i-lucide-panel-right-close' : 'i-lucide-panel-right-open'"
        :label="uiStore.showLogs ? 'Hide Logs' : 'Show Logs'"
        color="neutral"
        variant="outline"
        size="md"
        @click="uiStore.toggleLogs"
      >
        <template v-if="logCount > 0" #trailing>
          <UBadge color="primary" size="xs">
            {{ logCount }}
          </UBadge>
        </template>
      </UButton>
    </div>
  </div>
</template>

<style scoped>
.status-badge {
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
</style>
