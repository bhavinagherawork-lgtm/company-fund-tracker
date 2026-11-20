# AGENTS.md — Project Rules for Any AI Assistant

> These rules are MANDATORY for every AI tool working in this repository (Claude, Cursor, Copilot, Gemini, Codex, etc.).
> Keyword meanings: **MUST / MUST NOT** = non-negotiable. **SHOULD** = default unless a written reason exists.
> If a rule conflicts with a user request, explain the conflict and propose a compliant alternative. Do not silently skip a rule.

---

## 0. How the AI Must Work (Meta Rules)

1. **Read before writing.** Inspect existing code, conventions, and dependencies before adding anything. Match the existing style.
2. **Never invent.** Do not fabricate APIs, package names, config keys, or library versions. If unsure, say so and verify in docs.
3. **Small, reviewable changes.** One concern per change. Prefer minimal diffs over rewrites.
4. **Definition of Done** — a task is complete ONLY when:
   - Code compiles/lints with zero new warnings
   - Automated tests are added/updated and pass
   - Error, loading, empty, and edge states are handled
   - Security checklist (Section 13) is satisfied
   - Docs/changelog/migrations are updated where relevant
5. **Never hardcode** secrets, URLs, credentials, IDs, or environment-specific values.
6. **Never disable** security, linting, type checks, or tests to make something "work."
7. **Ask or state assumptions** when requirements are ambiguous. List assumptions explicitly in the response.
8. **Explain trade-offs** for any non-trivial decision (cost, complexity, security, performance).
9. **No dead code, no commented-out code, no TODOs without a ticket reference.**
10. **Destructive actions** (dropping tables, deleting data, force-push, mass updates) MUST require explicit user confirmation and a rollback plan.

---

## 1. Website & UI Design Rules (High-Converting Patterns)

### 1.1 The Mirror Test

The first screen (above the fold) MUST answer three questions:

- **Who is this for?** (audience stated explicitly)
- **What do I get?** (the _outcome_, not just features)
- **What do I do next?** (one clear primary CTA)

It MUST also reflect the visitor's **pain point** and make a **clear promise of the outcome**.

### 1.2 The Highlighter Rule (60-30-10)

- **60%** background/neutral
- **30%** structure (cards, sections, nav, borders)
- **10%** high-contrast accent — reserved ONLY for primary buttons and key links
- MUST NOT use the accent color for decoration, icons, headings, or backgrounds.

### 1.3 Front, Middle, Back (Visual Depth)

- **Back:** background image, gradient, or soft shape that sets mood
- **Middle:** headline, copy, cards
- **Front:** primary CTA, elevated with a soft shadow above all other layers
- Avoid flat, single-layer layouts.

### 1.4 Motion with a Job

- Every animation MUST serve a function (show a product, point to the next step, show a result).
- Max **one** moving object per screen.
- Text MUST be readable immediately — never gated behind an animation.
- MUST respect `prefers-reduced-motion` and provide an off switch where motion is continuous.
- Animate only `transform` and `opacity` (GPU-friendly). No layout-thrashing animations.

### 1.5 The Free Sample

- Offer value before commitment: a quiz, calculator, estimator, visualizer, or interactive demo.
- Leverage the IKEA Effect: let users co-create the result.
- Capture email/signup AFTER delivering a first result, not before.

### 1.6 Required Color Structure

- MUST NOT use **purple or violet** prominently unless the user explicitly asks for it.
- If a component's **background color is overridden, its text color MUST also be overridden** to guarantee contrast.
- Contrast MUST meet **WCAG 2.2 AA** (4.5:1 body text, 3:1 large text and UI components).
- Define colors as design tokens/CSS variables. No raw hex values scattered in components.
- Support light AND dark mode via tokens; every text/background pair must be tested in both.

### 1.7 Mobile Responsiveness

- Design **mobile-first**. Test at 320px, 375px, 768px, 1024px, 1440px.
- Touch targets MUST be at least 44×44px.
- No horizontal scrolling. Use `rem`/`clamp()` for fluid type, flex/grid for layout.
- Respect safe-area insets (`env(safe-area-inset-*)`).
- Images MUST be responsive (`srcset`/`sizes`), lazy-loaded below the fold, and in modern formats (AVIF/WebP).

### 1.8 Accessibility (a11y)

