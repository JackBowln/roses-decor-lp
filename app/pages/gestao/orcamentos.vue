<script setup lang="ts">
import { toast } from 'vue-sonner'
import AdminDocumentCard from '@/components/admin/AdminDocumentCard.vue'
import AdminQuoteItemCard from '@/components/admin/AdminQuoteItemCard.vue'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import { getApiErrorMessage } from '@/lib/apiError'
import { calculateLineItemTotal, formatCurrency, quoteWorkbookTabs } from '@/lib/adminQuote'
import { normalizeMeters, type FabricRecord, type InstallerDispatchRecord, type InstallerRecord, type SeamstressRecord, type SeamstressStockBalanceView, type StoredFinalQuote } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const QUOTE_META_STORAGE_KEY = 'roses-decor-admin-quote-meta'

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

const activeQuoteId = ref<string | null>(null)
const linkedCustomerId = ref<string | null>(null)
const linkedPreQuoteId = ref<string | null>(null)
const linkedPreQuoteCode = ref('')
const linkedCustomerName = ref('')
const linkedCustomerLocation = ref('')
const selectedSeamstressId = ref<string | null>(null)
const selectedInstallerId = ref<string | null>(null)
const quoteStatus = ref<StoredFinalQuote['status']>('rascunho')
const seamstresses = ref<SeamstressRecord[]>([])
const installers = ref<InstallerRecord[]>([])
const fabrics = ref<FabricRecord[]>([])
const stockBalances = ref<SeamstressStockBalanceView[]>([])
const installerDispatches = ref<InstallerDispatchRecord[]>([])
const isLoadingInventory = ref(false)
const isLoadingRecord = ref(false)
const isSavingRecord = ref(false)
const lastSavedAt = ref('')

interface QuoteDraftMeta {
  selectedSeamstressId: string | null
  selectedInstallerId: string | null
  quoteStatus: StoredFinalQuote['status']
}

interface LoadedFinalQuotePayload {
  id: string
  customerId: string
  preQuoteId: string | null
  seamstressId: string | null
  installerId: string | null
  status: StoredFinalQuote['status']
  record: typeof record.value
  updatedAt: string
  customer: {
    id: string
    name: string
    locationLabel: string
  } | null
  preQuote: {
    id: string
    code: string
  } | null
  seamstress: {
    id: string
    name: string
    email: string
    whatsapp: string
    status: string
  } | null
  installer: {
    id: string
    name: string
    email: string
    whatsapp: string
    status: string
  } | null
  installerDispatches: InstallerDispatchRecord[]
}

const applyLoadedQuote = (payload: LoadedFinalQuotePayload) => {
  record.value = payload.record
  activeQuoteId.value = payload.id
  linkedCustomerId.value = payload.customerId
  linkedPreQuoteId.value = payload.preQuoteId
  linkedPreQuoteCode.value = payload.preQuote?.code || ''
  linkedCustomerName.value = payload.customer?.name || ''
  linkedCustomerLocation.value = payload.customer?.locationLabel || ''
  selectedSeamstressId.value = payload.seamstressId
  selectedInstallerId.value = payload.installerId
  quoteStatus.value = payload.status
  installerDispatches.value = payload.installerDispatches || []
  lastSavedAt.value = payload.updatedAt
}

const restoreDraftMeta = () => {
  if (!import.meta.client) {
    return
  }

  const raw = localStorage.getItem(QUOTE_META_STORAGE_KEY)

  if (!raw) {
    selectedSeamstressId.value = null
    selectedInstallerId.value = null
    quoteStatus.value = 'rascunho'
    return
  }

  try {
    const parsed = JSON.parse(raw) as Partial<QuoteDraftMeta>
    selectedSeamstressId.value = typeof parsed.selectedSeamstressId === 'string' ? parsed.selectedSeamstressId : null
    selectedInstallerId.value = typeof parsed.selectedInstallerId === 'string' ? parsed.selectedInstallerId : null
    quoteStatus.value = parsed.quoteStatus === 'pronto' || parsed.quoteStatus === 'cancelado'
      ? parsed.quoteStatus
      : 'rascunho'
  }
  catch {
    localStorage.removeItem(QUOTE_META_STORAGE_KEY)
    selectedSeamstressId.value = null
    selectedInstallerId.value = null
    quoteStatus.value = 'rascunho'
  }
}

