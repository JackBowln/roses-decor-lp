<script setup lang="ts">
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
  <AdminSectionTabs :tabs="tabs" :active-tab="activeTab" @select="$emit('select', $event)" />
</template>
