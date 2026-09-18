const assert = require('node:assert/strict')
const test = require('node:test')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')

process.env.CONTACT_DATABASE_URL = process.env.RATE_LIMIT_TEST_DATABASE_URL || ''
process.env.POSTGRES_URL = ''
process.env.DATABASE_URL = ''
process.env.CONTACT_DB_PATH = path.join(os.tmpdir(), `animus-rate-${process.pid}-${Date.now()}.sqlite`)
process.env.ADMIN_AUTH_SECRET = 'test-only-admin-rate-limit-secret'
process.env.USER_AUTH_SECRET = 'test-only-portal-rate-limit-secret'
const store = require('../server/rateLimitStore.cjs')
const { enforceRateLimit, clientNetwork, bucket, POLICIES } = require('../server/rateLimit.cjs')
const admin = require('../server/adminApi.cjs')
const portal = require('../server/portalApi.cjs')
const contacts = require('../server/contactStore.cjs')
const prefix = `test-${process.pid}-${Date.now()}`

function request(ip = '192.0.2.1', body = {}) {
  return { method: 'POST', url: '/', body, socket: { remoteAddress: ip }, headers: { origin: 'https://www.animusscripts.com' } }
}
function response() {
  return { statusCode: 200, headers: {}, setHeader(name, value) { this.headers[name.toLowerCase()] = value },
    end(value) { this.body = JSON.parse(value) } }
}
async function call(handler, req) { const res = response(); await handler(req, res); return res }

test('atomic counters admit only the configured capacity and persist into a separate process', async () => {
  const key = `${prefix}-parallel`
  const results = await Promise.all(Array.from({ length: 20 }, () => store.consume(key, 5, 60000)))
  assert.equal(results.filter((item) => item.allowed).length, 5)
  const script = `require('./server/rateLimitStore.cjs').consume(${JSON.stringify(key)}, 5, 60000).then(r => { console.log(JSON.stringify(r)); process.exit(0) })`
  const child = JSON.parse(execFileSync(process.execPath, ['-e', script], { cwd: path.resolve(__dirname, '..'), env: process.env, encoding: 'utf8' }).trim())
  assert.equal(child.allowed, false)
  assert.ok(child.retryAfterSeconds > 0 && child.retryAfterSeconds <= 60)
})

test('expired buckets reopen; successful login clears only its unchanged account reservation', async (t) => {
  const now = Date.now()
  const key = `${prefix}-expiry`
  const clock = t.mock.method(Date, 'now', () => now)
  assert.equal((await store.consume(key, 1, 1000)).allowed, true)
  assert.equal((await store.consume(key, 1, 1000)).allowed, false)
  clock.mock.mockImplementation(() => now + 1001)
  assert.equal((await store.consume(key, 1, 1000)).allowed, true)
  clock.mock.restore()
  const account = `${prefix}-success`
  const first = await enforceRateLimit(request('192.0.2.2'), response(), 'adminLogin', account)
  await enforceRateLimit(request('192.0.2.3'), response(), 'adminLogin', account)
  await first.success()
  for (let i = 0; i < 3; i++) assert.ok(await enforceRateLimit(request('192.0.2.4'), response(), 'adminLogin', account))
  assert.equal(await enforceRateLimit(request('192.0.2.4'), response(), 'adminLogin', account), null)
  const secondAccount = `${prefix}-reset`
  const reservation = await enforceRateLimit(request('192.0.2.5'), response(), 'adminLogin', secondAccount)
  assert.equal(await reservation.success(), true)
  for (let i = 0; i < 5; i++) assert.ok(await enforceRateLimit(request('192.0.2.5'), response(), 'adminLogin', secondAccount))
})

test('account normalization and independent IP quotas resist rotating identities', async () => {
  const account = `${prefix}-normalized@example.test`
  for (let i = 0; i < 5; i++) assert.ok(await enforceRateLimit(request(`198.51.100.${i + 1}`), response(), 'portalLogin', account))
  const denied = response()
  assert.equal(await enforceRateLimit(request('198.51.100.20'), denied, 'portalLogin', `  ${account.toUpperCase()} `), null)
  assert.equal(denied.statusCode, 429)
  assert.match(denied.headers['retry-after'], /^\d+$/)
  for (let i = 0; i < 30; i++) {
    const req = request('198.51.100.99')
    req.headers['x-forwarded-for'] = `203.0.113.${i}`
    assert.ok(await enforceRateLimit(req, response(), 'portalLogin', `${prefix}-rotating-${i}`))
  }
  assert.equal(await enforceRateLimit(request('198.51.100.99'), response(), 'portalLogin', 'another'), null)
})

