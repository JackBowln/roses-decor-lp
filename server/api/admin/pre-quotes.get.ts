import { getQuery } from 'h3'
import { assertAdminSession } from '../../utils/adminAuth'
import { listPreQuotes } from '../../utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)
  const customerId = typeof query.customerId === 'string' ? query.customerId : ''
  const search = typeof query.search === 'string' ? query.search.trim().toLowerCase() : ''
  const records = await listPreQuotes()

  return {
    preQuotes: records.filter((record) => {
      if (customerId && record.customerId !== customerId) {
        return false
      }

      if (!search) {
        return true
      }

      return [record.code, record.customer.name, record.customer.locationLabel]
        .join(' ')
        .toLowerCase()
        .includes(search)
    }),
  }
})
