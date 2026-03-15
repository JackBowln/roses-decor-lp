import { getQuery } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { listSeamstressStockBalances } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)

  return {
    balances: await listSeamstressStockBalances({
      seamstressId: typeof query.seamstressId === 'string' ? query.seamstressId : '',
      fabricId: typeof query.fabricId === 'string' ? query.fabricId : '',
      search: typeof query.search === 'string' ? query.search : '',
    }),
  }
})
