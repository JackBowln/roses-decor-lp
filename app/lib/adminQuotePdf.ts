import {
  calculateLineItemTotal,
  calculatePaymentOptions,
  formatCurrency,
  formatBlackoutLabel,
  getDocumentSummary,
  type AdminQuoteRecord,
  type QuoteDocumentKind,
} from '@/lib/adminQuote'
import { buildInstallerInstallationSummary } from '@/lib/quoteWorkspace'
import { siteConfig } from '@/lib/site'

interface PdfTextLine {
  text: string
  size: number
  bold?: boolean
  gapAfter?: number
}

type PdfRgbColor = [number, number, number]

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const PAGE_MARGIN_X = 42
const PAGE_MARGIN_TOP = 790
const PAGE_MARGIN_BOTTOM = 52
const BODY_FONT_SIZE = 11
const HEADING_FONT_SIZE = 15
const TITLE_FONT_SIZE = 22
const DEFAULT_LINE_HEIGHT = 16
const HEADING_LINE_HEIGHT = 24
const encoder = new TextEncoder()

const COLORS = {
  textDark: [0.12, 0.11, 0.1] as PdfRgbColor,
  textMuted: [0.33, 0.31, 0.28] as PdfRgbColor,
  accent: [0.77, 0.63, 0.35] as PdfRgbColor,
  warmSurface: [0.97, 0.94, 0.89] as PdfRgbColor,
  warmSurfaceStrong: [0.94, 0.89, 0.81] as PdfRgbColor,
  white: [1, 1, 1] as PdfRgbColor,
  border: [0.86, 0.81, 0.72] as PdfRgbColor,
  tableHeaderFill: [0.93, 0.93, 0.93] as PdfRgbColor,
  brandWine: [0.45, 0.17, 0.16] as PdfRgbColor,
  brandBlue: [0.16, 0.43, 0.75] as PdfRgbColor,
  gridDark: [0.18, 0.24, 0.33] as PdfRgbColor,
}

const escapePdfText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const normalizeText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')

const byteLength = (value: string) => encoder.encode(value).length
const colorToPdf = ([r, g, b]: PdfRgbColor) => `${r} ${g} ${b}`
const estimateLineWidth = (text: string, size: number) => text.length * size * 0.52
const COMPANY_EMAIL = 'rose.designerinteriores@gmail.com'

