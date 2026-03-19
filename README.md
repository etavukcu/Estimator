# Peaceful Haven Homes Estimator

A Vite + React estimator that guides users through project questions and generates a downloadable PDF summary.

## Environment setup

Copy `.env.example` to `.env` if you need custom client variables.

Optional:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the included `/api/consultation-requests` server endpoint (`SUPABASE_ANON_KEY` can be used as a fallback key if needed).
- `VITE_API_BASE_URL` if you want the front-end to submit through a custom backend endpoint instead of same-origin `/api`.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for direct client-side fallback when API endpoints are unavailable.

## Run locally

### Front-end (Vite)

```bash
npm install
npm run dev:client
```

### Static server

```bash
npm run build
npm run dev:server
```

## Build

```bash
npm run build
```
