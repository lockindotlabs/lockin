# `@workspace/db`

Shared Prisma client for the monorepo. Both `apps/web` (Next.js route handlers) and `apps/api` (Express) import their database access from here:

```ts
import prisma from "@workspace/db"
```

`src/client.ts` exports a singleton `PrismaClient` using the `pg` driver adapter (`DATABASE_URL`), cached on `globalThis` in development to survive hot reloads.

## Where the schema lives

**Not here.** The schema and migrations are owned by [`apps/api/prisma/schema.prisma`](../../apps/api/prisma/schema.prisma); its generator writes the client into `src/generated/prisma` in this package. To change the schema:

```bash
cd apps/api
# edit prisma/schema.prisma
pnpm exec prisma migrate dev    # creates a migration + regenerates this package
```

Do not edit anything under `src/generated/` by hand.
