<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatPhoneMask } from '@/lib/fieldMasks'
import { fetchSeamstresses, saveSeamstress as persistSeamstress } from '@/lib/quoteWorkspaceApi'
import { matchesSearchQuery } from '@/lib/search'
import type { SeamstressRecord } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const search = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const isDialogOpen = ref(false)
const seamstresses = ref<SeamstressRecord[]>([])
const form = reactive({
  id: null as string | null,
  name: '',
  email: '',
  whatsapp: '',
  notes: '',
  status: 'ativa' as SeamstressRecord['status'],
})

const filteredSeamstresses = computed(() => {
  return seamstresses.value.filter((seamstress) =>
    matchesSearchQuery(search.value, [seamstress.name, seamstress.email, seamstress.whatsapp, seamstress.notes]),
  )
})

const resetForm = () => {
  form.id = null
  form.name = ''
  form.email = ''
  form.whatsapp = ''
  form.notes = ''
  form.status = 'ativa'
}

const openCreateDialog = () => {
  resetForm()
  isDialogOpen.value = true
}

const closeDialog = () => {
  if (isSaving.value) {
    return
  }

  isDialogOpen.value = false
}

const loadSeamstresses = async () => {
  try {
    isLoading.value = true
    const response = await fetchSeamstresses('all')
    seamstresses.value = response.seamstresses
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar as costureiras.'))
  }
  finally {
    isLoading.value = false
  }
}

const editSeamstress = (seamstress: SeamstressRecord) => {
  form.id = seamstress.id
  form.name = seamstress.name
  form.email = seamstress.email
  form.whatsapp = seamstress.whatsapp
  form.notes = seamstress.notes
  form.status = seamstress.status
  isDialogOpen.value = true
}

const saveSeamstress = async () => {
  try {
    isSaving.value = true
    await persistSeamstress(form)
    toast.success(form.id ? 'Costureira atualizada.' : 'Costureira cadastrada.')
    resetForm()
    isDialogOpen.value = false
    await loadSeamstresses()
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível salvar a costureira.'))
  }
  finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadSeamstresses()
})
</script>

<template>
  <AppPageShell>
    <AppPageHeader
      kicker="Costureiras"
      title="Cadastro e vínculo operacional"
      description="Cadastre responsáveis de confecção para vincular estoque, consumo por orçamento e pedidos."
    >
      <template #side>
        <div class="grid gap-3 sm:grid-cols-[minmax(260px,1fr)_auto] sm:items-end">
          <AppField label="Buscar costureiras">
            <AppInput v-model="search" type="search" placeholder="Buscar por nome, e-mail ou WhatsApp" />
          </AppField>
          <AppButton variant="primary" size="sm" @click="openCreateDialog">
            Nova costureira
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <AppSectionCard v-if="isLoading">
      <p class="text-sm text-muted/85">Carregando costureiras...</p>
    </AppSectionCard>

    <AppEmptyState
      v-else-if="filteredSeamstresses.length === 0"
      title="Nenhuma costureira encontrada"
      description="Cadastre uma costureira ou ajuste o filtro para continuar."
    />

    <AppSectionCard v-else class="grid gap-4 md:gap-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminRecordCard
          v-for="seamstress in filteredSeamstresses"
          :key="seamstress.id"
          :kicker="seamstress.status === 'ativa' ? 'Ativa' : 'Inativa'"
          :title="seamstress.name"
          :subtitle="[seamstress.email || 'Sem e-mail', seamstress.whatsapp].filter(Boolean).join(' • ')"
        >
          <p class="min-h-12 text-sm leading-6 text-muted/76">
            {{ seamstress.notes || 'Sem observações cadastradas.' }}
          </p>

          <div class="flex flex-wrap justify-between gap-3">
            <AppStatusBadge :tone="seamstress.status === 'ativa' ? 'success' : 'neutral'">
              {{ seamstress.status === 'ativa' ? 'Ativa' : 'Inativa' }}
            </AppStatusBadge>
            <AppButton size="sm" @click="editSeamstress(seamstress)">Editar</AppButton>
          </div>
        </AdminRecordCard>
      </div>
    </AppSectionCard>

    <AppDialog
      :open="isDialogOpen"
      :title="form.id ? 'Editar costureira' : 'Nova costureira'"
      description="Atualize os dados operacionais da responsável pela confecção em um modal centralizado, com rolagem interna quando necessário."
      size="md"
      @close="closeDialog"
    >
      <template #actions>
        <AppButton size="sm" variant="secondary" @click="resetForm">
          Limpar
        </AppButton>
      </template>

      <div class="grid gap-4 md:gap-5">
        <div class="grid gap-4 lg:grid-cols-3">
          <AppField label="Nome">
            <AppInput v-model="form.name" type="text" placeholder="Nome completo" />
          </AppField>
          <AppField label="E-mail">
            <AppInput v-model="form.email" type="email" placeholder="costura@email.com" />
          </AppField>
          <AppField label="WhatsApp">
            <AppInput
              :model-value="form.whatsapp"
              type="text"
              inputmode="tel"
              placeholder="(27) 99999-9999"
              @update:model-value="form.whatsapp = formatPhoneMask(String($event ?? ''))"
            />
          </AppField>
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <AppField label="Status">
            <AppSelect v-model="form.status">
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </AppSelect>
          </AppField>
          <AppField label="Observações">
            <AppTextarea v-model="form.notes" rows="4" placeholder="Especialidade, prazo, restrições..." />
          </AppField>
        </div>

        <div class="flex flex-wrap justify-end gap-3">
          <AppButton variant="primary" :loading="isSaving" @click="saveSeamstress">
            {{ isSaving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar costureira' }}
          </AppButton>
        </div>
      </div>
    </AppDialog>
  </AppPageShell>
</template>
