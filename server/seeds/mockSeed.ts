import { normalizePhone } from '@/lib/adminQuote'
import type {
  CustomerRecord,
  FabricRecord,
  InstallerDispatchRecord,
  InstallerRecord,
  PreQuoteRecord,
  QuoteFabricConsumptionRecord,
  QuoteStageTransitionRecord,
  SaleRecord,
  SeamstressFabricStockRecord,
  SeamstressRecord,
  StockMovementRecord,
  StoredFinalQuote,
} from '@/lib/quoteWorkspace'
import { ensureQuoteWorkspaceSchema } from '~~/server/data/quoteWorkspaceStore.neon'
import { withQuoteWorkspaceTransaction, type QuoteWorkspaceDbClient } from '~~/server/data/quoteWorkspaceDb'
import {
  assertDatabaseResetAllowed,
  assertMockSeedAllowed,
  resolveDatabaseConfig,
  type AppDbTarget,
} from '~~/server/utils/databaseConfig'
import { buildMockCustomer } from '~~/server/seeds/factories/customerFactory'
import { buildMockFabric } from '~~/server/seeds/factories/fabricFactory'
import { buildMockFinalQuote } from '~~/server/seeds/factories/finalQuoteFactory'
import { buildMockInstaller } from '~~/server/seeds/factories/installerFactory'
import { buildMockPreQuote } from '~~/server/seeds/factories/preQuoteFactory'
import { buildMockSale } from '~~/server/seeds/factories/saleFactory'
import { buildMockSeamstress } from '~~/server/seeds/factories/seamstressFactory'
import { buildMockStockBalance } from '~~/server/seeds/factories/stockBalanceFactory'
import { buildMockStockMovement } from '~~/server/seeds/factories/stockMovementFactory'
import { createSeedFactoryContext, type SeedFactoryContext } from '~~/server/seeds/factories/shared'
import {
  MOCK_SEED_PROFILE_DEFINITIONS,
  resolveMockSeedProfile,
  type MockSeedProfile,
} from '~~/server/seeds/mockProfiles'

interface MockSeedDataSet {
  customers: CustomerRecord[]
  seamstresses: SeamstressRecord[]
  installers: InstallerRecord[]
  fabrics: FabricRecord[]
  preQuotes: PreQuoteRecord[]
  finalQuotes: StoredFinalQuote[]
  sales: SaleRecord[]
  quoteStageTransitions: QuoteStageTransitionRecord[]
  quoteFabricConsumptions: QuoteFabricConsumptionRecord[]
  stockBalances: SeamstressFabricStockRecord[]
  stockMovements: StockMovementRecord[]
  installerDispatches: InstallerDispatchRecord[]
}

export interface MockSeedOptions {
  profile?: MockSeedProfile | string
  seed?: number
  reset?: boolean
  confirmation?: string
}

export interface MockSeedResult {
  target: AppDbTarget
  profile: MockSeedProfile
  seed: number
  counts: Record<keyof MockSeedDataSet, number>
}

export interface MockResetResult {
  target: AppDbTarget
  counts: Record<string, number>
}

const stockKey = (seamstressId: string, fabricId: string) => `${seamstressId}::${fabricId}`

const toThreeDecimals = (value: number) => Math.round(value * 1000) / 1000

const parseSeed = (value?: number | string | null) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.abs(Math.trunc(value))
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10)

    if (Number.isFinite(parsed)) {
      return Math.abs(parsed)
    }
  }

  return 123
}

const countRows = async (client: QuoteWorkspaceDbClient, table: string) => {
  const result = await client.query<{ total: string }>(`SELECT COUNT(*)::text AS total FROM ${table}`)
  return Number(result.rows[0]?.total || 0)
}

