<script setup lang="ts">
import AdminDocumentCard from '@/components/admin/AdminDocumentCard.vue'
import AdminQuoteItemCard from '@/components/admin/AdminQuoteItemCard.vue'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import { formatCurrency, quoteWorkbookTabs, type QuoteTabId } from '@/lib/adminQuote'
import { buildQuoteBusinessSummary } from '@/lib/adminQuoteManagement'
import { resolveQuoteLifecycleTag, type StoredFinalQuote } from '@/lib/quoteWorkspace'
import { getQuoteLifecycleTone } from '@/lib/sales'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const route = useRoute()
const { refreshSession } = useAdminSession()
const {
  activeTab,
  addItem,
  canLookupZipcode,
  customerValidation,
  deliveryChecklist,
  deliverDocument,
  documents,
  downloadPdf,
  duplicateItem,
  isResolvingZipcode,
  isReady,
  installationSummary,
  lookupCustomerZipcode,
  record,
  removeItem,
  resetRecord,
  sending,
  totals,
  updateCustomerPhone,
  updateCustomerState,
  updateCustomerZipcode,
  zipcodeLookupError,
} = useAdminQuoteBuilder()

const selectedSeamstressId = ref<string | null>(null)
const selectedInstallerId = ref<string | null>(null)
const quoteStatus = ref<StoredFinalQuote['status']>('rascunho')
const {
  activeFabrics,
  activeInstallers,
  activeSeamstresses,
  fabricPriceById,
  loadInventoryReferences,
  stockBalances,
  stockByFabricId,
} = useAdminQuoteReferences({
  record,
  selectedSeamstressId,
  selectedInstallerId,
})

const {
  activeQuoteId,
  installerDispatches,
  isLoadingRecord,
  isSavingRecord,
  linkedCustomerId,
  linkedCustomerLocation,
  linkedCustomerName,
  linkedSale,
  linkedPreQuoteCode,
  linkedPreQuoteId,
  loadInstallerDispatches,
  promoteCurrentQuoteToSale,
  restoreDraftMeta,
  saveCurrentQuote,
  startEmptyQuote,
  summaryStats,
} = useAdminQuoteWorkspace({
  record,
  resetRecord,
  isReady,
  activeTab,
  selectedSeamstressId,
  selectedInstallerId,
  quoteStatus,
  totals,
})

const { documentEntries, handleDocumentDelivery } = useAdminQuoteDocuments({
  record,
  documents,
  customerValidation,
  activeQuoteId,
  selectedSeamstressId,
  selectedInstallerId,
  deliverDocument,
  onInstallerDelivered: loadInstallerDispatches,
})

const seamstressPreviewLines = computed(() =>
  documents.value.find((document) => document.kind === 'costureira')?.summary.lines.slice(0, 8) || [])

const installerPreviewLines = computed(() =>
  documents.value.find((document) => document.kind === 'instalador')?.summary.lines.slice(0, 8) || [])

const isMobileQuickNavOpen = ref(false)
const isMobileSummaryOpen = ref(false)

const activeTabMeta = computed(() =>
  quoteWorkbookTabs.find((tab) => tab.id === activeTab.value) ?? quoteWorkbookTabs[0])

const businessSummarySections = computed(() =>
  buildQuoteBusinessSummary({
    record: record.value,
    quoteStatus: quoteStatus.value,
    saleStatus: linkedSale.value?.status || null,
    linkedPreQuoteCode: linkedPreQuoteCode.value,
    linkedCustomerLocation: linkedCustomerLocation.value,
    totals: totals.value,
    installableItemCount: installationSummary.value.installableItemCount,
    installationTotalMeters: installationSummary.value.totalMeters,
    hasSeamstressResponsible: Boolean(selectedSeamstressId.value),
    hasInstallerResponsible: Boolean(selectedInstallerId.value),
  }))

const summaryStatusLabel = computed(() => {
  return resolveQuoteLifecycleTag({
    quoteStatus: quoteStatus.value,
    saleStatus: linkedSale.value?.status || null,
  })
})

const summaryStatusTone = computed(() => getQuoteLifecycleTone(summaryStatusLabel.value))

const summaryHeroMetrics = computed(() => [
  {
    label: 'Status',
    value: summaryStatusLabel.value,
  },
  {
    label: 'Total estimado',
    value: formatCurrency(totals.value.grandTotal),
  },
  {
    label: 'Itens',
    value: String(record.value.items.length),
  },
  {
    label: 'Instalação / entrega',
    value: record.value.project.installationDate || 'Pendente',
  },
])

const handleMobileTabSelect = (tab: QuoteTabId) => {
  activeTab.value = tab
}

