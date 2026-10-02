# Specification: Real-Time Stripe Sandbox Webhook Integration & Event Ledger

**Date:** 2026-10-02  
**Status:** Draft / Review  
**Project:** Metrica  
**Target:** Real-Time Stripe Sandbox Webhooks, Dynamic Multi-Tenant Company Resolution, Event Ledger Synchronization, and Detachable Sandbox Simulator.

---

## 1. Executive Summary

Metrica requires a real-time ingestion pipeline for Stripe webhooks (sandbox & production) so that incoming payment events (e.g. `payment_intent.succeeded`, `invoice.payment_failed`, `charge.refunded`) instantly reflect in the **Event Ledger** and **Company Financial Transactions** without manual page reloads.

Because Metrica operates as a multi-company/multi-tenant analytics platform, payments must dynamically map to the correct portfolio company. The architecture supports both a Master Sandbox setup (metadata-tagged) and dedicated tenant webhook URLs, with a flexible security switch (permissive in sandbox/dev, strict in production) and a detachable test simulator for rapid verification.

---

## 2. Requirements & Goals

### 2.1 Functional Requirements
1. **Stripe Webhook Ingestion Endpoint:**
   - Dedicated endpoint at `/api/webhooks/stripe` accepting POST requests from Stripe (CLI, sandbox, or production dashboard).
   - Handles key events:
     - `payment_intent.succeeded` / `charge.succeeded` $\rightarrow$ Status `PROCESSED` (Positive MRR, category: `New Subscription` or `Upgrade & Expansion`).
     - `invoice.payment_failed` / `payment_intent.payment_failed` $\rightarrow$ Status `FAILED` (Failed billing, status: `Failed 402`).
     - `charge.refunded` / `customer.subscription.deleted` $\rightarrow$ Status: `REFUNDED` (Negative MRR, category: `Churn & Cancellation`).
2. **Dynamic Multi-Tenant Company Resolution:**
   - Strategy 1: URL Query parameter `?company_id=<uuid_or_slug>` (e.g. `/api/webhooks/stripe?company_id=c-stripe`).
   - Strategy 2: Stripe event object metadata (`metadata.company_id` or `metadata.company`).
   - Strategy 3: Automatic fallback to matching demo/first company in database if neither is supplied in sandbox.
3. **Ledger & Persistence Normalization:**
   - Normalize Stripe event payloads into Metrica's existing database schema (`payments` table):
     - `payment_id`: Stripe ID (e.g., `pi_3MtwBwLkdIwHu7ix28a3tqPa` or `ch_...`).
     - `company_id`: Resolved target company UUID.
     - `amount`: Converted from Stripe cents (e.g., `5000` $\rightarrow$ `$50.00`).
     - `currency`: Normalized uppercase currency (e.g., `USD`).
     - `status`: `PROCESSED`, `FAILED`, `REFUNDED`, or `PENDING`.
     - `customer`: Customer email/name from Stripe payload.
     - `product`: Product name or description from line items/metadata.
     - `raw_payload`: Full Stripe webhook object for audit inspection in `AuditEventModal`.
4. **Real-Time UI Propagation:**
   - Inserting or updating the `payments` record automatically triggers Supabase Realtime changes (`postgres_changes` on `table: payments`), which [EventLedgerPage](file:///c:/Users/matub/OneDrive/Documents/Metrica/src/app/(dashboard)/ledger/page.tsx) is already wired to listen to.
   - The ledger table updates instantaneously with micro-animations.
5. **Detachable Sandbox Simulator UI:**
   - An isolated development modal component (`StripeSimulatorModal.tsx`) placed on the Ledger page.
   - Allows selecting a company, event type, customer name, and amount to fire a simulated Stripe webhook directly to the endpoint.
   - Can be removed with zero friction or broken dependencies when sandbox validation is complete.

---

## 3. Architecture & Security

### 3.1 Security & Signature Verification
- Stripe sends a `stripe-signature` header containing a timestamp and HMAC-SHA256 signature.
- **Configurable Security Flag:**
  - `WEBHOOK_STRICT_MODE=false` (Default for Sandbox / Dev):
    - If `STRIPE_WEBHOOK_SECRET` and `stripe-signature` are present, verify using Stripe SDK.
    - If missing or triggered via local testing/simulator, bypass signature check and log a diagnostic warning.
  - `WEBHOOK_STRICT_MODE=true` (Production):
    - Strictly enforce signature matching using `stripe.webhooks.constructEvent(body, signature, secret)`.
    - Returns `400 Bad Request` if invalid.

### 3.2 Idempotency & Deduplication
- Stripe webhooks may be delivered multiple times.
- Deduplication is guaranteed using the `payment_id` / `code` uniqueness constraint in Supabase and the existing `verification_hash` sha256 mechanism.
- If a duplicate event arrives:
  - If status changed (e.g. `PENDING` $\rightarrow$ `PROCESSED` or `PROCESSED` $\rightarrow$ `REFUNDED`), the record is updated.
  - If identical, returns `200 OK` without creating duplicate rows.

---

## 4. File Changes & New Additions

1. **`src/app/api/webhooks/stripe/route.ts`** (NEW):
   - Stripe webhook handler.
   - Parses raw request body as text (required for signature verification).
   - Resolves dynamic company.
   - Inserts/updates `payments` row in Supabase.
   - Returns standard JSON response with 200 OK.

2. **`src/lib/stripe-webhook-helpers.ts`** (NEW):
   - Helper utilities: event extraction, cents-to-dollars converter, status mapper, metadata extractor, and signature verifier.

3. **`src/components/dev/StripeSimulatorModal.tsx`** (NEW, DETACHABLE):
   - Clean, dark-mode matching floating action button & modal in Event Ledger.
   - Pre-filled with common testing presets (e.g., "$250 Pro Plan - Success", "Failed Card Charge - $99", "Customer Refund - $120").
   - Dispatches simulated payloads to `/api/webhooks/stripe`.

4. **`src/app/(dashboard)/ledger/page.tsx`** (UPDATE):
   - Add the detachable `StripeSimulatorModal` trigger in dev/sandbox mode.

---

## 5. Verification Plan

1. **Simulator UI Test:**
   - Open `/ledger`.
   - Trigger a simulated `$49.00` payment for a selected company.
   - Verify the row immediately appears in the Event Ledger table via Supabase Realtime without refreshing the page.
   - Click the event to verify the modal displays correct audit details and payload.
2. **Raw Webhook (curl / Postman) Test:**
   - POST a realistic Stripe JSON event to `http://localhost:3000/api/webhooks/stripe?company_id=<id>`.
   - Check status 200 OK response and database insert.
3. **Strict Mode Toggle Test:**
   - Verify that with strict mode disabled, requests without secrets succeed in dev.
   - Verify that with strict mode enabled, unsigned requests are rejected with 400.
