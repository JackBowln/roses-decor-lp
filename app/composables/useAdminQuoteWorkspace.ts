import { computed, ref, watch, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import type { AdminQuoteRecord } from '@/lib/adminQuote'
import {
  buildQuoteSummaryStats,
  clearQuoteDraftMeta,
  hasQuoteFabricConsumptions,
  readQuoteDraftMeta,
  writeQuoteDraftMeta,
} from '@/lib/adminQuoteManagement'
import { getApiErrorMessage } from '@/lib/apiError'
import { fetchFinalQuote, fetchInstallerDispatches, saveFinalQuote, type LoadedFinalQuotePayload } from '@/lib/quoteWorkspaceApi'
import type { InstallerDispatchRecord, StoredFinalQuote } from '@/lib/quoteWorkspace'

interface UseAdminQuoteWorkspaceOptions {
  record: Ref<AdminQuoteRecord>
  resetRecord: () => void
  isReady: Ref<boolean>
  selectedSeamstressId: Ref<string | null>
  selectedInstallerId: Ref<string | null>
  quoteStatus: Ref<StoredFinalQuote['status']>
  totals: Ref<{
    grandTotal: number
  }>
}

export const useAdminQuoteWorkspace = (options: UseAdminQuoteWorkspaceOptions) => {
  const route = useRoute()
  const activeQuoteId = ref<string | null>(null)
  const linkedCustomerId = ref<string | null>(null)
  const linkedPreQuoteId = ref<string | null>(null)
  const linkedPreQuoteCode = ref('')
  const linkedCustomerName = ref('')
  const linkedCustomerLocation = ref('')
  const installerDispatches = ref<InstallerDispatchRecord[]>([])
  const isLoadingRecord = ref(false)
  const isSavingRecord = ref(false)
  const lastSavedAt = ref('')

  const applyLoadedQuote = (payload: LoadedFinalQuotePayload) => {
    options.record.value = payload.record
    activeQuoteId.value = payload.id
    linkedCustomerId.value = payload.customerId
    linkedPreQuoteId.value = payload.preQuoteId
    linkedPreQuoteCode.value = payload.preQuote?.code || ''
    linkedCustomerName.value = payload.customer?.name || ''
    linkedCustomerLocation.value = payload.customer?.locationLabel || ''
    options.selectedSeamstressId.value = payload.seamstressId
    options.selectedInstallerId.value = payload.installerId
    options.quoteStatus.value = payload.status
    installerDispatches.value = payload.installerDispatches || []
    lastSavedAt.value = payload.updatedAt
  }

  const restoreDraftMeta = () => {
    const draftMeta = readQuoteDraftMeta()

    if (!draftMeta) {
      options.selectedSeamstressId.value = null
      options.selectedInstallerId.value = null
      options.quoteStatus.value = 'rascunho'
      return
    }

    options.selectedSeamstressId.value = draftMeta.selectedSeamstressId
    options.selectedInstallerId.value = draftMeta.selectedInstallerId
    options.quoteStatus.value = draftMeta.quoteStatus
  }

  const persistDraftMeta = () => {
    writeQuoteDraftMeta({
      selectedSeamstressId: options.selectedSeamstressId.value,
      selectedInstallerId: options.selectedInstallerId.value,
      quoteStatus: options.quoteStatus.value,
    })
  }

  const resetWorkspaceLinks = () => {
    activeQuoteId.value = null
    linkedCustomerId.value = null
    linkedPreQuoteId.value = null
    linkedPreQuoteCode.value = ''
    linkedCustomerName.value = ''
    linkedCustomerLocation.value = ''
    installerDispatches.value = []
    lastSavedAt.value = ''
  }

  const loadQuoteFromRoute = async () => {
    const quoteId = typeof route.query.quoteId === 'string' ? route.query.quoteId : ''

    if (!quoteId) {
      resetWorkspaceLinks()
      restoreDraftMeta()
      return
    }

    try {
      isLoadingRecord.value = true
      const payload = await fetchFinalQuote(quoteId)
      applyLoadedQuote(payload)
      clearQuoteDraftMeta()
    }
    catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível carregar o orçamento final.'))
    }
    finally {
      isLoadingRecord.value = false
    }
  }

  const loadInstallerDispatches = async () => {
    if (!activeQuoteId.value) {
      installerDispatches.value = []
      return
    }

    try {
      const response = await fetchInstallerDispatches({
        quoteId: activeQuoteId.value,
      })
      installerDispatches.value = response.dispatches
    }
    catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível carregar o histórico do instalador.'))
    }
  }

  const saveCurrentQuote = async () => {
    try {
      isSavingRecord.value = true
      const previousCode = options.record.value.project.code

      if (hasQuoteFabricConsumptions(options.record.value) && !options.selectedSeamstressId.value) {
        toast.error('Selecione a costureira antes de salvar baixas de tecido.')
        return
      }

      const response = await saveFinalQuote({
        id: activeQuoteId.value,
        customerId: linkedCustomerId.value,
        preQuoteId: linkedPreQuoteId.value,
        seamstressId: options.selectedSeamstressId.value,
        installerId: options.selectedInstallerId.value,
        status: options.quoteStatus.value,
        record: options.record.value,
      })

      applyLoadedQuote(response.finalQuote)
      clearQuoteDraftMeta()

      if (typeof route.query.quoteId !== 'string' || route.query.quoteId !== response.finalQuote.id) {
        await navigateTo({
          path: '/gestao/orcamentos',
          query: {
            quoteId: response.finalQuote.id,
          },
        }, { replace: true })
      }

      toast.success(
        response.finalQuote.record.project.code !== previousCode
          ? 'Orçamento salvo. O código foi ajustado automaticamente para evitar duplicidade.'
          : 'Orçamento salvo com sucesso.',
      )
    }
    catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível salvar o orçamento.'))
    }
    finally {
      isSavingRecord.value = false
    }
  }

  const startEmptyQuote = async () => {
    options.resetRecord()
    clearQuoteDraftMeta()
    resetWorkspaceLinks()
    options.selectedSeamstressId.value = null
    options.selectedInstallerId.value = null
    options.quoteStatus.value = 'rascunho'
    await navigateTo('/gestao/orcamentos', { replace: true })
  }

  watch([options.selectedSeamstressId, options.selectedInstallerId, options.quoteStatus], () => {
    if (!activeQuoteId.value && typeof route.query.quoteId !== 'string') {
      persistDraftMeta()
    }
  })

  watch(options.isReady, (ready) => {
    if (ready) {
      void loadQuoteFromRoute()
    }
  }, { immediate: true })

  watch(() => route.query.quoteId, () => {
    if (options.isReady.value) {
      void loadQuoteFromRoute()
    }
  })

  const summaryStats = computed(() =>
    buildQuoteSummaryStats({
      record: options.record.value,
      totals: options.totals.value,
      lastSavedAt: lastSavedAt.value,
    }))

  return {
    activeQuoteId,
    installerDispatches,
    isLoadingRecord,
    isSavingRecord,
    lastSavedAt,
    linkedCustomerId,
    linkedCustomerLocation,
    linkedCustomerName,
    linkedPreQuoteCode,
    linkedPreQuoteId,
    loadInstallerDispatches,
    loadQuoteFromRoute,
    restoreDraftMeta,
    saveCurrentQuote,
    startEmptyQuote,
    summaryStats,
  }
}