- Semantic HTML first; ARIA only when semantics are insufficient.
- Full keyboard navigation with visible focus states. Never `outline: none` without a replacement.
- Every image has meaningful `alt` (or `alt=""` if decorative). Every input has a `<label>`.
- Forms announce errors to screen readers (`aria-live`, `aria-describedby`).

### 1.9 Performance Budgets (Core Web Vitals)

- LCP < 2.5s, INP < 200ms, CLS < 0.1 on a mid-range mobile device over 4G.
- JS bundle per route SHOULD stay under ~170KB gzipped. Code-split by route; lazy-load heavy components.
- Fonts: self-host, `font-display: swap`, subset, max 2 families.

### 1.10 UX States

Every data-driven view MUST implement: **loading (skeleton), empty, error (with retry), success, and offline/partial-failure** states.

---

## 2. Architecture & Scalability

### 2.1 Load Balancing

- Run ≥2 instances of every stateless service behind a load balancer (L7 for HTTP).
- Use health checks (`/healthz` liveness, `/readyz` readiness). Remove unhealthy nodes automatically.
- Prefer least-connections or round-robin; use sticky sessions ONLY when unavoidable.
- Enable connection draining on deploys for graceful shutdown.

### 2.2 Stateless Services

- Services MUST NOT store session, files, or state on local disk/memory. Use Redis/DB/object storage.
- Config comes from environment; any instance can serve any request.

### 2.3 Horizontal vs Vertical Scaling

- Prefer **horizontal** scaling for app tiers (autoscale on CPU, RPS, or queue depth).
- Use **vertical** scaling for primary databases first, then add read replicas, then partition/shard.
- Document the scaling strategy and known bottlenecks for each service.

### 2.4 Reverse Proxies

- All public traffic goes through a reverse proxy (Nginx/Envoy/Caddy/Traefik/cloud LB).
- Proxy handles TLS termination, compression, request size limits, header sanitization, and static caching.
- App servers MUST NOT be directly exposed to the internet.
- Trust `X-Forwarded-*` headers only from known proxy IPs.

### 2.5 API Gateways

- Use a gateway for auth enforcement, rate limiting, routing, request validation, versioning, and observability.
- Internal services SHOULD NOT be reachable except through the gateway or private network.

### 2.6 Message Queues & Background Jobs

- Long-running, retryable, or non-user-blocking work MUST go to a queue (SQS, RabbitMQ, Kafka, BullMQ, Celery, etc.).
- Jobs MUST be **idempotent**, have retry limits with exponential backoff, and a **dead-letter queue (DLQ)**.
- Jobs MUST have timeouts, structured logs, and a correlation ID.
- Never do email sends, report generation, image processing, or third-party calls inside the request cycle.

### 2.7 Webhooks

- **Incoming:** verify signatures (HMAC), check timestamp (reject replays > 5 min), respond `2xx` fast, process async, dedupe by event ID.
- **Outgoing:** sign payloads, retry with exponential backoff + jitter, expose delivery logs, allow endpoint disable after repeated failure.

### 2.8 Async/Await

- Never block the event loop (no sync I/O or heavy CPU in async handlers; offload to workers).
- Always `await` or explicitly handle every promise. No floating promises.
- Use `Promise.allSettled`/bounded concurrency for batches. Propagate cancellation (AbortController/context).
- Wrap async boundaries with error handling; never swallow rejections.

### 2.9 Advanced Architecture Patterns

- **Outbox pattern:** write events to an `outbox` table in the same transaction as the state change, then publish — avoids dual-write bugs.
- **Saga pattern** for multi-service transactions with compensating actions.
- **CQRS / read models** only when read and write loads genuinely diverge.
- **Bulkheads:** isolate resource pools per dependency so one failure cannot exhaust all threads/connections.
- **Graceful degradation:** define fallback behavior for each non-critical dependency.
- **Backpressure & load shedding:** reject early (`503` + `Retry-After`) rather than collapse under overload.
- **Multi-AZ** by default; document RTO/RPO targets.

---

## 3. Resilience

### 3.1 Timeouts

- EVERY outbound call (HTTP, DB, cache, queue) MUST have an explicit timeout. No infinite waits.
- Set budgets top-down: client timeout > gateway > service > downstream. Propagate deadlines.

### 3.2 Exponential Backoff

