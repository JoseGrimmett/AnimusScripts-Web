const crypto = require('node:crypto')
const { applyApiResponseSecurity } = require('./responseSecurity.cjs')
const { isIP } = require('node:net')
const store = require('./rateLimitStore.cjs')

const MINUTE = 60 * 1000
const POLICIES = {
  adminLogin: { ip: 30, account: 5, window: 15 * MINUTE, login: true },
  portalLogin: { ip: 30, account: 5, window: 15 * MINUTE, login: true },
  portalSignup: { ip: 10, account: 5, window: 60 * MINUTE },
  microsoftStart: { ip: 20, window: 15 * MINUTE },
  microsoftCallback: { ip: 30, account: 10, window: 15 * MINUTE },
  contact: { ip: 10, account: 5, window: 60 * MINUTE },
  ticketCreate: { ip: 30, account: 10, window: 60 * MINUTE },
  ticketReply: { ip: 120, account: 60, window: 60 * MINUTE },
}

function clientNetwork(req) {
  // Vercel overwrites this header at its trusted edge. Direct local servers use the socket.
  const raw = process.env.VERCEL
    ? req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-forwarded-for']
    : req.socket?.remoteAddress || req.connection?.remoteAddress
  let ip = typeof raw === 'string' ? raw.trim() : ''
  if (!isIP(ip)) return 'unknown'
  if (isIP(ip) === 4) return ip
  ip = new URL(`http://[${ip}]/`).hostname.slice(1, -1)
  // Canonicalize mapped IPv4 addresses and aggregate IPv6 privacy addresses by /64.
  if (ip.startsWith('::ffff:')) {
    const words = ip.slice(7).split(':')
    if (words.length === 2) {
      const value = parseInt(words[0], 16) * 65536 + parseInt(words[1], 16)
      return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.')
    }
  }
  const [left, right = ''] = ip.split('::')
  const head = left ? left.split(':') : []
  const tail = right ? right.split(':') : []
  const full = [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail]
  return `${full.slice(0, 4).map((part) => parseInt(part, 16).toString(16)).join(':')}::/64`
}

function bucket(action, dimension, value) {
  return crypto.createHash('sha256').update(JSON.stringify([action, dimension, String(value || '').trim().toLowerCase()])).digest('hex')
}

function respond(res, code, seconds) {
  applyApiResponseSecurity(res)
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Retry-After', String(seconds))
  res.end(JSON.stringify({ error: code === 429 ? 'Too many attempts. Try again later.' : 'Service temporarily unavailable. Try again later.', retryAfterSeconds: seconds }))
}

async function enforceRateLimit(req, res, action, account, { accountOnly = false } = {}) {
  const policy = POLICIES[action]
  try {
    if (!accountOnly) {
      const ip = await store.consume(bucket(action, 'ip', clientNetwork(req)), policy.ip, policy.window)
      if (!ip.allowed) {
        console.warn('[security] rate_limit', { action, dimension: 'ip' })
        respond(res, 429, ip.retryAfterSeconds)
        return null
      }
    }
    let reservation
    if (policy.account && account !== undefined) {
      reservation = await store.consume(bucket(action, 'account', account), policy.account, policy.window)
      if (!reservation.allowed) {
        console.warn('[security] rate_limit', { action, dimension: 'account' })
        respond(res, 429, reservation.retryAfterSeconds)
        return null
      }
    }
    await store.cleanup()
    return { async success() {
      try {
        if (policy.login && reservation) await store.clearSuccessfulAttempt(reservation)
        return true
      } catch {
        console.error('[security] rate_limit_store_unavailable', { action })
        respond(res, 503, 30)
        return false
      }
    } }
  } catch {
    console.error('[security] rate_limit_store_unavailable', { action })
    respond(res, 503, 30)
    return null
  }
}

module.exports = { enforceRateLimit, clientNetwork, bucket, POLICIES }
