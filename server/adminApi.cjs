const { enforceRateLimit } = require('./rateLimit.cjs')
const { sessionCookieName, rejectUntrustedMutation } = require('./requestSecurity.cjs')
const {
  SESSION_COOKIE_NAME,
  createAdminToken,
  createOAuthState,
  parseCookies,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  verifyAdminToken,
  verifyOAuthState,
} = require('./adminSession.cjs')
const {
  assignAdminTicket,
  createOrUpdateAdminUser,
  createCrmRecord,
  getAdminTicketDetail,
  getAdminTickets,
  getAdminUserByUsername,
  getCrmActivityByRequestId,
  findCrmTicketByRequestId,
  getCrmRecord,
  listAdminUsers,
  listAuditEvents,
  listCrmRecords,
  recordAuditEvent,
  getRecentSubmissions,
  deleteCrmRecord,
  updateCrmRecord,
  updateAdminTicketStatus,
  verifyAdminCredentials,
} = require('./contactStore.cjs')

function sendJson(res, statusCode, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(payload)
  }

  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
  return payload
}

function parseBody(body) {
  if (!body) {
    return {}
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      return {}
    }
  }

  return body
}

function getRequestHeader(req, name) {
  const lowerName = name.toLowerCase()

  if (typeof req.get === 'function') {
    return req.get(name) || req.get(lowerName)
  }

  return req.headers?.[lowerName] || req.headers?.[name] || null
}

function getClientIp(req) {
  return String(getRequestHeader(req, 'x-forwarded-for') || req.socket?.remoteAddress || '')
    .split(',')[0]
    .trim() || null
}

async function writeAuditSafely(event) {
  try {
    await recordAuditEvent(event)
  } catch (error) {
    console.error('[audit] failed to record event', { action: event.action, error: error.message })
  }
}

function getCookieToken(req) {
  const cookies = parseCookies(req)
  return cookies[sessionCookieName(SESSION_COOKIE_NAME)] || null
}

function safeVerifyAdminToken(token) {
  try {
    return verifyAdminToken(token)
  } catch {
    return null
  }
}

function getAdminSession(req) {
  const cookieToken = getCookieToken(req)
  return safeVerifyAdminToken(cookieToken)
}

function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', serializeSessionCookie(token))
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', serializeClearedSessionCookie())
}

function hasEmployeeAccess(session) {
  if (!session) {
    return false
  }

  return session.role === 'employee' || session.role === 'admin'
}

function hasAdminAccess(session) {
  return Boolean(session && session.role === 'admin')
}

function getOrigin(req) {
  const host = getRequestHeader(req, 'x-forwarded-host') || getRequestHeader(req, 'host') || 'localhost'
  const proto = getRequestHeader(req, 'x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

function getRedirectUri(req) {
  const configured = process.env.MICROSOFT_REDIRECT_URI || ''

  if (configured.trim()) {
    return configured.trim()
  }

  return `${getOrigin(req)}/api/admin/microsoft/callback`
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  const parts = token.split('.')

  if (parts.length < 2) {
    return null
  }

  const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (normalized.length % 4)) % 4

  try {
    return JSON.parse(Buffer.from(normalized + '='.repeat(padLength), 'base64').toString('utf8'))
  } catch {
    return null
  }
}

function isAllowedMicrosoftUser(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!normalizedEmail) {
    return false
  }

  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  const allowedDomain = String(process.env.ADMIN_ALLOWED_DOMAIN || '').trim().toLowerCase()

  if (!allowedEmails.length && !allowedDomain) {
    return true
  }

  if (allowedEmails.includes(normalizedEmail)) {
    return true
  }

  if (allowedDomain && normalizedEmail.endsWith(`@${allowedDomain}`)) {
    return true
  }

  return false
}

function redirect(res, location) {
  res.statusCode = 302
  res.setHeader('Location', location)
  res.end('Redirecting...')
}

