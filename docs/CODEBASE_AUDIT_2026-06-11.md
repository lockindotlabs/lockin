# LockIn Codebase Audit — 2026-06-11

**Scope:** full repository at commit `e07d199` (branch `feat/plan-persistence-and-ai`, with working-tree changes included).
**Reviewed:** monorepo layout, Express API, Next.js app + API routes, Prisma schema & migrations, auth (Clerk + extension tokens), billing (PayOS), AI chat pipeline (AI SDK v6 + Gemini), admin analytics, CI/deploy configs.

---

## 1. Executive summary

The codebase is in **good shape for a pre-launch MVP**. Code quality is consistently above average for a project at this stage: Zod validation on nearly every input, user-scoped queries everywhere, signature-verified webhooks (Clerk via svix, PayOS via SDK), soft deletes, idempotent payment-state transitions, and a tracked migration history.

The two findings that would genuinely hurt you in production are **architectural, not cosmetic**:

1. **There is no enforcement layer for AI usage.** Billing tiers exist (`FREE/PLUS/PRO`), money is collected, but nothing anywhere checks tier, quota, or rate before calling Gemini. Any signed-up free user can stream unlimited model calls. This is an uncapped cost liability and the single biggest launch blocker.
2. **You have two backends writing the same database with different semantics.** The Next.js API routes and the Express API both implement plan CRUD, with diverging behavior (the Next path destructively rewrites all plan steps; the Express path updates granularly). This split-brain will get harder to unwind every week.

Everything else is fixable in days, not weeks. Detailed findings below, prioritized.

---

## 2. Architecture review

### Current shape

```
apps/web      Next.js 16 (App Router) — UI + API routes for chats, plans,
              billing, admin, search, AI chat (talks to Prisma directly)
apps/api      Express — plans, tasks, projects, settings, focus sessions,
              extension tokens, Clerk webhook (talks to Prisma directly)
packages/db   Prisma client (generated from apps/api/prisma/schema.prisma)
packages/ui   Shared shadcn-based component library
packages/i18n Localization
```

Postgres (Prisma 7 + pg adapter), Clerk auth, Gemini via AI SDK v6, PayOS payments, PostHog analytics, Firebase App Hosting configs + a `.vercel` directory + PM2 for local dev.

### What's good

- Clean Turborepo layout; module-per-feature in the Express app (`modules/plan`, `modules/focus-session`, …) and route-colocated logic in Next.
- A real separation between server data access (`lib/server/*`) and client fetch wrappers (`lib/plans/plan-repository.ts`, `lib/focus/focus-api.ts`).
- One shared Prisma client (`packages/db`) with the dev-singleton pattern done correctly.
- Migration history is real (9 migrations), not `db push` drift.

### Findings

**A1 — Split-brain backend (Important, becomes Critical with time).**
Plan CRUD exists twice: [plan.controller.ts](apps/api/src/modules/plan/plan.controller.ts) (Express) and [plan-store.ts](apps/web/lib/server/plan-store.ts) + [app/api/plans](apps/web/app/api/plans/route.ts) (Next). They have different update semantics — Express patches fields and preserves steps; Next deletes **all** PlanSteps and recreates them on every save. The web app actually uses the Next path for plans and the Express path only for focus sessions and extension tokens. Recommendation: pick one owner per aggregate. Pragmatic split: **Express = the extension/device API** (tokens, focus sessions, the mapped "tasks" endpoint), **Next = everything the web UI touches** (plans, chats, billing, admin). Then delete the redundant Express plan/project/task web-facing surface or mark it extension-only. Do this before the two paths diverge further.

**A2 — Stale duplicate Prisma client (Important, trivial fix).**
`apps/api/src/generated/prisma/` is an old generated client (missing `Chat`, `PlanStep`, `Sprint`, `PaymentOrder`). Nothing imports it — [apps/api/src/lib/prisma.ts](apps/api/src/lib/prisma.ts) correctly re-exports `@workspace/db` — but it's a landmine: one wrong auto-import and someone is querying with a stale schema. Delete the directory. Also consider moving `schema.prisma` into `packages/db/` (it currently lives in `apps/api/prisma/` but generates into `packages/db/src/generated` — the schema's home contradicts its ownership).

