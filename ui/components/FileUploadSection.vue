<script setup lang="ts">
interface Props {
  isInitializing: boolean
  wasmError: string | null
}

defineProps<Props>()

const fileInputValue = defineModel<File[]>({ default: [] })
</script>

<template>
  <section aria-labelledby="upload-heading">
    <h2 id="upload-heading" class="text-lg font-semibold mb-3 flex items-center">
      <UIcon name="i-lucide-folder-open" class="mr-2" />
      Upload Files
    </h2>

    <UFileUpload
      v-model="fileInputValue"
      icon="i-lucide-image"
      label="Drop your HDR images here"
      description="AVIF, HEIF, JPG - Multiple files supported"
      multiple
      accept="image/*"
      layout="grid"
      :disabled="isInitializing || !!wasmError"
    />
  </section>
</template>
