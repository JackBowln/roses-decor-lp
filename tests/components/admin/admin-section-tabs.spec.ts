import { describe, expect, it } from 'vitest'
import AdminSectionTabs from '@/components/admin/AdminSectionTabs.vue'
import { mountWithApp } from '../../setup/mount'

describe('AdminSectionTabs', () => {
  const tabs = [
    {
      id: 'cliente',
      label: 'Cliente',
      description: 'Dados principais do cliente.',
    },
    {
      id: 'resumo',
      label: 'Resumo',
      description: 'Resumo executivo do orçamento.',
    },
  ]

  it('renders all tabs and highlights the active one', () => {
    const wrapper = mountWithApp(AdminSectionTabs, {
      props: {
        tabs,
        activeTab: 'resumo',
      },
    })

    expect(wrapper.text()).toContain('Cliente')
    expect(wrapper.text()).toContain('Resumo')

    const activeButton = wrapper.findAll('button').at(1)
    expect(activeButton?.attributes('class')).toContain('bg-gradient-to-br')
  })

  it('emits the selected tab id when a tab is clicked', async () => {
    const wrapper = mountWithApp(AdminSectionTabs, {
      props: {
        tabs,
        activeTab: 'cliente',
      },
    })

    await wrapper.findAll('button').at(1)?.trigger('click')

    expect(wrapper.emitted('select')).toEqual([['resumo']])
  })
})
