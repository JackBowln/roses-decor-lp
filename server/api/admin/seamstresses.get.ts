import { getQuery } from 'h3'
import { assertAdminSession } from '../../utils/adminAuth'
import { listSeamstresses } from '../../utils/quoteWorkspaceStore'
import type { SeamstressStatus } from '~~/app/lib/quoteWorkspace'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status as SeamstressStatus | 'all' : 'all'

  return {
    seamstresses: await listSeamstresses(status),
  }
})
