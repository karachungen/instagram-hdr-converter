<script setup lang="ts">
interface Props {
  message?: string
  description?: string
  fullscreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  message: 'Loading...',
  description: '',
  fullscreen: false,
  size: 'md',
})

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  }
  return sizes[props.size]
})
</script>

<template>
  <div class="loading-state" :class="{ fullscreen }">
    <div class="loading-content">
      <!-- Animated Icon -->
      <div class="loading-spinner" :class="sizeClasses">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-primary-500" />
      </div>

      <!-- Message -->
      <div class="loading-text">
        <h3 v-if="message" class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ message }}
        </h3>

        <p v-if="description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ description }}
        </p>
      </div>

      <!-- Pulse Animation -->
      <div class="loading-pulse">
        <div class="pulse-dot pulse-dot-1" />
        <div class="pulse-dot pulse-dot-2" />
        <div class="pulse-dot pulse-dot-3" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.loading-state.fullscreen {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  z-index: 9999;
}

:deep(.dark) .loading-state.fullscreen {
  background: rgba(0, 0, 0, 0.9);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.loading-spinner {
  animation: fadeIn 0.3s ease-in;
}

.loading-text {
  text-align: center;
  animation: fadeIn 0.5s ease-in 0.2s backwards;
}

.loading-pulse {
  display: flex;
  gap: 0.5rem;
  animation: fadeIn 0.5s ease-in 0.4s backwards;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.4;
  animation: pulse 1.5s ease-in-out infinite;
}

.pulse-dot-1 {
  animation-delay: 0s;
  color: #667eea;
}

.pulse-dot-2 {
  animation-delay: 0.2s;
  color: #764ba2;
}

.pulse-dot-3 {
  animation-delay: 0.4s;
  color: #f093fb;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner,
  .pulse-dot {
    animation: none;
  }

  .loading-spinner {
    opacity: 1;
  }

  .pulse-dot {
    opacity: 0.6;
  }
}
</style>
