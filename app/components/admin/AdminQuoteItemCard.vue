<script setup lang="ts">
import { computed } from 'vue'
import type { FabricRecord, SeamstressRecord } from '@/lib/quoteWorkspace'
import type { QuoteLineItem } from '@/lib/adminQuote'
import { hasAutomaticMaterialPricingForItem } from '@/lib/adminQuoteItemCard'
import AdminQuoteItemDetailsSection from '@/components/admin/quote-item/AdminQuoteItemDetailsSection.vue'
import AdminQuoteItemPricingSection from '@/components/admin/quote-item/AdminQuoteItemPricingSection.vue'
import AdminQuoteItemFabricStockSection from '@/components/admin/quote-item/AdminQuoteItemFabricStockSection.vue'

const props = defineProps<{
  item: QuoteLineItem
  index: number
  disableRemove: boolean
  fabrics: FabricRecord[]
  seamstresses: SeamstressRecord[]
  fabricPriceById: Record<string, number>
  stockByFabricId: Record<string, number>
  selectedSeamstressId: string | null
}>()

defineEmits<{
  (event: 'duplicate'): void
  (event: 'remove'): void
  (event: 'update:selectedSeamstressId', value: string | null): void
}>()

const itemTitle = computed(() => props.item.room || props.item.openingLabel || 'Novo ambiente')

const hasAutomaticMaterialPrice = computed(() =>
  hasAutomaticMaterialPricingForItem(props.item, props.fabricPriceById))
</script>

<template>
  <AppSectionCard class="grid gap-5 md:gap-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <span class="app-kicker">Ambiente {{ index + 1 }}</span>
        <h3 class="text-[1.35rem] text-foreground md:text-[1.5rem]">{{ itemTitle }}</h3>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <AppButton variant="secondary" @click="$emit('duplicate')">
          Duplicar
        </AppButton>
        <AppButton variant="ghost" class="text-danger hover:bg-danger/5 hover:text-danger" :disabled="disableRemove" @click="$emit('remove')">
          Remover
        </AppButton>
      </div>
    </div>

    <AdminQuoteItemDetailsSection :item="item" />

    <AdminQuoteItemPricingSection :item="item" :automatic-material-price="hasAutomaticMaterialPrice" />

    <AdminQuoteItemFabricStockSection
      :item="item"
      :fabrics="fabrics"
      :seamstresses="seamstresses"
      :fabric-price-by-id="fabricPriceById"
      :stock-by-fabric-id="stockByFabricId"
      :selected-seamstress-id="selectedSeamstressId"
      @update:selected-seamstress-id="$emit('update:selectedSeamstressId', $event)"
    />
  </AppSectionCard>
</template>
