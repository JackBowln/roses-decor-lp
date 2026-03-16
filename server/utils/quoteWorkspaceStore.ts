import { createError } from 'h3'
import * as fileStore from '~~/server/data/quoteWorkspaceStore.file'
import * as neonStore from '~~/server/data/quoteWorkspaceStore.neon'
import { requiresOperationalDatabaseForQuoteSave } from '~~/server/utils/quoteWorkspacePolicy'

const shouldUseNeonStore = () => neonStore.isNeonQuoteWorkspaceConfigured()
const assertOperationalDatabaseConfigured = () => {
  if (!shouldUseNeonStore()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Os módulos operacionais exigem APP_DB_TARGET e a DATABASE_URL correspondente (development, test ou production).',
    })
  }
}

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
  (() => {
    const [input] = args

    if (requiresOperationalDatabaseForQuoteSave(input)) {
      assertOperationalDatabaseConfigured()
      return neonStore.saveFinalQuoteRecord(...args)
    }

    return shouldUseNeonStore()
      ? neonStore.saveFinalQuoteRecord(...args)
      : fileStore.saveFinalQuoteRecord(...args)
  })()

export const updatePreQuoteStatus = (...args: Parameters<typeof fileStore.updatePreQuoteStatus>) =>
  shouldUseNeonStore()
    ? neonStore.updatePreQuoteStatus(...args)
    : fileStore.updatePreQuoteStatus(...args)

export const listSeamstresses = (...args: Parameters<typeof neonStore.listSeamstresses>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.listSeamstresses(...args)
}

export const saveSeamstressRecord = (...args: Parameters<typeof neonStore.saveSeamstressRecord>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.saveSeamstressRecord(...args)
}

export const listFabrics = (...args: Parameters<typeof neonStore.listFabrics>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.listFabrics(...args)
}

export const saveFabricRecord = (...args: Parameters<typeof neonStore.saveFabricRecord>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.saveFabricRecord(...args)
}

export const listSeamstressStockBalances = (...args: Parameters<typeof neonStore.listSeamstressStockBalances>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.listSeamstressStockBalances(...args)
}

export const applyManualStockMovement = (...args: Parameters<typeof neonStore.applyManualStockMovement>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.applyManualStockMovement(...args)
}

export const transferStockBetweenSeamstresses = (...args: Parameters<typeof neonStore.transferStockBetweenSeamstresses>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.transferStockBetweenSeamstresses(...args)
}

export const listStockMovements = (...args: Parameters<typeof neonStore.listStockMovements>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.listStockMovements(...args)
}

export const listInstallers = (...args: Parameters<typeof neonStore.listInstallers>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.listInstallers(...args)
}

export const saveInstaller = (...args: Parameters<typeof neonStore.saveInstaller>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.saveInstaller(...args)
}

export const findInstallerById = (...args: Parameters<typeof neonStore.findInstallerById>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.findInstallerById(...args)
}

export const listInstallerDispatches = (...args: Parameters<typeof neonStore.listInstallerDispatches>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.listInstallerDispatches(...args)
}

export const createInstallerDispatch = (...args: Parameters<typeof neonStore.createInstallerDispatch>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.createInstallerDispatch(...args)
}

export const listSales = (...args: Parameters<typeof neonStore.listSales>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.listSales(...args)
}

export const findSaleById = (...args: Parameters<typeof neonStore.findSaleById>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.findSaleById(...args)
}

export const transitionSaleStatus = (...args: Parameters<typeof neonStore.transitionSaleStatus>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.transitionSaleStatus(...args)
}

export const fetchSalesDashboard = (...args: Parameters<typeof neonStore.fetchSalesDashboard>) => {
  assertOperationalDatabaseConfigured()
  return neonStore.fetchSalesDashboard(...args)
}
