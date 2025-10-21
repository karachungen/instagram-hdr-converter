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
      title: 'HDR Converter - Fix Dull HDR Images for Instagram & Threads | ISO 21496-1',
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
        { name: 'author', content: 'HDR Converter' },
        { name: 'robots', content: 'index, follow' },

        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'HDR Converter - Fix Dull HDR Images for Instagram & Threads' },
        {
          property: 'og:description',
          content: 'Convert Lightroom HDR photos to Instagram/Threads compatible format. Fix dull, washed-out images. Free ISO 21496-1 HDR converter with gain map preservation.'
        },
        { property: 'og:site_name', content: 'HDR Converter' },

        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'HDR Converter - Fix Dull HDR Images for Instagram & Threads' },
        {
          name: 'twitter:description',
          content: 'Free HDR converter for Instagram, Threads & Google Photos. Convert Lightroom exports to ISO 21496-1 format. Fix dull HDR images.'
        },

        // Additional SEO
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
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

  // Google Analytics configuration will be handled by @nuxtjs/google-analytics module

  runtimeConfig: {
    // Private keys (only available on server-side)
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',

    // Public keys (exposed to client)
    public: {
      apiBase: '/api',
      googleAnalyticsId: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID || '',
    },
  },
})

