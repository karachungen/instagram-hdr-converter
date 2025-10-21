<script setup lang="ts">
// Global error handling
function handleError(error: unknown): void {
  console.error('Global error:', error)
}

// Provide global error handler
provide('errorHandler', handleError)
</script>

<template>
  <ErrorBoundary>
    <UApp>
      <NuxtPage />
    </UApp>
  </ErrorBoundary>
</template>

<style>
/* Global transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.layout-enter-active,
.layout-leave-active {
  transition: all 0.3s ease;
}

.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}
</style>
