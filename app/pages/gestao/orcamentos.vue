<script setup lang="ts">
import AdminQuoteItemCard from '@/components/admin/AdminQuoteItemCard.vue'
import QuoteWorkspaceCustomerTab from '@/components/admin/quote-workspace/QuoteWorkspaceCustomerTab.vue'
import QuoteWorkspaceDeliveryTab from '@/components/admin/quote-workspace/QuoteWorkspaceDeliveryTab.vue'
import QuoteWorkspaceInstallerTab from '@/components/admin/quote-workspace/QuoteWorkspaceInstallerTab.vue'
import QuoteWorkspaceMobileNav from '@/components/admin/quote-workspace/QuoteWorkspaceMobileNav.vue'
import QuoteWorkspaceProjectTab from '@/components/admin/quote-workspace/QuoteWorkspaceProjectTab.vue'
import QuoteWorkspaceSeamstressTab from '@/components/admin/quote-workspace/QuoteWorkspaceSeamstressTab.vue'
import QuoteWorkspaceSidebar from '@/components/admin/quote-workspace/QuoteWorkspaceSidebar.vue'
import QuoteWorkspaceSummaryTab from '@/components/admin/quote-workspace/QuoteWorkspaceSummaryTab.vue'
import QuoteWorkspaceTotalsCard from '@/components/admin/quote-workspace/QuoteWorkspaceTotalsCard.vue'
import { formatCurrency, quoteWorkbookTabs } from '@/lib/adminQuote'
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

const summaryStatusLabel = computed(() =>
  resolveQuoteLifecycleTag({
    quoteStatus: quoteStatus.value,
    saleStatus: linkedSale.value?.status || null,
  }))

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

onMounted(() => {
  if (typeof route.query.quoteId !== 'string') {
    restoreDraftMeta()
  }

  void refreshSession()
  void loadInventoryReferences()
})
</script>

