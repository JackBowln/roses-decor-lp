<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

type CardVariant = 'default' | 'hero' | 'soft' | 'outline'

const props = withDefaults(defineProps<{
  variant?: CardVariant
  padding?: 'md' | 'lg'
}>(), {
  variant: 'default',
  padding: 'md',
})

const attrs = useAttrs()

const variantClassMap: Record<CardVariant, string> = {
  default: 'bg-white/80 border-line/15 shadow-card',
  hero: 'bg-white/86 border-line/15 shadow-elevated',
  soft: 'bg-surface-soft/75 border-line/15 shadow-card',
  outline: 'bg-transparent border-line/20 shadow-none',
}

const paddingClassMap = {
  md: 'p-5 md:p-6',
  lg: 'p-6 md:p-7',
}

const classes = computed(() => cn(
  'rounded-card border backdrop-blur-sm',
  variantClassMap[props.variant],
  paddingClassMap[props.padding],
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
