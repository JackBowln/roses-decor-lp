import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { buildWhatsAppUrl, quoteFormOptions, quoteFormSteps } from '@/lib/site'

export interface QuoteItem {
  type: string
  env: string
  material: string
  blackout: string
  width: string
  height: string
  dontKnowMeasures: boolean
}

interface Contact {
  name: string
  location: string
}

const createEmptyQuoteItem = (): QuoteItem => ({
  type: '',
  env: '',
  material: '',
  blackout: 'Sem Blackout',
  width: '',
  height: '',
  dontKnowMeasures: false,
})

const createEmptyContact = (): Contact => ({
  name: '',
  location: '',
})

const buildWhatsAppMessage = (contact: Contact, items: QuoteItem[]) => {
  let message = `Olá! Gostaria de fazer um orçamento.\n\nMeu nome: ${contact.name}\nLocal: ${contact.location}\n\n*Itens:*\n`

  items.forEach((item, index) => {
    message += `\n${index + 1}. ${item.type} para ${item.env}\n`
    message += `   Material: ${item.material}`

    if (item.type === 'Cortina') {
      message += ` (Blackout: ${item.blackout})`
    }

    message += '\n'

    if (item.dontKnowMeasures) {
      message += '   Medidas: Não sei as medidas exatas\n'
      return
    }

    message += `   Medidas: ${item.width}m x ${item.height}m\n`
  })

  return message
}

export function useQuoteForm() {
  const currentItem = ref<QuoteItem>(createEmptyQuoteItem())
  const items = ref<QuoteItem[]>([])
  const contact = ref<Contact>(createEmptyContact())
  const currentStep = ref(0)
  const isSubmitting = ref(false)

  const resetCurrentItem = () => {
    currentItem.value = createEmptyQuoteItem()
  }

  const resetForm = () => {
    currentStep.value = 0
    items.value = []
    contact.value = createEmptyContact()
    resetCurrentItem()
  }

  const persistCurrentItem = () => {
    if (!currentItem.value.type || !currentItem.value.env || !currentItem.value.material) {
      return
    }

    items.value.push({ ...currentItem.value })
  }

  const nextStep = () => {
    if (currentStep.value === 3) {
      persistCurrentItem()
    }

    if (currentStep.value < quoteFormSteps.length - 1) {
      currentStep.value += 1
    }
  }

  const prevStep = () => {
    if (currentStep.value === 4 && items.value.length > 0) {
      const lastItem = items.value.pop()

      if (lastItem) {
        currentItem.value = { ...lastItem }
      }
    }

    if (currentStep.value > 0) {
      currentStep.value -= 1
    }
  }

  const addAnotherRoom = () => {
    resetCurrentItem()
    currentStep.value = 0
  }

  const removeItem = (index: number) => {
    items.value.splice(index, 1)

    if (items.value.length === 0) {
      resetCurrentItem()
      currentStep.value = 0
    }
  }

  const selectType = (type: string) => {
    currentItem.value.type = type
    window.setTimeout(nextStep, 300)
  }

  const selectEnvironment = (environment: string) => {
    currentItem.value.env = environment
    window.setTimeout(nextStep, 300)
  }

  const selectStep = (index: number) => {
    if (index <= currentStep.value && index !== 4) {
      currentStep.value = index
    }
  }

  const finish = () => {
    if (isSubmitting.value) {
      return
    }

    isSubmitting.value = true

    const whatsappMessage = buildWhatsAppMessage(contact.value, items.value)
    const whatsappUrl = buildWhatsAppUrl(whatsappMessage)

    toast.success('Redirecionando para o WhatsApp...')

    const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer')

    if (!whatsappWindow) {
      window.location.href = whatsappUrl
    }

    resetForm()
    isSubmitting.value = false
  }

  const isStepValid = computed(() => {
    switch (currentStep.value) {
      case 0:
        return currentItem.value.type !== ''
      case 1:
        return currentItem.value.env !== ''
      case 2:
        return currentItem.value.material !== ''
      case 3:
        return currentItem.value.dontKnowMeasures || (currentItem.value.width !== '' && currentItem.value.height !== '')
      case 4:
        return items.value.length > 0
      case 5:
        return contact.value.name.trim() !== '' && contact.value.location.trim() !== ''
      default:
        return true
    }
  })

  return {
    addAnotherRoom,
    contact,
    currentItem,
    currentStep,
    finish,
    isStepValid,
    isSubmitting,
    items,
    nextStep,
    prevStep,
    quoteFormOptions,
    removeItem,
    selectEnvironment,
    selectStep,
    selectType,
    steps: quoteFormSteps,
  }
}
