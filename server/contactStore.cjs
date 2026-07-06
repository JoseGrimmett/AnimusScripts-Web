const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const Database = require('better-sqlite3')
const { Pool } = require('pg')

const POSTGRES_URL =
  process.env.CONTACT_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL || ''
const SQLITE_PATH = process.env.CONTACT_DB_PATH || (
  process.env.VERCEL
    ? '/tmp/animus-submissions.sqlite'
    : path.resolve(__dirname, '../data/animus-submissions.sqlite')
)

let sqliteDb
let sqliteReady = false
let postgresPool
let postgresReady = false
let tempStorageWarned = false

function shouldUseSsl(url) {
  return Boolean(url) && !/localhost|127\.0\.0\.1/i.test(url) && process.env.PGSSLMODE !== 'disable'
}

function getConfiguredPostgresUrl() {
  const url = POSTGRES_URL.trim()

  if (!url) {
    return ''
  }

  if (/^postgres(?:ql)?:\/\/user:password@host(?::\d+)?\/animusscripts/i.test(url)) {
    throw new Error(
      'CONTACT_DATABASE_URL is still set to the placeholder example value. Add your real Neon connection string in Vercel.',
    )
  }

  return url
}

function normalizeSubmission(payload, requestId) {
  return {
    requestId,
    kind: payload.kind === 'lead' ? 'lead' : 'contact',
    source: payload.source || null,
    name: payload.name || null,
    company: payload.company || null,
    email: payload.email || null,
    processNeedsImprovement: payload.processNeedsImprovement || null,
    currentTools: payload.currentTools || null,
    timeline: payload.timeline || null,
    context: payload.context || null,
    rawPayload: JSON.stringify(payload),
  }
}

function shouldUsePostgres() {
  return Boolean(getConfiguredPostgresUrl())
}

function buildPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false
  }

  const [salt, originalHash] = storedHash.split(':')

  if (!salt || !originalHash) {
    return false
  }

  const computedHash = crypto.scryptSync(password, salt, 64).toString('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(computedHash, 'hex'))
  } catch {
    return false
  }
}

