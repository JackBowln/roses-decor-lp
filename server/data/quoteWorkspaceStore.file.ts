import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import {
  buildCustomerSummaries,
  buildPreQuoteList,
  createAdminQuoteFromPreQuote,
  createFinalQuoteRecord,
  createSaleRecordFromFinalQuote,
  createWorkspaceStore,
  createPreQuoteRecord,
  syncCustomerFromFinalQuote,
  upsertCustomerFromPublic,
  type CustomerRecord,
  type CustomerSummary,
  type FinalQuoteDetails,
  type InstallerDispatchRecord,
  type InstallerRecord,
  type PreQuoteListItem,
  type PreQuoteStatus,
  type PublicPreQuoteContact,
  type PreQuoteItemRecord,
  type QuoteStageTransitionRecord,
  type QuoteWorkspaceStore,
  type SaleListItem,
  type SaleRecord,
  type SalesDashboardMetrics,
  type SalesDashboardRange,
  type StoredFinalQuote,
} from '~~/app/lib/quoteWorkspace'
import { normalizeAdminQuoteRecord, type AdminQuoteRecord } from '~~/app/lib/adminQuote'
import { buildSaleListItem, buildSalesDashboardMetrics } from '~~/app/lib/sales'

const DATA_ROOT = join(process.cwd(), '.data', 'roses-decor')
const STORE_PATH = join(DATA_ROOT, 'workspace.json')
const DOCUMENTS_ROOT = join(DATA_ROOT, 'documents')

let writeQueue = Promise.resolve()

export interface WorkspaceDocumentPayload {
  bytes: Uint8Array
  filename: string
  mimeType: string
}

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

export const readWorkspaceDocument = async (absolutePath: string): Promise<WorkspaceDocumentPayload | null> => {
  try {
    const bytes = await readFile(absolutePath)

    return {
      bytes,
      filename: basename(absolutePath),
      mimeType: 'application/pdf',
    }
  }
  catch {
    return null
  }
}

