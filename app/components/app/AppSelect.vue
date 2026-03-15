<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue?: string | number | null
  invalid?: boolean
}>(), {
  modelValue: '',
  invalid: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | number): void
}>()

const attrs = useAttrs()

const forwardedAttrs = computed(() => {
  const attrsObject = { ...attrs }
  delete attrsObject.class
  return attrsObject
})
</script>

<template>
  <select
    v-bind="forwardedAttrs"
    :value="modelValue ?? ''"
    :class="cn('app-control appearance-none bg-[right_1rem_center] bg-no-repeat pr-10', invalid && 'border-danger/35 focus-visible:border-danger/45 focus-visible:ring-danger/15', attrs.class as string)"
    @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <slot />
  </select>
</template>
