import * as fileStore from '../data/quoteWorkspaceStore.file'
import * as neonStore from '../data/quoteWorkspaceStore.neon'

const shouldUseNeonStore = () => neonStore.isNeonQuoteWorkspaceConfigured()

export const saveWorkspaceDocument = (...args: Parameters<typeof fileStore.saveWorkspaceDocument>) =>
  shouldUseNeonStore()
    ? neonStore.saveWorkspaceDocument(...args)
    : fileStore.saveWorkspaceDocument(...args)

export const readWorkspaceDocument = (...args: Parameters<typeof fileStore.readWorkspaceDocument>) =>
  shouldUseNeonStore()
    ? neonStore.readWorkspaceDocument(...args)
    : fileStore.readWorkspaceDocument(...args)

export const createPublicPreQuoteEntry = (...args: Parameters<typeof fileStore.createPublicPreQuoteEntry>) =>
  shouldUseNeonStore()
    ? neonStore.createPublicPreQuoteEntry(...args)
    : fileStore.createPublicPreQuoteEntry(...args)

export const updatePreQuoteDocumentPath = (...args: Parameters<typeof fileStore.updatePreQuoteDocumentPath>) =>
  shouldUseNeonStore()
    ? neonStore.updatePreQuoteDocumentPath(...args)
    : fileStore.updatePreQuoteDocumentPath(...args)

export const listCustomerSummaries = (...args: Parameters<typeof fileStore.listCustomerSummaries>) =>
  shouldUseNeonStore()
    ? neonStore.listCustomerSummaries(...args)
    : fileStore.listCustomerSummaries(...args)

export const listPreQuotes = (...args: Parameters<typeof fileStore.listPreQuotes>) =>
  shouldUseNeonStore()
    ? neonStore.listPreQuotes(...args)
    : fileStore.listPreQuotes(...args)

export const findPreQuoteById = (...args: Parameters<typeof fileStore.findPreQuoteById>) =>
  shouldUseNeonStore()
    ? neonStore.findPreQuoteById(...args)
    : fileStore.findPreQuoteById(...args)

export const findFinalQuoteById = (...args: Parameters<typeof fileStore.findFinalQuoteById>) =>
  shouldUseNeonStore()
    ? neonStore.findFinalQuoteById(...args)
    : fileStore.findFinalQuoteById(...args)

export const convertPreQuoteToFinalQuote = (...args: Parameters<typeof fileStore.convertPreQuoteToFinalQuote>) =>
  shouldUseNeonStore()
    ? neonStore.convertPreQuoteToFinalQuote(...args)
    : fileStore.convertPreQuoteToFinalQuote(...args)

export const saveFinalQuoteRecord = (...args: Parameters<typeof fileStore.saveFinalQuoteRecord>) =>
  shouldUseNeonStore()
    ? neonStore.saveFinalQuoteRecord(...args)
    : fileStore.saveFinalQuoteRecord(...args)

export const updatePreQuoteStatus = (...args: Parameters<typeof fileStore.updatePreQuoteStatus>) =>
  shouldUseNeonStore()
    ? neonStore.updatePreQuoteStatus(...args)
    : fileStore.updatePreQuoteStatus(...args)