- Retry ONLY transient errors (network, `429`, `502/503/504`). Never retry `4xx` validation errors.
- Use exponential backoff **with jitter**, a max attempts cap (e.g., 3–5), and a max delay cap.
- Respect `Retry-After` headers.

### 3.3 Idempotency

- All `POST` operations with side effects (payments, orders, emails) MUST accept an `Idempotency-Key`.
- Store key → result for a defined TTL; return the stored result on replay.
- Consumers MUST be idempotent (dedupe by message/event ID).

### 3.4 Circuit Breakers

- Wrap every unreliable dependency in a circuit breaker (closed → open → half-open).
- Define failure thresholds, open duration, and a fallback response. Emit metrics on state changes.

### 3.5 Advanced Resilience

- **Retry budgets:** cap total retries as a % of traffic to prevent retry storms.
- **Hedged requests** for latency-critical reads (carefully, idempotent only).
- **Chaos/failure testing** in staging: kill dependencies, inject latency, verify degradation.
- **Graceful shutdown:** on `SIGTERM`, stop accepting requests, finish in-flight work, close connections, then exit.

---

## 4. API Design

### 4.1 HTTP Status Codes (use correctly)

| Code        | Use                                      |
| ----------- | ---------------------------------------- |
| 200         | Success with body                        |
| 201         | Resource created (+ `Location` header)   |
| 202         | Accepted for async processing            |
| 204         | Success, no body                         |
| 400         | Malformed request / validation failure   |
| 401         | Not authenticated                        |
| 403         | Authenticated but not authorized         |
| 404         | Resource not found                       |
| 409         | Conflict (duplicate, version mismatch)   |
| 410         | Gone                                     |
| 413         | Payload too large                        |
| 415         | Unsupported media type                   |
| 422         | Semantically invalid input               |
| 429         | Rate limited (+ `Retry-After`)           |
| 500         | Unexpected server error                  |
| 502/503/504 | Upstream failure / unavailable / timeout |

Never return `200` with an error inside the body.

### 4.2 Error Handling

- Use a **consistent error envelope**, preferably RFC 9457 (Problem Details):
  `{ "type", "title", "status", "detail", "code", "requestId", "errors": [...] }`
- NEVER leak stack traces, SQL, file paths, or internal hostnames to clients.
- Log the full error server-side with the `requestId`; return a safe message to the client.
- Distinguish **operational errors** (expected, handled) from **programmer errors** (bugs → alert).
- Use a global error handler/middleware. No empty `catch` blocks.
- Fail fast on startup if required config is missing or invalid.

### 4.3 API Versioning

- Version all public APIs (`/v1/...` or header-based). Never break a published version.
- Deprecate with `Sunset` and `Deprecation` headers and a documented migration window.
- Only additive changes within a version (new optional fields, new endpoints).

### 4.4 API Documentation

- Maintain an **OpenAPI 3.x** spec as the source of truth; generate docs and client SDKs from it.
- Every endpoint documents: auth, params, request/response schemas, all error codes, rate limits, and examples.
- Validate requests/responses against the spec in CI (contract testing).

### 4.5 Advanced API Rules

- **Pagination:** cursor-based for large/changing datasets; enforce a max page size.
- **Filtering/sorting** via allowlisted fields only.
- **Optimistic concurrency** with `ETag`/`If-Match` or a `version` column.
- **Conditional requests** (`ETag`, `Last-Modified`) to save bandwidth.
- **Request IDs** (`X-Request-Id`) generated at the edge and propagated everywhere.
- **Content negotiation** and strict `Content-Type` checks.
- **Partial failure reporting** for bulk endpoints (per-item status).

---

## 5. Security — Authentication & Authorization

### 5.1 Authentication

- Never roll your own crypto or auth. Use vetted libraries/providers (OIDC, OAuth 2.1, Auth0, Clerk, Cognito, Keycloak, etc.).
- Hash passwords with **Argon2id** (or bcrypt cost ≥12 / scrypt). Never MD5/SHA1/plain SHA-256 for passwords.
- Enforce minimum password length (≥12), check against breached-password lists, and do NOT force arbitrary complexity/rotation.
- Return generic messages ("Invalid credentials") to prevent account enumeration; keep timing consistent.
- Support **passkeys (WebAuthn)** as a first-class, phishing-resistant option.

