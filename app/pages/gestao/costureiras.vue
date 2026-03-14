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
const seamstresses = ref<SeamstressRecord[]>([])
const form = reactive({
  id: '' as string | null,
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
}

const saveSeamstress = async () => {
  try {
    isSaving.value = true
    await persistSeamstress(form)
    toast.success(form.id ? 'Costureira atualizada.' : 'Costureira cadastrada.')
    resetForm()
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
  <section class="admin-shell">
    <div class="container admin-stack">
      <div class="page-card page-card-hero">
        <div>
          <span class="page-kicker">Costureiras</span>
          <h1>Cadastro e vínculo operacional</h1>
          <p>Cadastre responsáveis de confecção para vincular estoque, consumo por orçamento e pedidos.</p>
        </div>

        <div class="toolbar-search">
          <input v-model="search" type="search" placeholder="Buscar por nome, e-mail ou WhatsApp">
        </div>
      </div>

      <div class="page-card form-card">
        <div class="form-head">
          <div>
            <span class="page-kicker">{{ form.id ? 'Edição' : 'Novo cadastro' }}</span>
            <h2>{{ form.id ? 'Atualizar costureira' : 'Cadastrar costureira' }}</h2>
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
            <input v-model="form.email" type="email" placeholder="costura@email.com">
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
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </label>
          <label class="field">
            <span>Observações</span>
            <textarea v-model="form.notes" rows="4" placeholder="Especialidade, prazo, restrições..." />
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="primary-button" :disabled="isSaving" @click="saveSeamstress">
            {{ isSaving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar costureira' }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="page-card">
        <p>Carregando costureiras...</p>
      </div>

      <div v-else class="page-card customer-grid">
        <article v-for="seamstress in filteredSeamstresses" :key="seamstress.id" class="customer-card">
          <div>
            <span class="customer-kicker">{{ seamstress.status === 'ativa' ? 'Ativa' : 'Inativa' }}</span>
            <h2>{{ seamstress.name }}</h2>
            <p>{{ seamstress.email || 'Sem e-mail' }}<span v-if="seamstress.whatsapp"> • {{ seamstress.whatsapp }}</span></p>
          </div>

          <p class="notes">{{ seamstress.notes || 'Sem observações cadastradas.' }}</p>

          <div class="customer-actions">
            <button type="button" class="ghost-link" @click="editSeamstress(seamstress)">Editar</button>
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
.field,
.customer-card {
  display: grid;
  gap: 14px;
}

.form-head,
.customer-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
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

.field span {
  color: rgba(26, 26, 26, 0.82);
  font-size: 0.84rem;
  font-weight: 700;
}

.customer-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.customer-card {
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(197, 160, 89, 0.14);
}

.notes {
  color: rgba(61, 61, 61, 0.72);
  min-height: 48px;
}

.ghost-link,
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.88);
  color: var(--text-dark);
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.primary-button {
  background: var(--primary);
  color: var(--white);
  border-color: transparent;
}

@media (max-width: 960px) {
  .page-card-hero,
  .fields-grid-2,
  .fields-grid-3 {
    grid-template-columns: 1fr;
  }
}
</style>
