# Cache Implementation Plan — Metrica

Giya ug plano para sa pag-setup sa caching sa Metrica aron paspas ang dashboard, dili ma-stale ang kwarta (MRR/Churn), ug luwas ang sensitibong financial data.

---

### 1. DALI NGA PAGSABOT: NGANONG "HYBRID" CACHING?

* **Dili puro Client-side (`localStorage`):** Kuyaw ibilin ang Cap Table, listahan sa investors, ug financial ledger sa browser storage kay pwede ma-XSS o makawat. Ug basin makakita ang investor og karaan (stale) nga MRR.
* **Dili sab puro Server-side nga walay client memory:** Kung walay memory cache sa browser, kada pindot nimo og tab o company switcher, maghuwat na sab og 100-200ms network request ug mag-flicker ang loading skeleton.
* **Solusyon (Hybrid):**
  1. **Server-Side Cache:** Gitipigan ang bug-at nga kwentada (`metric_rollups`, 60-day revenue history) gamit ang Cache Tags.
  2. **Client-Side In-Memory Cache:** Gitipigan sa React State / Memory (dili sa permanenteng `localStorage`) para **0ms** ang pagbalhin-balhin og tabs nga walay loading delay.
  3. **Realtime WebSocket (Supabase):** Inig naay bag-ong bayad nga masulod, paminawon kini sa browser aron i-refresh dayon ang UI.

---

### 2. TUBAG SA IMONG MGA PANGUTANA

#### A. Naa ba'y conflict kung wala pa nabuhat ang Stripe / Xendit Webhooks?
> **WALA'Y CONFLICT, apan naay hapsay nga paagi sa pagbuhat:**
* Karon, ang Metrica aduna nay `POST /api/payments` nga pwede masudlan og bayad (pinaagi sa manual test o ingestion modal).
* Ang atong buhatong cache invalidation i-konektar lang una nato sa `POST /api/payments`.
* Kung buhaton na nimo ang Stripe o Xendit webhooks puhon, igo ra nimo ipasa ang webhook payload sa maong payment logic. Dili na kinahanglan usbon pag-usab ang caching system kay andam na daan ang invalidation tags!

