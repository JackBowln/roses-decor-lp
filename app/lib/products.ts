export interface ProductFeature {
  title: string
  description: string
}

export interface ProductNarrativeBlock {
  eyebrow: string
  title: string
  description: string
}

export interface ProductGalleryImage {
  src: string
  alt: string
  caption: string
  width?: number
  height?: number
  modifiers?: Record<string, string | number>
}

export interface ProductDetail {
  slug: string
  title: string
  eyebrow: string
  shortDescription: string
  seoDescription: string
  heroTitle: string
  heroLead: string
  cardImage: string
  heroImage: string
  heroTextureImage: string
  accentLabel: string
  moodLine: string
  benefits: ProductFeature[]
  narrative: ProductNarrativeBlock[]
  gallery: ProductGalleryImage[]
  persuasiveBullets: string[]
}

const localProductImages = {
  curtains: {
    cardImage: '/images/hero_br.png',
    heroImage: '/images/hero.png',
    heroTextureImage: '/images/hero_br.png',
    gallery: [
      {
        src: '/images/hero.png',
        alt: 'Sala com cortinas em tecido do piso ao teto',
        caption: 'Cortinas amplas valorizam o pé-direito e deixam a composição mais elegante.',
        width: 1080,
        height: 1440,
        modifiers: { fit: 'cover', position: 'center' },
      },
      {
        src: '/images/hero_br.png',
        alt: 'Close de cortina em tecido bege com caimento leve',
        caption: 'A leitura do tecido de perto reforça conforto visual e acabamento sob medida.',
        width: 960,
        height: 1280,
        modifiers: { fit: 'cover', position: 'center' },
      },
      {
        src: '/images/hero.png',
        alt: 'Ambiente amplo com cortinas neutras e luz natural filtrada',
        caption: 'A entrada de luz fica suave sem perder a sensação de amplitude do ambiente.',
        width: 1280,
        height: 920,
        modifiers: { fit: 'cover', position: 'top' },
      },
      {
        src: '/images/hero_br.png',
        alt: 'Detalhe de cortina em tecido em ambiente sofisticado',
        caption: 'Dobras, textura e cor certa fazem a cortina parecer parte natural do projeto.',
        width: 920,
        height: 1380,
        modifiers: { fit: 'cover', position: 'right' },
      },
    ],
  },
  rollerBlinds: {
    cardImage: '/images/roller_br.png',
    heroImage: '/images/roller-blinds.png',
    heroTextureImage: '/images/roller_br.png',
    gallery: [
      {
        src: '/images/roller-blinds.png',
        alt: 'Ambiente corporativo com persianas rolo instaladas',
        caption: 'A persiana rolo mantém a arquitetura limpa e controla a luz com precisão.',
        width: 1080,
        height: 1440,
        modifiers: { fit: 'cover', position: 'center' },
      },
      {
        src: '/images/roller_br.png',
        alt: 'Close de persiana rolo em janela residencial',
        caption: 'O desenho reto e discreto favorece projetos atuais e de baixa manutenção.',
        width: 960,
        height: 1280,
        modifiers: { fit: 'cover', position: 'center' },
      },
      {
        src: '/images/roller-blinds.png',
        alt: 'Persianas rolo em grandes aberturas com visual minimalista',
        caption: 'Funciona muito bem em panos de vidro e composições com linguagem contemporânea.',
        width: 1280,
        height: 920,
        modifiers: { fit: 'cover', position: 'top' },
      },
      {
        src: '/images/roller_br.png',
        alt: 'Detalhe técnico de persiana rolo com tecido claro',
        caption: 'Um produto enxuto que entrega privacidade, conforto luminotécnico e ordem visual.',
        width: 920,
        height: 1380,
        modifiers: { fit: 'cover', position: 'left' },
      },
    ],
  },
  woodenBlinds: {
    cardImage: '/images/wooden_br.png',
    heroImage: '/images/wooden_br.png',
    heroTextureImage: '/images/wooden-blinds.png',
    gallery: [
      {
        src: '/images/wooden_br.png',
        alt: 'Quarto com persianas de madeira e atmosfera acolhedora',
        caption: 'A madeira aquece o ambiente e adiciona presença sem sobrecarregar a composição.',
        width: 1080,
        height: 1440,
        modifiers: { fit: 'cover', position: 'center' },
      },
      {
        src: '/images/wooden-blinds.png',
        alt: 'Close de persiana de madeira com textura natural',
        caption: 'As lâminas criam ritmo visual e deixam o controle de luz mais refinado.',
        width: 960,
        height: 1280,
        modifiers: { fit: 'cover', position: 'center' },
      },
      {
        src: '/images/wooden_br.png',
        alt: 'Persianas de madeira em ambiente sofisticado com luz lateral',
        caption: 'Materialidade, calor e elegância aparecem imediatamente na leitura do espaço.',
        width: 1280,
        height: 920,
        modifiers: { fit: 'cover', position: 'top' },
      },
      {
        src: '/images/wooden-blinds.png',
        alt: 'Detalhe de lâminas de madeira em composição premium',
        caption: 'Uma solução marcante para projetos que pedem acabamento mais autoral.',
        width: 920,
        height: 1380,
        modifiers: { fit: 'cover', position: 'right' },
      },
    ],
  },
} as const satisfies Record<
  string,
  {
    cardImage: string
    heroImage: string
    heroTextureImage: string
    gallery: ProductGalleryImage[]
  }
