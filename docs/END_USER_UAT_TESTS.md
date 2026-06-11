# LockIn End-User UAT Test Pack

Last reviewed against the codebase on 2026-06-08.

## Purpose

This document defines manual UAT scenarios for real end-user testing of LockIn.
It is based on the current web routes, extension connection flows, billing flows,
and the existing internal flow docs already in this repo.

Use this as the business-facing release checklist. For deeper engineering checks,
also see:

- `docs/APP_FLOW_OVERVIEW.md`
- `docs/APP_TEST_FLOWS.md`
- `docs/payment-flow-test-cases.md`

## Scope Covered

This UAT pack covers the implemented end-user journeys visible in the current code:

- Public landing page and app entry
- Auth-gated access into `/app`
- Home prompt to Ask AI
- Plan creation, editing, persistence, filtering, and deletion
- Focus Hub, sprint setup, active sprint, and post-sprint updates
- Ask AI chat lifecycle
- Billing visibility and checkout result flows
- Extension connection, token management, HUD, and blocking behavior

## Out of Scope

Do not use this UAT pack to sign off the following:

- Admin pages under `/app/admin/*`
- Separate sprint history pages that are not built yet
- Onboarding flows that are not built yet
- Project dashboard flows that are not built yet
- Low-level API validation already covered by engineering black-box tests

## Important Notes From Code Review

These UI elements exist in code but should not be treated as release-blocking UAT
features yet:

- The `AI Planner` button inside the standalone plan editor is not wired to an
  action yet.
- The command/search dialog in the sidebar is placeholder UI.
- The Ask page breadcrumb history dropdown is placeholder UI.
- The `Upgrade now`, `View all plans`, and `Switch plan` actions inside the
  billing dialog are not wired.
- The credits meter and `Top up` action in the upgrade dialog look static in the
  current implementation.

For billing checkout UAT, use the user menu -> `Upgrade Plan` flow, not the
billing dialog CTA buttons.

For AI planning UAT, use the Ask AI flow, not the standalone `AI Planner`
button in the plan editor.

## Test Accounts And Setup

Recommended setup before UAT:

- User A: new free account
- User B: returning account with at least 2 saved plans
- User C: paid account, or a test account that can complete a payOS sandbox payment
- Chrome profile with the LockIn extension installed and reloadable
- Running web app, API, and migrated database
- At least one test website present in the extension blocklist

Suggested sample prompts:

- `Finish my UX case study`
- `Study for finals`
- `Prepare for a database exam`
- `Clean my room`

## Release Gate

The build is UAT-ready when:

1. All `P0` scenarios pass.
2. No scenario shows data loss in plans or sprint completion.
3. No scenario creates duplicate plans from a single user action.
4. Protected routes stay protected when signed out.
5. Payment flows do not grant or extend access incorrectly.
6. Extension state stays aligned with sprint state for start, pause, resume,
   and end.

## Implementation Invariants To Recheck

After the duplicate-plan fix, these invariants must hold during UAT:

- Manual and Ask AI planning use the web app's same-origin `/api/plans` route as
  the only writer for plan persistence.
- `Plan.id` is the canonical database ID used by the editor, plans list, Focus
  Hub, and sprint sessions; there is no separate local `serverId`.
- One manual save, AI create, or AI rewrite action must result in one
  non-deleted `Plan` row and one ordered set of `PlanStep` rows.
- Existing duplicate UAT rows should be reviewed with
  `corepack pnpm --filter api cleanup:duplicate-plans` before applying cleanup
  with `corepack pnpm --filter api cleanup:duplicate-plans -- --apply`.
- Signed-out route protection is enforced by both Next/Clerk `proxy.ts` and
  server-side guards on authenticated route layouts/pages.

## Scenario Matrix

| ID | Scenario | Priority |
|---|---|---|
| UAT-01 | Landing page and protected app entry | P1 |
| UAT-02 | Sign in and first app load | P0 |
| UAT-03 | Create a chat from the home prompt | P1 |
| UAT-04 | Create and save a plan manually | P0 |
| UAT-05 | Generate or rewrite a plan through Ask AI | P0 |
| UAT-06 | Review plans list, filters, and deletion | P1 |
| UAT-07 | Start a sprint from the Focus Hub | P0 |
| UAT-08 | Run a sprint: timer, step progress, pause/resume | P0 |
| UAT-09 | End a sprint as normal, early, and overtime | P0 |
| UAT-10 | Verify post-sprint persistence | P0 |
| UAT-11 | Ask AI chat lifecycle | P1 |
| UAT-12 | Billing visibility for free and paid users | P1 |
| UAT-13 | Successful checkout and return sync | P0 |
| UAT-14 | Cancelled checkout does not grant access | P0 |
| UAT-15 | Connect the Chrome extension | P1 |
| UAT-16 | Extension behavior during an active sprint | P1 |
| UAT-17 | Extension token self-service | P2 |
| UAT-18 | Sign out and session protection | P1 |

