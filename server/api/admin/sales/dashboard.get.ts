import { createError, getQuery } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { fetchSalesDashboard } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)

  if (query.range !== 'week' && query.range !== 'month' && query.range !== 'year') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe o recorte do dashboard como week, month ou year.',
    })
  }

  return {
    metrics: await fetchSalesDashboard({
      range: query.range,
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
    }),
  }
})
