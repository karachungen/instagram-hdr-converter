<script setup lang="ts">
import { useHdrConfigStore } from '~/stores/hdrConfig'

const hdrConfigStore = useHdrConfigStore()
const toast = useToast()

const configModeItems = [
  { value: 'auto', label: 'Auto', description: 'Use extracted metadata' },
  { value: 'custom', label: 'Custom', description: 'Manual configuration' },
]

const configMode = computed({
  get: () => hdrConfigStore.useCustomConfig ? 'custom' : 'auto',
  set: (value: string) => {
    hdrConfigStore.useCustomConfig = value === 'custom'
  },
})

function handleReset() {
  hdrConfigStore.resetToDefaults()
  toast.add({
    title: 'Reset to defaults',
    description: 'HDR configuration reset to default values',
    color: 'primary',
  })
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-settings" class="text-primary" />
        <h3 class="font-semibold">
          HDR Configuration
        </h3>
      </div>
    </template>

    <div class="space-y-4">
      <URadioGroup
        v-model="configMode"
        :items="configModeItems"
        orientation="horizontal"
        variant="card"
      />

      <UForm v-if="hdrConfigStore.useCustomConfig" :state="hdrConfigStore.customConfig" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Max Content Boost" name="maxContentBoost">
            <UInput
              v-model.number="hdrConfigStore.customConfig.maxContentBoost"
              type="number"
              step="0.1"
            />
          </UFormField>

          <UFormField label="Min Content Boost" name="minContentBoost">
            <UInput
              v-model.number="hdrConfigStore.customConfig.minContentBoost"
              type="number"
              step="0.1"
            />
          </UFormField>

          <UFormField label="Gamma" name="gamma">
            <UInput
              v-model.number="hdrConfigStore.customConfig.gamma"
              type="number"
              step="0.01"
            />
          </UFormField>

          <UFormField label="Offset SDR" name="offsetSdr">
            <UInput
              v-model.number="hdrConfigStore.customConfig.offsetSdr"
              type="number"
              step="1e-08"
            />
          </UFormField>

          <UFormField label="Offset HDR" name="offsetHdr">
            <UInput
              v-model.number="hdrConfigStore.customConfig.offsetHdr"
              type="number"
              step="1e-08"
            />
          </UFormField>

          <UFormField label="HDR Capacity Min" name="hdrCapacityMin">
            <UInput
              v-model.number="hdrConfigStore.customConfig.hdrCapacityMin"
              type="number"
              step="0.1"
            />
          </UFormField>

          <UFormField label="HDR Capacity Max" name="hdrCapacityMax">
            <UInput
              v-model.number="hdrConfigStore.customConfig.hdrCapacityMax"
              type="number"
              step="0.1"
            />
          </UFormField>

          <UFormField label="Use Base Color Space" name="useBaseColorSpace">
            <URadioGroup
              v-model="hdrConfigStore.customConfig.useBaseColorSpace"
              :items="[
                { value: 1, label: 'Yes' },
                { value: 0, label: 'No' },
              ]"
              orientation="horizontal"
            />
          </UFormField>
        </div>

        <div class="flex justify-end">
          <UButton
            icon="i-lucide-rotate-ccw"
            variant="outline"
            color="neutral"
            @click="handleReset"
          >
            Reset to Defaults
          </UButton>
        </div>
      </UForm>

      <div v-else class="text-sm text-gray-600 dark:text-gray-400">
        Using metadata extracted from the original image. Enable custom configuration to override.
      </div>
    </div>
  </UCard>
</template>