<template>
  <section class="py-4 md:py-6 pb-14">
    <div class="container grid items-start gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <QuoteWorkspaceSidebar
        :tabs="quoteWorkbookTabs"
        :active-tab="activeTab"
        :summary-stats="summaryStats"
        @select="activeTab = $event"
        @new="startEmptyQuote"
      />

      <div class="grid gap-5">
        <QuoteWorkspaceMobileNav
          :tabs="quoteWorkbookTabs"
          :active-tab="activeTab"
          :summary-stats="summaryStats"
          @select="activeTab = $event"
        />

        <AppSectionCard v-if="isLoadingRecord" class="grid gap-2">
          <span class="app-kicker">Carregando</span>
          <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">Abrindo orçamento final</h2>
          <p class="text-sm leading-6 text-muted/78">Recuperando o vínculo com cliente e pré-orçamento.</p>
        </AppSectionCard>

        <template v-else-if="isReady">
          <AppSectionCard class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div class="grid gap-3">
              <span class="app-kicker">Projeto</span>
              <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">{{ record.project.code }}</h2>
              <div class="flex flex-wrap items-center gap-2">
                <AppStatusBadge :tone="summaryStatusTone">
                  {{ summaryStatusLabel }}
                </AppStatusBadge>
              </div>
              <p class="text-sm leading-6 text-muted/78">
                Fluxo pensado para reduzir erro operacional e manter o que será enviado consistente entre cliente e equipe.
              </p>
            </div>

            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap xl:justify-end">
              <AppButton v-if="linkedSale" :to="`/gestao/vendas/${linkedSale.id}`" variant="secondary">
                Abrir venda
              </AppButton>
              <AppButton
                v-else-if="activeQuoteId && quoteStatus === 'pronto'"
                variant="secondary"
                @click="promoteCurrentQuoteToSale"
              >
                Marcar como vendido
              </AppButton>
              <AppButton variant="secondary" @click="startEmptyQuote">
                Novo orçamento vazio
              </AppButton>
              <AppButton variant="primary" :loading="isSavingRecord" @click="saveCurrentQuote">
                {{ isSavingRecord ? 'Salvando...' : 'Salvar orçamento' }}
              </AppButton>
            </div>
          </AppSectionCard>

          <AppSectionCard v-if="linkedPreQuoteId || linkedCustomerId || linkedSale" class="grid gap-4">
            <div class="grid gap-2">
              <span class="app-kicker">Contexto vinculado</span>
              <h2 class="text-[clamp(1.1rem,1.8vw,1.45rem)] text-foreground">Origem comercial e relacionamento preservados</h2>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article class="grid gap-1 rounded-[22px] border border-line/10 bg-surface-soft/68 p-4">
                <span class="app-kicker">Cliente vinculado</span>
                <strong class="text-lg text-foreground">{{ linkedCustomerName || record.customer.name || 'Cliente sem identificação' }}</strong>
                <p class="text-sm leading-6 text-muted/78">
                  {{ linkedCustomerLocation || record.customer.city || record.customer.neighborhood || 'Origem não informada' }}
                </p>
              </article>

              <article v-if="linkedPreQuoteId" class="grid gap-1 rounded-[22px] border border-line/10 bg-surface-soft/68 p-4">
                <span class="app-kicker">Pré-orçamento de origem</span>
                <strong class="text-lg text-foreground">{{ linkedPreQuoteCode }}</strong>
                <p class="text-sm leading-6 text-muted/78">Conversão preservada para rastreabilidade comercial.</p>
              </article>

              <article v-if="linkedSale" class="grid gap-1 rounded-[22px] border border-line/10 bg-surface-soft/68 p-4">
                <span class="app-kicker">Venda vinculada</span>
                <div class="flex flex-wrap items-center gap-2">
                  <strong class="text-lg text-foreground">{{ linkedSale.recordSnapshot.project.code }}</strong>
                  <AppStatusBadge :tone="summaryStatusTone">{{ summaryStatusLabel }}</AppStatusBadge>
                </div>
                <p class="text-sm leading-6 text-muted/78">
                  Venda registrada em {{ new Date(linkedSale.soldAt).toLocaleDateString('pt-BR') }}.
                </p>
              </article>
            </div>
          </AppSectionCard>

          <QuoteWorkspaceSummaryTab
            v-if="activeTab === 'resumo'"
            :hero-metrics="summaryHeroMetrics"
            :sections="businessSummarySections"
            :totals="totals"
          />

          <QuoteWorkspaceCustomerTab
            v-else-if="activeTab === 'cliente'"
            :customer="record.customer"
            :customer-validation="customerValidation"
            :can-lookup-zipcode="canLookupZipcode"
            :is-resolving-zipcode="isResolvingZipcode"
            :zipcode-lookup-error="zipcodeLookupError"
            @update-phone="updateCustomerPhone"
            @update-state="updateCustomerState"
            @update-zipcode="updateCustomerZipcode"
            @lookup-zipcode="lookupCustomerZipcode"
          />

          <QuoteWorkspaceProjectTab
            v-else-if="activeTab === 'projeto'"
            :project="record.project"
            :quote-status="quoteStatus"
            :linked-sale="linkedSale"
            :summary-status-label="summaryStatusLabel"
            @update:quote-status="quoteStatus = $event"
          />

          <section v-else-if="activeTab === 'itens'" class="grid gap-5">
            <AppSectionCard class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div class="grid gap-3">
                <span class="app-kicker">Memória de cálculo</span>
                <h2 class="text-[clamp(1.3rem,2vw,1.9rem)] text-foreground">Ambientes e composição técnica</h2>
                <p class="text-sm leading-6 text-muted/78">
                  Preencha cada ambiente no formato da planilha: trilho, blackout, tecido, pregas, instalação, medidas e valores.
                </p>
                <p class="text-sm leading-6 text-muted/70">
                  O tecido escolhido pelo cliente é apenas referência comercial. A baixa real de estoque acontece no bloco de tecido da costureira dentro de cada item, e a responsável da costura pode ser definida direto aqui.
                </p>
              </div>
              <AppButton variant="primary" @click="addItem">
                Adicionar item
              </AppButton>
            </AppSectionCard>

            <AdminQuoteItemCard
              v-for="(item, index) in record.items"
              :key="item.id"
              :item="item"
              :index="index"
              :disable-remove="record.items.length === 1"
              :fabrics="activeFabrics"
              :seamstresses="activeSeamstresses"
              :fabric-price-by-id="fabricPriceById"
              :stock-by-fabric-id="stockByFabricId"
              :selected-seamstress-id="selectedSeamstressId"
              @update:selected-seamstress-id="selectedSeamstressId = $event"
              @duplicate="duplicateItem(item)"
              @remove="removeItem(item.id)"
            />

            <QuoteWorkspaceTotalsCard :totals="totals" />
          </section>

          <QuoteWorkspaceSeamstressTab
            v-else-if="activeTab === 'costureira'"
            :selected-seamstress-id="selectedSeamstressId"
            :seamstresses="activeSeamstresses"
            :seamstress="record.seamstress"
            :preview-lines="seamstressPreviewLines"
            :stock-balances="stockBalances"
            @update:selected-seamstress-id="selectedSeamstressId = $event"
          />

          <QuoteWorkspaceInstallerTab
            v-else-if="activeTab === 'instalador'"
            :selected-installer-id="selectedInstallerId"
            :installers="activeInstallers"
            :installer="record.installer"
            :project="record.project"
            :customer="record.customer"
            :installation-summary="installationSummary"
            :preview-lines="installerPreviewLines"
            :installer-dispatches="installerDispatches"
            @update:selected-installer-id="selectedInstallerId = $event"
          />

          <QuoteWorkspaceDeliveryTab
            v-else
            :delivery-checklist="deliveryChecklist"
            :document-entries="documentEntries"
            :sending="sending"
            @download="downloadPdf"
            @send-email="handleDocumentDelivery($event, 'email')"
            @send-whatsapp="handleDocumentDelivery($event, 'whatsapp')"
          />
        </template>
      </div>
    </div>
  </section>
</template>