#### B. Asa man ang unahon: WEBHOOK ba o WEBSOCKET?
> **UNAHON ANG WEBHOOK (o Ingestion Pipeline) KAYSAY WEBSOCKET!**
* **Ngano man?**
  1. **Cause & Effect (Sinugdanan sa Data):** Ang Webhook mao ang **sinugdanan sa data** (magdala sa kwarta gikan sa Stripe/Xendit pasulod sa Supabase). Ang WebSocket igo ra **magpahibalo** nga naay bag-ong data. Kung walay Webhook nga magpasulod og data, walay pulos ang paminawon sa WebSocket.
  2. **Naa na kay existing WebSocket listener:** Sa [DashboardContext.tsx](file:///c:/Users/MATUBANG_ELEC5/Documents/Metrica/src/context/DashboardContext.tsx#L328-L349), aduna na kay Supabase Realtime channel (`dashboard_context_realtime_payments`) nga nag-atang sa `payments` table. Ang kulang na lang mao ang automated nga tig-sulod gikan sa gawas—nga mao ang **Webhook**.
  3. **Mas sayon i-test:** Kung naa na ang Webhook, pwede nimo i-simulate gamit ang Stripe CLI o Postman. Masulod sa database -> mo-trigger ang WebSocket -> mo-update ang UI ug mo-clear ang cache!

---

### 3. THE ARCHITECTURE FLOW

```
[ Stripe / Xendit Webhook ]
           │
           ▼
[ POST /api/webhooks/payment ]  ──(1. Validate signature & idempotency)
           │
           ├──► [ Supabase DB: payments & metric_rollups ]
           │
           ├──► [ Invalidate Server Cache: revalidateTag(`company-${id}`) ]
           │
           ▼ (Supabase Postgres Changes)
[ Supabase Realtime WebSocket ]
           │
           ▼ (Push notification sa browser)
[ DashboardContext (Client Memory) ]  ──► (Bust local memory & refetch fresh data)
```

---

### 4. PHASE-BY-PHASE IMPLEMENTATION PLAN

#### **PHASE 1: Client-Side Cache Cleanup (Security & Freshness)**
* **Tumong:** Tangtangon ang sensitibong financial data sa `localStorage` aron dili prone sa security leak ug dili magpakita og karaan nga numero.
* **Mga Buhaton:**
  1. Sa [DashboardContext.tsx](file:///c:/Users/MATUBANG_ELEC5/Documents/Metrica/src/context/DashboardContext.tsx):
     - I-retain ang `SELECTED_COMPANY_KEY` sa `localStorage` (UI preference ra kini, dili delikado).
     - Tangtangon ang permanenteng pag-save sa `TRANSACTIONS_CACHE_KEY`, `CAPTABLE_CACHE_KEY`, ug `LEDGER_CACHE_KEY` sa `localStorage`.
     - Gamiton ang **React in-memory state** o **TanStack Query / SWR cache** nga mo-expire human sa pipila ka minuto (ephemeral).
  2. Kung magbalhin-balhin ang user og tabs (Dashboard -> Cap Table -> Ledger) sulod sa parehong session, **0ms** gihapon kini kay anaa pa sa memory sa browser.

#### **PHASE 2: Server-Side Tagged Caching (Performance sa Backend)**
* **Tumong:** Ang bug-at nga queries sa Supabase (sama sa 60 ka adlaw nga `metric_rollups`) dili balik-balikon pag-compute kada refresh.
* **Mga Buhaton:**
  1. Sa `src/app/api/dashboard/route.ts`:
     - Gamiton ang Next.js `unstable_cache` para sa rollup summary query:
       ```ts
       import { unstable_cache } from 'next/cache';

       const getCachedDashboardData = unstable_cache(
           async (companyId: string) => {
               // Kuhaon ang rollups gikan sa Supabase...
               return data;
           },
           ['dashboard-summary'],
           { tags: [`company-${companyId}`, 'dashboard-rollups'], revalidate: 3600 }
       );
       ```
  2. Sa `src/app/api/captable/route.ts`:
     - I-cache ang Cap table holdings gamit ang tag nga `captable-${companyId}`.

#### **PHASE 3: Webhook Pipeline (Stripe / Xendit Ingestion)**
* **Tumong:** Dawaton ang live billing events gikan sa Stripe ug Xendit, i-check ang idempotency aron walay doble nga kwenta, ug i-bust ang server cache.
* **Mga Buhaton:**
  1. Himoa ang route: `src/app/api/webhooks/stripe/route.ts` ug `src/app/api/webhooks/xendit/route.ts`.
  2. I-verify ang webhook signature gamit ang signing secret.
  3. I-check ang `evt_id` sa `payments` table (Idempotency check). Kung duplicated, i-reject (409).
  4. I-insert ang record sa `payments` ug i-recalculate ang `metric_rollups`.
  5. **I-trigger ang Server Cache Invalidation:**
     ```ts
     import { revalidateTag } from 'next/cache';
     
     // I-clear dayon ang cache sa maong kumpanya:
     revalidateTag(`company-${companyId}`);
     ```

#### **PHASE 4: Realtime WebSocket Auto-Sync**
* **Tumong:** Kung mahuman og dawat ang webhook ug ma-update ang database, awtomatikong mo-refresh ang screen sa investor nga walay manual page reload.
* **Mga Buhaton:**
  1. I-verify ang Supabase Realtime publication sa dashboard settings:
     - Siguroha nga naka-enable ang Realtime sa `payments` ug `metric_rollups` tables.
  2. Sa [DashboardContext.tsx](file:///c:/Users/MATUBANG_ELEC5/Documents/Metrica/src/context/DashboardContext.tsx):
     - Paminawon ang `postgres_changes` event.
     - Kung naay moabot nga signal, tawgon ang `loadDashboardData(selectedCompanyId, false)` aron mokuha sa bag-ong gi-kwenta nga data gikan sa server.

---

### 5. SUMMARY SA SCHEDULE UG SUNOD BUHATON

| Lakang | Buluhaton | Nganong Kini? |
| :--- | :--- | :--- |
| **Lakang 1 (Karon)** | Limpyohan ang Client Cache sa [DashboardContext.tsx](file:///c:/Users/MATUBANG_ELEC5/Documents/Metrica/src/context/DashboardContext.tsx) | Aron mawala ang stale/insecure data sa `localStorage`. |
| **Lakang 2** | I-setup ang Webhook Ingestion (`/api/webhooks/stripe`) | Aron naay tinuod nga agianan sa kwarta ug payment events. |
| **Lakang 3** | I-setup ang Server Cache Tags (`revalidateTag`) | Aron ma-clear ang cache inig sulod sa Webhook. |
| **Lakang 4** | I-testing ang WebSocket Realtime Sync | Aron makita ang instant UI update inig labay og test payment sa Webhook. |

---

### 6. CHECKLIST SA PAG-TEST

* [ ] Pindot sa company switcher: Paspas ba (0ms) ug walay blank screen?
* [ ] Pag-clear sa browser session: Luwas ba ang Cap Table ug walay unencrypted financial leak sa `localStorage`?
* [ ] Pagpadala og test webhook sa Stripe CLI:
  * [ ] Masulod ba ang event sa `payments` table?
  * [ ] Ma-recalculate ba ang `metric_rollups`?
  * [ ] Mo-refresh ba ang UI sa dashboard pinaagi sa WebSocket sulod sa 1 ka segundo?
