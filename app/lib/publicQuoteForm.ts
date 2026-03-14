import { isValidEmail, isValidPhone } from '@/lib/fieldMasks'
import type { PublicPreQuoteContact, PublicPreQuoteItem, PreQuoteRecord } from '@/lib/quoteWorkspace'

export interface QuoteItem extends PublicPreQuoteItem {}

export interface QuoteContact extends PublicPreQuoteContact {}

export interface QuoteSubmissionResult {
  preQuote: PreQuoteRecord
  whatsappUrl: string
}

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

export const canPersistQuoteItem = (item: QuoteItem) =>
  Boolean(item.type && item.env && item.material)

export const isPublicQuoteStepValid = (input: {
  currentStep: number
  currentItem: QuoteItem
  items: QuoteItem[]
  contact: QuoteContact
}) => {
  switch (input.currentStep) {
    case 0:
      return input.currentItem.type !== ''
    case 1:
      return input.currentItem.env !== ''
    case 2:
      return input.currentItem.material !== ''
    case 3:
      return input.currentItem.dontKnowMeasures
        || (input.currentItem.width !== '' && input.currentItem.height !== '')
    case 4:
      return input.items.length > 0
    case 5:
      return input.contact.name.trim() !== ''
        && input.contact.location.trim() !== ''
        && isValidPhone(input.contact.whatsapp)
        && (!input.contact.email.trim() || isValidEmail(input.contact.email))
    default:
      return true
  }
}

export const createPublicPreQuotePayload = (input: {
  customer: QuoteContact
  items: QuoteItem[]
}) => ({
  customer: input.customer,
  items: input.items,
})
