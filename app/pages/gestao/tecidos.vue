<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { fetchFabrics, saveFabric as persistFabric } from '@/lib/quoteWorkspaceApi'
import { matchesSearchQuery } from '@/lib/search'
import type { FabricRecord } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const search = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const fabrics = ref<FabricRecord[]>([])
const form = reactive({
  id: null as string | null,
  name: '',
  category: '',
  colorOrCollection: '',
  pricePerMeter: null as number | null,
  status: 'ativo' as FabricRecord['status'],
})

const filteredFabrics = computed(() => {
  return fabrics.value.filter((fabric) =>
    matchesSearchQuery(search.value, [fabric.name, fabric.category, fabric.colorOrCollection]),
  )
})

const resetForm = () => {
  form.id = null
  form.name = ''
  form.category = ''
  form.colorOrCollection = ''
  form.pricePerMeter = null
  form.status = 'ativo'
}

const loadFabrics = async () => {
  try {
    isLoading.value = true
    const response = await fetchFabrics('all')
    fabrics.value = response.fabrics
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar os tecidos.'))
  }
  finally {
    isLoading.value = false
  }
}

const editFabric = (fabric: FabricRecord) => {
  form.id = fabric.id
  form.name = fabric.name
  form.category = fabric.category
  form.colorOrCollection = fabric.colorOrCollection
  form.pricePerMeter = fabric.pricePerMeter
  form.status = fabric.status
}

const saveFabric = async () => {
  try {
    isSaving.value = true
    await persistFabric(form)
    toast.success(form.id ? 'Tecido atualizado.' : 'Tecido cadastrado.')
    resetForm()
    await loadFabrics()
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível salvar o tecido.'))
  }
  finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadFabrics()
})
</script>

<template>
  <AppPageShell>
    <AppPageHeader
      kicker="Tecidos"
      title="Catálogo para estoque e consumo"
      description="Cadastre tecidos consultáveis pelo orçamento e vinculados ao saldo individual de cada costureira."
    >
      <template #side>
        <AppField label="Buscar tecidos">
          <AppInput v-model="search" type="search" placeholder="Buscar por nome, categoria ou coleção" />
        </AppField>
      </template>
    </AppPageHeader>

    <AppSectionCard class="grid gap-4 md:gap-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span class="app-kicker">{{ form.id ? 'Edição' : 'Novo cadastro' }}</span>
          <h2 class="mt-2 text-[1.25rem] text-foreground">{{ form.id ? 'Atualizar tecido' : 'Cadastrar tecido' }}</h2>
        </div>
        <AppButton size="sm" @click="resetForm">Limpar</AppButton>
      </div>

      <div class="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <AppField label="Nome">
          <AppInput v-model="form.name" type="text" placeholder="Linho, gaze, sarja..." />
        </AppField>
        <AppField label="Categoria">
          <AppInput v-model="form.category" type="text" placeholder="Natural, blackout, voil..." />
        </AppField>
        <AppField label="Cor / coleção">
          <AppInput v-model="form.colorOrCollection" type="text" placeholder="Areia, coleção Verano..." />
        </AppField>
        <AppField label="Valor por metro (R$)">
          <AppInput v-model.number="form.pricePerMeter" type="number" min="0" step="0.01" placeholder="79.90" />
        </AppField>
      </div>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <AppField label="Status">
          <AppSelect v-model="form.status">
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </AppSelect>
        </AppField>
        <AppSectionCard variant="soft" class="grid gap-2 p-4">
          <span class="app-kicker">Unidade</span>
          <strong class="text-[1.1rem] text-foreground">metro</strong>
          <p class="text-sm leading-6 text-muted/76">O estoque deste módulo é controlado exclusivamente em metros.</p>
        </AppSectionCard>
      </div>

      <div class="flex flex-wrap justify-end gap-3">
        <AppButton variant="primary" :loading="isSaving" @click="saveFabric">
          {{ isSaving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar tecido' }}
        </AppButton>
      </div>
    </AppSectionCard>

    <AppSectionCard v-if="isLoading">
      <p class="text-sm text-muted/85">Carregando tecidos...</p>
    </AppSectionCard>

    <AppEmptyState
      v-else-if="filteredFabrics.length === 0"
      title="Nenhum tecido encontrado"
      description="Cadastre um tecido ou ajuste o filtro para continuar."
    />

    <AppSectionCard v-else class="grid gap-4 md:gap-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminRecordCard
          v-for="fabric in filteredFabrics"
          :key="fabric.id"
          :kicker="fabric.status === 'ativo' ? 'Ativo' : 'Inativo'"
          :title="fabric.name"
          :subtitle="[fabric.category, fabric.colorOrCollection].filter(Boolean).join(' • ')"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <AdminSummaryCard label="Unidade" :value="fabric.unit" />
            <AdminSummaryCard label="Valor por metro" :value="currencyFormatter.format(fabric.pricePerMeter)" />
          </div>

          <div class="flex flex-wrap justify-between gap-3">
            <AppStatusBadge :tone="fabric.status === 'ativo' ? 'success' : 'neutral'">
              {{ fabric.status === 'ativo' ? 'Ativo' : 'Inativo' }}
            </AppStatusBadge>
            <AppButton size="sm" @click="editFabric(fabric)">Editar</AppButton>
          </div>
        </AdminRecordCard>
      </div>
    </AppSectionCard>
  </AppPageShell>
</template>
