<script setup lang="ts">
import type { QuoteTabId, QuoteWorkbookTab } from '@/lib/adminQuote'

interface SummaryStat {
  label: string
  value: string
}

defineProps<{
  tabs: QuoteWorkbookTab[]
  activeTab: QuoteTabId
  summaryStats: SummaryStat[]
}>()

defineEmits<{
  (event: 'select', tab: QuoteTabId): void
  (event: 'new'): void
}>()
</script>

<template>
  <aside class="hidden xl:grid xl:sticky xl:top-24 xl:gap-4 xl:self-start">
    <AppSectionCard variant="hero" padding="lg" class="grid gap-3">
      <span class="app-kicker">Gestão</span>
      <h1 class="text-[clamp(1.8rem,3vw,2.9rem)] leading-[1.08] text-foreground">Central de orçamento e pedidos</h1>
      <p class="text-sm leading-6 text-muted/78">
        Trabalhe em cima de um único registro e gere o orçamento comercial, o pedido da costureira e o pedido do
        instalador sem reescrever dados.
      </p>
    </AppSectionCard>

    <AdminTabs :tabs="tabs" :active-tab="activeTab" @select="$emit('select', $event)" />

    <AppSectionCard class="grid gap-4">
      <span class="app-kicker">Resumo rápido</span>
      <div class="grid gap-3">
        <div v-for="stat in summaryStats" :key="stat.label" class="flex items-start justify-between gap-4 text-sm text-muted/84">
          <span>{{ stat.label }}</span>
          <strong class="text-right text-foreground">{{ stat.value }}</strong>
        </div>
      </div>

      <AppButton variant="secondary" block @click="$emit('new')">
        Novo orçamento
      </AppButton>
    </AppSectionCard>
  </aside>
</template>
