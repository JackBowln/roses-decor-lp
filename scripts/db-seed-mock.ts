import { seedMockDatabase } from '~~/server/seeds/mockSeed'

const args = process.argv.slice(2)
const getArgValue = (name: string) => {
  const match = args.find((entry) => entry.startsWith(`--${name}=`))
  return match ? match.slice(name.length + 3) : undefined
}

const hasFlag = (name: string) => args.includes(`--${name}`)
const target = getArgValue('target')

if (target) {
  process.env.APP_DB_TARGET = target
}

const result = await seedMockDatabase({
  profile: getArgValue('profile'),
  seed: getArgValue('seed'),
  reset: hasFlag('reset'),
  confirmation: getArgValue('confirm'),
})

console.info(`[db:seed:mock] target=${result.target} profile=${result.profile} seed=${result.seed}`)
Object.entries(result.counts).forEach(([label, count]) => {
  console.info(`- ${label}: ${count}`)
})
