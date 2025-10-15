// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',

  future: {
    compatibilityVersion: 4,
  },

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
    shim: false,
  },

  modules: ['@nuxt/ui', '@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Instagram HDR Converter',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Convert HDR images using Google\'s Ultra HDR library compiled to WebAssembly. Fast, secure, and private - all processing happens in your browser.',
        },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#667eea' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'Instagram HDR Converter' },
        { property: 'og:description', content: 'Convert HDR images using WebAssembly' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Instagram HDR Converter' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      ],
      script: [
        {
          src: '/ultrahdr_app.js',
          defer: true,
          tagPosition: 'bodyClose',
        },
      ],
    },
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
    layoutTransition: {
      name: 'layout',
      mode: 'out-in',
    },
  },

  // Runtime config
  runtimeConfig: {
    public: {
      appName: 'Instagram HDR Converter',
      appVersion: '2.0.0',
    },
  },

  // Vite configuration
  vite: {
    server: {
      fs: {
        strict: false,
      },
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue'],
            ui: ['@nuxt/ui'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['vue'],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/css/variables.scss" as *;',
        },
      },
    },
  },

  // Nitro configuration for production
  nitro: {
    compressPublicAssets: true,
    minify: true,
    prerender: {
      crawlLinks: true,
      routes: ['/'],
    },
  },

  // Experimental features
  experimental: {
    payloadExtraction: true,
    typedPages: true,
    viewTransition: true,
  },

  // Security headers
  routeRules: {
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    },
  },
})