const resetDataInternal = async (client: QuoteWorkspaceDbClient) => {
  const tables = [
    'quote_workspace_installer_dispatches',
    'quote_workspace_quote_fabric_consumptions',
    'quote_workspace_stock_movements',
    'quote_workspace_seamstress_fabric_stock',
    'quote_workspace_quote_stage_transitions',
    'quote_workspace_sales',
    'quote_workspace_final_quotes',
    'quote_workspace_pre_quotes',
    'quote_workspace_documents',
    'quote_workspace_fabrics',
    'quote_workspace_installers',
    'quote_workspace_seamstresses',
    'quote_workspace_customers',
  ]
  const counts: Record<string, number> = {}

  for (const table of tables) {
    counts[table] = await countRows(client, table)
  }

  for (const table of tables) {
    await client.query(`DELETE FROM ${table}`)
  }

  return counts
}

const buildInstallerDispatch = (context: SeedFactoryContext, input: {
  quote: StoredFinalQuote
  installer: InstallerRecord
  index: number
}): InstallerDispatchRecord => {
  const createdAt = context.isoDateTimeOffset(-8 + input.index, 18)
  const status: InstallerDispatchRecord['status'] = input.index % 5 === 0
    ? 'erro'
    : input.index % 3 === 0
      ? 'pendente'
      : 'enviado'

  return {
    id: context.nextId('ind'),
    quoteId: input.quote.id,
    installerId: input.installer.id,
    documentKind: 'instalador',
    channel: input.index % 2 === 0 ? 'email' : 'whatsapp',
    recipientEmail: input.installer.email,
    recipientWhatsapp: input.installer.whatsapp,
    status,
    errorMessage: status === 'erro' ? 'Falha simulada de transporte do PDF para teste de histórico.' : '',
    sentAt: status === 'enviado' ? createdAt : null,
    createdAt,
  }
}

