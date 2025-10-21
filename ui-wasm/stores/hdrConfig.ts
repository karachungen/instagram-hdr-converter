import { defineStore } from 'pinia'

// Custom config type that only allows single numeric values (not arrays)
export interface CustomHdrConfig {
  maxContentBoost: number
  minContentBoost: number
  gamma: number
  offsetSdr: number
  offsetHdr: number
  hdrCapacityMin: number
  hdrCapacityMax: number
  useBaseColorSpace: number
}

export type ConfigMode = 'instagram' | 'auto' | 'custom'

export const useHdrConfigStore = defineStore('hdrConfig', () => {
  const configMode = ref<ConfigMode>('instagram')

  const customConfig = ref<CustomHdrConfig>({
    maxContentBoost: 16,
    minContentBoost: 1,
    gamma: 1,
    offsetSdr: 1e-07,
    offsetHdr: 1e-07,
    hdrCapacityMin: 1,
    hdrCapacityMax: 16.5665,
    useBaseColorSpace: 1,
  })

  function resetToDefaults() {
    customConfig.value = {
      maxContentBoost: 16,
      minContentBoost: 1,
      gamma: 1,
      offsetSdr: 1e-07,
      offsetHdr: 1e-07,
      hdrCapacityMin: 1,
      hdrCapacityMax: 16.5665,
      useBaseColorSpace: 1,
    }
    configMode.value = 'instagram'
  }

  return {
    configMode,
    customConfig,
    resetToDefaults,
  }
})
