# Crypto What's Up

Crypto What's Up is a Next.js app for short crypto market briefings. It combines price data, optional X/Twitter source checks, and model-generated analysis into a compact daily view.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

The dev server runs on `http://localhost:3100`.

## Environment

Required for AI summaries:

- `ANTHROPIC_API_KEY`
- `XAI_API_KEY`

Optional integrations and guards:

- `TWITTER_API_KEY` for source verification
- `REPORT_PASSWORD` for the internal report generator
- `ARCHIVE_PASSWORD` for archive access
- `CRON_SECRET` for scheduled cache refreshes
- `DAILY_API_BUDGET` to cap model calls

For public deployments, set `REPORT_PASSWORD`, `ARCHIVE_PASSWORD`, and `CRON_SECRET`. Never commit `.env.local` or real API keys.

## Scripts

```bash
npm run dev
npm run build
npm run start
```