const buildMockDataSet = (profile: MockSeedProfile, seed: number): MockSeedDataSet => {
  const context = createSeedFactoryContext(seed, profile)
  const definition = MOCK_SEED_PROFILE_DEFINITIONS[profile]
  const seamstresses = Array.from({ length: definition.seamstressCount }, (_, index) => buildMockSeamstress(context, index))
  const installers = Array.from({ length: definition.installerCount }, (_, index) => buildMockInstaller(context, index))
  const fabrics = Array.from({ length: definition.fabricCount }, (_, index) => buildMockFabric(context, index))
  const customers = Array.from({ length: definition.customerCount }, (_, index) => buildMockCustomer(context, index))
  const activeSeamstresses = seamstresses.filter((entry) => entry.status === 'ativa')
  const activeInstallers = installers.filter((entry) => entry.status === 'ativo')
  const activeFabrics = fabrics.filter((entry) => entry.status === 'ativo')
  const stockMovements: StockMovementRecord[] = []
  const quoteStageTransitions: QuoteStageTransitionRecord[] = []
  const quoteFabricConsumptions: QuoteFabricConsumptionRecord[] = []
  const finalQuotes: StoredFinalQuote[] = []
  const sales: SaleRecord[] = []
  const installerDispatches: InstallerDispatchRecord[] = []
  const balanceState = new Map<string, { seamstressId: string; fabricId: string; balanceMeters: number; createdAt: string; updatedAt: string }>()
  const fabricsBySeamstress = new Map<string, FabricRecord[]>()

  activeSeamstresses.forEach((seamstress, seamstressIndex) => {
    const selectedFabrics: FabricRecord[] = []

    for (let slot = 0; slot < Math.min(definition.stockCoveragePerSeamstress, activeFabrics.length); slot += 1) {
      const fabric = activeFabrics[(seamstressIndex * 3 + slot) % activeFabrics.length]!

      if (selectedFabrics.some((entry) => entry.id === fabric.id)) {
        continue
      }

      selectedFabrics.push(fabric)
      const quantityMeters = slot === definition.stockCoveragePerSeamstress - 1
        ? 6 + (seamstressIndex % 4)
        : 28 + ((seamstressIndex + slot) % 5) * 9
      const createdAt = context.isoDateTimeOffset(-75 + seamstressIndex + slot, 8)
      stockMovements.push(buildMockStockMovement(context, {
        seamstressId: seamstress.id,
        fabricId: fabric.id,
        type: 'entrada_manual',
        quantityMeters,
        notes: 'Carga inicial mock para validar visão de estoque.',
        createdAt,
      }))
      balanceState.set(stockKey(seamstress.id, fabric.id), {
        seamstressId: seamstress.id,
        fabricId: fabric.id,
        balanceMeters: quantityMeters,
        createdAt,
        updatedAt: createdAt,
      })
    }

    fabricsBySeamstress.set(seamstress.id, selectedFabrics)
  })

  const stockPairs = [...balanceState.values()]

  stockPairs.slice(0, Math.min(4, stockPairs.length)).forEach((pair, index) => {
    const adjustment = 1.25 + index * 0.4
    const createdAt = context.isoDateTimeOffset(-50 + index, 9)
    stockMovements.push(buildMockStockMovement(context, {
      seamstressId: pair.seamstressId,
      fabricId: pair.fabricId,
      type: index % 2 === 0 ? 'ajuste_manual_saida' : 'ajuste_manual_entrada',
      quantityMeters: adjustment,
      notes: 'Ajuste manual mock para testar filtros de movimentação.',
      createdAt,
    }))
    pair.balanceMeters = toThreeDecimals(pair.balanceMeters + (index % 2 === 0 ? -adjustment : adjustment))
    pair.updatedAt = createdAt
  })

  if (stockPairs.length >= 2) {
    const origin = stockPairs[0]!
    const destination = stockPairs[1]!
    const transferAmount = 2.5
    const createdAt = context.isoDateTimeOffset(-12, 11)

    stockMovements.push(buildMockStockMovement(context, {
      seamstressId: origin.seamstressId,
      fabricId: origin.fabricId,
      type: 'transferencia_saida',
      quantityMeters: transferAmount,
      notes: 'Transferência mock entre costureiras.',
      createdAt,
    }))
    stockMovements.push(buildMockStockMovement(context, {
      seamstressId: destination.seamstressId,
      fabricId: destination.fabricId,
      type: 'transferencia_entrada',
      quantityMeters: transferAmount,
      notes: 'Transferência mock entre costureiras.',
      createdAt,
    }))
    origin.balanceMeters = toThreeDecimals(origin.balanceMeters - transferAmount)
    destination.balanceMeters = toThreeDecimals(destination.balanceMeters + transferAmount)
    origin.updatedAt = createdAt
    destination.updatedAt = createdAt
  }

  const preQuotes = Array.from({ length: definition.preQuoteCount }, (_, index) =>
    buildMockPreQuote(context, {
      customer: customers[index % customers.length]!,
      index,
    }),
  )

  const totalQuotes = definition.convertedQuoteCount + definition.directQuoteCount
  const readyQuoteCount = Math.min(totalQuotes, definition.soldQuoteCount + Math.max(2, Math.ceil(totalQuotes * 0.2)))
  const cancelIndex = Math.min(totalQuotes - 1, readyQuoteCount)

  for (let quoteIndex = 0; quoteIndex < totalQuotes; quoteIndex += 1) {
    const linkedPreQuote = quoteIndex < definition.convertedQuoteCount ? preQuotes[quoteIndex] || null : null
    const customer = linkedPreQuote
      ? customers.find((entry) => entry.id === linkedPreQuote.customerId)!
      : customers[(quoteIndex * 2) % customers.length]!
    const status: StoredFinalQuote['status'] = quoteIndex < readyQuoteCount
      ? 'pronto'
      : quoteIndex === cancelIndex
        ? 'cancelado'
        : 'rascunho'
    const seamstress = status === 'rascunho' && quoteIndex % 4 === 0
      ? null
      : activeSeamstresses[quoteIndex % activeSeamstresses.length] || null
    const installer = quoteIndex % 3 === 1
      ? null
      : activeInstallers[quoteIndex % activeInstallers.length] || null
    const fabricPool = seamstress
      ? fabricsBySeamstress.get(seamstress.id) || activeFabrics.slice(0, 3)
      : activeFabrics.slice(0, 3)
    const bundle = buildMockFinalQuote(context, {
      customer,
      index: quoteIndex,
      status,
      preQuoteId: linkedPreQuote?.id || null,
      seamstress,
      installer,
      fabrics: fabricPool,
    })

    finalQuotes.push(bundle.quote)
    quoteFabricConsumptions.push(...bundle.consumptions)
    quoteStageTransitions.push(...bundle.transitions)

    if (linkedPreQuote) {
      linkedPreQuote.status = 'convertido'
      linkedPreQuote.finalQuoteId = bundle.quote.id
      linkedPreQuote.updatedAt = bundle.quote.updatedAt
    }

    bundle.consumptions.forEach((consumption, consumptionIndex) => {
      const movementCreatedAt = context.isoDateTimeOffset(-44 + quoteIndex, 16 + consumptionIndex)
      stockMovements.push(buildMockStockMovement(context, {
        seamstressId: consumption.seamstressId,
        fabricId: consumption.fabricId,
        quoteId: consumption.quoteId,
        quoteItemId: consumption.quoteItemId,
        type: 'consumo_orcamento',
        quantityMeters: consumption.quantityMeters,
        notes: `Baixa mock do orçamento ${bundle.quote.code}.`,
        createdAt: movementCreatedAt,
      }))

      const pair = balanceState.get(stockKey(consumption.seamstressId, consumption.fabricId))
      if (pair) {
        pair.balanceMeters = toThreeDecimals(pair.balanceMeters - consumption.quantityMeters)
        pair.updatedAt = movementCreatedAt
      }
    })
  }

  finalQuotes
    .filter((quote) => quote.status === 'pronto')
    .slice(0, definition.soldQuoteCount)
    .forEach((quote, index) => {
      const bundle = buildMockSale(context, {
        quote,
        index,
        paid: index < definition.paidSaleCount,
      })
      sales.push(bundle.sale)
      quoteStageTransitions.push(...bundle.transitions)
    })

  finalQuotes
    .filter((quote) => quote.installerId)
    .slice(0, definition.installerDispatchCount)
    .forEach((quote, index) => {
      const installer = activeInstallers.find((entry) => entry.id === quote.installerId)

      if (installer) {
        installerDispatches.push(buildInstallerDispatch(context, {
          quote,
          installer,
          index,
        }))
      }
    })

  const stockBalances = [...balanceState.values()]
    .map((entry) => buildMockStockBalance(context, {
      seamstressId: entry.seamstressId,
      fabricId: entry.fabricId,
      balanceMeters: Math.max(entry.balanceMeters, 0.5),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }))

  return {
    customers,
    seamstresses,
    installers,
    fabrics,
    preQuotes,
    finalQuotes,
    sales,
    quoteStageTransitions,
    quoteFabricConsumptions,
    stockBalances,
    stockMovements,
    installerDispatches,
  }
}

