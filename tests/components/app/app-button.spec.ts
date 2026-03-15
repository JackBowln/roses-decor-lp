import { describe, expect, it } from 'vitest'
import AppButton from '@/components/app/AppButton.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppButton', () => {
  it('renders a native button by default', () => {
    const wrapper = mountWithApp(AppButton, {
      slots: {
        default: 'Salvar',
      },
    })

    expect(wrapper.get('button').attributes('type')).toBe('button')
    expect(wrapper.text()).toContain('Salvar')
  })

  it('disables the native button and shows a spinner while loading', () => {
    const wrapper = mountWithApp(AppButton, {
      props: {
        loading: true,
      },
      slots: {
        default: 'Salvando',
      },
    })

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('renders a NuxtLink-compatible anchor when "to" is provided', () => {
    const wrapper = mountWithApp(AppButton, {
      props: {
        to: '/gestao/orcamentos',
      },
      slots: {
        default: 'Abrir',
      },
    })

    expect(wrapper.get('a').attributes('href')).toBe('/gestao/orcamentos')
  })

  it('applies aria-disabled semantics to links when disabled', () => {
    const wrapper = mountWithApp(AppButton, {
      props: {
        to: '/gestao/orcamentos',
        disabled: true,
      },
      slots: {
        default: 'Abrir',
      },
    })

    expect(wrapper.get('a').attributes('aria-disabled')).toBe('true')
    expect(wrapper.get('a').attributes('tabindex')).toBe('-1')
  })
})
