/**
 * Google Analytics 4 Plugin for Nuxt 4
 * Client-side only implementation
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const gaId = config.public.googleAnalyticsId

  // Don't load GA if no ID is configured or in development mode
  if (!gaId || process.dev) {
    console.log('[GA] Analytics disabled in development or missing GA ID')
    return
  }

  // Initialize Google Analytics
  useHead({
    script: [
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`,
        async: true,
      },
      {
        innerHTML: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            send_page_view: true,
            anonymize_ip: true
          });
        `,
        type: 'text/javascript',
      },
    ],
  })

  console.log('[GA] Google Analytics initialized with ID:', gaId)
})

