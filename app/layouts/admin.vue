<script setup lang="ts">
import {
  ClipboardList,
  Hammer,
  Palette,
  Scissors,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-vue-next'
import Header3 from '@/components/ui/Header3.vue'

const route = useRoute()
const { logout, session } = useAdminSession()
const isLoggingOut = ref(false)

const adminLinks = [
  { label: 'Pré-orçamentos', to: '/gestao/pre-orcamentos' },
  { label: 'Clientes', to: '/gestao/clientes' },
  { label: 'Orçamentos', to: '/gestao/orcamentos' },
  { label: 'Vendas', to: '/gestao/vendas' },
  { label: 'Costureiras', to: '/gestao/costureiras' },
  { label: 'Instaladores', to: '/gestao/instaladores' },
  { label: 'Tecidos', to: '/gestao/tecidos' },
  { label: 'Estoque', to: '/gestao/estoque' },
]

const adminHeaderGroups = [
  {
    id: 'comercial',
    label: 'Comercial',
    icon: TrendingUp,
    links: [
      {
        label: 'Pré-orçamentos',
        to: '/gestao/pre-orcamentos',
        description: 'Entradas do site e triagem inicial do cliente.',
        icon: ClipboardList,
      },
      {
        label: 'Clientes',
        to: '/gestao/clientes',
        description: 'Histórico de relacionamento, documentos e vendas.',
        icon: Users,
      },
      {
        label: 'Orçamentos',
        to: '/gestao/orcamentos',
        description: 'Negociação, proposta final e conversão de venda.',
        icon: TrendingUp,
      },
      {
        label: 'Vendas',
        to: '/gestao/vendas',
        description: 'Pedidos fechados, pagamentos e dashboards.',
        icon: TrendingUp,
      },
    ],
  },
  {
    id: 'operacao',
    label: 'Operação',
    icon: Hammer,
    links: [
      {
        label: 'Costureiras',
        to: '/gestao/costureiras',
        description: 'Cadastro, contato e organização da produção.',
        icon: Scissors,
      },
      {
        label: 'Instaladores',
        to: '/gestao/instaladores',
        description: 'Responsáveis por montagem, entrega e instalação.',
        icon: Hammer,
      },
      {
        label: 'Tecidos',
        to: '/gestao/tecidos',
        description: 'Catálogo de tecidos e preço por metro.',
        icon: Palette,
      },
      {
        label: 'Estoque',
        to: '/gestao/estoque',
        description: 'Saldo por costureira e movimentações de consumo.',
        icon: Warehouse,
      },
    ],
  },
]

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    await logout()
    await navigateTo('/gestao/login')
  }
  finally {
    isLoggingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(197,160,89,0.12),transparent_28%),linear-gradient(180deg,#f8f4ed_0%,#fcfaf6_38%,#f3eadb_100%)] pb-20 md:pb-0">
    <Header3
      :groups="adminHeaderGroups"
      :authenticated="session.authenticated"
      :logging-out="isLoggingOut"
      @logout="handleLogout"
    />

    <main>
      <slot />
    </main>

    <AdminMobileBottomNav :links="adminLinks" :active-path="route.path" />
  </div>
</template>
