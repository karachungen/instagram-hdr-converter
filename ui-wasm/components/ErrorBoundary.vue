<script setup lang="ts">
interface Props {
  fallback?: boolean
}

withDefaults(defineProps<Props>(), {
  fallback: true,
})

const error = ref<Error | null>(null)
const hasError = computed(() => error.value !== null)

function handleError(err: Error): void {
  error.value = err
  console.error('ErrorBoundary caught:', err)
}

function reset(): void {
  error.value = null
}

function reloadPage(): void {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

// Error handler setup
onErrorCaptured((err: Error) => {
  handleError(err)
  return false // Prevent error from propagating
})

// Global error handler
function handleWindowError(event: ErrorEvent): void {
  handleError(event.error || new Error(event.message))
}

onMounted(() => {
  window.addEventListener('error', handleWindowError)
})

onUnmounted(() => {
  window.removeEventListener('error', handleWindowError)
})
</script>

<template>
  <div class="error-boundary">
    <!-- Error State -->
    <div v-if="hasError && fallback" class="error-fallback">
      <UCard class="max-w-2xl mx-auto">
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center"
            >
              <UIcon name="i-lucide-alert-circle" class="text-2xl text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                Something went wrong
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                An unexpected error occurred
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Error Message -->
          <div
            class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <p class="text-sm font-mono text-red-900 dark:text-red-100">
              {{ error?.message || 'Unknown error' }}
            </p>
          </div>

          <!-- Error Stack (in development) -->
          <details v-if="error?.stack" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <summary
              class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Show technical details
            </summary>
            <pre class="mt-3 text-xs font-mono text-gray-600 dark:text-gray-400 overflow-x-auto">{{
              error.stack
            }}</pre>
          </details>

          <!-- Actions -->
          <div class="flex gap-3">
            <UButton label="Try Again" icon="i-lucide-refresh-cw" color="primary" @click="reset" />
            <UButton
              label="Reload Page"
              icon="i-lucide-rotate-ccw"
              color="neutral"
              variant="outline"
              @click="reloadPage"
            />
          </div>

          <!-- Help Text -->
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p class="font-medium mb-2">
              Common solutions:
            </p>
            <ul class="list-disc list-inside space-y-1">
              <li>Refresh the page</li>
              <li>Clear your browser cache</li>
              <li>Check your internet connection</li>
              <li>Try a different browser</li>
            </ul>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Normal Content -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.error-fallback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

details summary {
  user-select: none;
}

details[open] summary {
  margin-bottom: 0.75rem;
}
</style>
