<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import type { FabricRecord } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const search = ref('')
const isLoading = ref(true)
const isSaving = ref(false)
const fabrics = ref<FabricRecord[]>([])
const form = reactive({
  id: '' as string | null,
  name: '',
  category: '',
  colorOrCollection: '',
  status: 'ativo' as FabricRecord['status'],
})

const filteredFabrics = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return fabrics.value
  }

  return fabrics.value.filter((fabric) =>
    [fabric.name, fabric.category, fabric.colorOrCollection]
      .join(' ')
      .toLowerCase()
      .includes(term),
  )
})

const resetForm = () => {
  form.id = null
  form.name = ''
  form.category = ''
  form.colorOrCollection = ''
  form.status = 'ativo'
}

const loadFabrics = async () => {
  try {
    isLoading.value = true
    const response = await $fetch<{ fabrics: FabricRecord[] }>('/api/admin/fabrics?status=all', {
      credentials: 'include',
    })
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
  form.status = fabric.status
}

const saveFabric = async () => {
  try {
    isSaving.value = true
    await $fetch('/api/admin/fabrics/save', {
      method: 'POST',
      credentials: 'include',
      body: form,
    })
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
  <section class="admin-shell">
    <div class="container admin-stack">
      <div class="page-card page-card-hero">
        <div>
          <span class="page-kicker">Tecidos</span>
          <h1>Catálogo para estoque e consumo</h1>
          <p>Cadastre tecidos consultáveis pelo orçamento e vinculados ao saldo individual de cada costureira.</p>
        </div>

        <div class="toolbar-search">
          <input v-model="search" type="search" placeholder="Buscar por nome, categoria ou coleção">
        </div>
      </div>

      <div class="page-card form-card">
        <div class="form-head">
          <div>
            <span class="page-kicker">{{ form.id ? 'Edição' : 'Novo cadastro' }}</span>
            <h2>{{ form.id ? 'Atualizar tecido' : 'Cadastrar tecido' }}</h2>
          </div>

          <button type="button" class="ghost-link" @click="resetForm">Limpar</button>
        </div>

        <div class="fields-grid fields-grid-3">
          <label class="field">
            <span>Nome</span>
            <input v-model="form.name" type="text" placeholder="Linho, gaze, sarja...">
          </label>
          <label class="field">
            <span>Categoria</span>
            <input v-model="form.category" type="text" placeholder="Natural, blackout, voil...">
          </label>
          <label class="field">
            <span>Cor / coleção</span>
            <input v-model="form.colorOrCollection" type="text" placeholder="Areia, coleção Verano...">
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
          <div class="unit-card">
            <span class="page-kicker">Unidade</span>
            <strong>metro</strong>
            <p>O estoque deste módulo é controlado exclusivamente em metros.</p>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="primary-button" :disabled="isSaving" @click="saveFabric">
            {{ isSaving ? 'Salvando...' : form.id ? 'Salvar alterações' : 'Cadastrar tecido' }}
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="page-card">
        <p>Carregando tecidos...</p>
      </div>

      <div v-else class="page-card customer-grid">
        <article v-for="fabric in filteredFabrics" :key="fabric.id" class="customer-card">
          <div>
            <span class="customer-kicker">{{ fabric.status === 'ativo' ? 'Ativo' : 'Inativo' }}</span>
            <h2>{{ fabric.name }}</h2>
            <p>{{ fabric.category }}<span v-if="fabric.colorOrCollection"> • {{ fabric.colorOrCollection }}</span></p>
          </div>

          <div class="meta-row">
            <strong>Unidade</strong>
            <span>{{ fabric.unit }}</span>
          </div>

          <div class="customer-actions">
            <button type="button" class="ghost-link" @click="editFabric(fabric)">Editar</button>
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
select {
  color: rgba(61, 61, 61, 0.9);
}

.toolbar-search input,
.field input,
.field select {
  width: 100%;
  min-height: 50px;
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.9);
}

.form-card,
.form-actions,
.field,
.customer-card {
  display: grid;
  gap: 14px;
}

.form-head,
.customer-actions,
.meta-row {
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

.unit-card {
  padding: 16px;
  border-radius: 20px;
  background: rgba(247, 239, 226, 0.64);
  border: 1px solid rgba(197, 160, 89, 0.14);
}

.unit-card strong {
  display: block;
  margin-bottom: 8px;
  color: var(--text-dark);
  font-size: 1.1rem;
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
