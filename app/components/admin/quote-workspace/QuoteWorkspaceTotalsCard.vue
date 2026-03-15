<script setup lang="ts">
import { formatCurrency, type QuoteTotals } from '@/lib/adminQuote'

const props = defineProps<{
  totals: QuoteTotals
}>()

const rows = computed(() => [
  { label: 'Materiais', value: props.totals.materialSubtotal },
  { label: 'Costura', value: props.totals.sewingSubtotal },
  { label: 'Instalação', value: props.totals.installationSubtotal },
  { label: 'Extras', value: props.totals.extrasSubtotal },
  { label: 'Desconto', value: props.totals.discountTotal },
])
</script>

<template>
  <AppSectionCard class="grid gap-3">
    <span class="app-kicker">Totais</span>

    <div v-for="row in rows" :key="row.label" class="flex items-start justify-between gap-4 text-sm text-muted/84">
      <span>{{ row.label }}</span>
      <strong class="text-right text-foreground">{{ formatCurrency(row.value) }}</strong>
    </div>

    <div class="flex items-start justify-between gap-4 border-t border-line/15 pt-3 text-base">
      <span class="font-semibold text-foreground">Total final</span>
      <strong class="text-right text-foreground">{{ formatCurrency(totals.grandTotal) }}</strong>
    </div>
  </AppSectionCard>
</template>
