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

export const useHdrConfigStore = defineStore('hdrConfig', () => {
  const useCustomConfig = ref(false)

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
  }

  return {
    useCustomConfig,
    customConfig,
    resetToDefaults,
  }
})