## Detailed Test Cases

### UAT-01 - Landing page and protected app entry

**Goal**

Validate that a new visitor can understand the product entry points and that the
app remains protected.

**Preconditions**

- Tester is signed out.

**Steps**

1. Open `/`.
2. Confirm the landing page loads without broken layout or missing hero content.
3. Click `Sign In`.
4. Open `/app` directly in a new tab while still signed out.

**Expected**

- Landing page sections render normally.
- `Sign In` routes to the Clerk sign-in flow.
- Direct access to `/app` redirects the signed-out user to sign-in.

### UAT-02 - Sign in and first app load

**Goal**

Validate the first authenticated app experience.

**Preconditions**

- Tester is signed out.

**Steps**

1. Sign in with a valid account.
2. Land on `/app`.
3. Confirm the sidebar and user avatar area render.
4. Confirm the app does not show an onboarding flow unexpectedly.

**Expected**

- Sign-in succeeds without looping or blank states.
- The authenticated user reaches `/app`.
- Home renders either the prompt-first empty state or recent plans.

### UAT-03 - Create a chat from the home prompt

**Goal**

Validate that the home screen can hand off into Ask AI cleanly.

**Preconditions**

- Tester is signed in.

**Steps**

1. On `/app`, type a prompt into `What do you need to get done?`
2. Submit the prompt.
3. Wait for navigation into Ask AI.

**Expected**

- A new Ask session opens.
- The prompt is carried into the chat automatically.
- The chat starts without requiring the user to retype the request.

### UAT-04 - Create and save a plan manually

**Goal**

Validate the core planning workflow and persistence.

**Preconditions**

- Tester is signed in.

**Steps**

1. Use `New Plan` from the sidebar.
2. Enter a plan title, description, and definition of done.
3. Add at least 3 steps with due dates and duration estimates.
4. Wait briefly for autosave.
5. Refresh the page.
6. Reopen the same plan from recent plans or `/app/plans`.

**Expected**

- The plan saves without duplicate entries.
- The refreshed plan shows the same title, details, steps, dates, and durations.
- The plan appears in recent plans and in `/app/plans`.

### UAT-05 - Generate or rewrite a plan through Ask AI

**Goal**

Validate AI-assisted planning through the implemented Ask AI path.

**Preconditions**

- Tester is signed in.
- Use Ask AI, not the standalone `AI Planner` button in the plan editor.

**Steps**

1. Open `/app/ask`.
2. Ask for a structured plan using one of the sample prompts.
3. If the assistant creates a plan, open the generated plan.
4. Ask for a refinement such as `Make it smaller` or `I only have 45 minutes`.
5. Reopen the plan after the rewrite.

**Expected**

- The assistant can create a plan with actionable steps.
- The saved plan can be opened in the editor.
- Rewrites update the saved plan rather than creating confusing duplicates.
- The resulting plan remains editable by the user.

### UAT-06 - Review plans list, filters, and deletion

**Goal**

Validate plan browsing and cleanup behavior.

**Preconditions**

- Tester has multiple plans, including at least one completed plan if possible.

**Steps**

1. Open `/app/plans`.
2. Review `All Plans`.
3. Switch across `Overdue`, `Due Today`, `On Track`, and `Completed`.
4. Delete one non-critical plan.
5. Refresh the page.

**Expected**

- Each filter shows the right plans or a clear empty state.
- Deleting a plan asks for confirmation.
- The deleted plan is removed from the plans list and recent plans after refresh.

### UAT-07 - Start a sprint from the Focus Hub

**Goal**

Validate setup from plan to sprint.

**Preconditions**

- Tester has at least one plan with incomplete steps.

**Steps**

1. Open `/app/focus`.
2. Confirm the plan appears in `Today's Focus Queue`.
3. Click `Sprint`.
4. Select a subset of steps.
5. Choose a duration preset.
6. Start the sprint.

