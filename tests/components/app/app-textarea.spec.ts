import { describe, expect, it } from 'vitest'
import AppTextarea from '@/components/app/AppTextarea.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppTextarea', () => {
  it('renders the current value and emits updates on input', async () => {
    const wrapper = mountWithApp(AppTextarea, {
      props: {
        modelValue: 'Observação inicial',
      },
    })

    const textarea = wrapper.get('textarea')

    expect((textarea.element as HTMLTextAreaElement).value).toBe('Observação inicial')

    await textarea.setValue('Nova observação')

    expect(wrapper.emitted('update:modelValue')).toEqual([['Nova observação']])
  })

  it('applies invalid styling and forwards attributes', () => {
    const wrapper = mountWithApp(AppTextarea, {
      props: {
        invalid: true,
      },
      attrs: {
        rows: '6',
        class: 'custom-textarea',
      },
    })

    const textarea = wrapper.get('textarea')

    expect(textarea.attributes('rows')).toBe('6')
    expect(textarea.classes()).toContain('custom-textarea')
    expect(textarea.attributes('class')).toContain('border-danger/35')
  })
})