async function ensurePostgres() {
  const connectionString = getConfiguredPostgresUrl()

  if (!postgresPool) {
    postgresPool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10000,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
    })
  }

  if (postgresReady) {
    return postgresPool
  }

  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      source TEXT,
      name TEXT,
      company TEXT,
      email TEXT NOT NULL,
      process_needs_improvement TEXT,
      current_tools TEXT,
      timeline TEXT,
      context TEXT,
      raw_payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await postgresPool.query(`
    ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'employee'
  `)

  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS portal_users (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS portal_tickets (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL UNIQUE,
      user_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      source TEXT NOT NULL DEFAULT 'portal',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS portal_ticket_events (
      id BIGSERIAL PRIMARY KEY,
      ticket_request_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      status TEXT,
      note TEXT,
      actor TEXT NOT NULL DEFAULT 'system',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS ticket_assignments (
      request_id TEXT PRIMARY KEY,
      assigned_to TEXT,
      assigned_by TEXT,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  postgresReady = true
  return postgresPool
}

function ensureSqlite() {
  if (!sqliteDb) {
    fs.mkdirSync(path.dirname(SQLITE_PATH), { recursive: true })
    sqliteDb = new Database(SQLITE_PATH)
  }

  if (sqliteReady) {
    return sqliteDb
  }

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      source TEXT,
      name TEXT,
      company TEXT,
      email TEXT NOT NULL,
      process_needs_improvement TEXT,
      current_tools TEXT,
      timeline TEXT,
      context TEXT,
      raw_payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const adminColumns = sqliteDb.prepare('PRAGMA table_info(admin_users)').all()
  const hasRoleColumn = adminColumns.some((column) => column.name === 'role')

  if (!hasRoleColumn) {
    sqliteDb.exec("ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'employee'")
  }

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS portal_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS portal_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      user_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      source TEXT NOT NULL DEFAULT 'portal',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS portal_ticket_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_request_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      status TEXT,
      note TEXT,
      actor TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS ticket_assignments (
      request_id TEXT PRIMARY KEY,
      assigned_to TEXT,
      assigned_by TEXT,
      assigned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  sqliteReady = true
  return sqliteDb
}

async function insertPostgres(record) {
  const pool = await ensurePostgres()
  const result = await pool.query(
    `
      INSERT INTO contact_submissions (
        request_id,
        kind,
        source,
        name,
        company,
        email,
        process_needs_improvement,
        current_tools,
        timeline,
        context,
        raw_payload
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
      RETURNING id, created_at
    `,
    [
      record.requestId,
      record.kind,
      record.source,
      record.name,
      record.company,
      record.email,
      record.processNeedsImprovement,
      record.currentTools,
      record.timeline,
      record.context,
      record.rawPayload,
    ],
  )

  return {
    id: result.rows[0].id,
    createdAt: result.rows[0].created_at,
    backend: 'postgres',
    durable: true,
  }
}

function insertSqlite(record) {
  const db = ensureSqlite()
  const stmt = db.prepare(`
    INSERT INTO contact_submissions (
      request_id,
      kind,
      source,
      name,
      company,
      email,
      process_needs_improvement,
      current_tools,
      timeline,
      context,
      raw_payload
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const result = stmt.run(
    record.requestId,
    record.kind,
    record.source,
    record.name,
    record.company,
    record.email,
    record.processNeedsImprovement,
    record.currentTools,
    record.timeline,
    record.context,
    record.rawPayload,
  )

  const durable = !process.env.VERCEL

  if (!durable && !tempStorageWarned) {
    console.warn('[contact-store] using temporary SQLite storage in /tmp because no Postgres URL is configured')
    tempStorageWarned = true
  }

  return {
    id: result.lastInsertRowid,
    createdAt: new Date().toISOString(),
    backend: 'sqlite',
    durable,
  }
}

async function storeSubmission(payload, requestId) {
  const record = normalizeSubmission(payload, requestId)

  if (shouldUsePostgres()) {
    return insertPostgres(record)
  }

  return insertSqlite(record)
}

async function getStorageStatus() {
  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM contact_submissions')
    return {
      backend: 'postgres',
      durable: true,
      submissionCount: countResult.rows[0].count,
    }
  }

  const db = ensureSqlite()
  const row = db.prepare('SELECT COUNT(*) AS count FROM contact_submissions').get()

  return {
    backend: 'sqlite',
    durable: !process.env.VERCEL,
    submissionCount: row.count,
    filePath: SQLITE_PATH,
  }
}

function mapRow(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    kind: row.kind,
    source: row.source,
    name: row.name,
    company: row.company,
    email: row.email,
    processNeedsImprovement: row.process_needs_improvement,
    currentTools: row.current_tools,
    timeline: row.timeline,
    context: row.context,
    rawPayload: row.raw_payload,
    createdAt: row.created_at,
  }
}

async function getRecentSubmissions(limit = 25) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100))

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      `
        SELECT
          id,
          request_id,
          kind,
          source,
          name,
          company,
          email,
          process_needs_improvement,
          current_tools,
          timeline,
          context,
          raw_payload,
          created_at
        FROM contact_submissions
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [safeLimit],
    )

    return result.rows.map(mapRow)
  }

  const db = ensureSqlite()
  const stmt = db.prepare(`
    SELECT
      id,
      request_id,
      kind,
      source,
      name,
      company,
      email,
      process_needs_improvement,
      current_tools,
      timeline,
      context,
      raw_payload,
      created_at
    FROM contact_submissions
    ORDER BY created_at DESC
    LIMIT ?
  `)

  return stmt.all(safeLimit).map(mapRow)
}

function normalizeAdminRole(role) {
  return String(role || 'employee').trim().toLowerCase() === 'admin' ? 'admin' : 'employee'
}

async function createOrUpdateAdminUser(username, password, role = 'employee') {
  const normalizedUsername = String(username || '').trim().toLowerCase()
  const normalizedRole = normalizeAdminRole(role)

  if (!normalizedUsername || !password) {
    throw new Error('Username and password are required')
  }

  if (normalizedUsername.length < 3) {
    throw new Error('Username must be at least 3 characters long')
  }

  if (String(password).length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }

  const passwordHash = buildPasswordHash(String(password))

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      `
        INSERT INTO admin_users (username, password_hash, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (username)
        DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
        RETURNING id, username, role, created_at
      `,
      [normalizedUsername, passwordHash, normalizedRole],
    )

    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      role: result.rows[0].role,
      createdAt: result.rows[0].created_at,
    }
  }

  const db = ensureSqlite()
  db.prepare(
    `
      INSERT INTO admin_users (username, password_hash)
      VALUES (?, ?)
      ON CONFLICT(username)
      DO UPDATE SET password_hash = excluded.password_hash, role = ?
    `,
  ).run(normalizedUsername, passwordHash, normalizedRole)

  const user = db
    .prepare('SELECT id, username, role, created_at FROM admin_users WHERE username = ?')
    .get(normalizedUsername)

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.created_at,
  }
}

async function listAdminUsers(limit = 100) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200))

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      `
        SELECT id, username, role, created_at
        FROM admin_users
        ORDER BY username ASC
        LIMIT $1
      `,
      [safeLimit],
    )

    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      role: normalizeAdminRole(row.role),
      createdAt: row.created_at,
    }))
  }

  const db = ensureSqlite()
  return db.prepare(
    `
      SELECT id, username, role, created_at
      FROM admin_users
      ORDER BY username ASC
      LIMIT ?
    `,
  ).all(safeLimit).map((row) => ({
    id: row.id,
    username: row.username,
    role: normalizeAdminRole(row.role),
    createdAt: row.created_at,
  }))
}

