<script setup lang="ts">
import type { ProcessingFile, StatusConfig } from '~/types'

interface Props {
  file: ProcessingFile
}

interface Emits {
  (e: 'remove'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

/**
 * Get step display info
 */
const stepInfo = computed(() => {
  if (!props.file.currentStep)
    return null

  const step = props.file.currentStep
  return {
    label: step.step === 'decode' ? 'Step 1/2: Decoding' : 'Step 2/2: Encoding',
    message: step.message,
    icon: step.step === 'decode' ? 'i-lucide-file-down' : 'i-lucide-file-up',
  }
})

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0)
    return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = (bytes / k ** i).toFixed(2)

  return `${size} ${sizes[i]}`
}

/**
 * Get status configuration based on file status
 */
const statusConfig = computed<StatusConfig>(() => {
  const configs: Record<ProcessingFile['status'], StatusConfig> = {
    pending: {
      color: 'neutral',
      icon: 'i-lucide-clock',
      label: 'Pending',
    },
    ready: {
      color: 'primary',
      icon: 'i-lucide-check',
      label: 'Ready',
    },
    processing: {
      color: 'warning',
      icon: 'i-lucide-loader-2',
      label: 'Processing',
    },
    completed: {
      color: 'success',
      icon: 'i-lucide-check-circle',
      label: 'Completed',
    },
    error: {
      color: 'error',
      icon: 'i-lucide-x-circle',
      label: 'Error',
    },
  }

  return configs[props.file.status]
})

/**
 * Handle remove button click
 */
function handleRemove(): void {
  emit('remove')
}

/**
 * Check if file is currently processing
 */
const isProcessing = computed(() => props.file.status === 'processing')

/**
 * File type display
 */
const fileTypeDisplay = computed(() => {
  return props.file.type || 'unknown'
})
</script>

<template>
  <UCard :ui="{ body: 'p-4' }" class="file-item transition-all duration-200 hover:shadow-md">
    <div class="flex items-center justify-between gap-4">
      <!-- File Info Section -->
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <!-- File Icon -->
        <div
          class="flex-shrink-0 text-2xl transition-transform duration-200"
          :class="{ 'animate-pulse': isProcessing }"
        >
          <UIcon name="i-lucide-file-image" />
        </div>

        <!-- File Details -->
        <div class="flex-1 min-w-0 space-y-1">
          <p class="font-medium text-gray-900 dark:text-gray-100 truncate" :title="file.name">
            {{ file.name }}
          </p>

          <!-- Processing Step Indicator -->
          <div v-if="stepInfo" class="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400">
            <UIcon :name="stepInfo.icon" class="animate-pulse" />
            <span class="font-medium">{{ stepInfo.label }}</span>
            <span class="text-gray-500 dark:text-gray-400">{{ stepInfo.message }}</span>
          </div>

          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{{ formatFileSize(file.size) }}</span>
            <span class="text-gray-300 dark:text-gray-600">•</span>
            <span>{{ fileTypeDisplay }}</span>
          </div>

          <!-- Progress Bar -->
          <div
            v-if="file.progress !== undefined && isProcessing"
            class="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-blue-500 transition-all duration-300"
              :style="{ width: `${file.progress}%` }"
            />
          </div>

          <!-- Error Message -->
          <p v-if="file.error" class="text-sm text-red-600 dark:text-red-400" role="alert">
            {{ file.error }}
          </p>
        </div>
      </div>

      <!-- Actions Section -->
      <div class="flex items-center gap-3 flex-shrink-0">
        <!-- Status Badge -->
        <UBadge :color="statusConfig.color" variant="subtle" class="transition-all duration-200">
          <UIcon :name="statusConfig.icon" class="mr-1" :class="{ 'animate-spin': isProcessing }" />
          {{ statusConfig.label }}
        </UBadge>

        <!-- Remove Button -->
        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          size="sm"
          :disabled="isProcessing"
          aria-label="Remove file"
          @click="handleRemove"
        />
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.file-item {
  transition: transform 0.2s ease;
}

.file-item:hover {
  transform: translateY(-1px);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
