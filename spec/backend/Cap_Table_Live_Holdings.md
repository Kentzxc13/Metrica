# Cap_Table_Live_Holdings

Giya sa pag-konektar sa `public.cap_table_holdings` table ngadto sa Cap Table & Ownership page (`src/app/captable/page.tsx`).

---

### 1. TARGET PAGE & TABLE
* **Page:** `src/app/captable/page.tsx`
* **Table:** `public.cap_table_holdings`
* **Joined Table:** `public.companies` (para sa company name, ticker, ug initial)

---

### 2. TABLE COLUMNS SA SUPABASE
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key |
| `company_id` | `uuid` | Foreign Key ➔ `companies.id` |
| `stage` | `text` | 'Seed' \| 'Series A' |
| `share_class` | `text` | e.g. 'Series A Preferred', 'Seed Preferred' |
| `capital_invested`| `numeric(14,2)`| Pila ang gipundar ni Aris Vance (e.g. 1800000.00) |
| `equity_percent` | `numeric(5,2)` | % Ownership (e.g. 15.20) |
| `post_money_val` | `numeric(14,2)`| Post-money valuation (e.g. 11840000.00) |
| `current_fair_value`| `numeric(14,2)`| Bili karon sa shares (e.g. 4950000.00) |
| `moic` | `numeric(6,2)` | Return multiple (e.g. 2.75) |
| `irr` | `numeric(5,2)` | Internal Rate of Return % (e.g. 48.2) |
| `board_role` | `text` | 'Board Director' \| 'Board Observer' |
| `pro_rata_rights` | `boolean` | Katungod sa follow-on funding rounds |
| `equity_breakdown`| `jsonb` | Founders %, ESOP Pool %, Other Investors % |

---

### 3. CORE HOLDINGS MATRIX QUERY
Mokuha sa tanang equity holdings kauban ang company information:

```sql
SELECT 
  h.id,
  h.stage,
  h.share_class,
  h.capital_invested,
  h.equity_percent,
  h.post_money_valuation,
  h.current_fair_value,
  (h.current_fair_value - h.capital_invested) AS unrealized_gain,
  h.moic,
  h.irr,
  h.board_role,
  h.pro_rata_rights,
  h.equity_breakdown,
  c.id AS company_id,
  c.name AS company_name,
  c.initial AS initials,
  c.type AS sector
FROM public.cap_table_holdings h
JOIN public.companies c ON h.company_id = c.id
ORDER BY h.current_fair_value DESC;
```

---

### 4. TOP 4 FUND PERFORMANCE CARDS
1. **Total Invested:**
   * `SUM(capital_invested)` (e.g. `$6.50M Deployed`)
2. **Portfolio Net Value:**
   * `SUM(current_fair_value)` (e.g. `$15.24M`)
3. **Net Portfolio MOIC:**
   * `SUM(current_fair_value) / SUM(capital_invested)` (e.g. `2.34x`)
4. **Blended Gross IRR:**
   * `AVG(irr)` (e.g. `42.8%`)

---

### 5. STAGE FILTER TABS
* Gisuportahan ang filtering sa matrix:
  * `All` ➔ Tanan holdings.
  * `Series A` ➔ `WHERE h.stage = 'Series A'`
  * `Seed` ➔ `WHERE h.stage = 'Seed'`

---

### 6. MODAL DEEP DIVE (`CapTableInspectorModal.tsx`)
* Pag-click sa row, ablihan ang inspector modal.
* Mobasa sa:
  * `shares_owned`
  * `price_per_share`
  * `liquidation_pref`
  * `anti_dilution`
  * `equity_breakdown` (Pie chart data: Founders, ESOP, Investors).
