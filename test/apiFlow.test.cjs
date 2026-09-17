const assert = require('node:assert/strict')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

process.env.CONTACT_DATABASE_URL = ''
process.env.POSTGRES_URL = ''
process.env.DATABASE_URL = ''
process.env.CONTACT_DB_PATH = path.join(os.tmpdir(), `animus-api-flow-${process.pid}-${Date.now()}.sqlite`)
process.env.ADMIN_AUTH_SECRET = 'test-admin-secret-that-is-long-and-random'
process.env.USER_AUTH_SECRET = 'test-portal-secret-that-is-long-and-random'

const {
  createOrUpdateAdminUser,
  listAuditEvents,
  listCrmRecords,
} = require('../server/contactStore.cjs')
const {
  handleAdminLogin,
  handleAdminDashboard,
  handleAdminTickets,
  handleAdminUsers,
} = require('../server/adminApi.cjs')
const {
  handlePortalSignup,
  handlePortalTickets,
} = require('../server/portalApi.cjs')
const adminApi = require('../server/adminApi.cjs')
const portalApi = require('../server/portalApi.cjs')

function createResponse() {
  return {
    body: null,
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
    end(payload) {
      if (payload) {
        this.body = JSON.parse(payload)
      }
      return this
    },
  }
}

async function call(handler, { method = 'GET', url = '/', body, cookie, origin = 'https://www.animusscripts.com', headers = {}, ip = '127.0.0.1' } = {}) {
  const req = {
    method,
    url,
    body,
    headers: {
      'x-forwarded-for': ip,
      ...(cookie ? { cookie: cookie.split(';')[0] } : {}),
      ...(origin !== undefined ? { origin } : {}),
      ...headers,
    },
  }
  const res = createResponse()
  await handler(req, res)
  return res
}

