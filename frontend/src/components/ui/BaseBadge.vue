<script setup lang="ts">
type Variant = 'primary' | 'neutral'

withDefaults(
  defineProps<{
    variant?: Variant
  }>(),
  { variant: 'neutral' },
)
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
      variant === 'primary'
        ? 'bg-yellow-400 text-neutral-900'
        : 'bg-neutral-100 text-neutral-700',
    ]"
  >
    <slot />
  </span>
</template>

