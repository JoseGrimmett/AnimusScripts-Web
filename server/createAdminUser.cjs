require('dotenv').config({
  path: require('node:path').resolve(__dirname, '../.env.local'),
  override: true,
})

const { createOrUpdateAdminUser } = require('./contactStore.cjs')

function readArg(flag) {
  const index = process.argv.indexOf(flag)

  if (index === -1) {
    return null
  }

  return process.argv[index + 1] || null
}

async function main() {
  const username = readArg('--username')
  const password = readArg('--password')

  if (!username || !password) {
    console.error('Usage: npm run admin:create -- --username <name> --password <password>')
    process.exitCode = 1
    return
  }

  try {
    const user = await createOrUpdateAdminUser(username, password)
    console.log('Admin user saved:')
    console.log(JSON.stringify({ id: user.id, username: user.username, createdAt: user.createdAt }, null, 2))
  } catch (error) {
    console.error('Failed to create admin user.')
    console.error(error)
    process.exitCode = 1
  }
}

main()
