import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('dotenv').config({
  path: require('node:path').resolve(globalThis.process?.cwd?.() || '.', '.env.local'),
  override: true,
})

const { handlePortalLogout, handlePortalSession } = require('../../server/portalApi.cjs')

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/portal/session', 'http://localhost')
  const mode = String(url.searchParams.get('mode') || '').trim().toLowerCase()

  if (mode === 'logout') {
    return handlePortalLogout(req, res)
  }

  return handlePortalSession(req, res)
}
