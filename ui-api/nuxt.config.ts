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
      title: 'HDR Photo Converter for Instagram & Threads - Fix Dull HDR Images | ISO 21496-1',
      titleTemplate: '%s',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Free HDR photo converter for Instagram, Threads & Google Photos. Convert Lightroom HDR exports (AVIF/JPEG) to ISO 21496-1 format. Fix dull, washed-out HDR images. Preserve gain maps for perfect HDR display.'
        },
        {
          name: 'keywords',
          content: 'HDR converter, Instagram HDR, Lightroom HDR, AVIF to HDR JPEG, ISO 21496-1, HDR gain map, Threads HDR, Google Photos HDR, dull HDR fix, HDR image converter, Ultra HDR, HDR photo upload'
        },
        { name: 'author', content: 'Instagram HDR Converter' },
        { name: 'robots', content: 'index, follow' },

        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'HDR Photo Converter for Instagram & Threads - Fix Dull HDR Images' },
        {
          property: 'og:description',
          content: 'Convert Lightroom HDR photos to Instagram/Threads compatible format. Fix dull, washed-out images. Free ISO 21496-1 HDR converter with gain map preservation.'
        },
        { property: 'og:site_name', content: 'Instagram HDR Converter' },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'HDR Photo Converter for Instagram & Threads - Fix Dull HDR Images' },
        {
          name: 'twitter:description',
          content: 'Free HDR converter for Instagram, Threads & Google Photos. Convert Lightroom exports to ISO 21496-1 format. Fix dull HDR images.'
        },

        // Additional SEO
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'canonical', href: 'https://hdr.karachun.by' }, // Update with your actual domain
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

