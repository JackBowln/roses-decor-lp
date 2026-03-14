import { calculateLineItemTotal, type AdminQuoteRecord, type DocumentSummary, type QuoteDocumentKind } from '@/lib/adminQuote'

interface CustomerValidationState {
  phoneValid: boolean
  emailValid: boolean
  zipcodeValid: boolean
}

export interface QuoteDocumentStateEntry {
  kind: QuoteDocumentKind
  title: string
  summary: DocumentSummary
  email: string
  whatsapp: string
  ready: boolean
}

export interface QuoteDocumentEntry extends QuoteDocumentStateEntry {
  emailDisabledReason: string
  whatsappDisabledReason: string
}

interface DocumentReasonInput {
  kind: QuoteDocumentKind
  channel: 'email' | 'whatsapp'
  record: AdminQuoteRecord
  customerValidation: CustomerValidationState
  activeQuoteId: string | null
  selectedSeamstressId: string | null
  selectedInstallerId: string | null
}

export const getQuoteDocumentBlockReason = (input: DocumentReasonInput) => {
  if (input.kind === 'cliente') {
    if (!input.record.customer.name.trim()) {
      return 'Preencha o nome do cliente antes de enviar o orçamento.'
    }

    if (input.channel === 'email' && !input.customerValidation.emailValid) {
      return 'Informe um e-mail válido do cliente.'
    }

    if (input.channel === 'whatsapp' && !input.customerValidation.phoneValid) {
      return 'Informe um WhatsApp válido do cliente.'
    }

    if (input.record.customer.zipcode && !input.customerValidation.zipcodeValid) {
      return 'Corrija o CEP do cliente antes de enviar o orçamento.'
    }

    if (!input.record.items.some((item) => item.room.trim() && item.width && item.height && calculateLineItemTotal(item) > 0)) {
      return 'Inclua ao menos um item com ambiente, medidas e valor antes do envio.'
    }

    if (input.channel === 'email' && !input.customerValidation.phoneValid) {
      return 'O orçamento do cliente só é liberado quando o WhatsApp do cliente também estiver válido.'
    }

    if (input.channel === 'whatsapp' && !input.customerValidation.emailValid) {
      return 'O orçamento do cliente só é liberado quando o e-mail do cliente também estiver válido.'
    }

    return ''
  }

  if (input.kind === 'costureira') {
    if (!input.selectedSeamstressId) {
      return 'Selecione a costureira responsável antes de enviar o pedido.'
    }

    if (input.channel === 'email' && !input.record.seamstress.email.trim()) {
      return 'A costureira selecionada precisa ter um e-mail cadastrado.'
    }

    if (input.channel === 'whatsapp' && !input.record.seamstress.whatsapp.trim()) {
      return 'A costureira selecionada precisa ter um WhatsApp cadastrado.'
    }

    return ''
  }

  if (!input.activeQuoteId) {
    return 'Salve o orçamento antes de enviar a ficha do instalador.'
  }

  if (!input.selectedInstallerId) {
    return 'Selecione o instalador responsável.'
  }

  if (!input.record.project.installationDate) {
    return 'Defina a data de instalação ou entrega antes do envio.'
  }

  const installableItems = input.record.items.filter((item) => item.installationIncluded === 'SIM')

  if (installableItems.length === 0) {
    return 'Adicione ao menos um item com instalação para liberar a ficha do instalador.'
  }

  if (installableItems.some((item) => !item.width && !item.installationMeters)) {
    return 'Preencha a largura ou os metros de instalação dos itens instaláveis.'
  }

  if (!input.record.customer.name.trim()) {
    return 'Preencha o nome do cliente.'
  }

  if (!input.record.customer.phone.trim() && !input.record.customer.email.trim()) {
    return 'Informe ao menos um contato do cliente para a ficha de instalação.'
  }

  if (input.channel === 'email' && !input.record.installer.email.trim()) {
    return 'O instalador selecionado precisa ter um e-mail cadastrado.'
  }

  if (input.channel === 'whatsapp' && !input.record.installer.whatsapp.trim()) {
    return 'O instalador selecionado precisa ter um WhatsApp cadastrado.'
  }

  return ''
}

export const buildQuoteDocumentEntries = (input: {
  documents: QuoteDocumentStateEntry[]
  record: AdminQuoteRecord
  customerValidation: CustomerValidationState
  activeQuoteId: string | null
  selectedSeamstressId: string | null
  selectedInstallerId: string | null
}): QuoteDocumentEntry[] =>
  input.documents.map((document) => ({
    ...document,
    ready: document.kind === 'instalador'
      ? document.ready && Boolean(input.activeQuoteId && input.selectedInstallerId)
      : document.ready,
    emailDisabledReason: getQuoteDocumentBlockReason({
      kind: document.kind,
      channel: 'email',
      record: input.record,
      customerValidation: input.customerValidation,
      activeQuoteId: input.activeQuoteId,
      selectedSeamstressId: input.selectedSeamstressId,
      selectedInstallerId: input.selectedInstallerId,
    }),
    whatsappDisabledReason: getQuoteDocumentBlockReason({
      kind: document.kind,
      channel: 'whatsapp',
      record: input.record,
      customerValidation: input.customerValidation,
      activeQuoteId: input.activeQuoteId,
      selectedSeamstressId: input.selectedSeamstressId,
      selectedInstallerId: input.selectedInstallerId,
    }),
  }))
