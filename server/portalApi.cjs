const { enforceRateLimit } = require('./rateLimit.cjs')
const { sessionCookieName, rejectUntrustedMutation } = require('./requestSecurity.cjs')
const {
  createPortalTicket,
  createPortalTicketReply,
  createPortalUser,
  getPortalTicketDetailByEmail,
  getPortalTicketsByEmail,
  verifyPortalCredentials,
} = require('./contactStore.cjs')
const {
  PORTAL_SESSION_COOKIE_NAME,
  createPortalToken,
  parseCookies,
  serializeClearedPortalSessionCookie,
  serializePortalSessionCookie,
  verifyPortalToken,
} = require('./portalSession.cjs')

function createRequestId(prefix = 'ticket') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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

function getPortalSession(req) {
  const cookies = parseCookies(req)
  return verifyPortalToken(cookies[sessionCookieName(PORTAL_SESSION_COOKIE_NAME)])
}

function setPortalCookie(res, token) {
  res.setHeader('Set-Cookie', serializePortalSessionCookie(token))
}

function clearPortalCookie(res) {
  res.setHeader('Set-Cookie', serializeClearedPortalSessionCookie())
}

async function handlePortalSignup(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const payload = parseBody(req.body)
  if (!await enforceRateLimit(req, res, 'portalSignup', payload.email || '')) return

  try {
    const user = await createPortalUser({
      email: payload.email,
      password: payload.password,
      displayName: payload.displayName,
    })

    let token

    try {
      token = createPortalToken(user)
    } catch (error) {
      console.error('[portal-auth] failed to create session token during signup', error)
      return sendJson(res, 500, { error: 'Portal auth secret is not configured' })
    }

    setPortalCookie(res, token)

    return sendJson(res, 200, {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    })
  } catch (error) {
    return sendJson(res, 400, { error: 'Unable to create account with those details' })
  }
}

async function handlePortalLogin(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const payload = parseBody(req.body)
  const rateLimit = await enforceRateLimit(req, res, 'portalLogin', payload.email || '')
  if (!rateLimit) return

  const user = await verifyPortalCredentials(payload.email, payload.password)

  if (!user) {
    return sendJson(res, 401, { error: 'Invalid email or password' })
  }

  let token

  try {
    token = createPortalToken(user)
  } catch (error) {
    console.error('[portal-auth] failed to create session token during login', error)
    return sendJson(res, 500, { error: 'Portal auth secret is not configured' })
  }

  if (!await rateLimit.success()) return
  setPortalCookie(res, token)

  return sendJson(res, 200, {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  })
}

async function handlePortalSession(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const session = getPortalSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  return sendJson(res, 200, {
    ok: true,
    user: {
      id: session.id,
      email: session.email,
      displayName: session.displayName,
    },
    expiresAt: session.expiresAt,
  })
}

async function handlePortalLogout(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  clearPortalCookie(res)

  return sendJson(res, 200, {
    ok: true,
  })
}

async function handlePortalTickets(req, res) {
  if (rejectUntrustedMutation(req, res)) return

  const session = getPortalSession(req)

  if (!session) {
    return sendJson(res, 401, { error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost')
    const requestId = String(url.searchParams.get('requestId') || '').trim()

    if (requestId) {
      const ticket = await getPortalTicketDetailByEmail(session.email, requestId)

      if (!ticket) {
        return sendJson(res, 404, { error: 'Ticket not found' })
      }

      return sendJson(res, 200, {
        ok: true,
        ticket,
      })
    }

    const limit = url.searchParams.get('limit') || 100
    const tickets = await getPortalTicketsByEmail(session.email, limit)

    return sendJson(res, 200, {
      ok: true,
      count: tickets.length,
      tickets,
    })
  }

  if (req.method === 'POST') {
    const payload = parseBody(req.body)
    if (!await enforceRateLimit(req, res, payload.requestId ? 'ticketReply' : 'ticketCreate', session.email)) return

    if (payload.requestId) {
      const replyMessage = String(payload.reply || payload.message || '').trim()
      if (!replyMessage) {
        return sendJson(res, 400, { error: 'Reply message is required' })
      }
      if (replyMessage.length > 5000) {
        return sendJson(res, 400, { error: 'Reply must be 5000 characters or less' })
      }

      const ticket = await createPortalTicketReply({
        email: session.email,
        requestId: payload.requestId,
        message: replyMessage,
      })
      if (!ticket) {
        return sendJson(res, 404, { error: 'Ticket not found' })
      }
      return sendJson(res, 201, { ok: true, ticket })
    }

    const subject = String(payload.subject || '').trim()
    const message = String(payload.message || '').trim()

    if (!subject || !message) {
      return sendJson(res, 400, { error: 'Subject and message are required' })
    }

    if (subject.length > 140) {
      return sendJson(res, 400, { error: 'Subject must be 140 characters or less' })
    }

    if (message.length > 5000) {
      return sendJson(res, 400, { error: 'Message must be 5000 characters or less' })
    }

    const ticket = await createPortalTicket({
      requestId: createRequestId('ticket'),
      email: session.email,
      subject,
      message,
    })

    return sendJson(res, 201, {
      ok: true,
      ticket,
    })
  }

  res.setHeader('Allow', 'GET, POST')
  return sendJson(res, 405, { error: 'Method not allowed' })
}

module.exports = {
  handlePortalLogin,
  handlePortalLogout,
  handlePortalSession,
  handlePortalSignup,
  handlePortalTickets,
}
