# Animus Scripts Web

Operational software consultancy website built with React and Vite.

## Current State

The site is positioned as an operational software, automation, and business intelligence consultancy. It includes:

- a redesigned marketing homepage
- service and detail pages for workflow automation, BI, internal apps, integrations, and Microsoft 365 systems
- a contact flow that posts to a first-party API
- a database-backed submissions store
- an authenticated admin page at `/admin` (also available at `/submissions`)
- optional Microsoft 365 (Office) admin sign-in
- a client portal at `/portal` for user sign up/sign in and ticket tracking

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
npm --prefix AnimusScripts-Web run admin:create -- --username admin --password "StrongPassword123!"
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
- `/admin`
- `/submissions`
- `/portal`

The Vite dev server includes local middleware for `/api/contact`, `/api/admin/*`, and `/api/portal/*` so the browser matches the production flow during development.

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

The storage layer lives in `server/contactStore.cjs` and handles table creation, Postgres/SQLite selection, storage status, recent-submission lookups, and admin user credential verification.

## Submissions Admin

The admin page at `/admin` calls:

- `POST /api/admin/login` for username/password authentication
- `GET /api/admin/submissions` for authenticated submission access
- `GET /api/admin/microsoft/start` to begin Office sign-in
- `GET /api/admin/microsoft/callback` for OAuth return handling

Admin credentials are stored in the `admin_users` table with salted + hashed passwords.

Create or update an admin account with:

```bash
npm --prefix AnimusScripts-Web run admin:create -- --username admin --password "StrongPassword123!"
```

Session tokens are signed with `ADMIN_AUTH_SECRET` (falls back to `ADMIN_SUBMISSIONS_KEY` if needed).

### Office (Microsoft 365) sign-in

You can log in through Microsoft by clicking "Continue with Microsoft 365" on the admin page.

Requirements:

- create a Microsoft Entra app registration
- configure redirect URI to `/api/admin/microsoft/callback`
- set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, and `MICROSOFT_TENANT_ID`
- set at least one allow rule: `ADMIN_ALLOWED_DOMAIN` or `ADMIN_ALLOWED_EMAILS`
- ensure the Microsoft account email exists as an admin username in `admin_users`

The Office login does not bypass your database authorization. It maps Microsoft identity to an existing admin account.

## Client Portal (Tickets)

The client portal page at `/portal` supports:

- `POST /api/portal/signup` to create an account
- `POST /api/portal/login` to sign in
- `GET /api/portal/session` to restore auth session
- `POST /api/portal/logout` to clear session
- `GET /api/portal/tickets` to list the signed-in user's tickets
- `POST /api/portal/tickets` to create a new ticket

Portal sessions use a signed HTTP-only cookie and per-user ticket filtering by account email.
Portal signup/login includes in-memory request throttling with temporary lockout to reduce brute-force attempts.

Optional portal auth throttling configuration:

- `PORTAL_AUTH_MAX_ATTEMPTS` (default `5`)
- `PORTAL_AUTH_WINDOW_MS` (default `600000`)
- `PORTAL_AUTH_LOCK_MS` (default `900000`)

Ticket detail is available by request id through `GET /api/portal/tickets?requestId=<id>` and includes timeline events.

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

- `ADMIN_AUTH_SECRET`
- `USER_AUTH_SECRET`
- `ADMIN_SUBMISSIONS_KEY`

Optional Office login settings:

- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_REDIRECT_URI`
- `ADMIN_ALLOWED_DOMAIN`
- `ADMIN_ALLOWED_EMAILS`

You can also use `DATABASE_URL` instead of `CONTACT_DATABASE_URL`, but keeping the app-specific variable is clearer.

### 3. Verify locally

Create `AnimusScripts-Web/.env.local` with your Neon connection string:

```env
CONTACT_DATABASE_URL=postgres://...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Animus Scripts <onboarding@resend.dev>
CONTACT_TO_EMAIL=info@animusscripts.com
ADMIN_AUTH_SECRET=choose-a-long-random-session-secret
USER_AUTH_SECRET=choose-a-long-random-portal-session-secret
ADMIN_SUBMISSIONS_KEY=choose-a-long-random-internal-key
MICROSOFT_TENANT_ID=common
MICROSOFT_CLIENT_ID=your-entra-app-client-id
MICROSOFT_CLIENT_SECRET=your-entra-app-client-secret
MICROSOFT_REDIRECT_URI=https://www.animusscripts.com/api/admin/microsoft/callback
ADMIN_ALLOWED_DOMAIN=animusscripts.com
ADMIN_ALLOWED_EMAILS=admin@animusscripts.com
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

The admin credential table stores:

- `username`
- `password_hash`
- `created_at`

The portal user table stores:

- `email`
- `display_name`
- `password_hash`
- `created_at`

The portal ticket table stores:

- `request_id`
- `user_email`
- `subject`
- `message`
- `status`
- `source`
- `created_at`

## Notes

- SQLite is fine for local development.
- Do not rely on SQLite for production on Vercel.
- Email notifications are not required for successful capture.
- Admin submissions access is protected by login and signed session tokens.
