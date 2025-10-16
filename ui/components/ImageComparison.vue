<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<script setup lang="ts">
/**
 * Image Comparison Component
 * Uses @img-comparison-slider/vue for before/after comparison
 */

import type { HdrProcessResult } from '~/composables/useHdrProcessor'
import { ImgComparisonSlider } from '@img-comparison-slider/vue'
import { downloadImage } from '~/utils/download'
import { formatBytes } from '~/utils/format'

interface Props {
  fileName: string
  result: HdrProcessResult
}

const props = defineProps<Props>()
const toast = useToast()

const compressionRatio = computed(() => {
  if (!props.result.processedSize || !props.result.originalSize)
    return 0
  return ((1 - props.result.processedSize / props.result.originalSize) * 100).toFixed(1)
})

const sizeReduction = computed(() => {
  return props.result.originalSize - props.result.processedSize
})

/**
 * Download the processed image
 */
function handleDownload(): void {
  try {
    const baseName = props.fileName.replace(/\.[^/.]+$/, '') // Remove extension
    const filename = `${baseName}_processed.jpg`
    downloadImage(props.result.afterImage, filename)

    toast.add({
      title: 'Download Started',
      description: `Downloading ${filename}`,
      icon: 'i-lucide-download',
      color: 'success',
    })
  }
  catch (error) {
    toast.add({
      title: 'Download Failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  }
}
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
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-download"
            color="primary"
            variant="soft"
            size="sm"
            @click="handleDownload"
          >
            Download
          </UButton>
          <UBadge color="success" variant="soft">
            <UIcon name="i-lucide-check-circle" class="mr-1" />
            Processed
          </UBadge>
        </div>
      </div>
    </template>

    <!-- Image Comparison Slider -->
    <div class="comparison-container">
      <ImgComparisonSlider class="comparison-slider">
        <!-- eslint-disable -->
        <!-- <template #first> -->
          <img slot="first" :src="result.beforeImage" style="width: 100%;" alt="Before processing"
            class="comparison-image">
        <!-- </template> -->
          <img slot="second" :src="result.afterImage" style="width: 100%; " alt="After processing"
            class="comparison-image">
        <div />
        <!-- eslint-disable -->
      </ImgComparisonSlider>

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
          <div class="stat-value"
            :class="sizeReduction > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
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
  aspect-ratio: auto;
}

@media (min-width: 1920px) {
  .comparison-slider {
    min-height: 700px;
  }
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