test('portal data remains tenant-isolated while staff can process the shared ticket lifecycle', async () => {
  const signupA = await call(handlePortalSignup, {
    method: 'POST',
    url: '/api/portal/signup',
    ip: '127.0.0.10',
    body: { email: 'alpha@example.test', password: 'StrongPassword123!', displayName: 'Alpha Client' },
  })
  const signupB = await call(handlePortalSignup, {
    method: 'POST',
    url: '/api/portal/signup',
    ip: '127.0.0.11',
    body: { email: 'beta@example.test', password: 'StrongPassword123!', displayName: 'Beta Client' },
  })

  assert.equal(signupA.statusCode, 200)
  assert.equal(signupB.statusCode, 200)
  assert.equal('token' in signupA.body, false)
  assert.equal('token' in signupB.body, false)

  const created = await call(handlePortalTickets, {
    method: 'POST',
    url: '/api/portal/tickets',
    cookie: signupA.headers['set-cookie'],
    body: { subject: 'Alpha workflow', message: 'Only Alpha should be able to read this.' },
  })
  assert.equal(created.statusCode, 201)
  const requestId = created.body.ticket.requestId

  const crossTenantRead = await call(handlePortalTickets, {
    url: `/api/portal/tickets?requestId=${encodeURIComponent(requestId)}`,
    cookie: signupB.headers['set-cookie'],
  })
  assert.equal(crossTenantRead.statusCode, 404)

  const betaList = await call(handlePortalTickets, {
    url: '/api/portal/tickets?limit=100',
    cookie: signupB.headers['set-cookie'],
  })
  assert.equal(betaList.statusCode, 200)
  assert.equal(betaList.body.count, 0)

  const crossTenantReply = await call(handlePortalTickets, {
    method: 'POST',
    url: '/api/portal/tickets',
    cookie: signupB.headers['set-cookie'],
    body: { requestId, reply: 'Beta must not be able to add this reply.' },
  })
  assert.equal(crossTenantReply.statusCode, 404)

  const alphaReply = await call(handlePortalTickets, {
    method: 'POST',
    url: '/api/portal/tickets',
    cookie: signupA.headers['set-cookie'],
    body: { requestId, reply: 'Here is more context from Alpha.' },
  })
  assert.equal(alphaReply.statusCode, 201)
  assert.ok(alphaReply.body.ticket.timeline.some((event) => event.note === 'Here is more context from Alpha.'))

  await createOrUpdateAdminUser('employee@example.test', 'StrongPassword123!', 'employee')
  const adminLogin = await call(handleAdminLogin, {
    method: 'POST',
    body: { username: 'employee@example.test', password: 'StrongPassword123!' },
  })
  assert.equal(adminLogin.statusCode, 200)
  assert.equal('token' in adminLogin.body, false)

  const staffList = await call(handleAdminTickets, {
    url: '/api/admin/tickets?limit=100',
    cookie: adminLogin.headers['set-cookie'],
  })
  assert.equal(staffList.statusCode, 200)
  assert.equal(staffList.body.count, 1)

  const staffDetail = await call(handleAdminTickets, {
    url: `/api/admin/tickets?requestId=${encodeURIComponent(requestId)}`,
    cookie: adminLogin.headers['set-cookie'],
  })
  assert.equal(staffDetail.statusCode, 200)
  assert.ok(staffDetail.body.ticket.timeline.some((event) => event.note === 'Here is more context from Alpha.'))

  const statusUpdate = await call(handleAdminTickets, {
    method: 'POST',
    url: '/api/admin/tickets',
    cookie: adminLogin.headers['set-cookie'],
    body: { action: 'status', requestId, status: 'in_progress', note: 'Work has started.' },
  })
  assert.equal(statusUpdate.statusCode, 200)

  const assignment = await call(handleAdminTickets, {
    method: 'POST',
    url: '/api/admin/tickets',
    cookie: adminLogin.headers['set-cookie'],
    body: { action: 'assign', requestId, assignedTo: 'employee@example.test' },
  })
  assert.equal(assignment.statusCode, 200)

  const crmTickets = await listCrmRecords('tickets', 100)
  const crmTicket = crmTickets.find((ticket) => ticket.portalTicketRequestId === requestId)
  assert.equal(crmTicket.status, 'in-progress')
  assert.ok(crmTicket.ownerAdminId)

  const alphaDetail = await call(handlePortalTickets, {
    url: `/api/portal/tickets?requestId=${encodeURIComponent(requestId)}`,
    cookie: signupA.headers['set-cookie'],
  })
  assert.equal(alphaDetail.statusCode, 200)
  assert.equal(alphaDetail.body.ticket.status, 'in-progress')
  assert.ok(alphaDetail.body.ticket.timeline.some((event) => event.note === 'Work has started.'))

  const unauthorizedUserCreation = await call(handleAdminUsers, {
    method: 'POST',
    url: '/api/admin/users',
    cookie: adminLogin.headers['set-cookie'],
    body: { username: 'should-not-exist@example.test', password: 'StrongPassword123!', role: 'admin' },
  })
  assert.equal(unauthorizedUserCreation.statusCode, 403)

  const dashboard = await call(handleAdminDashboard, {
    url: '/api/admin/crm?mode=dashboard',
    cookie: adminLogin.headers['set-cookie'],
  })
  assert.equal(dashboard.statusCode, 200)
  assert.equal(dashboard.body.metrics.inbox, 1)
  assert.equal(dashboard.body.metrics.contacts, 2)
  assert.equal(dashboard.body.statuses['in-progress'], 1)
  assert.ok(dashboard.body.recentTickets.length)

  const auditEvents = await listAuditEvents(100)
  assert.ok(auditEvents.some((event) => event.action === 'admin_login_succeeded'))
  assert.ok(auditEvents.some((event) => event.action === 'ticket_status_changed' && event.entityId === requestId))
  assert.ok(auditEvents.some((event) => event.action === 'ticket_assignment_changed' && event.entityId === requestId))
})

test('all shared mutation handlers reject missing, malicious, and malformed origins before side effects', async () => {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    for (const handler of [...Object.values(adminApi), ...Object.values(portalApi)]) {
      for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        for (const origin of [null, 'null', 'https://evil.example', 'https://www.animusscripts.com.evil.example',
          'https://www.animusscripts.com/', ['https://www.animusscripts.com'], 'http://localhost:5173']) {
          const result = await call(handler, { method, origin, headers: {
            host: 'evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https',
          } })
          assert.equal(result.statusCode, 403, `${handler.name} ${method} ${origin}`)
        }
        const missing = await call(handler, { method, headers: { origin: undefined } })
        assert.equal(missing.statusCode, 403)
      }
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous
  }
})

