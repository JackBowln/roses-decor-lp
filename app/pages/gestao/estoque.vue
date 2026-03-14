<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  createManualStockMovement,
  createStockTransfer,
  fetchFabrics,
  fetchSeamstresses,
  fetchStockBalances,
  fetchStockMovements,
} from '@/lib/quoteWorkspaceApi'
import type { FabricRecord, SeamstressRecord, SeamstressStockBalanceView, StockMovementListItem } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const search = ref('')
const seamstressFilter = ref('')
const fabricFilter = ref('')
const quoteFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const isLoading = ref(true)
const isSubmittingManual = ref(false)
const isSubmittingTransfer = ref(false)
const seamstresses = ref<SeamstressRecord[]>([])
const fabrics = ref<FabricRecord[]>([])
const balances = ref<SeamstressStockBalanceView[]>([])
const movements = ref<StockMovementListItem[]>([])

const manualForm = reactive({
  seamstressId: '',
  fabricId: '',
  quantityMeters: null as number | null,
  mode: 'entrada_manual' as 'entrada_manual' | 'ajuste_manual',
  notes: '',
  allowNegative: false,
})

const transferForm = reactive({
  fromSeamstressId: '',
  toSeamstressId: '',
  fabricId: '',
  quantityMeters: null as number | null,
  notes: '',
})

const loadReferences = async () => {
  const [seamstressResponse, fabricResponse] = await Promise.all([
    fetchSeamstresses('all'),
    fetchFabrics('all'),
  ])

  seamstresses.value = seamstressResponse.seamstresses
  fabrics.value = fabricResponse.fabrics
}

const loadBalances = async () => {
  const response = await fetchStockBalances({
    seamstressId: seamstressFilter.value,
    fabricId: fabricFilter.value,
    search: search.value,
  })
  balances.value = response.balances
}

const loadMovements = async () => {
  const response = await fetchStockMovements({
    seamstressId: seamstressFilter.value,
    fabricId: fabricFilter.value,
    quoteId: quoteFilter.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
  })
  movements.value = response.movements
}

const loadPage = async () => {
  try {
    isLoading.value = true
    await loadReferences()
    await Promise.all([loadBalances(), loadMovements()])
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar o módulo de estoque.'))
  }
  finally {
    isLoading.value = false
  }
}

const refreshInventoryData = async () => {
  try {
    await Promise.all([loadBalances(), loadMovements()])
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível atualizar os dados do estoque.'))
  }
}

const submitManualMovement = async () => {
  try {
    isSubmittingManual.value = true
    await createManualStockMovement(manualForm)
    toast.success('Movimentação manual registrada.')
    manualForm.quantityMeters = null
    manualForm.notes = ''
    manualForm.allowNegative = false
    await refreshInventoryData()
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível registrar a movimentação manual.'))
  }
  finally {
    isSubmittingManual.value = false
  }
}

const submitTransfer = async () => {
  try {
    isSubmittingTransfer.value = true
    await createStockTransfer(transferForm)
    toast.success('Transferência registrada.')
    transferForm.quantityMeters = null
    transferForm.notes = ''
    await refreshInventoryData()
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível transferir o estoque.'))
  }
  finally {
    isSubmittingTransfer.value = false
  }
}

watch([search, seamstressFilter, fabricFilter, quoteFilter, dateFrom, dateTo], () => {
  void refreshInventoryData()
})

onMounted(() => {
  void loadPage()
})
</script>

