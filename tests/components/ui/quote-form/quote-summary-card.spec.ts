import { describe, expect, it } from 'vitest'
import AppIconButton from '@/components/app/AppIconButton.vue'
import QuoteSummaryCard from '@/components/ui/quote-form/QuoteSummaryCard.vue'
import { createTestQuoteItem } from '../../../factories/publicQuote'
import { mountWithApp } from '../../../setup/mount'

describe('QuoteSummaryCard', () => {
  it('renders item description and measures', () => {
    const wrapper = mountWithApp(QuoteSummaryCard, {
      props: {
        item: createTestQuoteItem({
          blackout: '70%',
          width: '3.20',
          height: '2.80',
        }),
      },
      global: {
        components: {
          AppIconButton,
        },
      },
    })

    expect(wrapper.text()).toContain('Cortina - Sala')
    expect(wrapper.text()).toContain('Linho')
    expect(wrapper.text()).toContain('Blackout 70%')
    expect(wrapper.text()).toContain('3.20m x 2.80m')
  })

  it('shows the pending-measures label and emits remove', async () => {
    const wrapper = mountWithApp(QuoteSummaryCard, {
      props: {
        item: createTestQuoteItem({
          dontKnowMeasures: true,
        }),
      },
      global: {
        components: {
          AppIconButton,
        },
      },
    })

    expect(wrapper.text()).toContain('Medidas a confirmar')

    await wrapper.get('button[aria-label="Remover ambiente"]').trigger('click')

    expect(wrapper.emitted('remove')).toHaveLength(1)
  })
})
