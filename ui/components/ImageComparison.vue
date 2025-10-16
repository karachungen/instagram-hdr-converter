<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<script setup lang="ts">
/**
 * Image Comparison Component
 * Uses @img-comparison-slider/vue for before/after comparison
 */

import type { HdrMetadata, HdrProcessResult } from '~/types'
import { ImgComparisonSlider } from '@img-comparison-slider/vue'
import { downloadImage } from '~/utils/download'
import { formatBytes } from '~/utils/format'

interface Props {
  fileName: string
  result: HdrProcessResult
}

const props = defineProps<Props>()
const toast = useToast()

// Toggle between HDR, SDR, and Gain Map modes
type ViewMode = 'hdr' | 'sdr' | 'gainmap'
const viewMode = ref<ViewMode>('hdr')

// Computed images based on mode
const currentBeforeImage = computed(() => {
  if (viewMode.value === 'sdr') {
    return props.result.beforeImageSdr
  }
  if (viewMode.value === 'gainmap') {
    return props.result.gainMapImage || props.result.beforeImage
  }
  return props.result.beforeImage
})

const currentAfterImage = computed(() => {
  if (viewMode.value === 'sdr') {
    return props.result.afterImageSdr
  }
  if (viewMode.value === 'gainmap') {
    return props.result.gainMapImage || props.result.afterImage
  }
  return props.result.afterImage
})

// Check if SDR images are available
const hasSdrImages = computed(() => {
  return !!props.result.beforeImageSdr && !!props.result.afterImageSdr
})

// Check if gain map is available
const hasGainMap = computed(() => {
  return !!props.result.gainMapImage
})

const compressionRatio = computed(() => {
  if (!props.result.processedSize || !props.result.originalSize)
    return 0
  return ((1 - props.result.processedSize / props.result.originalSize) * 100).toFixed(1)
})

const sizeReduction = computed(() => {
  return props.result.originalSize - props.result.processedSize
})

/**
 * Format metadata value (handles both single values and arrays)
 */
function formatMetadataValue(value: number | number[] | undefined): string {
  if (value === undefined)
    return 'N/A'

  // Ensure it's always an array for consistent handling
  const values = Array.isArray(value) ? value : [value]

  if (!values || values.length === 0)
    return 'N/A'

  if (values.length === 1) {
    return values[0]?.toFixed(4) ?? 'N/A'
  }

  return values.map(v => v?.toFixed(4) ?? 'N/A').join(', ')
}

/**
 * Format offset values with exponential notation
 */
function formatOffsetValue(value: number | number[] | undefined): string {
  if (value === undefined)
    return 'N/A'

  // Ensure it's always an array for consistent handling
  const values = Array.isArray(value) ? value : [value]

  if (!values || values.length === 0)
    return 'N/A'

  if (values.length === 1) {
    return values[0]?.toExponential(2) ?? 'N/A'
  }

  return values.map(v => v?.toExponential(2) ?? 'N/A').join(', ')
}

/**
 * Check if a specific metadata field has changed
 */
function metadataChanged(field: keyof HdrMetadata): boolean {
  if (!props.result.metadataOriginal || !props.result.metadataProcessed)
    return false

  const original = props.result.metadataOriginal[field]
  const processed = props.result.metadataProcessed[field]

  // Normalize to arrays for comparison
  const originalArray = Array.isArray(original) ? original : [original]
  const processedArray = Array.isArray(processed) ? processed : [processed]

  return JSON.stringify(originalArray) !== JSON.stringify(processedArray)
}

/**
 * Check if all metadata fields match
 */
