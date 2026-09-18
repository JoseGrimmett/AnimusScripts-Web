import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { applyApiResponseSecurity } = require('../../server/responseSecurity.cjs')
require('dotenv').config({
  path: require('node:path').resolve(globalThis.process?.cwd?.() || '.', '.env.local'),
  override: true,
})

const {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSession,
} = require('../../server/adminApi.cjs')

export default async function handler(req, res) {
  applyApiResponseSecurity(res)
  if (req.method === 'GET') {
    return handleAdminSession(req, res)
  }

  if (req.method === 'POST') {
    const { action } = req.body || {}
    const normalizedAction = String(action || '').trim().toLowerCase()

    if (normalizedAction === 'logout') {
      return handleAdminLogout(req, res)
    }

    return handleAdminLogin(req, res)
  }

  res.setHeader('Allow', 'GET, POST')
  res.statusCode = 405
  res.end(JSON.stringify({ error: 'Method not allowed' }))
}