test('origin configuration permits explicit previews and local development without trusting arbitrary hosts', async () => {
  const previous = { node: process.env.NODE_ENV, vercel: process.env.VERCEL, origins: process.env.TRUSTED_APP_ORIGINS }
  try {
    process.env.NODE_ENV = 'production'
    process.env.TRUSTED_APP_ORIGINS = 'https://approved-preview.example'
    assert.equal((await call(adminApi.handleAdminLogout, {
      method: 'POST', origin: 'https://approved-preview.example',
    })).statusCode, 200)
    assert.equal((await call(adminApi.handleAdminLogout, {
      method: 'POST', origin: 'https://other-preview.example',
    })).statusCode, 403)
    process.env.NODE_ENV = 'development'
    delete process.env.VERCEL
    const local = await call(adminApi.handleAdminLogout, { method: 'POST', origin: 'http://localhost:5173' })
    assert.equal(local.statusCode, 200)
    assert.ok(local.headers['set-cookie'].startsWith('animus_admin_session='))
    assert.match(local.headers['set-cookie'], /SameSite=Lax/)
    assert.equal(local.headers['set-cookie'].includes('; Secure'), false)
    process.env.TRUSTED_APP_ORIGINS = 'http://localhost:5174'
    assert.equal((await call(adminApi.handleAdminLogout, {
      method: 'POST', origin: 'http://localhost:5174',
    })).statusCode, 200)
    process.env.VERCEL = '1'
    assert.equal((await call(adminApi.handleAdminLogout, {
      method: 'POST', origin: 'http://localhost:5174',
    })).statusCode, 403)
    assert.equal((await call(adminApi.handleAdminLogout, {
      method: 'POST', origin: 'http://localhost:5173',
    })).statusCode, 403)
  } finally {
    for (const [key, value] of Object.entries({ NODE_ENV: previous.node, VERCEL: previous.vercel, TRUSTED_APP_ORIGINS: previous.origins })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('production auth exposes only HttpOnly host cookies and rejects bearer and legacy credentials', async () => {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    await createOrUpdateAdminUser('cookie-staff@example.test', 'StrongPassword123!', 'admin')
    const signup = await call(handlePortalSignup, { method: 'POST', body: {
      email: 'cookie-client@example.test', password: 'StrongPassword123!', displayName: 'Cookie Client',
    } })
    const admin = await call(handleAdminLogin, { method: 'POST', body: {
      username: 'cookie-staff@example.test', password: 'StrongPassword123!',
    } })
    const portal = await call(portalApi.handlePortalLogin, { method: 'POST', body: {
      email: 'cookie-client@example.test', password: 'StrongPassword123!',
    } })
    for (const [response, sessionHandler, logoutHandler, name] of [
      [admin, adminApi.handleAdminSession, adminApi.handleAdminLogout, 'animus_admin_session'],
      [signup, portalApi.handlePortalSession, portalApi.handlePortalLogout, 'animus_portal_session'],
      [portal, portalApi.handlePortalSession, portalApi.handlePortalLogout, 'animus_portal_session'],
    ]) {
      assert.equal(response.statusCode, 200)
      assert.equal('token' in response.body, false)
      const cookie = response.headers['set-cookie']
      assert.ok(cookie.startsWith(`__Host-${name}=`))
      for (const attribute of ['HttpOnly', 'Secure', 'Path=/', 'SameSite=Lax']) {
        assert.ok(cookie.split('; ').includes(attribute), attribute)
      }
      assert.equal(/Domain=/i.test(cookie), false)
      assert.equal((await call(sessionHandler, { cookie })).statusCode, 200)
      const token = decodeURIComponent(cookie.split(';')[0].split('=')[1])
      assert.equal((await call(sessionHandler, { headers: { authorization: `Bearer ${token}` } })).statusCode, 401)
      assert.equal((await call(sessionHandler, { cookie: cookie.replace('__Host-', '') })).statusCode, 401)
      assert.equal((await call(sessionHandler, { cookie: `__Host-${name}=%invalid` })).statusCode, 401)
      const deniedLogout = await call(logoutHandler, { method: 'POST', cookie, origin: 'https://evil.example' })
      assert.equal(deniedLogout.statusCode, 403)
      assert.equal(deniedLogout.headers['set-cookie'], undefined)
      const logout = await call(logoutHandler, { method: 'POST', cookie })
      assert.equal(logout.statusCode, 200)
      assert.ok(logout.headers['set-cookie'].startsWith(`__Host-${name}=`))
      assert.match(logout.headers['set-cookie'], /Max-Age=0/)
      assert.match(logout.headers['set-cookie'], /SameSite=Lax/)
    }
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous
  }
})
