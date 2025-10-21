<script setup lang="ts">
// Footer component for privacy and security information
</script>

<template>
  <footer class="w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
    <div class="px-6 py-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div class="flex items-center gap-4">
          <a
            href="https://github.com/karachungen/instagram-hdr-converter"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <UIcon name="i-lucide-github" class="text-lg" />
            <span>GitHub</span>
          </a>
        </div>
        <a
          href="https://cursor.sh"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <UIcon name="i-lucide-sparkles" class="text-lg" />
          <span>vibe coded by cursor</span>
        </a>
      </div>
    </div>
  </footer>
</template>
