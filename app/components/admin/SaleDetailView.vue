<script setup lang="ts">
import { computed } from 'vue'
import { formatArea, formatBlackoutLabel, formatCurrency, resolveInstallationMeters } from '@/lib/adminQuote'
import { getQuoteLifecycleTone } from '@/lib/sales'
import { getFinalQuoteStatusLabel, getSaleStatusLabel, type QuoteStageTransitionRecord } from '@/lib/quoteWorkspace'
import type { LoadedSalePayload } from '@/lib/quoteWorkspaceApi'

const props = defineProps<{
  detail: LoadedSalePayload
}>()

const sale = computed(() => props.detail.sale)
const quote = computed(() => props.detail.quote)
const stageTransitions = computed<QuoteStageTransitionRecord[]>(() => props.detail.stageTransitions || [])
const currentTag = computed(() => sale.value.status === 'pago' ? 'Pago' : 'Vendido')
const paymentStatusText = computed(() =>
  sale.value.status === 'pago'
    ? `Pagamento confirmado em ${sale.value.paidAt ? new Date(sale.value.paidAt).toLocaleDateString('pt-BR') : 'data não informada'}.`
    : 'Pagamento ainda pendente.')

const formatStageLabel = (value: string) => {
  if (value === 'vendido' || value === 'pago') {
    return getSaleStatusLabel(value)
  }

  if (value === 'rascunho' || value === 'pronto' || value === 'cancelado') {
    return getFinalQuoteStatusLabel(value)
  }

  return value || 'Início'
}

const heroMetrics = computed(() => [
  {
    label: 'Status',
    value: currentTag.value,
  },
  {
    label: 'Valor total',
    value: formatCurrency(sale.value.totalValue),
  },
  {
    label: 'Forma de pagamento',
    value: sale.value.paymentMethod,
  },
  {
    label: 'Itens vendidos',
    value: String(sale.value.itemCount),
  },
])

const customerAddress = computed(() => {
  const record = quote.value.record

  return [
    record.customer.address,
    record.customer.complement,
    record.customer.neighborhood,
    record.customer.city ? `${record.customer.city}${record.customer.state ? `/${record.customer.state}` : ''}` : '',
    record.customer.zipcode ? `CEP ${record.customer.zipcode}` : '',
  ].filter(Boolean).join(' • ') || 'Endereço pendente'
})

const installationItems = computed(() =>
  quote.value.record.items.filter((item) => item.installationIncluded === 'SIM'))

const installationSummary = computed(() => ({
  date: quote.value.record.project.installationDate || 'Pendente',
  totalMeters: installationItems.value.reduce((total, item) => total + resolveInstallationMeters(item), 0),
  itemCount: installationItems.value.length,
}))

const seamstressContact = computed(() =>
  quote.value.record.seamstress.email || quote.value.record.seamstress.whatsapp || 'Contato pendente')

const installerContact = computed(() =>
  quote.value.record.installer.email || quote.value.record.installer.whatsapp || 'Contato pendente')

const fabricUsageSummary = computed(() => {
  const summary = new Map<string, {
    label: string
    itemCount: number
    quantity: number
    consumedMeters: number
  }>()

  quote.value.record.items.forEach((item) => {
    const label = [item.fabric, item.fabricColor].filter(Boolean).join(' • ') || 'Tecido não informado'
    const current = summary.get(label) || {
      label,
      itemCount: 0,
      quantity: 0,
      consumedMeters: 0,
    }

    current.itemCount += 1
    current.quantity += item.quantity
    current.consumedMeters += item.fabricConsumptions.reduce(
      (total, consumption) => total + (typeof consumption.quantityMeters === 'number' ? consumption.quantityMeters : 0),
      0,
    )

    summary.set(label, current)
  })

  return [...summary.values()]
})

const buildStockConsumptionLabel = (item: typeof quote.value.record.items[number]) => {
  if (!item.fabricConsumptions.length) {
    return 'Sem consumo de estoque vinculado'
  }

  const totalMeters = item.fabricConsumptions.reduce(
    (total, consumption) => total + (typeof consumption.quantityMeters === 'number' ? consumption.quantityMeters : 0),
    0,
  )

  return `${item.fabricConsumptions.length} consumo(s) • ${totalMeters.toFixed(2)} m`
}
</script>