async function verifyAdminCredentials(username, password) {
  const normalizedUsername = String(username || '').trim().toLowerCase()

  if (!normalizedUsername || !password) {
    return null
  }

  let user

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      'SELECT id, username, role, password_hash, created_at FROM admin_users WHERE username = $1 LIMIT 1',
      [normalizedUsername],
    )

    user = result.rows[0]
  } else {
    const db = ensureSqlite()
    user = db
      .prepare('SELECT id, username, role, password_hash, created_at FROM admin_users WHERE username = ? LIMIT 1')
      .get(normalizedUsername)
  }

  if (!user || !verifyPassword(String(password), user.password_hash)) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    role: normalizeAdminRole(user.role),
    createdAt: user.created_at,
  }
}

async function getAdminUserByUsername(username) {
  const normalizedUsername = String(username || '').trim().toLowerCase()

  if (!normalizedUsername) {
    return null
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      'SELECT id, username, role, created_at FROM admin_users WHERE username = $1 LIMIT 1',
      [normalizedUsername],
    )

    if (!result.rows[0]) {
      return null
    }

    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      role: normalizeAdminRole(result.rows[0].role),
      createdAt: result.rows[0].created_at,
    }
  }

  const db = ensureSqlite()
  const user = db
    .prepare('SELECT id, username, role, created_at FROM admin_users WHERE username = ? LIMIT 1')
    .get(normalizedUsername)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    username: user.username,
    role: normalizeAdminRole(user.role),
    createdAt: user.created_at,
  }
}

function normalizePortalEmail(email) {
  return String(email || '').trim().toLowerCase()
}

async function createPortalUser({ email, password, displayName }) {
  const normalizedEmail = normalizePortalEmail(email)
  const normalizedDisplayName = String(displayName || '').trim() || null

  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required')
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('A valid email is required')
  }

  if (String(password).length < 8) {
    throw new Error('Password must be at least 8 characters long')
  }

  const passwordHash = buildPasswordHash(String(password))

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    let result

    try {
      result = await pool.query(
        `
          INSERT INTO portal_users (email, display_name, password_hash)
          VALUES ($1, $2, $3)
          RETURNING id, email, display_name, created_at
        `,
        [normalizedEmail, normalizedDisplayName, passwordHash],
      )
    } catch (error) {
      if (error?.code === '23505') {
        throw new Error('An account with this email already exists. Please sign in.')
      }

      throw error
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      displayName: result.rows[0].display_name,
      createdAt: result.rows[0].created_at,
    }
  }

  const db = ensureSqlite()
  try {
    db.prepare(
      `
        INSERT INTO portal_users (email, display_name, password_hash)
        VALUES (?, ?, ?)
      `,
    ).run(normalizedEmail, normalizedDisplayName, passwordHash)
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('unique')) {
      throw new Error('An account with this email already exists. Please sign in.')
    }

    throw error
  }

  const user = db
    .prepare('SELECT id, email, display_name, created_at FROM portal_users WHERE email = ?')
    .get(normalizedEmail)

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    createdAt: user.created_at,
  }
}

async function getPortalUserByEmail(email) {
  const normalizedEmail = normalizePortalEmail(email)

  if (!normalizedEmail) {
    return null
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      'SELECT id, email, display_name, password_hash, created_at FROM portal_users WHERE email = $1 LIMIT 1',
      [normalizedEmail],
    )

    if (!result.rows[0]) {
      return null
    }

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      displayName: result.rows[0].display_name,
      passwordHash: result.rows[0].password_hash,
      createdAt: result.rows[0].created_at,
    }
  }

  const db = ensureSqlite()
  const user = db
    .prepare('SELECT id, email, display_name, password_hash, created_at FROM portal_users WHERE email = ? LIMIT 1')
    .get(normalizedEmail)

  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    passwordHash: user.password_hash,
    createdAt: user.created_at,
  }
}

async function verifyPortalCredentials(email, password) {
  const user = await getPortalUserByEmail(email)

  if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  }
}

function mapTicketRow(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    subject: row.subject,
    message: row.message,
    status: row.status,
    source: row.source,
    createdAt: row.created_at,
  }
}

function mapTicketEventRow(row) {
  return {
    id: row.id,
    type: row.event_type,
    status: row.status || null,
    note: row.note || null,
    actor: row.actor || 'system',
    createdAt: row.created_at,
  }
}

function buildFallbackTimeline(ticket) {
  return [
    {
      id: `${ticket.requestId}-created`,
      type: 'ticket_created',
      status: ticket.status,
      note: 'Ticket submitted through the client portal.',
      actor: 'client',
      createdAt: ticket.createdAt,
    },
  ]
}