async function handleAdminLogin(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const payload = parseBody(req.body)
  const username = payload.username
  const password = payload.password

  const rateLimit = await enforceRateLimit(req, res, 'adminLogin', username || '')
  if (!rateLimit) return

  const user = await verifyAdminCredentials(username, password)

  if (!user) {
    await writeAuditSafely({
      actorType: 'staff',
      actorId: String(username || '').trim().toLowerCase() || null,
      action: 'admin_login_failed',
      ipAddress: getClientIp(req),
    })
    return sendJson(res, 401, { error: 'Invalid credentials' })
  }

  let token

  try {
    token = createAdminToken(user)
  } catch (error) {
    console.error('[admin-auth] failed to create session token', error)
    return sendJson(res, 500, { error: 'Admin auth secret is not configured' })
  }

  if (!await rateLimit.success()) return
  setSessionCookie(res, token)
  await writeAuditSafely({
    actorType: 'staff',
    actorId: user.username,
    action: 'admin_login_succeeded',
    entityType: 'admin_user',
    entityId: String(user.id),
    ipAddress: getClientIp(req),
    metadata: { role: user.role || 'employee' },
  })

  return sendJson(res, 200, {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role || 'employee',
    },
  })
}

async function handleAdminSession(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const session = getAdminSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  return sendJson(res, 200, {
    ok: true,
    user: {
      id: session.id,
      username: session.username,
      role: session.role || 'employee',
    },
    expiresAt: session.expiresAt,
  })
}

async function handleAdminLogout(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  clearSessionCookie(res)

  return sendJson(res, 200, {
    ok: true,
  })
}

async function handleAdminSubmissions(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const session = getAdminSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  if (!hasEmployeeAccess(session)) {
    return sendJson(res, 403, { error: 'Employee access is required' })
  }

  const url = new URL(req.url, 'http://localhost')
  const limit = url.searchParams.get('limit') || 100
  const submissions = await getRecentSubmissions(limit)

  return sendJson(res, 200, {
    ok: true,
    count: submissions.length,
    submissions,
    session: {
      username: session.username,
      role: session.role,
      expiresAt: session.expiresAt,
    },
  })
}

async function handleAdminTickets(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  const session = getAdminSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  if (!hasEmployeeAccess(session)) {
    return sendJson(res, 403, { error: 'Employee access is required' })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const requestId = String(url.searchParams.get('requestId') || '').trim()

    if (requestId) {
      const ticket = await getAdminTicketDetail(requestId)

      if (!ticket) {
        return sendJson(res, 404, { error: 'Ticket not found' })
      }

      return sendJson(res, 200, {
        ok: true,
        ticket,
      })
    }

    const limit = url.searchParams.get('limit') || 200
    const tickets = await getAdminTickets(limit)
    return sendJson(res, 200, {
      ok: true,
      count: tickets.length,
      tickets,
    })
  }

  if (req.method === 'POST') {
    const payload = parseBody(req.body)

    if (payload.action === 'status') {
      const statusUpdate = await updateAdminTicketStatus(payload.requestId, payload.status, session.username, payload.note)

      await writeAuditSafely({
        actorType: 'staff', actorId: session.username, action: 'ticket_status_changed',
        entityType: 'ticket', entityId: payload.requestId, ipAddress: getClientIp(req),
        metadata: { status: statusUpdate.status, note: payload.note || null },
      })

      return sendJson(res, 200, {
        ok: true,
        statusUpdate,
      })
    }

    const assignment = await assignAdminTicket(payload.requestId, payload.assignedTo, session.username)

    await writeAuditSafely({
      actorType: 'staff', actorId: session.username, action: 'ticket_assignment_changed',
      entityType: 'ticket', entityId: payload.requestId, ipAddress: getClientIp(req),
      metadata: { assignedTo: assignment.assignedTo },
    })

    return sendJson(res, 200, {
      ok: true,
      assignment,
    })
  }

  res.setHeader('Allow', 'GET, POST')
  return sendJson(res, 405, { error: 'Method not allowed' })
}

