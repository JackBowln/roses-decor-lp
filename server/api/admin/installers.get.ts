import { getQuery } from 'h3'
import { assertAdminSession } from '../../utils/adminAuth'
import { listInstallers } from '../../utils/quoteWorkspaceStore'
import type { InstallerStatus } from '~~/app/lib/quoteWorkspace'

export default defineEventHandler(async (event) => {
  assertAdminSession(event)
  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status as InstallerStatus | 'all' : 'all'

  return {
    installers: await listInstallers(status),
  }
})
