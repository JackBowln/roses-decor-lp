<script setup lang="ts">
import { toast } from 'vue-sonner'
import AdminDocumentCard from '@/components/admin/AdminDocumentCard.vue'
import AdminQuoteItemCard from '@/components/admin/AdminQuoteItemCard.vue'
import AdminTabs from '@/components/admin/AdminTabs.vue'
import { formatCurrency, quoteWorkbookTabs } from '@/lib/adminQuote'

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
  lookupCustomerZipcode,
  record,
  removeItem,
  resetRecord,
  sending,
  totals,
  updateCustomerPhone,
  updateCustomerState,
  updateCustomerZipcode,
  updateStakeholderPhone,
  zipcodeLookupError,
} = useAdminQuoteBuilder()

const activeQuoteId = ref<string | null>(null)
const linkedCustomerId = ref<string | null>(null)
const linkedPreQuoteId = ref<string | null>(null)
const linkedPreQuoteCode = ref('')
const linkedCustomerName = ref('')
const linkedCustomerLocation = ref('')
const isLoadingRecord = ref(false)
const isSavingRecord = ref(false)
const lastSavedAt = ref('')

interface LoadedFinalQuotePayload {
  id: string
  customerId: string
  preQuoteId: string | null
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
}

const applyLoadedQuote = (payload: LoadedFinalQuotePayload) => {
  record.value = payload.record
  activeQuoteId.value = payload.id
  linkedCustomerId.value = payload.customerId
  linkedPreQuoteId.value = payload.preQuoteId
  linkedPreQuoteCode.value = payload.preQuote?.code || ''
  linkedCustomerName.value = payload.customer?.name || ''
  linkedCustomerLocation.value = payload.customer?.locationLabel || ''
  lastSavedAt.value = payload.updatedAt
}

const loadQuoteFromRoute = async () => {
  const quoteId = typeof route.query.quoteId === 'string' ? route.query.quoteId : ''

  if (!quoteId) {
    activeQuoteId.value = null
    linkedCustomerId.value = null
    linkedPreQuoteId.value = null
    linkedPreQuoteCode.value = ''
    linkedCustomerName.value = ''
    linkedCustomerLocation.value = ''
    lastSavedAt.value = ''
    return
  }

  try {
    isLoadingRecord.value = true
    const payload = await $fetch<LoadedFinalQuotePayload>(`/api/admin/final-quotes/${quoteId}`, {
      credentials: 'include',
    })
    applyLoadedQuote(payload)
  }
  catch (error) {
    const message = typeof error === 'object'
      && error !== null
      && 'data' in error
      && typeof (error as { data?: { statusMessage?: string } }).data?.statusMessage === 'string'
      ? (error as { data: { statusMessage: string } }).data.statusMessage
      : 'Não foi possível carregar o orçamento final.'

    toast.error(message)
  }
  finally {
    isLoadingRecord.value = false
  }
}

const saveCurrentQuote = async () => {
  try {
    isSavingRecord.value = true
    const response = await $fetch<{ ok: true; finalQuote: LoadedFinalQuotePayload }>('/api/admin/final-quotes/save', {
      method: 'POST',
      credentials: 'include',
      body: {
        id: activeQuoteId.value,
        customerId: linkedCustomerId.value,
        preQuoteId: linkedPreQuoteId.value,
        record: record.value,
      },
    })

    applyLoadedQuote(response.finalQuote)

    if (typeof route.query.quoteId !== 'string' || route.query.quoteId !== response.finalQuote.id) {
      await navigateTo({
        path: '/gestao/orcamentos',
        query: {
          quoteId: response.finalQuote.id,
        },
      }, { replace: true })
    }

    toast.success('Orçamento salvo com sucesso.')
  }
  catch (error) {
    const message = typeof error === 'object'
      && error !== null
      && 'data' in error
      && typeof (error as { data?: { statusMessage?: string } }).data?.statusMessage === 'string'
      ? (error as { data: { statusMessage: string } }).data.statusMessage
      : 'Não foi possível salvar o orçamento.'

    toast.error(message)
  }
  finally {
    isSavingRecord.value = false
  }
}

const startEmptyQuote = async () => {
  resetRecord()
  activeQuoteId.value = null
  linkedCustomerId.value = null
  linkedPreQuoteId.value = null
  linkedPreQuoteCode.value = ''
  linkedCustomerName.value = ''
  linkedCustomerLocation.value = ''
  lastSavedAt.value = ''
  await navigateTo('/gestao/orcamentos', { replace: true })
}

onMounted(() => {
  void refreshSession()
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

          <div class="fields-grid fields-grid-4">
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
          </div>

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
              <span>Nome</span>
              <input v-model="record.seamstress.name" type="text" placeholder="Nome da costureira">
            </label>
            <label class="field">
              <span>E-mail</span>
              <input v-model="record.seamstress.email" type="email" placeholder="costura@email.com">
            </label>
            <label class="field">
              <span>WhatsApp</span>
              <input :value="record.seamstress.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999"
                @input="updateStakeholderPhone('seamstress', ($event.target as HTMLInputElement).value)">
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
        </section>

        <section v-else-if="activeTab === 'instalador'" class="panel-card panel-grid">
          <div class="panel-heading">
            <span class="section-kicker">Pedido do instalador</span>
            <h2>Contato e instruções de instalação</h2>
          </div>

          <div class="fields-grid fields-grid-3">
            <label class="field">
              <span>Nome</span>
              <input v-model="record.installer.name" type="text" placeholder="Nome do instalador">
            </label>
            <label class="field">
              <span>E-mail</span>
              <input v-model="record.installer.email" type="email" placeholder="instalacao@email.com">
            </label>
            <label class="field">
              <span>WhatsApp</span>
              <input :value="record.installer.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999"
                @input="updateStakeholderPhone('installer', ($event.target as HTMLInputElement).value)">
            </label>
          </div>

          <label class="field">
            <span>Observações para instalação</span>
            <textarea v-model="record.installer.notes" rows="5" placeholder="Altura de trilho, acesso, andaime, elétrica, restrições de obra..." />
          </label>

          <div class="preview-block">
            <span class="section-kicker">Prévia</span>
            <ul>
              <li v-for="line in documents[2].summary.lines.slice(0, 8)" :key="line">{{ line }}</li>
            </ul>
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
            v-for="document in documents"
            :key="document.kind"
            :title="document.title"
            :description="document.summary.lines[0] || 'Documento pronto para revisão.'"
            :preview-lines="document.summary.lines.slice(1, 6)"
            :recipient-email="document.email"
            :recipient-whatsapp="document.whatsapp"
            :can-send="document.ready"
            :sending-email="sending[`${document.kind}-email`]"
            :sending-whats-app="sending[`${document.kind}-whatsapp`]"
            @download="downloadPdf(document.kind)"
            @send-email="deliverDocument(document.kind, 'email')"
            @send-whatsapp="deliverDocument(document.kind, 'whatsapp')"
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
  .fields-grid-4 {
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