const upsertCustomers = async (client: QuoteWorkspaceDbClient, rows: CustomerRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_customers (
          id, name, whatsapp, whatsapp_normalized, email, location_label,
          address, complement, neighborhood, city, state, zipcode, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13::timestamptz, $14::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET
          name = EXCLUDED.name,
          whatsapp = EXCLUDED.whatsapp,
          whatsapp_normalized = EXCLUDED.whatsapp_normalized,
          email = EXCLUDED.email,
          location_label = EXCLUDED.location_label,
          address = EXCLUDED.address,
          complement = EXCLUDED.complement,
          neighborhood = EXCLUDED.neighborhood,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          zipcode = EXCLUDED.zipcode,
          updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.name,
        row.whatsapp,
        normalizePhone(row.whatsapp),
        row.email,
        row.locationLabel,
        row.address,
        row.complement,
        row.neighborhood,
        row.city,
        row.state,
        row.zipcode,
        row.createdAt,
        row.updatedAt,
      ],
    )
  }
}

const upsertSeamstresses = async (client: QuoteWorkspaceDbClient, rows: SeamstressRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_seamstresses (
          id, name, email, whatsapp, notes, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            whatsapp = EXCLUDED.whatsapp,
            notes = EXCLUDED.notes,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
      `,
      [row.id, row.name, row.email, row.whatsapp, row.notes, row.status, row.createdAt, row.updatedAt],
    )
  }
}

const upsertInstallers = async (client: QuoteWorkspaceDbClient, rows: InstallerRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_installers (
          id, name, email, whatsapp, notes, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            email = EXCLUDED.email,
            whatsapp = EXCLUDED.whatsapp,
            notes = EXCLUDED.notes,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
      `,
      [row.id, row.name, row.email, row.whatsapp, row.notes, row.status, row.createdAt, row.updatedAt],
    )
  }
}

