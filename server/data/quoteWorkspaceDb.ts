import { createError } from 'h3'
import { neon } from '@netlify/neon'
import { Pool, neonConfig, type PoolClient } from '@neondatabase/serverless'
import { resolveDatabaseConfig } from '~~/server/utils/databaseConfig'

export type QuoteWorkspaceDbClient = PoolClient

if (!neonConfig.webSocketConstructor && typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket
}

const getRequiredDatabaseConfig = () => {
  try {
    return resolveDatabaseConfig({ logContext: 'quote-workspace' })
  }
  catch (error) {
    throw createError({
      statusCode: 503,
      statusMessage: error instanceof Error
        ? error.message
        : 'Configuração de banco indisponível para o workspace.',
    })
  }
}

export const isQuoteWorkspaceDatabaseConfigured = () => {
  try {
    return Boolean(resolveDatabaseConfig({ optional: true, logContext: false }))
  }
  catch {
    return false
  }
}

export const getQuoteWorkspaceSql = () => {
  const config = getRequiredDatabaseConfig()
  return neon(config.url)
}

export const createQuoteWorkspacePool = () => {
  const config = getRequiredDatabaseConfig()
  return new Pool({ connectionString: config.url })
}

export const withQuoteWorkspaceConnection = async <T>(task: (client: QuoteWorkspaceDbClient) => Promise<T>) => {
  const pool = createQuoteWorkspacePool()
  const client = await pool.connect()

  try {
    return await task(client)
  }
  finally {
    client.release()
    await pool.end()
  }
}

export const withQuoteWorkspaceTransaction = async <T>(task: (client: QuoteWorkspaceDbClient) => Promise<T>) => {
  const pool = createQuoteWorkspacePool()
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await task(client)
    await client.query('COMMIT')
    return result
  }
  catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
  finally {
    client.release()
    await pool.end()
  }
}
