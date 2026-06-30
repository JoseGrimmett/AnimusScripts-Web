require('dotenv').config({
  path: require('node:path').resolve(__dirname, '../.env.local'),
  override: true,
})

const { getStorageStatus } = require('./contactStore.cjs')

async function main() {
  try {
    const status = await getStorageStatus()

    console.log('Contact storage status:')
    console.log(JSON.stringify(status, null, 2))

    if (status.backend === 'sqlite') {
      console.warn(
        'SQLite is active. This is acceptable for local development, but use CONTACT_DATABASE_URL, POSTGRES_URL, or DATABASE_URL for durable production storage.',
      )
    }
  } catch (error) {
    console.error('Database verification failed.')
    console.error(error)
    process.exitCode = 1
  }
}

main()
