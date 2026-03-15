import { describe, expect, it } from 'vitest'
import QuoteFormProgress from '@/components/ui/quote-form/QuoteFormProgress.vue'
import { mountWithApp } from '../../../setup/mount'

describe('QuoteFormProgress', () => {
  it('renders all step titles', () => {
    const wrapper = mountWithApp(QuoteFormProgress, {
      props: {
        currentStep: 1,
        steps: [
          { id: 'produto', title: 'Produto' },
          { id: 'ambiente', title: 'Ambiente' },
          { id: 'contato', title: 'Contato' },
        ],
      },
    })

    expect(wrapper.text()).toContain('Produto')
    expect(wrapper.text()).toContain('Ambiente')
    expect(wrapper.text()).toContain('Contato')
  })

  it('emits the clicked step index', async () => {
    const wrapper = mountWithApp(QuoteFormProgress, {
      props: {
        currentStep: 0,
        steps: [
          { id: 'produto', title: 'Produto' },
          { id: 'ambiente', title: 'Ambiente' },
          { id: 'contato', title: 'Contato' },
        ],
      },
    })

    const dots = wrapper.findAll('.cursor-pointer')
    await dots[1]?.trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual([1])
  })
})
