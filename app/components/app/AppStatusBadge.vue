<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral'

const props = withDefaults(defineProps<{
  tone?: BadgeTone
}>(), {
  tone: 'neutral',
})

const attrs = useAttrs()

const toneClassMap: Record<BadgeTone, string> = {
  primary: 'bg-primary/12 text-[rgb(123,93,28)]',
  success: 'bg-success/12 text-[rgb(47,107,59)]',
  warning: 'bg-warning/12 text-[rgb(123,93,28)]',
  danger: 'bg-danger/12 text-[rgb(126,41,41)]',
  neutral: 'bg-surface-soft/80 text-foreground/80',
}

const classes = computed(() => cn(
  'inline-flex min-h-8 items-center justify-center rounded-pill px-3 text-[0.78rem] font-bold',
  toneClassMap[props.tone],
  attrs.class as string,
))

const forwardedAttrs = computed(() => {
  const attrsObject = { ...attrs }
  delete attrsObject.class
  return attrsObject
})
</script>

<template>
  <span v-bind="forwardedAttrs" :class="classes">
    <slot />
  </span>
</template>