const allMetadataMatches = computed(() => {
  if (!props.result.metadataOriginal || !props.result.metadataProcessed)
    return false

  const fields: (keyof HdrMetadata)[] = [
    'maxContentBoost',
    'minContentBoost',
    'gamma',
    'offsetSdr',
    'offsetHdr',
    'hdrCapacityMin',
    'hdrCapacityMax',
    'useBaseColorSpace',
  ]

  return fields.every(field => !metadataChanged(field))
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
          <!-- HDR/SDR/Gain Map Toggle -->
          <UButtonGroup v-if="hasSdrImages || hasGainMap" size="sm" orientation="horizontal" class="gap-1">
            <UButton
              :color="viewMode === 'hdr' ? 'primary' : 'neutral'"
              :variant="viewMode === 'hdr' ? 'solid' : 'outline'"
              @click="viewMode = 'hdr'"
            >
              <UIcon name="i-lucide-sun" class="mr-1" />
              HDR
            </UButton>
            <UButton
              v-if="hasSdrImages"
              :color="viewMode === 'sdr' ? 'primary' : 'neutral'"
              :variant="viewMode === 'sdr' ? 'solid' : 'outline'"
              @click="viewMode = 'sdr'"
            >
              <UIcon name="i-lucide-monitor" class="mr-1" />
              SDR
            </UButton>
            <UButton
              v-if="hasGainMap"
              :color="viewMode === 'gainmap' ? 'primary' : 'neutral'"
              :variant="viewMode === 'gainmap' ? 'solid' : 'outline'"
              @click="viewMode = 'gainmap'"
            >
              <UIcon name="i-lucide-layers" class="mr-1" />
              Gain Map
            </UButton>
          </UButtonGroup>

          <UButton
            icon="i-lucide-download"
            color="primary"
            variant="soft"
            size="sm"
            @click="handleDownload"
          >
            Download
          </UButton>
        </div>
      </div>
    </template>

    <!-- Image Comparison Slider -->
    <div class="comparison-container">
      <ImgComparisonSlider class="comparison-slider">
        <!-- eslint-disable -->
        <!-- <template #first> -->
          <img slot="first" :src="currentBeforeImage" style="width: 100%;" alt="Before processing"
            class="comparison-image">
        <!-- </template> -->
          <img slot="second" :src="currentAfterImage" style="width: 100%; " alt="After processing"
            class="comparison-image">
        <div />
        <!-- eslint-disable -->
      </ImgComparisonSlider>

      <!-- Labels -->
      <div class="comparison-labels">
        <div class="label label-before">
          <UBadge color="neutral" variant="solid" size="sm">
            {{ viewMode === 'gainmap' ? 'Gain Map' : 'Before' }}
          </UBadge>
        </div>
        <div class="label label-after">
          <UBadge color="primary" variant="solid" size="sm">
            {{ viewMode === 'gainmap' ? 'Gain Map' : 'After' }}
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <template #footer>
      <div class="space-y-4">
        <!-- Basic Stats -->
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

        <!-- HDR Metadata Comparison -->
        <div v-if="result.metadataOriginal || result.metadataProcessed" class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-info" class="text-primary" />
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              HDR Metadata Comparison
            </h4>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Original Metadata -->
            <div v-if="result.metadataOriginal" class="space-y-3">
              <div class="flex items-center gap-2 mb-2">
                <UBadge color="neutral" size="sm">Before</UBadge>
                <span class="text-xs text-gray-500 dark:text-gray-400">Original Image</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span class="text-gray-600 dark:text-gray-400">Max Content Boost</span>
                  <span class="font-medium">{{ formatMetadataValue(result.metadataOriginal.maxContentBoost) }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span class="text-gray-600 dark:text-gray-400">Min Content Boost</span>
                  <span class="font-medium">{{ formatMetadataValue(result.metadataOriginal.minContentBoost) }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span class="text-gray-600 dark:text-gray-400">Gamma</span>
                  <span class="font-medium">{{ formatMetadataValue(result.metadataOriginal.gamma) }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span class="text-gray-600 dark:text-gray-400">HDR Capacity Min</span>
                  <span class="font-medium">{{ result.metadataOriginal.hdrCapacityMin }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span class="text-gray-600 dark:text-gray-400">HDR Capacity Max</span>
                  <span class="font-medium">{{ result.metadataOriginal.hdrCapacityMax }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span class="text-gray-600 dark:text-gray-400">Offset SDR</span>
                  <span class="font-medium font-mono text-xs">{{ formatOffsetValue(result.metadataOriginal.offsetSdr) }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                  <span class="text-gray-600 dark:text-gray-400">Offset HDR</span>
                  <span class="font-medium font-mono text-xs">{{ formatOffsetValue(result.metadataOriginal.offsetHdr) }}</span>
                </div>
                <div class="flex justify-between py-1">
                  <span class="text-gray-600 dark:text-gray-400">Base Color Space</span>
                  <span class="font-medium">{{ result.metadataOriginal.useBaseColorSpace ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </div>

            <!-- Processed Metadata -->
            <div v-if="result.metadataProcessed" class="space-y-3">
              <div class="flex items-center gap-2 mb-2">
                <UBadge color="primary" size="sm">After</UBadge>
                <span class="text-xs text-gray-500 dark:text-gray-400">Processed Image</span>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800"
                  :class="metadataChanged('maxContentBoost') ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''">
                  <span class="text-gray-600 dark:text-gray-400">Max Content Boost</span>
                  <span class="font-medium">{{ formatMetadataValue(result.metadataProcessed.maxContentBoost) }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800"
                  :class="metadataChanged('minContentBoost') ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''">
                  <span class="text-gray-600 dark:text-gray-400">Min Content Boost</span>
                  <span class="font-medium">{{ formatMetadataValue(result.metadataProcessed.minContentBoost) }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800"
                  :class="metadataChanged('gamma') ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''">
                  <span class="text-gray-600 dark:text-gray-400">Gamma</span>
                  <span class="font-medium">{{ formatMetadataValue(result.metadataProcessed.gamma) }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800"
                  :class="metadataChanged('hdrCapacityMin') ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''">
                  <span class="text-gray-600 dark:text-gray-400">HDR Capacity Min</span>
                  <span class="font-medium">{{ result.metadataProcessed.hdrCapacityMin }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800"
                  :class="metadataChanged('hdrCapacityMax') ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''">
                  <span class="text-gray-600 dark:text-gray-400">HDR Capacity Max</span>
                  <span class="font-medium">{{ result.metadataProcessed.hdrCapacityMax }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800"
                  :class="metadataChanged('offsetSdr') ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''">
                  <span class="text-gray-600 dark:text-gray-400">Offset SDR</span>
                  <span class="font-medium font-mono text-xs">{{ formatOffsetValue(result.metadataProcessed.offsetSdr) }}</span>
                </div>
                <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800"
                  :class="metadataChanged('offsetHdr') ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''">
                  <span class="text-gray-600 dark:text-gray-400">Offset HDR</span>
                  <span class="font-medium font-mono text-xs">{{ formatOffsetValue(result.metadataProcessed.offsetHdr) }}</span>
                </div>
                <div class="flex justify-between py-1"
                  :class="metadataChanged('useBaseColorSpace') ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''">
                  <span class="text-gray-600 dark:text-gray-400">Base Color Space</span>
                  <span class="font-medium">{{ result.metadataProcessed.useBaseColorSpace ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata Status -->
          <div v-if="result.metadataOriginal && result.metadataProcessed" class="mt-4 p-3 rounded-lg"
            :class="allMetadataMatches ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'">
            <div class="flex items-center gap-2">
              <UIcon :name="allMetadataMatches ? 'i-lucide-check-circle' : 'i-lucide-alert-triangle'"
                :class="allMetadataMatches ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'" />
              <span class="text-sm font-medium"
                :class="allMetadataMatches ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'">
                {{ allMetadataMatches ? 'Metadata preserved successfully' : 'Some metadata values have changed' }}
              </span>
            </div>
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
