import { describe, expect, it } from 'vitest'
import AppField from '@/components/app/AppField.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppField', () => {
  it('renders the label, required marker and default slot', () => {
    const wrapper = mountWithApp(AppField, {
      props: {
        label: 'Cliente',
        required: true,
      },
      slots: {
        default: '<input id="cliente" />',
      },
    })

    expect(wrapper.text()).toContain('Cliente')
    expect(wrapper.text()).toContain('*')
    expect(wrapper.find('input#cliente').exists()).toBe(true)
  })

  it('prefers the error text over the description for hints', () => {
    const wrapper = mountWithApp(AppField, {
      props: {
        description: 'Informe o e-mail do cliente.',
        error: 'E-mail inválido.',
      },
      slots: {
        default: '<input />',
      },
    })

    expect(wrapper.text()).toContain('E-mail inválido.')
    expect(wrapper.text()).not.toContain('Informe o e-mail do cliente.')
  })
})
