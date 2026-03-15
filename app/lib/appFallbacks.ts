export const uiFallbacks = {
  pending: 'Pendente',
  pendingContact: 'Contato pendente',
  pendingAddress: 'Endereco pendente',
  notInformed: 'Nao informado',
  notInformedFemale: 'Nao informada',
  noEmail: 'Sem e-mail',
  noNotes: 'Sem observacoes cadastradas.',
  noSeamstress: 'Sem costureira',
  noInstaller: 'Sem instalador',
  noSiteOrigin: 'Sem origem do site',
} as const

export const withFallback = (value: string | null | undefined, fallback = uiFallbacks.notInformed) => {
  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.trim()
  return normalized || fallback
}

export const withPendingFallback = (value: string | null | undefined, fallback = uiFallbacks.pending) => {
  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.trim()
  return normalized || fallback
}
