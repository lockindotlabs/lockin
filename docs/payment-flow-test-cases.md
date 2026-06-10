# PayOS Payment Flow Test Cases

## Preconditions

- Run the web app at `http://localhost:3000`.
- Sign in as a test Clerk user.
- Ensure these server env vars exist in `apps/web/.env.local`:
  - `PAYOS_CLIENT_ID`
  - `PAYOS_API_KEY`
  - `PAYOS_CHECKSUM_KEY`
  - `PUBLIC_WEB_URL`
- In payOS merchant settings, set webhook URL to:
  - `${PUBLIC_WEB_URL}/api/billing/payos-webhook`
- Confirm the test tier amount in `apps/web/lib/billing/catalog.ts`.
  - Current local Plus value may be `2,000 VND` for testing.

## TC-01: Checkout Link Creation

**Goal:** A user can start checkout from the upgrade dialog.

1. Open `http://localhost:3000/app`.
2. Open the Upgrade dialog from the sidebar.
3. Click `Upgrade` on the Plus tier.

**Expected UI**

- Button changes to `Opening checkout...`.
- Browser redirects to a payOS hosted checkout URL.

**Expected DB**

- A new `PaymentOrder` row exists.
- `status = PENDING`.
- `tier = PLUS`.
- `checkoutUrl` is not null.
- `paymentLinkId` is not null.
- `rawResponse` is not null.
- `rawWebhook`, `paidAt`, `cancelledAt`, and `failedAt` are null.

## TC-02: Successful Payment Return Sync

**Goal:** The app grants entitlement after payOS marks the order paid, even if webhook is delayed or missing.

1. Complete payment on the payOS page.
2. Let payOS redirect back to `/app/billing/return?orderCode=...`.

**Expected UI**

- Return page shows `Payment confirmed`.
- Current plan is `PLUS`.
- Expiration date is visible.

**Expected DB**

- Matching `PaymentOrder.status = PAID`.
- `paidAt` is not null.
- `rawResponse` is updated with the latest payOS payment-link payload.
- `rawWebhook` remains null unless the real webhook was delivered.
- `User.planTier = PLUS`.
- `User.planExpiresAt` is about 30 days after the sync time.

## TC-03: Cancelled Payment Return Sync

**Goal:** Cancelled checkout updates the order but does not grant entitlement.

1. Start Plus checkout.
2. Cancel payment from the payOS page.
3. Let payOS redirect back to `/app/billing/cancel?orderCode=...`.

**Expected UI**

- Cancel page shows `Payment cancelled`.
- Current plan remains unchanged.

**Expected DB**

- Matching `PaymentOrder.status = CANCELLED`.
- `cancelledAt` is not null.
- `paidAt` is null.
- `User.planTier` and `User.planExpiresAt` are not upgraded by this order.

## TC-04: Billing Dialog Reflects Current Plan

**Goal:** Billing overview uses live billing state.

1. Open the user menu.
2. Open Billing.

**Expected UI**

- Current plan card shows the real plan: `Free plan`, `Plus plan`, or `Pro plan`.
- Paid users see `Active until ...`.
- Latest payment status appears when a latest order exists.
- `Refresh billing` reloads the billing state.
- Free users see `Upgrade to Plus`.
- Plus users see `Upgrade to Pro`.
- Pro users see `You are on the highest plan` and no upgrade CTA.

## TC-05: Repeated Return Page Visits Are Idempotent

**Goal:** Revisiting the return URL does not extend access repeatedly.

1. Complete a successful payment.
2. Record `User.planExpiresAt`.
3. Reload `/app/billing/return?orderCode=...` three times.

**Expected DB**

- `PaymentOrder.status` remains `PAID`.
- `paidAt` does not change.
- `User.planExpiresAt` does not move forward after the first paid sync.

## TC-06: Webhook Success Path

**Goal:** Real payOS webhook can update payment state independently of return sync.

1. Configure payOS webhook URL.
2. Start and complete payment.
3. Wait for webhook delivery.

**Expected DB**

- `PaymentOrder.status = PAID`.
- `paidAt` is not null.
- `rawWebhook` is not null.
- `User.planTier` is set to the paid tier.
- `User.planExpiresAt` is set once.

## TC-07: Webhook Invalid Signature

**Goal:** The webhook endpoint rejects unverified payloads.

1. Send a fake request to `POST /api/billing/payos-webhook`.

**Expected API**

- Response status is `400`.
- No `PaymentOrder` fields are changed.
- No user entitlement is granted.

## TC-08: Sync Security

**Goal:** A user cannot sync another user’s order.

1. Sign in as User A and create a payment order.
2. Sign in as User B.
3. Call `POST /api/billing/sync` with User A’s `orderCode`.

**Expected API**

- Response status is `404`.
- User B’s billing state is unchanged.
- User A’s order is not modified by User B.

## TC-09: Unauthenticated Billing API Access

**Goal:** Authenticated-only billing endpoints reject anonymous users.

1. Sign out.
2. Call:
  - `GET /api/billing/me`
  - `POST /api/billing/checkout`
  - `POST /api/billing/sync`

**Expected API**

- Each endpoint returns `401`.
- No payment orders are created or modified.

## TC-10: Expired Or Failed payOS Status

**Goal:** Terminal non-paid payOS statuses do not grant access.

1. Use an order that payOS reports as `EXPIRED` or `FAILED`.
2. Visit `/app/billing/return?orderCode=...` or call `POST /api/billing/sync`.

**Expected DB**

- `EXPIRED` maps to local `EXPIRED` and sets `failedAt`.
- `FAILED` maps to local `FAILED` and sets `failedAt`.
- `paidAt` remains null.
- User entitlement remains unchanged.

