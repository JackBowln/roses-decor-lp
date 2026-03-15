<script setup lang="ts">
import { toast } from 'vue-sonner'
import { formatCurrency } from '@/lib/adminQuote'
import { getApiErrorMessage } from '@/lib/apiError'
import { groupSalesByCustomer, getQuoteLifecycleTone } from '@/lib/sales'
import {
  fetchInstallers,
  fetchSale,
  fetchSales,
  fetchSalesDashboardMetrics,
  fetchSeamstresses,
  transitionSale,
  type LoadedSalePayload,
} from '@/lib/quoteWorkspaceApi'
import type { SaleListItem, SaleRecord, SalesDashboardMetrics, SalesDashboardRange } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const route = useRoute()

const isLoadingSales = ref(true)
const isLoadingMetrics = ref(false)
const isLoadingReferences = ref(true)
const sales = ref<SaleListItem[]>([])
const metrics = ref<SalesDashboardMetrics | null>(null)
const seamstresses = ref<Array<{ id: string; name: string }>>([])
const installers = ref<Array<{ id: string; name: string }>>([])
const activeView = ref<'sales' | 'dashboards'>('sales')
const dashboardRange = ref<SalesDashboardRange>('week')
const isSaleDialogOpen = ref(false)
const isLoadingSaleDetail = ref(false)
const isUpdatingSaleStatus = ref(false)
const selectedSaleId = ref('')
const selectedSaleListItem = ref<SaleListItem | null>(null)
const selectedSaleDetail = ref<LoadedSalePayload | null>(null)
const filters = reactive({
  customerId: '',
  search: '',
  status: 'all' as SaleListItem['status'] | 'all',
  dateFrom: '',
  dateTo: '',
  paymentMethod: '',
  seamstressId: '',
  installerId: '',
  productType: '' as SaleListItem['productTypes'][number] | '',
  sortBy: 'date' as 'customer' | 'date' | 'value' | 'status',
})

const groupedSales = computed(() => groupSalesByCustomer(sales.value))
const paymentMethodOptions = computed(() =>
  [...new Set(sales.value.map((sale) => sale.paymentMethod).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, 'pt-BR')))

const saleSummaryCards = computed(() => [
  {
    label: 'Vendas',
    value: sales.value.length,
  },
  {
    label: 'Clientes',
    value: groupedSales.value.length,
  },
  {
    label: 'Total vendido',
    value: formatCurrency(sales.value.reduce((sum, sale) => sum + sale.totalValue, 0)),
  },
  {
    label: 'Pagas',
    value: sales.value.filter((sale) => sale.status === 'pago').length,
  },
])
const selectedSale = computed(() => selectedSaleDetail.value?.sale || selectedSaleListItem.value || null)
const selectedSaleCustomer = computed(() => selectedSaleDetail.value?.customer || selectedSaleListItem.value?.customer || null)

const syncStateFromRoute = () => {
  activeView.value = route.query.view === 'dashboards' ? 'dashboards' : 'sales'
  dashboardRange.value = route.query.range === 'month' || route.query.range === 'year' ? route.query.range : 'week'
  filters.customerId = typeof route.query.customerId === 'string' ? route.query.customerId : ''
  filters.search = typeof route.query.search === 'string' ? route.query.search : ''
  filters.status = route.query.status === 'vendido' || route.query.status === 'pago' ? route.query.status : 'all'
  filters.dateFrom = typeof route.query.dateFrom === 'string' ? route.query.dateFrom : ''
  filters.dateTo = typeof route.query.dateTo === 'string' ? route.query.dateTo : ''
  filters.paymentMethod = typeof route.query.paymentMethod === 'string' ? route.query.paymentMethod : ''
  filters.seamstressId = typeof route.query.seamstressId === 'string' ? route.query.seamstressId : ''
  filters.installerId = typeof route.query.installerId === 'string' ? route.query.installerId : ''
  filters.productType = route.query.productType === 'cortina' || route.query.productType === 'persiana'
    ? route.query.productType
    : ''
  filters.sortBy = route.query.sortBy === 'customer' || route.query.sortBy === 'value' || route.query.sortBy === 'status'
    ? route.query.sortBy
    : 'date'
}

