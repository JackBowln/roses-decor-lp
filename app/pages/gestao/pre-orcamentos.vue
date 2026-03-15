<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { convertPreQuoteToFinalQuote, fetchPreQuotes } from '@/lib/quoteWorkspaceApi'
import { matchesSearchQuery } from '@/lib/search'
import { getPreQuoteStatusLabel, type PreQuoteListItem } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const route = useRoute()
const isLoading = ref(true)
const isConverting = ref<string | null>(null)
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const preQuotes = ref<PreQuoteListItem[]>([])

const statusToneByRecord = (status: PreQuoteListItem['status']) => {
  if (status === 'convertido') return 'success'
  if (status === 'em_analise') return 'primary'
  return 'warning'
}

const filteredPreQuotes = computed(() => {
  return preQuotes.value.filter((record) =>
    matchesSearchQuery(search.value, [record.code, record.customer.name, record.customer.locationLabel]),
  )
})

const loadPreQuotes = async () => {
  try {
    isLoading.value = true
    const response = await fetchPreQuotes({
      customerId: typeof route.query.customerId === 'string' ? route.query.customerId : '',
      search: typeof route.query.search === 'string' ? route.query.search : '',
    })

    preQuotes.value = response.preQuotes
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar os pré-orçamentos.'))
  }
  finally {
    isLoading.value = false
  }
}

const viewPdf = (id: string) => {
  window.open(`/api/admin/pre-quotes/${id}/pdf`, '_blank', 'noopener,noreferrer')
}

const convertToFinalQuote = async (id: string) => {
  try {
    isConverting.value = id
    const response = await convertPreQuoteToFinalQuote(id)
    await loadPreQuotes()
    await navigateTo(`/gestao/orcamentos?quoteId=${response.finalQuote.id}`)
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível converter o pré-orçamento.'))
  }
  finally {
    isConverting.value = null
  }
}

watch(search, async (value) => {
  await navigateTo({
    query: {
      ...route.query,
      search: value || undefined,
    },
  }, { replace: true })
})

watch(() => route.fullPath, () => {
  void loadPreQuotes()
})

onMounted(() => {
  void loadPreQuotes()
})
</script>

<template>
  <AppPageShell>
    <AppPageHeader
      kicker="Pré-orçamentos"
      title="Triagem comercial do site"
      description="Clientes e solicitações que vieram do formulário público, prontas para análise e conversão."
    >
      <template #side>
        <div class="grid gap-3">
          <AppField label="Buscar pré-orçamentos">
            <AppInput v-model="search" type="search" placeholder="Buscar por código, cliente ou localização" />
          </AppField>
          <AppButton to="/gestao/orcamentos" variant="secondary" block>
            Abrir orçamento vazio
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <AppSectionCard v-if="isLoading">
      <p class="text-sm text-muted/85">Carregando pré-orçamentos...</p>
    </AppSectionCard>

    <AppEmptyState
      v-else-if="filteredPreQuotes.length === 0"
      title="Nenhum pré-orçamento encontrado"
      description="Tente outro filtro ou aguarde novos registros vindos do site."
    />

    <AppSectionCard v-else class="grid gap-4 md:gap-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <strong class="text-sm font-bold text-foreground">{{ filteredPreQuotes.length }} registros</strong>
      </div>

      <div class="grid gap-4 md:hidden">
        <AdminRecordCard
          v-for="record in filteredPreQuotes"
          :key="record.id"
          :kicker="record.code"
          :title="record.customer.name"
          :subtitle="record.customer.locationLabel || record.customer.whatsapp"
        >
          <div class="grid gap-3 sm:grid-cols-3">
            <AdminSummaryCard label="Data" :value="new Date(record.createdAt).toLocaleDateString('pt-BR')" />
            <AdminSummaryCard label="Itens" :value="record.itemCount" />
            <div class="grid gap-1 rounded-[18px] bg-surface-soft/80 p-4">
              <span class="text-xs font-semibold uppercase tracking-[0.12em] text-muted/68">Etapa</span>
              <div class="flex flex-wrap gap-2">
                <AppStatusBadge tone="warning">Pré-orçamento</AppStatusBadge>
                <AppStatusBadge :tone="statusToneByRecord(record.status)">
                  {{ getPreQuoteStatusLabel(record.status) }}
                </AppStatusBadge>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <AppButton size="sm" @click="viewPdf(record.id)">Ver PDF</AppButton>
            <AppButton
              size="sm"
              variant="primary"
              :loading="isConverting === record.id"
              @click="convertToFinalQuote(record.id)"
            >
              {{ isConverting === record.id ? 'Convertendo...' : 'Converter em orçamento' }}
            </AppButton>
          </div>
        </AdminRecordCard>
      </div>

      <div class="app-data-table-shell hidden md:block">
        <table class="app-data-table min-w-[880px]">
          <thead>
            <tr>
              <th>Código</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Status</th>
              <th>Itens</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in filteredPreQuotes" :key="record.id">
              <td>
                <strong class="text-foreground">{{ record.code }}</strong>
              </td>
              <td>
                <div class="font-bold text-foreground">{{ record.customer.name }}</div>
                <div class="mt-1 text-sm text-muted/70">{{ record.customer.locationLabel || record.customer.whatsapp }}</div>
              </td>
              <td>{{ new Date(record.createdAt).toLocaleDateString('pt-BR') }}</td>
              <td>
                <div class="flex flex-wrap gap-2">
                  <AppStatusBadge tone="warning">Pré-orçamento</AppStatusBadge>
                  <AppStatusBadge :tone="statusToneByRecord(record.status)">
                    {{ getPreQuoteStatusLabel(record.status) }}
                  </AppStatusBadge>
                </div>
              </td>
              <td>{{ record.itemCount }}</td>
              <td>
                <div class="flex flex-wrap gap-2">
                  <AppButton size="sm" @click="viewPdf(record.id)">Ver PDF</AppButton>
                  <AppButton
                    size="sm"
                    variant="primary"
                    :loading="isConverting === record.id"
                    @click="convertToFinalQuote(record.id)"
                  >
                    {{ isConverting === record.id ? 'Convertendo...' : 'Converter em orçamento' }}
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppSectionCard>
  </AppPageShell>
</template>
