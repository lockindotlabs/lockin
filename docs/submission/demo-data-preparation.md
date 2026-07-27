# Outcome 3 Demo Data Preparation

This preparation is for the development database only. Do not run it against
production until the team explicitly approves the final production data plan.

## Goal

Create credible records for final submission evidence:

- user join dates
- AI-assisted plans
- plan steps
- focus sessions
- extension/focus blocker settings
- 20 real feedback responses collected by the validation team

## Files

- `apps/api/prisma/submission-demo-users.example.json` - copy this to
  `apps/api/prisma/submission-demo-users.json` and fill real dev account emails
  or Clerk user IDs.
- `apps/api/prisma/seed-submission-demo.ts` - dry-run/apply script for dev DB
  records.
- `docs/submission/feedback-responses.template.csv` - 20-row feedback template
  for validation evidence.

## Suggested Flow

1. Create dev accounts in the app.
2. Copy `submission-demo-users.example.json` to `submission-demo-users.json`.
3. Fill each user's `email` or `id`, `joinDate`, and optional `displayName`.
4. Run dry-run:

```bash
pnpm exec tsx apps/api/prisma/seed-submission-demo.ts
```

5. If the output targets only the intended users, apply:

```bash
pnpm exec tsx apps/api/prisma/seed-submission-demo.ts --apply
```

6. Open the web app and capture evidence:

- plans page
- plan detail/editor
- focus session history
- extension popup/HUD if connected

## Safety Rules

- The script is dry-run by default.
- The script only targets users listed in `submission-demo-users.json`.
- The script does not delete real user data.
- Demo plans and records use `submission-demo-*` IDs and `[Submission Demo]`
  titles so they are easy to identify.
- No Prisma schema migration is required.

## Feedback Collection

The validation team should collect real responses from 20 users. Minimum fields:

- tested feature
- ease of use rating
- usefulness rating
- what they liked
- what confused them
- suggestion
- whether they would use it again

After the CSV is filled, summarize:

- average ease of use
- average usefulness
- top 3 liked points
- top 3 confusion points
- top 3 improvements for Iteration & Learning slide