**A3 — Deployment story is ambiguous (Important).**
The repo carries Firebase App Hosting configs (mostly commented out), a `.vercel` directory, PM2 ecosystem config, and a tsup build that npm-installs into `dist/`. The API's `start` script runs `tsx src/index.ts` (TypeScript at runtime) even though a build pipeline exists. Pick one target, document it in the README, and make `start` run compiled output. Note: the chat route's `maxDuration = 30` is a Vercel-ism; if you deploy there, 30s is tight for a 5-step streamed tool loop with web search.

**A4 — Vestigial models: `Task`/`Sprint` vs `PlanStep` (Nice-to-have).**
The product concept "break down → steps → Sprint focus sessions" is actually modeled by `Plan`/`PlanStep`/`FocusSession`. The `Task` + `Sprint` models are a parallel older system; [task.controller.ts](apps/api/src/modules/task/task.controller.ts) even maps PlanSteps into a "Task-compatible shape" for the extension. Decide: either Sprints become first-class (then FocusSession should reference a Sprint) or remove `Task`/`Sprint` and rename the extension endpoint. The schema also shows `prisma db pull` artifacts on these models (capitalized relation fields `User`/`Task`/`Sprint`, `updatedAt` without `@updatedAt` on `Sprint`).

---

## 3. Security & authentication

### What's good

- Clerk middleware protects `/app(.*)` ([proxy.ts](apps/web/proxy.ts)); every Next API route independently authenticates via `getCurrentDbUser()` — defense in depth, no route found missing a check.
- Both webhooks verify signatures (svix for Clerk, PayOS SDK for payments) and the Clerk webhook is correctly mounted before `express.json()` to preserve the raw body.
- All queries reviewed are scoped by `userId`; no IDOR found on plans, chats, sessions, tokens, or orders.
- No `.env` files committed; secrets come from env/secret manager.

### Findings

**S1 — No AI quota, rate limit, or tier enforcement (Critical).**
[app/api/chat/route.ts](apps/web/app/api/chat/route.ts) checks only that a user is signed in. `planTier`, `planExpiresAt`, and the captured per-message `usage` metadata are never consulted. Web-search and complex-reasoning are gated by **global env vars**, not per-user tier. Consequences: unbounded Gemini spend, and your paid tiers currently sell nothing the free tier doesn't get. Fix sketch in §6.

**S2 — Extension tokens stored in plaintext (Critical).**
[auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts) generates a random token and stores it raw; [auth.ts](apps/api/src/middleware/auth.ts) looks it up by raw value. The code comment "never retrievable again" is wrong — it sits in the `token` column. A DB leak becomes full account takeover with no expiry. Fix: store `sha256(token)`, look up by hash, show plaintext once at creation (the UX you already have). Add optional expiry/rotation later.

**S3 — Hardcoded admin allowlist in source (Critical, 5-minute fix).**
[admin-access.ts](apps/web/lib/server/admin-access.ts) has `const ADMIN_USER_IDS_ENV = "user_3Dkrex6deNDuV9ykg4bQCy2rqJC"` — a literal Clerk user ID checked into git, in a variable named as if it were an env var. Move to a real env var now; move to a `role` column or Clerk `publicMetadata` post-MVP. The guard logic itself (`assertAdminPageAccess`, `requireAdminApiAccess`) is correct.

**S4 — CORS fails open (Critical in prod, fine in dev).**
In [app.ts](apps/api/src/app.ts), if `ALLOWED_ORIGINS` is unset, **every** origin is allowed with `credentials: true`. One forgotten env var in prod and any website can make credentialed calls against your API with a visitor's Clerk cookie. Flip the default: in `NODE_ENV=production`, an empty allowlist should deny cross-origin requests (and crash loudly at boot).

**S5 — `isActive` is never enforced (Important).**
The Clerk `user.deleted` webhook sets `isActive: false`, but no middleware checks it. Concretely: a user deletes their account, but their extension token keeps working forever ([syncUser.ts](apps/api/src/middleware/syncUser.ts) loads the user without checking the flag). Check `isActive` in `syncUser`/`getCurrentDbUser`, and consider cascading-deleting extension tokens on `user.deleted`. Longer term, decide your data-deletion policy (the cascade relations are already set up for hard delete).

**S6 — Raw error messages leak to clients (Important).**
[errorBoundary.ts](apps/api/src/middleware/errorBoundary.ts) and [BaseController.handleError](apps/api/src/controllers/BaseController.ts) return `error.message` verbatim — Prisma errors include table/column names and sometimes data fragments. Log the full error server-side; return a generic message + request ID for 5xx.

**S7 — No rate limiting anywhere (Important).**
Chat creation, search, checkout-order creation, and token creation are all unthrottled. Minimum viable: a per-user limiter on `/api/chat` (this falls out of S1) and an IP limiter on the Express app (`express-rate-limit`).

