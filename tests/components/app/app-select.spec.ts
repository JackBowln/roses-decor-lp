import { describe, expect, it } from 'vitest'
import AppSelect from '@/components/app/AppSelect.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppSelect', () => {
  it('renders the current value and emits updates on change', async () => {
    const wrapper = mountWithApp(AppSelect, {
      props: {
        modelValue: 'ativo',
      },
      attrs: {
        id: 'status',
      },
      slots: {
        default: `
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        `,
      },
    })

    expect(wrapper.get('select').element.value).toBe('ativo')

    await wrapper.get('select').setValue('inativo')

    expect(wrapper.emitted('update:modelValue')).toEqual([['inativo']])
  })

  it('applies invalid styling and forwards non-class attributes', () => {
    const wrapper = mountWithApp(AppSelect, {
      props: {
        invalid: true,
      },
      attrs: {
        id: 'seamstress',
        name: 'seamstress',
        class: 'custom-select',
      },
      slots: {
        default: '<option value="">Selecione</option>',
      },
    })

    const select = wrapper.get('select')

    expect(select.attributes('id')).toBe('seamstress')
    expect(select.attributes('name')).toBe('seamstress')
    expect(select.classes()).toContain('custom-select')
    expect(select.attributes('class')).toContain('border-danger/35')
  })
})
