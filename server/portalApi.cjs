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

const AUTH_WINDOW_MS = Number(process.env.PORTAL_AUTH_WINDOW_MS || 10 * 60 * 1000)
const AUTH_MAX_ATTEMPTS = Number(process.env.PORTAL_AUTH_MAX_ATTEMPTS || 5)
const AUTH_LOCK_MS = Number(process.env.PORTAL_AUTH_LOCK_MS || 15 * 60 * 1000)
const authAttemptStore = new Map()

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
  const forwarded = getRequestHeader(req, 'x-forwarded-for')

  if (forwarded) {
    return String(forwarded).split(',')[0].trim() || 'unknown'
  }

  return req.socket?.remoteAddress || req.connection?.remoteAddress || 'unknown'
}

function getAuthRateKey(req, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  return `${getClientIp(req)}|${normalizedEmail || 'anon'}`
}

function cleanupAuthAttemptEntry(entry, now) {
  if (!entry) {
    return null
  }

  if (entry.lockUntil && entry.lockUntil > now) {
    return entry
  }

  const recentAttempts = (entry.attempts || []).filter((attemptAt) => now - attemptAt <= AUTH_WINDOW_MS)

  if (!recentAttempts.length) {
    return {
      attempts: [],
      lockUntil: 0,
    }
  }

  return {
    attempts: recentAttempts,
    lockUntil: 0,
  }
}

function readAuthAttemptState(rateKey) {
  const now = Date.now()
  const cleaned = cleanupAuthAttemptEntry(authAttemptStore.get(rateKey), now)

  if (!cleaned) {
    return {
      attempts: [],
      lockUntil: 0,
      now,
    }
  }

  authAttemptStore.set(rateKey, cleaned)
  return {
    attempts: cleaned.attempts || [],
    lockUntil: cleaned.lockUntil || 0,
    now,
  }
}

function getLockInfo(rateKey) {
  const state = readAuthAttemptState(rateKey)

  if (state.lockUntil > state.now) {
    return {
      locked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((state.lockUntil - state.now) / 1000)),
    }
  }

  return { locked: false, retryAfterSeconds: 0 }
}

function registerFailedAuthAttempt(rateKey) {
  const now = Date.now()
  const state = readAuthAttemptState(rateKey)
  const updatedAttempts = [...state.attempts, now].filter((attemptAt) => now - attemptAt <= AUTH_WINDOW_MS)

  const nextState = {
    attempts: updatedAttempts,
    lockUntil: updatedAttempts.length >= AUTH_MAX_ATTEMPTS ? now + AUTH_LOCK_MS : 0,
  }

  authAttemptStore.set(rateKey, nextState)

  return {
    locked: nextState.lockUntil > now,
    retryAfterSeconds: nextState.lockUntil > now
      ? Math.max(1, Math.ceil((nextState.lockUntil - now) / 1000))
      : 0,
  }
}

function clearAuthAttempts(rateKey) {
  authAttemptStore.delete(rateKey)
}

function sendRateLimited(res, retryAfterSeconds) {
  res.setHeader('Retry-After', String(retryAfterSeconds))
  return sendJson(res, 429, {
    error: 'Too many attempts. Try again later.',
    retryAfterSeconds,
  })
}

function getBearerToken(req) {
  const header = getRequestHeader(req, 'authorization')

  if (!header || !header.startsWith('Bearer ')) {
    return null
  }

  return header.slice(7).trim()
}

function getPortalSession(req) {
  const bearerSession = verifyPortalToken(getBearerToken(req))

  if (bearerSession) {
    return bearerSession
  }

  const cookies = parseCookies(req)
  return verifyPortalToken(cookies[PORTAL_SESSION_COOKIE_NAME])
}

function setPortalCookie(res, token) {
  res.setHeader('Set-Cookie', serializePortalSessionCookie(token))
}

function clearPortalCookie(res) {
  res.setHeader('Set-Cookie', serializeClearedPortalSessionCookie())
}

async function handlePortalSignup(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const payload = parseBody(req.body)
  const rateKey = getAuthRateKey(req, payload.email)
  const lockInfo = getLockInfo(rateKey)

  if (lockInfo.locked) {
    return sendRateLimited(res, lockInfo.retryAfterSeconds)
  }

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
    clearAuthAttempts(rateKey)

    return sendJson(res, 200, {
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    })
  } catch (error) {
    const attemptInfo = registerFailedAuthAttempt(rateKey)

    if (attemptInfo.locked) {
      return sendRateLimited(res, attemptInfo.retryAfterSeconds)
    }

    return sendJson(res, 400, { error: error.message || 'Failed to create account' })
  }
}

async function handlePortalLogin(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const payload = parseBody(req.body)
  const rateKey = getAuthRateKey(req, payload.email)
  const lockInfo = getLockInfo(rateKey)

  if (lockInfo.locked) {
    return sendRateLimited(res, lockInfo.retryAfterSeconds)
  }

  const user = await verifyPortalCredentials(payload.email, payload.password)

  if (!user) {
    const attemptInfo = registerFailedAuthAttempt(rateKey)

    if (attemptInfo.locked) {
      return sendRateLimited(res, attemptInfo.retryAfterSeconds)
    }

    return sendJson(res, 401, { error: 'Invalid email or password' })
  }

  let token

  try {
    token = createPortalToken(user)
  } catch (error) {
    console.error('[portal-auth] failed to create session token during login', error)
    return sendJson(res, 500, { error: 'Portal auth secret is not configured' })
  }

  setPortalCookie(res, token)
  clearAuthAttempts(rateKey)

  return sendJson(res, 200, {
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  })
}

async function handlePortalSession(req, res) {
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