const persistDraftMeta = () => {
  if (!import.meta.client) {
    return
  }

  const payload: QuoteDraftMeta = {
    selectedSeamstressId: selectedSeamstressId.value,
    selectedInstallerId: selectedInstallerId.value,
    quoteStatus: quoteStatus.value,
  }

  localStorage.setItem(QUOTE_META_STORAGE_KEY, JSON.stringify(payload))
}

const clearDraftMeta = () => {
  if (!import.meta.client) {
    return
  }

  localStorage.removeItem(QUOTE_META_STORAGE_KEY)
}

const activeSeamstresses = computed(() => {
  const currentId = selectedSeamstressId.value

  return seamstresses.value.filter((seamstress) =>
    seamstress.status === 'ativa' || seamstress.id === currentId,
  )
})

const activeInstallers = computed(() => {
  const currentId = selectedInstallerId.value

  return installers.value.filter((installer) =>
    installer.status === 'ativo' || installer.id === currentId,
  )
})

const activeFabrics = computed(() => {
  const linkedFabricIds = new Set(
    record.value.items.flatMap((item) =>
      (item.fabricConsumptions || [])
        .map((consumption) => consumption.fabricId)
        .filter(Boolean),
    ),
  )

  return fabrics.value.filter((fabric) => fabric.status === 'ativo' || linkedFabricIds.has(fabric.id))
})

const stockByFabricId = computed<Record<string, number>>(() =>
  stockBalances.value.reduce<Record<string, number>>((accumulator, balance) => {
    accumulator[balance.fabricId] = balance.balanceMeters
    return accumulator
  }, {}))

const fabricPriceById = computed<Record<string, number>>(() =>
  fabrics.value.reduce<Record<string, number>>((accumulator, fabric) => {
    accumulator[fabric.id] = fabric.pricePerMeter
    return accumulator
  }, {}))

const syncAutomaticMaterialPricing = () => {
  record.value.items.forEach((item) => {
    const quantity = Math.max(item.quantity || 1, 1)
    let materialTotal = 0
    let hasPricedConsumptions = false

    for (const consumption of item.fabricConsumptions || []) {
      const quantityMeters = normalizeMeters(consumption.quantityMeters)
      const pricePerMeter = consumption.fabricId ? fabricPriceById.value[consumption.fabricId] : undefined

      if (typeof pricePerMeter !== 'number' || pricePerMeter <= 0 || !quantityMeters || quantityMeters <= 0) {
        continue
      }

      hasPricedConsumptions = true
      materialTotal += quantityMeters * pricePerMeter
    }

    if (hasPricedConsumptions) {
      item.unitPrice = Math.round((materialTotal / quantity) * 100) / 100
    }
  })
}

const syncSelectedSeamstressSnapshot = () => {
  if (!selectedSeamstressId.value) {
    record.value.seamstress.name = ''
    record.value.seamstress.email = ''
    record.value.seamstress.whatsapp = ''
    return
  }

  const seamstress = seamstresses.value.find((entry) => entry.id === selectedSeamstressId.value) || null

  if (!seamstress) {
    return
  }

  record.value.seamstress.name = seamstress.name
  record.value.seamstress.email = seamstress.email
  record.value.seamstress.whatsapp = seamstress.whatsapp
}

const syncSelectedInstallerSnapshot = () => {
  if (!selectedInstallerId.value) {
    record.value.installer.name = ''
    record.value.installer.email = ''
    record.value.installer.whatsapp = ''
    return
  }

  const installer = installers.value.find((entry) => entry.id === selectedInstallerId.value) || null

  if (!installer) {
    return
  }

  record.value.installer.name = installer.name
  record.value.installer.email = installer.email
  record.value.installer.whatsapp = installer.whatsapp
}

