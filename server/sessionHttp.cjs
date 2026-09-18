const { applyApiResponseSecurity } = require('./responseSecurity.cjs')

function withSessionAvailability(handler) {
  return async (req, res) => {
    try { return await handler(req, res) } catch (error) {
      if (error.code !== 'SESSION_STORE_UNAVAILABLE') throw error
      applyApiResponseSecurity(res)
      console.error('[security] session_store_unavailable')
      res.statusCode = 503
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Retry-After', '30')
      res.end(JSON.stringify({ error: 'Service temporarily unavailable. Try again later.' }))
    }
  }
}
module.exports = { withSessionAvailability }
