import { isValidEmail, isValidPhone } from '@/lib/fieldMasks'

export type QuoteTabId = 'cliente' | 'projeto' | 'itens' | 'costureira' | 'instalador' | 'envio'
export type QuoteDocumentKind = 'cliente' | 'costureira' | 'instalador'
export type ProductCategory = 'Cortina em tecido' | 'Persiana rolo' | 'Persiana de madeira' | 'Double vision' | 'Romana' | 'Outro'
export type MountType = 'Teto' | 'Parede' | 'Vão'
export type OpeningSide = 'Esquerda' | 'Direita' | 'Centro' | 'Dupla abertura' | 'Não se aplica'
export type PriceField = number | null
export type TrackType = 'DUPLO' | 'SIMPLES' | 'PAREDE' | 'NÃO'
export type YesNoOption = 'SIM' | 'NÃO'
export type BlackoutOption = 'SEM' | '0.7' | '1'
export type FabricOption = 'LINHO' | 'LINHO RUSTICO' | 'VOIL' | 'NÃO'
export type PleatOption = 'WAVE' | 'PA' | 'NÃO'

export interface QuoteWorkbookTab {
  id: QuoteTabId
  label: string
  description: string
}

export interface QuoteCustomer {
  name: string
  phone: string
  email: string
  address: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipcode: string
}

export interface QuoteStakeholder {
  name: string
  email: string
  whatsapp: string
  notes: string
}

export interface QuoteProject {
  code: string
  createdAt: string
  validUntil: string
  salesRep: string
  paymentTerms: string
  deliveryLeadTime: string
  installationTerms: string
  cashDiscountRate: number
  cardDiscountRate: number
  cardInstallments: number
  discount: PriceField
  travelFee: PriceField
  installationFee: PriceField
  notes: string
}

export interface QuoteLineItem {
  id: string
  room: string
  openingLabel: string
  category: ProductCategory
  quantity: number
  width: number | null
  height: number | null
  trackType: TrackType
  wallSupport: YesNoOption
  slider: YesNoOption
  terminal: YesNoOption
  blackout: BlackoutOption
  fabric: FabricOption
  fabricColor: string
  pleatModel: PleatOption
  installationIncluded: YesNoOption
  mountType: MountType
  openingSide: OpeningSide
  controlSide: string
  unitPrice: PriceField
  sewingPrice: PriceField
  installationPrice: PriceField
  notes: string
}

export interface AdminQuoteRecord {
  customer: QuoteCustomer
  project: QuoteProject
  seamstress: QuoteStakeholder
  installer: QuoteStakeholder
  items: QuoteLineItem[]
}

export interface QuoteTotals {
  materialSubtotal: number
  sewingSubtotal: number
  installationSubtotal: number
  extrasSubtotal: number
  discountTotal: number
  grandTotal: number
}

export interface PaymentOptions {
  baseTotal: number
  cashDiscountRate: number
  cashTotal: number
  cardDiscountRate: number
  cardTotal: number
  cardInstallments: number
  cardInstallmentValue: number
}

export interface DeliveryStatusItem {
  label: string
  completed: boolean
}

export interface DocumentSummary {
  title: string
  filename: string
  lines: string[]
}

export const quoteWorkbookTabs: QuoteWorkbookTab[] = [
  {
    id: 'cliente',
    label: 'Cliente',
    description: 'Cabeçalho equivalente ao topo das abas MEMÓRIA DE CÁLCULO e ORÇAMENTO.',
  },
  {
    id: 'projeto',
    label: 'Orçamento',
    description: 'Data, prazo, condições da venda e descontos promocionais do modelo.',
  },
  {
    id: 'itens',
    label: 'Memória de cálculo',
    description: 'Campos técnicos por ambiente no mesmo espírito da aba MEMÓRIA DE CÁLCULO.',
  },
  {
    id: 'costureira',
    label: 'Pedido costureira',
    description: 'Resumo operacional com tecido, blackout, pregas, medidas e quantidade.',
  },
  {
    id: 'instalador',
    label: 'Pedido instalador',
    description: 'Informações de trilho, suporte, instalação, medidas e observações de obra.',
  },
  {
    id: 'envio',
    label: 'Envio',
    description: 'Prévia dos PDFs e disparo gratuito por e-mail ou compartilhamento no WhatsApp.',
  },
]

