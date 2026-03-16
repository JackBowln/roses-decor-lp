import type { MockSeedProfile } from '~~/server/seeds/mockProfiles'

export interface SeedFactoryContext {
  profile: MockSeedProfile
  seed: number
  nextId: (prefix: string) => string
  nextCode: (prefix: string) => string
  pick: <T>(items: T[], offset?: number) => T
  randomInt: (min: number, max: number) => number
  chance: (probability: number) => boolean
  isoDateOffset: (days: number) => string
  isoDateTimeOffset: (days: number, hours?: number) => string
}

export const CITY = 'Vila Velha'
export const STATE = 'ES'

export const FIRST_NAMES = ['Vanessa', 'Carlos', 'Marina', 'Helena', 'Rafael', 'Juliana', 'Fernanda', 'André', 'Patrícia', 'Tiago', 'Camila', 'Renato', 'Bianca', 'Leandro', 'Natália', 'Michele', 'Arthur', 'Larissa']
export const LAST_NAMES = ['Passos Lima', 'Souza', 'Silva', 'Almeida', 'Dias', 'Moraes', 'Castro', 'Barbosa', 'Lopes', 'Vieira', 'Ferreira', 'Azevedo']
export const STREETS = ['Rua Itaperuna', 'Av. Dante Micheline', 'Rua das Palmeiras', 'Rua Cabo Aylson Simões', 'Rua Ceará', 'Rua Santa Leopoldina', 'Av. Champagnat', 'Rua Goiabeiras']
export const NEIGHBORHOODS = ['Praia de Itaparica', 'Praia da Costa', 'Jardim Camburi', 'Centro', 'Itapuã', 'Cocal', 'Mata da Praia', 'Coqueiral de Itaparica']
export const ROOM_NAMES = ['Sala', 'Suíte', 'Quarto Augusto', 'Quarto Eduardo', 'Home office', 'Varanda', 'Closet', 'Copa']
export const CURTAIN_FABRICS = ['LINHO', 'LINHO RUSTICO', 'VOIL']
export const BLIND_MATERIALS = ['Tela solar', 'Madeira', 'Double vision', 'Linho técnico']
export const FABRIC_CATEGORIES = ['Linho premium', 'Voil leve', 'Blackout', 'Tela solar', 'Jacquard', 'Gaze', 'Rustico', 'Percal']
export const FABRIC_COLORS = ['Areia', 'Off white', 'Fendi', 'Branco', 'Cinza claro', 'Cru', 'Terracota', 'Verde sálvia']
export const PAYMENT_METHODS = ['Pix', 'Cartão', 'Boleto', 'A combinar']
export const PAYMENT_TERMS = ['50% no pedido e 50% na entrega.', '30% no pedido e saldo na instalação.', 'Pagamento integral via Pix.', '3x no cartão de crédito.']

const mulberry32 = (seed: number) => {
  let value = seed >>> 0

  return () => {
    value += 0x6D2B79F5
    let result = Math.imul(value ^ value >>> 15, 1 | value)
    result ^= result + Math.imul(result ^ result >>> 7, 61 | result)
    return ((result ^ result >>> 14) >>> 0) / 4294967296
  }
}

export const createSeedFactoryContext = (seed: number, profile: MockSeedProfile): SeedFactoryContext => {
  const random = mulberry32(seed)
  const counters = new Map<string, number>()
  const codeCounters = new Map<string, number>()

  const nextSequence = (map: Map<string, number>, prefix: string) => {
    const next = (map.get(prefix) || 0) + 1
    map.set(prefix, next)
    return next
  }

  return {
    profile,
    seed,
    nextId(prefix) {
      const value = nextSequence(counters, prefix)
      return `${prefix}_mock_${String(seed).padStart(4, '0')}_${String(value).padStart(4, '0')}`
    },
    nextCode(prefix) {
      const value = nextSequence(codeCounters, prefix)
      return `${prefix}-${new Date().getFullYear()}-${String(seed).padStart(3, '0')}${String(value).padStart(5, '0')}`
    },
    pick(items, offset = 0) {
      const index = Math.floor(random() * items.length)
      return items[(index + offset) % items.length] as typeof items[number]
    },
    randomInt(min, max) {
      return Math.floor(random() * (max - min + 1)) + min
    },
    chance(probability) {
      return random() < probability
    },
    isoDateOffset(days) {
      const date = new Date()
      date.setDate(date.getDate() + days)
      return date.toISOString().slice(0, 10)
    },
    isoDateTimeOffset(days, hours = 10) {
      const date = new Date()
      date.setHours(hours, 0, 0, 0)
      date.setDate(date.getDate() + days)
      return date.toISOString()
    },
  }
}

export const formatMockPhone = (index: number) => `(27) 998${String(10 + (index % 80)).padStart(2, '0')}-${String(1000 + index).slice(-4)}`
