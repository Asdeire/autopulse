<script setup lang="ts">
import { computed, useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: Variant
    size?: Size
    disabled?: boolean
    loading?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
  },
)

const attrs = useAttrs()
const buttonAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})

const classes = computed(() => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2'

  const size =
    props.size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'

  const disabled = props.disabled || props.loading ? 'opacity-60 pointer-events-none' : ''

  const variant =
    props.variant === 'primary'
      ? 'bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-bold shadow-sm'
      : props.variant === 'secondary'
        ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-sm'
        : props.variant === 'danger'
          ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
          : 'bg-transparent hover:bg-neutral-100 text-neutral-900'

  return [base, size, variant, disabled, attrs.class]
})
</script>

<template>
  <button v-bind="buttonAttrs" :type="type" :disabled="disabled || loading" :class="classes">
    <span
      v-if="loading"
      class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-900/30 border-t-neutral-900"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