const buildQuery = () => ({
  view: activeView.value !== 'sales' ? activeView.value : undefined,
  range: activeView.value === 'dashboards' ? dashboardRange.value : undefined,
  customerId: filters.customerId || undefined,
  search: filters.search || undefined,
  status: filters.status !== 'all' ? filters.status : undefined,
  dateFrom: filters.dateFrom || undefined,
  dateTo: filters.dateTo || undefined,
  paymentMethod: filters.paymentMethod || undefined,
  seamstressId: filters.seamstressId || undefined,
  installerId: filters.installerId || undefined,
  productType: filters.productType || undefined,
  sortBy: filters.sortBy !== 'date' ? filters.sortBy : undefined,
})

const loadSales = async () => {
  try {
    isLoadingSales.value = true
    const response = await fetchSales({
      customerId: filters.customerId || undefined,
      search: filters.search || undefined,
      status: filters.status,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      seamstressId: filters.seamstressId || undefined,
      installerId: filters.installerId || undefined,
      productType: filters.productType || undefined,
      sortBy: filters.sortBy,
    })
    sales.value = response.sales
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar as vendas.'))
  }
  finally {
    isLoadingSales.value = false
  }
}

const loadMetrics = async () => {
  try {
    isLoadingMetrics.value = true
    const response = await fetchSalesDashboardMetrics({
      range: dashboardRange.value,
      customerId: filters.customerId || undefined,
      search: filters.search || undefined,
      status: filters.status,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      paymentMethod: filters.paymentMethod || undefined,
      seamstressId: filters.seamstressId || undefined,
      installerId: filters.installerId || undefined,
      productType: filters.productType || undefined,
    })
    metrics.value = response.metrics
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o dashboard de vendas.'))
  }
  finally {
    isLoadingMetrics.value = false
  }
}

const loadReferences = async () => {
  try {
    isLoadingReferences.value = true
    const [seamstressResponse, installerResponse] = await Promise.all([
      fetchSeamstresses('all'),
      fetchInstallers('all'),
    ])

    seamstresses.value = seamstressResponse.seamstresses.map((entry) => ({ id: entry.id, name: entry.name }))
    installers.value = installerResponse.installers.map((entry) => ({ id: entry.id, name: entry.name }))
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar os filtros auxiliares de vendas.'))
  }
  finally {
    isLoadingReferences.value = false
  }
}

const loadCurrentView = async () => {
  await loadSales()

  if (activeView.value === 'dashboards') {
    await loadMetrics()
  }
}

const applyFilters = async () => {
  await navigateTo({
    path: '/gestao/vendas',
    query: buildQuery(),
  }, { replace: true })
}

const setView = async (view: 'sales' | 'dashboards') => {
  activeView.value = view
  await applyFilters()
}

const setDashboardRange = async (range: SalesDashboardRange) => {
  dashboardRange.value = range
  await applyFilters()
}

const closeSaleDetail = () => {
  isSaleDialogOpen.value = false
}

const loadSaleDetail = async (saleId = selectedSaleId.value) => {
  if (!saleId) {
    selectedSaleDetail.value = null
    return
  }

  try {
    isLoadingSaleDetail.value = true
    selectedSaleDetail.value = await fetchSale(saleId)
  }
  catch (error) {
    selectedSaleDetail.value = null
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o detalhe da venda.'))
  }
  finally {
    isLoadingSaleDetail.value = false
  }
}

const openSaleDetail = async (sale: SaleListItem) => {
  selectedSaleId.value = sale.id
  selectedSaleListItem.value = sale
  selectedSaleDetail.value = null
  isSaleDialogOpen.value = true
  await loadSaleDetail(sale.id)
}

