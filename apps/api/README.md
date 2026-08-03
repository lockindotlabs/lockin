# api — the LockIn Express API

Express 4 service for **device-style clients** — primarily the browser extension. The web app keeps its own server logic in Next.js route handlers; this API exists for clients that authenticate with long-lived tokens instead of Clerk sessions.

Runs on port **3001** locally (`pnpm dev` = `tsx watch`). Swagger UI is mounted on the running server for endpoint reference.

## Product role

This API supports the public LockIn MVP by powering extension-facing account, settings, plan, task, project, and Sprint-session flows. It should remain production-minded even while the product is in beta: extension tokens are revocable, user data is scoped through `req.dbUser`, and admin or unstable capabilities should stay protected until they are ready for broader exposure.

## Endpoints

| Mount | Module | Purpose |
|---|---|---|
| `GET /api/me` | — | Current user (creates the DB row on first call) |
| `/api/auth/extension-tokens` | `modules/auth` | Create / list / revoke extension pairing tokens |
| `/api/settings` | `modules/settings` | Blocklists, HUD style, Sprint defaults (UserSettings) |
| `/api/plans` | `modules/plan` | Plan CRUD (extension-facing) |
| `/api/tasks` | `modules/task` | Task CRUD; with `?planId=` returns PlanSteps mapped to the Task shape the extension expects |
| `/api/projects` | `modules/project` | Project CRUD |
| `/api/focus-sessions` | `modules/focus-session` | Start / end / list Sprint sessions; ending one syncs PlanStep statuses |
| `POST /webhooks/clerk` | `modules/webhook` | svix-verified Clerk webhook (`user.deleted` → deactivate user) |

## Auth

`requireAuth()` accepts either a **Clerk JWT** or a **64-hex extension token** (`Bearer <token>`); `syncUser` then resolves `req.dbUser`, lazily creating the `User` row for first-time Clerk users. Tokens are shown once at creation and stored in the `ExtensionToken` table.

## Database

This package owns the Prisma schema and migrations for the whole monorepo:

```bash
pnpm exec prisma migrate dev      # after editing prisma/schema.prisma
```

The client is generated into `packages/db/src/generated` and consumed everywhere as `@workspace/db`.

## Deployment

Deployed as Firebase Cloud Functions v2 (`asia-southeast1`): `pnpm build` bundles `src/functions.ts` with tsup into `dist/` alongside a standalone `deploy.package.json`, then `firebase deploy --only functions` from the repo root. Full walkthrough (including the dependency-sync caveat for `deploy.package.json`): [DEPLOY.md](DEPLOY.md).

Environment goes in `.env` — see the variable table in the [root README](../../README.md#environment-variables).
