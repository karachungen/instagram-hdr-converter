<script setup lang="ts">
// Footer component with SEO content and links
</script>

<template>
  <footer class="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
    <div class="px-6 py-6">
      <!-- SEO-Friendly Educational Content -->
      <div class="max-w-5xl mx-auto mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <!-- Problem & Solution -->
          <div>
            <h2 class="font-semibold text-base text-gray-900 dark:text-white mb-3">
              Why Your HDR Photos Look Dull on Instagram
            </h2>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              When you export <strong>HDR photos from Lightroom</strong> as AVIF and upload them to <strong>Instagram, Threads, or Google Photos</strong>, they often appear washed out or dull. This happens because these platforms require images in the <strong>ISO 21496-1 HDR format</strong> with proper gain map metadata.
            </p>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our free converter transforms your Lightroom HDR exports into Instagram-compatible HDR JPEGs, preserving the full dynamic range and vibrant colors your photos deserve.
            </p>
          </div>

          <!-- How It Works -->
          <div>
            <h2 class="font-semibold text-base text-gray-900 dark:text-white mb-3">
              HDR Conversion Process
            </h2>
            <ul class="space-y-2 text-gray-600 dark:text-gray-400">
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="text-green-500 mt-0.5 shrink-0" />
                <span><strong>Validate HDR content:</strong> Checks for 10-bit color depth (AVIF) or gain map metadata (JPEG)</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="text-green-500 mt-0.5 shrink-0" />
                <span><strong>Convert to ISO 21496-1:</strong> Creates Instagram/Threads compatible HDR JPEG with embedded gain map</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="text-green-500 mt-0.5 shrink-0" />
                <span><strong>Optimize dimensions:</strong> Warns if image exceeds Instagram's 1080px recommendation</span>
              </li>
              <li class="flex items-start gap-2">
                <UIcon name="i-lucide-check" class="text-green-500 mt-0.5 shrink-0" />
                <span><strong>Preserve quality:</strong> Maintains HDR dynamic range for display on HDR-capable devices</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Keywords for SEO (hidden but readable by search engines) -->
        <div class="sr-only" aria-hidden="true">
          Convert HDR photos for Instagram, Fix dull HDR images on Threads, Lightroom HDR export to Instagram,
          AVIF to HDR JPEG converter, ISO 21496-1 format converter, HDR gain map preservation,
          Google Photos HDR upload, Ultra HDR converter, HDR image optimization for social media,
          10-bit HDR AVIF to JPEG, Adobe Lightroom HDR Instagram workflow
        </div>
      </div>

      <!-- Footer Links -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-6">
        <div class="flex items-center gap-4">
          <a
            href="https://github.com/karachungen/instagram-hdr-converter"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            aria-label="View source code on GitHub"
          >
            <UIcon name="i-lucide-github" class="text-lg" />
            <span>Open Source on GitHub</span>
          </a>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-xs">Powered by ImageMagick with UHDR</span>
          <a
            href="https://cursor.sh"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <UIcon name="i-lucide-sparkles" class="text-lg" />
            <span>Vibe coded by Cursor</span>
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
