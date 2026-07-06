import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('dotenv').config({
  path: require('node:path').resolve(globalThis.process?.cwd?.() || '.', '.env.local'),
  override: true,
})

const { handleAdminCrmActivity } = require('../../server/adminApi.cjs')

export default async function handler(req, res) {
  return handleAdminCrmActivity(req, res)
}
