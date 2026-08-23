const assert = require('node:assert/strict')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const databasePath = path.join(os.tmpdir(), `animus-crm-sync-${process.pid}-${Date.now()}.sqlite`)
process.env.CONTACT_DATABASE_URL = ''
process.env.POSTGRES_URL = ''
process.env.DATABASE_URL = ''
process.env.CONTACT_DB_PATH = databasePath

const {
  backfillCrm,
  createPortalTicket,
  createPortalUser,
  listCrmRecords,
  storeSubmission,
} = require('../server/contactStore.cjs')

test('new intake and portal records are synchronized before their write resolves', async () => {
  await storeSubmission({
    kind: 'contact',
    source: 'test',
    name: 'Jamie Example',
    company: 'Example Manufacturing',
    email: 'jamie@example.test',
    processNeedsImprovement: 'Manual intake',
    currentTools: 'Email and spreadsheets',
    timeline: 'This quarter',
    context: 'Automated test',
  }, 'contact-test-1')

  const portalUser = await createPortalUser({
    email: 'client@example.test',
    password: 'StrongPassword123!',
    displayName: 'Client Example',
  })

  await createPortalTicket({
    requestId: 'ticket-test-1',
    email: portalUser.email,
    subject: 'Test ticket',
    message: 'Verify reliable CRM synchronization.',
  })

  assert.equal((await listCrmRecords('organizations', 100)).length, 1)
  assert.equal((await listCrmRecords('contacts', 100)).length, 2)
  assert.equal((await listCrmRecords('leads', 100)).length, 1)
  assert.equal((await listCrmRecords('tickets', 100)).length, 2)
  assert.equal((await listCrmRecords('activity_events', 100)).length, 2)
})

test('CRM backfill is safe to rerun without duplicating records or activity', async () => {
  const dryRun = await backfillCrm()
  assert.equal(dryRun.mode, 'dry-run')
  assert.deepEqual(dryRun.synced, { submissions: 0, portalUsers: 0, portalTickets: 0 })

  const first = await backfillCrm({ apply: true })
  const countsAfterFirstRun = {
    organizations: (await listCrmRecords('organizations', 100)).length,
    contacts: (await listCrmRecords('contacts', 100)).length,
    leads: (await listCrmRecords('leads', 100)).length,
    tickets: (await listCrmRecords('tickets', 100)).length,
    activity: (await listCrmRecords('activity_events', 100)).length,
  }

  const second = await backfillCrm({ apply: true })
  const countsAfterSecondRun = {
    organizations: (await listCrmRecords('organizations', 100)).length,
    contacts: (await listCrmRecords('contacts', 100)).length,
    leads: (await listCrmRecords('leads', 100)).length,
    tickets: (await listCrmRecords('tickets', 100)).length,
    activity: (await listCrmRecords('activity_events', 100)).length,
  }

  assert.equal(first.failures.length, 0)
  assert.equal(second.failures.length, 0)
  assert.deepEqual(countsAfterSecondRun, countsAfterFirstRun)
})
