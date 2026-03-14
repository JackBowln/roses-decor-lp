import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  canPersistQuoteItem,
  createEmptyQuoteContact,
  createEmptyQuoteItem,
  createPublicPreQuotePayload,
  isPublicQuoteStepValid,
  type QuoteContact,
  type QuoteItem,
  type QuoteSubmissionResult,
} from '@/lib/publicQuoteForm'
import { createPublicPreQuote } from '@/lib/quoteWorkspaceApi'
import { quoteFormOptions, quoteFormSteps } from '@/lib/site'
import { formatPhoneMask } from '@/lib/fieldMasks'

export function useQuoteForm() {
  const currentItem = ref<QuoteItem>(createEmptyQuoteItem())
  const items = ref<QuoteItem[]>([])
  const contact = ref<QuoteContact>(createEmptyQuoteContact())
  const currentStep = ref(0)
  const isSubmitting = ref(false)
  const submissionResult = ref<QuoteSubmissionResult | null>(null)

  const resetCurrentItem = () => {
    currentItem.value = createEmptyQuoteItem()
  }

  const resetForm = () => {
    currentStep.value = 0
    items.value = []
    contact.value = createEmptyQuoteContact()
    submissionResult.value = null
    resetCurrentItem()
  }

  const persistCurrentItem = () => {
    if (!canPersistQuoteItem(currentItem.value)) {
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
      const response = await createPublicPreQuote(
        createPublicPreQuotePayload({
          customer: contact.value,
          items: items.value,
        }),
      )

      submissionResult.value = response
      toast.success(`Pré-orçamento ${response.preQuote.code} salvo com sucesso.`)
    }
    catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar o pré-orçamento.'))
    }
    finally {
      isSubmitting.value = false
    }
  }

  const isStepValid = computed(() =>
    isPublicQuoteStepValid({
      currentStep: currentStep.value,
      currentItem: currentItem.value,
      items: items.value,
      contact: contact.value,
    }))

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
