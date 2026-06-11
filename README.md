![LockIn Logo Banner](https://iili.io/CCCJN99.png)

# LockIn

LockIn is a public MVP for an AI-powered productivity product. It helps users turn overwhelming tasks into focused action through AI task breakdown, editable planning, and **Sprint-based focus sessions**.

The core product is live and usable today, while some features are still experimental and actively being improved through testing and feedback.

> New here? Read [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md) for the full product and architecture tour.

## Status

LockIn is currently in public MVP / beta development.

The core product is live, but some features are still experimental and actively being improved based on testing and feedback.

## Live Product

Live site: [LockIn](https://lockinlabs.online)

> [!NOTE]
> LockIn is an active MVP. Some features may still be experimental as the product is being developed and tested.

## Product concept

LockIn is an early-stage productivity product that helps users move from vague intentions to focused action.

It combines AI task breakdown, editable planning, Sprint-based focus sessions, and an optional browser extension for distraction blocking. The project demonstrates the core product concept, user flow, and technical implementation of an AI-powered focus assistant.

## What this demonstrates

- Product thinking and MVP scoping
- Full-stack development across web, API, database, auth, billing, and analytics
- AI-assisted workflow design using task breakdown and planning tools
- UX/UI decisions for planning, focus sessions, and protected product flows
- Real deployment experience across the public web app and backend API
- Iteration on a usable product concept rather than a static demo

## Stack

- **Web** — Next.js 16 (App Router) · React 19 · Tailwind 4 · shadcn/ui · Vercel AI SDK v6 + assistant-ui · Google Gemini
- **Device API** — Express 4 (serves the browser extension)
- **Data** — PostgreSQL (Supabase) via Prisma 7
- **Auth** — Clerk (web) + long-lived extension tokens (API)
- **Payments** — PayOS · **Analytics** — PostHog + custom admin dashboard

## Repository layout

```
apps/
  web/        Next.js app — product UI + most server logic (AI chat, plans,
              billing, admin) in app/api/* route handlers
  api/        Express API for the browser extension (tokens, focus sessions,
              settings) — also owns prisma/schema.prisma and migrations
packages/
  db/         Shared Prisma client (generated from apps/api/prisma)
  ui/         Shared shadcn-based component library
  i18n/       Localization resources
  eslint-config/, typescript-config/
docs/         Product flows, test plans, audit, deployment notes
```

Both apps share one Postgres database through `@workspace/db`.

## Getting started

Prerequisites: Node ≥ 20, pnpm 9 (`corepack enable`), a Postgres database, and a [Clerk](https://clerk.com) application.

```bash
pnpm install

# 1. Environment
#    apps/web/.env.local  and  apps/api/.env  (see table below)

# 2. Database — run migrations and generate the client
cd apps/api && pnpm exec prisma migrate dev && cd ../..

# 3. Run everything (web :3000, api :3001)
pnpm dev
```

Alternatively run the services under PM2 (`pm2 start ecosystem.config.cjs`) — see [CLAUDE.md](CLAUDE.md) for the full PM2 cheat sheet.

### Environment variables

| Variable                                                                                                                                                               | Used by  | Purpose                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| `DATABASE_URL` / `DIRECT_URL`                                                                                                                                          | both     | Postgres connection (pooled / direct)                                      |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`                                                                                                                | web, api | Clerk auth                                                                 |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | web      | Clerk routing (`/app/sign-in`, `/app/sign-up`, `/app`, `/app`)             |
| `CLERK_WEBHOOK_SECRET`                                                                                                                                                 | api      | Verifies the Clerk `user.deleted` webhook                                  |
| `GOOGLE_GENERATIVE_AI_API_KEY`                                                                                                                                         | web      | Gemini models for the AI planner                                           |
| `TAVILY_API_KEY`                                                                                                                                                       | web      | Web-search tool (optional)                                                 |
| `LOCKIN_ENABLE_WEB_SEARCH`, `LOCKIN_ENABLE_COMPLEX_REASONING`                                                                                                          | web      | Feature flags (`"true"` to enable)                                         |
| `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`                                                                                                               | web      | PayOS billing                                                              |
| `PUBLIC_WEB_URL`                                                                                                                                                       | web      | Absolute base URL for PayOS return/cancel links                            |
| `NEXT_PUBLIC_API_URL`                                                                                                                                                  | web      | Express API origin (default `http://localhost:3001`)                       |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`                                                                                                        | web      | PostHog analytics (optional)                                               |
| `ALLOWED_ORIGINS`                                                                                                                                                      | api      | Comma-separated CORS whitelist (allows all when unset — set in production) |
| `PORT`                                                                                                                                                                 | api      | API port (default 3001)                                                    |

## Common commands

```bash
pnpm dev          # turbo dev — both apps with hot reload
pnpm build        # build everything (or build:web / build:backend)
pnpm lint         # eslint across the workspace
pnpm typecheck    # tsc --noEmit across the workspace
pnpm test         # placeholder — no automated tests yet
```

Schema changes: edit [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma), then `pnpm exec prisma migrate dev` from `apps/api`. The client regenerates into `packages/db/src/generated`.

## Deployment

- **API** → Firebase Cloud Functions v2 (`asia-southeast1`), bundled with tsup. Full walkthrough: [apps/api/DEPLOY.md](apps/api/DEPLOY.md).
- **Web** → Public site at [lockinlabs.online](https://lockinlabs.online). Firebase App Hosting configs are scaffolded in `apphosting.yaml`; CI (GitHub Actions) runs lint / typecheck / test / build on PRs and pushes to `master` and `staging`.

## Public MVP checklist

Before sharing LockIn with reviewers, confirm:

- No API keys or secrets are exposed
- Auth-protected routes require authentication
- Users can only access their own data
- Database security rules / RLS are enabled where applicable
- Payment, subscription, admin, and unstable flows stay protected until ready
- Error messages do not expose stack traces
- Demo data is separated from real user data
- Destructive actions require confirmation
- The core AI planning and Sprint flow works reliably enough for a first impression

## Documentation

| Doc                                                                                                         | Contents                                   |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)                                                        | Architecture and feature tour              |
| [docs/CODEBASE_AUDIT_2026-06-11.md](docs/CODEBASE_AUDIT_2026-06-11.md)                                      | Prioritized issues & pre-launch punch list |
| [docs/APP_FLOW_OVERVIEW.md](docs/APP_FLOW_OVERVIEW.md)                                                      | End-to-end product flows                   |
| [docs/APP_TEST_FLOWS.md](docs/APP_TEST_FLOWS.md) / [docs/END_USER_UAT_TESTS.md](docs/END_USER_UAT_TESTS.md) | Manual test plans                          |
| [docs/payment-flow-test-cases.md](docs/payment-flow-test-cases.md)                                          | Billing test cases                         |
| [docs/admin-analytics-metrics.md](docs/admin-analytics-metrics.md)                                          | Admin metric definitions                   |
