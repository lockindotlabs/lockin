# web — the LockIn Next.js app

The public product UI **and** most server logic for LockIn: Next.js 16 App Router with route handlers under `app/api/*` that talk to Postgres directly via `@workspace/db`.

LockIn is an active public MVP / beta for an AI-powered productivity product. The landing page is public, while the product surface is protected behind Clerk login so reviewers can see the concept without exposing unreleased or user-specific flows.

## Product role

This app demonstrates the core LockIn product experience:

- AI task breakdown for turning vague intentions into executable plans
- Editable planning flows backed by user-owned data
- Sprint-based focus sessions connected to plans and tasks
- Auth-protected app routes, billing surfaces, and admin tooling
- Public landing-page positioning for early-access / beta expectations

## What lives here

| Area | Where | Notes |
|---|---|---|
| Landing page | `app/page.tsx` | Public |
| Product surface | `app/app/**` | Clerk-protected by [proxy.ts](proxy.ts) middleware |
| AI chat (streaming) | `app/api/chat/route.ts` | Gemini via AI SDK; system prompt, tool allowlist, @-mention context |
| Chats / plans / search APIs | `app/api/chats`, `app/api/plans`, `app/api/search` | Ownership-scoped CRUD, backed by `lib/server/*-store.ts` |
| Billing (PayOS) | `app/api/billing/*`, `lib/billing/` | Checkout, signature-verified webhook, return-page sync |
| Admin dashboards | `app/app/(admin)`, `app/api/admin/*` | Guarded by `lib/server/admin-access.ts` |
| Plan editor | `app/app/(main-view)/(editor)/plan/` | Debounced autosave, AI side panel (`?ai=1`) |
| Focus / Sprints | `app/app/(main-view)/focus/` | Calls the Express API (`NEXT_PUBLIC_API_URL`) |
| Chat UI components | `components/` (thread, mention-composer, tool UIs) | Built on `@assistant-ui/react` |
| Server data access | `lib/server/` | The only place web code touches Prisma |

## Conventions

- Server routes authenticate with `getCurrentDbUser()` (Clerk session → lazy `User` upsert) and must scope every query by `userId`.
- AI tools exposed to the model are allowlisted in `app/api/chat/route.ts`; plan-mutating tools execute client-side in `lib/plans/ai-plan-tools.tsx`.
- UI primitives come from `@workspace/ui`; add new shadcn components with `pnpm dlx shadcn@latest add <name> -c apps/web` (they land in `packages/ui`).

## Commands

```bash
pnpm dev          # next dev --turbopack (port 3000)
pnpm build        # next build
pnpm lint / typecheck
```

Environment goes in `.env.local` — see the variable table in the [root README](../../README.md#environment-variables).
