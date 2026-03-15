import { basename } from 'node:path'
import { createError } from 'h3'
import { neon } from '@netlify/neon'
import { Pool, neonConfig, type PoolClient } from '@neondatabase/serverless'
import {
  buildQuoteFabricConsumptionKey,
  buildCustomerSummaries,
  buildPreQuoteList,
  collectRequestedQuoteFabricConsumptions,
  createAdminQuoteFromPreQuote,
  createFinalQuoteRecord,
  createPreQuoteRecord,
  createSaleRecordFromFinalQuote,
  createStoredFinalQuoteCode,
  createWorkspaceId,
  hydrateQuoteRecordWithFabricConsumptions,
  normalizeMeters,
  syncCustomerFromFinalQuote,
  upsertCustomerFromPublic,
  type CustomerRecord,
  type CustomerSummary,
  type FabricRecord,
  type FabricStatus,
  type FinalQuoteDetails,
  type InstallerDispatchRecord,
  type InstallerDispatchStatus,
  type InstallerDispatchChannel,
  type InstallerRecord,
  type InstallerStatus,
  type PreQuoteListItem,
  type PreQuoteStatus,
  type QuoteFabricConsumptionRecord,
  type QuoteStageTransitionRecord,
  type PublicPreQuoteContact,
  type PreQuoteItemRecord,
  type PreQuoteRecord,
  type QuoteWorkspaceStore,
  type SaleListItem,
  type SaleRecord,
  type SalesDashboardMetrics,
  type SalesDashboardRange,
  type SeamstressFabricStockRecord,
  type SeamstressRecord,
  type SeamstressStatus,
  type SeamstressStockBalanceView,
  type StockMovementListItem,
  type StockMovementRecord,
  type StockMovementType,
  type StoredFinalQuote,
} from '~~/app/lib/quoteWorkspace'
import { normalizeAdminQuoteRecord, normalizePhone, resolveInstallationMeters, type AdminQuoteRecord } from '~~/app/lib/adminQuote'
import { buildSaleListItem, buildSalesDashboardMetrics } from '~~/app/lib/sales'

export interface WorkspaceDocumentPayload {
  bytes: Uint8Array
  filename: string
  mimeType: string
}

interface CustomerRow {
  id: string
  name: string
  whatsapp: string
  whatsapp_normalized: string
  email: string
  location_label: string
  address: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipcode: string
  created_at: string | Date
  updated_at: string | Date
}

interface PreQuoteRow {
  id: string
  code: string
  customer_id: string
  origin: 'site'
  status: PreQuoteStatus
  items_json: unknown
  measures_pending_note: string
  pdf_document_id: string | null
  created_at: string | Date
  updated_at: string | Date
  final_quote_id: string | null
}

interface FinalQuoteRow {
  id: string
  code: string
  customer_id: string
  pre_quote_id: string | null
  seamstress_id: string | null
  installer_id: string | null
  status: StoredFinalQuote['status']
  record_json: unknown
  created_at: string | Date
  updated_at: string | Date
}

interface SaleRow {
  id: string
  quote_id: string
  customer_id: string
  pre_quote_id: string | null
  seamstress_id: string | null
  installer_id: string | null
  status: SaleRecord['status']
  record_snapshot_json: unknown
  sold_at: string | Date
  paid_at: string | Date | null
  created_at: string | Date
  updated_at: string | Date
}

interface QuoteStageTransitionRow {
  id: string
  quote_id: string
  from_stage: string
  to_stage: string
  changed_at: string | Date
  changed_by: string
}

interface SeamstressRow {
  id: string
  name: string
  email: string
  whatsapp: string
  notes: string
  status: SeamstressStatus
  created_at: string | Date
  updated_at: string | Date
}

interface FabricRow {
  id: string
  name: string
  category: string
  color_or_collection: string
  price_per_meter: number
  unit: 'metro'
  status: FabricStatus
  created_at: string | Date
  updated_at: string | Date
}

interface InstallerRow {
  id: string
  name: string
  email: string
  whatsapp: string
  notes: string
  status: InstallerStatus
  created_at: string | Date
  updated_at: string | Date
}

interface InstallerDispatchRow {
  id: string
  quote_id: string
  installer_id: string
  document_kind: 'instalador'
  channel: InstallerDispatchChannel
  recipient_email: string
  recipient_whatsapp: string
  status: InstallerDispatchStatus
  error_message: string
  sent_at: string | Date | null
  created_at: string | Date
}

interface SeamstressFabricStockRow {
  id: string
  seamstress_id: string
  fabric_id: string
  balance_meters: number
  created_at: string | Date
  updated_at: string | Date
}

interface StockMovementRow {
  id: string
  seamstress_id: string
  fabric_id: string
  quote_id: string | null
  quote_item_id: string | null
  type: StockMovementType
  quantity_meters: number
  notes: string
  created_at: string | Date
}

interface QuoteFabricConsumptionRow {
  id: string
  quote_id: string
  quote_item_id: string
  seamstress_id: string
  fabric_id: string
  quantity_meters: number
  created_at: string | Date
  updated_at: string | Date
}

interface WorkspaceDocumentRow {
  id: string
  logical_path: string
  filename: string
  mime_type: string
  content_base64: string
  created_at: string | Date
  updated_at: string | Date
}

interface StockBalanceRow extends SeamstressFabricStockRow {
  seamstress_name: string
  seamstress_status: SeamstressStatus
  fabric_name: string
  fabric_category: string
  fabric_color_or_collection: string
  fabric_unit: 'metro'
  fabric_status: FabricStatus
}

interface StockMovementJoinedRow extends StockMovementRow {
  seamstress_name: string
  fabric_name: string
  fabric_category: string
  fabric_color_or_collection: string
  quote_code: string | null
}

const resolveDatabaseUrl = () =>
  process.env.NETLIFY_DATABASE_URL
  || process.env.NEON_DATABASE_URL
  || process.env.DATABASE_URL
  || ''

export const isNeonQuoteWorkspaceConfigured = () => Boolean(resolveDatabaseUrl())

if (!neonConfig.webSocketConstructor && typeof WebSocket !== 'undefined') {
  neonConfig.webSocketConstructor = WebSocket
}

const getSql = () => {
  const explicitUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL

  if (explicitUrl) {
    return neon(explicitUrl)
  }

  if (process.env.NETLIFY_DATABASE_URL) {
    return neon()
  }

  throw createError({
    statusCode: 503,
    statusMessage: 'Configure NETLIFY_DATABASE_URL, NEON_DATABASE_URL ou DATABASE_URL para persistência no Neon.',
  })
}

const createPool = () => {
  const connectionString = resolveDatabaseUrl()

  if (!connectionString) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Configure NETLIFY_DATABASE_URL, NEON_DATABASE_URL ou DATABASE_URL para persistência no Neon.',
    })
  }

  return new Pool({ connectionString })
}

const withTransaction = async <T>(task: (client: PoolClient) => Promise<T>) => {
  await ensureSchema()
  const pool = createPool()
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

const isUniqueConstraintError = (error: unknown, constraint: string) =>
  typeof error === 'object'
  && error !== null
  && (
    (
      'code' in error
      && (error as { code?: string }).code === '23505'
      && 'constraint' in error
      && (error as { constraint?: string }).constraint === constraint
    )
    || (
      'message' in error
      && typeof (error as { message?: string }).message === 'string'
      && (error as { message: string }).message.includes(`unique constraint "${constraint}"`)
    )
  )

const isLegacyGeneratedFinalQuoteCode = (code: string) => /^RD-\d{4}-\d{3}$/.test(code.trim())

const normalizeFinalQuoteCode = (code: string) => {
  const normalized = code.trim()

  if (!normalized || isLegacyGeneratedFinalQuoteCode(normalized)) {
    return createStoredFinalQuoteCode()
  }

  return normalized
}

const resolveAvailableFinalQuoteCodeWithClient = async (
  client: PoolClient,
  desiredCode: string,
  currentQuoteId?: string | null,
  autoRegenerate = false,
) => {
  let candidate = desiredCode

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const result = await client.query<{ id: string }>(
      'SELECT id FROM quote_workspace_final_quotes WHERE code = $1 LIMIT 1',
      [candidate],
    )
    const conflictingId = result.rows[0]?.id

    if (!conflictingId || conflictingId === currentQuoteId) {
      return candidate
    }

    if (!autoRegenerate) {
      return candidate
    }

    candidate = createStoredFinalQuoteCode()
  }

  throw createError({
    statusCode: 409,
    statusMessage: 'Nao foi possível gerar um código exclusivo para o orçamento. Tente salvar novamente.',
  })
}

const syncMaterialPricesFromFabricCatalog = (
  record: AdminQuoteRecord,
  fabrics: Map<string, FabricRecord>,
) => {
  record.items.forEach((item) => {
    const quantity = Math.max(item.quantity || 1, 1)
    const materialTotal = (item.fabricConsumptions || []).reduce((total, consumption) => {
      if (!consumption.fabricId) {
        return total
      }

      const quantityMeters = normalizeMeters(consumption.quantityMeters)
      const fabric = fabrics.get(consumption.fabricId)

      if (!fabric || !quantityMeters || quantityMeters <= 0) {
        return total
      }

      return total + quantityMeters * fabric.pricePerMeter
    }, 0)

    if (materialTotal > 0) {
      item.unitPrice = Math.round((materialTotal / quantity) * 100) / 100
    }
  })
}

const withClient = async <T>(task: (client: PoolClient) => Promise<T>) => {
  await ensureSchema()
  const pool = createPool()
  const client = await pool.connect()

  try {
    return await task(client)
  }
  finally {
    client.release()
    await pool.end()
  }
}

const toIso = (value: string | Date) => value instanceof Date ? value.toISOString() : value

const parseJsonColumn = <T>(value: unknown): T => {
  if (typeof value === 'string') {
    return JSON.parse(value) as T
  }

  return value as T
}

