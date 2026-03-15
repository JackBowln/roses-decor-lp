<script setup lang="ts">
import { computed, resolveComponent, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const props = withDefaults(defineProps<{
  to?: string | Record<string, unknown>
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  block?: boolean
}>(), {
  type: 'button',
  variant: 'secondary',
  size: 'md',
  loading: false,
  disabled: false,
  block: false,
})

const attrs = useAttrs()

const componentTag = computed(() => props.to ? resolveComponent('NuxtLink') : 'button')

const forwardedAttrs = computed(() => {
  const attrsObject = { ...attrs }
  delete attrsObject.class
  return attrsObject
})

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-white hover:bg-primary-strong focus-visible:ring-primary/25',
  secondary: 'border-line/20 bg-white/90 text-foreground hover:border-line/40 hover:bg-surface-soft/65 focus-visible:ring-primary/20',
  ghost: 'border-transparent bg-transparent text-foreground hover:bg-surface-soft/75 focus-visible:ring-primary/20',
  danger: 'border-transparent bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/20',
  success: 'border-transparent bg-success text-white hover:bg-success/90 focus-visible:ring-success/20',
}

const sizeClassMap: Record<ButtonSize, string> = {
  sm: 'min-h-touch px-4 text-xs font-bold',
  md: 'min-h-touch px-5 text-sm font-bold',
  lg: 'min-h-[52px] px-6 text-sm font-bold',
  icon: 'h-11 w-11 p-0',
}

const classes = computed(() => cn(
  'inline-flex items-center justify-center gap-2 rounded-pill border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-55',
  variantClassMap[props.variant],
  sizeClassMap[props.size],
  props.block && 'w-full',
  attrs.class as string,
))

const componentProps = computed(() => {
  if (props.to) {
    return {
      ...forwardedAttrs.value,
      to: props.to,
      'aria-disabled': props.disabled || props.loading ? 'true' : undefined,
      tabindex: props.disabled || props.loading ? -1 : undefined,
    }
  }

  return {
    ...forwardedAttrs.value,
    type: props.type,
    disabled: props.disabled || props.loading,
  }
})
</script>

<template>
  <component :is="componentTag" v-bind="componentProps" :class="classes">
    <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
    <slot />
  </component>
</template>
