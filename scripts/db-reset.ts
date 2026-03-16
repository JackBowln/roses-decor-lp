import { resetMockDatabase } from '~~/server/seeds/mockSeed'

const args = process.argv.slice(2)
const targetArg = args.find((entry) => entry.startsWith('--target='))

if (targetArg) {
  process.env.APP_DB_TARGET = targetArg.slice('--target='.length)
}

const result = await resetMockDatabase()

console.info(`[db:reset] target=${result.target}`)
Object.entries(result.counts).forEach(([table, count]) => {
  console.info(`- ${table}: ${count}`)
})
