const crypto = require('node:crypto')
const { getRateLimitDatabase } = require('./contactStore.cjs')

const POLICIES = {
  admin: { absolute: 8 * 60 * 60 * 1000, idle: 30 * 60 * 1000, table: 'admin_users', identifier: 'username', role: 'u.role' },
  portal: { absolute: 7 * 24 * 60 * 60 * 1000, idle: 24 * 60 * 60 * 1000, table: 'portal_users', identifier: 'email', role: "'portal'" },
}
let ready
async function database() {
  if (!ready) ready = (async () => {
    const db = await getRateLimitDatabase()
    const schema = `CREATE TABLE IF NOT EXISTS security_session_accounts (
      account_type TEXT NOT NULL, user_id BIGINT NOT NULL, version BIGINT NOT NULL DEFAULT 0,
      disabled INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (account_type, user_id)
    );
    CREATE TABLE IF NOT EXISTS security_sessions (
      session_hash TEXT PRIMARY KEY, account_type TEXT NOT NULL, user_id BIGINT NOT NULL,
      account_version BIGINT NOT NULL, credential_hash TEXT NOT NULL,
      created_at BIGINT NOT NULL, expires_at BIGINT NOT NULL, last_seen_at BIGINT NOT NULL,
      idle_expires_at BIGINT NOT NULL, revoked_at BIGINT
    );
    CREATE INDEX IF NOT EXISTS security_sessions_account ON security_sessions (account_type, user_id);
    CREATE INDEX IF NOT EXISTS security_sessions_expiry ON security_sessions (expires_at);
    CREATE INDEX IF NOT EXISTS security_sessions_idle ON security_sessions (idle_expires_at);
    CREATE INDEX IF NOT EXISTS security_sessions_revoked ON security_sessions (revoked_at)`
    if (db.postgres) await db.postgres.query(schema)
    else db.sqlite.exec(schema)
    return db
  })().catch(error => { ready = undefined; throw error })
  return ready
}
async function query(sql, values = []) {
  const db = await database()
  if (db.postgres) return (await db.postgres.query(sql, values)).rows
  const statement = db.sqlite.prepare(sql)
  const bindings = Object.fromEntries(values.map((value, i) => [i + 1, value]))
  if (statement.reader) return statement.all(bindings)
  statement.run(bindings)
  return []
}
function policy(kind) {
  if (!Object.hasOwn(POLICIES, kind)) throw new Error('Invalid account type')
  return POLICIES[kind]
}
function fingerprint(passwordHash, role, identifier) {
  return crypto.createHash('sha256').update(JSON.stringify([passwordHash, role, identifier])).digest('hex')
}
function tokenHash(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)
    ? crypto.createHash('sha256').update(token).digest('hex') : null
}
async function account(kind, id) {
  const p = policy(kind)
  await query(`INSERT INTO security_session_accounts (account_type, user_id)
    SELECT $1, id FROM ${p.table} WHERE id = $2
    ON CONFLICT (account_type, user_id) DO NOTHING`, [kind, String(id)])
  return (await query(`SELECT a.version, a.disabled, u.id, u.password_hash, u.${p.identifier} AS identifier,
    ${p.role} AS role FROM ${p.table} u JOIN security_session_accounts a
    ON a.user_id = u.id AND a.account_type = $1 WHERE u.id = $2`, [kind, String(id)]))[0]
}
async function captureAccount(kind, id) {
  const row = await account(kind, id)
  if (!row || Number(row.disabled)) return null
  return { version: String(row.version), credentialHash: fingerprint(row.password_hash, row.role, row.identifier) }
}
async function cleanup() {
  const now = Date.now()
  // Keep revocation records for up to a day, but never retain expired sessions indefinitely.
  await query(`DELETE FROM security_sessions WHERE session_hash IN (
    SELECT session_hash FROM security_sessions WHERE expires_at <= $1 OR idle_expires_at <= $1 OR revoked_at <= $2 LIMIT 100
  ) AND (expires_at <= $1 OR idle_expires_at <= $1 OR revoked_at <= $2)`, [now, now - 86400000])
}
async function createSession(kind, user, previousToken) {
  const p = policy(kind)
  const row = await account(kind, user.id)
  if (!row || Number(row.disabled)) return null
  const credentialHash = fingerprint(row.password_hash, row.role, row.identifier)
  if (user.authSnapshot && (user.authSnapshot.version !== String(row.version) || user.authSnapshot.credentialHash !== credentialHash)) return null
  const token = crypto.randomBytes(32).toString('base64url')
  const now = Date.now()
  // Conditional insertion closes password/role/disable/revoke races during authentication.
  const inserted = await query(`INSERT INTO security_sessions
    (session_hash, account_type, user_id, account_version, credential_hash, created_at, expires_at, last_seen_at, idle_expires_at)
    SELECT $1, $2, u.id, a.version, $3, $4, $5, $4, $6 FROM ${p.table} u
    JOIN security_session_accounts a ON a.user_id = u.id AND a.account_type = $2
    WHERE u.id = $7 AND a.version = $8 AND a.disabled = 0 AND u.password_hash = $9
      AND ${p.role} = $10 AND u.${p.identifier} = $11 RETURNING session_hash`,
  [tokenHash(token), kind, credentialHash, now, now + p.absolute, now + p.idle,
    String(user.id), String(row.version), row.password_hash, row.role, row.identifier])
  if (!inserted.length) return null
  await revokeSession(kind, previousToken)
  await cleanup()
  return token
}
async function resolveSession(kind, token) {
  const hash = tokenHash(token)
  if (!hash) return null
  const p = policy(kind)
  const row = (await query(`SELECT s.*, a.version AS current_version, a.disabled,
    u.password_hash, u.${p.identifier} AS identifier, ${p.role} AS role
    ${kind === 'portal' ? ', u.display_name' : ''}
    FROM security_sessions s JOIN security_session_accounts a ON a.account_type = s.account_type AND a.user_id = s.user_id
    JOIN ${p.table} u ON u.id = s.user_id WHERE s.session_hash = $1 AND s.account_type = $2`, [hash, kind]))[0]
  const now = Date.now()
  if (!row) return null
  if (row.revoked_at !== null || Number(row.disabled) || String(row.account_version) !== String(row.current_version) ||
    Number(row.expires_at) <= now || Number(row.idle_expires_at) <= now ||
    row.credential_hash !== fingerprint(row.password_hash, row.role, row.identifier)) {
    await revokeSession(kind, token)
    return null
  }
  const touched = await query(`UPDATE security_sessions SET last_seen_at = $1, idle_expires_at = $2
    WHERE session_hash = $3 AND account_type = $4 AND revoked_at IS NULL AND expires_at > $1 AND idle_expires_at > $1
    AND EXISTS (SELECT 1 FROM security_session_accounts a JOIN ${p.table} u ON u.id = a.user_id
      WHERE a.account_type = $4 AND a.user_id = security_sessions.user_id AND a.disabled = 0
      AND a.version = security_sessions.account_version AND u.password_hash = $5 AND ${p.role} = $6
      AND u.${p.identifier} = $7) RETURNING session_hash`,
  [now, Math.min(Number(row.expires_at), now + p.idle), hash, kind, row.password_hash, row.role, row.identifier])
  if (!touched.length) return null
  return {
    id: String(row.user_id), issuedAt: Number(row.created_at), expiresAt: Number(row.expires_at),
    ...(kind === 'admin' ? { username: row.identifier, role: row.role } : { email: row.identifier, displayName: row.display_name }),
  }
}
async function revokeSession(kind, token) {
  const hash = tokenHash(token)
  if (!hash) return
  await query('UPDATE security_sessions SET revoked_at = COALESCE(revoked_at, $1) WHERE session_hash = $2 AND account_type = $3', [Date.now(), hash, kind])
}
async function manageAccount(kind, id, action) {
  if (!['revoke_sessions', 'disable', 'enable'].includes(action)) throw new Error('Invalid session action')
  if (!await account(kind, id)) return false
  // Incrementing the generation atomically invalidates every session, including concurrent issuances.
  await query(`UPDATE security_session_accounts SET version = version + 1
    ${action === 'disable' ? ', disabled = 1' : action === 'enable' ? ', disabled = 0' : ''}
    WHERE account_type = $1 AND user_id = $2`, [kind, String(id)])
  await query(`UPDATE security_sessions SET revoked_at = COALESCE(revoked_at, $1)
    WHERE account_type = $2 AND user_id = $3 AND account_version <
    (SELECT version FROM security_session_accounts WHERE account_type = $2 AND user_id = $3)`, [Date.now(), kind, String(id)])
  await cleanup()
  return true
}
async function accountStatus(kind, id) {
  const row = await account(kind, id)
  return row ? { disabled: Boolean(Number(row.disabled)) } : null
}
async function accountStates(kind) {
  policy(kind)
  const rows = await query('SELECT user_id, disabled FROM security_session_accounts WHERE account_type = $1', [kind])
  return Object.fromEntries(rows.map(row => [String(row.user_id), Boolean(Number(row.disabled))]))
}

class SessionStoreUnavailable extends Error {
  constructor() { super('Session storage is unavailable'); this.code = 'SESSION_STORE_UNAVAILABLE' }
}
const guarded = fn => async (...args) => {
  try { return await fn(...args) } catch { throw new SessionStoreUnavailable() }
}
module.exports = { POLICIES, fingerprint, SessionStoreUnavailable,
  ...Object.fromEntries(Object.entries({ captureAccount, createSession, resolveSession, revokeSession, manageAccount, accountStatus, accountStates, cleanup })
    .map(([name, fn]) => [name, guarded(fn)])),
}
