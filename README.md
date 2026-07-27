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

```tsx
import { Button } from "@workspace/ui/components/button";
```