const handleMobileTabDropdownChange = (value: string | number) => {
  if (typeof value !== 'string') {
    return
  }

  const selectedTab = quoteWorkbookTabs.find((tab) => tab.id === value)

  if (!selectedTab) {
    return
  }

  handleMobileTabSelect(selectedTab.id)
}

onMounted(() => {
  if (typeof route.query.quoteId !== 'string') {
    restoreDraftMeta()
  }

  void refreshSession()
  void loadInventoryReferences()
})
</script>

<template>
  <section class="quote-shell">
    <div class="container quote-page">
      <aside class="quote-sidebar">
        <div class="sidebar-card sidebar-card-hero">
          <span class="page-kicker">Gestão</span>
          <h1>Central de orçamento e pedidos</h1>
          <p>
            Trabalhe em cima de um único registro e gere o orçamento comercial, o pedido da costureira e o pedido do
            instalador sem reescrever dados.
          </p>
        </div>

        <AdminTabs :tabs="quoteWorkbookTabs" :active-tab="activeTab" @select="activeTab = $event" />

        <div class="sidebar-card sidebar-card-summary">
          <span class="section-kicker">Resumo rápido</span>
          <div class="summary-list">
            <div v-for="stat in summaryStats" :key="stat.label" class="summary-row">
              <span>{{ stat.label }}</span>
              <strong>{{ stat.value }}</strong>
            </div>
          </div>

          <button type="button" class="outline-button" @click="startEmptyQuote">Novo orçamento</button>
        </div>
      </aside>

      <div class="quote-mobile-nav">
        <div class="mobile-nav-card">
          <div class="mobile-nav-header">
            <div>
              <span class="section-kicker">Navegação do orçamento</span>
              <strong>{{ activeTabMeta.label }}</strong>
              <p>{{ activeTabMeta.description }}</p>
            </div>

            <div class="mobile-nav-actions">
              <button type="button" class="outline-button mobile-nav-action-button"
                :class="{ 'mobile-nav-action-button-active': isMobileQuickNavOpen }"
                @click="isMobileQuickNavOpen = !isMobileQuickNavOpen">
                {{ isMobileQuickNavOpen ? 'Ocultar seções' : 'Seções' }}
              </button>
              <button type="button" class="outline-button mobile-nav-action-button"
                :class="{ 'mobile-nav-action-button-active': isMobileSummaryOpen }"
                @click="isMobileSummaryOpen = !isMobileSummaryOpen">
                {{ isMobileSummaryOpen ? 'Ocultar resumo' : 'Resumo' }}
              </button>
            </div>
          </div>

          <div class="mobile-nav-select">
            <label class="field">
              <span>Ir para a seção</span>
              <AppSelect :model-value="activeTab" @update:model-value="handleMobileTabDropdownChange">
                <option v-for="tab in quoteWorkbookTabs" :key="tab.id" :value="tab.id">
                  {{ tab.label }}
                </option>
              </AppSelect>
            </label>
          </div>

          <div v-if="isMobileQuickNavOpen" class="mobile-expandable-bar">
            <div class="mobile-expandable-bar-head">
              <span class="section-kicker">Atalhos rápidos</span>
              <button type="button" class="outline-button mobile-collapse-button" @click="isMobileQuickNavOpen = false">
                Fechar
              </button>
            </div>
            <div class="mobile-nav-grid">
              <button v-for="tab in quoteWorkbookTabs" :key="tab.id" type="button" class="mobile-tab-button"
                :class="{ 'mobile-tab-button-active': tab.id === activeTab }" @click="handleMobileTabSelect(tab.id)">
                <span>{{ tab.label }}</span>
                <small>{{ tab.description }}</small>
              </button>
            </div>
          </div>

          <div v-if="isMobileSummaryOpen" class="mobile-expandable-bar">
            <div class="mobile-expandable-bar-head">
              <span class="section-kicker">Resumo rápido</span>
              <button type="button" class="outline-button mobile-collapse-button" @click="isMobileSummaryOpen = false">
                Fechar
              </button>
            </div>
            <div class="mobile-summary-strip">
              <div v-for="stat in summaryStats" :key="stat.label" class="mobile-summary-pill">
                <span>{{ stat.label }}</span>
                <strong>{{ stat.value }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="quote-content" v-if="isLoadingRecord">
        <div class="panel-card">
          <span class="section-kicker">Carregando</span>
          <h2>Abrindo orçamento final</h2>
          <p>Recuperando o vínculo com cliente e pré-orçamento.</p>
        </div>
      </div>

      <div class="quote-content" v-else-if="isReady">
        <div class="panel-card panel-card-top">
          <div>
            <span class="section-kicker">Projeto</span>
            <h2>{{ record.project.code }}</h2>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <AppStatusBadge :tone="summaryStatusTone">
                {{ summaryStatusLabel }}
              </AppStatusBadge>
            </div>
            <p>Fluxo pensado para reduzir erro operacional e manter o que será enviado consistente entre cliente e
              equipe.</p>
          </div>
          <div class="top-actions">
            <NuxtLink
              v-if="linkedSale"
              :to="`/gestao/vendas/${linkedSale.id}`"
              class="outline-button"
            >
              Abrir venda
            </NuxtLink>
            <button
              v-else-if="activeQuoteId && quoteStatus === 'pronto'"
              type="button"
              class="outline-button"
              @click="promoteCurrentQuoteToSale"
            >
              Marcar como vendido
            </button>
            <button type="button" class="outline-button" @click="startEmptyQuote">Novo orçamento vazio</button>
            <button type="button" class="primary-button" :disabled="isSavingRecord" @click="saveCurrentQuote">
              {{ isSavingRecord ? 'Salvando...' : 'Salvar orçamento' }}
            </button>
          </div>
        </div>

        <div v-if="linkedPreQuoteId || linkedCustomerId || linkedSale" class="panel-card relation-card">
          <div class="relation-grid">
            <div>
              <span class="section-kicker">Cliente vinculado</span>
              <strong>{{ linkedCustomerName || record.customer.name || 'Cliente sem identificação' }}</strong>
              <p>{{ linkedCustomerLocation || record.customer.city || record.customer.neighborhood || 'Origem não informada' }}</p>
            </div>

            <div v-if="linkedPreQuoteId">
              <span class="section-kicker">Pré-orçamento de origem</span>
              <strong>{{ linkedPreQuoteCode }}</strong>
              <p>Conversão preservada para rastreabilidade comercial.</p>
            </div>

            <div v-if="linkedSale">
              <span class="section-kicker">Venda vinculada</span>
              <div class="flex flex-wrap items-center gap-2">
                <strong>{{ linkedSale.recordSnapshot.project.code }}</strong>
                <AppStatusBadge :tone="summaryStatusTone">
                  {{ summaryStatusLabel }}
                </AppStatusBadge>
              </div>
              <p>Venda registrada em {{ new Date(linkedSale.soldAt).toLocaleDateString('pt-BR') }}.</p>
            </div>
          </div>
        </div>

        <section v-if="activeTab === 'resumo'" class="panel-stack">
          <div class="panel-card summary-header-card">
            <div>
              <span class="section-kicker">Resumo executivo</span>
              <h2>Visão rápida do cliente, responsáveis e pedido</h2>
              <p>Conferência rápida para operação, comercial e acompanhamento do pedido sem precisar navegar por todas
                as abas.</p>
            </div>

            <div class="summary-header-metrics">
              <div v-for="metric in summaryHeroMetrics" :key="metric.label" class="summary-header-pill">
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
              </div>
            </div>
          </div>

          <div class="summary-overview-grid">
            <article v-for="section in businessSummarySections" :key="section.title"
              class="preview-block summary-overview-card">
              <span class="section-kicker">{{ section.title }}</span>
              <ul class="summary-detail-list">
                <li v-for="item in section.items" :key="`${section.title}-${item.label}`">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </li>
              </ul>
            </article>

            <article class="panel-card totals-card summary-totals-card">
              <span class="section-kicker">Totais</span>
              <div class="summary-row">
                <span>Materiais</span>
                <strong>{{ formatCurrency(totals.materialSubtotal) }}</strong>
              </div>
              <div class="summary-row">
                <span>Costura</span>
                <strong>{{ formatCurrency(totals.sewingSubtotal) }}</strong>
              </div>
              <div class="summary-row">
                <span>Instalação</span>
                <strong>{{ formatCurrency(totals.installationSubtotal) }}</strong>
              </div>
              <div class="summary-row">
                <span>Extras</span>
                <strong>{{ formatCurrency(totals.extrasSubtotal) }}</strong>
              </div>
              <div class="summary-row">
                <span>Desconto</span>
                <strong>{{ formatCurrency(totals.discountTotal) }}</strong>
              </div>
              <div class="summary-row summary-row-total">
                <span>Total final</span>
                <strong>{{ formatCurrency(totals.grandTotal) }}</strong>
              </div>
            </article>
          </div>
        </section>

        <section v-else-if="activeTab === 'cliente'" class="panel-card panel-grid">
          <div class="panel-heading">
            <span class="section-kicker">Cliente</span>
            <h2>Dados de contato e endereço</h2>
          </div>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>Nome do cliente</span>
              <input v-model="record.customer.name" type="text" autocomplete="name" placeholder="Nome completo">
            </label>
            <label class="field" :class="{ 'field-invalid': record.customer.phone && !customerValidation.phoneValid }">
              <span>WhatsApp</span>
              <input :value="record.customer.phone" type="text" inputmode="tel" autocomplete="tel"
                placeholder="(27) 99999-9999" @input="updateCustomerPhone(($event.target as HTMLInputElement).value)">
              <small v-if="record.customer.phone && !customerValidation.phoneValid" class="field-hint field-hint-error">
                Informe um telefone com DDD.
              </small>
            </label>
            <label class="field" :class="{ 'field-invalid': record.customer.email && !customerValidation.emailValid }">
              <span>E-mail</span>
              <input v-model="record.customer.email" type="email" autocomplete="email" placeholder="cliente@email.com">
              <small v-if="record.customer.email && !customerValidation.emailValid" class="field-hint field-hint-error">
                Use um e-mail válido.
              </small>
            </label>
          </div>

          <div class="fields-grid fields-grid-5">
            <label class="field field-wide">
              <span>Endereço</span>
              <input v-model="record.customer.address" type="text" autocomplete="street-address"
                placeholder="Rua e número">
            </label>
            <label class="field">
              <span>Bairro</span>
              <input v-model="record.customer.neighborhood" type="text" autocomplete="address-level3"
                placeholder="Bairro">
            </label>
            <label class="field">
              <span>Cidade</span>
              <input v-model="record.customer.city" type="text" autocomplete="address-level2" placeholder="Cidade">
            </label>
          </div>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>UF</span>
              <input :value="record.customer.state" type="text" maxlength="2" autocomplete="address-level1"
                placeholder="ES" @input="updateCustomerState(($event.target as HTMLInputElement).value)">
            </label>
            <label class="field field-cep"
              :class="{ 'field-invalid': zipcodeLookupError || (record.customer.zipcode && !customerValidation.zipcodeValid) }">
              <span>CEP</span>
              <div class="field-inline">
                <input :value="record.customer.zipcode" type="text" inputmode="numeric" autocomplete="postal-code"
                  placeholder="00000-000" @input="updateCustomerZipcode(($event.target as HTMLInputElement).value)"
                  @blur="lookupCustomerZipcode(true)">
                <button type="button" class="inline-button" :disabled="isResolvingZipcode || !canLookupZipcode"
                  @click="lookupCustomerZipcode(true)">
                  {{ isResolvingZipcode ? 'Buscando...' : 'Buscar CEP' }}
                </button>
              </div>
              <small v-if="zipcodeLookupError" class="field-hint field-hint-error">{{ zipcodeLookupError }}</small>
              <small v-else-if="isResolvingZipcode" class="field-hint">Consultando endereço...</small>
              <small v-else-if="record.customer.zipcode && !customerValidation.zipcodeValid"
                class="field-hint field-hint-error">
                Use um CEP com 8 dígitos.
              </small>
              <small v-else-if="record.customer.city && record.customer.state" class="field-hint">
                Endereço localizado para {{ record.customer.city }}/{{ record.customer.state }}.
              </small>
            </label>
            <label class="field">
              <span>Complemento rápido</span>
              <input v-model="record.customer.complement" type="text" placeholder="Casa, apto, bloco..." />
            </label>
          </div>
        </section>

        <section v-else-if="activeTab === 'projeto'" class="panel-card panel-grid">
          <div class="panel-heading">
            <span class="section-kicker">Projeto</span>
            <h2>Condições do orçamento</h2>
          </div>

          <div class="fields-grid fields-grid-4">
            <label class="field">
              <span>Código</span>
              <input v-model="record.project.code" type="text">
            </label>
            <label class="field">
              <span>Data do orçamento</span>
              <input v-model="record.project.createdAt" type="date">
            </label>
            <label class="field">
              <span>Válido até</span>
              <input v-model="record.project.validUntil" type="date">
            </label>
            <label class="field">
              <span>Responsável</span>
              <input v-model="record.project.salesRep" type="text" placeholder="Consultora responsável">
            </label>
            <label class="field">
              <span>Status</span>
              <select v-model="quoteStatus" :disabled="Boolean(linkedSale)">
                <option value="rascunho">Orçamento</option>
                <option value="pronto">Orçamento concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </div>

          <p v-if="linkedSale" class="text-sm leading-6 text-muted/78">
            Este orçamento já foi convertido em {{ summaryStatusLabel.toLowerCase() }}. O estágio comercial passa a ser controlado pela aba de vendas.
          </p>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>Prazo de entrega</span>
              <input v-model="record.project.deliveryLeadTime" type="text" placeholder="20 dias">
            </label>
            <label class="field">
              <span>Instalação</span>
              <input v-model="record.project.installationTerms" type="text" placeholder="Inclusa no valor">
            </label>
            <label class="field">
              <span>Taxa de deslocamento (R$)</span>
              <input v-model.number="record.project.travelFee" type="number" min="0" step="0.01">
            </label>
            <label class="field">
              <span>Taxa adicional de instalação (R$)</span>
              <input v-model.number="record.project.installationFee" type="number" min="0" step="0.01">
            </label>
            <label class="field">
              <span>Desconto total (R$)</span>
              <input v-model.number="record.project.discount" type="number" min="0" step="0.01">
            </label>
          </div>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>Desconto à vista (%)</span>
              <input v-model.number="record.project.cashDiscountRate" type="number" min="0" step="1">
            </label>
            <label class="field">
              <span>Desconto cartão (%)</span>
              <input v-model.number="record.project.cardDiscountRate" type="number" min="0" step="1">
            </label>
            <label class="field">
              <span>Parcelas no cartão</span>
              <input v-model.number="record.project.cardInstallments" type="number" min="1" step="1">
            </label>
          </div>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>Forma de pagamento</span>
              <input v-model="record.project.paymentMethod" type="text" placeholder="Pix, cartão, boleto, a combinar">
            </label>
            <label class="field">
              <span>Condição de pagamento</span>
              <textarea v-model="record.project.paymentTerms" rows="4" />
            </label>
            <label class="field">
              <span>Observações gerais</span>
              <textarea v-model="record.project.notes" rows="4" />
            </label>
          </div>
        </section>

        <section v-else-if="activeTab === 'itens'" class="panel-stack">
          <div class="panel-card panel-card-top panel-card-inline">
            <div>
              <span class="section-kicker">Memória de cálculo</span>
              <h2>Ambientes e composição técnica</h2>
              <p>Preencha cada ambiente no formato da planilha: trilho, blackout, tecido, pregas, instalação, medidas e
                valores.</p>
              <p class="field-hint">
                O tecido escolhido pelo cliente é apenas referência comercial. A baixa real de estoque acontece no bloco
                de tecido da costureira dentro de cada item.
              </p>
            </div>
            <button type="button" class="primary-button" @click="addItem">Adicionar item</button>
          </div>

          <AdminQuoteItemCard v-for="(item, index) in record.items" :key="item.id" :item="item" :index="index"
            :disable-remove="record.items.length === 1" :fabrics="activeFabrics" :fabric-price-by-id="fabricPriceById"
            :stock-by-fabric-id="stockByFabricId" :seamstress-selected="Boolean(selectedSeamstressId)"
            @duplicate="duplicateItem(item)" @remove="removeItem(item.id)" />

          <div class="panel-card totals-card">
            <div class="summary-row">
              <span>Materiais</span>
              <strong>{{ formatCurrency(totals.materialSubtotal) }}</strong>
            </div>
            <div class="summary-row">
              <span>Costura</span>
              <strong>{{ formatCurrency(totals.sewingSubtotal) }}</strong>
            </div>
            <div class="summary-row">
              <span>Instalação</span>
              <strong>{{ formatCurrency(totals.installationSubtotal) }}</strong>
            </div>
            <div class="summary-row">
              <span>Extras</span>
              <strong>{{ formatCurrency(totals.extrasSubtotal) }}</strong>
            </div>
            <div class="summary-row">
              <span>Desconto</span>
              <strong>{{ formatCurrency(totals.discountTotal) }}</strong>
            </div>
            <div class="summary-row summary-row-total">
              <span>Total final</span>
              <strong>{{ formatCurrency(totals.grandTotal) }}</strong>
            </div>
          </div>
        </section>

        <section v-else-if="activeTab === 'costureira'" class="panel-card panel-grid">
          <div class="panel-heading">
            <span class="section-kicker">Pedido da costureira</span>
            <h2>Contato e instruções de confecção</h2>
          </div>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>Costureira responsável</span>
              <select v-model="selectedSeamstressId">
                <option :value="null">Selecione</option>
                <option v-for="seamstress in activeSeamstresses" :key="seamstress.id" :value="seamstress.id">
                  {{ seamstress.name }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>E-mail</span>
              <input v-model="record.seamstress.email" type="email" placeholder="costura@email.com" readonly>
            </label>
            <label class="field">
              <span>WhatsApp</span>
              <input :value="record.seamstress.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999"
                readonly>
            </label>
          </div>

          <label class="field">
            <span>Observações para costura</span>
            <textarea v-model="record.seamstress.notes" rows="5"
              placeholder="Recados de produção, prioridade, acabamento, emendas..." />
          </label>

          <div class="preview-block">
            <span class="section-kicker">Prévia</span>
            <ul>
              <li v-for="line in seamstressPreviewLines" :key="line">{{ line }}</li>
            </ul>
          </div>

          <div v-if="selectedSeamstressId" class="preview-block">
            <span class="section-kicker">Saldo rápido</span>
            <ul v-if="stockBalances.length">
              <li v-for="balance in stockBalances.slice(0, 6)" :key="balance.id">
                {{ balance.fabric.name }}<span v-if="balance.fabric.colorOrCollection"> • {{
                  balance.fabric.colorOrCollection }}</span>
                : {{ balance.balanceMeters.toFixed(2) }} m
              </li>
            </ul>
            <p v-else>Sem estoque cadastrado para esta costureira.</p>
          </div>
        </section>

        <section v-else-if="activeTab === 'instalador'" class="panel-card panel-grid">
          <div class="panel-heading">
            <span class="section-kicker">Pedido do instalador</span>
            <h2>Contato e instruções de instalação</h2>
          </div>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>Instalador responsável</span>
              <select v-model="selectedInstallerId">
                <option :value="null">Selecione</option>
                <option v-for="installer in activeInstallers" :key="installer.id" :value="installer.id">
                  {{ installer.name }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>E-mail</span>
              <input v-model="record.installer.email" type="email" placeholder="instalacao@email.com" readonly>
            </label>
            <label class="field">
              <span>WhatsApp</span>
              <input :value="record.installer.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999"
                readonly>
            </label>
            <label class="field">
              <span>Data de instalação / entrega</span>
              <input v-model="record.project.installationDate" type="date">
            </label>
          </div>

          <label class="field">
            <span>Observações para instalação</span>
            <textarea v-model="record.installer.notes" rows="5"
              placeholder="Altura de trilho, acesso, andaime, elétrica, restrições de obra..." />
          </label>

          <div class="relation-grid">
            <div class="preview-block">
              <span class="section-kicker">Resumo operacional</span>
              <ul>
                <li>Data de instalação / entrega: {{ record.project.installationDate || 'Pendente' }}</li>
                <li>Itens instaláveis: {{ installationSummary.installableItemCount }}</li>
                <li>Total de metros: {{ installationSummary.totalMeters.toFixed(2) }} m</li>
              </ul>
            </div>

            <div class="preview-block">
              <span class="section-kicker">Contato do cliente</span>
              <ul>
                <li>{{ record.customer.name || 'Cliente não informado' }}</li>
                <li>{{ record.customer.phone || record.customer.email || 'Contato pendente' }}</li>
                <li>
                  {{ record.customer.address || 'Endereço pendente' }}
                  <span v-if="record.customer.neighborhood"> • {{ record.customer.neighborhood }}</span>
                  <span v-if="record.customer.city"> • {{ record.customer.city }}</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="preview-block">
            <span class="section-kicker">Prévia</span>
            <ul>
              <li v-for="line in installerPreviewLines" :key="line">{{ line }}</li>
            </ul>
          </div>

          <div class="preview-block">
            <span class="section-kicker">Histórico de envio</span>
            <ul v-if="installerDispatches.length">
              <li v-for="dispatch in installerDispatches.slice(0, 6)" :key="dispatch.id">
                {{ new Date(dispatch.createdAt).toLocaleString('pt-BR') }} • {{ dispatch.channel }} • {{ dispatch.status
                }}
                <span v-if="dispatch.errorMessage"> • {{ dispatch.errorMessage }}</span>
              </li>
            </ul>
            <p v-else>Nenhum envio da ficha do instalador foi registrado ainda.</p>
          </div>
        </section>

        <section v-else class="panel-stack">
          <div class="panel-card panel-grid">
            <div class="panel-heading">
              <span class="section-kicker">Checklist</span>
              <h2>Conferência antes do disparo</h2>
            </div>

            <div class="checklist-grid">
              <div v-for="item in deliveryChecklist" :key="item.label" class="checklist-item"
                :class="{ 'checklist-item-ok': item.completed }">
                <strong>{{ item.completed ? 'OK' : 'Pendente' }}</strong>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </div>

          <div class="panel-card panel-grid">
            <div class="panel-heading">
              <span class="section-kicker">Envio gratuito</span>
              <h2>E-mail por Brevo e WhatsApp por compartilhamento nativo</h2>
            </div>
            <p>
              O e-mail usa a API do Brevo. O WhatsApp usa compartilhamento nativo com o PDF e, quando isso não for
              suportado no navegador, faz fallback para download do arquivo e abertura da conversa.
            </p>
          </div>

          <AdminDocumentCard v-for="document in documentEntries" :key="document.kind" :title="document.title"
            :description="document.summary.lines[0] || 'Documento pronto para revisão.'"
            :preview-lines="document.summary.lines.slice(1, 6)" :recipient-email="document.email"
            :recipient-whatsapp="document.whatsapp" :can-send="document.ready"
            :email-disabled-reason="document.emailDisabledReason"
            :whatsapp-disabled-reason="document.whatsappDisabledReason"
            :sending-email="sending[`${document.kind}-email`]" :sending-whats-app="sending[`${document.kind}-whatsapp`]"
            @download="downloadPdf(document.kind)" @send-email="handleDocumentDelivery(document.kind, 'email')"
            @send-whatsapp="handleDocumentDelivery(document.kind, 'whatsapp')" />
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.quote-shell {
  padding: 24px 0 56px;
}

.quote-page {
  display: grid;
  gap: 20px;
  align-items: start;
  grid-template-columns: 320px minmax(0, 1fr);
}

.quote-sidebar {
  display: grid;
  gap: 16px;
  align-self: start;
  position: sticky;
  top: 96px;
}

.quote-mobile-nav {
  display: none;
}

.sidebar-card,
.panel-card {
  padding: 22px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(197, 160, 89, 0.16);
  box-shadow: 0 18px 44px rgba(22, 22, 22, 0.08);
}

.sidebar-card-hero h1,
.panel-card h2 {
  color: var(--text-dark);
  line-height: 1.08;
}

.sidebar-card-hero h1 {
  color: var(--text-dark);
  font-size: clamp(1.8rem, 3vw, 2.9rem);
  margin-bottom: 12px;
}

.panel-card h2 {
  font-size: clamp(1.3rem, 2vw, 1.9rem);
  margin-bottom: 6px;
}

.sidebar-card p,
.panel-card p,
.field textarea,
.field input,
.field select {
  color: rgba(61, 61, 61, 0.9);
}

.page-kicker,
.section-kicker {
  display: inline-flex;
  margin-bottom: 14px;
  color: rgba(120, 84, 28, 0.92);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.sidebar-card-summary {
  display: grid;
  gap: 18px;
}

.summary-list,
.totals-card {
  display: grid;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: rgba(61, 61, 61, 0.88);
}

.summary-row strong {
  color: var(--text-dark);
}

.summary-row-total {
  padding-top: 10px;
  border-top: 1px solid rgba(197, 160, 89, 0.14);
  font-size: 1.06rem;
}

.mobile-nav-card {
  padding: 18px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(197, 160, 89, 0.16);
  box-shadow: 0 18px 44px rgba(22, 22, 22, 0.08);
  display: grid;
  gap: 14px;
}

.mobile-nav-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.mobile-nav-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mobile-nav-header strong {
  display: block;
  color: var(--text-dark);
  font-size: 1.08rem;
  line-height: 1.2;
}

.mobile-nav-header p,
.mobile-nav-select {
  color: rgba(61, 61, 61, 0.78);
  font-size: 0.9rem;
  line-height: 1.55;
}

.mobile-nav-action-button {
  min-width: 104px;
}

.mobile-nav-action-button-active {
  border-color: rgba(197, 160, 89, 0.38);
  background: rgba(247, 239, 226, 0.9);
}

.mobile-expandable-bar {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 22px;
  background: rgba(247, 239, 226, 0.74);
  border: 1px solid rgba(197, 160, 89, 0.14);
}

.mobile-expandable-bar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mobile-tab-button {
  min-height: 64px;
  padding: 12px 14px;
  border-radius: 20px;
  border: 1px solid rgba(26, 26, 26, 0.1);
  background: rgba(255, 255, 255, 0.82);
  color: rgba(61, 61, 61, 0.82);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: grid;
  gap: 4px;
  text-align: left;
}

.mobile-tab-button-active {
  border-color: transparent;
  background: var(--primary);
  color: var(--white);
}

.mobile-tab-button small {
  font-size: 0.72rem;
  line-height: 1.45;
  font-weight: 500;
  opacity: 0.82;
}

.mobile-nav-grid {
  display: grid;
  gap: 10px;
}

.mobile-summary-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.mobile-summary-strip::-webkit-scrollbar {
  display: none;
}

.mobile-summary-pill {
  min-width: 132px;
  padding: 12px 14px;
  background: rgba(247, 239, 226, 0.88);
  border: 1px solid rgba(197, 160, 89, 0.14);
  display: grid;
  gap: 4px;
}

.mobile-summary-pill span {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(61, 61, 61, 0.62);
}

.mobile-summary-pill strong {
  color: var(--text-dark);
  font-size: 0.96rem;
}

.mobile-collapse-button {
  min-height: 40px;
  padding-inline: 14px;
}

.quote-content,
.panel-stack,
.panel-grid {
  display: grid;
  gap: 20px;
  align-content: start;
}

.panel-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

.panel-card-inline {
  align-items: center;
}

.top-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.relation-card strong {
  display: block;
  color: var(--text-dark);
  font-size: 1.08rem;
}

.relation-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.panel-heading {
  display: grid;
  gap: 8px;
}

.fields-grid {
  display: grid;
  gap: 14px;
}

.fields-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.fields-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.fields-grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.fields-grid-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.field-wide {
  grid-column: span 2;
}

.field {
  display: grid;
  gap: 8px;
  align-content: start;
}

.field span {
  color: rgba(26, 26, 26, 0.82);
  font-size: 0.84rem;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 50px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.9);
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.field input::placeholder,
.field textarea::placeholder {
  color: rgba(61, 61, 61, 0.46);
}

.field textarea {
  resize: vertical;
  min-height: 130px;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: rgba(197, 160, 89, 0.62);
  box-shadow: 0 0 0 4px rgba(197, 160, 89, 0.12);
}

.field-invalid input,
.field-invalid select,
.field-invalid textarea {
  border-color: rgba(141, 44, 31, 0.34);
  background: rgba(255, 248, 247, 0.96);
}

.field-inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.inline-button {
  min-height: 50px;
  padding: 0 16px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-dark);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.inline-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field-hint {
  font-size: 0.8rem;
  line-height: 1.5;
  color: rgba(61, 61, 61, 0.68);
}

.field-hint-error {
  color: #8d2c1f;
}

.primary-button,
.outline-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: var(--primary);
  color: var(--white);
}

.outline-button {
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-dark);
}

.preview-block {
  padding: 20px;
  border-radius: 24px;
  background: rgba(247, 239, 226, 0.72);
  border: 1px solid rgba(197, 160, 89, 0.12);
}

.summary-header-card {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.95fr);
  gap: 20px;
  align-items: start;
}

.summary-header-metrics {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-header-pill {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(247, 239, 226, 0.78);
  border: 1px solid rgba(197, 160, 89, 0.12);
}

.summary-header-pill span {
  color: rgba(61, 61, 61, 0.62);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-header-pill strong {
  color: var(--text-dark);
  font-size: 1rem;
  line-height: 1.35;
}

.summary-overview-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}

.summary-overview-card {
  display: grid;
  gap: 10px;
  min-height: 100%;
}

.summary-detail-list {
  display: grid;
  gap: 12px;
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.summary-detail-list li {
  display: grid;
  gap: 4px;
}

.summary-detail-list li + li {
  padding-top: 12px;
  border-top: 1px solid rgba(197, 160, 89, 0.12);
}

.summary-detail-list span {
  color: rgba(61, 61, 61, 0.62);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-detail-list strong {
  color: var(--text-dark);
  font-size: 0.96rem;
  line-height: 1.45;
}

.summary-totals-card {
  grid-column: 1 / -1;
}

.preview-block ul {
  display: grid;
  gap: 8px;
  padding-left: 18px;
  color: rgba(61, 61, 61, 0.88);
}

.checklist-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.checklist-item {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(141, 44, 31, 0.14);
}

.checklist-item strong {
  color: #8d2c1f;
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.checklist-item-ok {
  border-color: rgba(62, 120, 73, 0.16);
}

.checklist-item-ok strong {
  color: #3e7849;
}

@media (max-width: 1180px) {
  .quote-page {
    grid-template-columns: 1fr;
  }

  .quote-sidebar {
    display: none;
  }

  .quote-mobile-nav {
    display: block;
    position: sticky;
    top: 96px;
    z-index: 25;
  }

  .panel-card-top {
    flex-direction: column;
  }

  .panel-card-top,
  .panel-card-inline {
    align-items: flex-start;
  }

  .summary-header-card {
    grid-template-columns: 1fr;
  }

  .top-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
  .summary-overview-grid,
  .summary-header-metrics {
    grid-template-columns: 1fr;
  }

  .summary-totals-card {
    grid-column: auto;
  }

  .fields-grid-2,
  .fields-grid-3,
  .fields-grid-4,
  .fields-grid-5 {
    grid-template-columns: 1fr;
  }

  .field-wide {
    grid-column: auto;
  }

  .field-inline {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .quote-shell {
    padding: 16px 0 44px;
  }

  .sidebar-card,
  .panel-card {
    padding: 18px;
    border-radius: 24px;
  }

  .quote-page,
  .quote-content,
  .panel-stack,
  .panel-grid {
    gap: 16px;
  }

  .primary-button,
  .outline-button,
  .inline-button {
    width: 100%;
  }

  .mobile-nav-header {
    flex-direction: column;
  }

  .mobile-nav-actions,
  .mobile-nav-action-button,
  .mobile-collapse-button {
    width: 100%;
  }
}
</style>