### 5.2 Authorization

- **Deny by default.** Check authorization on the SERVER for EVERY request, on every resource.
- Prevent **IDOR/BOLA**: always verify the caller owns/has access to the specific object ID.
- Never trust client-supplied roles, user IDs, or permissions.
- Centralize policy checks (middleware/policy engine such as OPA/Cedar/Casbin). No scattered inline `if (isAdmin)`.

### 5.3 Role-Based Access Control (RBAC)

- Define roles → permissions → resources explicitly. Follow **least privilege**.
- Roles are data (DB/config), not hardcoded strings spread through code.
- Log all role/permission changes to the audit log. Require re-auth for privilege escalation.
- Consider ABAC/ReBAC when permissions depend on attributes or relationships.

### 5.4 Row-Level Security (RLS)

- Multi-tenant data MUST be isolated at the DB layer (e.g., PostgreSQL RLS policies) in addition to app checks.
- Every tenant-owned table has a `tenant_id`; policies enforce `tenant_id = current_tenant()`.
- App DB role MUST NOT be a superuser and MUST NOT bypass RLS. Test RLS with automated cross-tenant tests.

### 5.5 Session Management

- Generate sessions with a CSPRNG; ≥128 bits of entropy. Regenerate session ID on login and privilege change.
- Set idle and absolute timeouts. Support server-side revocation and "log out everywhere."
- Store sessions server-side (Redis/DB) or use short-lived signed tokens with a revocation strategy.
- Limit concurrent sessions where appropriate; show active sessions to users.

### 5.6 Token Expiration & Refresh

- Access tokens: short-lived (5–15 min). Refresh tokens: rotating, single-use, with reuse detection (revoke the family on reuse).
- Store refresh tokens in `HttpOnly` cookies or secure storage — **never in `localStorage`**.
- Validate `iss`, `aud`, `exp`, `nbf`, and signature algorithm (reject `alg: none`; pin algorithms).
- Maintain a revocation/blacklist mechanism and rotate signing keys (JWKS with `kid`).

### 5.7 Two-Factor / Multi-Factor Authentication

- Offer TOTP and WebAuthn/passkeys; SMS only as a last-resort fallback.
- Generate hashed, single-use **recovery codes**. Require MFA for admins and sensitive actions.
- Rate-limit MFA attempts; support step-up authentication for high-risk operations.

### 5.8 Brute Force Protection

- Rate-limit login, signup, password reset, OTP, and MFA endpoints per IP **and** per account.
- Use progressive delays/temporary lockouts (avoid permanent lockout that enables DoS), plus CAPTCHA/bot checks after thresholds.
- Alert on credential-stuffing patterns (many accounts from one IP, many IPs on one account).

### 5.9 Cookie Flags

All auth/session cookies MUST set:

- `HttpOnly` (no JS access)
- `Secure` (HTTPS only)
- `SameSite=Lax` (or `Strict`; `None` only with justification + CSRF protection)
- `Path`, `Max-Age`/`Expires` explicitly; use the `__Host-` prefix where possible.

### 5.10 API Keys

- Generate with a CSPRNG; show the full key ONCE; store only a **hash**.
- Support scopes, expiry, per-key rate limits, rotation, and instant revocation.
- Use a recognizable prefix (e.g., `sk_live_`) to enable secret scanning. Never put keys in URLs or client-side code.

### 5.11 Audit Logs

- Record WHO did WHAT to WHICH resource, WHEN, from WHERE (IP/user-agent), and the outcome.
- Audit: logins/failures, permission changes, data exports, deletes, admin actions, secret/key access.
- Logs MUST be append-only/tamper-evident, retained per policy, and contain NO secrets or raw PII.
- Provide a query/export interface for compliance review.

---

## 6. Security — Application Hardening

### 6.1 HTTPS/TLS

- HTTPS everywhere; TLS 1.2+ (prefer 1.3). Redirect HTTP → HTTPS.
- Enable **HSTS** (`max-age≥31536000; includeSubDomains; preload`).
- Automate certificate renewal. Use mTLS for service-to-service where feasible.

### 6.2 SQL Injection

- ALWAYS use parameterized queries/prepared statements or a vetted ORM. NEVER concatenate user input into SQL.
- Allowlist dynamic identifiers (column/table names, sort order). Use least-privilege DB accounts.