>

export const products: ProductDetail[] = [
  {
    slug: 'cortinas-em-tecido',
    title: 'Cortinas em Tecido',
    eyebrow: 'Alta Costura Para Interiores',
    shortDescription: 'Texturas nobres, caimento sob medida e uma presença elegante que muda a atmosfera da casa.',
    seoDescription:
      'Cortinas em tecido sob medida com caimento impecável, materiais premium e instalação profissional para salas, suítes e ambientes sofisticados.',
    heroTitle: 'Cortinas em tecido que vestem o ambiente com leveza e presença.',
    heroLead:
      'Ideal para quem quer suavizar a luz, valorizar o pé-direito e trazer uma sensação imediata de conforto visual sem pesar na composição.',
    ...localProductImages.curtains,
    accentLabel: 'Caimento impecável',
    moodLine: 'Mais acolhimento, profundidade visual e sofisticação em cada dobra.',
    benefits: [
      {
        title: 'Luz na medida certa',
        description: 'Combine voil, linho e blackout para controlar a luminosidade sem perder a suavidade da ambientação.',
      },
      {
        title: 'Presença arquitetônica',
        description: 'As cortinas alongam visualmente a parede e valorizam proporções, pé-direito e volumetria do espaço.',
      },
      {
        title: 'Acabamento de alto padrão',
        description: 'Escolhemos tecidos, pregas e ferragens pensando no resultado final, não apenas na peça isolada.',
      },
    ],
    narrative: [
      {
        eyebrow: 'Conforto visual',
        title: 'A primeira sensação do ambiente muda quando a luz encontra a textura certa.',
        description:
          'Cortinas em tecido bem escolhidas filtram a claridade, criam profundidade e fazem a casa parecer mais calma, refinada e convidativa.',
      },
      {
        eyebrow: 'Personalização',
        title: 'Cada projeto recebe o tecido, o volume e o caimento que fazem sentido para a rotina do cliente.',
        description:
          'Há espaços que pedem leveza etérea, outros pedem privacidade e densidade. O desenho sob medida evita excessos e entrega equilíbrio.',
      },
    ],
    persuasiveBullets: [
      'Perfeitas para salas, suítes e ambientes onde aconchego e sofisticação precisam coexistir.',
      'Permitem combinar estética, privacidade e conforto térmico de forma elegante.',
      'Têm forte percepção de valor e elevam imediatamente a leitura visual do imóvel.',
    ],
  },
  {
    slug: 'persianas-rolo',
    title: 'Persianas Rolo',
    eyebrow: 'Minimalismo De Alta Performance',
    shortDescription: 'Linhas limpas, operação prática e controle de luz preciso para espaços modernos.',
    seoDescription:
      'Persianas rolo sob medida com visual contemporâneo, tecidos técnicos e instalação precisa para salas, escritórios e quartos.',
    heroTitle: 'Persianas rolo para projetos que pedem leveza visual e precisão no controle da luz.',
    heroLead:
      'Uma solução versátil para quem busca um ambiente organizado, contemporâneo e funcional, sem abrir mão de elegância.',
    ...localProductImages.rollerBlinds,
    accentLabel: 'Geometria elegante',
    moodLine: 'Uma estética enxuta que organiza o ambiente e valoriza a arquitetura.',
    benefits: [
      {
        title: 'Visual limpo',
        description: 'O recolhimento discreto deixa a janela mais leve e permite que a arquitetura respire.',
      },
      {
        title: 'Operação intuitiva',
        description: 'O uso no dia a dia é simples, fluido e combina muito bem com rotinas práticas.',
      },
      {
        title: 'Tecidos técnicos',
        description: 'Opções translúcidas, screen e blackout entregam conforto visual com excelente desempenho.',
      },
    ],
    narrative: [
      {
        eyebrow: 'Design contemporâneo',
        title: 'Quando o ambiente pede clareza visual, a persiana rolo resolve sem excessos.',
        description:
          'Ela organiza a leitura do espaço, acompanha marcenaria e superfícies retas com muita naturalidade e mantém tudo mais atual.',
      },
      {
        eyebrow: 'Praticidade que convence',
        title: 'Boa estética e boa rotina precisam caminhar juntas.',
        description:
          'A abertura rápida, a limpeza simples e o desempenho consistente fazem da persiana rolo uma escolha fácil de manter e agradável de usar.',
      },
    ],
    persuasiveBullets: [
      'Excelente escolha para apartamentos atuais, home offices e áreas sociais com linguagem contemporânea.',
      'Entrega um equilíbrio raro entre visual discreto, tecnologia têxtil e praticidade real no dia a dia.',
      'Ajuda a manter o ambiente organizado, luminoso e sofisticado sem exigir muita manutenção.',
    ],
  },
  {
    slug: 'persianas-de-madeira',
    title: 'Persianas de Madeira',
    eyebrow: 'Matéria-prima com Presença',
    shortDescription: 'Calor natural, controle de luz refinado e um visual marcante para interiores autorais.',
    seoDescription:
      'Persianas de madeira sob medida com presença natural, controle de luz elegante e acabamento premium para ambientes sofisticados.',
    heroTitle: 'Persianas de madeira para espaços que pedem personalidade, calor e controle de luz refinado.',
    heroLead:
      'Uma escolha para interiores mais autorais, onde textura, materialidade e elegância precisam aparecer sem exagero.',
    ...localProductImages.woodenBlinds,
    accentLabel: 'Textura nobre',
    moodLine: 'A madeira aquece o espaço e transforma a luz em uma experiência mais sensorial.',
    benefits: [
      {
        title: 'Materialidade autêntica',
        description: 'A presença da madeira traz profundidade, calor e uma sensação imediata de sofisticação.',
      },
      {
        title: 'Luz esculpida',
        description: 'As lâminas permitem um ajuste fino da luminosidade, criando cenas elegantes ao longo do dia.',
      },
      {
        title: 'Visual memorável',
        description: 'É o tipo de solução que chama atenção pelo bom gosto, não pelo excesso.',
      },
    ],
    narrative: [
      {
        eyebrow: 'Atmosfera',
        title: 'A madeira faz o ambiente parecer mais rico, mais vivo e mais acolhedor.',
        description:
          'Ela conversa muito bem com pedra, couro, linho, metal escovado e marcenaria sob medida, criando interiores de presença madura.',
      },
      {
        eyebrow: 'Valor percebido',
        title: 'Poucos elementos elevam tanto a leitura do espaço quanto uma boa persiana de madeira.',
        description:
          'Além do controle de luz, ela se torna parte da identidade do ambiente e transmite sensação clara de projeto bem resolvido.',
      },
    ],
    persuasiveBullets: [
      'Indicadas para projetos com identidade forte e preocupação real com acabamento e materialidade.',
      'Ajudam a transformar luz natural em atmosfera, não apenas em iluminação.',
      'Têm alto valor percebido e funcionam muito bem em salas, escritórios e suítes premium.',
    ],
  },
]

export const productCatalog = products.map((product) => ({
  slug: product.slug,
  title: product.title,
  description: product.shortDescription,
  image: product.cardImage,
  eyebrow: product.eyebrow,
}))

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug)
}
