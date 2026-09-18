# Security headers and sensitive-response caching

`vercel.json` is the policy source for deployed pages, assets, and API routes. `server/responseSecurity.cjs` reads its global/API rules and applies the same policy to direct API execution. All API wrappers apply it before dispatch; shared admin/portal handlers apply it before origin, method, authentication, and authorization checks. Rate-limit errors also apply it. This covers the legacy submissions route, aliases, JSON responses, early errors, and OAuth redirects.

## Browser policy

- CSP is enforced, with `default-src 'none'`, no inline script/event handlers, no eval, no wildcard sources, no object embeds, no frames, and `frame-ancestors 'none'`.
- App scripts, CSS, images, API connections, manifests, and forms use the same origin. Google Fonts uses `fonts.googleapis.com` for CSS and `fonts.gstatic.com` for fonts.
- Optional Google Analytics permits the existing `www.googletagmanager.com` loader and explicitly listed Analytics collection origins. Advertising, Google Signals, additional tags, and preview/debug tools are not implicitly allowed. Review their actual requests before enabling new integrations; consult [Google's CSP guidance](https://developers.google.com/tag-platform/security/guides/csp).
- Stylesheets are external. Inline style attributes are blocked; React and animation code currently set individual CSS properties through CSSOM, which was checked in a production-build browser test. Do not replace these with injected style strings or inline style tags without reviewing CSP behavior.
- `X-Frame-Options: DENY` adds legacy framing protection. `nosniff`, `strict-origin-when-cross-origin`, and a Permissions Policy disabling camera, microphone, geolocation, payment, and USB are also set.
- Existing platform HTTPS/HSTS behavior is preserved; this change does not add `includeSubDomains` or preload requirements.

The strict page CSP is deployed by Vercel. It is not applied to Vite's development HTML, which needs development-only script/style injection and HMR. API responses receive the policy in either environment.

## Cache policy

Every `/api/*` response uses:

```text
Cache-Control: private, no-store, max-age=0
Pragma: no-cache
CDN-Cache-Control: no-store
Vercel-CDN-Cache-Control: no-store
```

The CDN-specific headers prevent a higher-priority CDN setting from opting sensitive responses into shared caching. Vercel may consume its own header before sending the response to the browser; see [Vercel's cache header precedence](https://vercel.com/docs/caching/cache-control-headers). Static assets retain normal caching. No database or environment-variable migration is required.

## Validation and rollout

Automated tests check all API wrapper early returns, successful cookie-authenticated requests, tenant isolation, unauthorized/forbidden responses, OAuth redirects, and limiter 429/503 errors. Run `npm test`, `npm run lint`, and `npm run build`.

A local headless Edge test served the production build with the exact configured CSP and synthetic staff data. It rendered home, pricing, contact, portal, ticket inbox, dashboard, and CRM without CSP violations or JavaScript exceptions. Google Fonts loaded successfully. Injected inline and unapproved external scripts were blocked, as was framing from a second origin. A screenshot of the CRM page was visually inspected. All 16 automated tests, syntax checks, lint, production build, and diff checks passed. This verifies the browser policy locally, not Vercel's deployed delivery or live Analytics collection.

After deployment:

1. Inspect document responses on public and staff routes for the enforced CSP and other security headers; confirm existing HSTS remains present.
2. Inspect auth/session, tickets, CRM, users, submissions, logout, and error responses for `private, no-store`. Confirm sensitive responses are not CDN cache hits, using two dedicated test users to check isolation.
3. Open the browser console and Network panel while testing contact/lead forms, pricing interactions, portal/staff login and ticket flows, Microsoft sign-in, and Analytics if configured. Record CSP violations using only the blocked origin/directive; redact private URLs and identifiers.
4. Monitor console violations through the rollout and confirm Analytics delivery in its authorized dashboard. There is no centralized CSP report collector yet. Add only verified required destinations; avoid blanket `unsafe-inline`, `unsafe-eval`, or wildcard exceptions.
5. If a required integration fails, fix its narrow policy requirement and retest before promotion. Live header/CDN checks and provider-side Analytics/OAuth verification remain release checks.
