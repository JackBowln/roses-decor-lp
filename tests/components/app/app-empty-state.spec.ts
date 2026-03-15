import { describe, expect, it } from 'vitest'
import AppEmptyState from '@/components/app/AppEmptyState.vue'
import AppSectionCard from '@/components/app/AppSectionCard.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppEmptyState', () => {
  it('renders title, description and icon slot', () => {
    const wrapper = mountWithApp(AppEmptyState, {
      props: {
        title: 'Nenhum registro encontrado',
        description: 'Ajuste os filtros para continuar.',
      },
      slots: {
        icon: '<span data-test="icon">i</span>',
      },
      global: {
        components: {
          AppSectionCard,
        },
      },
    })

    expect(wrapper.text()).toContain('Nenhum registro encontrado')
    expect(wrapper.text()).toContain('Ajuste os filtros para continuar.')
    expect(wrapper.find('[data-test="icon"]').exists()).toBe(true)
  })

  it('renders actions only when the default slot exists', () => {
    const wrapper = mountWithApp(AppEmptyState, {
      props: {
        title: 'Sem vendas',
      },
      slots: {
        default: '<button type="button">Criar venda</button>',
      },
      global: {
        components: {
          AppSectionCard,
        },
      },
    })

    expect(wrapper.find('button').text()).toBe('Criar venda')
    expect(wrapper.find('.flex.flex-wrap.items-center.justify-center.gap-3').exists()).toBe(true)
  })
})
