import type { InstallerRecord } from '@/lib/quoteWorkspace'
import { FIRST_NAMES, formatMockPhone, LAST_NAMES, type SeedFactoryContext } from '~~/server/seeds/factories/shared'

export const buildMockInstaller = (context: SeedFactoryContext, index: number): InstallerRecord => {
  const firstName = FIRST_NAMES[(index + 7) % FIRST_NAMES.length]
  const lastName = LAST_NAMES[(index + 3) % LAST_NAMES.length]
  const createdAt = context.isoDateTimeOffset(-190 + index * 6, 8)

  return {
    id: context.nextId('ins'),
    name: `${firstName} ${lastName}`,
    email: `instalacao.${firstName.toLowerCase()}${index + 1}@mock.rosesdecor.com`,
    whatsapp: formatMockPhone(300 + index),
    notes: index % 2 === 0 ? 'Equipe própria com atendimento em Vila Velha e Vitória.' : 'Instala persianas e trilhos em obras residenciais.',
    status: index % 6 === 0 ? 'inativo' : 'ativo',
    createdAt,
    updatedAt: createdAt,
  }
}
