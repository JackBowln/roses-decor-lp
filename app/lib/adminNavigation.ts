import type { Component } from 'vue'
import {
  ClipboardList,
  Hammer,
  Palette,
  Scissors,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-vue-next'
import { brandConfig } from '@/lib/appBrand'

export interface AdminNavigationLink {
  label: string
  to: string
}

export interface AdminNavigationEntry extends AdminNavigationLink {
  description: string
  icon: Component
}

export interface AdminNavigationGroup {
  id: string
  label: string
  icon: Component
  links: AdminNavigationEntry[]
  quickLinks?: AdminNavigationEntry[]
  summary: string
}

export const adminNavigationLinks: AdminNavigationLink[] = [
  { label: 'Pre-orcamentos', to: '/gestao/pre-orcamentos' },
  { label: 'Clientes', to: '/gestao/clientes' },
  { label: 'Orcamentos', to: '/gestao/orcamentos' },
  { label: 'Vendas', to: '/gestao/vendas' },
  { label: 'Costureiras', to: '/gestao/costureiras' },
  { label: 'Instaladores', to: '/gestao/instaladores' },
  { label: 'Tecidos', to: '/gestao/tecidos' },
  { label: 'Estoque', to: '/gestao/estoque' },
]

export const adminHeaderPrimaryLinks: AdminNavigationEntry[] = [
  {
    label: 'Pre-orcamentos',
    to: '/gestao/pre-orcamentos',
    description: 'Entradas do site e triagem inicial do cliente.',
    icon: ClipboardList,
  },
  {
    label: 'Orcamentos',
    to: '/gestao/orcamentos',
    description: 'Negociacao, proposta final e conversao de venda.',
    icon: TrendingUp,
  },
]

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    id: 'comercial',
    label: 'Comercial',
    icon: TrendingUp,
    summary: 'Clientes e vendas ficam agrupados no acompanhamento comercial.',
    links: [
      {
        label: 'Clientes',
        to: '/gestao/clientes',
        description: 'Historico de relacionamento, documentos e vendas.',
        icon: Users,
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
    label: 'Operacao',
    icon: Hammer,
    summary: 'Costureiras, instaladores, tecidos e estoque ficam agrupados na operacao.',
    links: [
      {
        label: 'Costureiras',
        to: '/gestao/costureiras',
        description: 'Cadastro, contato e organizacao da producao.',
        icon: Scissors,
      },
      {
        label: 'Instaladores',
        to: '/gestao/instaladores',
        description: 'Responsaveis por montagem, entrega e instalacao.',
        icon: Hammer,
      },
      {
        label: 'Tecidos',
        to: '/gestao/tecidos',
        description: 'Catalogo de tecidos e preco por metro.',
        icon: Palette,
      },
      {
        label: 'Estoque',
        to: '/gestao/estoque',
        description: 'Saldo por costureira e movimentacoes de consumo.',
        icon: Warehouse,
      },
    ],
    quickLinks: [
      {
        label: 'Costureiras',
        to: '/gestao/costureiras',
        description: 'Cadastro e execucao de costura.',
        icon: Scissors,
      },
      {
        label: 'Estoque',
        to: '/gestao/estoque',
        description: 'Saldo, entradas, saidas e consumo.',
        icon: Warehouse,
      },
    ],
  },
]

export const adminHeaderConfig = {
  brandLabel: brandConfig.internalAreaLabel,
  brandName: brandConfig.displayName,
  brandDestination: '/gestao/pre-orcamentos',
  quickAction: {
    label: 'Ver vendas',
    to: '/gestao/vendas',
  },
  logoutLabel: 'Sair',
  logoutLoadingLabel: 'Saindo...',
  mobileMenuAriaLabel: 'Abrir menu da gestao',
  mobileLogoutLabel: 'Sair da gestao',
} as const
