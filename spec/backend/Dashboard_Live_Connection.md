# Dashboard_Live_Connection

Giya sa pag-konektar sa Supabase backend ngadto sa Dashboard Overview (`src/app/page.tsx`).

---

### 1. ENVIRONMENT & CLIENT SETUP
* **File:** `.env.local`
  * `NEXT_PUBLIC_SUPABASE_URL=https://vczhwdtjkoscfrcbyfqc.supabase.co`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`
* **File:** `src/lib/supabase.ts`
  * Inisiyalisar ang Supabase client gamit ang `createClient()`.

---

### 2. DATABASE SEED DATA (INITIAL UNOD)
* **Table `companies`:**
  * I-insert ang 4 ka benchmark companies (CloudNest, PayLoop, NimbusPay, QuickBill).
* **Table `metric_rollups`:**
  * I-insert ang daily/monthly records para sa MRR, Orders, Customers, ug Churn.
* **Table `payments`:**
  * I-insert ang initial events (`#evt_9410`, `#evt_9411`, etc.).

---

### 3. LIVE DATA QUERIES SA DASHBOARD
* **Query 1 (Company Switcher):**
  * `SELECT id, name, initial, type, ai_tier, high_churn_warning FROM companies;`
* **Query 2 (4 KPI Cards & Charts):**
  * `SELECT * FROM metric_rollups WHERE company_id = :selected_id ORDER BY metric_date DESC;`
  * Mokuha sa: `revenue`, `payment_count`, `customer_count`, `churn_count`, `status`.
* **Query 3 (Recent Events Table):**
  * `SELECT payment_id, customer, product, amount, status, payment_timestamp FROM payments WHERE company_id = :selected_id ORDER BY payment_timestamp DESC LIMIT 5;`

---

### 4. LIVE INGESTION EVENT INSERT
* **Modal Submit ("Record Ingestion Event"):**
  * `INSERT INTO payments (company_id, payment_id, customer, product, amount, status, payment_timestamp) VALUES (...)`
  * **Auto-Rollup:** I-update ang `metric_rollups.revenue` ug `payment_count` para sa adlaw.

---

### 5. REALTIME SYNC (TC-01 & TC-02)
* Gamiton ang **Supabase Realtime**:
  ```ts
  supabase
    .channel('realtime_payments')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'payments' }, (payload) => {
      // Auto-update recent events table ug graphs nga walay refresh!
    })
    .subscribe();
  ```

---

### 6. RECONCILIATION BADGE (TC-03 / BUG-001)
* Kung ang `payment_timestamp` mas karaan kaysa karon:
  * Dashboard badge = **"Delayed"** o **"Estimated"**.
* Pagkahuman sa rollup update:
  * Badge = **"Live"**.
