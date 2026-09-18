const assert = require('node:assert/strict')
const test = require('node:test')
const path = require('node:path')
const os = require('node:os')
const fs = require('node:fs')
process.env.CONTACT_DATABASE_URL = ''
process.env.POSTGRES_URL = ''
process.env.DATABASE_URL = ''
process.env.CONTACT_DB_PATH = path.join(os.tmpdir(), `animus-headers-${process.pid}-${Date.now()}.sqlite`)
process.env.ADMIN_AUTH_SECRET = 'header-tests-only-oauth-state-secret'

function response() {
  return { headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value }, end(body) { this.body = body } }
}
function assertSecurity(res) {
  assert.equal(res.headers['cache-control'], 'private, no-store, max-age=0')
  assert.equal(res.headers.pragma, 'no-cache')
  assert.equal(res.headers['cdn-cache-control'], 'no-store')
  assert.equal(res.headers['vercel-cdn-cache-control'], 'no-store')
  assert.equal(res.headers['x-frame-options'], 'DENY')
  assert.equal(res.headers['x-content-type-options'], 'nosniff')
  assert.equal(res.headers['referrer-policy'], 'strict-origin-when-cross-origin')
  assert.ok(res.headers['permissions-policy'])
  assert.match(res.headers['content-security-policy'], /frame-ancestors 'none'/)
}

test('every public API entry point applies security/cache headers on early returns', async (t) => {
  t.mock.method(require('dotenv'), 'config', () => ({}))
  const files = fs.readdirSync(path.resolve(__dirname, '../api'), { recursive: true }).filter(file => file.endsWith('.js'))
  for (const file of files) {
    const { default: handler } = await import(require('node:url').pathToFileURL(path.resolve(__dirname, '../api', file)))
    const res = response()
    await handler({ method: 'OPTIONS', url: `/api/${file}`, headers: {} }, res)
    assert.ok(res.statusCode >= 400, file)
    assertSecurity(res)
  }
})

test('OAuth redirect and rate-limit/unavailable responses are never cacheable', async (t) => {
  const store = require('../server/rateLimitStore.cjs')
  const consume = t.mock.method(store, 'consume', async () => ({ allowed: true }))
  t.mock.method(store, 'cleanup', async () => {})
  const oldClient = process.env.MICROSOFT_CLIENT_ID
  process.env.MICROSOFT_CLIENT_ID = 'synthetic-client-id'
  try {
    const { handleMicrosoftStart } = require('../server/adminApi.cjs')
    const req = { method: 'GET', url: '/api/admin/microsoft/start', headers: {}, socket: { remoteAddress: '127.0.0.1' } }
    const redirect = response()
    await handleMicrosoftStart(req, redirect)
    assert.equal(redirect.statusCode, 302)
    assert.match(redirect.headers.location, /^https:\/\/login.microsoftonline.com\//)
    assertSecurity(redirect)
    consume.mock.mockImplementation(async () => ({ allowed: false, retryAfterSeconds: 30 }))
    const denied = response()
    await handleMicrosoftStart(req, denied)
    assert.equal(denied.statusCode, 429)
    assertSecurity(denied)
    consume.mock.mockImplementation(async () => { throw new Error('test outage') })
    const outage = response()
    await handleMicrosoftStart(req, outage)
    assert.equal(outage.statusCode, 503)
    assertSecurity(outage)
  } finally {
    if (oldClient === undefined) delete process.env.MICROSOFT_CLIENT_ID
    else process.env.MICROSOFT_CLIENT_ID = oldClient
  }
})

test('CSP restricts executable content without disabling static asset caching', () => {
  const config = require('../vercel.json')
  const global = config.headers.find(rule => rule.source === '/(.*)').headers
  const csp = global.find(header => header.key === 'Content-Security-Policy').value
  assert.match(csp, /script-src 'self' https:\/\/www.googletagmanager.com/)
  assert.match(csp, /script-src-attr 'none'/)
  assert.match(csp, /object-src 'none'/)
  assert.match(csp, /form-action 'self'/)
  assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval|\*/)
  assert.equal(global.some(header => /cache-control/i.test(header.key)), false)
})
