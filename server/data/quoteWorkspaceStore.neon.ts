import { basename } from 'node:path'
import { createError } from 'h3'
import { neon } from '@netlify/neon'
import {
  buildCustomerSummaries,
  buildPreQuoteList,
  createAdminQuoteFromPreQuote,
  createFinalQuoteRecord,
  createPreQuoteRecord,
  createWorkspaceId,
  syncCustomerFromFinalQuote,
  upsertCustomerFromPublic,
  type CustomerRecord,
  type CustomerSummary,
  type FinalQuoteDetails,
  type PreQuoteListItem,
  type PreQuoteStatus,
  type PublicPreQuoteContact,
  type PreQuoteItemRecord,
  type PreQuoteRecord,
  type QuoteWorkspaceStore,
  type StoredFinalQuote,
} from '~~/app/lib/quoteWorkspace'
import { normalizePhone, type AdminQuoteRecord } from '~~/app/lib/adminQuote'

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
  status: StoredFinalQuote['status']
  record_json: unknown
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

const resolveDatabaseUrl = () =>
  process.env.NETLIFY_DATABASE_URL
  || process.env.NEON_DATABASE_URL
  || process.env.DATABASE_URL
  || ''

export const isNeonQuoteWorkspaceConfigured = () => Boolean(resolveDatabaseUrl())

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
  status: row.status,
  record: parseJsonColumn<AdminQuoteRecord>(row.record_json),
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
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
          status TEXT NOT NULL,
          record_json JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL
        )
      `

      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_customers_updated_at_idx ON quote_workspace_customers (updated_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_pre_quotes_customer_idx ON quote_workspace_pre_quotes (customer_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_pre_quotes_status_idx ON quote_workspace_pre_quotes (status, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_final_quotes_customer_idx ON quote_workspace_final_quotes (customer_id, created_at DESC)`
      await sql`CREATE INDEX IF NOT EXISTS quote_workspace_final_quotes_pre_quote_idx ON quote_workspace_final_quotes (pre_quote_id)`
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
  const [customerRows, preQuoteRows, finalQuoteRows] = await sql.transaction([
    sql`SELECT * FROM quote_workspace_customers ORDER BY created_at DESC`,
    sql`SELECT * FROM quote_workspace_pre_quotes ORDER BY created_at DESC`,
    sql`SELECT * FROM quote_workspace_final_quotes ORDER BY created_at DESC`,
  ], {
    readOnly: true,
  })

  return {
    customers: (customerRows as CustomerRow[]).map(mapCustomerRow),
    preQuotes: (preQuoteRows as PreQuoteRow[]).map(mapPreQuoteRow),
    finalQuotes: (finalQuoteRows as FinalQuoteRow[]).map(mapFinalQuoteRow),
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
      status,
      record_json,
      created_at,
      updated_at
    ) VALUES (
      ${finalQuote.id},
      ${finalQuote.code},
      ${finalQuote.customerId},
      ${finalQuote.preQuoteId},
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
  const store = await readQuoteWorkspaceStore()
  const finalQuote = store.finalQuotes.find((entry) => entry.id === id)

  if (!finalQuote) {
    return null
  }

  return {
    ...finalQuote,
    customer: store.customers.find((entry) => entry.id === finalQuote.customerId) || null,
    preQuote: finalQuote.preQuoteId ? store.preQuotes.find((entry) => entry.id === finalQuote.preQuoteId) || null : null,
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
  record: AdminQuoteRecord
}): Promise<StoredFinalQuote> => serializeWrite(async () => {
  const store = await readQuoteWorkspaceStore()
  const normalizedPhone = input.record.customer.phone.trim()
  const byId = input.customerId ? store.customers.find((entry) => entry.id === input.customerId) : null
  const byPhone = normalizedPhone
    ? store.customers.find((entry) => normalizePhone(entry.whatsapp) === normalizePhone(normalizedPhone))
    : null
  const matchedCustomer = byId || byPhone
  const now = new Date().toISOString()

  const customer = matchedCustomer
    ? syncCustomerFromFinalQuote(matchedCustomer, input.record)
    : {
        id: createWorkspaceId('cus'),
        name: input.record.customer.name.trim(),
        whatsapp: input.record.customer.phone.trim(),
        email: input.record.customer.email.trim(),
        locationLabel: input.record.customer.city.trim() || input.record.customer.neighborhood.trim(),
        address: input.record.customer.address.trim(),
        complement: input.record.customer.complement.trim(),
        neighborhood: input.record.customer.neighborhood.trim(),
        city: input.record.customer.city.trim(),
        state: input.record.customer.state.trim(),
        zipcode: input.record.customer.zipcode.trim(),
        createdAt: now,
        updatedAt: now,
      }

  const persistedCustomer = matchedCustomer
    ? await updateCustomerRecord(customer)
    : await insertCustomerRecord(customer)
  const existing = input.id ? store.finalQuotes.find((entry) => entry.id === input.id) : null

  if (existing) {
    existing.customerId = persistedCustomer.id
    existing.preQuoteId = input.preQuoteId ?? existing.preQuoteId
    existing.code = input.record.project.code
    existing.record = input.record
    existing.updatedAt = now
    existing.status = 'rascunho'

    const persistedFinalQuote = await upsertFinalQuoteRecord(existing)

    if (persistedFinalQuote.preQuoteId) {
      const linkedPreQuote = store.preQuotes.find((entry) => entry.id === persistedFinalQuote.preQuoteId)
      if (linkedPreQuote) {
        linkedPreQuote.finalQuoteId = persistedFinalQuote.id
        linkedPreQuote.status = 'convertido'
        linkedPreQuote.updatedAt = now
        await upsertPreQuoteRecord(linkedPreQuote)
      }
    }

    return persistedFinalQuote
  }

  const created = createFinalQuoteRecord({
    customerId: persistedCustomer.id,
    preQuoteId: input.preQuoteId ?? null,
    record: input.record,
  })

  created.updatedAt = now
  const persistedFinalQuote = await upsertFinalQuoteRecord(created)

  if (persistedFinalQuote.preQuoteId) {
    const linkedPreQuote = store.preQuotes.find((entry) => entry.id === persistedFinalQuote.preQuoteId)
    if (linkedPreQuote) {
      linkedPreQuote.finalQuoteId = persistedFinalQuote.id
      linkedPreQuote.status = 'convertido'
      linkedPreQuote.updatedAt = now
      await upsertPreQuoteRecord(linkedPreQuote)
    }
  }

  return persistedFinalQuote
})

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
