const sessionStore = require('./sessionStore.cjs')
const { isSecureDeployment, sessionCookieName } = require('./requestSecurity.cjs')

const PORTAL_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const PORTAL_SESSION_COOKIE_NAME = 'animus_portal_session'

function createPortalToken(user, previousToken) {
  return sessionStore.createSession('portal', user, previousToken)
}

function verifyPortalToken(token) {
  return sessionStore.resolveSession('portal', token)
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
