<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string
}>(), {
  label: 'Ações',
})
</script>

<template>
  <details class="relative">
    <summary class="list-none">
      <AppButton variant="secondary" size="sm">{{ label }}</AppButton>
    </summary>
    <div class="absolute right-0 z-overlay mt-2 min-w-44 rounded-card border border-line/15 bg-white p-2 shadow-elevated">
      <slot />
    </div>
  </details>
</template>