const updateSaleStatus = async (status: SaleRecord['status']) => {
  if (!selectedSale.value) {
    return
  }

  try {
    isUpdatingSaleStatus.value = true
    await transitionSale(selectedSale.value.quoteId, status)
    await Promise.all([
      loadSaleDetail(selectedSaleId.value),
      loadSales(),
      activeView.value === 'dashboards' ? loadMetrics() : Promise.resolve(),
    ])
    toast.success(status === 'pago' ? 'Venda marcada como paga.' : 'Status da venda atualizado.')
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o status da venda.'))
  }
  finally {
    isUpdatingSaleStatus.value = false
  }
}

watch(() => route.fullPath, () => {
  syncStateFromRoute()
  void loadCurrentView()
})

onMounted(() => {
  syncStateFromRoute()
  void loadReferences()
  void loadCurrentView()
})
</script>

<template>
  <AppPageShell>
    <AppPageHeader kicker="Vendas" title="Histórico comercial e pagamento"
      description="Acompanhe vendas por cliente, veja o funil comercial e mantenha o status financeiro separado do orçamento.">
      <template #side>
        <div class="flex flex-wrap gap-2">
          <AppButton :variant="activeView === 'sales' ? 'primary' : 'secondary'" size="sm" @click="setView('sales')">
            Vendas
          </AppButton>
          <AppButton :variant="activeView === 'dashboards' ? 'primary' : 'secondary'" size="sm"
            @click="setView('dashboards')">
            Dashboards
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <AppSectionCard>
      <form class="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]" @submit.prevent="applyFilters">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AppField label="Buscar">
            <AppInput v-model="filters.search" type="search" placeholder="Cliente, código, responsável ou pagamento" />
          </AppField>
          <AppField label="Status">
            <AppSelect v-model="filters.status">
              <option value="all">Todos</option>
              <option value="vendido">Vendido</option>
              <option value="pago">Pago</option>
            </AppSelect>
          </AppField>
          <AppField label="Ordenação">
            <AppSelect v-model="filters.sortBy">
              <option value="date">Data da venda</option>
              <option value="customer">Nome do cliente</option>
              <option value="value">Valor total</option>
              <option value="status">Status</option>
            </AppSelect>
          </AppField>
          <AppField label="Período inicial">
            <AppInput v-model="filters.dateFrom" type="date" />
          </AppField>
          <AppField label="Período final">
            <AppInput v-model="filters.dateTo" type="date" />
          </AppField>
          <AppField label="Tipo do produto">
            <AppSelect v-model="filters.productType">
              <option value="">Todos</option>
              <option value="cortina">Cortina</option>
              <option value="persiana">Persiana</option>
            </AppSelect>
          </AppField>
          <AppField label="Forma de pagamento">
            <AppSelect v-model="filters.paymentMethod">
              <option value="">Todas</option>
              <option v-for="method in paymentMethodOptions" :key="method" :value="method">
                {{ method }}
              </option>
            </AppSelect>
          </AppField>
          <AppField label="Costureira">
            <AppSelect v-model="filters.seamstressId" :disabled="isLoadingReferences">
              <option value="">Todas</option>
              <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">
                {{ seamstress.name }}
              </option>
            </AppSelect>
          </AppField>
          <AppField label="Instalador">
            <AppSelect v-model="filters.installerId" :disabled="isLoadingReferences">
              <option value="">Todos</option>
              <option v-for="installer in installers" :key="installer.id" :value="installer.id">
                {{ installer.name }}
              </option>
            </AppSelect>
          </AppField>
        </div>

        <div class="grid gap-4">
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminSummaryCard v-for="card in saleSummaryCards" :key="card.label" :label="card.label"
              :value="card.value" />
          </div>

          <div class="flex flex-wrap items-center gap-2 xl:justify-end">
            <AppButton type="submit" variant="primary" size="sm">
              Aplicar filtros
            </AppButton>
            <AppButton type="button" variant="secondary" size="sm"
              @click="navigateTo('/gestao/vendas', { replace: true })">
              Limpar
            </AppButton>
          </div>
        </div>
      </form>
    </AppSectionCard>

    <AppSectionCard v-if="activeView === 'dashboards'">
      <div class="flex flex-wrap items-center gap-2">
        <AppButton :variant="dashboardRange === 'week' ? 'primary' : 'secondary'" size="sm"
          @click="setDashboardRange('week')">
          Semana
        </AppButton>
        <AppButton :variant="dashboardRange === 'month' ? 'primary' : 'secondary'" size="sm"
          @click="setDashboardRange('month')">
          Mês
        </AppButton>
        <AppButton :variant="dashboardRange === 'year' ? 'primary' : 'secondary'" size="sm"
          @click="setDashboardRange('year')">
          Ano
        </AppButton>
      </div>

      <p v-if="isLoadingMetrics" class="text-sm text-muted/78">Carregando indicadores...</p>

      <div v-else-if="metrics" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminSummaryCard label="Total vendido" :value="formatCurrency(metrics.totalSold)" />
        <AdminSummaryCard label="Total pago" :value="formatCurrency(metrics.totalPaid)" />
        <AdminSummaryCard label="Quantidade de vendas" :value="metrics.saleCount" />
        <AdminSummaryCard label="Ticket médio" :value="formatCurrency(metrics.ticketAverage)" />
        <AdminSummaryCard label="Clientes com compra" :value="metrics.customerCount" />
        <AdminSummaryCard label="Vendas em aberto" :value="metrics.soldCount" />
        <AdminSummaryCard label="Vendas pagas" :value="metrics.paidCount" />
        <AdminSummaryCard label="Conversão orçamento → venda" :value="`${metrics.conversionRate.toFixed(1)}%`" />
        <AdminSummaryCard label="Pagamento mais usado" :value="metrics.topPaymentMethod" />
        <AdminSummaryCard label="Costureira com mais vendas" :value="metrics.topSeamstress" />
        <AdminSummaryCard label="Instalador com mais vendas" :value="metrics.topInstaller" />
        <AdminSummaryCard label="Categoria mais vendida" :value="metrics.topCategory" />
      </div>
    </AppSectionCard>

    <AppSectionCard v-if="activeView === 'sales' && isLoadingSales">
      <p class="text-sm text-muted/78">Carregando vendas...</p>
    </AppSectionCard>

    <AppEmptyState v-else-if="activeView === 'sales' && groupedSales.length === 0" title="Nenhuma venda encontrada"
      description="Ajuste os filtros ou conclua orçamentos para começar a alimentar o histórico comercial." />

    <div v-else-if="activeView === 'sales'" class="grid gap-4">
      <AppSectionCard v-for="group in groupedSales" :key="group.customer.id" class="grid gap-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div class="grid gap-1">
            <span class="app-kicker">Cliente</span>
            <h2 class="text-[1.25rem] text-foreground">{{ group.customer.name }}</h2>
            <p class="text-sm text-muted/78">
              {{ group.customer.whatsapp || group.customer.email || 'Contato pendente' }}
              <template v-if="group.customer.locationLabel">
                • {{ group.customer.locationLabel }}
              </template>
            </p>
            <p class="text-sm text-muted/70">
              {{ group.saleCount }} venda<span v-if="group.saleCount > 1">s</span> vinculada<span
                v-if="group.saleCount > 1">s</span> a este cliente.
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-3">
            <AdminSummaryCard label="Vendas" :value="group.saleCount" />
            <AdminSummaryCard label="Total" :value="formatCurrency(group.totalValue)" />
            <AdminSummaryCard label="Última venda"
              :value="group.lastSoldAt ? new Date(group.lastSoldAt).toLocaleDateString('pt-BR') : 'Sem data'" />
          </div>
        </div>

        <div class="grid gap-4 md:hidden">
          <AdminRecordCard v-for="sale in group.sales" :key="sale.id" :kicker="sale.code" :title="sale.productLabel"
            :subtitle="`Vendida em ${new Date(sale.soldAt).toLocaleDateString('pt-BR')}`">
            <div class="grid gap-3 sm:grid-cols-2">
              <AdminSummaryCard label="Status" :value="sale.status === 'pago' ? 'Pago' : 'Vendido'" />
              <AdminSummaryCard label="Valor" :value="formatCurrency(sale.totalValue)" />
              <AdminSummaryCard label="Pagamento" :value="sale.paymentMethod" />
              <AdminSummaryCard label="Itens" :value="sale.itemCount" />
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <AppStatusBadge :tone="getQuoteLifecycleTone(sale.status === 'pago' ? 'Pago' : 'Vendido')">
                {{ sale.status === 'pago' ? 'Pago' : 'Vendido' }}
              </AppStatusBadge>
              <span class="text-sm text-muted/75">{{ sale.seamstressName }} • {{ sale.installerName }}</span>
            </div>

            <AppButton size="sm" block @click="openSaleDetail(sale)">
              Abrir detalhes da venda
            </AppButton>
          </AdminRecordCard>
        </div>

        <div class="app-data-table-shell hidden md:block">
          <table class="app-data-table min-w-[1120px]">
            <thead>
              <tr>
                <th>Código</th>
                <th>Data</th>
                <th>Status</th>
                <th>Valor</th>
                <th>Pagamento</th>
                <th>Costureira</th>
                <th>Instalador</th>
                <th>Itens</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sale in group.sales" :key="sale.id">
                <td>
                  <button type="button" class="font-bold text-foreground underline-offset-4 hover:underline"
                    @click="openSaleDetail(sale)">
                    {{ sale.code }}
                  </button>
                  <div class="mt-1 text-sm text-muted/70">{{ sale.productLabel }}</div>
                </td>
                <td>{{ new Date(sale.soldAt).toLocaleDateString('pt-BR') }}</td>
                <td>
                  <AppStatusBadge :tone="getQuoteLifecycleTone(sale.status === 'pago' ? 'Pago' : 'Vendido')">
                    {{ sale.status === 'pago' ? 'Pago' : 'Vendido' }}
                  </AppStatusBadge>
                </td>
                <td>{{ formatCurrency(sale.totalValue) }}</td>
                <td>{{ sale.paymentMethod }}</td>
                <td>{{ sale.seamstressName }}</td>
                <td>{{ sale.installerName }}</td>
                <td>{{ sale.itemCount }}</td>
                <td>
                  <AppButton size="sm" @click="openSaleDetail(sale)">
                    Ver venda
                  </AppButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppSectionCard>
    </div>

    <AppDialog :open="isSaleDialogOpen" title="Detalhe da venda" size="xl" @close="closeSaleDetail">
      <template #actions>
        <AppButton v-if="selectedSale?.status === 'vendido'" :loading="isUpdatingSaleStatus" size="sm"
          @click="updateSaleStatus('pago')">
          {{ isUpdatingSaleStatus ? 'Atualizando...' : 'Marcar como pago' }}
        </AppButton>
      </template>

      <AppSectionCard v-if="isLoadingSaleDetail">
        <p class="text-sm text-muted/78">Carregando dados completos da venda...</p>
      </AppSectionCard>

      <AdminSaleDetailView v-else-if="selectedSaleDetail" :detail="selectedSaleDetail" />
      <AppEmptyState
        v-else
        title="Detalhe completo indisponível"
        description="Os dados principais da venda continuam visíveis acima. Se o problema persistir, revise o vínculo com o orçamento."
      />

    </AppDialog>
  </AppPageShell>
</template>
