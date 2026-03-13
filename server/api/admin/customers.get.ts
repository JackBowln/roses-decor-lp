import { assertAdminSession } from '../../utils/adminAuth'
import { listCustomerSummaries } from '../../utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  return {
    customers: await listCustomerSummaries(),
  }
})
