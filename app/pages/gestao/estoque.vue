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
  <AppPageShell>
    <AppPageHeader
      kicker="Estoque"
      title="Saldos por costureira e histórico auditável"
      description="Gerencie entradas, ajustes, transferências e acompanhe todas as baixas disparadas pelos orçamentos finais."
    />

    <AppSectionCard class="grid gap-4 md:gap-5">
      <div class="grid gap-4 lg:grid-cols-2">
        <AppField label="Buscar por costureira ou tecido">
          <AppInput v-model="search" type="search" placeholder="Buscar por costureira ou tecido" />
        </AppField>
        <div class="grid gap-4 sm:grid-cols-2">
          <AppField label="Costureira">
            <AppSelect v-model="seamstressFilter">
              <option value="">Todas as costureiras</option>
              <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">
                {{ seamstress.name }}
              </option>
            </AppSelect>
          </AppField>
          <AppField label="Tecido">
            <AppSelect v-model="fabricFilter">
              <option value="">Todos os tecidos</option>
              <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                {{ [fabric.name, fabric.colorOrCollection].filter(Boolean).join(' • ') }}
              </option>
            </AppSelect>
          </AppField>
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <AppField label="ID do orçamento">
          <AppInput v-model="quoteFilter" type="text" placeholder="ID do orçamento" />
        </AppField>
        <AppField label="Data inicial">
          <AppInput v-model="dateFrom" type="date" />
        </AppField>
        <AppField label="Data final">
          <AppInput v-model="dateTo" type="date" />
        </AppField>
      </div>
    </AppSectionCard>

    <AppSectionCard v-if="isLoading">
      <p class="text-sm text-muted/85">Carregando estoque...</p>
    </AppSectionCard>

    <template v-else>
      <div class="grid gap-4 xl:grid-cols-2">
        <AppSectionCard variant="soft" class="grid gap-4 md:gap-5">
          <div>
            <span class="app-kicker">Entrada / ajuste</span>
            <h2 class="mt-2 text-[1.25rem] text-foreground">Movimentação manual</h2>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <AppField label="Costureira">
              <AppSelect v-model="manualForm.seamstressId">
                <option value="">Selecione</option>
                <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">
                  {{ seamstress.name }}
                </option>
              </AppSelect>
            </AppField>
            <AppField label="Tecido">
              <AppSelect v-model="manualForm.fabricId">
                <option value="">Selecione</option>
                <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                  {{ [fabric.name, fabric.colorOrCollection].filter(Boolean).join(' • ') }}
                </option>
              </AppSelect>
            </AppField>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <AppField label="Tipo">
              <AppSelect v-model="manualForm.mode">
                <option value="entrada_manual">Entrada manual</option>
                <option value="ajuste_manual">Ajuste manual (+/-)</option>
              </AppSelect>
            </AppField>
            <AppField label="Metros">
              <AppInput v-model.number="manualForm.quantityMeters" type="number" step="0.01" placeholder="10.00" />
            </AppField>
            <label class="grid gap-2.5">
              <span class="text-sm font-bold text-foreground/90">Permitir negativo</span>
              <span class="flex min-h-touch items-center gap-3 rounded-field border border-black/10 bg-white/90 px-4 shadow-sm">
                <input v-model="manualForm.allowNegative" type="checkbox" class="h-4 w-4 rounded border-black/20 text-primary focus:ring-primary/20">
                <span class="text-sm text-muted/78">Aplicar ajuste mesmo com saldo abaixo de zero.</span>
              </span>
            </label>
          </div>

          <AppField label="Observações">
            <AppTextarea v-model="manualForm.notes" rows="3" placeholder="Motivo da entrada ou ajuste..." />
          </AppField>

          <div class="flex flex-wrap justify-end gap-3">
            <AppButton variant="primary" :loading="isSubmittingManual" @click="submitManualMovement">
              {{ isSubmittingManual ? 'Salvando...' : 'Registrar movimentação' }}
            </AppButton>
          </div>
        </AppSectionCard>

        <AppSectionCard variant="soft" class="grid gap-4 md:gap-5">
          <div>
            <span class="app-kicker">Transferência</span>
            <h2 class="mt-2 text-[1.25rem] text-foreground">Realocar entre costureiras</h2>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <AppField label="Origem">
              <AppSelect v-model="transferForm.fromSeamstressId">
                <option value="">Selecione</option>
                <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">
                  {{ seamstress.name }}
                </option>
              </AppSelect>
            </AppField>
            <AppField label="Destino">
              <AppSelect v-model="transferForm.toSeamstressId">
                <option value="">Selecione</option>
                <option v-for="seamstress in seamstresses" :key="seamstress.id" :value="seamstress.id">
                  {{ seamstress.name }}
                </option>
              </AppSelect>
            </AppField>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <AppField label="Tecido">
              <AppSelect v-model="transferForm.fabricId">
                <option value="">Selecione</option>
                <option v-for="fabric in fabrics" :key="fabric.id" :value="fabric.id">
                  {{ [fabric.name, fabric.colorOrCollection].filter(Boolean).join(' • ') }}
                </option>
              </AppSelect>
            </AppField>
            <AppField label="Metros">
              <AppInput v-model.number="transferForm.quantityMeters" type="number" step="0.01" placeholder="5.00" />
            </AppField>
          </div>

          <AppField label="Observações">
            <AppTextarea v-model="transferForm.notes" rows="3" placeholder="Motivo da transferência..." />
          </AppField>

          <div class="flex flex-wrap justify-end gap-3">
            <AppButton variant="primary" :loading="isSubmittingTransfer" @click="submitTransfer">
              {{ isSubmittingTransfer ? 'Transferindo...' : 'Transferir estoque' }}
            </AppButton>
          </div>
        </AppSectionCard>
      </div>

      <AppSectionCard class="grid gap-4 md:gap-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span class="app-kicker">Saldo atual</span>
            <h2 class="mt-2 text-[1.25rem] text-foreground">Estoque por costureira</h2>
          </div>
          <strong class="text-sm font-bold text-foreground">{{ balances.length }} saldos</strong>
        </div>

        <div v-if="balances.length === 0">
          <AppEmptyState
            title="Nenhum saldo encontrado"
            description="Ajuste os filtros ou registre entradas de estoque para visualizar os saldos."
          />
        </div>
        <div v-else>
          <div class="grid gap-4 md:hidden">
            <AdminRecordCard
              v-for="balance in balances"
              :key="balance.id"
              :kicker="balance.seamstress.name"
              :title="balance.fabric.name"
              :subtitle="[balance.fabric.category, balance.fabric.colorOrCollection].filter(Boolean).join(' • ')"
            >
              <AdminSummaryCard label="Saldo (m)" :value="balance.balanceMeters.toFixed(2)" />
            </AdminRecordCard>
          </div>

          <div class="app-data-table-shell hidden md:block">
            <table class="app-data-table">
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
                  <td>
                    {{ balance.fabric.name }}
                    <span v-if="balance.fabric.colorOrCollection"> • {{ balance.fabric.colorOrCollection }}</span>
                  </td>
                  <td>{{ balance.fabric.category }}</td>
                  <td><strong class="text-foreground">{{ balance.balanceMeters.toFixed(2) }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </AppSectionCard>

      <AppSectionCard class="grid gap-4 md:gap-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span class="app-kicker">Histórico</span>
            <h2 class="mt-2 text-[1.25rem] text-foreground">Movimentações auditáveis</h2>
          </div>
          <strong class="text-sm font-bold text-foreground">{{ movements.length }} registros</strong>
        </div>

        <div v-if="movements.length === 0">
          <AppEmptyState
            title="Nenhuma movimentação encontrada"
            description="Ajuste os filtros ou registre movimentações para construir o histórico auditável."
          />
        </div>
        <div v-else>
          <div class="grid gap-4 md:hidden">
            <AdminRecordCard
              v-for="movement in movements"
              :key="movement.id"
              :kicker="new Date(movement.createdAt).toLocaleDateString('pt-BR')"
              :title="movement.seamstress.name"
              :subtitle="movement.fabric.name"
            >
              <div class="grid gap-3 sm:grid-cols-2">
                <AdminSummaryCard label="Tipo" :value="movement.type" />
                <AdminSummaryCard label="Metros" :value="movement.quantityMeters.toFixed(2)" />
              </div>
              <p class="text-sm leading-6 text-muted/76">{{ movement.quoteCode || movement.notes || 'Manual' }}</p>
            </AdminRecordCard>
          </div>

          <div class="app-data-table-shell hidden md:block">
            <table class="app-data-table">
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
      </AppSectionCard>
    </template>
  </AppPageShell>
</template>