<template>
  <div class="grid gap-4 sm:gap-5">
    <AppSectionCard>
        <div class="flex flex-wrap gap-4">
          <div class="flex flex-wrap items-center gap-3">
            <span class="app-kicker">Cliente e financeiro</span>
          </div>
          <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
            <AdminRecordCard kicker="Cliente" :title="quote.record.customer.name || 'Cliente não informado'" :subtitle="quote.record.customer.phone || quote.record.customer.email">
              <div class="grid gap-2 text-sm leading-6 text-muted/78">
                <span>{{ customerAddress }}</span>
                <span v-if="quote.record.customer.email">E-mail: {{ quote.record.customer.email }}</span>
                <span v-if="quote.record.customer.phone">WhatsApp: {{ quote.record.customer.phone }}</span>
                <span v-if="quote.record.customer.zipcode">CEP: {{ quote.record.customer.zipcode }}</span>
              </div>
            </AdminRecordCard>

            <AdminRecordCard kicker="Dados comerciais" :title="sale.code" :subtitle="sale.paymentMethod">
              <div class="grid gap-3 sm:grid-cols-2">
                <AdminSummaryCard label="Valor total" :value="formatCurrency(sale.totalValue)" />
                <AdminSummaryCard label="Itens" :value="sale.itemCount" />
                <AdminSummaryCard label="Desconto aplicado" :value="formatCurrency(quote.record.project.discount || 0)" />
                <AdminSummaryCard label="Status" :value="currentTag" />
              </div>
              <p class="text-sm leading-6 text-muted/78">{{ quote.record.project.paymentTerms || 'Condição de pagamento não informada.' }}</p>
            </AdminRecordCard>
          <AdminRecordCard kicker="Responsáveis" title="Operação vinculada" subtitle="Costureira e instalador do pedido">
              <div class="grid gap-3 sm:grid-cols-2">
                <AdminSummaryCard label="Costureira" :value="sale.seamstressName" />
                <AdminSummaryCard label="Contato costura" :value="seamstressContact" />
                <AdminSummaryCard label="Instalador" :value="sale.installerName" />
                <AdminSummaryCard label="Contato instalação" :value="installerContact" />
                <AdminSummaryCard label="Data de instalação" :value="installationSummary.date" />
                <AdminSummaryCard label="Itens instaláveis" :value="installationSummary.itemCount" />
              </div>
  
              <p v-if="quote.record.seamstress.notes" class="text-sm leading-6 text-muted/78">
                <strong class="text-foreground">Observações da costureira:</strong> {{ quote.record.seamstress.notes }}
              </p>
              <p v-if="quote.record.installer.notes" class="text-sm leading-6 text-muted/78">
                <strong class="text-foreground">Observações do instalador:</strong> {{ quote.record.installer.notes }}
              </p>
          </AdminRecordCard>
  
          <AdminRecordCard kicker="Tecidos" title="Tecidos usados no pedido" subtitle="Base comercial do item e consumo vinculado ao orçamento">
            <div class="grid gap-3 text-sm leading-6 text-muted/78">
              <div
                v-for="fabric in fabricUsageSummary"
                :key="fabric.label"
                class="rounded-[18px] bg-surface-soft/72 px-4 py-3"
              >
                <strong class="block text-foreground">{{ fabric.label }}</strong>
                <span>{{ fabric.itemCount }} item(ns) • {{ fabric.quantity }} unidade(s)</span>
                <span class="block">
                  Consumo de estoque: {{ fabric.consumedMeters > 0 ? `${fabric.consumedMeters.toFixed(2)} m` : 'Sem baixa registrada' }}
                </span>
              </div>
            </div>
          </AdminRecordCard>
  
          <AdminRecordCard kicker="Histórico" title="Transições" subtitle="Movimentação do pedido até o pagamento">
            <div class="grid gap-2 text-sm leading-6 text-muted/78">
              <div
                v-for="transition in stageTransitions"
                :key="transition.id"
                class="rounded-[18px] bg-surface-soft/72 px-4 py-3"
              >
                <strong class="block text-foreground">
                  {{ formatStageLabel(transition.fromStage) }} → {{ formatStageLabel(transition.toStage) }}
                </strong>
                <span>{{ new Date(transition.changedAt).toLocaleString('pt-BR') }}</span>
              </div>
            </div>
          </AdminRecordCard>
          </div>
        </div>
    </AppSectionCard>

    <AppSectionCard>
      <div class="grid gap-4">
        <div>
          <span class="app-kicker">Itens vendidos</span>
          <h2 class="text-[1.2rem] text-foreground">Composição do pedido</h2>
        </div>

        <div class="grid gap-4">
          <AdminRecordCard
            v-for="item in quote.record.items"
            :key="item.id"
            :kicker="item.room || 'Ambiente'"
            :title="item.category"
            :subtitle="item.openingLabel || 'Vão não informado'"
          >
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AdminSummaryCard label="Ambiente" :value="item.room || 'Ambiente não informado'" />
              <AdminSummaryCard label="Tipo" :value="item.category" />
              <AdminSummaryCard label="Quantidade" :value="item.quantity" />
              <AdminSummaryCard label="Medidas" :value="formatArea(item.width, item.height)" />
              <AdminSummaryCard label="Blackout" :value="formatBlackoutLabel(item.blackout)" />
            </div>

            <div class="grid gap-2 text-sm leading-6 text-muted/78">
              <span><strong class="text-foreground">Tecido:</strong> {{ item.fabric }}<template v-if="item.fabricColor"> • {{ item.fabricColor }}</template></span>
              <span><strong class="text-foreground">Instalação:</strong> {{ item.installationIncluded }}<template v-if="item.installationIncluded === 'SIM'"> • {{ resolveInstallationMeters(item).toFixed(2) }} m</template></span>
              <span><strong class="text-foreground">Consumo de estoque:</strong> {{ buildStockConsumptionLabel(item) }}</span>
              <span><strong class="text-foreground">Observações:</strong> {{ item.notes || 'Sem observações operacionais.' }}</span>
            </div>
          </AdminRecordCard>
        </div>
      </div>
    </AppSectionCard>
    <AppSectionCard>
      <div class="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.95fr)]">
        <div class="grid gap-4 rounded-[24px] border border-line/15 bg-white/72 p-5 shadow-card">
          <div class="grid gap-2">
            <span class="app-kicker">Visão geral da venda</span>
            <h2 class="text-[1.35rem] text-foreground">{{ quote.record.customer.name || 'Cliente não informado' }}</h2>
            <p class="text-sm leading-6 text-muted/78">
              {{ paymentStatusText }}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <AppStatusBadge :tone="getQuoteLifecycleTone(currentTag)">
                {{ currentTag }}
              </AppStatusBadge>
              <span class="text-sm text-muted/76">
                Vendida em {{ new Date(sale.soldAt).toLocaleDateString('pt-BR') }}
              </span>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminSummaryCard v-for="metric in heroMetrics" :key="metric.label" :label="metric.label"
              :value="metric.value" />
            <AdminSummaryCard label="Instalação" :value="installationSummary.date" />
            <AdminSummaryCard label="Metros de instalação" :value="`${installationSummary.totalMeters.toFixed(2)} m`" />
          </div>
        </div>

        <AdminRecordCard kicker="Vínculos" title="Origem e contexto" subtitle="Rastreabilidade do processo comercial">
          <div class="grid gap-3 sm:grid-cols-2">
            <AdminSummaryCard label="Pré-orçamento" :value="sale.preQuoteCode || 'Sem origem do site'" />
            <AdminSummaryCard label="Código do orçamento" :value="quote.record.project.code" />
            <AdminSummaryCard label="Data do orçamento" :value="quote.record.project.createdAt || 'Pendente'" />
            <AdminSummaryCard label="Data da venda" :value="new Date(sale.soldAt).toLocaleDateString('pt-BR')" />
          </div>
        </AdminRecordCard>
      </div>
    </AppSectionCard>
  </div>
</template>
