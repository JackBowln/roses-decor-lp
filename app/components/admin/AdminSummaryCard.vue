<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  value: string | number
  hint?: string
}>(), {
  hint: '',
})
</script>

<template>
  <div class="grid gap-1 rounded-[18px] bg-surface-soft/80 p-4">
    <span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted/68">{{ label }}</span>
    <strong class="text-lg text-foreground">{{ value }}</strong>
    <span v-if="hint" class="text-xs leading-5 text-muted/68">{{ hint }}</span>
  </div>
</template>
