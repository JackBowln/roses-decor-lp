import { describe, expect, it } from 'vitest'
import { requiresOperationalDatabaseForQuoteSave } from '~~/server/utils/quoteWorkspacePolicy'
import { createTestQuoteRecord } from '../../factories/adminQuote'

describe('quoteWorkspacePolicy', () => {
  it('does not require the operational database for a plain quote record', () => {
    const record = createTestQuoteRecord({
      project: {
        installationDate: '',
      },
      items: [
        {
          installationMeters: null,
        },
      ],
    })

    record.items[0]!.fabricConsumptions = undefined as never

    expect(requiresOperationalDatabaseForQuoteSave({ record })).toBe(false)
  })

  it('requires the operational database when stock or responsibility data is present', () => {
    expect(requiresOperationalDatabaseForQuoteSave({
      seamstressId: 'sea_1',
      record: createTestQuoteRecord(),
    })).toBe(true)

    expect(requiresOperationalDatabaseForQuoteSave({
      record: createTestQuoteRecord({
        items: [
          {
            fabricConsumptions: [{ id: 'con_1', fabricId: 'fab_1', quantityMeters: 2 }],
          },
        ],
      }),
    })).toBe(true)
  })
})
