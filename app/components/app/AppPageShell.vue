<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  compact?: boolean
}>(), {
  compact: false,
})

const attrs = useAttrs()

const classes = computed(() => cn(
  'py-5 md:py-6 xl:py-7 safe-pb',
  props.compact && 'py-4 md:py-5',
  attrs.class as string,
))

const forwardedAttrs = computed(() => {
  const attrsObject = { ...attrs }
  delete attrsObject.class
  return attrsObject
})
</script>

<template>
  <section v-bind="forwardedAttrs" :class="classes">
    <div class="container grid gap-4 md:gap-5">
      <slot />
    </div>
  </section>
</template>
