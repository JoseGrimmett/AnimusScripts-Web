import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
require('dotenv').config({
  path: require('node:path').resolve(globalThis.process?.cwd?.() || '.', '.env.local'),
  override: true,
})

const { handlePortalLogin } = require('../../server/portalApi.cjs')

export default async function handler(req, res) {
  return handlePortalLogin(req, res)
}
