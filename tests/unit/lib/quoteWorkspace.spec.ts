import { describe, expect, it } from 'vitest'
import {
  buildInstallerInstallationSummary,
  collectRequestedQuoteFabricConsumptions,
  createPreQuoteItemsFromPublic,
  normalizeMeters,
  resolveQuoteLifecycleTag,
} from '@/lib/quoteWorkspace'
import { createTestQuoteRecord } from '../../factories/adminQuote'

describe('quoteWorkspace', () => {
  it('normalizes metric values from strings and numbers', () => {
    expect(normalizeMeters('3,456')).toBe(3.456)
    expect(normalizeMeters(2.1119)).toBe(2.112)
    expect(normalizeMeters('')).toBeNull()
  })

  it('maps public pre-quote items to persisted items with measures and pending notes', () => {
    const items = createPreQuoteItemsFromPublic([
      {
        type: 'Cortina',
        env: 'Sala',
        material: 'Linho Rustico',
        blackout: 'Blackout 70%',
        width: '3,20',
        height: 2.7,
        dontKnowMeasures: false,
      },
      {
        type: 'Persiana',
        env: 'Suite',
        material: 'Rolo',
        blackout: '',
        width: null,
        height: null,
        dontKnowMeasures: true,
      },
    ])

    expect(items[0]).toMatchObject({
      environment: 'Sala',
      width: 3.2,
      height: 2.7,
      measuresPending: false,
    })
    expect(items[1]?.measuresPending).toBe(true)
    expect(items[1]?.notes).toContain('Visita técnica')
  })

  it('builds installation summaries using width fallback when installation meters are empty', () => {
    const record = createTestQuoteRecord({
      items: [
        {
          room: 'Sala',
          width: 3.2,
          installationMeters: null,
          installationIncluded: 'SIM',
        },
      ],
    })

    const summary = buildInstallerInstallationSummary(record)

    expect(summary.totalMeters).toBe(3.2)
    expect(summary.installableItemCount).toBe(1)
    expect(summary.items[0]?.installationMeters).toBe(3.2)
  })

  it('aggregates requested fabric consumptions per item, fabric and seamstress', () => {
    const record = createTestQuoteRecord({
      items: [
        {
          id: 'item_1',
          fabricConsumptions: [
            { id: 'con_1', fabricId: 'fab_1', quantityMeters: 2.5 },
            { id: 'con_2', fabricId: 'fab_1', quantityMeters: 1.25 },
            { id: 'con_3', fabricId: '', quantityMeters: 10 },
          ],
        },
      ],
    })

    const consumptions = collectRequestedQuoteFabricConsumptions(record, 'sea_1')

    expect(consumptions).toEqual([
      {
        quoteItemId: 'item_1',
        seamstressId: 'sea_1',
        fabricId: 'fab_1',
        quantityMeters: 3.75,
      },
    ])
  })

  it('resolves lifecycle tags with sale status taking precedence over quote status', () => {
    expect(resolveQuoteLifecycleTag({ saleStatus: 'pago', quoteStatus: 'pronto' })).toBe('Pago')
    expect(resolveQuoteLifecycleTag({ quoteStatus: 'pronto' })).toBe('Orçamento concluído')
    expect(resolveQuoteLifecycleTag({ preQuote: { id: 'pre_1' } as never })).toBe('Pré-orçamento')
  })
})
