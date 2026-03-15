<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  invalid?: boolean
  modelModifiers?: Record<string, boolean>
}>(), {
  modelValue: '',
  invalid: false,
  modelModifiers: () => ({}),
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number | null): void
}>()

const attrs = useAttrs()

const inputValue = computed(() => props.modelValue ?? '')

const forwardedAttrs = computed(() => {
  const attrsObject = { ...attrs }
  delete attrsObject.class
  return attrsObject
})

const handleInput = (event: Event) => {
  const element = event.target as HTMLInputElement
  let nextValue: string | number | null = element.value

  if (props.modelModifiers.number) {
    nextValue = element.value === '' ? null : Number(element.value)
  }
  else if (props.modelModifiers.trim) {
    nextValue = element.value.trim()
  }

  emit('update:modelValue', nextValue)
}
</script>

<template>
  <input
    v-bind="forwardedAttrs"
    :value="inputValue"
    :class="cn('app-control', invalid && 'border-danger/35 focus-visible:border-danger/45 focus-visible:ring-danger/15', attrs.class as string)"
    @input="handleInput"
  >
</template>
