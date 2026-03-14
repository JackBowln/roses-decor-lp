import {
  buildBudgetDescription,
  calculateLineItemTotal,
  calculatePaymentOptions,
  formatArea,
  formatCurrency,
  getDocumentSummary,
  type AdminQuoteRecord,
  type QuoteDocumentKind,
} from '@/lib/adminQuote'
import { buildInstallerInstallationSummary } from '@/lib/quoteWorkspace'

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
}) => {
  commands.push(
    `BT /${options?.bold ? 'F2' : 'F1'} ${options?.size ?? BODY_FONT_SIZE} Tf ${colorToPdf(options?.color ?? COLORS.textDark)} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(normalizeText(text))}) Tj ET`,
  )
}

const drawRect = (commands: string[], x: number, y: number, width: number, height: number, color: PdfRgbColor) => {
  commands.push(`${colorToPdf(color)} rg ${x} ${y} ${width} ${height} re f`)
}

const drawStrokeRect = (commands: string[], x: number, y: number, width: number, height: number, color: PdfRgbColor) => {
  commands.push(`${colorToPdf(color)} RG 1 w ${x} ${y} ${width} ${height} re S`)
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

const buildPdfFromStreams = (streams: string[]) => {
  const objects: string[] = []
  const pageObjectIds: number[] = []
  const fontRegularId = 3
  const fontBoldId = 4
  let nextObjectId = 5

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = ''
  objects[fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'

  streams.forEach((stream) => {
    const contentId = nextObjectId++
    const pageId = nextObjectId++
    const length = byteLength(stream)

    objects[contentId] = `<< /Length ${length} >>\nstream\n${stream}endstream`
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
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

const createClientQuoteStreams = (record: AdminQuoteRecord) => {
  const payment = calculatePaymentOptions(record)
  const pages: string[] = []
  const contentWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2
  const clientCardWidth = 310
  const conditionsCardX = PAGE_MARGIN_X + 326
  const conditionsCardWidth = contentWidth - clientCardWidth - 16
  const addressLine = [
    record.customer.address || 'Endereco pendente',
    record.customer.complement,
    record.customer.neighborhood,
    record.customer.city ? `${record.customer.city}${record.customer.state ? `/${record.customer.state}` : ''}` : '',
    record.customer.zipcode ? `CEP ${record.customer.zipcode}` : '',
  ].filter(Boolean).join(' | ')
  const tableColumns = {
    room: PAGE_MARGIN_X + 12,
    description: PAGE_MARGIN_X + 124,
    value: PAGE_WIDTH - PAGE_MARGIN_X - 88,
  }

  let commands: string[] = []
  let currentY = 0

  const startPage = (continued = false) => {
    commands = []
    drawRect(commands, PAGE_MARGIN_X, PAGE_HEIGHT - 146, contentWidth, 104, COLORS.warmSurfaceStrong)
    drawText(commands, "Rose's Cortinas e Persianas", PAGE_MARGIN_X + 18, PAGE_HEIGHT - 78, {
      size: 18,
      bold: true,
      color: COLORS.textDark,
    })
    drawText(commands, continued ? `Orcamento ${record.project.code} - continuacao` : `Orcamento ${record.project.code}`, PAGE_MARGIN_X + 18, PAGE_HEIGHT - 102, {
      size: 12,
      color: COLORS.textMuted,
    })
    drawText(commands, `Emitido em ${record.project.createdAt} | Validade ${record.project.validUntil}`, PAGE_MARGIN_X + 18, PAGE_HEIGHT - 118, {
      size: 10,
      color: COLORS.textMuted,
    })

    drawRect(commands, PAGE_MARGIN_X, PAGE_HEIGHT - 262, clientCardWidth, 92, COLORS.warmSurface)
    drawStrokeRect(commands, PAGE_MARGIN_X, PAGE_HEIGHT - 262, clientCardWidth, 92, COLORS.border)
    drawText(commands, 'Cliente', PAGE_MARGIN_X + 16, PAGE_HEIGHT - 190, { size: 11, bold: true, color: COLORS.accent })
    drawWrappedTextBlock(commands, record.customer.name || 'Nome do cliente', PAGE_MARGIN_X + 16, PAGE_HEIGHT - 208, clientCardWidth - 32, {
      size: 15,
      bold: true,
      maxLines: 1,
    })
    drawWrappedTextBlock(commands, `${record.customer.phone || 'Telefone pendente'} | ${record.customer.email || 'E-mail pendente'}`, PAGE_MARGIN_X + 16, PAGE_HEIGHT - 226, clientCardWidth - 32, {
      size: 9,
      color: COLORS.textMuted,
      lineHeight: 11,
      maxLines: 2,
    })
    drawWrappedTextBlock(commands, addressLine, PAGE_MARGIN_X + 16, PAGE_HEIGHT - 248, clientCardWidth - 32, {
      size: 9,
      color: COLORS.textMuted,
      lineHeight: 11,
      maxLines: 2,
    })

    drawRect(commands, conditionsCardX, PAGE_HEIGHT - 262, conditionsCardWidth, 92, COLORS.white)
    drawStrokeRect(commands, conditionsCardX, PAGE_HEIGHT - 262, conditionsCardWidth, 92, COLORS.border)
    drawText(commands, 'Condicoes', conditionsCardX + 16, PAGE_HEIGHT - 190, { size: 11, bold: true, color: COLORS.accent })
    drawWrappedTextBlock(commands, `Prazo: ${record.project.deliveryLeadTime}`, conditionsCardX + 16, PAGE_HEIGHT - 208, conditionsCardWidth - 32, {
      size: 9,
      color: COLORS.textMuted,
      lineHeight: 11,
      maxLines: 1,
    })
    drawWrappedTextBlock(commands, `Instalacao: ${record.project.installationTerms}`, conditionsCardX + 16, PAGE_HEIGHT - 220, conditionsCardWidth - 32, {
      size: 9,
      color: COLORS.textMuted,
      lineHeight: 11,
      maxLines: 1,
    })
    drawWrappedTextBlock(commands, record.project.paymentTerms, conditionsCardX + 16, PAGE_HEIGHT - 232, conditionsCardWidth - 32, {
      size: 9,
      color: COLORS.textMuted,
      lineHeight: 11,
      maxLines: 2,
    })

    drawRect(commands, PAGE_MARGIN_X, PAGE_HEIGHT - 308, contentWidth, 26, COLORS.accent)
    drawText(commands, 'Ambiente', tableColumns.room, PAGE_HEIGHT - 292, { size: 10, bold: true, color: COLORS.white })
    drawText(commands, 'Descricao', tableColumns.description, PAGE_HEIGHT - 292, { size: 10, bold: true, color: COLORS.white })
    drawText(commands, 'Valor', tableColumns.value, PAGE_HEIGHT - 292, { size: 10, bold: true, color: COLORS.white })

    currentY = PAGE_HEIGHT - 328
  }

  const flushPage = () => {
    pages.push(commands.join('\n'))
  }

  startPage()

  record.items.forEach((item, index) => {
    const descriptionLines = wrapText(buildBudgetDescription(item), 10, 250)
    const metaLines = wrapText(`Vao: ${item.openingLabel || 'Nao informado'} | Medidas: ${formatArea(item.width, item.height)} | Qtd: ${item.quantity}`, 9, 250)
    const rowHeight = Math.max(42, 20 + descriptionLines.length * 12 + metaLines.length * 11)

    if (currentY - rowHeight < 170) {
      flushPage()
      startPage(true)
    }

    drawStrokeRect(commands, PAGE_MARGIN_X, currentY - rowHeight + 8, contentWidth, rowHeight, COLORS.border)
    drawText(commands, item.room || `Ambiente ${index + 1}`, tableColumns.room, currentY - 10, { size: 10, bold: true })

    descriptionLines.forEach((line, lineIndex) => {
      drawText(commands, line, tableColumns.description, currentY - 10 - lineIndex * 12, { size: 10, color: COLORS.textDark })
    })

    metaLines.forEach((line, lineIndex) => {
      drawText(commands, line, tableColumns.description, currentY - 24 - descriptionLines.length * 12 - lineIndex * 11, { size: 9, color: COLORS.textMuted })
    })

    drawText(commands, formatCurrency(calculateLineItemTotal(item)), tableColumns.value, currentY - 10, {
      size: 10,
      bold: true,
      color: COLORS.textDark,
    })

    currentY -= rowHeight
  })

  if (currentY < 174) {
    flushPage()
    startPage(true)
  }

  drawRect(commands, PAGE_MARGIN_X, 102, contentWidth, 56, COLORS.warmSurfaceStrong)
  drawText(commands, 'Total do projeto', PAGE_MARGIN_X + 16, 136, { size: 11, bold: true, color: COLORS.textDark })
  drawText(commands, formatCurrency(payment.baseTotal), PAGE_MARGIN_X + 16, 116, { size: 18, bold: true, color: COLORS.textDark })
  drawWrappedTextBlock(commands, `A vista (${payment.cashDiscountRate}%): ${formatCurrency(payment.cashTotal)}`, PAGE_MARGIN_X + 240, 136, 230, {
    size: 10,
    color: COLORS.textDark,
    lineHeight: 12,
    maxLines: 1,
  })
  drawWrappedTextBlock(commands, `${payment.cardInstallments}x com ${payment.cardDiscountRate}%: ${formatCurrency(payment.cardInstallmentValue)} por parcela`, PAGE_MARGIN_X + 240, 118, 230, {
    size: 10,
    color: COLORS.textDark,
    lineHeight: 12,
    maxLines: 2,
  })

  drawRect(commands, PAGE_MARGIN_X, 42, contentWidth, 46, COLORS.warmSurface)
  drawStrokeRect(commands, PAGE_MARGIN_X, 42, contentWidth, 46, COLORS.border)
  drawWrappedTextBlock(commands, record.project.notes || 'Orcamento sujeito a ajuste final conforme medidas e definicao de materiais.', PAGE_MARGIN_X + 14, 72, contentWidth - 28, {
    size: 9,
    color: COLORS.textMuted,
    lineHeight: 10,
    maxLines: 2,
  })
  drawText(commands, `Gerado em ${new Date().toLocaleString('pt-BR')}`, PAGE_MARGIN_X + 14, 52, { size: 8, color: COLORS.textMuted })

  flushPage()

  return pages
}

const createInstallerQuoteStreams = (record: AdminQuoteRecord) => {
  const summary = buildInstallerInstallationSummary(record)
  const pages: string[] = []
  const contentWidth = PAGE_WIDTH - PAGE_MARGIN_X * 2
  const clientCardWidth = 280
  const installerCardX = PAGE_MARGIN_X + clientCardWidth + 16
  const installerCardWidth = contentWidth - clientCardWidth - 16
  const columns = {
    environment: PAGE_MARGIN_X + 12,
    details: PAGE_MARGIN_X + 142,
    meters: PAGE_WIDTH - PAGE_MARGIN_X - 88,
  }

  let commands: string[] = []
  let currentY = 0

  const startPage = (continued = false) => {
    commands = []
    drawRect(commands, PAGE_MARGIN_X, PAGE_HEIGHT - 146, contentWidth, 104, COLORS.warmSurfaceStrong)
    drawText(commands, 'Ficha de instalacao', PAGE_MARGIN_X + 18, PAGE_HEIGHT - 78, {
      size: 18,
      bold: true,
      color: COLORS.textDark,
    })
    drawText(commands, continued ? `Projeto ${record.project.code} - continuacao` : `Projeto ${record.project.code}`, PAGE_MARGIN_X + 18, PAGE_HEIGHT - 102, {
      size: 12,
      color: COLORS.textMuted,
    })
    drawText(commands, `Data de instalacao/entrega ${summary.installationDate || 'pendente'} | Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PAGE_MARGIN_X + 18, PAGE_HEIGHT - 118, {
      size: 10,
      color: COLORS.textMuted,
    })

    drawRect(commands, PAGE_MARGIN_X, PAGE_HEIGHT - 282, clientCardWidth, 112, COLORS.warmSurface)
    drawStrokeRect(commands, PAGE_MARGIN_X, PAGE_HEIGHT - 282, clientCardWidth, 112, COLORS.border)
    drawText(commands, 'Cliente e obra', PAGE_MARGIN_X + 16, PAGE_HEIGHT - 190, {
      size: 11,
      bold: true,
      color: COLORS.accent,
    })
    drawWrappedTextBlock(commands, summary.customerName, PAGE_MARGIN_X + 16, PAGE_HEIGHT - 208, clientCardWidth - 32, {
      size: 15,
      bold: true,
      maxLines: 1,
    })
    drawWrappedTextBlock(commands, `${summary.customerPhone || 'Telefone pendente'} | ${summary.customerEmail || 'E-mail pendente'}`, PAGE_MARGIN_X + 16, PAGE_HEIGHT - 228, clientCardWidth - 32, {
      size: 9,
      color: COLORS.textMuted,
      lineHeight: 11,
      maxLines: 2,
    })
    drawWrappedTextBlock(commands, summary.addressLine, PAGE_MARGIN_X + 16, PAGE_HEIGHT - 252, clientCardWidth - 32, {
      size: 9,
      color: COLORS.textMuted,
      lineHeight: 11,
      maxLines: 3,
    })

    drawRect(commands, installerCardX, PAGE_HEIGHT - 282, installerCardWidth, 112, COLORS.white)
    drawStrokeRect(commands, installerCardX, PAGE_HEIGHT - 282, installerCardWidth, 112, COLORS.border)
    drawText(commands, 'Instalador responsavel', installerCardX + 16, PAGE_HEIGHT - 190, {
      size: 11,
      bold: true,
      color: COLORS.accent,
    })
    drawWrappedTextBlock(commands, record.installer.name || 'Nao informado', installerCardX + 16, PAGE_HEIGHT - 208, installerCardWidth - 32, {
      size: 15,
      bold: true,
      maxLines: 1,
    })
    drawWrappedTextBlock(commands, `${record.installer.whatsapp || 'WhatsApp pendente'} | ${record.installer.email || 'E-mail pendente'}`, installerCardX + 16, PAGE_HEIGHT - 228, installerCardWidth - 32, {
      size: 9,
      color: COLORS.textMuted,
      lineHeight: 11,
      maxLines: 2,
    })
    drawWrappedTextBlock(commands, `Itens instalaveis: ${summary.installableItemCount} | Total de metros: ${summary.totalMeters.toFixed(2)} m`, installerCardX + 16, PAGE_HEIGHT - 252, installerCardWidth - 32, {
      size: 9,
      color: COLORS.textDark,
      lineHeight: 11,
      maxLines: 2,
    })

    drawRect(commands, PAGE_MARGIN_X, PAGE_HEIGHT - 326, contentWidth, 26, COLORS.accent)
    drawText(commands, 'Ambiente', columns.environment, PAGE_HEIGHT - 310, { size: 10, bold: true, color: COLORS.white })
    drawText(commands, 'Detalhes tecnicos', columns.details, PAGE_HEIGHT - 310, { size: 10, bold: true, color: COLORS.white })
    drawText(commands, 'Metros', columns.meters, PAGE_HEIGHT - 310, { size: 10, bold: true, color: COLORS.white })

    currentY = PAGE_HEIGHT - 346
  }

  const flushPage = () => {
    pages.push(commands.join('\n'))
  }

  startPage()

  summary.items.forEach((item, index) => {
    const detailLines = [
      `${item.category} | ${item.openingLabel}`,
      `Medidas: ${item.dimensionsLabel} | Quantidade: ${item.quantity}`,
      item.notes ? `Observacoes: ${item.notes}` : '',
    ].filter(Boolean)
    const wrappedDetailLines = detailLines.flatMap((line) => wrapText(line, 9, 250))
    const rowHeight = Math.max(44, 20 + wrappedDetailLines.length * 12)

    if (currentY - rowHeight < 150) {
      flushPage()
      startPage(true)
    }

    drawStrokeRect(commands, PAGE_MARGIN_X, currentY - rowHeight + 8, contentWidth, rowHeight, COLORS.border)
    drawText(commands, item.room || `Item ${index + 1}`, columns.environment, currentY - 10, {
      size: 10,
      bold: true,
      color: COLORS.textDark,
    })

    wrappedDetailLines.forEach((line, lineIndex) => {
      drawText(commands, line, columns.details, currentY - 10 - lineIndex * 12, {
        size: 9,
        color: lineIndex === 0 ? COLORS.textDark : COLORS.textMuted,
      })
    })

    drawText(commands, `${item.installationMeters.toFixed(2)} m`, columns.meters, currentY - 10, {
      size: 10,
      bold: true,
      color: COLORS.textDark,
    })

    currentY -= rowHeight
  })

  if (currentY < 176) {
    flushPage()
    startPage(true)
  }

  drawRect(commands, PAGE_MARGIN_X, 104, contentWidth, 52, COLORS.warmSurfaceStrong)
  drawText(commands, 'Total de metros para instalacao', PAGE_MARGIN_X + 16, 136, {
    size: 11,
    bold: true,
    color: COLORS.textDark,
  })
  drawText(commands, `${summary.totalMeters.toFixed(2)} m`, PAGE_MARGIN_X + 16, 116, {
    size: 18,
    bold: true,
    color: COLORS.textDark,
  })

  drawRect(commands, PAGE_MARGIN_X, 42, contentWidth, 50, COLORS.warmSurface)
  drawStrokeRect(commands, PAGE_MARGIN_X, 42, contentWidth, 50, COLORS.border)
  drawWrappedTextBlock(commands, record.installer.notes || record.project.notes || 'Sem observacoes adicionais para instalacao.', PAGE_MARGIN_X + 14, 72, contentWidth - 28, {
    size: 9,
    color: COLORS.textMuted,
    lineHeight: 10,
    maxLines: 2,
  })
  drawText(commands, `Cliente: ${summary.customerName} | Projeto ${record.project.code}`, PAGE_MARGIN_X + 14, 52, {
    size: 8,
    color: COLORS.textMuted,
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

  if (kind === 'instalador') {
    const streams = createInstallerQuoteStreams(record)

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
