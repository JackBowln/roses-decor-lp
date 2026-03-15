export type { LoadedFinalQuotePayload, LoadedSalePayload } from '@/lib/api/types'

export { createPublicPreQuote } from '@/lib/api/publicPreQuotes'
export {
  convertPreQuoteToFinalQuote,
  fetchCustomers,
  fetchPreQuotes,
} from '@/lib/api/customersAndPreQuotes'
export {
  fetchFinalQuote,
  saveFinalQuote,
} from '@/lib/api/finalQuotes'
export {
  createInstallerDispatchLog,
  createManualStockMovement,
  createSharedQuoteDocument,
  createStockTransfer,
  deliverQuoteDocument,
  fetchFabrics,
  fetchInstallerDispatches,
  fetchInstallers,
  fetchSeamstresses,
  fetchStockBalances,
  fetchStockMovements,
  saveFabric,
  saveInstaller,
  saveSeamstress,
} from '@/lib/api/operations'
export {
  fetchSale,
  fetchSales,
  fetchSalesDashboardMetrics,
  transitionSale,
} from '@/lib/api/sales'
