import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('dotenv').config({
  path: require('node:path').resolve(globalThis.process?.cwd?.() || '.', '.env.local'),
  override: true,
})

const {
  handleAdminCrm,
  handleAdminCrmActions,
  handleAdminCrmActivity,
  handleAdminDashboard,
} = require('../../server/adminApi.cjs')

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/admin/crm', 'http://localhost')
  const mode = String(url.searchParams.get('mode') || '').trim().toLowerCase()

  if (mode === 'actions') {
    return handleAdminCrmActions(req, res)
  }

  if (mode === 'activity') {
    return handleAdminCrmActivity(req, res)
  }

  if (mode === 'dashboard') {
    return handleAdminDashboard(req, res)
  }

  return handleAdminCrm(req, res)
}
