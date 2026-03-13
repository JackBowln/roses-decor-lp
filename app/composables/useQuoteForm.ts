import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { quoteFormOptions, quoteFormSteps } from '@/lib/site'
import { formatPhoneMask, isValidEmail, isValidPhone } from '@/lib/fieldMasks'
import type { PublicPreQuoteContact, PublicPreQuoteItem, PreQuoteRecord } from '@/lib/quoteWorkspace'

export interface QuoteItem extends PublicPreQuoteItem {}

interface Contact extends PublicPreQuoteContact {}

interface QuoteSubmissionResult {
  preQuote: PreQuoteRecord
  whatsappUrl: string
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
  whatsapp: '',
  email: '',
  location: '',
})

export function useQuoteForm() {
  const currentItem = ref<QuoteItem>(createEmptyQuoteItem())
  const items = ref<QuoteItem[]>([])
  const contact = ref<Contact>(createEmptyContact())
  const currentStep = ref(0)
  const isSubmitting = ref(false)
  const submissionResult = ref<QuoteSubmissionResult | null>(null)

  const resetCurrentItem = () => {
    currentItem.value = createEmptyQuoteItem()
  }

  const resetForm = () => {
    currentStep.value = 0
    items.value = []
    contact.value = createEmptyContact()
    submissionResult.value = null
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
    currentItem.value.type = type as QuoteItem['type']
    window.setTimeout(nextStep, 300)
  }

  const selectEnvironment = (environment: string) => {
    currentItem.value.env = environment
    window.setTimeout(nextStep, 300)
  }

  const selectStep = (index: number) => {
    if (submissionResult.value) {
      return
    }

    if (index <= currentStep.value && index !== 4) {
      currentStep.value = index
    }
  }

  const updateWhatsapp = (value: string) => {
    contact.value.whatsapp = formatPhoneMask(value)
  }

  const openWhatsApp = () => {
    if (!submissionResult.value?.whatsappUrl) {
      return
    }

    const popup = window.open(submissionResult.value.whatsappUrl, '_blank', 'noopener,noreferrer')

    if (!popup) {
      window.location.href = submissionResult.value.whatsappUrl
    }
  }

  const finish = async () => {
    if (isSubmitting.value) {
      return
    }

    isSubmitting.value = true

    try {
      const response = await $fetch<QuoteSubmissionResult>('/api/public/pre-quotes', {
        method: 'POST',
        body: {
          customer: contact.value,
          items: items.value,
        },
      })

      submissionResult.value = response
      toast.success(`Pré-orçamento ${response.preQuote.code} salvo com sucesso.`)
    }
    catch (error) {
      const message = typeof error === 'object'
        && error !== null
        && 'data' in error
        && typeof (error as { data?: { statusMessage?: string } }).data?.statusMessage === 'string'
        ? (error as { data: { statusMessage: string } }).data.statusMessage
        : 'Não foi possível salvar o pré-orçamento.'

      toast.error(message)
    }
    finally {
      isSubmitting.value = false
    }
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
        return contact.value.name.trim() !== ''
          && contact.value.location.trim() !== ''
          && isValidPhone(contact.value.whatsapp)
          && (!contact.value.email.trim() || isValidEmail(contact.value.email))
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
    openWhatsApp,
    prevStep,
    quoteFormOptions,
    removeItem,
    resetForm,
    selectEnvironment,
    selectStep,
    selectType,
    steps: quoteFormSteps,
    submissionResult,
    updateWhatsapp,
  }
}