export const readQuoteWorkspaceStore = async (): Promise<QuoteWorkspaceStore> => {
  await ensureStore()
  const raw = await readFile(STORE_PATH, 'utf8')

  try {
    const parsed = JSON.parse(raw) as Partial<QuoteWorkspaceStore>
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      preQuotes: Array.isArray(parsed.preQuotes) ? parsed.preQuotes : [],
      finalQuotes: Array.isArray(parsed.finalQuotes) ? parsed.finalQuotes : [],
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
      seamstresses: Array.isArray(parsed.seamstresses) ? parsed.seamstresses : [],
      installers: Array.isArray(parsed.installers) ? parsed.installers : [],
      installerDispatches: Array.isArray(parsed.installerDispatches) ? parsed.installerDispatches : [],
      quoteStageTransitions: Array.isArray(parsed.quoteStageTransitions) ? parsed.quoteStageTransitions : [],
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
    record: normalizeAdminQuoteRecord(finalQuote.record),
    customer: store.customers.find((entry) => entry.id === finalQuote.customerId) || null,
    preQuote: finalQuote.preQuoteId ? store.preQuotes.find((entry) => entry.id === finalQuote.preQuoteId) || null : null,
    seamstress: null,
    installer: finalQuote.installerId ? store.installers.find((entry) => entry.id === finalQuote.installerId) || null : null,
    sale: store.sales.find((entry) => entry.quoteId === finalQuote.id) || null,
    stageTransitions: store.quoteStageTransitions.filter((entry) => entry.quoteId === finalQuote.id),
    fabricConsumptions: [],
    installerDispatches: store.installerDispatches.filter((entry) => entry.quoteId === finalQuote.id),
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
  seamstressId?: string | null
  installerId?: string | null
  status?: StoredFinalQuote['status']
  record: AdminQuoteRecord
}): Promise<StoredFinalQuote> => mutateStore(async (store) => {
  const customer = ensureCustomerForFinalQuote(store, input.record, input.customerId)
  const now = new Date().toISOString()
  const existing = input.id ? store.finalQuotes.find((entry) => entry.id === input.id) : null

  if (existing) {
    existing.customerId = customer.id
    existing.preQuoteId = input.preQuoteId ?? existing.preQuoteId
    existing.seamstressId = input.seamstressId ?? existing.seamstressId ?? null
    existing.installerId = input.installerId ?? existing.installerId ?? null
    existing.code = input.record.project.code
    existing.record = input.record
    existing.updatedAt = now
    existing.status = input.status ?? 'rascunho'

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
    seamstressId: input.seamstressId ?? null,
    installerId: input.installerId ?? null,
    record: input.record,
  })

  created.updatedAt = now
  created.status = input.status ?? 'rascunho'
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

export const listInstallers = async (): Promise<InstallerRecord[]> => {
  const store = await readQuoteWorkspaceStore()
  return [...store.installers].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
}

export const findInstallerById = async (id: string) => {
  const store = await readQuoteWorkspaceStore()
  return store.installers.find((entry) => entry.id === id) || null
}

export const saveInstaller = async (input: {
  id?: string | null
  name: string
  email?: string
  whatsapp?: string
  notes?: string
  status: InstallerRecord['status']
}): Promise<InstallerRecord> => mutateStore(async (store) => {
  const now = new Date().toISOString()
  const existing = input.id ? store.installers.find((entry) => entry.id === input.id) : null

  if (existing) {
    existing.name = input.name.trim()
    existing.email = input.email?.trim() || ''
    existing.whatsapp = input.whatsapp?.trim() || ''
    existing.notes = input.notes?.trim() || ''
    existing.status = input.status
    existing.updatedAt = now
    return existing
  }

  const created: InstallerRecord = {
    id: `ins_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    email: input.email?.trim() || '',
    whatsapp: input.whatsapp?.trim() || '',
    notes: input.notes?.trim() || '',
    status: input.status,
    createdAt: now,
    updatedAt: now,
  }

  store.installers.unshift(created)
  return created
})

export const listInstallerDispatches = async (filters?: {
  installerId?: string
  quoteId?: string
  channel?: InstallerDispatchRecord['channel']
  dateFrom?: string
  dateTo?: string
}) => {
  const store = await readQuoteWorkspaceStore()

  return store.installerDispatches
    .filter((entry) => {
      if (filters?.installerId && entry.installerId !== filters.installerId) {
        return false
      }
      if (filters?.quoteId && entry.quoteId !== filters.quoteId) {
        return false
      }
      if (filters?.channel && entry.channel !== filters.channel) {
        return false
      }
      if (filters?.dateFrom && entry.createdAt < filters.dateFrom) {
        return false
      }
      if (filters?.dateTo && entry.createdAt > `${filters.dateTo}T23:59:59.999Z`) {
        return false
      }
      return true
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export const createInstallerDispatch = async (input: Omit<InstallerDispatchRecord, 'id' | 'createdAt'>) =>
  mutateStore(async (store) => {
    const created: InstallerDispatchRecord = {
      id: `ind_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...input,
    }

    store.installerDispatches.unshift(created)
    return created
  })

const mapSaleListItem = (store: QuoteWorkspaceStore, sale: SaleRecord): SaleListItem => {
  const normalizedSnapshot = normalizeAdminQuoteRecord(sale.recordSnapshot)
  const customer = store.customers.find((entry) => entry.id === sale.customerId)
  const preQuote = sale.preQuoteId ? store.preQuotes.find((entry) => entry.id === sale.preQuoteId) : null
  const installer = sale.installerId ? store.installers.find((entry) => entry.id === sale.installerId) : null

  return buildSaleListItem({
    sale: {
      ...sale,
      recordSnapshot: normalizedSnapshot,
    },
    customer: {
      id: customer?.id || sale.customerId,
      name: customer?.name || normalizedSnapshot.customer.name || 'Cliente não encontrado',
      whatsapp: customer?.whatsapp || normalizedSnapshot.customer.phone || '',
      email: customer?.email || normalizedSnapshot.customer.email || '',
      locationLabel: customer?.locationLabel || normalizedSnapshot.customer.city || '',
      city: customer?.city || normalizedSnapshot.customer.city || '',
      state: customer?.state || normalizedSnapshot.customer.state || '',
    },
    preQuoteCode: preQuote?.code || null,
    seamstressName: normalizedSnapshot.seamstress.name,
    installerName: installer?.name || normalizedSnapshot.installer.name,
  })
}

export const listSales = async (): Promise<SaleListItem[]> => {
  const store = await readQuoteWorkspaceStore()
  return store.sales.map((sale) => mapSaleListItem(store, sale))
}

export const findSaleById = async (id: string) => {
  const store = await readQuoteWorkspaceStore()
  const sale = store.sales.find((entry) => entry.id === id) || null

  if (!sale) {
    return null
  }

  const quote = await findFinalQuoteById(sale.quoteId)

  return {
    sale: mapSaleListItem(store, sale),
    quote,
    customer: store.customers.find((entry) => entry.id === sale.customerId) || null,
    preQuote: sale.preQuoteId ? store.preQuotes.find((entry) => entry.id === sale.preQuoteId) || null : null,
    seamstress: null,
    installer: sale.installerId ? store.installers.find((entry) => entry.id === sale.installerId) || null : null,
    stageTransitions: store.quoteStageTransitions.filter((entry) => entry.quoteId === sale.quoteId),
  }
}

export const transitionSaleStatus = async (input: {
  quoteId: string
  status: SaleRecord['status']
  changedBy?: string
}) => mutateStore(async (store) => {
  const quote = store.finalQuotes.find((entry) => entry.id === input.quoteId)

  if (!quote) {
    throw new Error('Orçamento final não encontrado.')
  }

  const now = new Date().toISOString()
  const existingSale = store.sales.find((entry) => entry.quoteId === input.quoteId) || null
  const changedBy = input.changedBy?.trim() || 'admin'
  const transitionId = `qst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  if (input.status === 'vendido') {
    if (quote.status !== 'pronto') {
      throw new Error('A venda só pode ser criada a partir de um orçamento concluído.')
    }

    if (existingSale) {
      return existingSale
    }

    const createdSale = createSaleRecordFromFinalQuote({
      quote,
      soldAt: now,
    })

    store.sales.unshift(createdSale)
    store.quoteStageTransitions.unshift({
      id: transitionId,
      quoteId: quote.id,
      fromStage: quote.status,
      toStage: 'vendido',
      changedAt: now,
      changedBy,
    })

    return createdSale
  }

  if (!existingSale) {
    throw new Error('Venda não encontrada para este orçamento.')
  }

  if (existingSale.status !== 'vendido') {
    throw new Error('Apenas vendas marcadas como vendido podem ser alteradas para pago.')
  }

  existingSale.status = 'pago'
  existingSale.paidAt = now
  existingSale.updatedAt = now
  store.quoteStageTransitions.unshift({
    id: transitionId,
    quoteId: quote.id,
    fromStage: 'vendido',
    toStage: 'pago',
    changedAt: now,
    changedBy,
  })

  return existingSale
})

export const fetchSalesDashboard = async (range: SalesDashboardRange): Promise<SalesDashboardMetrics> => {
  const store = await readQuoteWorkspaceStore()
  const sales = store.sales.map((sale) => mapSaleListItem(store, sale))
  return buildSalesDashboardMetrics({
    sales,
    transitions: store.quoteStageTransitions as QuoteStageTransitionRecord[],
    range,
  })
}
