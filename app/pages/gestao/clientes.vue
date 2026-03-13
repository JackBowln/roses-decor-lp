<script setup lang="ts">
import type { CustomerSummary } from '@/lib/quoteWorkspace'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const search = ref('')
const isLoading = ref(true)
const customers = ref<CustomerSummary[]>([])

const filteredCustomers = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) {
    return customers.value
  }

  return customers.value.filter((customer) =>
    [customer.name, customer.whatsapp, customer.locationLabel]
      .join(' ')
      .toLowerCase()
      .includes(term),
  )
})

const loadCustomers = async () => {
  try {
    isLoading.value = true
    const response = await $fetch<{ customers: CustomerSummary[] }>('/api/admin/customers', {
      credentials: 'include',
    })
    customers.value = response.customers
  }
  finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void loadCustomers()
})
</script>

<template>
  <section class="admin-shell">
    <div class="container admin-stack">
      <div class="page-card page-card-hero">
        <div>
          <span class="page-kicker">Clientes</span>
          <h1>Relacionamento e histórico</h1>
          <p>Base consolidada de clientes com vínculo entre pré-orçamentos do site e orçamentos finais.</p>
        </div>

        <div class="toolbar-search">
          <input v-model="search" type="search" placeholder="Buscar por nome, WhatsApp ou localização">
        </div>
      </div>

      <div v-if="isLoading" class="page-card">
        <p>Carregando clientes...</p>
      </div>

      <div v-else class="page-card customer-grid">
        <article v-for="customer in filteredCustomers" :key="customer.id" class="customer-card">
          <div>
            <span class="customer-kicker">Cliente</span>
            <h2>{{ customer.name }}</h2>
            <p>{{ customer.whatsapp }}<span v-if="customer.locationLabel"> • {{ customer.locationLabel }}</span></p>
          </div>

          <div class="customer-stats">
            <div>
              <strong>{{ customer.preQuoteCount }}</strong>
              <span>Pré-orçamentos</span>
            </div>
            <div>
              <strong>{{ customer.finalQuoteCount }}</strong>
              <span>Orçamentos finais</span>
            </div>
          </div>

          <div class="customer-actions">
            <NuxtLink class="ghost-link" :to="`/gestao/pre-orcamentos?customerId=${customer.id}`">Ver pré-orçamentos</NuxtLink>
            <NuxtLink v-if="customer.lastFinalQuoteId" class="ghost-link" :to="`/gestao/orcamentos?quoteId=${customer.lastFinalQuoteId}`">
              Abrir {{ customer.lastFinalQuoteCode }}
            </NuxtLink>
            <NuxtLink class="ghost-link ghost-link-primary" to="/gestao/orcamentos">Novo orçamento</NuxtLink>
          </div>

          <div class="history-meta">
            <span v-if="customer.lastPreQuoteAt">Último pré-orçamento: {{ new Date(customer.lastPreQuoteAt).toLocaleDateString('pt-BR') }}</span>
            <span v-if="customer.lastFinalQuoteAt">Último orçamento final: {{ new Date(customer.lastFinalQuoteAt).toLocaleDateString('pt-BR') }}</span>
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
  font-size: 1.35rem;
  margin-bottom: 6px;
}

p,
input {
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

.customer-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.customer-card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(197, 160, 89, 0.14);
}

.customer-stats {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.customer-stats div {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(247, 239, 226, 0.76);
}

.customer-stats strong {
  color: var(--text-dark);
  font-size: 1.2rem;
}

.customer-stats span {
  font-size: 0.84rem;
  color: rgba(61, 61, 61, 0.7);
}

.customer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-meta {
  display: grid;
  gap: 4px;
  font-size: 0.82rem;
  color: rgba(61, 61, 61, 0.68);
}

.ghost-link {
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

.ghost-link-primary {
  background: var(--primary);
  color: var(--white);
  border-color: transparent;
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
}
</style>