### 6.3 XSS & CSRF

- Escape/encode output by context (HTML, attribute, JS, URL). Never use `innerHTML`/`dangerouslySetInnerHTML` with untrusted data; sanitize with DOMPurify if unavoidable.
- Deploy a strict **Content-Security-Policy** (nonces/hashes, no `unsafe-inline`), plus **Trusted Types** where supported.
- CSRF: `SameSite` cookies + anti-CSRF tokens (synchronizer or double-submit) for all state-changing requests; verify `Origin`/`Referer`.

### 6.4 Data Validation on the Server

- NEVER trust client-side validation. Validate **every** input on the server: type, length, format, range, enum.
- Use schema validators (Zod, Pydantic, Joi, JSON Schema, Bean Validation). Prefer **allowlists** over denylists.
- Reject unknown fields (strict schemas) to prevent mass assignment. Normalize (trim, Unicode NFC) before validating.

### 6.5 File Upload Security

- Enforce max size, allowlisted extensions AND verified MIME/magic bytes.
- Rename files (random UUID); never trust the original filename or path. Prevent path traversal.
- Store outside the web root / in object storage with private ACLs; serve via signed, expiring URLs.
- Scan for malware; strip image EXIF; re-encode images; set `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.
- Use direct-to-storage pre-signed uploads with size/type conditions.

### 6.6 Dependency Vulnerabilities

- Run SCA in CI (`npm audit`, `pip-audit`, Dependabot/Renovate, Snyk, Trivy). Block merges on high/critical CVEs.
- Pin versions via lockfiles; verify integrity hashes. Remove unused packages.
- Vet new dependencies (maintenance, downloads, license, typosquatting). Generate an **SBOM**.

### 6.7 Secure Headers (Required)

`Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`. Remove `X-Powered-By`/server version banners. Configure CORS with an **explicit origin allowlist** — never `*` with credentials.

### 6.8 Advanced Security

- **SSRF protection:** allowlist outbound destinations; block private/link-local/metadata IPs (`169.254.169.254`); validate after DNS resolution.
- **Prevent open redirects**, **mass assignment**, **prototype pollution**, **ReDoS** (avoid catastrophic regexes), **XXE**, **insecure deserialization**, **zip-slip**, and **race conditions/TOCTOU** (use DB constraints and transactions).
- **Supply-chain hardening:** pin CI actions by SHA, sign artifacts/images (Sigstore/cosign), SLSA provenance, minimal base images, non-root containers, read-only filesystems.
- **Secret scanning** (gitleaks/trufflehog) as a pre-commit hook AND in CI.
- **Threat modeling** (STRIDE) for every new feature touching auth, payments, or PII.
- **Security.txt**, a vulnerability disclosure policy, and periodic penetration tests.
- **Defense in depth:** never rely on a single control.

---

## 7. Configuration & Secrets

### 7.1 Environment Variables

- All config via environment variables (12-factor). Commit a `.env.example` (no real values); NEVER commit `.env`.
- Validate env vars at startup with a typed schema; fail fast on missing/invalid values.
- Separate config per environment (dev/staging/prod). Prod values are never used locally.

### 7.2 Secrets Management

- Store secrets in a manager (AWS Secrets Manager, GCP Secret Manager, Vault, Doppler, 1Password). Never in code, images, logs, or client bundles.
- Rotate secrets on a schedule and immediately upon suspected exposure. Use short-lived, dynamically issued credentials where possible.
- Apply least privilege and per-service identities (IAM roles/workload identity) over static keys.
- Anything prefixed for the browser (`NEXT_PUBLIC_`, `VITE_`) is PUBLIC — never put secrets there.
- If a secret is ever committed: treat it as compromised, rotate it, and purge history.

### 7.3 Feature Flags

- Wrap risky or incomplete features in flags (LaunchDarkly, Unleash, OpenFeature, or in-house).
- Flags MUST have an owner, default-safe value, and an expiry/cleanup date. Remove stale flags.
- Support gradual rollouts (percentage/cohort), instant kill-switches, and per-environment overrides. Never use flags for permissions/authorization.

---

## 8. Data Layer

### 8.1 Database Indexing

- Index foreign keys, frequent `WHERE`/`JOIN`/`ORDER BY` columns. Use composite indexes in the correct column order; use partial/covering indexes when useful.
- Verify with `EXPLAIN ANALYZE`. Avoid over-indexing (write cost). Drop unused/duplicate indexes.
- Create indexes **concurrently** on live tables.

### 8.2 Database Migrations

- ALL schema changes via versioned, reviewed migration files (Flyway, Alembic, Prisma Migrate, Knex, etc.). Never edit prod schema by hand.
- Migrations are forward-only in prod, tested on production-like data, and have a rollback/mitigation plan.
- **Zero-downtime pattern (expand → migrate → contract):** add nullable column → dual-write/backfill in batches → switch reads → drop old column later.
- No long table locks; avoid `NOT NULL` with default rewrites on huge tables without a safe strategy.

### 8.3 Database Normalization

- Normalize to **3NF** by default for transactional data; denormalize deliberately, with documented justification (read performance) and a consistency strategy.
- Enforce integrity in the DB: primary keys, foreign keys, `UNIQUE`, `CHECK`, `NOT NULL`.

### 8.4 Connection Pooling

- Use a pool (app-level and/or PgBouncer/RDS Proxy). Size pools based on DB limits ÷ number of instances.
- Set acquire/idle/statement timeouts. Always release connections (`finally`). Monitor pool saturation and wait time.

### 8.5 Backups

- Automated, encrypted, off-site/cross-region backups with **point-in-time recovery**.
- Follow **3-2-1**. Define RPO/RTO. **Test restores regularly** — an untested backup is not a backup.
- Protect backups with immutability/separate credentials (ransomware resistance).

### 8.6 Advanced Data Rules

- Use **transactions** with correct isolation; handle deadlocks and serialization failures with retries.
- Use **soft delete** only when required; otherwise hard delete with retention policy. Add `created_at`, `updated_at` (UTC) to all tables.
- Prevent **N+1 queries** (eager load/batch/DataLoader). Always paginate; never `SELECT *` in production code.
- Use `NUMERIC/DECIMAL` or integer minor units for money — NEVER floats.
- Use **read replicas** for heavy reads (account for replication lag); consider partitioning for very large tables.
- Slow query logging with a threshold; review regularly.
- Use UUIDv7/ULID for distributed, index-friendly IDs; avoid exposing sequential IDs publicly.
- Define data **retention and archival** policies per table.

---

## 9. Performance — Caching, CDN, Scaling

### 9.1 Caching

- Cache at the right layer: browser → CDN → API gateway → app (Redis/Memcached) → DB.
- Every cache entry MUST have a TTL and a defined key scheme (namespaced + versioned).
- Prevent **cache stampede** (request coalescing/locking, stale-while-revalidate, TTL jitter).
- NEVER cache user-specific or private data in shared caches. Set correct `Cache-Control`, `Vary`, and `ETag`.

### 9.2 Cache Invalidation

- Choose an explicit strategy per dataset: TTL, write-through, cache-aside with delete-on-write, or event-driven invalidation.
- Invalidate on every write path that changes cached data. Use tag/surrogate-key purging on the CDN.
- Version cache keys on deploys that change data shape.

### 9.3 CDNs

- Serve static assets and public media via CDN with long-lived, immutable, **content-hashed** filenames (`Cache-Control: public, max-age=31536000, immutable`).
- Enable Brotli/gzip, HTTP/2 or HTTP/3, image optimization, and origin shielding. Use signed URLs for private content. Enable WAF/DDoS protection at the edge.

### 9.4 Rate Limiting

- Enforce at the edge/gateway AND the app. Key by user, API key, IP, and route.
- Use token bucket / sliding window (distributed counter in Redis). Different limits for anonymous vs authenticated vs paid tiers.
- Return `429` with `Retry-After` and `X-RateLimit-*` headers. Apply stricter limits to expensive and auth endpoints.

### 9.5 Load Testing

- Load, stress, spike, and soak test (k6, Locust, Gatling) before major releases and on a schedule.
- Define SLO-based pass/fail (e.g., p95 < 300ms, error rate < 0.1%). Test in a production-like environment, never against prod without approval.

### 9.6 Memory Leaks

- Clean up listeners, timers, subscriptions, intervals, and observers (React `useEffect` cleanup, `removeEventListener`).
- Avoid unbounded caches/maps/arrays; use LRU with size limits. Close streams, files, and DB connections.
- Monitor memory trends; take heap snapshots on suspected leaks; set container memory limits and alert on growth.

---

## 10. Observability

### 10.1 Logging & Structured Logging

- Use **structured JSON logs** with levels (`debug/info/warn/error`), timestamp (UTC ISO-8601), service, environment, version, `requestId`/`traceId`, and user/tenant ID.
- NEVER log passwords, tokens, API keys, full card numbers, or raw PII. Redact by default.
- Log at boundaries (requests, jobs, external calls) with duration and outcome. Centralize logs (ELK, Loki, Datadog, CloudWatch).

### 10.2 Monitoring & Alerting

- Track the **RED** (Rate, Errors, Duration) and **USE** (Utilization, Saturation, Errors) metrics, plus business KPIs.
- Define **SLIs/SLOs** and error budgets. Alert on **symptoms** (user impact), not just causes; every alert needs a runbook, owner, and severity.
- Avoid alert fatigue: tune thresholds, group, deduplicate, and route by severity (page vs ticket).

### 10.3 Error Tracking

- Integrate Sentry/Rollbar/Bugsnag in frontend and backend with release tagging and source maps.
- Group, deduplicate, and assign errors; scrub PII before sending.

### 10.4 Uptime Monitoring

- External synthetic checks from multiple regions for key endpoints and critical user journeys (login, checkout).
- Maintain a public/internal status page. Monitor TLS/domain expiry.

### 10.5 Cost Monitoring

- Tag all cloud resources (team, service, environment). Set budgets and anomaly alerts. Review cost per request/tenant.
- Right-size, use autoscaling, spot/savings plans, lifecycle policies for storage, and clean up unused resources.
- Cap spend on usage-based services (third-party APIs, AI/LLM calls) with hard limits and per-user quotas.

### 10.6 Advanced Observability

- **Distributed tracing** with OpenTelemetry across services, queues, and DB calls; propagate W3C `traceparent`.
- **Correlate** logs ↔ traces ↔ metrics via shared IDs.
- Real User Monitoring (RUM) for Core Web Vitals.
- Blameless **post-mortems** with action items for every Sev-1/Sev-2.

---

## 11. Quality, Testing & Delivery

### 11.1 Automated Testing

- Follow the test pyramid: many **unit** tests, fewer **integration** tests, few **E2E** tests (Playwright/Cypress).
- Every bug fix includes a regression test. Every new feature includes tests for happy path, edge cases, and failure paths.
- Tests MUST be deterministic, isolated, fast, and independent of order. No real network/third-party calls — use mocks/fakes/test containers.
- Enforce coverage thresholds on critical modules (e.g., ≥80%), but prioritize meaningful assertions over raw coverage.
- Advanced: **contract tests** (Pact), **property-based tests**, **mutation testing**, **snapshot/visual regression** tests, **accessibility tests** (axe), and **security tests** (authz matrix, cross-tenant).

### 11.2 CI/CD

- Every PR runs: lint, type-check, unit/integration tests, SAST, dependency & secret scans, build, and (where relevant) a11y/E2E checks.
- Main branch is always deployable. Deploy via pipeline only — no manual prod changes.
- Use progressive delivery: **canary / blue-green / rolling** with automated health-based rollback.
- Immutable, versioned build artifacts; promote the SAME artifact across environments. Infrastructure as Code (Terraform/Pulumi) with reviewed plans.
- Protect main: required reviews, status checks, signed commits, no force-push.

### 11.3 Debugging

- Reproduce first; write a failing test; find the **root cause** — don't patch symptoms.
- Use logs, traces, debuggers, and bisecting (`git bisect`). Change one variable at a time.
- Remove debug code/`console.log`/`print` before commit. Document the root cause in the PR.

### 11.4 Time Zones

- Store ALL timestamps in **UTC** (`timestamptz`); convert to the user's timezone only at the presentation layer.
- Use ISO-8601 with offset in APIs. Store IANA zone names (e.g., `Asia/Kolkata`), never raw offsets, for user preferences/recurring events.
- Handle DST edges; never do manual date math — use a vetted library (`Temporal`, `date-fns-tz`, `luxon`, `pendulum`). Mock the clock in tests.

---

## 12. Privacy, Compliance & Encryption

### 12.1 Data Privacy

- Collect the **minimum** data needed (data minimization); define purpose and retention for each field.
- Classify data (public / internal / confidential / restricted). Tag PII/PHI/PCI fields.
- Support user rights: access, export, correction, deletion, consent withdrawal (GDPR/CCPA/DPDP Act).
- Obtain explicit consent for cookies/tracking; honor Do-Not-Track/GPC. Maintain a data-processing inventory and sub-processor list.
- Never use production PII in dev/test — use anonymized/synthetic data.
- Never send PII or secrets to third-party AI/analytics tools without approval.

### 12.2 Encryption / Decryption

- **In transit:** TLS 1.2+/1.3. **At rest:** AES-256-GCM (disk, DB, backups, object storage).
- Use **field-level/envelope encryption** for highly sensitive data (KMS-managed keys, per-tenant keys where needed).
- Use authenticated encryption only (GCM/ChaCha20-Poly1305). Unique random IV/nonce per encryption. Never reuse nonces; never use ECB.
- Keys live in KMS/HSM, are rotated, access-controlled, and NEVER stored beside the data they protect.
- Hash (not encrypt) anything that never needs to be read back (passwords, API keys). Use constant-time comparison for secrets/tokens.
- Use only standard libraries (libsodium, WebCrypto, Tink). No custom crypto.

### 12.3 Advanced Compliance

- Maintain a documented incident-response plan with breach-notification timelines (e.g., 72h under GDPR).
- Keep a log of consent and policy versions accepted. Provide a privacy policy and ToS that match actual behavior.
- Payment data: never store raw card data — use a PCI-compliant provider (Stripe/Adyen tokens).

---

## 13. Pre-Merge Security & Quality Checklist (AI MUST self-verify)

- [ ] No secrets, tokens, or real credentials in code, logs, or config
- [ ] All inputs validated server-side with strict schemas
- [ ] Authn + authz enforced on every new endpoint (incl. object-level checks)
- [ ] Queries parameterized; no string-built SQL
- [ ] Output encoded; no unsafe HTML injection
- [ ] Rate limiting on new/expensive/auth endpoints
- [ ] Timeouts + retries (with backoff) on all outbound calls
- [ ] Idempotency for side-effecting writes
- [ ] Errors handled with correct status codes and safe messages
- [ ] Structured logs added; no PII/secrets logged
- [ ] Migrations safe, reversible-in-practice, and index-aware
- [ ] Tests added/updated and passing; CI green
- [ ] UI: responsive, accessible, contrast-checked, all states handled, motion respects user settings
- [ ] Docs/OpenAPI/changelog updated
- [ ] Feature flag / rollback plan for risky changes

---

## 14. AI/LLM-Specific Rules (When the Product Uses AI)

- **Prompt injection defense:** treat ALL model inputs (user text, web pages, files, tool outputs) as untrusted. Separate instructions from data; never let retrieved content change system behavior or permissions.
- **Least-privilege tools/agents:** give models only the tools and scopes needed; require human confirmation for destructive or financial actions.
- **Validate model output** with schemas before using it (JSON schema/Zod). Never `eval` or execute model output; never trust it for authorization.
- **Cost & abuse controls:** per-user quotas, max tokens, request timeouts, concurrency caps, response caching, and circuit breakers for model providers. Provide fallback models/providers.
- **Privacy:** redact PII before sending to external models; set data-retention/no-training options; log prompts safely (redacted).
- **Evaluation:** maintain a regression eval set; version prompts and models; monitor quality, latency, cost, and hallucination/refusal rates.
- **Safety UX:** label AI-generated content, allow feedback/reporting, and show uncertainty or sources where relevant.
- **Streaming UX:** show progressive output with cancel/retry; handle partial failures gracefully.

---

## 15. Documentation & Team Hygiene

- Maintain `README.md` (setup in < 10 minutes), `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, and a `CHANGELOG.md`.
- Record significant decisions as **ADRs** (Architecture Decision Records).
- Write **runbooks** for every alert and common incident.
- Use Conventional Commits and small PRs with clear descriptions: _what, why, how tested, risks, rollback_.
- Dependencies, tooling, and runtime versions are pinned and documented (`.nvmrc`, `.tool-versions`, Dockerfile).

---

_End of rules. When in doubt: choose the more secure, more observable, more reversible option — and say why._
