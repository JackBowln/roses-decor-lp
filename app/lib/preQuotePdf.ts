import { siteConfig } from '@/lib/site'
import {
  buildPreQuoteBudgetDescription,
  formatPreQuoteMeasureLabel,
  type CustomerRecord,
  type PreQuoteItemRecord,
  type PreQuoteRecord,
} from '@/lib/quoteWorkspace'

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const encoder = new TextEncoder()

const COLORS = {
  black: [0, 0, 0],
  white: [1, 1, 1],
  accent: [0.6862745, 0.6627451, 0.4745098],
  navy: [0.05882353, 0.14117648, 0.24313726],
  lightGray: [0.9019608, 0.9019608, 0.9019608],
  muted: [0.28, 0.28, 0.28],
  red: [0.82, 0.1, 0.1],
} as const

type PdfColor = readonly [number, number, number]

interface PreQuotePdfInput {
  customer: CustomerRecord
  preQuote: PreQuoteRecord
}

const escapePdfText = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')

const byteLength = (value: string) => encoder.encode(value).length
const colorToPdf = ([r, g, b]: PdfColor) => `${r} ${g} ${b}`
const lineWidth = (text: string, size: number) => text.length * size * 0.49

const wrapText = (text: string, size: number, maxWidth: number) => {
  const safeText = text.trim() || '-'
  const words = safeText.split(/\s+/)
  const lines: string[] = []
  let current = ''

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word

    if (!current || lineWidth(next, size) <= maxWidth) {
      current = next
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
  font?: 'F1' | 'F2' | 'F3'
  color?: PdfColor
}) => {
  commands.push(
    `BT /${options?.font || 'F1'} ${options?.size || 12} Tf ${colorToPdf(options?.color || COLORS.black)} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`,
  )
}

const drawWrapped = (commands: string[], text: string, x: number, y: number, width: number, options?: {
  size?: number
  font?: 'F1' | 'F2' | 'F3'
  color?: PdfColor
  lineHeight?: number
  maxLines?: number
}) => {
  const size = options?.size || 12
  const lineHeight = options?.lineHeight || Math.round(size * 1.35)
  const lines = wrapText(text, size, width).slice(0, options?.maxLines || 99)

  lines.forEach((line, index) => {
    drawText(commands, line, x, y - index * lineHeight, {
      size,
      font: options?.font,
      color: options?.color,
    })
  })
}

const drawRect = (commands: string[], x: number, y: number, width: number, height: number, color: PdfColor) => {
  commands.push(`${colorToPdf(color)} rg ${x} ${y} ${width} ${height} re f`)
}

const drawStrokeRect = (commands: string[], x: number, y: number, width: number, height: number, color: PdfColor, lineWidthValue = 1) => {
  commands.push(`${colorToPdf(color)} RG ${lineWidthValue} w ${x} ${y} ${width} ${height} re S`)
}

const drawLine = (commands: string[], x1: number, y1: number, x2: number, y2: number, color: PdfColor, width = 1) => {
  commands.push(`${colorToPdf(color)} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`)
}

