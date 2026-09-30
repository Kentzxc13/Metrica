# Product: Metrica

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Edge Functions, Auth RLS).

## Users

- **Primary Persona:** Aris Vance (Venture Partner / Lead Investor) overseeing early-stage SaaS investments.
- **Secondary Users:** Portfolio Founders, Finance Directors, and Fund Analysts requiring accurate real-time telemetry instead of stale monthly spreadsheets.

## Product Purpose

Metrica (SaaSify Metrics Engine) transforms raw, asynchronous checkout and billing events (via webhooks) into accurate, real-time SaaS performance indicators (MRR, Churn, LTV, Active Customers, Cohorts, and Cap Table governance) with zero duplicate transactions and immutable auditability.

## Positioning

Unlike traditional static dashboards that rely on delayed monthly accounting syncs or spreadsheets, Metrica is an event-driven telemetry engine with built-in idempotency, out-of-order event handling, and an immutable financial event ledger.

## Operating Context

- Real-time event ingestion streaming from Stripe and billing webhooks.
- Investor partner meetings, board reviews, portfolio health checkups, and investment screening.
- Fast, high-density telemetry views optimized for sub-second analysis.

## Capabilities and Constraints

- **Event-Driven Billing Ingestion:** Real-time webhook processing with strict idempotency to prevent duplicate revenue calculation.
- **Immutable Financial Ledger:** Append-only event history preserving raw transaction state for auditable recalculation.
- **Out-of-Order Event Handling:** Timestamps are strictly respected so delayed/retried webhooks do not corrupt historical cohorts.
- **AI Investment Screening:** Startup evaluation with automated tiering (`Outperforming`, `Moderate`, `High Churn Alert`).
- **Cap Table & Governance:** Cap table ownership, round dilution, and board cadence tracking.
- **Multi-Tenant Workspaces & RBAC:** Strict tenant isolation with Owner, Editor, and Viewer roles.

## Brand Commitments

- **Name:** Metrica
- **Visual Identity:** Venture Precision (`DESIGN.md`), featuring a disciplined monochrome base, semantic emerald/rose accents, geometric Grotesk typography, and high-density JetBrains Mono tabular numbers.
- **Tone:** Rigorous, institutional, transparent, authoritative, and engineering-grade.

## Evidence on Hand

- Spec documents: `GROUP 6 —Metrica.md`, `Metrica_User_Stories_AC_TestCases.md`.
- Live running implementation at `http://localhost:3000`.
- Design system tokens in `DESIGN.md`.

## Product Principles

1. **Truth at the Event Layer:** Metrics are never arbitrarily edited; they derive mathematically from the immutable event ledger.
2. **Deterministic Precision:** Idempotency and out-of-order handling ensure financial calculations remain flawless across retries and network jitter.
3. **Institutional Density:** Optimize screen real estate for quick scanning of key telemetry without visual fluff or AI slop.
4. **Transparent Data Health:** Always expose whether data is live, delayed, or estimated.

## Accessibility & Inclusion

- Adhere to WCAG AA contrast standards across all numeric indicators, charts, and table rows.
- Support full keyboard navigation (`⌘K` command palette) and screen reader accessibility for tabular financial datasets.
