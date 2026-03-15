import { getQuery } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { listInstallerDispatches } from '~~/server/utils/quoteWorkspaceStore'
import type { InstallerDispatchChannel } from '~~/app/lib/quoteWorkspace'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)

  return {
    dispatches: await listInstallerDispatches({
      installerId: typeof query.installerId === 'string' ? query.installerId : undefined,
      quoteId: typeof query.quoteId === 'string' ? query.quoteId : undefined,
      channel: typeof query.channel === 'string' ? query.channel as InstallerDispatchChannel : undefined,
      dateFrom: typeof query.dateFrom === 'string' ? query.dateFrom : undefined,
      dateTo: typeof query.dateTo === 'string' ? query.dateTo : undefined,
    }),
  }
})