**S8 — Plan→Project ownership not checked (Nice-to-have).**
Express `createPlan`/`updatePlan` accept any `projectId` without verifying the project belongs to the caller. Impact is small (you can attach your own plan to a foreign project ID and read back its name/color through the `include`), but it's a one-line `findFirst` check.

---

## 4. Data model & backend logic

### What's good

- The core schema (`User → Plan → PlanStep`, `FocusSession`, `PaymentOrder`) cleanly supports the product loop, with sensible enums, soft delete on Plan (`deletedAt` + `@@index([userId, deletedAt])`), and the right indexes on hot paths (`PlanStep [planId, order]`, `PaymentOrder [userId, createdAt]`).
- [applyPaymentStatus](apps/web/lib/billing/orders.ts) is genuinely careful: transactional, idempotent on re-delivered webhooks, refuses to downgrade a PAID order, preserves first-seen timestamps.
- Focus-session end correctly syncs PlanStep statuses scoped to the owning plan (and the comment documents a past bug — good hygiene).

### Findings

**D1 — Destructive plan save + no concurrency control (Important).**
`upsertOwnedPlan` deletes every PlanStep and recreates the list on each save. Combined with the 500ms debounced autosave in [PlanEditor.tsx](apps/web/app/app/(main-view)/(editor)/plan/PlanEditor.tsx:257), the AI `rewriteActivePlan` tool, and the possibility of two open tabs, you get silent last-writer-wins data loss. The serialized plan already carries `updatedAt` and a `version` field — use them: send the client's `updatedAt` as an optimistic-lock precondition (`updateMany({ where: { id, userId, updatedAt: clientValue } })`) and return 409 on mismatch so the UI can refetch/merge. Also note `createMany({ skipDuplicates: true })` with client-supplied step IDs silently drops a step on a global ID collision.

**D2 — Concurrent chat streams clobber each other (Important).**
`Chat.messages` is one JSON blob rewritten wholesale in `onFinish`. The `status: STREAMING` flag is written but never *checked* — the chat POST doesn't reject a second concurrent stream on the same chat, so two parallel sends end with whichever `saveChatMessages` finishes last, deleting the other turn. Cheap fix: reject (or queue) when `status === "STREAMING"` and stale-guard the flag with a timestamp so a crashed stream doesn't lock the chat forever.

**D3 — Chat JSON blob won't scale (acceptable for MVP, plan the exit).**
Unbounded growth per chat, full rewrite per turn, `messageCount` computed by parsing every blob in list/search endpoints, and message *content* is unsearchable (search hits titles only). Post-MVP: a `ChatMessage` row per message, or at minimum cap stored history and add `(userId, updatedAt)` index on Chat.

**D4 — No usage/quota tables (Critical — schema side of S1).**
Nothing stores AI consumption. Minimum: an `AiUsage` table (`userId, chatId, model, inputTokens, outputTokens, createdAt`, indexed on `[userId, createdAt]`). You're already handed `totalUsage` in the route's `messageMetadata` callback — it's currently thrown into message metadata and never aggregated.

**D5 — User sync race (Nice-to-have).**
Express `syncUser` does `findUnique` → `create` (can throw P2002 on first concurrent requests) while Next `getCurrentDbUser` correctly uses `upsert`. Align on upsert. Also note `getCurrentDbUser` issues a write-capable upsert on **every** request — fine now, worth caching per-request later.

**D6 — Billing nits (Nice-to-have).**
`createPendingOrder` retries on a timestamp-derived `payosOrderCode` collision — fine. A PAID webhook and a `syncPaymentOrderFromPayOS` racing both write the same `planExpiresAt = now + 30d`, so no compounding — fine. But: a user who buys PLUS then PRO mid-cycle gets no proration/stacking (30 days flat from payment), and expiry is computed at read time (`getEffectiveTier`) while `planTier` stays stale in the DB — make sure future quota checks use the effective tier, not the column.

---

## 5. AI feature implementation

### What's good

- The system prompt is genuinely well-designed product thinking: MCQ intake → draft in chat → explicit save confirmation → persistence, with clear anti-patterns spelled out. The draft/save separation prevents the classic "AI spammed my workspace with plans" failure.
- Server-side allowlists for models (`ALLOWED_MODEL_NAMES`) and frontend tools (`ALLOWED_FRONTEND_TOOLS`) — the client can't smuggle arbitrary tool definitions or expensive models.
- `removePendingToolCalls` + `validateUIMessages` + `ignoreIncompleteToolCalls` show real care about resuming from interrupted tool states.
- Mention context ([mention-context.ts](apps/web/lib/server/mention-context.ts)) is properly ownership-checked, deduped, capped (8 mentions, truncated text).

