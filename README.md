# Peaceful Haven Homes Estimator

A Vite + React estimator that guides users through project questions and generates a downloadable PDF summary. Schedule Consultation and the PDF soft-gate both notify `info@peacefulhavenhomes.com` through `/api/consultation-requests`.

## Environment setup

Copy `.env.example` to `.env` for local development.

### Vercel production (required before live email works)

In the Vercel project → **Settings → Environment Variables**, add these for Production (and Preview if you want preview deploys to send mail):

| Variable | Required | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | **Yes, from Eray** | Create at [resend.com](https://resend.com) → API Keys. Without this key, consultation rows still save to Supabase but **no email is sent**. |
| `EMAIL_FROM` | **Yes for production** | Must be a sender Resend has verified. After verifying `peacefulhavenhomes.com`, use e.g. `Peaceful Haven Homes <noreply@peacefulhavenhomes.com>`. |
| `SUPABASE_URL` | Yes (already used today) | Existing consultation insert. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (already used today) | Existing consultation insert. |
| `LEAD_NOTIFY_TO` | Optional | Defaults to `info@peacefulhavenhomes.com`. Set to your own inbox for a first smoke test. |
| `LEAD_EMAIL_DRY_RUN` | Optional | Set to `true` only for local/dev. Logs the email body and does **not** call Resend. |

`onboarding@resend.dev` can only send to the Resend account owner. It cannot deliver to `info@peacefulhavenhomes.com`. Production delivery needs a verified domain in Resend.

Existing optional client vars:

- `VITE_API_BASE_URL` if the front-end should submit to a custom backend instead of same-origin `/api`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` to override the built-in consultation fallback

## Safe way to test

### Local dry-run (no API key, no real email)

```bash
LEAD_EMAIL_DRY_RUN=true npm run dev:client
```

Submit either form. The Vite `/api/consultation-requests` middleware logs the plain-text email and returns `{ ok: true, dryRun: true }`. The PDF still downloads locally. No message is sent to Resend.

You can also run the unit tests:

```bash
npm test
```

### Real Resend smoke test

1. Create a Resend API key.
2. For a first test **without** a verified domain: set `EMAIL_FROM` to `Peaceful Haven Homes <onboarding@resend.dev>` and `LEAD_NOTIFY_TO` to the email on that Resend account.
3. After the domain is verified: set `EMAIL_FROM` to a verified address and `LEAD_NOTIFY_TO` to `info@peacefulhavenhomes.com` (or omit it).
4. Add the same values in Vercel, then redeploy.

## Run locally

### Front-end (Vite)

```bash
npm install
npm run dev:client
```

The Vite dev server also hosts `POST /api/consultation-requests`.

### Static server

```bash
npm run build
npm run dev:server
```

## Build

```bash
npm run build
```
