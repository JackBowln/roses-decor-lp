import { resetMockDatabase, seedMockDatabase } from '~~/server/seeds/mockSeed'

const args = process.argv.slice(2)
const getArgValue = (name: string) => {
  const match = args.find((entry) => entry.startsWith(`--${name}=`))
  return match ? match.slice(name.length + 3) : undefined
}

const target = getArgValue('target')

if (target) {
  process.env.APP_DB_TARGET = target
}

const resetResult = await resetMockDatabase()
console.info(`[db:reseed] reset target=${resetResult.target}`)

const seedResult = await seedMockDatabase({
  profile: getArgValue('profile'),
  seed: getArgValue('seed'),
})

console.info(`[db:reseed] seed target=${seedResult.target} profile=${seedResult.profile} seed=${seedResult.seed}`)
Object.entries(seedResult.counts).forEach(([label, count]) => {
  console.info(`- ${label}: ${count}`)
})
