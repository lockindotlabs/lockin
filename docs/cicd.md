# CI/CD

This repo uses GitHub Actions as the quality gate and Firebase App Hosting as
the deployment system for the Next.js app in `apps/web`.

## Branches

- `staging` runs CI and deploys to the staging App Hosting backend.
- `master` runs CI and deploys to the production App Hosting backend.
- Feature branches should open pull requests into `staging`; promote from
  `staging` to `master` after the staging deployment has been checked.

## GitHub Actions

The workflow at `.github/workflows/ci.yml` runs:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build:web`

Add these repository or environment secrets in GitHub so CI can build the app:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

## Firebase App Hosting

Create two App Hosting backends with `apps/web` as the app root:

- Staging backend: connected to `staging`
- Production backend: connected to `master`

Use the environment-specific App Hosting config files in `apps/web`:

- `apphosting.yaml`
- `apphosting.staging.yaml`
- `apphosting.production.yaml`

Set each backend's App Hosting Environment name to match the file suffix:

- Staging backend: `staging`
- Production backend: `production`

The configs expect these Secret Manager secrets:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_STAGING`
- `CLERK_SECRET_KEY_STAGING`
- `GOOGLE_GENERATIVE_AI_API_KEY_STAGING`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PRODUCTION`
- `CLERK_SECRET_KEY_PRODUCTION`
- `GOOGLE_GENERATIVE_AI_API_KEY_PRODUCTION`

Keep staging and production Clerk projects, AI keys, and database resources
separate before onboarding real users.
