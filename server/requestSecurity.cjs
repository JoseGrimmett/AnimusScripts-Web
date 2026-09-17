const CANONICAL_ORIGINS = ['https://www.animusscripts.com', 'https://animusscripts.com']

function isSecureDeployment() {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)
}

function sessionCookieName(name) {
  return isSecureDeployment() ? `__Host-${name}` : name
}

// Never derive trust from Host or forwarded headers supplied with the request.
function hasTrustedOrigin(req) {
  const origin = req.headers?.origin ?? req.headers?.Origin
  if (typeof origin !== 'string') return false
  try {
    const parsed = new URL(origin)
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.origin !== origin) return false
  } catch {
    return false
  }

  const allowed = new Set(CANONICAL_ORIGINS)
  for (const configured of (process.env.TRUSTED_APP_ORIGINS || '').split(',')) {
    const value = configured.trim()
    try {
      const parsed = new URL(value)
      const localHttp = !isSecureDeployment() && parsed.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
      if (parsed.origin === value && (parsed.protocol === 'https:' || localHttp)) allowed.add(value)
    } catch {
      // Invalid configuration entries never grant origin trust.
    }
  }
  if (!isSecureDeployment()) {
    for (const host of ['localhost', '127.0.0.1', '[::1]']) {
      for (const port of [5173, 4173]) allowed.add(`http://${host}:${port}`)
    }
  }
  return allowed.has(origin)
}

function rejectUntrustedMutation(req, res) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return false
  if (hasTrustedOrigin(req)) return false
  res.statusCode = 403
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: 'Untrusted request origin' }))
  return true
}

module.exports = { isSecureDeployment, sessionCookieName, rejectUntrustedMutation }
