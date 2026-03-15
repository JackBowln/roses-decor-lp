import { getQuery } from 'h3'
import { assertAdminSession } from '~~/server/utils/adminAuth'
import { listInstallers } from '~~/server/utils/quoteWorkspaceStore'
import type { InstallerStatus } from '~~/app/lib/quoteWorkspace'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status as InstallerStatus | 'all' : 'all'

  return {
    installers: await listInstallers(status),
  }
})
