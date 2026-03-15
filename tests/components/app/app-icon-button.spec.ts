import { describe, expect, it } from 'vitest'
import AppIconButton from '@/components/app/AppIconButton.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppIconButton', () => {
  it('renders an accessible icon button with slot content', () => {
    const wrapper = mountWithApp(AppIconButton, {
      props: {
        label: 'Abrir detalhes',
      },
      slots: {
        default: '<span data-test="icon">+</span>',
      },
    })

    const button = wrapper.get('button')

    expect(button.attributes('aria-label')).toBe('Abrir detalhes')
    expect(wrapper.find('[data-test="icon"]').exists()).toBe(true)
  })

  it('disables the control and shows a spinner while loading', () => {
    const wrapper = mountWithApp(AppIconButton, {
      props: {
        label: 'Carregando',
        loading: true,
      },
      slots: {
        default: '<span data-test="icon">+</span>',
      },
    })

    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
    expect(wrapper.find('[data-test="icon"]').exists()).toBe(false)
  })
})