export const productCategoryOptions: ProductCategory[] = [
  'Cortina em tecido',
  'Persiana rolo',
  'Persiana de madeira',
  'Double vision',
  'Romana',
  'Outro',
]

export const trackTypeOptions: TrackType[] = ['DUPLO', 'SIMPLES', 'PAREDE', 'NÃO']
export const yesNoOptions: YesNoOption[] = ['SIM', 'NÃO']
export const blackoutOptions: BlackoutOption[] = ['SEM', '0.7', '1']
export const fabricOptions: FabricOption[] = ['LINHO', 'LINHO RUSTICO', 'VOIL', 'NÃO']
export const pleatOptions: PleatOption[] = ['WAVE', 'PA', 'NÃO']
export const mountTypeOptions: MountType[] = ['Teto', 'Parede', 'Vão']
export const openingSideOptions: OpeningSide[] = ['Esquerda', 'Direita', 'Centro', 'Dupla abertura', 'Não se aplica']

const todayIso = () => new Date().toISOString().slice(0, 10)
const plusDaysIso = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

export const formatArea = (width: number | null, height: number | null) => {
  if (!width || !height) {
    return 'Medidas pendentes'
  }

  return `${width.toFixed(2)}m x ${height.toFixed(2)}m`
}

export const normalizePhone = (value: string) => value.replace(/\D+/g, '')

export const createQuoteId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const formatBlackoutLabel = (value: BlackoutOption) => {
  if (value === '0.7') {
    return 'BLACKOUT 70%'
  }

  if (value === '1') {
    return 'BLACKOUT 100%'
  }

  return 'SEM BLACKOUT'
}

export const buildBudgetDescription = (item: QuoteLineItem) => {
  const parts = [
    `TRILHO ${item.trackType}`,
    formatBlackoutLabel(item.blackout),
    `TECIDO ${item.fabric}`,
    `PREGAS ${item.pleatModel}`,
  ]

  return parts.join(' - ')
}

export const createEmptyLineItem = (): QuoteLineItem => ({
  id: createQuoteId(),
  room: '',
  openingLabel: '',
  category: 'Cortina em tecido',
  quantity: 1,
  width: null,
  height: null,
  trackType: 'DUPLO',
  wallSupport: 'NÃO',
  slider: 'SIM',
  terminal: 'SIM',
  blackout: 'SEM',
  fabric: 'LINHO',
  fabricColor: '',
  pleatModel: 'WAVE',
  installationIncluded: 'SIM',
  mountType: 'Teto',
  openingSide: 'Dupla abertura',
  controlSide: '',
  unitPrice: null,
  sewingPrice: null,
  installationPrice: null,
  notes: '',
})

