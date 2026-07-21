# Template Marketplace Follow-ups

## Author review notifications

Status: deferred.

The current app does not have a persisted in-app notification service or email
delivery service to reuse for template approval/rejection events. The existing
notification popover is local UI state for product updates, not user-targeted
notifications.

Before opening the marketplace to external authors, add one review notification
path and call it after `approveTemplate` / `rejectTemplate` succeeds:

- In-app notification: requires a persisted notification model keyed by
  `userId`, plus read/dismiss API and UI.
- Email: requires a mail provider integration and delivery/error policy.

Do not add an ad-hoc notification table inside the review store without deciding
which product channel owns notifications.

## Installed template snapshots

Status: no schema change needed now.

`Plan.templateId` points to the live `WorkflowTemplate`, but the installed plan's
actual executable content is copied into `PlanStep` when the AI calls
`createPlan` and the app persists the plan. Editing a template later should not
rewrite old plan steps.

Revisit only if a future plan view or regeneration flow starts reading live
`WorkflowTemplate.steps` from `Plan.templateId` to render or mutate existing
plans.

## Template ratings and reviews

Status: not implemented in this phase.

Ratings/reviews need a separate product design pass and new schema for review
records, uniqueness per user/template, moderation, and aggregate counters.