function mergeTimelineEntries(baseTimeline, extraTimeline) {
  const merged = [...(baseTimeline || []), ...(extraTimeline || [])]

  return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function getLatestStatusFromTimeline(timeline, fallbackStatus) {
  for (let index = (timeline || []).length - 1; index >= 0; index -= 1) {
    const status = timeline[index]?.status

    if (status) {
      return status
    }
  }

  return fallbackStatus
}

async function insertPortalTicketEvent({ requestId, eventType, status = null, note = null, actor = 'system' }) {
  if (!requestId || !eventType) {
    return
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    await pool.query(
      `
        INSERT INTO portal_ticket_events (ticket_request_id, event_type, status, note, actor)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [requestId, eventType, status, note, actor],
    )
    return
  }

  const db = ensureSqlite()
  db.prepare(
    `
      INSERT INTO portal_ticket_events (ticket_request_id, event_type, status, note, actor)
      VALUES (?, ?, ?, ?, ?)
    `,
  ).run(requestId, eventType, status, note, actor)
}

async function createPortalTicket({ requestId, email, subject, message }) {
  const normalizedEmail = normalizePortalEmail(email)
  const normalizedSubject = String(subject || '').trim()
  const normalizedMessage = String(message || '').trim()

  if (!requestId || !normalizedEmail || !normalizedSubject || !normalizedMessage) {
    throw new Error('requestId, email, subject, and message are required')
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      `
        INSERT INTO portal_tickets (request_id, user_email, subject, message)
        VALUES ($1, $2, $3, $4)
        RETURNING id, request_id, subject, message, status, source, created_at
      `,
      [requestId, normalizedEmail, normalizedSubject, normalizedMessage],
    )

    const ticket = mapTicketRow(result.rows[0])
    await insertPortalTicketEvent({
      requestId,
      eventType: 'ticket_created',
      status: ticket.status,
      note: 'Ticket created by client.',
      actor: 'client',
    })
    return ticket
  }

  const db = ensureSqlite()
  db.prepare(
    `
      INSERT INTO portal_tickets (request_id, user_email, subject, message)
      VALUES (?, ?, ?, ?)
    `,
  ).run(requestId, normalizedEmail, normalizedSubject, normalizedMessage)

  const row = db
    .prepare('SELECT id, request_id, subject, message, status, source, created_at FROM portal_tickets WHERE request_id = ?')
    .get(requestId)

  const ticket = mapTicketRow(row)
  await insertPortalTicketEvent({
    requestId,
    eventType: 'ticket_created',
    status: ticket.status,
    note: 'Ticket created by client.',
    actor: 'client',
  })
  return ticket
}

function mapSubmissionToTicket(row) {
  const subject = row.kind === 'lead'
    ? 'Lead inquiry'
    : row.process_needs_improvement || 'Contact request'

  const messageParts = [
    row.process_needs_improvement ? `Process: ${row.process_needs_improvement}` : null,
    row.current_tools ? `Current tools: ${row.current_tools}` : null,
    row.timeline ? `Timeline: ${row.timeline}` : null,
    row.context ? `Context: ${row.context}` : null,
  ].filter(Boolean)

  return {
    id: `contact-${row.id}`,
    requestId: row.request_id,
    subject,
    message: messageParts.join(' | ') || 'Submission captured from website contact form.',
    status: 'received',
    source: 'contact-form',
    createdAt: row.created_at,
    timeline: [
      {
        id: `${row.request_id}-received`,
        type: 'submission_received',
        status: 'received',
        note: 'Contact request received from website form.',
        actor: 'system',
        createdAt: row.created_at,
      },
    ],
  }
}

async function getPortalTicketDetailByEmail(email, requestId) {
  const normalizedEmail = normalizePortalEmail(email)
  const normalizedRequestId = String(requestId || '').trim()

  if (!normalizedEmail || !normalizedRequestId) {
    return null
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const ticketResult = await pool.query(
      `
        SELECT id, request_id, subject, message, status, source, created_at
        FROM portal_tickets
        WHERE LOWER(user_email) = LOWER($1) AND request_id = $2
        LIMIT 1
      `,
      [normalizedEmail, normalizedRequestId],
    )

    if (ticketResult.rows[0]) {
      const ticket = mapTicketRow(ticketResult.rows[0])
      const eventResult = await pool.query(
        `
          SELECT id, event_type, status, note, actor, created_at
          FROM portal_ticket_events
          WHERE ticket_request_id = $1
          ORDER BY created_at ASC
        `,
        [ticket.requestId],
      )

      ticket.timeline = eventResult.rows.length
        ? eventResult.rows.map(mapTicketEventRow)
        : buildFallbackTimeline(ticket)

      return ticket
    }

    const submissionResult = await pool.query(
      `
        SELECT
          id,
          request_id,
          kind,
          process_needs_improvement,
          current_tools,
          timeline,
          context,
          created_at
        FROM contact_submissions
        WHERE LOWER(email) = LOWER($1) AND request_id = $2
        LIMIT 1
      `,
      [normalizedEmail, normalizedRequestId],
    )

    if (!submissionResult.rows[0]) {
      return null
    }

    return mapSubmissionToTicket(submissionResult.rows[0])
  }

  const db = ensureSqlite()
  const ticketRow = db.prepare(
    `
      SELECT id, request_id, subject, message, status, source, created_at
      FROM portal_tickets
      WHERE LOWER(user_email) = LOWER(?) AND request_id = ?
      LIMIT 1
    `,
  ).get(normalizedEmail, normalizedRequestId)

  if (ticketRow) {
    const ticket = mapTicketRow(ticketRow)
    const events = db.prepare(
      `
        SELECT id, event_type, status, note, actor, created_at
        FROM portal_ticket_events
        WHERE ticket_request_id = ?
        ORDER BY created_at ASC
      `,
    ).all(ticket.requestId)

    ticket.timeline = events.length
      ? events.map(mapTicketEventRow)
      : buildFallbackTimeline(ticket)

    return ticket
  }

  const submissionRow = db.prepare(
    `
      SELECT
        id,
        request_id,
        kind,
        process_needs_improvement,
        current_tools,
        timeline,
        context,
        created_at
      FROM contact_submissions
      WHERE LOWER(email) = LOWER(?) AND request_id = ?
      LIMIT 1
    `,
  ).get(normalizedEmail, normalizedRequestId)

  if (!submissionRow) {
    return null
  }

  return mapSubmissionToTicket(submissionRow)
}

async function getTicketAssignmentsByRequestIds(requestIds) {
  const ids = [...new Set((requestIds || []).map((item) => String(item || '').trim()).filter(Boolean))]

  if (!ids.length) {
    return new Map()
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      `
        SELECT request_id, assigned_to, assigned_by, assigned_at
        FROM ticket_assignments
        WHERE request_id = ANY($1::text[])
      `,
      [ids],
    )

    return new Map(result.rows.map((row) => [
      row.request_id,
      {
        assignedTo: row.assigned_to,
        assignedBy: row.assigned_by,
        assignedAt: row.assigned_at,
      },
    ]))
  }

  const db = ensureSqlite()
  const placeholders = ids.map(() => '?').join(',')
  const rows = db.prepare(
    `
      SELECT request_id, assigned_to, assigned_by, assigned_at
      FROM ticket_assignments
      WHERE request_id IN (${placeholders})
    `,
  ).all(...ids)

  return new Map(rows.map((row) => [
    row.request_id,
    {
      assignedTo: row.assigned_to,
      assignedBy: row.assigned_by,
      assignedAt: row.assigned_at,
    },
  ]))
}

async function getTicketEventsByRequestId(requestId) {
  const normalizedRequestId = String(requestId || '').trim()

  if (!normalizedRequestId) {
    return []
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      `
        SELECT id, event_type, status, note, actor, created_at
        FROM portal_ticket_events
        WHERE ticket_request_id = $1
        ORDER BY created_at ASC
      `,
      [normalizedRequestId],
    )

    return result.rows.map(mapTicketEventRow)
  }

  const db = ensureSqlite()
  const rows = db.prepare(
    `
      SELECT id, event_type, status, note, actor, created_at
      FROM portal_ticket_events
      WHERE ticket_request_id = ?
      ORDER BY created_at ASC
    `,
  ).all(normalizedRequestId)

  return rows.map(mapTicketEventRow)
}

async function getLatestTicketStatusMap(requestIds) {
  const ids = [...new Set((requestIds || []).map((item) => String(item || '').trim()).filter(Boolean))]

  if (!ids.length) {
    return new Map()
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const result = await pool.query(
      `
        SELECT DISTINCT ON (ticket_request_id)
          ticket_request_id,
          status,
          created_at
        FROM portal_ticket_events
        WHERE ticket_request_id = ANY($1::text[])
          AND status IS NOT NULL
        ORDER BY ticket_request_id, created_at DESC
      `,
      [ids],
    )

    return new Map(result.rows.map((row) => [row.ticket_request_id, row.status]))
  }

  const db = ensureSqlite()
  const placeholders = ids.map(() => '?').join(',')
  const rows = db.prepare(
    `
      SELECT e.ticket_request_id, e.status
      FROM portal_ticket_events e
      INNER JOIN (
        SELECT ticket_request_id, MAX(created_at) AS max_created_at
        FROM portal_ticket_events
        WHERE ticket_request_id IN (${placeholders})
          AND status IS NOT NULL
        GROUP BY ticket_request_id
      ) latest
      ON latest.ticket_request_id = e.ticket_request_id
      AND latest.max_created_at = e.created_at
    `,
  ).all(...ids)

  return new Map(rows.map((row) => [row.ticket_request_id, row.status]))
}

async function assignAdminTicket(requestId, assignedTo, assignedBy) {
  const normalizedRequestId = String(requestId || '').trim()
  const normalizedAssignedTo = String(assignedTo || '').trim().toLowerCase()
  const normalizedAssignedBy = String(assignedBy || '').trim().toLowerCase() || 'system'

  if (!normalizedRequestId) {
    throw new Error('requestId is required')
  }

  if (normalizedAssignedTo) {
    const assignee = await getAdminUserByUsername(normalizedAssignedTo)

    if (!assignee) {
      throw new Error('Assigned user was not found')
    }
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()

    const existing = await pool.query(
      `
        SELECT assigned_to
        FROM ticket_assignments
        WHERE request_id = $1
        LIMIT 1
      `,
      [normalizedRequestId],
    )
    const previousAssignee = existing.rows[0]?.assigned_to || null

    if (!normalizedAssignedTo) {
      await pool.query('DELETE FROM ticket_assignments WHERE request_id = $1', [normalizedRequestId])
      await insertPortalTicketEvent({
        requestId: normalizedRequestId,
        eventType: 'assignment_changed',
        status: null,
        note: previousAssignee
          ? `Ticket unassigned by ${normalizedAssignedBy}. Previous owner: ${previousAssignee}.`
          : `Ticket unassigned by ${normalizedAssignedBy}.`,
        actor: normalizedAssignedBy,
      })
      return {
        requestId: normalizedRequestId,
        assignedTo: null,
        assignedBy: normalizedAssignedBy,
        assignedAt: null,
      }
    }

    const result = await pool.query(
      `
        INSERT INTO ticket_assignments (request_id, assigned_to, assigned_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (request_id)
        DO UPDATE SET
          assigned_to = EXCLUDED.assigned_to,
          assigned_by = EXCLUDED.assigned_by,
          assigned_at = NOW()
        RETURNING request_id, assigned_to, assigned_by, assigned_at
      `,
      [normalizedRequestId, normalizedAssignedTo, normalizedAssignedBy],
    )

    await insertPortalTicketEvent({
      requestId: normalizedRequestId,
      eventType: 'assignment_changed',
      status: null,
      note: previousAssignee && previousAssignee !== normalizedAssignedTo
        ? `Assigned to ${normalizedAssignedTo} by ${normalizedAssignedBy}. Previous owner: ${previousAssignee}.`
        : `Assigned to ${normalizedAssignedTo} by ${normalizedAssignedBy}.`,
      actor: normalizedAssignedBy,
    })

    return {
      requestId: result.rows[0].request_id,
      assignedTo: result.rows[0].assigned_to,
      assignedBy: result.rows[0].assigned_by,
      assignedAt: result.rows[0].assigned_at,
    }
  }

  const db = ensureSqlite()
  const existing = db.prepare('SELECT assigned_to FROM ticket_assignments WHERE request_id = ? LIMIT 1').get(normalizedRequestId)
  const previousAssignee = existing?.assigned_to || null

  if (!normalizedAssignedTo) {
    db.prepare('DELETE FROM ticket_assignments WHERE request_id = ?').run(normalizedRequestId)
    await insertPortalTicketEvent({
      requestId: normalizedRequestId,
      eventType: 'assignment_changed',
      status: null,
      note: previousAssignee
        ? `Ticket unassigned by ${normalizedAssignedBy}. Previous owner: ${previousAssignee}.`
        : `Ticket unassigned by ${normalizedAssignedBy}.`,
      actor: normalizedAssignedBy,
    })
    return {
      requestId: normalizedRequestId,
      assignedTo: null,
      assignedBy: normalizedAssignedBy,
      assignedAt: null,
    }
  }

  db.prepare(
    `
      INSERT INTO ticket_assignments (request_id, assigned_to, assigned_by)
      VALUES (?, ?, ?)
      ON CONFLICT(request_id)
      DO UPDATE SET
        assigned_to = excluded.assigned_to,
        assigned_by = excluded.assigned_by,
        assigned_at = CURRENT_TIMESTAMP
    `,
  ).run(normalizedRequestId, normalizedAssignedTo, normalizedAssignedBy)

    await insertPortalTicketEvent({
      requestId: normalizedRequestId,
      eventType: 'assignment_changed',
      status: null,
      note: previousAssignee && previousAssignee !== normalizedAssignedTo
        ? `Assigned to ${normalizedAssignedTo} by ${normalizedAssignedBy}. Previous owner: ${previousAssignee}.`
        : `Assigned to ${normalizedAssignedTo} by ${normalizedAssignedBy}.`,
      actor: normalizedAssignedBy,
    })

  const row = db.prepare(
    'SELECT request_id, assigned_to, assigned_by, assigned_at FROM ticket_assignments WHERE request_id = ?',
  ).get(normalizedRequestId)

  return {
    requestId: row.request_id,
    assignedTo: row.assigned_to,
    assignedBy: row.assigned_by,
    assignedAt: row.assigned_at,
  }
}

function normalizeTicketStatus(status) {
  const value = String(status || '').trim().toLowerCase()

  if (value === 'in-progress') {
    return 'in-progress'
  }

  if (value === 'waiting') {
    return 'waiting'
  }

  if (value === 'resolved') {
    return 'resolved'
  }

  return 'open'
}

async function updateAdminTicketStatus(requestId, status, updatedBy, note = '') {
  const normalizedRequestId = String(requestId || '').trim()
  const normalizedStatus = normalizeTicketStatus(status)
  const normalizedUpdatedBy = String(updatedBy || '').trim().toLowerCase() || 'system'
  const normalizedNote = String(note || '').trim()

  if (!normalizedRequestId) {
    throw new Error('requestId is required')
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    await pool.query(
      `
        UPDATE portal_tickets
        SET status = $1
        WHERE request_id = $2
      `,
      [normalizedStatus, normalizedRequestId],
    )
  } else {
    const db = ensureSqlite()
    db.prepare(
      `
        UPDATE portal_tickets
        SET status = ?
        WHERE request_id = ?
      `,
    ).run(normalizedStatus, normalizedRequestId)
  }

  await insertPortalTicketEvent({
    requestId: normalizedRequestId,
    eventType: 'status_changed',
    status: normalizedStatus,
    note: normalizedNote || `Status updated to ${normalizedStatus}.`,
    actor: normalizedUpdatedBy,
  })

  return {
    requestId: normalizedRequestId,
    status: normalizedStatus,
    updatedBy: normalizedUpdatedBy,
  }
}

async function getAdminTicketDetail(requestId) {
  const normalizedRequestId = String(requestId || '').trim()

  if (!normalizedRequestId) {
    return null
  }

  let ticket = null

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const ticketResult = await pool.query(
      `
        SELECT id, request_id, subject, message, status, source, created_at
        FROM portal_tickets
        WHERE request_id = $1
        LIMIT 1
      `,
      [normalizedRequestId],
    )

    if (ticketResult.rows[0]) {
      ticket = mapTicketRow(ticketResult.rows[0])
      const events = await getTicketEventsByRequestId(ticket.requestId)
      ticket.timeline = events.length
        ? mergeTimelineEntries(buildFallbackTimeline(ticket), events)
        : buildFallbackTimeline(ticket)
      ticket.status = getLatestStatusFromTimeline(ticket.timeline, ticket.status)
    } else {
      const submissionResult = await pool.query(
        `
          SELECT
            id,
            request_id,
            kind,
            process_needs_improvement,
            current_tools,
            timeline,
            context,
            created_at
          FROM contact_submissions
          WHERE request_id = $1
          LIMIT 1
        `,
        [normalizedRequestId],
      )

      if (submissionResult.rows[0]) {
        ticket = mapSubmissionToTicket(submissionResult.rows[0])
        const events = await getTicketEventsByRequestId(ticket.requestId)
        ticket.timeline = mergeTimelineEntries(ticket.timeline, events)
        ticket.status = getLatestStatusFromTimeline(ticket.timeline, ticket.status)
      }
    }
  } else {
    const db = ensureSqlite()
    const ticketRow = db.prepare(
      `
        SELECT id, request_id, subject, message, status, source, created_at
        FROM portal_tickets
        WHERE request_id = ?
        LIMIT 1
      `,
    ).get(normalizedRequestId)

    if (ticketRow) {
      ticket = mapTicketRow(ticketRow)
      const events = await getTicketEventsByRequestId(ticket.requestId)
      ticket.timeline = events.length
        ? mergeTimelineEntries(buildFallbackTimeline(ticket), events)
        : buildFallbackTimeline(ticket)
      ticket.status = getLatestStatusFromTimeline(ticket.timeline, ticket.status)
    } else {
      const submissionRow = db.prepare(
        `
          SELECT
            id,
            request_id,
            kind,
            process_needs_improvement,
            current_tools,
            timeline,
            context,
            created_at
          FROM contact_submissions
          WHERE request_id = ?
          LIMIT 1
        `,
      ).get(normalizedRequestId)

      if (submissionRow) {
        ticket = mapSubmissionToTicket(submissionRow)
        const events = await getTicketEventsByRequestId(ticket.requestId)
        ticket.timeline = mergeTimelineEntries(ticket.timeline, events)
        ticket.status = getLatestStatusFromTimeline(ticket.timeline, ticket.status)
      }
    }
  }

  if (!ticket) {
    return null
  }

  const assignmentMap = await getTicketAssignmentsByRequestIds([ticket.requestId])
  const assignment = assignmentMap.get(ticket.requestId)

  return {
    ...ticket,
    assignedTo: assignment?.assignedTo || null,
    assignedBy: assignment?.assignedBy || null,
    assignedAt: assignment?.assignedAt || null,
  }
}

async function getAdminTickets(limit = 200) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 500))
  let tickets = []

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const [ticketResult, submissionResult] = await Promise.all([
      pool.query(
        `
          SELECT id, request_id, subject, message, status, source, created_at
          FROM portal_tickets
          ORDER BY created_at DESC
          LIMIT $1
        `,
        [safeLimit],
      ),
      pool.query(
        `
          SELECT
            id,
            request_id,
            kind,
            process_needs_improvement,
            current_tools,
            timeline,
            context,
            created_at
          FROM contact_submissions
          ORDER BY created_at DESC
          LIMIT $1
        `,
        [safeLimit],
      ),
    ])

    tickets = [
      ...ticketResult.rows.map(mapTicketRow),
      ...submissionResult.rows.map(mapSubmissionToTicket),
    ]
  } else {
    const db = ensureSqlite()
    const portalRows = db.prepare(
      `
        SELECT id, request_id, subject, message, status, source, created_at
        FROM portal_tickets
        ORDER BY created_at DESC
        LIMIT ?
      `,
    ).all(safeLimit)

    const submissionRows = db.prepare(
      `
        SELECT
          id,
          request_id,
          kind,
          process_needs_improvement,
          current_tools,
          timeline,
          context,
          created_at
        FROM contact_submissions
        ORDER BY created_at DESC
        LIMIT ?
      `,
    ).all(safeLimit)

    tickets = [
      ...portalRows.map(mapTicketRow),
      ...submissionRows.map(mapSubmissionToTicket),
    ]
  }

  tickets = tickets
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, safeLimit)

  const assignmentMap = await getTicketAssignmentsByRequestIds(tickets.map((ticket) => ticket.requestId))
  const statusMap = await getLatestTicketStatusMap(tickets.map((ticket) => ticket.requestId))

  return tickets.map((ticket) => {
    const assignment = assignmentMap.get(ticket.requestId)

    return {
      ...ticket,
      status: statusMap.get(ticket.requestId) || ticket.status,
      assignedTo: assignment?.assignedTo || null,
      assignedBy: assignment?.assignedBy || null,
      assignedAt: assignment?.assignedAt || null,
    }
  })
}

async function getPortalTicketsByEmail(email, limit = 100) {
  const normalizedEmail = normalizePortalEmail(email)
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 200))

  if (!normalizedEmail) {
    return []
  }

  if (shouldUsePostgres()) {
    const pool = await ensurePostgres()
    const [ticketResult, submissionResult] = await Promise.all([
      pool.query(
        `
          SELECT id, request_id, subject, message, status, source, created_at
          FROM portal_tickets
          WHERE LOWER(user_email) = LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2
        `,
        [normalizedEmail, safeLimit],
      ),
      pool.query(
        `
          SELECT
            id,
            request_id,
            kind,
            process_needs_improvement,
            current_tools,
            timeline,
            context,
            created_at
          FROM contact_submissions
          WHERE LOWER(email) = LOWER($1)
          ORDER BY created_at DESC
          LIMIT $2
        `,
        [normalizedEmail, safeLimit],
      ),
    ])

    const tickets = ticketResult.rows.map(mapTicketRow)
    const submissionTickets = submissionResult.rows.map(mapSubmissionToTicket)
    return [...tickets, ...submissionTickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, safeLimit)
  }

  const db = ensureSqlite()
  const tickets = db.prepare(
    `
      SELECT id, request_id, subject, message, status, source, created_at
      FROM portal_tickets
      WHERE LOWER(user_email) = LOWER(?)
      ORDER BY created_at DESC
      LIMIT ?
    `,
  ).all(normalizedEmail, safeLimit).map(mapTicketRow)

  const submissions = db.prepare(
    `
      SELECT
        id,
        request_id,
        kind,
        process_needs_improvement,
        current_tools,
        timeline,
        context,
        created_at
      FROM contact_submissions
      WHERE LOWER(email) = LOWER(?)
      ORDER BY created_at DESC
      LIMIT ?
    `,
  ).all(normalizedEmail, safeLimit).map(mapSubmissionToTicket)

  return [...tickets, ...submissions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, safeLimit)
}

module.exports = {
  assignAdminTicket,
  createOrUpdateAdminUser,
  createPortalTicket,
  createPortalUser,
  getAdminTicketDetail,
  getAdminTickets,
  getAdminUserByUsername,
  getPortalTicketDetailByEmail,
  getPortalTicketsByEmail,
  getPortalUserByEmail,
  getStorageStatus,
  getRecentSubmissions,
  listAdminUsers,
  storeSubmission,
  updateAdminTicketStatus,
  verifyAdminCredentials,
  verifyPortalCredentials,
}