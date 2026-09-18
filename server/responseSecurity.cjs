// One policy source for edge/static responses and direct server handlers.
const { headers } = require('../vercel.json')
const apiHeaders = headers
  .filter((rule) => ['/(.*)', '/api/(.*)'].includes(rule.source))
  .flatMap((rule) => rule.headers)

function applyApiResponseSecurity(res) {
  for (const { key, value } of apiHeaders) res.setHeader(key, value)
}

module.exports = { applyApiResponseSecurity }