const loadInventoryReferences = async () => {
  try {
    isLoadingInventory.value = true
    const [seamstressResponse, installerResponse, fabricResponse] = await Promise.all([
      $fetch<{ seamstresses: SeamstressRecord[] }>('/api/admin/seamstresses?status=all', {
        credentials: 'include',
      }),
      $fetch<{ installers: InstallerRecord[] }>('/api/admin/installers?status=all', {
        credentials: 'include',
      }),
      $fetch<{ fabrics: FabricRecord[] }>('/api/admin/fabrics?status=all', {
        credentials: 'include',
      }),
    ])

    seamstresses.value = seamstressResponse.seamstresses
    installers.value = installerResponse.installers
    fabrics.value = fabricResponse.fabrics
    syncSelectedSeamstressSnapshot()
    syncSelectedInstallerSnapshot()
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar costureiras, instaladores e tecidos.'))
  }
  finally {
    isLoadingInventory.value = false
  }
}

const loadStockBalances = async () => {
  if (!selectedSeamstressId.value) {
    stockBalances.value = []
    return
  }

  try {
    const response = await $fetch<{ balances: SeamstressStockBalanceView[] }>(`/api/admin/stocks?seamstressId=${selectedSeamstressId.value}`, {
      credentials: 'include',
    })
    stockBalances.value = response.balances
  }
  catch (error) {
    stockBalances.value = []
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o saldo da costureira.'))
  }
}

watch(selectedSeamstressId, async (value) => {
  syncSelectedSeamstressSnapshot()
  await loadStockBalances()
})

watch(selectedInstallerId, () => {
  syncSelectedInstallerSnapshot()
})

watch(
  () => JSON.stringify({
    fabrics: fabrics.value.map((fabric) => [fabric.id, fabric.pricePerMeter]),
    items: record.value.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      fabricConsumptions: (item.fabricConsumptions || []).map((consumption) => ({
        fabricId: consumption.fabricId,
        quantityMeters: consumption.quantityMeters,
      })),
    })),
  }),
  () => {
    syncAutomaticMaterialPricing()
  },
  { immediate: true },
)

const loadQuoteFromRoute = async () => {
  const quoteId = typeof route.query.quoteId === 'string' ? route.query.quoteId : ''

  if (!quoteId) {
    activeQuoteId.value = null
    linkedCustomerId.value = null
    linkedPreQuoteId.value = null
    linkedPreQuoteCode.value = ''
    linkedCustomerName.value = ''
    linkedCustomerLocation.value = ''
    stockBalances.value = []
    installerDispatches.value = []
    lastSavedAt.value = ''
    restoreDraftMeta()
    return
  }

  try {
    isLoadingRecord.value = true
    const payload = await $fetch<LoadedFinalQuotePayload>(`/api/admin/final-quotes/${quoteId}`, {
      credentials: 'include',
    })
    applyLoadedQuote(payload)
    clearDraftMeta()
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o orçamento final.'))
  }
  finally {
    isLoadingRecord.value = false
  }
}

const loadInstallerDispatches = async () => {
  if (!activeQuoteId.value) {
    installerDispatches.value = []
    return
  }

  try {
    const response = await $fetch<{ dispatches: InstallerDispatchRecord[] }>(`/api/admin/installers/dispatches?quoteId=${activeQuoteId.value}`, {
      credentials: 'include',
    })
    installerDispatches.value = response.dispatches
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o histórico do instalador.'))
  }
}

const saveCurrentQuote = async () => {
  try {
    isSavingRecord.value = true
    const previousCode = record.value.project.code
    const hasFabricConsumptions = record.value.items.some((item) =>
      (item.fabricConsumptions || []).some((consumption) => Boolean(consumption.fabricId) || Boolean(consumption.quantityMeters)),
    )

    if (hasFabricConsumptions && !selectedSeamstressId.value) {
      toast.error('Selecione a costureira antes de salvar baixas de tecido.')
      return
    }

    const response = await $fetch<{ ok: true; finalQuote: LoadedFinalQuotePayload }>('/api/admin/final-quotes/save', {
      method: 'POST',
      credentials: 'include',
      body: {
        id: activeQuoteId.value,
        customerId: linkedCustomerId.value,
        preQuoteId: linkedPreQuoteId.value,
        seamstressId: selectedSeamstressId.value,
        installerId: selectedInstallerId.value,
        status: quoteStatus.value,
        record: record.value,
      },
    })

    applyLoadedQuote(response.finalQuote)
    clearDraftMeta()

    if (typeof route.query.quoteId !== 'string' || route.query.quoteId !== response.finalQuote.id) {
      await navigateTo({
        path: '/gestao/orcamentos',
        query: {
          quoteId: response.finalQuote.id,
        },
      }, { replace: true })
    }

    toast.success(
      response.finalQuote.record.project.code !== previousCode
        ? 'Orçamento salvo. O código foi ajustado automaticamente para evitar duplicidade.'
        : 'Orçamento salvo com sucesso.',
    )
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível salvar o orçamento.'))
  }
  finally {
    isSavingRecord.value = false
  }
}