const mapCustomerRow = (row: CustomerRow): CustomerRecord => ({
  id: row.id,
  name: row.name,
  whatsapp: row.whatsapp,
  email: row.email,
  locationLabel: row.location_label,
  address: row.address,
  complement: row.complement,
  neighborhood: row.neighborhood,
  city: row.city,
  state: row.state,
  zipcode: row.zipcode,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const mapPreQuoteRow = (row: PreQuoteRow): PreQuoteRecord => ({
  id: row.id,
  code: row.code,
  customerId: row.customer_id,
  origin: row.origin,
  status: row.status,
  items: parseJsonColumn<PreQuoteItemRecord[]>(row.items_json),
  measuresPendingNote: row.measures_pending_note,
  pdfPath: row.pdf_document_id || '',
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
  finalQuoteId: row.final_quote_id,
})

const mapFinalQuoteRow = (row: FinalQuoteRow): StoredFinalQuote => ({
  id: row.id,
  code: row.code,
  customerId: row.customer_id,
  preQuoteId: row.pre_quote_id,
  seamstressId: row.seamstress_id,
  installerId: row.installer_id,
  status: row.status,
  record: normalizeAdminQuoteRecord(parseJsonColumn<AdminQuoteRecord>(row.record_json)),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const mapSaleRow = (row: SaleRow): SaleRecord => ({
  id: row.id,
  quoteId: row.quote_id,
  customerId: row.customer_id,
  preQuoteId: row.pre_quote_id,
  seamstressId: row.seamstress_id,
  installerId: row.installer_id,
  status: row.status,
  recordSnapshot: normalizeAdminQuoteRecord(parseJsonColumn<AdminQuoteRecord>(row.record_snapshot_json)),
  soldAt: toIso(row.sold_at),
  paidAt: row.paid_at ? toIso(row.paid_at) : null,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const mapQuoteStageTransitionRow = (row: QuoteStageTransitionRow): QuoteStageTransitionRecord => ({
  id: row.id,
  quoteId: row.quote_id,
  fromStage: row.from_stage,
  toStage: row.to_stage,
  changedAt: toIso(row.changed_at),
  changedBy: row.changed_by,
})

const mapSeamstressRow = (row: SeamstressRow): SeamstressRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  whatsapp: row.whatsapp,
  notes: row.notes,
  status: row.status,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const mapFabricRow = (row: FabricRow): FabricRecord => ({
  id: row.id,
  name: row.name,
  category: row.category,
  colorOrCollection: row.color_or_collection,
  pricePerMeter: Number(row.price_per_meter) || 0,
  unit: row.unit,
  status: row.status,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const mapInstallerRow = (row: InstallerRow): InstallerRecord => ({
  id: row.id,
  name: row.name,
  email: row.email,
  whatsapp: row.whatsapp,
  notes: row.notes,
  status: row.status,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const mapSeamstressFabricStockRow = (row: SeamstressFabricStockRow): SeamstressFabricStockRecord => ({
  id: row.id,
  seamstressId: row.seamstress_id,
  fabricId: row.fabric_id,
  balanceMeters: Number(row.balance_meters),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const mapStockMovementRow = (row: StockMovementRow): StockMovementRecord => ({
  id: row.id,
  seamstressId: row.seamstress_id,
  fabricId: row.fabric_id,
  quoteId: row.quote_id,
  quoteItemId: row.quote_item_id,
  type: row.type,
  quantityMeters: Number(row.quantity_meters),
  notes: row.notes,
  createdAt: toIso(row.created_at),
})

const mapQuoteFabricConsumptionRow = (row: QuoteFabricConsumptionRow): QuoteFabricConsumptionRecord => ({
  id: row.id,
  quoteId: row.quote_id,
  quoteItemId: row.quote_item_id,
  seamstressId: row.seamstress_id,
  fabricId: row.fabric_id,
  quantityMeters: Number(row.quantity_meters),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})

const mapInstallerDispatchRow = (row: InstallerDispatchRow): InstallerDispatchRecord => ({
  id: row.id,
  quoteId: row.quote_id,
  installerId: row.installer_id,
  documentKind: row.document_kind,
  channel: row.channel,
  recipientEmail: row.recipient_email,
  recipientWhatsapp: row.recipient_whatsapp,
  status: row.status,
  errorMessage: row.error_message,
  sentAt: row.sent_at ? toIso(row.sent_at) : null,
  createdAt: toIso(row.created_at),
})

const mapStockBalanceRow = (row: StockBalanceRow): SeamstressStockBalanceView => ({
  id: row.id,
  seamstressId: row.seamstress_id,
  fabricId: row.fabric_id,
  balanceMeters: Number(row.balance_meters),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
  seamstress: {
    id: row.seamstress_id,
    name: row.seamstress_name,
    status: row.seamstress_status,
  },
  fabric: {
    id: row.fabric_id,
    name: row.fabric_name,
    category: row.fabric_category,
    colorOrCollection: row.fabric_color_or_collection,
    unit: row.fabric_unit,
    status: row.fabric_status,
  },
})

const mapStockMovementJoinedRow = (row: StockMovementJoinedRow): StockMovementListItem => ({
  id: row.id,
  seamstressId: row.seamstress_id,
  fabricId: row.fabric_id,
  quoteId: row.quote_id,
  quoteItemId: row.quote_item_id,
  type: row.type,
  quantityMeters: Number(row.quantity_meters),
  notes: row.notes,
  createdAt: toIso(row.created_at),
  seamstress: {
    id: row.seamstress_id,
    name: row.seamstress_name,
  },
  fabric: {
    id: row.fabric_id,
    name: row.fabric_name,
    category: row.fabric_category,
    colorOrCollection: row.fabric_color_or_collection,
  },
  quoteCode: row.quote_code,
})

let schemaPromise: Promise<void> | null = null
let writeQueue = Promise.resolve()

const ensureSchema = async () => {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const sql = getSql()

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_documents (
          id TEXT PRIMARY KEY,
          logical_path TEXT NOT NULL UNIQUE,
          filename TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          content_base64 TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          whatsapp TEXT NOT NULL,
          whatsapp_normalized TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL DEFAULT '',
          location_label TEXT NOT NULL DEFAULT '',
          address TEXT NOT NULL DEFAULT '',
          complement TEXT NOT NULL DEFAULT '',
          neighborhood TEXT NOT NULL DEFAULT '',
          city TEXT NOT NULL DEFAULT '',
          state TEXT NOT NULL DEFAULT '',
          zipcode TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_pre_quotes (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          customer_id TEXT NOT NULL REFERENCES quote_workspace_customers (id),
          origin TEXT NOT NULL,
          status TEXT NOT NULL,
          items_json JSONB NOT NULL,
          measures_pending_note TEXT NOT NULL DEFAULT '',
          pdf_document_id TEXT NULL REFERENCES quote_workspace_documents (id),
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          final_quote_id TEXT NULL
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_final_quotes (
          id TEXT PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          customer_id TEXT NOT NULL REFERENCES quote_workspace_customers (id),
          pre_quote_id TEXT NULL REFERENCES quote_workspace_pre_quotes (id),
          seamstress_id TEXT NULL,
          installer_id TEXT NULL,
          status TEXT NOT NULL,
          record_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`ALTER TABLE quote_workspace_final_quotes ADD COLUMN IF NOT EXISTS seamstress_id TEXT NULL`
      await sql`ALTER TABLE quote_workspace_final_quotes ADD COLUMN IF NOT EXISTS installer_id TEXT NULL`

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_sales (
          id TEXT PRIMARY KEY,
          quote_id TEXT NOT NULL UNIQUE REFERENCES quote_workspace_final_quotes (id) ON DELETE CASCADE,
          customer_id TEXT NOT NULL REFERENCES quote_workspace_customers (id),
          pre_quote_id TEXT NULL REFERENCES quote_workspace_pre_quotes (id),
          seamstress_id TEXT NULL,
          installer_id TEXT NULL,
          status TEXT NOT NULL,
          record_snapshot_json JSONB NOT NULL,
          sold_at TIMESTAMPTZ NOT NULL,
          paid_at TIMESTAMPTZ NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_quote_stage_transitions (
          id TEXT PRIMARY KEY,
          quote_id TEXT NOT NULL REFERENCES quote_workspace_final_quotes (id) ON DELETE CASCADE,
          from_stage TEXT NOT NULL DEFAULT '',
          to_stage TEXT NOT NULL,
          changed_at TIMESTAMPTZ NOT NULL,
          changed_by TEXT NOT NULL DEFAULT 'admin'
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_seamstresses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL DEFAULT '',
          whatsapp TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'quote_workspace_final_quotes_seamstress_id_fkey'
          ) THEN
            ALTER TABLE quote_workspace_final_quotes
            ADD CONSTRAINT quote_workspace_final_quotes_seamstress_id_fkey
            FOREIGN KEY (seamstress_id) REFERENCES quote_workspace_seamstresses (id);
          END IF;
        END $$;
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_installers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL DEFAULT '',
          whatsapp TEXT NOT NULL DEFAULT '',
          notes TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'quote_workspace_final_quotes_installer_id_fkey'
          ) THEN
            ALTER TABLE quote_workspace_final_quotes
            ADD CONSTRAINT quote_workspace_final_quotes_installer_id_fkey
            FOREIGN KEY (installer_id) REFERENCES quote_workspace_installers (id);
          END IF;
        END $$;
      `

      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'quote_workspace_sales_seamstress_id_fkey'
          ) THEN
            ALTER TABLE quote_workspace_sales
            ADD CONSTRAINT quote_workspace_sales_seamstress_id_fkey
            FOREIGN KEY (seamstress_id) REFERENCES quote_workspace_seamstresses (id);
          END IF;
        END $$;
      `

      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_name = 'quote_workspace_sales_installer_id_fkey'
          ) THEN
            ALTER TABLE quote_workspace_sales
            ADD CONSTRAINT quote_workspace_sales_installer_id_fkey
            FOREIGN KEY (installer_id) REFERENCES quote_workspace_installers (id);
          END IF;
        END $$;
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_fabrics (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          color_or_collection TEXT NOT NULL DEFAULT '',
          price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 0,
          unit TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`ALTER TABLE quote_workspace_fabrics ADD COLUMN IF NOT EXISTS price_per_meter NUMERIC(12, 2) NOT NULL DEFAULT 0`

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_seamstress_fabric_stock (
          id TEXT PRIMARY KEY,
          seamstress_id TEXT NOT NULL REFERENCES quote_workspace_seamstresses (id),
          fabric_id TEXT NOT NULL REFERENCES quote_workspace_fabrics (id),
          balance_meters NUMERIC(12, 3) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          UNIQUE (seamstress_id, fabric_id)
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_stock_movements (
          id TEXT PRIMARY KEY,
          seamstress_id TEXT NOT NULL REFERENCES quote_workspace_seamstresses (id),
          fabric_id TEXT NOT NULL REFERENCES quote_workspace_fabrics (id),
          quote_id TEXT NULL REFERENCES quote_workspace_final_quotes (id),
          quote_item_id TEXT NULL,
          type TEXT NOT NULL,
          quantity_meters NUMERIC(12, 3) NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_quote_fabric_consumptions (
          id TEXT PRIMARY KEY,
          quote_id TEXT NOT NULL REFERENCES quote_workspace_final_quotes (id) ON DELETE CASCADE,
          quote_item_id TEXT NOT NULL,
          seamstress_id TEXT NOT NULL REFERENCES quote_workspace_seamstresses (id),
          fabric_id TEXT NOT NULL REFERENCES quote_workspace_fabrics (id),
          quantity_meters NUMERIC(12, 3) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          UNIQUE (quote_id, quote_item_id, seamstress_id, fabric_id)
        )
      `

      await sql`
        CREATE TABLE IF NOT EXISTS quote_workspace_installer_dispatches (
          id TEXT PRIMARY KEY,
          quote_id TEXT NOT NULL REFERENCES quote_workspace_final_quotes (id) ON DELETE CASCADE,
          installer_id TEXT NOT NULL REFERENCES quote_workspace_installers (id),
          document_kind TEXT NOT NULL,
          channel TEXT NOT NULL,
          recipient_email TEXT NOT NULL DEFAULT '',
          recipient_whatsapp TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL,
          error_message TEXT NOT NULL DEFAULT '',
          sent_at TIMESTAMPTZ NULL,
          created_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_customers_updated_at_idx ON quote_workspace_customers (updated_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_pre_quotes_customer_idx ON quote_workspace_pre_quotes (customer_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_pre_quotes_status_idx ON quote_workspace_pre_quotes (status, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_final_quotes_customer_idx ON quote_workspace_final_quotes (customer_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_final_quotes_pre_quote_idx ON quote_workspace_final_quotes (pre_quote_id)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_final_quotes_seamstress_idx ON quote_workspace_final_quotes (seamstress_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_final_quotes_installer_idx ON quote_workspace_final_quotes (installer_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_sales_customer_idx ON quote_workspace_sales (customer_id, sold_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_sales_quote_idx ON quote_workspace_sales (quote_id)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_sales_status_idx ON quote_workspace_sales (status, sold_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_sales_seamstress_idx ON quote_workspace_sales (seamstress_id, sold_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_sales_installer_idx ON quote_workspace_sales (installer_id, sold_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_sales_paid_idx ON quote_workspace_sales (paid_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_quote_stage_transitions_quote_idx ON quote_workspace_quote_stage_transitions (quote_id, changed_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_quote_stage_transitions_to_stage_idx ON quote_workspace_quote_stage_transitions (to_stage, changed_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_quote_stage_transitions_changed_idx ON quote_workspace_quote_stage_transitions (changed_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_seamstresses_status_idx ON quote_workspace_seamstresses (status, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_installers_status_idx ON quote_workspace_installers (status, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_fabrics_status_idx ON quote_workspace_fabrics (status, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_stock_balance_seamstress_idx ON quote_workspace_seamstress_fabric_stock (seamstress_id, updated_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_stock_balance_fabric_idx ON quote_workspace_seamstress_fabric_stock (fabric_id, updated_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_stock_movements_seamstress_idx ON quote_workspace_stock_movements (seamstress_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_stock_movements_fabric_idx ON quote_workspace_stock_movements (fabric_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_stock_movements_quote_idx ON quote_workspace_stock_movements (quote_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_stock_movements_created_idx ON quote_workspace_stock_movements (created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_quote_consumptions_quote_idx ON quote_workspace_quote_fabric_consumptions (quote_id, updated_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_quote_consumptions_seamstress_idx ON quote_workspace_quote_fabric_consumptions (seamstress_id, updated_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_quote_consumptions_fabric_idx ON quote_workspace_quote_fabric_consumptions (fabric_id, updated_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_installer_dispatches_status_idx ON quote_workspace_installer_dispatches (status, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_installer_dispatches_installer_idx ON quote_workspace_installer_dispatches (installer_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_installer_dispatches_quote_idx ON quote_workspace_installer_dispatches (quote_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_installer_dispatches_created_idx ON quote_workspace_installer_dispatches (created_at DESC)`
    })().catch((error) => {
      schemaPromise = null
      throw error
    })
  }

  return schemaPromise
}

const serializeWrite = async <T>(task: () => Promise<T>) => {
  const nextTask = writeQueue.then(task)
  writeQueue = nextTask.then(() => undefined, () => undefined)
  return nextTask
}

const readQuoteWorkspaceStore = async (): Promise<QuoteWorkspaceStore> => {
  await ensureSchema()
  const sql = getSql()
  const [customerRows, preQuoteRows, finalQuoteRows, saleRows, seamstressRows, installerRows, installerDispatchRows, transitionRows] = await sql.transaction([
    sql`SELECT * FROM quote_workspace_customers ORDER BY created_at DESC`,
    sql`SELECT * FROM quote_workspace_pre_quotes ORDER BY created_at DESC`,
    sql`SELECT * FROM quote_workspace_final_quotes ORDER BY created_at DESC`,
    sql`SELECT * FROM quote_workspace_sales ORDER BY sold_at DESC`,
    sql`SELECT * FROM quote_workspace_seamstresses ORDER BY name ASC`,
    sql`SELECT * FROM quote_workspace_installers ORDER BY name ASC`,
    sql`SELECT * FROM quote_workspace_installer_dispatches ORDER BY created_at DESC`,
    sql`SELECT * FROM quote_workspace_quote_stage_transitions ORDER BY changed_at DESC`,
  ], {
    readOnly: true,
  })

  return {
    customers: (customerRows as CustomerRow[]).map(mapCustomerRow),
    preQuotes: (preQuoteRows as PreQuoteRow[]).map(mapPreQuoteRow),
    finalQuotes: (finalQuoteRows as FinalQuoteRow[]).map(mapFinalQuoteRow),
    sales: (saleRows as SaleRow[]).map(mapSaleRow),
    seamstresses: (seamstressRows as SeamstressRow[]).map(mapSeamstressRow),
    installers: (installerRows as InstallerRow[]).map(mapInstallerRow),
    installerDispatches: (installerDispatchRows as InstallerDispatchRow[]).map(mapInstallerDispatchRow),
    quoteStageTransitions: (transitionRows as QuoteStageTransitionRow[]).map(mapQuoteStageTransitionRow),
  }
}

const mapSaleListItemFromStore = (store: QuoteWorkspaceStore, sale: SaleRecord): SaleListItem => {
  const customer = store.customers.find((entry) => entry.id === sale.customerId)
  const preQuote = sale.preQuoteId ? store.preQuotes.find((entry) => entry.id === sale.preQuoteId) : null
  const installer = sale.installerId ? store.installers.find((entry) => entry.id === sale.installerId) : null

  return buildSaleListItem({
    sale,
    customer: {
      id: customer?.id || sale.customerId,
      name: customer?.name || sale.recordSnapshot.customer.name || 'Cliente não encontrado',
      whatsapp: customer?.whatsapp || sale.recordSnapshot.customer.phone || '',
      email: customer?.email || sale.recordSnapshot.customer.email || '',
      locationLabel: customer?.locationLabel || sale.recordSnapshot.customer.city || '',
      city: customer?.city || sale.recordSnapshot.customer.city || '',
      state: customer?.state || sale.recordSnapshot.customer.state || '',
    },
    preQuoteCode: preQuote?.code || null,
    seamstressName: sale.recordSnapshot.seamstress.name,
    installerName: installer?.name || sale.recordSnapshot.installer.name,
  })
}

const readQuoteFabricConsumptionsByQuoteId = async (quoteId: string) => {
  await ensureSchema()
  const sql = getSql()
  const rows = await sql`
    SELECT *
    FROM quote_workspace_quote_fabric_consumptions
    WHERE quote_id = ${quoteId}
    ORDER BY created_at ASC
  `

  return (rows as QuoteFabricConsumptionRow[]).map(mapQuoteFabricConsumptionRow)
}

const findSeamstressById = async (id: string) => {
  await ensureSchema()
  const sql = getSql()
  const [row] = await sql`
    SELECT *
    FROM quote_workspace_seamstresses
    WHERE id = ${id}
    LIMIT 1
  `

  return row ? mapSeamstressRow(row as SeamstressRow) : null
}

const getCustomerForQuoteWithClient = async (
  client: PoolClient,
  record: AdminQuoteRecord,
  existingCustomerId?: string | null,
) => {
  const normalizedPhone = normalizePhone(record.customer.phone)
  const byId = existingCustomerId
    ? await client.query<CustomerRow>(
        'SELECT * FROM quote_workspace_customers WHERE id = $1 FOR UPDATE',
        [existingCustomerId],
      )
    : null
  const byPhone = !byId?.rows[0] && normalizedPhone
    ? await client.query<CustomerRow>(
        'SELECT * FROM quote_workspace_customers WHERE whatsapp_normalized = $1 FOR UPDATE',
        [normalizedPhone],
      )
    : null
  const matchedRow = byId?.rows[0] || byPhone?.rows[0]
  const now = new Date().toISOString()

  if (matchedRow) {
    const synced = syncCustomerFromFinalQuote(mapCustomerRow(matchedRow), record)
    const result = await client.query<CustomerRow>(
      `
        UPDATE quote_workspace_customers
        SET
          name = $2,
          whatsapp = $3,
          whatsapp_normalized = $4,
          email = $5,
          location_label = $6,
          address = $7,
          complement = $8,
          neighborhood = $9,
          city = $10,
          state = $11,
          zipcode = $12,
          updated_at = $13::timestamptz
        WHERE id = $1
        RETURNING *
      `,
      [
        synced.id,
        synced.name,
        synced.whatsapp,
        normalizePhone(synced.whatsapp),
        synced.email,
        synced.locationLabel,
        synced.address,
        synced.complement,
        synced.neighborhood,
        synced.city,
        synced.state,
        synced.zipcode,
        synced.updatedAt,
      ],
    )

    return mapCustomerRow(result.rows[0])
  }

  const created: CustomerRecord = {
    id: createWorkspaceId('cus'),
    name: record.customer.name.trim(),
    whatsapp: record.customer.phone.trim(),
    email: record.customer.email.trim(),
    locationLabel: record.customer.city.trim() || record.customer.neighborhood.trim(),
    address: record.customer.address.trim(),
    complement: record.customer.complement.trim(),
    neighborhood: record.customer.neighborhood.trim(),
    city: record.customer.city.trim(),
    state: record.customer.state.trim(),
    zipcode: record.customer.zipcode.trim(),
    createdAt: now,
    updatedAt: now,
  }

  const inserted = await client.query<CustomerRow>(
    `
      INSERT INTO quote_workspace_customers (
        id,
        name,
        whatsapp,
        whatsapp_normalized,
        email,
        location_label,
        address,
        complement,
        neighborhood,
        city,
        state,
        zipcode,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::timestamptz, $14::timestamptz
      )
      RETURNING *
    `,
    [
      created.id,
      created.name,
      created.whatsapp,
      normalizePhone(created.whatsapp),
      created.email,
      created.locationLabel,
      created.address,
      created.complement,
      created.neighborhood,
      created.city,
      created.state,
      created.zipcode,
      created.createdAt,
      created.updatedAt,
    ],
  )

  return mapCustomerRow(inserted.rows[0])
}

const fetchFinalQuoteWithClient = async (client: PoolClient, id: string) => {
  const result = await client.query<FinalQuoteRow>(
    'SELECT * FROM quote_workspace_final_quotes WHERE id = $1 FOR UPDATE',
    [id],
  )
  return result.rows[0] ? mapFinalQuoteRow(result.rows[0]) : null
}

const upsertFinalQuoteRecordWithClient = async (client: PoolClient, finalQuote: StoredFinalQuote) => {
  const result = await client.query<FinalQuoteRow>(
    `
      INSERT INTO quote_workspace_final_quotes (
        id,
        code,
        customer_id,
        pre_quote_id,
        seamstress_id,
        installer_id,
        status,
        record_json,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz, $10::timestamptz
      )
      ON CONFLICT (id) DO UPDATE
      SET
        code = EXCLUDED.code,
        customer_id = EXCLUDED.customer_id,
        pre_quote_id = EXCLUDED.pre_quote_id,
        seamstress_id = EXCLUDED.seamstress_id,
        installer_id = EXCLUDED.installer_id,
        status = EXCLUDED.status,
        record_json = EXCLUDED.record_json,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      finalQuote.id,
      finalQuote.code,
      finalQuote.customerId,
      finalQuote.preQuoteId,
      finalQuote.seamstressId,
      finalQuote.installerId,
      finalQuote.status,
      JSON.stringify(finalQuote.record),
      finalQuote.createdAt,
      finalQuote.updatedAt,
    ],
  )

  return mapFinalQuoteRow(result.rows[0])
}

const fetchSaleByQuoteIdWithClient = async (client: PoolClient, quoteId: string) => {
  const result = await client.query<SaleRow>(
    'SELECT * FROM quote_workspace_sales WHERE quote_id = $1 FOR UPDATE',
    [quoteId],
  )

  return result.rows[0] ? mapSaleRow(result.rows[0]) : null
}

const fetchSaleByIdWithClient = async (client: PoolClient, saleId: string) => {
  const result = await client.query<SaleRow>(
    'SELECT * FROM quote_workspace_sales WHERE id = $1 FOR UPDATE',
    [saleId],
  )

  return result.rows[0] ? mapSaleRow(result.rows[0]) : null
}

const upsertSaleWithClient = async (client: PoolClient, sale: SaleRecord) => {
  const result = await client.query<SaleRow>(
    `
      INSERT INTO quote_workspace_sales (
        id,
        quote_id,
        customer_id,
        pre_quote_id,
        seamstress_id,
        installer_id,
        status,
        record_snapshot_json,
        sold_at,
        paid_at,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz, $10::timestamptz, $11::timestamptz, $12::timestamptz
      )
      ON CONFLICT (id) DO UPDATE
      SET
        customer_id = EXCLUDED.customer_id,
        pre_quote_id = EXCLUDED.pre_quote_id,
        seamstress_id = EXCLUDED.seamstress_id,
        installer_id = EXCLUDED.installer_id,
        status = EXCLUDED.status,
        record_snapshot_json = EXCLUDED.record_snapshot_json,
        sold_at = EXCLUDED.sold_at,
        paid_at = EXCLUDED.paid_at,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      sale.id,
      sale.quoteId,
      sale.customerId,
      sale.preQuoteId,
      sale.seamstressId,
      sale.installerId,
      sale.status,
      JSON.stringify(sale.recordSnapshot),
      sale.soldAt,
      sale.paidAt,
      sale.createdAt,
      sale.updatedAt,
    ],
  )

  return mapSaleRow(result.rows[0])
}

const insertQuoteStageTransitionWithClient = async (
  client: PoolClient,
  input: {
    quoteId: string
    fromStage: string
    toStage: string
    changedAt: string
    changedBy?: string
  },
) => {
  await client.query(
    `
      INSERT INTO quote_workspace_quote_stage_transitions (
        id,
        quote_id,
        from_stage,
        to_stage,
        changed_at,
        changed_by
      ) VALUES (
        $1, $2, $3, $4, $5::timestamptz, $6
      )
    `,
    [
      createWorkspaceId('qst'),
      input.quoteId,
      input.fromStage,
      input.toStage,
      input.changedAt,
      input.changedBy || 'admin',
    ],
  )
}

const updateLinkedPreQuoteWithClient = async (
  client: PoolClient,
  preQuoteId: string | null,
  finalQuoteId: string,
  updatedAt: string,
) => {
  if (!preQuoteId) {
    return
  }

  await client.query(
    `
      UPDATE quote_workspace_pre_quotes
      SET
        final_quote_id = $2,
        status = 'convertido',
        updated_at = $3::timestamptz
      WHERE id = $1
    `,
    [preQuoteId, finalQuoteId, updatedAt],
  )
}

const getExistingQuoteConsumptionsForUpdate = async (client: PoolClient, quoteId: string) => {
  const result = await client.query<QuoteFabricConsumptionRow>(
    `
      SELECT *
      FROM quote_workspace_quote_fabric_consumptions
      WHERE quote_id = $1
      FOR UPDATE
    `,
    [quoteId],
  )

  return result.rows.map(mapQuoteFabricConsumptionRow)
}

const getSeamstressForUpdate = async (client: PoolClient, seamstressId: string) => {
  const result = await client.query<SeamstressRow>(
    'SELECT * FROM quote_workspace_seamstresses WHERE id = $1 FOR UPDATE',
    [seamstressId],
  )
  return result.rows[0] ? mapSeamstressRow(result.rows[0]) : null
}

const getInstallerForUpdate = async (client: PoolClient, installerId: string) => {
  const result = await client.query<InstallerRow>(
    'SELECT * FROM quote_workspace_installers WHERE id = $1 FOR UPDATE',
    [installerId],
  )
  return result.rows[0] ? mapInstallerRow(result.rows[0]) : null
}

const getFabricsForUpdate = async (client: PoolClient, fabricIds: string[]) => {
  if (fabricIds.length === 0) {
    return new Map<string, FabricRecord>()
  }

  const result = await client.query<FabricRow>(
    'SELECT * FROM quote_workspace_fabrics WHERE id = ANY($1::text[]) FOR UPDATE',
    [fabricIds],
  )

  return new Map(result.rows.map((row) => {
    const fabric = mapFabricRow(row)
    return [fabric.id, fabric] as const
  }))
}

const lockStockBalanceRow = async (
  client: PoolClient,
  seamstressId: string,
  fabricId: string,
): Promise<SeamstressFabricStockRecord | null> => {
  const result = await client.query<SeamstressFabricStockRow>(
    `
      SELECT *
      FROM quote_workspace_seamstress_fabric_stock
      WHERE seamstress_id = $1 AND fabric_id = $2
      FOR UPDATE
    `,
    [seamstressId, fabricId],
  )

  return result.rows[0] ? mapSeamstressFabricStockRow(result.rows[0]) : null
}

const upsertStockBalanceWithClient = async (
  client: PoolClient,
  input: {
    seamstressId: string
    fabricId: string
    balanceMeters: number
  },
) => {
  const now = new Date().toISOString()
  const result = await client.query<SeamstressFabricStockRow>(
    `
      INSERT INTO quote_workspace_seamstress_fabric_stock (
        id,
        seamstress_id,
        fabric_id,
        balance_meters,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5::timestamptz, $6::timestamptz
      )
      ON CONFLICT (seamstress_id, fabric_id) DO UPDATE
      SET
        balance_meters = EXCLUDED.balance_meters,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `,
    [
      createWorkspaceId('sfs'),
      input.seamstressId,
      input.fabricId,
      input.balanceMeters,
      now,
      now,
    ],
  )

  return mapSeamstressFabricStockRow(result.rows[0])
}

const insertStockMovementWithClient = async (
  client: PoolClient,
  movement: Omit<StockMovementRecord, 'id' | 'createdAt'>,
) => {
  const now = new Date().toISOString()
  await client.query(
    `
      INSERT INTO quote_workspace_stock_movements (
        id,
        seamstress_id,
        fabric_id,
        quote_id,
        quote_item_id,
        type,
        quantity_meters,
        notes,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz
      )
    `,
    [
      createWorkspaceId('mov'),
      movement.seamstressId,
      movement.fabricId,
      movement.quoteId,
      movement.quoteItemId,
      movement.type,
      movement.quantityMeters,
      movement.notes,
      now,
    ],
  )
}

const replaceQuoteConsumptionsWithClient = async (
  client: PoolClient,
  quoteId: string,
  consumptions: QuoteFabricConsumptionRecord[],
) => {
  await client.query('DELETE FROM quote_workspace_quote_fabric_consumptions WHERE quote_id = $1', [quoteId])

  for (const consumption of consumptions) {
    await client.query(
      `
        INSERT INTO quote_workspace_quote_fabric_consumptions (
          id,
          quote_id,
          quote_item_id,
          seamstress_id,
          fabric_id,
          quantity_meters,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz
        )
      `,
      [
        consumption.id,
        consumption.quoteId,
        consumption.quoteItemId,
        consumption.seamstressId,
        consumption.fabricId,
        consumption.quantityMeters,
        consumption.createdAt,
        consumption.updatedAt,
      ],
    )
  }
}

const insertCustomerRecord = async (customer: CustomerRecord): Promise<CustomerRecord> => {
  await ensureSchema()
  const sql = getSql()
  const [row] = await sql`
    INSERT INTO quote_workspace_customers (
      id,
      name,
      whatsapp,
      whatsapp_normalized,
      email,
      location_label,
      address,
      complement,
      neighborhood,
      city,
      state,
      zipcode,
      created_at,
      updated_at
    ) VALUES (
      ${customer.id},
      ${customer.name},
      ${customer.whatsapp},
      ${normalizePhone(customer.whatsapp)},
      ${customer.email},
      ${customer.locationLabel},
      ${customer.address},
      ${customer.complement},
      ${customer.neighborhood},
      ${customer.city},
      ${customer.state},
      ${customer.zipcode},
      ${customer.createdAt}::timestamptz,
      ${customer.updatedAt}::timestamptz
    )
    ON CONFLICT (whatsapp_normalized) DO UPDATE
    SET
      name = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE quote_workspace_customers.name END,
      whatsapp = CASE WHEN EXCLUDED.whatsapp <> '' THEN EXCLUDED.whatsapp ELSE quote_workspace_customers.whatsapp END,
      email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE quote_workspace_customers.email END,
      location_label = CASE WHEN EXCLUDED.location_label <> '' THEN EXCLUDED.location_label ELSE quote_workspace_customers.location_label END,
      address = CASE WHEN EXCLUDED.address <> '' THEN EXCLUDED.address ELSE quote_workspace_customers.address END,
      complement = CASE WHEN EXCLUDED.complement <> '' THEN EXCLUDED.complement ELSE quote_workspace_customers.complement END,
      neighborhood = CASE WHEN EXCLUDED.neighborhood <> '' THEN EXCLUDED.neighborhood ELSE quote_workspace_customers.neighborhood END,
      city = CASE WHEN EXCLUDED.city <> '' THEN EXCLUDED.city ELSE quote_workspace_customers.city END,
      state = CASE WHEN EXCLUDED.state <> '' THEN EXCLUDED.state ELSE quote_workspace_customers.state END,
      zipcode = CASE WHEN EXCLUDED.zipcode <> '' THEN EXCLUDED.zipcode ELSE quote_workspace_customers.zipcode END,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `

  return mapCustomerRow(row as CustomerRow)
}

const updateCustomerRecord = async (customer: CustomerRecord): Promise<CustomerRecord> => {
  await ensureSchema()
  const sql = getSql()
  const [row] = await sql`
    UPDATE quote_workspace_customers
    SET
      name = ${customer.name},
      whatsapp = ${customer.whatsapp},
      whatsapp_normalized = ${normalizePhone(customer.whatsapp)},
      email = ${customer.email},
      location_label = ${customer.locationLabel},
      address = ${customer.address},
      complement = ${customer.complement},
      neighborhood = ${customer.neighborhood},
      city = ${customer.city},
      state = ${customer.state},
      zipcode = ${customer.zipcode},
      updated_at = ${customer.updatedAt}::timestamptz
    WHERE id = ${customer.id}
    RETURNING *
  `

  if (!row) {
    return insertCustomerRecord(customer)
  }

  return mapCustomerRow(row as CustomerRow)
}

const upsertPreQuoteRecord = async (preQuote: PreQuoteRecord): Promise<PreQuoteRecord> => {
  await ensureSchema()
  const sql = getSql()
  const [row] = await sql`
    INSERT INTO quote_workspace_pre_quotes (
      id,
      code,
      customer_id,
      origin,
      status,
      items_json,
      measures_pending_note,
      pdf_document_id,
      created_at,
      updated_at,
      final_quote_id
    ) VALUES (
      ${preQuote.id},
      ${preQuote.code},
      ${preQuote.customerId},
      ${preQuote.origin},
      ${preQuote.status},
      ${JSON.stringify(preQuote.items)}::jsonb,
      ${preQuote.measuresPendingNote},
      ${preQuote.pdfPath || null},
      ${preQuote.createdAt}::timestamptz,
      ${preQuote.updatedAt}::timestamptz,
      ${preQuote.finalQuoteId}
    )
    ON CONFLICT (id) DO UPDATE
    SET
      code = EXCLUDED.code,
      customer_id = EXCLUDED.customer_id,
      origin = EXCLUDED.origin,
      status = EXCLUDED.status,
      items_json = EXCLUDED.items_json,
      measures_pending_note = EXCLUDED.measures_pending_note,
      pdf_document_id = EXCLUDED.pdf_document_id,
      updated_at = EXCLUDED.updated_at,
      final_quote_id = EXCLUDED.final_quote_id
    RETURNING *
  `

  return mapPreQuoteRow(row as PreQuoteRow)
}

const upsertFinalQuoteRecord = async (finalQuote: StoredFinalQuote): Promise<StoredFinalQuote> => {
  await ensureSchema()
  const sql = getSql()
  const [row] = await sql`
    INSERT INTO quote_workspace_final_quotes (
      id,
      code,
      customer_id,
      pre_quote_id,
      seamstress_id,
      installer_id,
      status,
      record_json,
      created_at,
      updated_at
    ) VALUES (
      ${finalQuote.id},
      ${finalQuote.code},
      ${finalQuote.customerId},
      ${finalQuote.preQuoteId},
      ${finalQuote.seamstressId},
      ${finalQuote.installerId},
      ${finalQuote.status},
      ${JSON.stringify(finalQuote.record)}::jsonb,
      ${finalQuote.createdAt}::timestamptz,
      ${finalQuote.updatedAt}::timestamptz
    )
    ON CONFLICT (id) DO UPDATE
    SET
      code = EXCLUDED.code,
      customer_id = EXCLUDED.customer_id,
      pre_quote_id = EXCLUDED.pre_quote_id,
      seamstress_id = EXCLUDED.seamstress_id,
      installer_id = EXCLUDED.installer_id,
      status = EXCLUDED.status,
      record_json = EXCLUDED.record_json,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `

  return mapFinalQuoteRow(row as FinalQuoteRow)
}

export const saveWorkspaceDocument = async (relativePath: string, bytes: Uint8Array) => {
  await ensureSchema()
  const sql = getSql()
  const now = new Date().toISOString()
  const [row] = await sql`
    INSERT INTO quote_workspace_documents (
      id,
      logical_path,
      filename,
      mime_type,
      content_base64,
      created_at,
      updated_at
    ) VALUES (
      ${createWorkspaceId('doc')},
      ${relativePath},
      ${basename(relativePath)},
      ${'application/pdf'},
      ${Buffer.from(bytes).toString('base64')},
      ${now}::timestamptz,
      ${now}::timestamptz
    )
    ON CONFLICT (logical_path) DO UPDATE
    SET
      filename = EXCLUDED.filename,
      mime_type = EXCLUDED.mime_type,
      content_base64 = EXCLUDED.content_base64,
      updated_at = EXCLUDED.updated_at
    RETURNING id
  `

  return (row as { id: string }).id
}

export const readWorkspaceDocument = async (documentId: string): Promise<WorkspaceDocumentPayload | null> => {
  await ensureSchema()
  const sql = getSql()
  const [row] = await sql`SELECT * FROM quote_workspace_documents WHERE id = ${documentId} LIMIT 1`

  if (!row) {
    return null
  }

  const document = row as WorkspaceDocumentRow

  return {
    bytes: Buffer.from(document.content_base64, 'base64'),
    filename: document.filename || basename(document.logical_path),
    mimeType: document.mime_type || 'application/pdf',
  }
}

export const createPublicPreQuoteEntry = async (input: {
  contact: PublicPreQuoteContact
  items: PreQuoteItemRecord[]
  pdfPath: string
}) => serializeWrite(async () => {
  const store = await readQuoteWorkspaceStore()
  const existingCustomer = store.customers.find(
    (entry) => normalizePhone(entry.whatsapp) === normalizePhone(input.contact.whatsapp),
  ) || null
  const customer = upsertCustomerFromPublic(store.customers, input.contact)
  const persistedCustomer = existingCustomer
    ? await updateCustomerRecord(customer)
    : await insertCustomerRecord(customer)
  const preQuote = createPreQuoteRecord({
    customerId: persistedCustomer.id,
    items: input.items,
    pdfPath: input.pdfPath,
  })
  const persistedPreQuote = await upsertPreQuoteRecord(preQuote)

  return {
    customer: persistedCustomer,
    preQuote: persistedPreQuote,
  }
})

export const updatePreQuoteDocumentPath = async (preQuoteId: string, pdfPath: string) =>
  serializeWrite(async () => {
    const store = await readQuoteWorkspaceStore()
    const preQuote = store.preQuotes.find((entry) => entry.id === preQuoteId)

    if (!preQuote) {
      throw new Error('Pré-orçamento não encontrado.')
    }

    preQuote.pdfPath = pdfPath
    preQuote.updatedAt = new Date().toISOString()
    return upsertPreQuoteRecord(preQuote)
  })

export const listCustomerSummaries = async (): Promise<CustomerSummary[]> => {
  const store = await readQuoteWorkspaceStore()
  return buildCustomerSummaries(store)
}

export const listPreQuotes = async (): Promise<PreQuoteListItem[]> => {
  const store = await readQuoteWorkspaceStore()
  return buildPreQuoteList(store)
}

export const findPreQuoteById = async (id: string) => {
  const store = await readQuoteWorkspaceStore()
  const preQuote = store.preQuotes.find((entry) => entry.id === id) || null
  const customer = preQuote ? store.customers.find((entry) => entry.id === preQuote.customerId) || null : null
  return { preQuote, customer }
}

export const findFinalQuoteById = async (id: string): Promise<FinalQuoteDetails | null> => {
  await ensureSchema()
  const sql = getSql()
  const [finalQuoteRow] = await sql`
    SELECT *
    FROM quote_workspace_final_quotes
    WHERE id = ${id}
    LIMIT 1
  `

  if (!finalQuoteRow) {
    return null
  }

  const finalQuote = mapFinalQuoteRow(finalQuoteRow as FinalQuoteRow)
  const [customerRows, preQuoteRows, seamstressRows, installerRows, consumptionRows, dispatchRows, saleRows, transitionRows] = await sql.transaction([
    sql`SELECT * FROM quote_workspace_customers WHERE id = ${finalQuote.customerId} LIMIT 1`,
    finalQuote.preQuoteId
      ? sql`SELECT * FROM quote_workspace_pre_quotes WHERE id = ${finalQuote.preQuoteId} LIMIT 1`
      : sql`SELECT * FROM quote_workspace_pre_quotes WHERE FALSE`,
    finalQuote.seamstressId
      ? sql`SELECT * FROM quote_workspace_seamstresses WHERE id = ${finalQuote.seamstressId} LIMIT 1`
      : sql`SELECT * FROM quote_workspace_seamstresses WHERE FALSE`,
    finalQuote.installerId
      ? sql`SELECT * FROM quote_workspace_installers WHERE id = ${finalQuote.installerId} LIMIT 1`
      : sql`SELECT * FROM quote_workspace_installers WHERE FALSE`,
    sql`SELECT * FROM quote_workspace_quote_fabric_consumptions WHERE quote_id = ${finalQuote.id} ORDER BY created_at ASC`,
    sql`SELECT * FROM quote_workspace_installer_dispatches WHERE quote_id = ${finalQuote.id} ORDER BY created_at DESC`,
    sql`SELECT * FROM quote_workspace_sales WHERE quote_id = ${finalQuote.id} LIMIT 1`,
    sql`SELECT * FROM quote_workspace_quote_stage_transitions WHERE quote_id = ${finalQuote.id} ORDER BY changed_at DESC`,
  ], {
    readOnly: true,
  })
  const fabricConsumptions = (consumptionRows as QuoteFabricConsumptionRow[]).map(mapQuoteFabricConsumptionRow)

  return {
    ...finalQuote,
    record: hydrateQuoteRecordWithFabricConsumptions(finalQuote.record, fabricConsumptions),
    customer: customerRows[0] ? mapCustomerRow(customerRows[0] as CustomerRow) : null,
    preQuote: preQuoteRows[0] ? mapPreQuoteRow(preQuoteRows[0] as PreQuoteRow) : null,
    seamstress: seamstressRows[0] ? mapSeamstressRow(seamstressRows[0] as SeamstressRow) : null,
    installer: installerRows[0] ? mapInstallerRow(installerRows[0] as InstallerRow) : null,
    sale: saleRows[0] ? mapSaleRow(saleRows[0] as SaleRow) : null,
    stageTransitions: (transitionRows as QuoteStageTransitionRow[]).map(mapQuoteStageTransitionRow),
    fabricConsumptions,
    installerDispatches: (dispatchRows as InstallerDispatchRow[]).map(mapInstallerDispatchRow),
  }
}

export const convertPreQuoteToFinalQuote = async (preQuoteId: string): Promise<StoredFinalQuote> =>
  serializeWrite(async () => {
    const store = await readQuoteWorkspaceStore()
    const preQuote = store.preQuotes.find((entry) => entry.id === preQuoteId)

    if (!preQuote) {
      throw new Error('Pré-orçamento não encontrado.')
    }

    if (preQuote.finalQuoteId) {
      const existing = store.finalQuotes.find((entry) => entry.id === preQuote.finalQuoteId)
      if (existing) {
        return existing
      }
    }

    const customer = store.customers.find((entry) => entry.id === preQuote.customerId)

    if (!customer) {
      throw new Error('Cliente vinculado ao pré-orçamento não encontrado.')
    }

    const record = createAdminQuoteFromPreQuote(customer, preQuote)
    const finalQuote = createFinalQuoteRecord({
      customerId: customer.id,
      preQuoteId: preQuote.id,
      record,
    })

    const persistedFinalQuote = await upsertFinalQuoteRecord(finalQuote)
    preQuote.status = 'convertido'
    preQuote.finalQuoteId = persistedFinalQuote.id
    preQuote.updatedAt = new Date().toISOString()
    await upsertPreQuoteRecord(preQuote)

    return persistedFinalQuote
  })

export const saveFinalQuoteRecord = async (input: {
  id?: string | null
  customerId?: string | null
  preQuoteId?: string | null
  seamstressId?: string | null
  installerId?: string | null
  status?: StoredFinalQuote['status']
  record: AdminQuoteRecord
}): Promise<StoredFinalQuote> => serializeWrite(async () =>
  withTransaction(async (client) => {
    input.record.project.code = normalizeFinalQuoteCode(input.record.project.code)
    const hasAnyConsumptionInputs = input.record.items.some((item) => (item.fabricConsumptions || []).length > 0)

    for (const item of input.record.items) {
      for (const consumption of item.fabricConsumptions || []) {
        const quantityMeters = normalizeMeters(consumption.quantityMeters)

        if (consumption.fabricId && (!quantityMeters || quantityMeters <= 0)) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Toda baixa de tecido precisa ter metragem maior que zero.',
          })
        }

        if (!consumption.fabricId && quantityMeters && quantityMeters > 0) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Selecione o tecido correspondente para cada consumo informado.',
          })
        }
      }
    }

    if (hasAnyConsumptionInputs && !input.seamstressId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Selecione a costureira antes de salvar consumos de tecido.',
      })
    }

    const now = new Date().toISOString()
    const persistedCustomer = await getCustomerForQuoteWithClient(client, input.record, input.customerId)
    const existing = input.id ? await fetchFinalQuoteWithClient(client, input.id) : null
    const existingSale = existing ? await fetchSaleByQuoteIdWithClient(client, existing.id) : null
    const selectedSeamstress = input.seamstressId ? await getSeamstressForUpdate(client, input.seamstressId) : null
    const selectedInstaller = input.installerId ? await getInstallerForUpdate(client, input.installerId) : null

    if (input.seamstressId && !selectedSeamstress) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Costureira selecionada não encontrada.',
      })
    }

    if (input.installerId && !selectedInstaller) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Instalador selecionado não encontrado.',
      })
    }

    if (selectedSeamstress) {
      input.record.seamstress.name = selectedSeamstress.name
      input.record.seamstress.email = selectedSeamstress.email
      input.record.seamstress.whatsapp = selectedSeamstress.whatsapp
    }

    if (selectedInstaller) {
      input.record.installer.name = selectedInstaller.name
      input.record.installer.email = selectedInstaller.email
      input.record.installer.whatsapp = selectedInstaller.whatsapp
    }

    const persistedStatus = input.status ?? existing?.status ?? 'rascunho'

    if (existingSale && persistedStatus !== 'pronto') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Este orçamento já virou venda. O status comercial deve ser alterado pela aba de vendas.',
      })
    }

    input.record.project.code = await resolveAvailableFinalQuoteCodeWithClient(
      client,
      input.record.project.code,
      existing?.id,
      persistedStatus === 'rascunho',
    )
    const installableItems = input.record.items.filter((item) => item.installationIncluded === 'SIM')

    if (persistedStatus !== 'rascunho' && installableItems.length > 0) {
      if (!input.installerId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Selecione o instalador antes de marcar o orçamento como pronto.',
        })
      }

      if (!input.record.project.installationDate) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Defina a data de instalação ou entrega para os itens instaláveis.',
        })
      }

      for (const item of installableItems) {
        const installationMeters = resolveInstallationMeters(item)

        if (!installationMeters || installationMeters <= 0) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Todo item com instalação precisa ter metragem válida ou largura maior que zero.',
          })
        }
      }
    }

    const desiredConsumptions = persistedStatus === 'cancelado'
      ? []
      : collectRequestedQuoteFabricConsumptions(input.record, input.seamstressId)
    const existingConsumptions = existing ? await getExistingQuoteConsumptionsForUpdate(client, existing.id) : []
    const desiredFabricIds = [...new Set(desiredConsumptions.map((entry) => entry.fabricId))]
    const existingFabricIds = [...new Set(existingConsumptions.map((entry) => entry.fabricId))]
    const fabrics = await getFabricsForUpdate(client, [...new Set([...desiredFabricIds, ...existingFabricIds])])

    for (const consumption of desiredConsumptions) {
      if (!fabrics.has(consumption.fabricId)) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Um dos tecidos selecionados não foi encontrado.',
        })
      }
    }

    syncMaterialPricesFromFabricCatalog(input.record, fabrics)

    const previousByKey = new Map(
      existingConsumptions.map((entry) => [buildQuoteFabricConsumptionKey(entry), entry] as const),
    )
    const nextByKey = new Map(
      desiredConsumptions.map((entry) => [buildQuoteFabricConsumptionKey(entry), entry] as const),
    )
    const stockDeltas = new Map<string, { seamstressId: string; fabricId: string; delta: number }>()
    const movementInputs: Omit<StockMovementRecord, 'id' | 'createdAt'>[] = []

    const applyStockDelta = (seamstressId: string, fabricId: string, delta: number) => {
      const key = `${seamstressId}::${fabricId}`
      const current = stockDeltas.get(key)

      if (current) {
        current.delta = Math.round((current.delta + delta) * 1000) / 1000
        return
      }

      stockDeltas.set(key, {
        seamstressId,
        fabricId,
        delta: Math.round(delta * 1000) / 1000,
      })
    }

    const buildMovementNote = (quoteItemId: string, fabricId: string) => {
      const item = input.record.items.find((entry) => entry.id === quoteItemId)
      const fabric = fabrics.get(fabricId)
      return [
        input.record.project.code,
        item?.room || item?.openingLabel || quoteItemId,
        fabric?.name || fabricId,
      ].filter(Boolean).join(' | ')
    }

    for (const [key, previous] of previousByKey.entries()) {
      const next = nextByKey.get(key)

      if (!next) {
        applyStockDelta(previous.seamstressId, previous.fabricId, previous.quantityMeters)
        movementInputs.push({
          seamstressId: previous.seamstressId,
          fabricId: previous.fabricId,
          quoteId: existing?.id || null,
          quoteItemId: previous.quoteItemId,
          type: 'estorno_orcamento',
          quantityMeters: previous.quantityMeters,
          notes: `Estorno: ${buildMovementNote(previous.quoteItemId, previous.fabricId)}`,
        })
        continue
      }

      const delta = Math.round((next.quantityMeters - previous.quantityMeters) * 1000) / 1000

      if (delta > 0) {
        applyStockDelta(next.seamstressId, next.fabricId, -delta)
        movementInputs.push({
          seamstressId: next.seamstressId,
          fabricId: next.fabricId,
          quoteId: existing?.id || null,
          quoteItemId: next.quoteItemId,
          type: 'consumo_orcamento',
          quantityMeters: delta,
          notes: `Consumo adicional: ${buildMovementNote(next.quoteItemId, next.fabricId)}`,
        })
      }
      else if (delta < 0) {
        applyStockDelta(previous.seamstressId, previous.fabricId, Math.abs(delta))
        movementInputs.push({
          seamstressId: previous.seamstressId,
          fabricId: previous.fabricId,
          quoteId: existing?.id || null,
          quoteItemId: previous.quoteItemId,
          type: 'estorno_orcamento',
          quantityMeters: Math.abs(delta),
          notes: `Estorno parcial: ${buildMovementNote(previous.quoteItemId, previous.fabricId)}`,
        })
      }

      nextByKey.delete(key)
    }

    for (const next of nextByKey.values()) {
      applyStockDelta(next.seamstressId, next.fabricId, -next.quantityMeters)
      movementInputs.push({
        seamstressId: next.seamstressId,
        fabricId: next.fabricId,
        quoteId: existing?.id || null,
        quoteItemId: next.quoteItemId,
        type: 'consumo_orcamento',
        quantityMeters: next.quantityMeters,
        notes: `Consumo inicial: ${buildMovementNote(next.quoteItemId, next.fabricId)}`,
      })
    }

    for (const adjustment of stockDeltas.values()) {
      if (adjustment.delta === 0) {
        continue
      }

      const lockedStock = await lockStockBalanceRow(client, adjustment.seamstressId, adjustment.fabricId)
      const currentBalance = lockedStock?.balanceMeters || 0
      const nextBalance = Math.round((currentBalance + adjustment.delta) * 1000) / 1000

      if (nextBalance < 0) {
        const seamstress = adjustment.seamstressId === selectedSeamstress?.id
          ? selectedSeamstress
          : await getSeamstressForUpdate(client, adjustment.seamstressId)
        const fabric = fabrics.get(adjustment.fabricId)

        throw createError({
          statusCode: 409,
          statusMessage: `Saldo insuficiente para ${fabric?.name || 'tecido'} com ${seamstress?.name || 'a costureira selecionada'}.`,
        })
      }

      await upsertStockBalanceWithClient(client, {
        seamstressId: adjustment.seamstressId,
        fabricId: adjustment.fabricId,
        balanceMeters: nextBalance,
      })
    }

    let persistedQuote: StoredFinalQuote

    try {
      persistedQuote = existing
        ? await upsertFinalQuoteRecordWithClient(client, {
            ...existing,
            customerId: persistedCustomer.id,
            preQuoteId: input.preQuoteId ?? existing.preQuoteId,
            seamstressId: input.seamstressId ?? existing.seamstressId ?? null,
            installerId: input.installerId ?? existing.installerId ?? null,
            code: input.record.project.code,
            status: persistedStatus,
            record: input.record,
            updatedAt: now,
          })
        : await upsertFinalQuoteRecordWithClient(
            client,
            {
              ...createFinalQuoteRecord({
                customerId: persistedCustomer.id,
                preQuoteId: input.preQuoteId ?? null,
                seamstressId: input.seamstressId ?? null,
                installerId: input.installerId ?? null,
                record: input.record,
              }),
              status: persistedStatus,
              updatedAt: now,
            },
          )
    }
    catch (error) {
      if (isUniqueConstraintError(error, 'quote_workspace_final_quotes_code_key')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Ja existe um orcamento com este codigo. Ajuste o codigo do projeto e tente novamente.',
        })
      }

      throw error
    }

    if (!existing || existing.status !== persistedStatus) {
      await insertQuoteStageTransitionWithClient(client, {
        quoteId: persistedQuote.id,
        fromStage: existing?.status || '',
        toStage: persistedStatus,
        changedAt: now,
      })
    }

    const persistedConsumptions: QuoteFabricConsumptionRecord[] = desiredConsumptions.map((entry) => {
      const previous = previousByKey.get(buildQuoteFabricConsumptionKey(entry))

      return {
        id: previous?.id || createWorkspaceId('qfc'),
        quoteId: persistedQuote.id,
        quoteItemId: entry.quoteItemId,
        seamstressId: entry.seamstressId,
        fabricId: entry.fabricId,
        quantityMeters: entry.quantityMeters,
        createdAt: previous?.createdAt || now,
        updatedAt: now,
      }
    })

    await replaceQuoteConsumptionsWithClient(client, persistedQuote.id, persistedConsumptions)

    for (const movement of movementInputs) {
      await insertStockMovementWithClient(client, {
        ...movement,
        quoteId: persistedQuote.id,
      })
    }

    await updateLinkedPreQuoteWithClient(client, persistedQuote.preQuoteId, persistedQuote.id, now)

    return persistedQuote
  }),
)

export const listSales = async (filters?: {
  customerId?: string
  search?: string
  status?: SaleRecord['status'] | 'all'
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
  seamstressId?: string
  installerId?: string
  productType?: SaleListItem['productTypes'][number]
  sortBy?: 'customer' | 'date' | 'value' | 'status'
}): Promise<SaleListItem[]> => {
  const store = await readQuoteWorkspaceStore()
  const search = filters?.search?.trim().toLowerCase() || ''
  const dateToBoundary = filters?.dateTo ? `${filters.dateTo}T23:59:59.999Z` : ''

  const sales = store.sales
    .map((sale) => mapSaleListItemFromStore(store, sale))
    .filter((sale) => {
      if (filters?.customerId && sale.customerId !== filters.customerId) {
        return false
      }

      if (filters?.status && filters.status !== 'all' && sale.status !== filters.status) {
        return false
      }

      if (filters?.seamstressId && sale.seamstressId !== filters.seamstressId) {
        return false
      }

      if (filters?.installerId && sale.installerId !== filters.installerId) {
        return false
      }

      if (filters?.dateFrom && sale.soldAt < filters.dateFrom) {
        return false
      }

      if (dateToBoundary && sale.soldAt > dateToBoundary) {
        return false
      }

      if (filters?.paymentMethod && filters.paymentMethod !== 'all' && sale.paymentMethod !== filters.paymentMethod) {
        return false
      }

      if (filters?.productType && !sale.productTypes.includes(filters.productType)) {
        return false
      }

      if (!search) {
        return true
      }

      return [
        sale.customer.name,
        sale.customer.whatsapp,
        sale.customer.email,
        sale.code,
        sale.paymentMethod,
        sale.seamstressName,
        sale.installerName,
        sale.productLabel,
      ].join(' ').toLowerCase().includes(search)
    })

  if (filters?.sortBy === 'customer') {
    sales.sort((left, right) => left.customer.name.localeCompare(right.customer.name, 'pt-BR'))
  }
  else if (filters?.sortBy === 'value') {
    sales.sort((left, right) => right.totalValue - left.totalValue)
  }
  else if (filters?.sortBy === 'status') {
    sales.sort((left, right) => left.status.localeCompare(right.status, 'pt-BR'))
  }
  else {
    sales.sort((left, right) => right.soldAt.localeCompare(left.soldAt))
  }

  return sales
}

export const findSaleById = async (id: string) => {
  await ensureSchema()
  const sql = getSql()
  const [saleRow] = await sql`
    SELECT *
    FROM quote_workspace_sales
    WHERE id = ${id}
    LIMIT 1
  `

  if (!saleRow) {
    return null
  }

  const sale = mapSaleRow(saleRow as SaleRow)
  const [quoteDetails, store] = await Promise.all([
    findFinalQuoteById(sale.quoteId),
    readQuoteWorkspaceStore(),
  ])
  const saleListItem = mapSaleListItemFromStore(store, sale)
  const fallbackCustomer = store.customers.find((entry) => entry.id === sale.customerId) || {
    id: sale.customerId,
    name: sale.recordSnapshot.customer.name || 'Cliente não encontrado',
    whatsapp: sale.recordSnapshot.customer.phone || '',
    email: sale.recordSnapshot.customer.email || '',
    locationLabel: sale.recordSnapshot.customer.city || '',
    address: sale.recordSnapshot.customer.address || '',
    complement: sale.recordSnapshot.customer.complement || '',
    neighborhood: sale.recordSnapshot.customer.neighborhood || '',
    city: sale.recordSnapshot.customer.city || '',
    state: sale.recordSnapshot.customer.state || '',
    zipcode: sale.recordSnapshot.customer.zipcode || '',
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  }
  const fallbackPreQuote = sale.preQuoteId ? store.preQuotes.find((entry) => entry.id === sale.preQuoteId) || null : null
  const fallbackSeamstress = sale.seamstressId ? store.seamstresses.find((entry) => entry.id === sale.seamstressId) || null : null
  const fallbackInstaller = sale.installerId ? store.installers.find((entry) => entry.id === sale.installerId) || null : null

  if (!quoteDetails) {
    const fallbackQuote: FinalQuoteDetails = {
      id: sale.quoteId,
      code: sale.recordSnapshot.project.code || sale.quoteId,
      customerId: sale.customerId,
      preQuoteId: sale.preQuoteId,
      seamstressId: sale.seamstressId,
      installerId: sale.installerId,
      status: 'pronto',
      record: normalizeAdminQuoteRecord(sale.recordSnapshot),
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
      customer: fallbackCustomer,
      preQuote: fallbackPreQuote,
      seamstress: fallbackSeamstress,
      installer: fallbackInstaller,
      sale,
      stageTransitions: store.quoteStageTransitions.filter((entry) => entry.quoteId === sale.quoteId),
      fabricConsumptions: [],
      installerDispatches: store.installerDispatches.filter((entry) => entry.quoteId === sale.quoteId),
    }

    return {
      sale: saleListItem,
      quote: fallbackQuote,
      customer: fallbackQuote.customer,
      preQuote: fallbackQuote.preQuote,
      seamstress: fallbackQuote.seamstress,
      installer: fallbackQuote.installer,
      stageTransitions: fallbackQuote.stageTransitions,
    }
  }

  return {
    sale: saleListItem,
    quote: quoteDetails,
    customer: quoteDetails.customer,
    preQuote: quoteDetails.preQuote,
    seamstress: quoteDetails.seamstress,
    installer: quoteDetails.installer,
    stageTransitions: quoteDetails.stageTransitions,
  }
}

export const transitionSaleStatus = async (input: {
  quoteId: string
  status: SaleRecord['status']
  changedBy?: string
}): Promise<SaleRecord> => serializeWrite(async () =>
  withTransaction(async (client) => {
    const quote = await fetchFinalQuoteWithClient(client, input.quoteId)

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Orçamento final não encontrado.',
      })
    }

    const existingSale = await fetchSaleByQuoteIdWithClient(client, input.quoteId)
    const now = new Date().toISOString()

    if (input.status === 'vendido') {
      if (quote.status !== 'pronto') {
        throw createError({
          statusCode: 409,
          statusMessage: 'A venda só pode ser criada a partir de um orçamento concluído.',
        })
      }

      if (existingSale) {
        return existingSale
      }

      const createdSale = createSaleRecordFromFinalQuote({
        quote,
        soldAt: now,
      })
      const persistedSale = await upsertSaleWithClient(client, createdSale)
      await insertQuoteStageTransitionWithClient(client, {
        quoteId: quote.id,
        fromStage: quote.status,
        toStage: 'vendido',
        changedAt: now,
        changedBy: input.changedBy,
      })
      return persistedSale
    }

    if (!existingSale) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Venda não encontrada para este orçamento.',
      })
    }

    if (existingSale.status === 'pago') {
      return existingSale
    }

    if (existingSale.status !== 'vendido') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Apenas vendas marcadas como vendidas podem ser alteradas para pago.',
      })
    }

    const paidSale = await upsertSaleWithClient(client, {
      ...existingSale,
      status: 'pago',
      paidAt: existingSale.paidAt || now,
      updatedAt: now,
    })

    await insertQuoteStageTransitionWithClient(client, {
      quoteId: quote.id,
      fromStage: 'vendido',
      toStage: 'pago',
      changedAt: now,
      changedBy: input.changedBy,
    })

    return paidSale
  }),
)

export const fetchSalesDashboard = async (input: {
  range: SalesDashboardRange
  customerId?: string
  search?: string
  status?: SaleRecord['status'] | 'all'
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
  seamstressId?: string
  installerId?: string
  productType?: SaleListItem['productTypes'][number]
}): Promise<SalesDashboardMetrics> => {
  const [sales, store] = await Promise.all([
    listSales(input),
    readQuoteWorkspaceStore(),
  ])
  const quoteIds = new Set(sales.map((sale) => sale.quoteId))

  return buildSalesDashboardMetrics({
    sales,
    transitions: store.quoteStageTransitions.filter((transition) => quoteIds.has(transition.quoteId)),
    range: input.range,
  })
}

export const updatePreQuoteStatus = async (id: string, status: PreQuoteStatus) =>
  serializeWrite(async () => {
    const store = await readQuoteWorkspaceStore()
    const preQuote = store.preQuotes.find((entry) => entry.id === id)

    if (!preQuote) {
      throw new Error('Pré-orçamento não encontrado.')
    }

    preQuote.status = status
    preQuote.updatedAt = new Date().toISOString()
    return upsertPreQuoteRecord(preQuote)
  })

export const listSeamstresses = async (status?: SeamstressStatus | 'all'): Promise<SeamstressRecord[]> => {
  await ensureSchema()
  const sql = getSql()
  const rows = status && status !== 'all'
    ? await sql`
        SELECT *
        FROM quote_workspace_seamstresses
        WHERE status = ${status}
        ORDER BY name ASC
      `
    : await sql`
        SELECT *
        FROM quote_workspace_seamstresses
        ORDER BY name ASC
      `

  return (rows as SeamstressRow[]).map(mapSeamstressRow)
}

export const saveSeamstressRecord = async (input: {
  id?: string | null
  name: string
  email?: string
  whatsapp?: string
  notes?: string
  status: SeamstressStatus
}): Promise<SeamstressRecord> => {
  await ensureSchema()
  const sql = getSql()
  const now = new Date().toISOString()
  const [row] = await sql`
    INSERT INTO quote_workspace_seamstresses (
      id,
      name,
      email,
      whatsapp,
      notes,
      status,
      created_at,
      updated_at
    ) VALUES (
      ${input.id || createWorkspaceId('sem')},
      ${input.name.trim()},
      ${input.email?.trim() || ''},
      ${input.whatsapp?.trim() || ''},
      ${input.notes?.trim() || ''},
      ${input.status},
      ${now}::timestamptz,
      ${now}::timestamptz
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      whatsapp = EXCLUDED.whatsapp,
      notes = EXCLUDED.notes,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `

  return mapSeamstressRow(row as SeamstressRow)
}

export const listInstallers = async (status?: InstallerStatus | 'all'): Promise<InstallerRecord[]> => {
  await ensureSchema()
  const sql = getSql()
  const rows = status && status !== 'all'
    ? await sql`
        SELECT *
        FROM quote_workspace_installers
        WHERE status = ${status}
        ORDER BY name ASC
      `
    : await sql`
        SELECT *
        FROM quote_workspace_installers
        ORDER BY name ASC
      `

  return (rows as InstallerRow[]).map(mapInstallerRow)
}

export const findInstallerById = async (id: string): Promise<InstallerRecord | null> => {
  await ensureSchema()
  const sql = getSql()
  const [row] = await sql`
    SELECT *
    FROM quote_workspace_installers
    WHERE id = ${id}
    LIMIT 1
  `

  return row ? mapInstallerRow(row as InstallerRow) : null
}

export const saveInstaller = async (input: {
  id?: string | null
  name: string
  email?: string
  whatsapp?: string
  notes?: string
  status: InstallerStatus
}): Promise<InstallerRecord> => {
  await ensureSchema()
  const sql = getSql()
  const now = new Date().toISOString()
  const [row] = await sql`
    INSERT INTO quote_workspace_installers (
      id,
      name,
      email,
      whatsapp,
      notes,
      status,
      created_at,
      updated_at
    ) VALUES (
      ${input.id || createWorkspaceId('ins')},
      ${input.name.trim()},
      ${input.email?.trim() || ''},
      ${input.whatsapp?.trim() || ''},
      ${input.notes?.trim() || ''},
      ${input.status},
      ${now}::timestamptz,
      ${now}::timestamptz
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      whatsapp = EXCLUDED.whatsapp,
      notes = EXCLUDED.notes,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `

  return mapInstallerRow(row as InstallerRow)
}

export const listInstallerDispatches = async (filters?: {
  installerId?: string
  quoteId?: string
  channel?: InstallerDispatchChannel
  dateFrom?: string
  dateTo?: string
}): Promise<InstallerDispatchRecord[]> =>
  withClient(async (client) => {
    const conditions: string[] = []
    const values: unknown[] = []

    if (filters?.installerId) {
      values.push(filters.installerId)
      conditions.push(`installer_id = $${values.length}`)
    }

    if (filters?.quoteId) {
      values.push(filters.quoteId)
      conditions.push(`quote_id = $${values.length}`)
    }

    if (filters?.channel) {
      values.push(filters.channel)
      conditions.push(`channel = $${values.length}`)
    }

    if (filters?.dateFrom) {
      values.push(`${filters.dateFrom}T00:00:00.000Z`)
      conditions.push(`created_at >= $${values.length}::timestamptz`)
    }

    if (filters?.dateTo) {
      values.push(`${filters.dateTo}T23:59:59.999Z`)
      conditions.push(`created_at <= $${values.length}::timestamptz`)
    }

    const query = `
      SELECT *
      FROM quote_workspace_installer_dispatches
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY created_at DESC
    `

    const result = await client.query<InstallerDispatchRow>(query, values)
    return result.rows.map(mapInstallerDispatchRow)
  })

export const createInstallerDispatch = async (input: Omit<InstallerDispatchRecord, 'id' | 'createdAt'>): Promise<InstallerDispatchRecord> =>
  withTransaction(async (client) => {
    const installer = await getInstallerForUpdate(client, input.installerId)

    if (!installer) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Instalador selecionado não encontrado.',
      })
    }

    const quote = await fetchFinalQuoteWithClient(client, input.quoteId)

    if (!quote) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Orçamento vinculado ao envio não foi encontrado.',
      })
    }

    const now = new Date().toISOString()
    const result = await client.query<InstallerDispatchRow>(
      `
        INSERT INTO quote_workspace_installer_dispatches (
          id,
          quote_id,
          installer_id,
          document_kind,
          channel,
          recipient_email,
          recipient_whatsapp,
          status,
          error_message,
          sent_at,
          created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, $11::timestamptz
        )
        RETURNING *
      `,
      [
        createWorkspaceId('ind'),
        input.quoteId,
        input.installerId,
        input.documentKind,
        input.channel,
        input.recipientEmail,
        input.recipientWhatsapp,
        input.status,
        input.errorMessage,
        input.sentAt,
        now,
      ],
    )

    return mapInstallerDispatchRow(result.rows[0])
  })

export const listFabrics = async (status?: FabricStatus | 'all'): Promise<FabricRecord[]> => {
  await ensureSchema()
  const sql = getSql()
  const rows = status && status !== 'all'
    ? await sql`
        SELECT *
        FROM quote_workspace_fabrics
        WHERE status = ${status}
        ORDER BY name ASC, color_or_collection ASC
      `
    : await sql`
        SELECT *
        FROM quote_workspace_fabrics
        ORDER BY name ASC, color_or_collection ASC
      `

  return (rows as FabricRow[]).map(mapFabricRow)
}

export const saveFabricRecord = async (input: {
  id?: string | null
  name: string
  category: string
  colorOrCollection?: string
  pricePerMeter?: number
  status: FabricStatus
}): Promise<FabricRecord> => {
  await ensureSchema()
  const sql = getSql()
  const now = new Date().toISOString()
  const pricePerMeter = Math.max(0, Math.round((input.pricePerMeter || 0) * 100) / 100)
  const [row] = await sql`
    INSERT INTO quote_workspace_fabrics (
      id,
      name,
      category,
      color_or_collection,
      price_per_meter,
      unit,
      status,
      created_at,
      updated_at
    ) VALUES (
      ${input.id || createWorkspaceId('fab')},
      ${input.name.trim()},
      ${input.category.trim()},
      ${input.colorOrCollection?.trim() || ''},
      ${pricePerMeter},
      ${'metro'},
      ${input.status},
      ${now}::timestamptz,
      ${now}::timestamptz
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      category = EXCLUDED.category,
      color_or_collection = EXCLUDED.color_or_collection,
      price_per_meter = EXCLUDED.price_per_meter,
      status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at
    RETURNING *
  `

  return mapFabricRow(row as FabricRow)
}

export const listSeamstressStockBalances = async (filters?: {
  seamstressId?: string
  fabricId?: string
  search?: string
}): Promise<SeamstressStockBalanceView[]> =>
  withClient(async (client) => {
    const conditions: string[] = []
    const values: unknown[] = []

    if (filters?.seamstressId) {
      values.push(filters.seamstressId)
      conditions.push(`stock.seamstress_id = $${values.length}`)
    }

    if (filters?.fabricId) {
      values.push(filters.fabricId)
      conditions.push(`stock.fabric_id = $${values.length}`)
    }

    if (filters?.search?.trim()) {
      values.push(`%${filters.search.trim().toLowerCase()}%`)
      conditions.push(`(
        LOWER(seamstress.name) LIKE $${values.length}
        OR LOWER(fabric.name) LIKE $${values.length}
        OR LOWER(fabric.category) LIKE $${values.length}
        OR LOWER(fabric.color_or_collection) LIKE $${values.length}
      )`)
    }

    const result = await client.query<StockBalanceRow>(
      `
        SELECT
          stock.*,
          seamstress.name AS seamstress_name,
          seamstress.status AS seamstress_status,
          fabric.name AS fabric_name,
          fabric.category AS fabric_category,
          fabric.color_or_collection AS fabric_color_or_collection,
          fabric.unit AS fabric_unit,
          fabric.status AS fabric_status
        FROM quote_workspace_seamstress_fabric_stock stock
        JOIN quote_workspace_seamstresses seamstress ON seamstress.id = stock.seamstress_id
        JOIN quote_workspace_fabrics fabric ON fabric.id = stock.fabric_id
        ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY seamstress.name ASC, fabric.name ASC, fabric.color_or_collection ASC
      `,
      values,
    )

    return result.rows.map(mapStockBalanceRow)
  })

export const applyManualStockMovement = async (input: {
  seamstressId: string
  fabricId: string
  quantityMeters: number
  mode: 'entrada_manual' | 'ajuste_manual'
  notes?: string
  allowNegative?: boolean
}): Promise<SeamstressFabricStockRecord> =>
  serializeWrite(async () =>
    withTransaction(async (client) => {
      const quantityMeters = normalizeMeters(input.quantityMeters)

      if (!quantityMeters || quantityMeters === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Informe uma metragem diferente de zero para movimentar o estoque.',
        })
      }

      const seamstress = await getSeamstressForUpdate(client, input.seamstressId)
      const fabrics = await getFabricsForUpdate(client, [input.fabricId])
      const fabric = fabrics.get(input.fabricId)

      if (!seamstress || !fabric) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Costureira ou tecido não encontrado para a movimentação manual.',
        })
      }

      const stock = await lockStockBalanceRow(client, input.seamstressId, input.fabricId)
      const currentBalance = stock?.balanceMeters || 0
      const signedDelta = input.mode === 'entrada_manual' ? Math.abs(quantityMeters) : quantityMeters
      const nextBalance = Math.round((currentBalance + signedDelta) * 1000) / 1000

      if (nextBalance < 0 && !input.allowNegative) {
        throw createError({
          statusCode: 409,
          statusMessage: `O ajuste deixaria saldo negativo para ${fabric.name} com ${seamstress.name}.`,
        })
      }

      const updatedStock = await upsertStockBalanceWithClient(client, {
        seamstressId: input.seamstressId,
        fabricId: input.fabricId,
        balanceMeters: nextBalance,
      })

      await insertStockMovementWithClient(client, {
        seamstressId: input.seamstressId,
        fabricId: input.fabricId,
        quoteId: null,
        quoteItemId: null,
        type: input.mode === 'entrada_manual'
          ? 'entrada_manual'
          : signedDelta >= 0
            ? 'ajuste_manual_entrada'
            : 'ajuste_manual_saida',
        quantityMeters: Math.abs(signedDelta),
        notes: input.notes?.trim() || '',
      })

      return updatedStock
    }),
  )

export const transferStockBetweenSeamstresses = async (input: {
  fromSeamstressId: string
  toSeamstressId: string
  fabricId: string
  quantityMeters: number
  notes?: string
}): Promise<{ from: SeamstressFabricStockRecord; to: SeamstressFabricStockRecord }> =>
  serializeWrite(async () =>
    withTransaction(async (client) => {
      const quantityMeters = normalizeMeters(input.quantityMeters)

      if (!quantityMeters || quantityMeters <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'A transferência precisa ter metragem positiva.',
        })
      }

      if (input.fromSeamstressId === input.toSeamstressId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Escolha costureiras diferentes para a transferência.',
        })
      }

      const fromSeamstress = await getSeamstressForUpdate(client, input.fromSeamstressId)
      const toSeamstress = await getSeamstressForUpdate(client, input.toSeamstressId)
      const fabrics = await getFabricsForUpdate(client, [input.fabricId])
      const fabric = fabrics.get(input.fabricId)

      if (!fromSeamstress || !toSeamstress || !fabric) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Não foi possível localizar todos os registros da transferência.',
        })
      }

      const fromStock = await lockStockBalanceRow(client, input.fromSeamstressId, input.fabricId)
      const toStock = await lockStockBalanceRow(client, input.toSeamstressId, input.fabricId)
      const nextFromBalance = Math.round(((fromStock?.balanceMeters || 0) - quantityMeters) * 1000) / 1000

      if (nextFromBalance < 0) {
        throw createError({
          statusCode: 409,
          statusMessage: `Saldo insuficiente para transferir ${fabric.name} de ${fromSeamstress.name}.`,
        })
      }

      const updatedFrom = await upsertStockBalanceWithClient(client, {
        seamstressId: input.fromSeamstressId,
        fabricId: input.fabricId,
        balanceMeters: nextFromBalance,
      })
      const updatedTo = await upsertStockBalanceWithClient(client, {
        seamstressId: input.toSeamstressId,
        fabricId: input.fabricId,
        balanceMeters: Math.round(((toStock?.balanceMeters || 0) + quantityMeters) * 1000) / 1000,
      })
      const notes = input.notes?.trim() || `${fromSeamstress.name} -> ${toSeamstress.name}`

      await insertStockMovementWithClient(client, {
        seamstressId: input.fromSeamstressId,
        fabricId: input.fabricId,
        quoteId: null,
        quoteItemId: null,
        type: 'transferencia_saida',
        quantityMeters,
        notes,
      })
      await insertStockMovementWithClient(client, {
        seamstressId: input.toSeamstressId,
        fabricId: input.fabricId,
        quoteId: null,
        quoteItemId: null,
        type: 'transferencia_entrada',
        quantityMeters,
        notes,
      })

      return { from: updatedFrom, to: updatedTo }
    }),
  )

export const listStockMovements = async (filters?: {
  seamstressId?: string
  fabricId?: string
  quoteId?: string
  dateFrom?: string
  dateTo?: string
}): Promise<StockMovementListItem[]> =>
  withClient(async (client) => {
    const conditions: string[] = []
    const values: unknown[] = []

    if (filters?.seamstressId) {
      values.push(filters.seamstressId)
      conditions.push(`movement.seamstress_id = $${values.length}`)
    }

    if (filters?.fabricId) {
      values.push(filters.fabricId)
      conditions.push(`movement.fabric_id = $${values.length}`)
    }

    if (filters?.quoteId) {
      values.push(filters.quoteId)
      conditions.push(`movement.quote_id = $${values.length}`)
    }

    if (filters?.dateFrom) {
      values.push(filters.dateFrom)
      conditions.push(`movement.created_at >= $${values.length}::date`)
    }

    if (filters?.dateTo) {
      values.push(filters.dateTo)
      conditions.push(`movement.created_at < ($${values.length}::date + INTERVAL '1 day')`)
    }

    const result = await client.query<StockMovementJoinedRow>(
      `
        SELECT
          movement.*,
          seamstress.name AS seamstress_name,
          fabric.name AS fabric_name,
          fabric.category AS fabric_category,
          fabric.color_or_collection AS fabric_color_or_collection,
          quote.code AS quote_code
        FROM quote_workspace_stock_movements movement
        JOIN quote_workspace_seamstresses seamstress ON seamstress.id = movement.seamstress_id
        JOIN quote_workspace_fabrics fabric ON fabric.id = movement.fabric_id
        LEFT JOIN quote_workspace_final_quotes quote ON quote.id = movement.quote_id
        ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY movement.created_at DESC
        LIMIT 500
      `,
      values,
    )

    return result.rows.map(mapStockMovementJoinedRow)
  })