async function handleAdminUsers(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  const session = getAdminSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  if (!hasEmployeeAccess(session)) {
    return sendJson(res, 403, { error: 'Employee access is required' })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const limit = url.searchParams.get('limit') || 200
    const users = await listAdminUsers(limit)
    return sendJson(res, 200, {
      ok: true,
      count: users.length,
      users,
    })
  }

  if (req.method === 'POST') {
    if (!hasAdminAccess(session)) {
      return sendJson(res, 403, { error: 'Admin role is required' })
    }

    const payload = parseBody(req.body)
    const user = await createOrUpdateAdminUser(payload.username, payload.password, payload.role)

    await writeAuditSafely({
      actorType: 'staff', actorId: session.username, action: 'admin_user_upserted',
      entityType: 'admin_user', entityId: String(user.id), ipAddress: getClientIp(req),
      metadata: { username: user.username, role: user.role },
    })

    return sendJson(res, 200, {
      ok: true,
      user,
    })
  }

  res.setHeader('Allow', 'GET, POST')
  return sendJson(res, 405, { error: 'Method not allowed' })
}

async function handleAdminCrm(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  const session = getAdminSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  if (!hasEmployeeAccess(session)) {
    return sendJson(res, 403, { error: 'Employee access is required' })
  }

  const url = new URL(req.url, 'http://localhost')
  const entity = String(url.searchParams.get('entity') || '').trim().toLowerCase()
  const entityFromBody = (parseBody(req.body) || {}).entity
  const normalizedEntity = entity || String(entityFromBody || '').trim().toLowerCase()

  if (!normalizedEntity) {
    return sendJson(res, 400, { error: 'entity is required' })
  }

  try {
    if (req.method === 'GET') {
      const recordId = url.searchParams.get('id')

      if (recordId) {
        const record = await getCrmRecord(normalizedEntity, recordId)

        if (!record) {
          return sendJson(res, 404, { error: 'Record not found' })
        }

        return sendJson(res, 200, { ok: true, record })
      }

      const limit = url.searchParams.get('limit') || 100
      const records = await listCrmRecords(normalizedEntity, limit)
      return sendJson(res, 200, { ok: true, count: records.length, records })
    }

    if (req.method === 'POST') {
      const payload = parseBody(req.body)
      const record = await createCrmRecord(normalizedEntity, payload.data || payload)
      return sendJson(res, 201, { ok: true, record })
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const payload = parseBody(req.body)
      const recordId = url.searchParams.get('id') || payload.id

      if (!recordId) {
        return sendJson(res, 400, { error: 'id is required' })
      }

      const record = await updateCrmRecord(normalizedEntity, recordId, payload.data || payload)
      return sendJson(res, 200, { ok: true, record })
    }

    if (req.method === 'DELETE') {
      const payload = parseBody(req.body)
      const recordId = url.searchParams.get('id') || payload.id

      if (!recordId) {
        return sendJson(res, 400, { error: 'id is required' })
      }

      const deleted = await deleteCrmRecord(normalizedEntity, recordId)

      if (!deleted) {
        return sendJson(res, 404, { error: 'Record not found' })
      }

      return sendJson(res, 200, { ok: true, deleted: true })
    }

    res.setHeader('Allow', 'GET, POST, PATCH, PUT, DELETE')
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Failed to process CRM request' })
  }
}