### Findings

**AI1 — Plan persistence executes in the browser (Important).**
`createPlan`/`rewriteActivePlan` are **frontend** tools ([ai-plan-tools.tsx](apps/web/lib/plans/ai-plan-tools.tsx)): the model's tool call streams to the client, a React hook executes `savePlan()` via fetch, and the result streams back. Consequences: close the tab mid-stream and the "saved" plan never saves; `rewriteActivePlan` resolves the target plan from **URL search params**, so navigating away mid-conversation breaks it; each tool round-trip costs a full client↔server hop inside a `stepCountIs(5)` budget. The fallback in `PlanToolResultCard` that tries to find the plan by *matching title and task count* is a symptom of this fragility. Recommendation: make these server-side `tool()`s in the chat route (they'd call `upsertOwnedPlan` directly, with the active plan ID passed in request `config`), and keep only genuinely-UI tools (`askChoice`, `askChoicesBatch`) on the client. This is the single highest-leverage AI refactor.

**AI2 — No retries, fallback, or output guarding (Important).**
One model call, no `maxRetries` tuning, no fallback model, no handling for Gemini safety blocks or empty outputs; the catch block flips chat status to ERROR and returns a generic 500. The tool input schema accepts a plan with zero tasks (`normalizeTasks` filters empties but nothing rejects an empty result). Add: minimal output validation in the (server-side) tool, and a fallback model via AI SDK. Given you're on Vercel-adjacent infra, AI Gateway would give you fallbacks + spend observability nearly for free.

**AI3 — No history windowing (cost) (Important).**
The full message history is converted and sent every turn. With the JSON-blob storage (D3) this means cost grows linearly with conversation length, forever. Cap to the last N messages (mention-context already proves the pattern: `MAX_CHAT_MESSAGES = 8`).

**AI4 — 560-line prompt inline in the route file (Nice-to-have).**
Extract `SYSTEM_INSTRUCTIONS` / `TOOL_BEHAVIOR_INSTRUCTIONS` to `lib/ai/prompts.ts` with a version constant. You'll want prompt versioning the first time you A/B a change, and the route file drops from 835 lines to ~270.

**AI5 — `includeThoughts`/`sendReasoning`/`console.log(part)` keyed off `NODE_ENV === "development"` (Nice-to-have).** Fine, but make it an explicit debug flag — `NODE_ENV` is a blunt instrument once you have staging.

---

## 6. Code quality

Generally consistent and readable. Naming is clear, Zod schemas are colocated with handlers, and the serialization boundary (`serializePlan`/`serializePlanSummary`) is explicit. Specific notes:

- **Large client components:** `ask-choice-tool-ui.tsx` (972 lines), `thread.tsx` (719), `PlanEditor.tsx` (682), `mention-composer.tsx` (560). None are unhealthy yet, but PlanEditor mixes data fetching, autosave orchestration, and presentation — split the autosave logic into a `usePlanAutosave` hook before adding features.
- **Ad-hoc client cache invalidation:** plan changes propagate via `window.dispatchEvent(new Event("lockin:plans-changed"))` and a custom rewrite event. Works, but you're reinventing a query cache. Post-MVP, adopt TanStack Query (or SWR) and replace the event bus with invalidation.
- **Two ID/`createId()` and date-format helpers duplicated** across `ai-plan-tools.tsx` and `PlanEditor.tsx` — move to a shared util.
- **`tsx` is in `dependencies`** of both apps and used as the prod start path for the API (A3).
- **Zero tests** while CI dutifully runs `pnpm test` against `echo "No tests yet"`. The highest-ROI first tests: `applyPaymentStatus` state machine, `upsertOwnedPlan` (ownership + step replacement), and the future quota gate. All three are pure-ish server logic — cheap to test with Vitest + a test DB or mocked Prisma.
- **CI is solid** (lint, typecheck, build on PR + push) but has no migration deploy step — document where `prisma migrate deploy` runs in your release path.

---

## 7. Prioritized issue list

### Critical — fix before launch

