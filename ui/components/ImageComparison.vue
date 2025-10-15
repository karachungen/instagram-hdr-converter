<script setup lang="ts">
/**
 * Image Comparison Component
 * Uses img-comparison-slider web component for before/after comparison
 */

import type { HdrProcessResult } from '~/composables/useHdrProcessor'
import { formatBytes } from '~/utils/format'

interface Props {
  fileName: string
  result: HdrProcessResult
}

const props = defineProps<Props>()

// Register web component
onMounted(() => {
  if (typeof window !== 'undefined' && !customElements.get('img-comparison-slider')) {
    import('img-comparison-slider')
  }
})

const compressionRatio = computed(() => {
  if (!props.result.processedSize || !props.result.originalSize)
    return 0
  return ((1 - props.result.processedSize / props.result.originalSize) * 100).toFixed(1)
})

const sizeReduction = computed(() => {
  return props.result.originalSize - props.result.processedSize
})
</script>

<template>
  <UCard class="image-comparison-card">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-images" class="text-primary" />
          <h3 class="font-semibold text-lg">
            {{ fileName }}
          </h3>
        </div>
        <UBadge color="success" variant="soft">
          <UIcon name="i-lucide-check-circle" class="mr-1" />
          Processed
        </UBadge>
      </div>
    </template>

    <!-- Image Comparison Slider -->
    <div class="comparison-container">
      <img-comparison-slider class="comparison-slider">
        <template #first>
          <img

            :src="result.beforeImage"
            alt="Before processing"
            class="comparison-image"
          >
        </template>
        <template #second>
          <img

            :src="result.afterImage"
            alt="After processing"
            class="comparison-image"
          >
        </template>
        <template #handle>
          <div class="comparison-handle">
            <UIcon name="i-lucide-move-horizontal" class="text-2xl" />
          </div>
        </template>
      </img-comparison-slider>

      <!-- Labels -->
      <div class="comparison-labels">
        <div class="label label-before">
          <UBadge color="neutral" variant="solid" size="sm">
            Before
          </UBadge>
        </div>
        <div class="label label-after">
          <UBadge color="primary" variant="solid" size="sm">
            After
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <template #footer>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div class="stat-item">
          <div class="stat-label">
            Dimensions
          </div>
          <div class="stat-value">
            {{ result.width }}×{{ result.height }}
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-label">
            Original Size
          </div>
          <div class="stat-value">
            {{ formatBytes(result.originalSize) }}
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-label">
            Processed Size
          </div>
          <div class="stat-value">
            {{ formatBytes(result.processedSize) }}
          </div>
        </div>

        <div class="stat-item">
          <div class="stat-label">
            Size Change
          </div>
          <div class="stat-value" :class="sizeReduction > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
            {{ sizeReduction > 0 ? '-' : '+' }}{{ formatBytes(Math.abs(sizeReduction)) }}
            <span class="text-xs">
              ({{ compressionRatio }}%)
            </span>
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>

<style scoped>
.comparison-container {
  position: relative;
  width: 100%;
  background: #f0f0f0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.comparison-slider {
  --divider-width: 3px;
  --divider-color: rgb(var(--color-primary-500));
  --default-handle-opacity: 1;
  --default-handle-width: 60px;
  --default-handle-color: rgb(var(--color-primary-500));
  --divider-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
  --default-handle-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
}

.comparison-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f0f0f0;
}

.comparison-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgb(var(--color-primary-500));
  border-radius: 50%;
  color: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  cursor: ew-resize;
  transition: transform 0.2s ease;
}

.comparison-handle:hover {
  transform: scale(1.1);
}

.comparison-labels {
  position: absolute;
  top: 1rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
  pointer-events: none;
  z-index: 10;
}

.label {
  display: flex;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: rgb(var(--color-gray-500));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(var(--color-gray-900));
}

.dark .stat-value {
  color: rgb(var(--color-gray-100));
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .comparison-slider {
    aspect-ratio: 4 / 3;
  }

  .comparison-handle {
    width: 48px;
    height: 48px;
  }

  .comparison-labels {
    top: 0.5rem;
    padding: 0 0.5rem;
  }
}
</style>
