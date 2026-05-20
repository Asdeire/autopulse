<script setup lang="ts">
import AppFooter from '../components/common/AppFooter.vue'
import AppHeader from '../components/common/AppHeader.vue'
</script>

<template>
  <div class="min-h-dvh bg-neutral-50 flex flex-col overflow-x-hidden">
    <AppHeader />
    <main class="ap-container py-4 sm:py-6 flex-1 w-full">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

