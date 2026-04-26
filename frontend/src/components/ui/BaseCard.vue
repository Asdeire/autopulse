<script setup lang="ts">
withDefaults(
  defineProps<{
    padded?: boolean
    hoverable?: boolean
  }>(),
  {
    padded: true,
    hoverable: false,
  },
)
</script>

<template>
  <div :class="['ap-card', padded ? 'p-4 sm:p-6' : '', hoverable ? 'hover:shadow-md' : '']">
    <slot />
  </div>
</template>

