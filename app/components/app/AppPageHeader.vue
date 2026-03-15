<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  kicker?: string
  title: string
  description?: string
  dense?: boolean
  alignTop?: boolean
}>(), {
  kicker: '',
  description: '',
  dense: false,
  alignTop: false,
})

const slots = useSlots()
const hasSide = computed(() => Boolean(slots.side))
</script>

<template>
  <AppSectionCard
    variant="hero"
    :padding="dense ? 'md' : 'lg'"
    :class="cn('grid gap-4 lg:gap-5', hasSide && 'lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]', hasSide && (alignTop ? 'lg:items-start' : 'lg:items-end'))"
  >
    <div class="min-w-0">
      <span v-if="kicker" class="app-kicker">{{ kicker }}</span>
      <h1 class="text-[clamp(1.7rem,3vw,2.6rem)] leading-[1.04] text-foreground">
        {{ title }}
      </h1>
      <p v-if="description" class="mt-2 max-w-3xl text-sm leading-6 text-muted/88 md:text-[0.95rem]">
        {{ description }}
      </p>
    </div>

    <div v-if="hasSide" class="min-w-0">
      <slot name="side" />
    </div>
  </AppSectionCard>
</template>
