import { isValidEmail, isValidPhone } from '@/lib/fieldMasks'
import { publicQuoteSteps, type PublicQuoteStepId } from '@/lib/publicQuoteConfig'
import type { PublicPreQuoteContact, PublicPreQuoteItem, PreQuoteRecord } from '@/lib/quoteWorkspace'

export interface QuoteItem extends PublicPreQuoteItem {}

export interface QuoteContact extends PublicPreQuoteContact {}

export interface QuoteSubmissionResult {
  preQuote: PreQuoteRecord
  whatsappUrl: string
}

const orderedStepIds = publicQuoteSteps.map((step) => step.id)

export const createEmptyQuoteItem = (): QuoteItem => ({
  type: '',
  env: '',
  material: '',
  blackout: 'Sem Blackout',
  width: '',
  height: '',
  dontKnowMeasures: false,
})

export const createEmptyQuoteContact = (): QuoteContact => ({
  name: '',
  whatsapp: '',
  email: '',
  location: '',
})

export const getPublicQuoteStepId = (index: number): PublicQuoteStepId =>
  orderedStepIds[index] || orderedStepIds[orderedStepIds.length - 1]

export const canPersistQuoteItem = (item: QuoteItem) =>
  Boolean(item.type && item.env && item.material)

export const appendQuoteItemIfReady = (items: QuoteItem[], item: QuoteItem) =>
  canPersistQuoteItem(item)
    ? [...items, { ...item }]
    : items

export const extractLastQuoteItemForEditing = (items: QuoteItem[]) => {
  if (items.length === 0) {
    return {
      items,
      item: null,
    }
  }

  const nextItems = [...items]
  const item = nextItems.pop() || null

  return {
    items: nextItems,
    item,
  }
}

export const removeQuoteItemAt = (items: QuoteItem[], index: number) =>
  items.filter((_, itemIndex) => itemIndex !== index)

export const isPublicQuoteStepValid = (input: {
  stepId: PublicQuoteStepId
  currentItem: QuoteItem
  items: QuoteItem[]
  contact: QuoteContact
}) => {
  switch (input.stepId) {
    case 'produto':
      return input.currentItem.type !== ''
    case 'ambiente':
      return input.currentItem.env !== ''
    case 'material':
      return input.currentItem.material !== ''
    case 'medidas':
      return input.currentItem.dontKnowMeasures
        || (input.currentItem.width !== '' && input.currentItem.height !== '')
    case 'resumo':
      return input.items.length > 0
    case 'contato':
      return input.contact.name.trim() !== ''
        && input.contact.location.trim() !== ''
        && isValidPhone(input.contact.whatsapp)
        && (!input.contact.email.trim() || isValidEmail(input.contact.email))
    default:
      return true
  }
}

export const validatePublicQuoteSubmission = (input: {
  customer: QuoteContact
  items: QuoteItem[]
}) => {
  if (!input.customer.name.trim() || !input.customer.whatsapp.trim() || !input.customer.location.trim()) {
    return 'Preencha nome, WhatsApp e localizacao para gerar o pre-orcamento.'
  }

  if (!isValidPhone(input.customer.whatsapp)) {
    return 'Informe um WhatsApp valido com DDD.'
  }

  if (input.customer.email?.trim() && !isValidEmail(input.customer.email)) {
    return 'Informe um e-mail valido ou deixe o campo em branco.'
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return 'Inclua ao menos um item no pre-orcamento.'
  }

  if (input.items.some((item) => !canPersistQuoteItem(item))) {
    return 'Revise os itens antes de salvar o pre-orcamento.'
  }

  return ''
}

export const formatPublicQuoteStatusLabel = (status: string) => status.replace(/_/g, ' ')

export const createPublicPreQuotePayload = (input: {
  customer: QuoteContact
  items: QuoteItem[]
}) => ({
  customer: input.customer,
  items: input.items,
})
