export type AppEnvironmentTarget = 'development' | 'test' | 'production'

export interface AppEnvironmentMeta {
  target: AppEnvironmentTarget
  label: string
  shortLabel: string
  description: string
  toneClass: string
  ringClass: string
}

const normalizeTarget = (value: string | undefined | null): AppEnvironmentTarget => {
  const normalized = value?.trim().toLowerCase()

  if (normalized === 'development' || normalized === 'test' || normalized === 'production') {
    return normalized
  }

  return 'production'
}

export const resolveAppEnvironmentMeta = (value: string | undefined | null): AppEnvironmentMeta => {
  const target = normalizeTarget(value)

  switch (target) {
    case 'development':
      return {
        target,
        label: 'Ambiente de desenvolvimento',
        shortLabel: 'DEV',
        description: 'Você está usando o banco e os fluxos de desenvolvimento.',
        toneClass: 'bg-amber-500 text-slate-950',
        ringClass: 'ring-amber-200/70',
      }
    case 'test':
      return {
        target,
        label: 'Ambiente de testes',
        shortLabel: 'TEST',
        description: 'Você está usando o banco e os fluxos de teste.',
        toneClass: 'bg-sky-600 text-white',
        ringClass: 'ring-sky-200/70',
      }
    default:
      return {
        target,
        label: 'Ambiente de produção',
        shortLabel: 'PROD',
        description: 'Você está usando o banco e os fluxos de produção.',
        toneClass: 'bg-emerald-600 text-white',
        ringClass: 'ring-emerald-200/70',
      }
  }
}

export const shouldShowEnvironmentIndicator = (value: string | undefined | null) =>
  normalizeTarget(value) !== 'production'
