export type PublicQuoteStepId = 'produto' | 'ambiente' | 'material' | 'medidas' | 'resumo' | 'contato'

export interface PublicQuoteStep {
  id: PublicQuoteStepId
  title: string
}

export const publicQuoteSteps: PublicQuoteStep[] = [
  { id: 'produto', title: 'Produto' },
  { id: 'ambiente', title: 'Ambiente' },
  { id: 'material', title: 'Material' },
  { id: 'medidas', title: 'Medidas' },
  { id: 'resumo', title: 'Resumo' },
  { id: 'contato', title: 'Contato' },
]

export const publicQuoteOptions = {
  environments: ['Sala', 'Quarto', 'Escritorio', 'Cozinha', 'Outro'],
  tecidos: ['Linho', 'Linho Rustico', 'Voil', 'Nao sei ainda'],
  blackouts: ['70%', '100%', 'Sem Blackout'],
  persianas: ['Rolo', 'Madeira', 'Double Vision', 'Romana'],
} as const

export const publicQuoteFlowConfig = {
  autoAdvanceDelayMs: 300,
  section: {
    title: 'Solicitar Orcamento',
    description: 'Preencha os detalhes abaixo para que possamos entender melhor as suas necessidades e preparar um orcamento personalizado para voce.',
  },
  success: {
    title: 'Pre-orcamento salvo',
    whatsappActionLabel: 'Falar no WhatsApp',
    resetActionLabel: 'Fazer novo pre-orcamento',
    summaryLabels: {
      customer: 'Cliente',
      location: 'Localizacao',
      items: 'Itens',
      status: 'Status',
    },
  },
  actions: {
    next: 'Proximo passo',
    review: 'Tudo pronto',
    submit: 'Salvar pre-orcamento',
    back: 'Voltar',
    addRoom: 'Adicionar outro comodo',
  },
  steps: {
    produto: {
      heading: 'O que voce procura?',
      description: 'Escolha o tipo de produto para iniciarmos seu pre-orcamento',
    },
    ambiente: {
      heading: 'Para qual ambiente?',
      descriptionPrefix: 'Onde a sua nova',
      descriptionSuffix: 'sera instalada?',
    },
    material: {
      heading: 'Qual a sua preferencia de material?',
      descriptionPrefix: 'Personalize o estilo da sua',
      curtainLabel: 'Tecido principal',
      blackoutLabel: 'Nivel de blackout',
      blindLabel: 'Modelo de persiana',
    },
    medidas: {
      heading: 'Quais as medidas aproximadas?',
      description: 'Para uma triagem mais precisa, informe o tamanho aproximado do espaco.',
      widthLabel: 'Largura (m)',
      heightLabel: 'Altura (m)',
      widthPlaceholder: 'Ex: 2.5',
      heightPlaceholder: 'Ex: 2.6',
      unknownMeasuresLabel: 'Nao sei as medidas exatas',
      unknownMeasuresHint: '(agendaremos uma visita para medicao)',
    },
    resumo: {
      heading: 'Resumo da solicitacao',
      description: 'Revise os ambientes antes de salvar o pre-orcamento',
    },
    contato: {
      heading: 'Como podemos te chamar?',
      description: 'Salve o seu pre-orcamento agora. O WhatsApp continua disponivel como proximo passo opcional.',
      namePlaceholder: 'Seu nome completo',
      whatsappPlaceholder: 'Seu WhatsApp',
      emailPlaceholder: 'Seu e-mail (opcional)',
      locationPlaceholder: 'Seu bairro ou cidade',
      submittingLabel: 'Salvando...',
    },
  },
} as const

export const getPublicQuoteNextButtonLabel = (stepId: PublicQuoteStepId) => {
  if (stepId === 'contato') {
    return publicQuoteFlowConfig.actions.submit
  }

  if (stepId === 'resumo') {
    return publicQuoteFlowConfig.actions.review
  }

  return publicQuoteFlowConfig.actions.next
}

export const formatPublicQuoteSuccessDescription = (code: string, brandName: string) =>
  `Codigo ${code}. Sua solicitacao ja entrou na area de gestao da ${brandName}.`
