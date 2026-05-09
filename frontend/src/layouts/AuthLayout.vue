<script setup lang="ts">
import AppHeader from '../components/common/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <div class="min-h-dvh bg-neutral-50 flex items-center justify-center px-4 py-6 sm:py-10">
    <div class="w-full max-w-md ap-card p-4 sm:p-6">
      <slot />
    </div>
  </div>
</template>

