<script setup lang="ts">
import type { QuoteLineItem } from '@/lib/adminQuote'
import { adminQuoteItemFieldHelp, parseNullableNumber } from '@/lib/adminQuoteItemCard'

const props = defineProps<{
  item: QuoteLineItem
  automaticMaterialPrice: boolean
}>()
</script>

<template>
  <div class="grid gap-4 xl:grid-cols-3">
    <AppField :description="automaticMaterialPrice
      ? 'Calculado automaticamente pelos tecidos consumidos. Sem metragem informada, usa largura x quantidade como estimativa.'
      : 'Pode ser preenchido manualmente quando nao houver tecido precificado.'">
      <template #label>
        <span>Preço do material (R$)</span>
        <AppFieldHelp title="Preço do material" :description="adminQuoteItemFieldHelp.unitPrice" />
      </template>
      <AppInput
        :model-value="item.unitPrice"
        type="number"
        min="0"
        step="0.01"
        placeholder="0,00"
        :readonly="automaticMaterialPrice"
        @update:model-value="item.unitPrice = parseNullableNumber(String($event ?? ''))"
      />
    </AppField>

    <AppField>
      <template #label>
        <span>Preço da costura (R$)</span>
        <AppFieldHelp title="Preço da costura" :description="adminQuoteItemFieldHelp.sewingPrice" />
      </template>
      <AppInput
        :model-value="item.sewingPrice"
        type="number"
        min="0"
        step="0.01"
        placeholder="0,00"
        @update:model-value="item.sewingPrice = parseNullableNumber(String($event ?? ''))"
      />
    </AppField>

    <AppField>
      <template #label>
        <span>Preço da instalação (R$)</span>
        <AppFieldHelp title="Preço da instalação" :description="adminQuoteItemFieldHelp.installationPrice" />
      </template>
      <AppInput
        :model-value="item.installationPrice"
        type="number"
        min="0"
        step="0.01"
        placeholder="0,00"
        @update:model-value="item.installationPrice = parseNullableNumber(String($event ?? ''))"
      />
    </AppField>
  </div>
</template>
