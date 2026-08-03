# LockIn

LockIn is a Next.js monorepo for AI-assisted planning, editable sprint plans,
focus sessions, and Chrome extension sync.

## Structure

- `apps/web` - Next.js app, UI, and API routes.
- `apps/api/prisma` - Prisma schema, migrations, and seed data.
- `packages/ui` - shared shadcn/ui components.
- `packages/db` - generated Prisma client package.
- `packages/i18n` - shared localization helpers and locale files.

The backend is intentionally kept in Next.js API routes under `apps/web/app/api`.
There is no separate Express server in the current architecture.

## Local Development

```bash
pnpm install
pnpm db:generate
pnpm --filter web dev
```

The web app runs on port `3001` by default.

## Chrome Extension

Load the unpacked extension from:

```text
../lockin-extv2/extension
```

Then connect it from the web app's extension connection/settings flow.

## Shared UI Components

Add shadcn components from the repository root with:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

Use shared components from the workspace package:

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
