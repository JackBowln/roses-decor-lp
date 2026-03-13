import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  buildCustomerSummaries,
  buildPreQuoteList,
  createAdminQuoteFromPreQuote,
  createFinalQuoteRecord,
  createWorkspaceStore,
  createPreQuoteRecord,
  syncCustomerFromFinalQuote,
  upsertCustomerFromPublic,
  type CustomerRecord,
  type CustomerSummary,
  type FinalQuoteDetails,
  type PreQuoteListItem,
  type PreQuoteStatus,
  type PublicPreQuoteContact,
  type PreQuoteItemRecord,
  type QuoteWorkspaceStore,
  type StoredFinalQuote,
} from '~~/app/lib/quoteWorkspace'
import type { AdminQuoteRecord } from '~~/app/lib/adminQuote'

const DATA_ROOT = join(process.cwd(), '.data', 'roses-decor')
const STORE_PATH = join(DATA_ROOT, 'workspace.json')
const DOCUMENTS_ROOT = join(DATA_ROOT, 'documents')

let writeQueue = Promise.resolve()

const ensureDirectory = async (path: string) => {
  await mkdir(path, { recursive: true })
}

const ensureStore = async () => {
  await ensureDirectory(DATA_ROOT)

  try {
    await readFile(STORE_PATH, 'utf8')
  }
  catch {
    await writeFile(STORE_PATH, JSON.stringify(createWorkspaceStore(), null, 2), 'utf8')
  }
}

export const ensureDocumentsDirectory = async (folder: string) => {
  const path = join(DOCUMENTS_ROOT, folder)
  await ensureDirectory(path)
  return path
}

export const saveWorkspaceDocument = async (relativePath: string, bytes: Uint8Array) => {
  const destination = join(DOCUMENTS_ROOT, relativePath)
  await ensureDirectory(dirname(destination))
  await writeFile(destination, Buffer.from(bytes))
  return destination
}

export const readWorkspaceDocument = async (absolutePath: string) => readFile(absolutePath)

export const readQuoteWorkspaceStore = async (): Promise<QuoteWorkspaceStore> => {
  await ensureStore()
  const raw = await readFile(STORE_PATH, 'utf8')

  try {
    const parsed = JSON.parse(raw) as Partial<QuoteWorkspaceStore>
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      preQuotes: Array.isArray(parsed.preQuotes) ? parsed.preQuotes : [],
      finalQuotes: Array.isArray(parsed.finalQuotes) ? parsed.finalQuotes : [],
    }
  }
  catch {
    return createWorkspaceStore()
  }
}

const writeQuoteWorkspaceStore = async (store: QuoteWorkspaceStore) => {
  await ensureStore()
  const tempPath = `${STORE_PATH}.tmp`
  await writeFile(tempPath, JSON.stringify(store, null, 2), 'utf8')
  await rename(tempPath, STORE_PATH)
}

const mutateStore = async <T>(mutation: (store: QuoteWorkspaceStore) => Promise<T> | T) => {
  const task = writeQueue.then(async () => {
    const store = await readQuoteWorkspaceStore()
    const result = await mutation(store)
    await writeQuoteWorkspaceStore(store)
    return result
  })

  writeQueue = task.then(() => undefined, () => undefined)
  return task
}

export const createPublicPreQuoteEntry = async (input: {
  contact: PublicPreQuoteContact
  items: PreQuoteItemRecord[]
  pdfPath: string
}) => mutateStore(async (store) => {
  const customer = upsertCustomerFromPublic(store.customers, input.contact)
  const preQuote = createPreQuoteRecord({
    customerId: customer.id,
    items: input.items,
    pdfPath: input.pdfPath,
  })

  store.preQuotes.unshift(preQuote)

  return {
    customer,
    preQuote,
  }
})

export const updatePreQuoteDocumentPath = async (preQuoteId: string, pdfPath: string) =>
  mutateStore(async (store) => {
    const preQuote = store.preQuotes.find((entry) => entry.id === preQuoteId)

    if (!preQuote) {
      throw new Error('Pré-orçamento não encontrado.')
    }

    preQuote.pdfPath = pdfPath
    preQuote.updatedAt = new Date().toISOString()
    return preQuote
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

const ensureCustomerForFinalQuote = (store: QuoteWorkspaceStore, record: AdminQuoteRecord, existingCustomerId?: string | null) => {
  const normalizedPhone = record.customer.phone.trim()
  const now = new Date().toISOString()
  const byId = existingCustomerId ? store.customers.find((entry) => entry.id === existingCustomerId) : null
  const byPhone = normalizedPhone ? store.customers.find((entry) => entry.whatsapp.replace(/\D+/g, '') === normalizedPhone.replace(/\D+/g, '')) : null
  const customer = byId || byPhone

  if (customer) {
    return syncCustomerFromFinalQuote(customer, record)
  }

  const created: CustomerRecord = {
    id: `cus_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
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

  store.customers.unshift(created)
  return created
}

export const convertPreQuoteToFinalQuote = async (preQuoteId: string): Promise<StoredFinalQuote> =>
  mutateStore(async (store) => {
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

    store.finalQuotes.unshift(finalQuote)
    preQuote.status = 'convertido'
    preQuote.finalQuoteId = finalQuote.id
    preQuote.updatedAt = new Date().toISOString()

    return finalQuote
  })

export const saveFinalQuoteRecord = async (input: {
  id?: string | null
  customerId?: string | null
  preQuoteId?: string | null
  record: AdminQuoteRecord
}): Promise<StoredFinalQuote> => mutateStore(async (store) => {
  const customer = ensureCustomerForFinalQuote(store, input.record, input.customerId)
  const now = new Date().toISOString()
  const existing = input.id ? store.finalQuotes.find((entry) => entry.id === input.id) : null

  if (existing) {
    existing.customerId = customer.id
    existing.preQuoteId = input.preQuoteId ?? existing.preQuoteId
    existing.code = input.record.project.code
    existing.record = input.record
    existing.updatedAt = now
    existing.status = 'rascunho'

    if (existing.preQuoteId) {
      const linkedPreQuote = store.preQuotes.find((entry) => entry.id === existing.preQuoteId)
      if (linkedPreQuote) {
        linkedPreQuote.finalQuoteId = existing.id
        linkedPreQuote.status = 'convertido'
        linkedPreQuote.updatedAt = now
      }
    }

    return existing
  }

  const created = createFinalQuoteRecord({
    customerId: customer.id,
    preQuoteId: input.preQuoteId ?? null,
    record: input.record,
  })

  created.updatedAt = now
  store.finalQuotes.unshift(created)

  if (created.preQuoteId) {
    const linkedPreQuote = store.preQuotes.find((entry) => entry.id === created.preQuoteId)
    if (linkedPreQuote) {
      linkedPreQuote.finalQuoteId = created.id
      linkedPreQuote.status = 'convertido'
      linkedPreQuote.updatedAt = now
    }
  }

  return created
})

export const updatePreQuoteStatus = async (id: string, status: PreQuoteStatus) =>
  mutateStore(async (store) => {
    const preQuote = store.preQuotes.find((entry) => entry.id === id)

    if (!preQuote) {
      throw new Error('Pré-orçamento não encontrado.')
    }

    preQuote.status = status
    preQuote.updatedAt = new Date().toISOString()
    return preQuote
  })
