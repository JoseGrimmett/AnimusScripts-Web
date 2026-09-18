const { getRateLimitDatabase } = require('./contactStore.cjs')

let ready
async function database() {
  if (!ready) {
    ready = (async () => {
      const db = await getRateLimitDatabase()
      const schema = `CREATE TABLE IF NOT EXISTS security_rate_limits (
        bucket_key TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at BIGINT NOT NULL
      ); CREATE INDEX IF NOT EXISTS security_rate_limits_expiry ON security_rate_limits (expires_at)`
      if (db.postgres) await db.postgres.query(schema)
      else db.sqlite.exec(schema)
      return db
    })().catch((error) => { ready = undefined; throw error })
  }
  return ready
}

async function consume(key, limit, windowMs) {
  const db = await database()
  const now = Date.now()
  const expires = now + windowMs
  // One atomic UPSERT admits at most `limit` requests, including concurrent workers.
  const sql = `INSERT INTO security_rate_limits (bucket_key, hits, expires_at) VALUES ($1, 1, $2)
    ON CONFLICT (bucket_key) DO UPDATE SET
      hits = CASE WHEN security_rate_limits.expires_at <= $3 THEN 1 ELSE security_rate_limits.hits + 1 END,
      expires_at = CASE WHEN security_rate_limits.expires_at <= $3 THEN $2 ELSE security_rate_limits.expires_at END
    WHERE security_rate_limits.expires_at <= $3 OR security_rate_limits.hits < $4
    RETURNING hits, expires_at`
  let row
  if (db.postgres) {
    row = (await db.postgres.query(sql, [key, expires, now, limit])).rows[0]
  } else {
    row = db.sqlite.prepare(sql).get({ 1: key, 2: expires, 3: now, 4: limit })
  }
  if (row) return { allowed: true, key, hits: Number(row.hits), expiresAt: Number(row.expires_at) }
  const current = db.postgres
    ? (await db.postgres.query('SELECT expires_at FROM security_rate_limits WHERE bucket_key = $1', [key])).rows[0]
    : db.sqlite.prepare('SELECT expires_at FROM security_rate_limits WHERE bucket_key = ?').get(key)
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((Number(current?.expires_at || expires) - now) / 1000)) }
}

async function clearSuccessfulAttempt(reservation) {
  const db = await database()
  // Do not erase failures/reservations added by another request after this login began.
  const sql = 'DELETE FROM security_rate_limits WHERE bucket_key = $1 AND hits = $2 AND expires_at = $3'
  const values = [reservation.key, reservation.hits, reservation.expiresAt]
  if (db.postgres) await db.postgres.query(sql, values)
  else db.sqlite.prepare(sql).run({ 1: values[0], 2: values[1], 3: values[2] })
}

async function cleanup() {
  const db = await database()
  const sql = `DELETE FROM security_rate_limits WHERE bucket_key IN (
    SELECT bucket_key FROM security_rate_limits WHERE expires_at <= $1 ORDER BY expires_at LIMIT 100
  ) AND expires_at <= $1`
  if (db.postgres) await db.postgres.query(sql, [Date.now()])
  else db.sqlite.prepare(sql).run({ 1: Date.now() })
}

module.exports = { consume, clearSuccessfulAttempt, cleanup }
