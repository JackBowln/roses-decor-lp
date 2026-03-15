import { describe, expect, it } from 'vitest'
import AppStatusBadge from '@/components/app/AppStatusBadge.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppStatusBadge', () => {
  it('renders the slot content with the neutral tone by default', () => {
    const wrapper = mountWithApp(AppStatusBadge, {
      slots: {
        default: 'Rascunho',
      },
    })

    expect(wrapper.text()).toContain('Rascunho')
    expect(wrapper.classes()).toContain('bg-surface-soft/80')
  })

  it('applies tone classes and preserves custom classes', () => {
    const wrapper = mountWithApp(AppStatusBadge, {
      props: {
        tone: 'success',
      },
      attrs: {
        class: 'custom-badge',
      },
      slots: {
        default: 'Pago',
      },
    })

    expect(wrapper.classes()).toContain('custom-badge')
    expect(wrapper.classes()).toContain('bg-success/12')
  })
})
