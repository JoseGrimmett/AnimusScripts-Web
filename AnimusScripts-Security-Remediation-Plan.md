# Animus Scripts Security Remediation Plan

**Target:** [www.animusscripts.com](https://www.animusscripts.com/)  
**Repository:** [JoseGrimmett/AnimusScripts-Web](https://github.com/JoseGrimmett/AnimusScripts-Web)  
**Audit baseline:** `main` at commit `2139c70`  
**Prepared:** September 16, 2026  
**Purpose:** Implementation backlog for remediating findings from the source-code and non-destructive production security review.

## Current assessment

### Implementation progress — September 17, 2026

- **P0 live verification:** The owner reports the latest P0 batch is deployed and working. This records functional confirmation, not independent completion of every provider/production checklist item.
- **P1-1 and P1-2 implemented locally; deployment verification pending.** Added enforced CSP, framing protection, MIME/referrer/permissions headers, and explicit no-store directives for browsers and CDNs on all API responses. The same policy covers shared handlers, wrappers, OAuth redirects, and error responses. Existing static caching and platform HSTS are preserved.
- **Validation:** API regression tests now assert headers across successful/denied flows; new tests cover every API wrapper, OAuth redirects, 429/503 errors, and CSP restrictions. Production-build browser checks covered public pages, portal, and authenticated staff pages with synthetic data; inline and unapproved external scripts were blocked. See [policy and rollout checks](docs/security-response-headers.md). Live Vercel/CDN headers, Analytics collection, and provider OAuth checks remain pending.
- **Next:** Deploy and verify P1-1/P1-2, then implement P1-3 revocable sessions. No database migration or new environment variable is required for this header batch.

### Implementation progress — September 16, 2026

- **P0-2 implemented locally; deployment verification pending.** Shared admin and portal handlers reject modifying requests with missing, malformed, or unapproved Origin headers. Production cookies now use `__Host-` names, `Secure`, `HttpOnly`, `Path=/`, and `SameSite=Lax`. Existing production sessions require a fresh login; legacy cookie names are no longer accepted in production. Microsoft top-level GET callbacks remain outside the mutation check; complete OIDC validation remains P1-5.
- **P0-3 implemented locally; deployment verification pending.** Login/signup JSON no longer includes tokens, session resolution accepts cookies only, and frontend bearer headers, token state, and browser-storage compatibility code are removed. Staff logout callers now submit the explicit logout action expected by the production handler.
- **Origin configuration:** Production accepts `https://www.animusscripts.com` and `https://animusscripts.com`. Add explicitly approved HTTPS preview origins using the comma-separated server variable `TRUSTED_APP_ORIGINS` (exact origins, no paths or wildcards). Local development additionally permits HTTP loopback origins on ports 5173 and 4173; explicitly configure other loopback ports in that variable when using a custom Vite port. HTTP entries are ignored in production/Vercel. Requests must supply Origin in development too. Never populate this setting from request Host or forwarded headers.
- **Validation:** Cookie-based tenant isolation/staff ticket lifecycle tests, production cookie and bearer rejection tests, origin rejection tests across all shared mutation handlers, explicit preview/local configuration tests, lint, and production build. Production browser/OAuth verification remains outstanding.
- **Live confirmation:** The owner reports that the deployed P0-2/P0-3 changes are working and authorized the next batch. This is owner-reported functional verification; it does not independently certify every production checklist item or the outstanding OIDC work.
- **P0-1 implemented locally; new deployment verification pending.** Database-backed atomic counters now cover staff/portal login, signup, Microsoft start/callback, contact/lead submissions, and portal ticket creation/replies. Network and account quotas are independent; missing production PostgreSQL fails closed. Password hashing is asynchronous. See [rate-limit policies and rollout instructions](docs/security-rate-limits.md).
- **P0-4 implemented locally; new deployment verification pending.** React Router and React Router DOM are upgraded to 7.18.4 with the lockfile updated. Production audit reports zero vulnerabilities. Dependabot and a GitHub workflow for tests, PostgreSQL integration, lint, build, and high/critical production audit failures are added. Required GitHub branch protection still needs configuration.
- **Second-batch validation:** All 13 tests pass locally, including the original isolation/lifecycle coverage; all 7 rate-limit tests also pass against a disposable PostgreSQL 18.4 instance. Syntax checks, lint, build, and diff checks pass. The PostgreSQL test checks parallel admission and a separate process observing an active lockout. GitHub CI itself has not yet run. No live database was used for testing.
- **Next:** Deploy and verify this batch, then P1 security headers, sensitive-response cache policy, and revocable sessions. All other backlog items remain open. Sessions are still stateless until P1-3; clearing the cookie does not yet revoke a copied token server-side.

No public disclosure of customer or administrator data was identified during the review. Unauthenticated requests to submissions, tickets, users, CRM, and portal endpoints returned `401 Unauthorized`. Server-side authorization and customer ticket isolation are present.

The application should not yet be treated as fully hardened for sensitive customer or administrator data. The highest-priority gaps are login abuse protection, CSRF/cookie configuration, vulnerable dependencies, token exposure to JavaScript, and missing security headers.

## Definition of done

This plan is complete when:

- Every Priority 0 and Priority 1 item is implemented and deployed.
- Automated tests cover authentication, authorization, tenant isolation, CSRF rejection, rate limiting, and session revocation.
- `npm audit --omit=dev` reports no known high or critical vulnerabilities.
- Production headers and cookies have been verified against the deployed site.
- Vercel, Neon, Microsoft Entra, Resend, and GitHub configuration have been manually reviewed.
- A controlled authenticated penetration test has been completed against a non-production environment.

---

# Priority 0 — Immediate security work

These items should be completed before storing additional sensitive customer information or adding more administrator accounts.

## P0-1: Implement durable authentication rate limiting

**Finding:** Administrator login has no rate limiting. Portal throttling uses an in-memory `Map`, which is not reliable across Vercel serverless instances, deployments, restarts, or regions.

**Risk:** Password guessing, credential stuffing, account takeover, and CPU denial of service. Password verification uses synchronous scrypt, so repeated attempts consume server execution time.

### Required implementation

- Replace the in-memory portal attempt store with a shared, durable store such as:
  - Upstash Redis or Vercel KV; or
  - PostgreSQL with expiration and indexed lookup fields.
- Apply rate limiting to:
  - `POST /api/admin/auth` and `/api/admin/login`
  - `POST /api/portal/login`
  - `POST /api/portal/signup`
  - Microsoft authentication initiation and callback failure paths
  - `POST /api/contact`
  - Portal ticket creation and replies
- Enforce limits using both:
  - Source IP/network; and
  - Normalized account identifier, such as username or email.
- Add a broader per-IP limit so attackers cannot bypass protection by changing the username/email each attempt.
- Return `429 Too Many Requests` and a valid `Retry-After` header.
- Do not reveal whether an administrator username or portal email exists.
- Log rate-limit events without logging passwords, session tokens, or complete request bodies.
- Consider moving password verification off the main event loop or using an asynchronous password-hashing implementation.

### Acceptance criteria

- Five or another documented number of failed attempts results in a temporary lockout.
- The lockout is enforced from a separate serverless instance/process.
- Restarting or redeploying the application does not clear active lockouts.
- Varying usernames from the same IP eventually triggers the IP-wide limit.
- A successful login clears or appropriately reduces account-specific failure state.
- Automated tests verify account, IP, expiry, and successful-login behavior.

## P0-2: Correct cookie policy and add CSRF protection

**Finding:** Administrator and portal cookies are set with `SameSite=None`, while state-changing requests do not validate a CSRF token or the request's `Origin`/`Referer`.

**Risk:** A malicious website may cause an authenticated browser to submit state-changing requests to Animus Scripts.

### Required implementation

- Change both session cookies to `SameSite=Lax` or `SameSite=Strict` unless a documented cross-site requirement exists.
- Keep `Secure` and `HttpOnly` enabled in production.
- Prefer host-only cookies with names such as:
  - `__Host-animus_admin_session`
  - `__Host-animus_portal_session`
- Do not set a `Domain` attribute for `__Host-` cookies; retain `Path=/` and `Secure`.
- For every authenticated `POST`, `PUT`, `PATCH`, and `DELETE` route:
  - Reject missing or untrusted `Origin` values in production; and
  - Use a CSRF token if `SameSite=None` remains necessary.
- Restrict accepted origins to canonical production origins, including only those genuinely needed.
- Ensure logout and OAuth-related flows remain functional under the new cookie policy.

### Acceptance criteria

- Cross-origin state-changing requests from an unapproved origin receive `403`.
- Same-origin state-changing requests continue to work.
- Production cookies show `Secure`, `HttpOnly`, `Path=/`, and the approved `SameSite` value.
- No authenticated action relies solely on a cross-site cookie.
- Automated tests cover trusted origin, missing origin, malicious origin, and valid CSRF behavior.

## P0-3: Stop returning session tokens to browser JavaScript

**Finding:** Admin login, portal login, and portal signup place the signed session token in an `HttpOnly` cookie but also return it in the JSON response. The admin code retains bearer-token compatibility and references browser storage cleanup.

**Risk:** Returning the token to JavaScript reduces the value of `HttpOnly`; an XSS vulnerability could read and exfiltrate the token.

### Required implementation

- Remove `token` from authentication JSON responses.
- Use the `HttpOnly` session cookie as the browser's only authentication credential.
- Remove bearer-token fallback from browser-facing session resolution unless a separate, documented API client requires it.
- Remove obsolete `localStorage` session-token compatibility and related UI state.
- Return only non-sensitive account details after authentication, for example:

```json
{
  "ok": true,
  "user": {
    "id": 1,
    "username": "employee@example.com",
    "role": "employee"
  }
}
```

- Make sure tokens never appear in logs, analytics, error reports, URLs, or frontend state snapshots.

### Acceptance criteria

- Login and signup responses do not contain a token.
- The application functions using `credentials: "include"` and the session cookie.
- Searching built assets for session-token storage logic returns no active implementation.
- An XSS running in the origin cannot read the session cookie through `document.cookie`.

## P0-4: Upgrade vulnerable production dependencies

**Finding:** `npm audit --omit=dev` reported two high-severity findings associated with the installed `react-router` and `react-router-dom` versions.

**Risk:** The advisories include redirect, XSS, denial-of-service, CSRF/server-action, and deserialization-related issues. Not every advisory is necessarily reachable in this SPA, but vulnerable production packages should still be upgraded.

### Required implementation

- Upgrade `react-router` and `react-router-dom` to patched compatible releases.
- Regenerate and commit `package-lock.json`.
- Review breaking changes rather than applying a blind upgrade in production.
- Run:

```bash
npm audit --omit=dev
npm test
npm run lint
npm run build
```

- Enable Dependabot or an equivalent dependency-update service.
- Configure CI to fail on new high or critical production dependency findings, with a documented exception process for non-reachable advisories.

### Acceptance criteria

- `npm audit --omit=dev` reports no high or critical vulnerabilities.
- Existing routing, redirects, authentication guards, and navigation work in production.
- Tests, lint, and production build pass.

---

# Priority 1 — High-value production hardening

## P1-1: Add comprehensive security headers

**Finding:** The live site provides HTTPS and HSTS, but the review did not observe a Content Security Policy, clickjacking protection, `nosniff`, a referrer policy, or a permissions policy.

**Risk:** Greater impact from XSS, framing/clickjacking, MIME confusion, information leakage through referrers, and unnecessary browser capabilities.

### Required implementation

- Configure headers in `vercel.json` or a centralized server response helper.
- Add at minimum:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` with unused capabilities disabled
  - `X-Frame-Options: DENY` as legacy defense, while using CSP `frame-ancestors 'none'`
- Build the CSP from observed application requirements. Avoid broad `*`, `unsafe-eval`, and `unsafe-inline` allowances.
- Explicitly allow only required script, style, image, font, connection, form, and frame destinations.
- Begin with `Content-Security-Policy-Report-Only` if needed, collect violations, then enforce the policy.
- Preserve HSTS. Consider `includeSubDomains` and `preload` only after confirming every subdomain supports HTTPS.

### Acceptance criteria

- The deployed site returns all approved headers on HTML and applicable API responses.
- The application works with an enforced CSP.
- The site cannot be framed by an unrelated origin.
- CSP violations are monitored during rollout.

## P1-2: Prevent caching of authenticated and sensitive responses

**Finding:** Sensitive API responses did not explicitly return `Cache-Control: private, no-store`; observed responses used `public, max-age=0, must-revalidate` defaults.

**Risk:** Customer or administrator data could be retained by browsers, intermediaries, or deployment caching behavior longer than intended.

### Required implementation

- Add the following to all authentication, session, customer-data, admin, ticket, submission, user, and CRM responses:

```text
Cache-Control: private, no-store, max-age=0
Pragma: no-cache
```

- Ensure Vercel/CDN configuration never caches authenticated API output.
- Do not rely only on the presence of cookies to prevent caching.

### Acceptance criteria

- Authenticated API responses show `private, no-store` in production.
- Vercel cache headers confirm sensitive responses are not served from shared cache.
- Logging in as two different test users cannot produce a cached cross-user response.

## P1-3: Replace stateless sessions with revocable sessions

**Finding:** Session authorization is stored in signed, stateless tokens. Logout clears the browser cookie but does not invalidate a copied token. Admin tokens live for eight hours; portal tokens live for seven days.

**Risk:** Stolen tokens remain usable until expiration, even after logout, password change, role change, or account disabling.

### Required implementation

- Store an opaque, cryptographically random session ID in the cookie.
- Store only a hash of the session ID in the database or durable session store.
- Associate sessions with:
  - User ID
  - Role/version or authorization version
  - Creation and expiration time
  - Last-seen time
  - Revocation time/status
  - Optional device/IP metadata for audit purposes
- Revoke sessions on logout, account disabling, password change, and security-sensitive role changes.
- Provide an administrator mechanism to revoke all sessions for an account.
- Rotate the session ID after authentication and privilege changes.
- Set appropriate idle and absolute timeouts.

### Acceptance criteria

- A token copied before logout no longer works after logout.
- Password and role changes invalidate prior sessions.
- Disabled employees lose access immediately.
- Session records expire and are safely cleaned up.
- Session fixation and rotation tests pass.

## P1-4: Require stronger administrator authentication and MFA

**Finding:** Local employee passwords allow a minimum of eight characters. Microsoft authentication exists, but secure production configuration could not be verified.

**Risk:** Weak or reused passwords can lead to administrator compromise.

### Required implementation

- Prefer Microsoft Entra ID for employee and administrator authentication.
- Require MFA and appropriate Conditional Access for privileged users.
- Use the organization's tenant-specific Entra endpoint rather than `common` where possible.
- Configure an explicit `ADMIN_ALLOWED_DOMAIN` or, preferably, an explicit approved-user/group policy.
- Continue requiring a matching local employee record and assigned role.
- Disable local admin passwords when no longer required, or restrict them to emergency break-glass use.
- If local passwords remain:
  - Require at least 12–14 characters for staff.
  - Check new passwords against known-compromised password lists.
  - Do not require arbitrary periodic changes unless compromise is suspected.
  - Protect recovery/reset flows at the same assurance level as login.

### Acceptance criteria

- Every privileged production account uses MFA.
- An external Microsoft identity cannot sign in, even if tenant settings are later loosened.
- A Microsoft identity without a matching active local employee record receives `403`.
- Break-glass credentials are documented, monitored, and securely stored.

## P1-5: Harden Microsoft OIDC validation

**Finding:** The callback exchanges an authorization code directly with Microsoft, then manually decodes the ID token and checks its audience. It does not perform complete OIDC library validation of signature, issuer, timestamps, tenant, and nonce.

**Risk:** The direct back-channel exchange reduces immediate exploitability, but manual token processing is easier to misconfigure and may miss future protocol or tenant-validation requirements.

### Required implementation

- Use Microsoft's supported authentication library or a well-maintained OIDC library.
- Validate:
  - Cryptographic signature using Microsoft discovery/JWKS
  - Issuer
  - Audience
  - Expiration and not-before times
  - Tenant ID
  - Nonce tied to the login attempt
  - Signed OAuth state
- Store OAuth state/nonce server-side or make it one-time-use to prevent replay.
- Return generic errors to users and keep provider diagnostics in protected logs.

### Acceptance criteria

- Tokens with wrong signature, issuer, tenant, audience, nonce, or expiration are rejected.
- OAuth state and nonce cannot be reused.
- Valid approved-tenant login continues to work.

## P1-6: Protect public submission and ticket endpoints

**Finding:** The contact endpoint validates required fields but lacks comprehensive length, body-size, bot, and abuse controls. The complete payload is retained as `raw_payload`.

**Risk:** Spam, email abuse, oversized database records, uncontrolled storage growth, unexpected sensitive fields, and denial of service.

### Required implementation

- Set a strict maximum JSON body size at the edge/function layer.
- Add per-field length and format validation for every accepted property.
- Normalize and validate email addresses.
- Construct a new allowlisted object before storage; do not store arbitrary request properties.
- Remove `raw_payload` unless it has a documented purpose. If retained, store only approved fields with a retention policy.
- Add Turnstile or equivalent bot protection to anonymous forms.
- Rate-limit contact submissions, signups, ticket creation, and ticket replies.
- Limit the number of open tickets and submissions per account/IP over defined periods.
- Do not include untrusted form values in email headers without validation.

### Acceptance criteria

- Oversized bodies receive `413 Payload Too Large`.
- Unknown fields are discarded or rejected.
- Excessively long fields and invalid emails receive `400`.
- Automated submissions are challenged or throttled.
- Valid customer submissions and notifications still work.

---

# Priority 2 — Authorization, privacy, and operational controls

## P2-1: Review and tighten role permissions

**Finding:** Server-side role checks exist. Administrators are required to create employee accounts, while both `employee` and `admin` roles can read sensitive submissions/users and perform broad CRM operations.

**Risk:** A compromised or inappropriate employee account may have more data access or mutation authority than necessary.

### Required implementation

- Document an authorization matrix for every endpoint and method.
- Decide whether ordinary employees should be able to:
  - List all employee usernames and roles
  - Read all contact submissions
  - Read all customer records
  - Create, edit, and delete every CRM entity
  - View audit events
- Separate permissions such as:
  - `ticket.read`, `ticket.update`
  - `crm.read`, `crm.write`, `crm.delete`
  - `employee.read`, `employee.manage`
  - `audit.read`
- Enforce authorization in server handlers, not only in React components.
- Apply least privilege and deny by default.
- Add authorization tests for every role, endpoint, and HTTP method.

### Acceptance criteria

- A written role/permission matrix exists.
- Each route has a server-side permission check.
- Employees cannot perform admin-only or destructive operations unless explicitly authorized.
- Tests demonstrate both allowed and denied behavior.

## P2-2: Minimize stored and returned personal data

**Finding:** Contact submissions include names, companies, email addresses, process descriptions, current tools, timeline, context, and a duplicate raw payload. Admin endpoints return broad record sets.

**Risk:** A future compromise would expose more information than necessary.

### Required implementation

- Inventory every personal or confidential field stored in PostgreSQL/SQLite.
- Remove duplicate and unnecessary fields, especially unrestricted raw payloads.
- Exclude internal-only columns from API responses by selecting explicit fields.
- Avoid `SELECT *` in sensitive data paths.
- Establish retention periods for:
  - Contact submissions
  - Portal tickets and replies
  - Audit logs
  - Authentication failures
  - Deleted accounts
- Implement deletion/anonymization workflows.
- Document the purpose and retention period for each data category.

### Acceptance criteria

- Data inventory and retention schedule are documented.
- API responses contain only fields needed by the current UI.
- Expired test records are automatically deleted or anonymized.
- Raw payload storage is removed or justified and constrained.

## P2-3: Improve audit logging and security monitoring

**Finding:** The application records several audit events, but production log access, retention, alerting, integrity, and coverage could not be verified.

**Required implementation**

- Record security-relevant events including:
  - Successful and failed staff login
  - Rate-limit triggers
  - MFA/OIDC failures
  - Account creation, role change, disablement, and password reset
  - Session revocation
  - Destructive CRM operations
  - Authorization failures
- Include actor, target, timestamp, request ID, result, and trusted source-IP metadata.
- Never log passwords, cookies, authorization headers, session IDs/tokens, Microsoft authorization codes, database URLs, or complete sensitive payloads.
- Protect audit records from modification by ordinary employees.
- Configure alerts for repeated failures, admin-account changes, unusual locations, and destructive activity.
- Define log retention and incident-review responsibilities.

### Acceptance criteria

- Security events are searchable in one protected location.
- Alert tests generate notifications to the designated owner.
- Sensitive-value scanning finds no credentials or tokens in logs.
- Ordinary employee accounts cannot edit or delete audit records.

## P2-4: Validate database security and durability

**Finding:** Source review shows PostgreSQL/Neon support and a temporary SQLite fallback. Production configuration, database roles, encryption, backups, and network policy were not available for verification.

### Required implementation

- Ensure production always uses durable PostgreSQL and fails closed if its connection is unavailable.
- Do not allow `/tmp` SQLite to become an unnoticed production data store.
- Use a dedicated least-privilege database role for the application.
- Require verified TLS for database connections.
- Restrict administrative database access and require MFA for provider access.
- Verify encryption at rest, automated backups, point-in-time recovery, and retention.
- Test a restoration into a non-production environment.
- Separate production, preview, development, and test databases and credentials.
- Rotate database credentials after any suspected exposure.

### Acceptance criteria

- Production cannot silently fall back to ephemeral SQLite.
- The application database role lacks provider/admin-level privileges.
- Backup restoration is successfully tested and documented.
- Preview deployments cannot access the production database unless explicitly approved.

## P2-5: Review secrets and deployment configuration

**Finding:** No real credentials were identified in the reviewed repository or its Git history using the patterns checked. Actual Vercel variables and their strength/scope could not be verified.

### Required implementation

- Review and rotate as needed:
  - `ADMIN_AUTH_SECRET`
  - `USER_AUTH_SECRET`
  - `ADMIN_SUBMISSIONS_KEY`, if retained
  - Database URLs/passwords
  - `MICROSOFT_CLIENT_SECRET`
  - `RESEND_API_KEY`
- Use separate, randomly generated staff and portal secrets of at least 32 random bytes.
- Remove legacy secret fallbacks so one secret cannot silently authorize multiple systems.
- Scope variables to the minimum Vercel environments required.
- Prevent preview builds from receiving production credentials.
- Enable GitHub secret scanning and push protection.
- Add automated secret scanning to CI and full Git history.
- Ensure `.env*` files containing secrets remain ignored and are never packaged into frontend assets.

### Acceptance criteria

- Production, preview, and development use different secrets and data stores.
- No secret is shared between admin sessions, portal sessions, database access, email, and Microsoft OAuth.
- CI rejects committed secrets.
- A documented rotation procedure exists.

## P2-6: Confirm third-party account security

### Required implementation

- Require MFA for Vercel, GitHub, Neon, Microsoft Entra, domain/DNS, and Resend accounts.
- Remove inactive collaborators and unnecessary organization permissions.
- Apply least-privilege roles.
- Enable provider audit logs and security alerts.
- Review GitHub branch protection for `main`:
  - Pull-request review
  - Required status checks
  - No force pushes
  - No direct pushes except documented emergencies
- Protect production deployment approvals.
- Restrict Resend sending domains and rotate unused API keys.

### Acceptance criteria

- Current access list is documented and approved.
- All privileged accounts use MFA.
- `main` is protected by required checks and review.
- Production deployment and environment-variable changes are auditable.

---

# Priority 3 — Defense in depth and maintainability

## P3-1: Centralize security response behavior

### Required implementation

- Create shared helpers/middleware for:
  - Security headers
  - `Cache-Control: private, no-store`
  - JSON content type
  - Body-size validation
  - Trusted-origin/CSRF checks
  - Authentication and authorization
  - Safe error responses
  - Request IDs
- Ensure unhandled errors do not return stack traces, SQL errors, provider responses, or configuration details to clients.
- Keep detailed errors only in protected server logs.

### Acceptance criteria

- All API handlers use the centralized security behavior.
- Production errors use generic messages and correlation IDs.
- Tests confirm headers and error format across endpoints.

## P3-2: Add a security-focused automated test suite

**Existing positive control:** At audit time, all three existing tests passed, including customer tenant-isolation coverage. Lint and production build also passed.

### Required implementation

- Preserve the existing tenant-isolation test.
- Add tests for:
  - Unauthenticated access to every sensitive endpoint
  - Cross-customer ticket enumeration and replies
  - Employee versus administrator permissions
  - CSRF and malicious-origin rejection
  - Login and public-form rate limiting
  - Session rotation, revocation, expiration, and logout
  - Cookie attributes
  - Cache and security headers
  - Input length and body-size limits
  - SQL injection and unsupported CRM entities
  - Stored content safely rendered as text rather than HTML
  - OAuth issuer, audience, tenant, nonce, and state validation
- Run tests, lint, build, audit, and secret scanning in CI.

### Acceptance criteria

- Security tests run on every pull request.
- A failed security check blocks merging.
- Test fixtures contain no production information or reusable secrets.

## P3-3: Create an incident response and recovery runbook

### Required implementation

- Document what to do if any of the following is exposed:
  - Session signing secret
  - Database credential
  - Microsoft client secret
  - Resend key
  - Employee password or session
  - Customer data
- Include account disabling, session invalidation, key rotation, log preservation, database review, customer/legal notification assessment, and recovery verification.
- Identify responsible people and provider support paths.
- Run a tabletop exercise at least annually and after major architecture changes.

### Acceptance criteria

- The runbook is accessible to authorized responders during an outage.
- Key rotation and session invalidation can be completed without inventing steps during the incident.
- A tabletop exercise is recorded with follow-up actions.

## P3-4: Perform controlled penetration testing

### Required implementation

- Create a dedicated staging environment with representative but synthetic data.
- Test authenticated and unauthenticated flows for:
  - Broken access control and IDOR
  - Session and OAuth weaknesses
  - CSRF
  - Stored/reflected/DOM XSS
  - SQL injection
  - Rate-limit bypass
  - Password-reset and account-enumeration issues
  - HTTP request smuggling/desynchronization where applicable
  - File/upload handling if later introduced
  - Business-logic abuse in ticket and CRM workflows
- Do not run disruptive tests against production without an approved scope, maintenance plan, and backups.
- Retest all confirmed findings after remediation.

### Acceptance criteria

- Findings have severity, evidence, owner, due date, and remediation status.
- Critical/high findings are resolved and retested before production approval.

---

# Production verification checklist

Run this checklist after the Priority 0 and Priority 1 deployment.

## Authentication and sessions

- [ ] Admin login is durably rate-limited.
- [ ] Portal login/signup are durably rate-limited.
- [ ] Microsoft Entra MFA is required for privileged users.
- [ ] Authentication responses contain no session token.
- [ ] Cookies are `Secure`, `HttpOnly`, host-only, and use the approved `SameSite` value.
- [ ] Logout invalidates the server-side session.
- [ ] Password and role changes revoke old sessions.
- [ ] Disabled users immediately lose access.

## Authorization and isolation

- [ ] Unauthenticated sensitive endpoints return `401`.
- [ ] Insufficient roles return `403`.
- [ ] Customer A cannot access Customer B's tickets by changing a request ID.
- [ ] Only authorized roles can create employee accounts or delete CRM data.
- [ ] Server-side checks exist independently of React route guards.

## Browser and HTTP controls

- [ ] Cross-origin modifying requests are rejected.
- [ ] CSP is enforced without unexpected violations.
- [ ] The site cannot be framed by another origin.
- [ ] `nosniff`, referrer, and permissions policies are present.
- [ ] Sensitive APIs return `Cache-Control: private, no-store`.
- [ ] HTTP redirects to the canonical HTTPS hostname.
- [ ] HSTS remains enabled.

## Dependencies and CI

- [ ] `npm audit --omit=dev` has no high or critical findings.
- [ ] `npm test` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Secret scanning passes.
- [ ] Security checks are required before merging to `main`.

## Data and operations

- [ ] Production uses durable PostgreSQL and cannot silently use temporary SQLite.
- [ ] Database TLS and least privilege are verified.
- [ ] Backup restoration has been tested.
- [ ] Production secrets are unique and scoped correctly.
- [ ] Provider access lists and MFA are reviewed.
- [ ] Security alerts reach the responsible owner.
- [ ] Retention and deletion procedures are active.

---

# Existing controls to preserve

The following controls were present during the review and should not regress:

- Passwords are salted and hashed with scrypt rather than stored as plaintext.
- Session tokens are signed and expiration-checked.
- Production cookies are `Secure` and `HttpOnly`.
- Sensitive authorization is enforced by server handlers, not only React guards.
- Portal ticket access is scoped by the authenticated email address.
- Database values are parameterized.
- Dynamic CRM entities are resolved through a fixed configuration allowlist.
- Creating or updating an employee account requires the server-side admin role.
- OAuth state is signed and time-limited.
- HTTPS redirection and HSTS are enabled.
- Existing tenant-isolation, CRM synchronization, and backfill tests pass.

## Final release gate

Do not describe the application as guaranteed secure solely because this backlog is completed. Final approval should combine source review, production configuration review, dependency and secret scanning, staging penetration testing, access review, backup verification, and ongoing monitoring.
