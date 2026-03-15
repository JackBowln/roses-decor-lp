import { computed, ref, watch, type Ref } from 'vue'
import { toast } from 'vue-sonner'
import type { AdminQuoteRecord } from '@/lib/adminQuote'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  applyDirectoryContactSnapshot,
  collectLinkedFabricIds,
  createFabricPriceMap,
  createStockBalanceMap,
  filterActiveFabrics,
  filterActiveInstallers,
  filterActiveSeamstresses,
  syncAutomaticMaterialPricing,
} from '@/lib/adminQuoteManagement'
import { fetchFabrics, fetchInstallers, fetchSeamstresses, fetchStockBalances } from '@/lib/quoteWorkspaceApi'
import type { FabricRecord, InstallerRecord, SeamstressRecord, SeamstressStockBalanceView } from '@/lib/quoteWorkspace'

interface UseAdminQuoteReferencesOptions {
  record: Ref<AdminQuoteRecord>
  selectedSeamstressId: Ref<string | null>
  selectedInstallerId: Ref<string | null>
}

export const useAdminQuoteReferences = (options: UseAdminQuoteReferencesOptions) => {
  const seamstresses = ref<SeamstressRecord[]>([])
  const installers = ref<InstallerRecord[]>([])
  const fabrics = ref<FabricRecord[]>([])
  const stockBalances = ref<SeamstressStockBalanceView[]>([])
  const isLoadingInventory = ref(false)

  const activeSeamstresses = computed(() =>
    filterActiveSeamstresses(seamstresses.value, options.selectedSeamstressId.value))

  const activeInstallers = computed(() =>
    filterActiveInstallers(installers.value, options.selectedInstallerId.value))

  const activeFabrics = computed(() =>
    filterActiveFabrics(fabrics.value, collectLinkedFabricIds(options.record.value)))

  const stockByFabricId = computed(() =>
    createStockBalanceMap(stockBalances.value))

  const fabricPriceById = computed(() =>
    createFabricPriceMap(fabrics.value))

  const syncSeamstressSnapshot = () => {
    applyDirectoryContactSnapshot(
      options.selectedSeamstressId.value,
      seamstresses.value,
      options.record.value.seamstress,
    )
  }

  const syncInstallerSnapshot = () => {
    applyDirectoryContactSnapshot(
      options.selectedInstallerId.value,
      installers.value,
      options.record.value.installer,
    )
  }

  const loadInventoryReferences = async () => {
    try {
      isLoadingInventory.value = true
      const [seamstressResponse, installerResponse, fabricResponse] = await Promise.all([
        fetchSeamstresses('all'),
        fetchInstallers('all'),
        fetchFabrics('all'),
      ])

      seamstresses.value = seamstressResponse.seamstresses
      installers.value = installerResponse.installers
      fabrics.value = fabricResponse.fabrics
      syncSeamstressSnapshot()
      syncInstallerSnapshot()
    }
    catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível carregar costureiras, instaladores e tecidos.'))
    }
    finally {
      isLoadingInventory.value = false
    }
  }

  const loadStockBalances = async () => {
    if (!options.selectedSeamstressId.value) {
      stockBalances.value = []
      return
    }

    try {
      const response = await fetchStockBalances({
        seamstressId: options.selectedSeamstressId.value,
      })
      stockBalances.value = response.balances
    }
    catch (error) {
      stockBalances.value = []
      toast.error(getApiErrorMessage(error, 'Não foi possível carregar o saldo da costureira.'))
    }
  }

  watch(options.selectedSeamstressId, async () => {
    syncSeamstressSnapshot()
    await loadStockBalances()
  })

  watch(options.selectedInstallerId, () => {
    syncInstallerSnapshot()
  })

  watch(
    () => JSON.stringify({
      fabrics: fabrics.value.map((fabric) => [fabric.id, fabric.pricePerMeter]),
      items: options.record.value.items.map((item) => ({
        id: item.id,
        width: item.width,
        quantity: item.quantity,
        fabricConsumptions: (item.fabricConsumptions || []).map((consumption) => ({
          fabricId: consumption.fabricId,
          quantityMeters: consumption.quantityMeters,
        })),
      })),
    }),
    () => {
      syncAutomaticMaterialPricing(options.record.value, fabricPriceById.value)
    },
    { immediate: true },
  )

  return {
    activeFabrics,
    activeInstallers,
    activeSeamstresses,
    fabricPriceById,
    fabrics,
    installers,
    isLoadingInventory,
    loadInventoryReferences,
    loadStockBalances,
    seamstresses,
    stockBalances,
    stockByFabricId,
    syncInstallerSnapshot,
    syncSeamstressSnapshot,
  }
}
