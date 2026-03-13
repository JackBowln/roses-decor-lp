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
  <div class="tabs-shell">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="tab-button"
      :class="{ 'tab-button-active': tab.id === activeTab }"
      @click="$emit('select', tab.id)"
    >
      <span class="tab-label">{{ tab.label }}</span>
      <span class="tab-description">{{ tab.description }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs-shell {
  display: grid;
  gap: 12px;
}

.tab-button {
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid rgba(197, 160, 89, 0.14);
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.tab-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(26, 26, 26, 0.08);
}

.tab-button-active {
  border-color: rgba(197, 160, 89, 0.42);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(247, 239, 226, 0.98));
  box-shadow: 0 16px 36px rgba(26, 26, 26, 0.08);
}

.tab-label {
  display: block;
  color: var(--text-dark);
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.tab-description {
  display: block;
  color: rgba(61, 61, 61, 0.82);
  font-size: 0.88rem;
  line-height: 1.5;
}
</style>
