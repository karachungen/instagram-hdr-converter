<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<script setup lang="ts">
/**
 * Image Comparison Component
 * Displays original AVIF vs final JPG, with SDR and Gain map below
 */

import type { HdrMetadata, ProcessResult } from '~/types'
import 'img-comparison-slider/dist/styles.css'
import { ImgComparisonSlider } from '@img-comparison-slider/vue';

interface Props {
  fileName: string
  result: ProcessResult
}

const props = defineProps<Props>()
const toast = useToast()



// Fullscreen image modal state
const fullscreenImage = ref<{
  type: 'comparison' | 'sdr' | 'gainmap'
  title: string
  src?: string
  originalSrc?: string
  finalSrc?: string
} | null>(null)

const isFullscreenOpen = computed({
  get: () => !!fullscreenImage.value,
  set: (value) => {
    if (!value) {
      fullscreenImage.value = null
    }
  },
})

/**
 * Open image in fullscreen
 */
function openFullscreen(type: 'comparison' | 'sdr' | 'gainmap') {
  switch (type) {
    case 'comparison':
      fullscreenImage.value = {
        type: 'comparison',
        title: 'HDR Comparison',
        originalSrc: props.result.originalImage,
        finalSrc: props.result.finalJpg,
      }
      break
    case 'sdr':
      fullscreenImage.value = {
        type: 'sdr',
        title: 'SDR Image',
        src: props.result.sdrImage,
      }
      break
    case 'gainmap':
      fullscreenImage.value = {
        type: 'gainmap',
        title: 'Gain Map',
        src: props.result.gainMapImage,
      }
      break
  }
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`
}

// Check if SDR image is available
const hasSdrImage = computed(() => {
  return !!props.result.sdrImage
})

// Check if gain map is available
const hasGainMap = computed(() => {
  return !!props.result.gainMapImage
})

const sizeChange = computed(() => {
  const change = props.result.processedSize - props.result.originalSize
  const changePercent = ((change / props.result.originalSize) * 100).toFixed(1)
  return {
    bytes: change,
    percent: changePercent,
    isIncrease: change > 0,
  }
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
 * Download image helper
 */
function downloadImage(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * Download the processed JPG
 */
function handleDownload(): void {
  try {
    const baseName = props.fileName.replace(/\.[^/.]+$/, '')
    const filename = `${baseName}_instagram.jpg`
    downloadImage(props.result.finalJpg, filename)

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
        <UButton icon="i-lucide-download" label="Download JPG" color="primary" variant="soft" size="sm"
          @click="handleDownload" />
      </div>
    </template>

    <!-- Main Comparison: Original AVIF vs Final JPG with Interactive Slider -->
    <div class="space-y-6">
      <div class="comparison-container">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UBadge color="gray" variant="soft" size="sm">
              <UIcon name="i-lucide-arrow-left" class="mr-1" />
              Original AVIF
            </UBadge>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            <UIcon name="i-lucide-move-horizontal" class="inline" />
            Drag to compare
          </div>
          <div class="flex items-center gap-2">
            <UBadge color="primary" variant="soft" size="sm">
              Final JPG (Instagram)
              <UIcon name="i-lucide-arrow-right" class="ml-1" />
            </UBadge>
          </div>
        </div>

        <div class="slider-wrapper relative group cursor-pointer" @click="openFullscreen('comparison')">
          <ImgComparisonSlider class="slider-container">
            <!-- eslint-disable -->
            <img slot="first" :src="result.originalImage" alt="Original AVIF HDR" class="slider-image" />
            <img slot="second" :src="result.finalJpg" alt="Converted JPG HDR (Instagram Compatible)"
              class="slider-image" />
            <!-- eslint-enable -->
          </ImgComparisonSlider>
          <!-- Expand icon overlay -->
          <div
            class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-2">
            <UIcon name="i-lucide-expand" class="text-white text-xl" />
          </div>
        </div>
      </div>

      <!-- SDR and Gain Map Display -->
      <div v-if="hasSdrImage || hasGainMap" class="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-sm font-semibold mb-4 flex items-center gap-2">
          <UIcon name="i-lucide-layers" />
          Extracted Components
        </h4>

        <div class="grid grid-cols-2 gap-4">
          <!-- SDR Image -->
          <div v-if="hasSdrImage" class="space-y-2">
            <div class="flex items-center gap-2">
              <UBadge color="sky" variant="soft" size="sm">SDR Image</UBadge>
            </div>
            <div class="image-wrapper group cursor-pointer relative" @click="openFullscreen('sdr')">
              <img :src="result.sdrImage" alt="SDR Image" class="display-image" />
              <!-- Expand icon overlay -->
              <div
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-2">
                <UIcon name="i-lucide-expand" class="text-white" />
              </div>
            </div>
          </div>

          <!-- Gain Map -->
          <div v-if="hasGainMap" class="space-y-2">
            <div class="flex items-center gap-2">
              <UBadge color="amber" variant="soft" size="sm">Gain Map</UBadge>
            </div>
            <div class="image-wrapper group cursor-pointer relative" @click="openFullscreen('gainmap')">
              <img :src="result.gainMapImage" alt="Gain Map" class="display-image" />
              <!-- Expand icon overlay -->
              <div
                class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg p-2">
                <UIcon name="i-lucide-expand" class="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <template #footer>
      <div class="space-y-4">
        <!-- Basic Stats -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div class="stat-item">
            <div class="stat-label">
              Original Size (AVIF)
            </div>
            <div class="stat-value">
              {{ formatBytes(result.originalSize) }}
            </div>
          </div>

          <div class="stat-item">
            <div class="stat-label">
              Final Size (JPG)
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
              :class="sizeChange.isIncrease ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
              {{ sizeChange.isIncrease ? '+' : '' }}{{ formatBytes(Math.abs(sizeChange.bytes)) }}
              <span class="text-xs">
                ({{ sizeChange.isIncrease ? '+' : '' }}{{ sizeChange.percent }}%)
              </span>
            </div>
          </div>
        </div>

        <!-- HDR Metadata -->
        <div v-if="result.metadata" class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2 mb-4">
            <UIcon name="i-lucide-info" class="text-primary" />
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              HDR Gain Map Metadata
            </h4>
          </div>

          <div class="space-y-2 text-sm max-w-2xl">
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span class="text-gray-600 dark:text-gray-400">Max Content Boost</span>
              <span class="font-medium">{{ result.metadata.maxContentBoost.toFixed(4) }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span class="text-gray-600 dark:text-gray-400">Min Content Boost</span>
              <span class="font-medium">{{ result.metadata.minContentBoost.toFixed(4) }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span class="text-gray-600 dark:text-gray-400">Gamma</span>
              <span class="font-medium">{{ result.metadata.gamma.toFixed(4) }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span class="text-gray-600 dark:text-gray-400">HDR Capacity Min</span>
              <span class="font-medium">{{ result.metadata.hdrCapacityMin }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span class="text-gray-600 dark:text-gray-400">HDR Capacity Max</span>
              <span class="font-medium">{{ result.metadata.hdrCapacityMax }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span class="text-gray-600 dark:text-gray-400">Offset SDR</span>
              <span class="font-medium font-mono text-xs">{{ result.metadata.offsetSdr.toExponential(2) }}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span class="text-gray-600 dark:text-gray-400">Offset HDR</span>
              <span class="font-medium font-mono text-xs">{{ result.metadata.offsetHdr.toExponential(2) }}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-gray-600 dark:text-gray-400">Base Color Space</span>
              <span class="font-medium">{{ result.metadata.useBaseColorSpace ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UCard>

  <!-- Fullscreen Image Modal -->
  <UModal v-model="isFullscreenOpen" :fullscreen="true" :title="fullscreenImage?.title" :ui="{ body: { padding: '' } }">
    <template #body>
      <div class="h-full flex items-center justify-center bg-black p-4">
        <!-- Comparison Slider in Fullscreen -->
        <div v-if="fullscreenImage?.type === 'comparison'" class="w-full h-full flex items-center justify-center">
          <img-comparison-slider class="w-full h-full">
            <img slot="first" :src="fullscreenImage.originalSrc" alt="Original AVIF HDR"
              class="w-full h-full object-contain" />
            <img slot="second" :src="fullscreenImage.finalSrc" alt="Converted JPG HDR"
              class="w-full h-full object-contain" />
          </img-comparison-slider>
        </div>

        <!-- Single Image in Fullscreen -->
        <img v-else-if="fullscreenImage?.src" :src="fullscreenImage.src" :alt="fullscreenImage.title"
          class="max-w-full max-h-full object-contain" />
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.comparison-container {
  position: relative;
  width: 100%;
}

.slider-wrapper {
  position: relative;
  width: 100%;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 2px solid rgb(var(--color-gray-200));
  background: rgb(var(--color-gray-50));
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.dark .slider-wrapper {
  background: rgb(var(--color-gray-900));
  border-color: rgb(var(--color-gray-700));
}

.slider-container {
  display: block;
  width: 100%;
  --divider-width: 3px;
  --divider-color: rgba(59, 130, 246, 0.8);
  --default-handle-opacity: 1;
}

.slider-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  max-height: 600px;
}

.image-wrapper {
  position: relative;
  width: 100%;
  background: #f0f0f0;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid rgb(var(--color-gray-200));
}

.dark .image-wrapper {
  background: rgb(var(--color-gray-800));
  border-color: rgb(var(--color-gray-700));
}

.display-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
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
