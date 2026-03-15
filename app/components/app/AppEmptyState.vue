<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string
  description?: string
}>(), {
  description: '',
})
</script>

<template>
  <AppSectionCard class="grid gap-3 text-center">
    <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-soft/85 text-primary">
      <slot name="icon" />
    </div>
    <div class="space-y-1.5">
      <h2 class="font-serif text-2xl text-foreground">{{ title }}</h2>
      <p v-if="description" class="text-sm leading-6 text-muted/76">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center justify-center gap-3">
      <slot />
    </div>
  </AppSectionCard>
</template>
