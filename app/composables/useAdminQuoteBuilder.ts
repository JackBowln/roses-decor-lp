import { computed, onMounted, reactive, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  calculateQuoteTotals,
  createEmptyLineItem,
  createEmptyQuoteRecord,
  formatCurrency,
  getDeliveryChecklist,
  getDocumentSummary,
  isRecordReadyForClientDelivery,
  normalizePhone,
  type AdminQuoteRecord,
  type QuoteDocumentKind,
  type QuoteLineItem,
  type QuoteTabId,
} from '@/lib/adminQuote'
import { digitsOnly, formatPhoneMask, formatStateMask, formatZipcodeMask, isValidEmail, isValidPhone, isValidZipcode } from '@/lib/fieldMasks'
import { generateQuotePdf } from '@/lib/adminQuotePdf'

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
      ? value.items.map((item) => ({ ...createEmptyLineItem(), ...item }))
      : base.items,
  }
}

const downloadBlob = (filename: string, bytes: Uint8Array, mimeType: string) => {
  const blob = new Blob([bytes], { type: mimeType })
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
      ready: Boolean(record.value.installer.email || record.value.installer.whatsapp),
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

      if (!record.value.customer.address.trim()) {
        record.value.customer.address = response.logradouro || ''
      }

      record.value.customer.neighborhood = response.bairro || record.value.customer.neighborhood
      record.value.customer.city = response.localidade || record.value.customer.city
      record.value.customer.state = formatStateMask(response.uf || record.value.customer.state)
      record.value.customer.zipcode = formatZipcodeMask(response.cep || zipcode)
      lastResolvedZipcode.value = zipcode
    }
    catch (error) {
      zipcodeLookupError.value = error instanceof Error ? error.message : 'Não foi possível consultar o CEP.'
    }
    finally {
      isResolvingZipcode.value = false
    }
  }

  const shareViaWhatsApp = async (kind: QuoteDocumentKind, phone: string) => {
    const pdf = generateQuotePdf(record.value, kind)
    const total = formatCurrency(totals.value.grandTotal)
    const message = `Olá! Segue o PDF do documento ${record.value.project.code}. Total de referência: ${total}.`
    const file = new File([pdf.bytes], pdf.filename, { type: 'application/pdf' })

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: pdf.filename,
        text: message,
        files: [file],
      })
      return
    }

    downloadBlob(pdf.filename, pdf.bytes, 'application/pdf')
    window.open(buildWhatsAppUrl(phone, `${message} O PDF foi baixado e pode ser anexado na conversa.`), '_blank', 'noopener,noreferrer')
    toast.info('O PDF foi baixado. Anexe-o na conversa do WhatsApp que foi aberta.')
  }

  const setSending = (key: string, value: boolean) => {
    sending[key] = value
  }

  const deliverDocument = async (kind: QuoteDocumentKind, channel: 'email' | 'whatsapp') => {
    const target = documents.value.find((document) => document.kind === kind)

    if (!target) {
      return
    }

    if (channel === 'email' && !target.email) {
      toast.error('Defina um e-mail antes de enviar.')
      return
    }

    if (channel === 'whatsapp' && !target.whatsapp) {
      toast.error('Defina um WhatsApp antes de enviar.')
      return
    }

    const key = `${kind}-${channel}`

    try {
      setSending(key, true)

      if (channel === 'whatsapp') {
        await shareViaWhatsApp(kind, target.whatsapp || '')
        toast.success('Fluxo de compartilhamento do WhatsApp iniciado.')
        return
      }

      await $fetch('/api/admin/deliver', {
        method: 'POST',
        credentials: 'include',
        body: {
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
        },
      })

      toast.success('Documento enviado por e-mail.')
    }
    catch (error) {
      const message
        = typeof error === 'object'
          && error !== null
          && 'data' in error
          && typeof (error as { data?: { statusMessage?: string } }).data?.statusMessage === 'string'
          ? (error as { data: { statusMessage: string } }).data.statusMessage
          : error instanceof Error
            ? error.message
            : 'Falha no envio.'
      toast.error(message)
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
