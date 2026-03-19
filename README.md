# Peaceful Haven Homes Estimator

A Vite + React estimator that guides users through project questions and generates a downloadable PDF summary.

## Environment setup

Copy `.env.example` to `.env` if you need custom client variables.

Optional:
- `VITE_API_BASE_URL` if you want the front-end to point at a custom backend.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for consultation request capture in Supabase via the server API.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as a client-side fallback when the API endpoint is unavailable.

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
