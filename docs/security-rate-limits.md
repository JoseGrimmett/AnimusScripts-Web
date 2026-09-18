# Durable rate limiting

The shared server handlers enforce independent network and normalized-account counters before credential hashing, email delivery, OAuth exchange, or ticket writes. PostgreSQL is required when the server starts with `NODE_ENV=production` or `VERCEL` set. It uses the existing `CONTACT_DATABASE_URL`, `POSTGRES_URL`, or `DATABASE_URL` configuration. There is no production SQLite fallback for these protected operations: missing/unavailable security storage returns a generic 503 and `Retry-After: 30`.

The application database role must be able to create `security_rate_limits` and its expiry index, consistent with existing automatic schema initialization. Rows contain a SHA-256 bucket key, count, and expiry; raw emails/IPs, passwords, and tokens are not stored in these rows. Hashes are pseudonymous, not anonymous. Expired records are deleted in batches of 100 on admitted requests, so cleanup is traffic-driven; a quiet deployment retains expired rows until traffic resumes.

| Action | Network quota | Account quota | Window |
| --- | ---: | ---: | --- |
| Staff login | 30 | 5 | 15 minutes |
| Portal login | 30 | 5 | 15 minutes |
| Portal signup | 10 | 5 | 1 hour |
| Microsoft start | 20 | — | 15 minutes |
| Microsoft callback | 30 | 10 once identity is available | 15 minutes |
| Contact/lead submission | 10 | 5 | 1 hour |
| Ticket creation | 30 | 10 | 1 hour |
| Ticket reply | 120 | 60 | 1 hour |

Each fixed window begins with its first request. Login reserves an attempt before password verification: five failures consume the account quota and the sixth request is rejected until the window expires. A successful password login clears its account counter only if no later attempt changed that reservation. Successful requests never clear network counters. Signup and other write quotas count successful and unsuccessful attempts alike. Denials do not extend the window. Legacy `PORTAL_AUTH_*` variables no longer control policy; limits are defined centrally in `server/rateLimit.cjs`.

Direct/local servers use the socket IP and ignore forwarded headers. On Vercel, the limiter uses the platform's `x-vercel-forwarded-for`, with `x-forwarded-for` as fallback, following [Vercel's documented header behavior](https://vercel.com/docs/headers/request-headers). IPv4-mapped IPv6 addresses normalize to IPv4; IPv6 addresses share a /64 quota. Unknown or malformed addresses share an `unknown` bucket. Hosting behind a different proxy requires an explicit trust design before changing this behavior. Shared corporate networks can exhaust a network quota; evaluate real traffic before changing limits.

Rate-limit logs contain only action and dimension; store-failure logs contain only action. Password hashing now uses asynchronous scrypt with the existing salt/hash format.

## Verification and rollout

Run `npm test`, `npm run lint`, `npm run build`, and `npm audit --omit=dev`. The rate-limit suite checks atomic capacity, another process reading an existing lockout, expiry, concurrent-success behavior, normalization, forged forwarded headers, endpoint rejection, and production failure without PostgreSQL. To run the same tests against a disposable PostgreSQL database, set `RATE_LIMIT_TEST_DATABASE_URL` and run `node --test test/rateLimit.test.cjs`. Never point that variable at production: the test creates synthetic accounts, tables, and counters.

The GitHub Security checks workflow runs both SQLite and PostgreSQL tests. Make `Security checks / verify` a required branch-protection check in GitHub. The workflow file alone does not configure branch protection.

Before deployment, confirm the production database URL is configured and the database role can initialize the limiter table/index. Then use dedicated staging accounts to verify five failures followed by 429, positive `Retry-After`, expiry, successful authentication, and enforcement across instances/redeployments. Check all form and OAuth flows. Do not run abusive tests against production.

## Dependency gate

React Router and React Router DOM are upgraded to 7.18.4, staying on the existing major version. The [upstream changelog](https://reactrouter.com/7.18.4/changelog) was reviewed; this repository uses browser routing and separate API handlers, rather than Router server actions. CI fails for high/critical production advisories, and Dependabot checks npm and GitHub Actions weekly.

No dependency exceptions are currently configured. An exception requires a reviewed PR documenting the advisory, installed versions, source-backed non-reachability, compensating controls, owner, and expiration date, plus a narrowly scoped machine-enforced allowlist. Do not bypass the entire audit step or use `continue-on-error`.
