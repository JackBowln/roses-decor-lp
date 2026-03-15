<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  label?: string
  description?: string
  error?: string
  required?: boolean
  forId?: string
}>(), {
  label: '',
  description: '',
  error: '',
  required: false,
  forId: '',
})

const slots = useSlots()
const hasHint = computed(() => Boolean(props.description || props.error || slots.hint))
</script>

<template>
  <label class="grid gap-2.5" :for="forId || undefined">
    <span v-if="label || $slots.label" class="flex items-center gap-2 text-sm font-bold text-foreground/90">
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="text-danger">*</span>
    </span>

    <slot />

    <span v-if="hasHint" class="text-xs leading-5" :class="error ? 'text-danger' : 'text-muted/70'">
      <slot name="hint">{{ error || description }}</slot>
    </span>
  </label>
</template>
