import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatPhoneMask } from '@/lib/fieldMasks'
import {
  formatPublicQuoteSuccessDescription,
  getPublicQuoteNextButtonLabel,
  publicQuoteFlowConfig,
} from '@/lib/publicQuoteConfig'
import {
  appendQuoteItemIfReady,
  createEmptyQuoteContact,
  createEmptyQuoteItem,
  createPublicPreQuotePayload,
  extractLastQuoteItemForEditing,
  formatPublicQuoteStatusLabel,
  getPublicQuoteStepId,
  isPublicQuoteStepValid,
  removeQuoteItemAt,
  type QuoteContact,
  type QuoteItem,
  type QuoteSubmissionResult,
} from '@/lib/publicQuoteForm'
import { createPublicPreQuote } from '@/lib/quoteWorkspaceApi'
import { quoteFormOptions, quoteFormSteps, siteConfig } from '@/lib/site'

const openExternalUrlWithFallback = (url: string) => {
  const popup = window.open(url, '_blank', 'noopener,noreferrer')

  if (!popup) {
    window.location.href = url
  }
}

export function useQuoteForm() {
  const currentItem = ref<QuoteItem>(createEmptyQuoteItem())
  const items = ref<QuoteItem[]>([])
  const contact = ref<QuoteContact>(createEmptyQuoteContact())
  const currentStep = ref(0)
  const isSubmitting = ref(false)
  const submissionResult = ref<QuoteSubmissionResult | null>(null)

  const currentStepId = computed(() => getPublicQuoteStepId(currentStep.value))
  const nextButtonLabel = computed(() => getPublicQuoteNextButtonLabel(currentStepId.value))

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
    items.value = appendQuoteItemIfReady(items.value, currentItem.value)
  }

  const nextStep = () => {
    if (currentStepId.value === 'medidas') {
      persistCurrentItem()
    }

    if (currentStep.value < quoteFormSteps.length - 1) {
      currentStep.value += 1
    }
  }

  const prevStep = () => {
    if (currentStepId.value === 'resumo') {
      const restored = extractLastQuoteItemForEditing(items.value)
      items.value = restored.items

      if (restored.item) {
        currentItem.value = { ...restored.item }
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
    items.value = removeQuoteItemAt(items.value, index)

    if (items.value.length === 0) {
      resetCurrentItem()
      currentStep.value = 0
    }
  }

  const advanceWithDelay = (callback: () => void) => {
    window.setTimeout(callback, publicQuoteFlowConfig.autoAdvanceDelayMs)
  }

  const selectType = (type: string) => {
    currentItem.value.type = type as QuoteItem['type']
    advanceWithDelay(nextStep)
  }

  const selectEnvironment = (environment: string) => {
    currentItem.value.env = environment
    advanceWithDelay(nextStep)
  }

  const selectStep = (index: number) => {
    if (submissionResult.value) {
      return
    }

    const targetStepId = getPublicQuoteStepId(index)

    if (index <= currentStep.value && targetStepId !== 'resumo') {
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

    openExternalUrlWithFallback(submissionResult.value.whatsappUrl)
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
      toast.success(`Pre-orcamento ${response.preQuote.code} salvo com sucesso.`)
    }
    catch (error) {
      toast.error(getApiErrorMessage(error, 'Nao foi possivel salvar o pre-orcamento.'))
    }
    finally {
      isSubmitting.value = false
    }
  }

  const isStepValid = computed(() =>
    isPublicQuoteStepValid({
      stepId: currentStepId.value,
      currentItem: currentItem.value,
      items: items.value,
      contact: contact.value,
    }))

  const successDescription = computed(() =>
    submissionResult.value
      ? formatPublicQuoteSuccessDescription(submissionResult.value.preQuote.code, siteConfig.brand.heroName)
      : '')

  return {
    addAnotherRoom,
    contact,
    currentItem,
    currentStep,
    currentStepId,
    finish,
    formatPublicQuoteStatusLabel,
    isStepValid,
    isSubmitting,
    items,
    nextButtonLabel,
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
    successDescription,
    updateWhatsapp,
  }
}
