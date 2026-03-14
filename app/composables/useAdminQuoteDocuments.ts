import { computed, type Ref } from 'vue'
import type { AdminQuoteRecord, QuoteDocumentKind } from '@/lib/adminQuote'
import { buildQuoteDocumentEntries, type QuoteDocumentStateEntry } from '@/lib/adminQuoteDocumentState'

interface UseAdminQuoteDocumentsOptions {
  record: Ref<AdminQuoteRecord>
  documents: Ref<QuoteDocumentStateEntry[]>
  customerValidation: Ref<{
    phoneValid: boolean
    emailValid: boolean
    zipcodeValid: boolean
  }>
  activeQuoteId: Ref<string | null>
  selectedSeamstressId: Ref<string | null>
  selectedInstallerId: Ref<string | null>
  deliverDocument: (
    kind: QuoteDocumentKind,
    channel: 'email' | 'whatsapp',
    options?: {
      quoteId?: string | null
      installerId?: string | null
    },
  ) => Promise<boolean>
  onInstallerDelivered?: () => Promise<void>
}

export const useAdminQuoteDocuments = (options: UseAdminQuoteDocumentsOptions) => {
  const documentEntries = computed(() =>
    buildQuoteDocumentEntries({
      documents: options.documents.value,
      record: options.record.value,
      customerValidation: options.customerValidation.value,
      activeQuoteId: options.activeQuoteId.value,
      selectedSeamstressId: options.selectedSeamstressId.value,
      selectedInstallerId: options.selectedInstallerId.value,
    }))

  const handleDocumentDelivery = async (kind: QuoteDocumentKind, channel: 'email' | 'whatsapp') => {
    const delivered = await options.deliverDocument(kind, channel, {
      quoteId: options.activeQuoteId.value,
      installerId: options.selectedInstallerId.value,
    })

    if (delivered && kind === 'instalador' && options.onInstallerDelivered) {
      await options.onInstallerDelivered()
    }
  }

  return {
    documentEntries,
    handleDocumentDelivery,
  }
}
