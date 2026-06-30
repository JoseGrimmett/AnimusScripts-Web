# Animus Scripts Web

Operational software consultancy website built with React and Vite.

## Current State

The site is positioned as an operational software, automation, and business intelligence consultancy. It includes:

- a redesigned marketing homepage
- service and detail pages for workflow automation, BI, internal apps, integrations, and Microsoft 365 systems
- a contact flow that posts to a first-party API
- a database-backed submissions store
- an internal submissions page at `/submissions`

The app lives in the nested `AnimusScripts-Web/` folder, while the workspace root also contains deployment and API files used by Vercel.

## Local Development

Run from the workspace root:

```bash
npm run dev
```

Other useful commands:

```bash
npm run lint
npm run build
npm --prefix AnimusScripts-Web run verify:db
```

## Routing

Main routes currently include:

- `/`
- `/services`
- `/services/:slug`
- `/what-we-build`
- `/about`
- `/contact`
- `/pricing`
- `/submissions`

The Vite dev server includes local middleware for `/api/contact` and `/api/submissions` so the browser matches the production flow during development.

## Contact Intake Architecture

The website uses a first-party intake API at `api/contact.js`.

Submission flow:

1. Contact and lead forms post to `/api/contact`
2. The API stores submissions in `contact_submissions`
3. Email notification is optional and uses Resend when configured

Storage behavior:

- `CONTACT_DATABASE_URL`, `POSTGRES_URL`, or `DATABASE_URL` configured: uses Postgres
- no Postgres URL configured: uses local SQLite
- Vercel without Postgres: falls back to temporary SQLite in `/tmp`, which is not durable

The storage layer lives in `server/contactStore.cjs` and handles table creation, Postgres/SQLite selection, storage status, and recent-submission lookups.

## Submissions Admin

The internal submissions page at `/submissions` calls `/api/submissions` and shows recent records from the database.

Access control is optional but recommended:

- set `ADMIN_SUBMISSIONS_KEY` in `.env.local` and in Vercel
- unlock the page with that key before viewing or exporting records

If the key is not configured, the submissions endpoint is open.

## Neon Setup

Neon is the recommended production database for this project.

### 1. Create a Neon project

Create a Postgres database in Neon and copy the connection string.

### 2. Add environment variables

In Vercel project settings, add:

- `CONTACT_DATABASE_URL` = your Neon connection string

Optional notification settings:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CONTACT_TO_EMAIL=info@animusscripts.com`

Optional internal access control for the submissions page:

- `ADMIN_SUBMISSIONS_KEY`

You can also use `DATABASE_URL` instead of `CONTACT_DATABASE_URL`, but keeping the app-specific variable is clearer.

### 3. Verify locally

Create `AnimusScripts-Web/.env.local` with your Neon connection string:

```env
CONTACT_DATABASE_URL=postgres://...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Animus Scripts <onboarding@resend.dev>
CONTACT_TO_EMAIL=info@animusscripts.com
ADMIN_SUBMISSIONS_KEY=choose-a-long-random-internal-key
```

Then run:

```bash
npm --prefix AnimusScripts-Web run verify:db
```

Expected result:

- `backend: "postgres"`
- `durable: true`

### 4. Deploy

Redeploy after setting the environment variables in Vercel.

The root-level `vercel.json` provides SPA rewrites so direct routes like `/submissions` resolve correctly in production.

## Submission Schema

The intake system stores:

- `request_id`
- `kind`
- `source`
- `name`
- `company`
- `email`
- `process_needs_improvement`
- `current_tools`
- `timeline`
- `context`
- `raw_payload`
- `created_at`

## Notes

- SQLite is fine for local development.
- Do not rely on SQLite for production on Vercel.
- Email notifications are not required for successful capture.
- The `/submissions` route and `/api/submissions` endpoint are protected by `ADMIN_SUBMISSIONS_KEY` when it is configured.
