<script setup lang="ts">
import type { StatusConfig } from '~/types'

interface Props {
  statusBadge: StatusConfig
  wasmReady: boolean
  wasmError: string | null
}

defineProps<Props>()
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

    <!-- Status Badge -->
    <UBadge
      :color="statusBadge.color"
      size="lg"
      variant="subtle"
      class="status-badge flex-shrink-0"
    >
      <UIcon
        :name="statusBadge.icon"
        class="mr-2"
        :class="{ 'animate-spin': !wasmReady && !wasmError }"
      />
      {{ statusBadge.label }}
    </UBadge>
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
