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
const installers = ref<InstallerRecord[]>([])
const form = reactive({
  id: '' as string | null,
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
}

const saveInstallerRecord = async () => {
  try {
    isSaving.value = true
    await persistInstaller(form)
    toast.success(form.id ? 'Instalador atualizado.' : 'Instalador cadastrado.')
    resetForm()
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
  <section class="admin-shell">
    <div class="container admin-stack">
      <div class="page-card page-card-hero">
        <div>
          <span class="page-kicker">Instaladores</span>
          <h1>Cadastro operacional e ficha de instalação</h1>
          <p>Cadastre os responsáveis por instalação para vincular o orçamento, emitir a ficha e registrar o histórico de envio.</p>
        </div>

        <div class="toolbar-search">
          <input v-model="search" type="search" placeholder="Buscar por nome, e-mail, WhatsApp ou observação">
        </div>
      </div>

      <div class="page-card form-card">
        <div class="form-head">
          <div>
            <span class="page-kicker">{{ form.id ? 'Edição' : 'Novo cadastro' }}</span>
            <h2>{{ form.id ? 'Atualizar instalador' : 'Cadastrar instalador' }}</h2>
          </div>

          <button type="button" class="ghost-link" @click="resetForm">Limpar</button>
        </div>

        <div class="fields-grid fields-grid-3">
          <label class="field">
            <span>Nome</span>
            <input v-model="form.name" type="text" placeholder="Nome completo">
          </label>
          <label class="field">
            <span>E-mail</span>
            <input v-model="form.email" type="email" placeholder="instalacao@email.com">
          </label>
          <label class="field">
            <span>WhatsApp</span>
            <input :value="form.whatsapp" type="text" inputmode="tel" placeholder="(27) 99999-9999"
              @input="form.whatsapp = formatPhoneMask(($event.target as HTMLInputElement).value)">
          </label>
        </div>

        <div class="fields-grid fields-grid-2">
          <label class="field">
            <span>Status</span>
            <select v-model="form.status">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>
          <label class="field">
            <span>Observações</span>
            <textarea v-model="form.notes" rows="4" placeholder="Equipe, cobertura, restrições, especialidades..." />
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="primary-button" :disabled="isSaving" @click="saveInstallerRecord">
            {{ isSaving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar instalador' }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="page-card">
        <p>Carregando instaladores...</p>
      </div>

      <div v-else class="page-card customer-grid">
        <article v-for="installer in filteredInstallers" :key="installer.id" class="customer-card">
          <div>
            <span class="customer-kicker">{{ installer.status === 'ativo' ? 'Ativo' : 'Inativo' }}</span>
            <h2>{{ installer.name }}</h2>
            <p>{{ installer.email || 'Sem e-mail' }}<span v-if="installer.whatsapp"> • {{ installer.whatsapp }}</span></p>
          </div>

          <p class="notes">{{ installer.notes || 'Sem observações cadastradas.' }}</p>

          <div class="customer-actions">
            <button type="button" class="ghost-link" @click="editInstaller(installer)">Editar</button>
          </div>
        </article>
      </div>
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
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: end;
}

.page-kicker,
.customer-kicker {
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
textarea {
  color: rgba(61, 61, 61, 0.9);
}

.toolbar-search input,
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
  min-height: 120px;
  resize: vertical;
}

.form-card,
.form-actions,
.fields-grid,
.customer-grid {
  display: grid;
  gap: 16px;
}

.form-head,
.customer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.fields-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.fields-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 8px;
}

.field span {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-dark);
}

.customer-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.customer-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(197, 160, 89, 0.16);
  background: rgba(255, 255, 255, 0.72);
}

.notes {
  min-height: 44px;
}

.primary-button,
.ghost-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 18px;
  border-radius: 999px;
  font-weight: 700;
}

.primary-button {
  border: 0;
  background: var(--primary);
  color: var(--white);
}

.ghost-link {
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.8);
  color: var(--text-dark);
}

@media (max-width: 900px) {
  .page-card-hero,
  .fields-grid-3,
  .fields-grid-2,
  .customer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