| # | Issue | Where | Effort |
|---|-------|-------|--------|
| C1 | No AI quota/rate-limit/tier enforcement; uncapped model spend | [chat/route.ts](apps/web/app/api/chat/route.ts) | 1–2 days |
| C2 | Extension tokens stored in plaintext | [auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts), [auth.ts](apps/api/src/middleware/auth.ts) | ½ day |
| C3 | Admin user ID hardcoded in source | [admin-access.ts](apps/web/lib/server/admin-access.ts) | 15 min |
| C4 | CORS fails open with credentials when env unset | [app.ts](apps/api/src/app.ts) | 30 min |
| C5 | No usage tracking table to support C1 | schema | with C1 |

**C1 sketch:** add `AiUsage` table → in the chat POST, after auth: compute effective tier (`getEffectiveTier`), look up a per-tier daily/monthly message-or-token budget, count this period's usage (single indexed aggregate), return 429 with a friendly payload if exceeded; record usage in the existing `onFinish`/`messageMetadata` hooks. Gate `web-search`/`complex-reasoning` and the larger model on tier instead of global env vars. This also turns your billing tiers into an actual product.

### Important — fix during launch hardening (first 2–4 weeks)

| # | Issue | Where |
|---|-------|-------|
| I1 | Split-brain backend; duplicate plan CRUD with divergent semantics | apps/api vs apps/web (§2 A1) |
| I2 | Move `createPlan`/`rewriteActivePlan` execution server-side | [ai-plan-tools.tsx](apps/web/lib/plans/ai-plan-tools.tsx), chat route (§5 AI1) |
| I3 | Optimistic locking on plan saves; stop delete-all-recreate races | [plan-store.ts](apps/web/lib/server/plan-store.ts) (§4 D1) |
| I4 | Reject concurrent streams per chat (lost-update on messages blob) | chat route + chat-store (§4 D2) |
| I5 | Enforce `isActive`; revoke tokens on Clerk user deletion | syncUser, getCurrentDbUser, webhook (§3 S5) |
| I6 | Sanitize error responses | errorBoundary, BaseController (§3 S6) |
| I7 | Basic rate limiting (chat, search, checkout, token creation) | both apps (§3 S7) |
| I8 | History windowing for model calls (cost) | chat route (§5 AI3) |
| I9 | Delete stale generated Prisma client in apps/api; relocate schema to packages/db | (§2 A2) |
| I10 | First tests: payments state machine, plan upsert, quota gate | new (§6) |
| I11 | Settle the deployment story; stop running tsx in prod | (§2 A3) |
| I12 | AI retries/fallback model + tool output validation | chat route (§5 AI2) |

### Nice-to-have — safely post-MVP

- Chat storage normalization (per-message rows, content search, pagination beyond `take: 10/50`) — §4 D3
- TanStack Query replacing the window-event cache bus — §6
- `Task`/`Sprint` model cleanup or promotion to first-class — §2 A4
- Prompt extraction + versioning; debug flags instead of `NODE_ENV` checks — §5 AI4/AI5
- Project-ownership check on plan create/update — §3 S8
- Billing proration/stacking; reconciliation cron for stuck PENDING orders — §4 D6
- Observability: structured logging, Sentry, AI spend dashboards (AI Gateway or PostHog LLM analytics)
- Align `syncUser` on upsert; per-request user caching — §4 D5
- Shared `createId`/date utils; `usePlanAutosave` extraction — §6

---

## 8. Suggested target architecture (incremental, no rewrite)

1. **One write-path per aggregate.** Next API routes own plans/chats/billing/admin; Express becomes the *device API* (extension tokens, focus sessions, extension-shaped task reads). Document this rule in CLAUDE.md so it survives.
2. **AI tools live on the server.** Chat route executes `createPlan`/`rewriteActivePlan` against `plan-store` directly; client keeps only interactive UI tools. Active-plan ID travels in the request `config`, not the URL.
3. **A `lib/ai/` module** in apps/web: `prompts.ts` (versioned), `models.ts` (allowlist + tier mapping), `quota.ts` (check + record), `tools/` (server tools). The route file becomes thin orchestration.
4. **Quota as a first-class concept** backed by `AiUsage`, checked pre-stream, recorded post-stream — this is also the foundation for the analytics you'll want anyway.
5. **Versioned plan saves** (`updatedAt` precondition → 409 → client refetch), which simultaneously fixes autosave races, AI-rewrite races, and multi-tab edits.

---

*Prepared by Claude Code. Happy to walk through any finding interactively — every issue above links to the exact file, and I can demonstrate, fix, or prototype any of them on request.*
