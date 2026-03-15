import { describe, expect, it } from 'vitest'
import AppButton from '@/components/app/AppButton.vue'
import AppDialog from '@/components/app/AppDialog.vue'
import { mountWithApp } from '../../setup/mount'

describe('AppDialog', () => {
  it('renders dialog content and emits close from the close button', async () => {
    const wrapper = mountWithApp(AppDialog, {
      props: {
        open: true,
        title: 'Detalhe da venda',
        description: 'Resumo completo da venda.',
      },
      slots: {
        default: '<div data-test="body">Conteúdo</div>',
      },
      global: {
        components: {
          AppButton,
        },
      },
    })

    expect(wrapper.get('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Detalhe da venda')
    expect(wrapper.text()).toContain('Resumo completo da venda.')
    expect(wrapper.find('[data-test="body"]').exists()).toBe(true)
    await wrapper.get('button[aria-label="Fechar"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes on backdrop, but keeps the panel click isolated', async () => {
    const wrapper = mountWithApp(AppDialog, {
      props: {
        open: true,
        title: 'Editar costureira',
      },
      slots: {
        default: '<div>Formulário</div>',
      },
      global: {
        components: {
          AppButton,
        },
      },
    })

    await wrapper.get('[role="dialog"] > div').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.get('.fixed.inset-0').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('ignores backdrop clicks when closeOnBackdrop is disabled and unlocks body on close', async () => {
    const wrapper = mountWithApp(AppDialog, {
      props: {
        open: true,
        title: 'Histórico',
        closeOnBackdrop: false,
      },
      global: {
        components: {
          AppButton,
        },
      },
    })

    await wrapper.get('.fixed.inset-0').trigger('click')
    expect(wrapper.emitted('close')).toBeUndefined()

    await wrapper.setProps({ open: false })
    expect(document.body.style.overflow).toBe('')
  })
})