const upsertFabrics = async (client: QuoteWorkspaceDbClient, rows: FabricRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_fabrics (
          id, name, category, color_or_collection, price_per_meter, unit, status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            category = EXCLUDED.category,
            color_or_collection = EXCLUDED.color_or_collection,
            price_per_meter = EXCLUDED.price_per_meter,
            unit = EXCLUDED.unit,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at
      `,
      [row.id, row.name, row.category, row.colorOrCollection, row.pricePerMeter, row.unit, row.status, row.createdAt, row.updatedAt],
    )
  }
}

const upsertPreQuotes = async (client: QuoteWorkspaceDbClient, rows: PreQuoteRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_pre_quotes (
          id, code, customer_id, origin, status, items_json, measures_pending_note,
          pdf_document_id, created_at, updated_at, final_quote_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, $7,
          NULL, $8::timestamptz, $9::timestamptz, $10
        )
        ON CONFLICT (id) DO UPDATE
        SET code = EXCLUDED.code,
            customer_id = EXCLUDED.customer_id,
            origin = EXCLUDED.origin,
            status = EXCLUDED.status,
            items_json = EXCLUDED.items_json,
            measures_pending_note = EXCLUDED.measures_pending_note,
            updated_at = EXCLUDED.updated_at,
            final_quote_id = EXCLUDED.final_quote_id
      `,
      [row.id, row.code, row.customerId, row.origin, row.status, JSON.stringify(row.items), row.measuresPendingNote, row.createdAt, row.updatedAt, row.finalQuoteId],
    )
  }
}

const upsertFinalQuotes = async (client: QuoteWorkspaceDbClient, rows: StoredFinalQuote[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_final_quotes (
          id, code, customer_id, pre_quote_id, seamstress_id, installer_id, status, record_json, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::timestamptz, $10::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET code = EXCLUDED.code,
            customer_id = EXCLUDED.customer_id,
            pre_quote_id = EXCLUDED.pre_quote_id,
            seamstress_id = EXCLUDED.seamstress_id,
            installer_id = EXCLUDED.installer_id,
            status = EXCLUDED.status,
            record_json = EXCLUDED.record_json,
            updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.code,
        row.customerId,
        row.preQuoteId,
        row.seamstressId,
        row.installerId,
        row.status,
        JSON.stringify(row.record),
        row.createdAt,
        row.updatedAt,
      ],
    )
  }
}

