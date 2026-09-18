import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { applyApiResponseSecurity } = require('../../server/responseSecurity.cjs')
require('dotenv').config({
  path: require('node:path').resolve(globalThis.process?.cwd?.() || '.', '.env.local'),
  override: true,
})

const { handlePortalTickets } = require('../../server/portalApi.cjs')

export default async function handler(req, res) {
  applyApiResponseSecurity(res)
  return handlePortalTickets(req, res)
}
