const fs = require('node:fs')
const path = require('node:path')
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
  return Boolean(POSTGRES_URL)
}

async function ensurePostgres() {
  if (!postgresPool) {
    postgresPool = new Pool({
      connectionString: POSTGRES_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      ssl: shouldUseSsl(POSTGRES_URL) ? { rejectUnauthorized: false } : false,
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

module.exports = {
  getStorageStatus,
  storeSubmission,
}