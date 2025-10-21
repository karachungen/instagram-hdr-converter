// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/eslint',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Instagram HDR Converter',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Convert AVIF HDR images to Instagram-compatible ISO 21496-1 HDR JPEG format' },
      ],
    },
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },

  runtimeConfig: {

    // Public keys (exposed to client)
    public: {
      apiBase: '/api',
    },
  },
})

