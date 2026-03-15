<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { QuoteTabId, QuoteWorkbookTab } from '@/lib/adminQuote'

defineProps<{
  tabs: QuoteWorkbookTab[]
  activeTab: QuoteTabId
}>()

defineEmits<{
  (event: 'select', tab: QuoteTabId): void
}>()
</script>

<template>
  <div class="grid gap-3 md:gap-3.5">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      :class="cn('rounded-[22px] border border-line/15 bg-white/72 px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card', tab.id === activeTab && 'border-line/40 bg-gradient-to-br from-white/96 to-surface-soft/95 shadow-card')"
      @click="$emit('select', tab.id)"
    >
      <span class="block text-[0.95rem] font-bold text-foreground">{{ tab.label }}</span>
      <span class="mt-1 block text-sm leading-6 text-muted/82">{{ tab.description }}</span>
    </button>
  </div>
</template>
