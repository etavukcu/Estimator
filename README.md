# Peaceful Haven Homes Estimator

A Vite + React estimator that guides users through project questions and generates a downloadable PDF summary.

## Environment setup

Copy `.env.example` to `.env` if you need custom client variables.

Optional:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for direct client-side consultation request capture in Supabase.
- `VITE_API_BASE_URL` if you want the front-end to submit through a custom backend endpoint instead.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only when running the included server API mode.

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
