import { brandConfig, contactConfig } from '@/lib/appBrand'
import { publicQuoteFlowConfig, publicQuoteOptions, publicQuoteSteps } from '@/lib/publicQuoteConfig'

export interface NavigationLink {
  label: string
  to: string
  variant?: 'default' | 'primary'
}

export interface QuoteStep {
  id: string
  title: string
}

export const sectionIds = {
  products: 'produtos',
  preQuote: 'pre-orcamento',
} as const

export const siteConfig = {
  brand: {
    shortName: brandConfig.shortName,
    heroName: brandConfig.displayName,
    fullName: brandConfig.fullName,
    tagline: brandConfig.tagline,
    subLabel: brandConfig.subLabel,
    internalAreaLabel: brandConfig.internalAreaLabel,
  },
  seo: {
    title: "Rose's Cortinas e Persianas | Design sob Medida Premium",
    description:
      'Elegancia e sofisticacao em cortinas e persianas premium sob medida no Brasil. Transforme seu ambiente com exclusividade.',
  },
  contact: {
    whatsappNumber: contactConfig.whatsappNumber,
    whatsappDisplay: contactConfig.whatsappDisplay,
    instagramHandle: contactConfig.instagramHandle,
    instagramUrl: contactConfig.instagramUrl,
    companyEmail: contactConfig.companyEmail,
  },
  hero: {
    badge: 'Alta Costura para Janelas',
    title: 'Ambientes',
    rotatingWords: ['elegantes', 'sofisticados', 'exclusivos', 'modernos'],
    subtitle: 'com cortinas sob medida',
    description:
      'Design exclusivo, materiais premium e caimento impecavel. Vestimos sua casa com a elegancia que apenas a Roses Decor entrega.',
    mediaSrc: 'https://videos.pexels.com/video-files/4462151/4462151-uhd_2732_1440_25fps.mp4',
    posterSrc:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop',
    bgImageSrc:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1920&auto=format&fit=crop',
    date: 'Sofisticacao',
    scrollToExpand: 'Descubra a Elegancia',
  },
  cta: {
    quote: publicQuoteFlowConfig.section.title,
    whatsapp: publicQuoteFlowConfig.success.whatsappActionLabel,
  },
} as const

export const navigationLinks: NavigationLink[] = [
  { label: 'Produtos', to: `/#${sectionIds.products}` },
  { label: 'Orcamento', to: `/#${sectionIds.preQuote}`, variant: 'primary' },
]

export const serviceHighlights = [
  'Cortinas em Tecido',
  'Persianas Modernas',
  'Automatizacao',
  'Instalacao Profissional',
] as const

export const quoteFormSteps: QuoteStep[] = publicQuoteSteps
export const quoteFormOptions = publicQuoteOptions

export const whatsappUrl = `https://wa.me/${siteConfig.contact.whatsappNumber}`

export function buildWhatsAppUrl(message: string) {
  return `${whatsappUrl}?text=${encodeURIComponent(message)}`
}
