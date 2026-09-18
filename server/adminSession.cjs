const sessionStore = require('./sessionStore.cjs')
const { isSecureDeployment, sessionCookieName } = require('./requestSecurity.cjs')
const crypto = require('node:crypto')

const SESSION_TTL_MS = 1000 * 60 * 60 * 8
const STATE_TTL_MS = 1000 * 60 * 10
const SESSION_COOKIE_NAME = 'animus_admin_session'

function getSecret() {
  const secret = process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_SUBMISSIONS_KEY || ''

  if (!secret) {
    throw new Error('Missing ADMIN_AUTH_SECRET (or ADMIN_SUBMISSIONS_KEY fallback) for admin authentication')
  }

  return secret
}

function encodeBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = (4 - (normalized.length % 4)) % 4
  return Buffer.from(normalized + '='.repeat(padLength), 'base64').toString('utf8')
}

function signTokenSegment(value, secret) {
  return encodeBase64Url(
    crypto
      .createHmac('sha256', secret)
      .update(value)
      .digest(),
  )
}

function createSignedPayload(payload, ttlMs = SESSION_TTL_MS) {
  const secret = getSecret()
  const now = Date.now()
  const data = {
    ...payload,
    iat: now,
    exp: now + ttlMs,
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(data))
  const signature = signTokenSegment(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

function verifySignedPayload(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null
  }

  const secret = getSecret()
  const [encodedPayload, providedSignature] = token.split('.')

  if (!encodedPayload || !providedSignature) {
    return null
  }

  const expectedSignature = signTokenSegment(encodedPayload, secret)

  try {
    const signatureValid = crypto.timingSafeEqual(
      Buffer.from(providedSignature),
      Buffer.from(expectedSignature),
    )

    if (!signatureValid) {
      return null
    }
  } catch {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload))

    if (!payload?.exp || Date.now() > Number(payload.exp)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

function createAdminToken(user, previousToken) {
  return sessionStore.createSession('admin', user, previousToken)
}

function verifyAdminToken(token) {
  return sessionStore.resolveSession('admin', token)
}

function createOAuthState(returnTo = '/admin') {
  return createSignedPayload(
    {
      type: 'microsoft_oauth_state',
      returnTo,
      nonce: crypto.randomBytes(12).toString('hex'),
    },
    STATE_TTL_MS,
  )
}

function verifyOAuthState(value) {
  const payload = verifySignedPayload(value)

  if (!payload || payload.type !== 'microsoft_oauth_state') {
    return null
  }

  return payload
}

function serializeSessionCookie(token) {
  const secure = isSecureDeployment()
  const sameSite = 'Lax'
  const parts = [
    `${sessionCookieName(SESSION_COOKIE_NAME)}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ]

  if (secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

function serializeClearedSessionCookie() {
  const secure = isSecureDeployment()
  const sameSite = 'Lax'
  const parts = [
    `${sessionCookieName(SESSION_COOKIE_NAME)}=`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    'Max-Age=0',
  ]

  if (secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

function parseCookies(req) {
  const cookieHeader = req.headers?.cookie || req.headers?.Cookie || ''

  return cookieHeader
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const separator = pair.indexOf('=')

      if (separator === -1) {
        return acc
      }

      const key = pair.slice(0, separator)
      const value = pair.slice(separator + 1)
      try {
        acc[key] = decodeURIComponent(value)
      } catch {
        // Malformed cookies are not authentication credentials.
      }
      return acc
    }, {})
}

module.exports = {
  SESSION_COOKIE_NAME,
  createOAuthState,
  createSignedPayload,
  createAdminToken,
  parseCookies,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  verifyOAuthState,
  verifySignedPayload,
  verifyAdminToken,
}
