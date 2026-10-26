# Real-Time Stripe Sandbox Webhook Integration & Event Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time Stripe sandbox webhook ingestion (`/api/webhooks/stripe`), dynamic multi-tenant company resolution, real-time ledger synchronization via Supabase, and a detachable sandbox testing simulator.

**Architecture:** A dedicated Next.js Route Handler ingests Stripe webhook events, passes them through a signature & security guard (permissive in sandbox, strict in prod), resolves the dynamic company via URL param or metadata, normalizes the event into Metrica's existing `payments` table schema, and inserts the record. The existing Supabase Realtime channel in the Event Ledger page automatically captures the update and refreshes the view. A detachable `StripeSimulatorModal` allows easy testing directly in the UI.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase JS Client, Node.js `crypto`, React 19.

**Spec:** [docs/superpowers/specs/2026-10-02-stripe-webhooks-ledger-design.md](file:///c:/Users/matub/OneDrive/Documents/Metrica/docs/superpowers/specs/2026-10-02-stripe-webhooks-ledger-design.md)

## Global Constraints
- Target endpoint: `/api/webhooks/stripe` (POST).
- Existing `payments` database table schema must be preserved with zero breaking changes or required schema migrations.
- Dynamic company resolution must support query params (`?company_id=...`), Stripe metadata (`event.data.object.metadata.company_id`), and fallback to active sandbox company.
- Configurable strict mode: bypass or warning if `WEBHOOK_STRICT_MODE=false`, strict HMAC signature verification when `WEBHOOK_STRICT_MODE=true`.
- Detachable simulator must be an isolated UI module that can be removed cleanly without leaving dangling imports.

## Review Focus
1. Handling unhandled Stripe event types (must return `200 OK` with `{ received: true, ignored: true }` so Stripe stops retrying).
2. Malformed or negative amounts in Stripe cents (e.g. converting `4900` cents to `$49.00`).
3. Unknown or non-UUID company identifiers safely resolved using `companies` table name matching.
4. Duplicate events handled gracefully via idempotency check without throwing a 500 error.
5. Missing `stripe-signature` header in permissive mode must log a warning instead of failing.

---

### Task 1: Webhook Helper & Event Normalizer

**Files:**
- Create: `src/lib/stripe-webhook-helpers.ts`

**Interfaces:**
- Produces:
  - `parseStripeEvent(body: string, signature: string | null, secret?: string, isStrict?: boolean): { event: any; verified: boolean; error?: string }`
  - `normalizeStripeToPayment(event: any, fallbackCompanyId?: string): NormalizedStripePayment | null`
  - `resolveCompanyFromStripe(event: any, queryCompanyId: string | null, companies: Array<{ id: string; name: string }>): string`

- [ ] **Step 1: Create `src/lib/stripe-webhook-helpers.ts`**
Implement payload parsing, signature verification using standard Node.js crypto HMAC-SHA256 (matching Stripe's `t=timestamp,v1=signature` format without requiring heavy external SDK), cents-to-dollars conversion, and company resolution.

- [ ] **Step 2: Verify helper logic via a quick node runner or unit check**
Ensure that `payment_intent.succeeded`, `invoice.payment_failed`, and `charge.refunded` map correctly to `PROCESSED`, `FAILED`, and `REFUNDED` statuses.

- [ ] **Step 3: Commit**
```bash
git add src/lib/stripe-webhook-helpers.ts
git commit -m "feat(webhooks): add stripe webhook parsing and normalization helpers"
```

---

### Task 2: Stripe Ingestion Route Handler

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

**Interfaces:**
- Consumes: `parseStripeEvent`, `normalizeStripeToPayment`, `resolveCompanyFromStripe` from `src/lib/stripe-webhook-helpers.ts`
- Produces: HTTP POST handler at `/api/webhooks/stripe` returning `{ success: boolean, payment_id?: string, status?: string }`

- [ ] **Step 1: Implement `src/app/api/webhooks/stripe/route.ts`**
  - Read `request.text()` for raw body.
  - Read headers (`stripe-signature`).
  - Read URL query (`company_id`).
  - Verify signature according to `process.env.WEBHOOK_STRICT_MODE`.
  - Fetch companies from Supabase to resolve company UUID.
  - Normalize event and compute `verification_hash`.
  - Check idempotency against existing `payments` table.
  - Insert or update record in Supabase `payments`.
  - Return `200 OK` for processed and ignored events.

- [ ] **Step 2: Test Route with simulated POST request**
Send a test POST request using curl or Node fetch to verify that the route returns 200 OK and successfully records a transaction.

- [ ] **Step 3: Commit**
```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat(webhooks): implement /api/webhooks/stripe endpoint with dynamic company resolution"
```

---

### Task 3: Detachable Sandbox Simulator Modal & Trigger

**Files:**
- Create: `src/components/dev/StripeSimulatorModal.tsx`
- Modify: `src/app/(dashboard)/ledger/page.tsx`

**Interfaces:**
- Consumes: `/api/webhooks/stripe`
- Produces: `<StripeSimulatorModal isOpen={isOpen} onClose={...} />` component with quick triggers for:
  - Success Subscription ($149/mo)
  - Failed Billing Attempt ($79/mo)
  - Refund / Churn ($299)

- [ ] **Step 1: Create `src/components/dev/StripeSimulatorModal.tsx`**
Build a sleek dark-mode modal matching Metrica's design system with dropdowns for Company, Event Type, Customer Name, and Amount, plus a "Fire Sandbox Webhook" button that POSTs to `/api/webhooks/stripe`.

- [ ] **Step 2: Mount Simulator in `src/app/(dashboard)/ledger/page.tsx`**
Add a clean "Sandbox Simulator" button in the Ledger header actions area that opens the modal.

- [ ] **Step 3: Verify Real-Time Sync in UI**
Trigger a webhook event from the modal, confirm it inserts to `payments`, and observe the Event Ledger update instantaneously via Supabase Realtime without refreshing.

- [ ] **Step 4: Commit**
```bash
git add src/components/dev/StripeSimulatorModal.tsx src/app/(dashboard)/ledger/page.tsx
git commit -m "feat(ledger): add detachable stripe sandbox simulator and realtime synchronization"
```