const monthLabels = [
  'Janeiro',
  'Fevereiro',
  'Marco',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

const formatCurrencyValueOnly = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const formatPdfDateLabel = (isoDate: string, city: string) => {
  const date = isoDate ? new Date(`${isoDate}T12:00:00`) : new Date()

  if (Number.isNaN(date.getTime())) {
    return `${city}, ${isoDate || ''}`.trim()
  }

  const day = date.getDate()
  const month = monthLabels[date.getMonth()] || ''
  const year = date.getFullYear()

  return `${city}, ${day} de ${month} de ${year}`
}

const formatMeasureTableLabel = (width: number | null, height: number | null) => {
  if (!width || !height) {
    return 'A CONFIRMAR'
  }

  const widthLabel = width.toFixed(2).replace('.', ',')
  const heightLabel = height.toFixed(2).replace('.', ',')
  return `L ${widthLabel} X A ${heightLabel}`
}

const toPdfUpper = (value: string) => normalizeText(value).toUpperCase()

const wrapText = (text: string, size: number, maxWidth: number) => {
  const safeText = normalizeText(text)

  if (!safeText.trim()) {
    return ['']
  }

  const words = safeText.split(/\s+/)
  const lines: string[] = []
  let current = ''

  words.forEach((word) => {
    const nextLine = current ? `${current} ${word}` : word

    if (estimateLineWidth(nextLine, size) <= maxWidth || !current) {
      current = nextLine
      return
    }

    lines.push(current)
    current = word
  })

  if (current) {
    lines.push(current)
  }

  return lines
}

const drawText = (commands: string[], text: string, x: number, y: number, options?: {
  size?: number
  bold?: boolean
  color?: PdfRgbColor
  font?: 'F1' | 'F2' | 'F3'
}) => {
  commands.push(
    `BT /${options?.font || (options?.bold ? 'F2' : 'F1')} ${options?.size ?? BODY_FONT_SIZE} Tf ${colorToPdf(options?.color ?? COLORS.textDark)} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(normalizeText(text))}) Tj ET`,
  )
}

const drawRect = (commands: string[], x: number, y: number, width: number, height: number, color: PdfRgbColor) => {
  commands.push(`${colorToPdf(color)} rg ${x} ${y} ${width} ${height} re f`)
}

const drawStrokeRect = (commands: string[], x: number, y: number, width: number, height: number, color: PdfRgbColor) => {
  commands.push(`${colorToPdf(color)} RG 1 w ${x} ${y} ${width} ${height} re S`)
}

const drawLine = (
  commands: string[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: PdfRgbColor,
  width = 1,
) => {
  commands.push(`${colorToPdf(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`)
}

const drawCenteredText = (
  commands: string[],
  text: string,
  centerX: number,
  y: number,
  options?: {
    size?: number
    bold?: boolean
    color?: PdfRgbColor
    font?: 'F1' | 'F2' | 'F3'
  },
) => {
  const size = options?.size ?? BODY_FONT_SIZE
  const normalized = normalizeText(text)
  const x = centerX - estimateLineWidth(normalized, size) / 2
  drawText(commands, normalized, x, y, options)
}

const drawRightAlignedText = (
  commands: string[],
  text: string,
  rightX: number,
  y: number,
  options?: {
    size?: number
    bold?: boolean
    color?: PdfRgbColor
    font?: 'F1' | 'F2' | 'F3'
  },
) => {
  const size = options?.size ?? BODY_FONT_SIZE
  const normalized = normalizeText(text)
  const x = rightX - estimateLineWidth(normalized, size)
  drawText(commands, normalized, x, y, options)
}

const truncateLines = (lines: string[], maxLines: number) => {
  if (lines.length <= maxLines) {
    return lines
  }

  const clipped = lines.slice(0, maxLines)
  const lastIndex = clipped.length - 1
  clipped[lastIndex] = `${clipped[lastIndex].slice(0, Math.max(clipped[lastIndex].length - 3, 0)).trimEnd()}...`
  return clipped
}

const drawWrappedTextBlock = (
  commands: string[],
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options?: {
    size?: number
    bold?: boolean
    color?: PdfRgbColor
    lineHeight?: number
    maxLines?: number
  },
) => {
  const size = options?.size ?? BODY_FONT_SIZE
  const lineHeight = options?.lineHeight ?? Math.round(size * 1.35)
  const wrapped = wrapText(text, size, maxWidth)
  const lines = typeof options?.maxLines === 'number' ? truncateLines(wrapped, options.maxLines) : wrapped

  lines.forEach((line, index) => {
    drawText(commands, line, x, y - index * lineHeight, {
      size,
      bold: options?.bold,
      color: options?.color,
    })
  })
}

const pushWrappedLines = (target: PdfTextLine[], text: string, size: number, options?: { bold?: boolean; gapAfter?: number }) => {
  const wrapped = wrapText(text, size, PAGE_WIDTH - PAGE_MARGIN_X * 2)

  wrapped.forEach((line, index) => {
    target.push({
      text: line,
      size,
      bold: options?.bold,
      gapAfter: index === wrapped.length - 1 ? options?.gapAfter : 0,
    })
  })
}

const buildContentStream = (lines: PdfTextLine[]) => {
  let y = PAGE_MARGIN_TOP
  const pages: string[] = []
  let commands = ''

  const flushPage = () => {
    pages.push(commands)
    commands = ''
    y = PAGE_MARGIN_TOP
  }

  lines.forEach((line) => {
    const lineHeight = line.size >= HEADING_FONT_SIZE ? HEADING_LINE_HEIGHT : DEFAULT_LINE_HEIGHT

    if (y - lineHeight < PAGE_MARGIN_BOTTOM) {
      flushPage()
    }

    const fontName = line.bold ? 'F2' : 'F1'
    const text = escapePdfText(line.text)
    commands += `BT /${fontName} ${line.size} Tf 1 0 0 1 ${PAGE_MARGIN_X} ${y} Tm (${text}) Tj ET\n`
    y -= lineHeight + (line.gapAfter ?? 0)
  })

  if (commands || pages.length === 0) {
    flushPage()
  }

  return pages
}

const ORDER_TABLE_X = 72
const ORDER_TABLE_WIDTH = 486
const ORDER_TABLE_HEADER_Y = 510
const ORDER_TABLE_HEADER_HEIGHT = 34
const ORDER_TABLE_FOOTER_LIMIT_Y = 204
const ORDER_FOOTER_CONTACT_TEXT = `E-mail: ${COMPANY_EMAIL}  -  Fone ${siteConfig.contact.whatsappDisplay}`

type OrderDocumentColumns = {
  environment: number
  description: number
  measures: number
  value?: number
}

type OrderDocumentRow = {
  environmentLines: string[]
  descriptionLines: string[]
  measureLines: string[]
  valueLabel?: string
}

const getOrderDocumentColumns = (showValueColumn: boolean): OrderDocumentColumns => (
  showValueColumn
    ? {
        environment: 84,
        description: 242,
        measures: 98,
        value: 62,
      }
    : {
        environment: 84,
        description: 304,
        measures: 98,
      }
)

const getCustomerAddressLines = (record: AdminQuoteRecord) => {
  const address = [
    record.customer.address,
    record.customer.complement ? ` - ${record.customer.complement}` : '',
  ].filter(Boolean).join('')

  return [
    address,
    record.customer.neighborhood ? `Bairro: ${record.customer.neighborhood}` : '',
    record.customer.city
      ? `${record.customer.city}${record.customer.state ? ` - ${record.customer.state}` : ''}`
      : '',
    `Fone: ${record.customer.phone || 'Nao informado'}`,
  ].filter(Boolean)
}

const drawOrderDocumentFooter = (commands: string[]) => {
  drawLine(commands, ORDER_TABLE_X, 30, ORDER_TABLE_X + ORDER_TABLE_WIDTH, 30, COLORS.brandWine, 4)
  drawCenteredText(commands, ORDER_FOOTER_CONTACT_TEXT, PAGE_WIDTH / 2, 16, {
    size: 8,
    color: COLORS.textMuted,
  })
}

const drawOrderDocumentHeader = (input: {
  commands: string[]
  record: AdminQuoteRecord
  title: string
  continued: boolean
}) => {
  const { commands, record, title, continued } = input
  const customerCity = record.customer.city || 'Vila Velha'
  const customerLines = getCustomerAddressLines(record)

  drawCenteredText(commands, "Rose's Decor - Decoracao de Interiores", PAGE_WIDTH / 2, 800, {
    size: 18,
    color: COLORS.brandWine,
    font: 'F3',
  })
  drawLine(commands, ORDER_TABLE_X, 788, ORDER_TABLE_X + ORDER_TABLE_WIDTH, 788, COLORS.brandWine, 1.5)
  drawText(commands, formatPdfDateLabel(record.project.createdAt, customerCity), ORDER_TABLE_X, 770, {
    size: 10,
    color: COLORS.textDark,
  })

  drawText(commands, `CLIENTE: ${toPdfUpper(record.customer.name || 'CLIENTE NAO INFORMADO')}`, ORDER_TABLE_X, 706, {
    size: 12.5,
    bold: true,
    color: COLORS.textDark,
  })

  let customerLineY = 686
  customerLines.forEach((line, index) => {
    if (index === 0) {
      drawWrappedTextBlock(commands, line, ORDER_TABLE_X, customerLineY, ORDER_TABLE_WIDTH - 80, {
        size: 10,
        color: COLORS.textDark,
        lineHeight: 13,
        maxLines: 2,
      })
      customerLineY -= 18
      return
    }

    drawText(commands, line, ORDER_TABLE_X, customerLineY, {
      size: 10,
      color: COLORS.textDark,
    })
    customerLineY -= 18
  })

  drawCenteredText(commands, continued ? `${title} - CONTINUACAO` : title, PAGE_WIDTH / 2, 588, {
    size: 16,
    bold: true,
    color: COLORS.textDark,
    font: 'F3',
  })
  const titleWidth = Math.min(Math.max(estimateLineWidth(continued ? `${title} - CONTINUACAO` : title, 16) / 2 + 10, 74), 150)
  drawLine(commands, PAGE_WIDTH / 2 - titleWidth, 584, PAGE_WIDTH / 2 + titleWidth, 584, COLORS.textDark, 1)
}

const drawOrderTableHeader = (
  commands: string[],
  columns: OrderDocumentColumns,
  showValueColumn: boolean,
) => {
  drawRect(commands, ORDER_TABLE_X, ORDER_TABLE_HEADER_Y - ORDER_TABLE_HEADER_HEIGHT, ORDER_TABLE_WIDTH, ORDER_TABLE_HEADER_HEIGHT, COLORS.tableHeaderFill)
  drawStrokeRect(commands, ORDER_TABLE_X, ORDER_TABLE_HEADER_Y - ORDER_TABLE_HEADER_HEIGHT, ORDER_TABLE_WIDTH, ORDER_TABLE_HEADER_HEIGHT, COLORS.gridDark)
  drawLine(commands, ORDER_TABLE_X + columns.environment, ORDER_TABLE_HEADER_Y, ORDER_TABLE_X + columns.environment, ORDER_TABLE_HEADER_Y - ORDER_TABLE_HEADER_HEIGHT, COLORS.gridDark)
  drawLine(commands, ORDER_TABLE_X + columns.environment + columns.description, ORDER_TABLE_HEADER_Y, ORDER_TABLE_X + columns.environment + columns.description, ORDER_TABLE_HEADER_Y - ORDER_TABLE_HEADER_HEIGHT, COLORS.gridDark)
  drawLine(commands, ORDER_TABLE_X + columns.environment + columns.description + columns.measures, ORDER_TABLE_HEADER_Y, ORDER_TABLE_X + columns.environment + columns.description + columns.measures, ORDER_TABLE_HEADER_Y - ORDER_TABLE_HEADER_HEIGHT, COLORS.gridDark)

  drawCenteredText(commands, 'AMBIENTE', ORDER_TABLE_X + columns.environment / 2, ORDER_TABLE_HEADER_Y - 22, {
    size: 10,
    bold: true,
    color: COLORS.brandBlue,
  })
  drawCenteredText(commands, 'DESCRICAO', ORDER_TABLE_X + columns.environment + columns.description / 2, ORDER_TABLE_HEADER_Y - 22, {
    size: 10,
    bold: true,
    color: COLORS.brandBlue,
  })
  drawCenteredText(commands, 'MEDIDAS', ORDER_TABLE_X + columns.environment + columns.description + columns.measures / 2, ORDER_TABLE_HEADER_Y - 22, {
    size: 10,
    bold: true,
    color: COLORS.brandBlue,
  })

  if (showValueColumn && columns.value) {
    drawCenteredText(commands, 'VALOR', ORDER_TABLE_X + ORDER_TABLE_WIDTH - columns.value / 2, ORDER_TABLE_HEADER_Y - 22, {
      size: 10,
      bold: true,
      color: COLORS.brandBlue,
    })
  }
}

const drawOrderTableRow = (
  commands: string[],
  columns: OrderDocumentColumns,
  row: OrderDocumentRow,
  currentY: number,
  showValueColumn: boolean,
) => {
  const rowLineCount = Math.max(row.environmentLines.length, row.descriptionLines.length, row.measureLines.length)
  const rowHeight = Math.max(64, 18 + rowLineCount * 12)

  drawStrokeRect(commands, ORDER_TABLE_X, currentY - rowHeight, ORDER_TABLE_WIDTH, rowHeight, COLORS.gridDark)
  drawLine(commands, ORDER_TABLE_X + columns.environment, currentY, ORDER_TABLE_X + columns.environment, currentY - rowHeight, COLORS.gridDark)
  drawLine(commands, ORDER_TABLE_X + columns.environment + columns.description, currentY, ORDER_TABLE_X + columns.environment + columns.description, currentY - rowHeight, COLORS.gridDark)
  drawLine(commands, ORDER_TABLE_X + columns.environment + columns.description + columns.measures, currentY, ORDER_TABLE_X + columns.environment + columns.description + columns.measures, currentY - rowHeight, COLORS.gridDark)

  row.environmentLines.forEach((line, lineIndex) => {
    drawCenteredText(commands, line, ORDER_TABLE_X + columns.environment / 2, currentY - 26 - lineIndex * 12, {
      size: 9,
      bold: true,
      color: COLORS.gridDark,
    })
  })

  row.descriptionLines.forEach((line, lineIndex) => {
    drawText(commands, line, ORDER_TABLE_X + columns.environment + 6, currentY - 12 - lineIndex * 12, {
      size: 8.8,
      color: COLORS.textDark,
    })
  })

  row.measureLines.forEach((line, lineIndex) => {
    drawCenteredText(commands, line, ORDER_TABLE_X + columns.environment + columns.description + columns.measures / 2, currentY - 28 - lineIndex * 12, {
      size: 8.8,
      color: COLORS.textDark,
    })
  })

  if (showValueColumn && row.valueLabel) {
    drawRightAlignedText(commands, row.valueLabel, ORDER_TABLE_X + ORDER_TABLE_WIDTH - 10, currentY - rowHeight / 2 - 2, {
      size: 9.5,
      color: COLORS.textDark,
    })
  }

  return rowHeight
}

const buildPdfFromStreams = (streams: string[]) => {
  const objects: string[] = []
  const pageObjectIds: number[] = []
  const fontRegularId = 3
  const fontBoldId = 4
  const fontItalicId = 5
  let nextObjectId = 6

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = ''
  objects[fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  objects[fontItalicId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-BoldItalic >>'

  streams.forEach((stream) => {
    const contentId = nextObjectId++
    const pageId = nextObjectId++
    const length = byteLength(stream)

    objects[contentId] = `<< /Length ${length} >>\nstream\n${stream}endstream`
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontItalicId} 0 R >> >> /Contents ${contentId} 0 R >>`
    pageObjectIds.push(pageId)
  })

  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []

  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = byteLength(pdf)
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }

  const xrefOffset = byteLength(pdf)
  pdf += `xref\n0 ${objects.length}\n`
  pdf += '0000000000 65535 f \n'

  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new TextEncoder().encode(pdf)
}

const createGenericDocumentLines = (record: AdminQuoteRecord, kind: QuoteDocumentKind) => {
  const summary = getDocumentSummary(record, kind)
  const lines: PdfTextLine[] = []

  pushWrappedLines(lines, summary.title, TITLE_FONT_SIZE, { bold: true, gapAfter: 8 })
  pushWrappedLines(lines, `Rose's Cortinas e Persianas | Documento ${record.project.code}`, BODY_FONT_SIZE, { gapAfter: 12 })

  summary.lines.forEach((line) => {
    if (!line.trim()) {
      lines.push({ text: '', size: BODY_FONT_SIZE, gapAfter: 4 })
      return
    }

    const isHeading = !line.startsWith(' ') && /^([A-Z0-9]|Pedido)/.test(normalizeText(line)) && !line.includes('|') && line.length < 64

    pushWrappedLines(lines, line, isHeading ? HEADING_FONT_SIZE : BODY_FONT_SIZE, {
      bold: isHeading,
      gapAfter: isHeading ? 6 : 2,
    })
  })

  pushWrappedLines(lines, `Gerado em ${new Date().toLocaleString('pt-BR')}`, BODY_FONT_SIZE, { gapAfter: 0 })

  return { summary, lines }
}

const buildClientDescriptionLines = (item: AdminQuoteRecord['items'][number]) => {
  const lines: string[] = []
  const category = toPdfUpper(item.category || 'CORTINA')
  const fabricLabel = toPdfUpper(item.fabric || 'TECIDO NAO DEFINIDO')
  const colorLabel = item.fabricColor ? ` - COR ${toPdfUpper(item.fabricColor)}` : ''

  if (category.includes('PERSIANA')) {
    lines.push(category)
    lines.push(`TECIDO: ${fabricLabel}${colorLabel}`)
    lines.push(`INSTALACAO: ${toPdfUpper(item.mountType || 'TETO')}`)
    lines.push(`CONTROLE: ${toPdfUpper(item.controlSide || item.openingSide || 'PADRAO')}`)
    return lines
  }

  lines.push(`TRILHO ${toPdfUpper(item.trackType)} ${toPdfUpper(item.mountType || 'TETO')}${item.wallSupport === 'SIM' ? ' - SUPORTE PAREDE' : ''}`)
  lines.push(toPdfUpper(item.openingSide || item.controlSide || 'ABERTA AO MEIO'))
  lines.push(toPdfUpper(`BLACKOUT ${item.blackout === 'SEM' ? 'SEM BLACKOUT' : item.blackout}`))
  lines.push(`${fabricLabel}${colorLabel}${item.pleatModel ? ` - ${toPdfUpper(item.pleatModel)}` : ''}`)

  if (item.notes.trim()) {
    lines.push(toPdfUpper(item.notes))
  }

  return lines
}

const createClientQuoteStreams = (record: AdminQuoteRecord) => {
  const payment = calculatePaymentOptions(record)
  const pages: string[] = []
  const columns = getOrderDocumentColumns(true)
  const paymentSummaryText = record.project.paymentTerms
    ? normalizeText(record.project.paymentTerms).toUpperCase()
    : '50% NO PEDIDO E 50% NA ENTREGA.'

  let commands: string[] = []
  let currentY = 0

  const startPage = (continued = false) => {
    commands = []
    drawOrderDocumentHeader({
      commands,
      record,
      title: 'PEDIDO APROVADO',
      continued,
    })
    drawOrderTableHeader(commands, columns, true)
    currentY = ORDER_TABLE_HEADER_Y - ORDER_TABLE_HEADER_HEIGHT
  }

  const flushPage = () => {
    drawOrderDocumentFooter(commands)
    pages.push(commands.join('\n'))
  }

  startPage()

  record.items.forEach((item, index) => {
    const row: OrderDocumentRow = {
      environmentLines: wrapText(toPdfUpper(item.room || `AMBIENTE ${index + 1}`), 10, columns.environment - 18),
      descriptionLines: buildClientDescriptionLines(item).flatMap((line) => wrapText(line, 9, columns.description - 14)),
      measureLines: wrapText(formatMeasureTableLabel(item.width, item.height), 9, columns.measures - 12),
      valueLabel: formatCurrencyValueOnly(calculateLineItemTotal(item)),
    }
    const rowLineCount = Math.max(row.environmentLines.length, row.descriptionLines.length, row.measureLines.length)
    const rowHeight = Math.max(64, 18 + rowLineCount * 12)

    if (currentY - rowHeight < ORDER_TABLE_FOOTER_LIMIT_Y) {
      flushPage()
      startPage(true)
    }

    currentY -= drawOrderTableRow(commands, columns, row, currentY, true)
  })

  const totalsBlockHeight = payment.cashDiscountRate > 0 ? 58 : 30
  const infoBlockHeight = 112

  if (currentY - totalsBlockHeight - infoBlockHeight < 60) {
    flushPage()
    startPage(true)
  }

  const valueColumnX = ORDER_TABLE_X + columns.environment + columns.description + columns.measures

  drawStrokeRect(commands, ORDER_TABLE_X, currentY - 30, ORDER_TABLE_WIDTH, 30, COLORS.gridDark)
  drawLine(commands, valueColumnX, currentY, valueColumnX, currentY - 30, COLORS.gridDark)
  drawRightAlignedText(commands, 'TOTAL .............................................', valueColumnX - 12, currentY - 20, {
    size: 10,
    bold: true,
    color: COLORS.textDark,
  })
  drawRightAlignedText(commands, formatCurrencyValueOnly(payment.baseTotal), ORDER_TABLE_X + ORDER_TABLE_WIDTH - 10, currentY - 20, {
    size: 10,
    bold: true,
    color: COLORS.textDark,
  })
  currentY -= 30

  if (payment.cashDiscountRate > 0) {
    drawStrokeRect(commands, ORDER_TABLE_X, currentY - 28, ORDER_TABLE_WIDTH, 28, COLORS.gridDark)
    drawLine(commands, valueColumnX, currentY, valueColumnX, currentY - 28, COLORS.gridDark)
    drawRightAlignedText(commands, `DESCONTO PROMOCIONAL DE ${payment.cashDiscountRate}% ....................`, valueColumnX - 12, currentY - 18, {
      size: 9.5,
      bold: true,
      color: COLORS.textDark,
    })
    drawRightAlignedText(commands, formatCurrencyValueOnly(payment.cashTotal), ORDER_TABLE_X + ORDER_TABLE_WIDTH - 10, currentY - 18, {
      size: 10,
      bold: true,
      color: COLORS.textDark,
    })
    currentY -= 28
  }

  drawText(commands, '- Produtos sob medidas e por encomenda, nao podem ser alterados ou cancelados!', ORDER_TABLE_X, currentY - 10, {
    size: 8.5,
    color: COLORS.textDark,
  })
  currentY -= 52

  drawText(commands, `PRAZO DE ENTREGA: ${toPdfUpper(record.project.deliveryLeadTime || '20 DIAS')}`, ORDER_TABLE_X, currentY, {
    size: 10,
    color: COLORS.textDark,
  })
  currentY -= 28

  drawText(commands, `FORMA DE PAGAMENTO: DESCONTO A VISTA = ${formatCurrencyValueOnly(payment.cashTotal)}`, ORDER_TABLE_X, currentY, {
    size: 10.5,
    bold: true,
    color: COLORS.textDark,
  })
  currentY -= 28

  drawWrappedTextBlock(commands, `No pedido - ${paymentSummaryText} - EMISSAO ${record.project.createdAt || ''}`, ORDER_TABLE_X, currentY, ORDER_TABLE_WIDTH - 18, {
    size: 10,
    color: COLORS.textDark,
    lineHeight: 13,
    maxLines: 2,
  })

  flushPage()

  return pages
}

const buildSeamstressRows = (record: AdminQuoteRecord): OrderDocumentRow[] =>
  record.items.map((item, index) => {
    const descriptionLines = [
      toPdfUpper(item.category || 'CORTINA'),
      `TECIDO: ${toPdfUpper(item.fabric || 'NAO DEFINIDO')}${item.fabricColor ? ` - COR ${toPdfUpper(item.fabricColor)}` : ''}`,
      `BLACKOUT: ${toPdfUpper(formatBlackoutLabel(item.blackout))}${item.pleatModel ? ` | PREGAS: ${toPdfUpper(item.pleatModel)}` : ''}`,
      `TRILHO: ${toPdfUpper(item.trackType)} | DESLIZANTE: ${toPdfUpper(item.slider || 'PADRAO')}`,
      `TERMINAL: ${toPdfUpper(item.terminal || 'PADRAO')}`,
      item.notes ? `OBS: ${toPdfUpper(item.notes)}` : '',
    ].filter(Boolean)

    return {
      environmentLines: wrapText(toPdfUpper(item.room || `AMBIENTE ${index + 1}`), 10, 66),
      descriptionLines: descriptionLines.flatMap((line) => wrapText(line, 9, 290)),
      measureLines: wrapText(formatMeasureTableLabel(item.width, item.height), 9, 86),
    }
  })

const buildInstallerRows = (record: AdminQuoteRecord): OrderDocumentRow[] => {
  const summary = buildInstallerInstallationSummary(record)

  return summary.items.map((item, index) => {
    const descriptionLines = [
      `${toPdfUpper(item.category)} | ${toPdfUpper(item.openingLabel)}`,
      `QUANTIDADE: ${item.quantity} | METROS INSTALACAO: ${item.installationMeters.toFixed(2).replace('.', ',')} M`,
      item.notes ? `OBS: ${toPdfUpper(item.notes)}` : '',
    ].filter(Boolean)

    return {
      environmentLines: wrapText(toPdfUpper(item.room || `AMBIENTE ${index + 1}`), 10, 66),
      descriptionLines: descriptionLines.flatMap((line) => wrapText(line, 9, 290)),
      measureLines: wrapText(toPdfUpper(item.dimensionsLabel), 9, 86),
    }
  })
}

const createOperationalQuoteStreams = (record: AdminQuoteRecord, kind: 'costureira' | 'instalador') => {
  const pages: string[] = []
  const columns = getOrderDocumentColumns(false)
  const rows = kind === 'costureira' ? buildSeamstressRows(record) : buildInstallerRows(record)
  const installerSummary = kind === 'instalador' ? buildInstallerInstallationSummary(record) : null
  const documentTitle = kind === 'costureira' ? 'PEDIDO DE COSTURA' : 'PEDIDO DE INSTALACAO'
  const responsibleName = kind === 'costureira' ? record.seamstress.name : record.installer.name
  const responsibleContact = kind === 'costureira'
    ? (record.seamstress.email || record.seamstress.whatsapp || 'Pendente')
    : (record.installer.email || record.installer.whatsapp || 'Pendente')
  const operationalNotes = kind === 'costureira'
    ? (record.seamstress.notes || record.project.notes || 'Sem observacoes adicionais para a confeccao.')
    : (record.installer.notes || record.project.notes || 'Sem observacoes adicionais para a instalacao.')

  let commands: string[] = []
  let currentY = 0

  const startPage = (continued = false) => {
    commands = []
    drawOrderDocumentHeader({
      commands,
      record,
      title: documentTitle,
      continued,
    })
    drawOrderTableHeader(commands, columns, false)
    currentY = ORDER_TABLE_HEADER_Y - ORDER_TABLE_HEADER_HEIGHT
  }

  const flushPage = () => {
    drawOrderDocumentFooter(commands)
    pages.push(commands.join('\n'))
  }

  startPage()

  rows.forEach((row) => {
    const rowLineCount = Math.max(row.environmentLines.length, row.descriptionLines.length, row.measureLines.length)
    const rowHeight = Math.max(64, 18 + rowLineCount * 12)

    if (currentY - rowHeight < ORDER_TABLE_FOOTER_LIMIT_Y) {
      flushPage()
      startPage(true)
    }

    currentY -= drawOrderTableRow(commands, columns, row, currentY, false)
  })

  const summaryBlockHeight = kind === 'instalador' ? 78 : 48
  const notesBlockHeight = 52

  if (currentY - summaryBlockHeight - notesBlockHeight < 60) {
    flushPage()
    startPage(true)
  }

  drawStrokeRect(commands, ORDER_TABLE_X, currentY - 28, ORDER_TABLE_WIDTH, 28, COLORS.gridDark)
  drawWrappedTextBlock(
    commands,
    `RESPONSAVEL: ${toPdfUpper(responsibleName || 'NAO INFORMADO')} | CONTATO: ${toPdfUpper(responsibleContact)}`,
    ORDER_TABLE_X + 10,
    currentY - 18,
    ORDER_TABLE_WIDTH - 20,
    {
      size: 9.5,
      bold: true,
      color: COLORS.textDark,
      lineHeight: 11,
      maxLines: 2,
    },
  )
  currentY -= 28

  if (kind === 'instalador' && installerSummary) {
    drawStrokeRect(commands, ORDER_TABLE_X, currentY - 28, ORDER_TABLE_WIDTH, 28, COLORS.gridDark)
    drawWrappedTextBlock(
      commands,
      `DATA DE INSTALACAO/ENTREGA: ${toPdfUpper(installerSummary.installationDate || 'PENDENTE')} | TOTAL DE METROS: ${installerSummary.totalMeters.toFixed(2).replace('.', ',')} M`,
      ORDER_TABLE_X + 10,
      currentY - 18,
      ORDER_TABLE_WIDTH - 20,
      {
        size: 9.5,
        bold: true,
        color: COLORS.textDark,
        lineHeight: 11,
        maxLines: 2,
      },
    )
    currentY -= 28
  }

  drawText(commands, '- Documento operacional sem exposicao de valores comerciais.', ORDER_TABLE_X, currentY - 10, {
    size: 8.5,
    color: COLORS.textDark,
  })
  currentY -= 34

  drawWrappedTextBlock(commands, toPdfUpper(operationalNotes), ORDER_TABLE_X, currentY, ORDER_TABLE_WIDTH - 18, {
    size: 10,
    color: COLORS.textDark,
    lineHeight: 13,
    maxLines: 3,
  })

  flushPage()

  return pages
}

export const generateQuotePdf = (record: AdminQuoteRecord, kind: QuoteDocumentKind) => {
  if (kind === 'cliente') {
    const streams = createClientQuoteStreams(record)

    return {
      filename: getDocumentSummary(record, kind).filename,
      bytes: buildPdfFromStreams(streams),
    }
  }

  if (kind === 'instalador' || kind === 'costureira') {
    const streams = createOperationalQuoteStreams(record, kind)

    return {
      filename: getDocumentSummary(record, kind).filename,
      bytes: buildPdfFromStreams(streams),
    }
  }

  const { summary, lines } = createGenericDocumentLines(record, kind)
  const streams = buildContentStream(lines)
  const bytes = buildPdfFromStreams(streams)

  return {
    filename: summary.filename,
    bytes,
  }
}
