import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { applyApiResponseSecurity } = require('../../server/responseSecurity.cjs')
require('dotenv').config({
  path: require('node:path').resolve(globalThis.process?.cwd?.() || '.', '.env.local'),
  override: true,
})

const {
  handleMicrosoftStart,
  handleMicrosoftCallback,
} = require('../../server/adminApi.cjs')

export default async function handler(req, res) {
  applyApiResponseSecurity(res)
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const url = new URL(req.url, 'http://localhost')
  const action = String(url.searchParams.get('action') || '').trim().toLowerCase()
  const hasOAuthCallbackParams = url.searchParams.has('code') || url.searchParams.has('state')

  if (action === 'callback' || hasOAuthCallbackParams) {
    return handleMicrosoftCallback(req, res)
  }

  return handleMicrosoftStart(req, res)
}
