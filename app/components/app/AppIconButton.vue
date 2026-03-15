<script setup lang="ts">
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  label: string
  disabled?: boolean
  loading?: boolean
}>(), {
  disabled: false,
  loading: false,
})

const attrs = useAttrs()
</script>

<template>
  <button
    v-bind="attrs"
    type="button"
    :disabled="disabled || loading"
    :aria-label="label"
    :class="cn('inline-flex h-11 w-11 items-center justify-center rounded-pill border border-line/20 bg-white/88 text-foreground shadow-sm transition-colors duration-200 hover:border-line/40 hover:bg-surface-soft/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-55', attrs.class as string)"
  >
    <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
    <slot v-else />
  </button>
</template>