const buildPdf = (streams: string[]) => {
  const objects: string[] = []
  const pages: number[] = []
  let nextId = 5

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = ''
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>'
  nextId = 6

  streams.forEach((stream) => {
    const contentId = nextId++
    const pageId = nextId++
    objects[contentId] = `<< /Length ${byteLength(stream)} >>\nstream\n${stream}endstream`
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>`
    pages.push(pageId)
  })

  objects[2] = `<< /Type /Pages /Kids [${pages.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`

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
  return encoder.encode(pdf)
}

const buildPage = (input: PreQuotePdfInput, items: PreQuoteItemRecord[], pageIndex: number, pageCount: number) => {
  const commands: string[] = []
  const left = 38
  const width = PAGE_WIDTH - left * 2
  const tableTop = 612
  const rowHeight = 42
  const headerBottom = 760
  const infoBottom = 680
  const tableBottom = tableTop - rowHeight * 5
  const summaryBottom = tableBottom - 54
  const conditionsBottom = 308
  const paymentBottom = 102

  drawText(commands, `Contatos: roses.designer.interiores@gmail.com - ${siteConfig.contact.whatsappDisplay} - ${siteConfig.contact.instagramHandle}`, 28, 808, {
    size: 9,
    color: COLORS.black,
  })

  drawWrapped(commands, "Rose's", left, 750, 160, {
    size: 28,
    font: 'F3',
    color: COLORS.accent,
    maxLines: 1,
  })
  drawText(commands, 'Roses Decor', left, 714, { size: 13, font: 'F2', color: COLORS.black })
  drawText(commands, 'Pré-orçamento para cliente', left + 185, 714, { size: 12, font: 'F2', color: COLORS.black })
  drawText(commands, input.preQuote.code, PAGE_WIDTH - 120, 714, { size: 12, font: 'F2', color: COLORS.red })

  drawRect(commands, left, infoBottom, 140, headerBottom - infoBottom, COLORS.lightGray)
  drawStrokeRect(commands, left, infoBottom, width, headerBottom - infoBottom, COLORS.black, 1.2)
  drawLine(commands, left + 140, infoBottom, left + 140, headerBottom, COLORS.black)
  drawLine(commands, left, 720, left + width, 720, COLORS.black)
  drawLine(commands, left, 696, left + width, 696, COLORS.black)
  drawLine(commands, left, 672, left + width, 672, COLORS.black)

  drawText(commands, 'Cliente:', left + 10, 744, { size: 11, font: 'F2', color: COLORS.black })
  drawText(commands, 'Localização:', left + 10, 720 + 6, { size: 11, font: 'F2', color: COLORS.black })
  drawText(commands, 'WhatsApp:', left + 10, 696 + 6, { size: 11, font: 'F2', color: COLORS.black })
  drawText(commands, 'Data do Pré-orçamento:', left + 10, 672 + 6, { size: 11, font: 'F2', color: COLORS.black })

  drawWrapped(commands, input.customer.name || '-', left + 146, 744, width - 156, { size: 11, color: COLORS.black, maxLines: 1 })
  drawWrapped(commands, input.customer.locationLabel || '-', left + 146, 726, width - 156, { size: 11, color: COLORS.black, maxLines: 1 })
  drawWrapped(commands, input.customer.whatsapp || '-', left + 146, 702, width - 156, { size: 11, color: COLORS.black, maxLines: 1 })
  drawWrapped(commands, new Date(input.preQuote.createdAt).toLocaleDateString('pt-BR'), left + 146, 678, width - 156, { size: 11, color: COLORS.black, maxLines: 1 })

  drawText(commands, 'AMBIENTE', left + 10, tableTop + 12, { size: 11, font: 'F2', color: COLORS.accent })
  drawText(commands, 'DESCRIÇÃO', left + 175, tableTop + 12, { size: 11, font: 'F2', color: COLORS.accent })
  drawText(commands, 'VALOR TOTAL', PAGE_WIDTH - 124, tableTop + 12, { size: 11, font: 'F2', color: COLORS.accent })

  drawStrokeRect(commands, left, tableBottom, width, tableTop - tableBottom, COLORS.black)
  drawLine(commands, left + 130, tableBottom, left + 130, tableTop, COLORS.black)
  drawLine(commands, left + 430, tableBottom, left + 430, tableTop, COLORS.black)

  for (let index = 1; index < 5; index += 1) {
    drawLine(commands, left, tableTop - rowHeight * index, left + width, tableTop - rowHeight * index, COLORS.black)
  }

  items.forEach((item, index) => {
    const topY = tableTop - rowHeight * index - 18
    drawWrapped(commands, item.environment, left + 8, topY, 112, { size: 10, font: 'F2', color: COLORS.black, maxLines: 2, lineHeight: 11 })
    drawWrapped(commands, buildPreQuoteBudgetDescription(item), left + 138, topY, 286, { size: 9.5, color: COLORS.black, maxLines: 2, lineHeight: 11 })
    drawWrapped(commands, formatPreQuoteMeasureLabel(item), left + 138, topY - 22, 286, { size: 8.5, color: COLORS.muted, maxLines: 1 })
    drawWrapped(commands, 'A confirmar', left + 438, topY, 92, { size: 11, font: 'F2', color: COLORS.black, maxLines: 1 })
  })

  drawStrokeRect(commands, left, summaryBottom, width, 38, COLORS.black, 1.2)
  drawText(commands, 'TOTAL', left + 10, summaryBottom + 14, { size: 13, font: 'F2', color: COLORS.black })
  drawWrapped(commands, 'A confirmar após visita técnica e definição final dos materiais.', left + 360, summaryBottom + 14, 170, { size: 10, font: 'F2', color: COLORS.black, maxLines: 2, lineHeight: 11 })

  drawText(commands, 'DESCONTO PROMOCIONAL', left + 10, summaryBottom - 28, { size: 11, font: 'F2', color: COLORS.black })
  drawText(commands, '20%', left + 182, summaryBottom - 28, { size: 11, font: 'F2', color: COLORS.black })
  drawText(commands, 'TOTAL COM DESCONTO:', left + 222, summaryBottom - 28, { size: 11, font: 'F2', color: COLORS.black })
  drawText(commands, 'A confirmar', PAGE_WIDTH - 124, summaryBottom - 28, { size: 12, font: 'F2', color: COLORS.black })

  drawText(commands, 'CONDIÇÕES DA VENDA', left + 10, conditionsBottom + 140, { size: 12, font: 'F2', color: COLORS.accent })
  drawLine(commands, left + 180, conditionsBottom + 138, left + 368, conditionsBottom + 138, COLORS.accent)
  drawText(commands, 'PRAZO DE ENTREGA', left + 10, conditionsBottom + 96, { size: 10.5, font: 'F2', color: COLORS.black })
  drawWrapped(commands, 'Sob análise após confirmação do projeto.', left + 174, conditionsBottom + 96, 318, { size: 10.5, font: 'F1', color: COLORS.black, maxLines: 1 })
  drawText(commands, 'INSTALAÇÃO:', left + 10, conditionsBottom + 72, { size: 10.5, font: 'F2', color: COLORS.black })
  drawWrapped(commands, 'Será definida no orçamento final.', left + 174, conditionsBottom + 72, 318, { size: 10.5, font: 'F1', color: COLORS.black, maxLines: 1 })
  drawWrapped(commands, 'Pré-orçamento indicativo. Valores e condições comerciais serão confirmados no orçamento final, após medição técnica e escolha definitiva dos materiais.', left + 10, conditionsBottom + 38, width - 20, {
    size: 9.5,
    font: 'F1',
    color: COLORS.black,
    maxLines: 3,
    lineHeight: 11,
  })
  drawWrapped(commands, input.preQuote.measuresPendingNote, left + 10, conditionsBottom + 4, width - 20, {
    size: 9.5,
    font: 'F1',
    color: COLORS.black,
    maxLines: 2,
    lineHeight: 11,
  })

  drawText(commands, 'OPÇÕES DE PAGAMENTO:', left + 10, paymentBottom + 160, { size: 12, font: 'F2', color: COLORS.accent })
  drawLine(commands, left + 178, paymentBottom + 158, left + 372, paymentBottom + 158, COLORS.accent)
  drawStrokeRect(commands, left, paymentBottom, width, 132, COLORS.black)
  drawLine(commands, left + 160, paymentBottom, left + 160, paymentBottom + 132, COLORS.black)
  drawLine(commands, left + 328, paymentBottom, left + 328, paymentBottom + 132, COLORS.black)
  drawLine(commands, left, paymentBottom + 96, left + width, paymentBottom + 96, COLORS.black)
  drawLine(commands, left, paymentBottom + 64, left + width, paymentBottom + 64, COLORS.black)
  drawLine(commands, left, paymentBottom + 32, left + width, paymentBottom + 32, COLORS.black)

  drawText(commands, 'Total do Desconto', left + 10, paymentBottom + 108, { size: 10.5, font: 'F2', color: COLORS.black })
  drawText(commands, 'Forma de Pagamento', left + 176, paymentBottom + 108, { size: 10.5, font: 'F2', color: COLORS.black })
  drawText(commands, 'Observação', left + 344, paymentBottom + 108, { size: 10.5, font: 'F2', color: COLORS.black })

  const paymentRows = [
    ['DESCONTO 20%', 'À vista', 'Confirmado no orçamento final'],
    ['DESCONTO 10%', 'Cartão de crédito (3x)', 'Condição sujeita à análise comercial'],
    ['10x sem juros', 'Cartão de crédito (10x)', 'Disponibilidade conforme negociação'],
  ]

  paymentRows.forEach((row, index) => {
    const y = paymentBottom + 76 - index * 32
    drawWrapped(commands, row[0], left + 10, y, 140, { size: 10, font: 'F2', color: COLORS.black, maxLines: 1 })
    drawWrapped(commands, row[1], left + 170, y, 148, { size: 10, font: 'F1', color: COLORS.black, maxLines: 1 })
    drawWrapped(commands, row[2], left + 338, y, 190, { size: 9, font: 'F1', color: COLORS.black, maxLines: 2, lineHeight: 10 })
  })

  drawText(commands, `Página ${pageIndex + 1} de ${pageCount}`, PAGE_WIDTH - 88, 36, { size: 9, color: COLORS.muted })

  return commands.join('\n') + '\n'
}

export const generatePreQuotePdf = (input: PreQuotePdfInput) => {
  const pageSize = 4
  const pages: string[] = []

  for (let offset = 0; offset < input.preQuote.items.length; offset += pageSize) {
    pages.push(buildPage(input, input.preQuote.items.slice(offset, offset + pageSize), offset / pageSize, Math.ceil(input.preQuote.items.length / pageSize) || 1))
  }

  return {
    filename: `${input.preQuote.code.toLowerCase()}.pdf`,
    bytes: buildPdf(pages.length > 0 ? pages : [buildPage(input, [], 0, 1)]),
  }
}
