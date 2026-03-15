<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { fetchCustomers } from '@/lib/quoteWorkspaceApi'
import { matchesSearchQuery } from '@/lib/search'
import type { CustomerSummary } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const search = ref('')
const isLoading = ref(true)
const customers = ref<CustomerSummary[]>([])

const filteredCustomers = computed(() => {
  return customers.value.filter((customer) =>
    matchesSearchQuery(search.value, [customer.name, customer.whatsapp, customer.locationLabel]))
})

const loadCustomers = async () => {
  try {
    isLoading.value = true
    const response = await fetchCustomers()
    customers.value = response.customers
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar os clientes.'))
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadCustomers()
})
</script>

<template>
  <AppPageShell>
    <AppPageHeader
      kicker="Clientes"
      title="Relacionamento e histórico"
      description="Base consolidada de clientes com vínculo entre pré-orçamentos do site e orçamentos finais."
    >
      <template #side>
        <AppField label="Buscar clientes">
          <AppInput v-model="search" type="search" placeholder="Buscar por nome, WhatsApp ou localização" />
        </AppField>
      </template>
    </AppPageHeader>

    <AppSectionCard v-if="isLoading">
      <p class="text-sm text-muted/85">Carregando clientes...</p>
    </AppSectionCard>

    <AppEmptyState
      v-else-if="filteredCustomers.length === 0"
      title="Nenhum cliente encontrado"
      description="Ajuste o termo de busca ou aguarde novos pré-orçamentos e orçamentos finais serem registrados."
    />

    <AppSectionCard v-else class="grid gap-4 md:gap-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminRecordCard
          v-for="customer in filteredCustomers"
          :key="customer.id"
          kicker="Cliente"
          :title="customer.name"
          :subtitle="customer.locationLabel ? `${customer.whatsapp} • ${customer.locationLabel}` : customer.whatsapp"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <AdminSummaryCard label="Pré-orçamentos" :value="customer.preQuoteCount" />
            <AdminSummaryCard label="Orçamentos finais" :value="customer.finalQuoteCount" />
            <AdminSummaryCard label="Vendas" :value="customer.saleCount" />
            <AdminSummaryCard label="Pagas" :value="customer.paidSaleCount" />
          </div>

          <div class="flex flex-wrap gap-2">
            <AppButton :to="`/gestao/pre-orcamentos?customerId=${customer.id}`" size="sm">
              Ver pré-orçamentos
            </AppButton>
            <AppButton :to="`/gestao/vendas?customerId=${customer.id}`" size="sm" variant="secondary">
              Ver vendas
            </AppButton>
            <AppButton
              v-if="customer.lastSaleId"
              :to="`/gestao/vendas/${customer.lastSaleId}`"
              size="sm"
              variant="secondary"
            >
              Última venda
            </AppButton>
            <AppButton
              v-if="customer.lastFinalQuoteId"
              :to="`/gestao/orcamentos?quoteId=${customer.lastFinalQuoteId}`"
              size="sm"
            >
              Abrir {{ customer.lastFinalQuoteCode }}
            </AppButton>
            <AppButton to="/gestao/orcamentos" variant="primary" size="sm">
              Novo orçamento
            </AppButton>
          </div>

          <div class="grid gap-1 text-xs leading-5 text-muted/70">
            <span v-if="customer.lastPreQuoteAt">
              Último pré-orçamento: {{ new Date(customer.lastPreQuoteAt).toLocaleDateString('pt-BR') }}
            </span>
            <span v-if="customer.lastFinalQuoteAt">
              Último orçamento final: {{ new Date(customer.lastFinalQuoteAt).toLocaleDateString('pt-BR') }}
            </span>
            <span v-if="customer.lastSaleAt">
              Última venda: {{ new Date(customer.lastSaleAt).toLocaleDateString('pt-BR') }}
            </span>
          </div>
        </AdminRecordCard>
      </div>
    </AppSectionCard>
  </AppPageShell>
</template>
