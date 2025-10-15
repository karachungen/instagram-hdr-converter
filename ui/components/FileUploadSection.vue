<script setup lang="ts">
interface Props {
  fileInputValue: File[]
  isInitializing: boolean
  wasmError: string | null
}

interface Emits {
  (e: 'update:fileInputValue', value: File[]): void
  (e: 'filesSelected', filesOrEvent: File[] | Event): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = computed({
  get: () => props.fileInputValue,
  set: value => emit('update:fileInputValue', value),
})

function handleChange(filesOrEvent: File[] | Event): void {
  emit('filesSelected', filesOrEvent)
}
</script>

<template>
  <section aria-labelledby="upload-heading">
    <h2 id="upload-heading" class="text-lg font-semibold mb-3 flex items-center">
      <UIcon name="i-lucide-folder-open" class="mr-2" />
      Upload Files
    </h2>

    <UFileUpload
      v-model="localValue"
      icon="i-lucide-image"
      label="Drop your HDR images here"
      description="AVIF, HEIF, JPG - Multiple files supported"
      multiple
      accept="image/*"
      layout="grid"
      :disabled="isInitializing || !!wasmError"
      @change="handleChange"
    />
  </section>
</template>
