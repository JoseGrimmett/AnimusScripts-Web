import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('dotenv').config({
  path: require('node:path').resolve(globalThis.process?.cwd?.() || '.', '.env.local'),
  override: true,
})

const { getRecentSubmissions } = require('../server/contactStore.cjs')
const env = globalThis.process?.env || {}

function getRequestHeader(req, name) {
  const lowerName = name.toLowerCase()

  if (typeof req.get === 'function') {
    return req.get(name) || req.get(lowerName)
  }

  return req.headers?.[lowerName] || req.headers?.[name] || null
}

function isAuthorized(req) {
  const accessKey = env.ADMIN_SUBMISSIONS_KEY

  if (!accessKey) {
    return true
  }

  const providedKey = getRequestHeader(req, 'x-admin-submissions-key')
  return providedKey === accessKey
}

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload)
  }

  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
  return payload
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  if (!isAuthorized(req)) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  const url = new URL(req.url, 'http://localhost')
  const limit = url.searchParams.get('limit') || 25

  try {
    const submissions = await getRecentSubmissions(limit)
    return sendJson(res, 200, {
      ok: true,
      count: submissions.length,
      submissions,
    })
  } catch (error) {
    console.error('[submissions-api] failed to load submissions', error)
    return sendJson(res, 500, { error: 'Failed to load submissions' })
  }
}
