<script setup lang="ts">
const { addFiles } = useFileProcessor()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement>()

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    await addFiles(files)
  }
}

const handleFileSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    await addFiles(input.files)
    // Reset input to allow selecting the same file again
    input.value = ''
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}
</script>

<template>
  <section aria-labelledby="upload-heading">
    <h2 id="upload-heading" class="text-lg font-semibold mb-4 flex items-center">
      <UIcon name="i-lucide-folder-open" class="mr-2" />
      Upload HDR Images
    </h2>

    <div
      class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
      :class="{
        'border-primary-500 bg-primary-50 dark:bg-primary-950': isDragging,
        'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600': !isDragging,
      }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".avif,.jpg,.jpeg,image/avif,image/jpeg"
        multiple
        class="hidden"
        @change="handleFileSelect"
      >

      <UIcon
        name="i-lucide-image"
        class="mx-auto h-12 w-12 text-gray-400 mb-3"
      />

      <p class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
        Drop your HDR images here
      </p>

      <p class="text-sm text-gray-500 dark:text-gray-400">
        AVIF & JPEG (HDR) files supported • Multiple files supported
      </p>

      <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
        <UIcon name="i-lucide-info" class="flex-shrink-0" />
        <span>Recommended: Keep images ≤1080px for Instagram HDR compatibility</span>
      </div>

      <UButton
        color="primary"
        variant="soft"
        class="mt-4"
        @click.stop="triggerFileInput"
      >
        Select Files
      </UButton>
    </div>
  </section>
</template>
