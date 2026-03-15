<script setup lang="ts">
import { computed } from 'vue'
import { createEmptyItemFabricConsumption, type QuoteLineItem } from '@/lib/adminQuote'
import {
  adminQuoteItemFieldHelp,
  buildQuoteItemConsumptionHint,
  parseNullableMeters,
} from '@/lib/adminQuoteItemCard'
import type { FabricRecord, SeamstressRecord } from '@/lib/quoteWorkspace'

const props = defineProps<{
  item: QuoteLineItem
  fabrics: FabricRecord[]
  seamstresses: SeamstressRecord[]
  fabricPriceById: Record<string, number>
  stockByFabricId: Record<string, number>
  selectedSeamstressId: string | null
}>()

const emit = defineEmits<{
  (event: 'update:selectedSeamstressId', value: string | null): void
}>()

const seamstressSelected = computed(() => Boolean(props.selectedSeamstressId))

const canManageFabricConsumptions = computed(() => seamstressSelected.value && props.fabrics.length > 0)

const fabricConsumptionDisabledReason = computed(() => {
  if (!seamstressSelected.value) {
    return 'Selecione a costureira responsável aqui para liberar o tecido de estoque.'
  }

  if (!props.fabrics.length) {
    return 'Cadastre ou ative um tecido no estoque antes de informar consumo.'
  }

  return ''
})

const addConsumption = () => {
  if (!canManageFabricConsumptions.value) {
    return
  }

  props.item.fabricConsumptions = [...(props.item.fabricConsumptions || []), createEmptyItemFabricConsumption()]
}

const removeConsumption = (id: string) => {
  props.item.fabricConsumptions = (props.item.fabricConsumptions || []).filter((consumption) => consumption.id !== id)
}

const getConsumptionHint = (consumption: QuoteLineItem['fabricConsumptions'][number]) =>
  buildQuoteItemConsumptionHint({
    item: props.item,
    consumption,
    stockByFabricId: props.stockByFabricId,
    fabricPriceById: props.fabricPriceById,
  })

const updateSeamstressId = (value: string | number) => {
  emit('update:selectedSeamstressId', typeof value === 'string' && value ? value : null)
}
</script>

<template>
  <div class="grid gap-4 rounded-[22px] border border-line/15 bg-surface-soft/65 p-5">
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)_auto] xl:items-start">
      <div class="grid gap-2">
        <div class="flex items-center gap-2">
          <span class="app-kicker mb-0">Estoque da costureira</span>
          <AppFieldHelp title="Baixa de estoque" :description="adminQuoteItemFieldHelp.stockSection" />
        </div>
        <h4 class="text-base text-foreground">Tecido real para baixa de estoque</h4>
        <p class="text-sm leading-6 text-muted/78">
          Use aqui o tecido físico separado no estoque. A costureira escolhida neste bloco vale para o orçamento inteiro e libera os tecidos disponíveis.
        </p>
      </div>

      <AppField>
        <template #label>
          <span>Costureira do orçamento</span>
          <AppFieldHelp
            title="Responsável da costura"
            description="Você pode definir a costureira responsável aqui sem sair da memória de cálculo. Essa escolha vale para todos os itens do orçamento."
          />
        </template>
        <AppSelect :model-value="selectedSeamstressId ?? ''" @update:model-value="updateSeamstressId">
          <option value="">Selecione</option>
          <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">
            {{ seamstress.name }}
          </option>
        </AppSelect>
      </AppField>

      <AppButton variant="secondary" :disabled="!canManageFabricConsumptions" @click="addConsumption">
        Adicionar tecido
      </AppButton>
    </div>

    <p v-if="fabricConsumptionDisabledReason" class="text-sm leading-6 text-muted/78">
      {{ fabricConsumptionDisabledReason }}
    </p>

    <div v-else-if="!item.fabricConsumptions.length" class="text-sm leading-6 text-muted/78">
      Nenhum consumo vinculado a este item.
    </div>

    <div v-else class="grid gap-3">
      <div
        v-for="consumption in item.fabricConsumptions"
        :key="consumption.id"
        class="grid gap-4 rounded-[18px] border border-line/10 bg-white/85 p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(180px,0.55fr)_minmax(220px,0.65fr)]"
      >
        <AppField>
          <template #label>
            <span>Tecido do estoque da costureira</span>
            <AppFieldHelp title="Tecido de estoque" :description="adminQuoteItemFieldHelp.stockFabric" />
          </template>
          <AppSelect v-model="consumption.fabricId">
            <option value="">Selecione</option>
            <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
              {{ [fabric.name, fabric.colorOrCollection, `R$ ${fabric.pricePerMeter.toFixed(2)}/m`].filter(Boolean).join(' • ') }}
            </option>
          </AppSelect>
        </AppField>

        <AppField>
          <template #label>
            <span>Consumo (m)</span>
            <AppFieldHelp title="Consumo" :description="adminQuoteItemFieldHelp.stockConsumption" />
          </template>
          <AppInput
            :model-value="consumption.quantityMeters"
            type="number"
            min="0"
            step="0.01"
            placeholder="8.50"
            @update:model-value="consumption.quantityMeters = parseNullableMeters(String($event ?? ''))"
          />
        </AppField>

        <div class="grid content-center gap-3">
          <small class="text-xs leading-5 text-muted/70">{{ getConsumptionHint(consumption) }}</small>
          <AppButton variant="ghost" class="justify-start text-danger hover:bg-danger/5 hover:text-danger" @click="removeConsumption(consumption.id)">
            Remover tecido
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