**Expected**

- The sprint setup modal shows available steps and duration choices.
- Estimated effort updates as selections change.
- Starting the sprint opens `/app/focus/session/<id>`.

### UAT-08 - Run a sprint: timer, step progress, pause/resume

**Goal**

Validate the active focus session experience.

**Preconditions**

- Tester has started a sprint from UAT-07.

**Steps**

1. Confirm the countdown starts.
2. Mark one step complete.
3. Confirm `Now working on` advances to the next unfinished step.
4. Pause the sprint.
5. Wait at least 10 seconds.
6. Resume the sprint.

**Expected**

- The timer counts down while active.
- Completed steps show completed styling.
- The current-step callout advances correctly.
- While paused, elapsed time does not continue moving.
- Resume continues from the paused time instead of jumping.

### UAT-09 - End a sprint as normal, early, and overtime

**Goal**

Validate all supported sprint completion paths.

**Preconditions**

- Tester can run multiple short test sprints.

**Steps**

1. Complete one sprint with all selected steps done, then end it.
2. Start another sprint and end it before all steps are done.
3. Start a third sprint, let the timer run past zero, then end it.

**Expected**

- Completed-all-steps flow ends cleanly.
- Early-end flow still saves progress and returns to the hub.
- Overtime mode becomes visually distinct after time reaches zero.
- The end confirmation flow does not lose step state.

### UAT-10 - Verify post-sprint persistence

**Goal**

Validate that sprint outcomes update the rest of the product.

**Preconditions**

- At least one sprint has just been ended.

**Steps**

1. Return to `/app/focus`.
2. Review `Recent Sprints`.
3. Review `Effort Today`.
4. Reopen the related plan in the editor.

**Expected**

- The newest sprint appears in `Recent Sprints`.
- `Effort Today` includes the finished sprint time.
- Completed steps no longer appear as pending next actions.
- Reopened plans reflect completed step state and updated remaining work.

### UAT-11 - Ask AI chat lifecycle

**Goal**

Validate that chats behave like durable workspaces.

**Preconditions**

- Tester is signed in.

**Steps**

1. Create a new Ask chat.
2. Send at least one message.
3. Rename the chat from the page menu.
4. Leave the page and reopen the chat from recent chats.
5. Delete the chat.

**Expected**

- The chat can be created without a separate setup step.
- Rename persists when reopening the chat.
- Reopened chats retain prior conversation history.
- Delete removes the chat from recent chats.

### UAT-12 - Billing visibility for free and paid users

**Goal**

Validate that users can understand their current billing state.

**Preconditions**

- One free account and one paid account are available, or a single account can
  be upgraded during UAT.

**Steps**

1. Open the user menu.
2. Open `Billing`.
3. For a free user, note the current plan label.
4. For a paid user, note the current plan label and expiry date.
5. Use `Refresh billing`.

**Expected**

- The billing dialog loads the current plan state.
- Free users see a free plan state.
- Paid users see the paid tier and active-until date.
- Refresh does not break the dialog and returns current data.

### UAT-13 - Successful checkout and return sync

**Goal**

Validate that a completed payment grants access once and shows the right result.

**Preconditions**

- payOS test setup is available.
- Use the user menu -> `Upgrade Plan`.

**Steps**

1. Open `Upgrade Plan`.
2. Choose `Plus` or `Pro`.
3. Complete payment in payOS.
4. Allow return to `/app/billing/return`.
5. Reopen the user menu and billing dialog.
6. Reload the return page once more.

**Expected**

- Checkout opens successfully.
- The return page shows `Payment confirmed` once payment is verified.
- The app reflects the upgraded plan and expiry.
- Revisiting the return URL does not extend access repeatedly.

### UAT-14 - Cancelled checkout does not grant access

**Goal**

Validate the cancellation path.

**Preconditions**

- payOS test setup is available.

**Steps**

1. Start an upgrade checkout.
2. Cancel payment from payOS.
3. Allow return to `/app/billing/cancel`.
4. Reopen billing state.

**Expected**

- The cancel page shows `Payment cancelled`.
- The user does not receive paid access from a cancelled order.
- Current plan remains unchanged.

### UAT-15 - Connect the Chrome extension

**Goal**

Validate that a signed-in user can link the browser extension.

**Preconditions**

- LockIn extension is installed in Chrome.
- Tester is signed in on the web app.

**Steps**