const startEmptyQuote = async () => {
  resetRecord()
  clearDraftMeta()
  activeQuoteId.value = null
  linkedCustomerId.value = null
  linkedPreQuoteId.value = null
  linkedPreQuoteCode.value = ''
  linkedCustomerName.value = ''
  linkedCustomerLocation.value = ''
  selectedSeamstressId.value = null
  selectedInstallerId.value = null
  quoteStatus.value = 'rascunho'
  stockBalances.value = []
  installerDispatches.value = []
  lastSavedAt.value = ''
  await navigateTo('/gestao/orcamentos', { replace: true })
}

onMounted(() => {
  if (typeof route.query.quoteId !== 'string') {
    restoreDraftMeta()
  }
  void refreshSession()
  void loadInventoryReferences()
})

watch([selectedSeamstressId, selectedInstallerId, quoteStatus], () => {
  if (!activeQuoteId.value && typeof route.query.quoteId !== 'string') {
    persistDraftMeta()
  }
})

watch(isReady, (ready) => {
  if (ready) {
    void loadQuoteFromRoute()
  }
}, { immediate: true })

watch(() => route.query.quoteId, () => {
  if (isReady.value) {
    void loadQuoteFromRoute()
  }
})

const summaryStats = computed(() => [
  {
    label: 'Itens no orçamento',
    value: String(record.value.items.length).padStart(2, '0'),
  },
  {
    label: 'Total estimado',
    value: formatCurrency(totals.value.grandTotal),
  },
  {
    label: 'Validade',
    value: record.value.project.validUntil || 'Sem data',
  },
  {
    label: 'Último salvamento',
    value: lastSavedAt.value ? new Date(lastSavedAt.value).toLocaleString('pt-BR') : 'Não salvo',
  },
])

const getDocumentBlockReason = (kind: 'cliente' | 'costureira' | 'instalador', channel: 'email' | 'whatsapp') => {
  if (kind === 'cliente') {
    if (!record.value.customer.name.trim()) {
      return 'Preencha o nome do cliente antes de enviar o orçamento.'
    }

    if (channel === 'email' && !customerValidation.value.emailValid) {
      return 'Informe um e-mail válido do cliente.'
    }

    if (channel === 'whatsapp' && !customerValidation.value.phoneValid) {
      return 'Informe um WhatsApp válido do cliente.'
    }

    if (record.value.customer.zipcode && !customerValidation.value.zipcodeValid) {
      return 'Corrija o CEP do cliente antes de enviar o orçamento.'
    }

    if (!record.value.items.some((item) => item.room.trim() && item.width && item.height && calculateLineItemTotal(item) > 0)) {
      return 'Inclua ao menos um item com ambiente, medidas e valor antes do envio.'
    }

    if (channel === 'email' && !customerValidation.value.phoneValid) {
      return 'O orçamento do cliente só é liberado quando o WhatsApp do cliente também estiver válido.'
    }

    if (channel === 'whatsapp' && !customerValidation.value.emailValid) {
      return 'O orçamento do cliente só é liberado quando o e-mail do cliente também estiver válido.'
    }

    return ''
  }

  if (kind === 'costureira') {
    if (!selectedSeamstressId.value) {
      return 'Selecione a costureira responsável antes de enviar o pedido.'
    }

    if (channel === 'email' && !record.value.seamstress.email.trim()) {
      return 'A costureira selecionada precisa ter um e-mail cadastrado.'
    }

    if (channel === 'whatsapp' && !record.value.seamstress.whatsapp.trim()) {
      return 'A costureira selecionada precisa ter um WhatsApp cadastrado.'
    }

    return ''
  }

  if (!activeQuoteId.value) {
    return 'Salve o orçamento antes de enviar a ficha do instalador.'
  }

  if (!selectedInstallerId.value) {
    return 'Selecione o instalador responsável.'
  }

  if (!record.value.project.installationDate) {
    return 'Defina a data de instalação ou entrega antes do envio.'
  }

  const installableItems = record.value.items.filter((item) => item.installationIncluded === 'SIM')

  if (installableItems.length === 0) {
    return 'Adicione ao menos um item com instalação para liberar a ficha do instalador.'
  }

  if (installableItems.some((item) => !item.width && !item.installationMeters)) {
    return 'Preencha a largura ou os metros de instalação dos itens instaláveis.'
  }

  if (!record.value.customer.name.trim()) {
    return 'Preencha o nome do cliente.'
  }

  if (!record.value.customer.phone.trim() && !record.value.customer.email.trim()) {
    return 'Informe ao menos um contato do cliente para a ficha de instalação.'
  }

  if (channel === 'email' && !record.value.installer.email.trim()) {
    return 'O instalador selecionado precisa ter um e-mail cadastrado.'
  }

  if (channel === 'whatsapp' && !record.value.installer.whatsapp.trim()) {
    return 'O instalador selecionado precisa ter um WhatsApp cadastrado.'
  }

  return ''
}

