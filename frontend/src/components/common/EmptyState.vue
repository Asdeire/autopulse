<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="ap-card p-8 text-center">
    <div class="text-lg font-bold text-neutral-900">{{ title }}</div>
    <div v-if="description" class="mt-2 text-neutral-500">{{ description }}</div>
    <div class="mt-6">
      <slot />
    </div>
  </div>
</template>