1. Start the extension connection flow from the extension side.
2. Allow the web app to open `/app/connect-extension?...`.
3. Wait for the connection result.

**Expected**

- The connection page shows a success state for a working extension.
- The extension becomes associated with the signed-in account.
- A missing or non-responsive extension shows a clear failure state instead of a blank screen.

### UAT-16 - Extension behavior during an active sprint

**Goal**

Validate the user-visible value of the extension during focus work.

**Preconditions**

- Extension is connected.
- A sprint is active.
- At least one blocked site is configured.

**Steps**

1. Open another browser tab while the sprint is running.
2. Observe the HUD.
3. Pause the sprint in the web app.
4. Resume the sprint.
5. Visit a blocked site.
6. End the sprint and check the extension again.

**Expected**

- The HUD shows the active sprint and current task information.
- Pause and resume are reflected in the extension state.
- Blocked sites are interrupted according to current settings.
- After sprint end, the extension no longer behaves like an active sprint is still running.

### UAT-17 - Extension token self-service

**Goal**

Validate the manual token management page for advanced users.

**Preconditions**

- Tester is signed in.

**Steps**

1. Open `/app/settings/extension`.
2. Create a named token.
3. Copy the token value.
4. Confirm the token appears in the existing token list.
5. Revoke the token.

**Expected**

- A new token can be created successfully.
- The newly created token value is shown once.
- The token list updates after creation and revoke.
- Revoked tokens disappear from the list.

### UAT-18 - Sign out and session protection

**Goal**

Validate that session end is clean and protected routes remain protected.

**Preconditions**

- Tester is signed in.

**Steps**

1. Use the user menu to sign out.
2. Attempt to revisit `/app`, `/app/plans`, `/app/focus`, and `/app/ask`.

**Expected**

- Sign-out completes successfully.
- Protected app routes redirect back to sign-in when the session is gone.

## Suggested Execution Order

Run UAT in this order to reduce setup churn:

1. UAT-01 to UAT-05
2. UAT-06 to UAT-10
3. UAT-11
4. UAT-12 to UAT-14
5. UAT-15 to UAT-17
6. UAT-18

## Pass/Fail Template

Use the following lightweight format while executing:

| ID | Tester | Date | Result | Notes |
|---|---|---|---|---|
| UAT-01 | Antigravity | 2026-06-08 | Untested | P1 Scenario |
| UAT-02 | Antigravity | 2026-06-08 | Needs rerun | Pre-fix failure: protected app routes were reachable when signed out. Recheck `proxy.ts` plus server-side route guards. |
| UAT-03 | Antigravity | 2026-06-08 | Untested | P1 Scenario |
| UAT-04 | Antigravity | 2026-06-08 | Needs rerun | Pre-fix failure: duplicate plan rows. Recheck one canonical `Plan` row per manual save. |
| UAT-05 | Antigravity | 2026-06-08 | Needs rerun | Pre-fix failure: duplicate plan rows. Recheck Ask AI create/rewrite updates one canonical `Plan`. |
| UAT-06 | Antigravity | 2026-06-08 | Untested | P1 Scenario |
| UAT-07 | Antigravity | 2026-06-08 | Needs rerun | Sprint setup previously worked, but queue showed duplicate plans from pre-fix data. |
| UAT-08 | Antigravity | 2026-06-08 | Pass | Timer countdown, pause, resume work cleanly. |
| UAT-09 | Antigravity | 2026-06-08 | Pass | Session completion types and times spent persist correctly. |
| UAT-10 | Antigravity | 2026-06-08 | Needs rerun | Pre-fix duplicate rows split visible progress. Recheck completed steps update the same canonical plan used by Focus. |
| UAT-11 | Antigravity | 2026-06-08 | Untested | P1 Scenario |
| UAT-12 | Antigravity | 2026-06-08 | Untested | P1 Scenario |
| UAT-13 | Antigravity | 2026-06-08 | Pass | Checkout completion verified, no repeat expiry extensions. |
| UAT-14 | Antigravity | 2026-06-08 | Pass | Cancellation correctly leaves plan tier unchanged. |
| UAT-15 | Antigravity | 2026-06-08 | Untested | P1 Scenario |
| UAT-16 | Antigravity | 2026-06-08 | Untested | P1 Scenario |
| UAT-17 | Antigravity | 2026-06-08 | Untested | P2 Scenario |
| UAT-18 | Antigravity | 2026-06-08 | Untested | P1 Scenario |
