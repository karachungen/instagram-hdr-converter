<script setup lang="ts">
const filesStore = useFilesStore()
const logsStore = useLogsStore()
const uiStore = useUiStore()

const logsExpanded = computed({
  get: () => uiStore.logsExpanded,
  set: (value) => {
    if (!value) {
      uiStore.toggleLogs()
    }
  },
})

// SEO Meta Tags
useSeoMeta({
  title: 'HDR Photo Converter for Instagram & Threads - Fix Dull HDR Images | ISO 21496-1',
  description: 'Free online HDR photo converter for Instagram, Threads, and Google Photos. Convert Lightroom HDR exports (AVIF/JPEG) to ISO 21496-1 format. Fix dull, washed-out HDR images with gain map preservation. Perfect for photographers uploading HDR content.',
  ogTitle: 'HDR Photo Converter for Instagram & Threads - Fix Dull HDR Images',
  ogDescription: 'Convert Lightroom HDR photos to Instagram/Threads compatible format. Fix dull, washed-out images. Free ISO 21496-1 HDR converter with gain map preservation.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'HDR Photo Converter for Instagram & Threads',
  twitterDescription: 'Free HDR converter for Instagram, Threads & Google Photos. Convert Lightroom exports to ISO 21496-1 format. Fix dull HDR images.',
})

// Structured Data for SEO (JSON-LD)
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Instagram HDR Converter',
        'description': 'Free HDR photo converter for Instagram, Threads, and Google Photos. Convert Lightroom HDR exports to ISO 21496-1 format.',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Any',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'featureList': [
          'Convert AVIF HDR to ISO 21496-1 JPEG',
          'Convert Lightroom HDR exports',
          'Fix dull HDR images on Instagram',
          'Preserve HDR gain maps',
          'Support for Threads and Google Photos',
          'Validate 10-bit HDR content',
          'Instagram size optimization'
        ],
        'screenshot': 'https://hdr.karachun.by/screenshot.png', // Update with actual screenshot
        'softwareVersion': '1.0',
        'author': {
          '@type': 'Organization',
          'name': 'Instagram HDR Converter'
        }
      })
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Why do my HDR photos look dull on Instagram?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'HDR photos exported from Lightroom may appear dull on Instagram if they are not in the ISO 21496-1 format. Instagram requires HDR images to have proper gain map metadata to display correctly on HDR-capable devices.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How do I convert Lightroom HDR photos for Instagram?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Export your photos from Lightroom as JXL or AVIF with HDR Output enabled, then use this converter to transform them into Instagram-compatible ISO 21496-1 HDR JPEG format with preserved gain maps.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What is ISO 21496-1 HDR format?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'ISO 21496-1 is the international standard for HDR images using gain maps. It allows HDR images to display correctly on both HDR and SDR displays, and is required by platforms like Instagram, Threads, and Google Photos for proper HDR rendering.'
            }
          }
        ]
      })
    }
  ]
})

// Initialize on mount
onMounted(() => {
  logsStore.add('Instagram HDR Converter initialized', 'success')
  logsStore.add('Upload AVIF or JPEG (HDR) files to convert to Instagram-compatible format', 'info')
  logsStore.add('Images will be validated for HDR content and optimal size (≤1080px)', 'info')
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <PageHeader />

    <!-- Main Content - Full Width -->
    <div class="flex-1 flex">
      <!-- Left Panel: 30% - Upload & File List -->
      <div class="w-[30%] border-r border-gray-200 dark:border-gray-800 p-6 space-y-6 overflow-y-auto">
        <UCard>
          <FileUploadSection />
        </UCard>

        <FileListSection />
      </div>

      <!-- Right Panel: 70% - Comparisons -->
      <div class="flex-1 p-6 overflow-y-auto">
        <UCard class="h-full min-h-[600px]">
          <ComparisonSection />
        </UCard>
      </div>
    </div>

    <!-- Footer -->
    <PageFooter />

    <!-- Processing Logs Slideover -->
    <USlideover v-model:open="logsExpanded" side="bottom">
      <template #body>
        <ProcessingLogs />
      </template>
    </USlideover>
  </div>
</template>

<style scoped>
/* Page-specific styles */
</style>

