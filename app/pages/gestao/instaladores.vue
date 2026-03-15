<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatPhoneMask } from '@/lib/fieldMasks'
import { fetchInstallers, saveInstaller as persistInstaller } from '@/lib/quoteWorkspaceApi'
import { matchesSearchQuery } from '@/lib/search'
import type { InstallerRecord } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const search = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const isDialogOpen = ref(false)
const installers = ref<InstallerRecord[]>([])
const form = reactive({
  id: null as string | null,
  name: '',
  email: '',
  whatsapp: '',
  notes: '',
  status: 'ativo' as InstallerRecord['status'],
})

const filteredInstallers = computed(() => {
  return installers.value.filter((installer) =>
    matchesSearchQuery(search.value, [installer.name, installer.email, installer.whatsapp, installer.notes]),
  )
})

const resetForm = () => {
  form.id = null
  form.name = ''
  form.email = ''
  form.whatsapp = ''
  form.notes = ''
  form.status = 'ativo'
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

const loadInstallers = async () => {
  try {
    isLoading.value = true
    const response = await fetchInstallers('all')
    installers.value = response.installers
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar os instaladores.'))
  }
  finally {
    isLoading.value = false
  }
}

const editInstaller = (installer: InstallerRecord) => {
  form.id = installer.id
  form.name = installer.name
  form.email = installer.email
  form.whatsapp = installer.whatsapp
  form.notes = installer.notes
  form.status = installer.status
  isDialogOpen.value = true
}

const saveInstallerRecord = async () => {
  try {
    isSaving.value = true
    await persistInstaller(form)
    toast.success(form.id ? 'Instalador atualizado.' : 'Instalador cadastrado.')
    resetForm()
    isDialogOpen.value = false
    await loadInstallers()
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível salvar o instalador.'))
  }
  finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadInstallers()
})
</script>

<template>
  <AppPageShell>
    <AppPageHeader
      kicker="Instaladores"
      title="Cadastro operacional e ficha de instalação"
      description="Cadastre os responsáveis por instalação para vincular o orçamento, emitir a ficha e registrar o histórico de envio."
    >
      <template #side>
        <div class="grid gap-3 sm:grid-cols-[minmax(260px,1fr)_auto] sm:items-end">
          <AppField label="Buscar instaladores">
            <AppInput v-model="search" type="search" placeholder="Buscar por nome, e-mail, WhatsApp ou observação" />
          </AppField>
          <AppButton variant="primary" size="sm" @click="openCreateDialog">
            Novo instalador
          </AppButton>
        </div>
      </template>
    </AppPageHeader>

    <AppSectionCard v-if="isLoading">
      <p class="text-sm text-muted/85">Carregando instaladores...</p>
    </AppSectionCard>

    <AppEmptyState
      v-else-if="filteredInstallers.length === 0"
      title="Nenhum instalador encontrado"
      description="Cadastre um instalador ou ajuste o filtro para continuar."
    />

    <AppSectionCard v-else class="grid gap-4 md:gap-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminRecordCard
          v-for="installer in filteredInstallers"
          :key="installer.id"
          :kicker="installer.status === 'ativo' ? 'Ativo' : 'Inativo'"
          :title="installer.name"
          :subtitle="[installer.email || 'Sem e-mail', installer.whatsapp].filter(Boolean).join(' • ')"
        >
          <p class="min-h-12 text-sm leading-6 text-muted/76">
            {{ installer.notes || 'Sem observações cadastradas.' }}
          </p>

          <div class="flex flex-wrap justify-between gap-3">
            <AppStatusBadge :tone="installer.status === 'ativo' ? 'success' : 'neutral'">
              {{ installer.status === 'ativo' ? 'Ativo' : 'Inativo' }}
            </AppStatusBadge>
            <AppButton size="sm" @click="editInstaller(installer)">Editar</AppButton>
          </div>
        </AdminRecordCard>
      </div>
    </AppSectionCard>

    <AppDialog
      :open="isDialogOpen"
      :title="form.id ? 'Editar instalador' : 'Novo instalador'"
      description="Atualize o responsável pela instalação em um modal centralizado, com rolagem interna quando necessário."
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
            <AppInput v-model="form.email" type="email" placeholder="instalacao@email.com" />
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
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </AppSelect>
          </AppField>
          <AppField label="Observações">
            <AppTextarea v-model="form.notes" rows="4" placeholder="Equipe, cobertura, restrições, especialidades..." />
          </AppField>
        </div>

        <div class="flex flex-wrap justify-end gap-3">
          <AppButton variant="primary" :loading="isSaving" @click="saveInstallerRecord">
            {{ isSaving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar instalador' }}
          </AppButton>
        </div>
      </div>
    </AppDialog>
  </AppPageShell>
</template>
