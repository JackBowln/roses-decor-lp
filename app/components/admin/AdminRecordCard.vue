<script setup lang="ts">
const props = withDefaults(defineProps<{
  kicker?: string
  title: string
  subtitle?: string
}>(), {
  kicker: '',
  subtitle: '',
})
</script>

<template>
  <article class="grid gap-4 rounded-[24px] border border-line/15 bg-white/72 p-5">
    <div class="space-y-1.5">
      <span v-if="kicker" class="app-kicker">{{ kicker }}</span>
      <h2 class="text-[1.25rem] text-foreground">{{ title }}</h2>
      <p v-if="subtitle" class="text-sm leading-6 text-muted/76">{{ subtitle }}</p>
    </div>

    <slot />
  </article>
</template>
