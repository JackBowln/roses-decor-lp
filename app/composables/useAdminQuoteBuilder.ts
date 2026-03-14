import { computed, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { getApiErrorMessage } from '@/lib/apiError'
import {
  calculateQuoteTotals,
  createEmptyItemFabricConsumption,
  createEmptyLineItem,
  createEmptyQuoteRecord,
  getDeliveryChecklist,
  getDocumentSummary,
  isInstallerDocumentReady,
  isRecordReadyForClientDelivery,
  normalizePhone,
  type AdminQuoteRecord,
  type QuoteDocumentKind,
  type QuoteLineItem,
  type QuoteTabId,
} from '@/lib/adminQuote'
import { digitsOnly, formatPhoneMask, formatStateMask, formatZipcodeMask, isValidEmail, isValidPhone, isValidZipcode } from '@/lib/fieldMasks'
import { calculateInstallationMetersTotal } from '@/lib/quoteWorkspace'
import { generateQuotePdf } from '@/lib/adminQuotePdf'
import { createInstallerDispatchLog, createSharedQuoteDocument, deliverQuoteDocument } from '@/lib/quoteWorkspaceApi'

const STORAGE_KEY = 'roses-decor-admin-quote-draft'

interface ViaCepResponse {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  erro?: boolean
}

const sanitizeRecord = (value: Partial<AdminQuoteRecord> | null | undefined): AdminQuoteRecord => {
  const base = createEmptyQuoteRecord()

  if (!value) {
    return base
  }

  return {
    customer: { ...base.customer, ...value.customer },
    project: { ...base.project, ...value.project },
    seamstress: { ...base.seamstress, ...value.seamstress },
    installer: { ...base.installer, ...value.installer },
    items: Array.isArray(value.items) && value.items.length > 0
      ? value.items.map((item) => ({
        ...createEmptyLineItem(),
        ...item,
        fabricConsumptions: Array.isArray(item.fabricConsumptions)
          ? item.fabricConsumptions.map((consumption) => ({
            ...createEmptyItemFabricConsumption(),
            ...consumption,
          }))
          : [],
      }))
      : base.items,
  }
}

const downloadBlob = (filename: string, bytes: Uint8Array, mimeType: string) => {
  const blobBytes = new Uint8Array(bytes.byteLength)
  blobBytes.set(bytes)
  const blob = new Blob([blobBytes], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const buildWhatsAppUrl = (phone: string, text: string) => `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`

const buildWhatsAppDocumentMessage = (
  kind: QuoteDocumentKind,
  input: {
    projectCode: string
    pdfUrl: string
    customerName: string
  },
) => {
  if (kind === 'costureira') {
    return [
      'Oi! Tudo bem?',
      `Separei a ficha de costura do projeto ${input.projectCode}.`,
      `Cliente: ${input.customerName || 'não informado'}.`,
      '',
      `Você pode baixar o PDF por este link: ${input.pdfUrl}`,
      '',
      'Se surgir qualquer dúvida sobre tecido, medidas ou acabamento, só me chamar.',
    ].join('\n')
  }

  if (kind === 'instalador') {
    return [
      'Oi! Tudo bem?',
      `Separei a ficha de instalação do projeto ${input.projectCode}.`,
      '',
      `Você pode baixar o PDF por este link: ${input.pdfUrl}`,
      '',
      'Se precisar confirmar endereço, medidas ou data, me chama por aqui.',
    ].join('\n')
  }

  return [
    `Olá, ${input.customerName || 'tudo bem'}?`,
    `Separei o seu orçamento ${input.projectCode}.`,
    '',
    `Você pode abrir o PDF por este link: ${input.pdfUrl}`,
    '',
    'Se quiser, depois me diga o que achou para ajustarmos juntos.',
  ].join('\n')
}

export function useAdminQuoteBuilder() {
  const record = ref<AdminQuoteRecord>(createEmptyQuoteRecord())
  const activeTab = ref<QuoteTabId>('cliente')
  const isReady = ref(false)
  const sending = reactive<Record<string, boolean>>({})
  const isResolvingZipcode = ref(false)
  const zipcodeLookupError = ref('')
  const lastResolvedZipcode = ref('')

  const totals = computed(() => calculateQuoteTotals(record.value))
  const deliveryChecklist = computed(() => getDeliveryChecklist(record.value))
  const customerValidation = computed(() => ({
    phoneValid: isValidPhone(record.value.customer.phone),
    emailValid: isValidEmail(record.value.customer.email),
    zipcodeValid: !record.value.customer.zipcode || isValidZipcode(record.value.customer.zipcode),
  }))
  const canLookupZipcode = computed(() => digitsOnly(record.value.customer.zipcode).length === 8)
  const installationSummary = computed(() => {
    const installableItems = record.value.items.filter((item) => item.installationIncluded === 'SIM')

    return {
      totalMeters: calculateInstallationMetersTotal(record.value),
      installableItemCount: installableItems.length,
    }
  })
  const clientReady = computed(() =>
    isRecordReadyForClientDelivery(record.value)
    && customerValidation.value.phoneValid
    && customerValidation.value.emailValid
    && customerValidation.value.zipcodeValid)

  const documents = computed(() => [
    {
      kind: 'cliente' as const,
      title: 'Orçamento do cliente',
      summary: getDocumentSummary(record.value, 'cliente'),
      email: record.value.customer.email,
      whatsapp: record.value.customer.phone,
      ready: clientReady.value,
    },
    {
      kind: 'costureira' as const,
      title: 'Pedido da costureira',
      summary: getDocumentSummary(record.value, 'costureira'),
      email: record.value.seamstress.email,
      whatsapp: record.value.seamstress.whatsapp,
      ready: Boolean(record.value.seamstress.email || record.value.seamstress.whatsapp),
    },
    {
      kind: 'instalador' as const,
      title: 'Pedido do instalador',
      summary: getDocumentSummary(record.value, 'instalador'),
      email: record.value.installer.email,
      whatsapp: record.value.installer.whatsapp,
      ready: isInstallerDocumentReady(record.value),
    },
  ])

  const loadDraft = () => {
    if (!import.meta.client) {
      return
    }

    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      isReady.value = true
      return
    }

    try {
      record.value = sanitizeRecord(JSON.parse(raw) as AdminQuoteRecord)
    }
    catch {
      record.value = createEmptyQuoteRecord()
      localStorage.removeItem(STORAGE_KEY)
    }
    finally {
      isReady.value = true
    }
  }

  if (import.meta.client) {
    onMounted(loadDraft)

    watch(
      record,
      (value) => {
        if (!isReady.value) {
          return
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      },
      { deep: true },
    )
  }

  const addItem = () => {
    record.value.items.push(createEmptyLineItem())
    activeTab.value = 'itens'
  }

  const duplicateItem = (item: QuoteLineItem) => {
    record.value.items.push({
      ...item,
      id: createEmptyLineItem().id,
      fabricConsumptions: (item.fabricConsumptions || []).map((consumption) => ({
        ...consumption,
        id: createEmptyItemFabricConsumption().id,
      })),
    })
  }

  const removeItem = (id: string) => {
    if (record.value.items.length === 1) {
      record.value.items = [createEmptyLineItem()]
      return
    }

    record.value.items = record.value.items.filter((item) => item.id !== id)
  }

  const resetRecord = () => {
    record.value = createEmptyQuoteRecord()
    activeTab.value = 'cliente'
    zipcodeLookupError.value = ''
    lastResolvedZipcode.value = ''
    toast.success('Novo orçamento iniciado.')
  }

  const downloadPdf = (kind: QuoteDocumentKind) => {
    const pdf = generateQuotePdf(record.value, kind)
    downloadBlob(pdf.filename, pdf.bytes, 'application/pdf')
    toast.success('PDF gerado com sucesso.')
  }

  const updateCustomerPhone = (value: string) => {
    record.value.customer.phone = formatPhoneMask(value)
  }

  const updateStakeholderPhone = (field: 'seamstress' | 'installer', value: string) => {
    record.value[field].whatsapp = formatPhoneMask(value)
  }

  const updateCustomerZipcode = (value: string) => {
    record.value.customer.zipcode = formatZipcodeMask(value)
    zipcodeLookupError.value = ''
  }

  const updateCustomerState = (value: string) => {
    record.value.customer.state = formatStateMask(value)
  }

  const lookupCustomerZipcode = async (force = false) => {
    const zipcode = digitsOnly(record.value.customer.zipcode)
    const previousResolvedZipcode = lastResolvedZipcode.value

    if (zipcode.length !== 8) {
      if (force && zipcode.length > 0) {
        zipcodeLookupError.value = 'CEP inválido. Use 8 dígitos.'
      }
      return
    }

    if (!force && zipcode === lastResolvedZipcode.value) {
      return
    }

    try {
      isResolvingZipcode.value = true
      zipcodeLookupError.value = ''

      const response = await $fetch<ViaCepResponse>(`https://viacep.com.br/ws/${zipcode}/json/`)

      if (response.erro) {
        throw new Error('CEP não encontrado.')
      }

      // If the CEP changed, refresh the resolved address fields instead of
      // preserving stale values from the previous lookup.
      if (digitsOnly(record.value.customer.zipcode) !== zipcode) {
        return
      }

      const shouldOverwriteResolvedFields = force || zipcode !== previousResolvedZipcode

      if (shouldOverwriteResolvedFields || !record.value.customer.address.trim()) {
        record.value.customer.address = response.logradouro || ''
      }

      if (shouldOverwriteResolvedFields || !record.value.customer.neighborhood.trim()) {
        record.value.customer.neighborhood = response.bairro || ''
      }

      if (shouldOverwriteResolvedFields || !record.value.customer.city.trim()) {
        record.value.customer.city = response.localidade || ''
      }

      if (shouldOverwriteResolvedFields || !record.value.customer.state.trim()) {
        record.value.customer.state = formatStateMask(response.uf || '')
      }

      record.value.customer.zipcode = formatZipcodeMask(response.cep || zipcode)
      lastResolvedZipcode.value = zipcode
    }
    catch (error) {
      zipcodeLookupError.value = getApiErrorMessage(error, 'Não foi possível consultar o CEP.')
    }
    finally {
      isResolvingZipcode.value = false
    }
  }

  const shareViaWhatsApp = async (kind: QuoteDocumentKind, phone: string) => {
    const response = await createSharedQuoteDocument({
      kind,
      record: record.value,
    })

    const pdfUrl = `${window.location.origin}${response.publicPath}${kind === 'costureira' || kind === 'instalador' ? '?download=1' : ''}`
    const message = buildWhatsAppDocumentMessage(kind, {
      projectCode: record.value.project.code,
      pdfUrl,
      customerName: record.value.customer.name,
    })

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      toast.info('Em localhost, o link do PDF só ficará acessível nesta mesma máquina.')
    }

    window.open(buildWhatsAppUrl(phone, message), '_blank', 'noopener,noreferrer')
  }

  const setSending = (key: string, value: boolean) => {
    sending[key] = value
  }

  const logInstallerDispatch = async (input: {
    quoteId: string
    installerId: string
    channel: 'email' | 'whatsapp'
    status: 'enviado' | 'erro'
    errorMessage?: string
  }) => {
    await createInstallerDispatchLog({
      quoteId: input.quoteId,
      installerId: input.installerId,
      channel: input.channel,
      status: input.status,
      errorMessage: input.errorMessage || '',
      recipientEmail: record.value.installer.email,
      recipientWhatsapp: record.value.installer.whatsapp,
    })
  }

  const deliverDocument = async (
    kind: QuoteDocumentKind,
    channel: 'email' | 'whatsapp',
    options?: {
      quoteId?: string | null
      installerId?: string | null
    },
  ) => {
    const target = documents.value.find((document) => document.kind === kind)

    if (!target) {
      return false
    }

    if (channel === 'email' && !target.email) {
      toast.error('Defina um e-mail antes de enviar.')
      return false
    }

    if (channel === 'whatsapp' && !target.whatsapp) {
      toast.error('Defina um WhatsApp antes de enviar.')
      return false
    }

    if (kind === 'instalador' && (!options?.quoteId || !options?.installerId)) {
      toast.error('Salve o orçamento e selecione um instalador antes de enviar a ficha.')
      return false
    }

    const key = `${kind}-${channel}`

    try {
      setSending(key, true)

      if (channel === 'whatsapp') {
        await shareViaWhatsApp(kind, target.whatsapp || '')
        if (kind === 'instalador' && options?.quoteId && options?.installerId) {
          await logInstallerDispatch({
            quoteId: options.quoteId,
            installerId: options.installerId,
            channel,
            status: 'enviado',
          })
        }
        toast.success('Fluxo de compartilhamento do WhatsApp iniciado.')
        return true
      }

      await deliverQuoteDocument({
        quoteId: options?.quoteId,
        installerId: options?.installerId,
        channel,
        kind,
        record: record.value,
        recipient: {
          name:
            kind === 'cliente'
              ? record.value.customer.name
              : kind === 'costureira'
                ? record.value.seamstress.name
                : record.value.installer.name,
          email: target.email,
          whatsapp: target.whatsapp,
        },
      })

      toast.success('Documento enviado por e-mail.')
      return true
    }
    catch (error) {
      if (kind === 'instalador' && channel === 'whatsapp' && options?.quoteId && options?.installerId) {
        try {
          await logInstallerDispatch({
            quoteId: options.quoteId,
            installerId: options.installerId,
            channel,
            status: 'erro',
            errorMessage: getApiErrorMessage(error, 'Falha no envio.'),
          })
        }
        catch { }
      }
      toast.error(getApiErrorMessage(error, 'Falha no envio.'))
      return false
    }
    finally {
      setSending(key, false)
    }
  }

  watch(
    () => digitsOnly(record.value.customer.zipcode),
    (zipcode) => {
      if (zipcode.length === 8 && zipcode !== lastResolvedZipcode.value) {
        void lookupCustomerZipcode()
      }
    },
  )

  return {
    activeTab,
    addItem,
    canLookupZipcode,
    clientReady,
    customerValidation,
    deliveryChecklist,
    deliverDocument,
    documents,
    downloadPdf,
    duplicateItem,
    isResolvingZipcode,
    isReady,
    installationSummary,
    lookupCustomerZipcode,
    record,
    removeItem,
    resetRecord,
    sending,
    totals,
    updateCustomerPhone,
    updateCustomerState,
    updateCustomerZipcode,
    updateStakeholderPhone,
    zipcodeLookupError,
  }
}
