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
  const role = String(readArg('--role') || 'employee').trim().toLowerCase()

  if (!username || !password) {
    console.error('Usage: npm run admin:create -- --username <name> --password <password> [--role employee|admin]')
    process.exitCode = 1
    return
  }

  if (!['employee', 'admin'].includsties(role)) {
    console.error('Role must be either "employee" or "admin".')
    process.exitCode = 1
    return
  }

  try {
    const user = await createOrUpdateAdminUser(username, password, role)
    console.log('Admin user saved:')
    console.log(JSON.stringify({ id: user.id, username: user.username, role: user.role, createdAt: user.createdAt }, null, 2))
  } catch (error) {
    console.error('Failed to create admin user.')
    console.error(error)
    process.exitCode = 1
  }
}

main()