const upsertSales = async (client: QuoteWorkspaceDbClient, rows: SaleRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_sales (
          id, quote_id, customer_id, pre_quote_id, seamstress_id, installer_id,
          status, record_snapshot_json, sold_at, paid_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8::jsonb, $9::timestamptz, $10::timestamptz, $11::timestamptz, $12::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET quote_id = EXCLUDED.quote_id,
            customer_id = EXCLUDED.customer_id,
            pre_quote_id = EXCLUDED.pre_quote_id,
            seamstress_id = EXCLUDED.seamstress_id,
            installer_id = EXCLUDED.installer_id,
            status = EXCLUDED.status,
            record_snapshot_json = EXCLUDED.record_snapshot_json,
            sold_at = EXCLUDED.sold_at,
            paid_at = EXCLUDED.paid_at,
            updated_at = EXCLUDED.updated_at
      `,
      [
        row.id,
        row.quoteId,
        row.customerId,
        row.preQuoteId,
        row.seamstressId,
        row.installerId,
        row.status,
        JSON.stringify(row.recordSnapshot),
        row.soldAt,
        row.paidAt,
        row.createdAt,
        row.updatedAt,
      ],
    )
  }
}

const upsertQuoteStageTransitions = async (client: QuoteWorkspaceDbClient, rows: QuoteStageTransitionRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_quote_stage_transitions (
          id, quote_id, from_stage, to_stage, changed_at, changed_by
        ) VALUES (
          $1, $2, $3, $4, $5::timestamptz, $6
        )
        ON CONFLICT (id) DO UPDATE
        SET quote_id = EXCLUDED.quote_id,
            from_stage = EXCLUDED.from_stage,
            to_stage = EXCLUDED.to_stage,
            changed_at = EXCLUDED.changed_at,
            changed_by = EXCLUDED.changed_by
      `,
      [row.id, row.quoteId, row.fromStage, row.toStage, row.changedAt, row.changedBy],
    )
  }
}

const upsertQuoteFabricConsumptions = async (client: QuoteWorkspaceDbClient, rows: QuoteFabricConsumptionRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_quote_fabric_consumptions (
          id, quote_id, quote_item_id, seamstress_id, fabric_id, quantity_meters, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET quote_id = EXCLUDED.quote_id,
            quote_item_id = EXCLUDED.quote_item_id,
            seamstress_id = EXCLUDED.seamstress_id,
            fabric_id = EXCLUDED.fabric_id,
            quantity_meters = EXCLUDED.quantity_meters,
            updated_at = EXCLUDED.updated_at
      `,
      [row.id, row.quoteId, row.quoteItemId, row.seamstressId, row.fabricId, row.quantityMeters, row.createdAt, row.updatedAt],
    )
  }
}

const upsertStockBalances = async (client: QuoteWorkspaceDbClient, rows: SeamstressFabricStockRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_seamstress_fabric_stock (
          id, seamstress_id, fabric_id, balance_meters, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5::timestamptz, $6::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET seamstress_id = EXCLUDED.seamstress_id,
            fabric_id = EXCLUDED.fabric_id,
            balance_meters = EXCLUDED.balance_meters,
            updated_at = EXCLUDED.updated_at
      `,
      [row.id, row.seamstressId, row.fabricId, row.balanceMeters, row.createdAt, row.updatedAt],
    )
  }
}

