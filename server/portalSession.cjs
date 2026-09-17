const { isSecureDeployment, sessionCookieName } = require('./requestSecurity.cjs')
const crypto = require('node:crypto')

const PORTAL_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const PORTAL_SESSION_COOKIE_NAME = 'animus_portal_session'

function getSecret() {
  const secret = process.env.USER_AUTH_SECRET || process.env.ADMIN_AUTH_SECRET || ''

  if (!secret) {
    throw new Error('Missing USER_AUTH_SECRET (or ADMIN_AUTH_SECRET fallback) for portal authentication')
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

function createPortalToken(user) {
  const secret = getSecret()
  const payload = {
    type: 'portal_session',
    sub: String(user.id),
    email: user.email,
    displayName: user.displayName || null,
    iat: Date.now(),
    exp: Date.now() + PORTAL_SESSION_TTL_MS,
  }

  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signTokenSegment(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

function verifyPortalToken(token) {
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

    if (payload.type !== 'portal_session' || !payload.exp || Date.now() > Number(payload.exp)) {
      return null
    }

    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    }
  } catch {
    return null
  }
}

function serializePortalSessionCookie(token) {
  const secure = isSecureDeployment()
  const sameSite = 'Lax'
  const parts = [
    `${sessionCookieName(PORTAL_SESSION_COOKIE_NAME)}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    `Max-Age=${Math.floor(PORTAL_SESSION_TTL_MS / 1000)}`,
  ]

  if (secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

function serializeClearedPortalSessionCookie() {
  const secure = isSecureDeployment()
  const sameSite = 'Lax'
  const parts = [
    `${sessionCookieName(PORTAL_SESSION_COOKIE_NAME)}=`,
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
  PORTAL_SESSION_COOKIE_NAME,
  createPortalToken,
  parseCookies,
  serializeClearedPortalSessionCookie,
  serializePortalSessionCookie,
  verifyPortalToken,
}
