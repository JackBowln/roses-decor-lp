import { getQuery } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { listStockMovements } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)

  return {
    movements: await listStockMovements({
      seamstressId: typeof query.seamstressId === 'string' ? query.seamstressId : '',
      fabricId: typeof query.fabricId === 'string' ? query.fabricId : '',
      quoteId: typeof query.quoteId === 'string' ? query.quoteId : '',
      dateFrom: typeof query.dateFrom === 'string' ? query.dateFrom : '',
      dateTo: typeof query.dateTo === 'string' ? query.dateTo : '',
    }),
  }
})
