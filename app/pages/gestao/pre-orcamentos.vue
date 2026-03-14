<script setup lang="ts">
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { getPreQuoteStatusLabel, type PreQuoteListItem } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const route = useRoute()
const isLoading = ref(true)
const isConverting = ref<string | null>(null)
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const preQuotes = ref<PreQuoteListItem[]>([])

const filteredPreQuotes = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return preQuotes.value
  }

  return preQuotes.value.filter((record) =>
    [record.code, record.customer.name, record.customer.locationLabel]
      .join(' ')
      .toLowerCase()
      .includes(term),
  )
})

const loadPreQuotes = async () => {
  try {
    isLoading.value = true
    const query = new URLSearchParams()

    if (typeof route.query.customerId === 'string' && route.query.customerId) {
      query.set('customerId', route.query.customerId)
    }

    if (typeof route.query.search === 'string' && route.query.search) {
      query.set('search', route.query.search)
    }

    const response = await $fetch<{ preQuotes: PreQuoteListItem[] }>(`/api/admin/pre-quotes${query.toString() ? `?${query.toString()}` : ''}`, {
      credentials: 'include',
    })

    preQuotes.value = response.preQuotes
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível carregar os pré-orçamentos.'))
  }
  finally {
    isLoading.value = false
  }
}

const viewPdf = (id: string) => {
  window.open(`/api/admin/pre-quotes/${id}/pdf`, '_blank', 'noopener,noreferrer')
}

const convertToFinalQuote = async (id: string) => {
  try {
    isConverting.value = id
    const response = await $fetch<{ ok: true; finalQuote: { id: string } }>(`/api/admin/pre-quotes/${id}/convert`, {
      method: 'POST',
      credentials: 'include',
    })

    await loadPreQuotes()
    await navigateTo(`/gestao/orcamentos?quoteId=${response.finalQuote.id}`)
  }
  catch (error) {
    toast.error(getApiErrorMessage(error, 'Não foi possível converter o pré-orçamento.'))
  }
  finally {
    isConverting.value = null
  }
}

watch(search, async (value) => {
  await navigateTo({
    query: {
      ...route.query,
      search: value || undefined,
    },
  }, { replace: true })
})

watch(() => route.fullPath, () => {
  void loadPreQuotes()
})

onMounted(() => {
  void loadPreQuotes()
})
</script>

<template>
  <section class="admin-shell">
    <div class="container admin-stack">
      <div class="page-card page-card-hero">
        <div>
          <span class="page-kicker">Pré-orçamentos</span>
          <h1>Triagem comercial do site</h1>
          <p>Clientes e solicitações que vieram do formulário público, prontas para análise e conversão.</p>
        </div>

        <div class="toolbar-search">
          <input v-model="search" type="search" placeholder="Buscar por código, cliente ou localização">
        </div>
      </div>

      <div class="page-card" v-if="isLoading">
        <p>Carregando pré-orçamentos...</p>
      </div>

      <div v-else class="page-card table-card">
        <div class="table-head">
          <strong>{{ filteredPreQuotes.length }} registros</strong>
          <NuxtLink class="ghost-link" to="/gestao/orcamentos">Abrir orçamento vazio</NuxtLink>
        </div>

        <div class="table-shell">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Status</th>
                <th>Itens</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="record in filteredPreQuotes" :key="record.id">
                <td>
                  <strong>{{ record.code }}</strong>
                </td>
                <td>
                  <div class="table-title">{{ record.customer.name }}</div>
                  <div class="table-subtitle">{{ record.customer.locationLabel || record.customer.whatsapp }}</div>
                </td>
                <td>{{ new Date(record.createdAt).toLocaleDateString('pt-BR') }}</td>
                <td>
                  <span class="status-pill" :class="`status-${record.status}`">{{ getPreQuoteStatusLabel(record.status) }}</span>
                </td>
                <td>{{ record.itemCount }}</td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="row-button" @click="viewPdf(record.id)">Ver PDF</button>
                    <button type="button" class="row-button row-button-primary" :disabled="isConverting === record.id"
                      @click="convertToFinalQuote(record.id)">
                      {{ isConverting === record.id ? 'Convertendo...' : 'Converter em orçamento' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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

.page-kicker {
  display: inline-flex;
  margin-bottom: 12px;
  color: rgba(120, 84, 28, 0.92);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  color: var(--text-dark);
  font-size: clamp(1.7rem, 3vw, 2.6rem);
  line-height: 1.04;
  margin-bottom: 10px;
}

p,
input,
table {
  color: rgba(61, 61, 61, 0.9);
}

.toolbar-search input {
  width: 100%;
  min-height: 50px;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(26, 26, 26, 0.12);
  background: rgba(255, 255, 255, 0.9);
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

.ghost-link,
.row-button {
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
}

.row-button-primary {
  background: var(--primary);
  color: var(--white);
  border-color: transparent;
}

.row-button:disabled {
  opacity: 0.5;
}

.table-shell {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 880px;
}

th,
td {
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(197, 160, 89, 0.12);
  vertical-align: middle;
}

th {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(120, 84, 28, 0.8);
}

.table-title {
  font-weight: 700;
  color: var(--text-dark);
}

.table-subtitle {
  margin-top: 4px;
  font-size: 0.88rem;
  color: rgba(61, 61, 61, 0.68);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-novo {
  background: rgba(197, 160, 89, 0.12);
  color: #7b5d1c;
}

.status-em_analise {
  background: rgba(35, 95, 153, 0.12);
  color: #1f4c76;
}

.status-convertido {
  background: rgba(62, 120, 73, 0.12);
  color: #2f6b3b;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

@media (max-width: 960px) {
  .page-card-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .admin-shell {
    padding: 18px 0 44px;
  }

  .page-card {
    padding: 18px;
    border-radius: 24px;
  }

  .table-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