test('IP identity handles mapped IPv4, IPv6 networks, malformed values, and trusted Vercel headers', (t) => {
  const original = process.env.VERCEL
  t.after(() => { if (original === undefined) delete process.env.VERCEL; else process.env.VERCEL = original })
  delete process.env.VERCEL
  assert.equal(clientNetwork(request('::ffff:192.0.2.1')), '192.0.2.1')
  assert.equal(clientNetwork(request('2001:db8:abcd:1234::1')), clientNetwork(request('2001:0db8:abcd:1234:ffff::2')))
  assert.equal(clientNetwork(request('bad-ip')), 'unknown')
  process.env.VERCEL = '1'
  const req = request('127.0.0.1')
  req.headers['x-vercel-forwarded-for'] = '192.0.2.8'
  req.headers['x-forwarded-for'] = '198.51.100.8'
  assert.equal(clientNetwork(req), '192.0.2.8')
  req.headers['x-vercel-forwarded-for'] = '192.0.2.8, 198.51.100.8'
  assert.equal(clientNetwork(req), 'unknown')
})

test('admin and portal login enforce five attempts; successful cookie login clears account failures', async () => {
  for (const [handler, field, create, account, ip] of [
    [admin.handleAdminLogin, 'username', () => contacts.createOrUpdateAdminUser('rate-staff@example.test', 'StrongPassword123!', 'admin'), 'rate-staff@example.test', '203.0.113.1'],
    [portal.handlePortalLogin, 'email', () => contacts.createPortalUser({ email: 'rate-client@example.test', password: 'StrongPassword123!' }), 'rate-client@example.test', '203.0.113.2'],
  ]) {
    await create()
    for (let i = 0; i < 4; i++) assert.equal((await call(handler, request(ip, { [field]: account, password: 'wrong' }))).statusCode, 401)
    const valid = await call(handler, request(ip, { [field]: account, password: 'StrongPassword123!' }))
    assert.equal(valid.statusCode, 200)
    assert.ok(valid.headers['set-cookie'])
    for (let i = 0; i < 5; i++) assert.equal((await call(handler, request(ip, { [field]: account, password: 'wrong' }))).statusCode, 401)
    const blocked = await call(handler, request(ip, { [field]: account, password: 'StrongPassword123!' }))
    assert.equal(blocked.statusCode, 429)
    assert.equal(blocked.headers['set-cookie'], undefined)
  }
})

test('signup, OAuth, contact and ticket handlers stop before side effects when quotas are exhausted', async (t) => {
  // Avoid loading developer .env.local through the public contact wrapper.
  t.mock.method(require('dotenv'), 'config', () => ({}))
  const { default: contact } = await import('../api/contact.js')
  const session = require('../server/portalSession.cjs')
  for (const [handler, action, body, account, method] of [
    [portal.handlePortalSignup, 'portalSignup', { email: 'blocked@example.test', password: 'StrongPassword123!' }, 'blocked@example.test', 'POST'],
    [admin.handleMicrosoftStart, 'microsoftStart', {}, undefined, 'GET'],
    [admin.handleMicrosoftCallback, 'microsoftCallback', {}, undefined, 'GET'],
    [contact, 'contact', { kind: 'lead', email: 'blocked-contact@example.test' }, 'blocked-contact@example.test', 'POST'],
    [portal.handlePortalTickets, 'ticketCreate', { subject: 'blocked', message: 'blocked' }, 'blocked-ticket@example.test', 'POST'],
    [portal.handlePortalTickets, 'ticketReply', { requestId: 'blocked', reply: 'blocked' }, 'blocked-ticket@example.test', 'POST'],
  ]) {
    const req = request('203.0.113.100', body)
    req.method = method
    if (action.startsWith('ticket')) req.headers.cookie = session.serializePortalSessionCookie(session.createPortalToken({ id: 99, email: account })).split(';')[0]
    const policy = POLICIES[action]
    const dimension = account ? 'account' : 'ip'
    const key = bucket(action, dimension, account || clientNetwork(req))
    for (let i = 0; i < policy[dimension]; i++) await store.consume(key, policy[dimension], policy.window)
    const res = await call(handler, req)
    assert.equal(res.statusCode, 429, action)
    assert.ok(Number(res.headers['retry-after']) > 0)
    assert.equal(res.headers['set-cookie'], undefined)
    assert.equal(res.headers.location, undefined)
  }
})

test('store failure returns generic 503 and production cannot fall back to SQLite', async (t) => {
  t.mock.method(store, 'consume', async () => { throw new Error('sensitive database details') })
  const res = await call(admin.handleAdminLogin, request('203.0.113.200', { username: 'any', password: 'any' }))
  assert.equal(res.statusCode, 503)
  assert.equal(res.headers['set-cookie'], undefined)
  assert.equal(JSON.stringify(res.body).includes('sensitive'), false)
  const script = `require('./server/rateLimitStore.cjs').consume('production-test', 1, 1000).then(() => process.exit(2), () => process.exit(0))`
  execFileSync(process.execPath, ['-e', script], { cwd: path.resolve(__dirname, '..'), env: {
    ...process.env, NODE_ENV: 'production', CONTACT_DATABASE_URL: '', POSTGRES_URL: '', DATABASE_URL: '',
  } })
})
