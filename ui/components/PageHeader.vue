<script setup lang="ts">
const wasmStore = useWasmStore()
const uiStore = useUiStore()
const logsStore = useLogsStore()
const colorMode = useColorMode()

const logCount = computed(() => logsStore.logs.length)
const isDark = computed(() => colorMode.value === 'dark')

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
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

    <!-- Right side: Status Badge & Actions -->
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

      <!-- Theme Toggle Button -->
      <button
        class="theme-toggle-btn"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <div class="theme-toggle-track">
          <div class="theme-toggle-thumb" :class="{ 'is-dark': isDark }">
            <div class="theme-icon-wrapper" :class="{ 'is-dark': isDark }">
              <UIcon
                :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
                class="theme-icon"
              />
            </div>
          </div>
          <div class="theme-toggle-stars">
            <span class="star star-1">✦</span>
            <span class="star star-2">✦</span>
            <span class="star star-3">✦</span>
          </div>
        </div>
      </button>

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

/* Theme Toggle Styles */
.theme-toggle-btn {
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  outline: none;
  transition: transform 0.2s ease;
}

.theme-toggle-btn:hover {
  transform: scale(1.05);
}

.theme-toggle-btn:active {
  transform: scale(0.95);
}

.theme-toggle-track {
  position: relative;
  width: 64px;
  height: 32px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 9999px;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(59, 130, 246, 0.2);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-toggle-track:has(.is-dark) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.3),
    0 2px 8px rgba(102, 126, 234, 0.4);
}

.theme-toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  background: white;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.theme-toggle-thumb.is-dark {
  transform: translateX(32px);
  background: #1e293b;
}

.theme-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.theme-icon-wrapper:not(.is-dark) {
  animation: sunSpin 20s linear infinite;
}

.theme-icon {
  font-size: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-icon-wrapper:not(.is-dark) .theme-icon {
  color: #f59e0b;
}

.theme-icon-wrapper.is-dark {
  animation: moonGlow 2s ease-in-out infinite;
}

.theme-icon-wrapper.is-dark .theme-icon {
  color: #fbbf24;
}

/* Stars animation */
.theme-toggle-stars {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 1;
}

.theme-toggle-thumb.is-dark ~ .theme-toggle-stars {
  opacity: 1;
}

.star {
  color: white;
  font-size: 8px;
  animation: twinkle 2s ease-in-out infinite;
}

.star-1 {
  animation-delay: 0s;
}

.star-2 {
  animation-delay: 0.5s;
}

.star-3 {
  animation-delay: 1s;
}

/* Animations */
@keyframes sunSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes moonGlow {
  0%, 100% {
    filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.5));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8));
  }
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* Accessibility: Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .theme-toggle-btn,
  .theme-toggle-thumb,
  .theme-icon-wrapper,
  .theme-icon,
  .star {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