async function handleAdminCrmActions(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  const session = getAdminSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  if (!hasEmployeeAccess(session)) {
    return sendJson(res, 403, { error: 'Employee access is required' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const payload = parseBody(req.body)
  const requestId = String(payload.requestId || '').trim()
  const action = String(payload.action || '').trim().toLowerCase()

  if (!requestId) {
    return sendJson(res, 400, { error: 'requestId is required' })
  }

  const crmTicket = await findCrmTicketByRequestId(requestId)

  if (!crmTicket) {
    return sendJson(res, 404, { error: 'CRM ticket not found for this request' })
  }

  try {
    if (action === 'note') {
      const body = String(payload.body || '').trim()

      if (!body) {
        return sendJson(res, 400, { error: 'body is required' })
      }

      const note = await createCrmRecord('notes', {
        ticketId: crmTicket.id,
        organizationId: crmTicket.organizationId || null,
        contactId: crmTicket.contactId || null,
        body,
        visibility: 'internal',
        createdByAdminId: session.id,
      })

      return sendJson(res, 201, {
        ok: true,
        record: note,
      })
    }

    if (action === 'task') {
      const title = String(payload.title || '').trim()
      const description = String(payload.description || '').trim() || null
      const dueDate = String(payload.dueDate || '').trim() || null

      if (!title) {
        return sendJson(res, 400, { error: 'title is required' })
      }

      const task = await createCrmRecord('tasks', {
        ticketId: crmTicket.id,
        organizationId: crmTicket.organizationId || null,
        contactId: crmTicket.contactId || null,
        title,
        description,
        status: 'open',
        priority: 'normal',
        dueDate,
        assignedAdminId: crmTicket.ownerAdminId || null,
        createdByAdminId: session.id,
      })

      return sendJson(res, 201, {
        ok: true,
        record: task,
      })
    }

    return sendJson(res, 400, { error: 'Unsupported action' })
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Failed to create CRM action' })
  }
}

async function handleAdminCrmActivity(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  const session = getAdminSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  if (!hasEmployeeAccess(session)) {
    return sendJson(res, 403, { error: 'Employee access is required' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const url = new URL(req.url, 'http://localhost')
  const requestId = String(url.searchParams.get('requestId') || '').trim()

  if (!requestId) {
    return sendJson(res, 400, { error: 'requestId is required' })
  }

  const feed = await getCrmActivityByRequestId(requestId)

  if (!feed.ticket) {
    return sendJson(res, 404, { error: 'CRM ticket not found for this request' })
  }

  return sendJson(res, 200, {
    ok: true,
    ticket: feed.ticket,
    activity: feed.activity,
  })
}

async function handleAdminDashboard(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  const session = getAdminSession(req)
  if (!session) return sendJson(res, 401, { error: 'Unauthorized' })
  if (!hasEmployeeAccess(session)) return sendJson(res, 403, { error: 'Employee access is required' })
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const [organizations, contacts, leads, crmTickets, inboxTickets, auditEvents] = await Promise.all([
    listCrmRecords('organizations', 500),
    listCrmRecords('contacts', 500),
    listCrmRecords('leads', 500),
    listCrmRecords('tickets', 500),
    getAdminTickets(100),
    listAuditEvents(12),
  ])

  const statuses = { received: 0, open: 0, 'in-progress': 0, waiting: 0, resolved: 0 }
  inboxTickets.forEach((ticket) => {
    const status = String(ticket.status || 'open').toLowerCase()
    statuses[status] = (statuses[status] || 0) + 1
  })
  const unassigned = inboxTickets.filter((ticket) => !ticket.assignedTo).length
  const now = Date.now()
  const newLast7Days = inboxTickets.filter((ticket) => {
    const created = new Date(ticket.createdAt).getTime()
    return Number.isFinite(created) && now - created <= 7 * 24 * 60 * 60 * 1000
  }).length

  return sendJson(res, 200, {
    ok: true,
    metrics: {
      organizations: organizations.length,
      contacts: contacts.length,
      leads: leads.length,
      tickets: crmTickets.length,
      inbox: inboxTickets.length,
      unassigned,
      newLast7Days,
      active: (statuses.received || 0) + (statuses.open || 0) + (statuses['in-progress'] || 0) + (statuses.waiting || 0),
    },
    statuses,
    recentTickets: inboxTickets.slice(0, 6),
    activity: auditEvents,
  })
}

async function handleMicrosoftStart(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  if (!await enforceRateLimit(req, res, 'microsoftStart')) return

  const clientId = (process.env.MICROSOFT_CLIENT_ID || '').trim()

  if (!clientId) {
    return sendJson(res, 500, { error: 'MICROSOFT_CLIENT_ID is not configured' })
  }

  const tenant = (process.env.MICROSOFT_TENANT_ID || 'common').trim()
  const authorizeUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`
  const redirectUri = getRedirectUri(req)
  let state

  try {
    state = createOAuthState('/admin')
  } catch (error) {
    console.error('[admin-microsoft] failed to create oauth state', error)
    return sendJson(res, 500, { error: 'Admin auth secret is not configured' })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email',
    state,
    prompt: process.env.MICROSOFT_LOGIN_PROMPT || 'select_account',
  })

  return redirect(res, `${authorizeUrl}?${params.toString()}`)
}

async function handleMicrosoftCallback(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  if (!await enforceRateLimit(req, res, 'microsoftCallback')) return

  const clientId = (process.env.MICROSOFT_CLIENT_ID || '').trim()
  const clientSecret = (process.env.MICROSOFT_CLIENT_SECRET || '').trim()
  const tenant = (process.env.MICROSOFT_TENANT_ID || 'common').trim()

  if (!clientId || !clientSecret) {
    return sendJson(res, 500, { error: 'Microsoft OAuth is not fully configured' })
  }

  const url = new URL(req.url, 'http://localhost')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code || !state) {
    return sendJson(res, 400, { error: 'Missing OAuth callback parameters' })
  }

  let statePayload

  try {
    statePayload = verifyOAuthState(state)
  } catch {
    statePayload = null
  }

  if (!statePayload) {
    return sendJson(res, 400, { error: 'Invalid OAuth state' })
  }

  const redirectUri = getRedirectUri(req)
  const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code,
  })

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!tokenResponse.ok) {
    let providerError = 'microsoft_token_exchange_failed'
    let providerDescription = ''

    try {
      const providerPayload = await tokenResponse.json()
      providerError = providerPayload.error || providerError
      providerDescription = providerPayload.error_description || ''
      console.error('[admin-microsoft] token exchange failed', providerPayload)
    } catch {
      const errorText = await tokenResponse.text()
      providerDescription = errorText
      console.error('[admin-microsoft] token exchange failed', errorText)
    }

    return sendJson(res, 401, {
      error: 'Microsoft sign-in failed',
      providerError,
      providerDescription,
      hint: 'Verify MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET value, MICROSOFT_REDIRECT_URI, and Entra app redirect URIs.',
    })
  }

  const tokenPayload = await tokenResponse.json()
  const idTokenPayload = decodeJwtPayload(tokenPayload.id_token)

  if (!idTokenPayload) {
    return sendJson(res, 401, { error: 'Invalid Microsoft token payload' })
  }

  if (idTokenPayload.aud !== clientId) {
    return sendJson(res, 401, { error: 'Microsoft token audience mismatch' })
  }

  const email = (
    idTokenPayload.preferred_username
    || idTokenPayload.email
    || idTokenPayload.upn
    || ''
  ).toLowerCase()

  if (!await enforceRateLimit(req, res, 'microsoftCallback', email, { accountOnly: true })) return

  if (!isAllowedMicrosoftUser(email)) {
    return sendJson(res, 403, { error: 'Microsoft account is not allowed for admin access' })
  }

  const adminUser = await getAdminUserByUsername(email)

  if (!adminUser) {
    return sendJson(res, 403, {
      error: 'No admin user found for this Microsoft account. Create one with admin:create first.',
    })
  }

  let sessionToken

  try {
    sessionToken = createAdminToken(adminUser)
  } catch (error) {
    console.error('[admin-microsoft] failed to create session token', error)
    return sendJson(res, 500, { error: 'Admin auth secret is not configured' })
  }

  setSessionCookie(res, sessionToken)

  return redirect(res, statePayload.returnTo || '/admin')
}

module.exports = {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminSession,
  handleAdminTickets,
  handleAdminUsers,
  handleMicrosoftCallback,
  handleMicrosoftStart,
  handleAdminCrm,
  handleAdminCrmActions,
  handleAdminCrmActivity,
  handleAdminDashboard,
  handleAdminSubmissions,
}
