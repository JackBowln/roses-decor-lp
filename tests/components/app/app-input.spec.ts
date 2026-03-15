import { describe, expect, it } from 'vitest'
import AppInput from '@/components/app/AppInput.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppInput', () => {
  it('emits raw string values by default', async () => {
    const wrapper = mountWithApp(AppInput)

    await wrapper.get('input').setValue('  Vanessa  ')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['  Vanessa  '])
  })

  it('emits trimmed values when the trim modifier is enabled', async () => {
    const wrapper = mountWithApp(AppInput, {
      props: {
        modelModifiers: {
          trim: true,
        },
      },
    })

    await wrapper.get('input').setValue('  Vanessa  ')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Vanessa'])
  })

  it('emits numbers and null when the number modifier is enabled', async () => {
    const wrapper = mountWithApp(AppInput, {
      props: {
        modelModifiers: {
          number: true,
        },
      },
    })

    await wrapper.get('input').setValue('42')
    await wrapper.get('input').setValue('')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([42])
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([null])
  })
})
