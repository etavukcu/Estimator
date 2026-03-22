# Security Audit Report – Peaceful Haven Estimator

Date: 2026-03-22
Scope: `src/`, `api/`, `server/`, `supabase/migrations/`, `.env.example`, `README.md`

## A. Final verdict

**UNSAFE** in current form.

Reason: the app contains a hard-coded public Supabase project + anon key and intentionally falls back to direct client-side writes to Supabase. With RLS disabled, this is effectively a public unauthenticated write path into your lead table. The API endpoint also has no rate limiting and only minimal validation, so internet bots can mass-submit or poison records.

---

## B. Critical vulnerabilities

### 1) Direct client-side Supabase write fallback with built-in project credentials
- Severity: **critical**
- Files:
  - `src/lib/supabaseClient.ts`
  - `README.md`
- Why dangerous:
  - The frontend ships a default Supabase URL + anon key and directly POSTs to `/rest/v1/consultation_requests` when API submission fails.
  - This bypasses your backend controls entirely.
- Real-world abuse:
  - Attackers can script direct POST requests to your Supabase REST endpoint from anywhere, submitting spam or malicious content at scale.
  - If table permissions are broad (common when RLS is off), they can also probe read/update/delete.
- Exact fix:
  1. Remove hard-coded default project URL and anon key from frontend.
  2. Remove `postDirectToSupabase` fallback path.
  3. Submit only to your backend endpoint and enforce server-side controls.

### 2) RLS disabled for PII table (`consultation_requests`)
- Severity: **critical**
- Files:
  - `supabase/migrations/202603180001_create_consultation_requests.sql`
  - `src/App.tsx` (shows submitted PII fields)
- Why dangerous:
  - Table stores full name, phone, email, address, notes.
  - With RLS off, policy layer is absent; access depends only on role grants.
- Real-world abuse:
  - Public/anonymous actors may read private lead data or modify/delete it if grants permit.
  - Data exfiltration risk and potential compliance/privacy incident.
- Exact fix:
  1. Enable RLS on `public.consultation_requests`.
  2. Revoke broad table privileges from `anon`/`authenticated`.
  3. Add minimal policies (e.g., anon insert only if absolutely required; no anon read/update/delete).
  4. Prefer server-only inserts with service role and no anon table access at all.

### 3) API accepts anon key as privileged server credential fallback
- Severity: **high**
- Files:
  - `api/consultation-requests.js`
  - `server/index.mjs`
  - `.env.example`
  - `README.md`
- Why dangerous:
  - Server code falls back from `SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_ANON_KEY` and even `VITE_SUPABASE_ANON_KEY`.
  - This weakens security assumptions and can silently run in low-privilege or misconfigured mode.
- Real-world abuse:
  - Misconfiguration in production may route traffic through anon credentials; behavior depends on table grants/RLS and can fail open in unsafe schema setups.
- Exact fix:
  1. Require `SUPABASE_SERVICE_ROLE_KEY` only for backend writes.
  2. Fail hard on startup if service role key is missing.
  3. Remove mention of anon fallback from docs and env template.

### 4) No anti-automation controls (rate limit/captcha/bot checks)
- Severity: **high**
- Files:
  - `api/consultation-requests.js`
  - `server/index.mjs`
- Why dangerous:
  - Public endpoint allows unlimited submissions.
  - No per-IP throttling, no challenge, no honeypot, no origin checks.
- Real-world abuse:
  - Botnets can flood leads table and operational inboxes, causing cost increases and denial-of-service on sales ops.
- Exact fix:
  1. Add rate limiting (e.g., per-IP token bucket via Upstash/Vercel Edge Config/Redis).
  2. Add bot challenge (Turnstile/reCAPTCHA) and validate token server-side.
  3. Add a hidden honeypot field and reject if filled.

### 5) Missing strict server-side validation / payload size constraints
- Severity: **medium**
- Files:
  - `api/consultation-requests.js`
  - `server/index.mjs`
- Why dangerous:
  - Only checks presence of `full_name`, `phone`, `email`.
  - No type checks, format checks, or max lengths.
  - `server/index.mjs` reads entire body without max size.
- Real-world abuse:
  - Attackers submit very large payloads to consume memory/CPU.
  - Garbage/poisoned data reduces lead quality and can break downstream systems.
- Exact fix:
  1. Validate with schema (Zod/Yup): strict object, known fields only.
  2. Enforce max lengths (e.g., name 120, phone 30, email 254, notes 2000).
  3. Reject bodies above a size threshold (e.g., 16KB).

### 6) CORS is wide open on API (`*`)
- Severity: **medium**
- Files:
  - `api/consultation-requests.js`
  - `server/index.mjs`
- Why dangerous:
  - Any origin can call the endpoint from browser contexts.
- Real-world abuse:
  - Third-party websites can drive abuse from user browsers; lowers barrier for automated spam.
- Exact fix:
  1. Restrict `Access-Control-Allow-Origin` to your domains.
  2. Reject requests with unapproved `Origin`.

### 7) Missing security headers / hardening config
- Severity: **medium**
- Files:
  - `server/index.mjs`
  - `vite.config.ts`
