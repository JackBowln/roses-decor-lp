import type { CustomerRecord } from '@/lib/quoteWorkspace'
import { CITY, FIRST_NAMES, formatMockPhone, LAST_NAMES, NEIGHBORHOODS, STATE, STREETS, type SeedFactoryContext } from '~~/server/seeds/factories/shared'

export const buildMockCustomer = (context: SeedFactoryContext, index: number): CustomerRecord => {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length]
  const lastName = LAST_NAMES[(index * 2) % LAST_NAMES.length]
  const neighborhood = NEIGHBORHOODS[index % NEIGHBORHOODS.length]
  const street = STREETS[index % STREETS.length]
  const createdAt = context.isoDateTimeOffset(-150 + index * 3, 9)
  const zipcode = `2910${String(10 + (index % 80)).padStart(2, '0')}-${String(index % 10)}${String((index + 3) % 10)}${String((index + 6) % 10)}`

  return {
    id: context.nextId('cus'),
    name: `${firstName} ${lastName}`,
    whatsapp: formatMockPhone(index),
    email: `${firstName.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')}.${lastName.split(' ')[0]!.toLowerCase()}${index + 1}@mock.rosesdecor.com`.replace(/[^a-z0-9.@_-]/g, ''),
    locationLabel: `${CITY}/${STATE}`,
    address: `${street}, ${4500 + index}`,
    complement: index % 3 === 0 ? `Apto ${100 + index}` : '',
    neighborhood,
    city: CITY,
    state: STATE,
    zipcode,
    createdAt,
    updatedAt: createdAt,
  }
}
