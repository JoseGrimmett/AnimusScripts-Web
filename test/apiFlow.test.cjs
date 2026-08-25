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

async function call(handler, { method = 'GET', url = '/', body, token, ip = '127.0.0.1' } = {}) {
  const req = {
    method,
    url,
    body,
    headers: {
      'x-forwarded-for': ip,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
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

  const created = await call(handlePortalTickets, {
    method: 'POST',
    url: '/api/portal/tickets',
    token: signupA.body.token,
    body: { subject: 'Alpha workflow', message: 'Only Alpha should be able to read this.' },
  })
  assert.equal(created.statusCode, 201)
  const requestId = created.body.ticket.requestId

  const crossTenantRead = await call(handlePortalTickets, {
    url: `/api/portal/tickets?requestId=${encodeURIComponent(requestId)}`,
    token: signupB.body.token,
  })
  assert.equal(crossTenantRead.statusCode, 404)

  const betaList = await call(handlePortalTickets, {
    url: '/api/portal/tickets?limit=100',
    token: signupB.body.token,
  })
  assert.equal(betaList.statusCode, 200)
  assert.equal(betaList.body.count, 0)

  const crossTenantReply = await call(handlePortalTickets, {
    method: 'POST',
    url: '/api/portal/tickets',
    token: signupB.body.token,
    body: { requestId, reply: 'Beta must not be able to add this reply.' },
  })
  assert.equal(crossTenantReply.statusCode, 404)

  const alphaReply = await call(handlePortalTickets, {
    method: 'POST',
    url: '/api/portal/tickets',
    token: signupA.body.token,
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

  const staffList = await call(handleAdminTickets, {
    url: '/api/admin/tickets?limit=100',
    token: adminLogin.body.token,
  })
  assert.equal(staffList.statusCode, 200)
  assert.equal(staffList.body.count, 1)

  const staffDetail = await call(handleAdminTickets, {
    url: `/api/admin/tickets?requestId=${encodeURIComponent(requestId)}`,
    token: adminLogin.body.token,
  })
  assert.equal(staffDetail.statusCode, 200)
  assert.ok(staffDetail.body.ticket.timeline.some((event) => event.note === 'Here is more context from Alpha.'))

  const statusUpdate = await call(handleAdminTickets, {
    method: 'POST',
    url: '/api/admin/tickets',
    token: adminLogin.body.token,
    body: { action: 'status', requestId, status: 'in_progress', note: 'Work has started.' },
  })
  assert.equal(statusUpdate.statusCode, 200)

  const assignment = await call(handleAdminTickets, {
    method: 'POST',
    url: '/api/admin/tickets',
    token: adminLogin.body.token,
    body: { action: 'assign', requestId, assignedTo: 'employee@example.test' },
  })
  assert.equal(assignment.statusCode, 200)

  const crmTickets = await listCrmRecords('tickets', 100)
  const crmTicket = crmTickets.find((ticket) => ticket.portalTicketRequestId === requestId)
  assert.equal(crmTicket.status, 'in-progress')
  assert.ok(crmTicket.ownerAdminId)

  const alphaDetail = await call(handlePortalTickets, {
    url: `/api/portal/tickets?requestId=${encodeURIComponent(requestId)}`,
    token: signupA.body.token,
  })
  assert.equal(alphaDetail.statusCode, 200)
  assert.equal(alphaDetail.body.ticket.status, 'in-progress')
  assert.ok(alphaDetail.body.ticket.timeline.some((event) => event.note === 'Work has started.'))

  const unauthorizedUserCreation = await call(handleAdminUsers, {
    method: 'POST',
    url: '/api/admin/users',
    token: adminLogin.body.token,
    body: { username: 'should-not-exist@example.test', password: 'StrongPassword123!', role: 'admin' },
  })
  assert.equal(unauthorizedUserCreation.statusCode, 403)

  const dashboard = await call(handleAdminDashboard, {
    url: '/api/admin/crm?mode=dashboard',
    token: adminLogin.body.token,
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
