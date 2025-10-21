<script setup lang="ts">
import type { LogLevel } from '~/types'

const logsStore = useLogsStore()
const logsContainer = ref<HTMLDivElement | null>(null)

/**
 * Auto-scroll to bottom when new logs are added
 */
watch(
  () => logsStore.logs.length,
  () => {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    })
  },
)

/**
 * Get color class based on log level
 */
function getLogColor(level: LogLevel): string {
  const colors: Record<LogLevel, string> = {
    info: 'text-blue-400',
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
  }

  return colors[level]
}

/**
 * Get icon for log level
 */
function getLogIcon(level: LogLevel): string {
  const icons: Record<LogLevel, string> = {
    info: 'i-lucide-info',
    success: 'i-lucide-check-circle-2',
    error: 'i-lucide-alert-circle',
    warning: 'i-lucide-alert-triangle',
  }

  return icons[level]
}

/**
 * Format timestamp
 */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * Handle clear logs
 */
function handleClear(): void {
  logsStore.clear()
}

/**
 * Check if logs container is scrolled to bottom
 */
const isScrolledToBottom = ref(true)

/**
 * Handle scroll event
 */
function handleScroll(): void {
  if (!logsContainer.value)
    return

  const { scrollTop, scrollHeight, clientHeight } = logsContainer.value
  isScrolledToBottom.value = scrollHeight - scrollTop - clientHeight < 50
}

/**
 * Scroll to bottom
 */
function scrollToBottom(): void {
  if (logsContainer.value) {
    logsContainer.value.scrollTop = logsContainer.value.scrollHeight
  }
}

/**
 * Has logs
 */
const hasLogs = computed(() => logsStore.logs.length > 0)

/**
 * Log stats
 */
const logStats = computed(() => {
  const stats = {
    total: logsStore.logs.length,
    info: 0,
    success: 0,
    error: 0,
    warning: 0,
  }

  logsStore.logs.forEach((log: any) => {
    if (log.level in stats) {
      stats[log.level as keyof typeof stats]++
    }
  })

  return stats
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-semibold flex items-center">
          <UIcon name="i-lucide-terminal" class="mr-2" />
          Processing Logs
        </h2>

        <!-- Log Stats -->
        <div v-if="hasLogs" class="flex items-center gap-2 text-xs">
          <UBadge v-if="logStats.error > 0" color="error" size="sm">
            {{ logStats.error }} errors
          </UBadge>
          <UBadge v-if="logStats.warning > 0" color="warning" size="sm">
            {{ logStats.warning }} warnings
          </UBadge>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <UButton
          v-if="hasLogs && !isScrolledToBottom"
          icon="i-lucide-arrow-down"
          color="gray"
          variant="ghost"
          size="xs"
          aria-label="Scroll to bottom"
          @click="scrollToBottom"
        />

        <UButton
          v-if="hasLogs"
          label="Clear"
          icon="i-lucide-trash-2"
          color="gray"
          variant="ghost"
          size="xs"
          aria-label="Clear logs"
          @click="handleClear"
        />
      </div>
    </div>

    <!-- Logs Container -->
    <div
      ref="logsContainer"
      class="logs-container flex-1 bg-gray-900 dark:bg-gray-950 rounded-lg p-4 font-mono text-sm overflow-y-auto"
      @scroll="handleScroll"
    >
      <!-- Empty State -->
      <div v-if="!hasLogs" class="empty-state text-gray-500 text-center py-8">
        <UIcon name="i-lucide-file-text" class="text-4xl mb-2 opacity-50" />
        <p>No logs yet.</p>
        <p class="text-xs mt-1">
          Upload and process files to see activity here.
        </p>
      </div>

      <!-- Log Entries -->
      <div
        v-for="log in logsStore.logs"
        :key="log.id"
        class="log-entry mb-1 flex items-start gap-2 transition-opacity duration-200"
        :class="getLogColor(log.level)"
      >
        <UIcon :name="getLogIcon(log.level)" class="flex-shrink-0 mt-0.5" />
        <span class="text-gray-500 flex-shrink-0"> [{{ formatTime(log.timestamp) }}] </span>
        <span class="flex-1">{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.logs-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.logs-container::-webkit-scrollbar {
  width: 8px;
}

.logs-container::-webkit-scrollbar-track {
  background: transparent;
}

.logs-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}

.logs-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

.log-entry {
  line-height: 1.5;
  animation: fadeIn 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-state {
  user-select: none;
}
</style>
