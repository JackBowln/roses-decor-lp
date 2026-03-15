import { getQuery } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { listSales } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)

  return {
    sales: await listSales({
      customerId: typeof query.customerId === 'string' ? query.customerId : '',
      search: typeof query.search === 'string' ? query.search : '',
      status: query.status === 'vendido' || query.status === 'pago' || query.status === 'all'
        ? query.status
        : 'all',
      dateFrom: typeof query.dateFrom === 'string' ? query.dateFrom : '',
      dateTo: typeof query.dateTo === 'string' ? query.dateTo : '',
      paymentMethod: typeof query.paymentMethod === 'string' ? query.paymentMethod : '',
      seamstressId: typeof query.seamstressId === 'string' ? query.seamstressId : '',
      installerId: typeof query.installerId === 'string' ? query.installerId : '',
      productType: query.productType === 'cortina' || query.productType === 'persiana'
        ? query.productType
        : undefined,
      sortBy: query.sortBy === 'customer' || query.sortBy === 'date' || query.sortBy === 'value' || query.sortBy === 'status'
        ? query.sortBy
        : 'date',
    }),
  }
})
