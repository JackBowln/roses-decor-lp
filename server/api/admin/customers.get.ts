import { assertAdminSession } from '~~/server/utils/adminAuth'
import { listCustomerSummaries } from '~~/server/utils/quoteWorkspaceStore'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)

  return {
    customers: await listCustomerSummaries(),
  }
})