const upsertStockMovements = async (client: QuoteWorkspaceDbClient, rows: StockMovementRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_stock_movements (
          id, seamstress_id, fabric_id, quote_id, quote_item_id, type, quantity_meters, notes, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET seamstress_id = EXCLUDED.seamstress_id,
            fabric_id = EXCLUDED.fabric_id,
            quote_id = EXCLUDED.quote_id,
            quote_item_id = EXCLUDED.quote_item_id,
            type = EXCLUDED.type,
            quantity_meters = EXCLUDED.quantity_meters,
            notes = EXCLUDED.notes,
            created_at = EXCLUDED.created_at
      `,
      [row.id, row.seamstressId, row.fabricId, row.quoteId, row.quoteItemId, row.type, row.quantityMeters, row.notes, row.createdAt],
    )
  }
}

const upsertInstallerDispatches = async (client: QuoteWorkspaceDbClient, rows: InstallerDispatchRecord[]) => {
  for (const row of rows) {
    await client.query(
      `
        INSERT INTO quote_workspace_installer_dispatches (
          id, quote_id, installer_id, document_kind, channel,
          recipient_email, recipient_whatsapp, status, error_message, sent_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10::timestamptz, $11::timestamptz
        )
        ON CONFLICT (id) DO UPDATE
        SET quote_id = EXCLUDED.quote_id,
            installer_id = EXCLUDED.installer_id,
            document_kind = EXCLUDED.document_kind,
            channel = EXCLUDED.channel,
            recipient_email = EXCLUDED.recipient_email,
            recipient_whatsapp = EXCLUDED.recipient_whatsapp,
            status = EXCLUDED.status,
            error_message = EXCLUDED.error_message,
            sent_at = EXCLUDED.sent_at,
            created_at = EXCLUDED.created_at
      `,
      [
        row.id,
        row.quoteId,
        row.installerId,
        row.documentKind,
        row.channel,
        row.recipientEmail,
        row.recipientWhatsapp,
        row.status,
        row.errorMessage,
        row.sentAt,
        row.createdAt,
      ],
    )
  }
}

export const resetMockDatabase = async (): Promise<MockResetResult> => {
  const config = resolveDatabaseConfig({ logContext: 'mock-reset' })
  assertDatabaseResetAllowed(config)
  await ensureQuoteWorkspaceSchema()

  const counts = await withQuoteWorkspaceTransaction(async (client) => resetDataInternal(client))

  return {
    target: config.target,
    counts,
  }
}

export const seedMockDatabase = async (options?: MockSeedOptions): Promise<MockSeedResult> => {
  const profile = resolveMockSeedProfile(options?.profile || process.env.MOCK_SEED_PROFILE)
  const seed = parseSeed(options?.seed ?? process.env.MOCK_SEED)
  const config = resolveDatabaseConfig({ logContext: 'mock-seed' })
  assertMockSeedAllowed(config, { confirmation: options?.confirmation })
  await ensureQuoteWorkspaceSchema()

  if (options?.reset) {
    assertDatabaseResetAllowed(config)
    await withQuoteWorkspaceTransaction(async (client) => resetDataInternal(client))
  }

  const dataSet = buildMockDataSet(profile, seed)

  await withQuoteWorkspaceTransaction(async (client) => {
    await upsertCustomers(client, dataSet.customers)
    await upsertSeamstresses(client, dataSet.seamstresses)
    await upsertInstallers(client, dataSet.installers)
    await upsertFabrics(client, dataSet.fabrics)
    await upsertPreQuotes(client, dataSet.preQuotes)
    await upsertFinalQuotes(client, dataSet.finalQuotes)
    await upsertSales(client, dataSet.sales)
    await upsertQuoteStageTransitions(client, dataSet.quoteStageTransitions)
    await upsertQuoteFabricConsumptions(client, dataSet.quoteFabricConsumptions)
    await upsertStockBalances(client, dataSet.stockBalances)
    await upsertStockMovements(client, dataSet.stockMovements)
    await upsertInstallerDispatches(client, dataSet.installerDispatches)
  })

  return {
    target: config.target,
    profile,
    seed,
    counts: {
      customers: dataSet.customers.length,
      seamstresses: dataSet.seamstresses.length,
      installers: dataSet.installers.length,
      fabrics: dataSet.fabrics.length,
      preQuotes: dataSet.preQuotes.length,
      finalQuotes: dataSet.finalQuotes.length,
      sales: dataSet.sales.length,
      quoteStageTransitions: dataSet.quoteStageTransitions.length,
      quoteFabricConsumptions: dataSet.quoteFabricConsumptions.length,
      stockBalances: dataSet.stockBalances.length,
      stockMovements: dataSet.stockMovements.length,
      installerDispatches: dataSet.installerDispatches.length,
    },
  }
}
