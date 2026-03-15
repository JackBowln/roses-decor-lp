<script setup lang="ts">
import type { QuoteProject } from '@/lib/adminQuote'
import type { SaleRecord, StoredFinalQuote } from '@/lib/quoteWorkspace'

const props = defineProps<{
  project: QuoteProject
  quoteStatus: StoredFinalQuote['status']
  linkedSale: SaleRecord | null
  summaryStatusLabel: string
}>()

const emit = defineEmits<{
  (event: 'update:quoteStatus', value: StoredFinalQuote['status']): void
}>()

const updateQuoteStatus = (value: string | number) => {
  if (value === 'rascunho' || value === 'pronto' || value === 'cancelado') {
    emit('update:quoteStatus', value)
  }
}
</script>

<template>
  <AppSectionCard class="grid gap-5">
    <div class="grid gap-2">
      <span class="app-kicker">Projeto</span>
      <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">Condições do orçamento</h2>
    </div>

    <div class="grid gap-4 xl:grid-cols-5">
      <AppField label="Código">
        <AppInput v-model="project.code" type="text" />
      </AppField>
      <AppField label="Data do orçamento">
        <AppInput v-model="project.createdAt" type="date" />
      </AppField>
      <AppField label="Válido até">
        <AppInput v-model="project.validUntil" type="date" />
      </AppField>
      <AppField label="Responsável">
        <AppInput v-model="project.salesRep" type="text" placeholder="Consultora responsável" />
      </AppField>
      <AppField label="Status">
        <AppSelect :model-value="quoteStatus" :disabled="Boolean(linkedSale)" @update:model-value="updateQuoteStatus">
          <option value="rascunho">Orçamento</option>
          <option value="pronto">Orçamento concluído</option>
          <option value="cancelado">Cancelado</option>
        </AppSelect>
      </AppField>
    </div>

    <p v-if="linkedSale" class="text-sm leading-6 text-muted/78">
      Este orçamento já foi convertido em {{ summaryStatusLabel.toLowerCase() }}. O estágio comercial passa a ser controlado pela aba de vendas.
    </p>

    <div class="grid gap-4 lg:grid-cols-3">
      <AppField label="Prazo de entrega">
        <AppInput v-model="project.deliveryLeadTime" type="text" placeholder="20 dias" />
      </AppField>
      <AppField label="Instalação">
        <AppInput v-model="project.installationTerms" type="text" placeholder="Inclusa no valor" />
      </AppField>
      <AppField label="Taxa de deslocamento (R$)">
        <AppInput v-model.number="project.travelFee" type="number" min="0" step="0.01" />
      </AppField>
      <AppField label="Taxa adicional de instalação (R$)">
        <AppInput v-model.number="project.installationFee" type="number" min="0" step="0.01" />
      </AppField>
      <AppField label="Desconto total (R$)">
        <AppInput v-model.number="project.discount" type="number" min="0" step="0.01" />
      </AppField>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <AppField label="Desconto à vista (%)">
        <AppInput v-model.number="project.cashDiscountRate" type="number" min="0" step="1" />
      </AppField>
      <AppField label="Desconto cartão (%)">
        <AppInput v-model.number="project.cardDiscountRate" type="number" min="0" step="1" />
      </AppField>
      <AppField label="Parcelas no cartão">
        <AppInput v-model.number="project.cardInstallments" type="number" min="1" step="1" />
      </AppField>
    </div>

    <div class="grid gap-4 xl:grid-cols-3">
      <AppField label="Forma de pagamento">
        <AppInput v-model="project.paymentMethod" type="text" placeholder="Pix, cartão, boleto, a combinar" />
      </AppField>
      <AppField label="Condição de pagamento">
        <AppTextarea v-model="project.paymentTerms" rows="4" />
      </AppField>
      <AppField label="Observações gerais">
        <AppTextarea v-model="project.notes" rows="4" />
      </AppField>
    </div>
  </AppSectionCard>
</template>
