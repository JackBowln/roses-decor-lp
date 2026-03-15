<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  fetchFinalQuote,
  fetchSale,
  fetchSales,
  transitionSale,
  type LoadedFinalQuotePayload,
  type LoadedSalePayload,
} from '@/lib/quoteWorkspaceApi'
import type { SaleListItem } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const route = useRoute()
const saleDetail = ref<LoadedSalePayload | null>(null)
const isLoading = ref(true)
const isUpdatingStatus = ref(false)

const sale = computed(() => saleDetail.value?.sale || null)
const quote = computed(() => saleDetail.value?.quote || null)
const currentTag = computed(() => sale.value?.status === 'pago' ? 'Pago' : 'Vendido')
const backToSalesPath = computed(() => {
  if (sale.value?.customerId) {
    return `/gestao/vendas?customerId=${sale.value.customerId}`
  }

  return '/gestao/vendas'
})

const buildSaleDetailFallback = (matchedSale: SaleListItem, quote: LoadedFinalQuotePayload): LoadedSalePayload => ({
  sale: matchedSale,
  quote,
  customer: quote.customer,
  preQuote: quote.preQuote,
  seamstress: quote.seamstress,
  installer: quote.installer,
  stageTransitions: quote.stageTransitions,
})

const loadSale = async () => {
  const id = typeof route.params.id === 'string' ? route.params.id : ''

  try {
    isLoading.value = true
    saleDetail.value = await fetchSale(id)
  }
  catch (error) {
    saleDetail.value = null

    try {
      const response = await fetchSales({ search: id, status: 'all' })
      const matchedSale = response.sales.find((entry) => entry.id === id || entry.code === id)

      if (matchedSale) {
        const quote = await fetchFinalQuote(matchedSale.quoteId)
        saleDetail.value = buildSaleDetailFallback(matchedSale, quote)
        return
      }
    }
    catch {
      saleDetail.value = null
    }

    toast.error(getApiErrorMessage(error, 'Não foi possível carregar a venda.'))
  }
  finally {
    isLoading.value = false
  }
}

const markAsPaid = async () => {
  if (!sale.value || sale.value.status !== 'vendido') {
    return
  }

  try {
    isUpdatingStatus.value = true
    await transitionSale(sale.value.quoteId, 'pago')
    await loadSale()
    toast.success('Venda marcada como paga.')
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o status da venda.'))
  }
  finally {
    isUpdatingStatus.value = false
  }
}

onMounted(() => {
  void loadSale()
})

watch(() => route.params.id, () => {
  void loadSale()
})
</script>

<template>
  <AppPageShell>
    <AppPageHeader
      kicker="Venda"
      :title="sale ? sale.code : 'Resumo da venda'"
      description="Resumo completo do cliente, responsáveis, itens vendidos e acompanhamento do pagamento."
    >
      <template #side>
        <div class="flex flex-wrap gap-2">
          <AppButton :to="backToSalesPath" variant="secondary" size="sm">
            Voltar para vendas
          </AppButton>
          <AppButton
            v-if="quote"
            :to="`/gestao/orcamentos?quoteId=${quote.id}`"
            variant="secondary"
            size="sm"
          >
            Abrir orçamento
          </AppButton>
          <AppButton
            v-if="sale?.status === 'vendido'"
            :loading="isUpdatingStatus"
            size="sm"
            @click="markAsPaid"
          >
            {{ isUpdatingStatus ? 'Atualizando...' : 'Marcar como pago' }}
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <AppSectionCard v-if="isLoading">
      <p class="text-sm text-muted/78">Carregando venda...</p>
    </AppSectionCard>

    <AppEmptyState
      v-else-if="!sale || !quote"
      title="Venda não encontrada"
      description="Confira o vínculo com o orçamento e tente novamente."
    />

    <template v-else>
      <AdminSaleDetailView :detail="saleDetail" />
    </template>
  </AppPageShell>
</template>
