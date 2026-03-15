<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string | null
  invalid?: boolean
}>(), {
  modelValue: '',
  invalid: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const attrs = useAttrs()

const forwardedAttrs = computed(() => {
  const attrsObject = { ...attrs }
  delete attrsObject.class
  return attrsObject
})
</script>

<template>
  <textarea
    v-bind="forwardedAttrs"
    :value="modelValue ?? ''"
    :class="cn('app-control min-h-[120px] py-3', invalid && 'border-danger/35 focus-visible:border-danger/45 focus-visible:ring-danger/15', attrs.class as string)"
    @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