<template>
  <section class="admin-shell">
    <div class="container admin-stack">
      <div class="page-card page-card-hero">
        <div>
          <span class="page-kicker">Estoque</span>
          <h1>Saldos por costureira e histórico auditável</h1>
          <p>Gerencie entradas, ajustes, transferências e acompanhe todas as baixas disparadas pelos orçamentos finais.</p>
        </div>

        <div class="toolbar-stack">
          <input v-model="search" type="search" placeholder="Buscar por costureira ou tecido">
          <div class="toolbar-grid">
            <select v-model="seamstressFilter">
              <option value="">Todas as costureiras</option>
              <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">{{ seamstress.name }}</option>
            </select>
            <select v-model="fabricFilter">
              <option value="">Todos os tecidos</option>
              <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                {{ [fabric.name, fabric.colorOrCollection].filter(Boolean).join(' • ') }}
              </option>
            </select>
          </div>
          <div class="toolbar-grid">
            <input v-model="quoteFilter" type="text" placeholder="ID do orçamento">
            <div />
          </div>
          <div class="toolbar-grid">
            <input v-model="dateFrom" type="date">
            <input v-model="dateTo" type="date">
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="page-card">
        <p>Carregando estoque...</p>
      </div>

      <template v-else>
        <div class="page-card card-grid">
          <section class="sub-card">
            <div class="sub-card-head">
              <div>
                <span class="page-kicker">Entrada / ajuste</span>
                <h2>Movimentação manual</h2>
              </div>
            </div>

            <div class="fields-grid fields-grid-2">
              <label class="field">
                <span>Costureira</span>
                <select v-model="manualForm.seamstressId">
                  <option value="">Selecione</option>
                  <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">{{ seamstress.name }}</option>
                </select>
              </label>
              <label class="field">
                <span>Tecido</span>
                <select v-model="manualForm.fabricId">
                  <option value="">Selecione</option>
                  <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                    {{ [fabric.name, fabric.colorOrCollection].filter(Boolean).join(' • ') }}
                  </option>
                </select>
              </label>
            </div>

            <div class="fields-grid fields-grid-3">
              <label class="field">
                <span>Tipo</span>
                <select v-model="manualForm.mode">
                  <option value="entrada_manual">Entrada manual</option>
                  <option value="ajuste_manual">Ajuste manual (+/-)</option>
                </select>
              </label>
              <label class="field">
                <span>Metros</span>
                <input v-model.number="manualForm.quantityMeters" type="number" step="0.01" placeholder="10.00">
              </label>
              <label class="field field-toggle">
                <span>Permitir negativo</span>
                <input v-model="manualForm.allowNegative" type="checkbox">
              </label>
            </div>

            <label class="field">
              <span>Observações</span>
              <textarea v-model="manualForm.notes" rows="3" placeholder="Motivo da entrada ou ajuste..." />
            </label>

            <button type="button" class="primary-button" :disabled="isSubmittingManual" @click="submitManualMovement">
              {{ isSubmittingManual ? 'Salvando...' : 'Registrar movimentação' }}
            </button>
          </section>

          <section class="sub-card">
            <div class="sub-card-head">
              <div>
                <span class="page-kicker">Transferência</span>
                <h2>Realocar entre costureiras</h2>
              </div>
            </div>

            <div class="fields-grid fields-grid-2">
              <label class="field">
                <span>Origem</span>
                <select v-model="transferForm.fromSeamstressId">
                  <option value="">Selecione</option>
                  <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">{{ seamstress.name }}</option>
                </select>
              </label>
              <label class="field">
                <span>Destino</span>
                <select v-model="transferForm.toSeamstressId">
                  <option value="">Selecione</option>
                  <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">{{ seamstress.name }}</option>
                </select>
              </label>
            </div>

            <div class="fields-grid fields-grid-2">
              <label class="field">
                <span>Tecido</span>
                <select v-model="transferForm.fabricId">
                  <option value="">Selecione</option>
                  <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                    {{ [fabric.name, fabric.colorOrCollection].filter(Boolean).join(' • ') }}
                  </option>
                </select>
              </label>
              <label class="field">
                <span>Metros</span>
                <input v-model.number="transferForm.quantityMeters" type="number" step="0.01" placeholder="5.00">
              </label>
            </div>

            <label class="field">
              <span>Observações</span>
              <textarea v-model="transferForm.notes" rows="3" placeholder="Motivo da transferência..." />
            </label>

            <button type="button" class="primary-button" :disabled="isSubmittingTransfer" @click="submitTransfer">
              {{ isSubmittingTransfer ? 'Transferindo...' : 'Transferir estoque' }}
            </button>
          </section>
        </div>

        <div class="page-card table-card">
          <div class="table-head">
            <div>
              <span class="page-kicker">Saldo atual</span>
              <h2>Estoque por costureira</h2>
            </div>
            <strong>{{ balances.length }} saldos</strong>
          </div>

          <div class="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Costureira</th>
                  <th>Tecido</th>
                  <th>Categoria</th>
                  <th>Saldo (m)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="balance in balances" :key="balance.id">
                  <td>{{ balance.seamstress.name }}</td>
                  <td>{{ balance.fabric.name }}<span v-if="balance.fabric.colorOrCollection"> • {{ balance.fabric.colorOrCollection }}</span></td>
                  <td>{{ balance.fabric.category }}</td>
                  <td><strong>{{ balance.balanceMeters.toFixed(2) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="page-card table-card">
          <div class="table-head">
            <div>
              <span class="page-kicker">Histórico</span>
              <h2>Movimentações auditáveis</h2>
            </div>
            <strong>{{ movements.length }} registros</strong>
          </div>

          <div class="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Costureira</th>
                  <th>Tecido</th>
                  <th>Metros</th>
                  <th>Origem</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="movement in movements" :key="movement.id">
                  <td>{{ new Date(movement.createdAt).toLocaleString('pt-BR') }}</td>
                  <td>{{ movement.type }}</td>
                  <td>{{ movement.seamstress.name }}</td>
                  <td>{{ movement.fabric.name }}</td>
                  <td>{{ movement.quantityMeters.toFixed(2) }}</td>
                  <td>{{ movement.quoteCode || movement.notes || 'Manual' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.admin-shell {
  padding: 24px 0 56px;
}

.admin-stack {
  display: grid;
  gap: 18px;
}

.page-card {
  padding: 22px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(197, 160, 89, 0.16);
  box-shadow: 0 18px 44px rgba(22, 22, 22, 0.08);
}

.page-card-hero {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr) 340px;
  align-items: start;
}

.page-kicker {
  display: inline-flex;
  margin-bottom: 12px;
  color: rgba(120, 84, 28, 0.92);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1,
h2 {
  color: var(--text-dark);
}

h1 {
  font-size: clamp(1.7rem, 3vw, 2.6rem);
  line-height: 1.04;
  margin-bottom: 10px;
}

h2 {
  font-size: 1.25rem;
}

p,
input,
select,
textarea,
table {
  color: rgba(61, 61, 61, 0.9);
}

.toolbar-stack,
.card-grid,
.sub-card,
.field {
  display: grid;
  gap: 14px;
}

.toolbar-grid,
.fields-grid {
  display: grid;
  gap: 14px;
}

.toolbar-grid,
.fields-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.fields-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.toolbar-stack input,
.toolbar-stack select,
.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 50px;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.9);
}

.field textarea {
  min-height: 110px;
  resize: vertical;
}

.field span {
  color: rgba(26, 26, 26, 0.82);
  font-size: 0.84rem;
  font-weight: 700;
}

.field-toggle {
  align-content: end;
}

.field-toggle input {
  width: 20px;
  min-height: auto;
  padding: 0;
}

.sub-card {
  padding: 20px;
  border-radius: 24px;
  background: rgba(247, 239, 226, 0.56);
  border: 1px solid rgba(197, 160, 89, 0.16);
}

.card-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.table-card {
  display: grid;
  gap: 16px;
}

.table-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.table-shell {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 12px;
  border-bottom: 1px solid rgba(26, 26, 26, 0.08);
  text-align: left;
  vertical-align: top;
}

.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: none;
  background: var(--primary);
  color: var(--white);
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1080px) {
  .page-card-hero,
  .card-grid,
  .toolbar-grid,
  .fields-grid-2,
  .fields-grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
