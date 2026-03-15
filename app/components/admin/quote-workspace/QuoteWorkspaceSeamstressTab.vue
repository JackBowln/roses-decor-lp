<script setup lang="ts">
import type { QuoteStakeholder } from '@/lib/adminQuote'
import type { SeamstressRecord, SeamstressStockBalanceView } from '@/lib/quoteWorkspace'

const props = defineProps<{
  selectedSeamstressId: string | null
  seamstresses: SeamstressRecord[]
  seamstress: QuoteStakeholder
  previewLines: string[]
  stockBalances: SeamstressStockBalanceView[]
}>()

const emit = defineEmits<{
  (event: 'update:selectedSeamstressId', value: string | null): void
}>()

const updateSeamstressId = (value: string | number) => {
  emit('update:selectedSeamstressId', typeof value === 'string' && value ? value : null)
}
</script>

<template>
  <AppSectionCard class="grid gap-5">
    <div class="grid gap-2">
      <span class="app-kicker">Pedido da costureira</span>
      <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">Contato e instruções de confecção</h2>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <AppField label="Costureira responsável">
        <AppSelect :model-value="selectedSeamstressId ?? ''" @update:model-value="updateSeamstressId">
          <option value="">Selecione</option>
          <option v-for="seamstressOption in seamstresses" :key="seamstressOption.id" :value="seamstressOption.id">
            {{ seamstressOption.name }}
          </option>
        </AppSelect>
      </AppField>

      <AppField label="E-mail">
        <AppInput v-model="seamstress.email" type="email" placeholder="costura@email.com" readonly />
      </AppField>

      <AppField label="WhatsApp">
        <AppInput :model-value="seamstress.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999" readonly />
      </AppField>
    </div>

    <AppField label="Observações para costura">
      <AppTextarea
        v-model="seamstress.notes"
        rows="5"
        placeholder="Recados de produção, prioridade, acabamento, emendas..."
      />
    </AppField>

    <div class="grid gap-4 lg:grid-cols-2">
      <AdminRecordCard kicker="Prévia" title="Resumo operacional" subtitle="Trecho inicial do pedido enviado à costureira">
        <ul class="grid gap-2 pl-4 text-sm leading-6 text-muted/78">
          <li v-for="line in previewLines" :key="line">{{ line }}</li>
        </ul>
      </AdminRecordCard>

      <AdminRecordCard
        v-if="selectedSeamstressId"
        kicker="Saldo rápido"
        title="Estoque vinculado"
        subtitle="Primeiros tecidos disponíveis para a costureira selecionada"
      >
        <ul v-if="stockBalances.length" class="grid gap-2 pl-4 text-sm leading-6 text-muted/78">
          <li v-for="balance in stockBalances.slice(0, 6)" :key="balance.id">
            {{ balance.fabric.name }}<span v-if="balance.fabric.colorOrCollection"> • {{ balance.fabric.colorOrCollection }}</span>
            : {{ balance.balanceMeters.toFixed(2) }} m
          </li>
        </ul>
        <p v-else class="text-sm leading-6 text-muted/78">Sem estoque cadastrado para esta costureira.</p>
      </AdminRecordCard>
    </div>
  </AppSectionCard>
</template>
