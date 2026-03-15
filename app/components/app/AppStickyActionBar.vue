<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const classes = computed(() => cn(
  'sticky bottom-0 z-sticky-bar mt-4 rounded-card border border-line/15 bg-white/92 p-4 shadow-sticky backdrop-blur supports-[backdrop-filter]:bg-white/82 safe-pb',
  attrs.class as string,
))

const forwardedAttrs = computed(() => {
  const attrsObject = { ...attrs }
  delete attrsObject.class
  return attrsObject
})
</script>

<template>
  <div v-bind="forwardedAttrs" :class="classes">
    <slot />
  </div>
</template>
