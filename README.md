# Peaceful Haven Homes Estimator

A Vite + React estimator with a server/API endpoint that automatically emails lead submissions to `info@peacefulhavenhomes.com` (no `mailto:` dependency).

## Environment setup

Copy `.env.example` to `.env` and provide at least:

```bash
RESEND_API_KEY=your_resend_api_key
```

Optional:

- `EMAIL_FROM` to override the sender address.
- `VITE_API_BASE_URL` for local front-end to reach a separately running API server.

## Run locally

### Front-end (Vite)

```bash
npm install
npm run dev:client
```

### API + static server

```bash
npm run build
npm run dev:server
```

The API route is:

- `POST /api/estimate-leads`

## Build

```bash
npm run build
```
