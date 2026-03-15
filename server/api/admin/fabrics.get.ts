import { getQuery } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { listFabrics } from '~~/server/utils/quoteWorkspaceStore'
import type { FabricStatus } from '~~/app/lib/quoteWorkspace'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status as FabricStatus | 'all' : 'all'

  return {
    fabrics: await listFabrics(status),
  }
})
