export interface NavigationLink {
  label: string
  href: string
  variant?: 'default' | 'primary'
}

export interface Product {
  title: string
  description: string
  image: string
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
    shortName: "Rose's",
    heroName: 'Roses Decor',
    fullName: "Rose's Cortinas e Persianas",
    tagline: 'Cortinas e Persianas sob medida.',
  },
  seo: {
    title: "Rose's Cortinas e Persianas | Design sob Medida Premium",
    description:
      'Elegância e sofisticação em cortinas e persianas premium sob medida no Brasil. Transforme seu ambiente com exclusividade.',
  },
  contact: {
    whatsappNumber: '5527998220461',
    whatsappDisplay: '+55 27 99822-0461',
    instagramHandle: '@roses_cortinas_persianas',
    instagramUrl: 'https://www.instagram.com/roses_cortinas_persianas/',
  },
  hero: {
    badge: 'Alta Costura para Janelas',
    title: 'Ambientes',
    rotatingWords: ['elegantes', 'sofisticados', 'exclusivos', 'modernos'],
    subtitle: 'com cortinas sob medida',
    description:
      'Design exclusivo, materiais premium e caimento impecável. Vestimos sua casa com a elegância que apenas a Roses Decor entrega.',
    mediaSrc: 'https://videos.pexels.com/video-files/4462151/4462151-uhd_2732_1440_25fps.mp4',
    posterSrc:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop',
    bgImageSrc:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1920&auto=format&fit=crop',
    date: 'Sofisticação',
    scrollToExpand: 'Descubra a Elegância',
  },
  cta: {
    quote: 'Solicitar Orçamento Grátis',
    whatsapp: 'Falar no WhatsApp',
  },
} as const

export const navigationLinks: NavigationLink[] = [
  { label: 'Produtos', href: `#${sectionIds.products}` },
  { label: 'Orçamento', href: `#${sectionIds.preQuote}`, variant: 'primary' },
]

export const productCatalog: Product[] = [
  {
    title: 'Cortinas em Tecido',
    description: 'Elegância clássica com tecidos nobres e acabamento impecável.',
    image: '/images/hero_br.png',
  },
  {
    title: 'Persianas Rolo',
    description: 'Minimalismo e controle de luz preciso para ambientes modernos.',
    image: '/images/roller_br.png',
  },
  {
    title: 'Persianas de Madeira',
    description: 'O toque natural e sofisticado que seu ambiente merece.',
    image: '/images/wooden_br.png',
  },
]

export const serviceHighlights = [
  'Cortinas em Tecido',
  'Persianas Modernas',
  'Automatização',
  'Instalação Profissional',
] as const

export const quoteFormSteps: QuoteStep[] = [
  { id: 'produto', title: 'Produto' },
  { id: 'ambiente', title: 'Ambiente' },
  { id: 'material', title: 'Material' },
  { id: 'medidas', title: 'Medidas' },
  { id: 'resumo', title: 'Resumo' },
  { id: 'contato', title: 'Contato' },
]

export const quoteFormOptions = {
  environments: ['Sala', 'Quarto', 'Escritório', 'Cozinha', 'Outro'],
  tecidos: ['Linho', 'Linho Rústico', 'Voil', 'Não sei ainda'],
  blackouts: ['70%', '100%', 'Sem Blackout'],
  persianas: ['Rolo', 'Madeira', 'Double Vision', 'Romana'],
} as const

export const whatsappUrl = `https://wa.me/${siteConfig.contact.whatsappNumber}`

export function buildWhatsAppUrl(message: string) {
  return `${whatsappUrl}?text=${encodeURIComponent(message)}`
}