export const createEmptyQuoteRecord = (): AdminQuoteRecord => ({
  customer: {
    name: '',
    phone: '',
    email: '',
    address: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipcode: '',
  },
  project: {
    code: `RD-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
    createdAt: todayIso(),
    validUntil: plusDaysIso(15),
    salesRep: 'Roses Decor',
    paymentTerms: '50% no pedido e 50% na entrega.',
    deliveryLeadTime: '20 dias',
    installationTerms: 'Inclusa no valor',
    cashDiscountRate: 20,
    cardDiscountRate: 10,
    cardInstallments: 3,
    discount: 0,
    travelFee: 0,
    installationFee: 0,
    notes: 'Orçamento sujeito a alteração conforme medidas finais e definição de padrões/tecidos.',
  },
  seamstress: {
    name: 'Costureira responsável',
    email: '',
    whatsapp: '',
    notes: '',
  },
  installer: {
    name: 'Instalador responsável',
    email: '',
    whatsapp: '',
    notes: '',
  },
  items: [createEmptyLineItem()],
})

const resolvePrice = (value: PriceField) => value ?? 0

export const calculateLineItemTotal = (item: QuoteLineItem) =>
  resolvePrice(item.unitPrice) * Math.max(item.quantity, 0) + resolvePrice(item.sewingPrice) + resolvePrice(item.installationPrice)

export const calculateQuoteTotals = (record: AdminQuoteRecord): QuoteTotals => {
  const materialSubtotal = record.items.reduce(
    (total, item) => total + resolvePrice(item.unitPrice) * Math.max(item.quantity, 0),
    0,
  )
  const sewingSubtotal = record.items.reduce((total, item) => total + resolvePrice(item.sewingPrice), 0)
  const installationSubtotal = record.items.reduce((total, item) => total + resolvePrice(item.installationPrice), 0)
  const extrasSubtotal = resolvePrice(record.project.travelFee) + resolvePrice(record.project.installationFee)
  const discountTotal = resolvePrice(record.project.discount)
  const grandTotal = Math.max(materialSubtotal + sewingSubtotal + installationSubtotal + extrasSubtotal - discountTotal, 0)

  return {
    materialSubtotal,
    sewingSubtotal,
    installationSubtotal,
    extrasSubtotal,
    discountTotal,
    grandTotal,
  }
}

export const calculatePaymentOptions = (record: AdminQuoteRecord): PaymentOptions => {
  const totals = calculateQuoteTotals(record)
  const cashDiscountRate = record.project.cashDiscountRate || 0
  const cardDiscountRate = record.project.cardDiscountRate || 0
  const cardInstallments = record.project.cardInstallments || 1
  const cashTotal = totals.grandTotal * (1 - cashDiscountRate / 100)
  const cardTotal = totals.grandTotal * (1 - cardDiscountRate / 100)

  return {
    baseTotal: totals.grandTotal,
    cashDiscountRate,
    cashTotal,
    cardDiscountRate,
    cardTotal,
    cardInstallments,
    cardInstallmentValue: cardInstallments > 0 ? cardTotal / cardInstallments : cardTotal,
  }
}

export const getClientDocumentLines = (record: AdminQuoteRecord) => {
  const totals = calculateQuoteTotals(record)
  const paymentOptions = calculatePaymentOptions(record)

  return [
    `Cliente: ${record.customer.name || 'Não informado'}`,
    `Bairro: ${record.customer.neighborhood || 'Não informado'} | Cidade: ${record.customer.city || 'Não informada'}${record.customer.state ? `/${record.customer.state}` : ''}`,
    `Fone: ${record.customer.phone || 'Sem telefone'} | E-mail: ${record.customer.email || 'Sem e-mail'}`,
    `Data do orçamento: ${record.project.createdAt} | Código: ${record.project.code}`,
    '',
    'MEMORIA RESUMIDA',
    ...record.items.flatMap((item, index) => [
      `${index + 1}. ${item.room || 'AMBIENTE'} | ${buildBudgetDescription(item)}`,
      `   Vao: ${item.openingLabel || 'Nao informado'} | Medidas: ${formatArea(item.width, item.height)} | Quantidade: ${item.quantity}`,
      `   Valor total: ${formatCurrency(calculateLineItemTotal(item))}`,
      item.notes ? `   Observacoes: ${item.notes}` : '',
    ].filter(Boolean)),
    '',
    `TOTAL: ${formatCurrency(totals.grandTotal)}`,
    `DESCONTO PROMOCIONAL A VISTA (${paymentOptions.cashDiscountRate}%): ${formatCurrency(paymentOptions.baseTotal - paymentOptions.cashTotal)}`,
    `TOTAL COM DESCONTO A VISTA: ${formatCurrency(paymentOptions.cashTotal)}`,
    `CARTAO ${paymentOptions.cardInstallments}X COM ${paymentOptions.cardDiscountRate}% DE DESCONTO: ${formatCurrency(paymentOptions.cardTotal)}`,
    `VALOR DA PARCELA: ${formatCurrency(paymentOptions.cardInstallmentValue)}`,
    '',
    `Prazo de entrega: ${record.project.deliveryLeadTime}`,
    `Instalacao: ${record.project.installationTerms}`,
    `Condições da venda: ${record.project.paymentTerms}`,
    record.project.notes ? `Observações gerais: ${record.project.notes}` : '',
  ].filter(Boolean)
}

export const getSeamstressDocumentLines = (record: AdminQuoteRecord) => [
  `Pedido de costura | Projeto ${record.project.code}`,
  `Cliente final: ${record.customer.name || 'Não informado'} | Cidade: ${record.customer.city || 'Não informada'}`,
  `Responsável: ${record.seamstress.name || 'Não informado'} | Contato: ${record.seamstress.email || record.seamstress.whatsapp || 'Pendente'}`,
  '',
  ...record.items.flatMap((item, index) => [
    `${index + 1}. ${item.room || 'Ambiente'} | ${item.openingLabel || 'Vão'}`,
    `   Medidas finais: ${formatArea(item.width, item.height)} | Quantidade: ${item.quantity}`,
    `   Tecido: ${item.fabric}${item.fabricColor ? ` | Cor: ${item.fabricColor}` : ''}`,
    `   Blackout: ${formatBlackoutLabel(item.blackout)} | Pregas: ${item.pleatModel}`,
    `   Trilho: ${item.trackType} | Deslizante: ${item.slider} | Terminal: ${item.terminal}`,
    item.notes ? `   Observações: ${item.notes}` : '',
  ].filter(Boolean)),
  '',
  record.seamstress.notes ? `Observações para costura: ${record.seamstress.notes}` : '',
].filter(Boolean)

export const getInstallerDocumentLines = (record: AdminQuoteRecord) => [
  `Pedido de instalação | Projeto ${record.project.code}`,
  `Cliente: ${record.customer.name || 'Não informado'} | Telefone: ${record.customer.phone || 'Não informado'}`,
  `Endereço: ${record.customer.address || 'Pendente'}${record.customer.complement ? `, ${record.customer.complement}` : ''}${record.customer.neighborhood ? `, ${record.customer.neighborhood}` : ''}${record.customer.city ? `, ${record.customer.city}` : ''}${record.customer.state ? `/${record.customer.state}` : ''}`,
  `Instalador: ${record.installer.name || 'Não informado'} | Contato: ${record.installer.email || record.installer.whatsapp || 'Pendente'}`,
  '',
  ...record.items.flatMap((item, index) => [
    `${index + 1}. ${item.category} | ${item.room || 'Ambiente'} | ${item.openingLabel || 'Vão'}`,
    `   Medidas de referência: ${formatArea(item.width, item.height)} | Quantidade: ${item.quantity}`,
    `   Trilho: ${item.trackType} | Suporte parede: ${item.wallSupport} | Fixação: ${item.mountType}`,
    `   Deslizante: ${item.slider} | Terminal: ${item.terminal} | Instalação: ${item.installationIncluded}`,
    `   Comando / abertura: ${item.controlSide || item.openingSide}`,
    item.notes ? `   Observações de obra: ${item.notes}` : '',
  ].filter(Boolean)),
  '',
  record.installer.notes ? `Observações para instalação: ${record.installer.notes}` : '',
  record.project.notes ? `Observações gerais do projeto: ${record.project.notes}` : '',
].filter(Boolean)

export const getDocumentSummary = (record: AdminQuoteRecord, kind: QuoteDocumentKind): DocumentSummary => {
  const filenameBase = `${record.project.code || 'orcamento'}-${kind}`.toLowerCase().replace(/\s+/g, '-')

  switch (kind) {
    case 'cliente':
      return {
        title: 'Orçamento do cliente',
        filename: `${filenameBase}.pdf`,
        lines: getClientDocumentLines(record),
      }
    case 'costureira':
      return {
        title: 'Pedido da costureira',
        filename: `${filenameBase}.pdf`,
        lines: getSeamstressDocumentLines(record),
      }
    case 'instalador':
      return {
        title: 'Pedido do instalador',
        filename: `${filenameBase}.pdf`,
        lines: getInstallerDocumentLines(record),
      }
  }
}

export const getDeliveryChecklist = (record: AdminQuoteRecord): DeliveryStatusItem[] => [
  {
    label: 'Cliente com nome e WhatsApp',
    completed: Boolean(record.customer.name.trim() && isValidPhone(record.customer.phone)),
  },
  {
    label: 'Cliente com e-mail',
    completed: isValidEmail(record.customer.email),
  },
  {
    label: 'Ao menos um ambiente com medidas, descrição técnica e preço',
    completed: record.items.some((item) => item.room.trim() && item.width && item.height && calculateLineItemTotal(item) > 0),
  },
  {
    label: 'Costureira com contato definido',
    completed: Boolean(record.seamstress.email.trim() || normalizePhone(record.seamstress.whatsapp)),
  },
  {
    label: 'Instalador com contato definido',
    completed: Boolean(record.installer.email.trim() || normalizePhone(record.installer.whatsapp)),
  },
]

export const isRecordReadyForClientDelivery = (record: AdminQuoteRecord) => {
  const customer = record.customer
  const totals = calculateQuoteTotals(record)

  return Boolean(
    customer.name.trim()
    && isValidPhone(customer.phone)
    && isValidEmail(customer.email)
    && record.items.some((item) => item.room.trim() && item.width && item.height)
    && totals.grandTotal > 0,
  )
}
