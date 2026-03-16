<script setup lang="ts">
import type { QuoteTotals } from '@/lib/adminQuote'
import type { QuoteBusinessSummarySection } from '@/lib/adminQuoteManagement'
import QuoteWorkspaceTotalsCard from '@/components/admin/quote-workspace/QuoteWorkspaceTotalsCard.vue'

interface HeroMetric {
  label: string
  value: string
}

defineProps<{
  heroMetrics: HeroMetric[]
  sections: QuoteBusinessSummarySection[]
  totals: QuoteTotals
}>()
</script>

<template>
  <section class="grid gap-5">
    <AppSectionCard class="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)] lg:items-start">
      <div class="grid gap-3">
        <span class="app-kicker">Resumo executivo</span>
        <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">Visão rápida do cliente, responsáveis e pedido</h2>
        <p class="text-sm leading-6 text-muted/78">
          Conferência rápida para operação, comercial e acompanhamento do pedido sem precisar navegar por todas as abas.
        </p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <AdminSummaryCard
          v-for="metric in heroMetrics"
          :key="metric.label"
          :label="metric.label"
          :value="metric.value"
        />
      </div>
    </AppSectionCard>

    <div class="grid gap-4 lg:grid-cols-2">
      <AdminRecordCard
        v-for="section in sections"
        :key="section.title"
        :kicker="section.title"
        title="Resumo consolidado"
        subtitle="Leitura rápida dos dados principais desta frente do orçamento"
      >
        <ul class="grid gap-3">
          <li v-for="item in section.items" :key="`${section.title}-${item.label}`" class="grid gap-1 border-b border-line/10 pb-3 last:border-b-0 last:pb-0">
            <span class="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-muted/68">{{ item.label }}</span>
            <strong class="text-sm leading-6 text-foreground">{{ item.value }}</strong>
          </li>
        </ul>
      </AdminRecordCard>

      <QuoteWorkspaceTotalsCard :totals="totals" class="lg:col-span-2" />
    </div>
  </section>
</template>