- Why dangerous:
  - No CSP, HSTS, X-Content-Type-Options, Referrer-Policy, etc.
- Real-world abuse:
  - Increased risk surface for browser-side attacks and mis-sniffing.
- Exact fix:
  1. Add strict headers at server/reverse-proxy level.
  2. Add CSP tuned for this app (self + required CDNs only).

---

## C. Supabase / RLS findings

### What is dangerous because RLS is disabled
- `consultation_requests` stores customer PII and estimate summary data.
- Frontend can directly call Supabase REST with anon key.
- Without RLS, table protection is not policy-driven; exposure depends on grants and can be dangerously permissive.

### Tables needing RLS immediately
- `public.consultation_requests` (**immediate**)

### Intended access model (recommended)
- `public.consultation_requests`
  - **Anonymous:** no direct table access (preferred), OR insert-only if business requires direct client write.
  - **Authenticated admin users:** read-only (via app auth role), optional update for status fields only.
  - **Public update/delete:** never.
  - **Service role (backend only):** insert/read/update as needed for internal workflows.

### Exact policy baseline (if you keep any client write)
1. `ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;`
2. Revoke broad grants from `anon` and `authenticated`.
3. Create policy `anon_insert_consultation_requests` for `INSERT` with strict `WITH CHECK` constraints on allowed fields/lengths.
4. Do **not** create `SELECT`, `UPDATE`, `DELETE` policies for `anon`.
5. Create admin-only policies tied to JWT role/claim checks for `SELECT` (and optional constrained `UPDATE`).

> Note: exact runtime grants/roles are **not verifiable from code** alone; must be confirmed in Supabase dashboard/SQL.

---

## D. Required code changes (minimal, production-safe)

1. **Frontend: remove direct Supabase fallback**
   - File: `src/lib/supabaseClient.ts`
   - Edits:
     - Delete `DEFAULT_SUPABASE_URL`, `DEFAULT_SUPABASE_ANON_KEY`, `postDirectToSupabase`.
     - `insertConsultationRequest` should POST to backend only and fail if backend unavailable.

2. **Backend: require service role key only**
   - Files: `api/consultation-requests.js`, `server/index.mjs`
   - Edits:
     - Remove fallback to `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`.
     - Use only `SUPABASE_SERVICE_ROLE_KEY`.

3. **Backend: add validation + request body size limit**
   - Files: `api/consultation-requests.js`, `server/index.mjs`
   - Edits:
     - Enforce schema validation and max lengths.
     - Reject unknown fields and oversized payloads.

4. **Backend: add abuse protection**
   - Files: `api/consultation-requests.js`, `server/index.mjs`, frontend submit form
   - Edits:
     - Implement rate limiting.
     - Add CAPTCHA token field and verify on server.

5. **Supabase migration: enable RLS and policies**
   - File: new migration under `supabase/migrations/`
   - Edits:
     - `ENABLE ROW LEVEL SECURITY`, revoke permissive grants, add explicit policies per access model.

6. **CORS + security headers**
   - Files: `api/consultation-requests.js`, `server/index.mjs`
   - Edits:
     - Restrict allowed origins to production domains.
     - Add baseline secure headers.

---

## E. Safe remediation plan (priority order)

1. **Immediately disable direct frontend Supabase writes** (critical).
2. **Enable RLS on `consultation_requests` and enforce no anon read/update/delete** (critical).
3. **Require service-role-only server writes; remove anon fallback keys from server config** (high).
4. **Add rate limit + CAPTCHA + payload validation** (high).
5. **Lock down CORS and add security headers** (medium).
6. **Review existing rows for spam/poisoned submissions and rotate any exposed/embedded credentials if needed** (operational hardening).

---

## Plain-English owner summary

Right now, this estimator is not safe for an internet-facing launch. The app can bypass your backend and send data straight from the browser to Supabase, and because RLS is off, that creates a real risk that strangers can spam, read, or tamper with customer lead data depending on current database grants. The server endpoint also has no real bot protection or strict validation, so abuse is easy. You should treat this as urgent: remove direct browser-to-database writes, turn on RLS immediately, and enforce backend-only controlled inserts with rate limiting and CAPTCHA.

## Developer checklist (exact fixes)

- [ ] Remove direct Supabase POST fallback from `src/lib/supabaseClient.ts`.
- [ ] Remove hard-coded Supabase URL/anon key from client bundle.
- [ ] In both server handlers, require `SUPABASE_SERVICE_ROLE_KEY` only.
- [ ] Add schema validation (types + max lengths + unknown key rejection).
- [ ] Add request body size limit (e.g., 16KB).
- [ ] Add per-IP rate limiting and CAPTCHA verification.
- [ ] Restrict CORS to production domains.
- [ ] Add CSP + other security headers.
- [ ] Create Supabase migration: enable RLS, revoke broad grants, add explicit policies.
- [ ] Verify in Supabase SQL that anon cannot SELECT/UPDATE/DELETE `consultation_requests`.
- [ ] Audit and clean existing records for spam/test abuse.
