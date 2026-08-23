const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const { backfillCrm } = require('./contactStore.cjs')

async function main() {
  const apply = process.argv.includes('--apply')
  const summary = await backfillCrm({ apply })

  console.log(JSON.stringify(summary, null, 2))

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to write the missing CRM records.')
  }

  if (summary.failures.length) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('CRM backfill failed.')
  console.error(error)
  process.exitCode = 1
})
