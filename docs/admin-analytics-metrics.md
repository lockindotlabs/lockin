# Admin analytics metrics

This document defines the real admin analytics v1 metrics that are currently backed by relational data in the web app.

## Data sources

- `User`
  - signups
  - current effective billing tier
- `Plan`
  - plan creation and updates
  - AI-assisted plan counts from `source` / `aiMode`
- `PlanStep`
  - actionable plan detection
  - completed step counts from `status = DONE`
- `FocusSession`
  - session starts, completions, duration, return behavior
- `PaymentOrder`
  - successful payments
  - payment issues (`FAILED`, `CANCELLED`, `EXPIRED`)

## Overview page

- `Total Users`
  - `count(User)`
  - current all-time total
- `Active Users`
  - distinct users with at least one `Plan.updatedAt`, `FocusSession.startedAt`, or `PaymentOrder.createdAt` inside the selected range
- `Actionable Plans`
  - `count(Plan where deletedAt is null and steps.some())`
- `Sessions Completed`
  - `count(FocusSession where startedAt is in range and endedAt is not null)`
- `Session Completion Rate`
  - completed sessions / started sessions in range
- `Avg. Focus Duration`
  - average `FocusSession.duration` for sessions ended in range
  - note: `duration` is stored in seconds and converted to minutes in UI
- `Paid Users`
  - current users whose effective tier is `PLUS` or `PRO`
  - effective tier is derived from `planTier` and `planExpiresAt`
- `Successful Payments`
  - `count(PaymentOrder where status = PAID)`

### Core funnel

All funnel steps are derived from current relational state, not immutable event logs:

1. signed up: all users
2. created first plan: distinct users with at least one plan
3. added plan steps: distinct users with at least one `PlanStep`
4. created AI-assisted plan: distinct users with a plan where `source = AI` or `aiMode = ASSISTED`
5. started a focus session: distinct users with at least one `FocusSession`
6. completed a focus session: distinct users with at least one completed `FocusSession`
7. returned for another session: distinct users with more than one completed `FocusSession`

### Activity trends

- users: `User.createdAt`
- AI plans: `Plan.createdAt` where `source = AI` or `aiMode = ASSISTED`
- sessions: `FocusSession.startedAt`
- completed steps: `PlanStep.updatedAt` where `status = DONE`

## Usage page

The usage page currently uses a fixed `last 30 days` window.

- `Sessions Started`
  - `count(FocusSession.startedAt in range)`
- `Sessions Completed`
  - `count(FocusSession.startedAt in range and endedAt is not null)`
- `Completion Rate`
  - completed / started for the same range
- `Avg. Focus Duration`
  - average `FocusSession.duration` for sessions ended in range

### Recent activity

Recent activity is a merged feed of:

- newest `User.createdAt`
- newest `Plan.updatedAt`
- newest completed `FocusSession.endedAt`
- newest `PaymentOrder.updatedAt`

The `Plan` column in the table shows the user's current effective tier, not a historical tier snapshot at event time.

## Billing page

- `Free Users`
  - effective tier = `FREE`
- `Paid Users`
  - effective tier = `PLUS` or `PRO`
- `Paid Conversion`
  - paid users / total users
- `Successful Payments`
  - `count(PaymentOrder where status = PAID)`
- `Payment Issues`
  - `count(PaymentOrder where status in FAILED, CANCELLED, EXPIRED)`

### Plan distribution

The donut chart uses current effective tier percentages across `FREE`, `PLUS`, and `PRO`.

## Deferred metrics

These are intentionally not live in v1 because the repo does not yet persist them as reliable events:

- quota exceeded
- upgrade clicked
- AI request success / failure
- plan preview accepted / edited
- breakdown intensity analytics beyond raw stored plan defaults
