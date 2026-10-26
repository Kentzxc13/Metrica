# Event_Ledger_Live_Stream

Giya sa pag-konektar sa Supabase `payments` table ngadto sa Event Ledger (`src/app/ledger/page.tsx`).

---

### 1. TARGET PAGE & TABLES
* **Page:** `src/app/ledger/page.tsx` (ug alias: `/transactions`)
* **Source Table:** `public.payments`
* **Joined Table:** `public.companies` (para sa company name ug initial)

---

### 2. CORE AUDIT STREAM QUERY
Mokuha sa tanang historical events gikan sa kinabag-ohan paingon sa kinaunhan:

```sql
SELECT 
  p.id,
  p.payment_id AS code,
  p.payment_timestamp,
  p.customer,
  p.product,
  p.amount,
  p.currency,
  p.status,
  p.raw_payload,
  c.name AS company,
  c.initial AS company_initial
FROM public.payments p
LEFT JOIN public.companies c ON p.company_id = c.id
ORDER BY p.payment_timestamp DESC;
```

---

### 3. TOP 4 TELEMETRY KPI AGGREGATIONS
1. **Total Events Processed:**
   * `COUNT(*)` gikan sa `payments`
2. **Net Inflow MRR:**
   * `SUM(amount)` diin ang `status = 'Success'` o `'Delivered 200 OK'`
3. **Delivered Events:**
   * `COUNT(*) WHERE status = 'Delivered 200 OK' OR status = 'Success'`
4. **Flagged / Dunning Events:**
   * `COUNT(*) WHERE status LIKE '%Failed%' OR status LIKE '%Retry%'`

---

### 4. AUDIT PAYLOAD MODAL INSPECTION
* Inig click sa bisan unsang row sa Event Ledger, ablihan ang `AuditEventModal.tsx`.
* Ang modal magbasa diretso sa **`raw_payload` (JSONB)** column:
  * `invoiceId`
  * `customerIp`
  * `geo`
  * `cardBrand` & `cardLast4`
  * `failureReason`
  * `signature` (HMAC SHA-256 Webhook signature)

---

### 5. REALTIME LIVE STREAM (SUPABASE REALTIME)
* Mo-listen sa mga bag-ong webhook nga moabot gikan sa Composio / Stripe:
```ts
supabase
  .channel('realtime_event_ledger')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'payments' 
  }, (payload) => {
    // I-prepend ang bag-ong event sa audit stream table sa live time!
  })
  .subscribe();
```

---

### 6. CATEGORY FILTER SUPPORT
* Gisuportahan ang filtering sa ledger:
  * `All Events`
  * `New Subscription`
  * `Upgrade & Expansion`
  * `Failed Billing`
  * `Audit & Security`
* Derived gikan sa `raw_payload->>'category'` o `product`.