const documentEntries = computed(() =>
  documents.value.map((document) => ({
    ...document,
    ready: document.kind === 'instalador'
      ? document.ready && Boolean(activeQuoteId.value && selectedInstallerId.value)
      : document.ready,
    emailDisabledReason: getDocumentBlockReason(document.kind, 'email'),
    whatsappDisabledReason: getDocumentBlockReason(document.kind, 'whatsapp'),
  })))

const handleDocumentDelivery = async (kind: 'cliente' | 'costureira' | 'instalador', channel: 'email' | 'whatsapp') => {
  const delivered = await deliverDocument(kind, channel, {
    quoteId: activeQuoteId.value,
    installerId: selectedInstallerId.value,
  })

  if (delivered && kind === 'instalador') {
    await loadInstallerDispatches()
  }
}
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
            <p>Fluxo pensado para reduzir erro operacional e manter o que será enviado consistente entre cliente e equipe.</p>
          </div>
          <div class="top-actions">
            <button type="button" class="outline-button" @click="startEmptyQuote">Novo orçamento vazio</button>
            <button type="button" class="primary-button" :disabled="isSavingRecord" @click="saveCurrentQuote">
              {{ isSavingRecord ? 'Salvando...' : 'Salvar orçamento' }}
            </button>
          </div>
        </div>

        <div v-if="linkedPreQuoteId || linkedCustomerId" class="panel-card relation-card">
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
          </div>
        </div>

        <section v-if="activeTab === 'cliente'" class="panel-card panel-grid">
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
                placeholder="(27) 99999-9999"
                @input="updateCustomerPhone(($event.target as HTMLInputElement).value)">
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
              <input v-model="record.customer.neighborhood" type="text" autocomplete="address-level3" placeholder="Bairro">
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
            <label class="field field-cep" :class="{ 'field-invalid': zipcodeLookupError || (record.customer.zipcode && !customerValidation.zipcodeValid) }">
              <span>CEP</span>
              <div class="field-inline">
                <input :value="record.customer.zipcode" type="text" inputmode="numeric" autocomplete="postal-code"
                  placeholder="00000-000" @input="updateCustomerZipcode(($event.target as HTMLInputElement).value)"
                  @blur="lookupCustomerZipcode(true)">
                <button type="button" class="inline-button" :disabled="isResolvingZipcode || !canLookupZipcode" @click="lookupCustomerZipcode(true)">
                  {{ isResolvingZipcode ? 'Buscando...' : 'Buscar CEP' }}
                </button>
              </div>
              <small v-if="zipcodeLookupError" class="field-hint field-hint-error">{{ zipcodeLookupError }}</small>
              <small v-else-if="isResolvingZipcode" class="field-hint">Consultando endereço...</small>
              <small v-else-if="record.customer.zipcode && !customerValidation.zipcodeValid" class="field-hint field-hint-error">
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
              <select v-model="quoteStatus">
                <option value="rascunho">Rascunho</option>
                <option value="pronto">Pronto</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </div>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>Prazo de entrega</span>
              <input v-model="record.project.deliveryLeadTime" type="text" placeholder="20 dias">
            </label>
            <label class="field">
              <span>Data de instalação / entrega</span>
              <input v-model="record.project.installationDate" type="date">
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

          <div class="fields-grid fields-grid-2">
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
              <p>Preencha cada ambiente no formato da planilha: trilho, blackout, tecido, pregas, instalação, medidas e valores.</p>
            </div>
            <button type="button" class="primary-button" @click="addItem">Adicionar item</button>
          </div>

          <AdminQuoteItemCard
            v-for="(item, index) in record.items"
            :key="item.id"
            :item="item"
            :index="index"
            :disable-remove="record.items.length === 1"
            :fabrics="activeFabrics"
            :fabric-price-by-id="fabricPriceById"
            :stock-by-fabric-id="stockByFabricId"
            :seamstress-selected="Boolean(selectedSeamstressId)"
            @duplicate="duplicateItem(item)"
            @remove="removeItem(item.id)"
          />

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
              <input :value="record.seamstress.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999" readonly>
            </label>
          </div>

          <label class="field">
            <span>Observações para costura</span>
            <textarea v-model="record.seamstress.notes" rows="5" placeholder="Recados de produção, prioridade, acabamento, emendas..." />
          </label>

          <div class="preview-block">
            <span class="section-kicker">Prévia</span>
            <ul>
              <li v-for="line in documents[1].summary.lines.slice(0, 8)" :key="line">{{ line }}</li>
            </ul>
          </div>

          <div v-if="selectedSeamstressId" class="preview-block">
            <span class="section-kicker">Saldo rápido</span>
            <ul v-if="stockBalances.length">
              <li v-for="balance in stockBalances.slice(0, 6)" :key="balance.id">
                {{ balance.fabric.name }}<span v-if="balance.fabric.colorOrCollection"> • {{ balance.fabric.colorOrCollection }}</span>
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
              <input :value="record.installer.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999" readonly>
            </label>
          </div>

          <label class="field">
            <span>Observações para instalação</span>
            <textarea v-model="record.installer.notes" rows="5" placeholder="Altura de trilho, acesso, andaime, elétrica, restrições de obra..." />
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
              <li v-for="line in documents[2].summary.lines.slice(0, 8)" :key="line">{{ line }}</li>
            </ul>
          </div>

          <div class="preview-block">
            <span class="section-kicker">Histórico de envio</span>
            <ul v-if="installerDispatches.length">
              <li v-for="dispatch in installerDispatches.slice(0, 6)" :key="dispatch.id">
                {{ new Date(dispatch.createdAt).toLocaleString('pt-BR') }} • {{ dispatch.channel }} • {{ dispatch.status }}
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

          <AdminDocumentCard
            v-for="document in documentEntries"
            :key="document.kind"
            :title="document.title"
            :description="document.summary.lines[0] || 'Documento pronto para revisão.'"
            :preview-lines="document.summary.lines.slice(1, 6)"
            :recipient-email="document.email"
            :recipient-whatsapp="document.whatsapp"
            :can-send="document.ready"
            :email-disabled-reason="document.emailDisabledReason"
            :whatsapp-disabled-reason="document.whatsappDisabledReason"
            :sending-email="sending[`${document.kind}-email`]"
            :sending-whats-app="sending[`${document.kind}-whatsapp`]"
            @download="downloadPdf(document.kind)"
            @send-email="handleDocumentDelivery(document.kind, 'email')"
            @send-whatsapp="handleDocumentDelivery(document.kind, 'whatsapp')"
          />
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
    position: static;
  }

  .panel-card-top {
    flex-direction: column;
  }

  .panel-card-top,
  .panel-card-inline {
    align-items: flex-start;
  }

  .top-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 900px) {
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
}
</style>
