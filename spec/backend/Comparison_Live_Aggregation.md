# Comparison_Live_Aggregation

Giya sa pag-konektar sa backend queries ug data aggregation para sa Company Comparison (`src/app/comparison/page.tsx`).

---

### 1. TARGET PAGE & TABLES
* **Page:** `src/app/comparison/page.tsx`
* **Tables:** `public.companies` UG `public.metric_rollups`

---

### 2. CORE BACKEND QUERIES

#### A. Benchmark Matrix Query (All Portfolio Companies)
* Mokuha sa tanang companies kauban ilang pinaka-latest nga rollup metrics:
```sql
SELECT 
  c.id,
  c.name,
  c.initial,
  c.type,
  c.ai_tier,
  c.high_churn_warning,
  r.revenue,
  r.payment_count AS subscribers,
  r.churn_count,
  r.metric_date
FROM public.companies c
LEFT JOIN LATERAL (
  SELECT * FROM public.metric_rollups 
  WHERE company_id = c.id 
  ORDER BY metric_date DESC 
  LIMIT 1
) r ON true
ORDER BY r.revenue DESC NULLS LAST;
```

#### B. Portfolio Top 4 KPI Aggregations
1. **Total Portfolio MRR:**
   * `SUM(r.revenue)` (e.g. `$337,600`)
2. **Portfolio Avg Churn Rate:**
   * `AVG(churn_rate)` (e.g. `2.8%`)
3. **Portfolio Avg LTV : CAC:**
   * Computed ratio tabok sa portfolio (e.g. `3.8x`)
4. **Net Outperforming Ratio:**
   * `COUNT(CASE WHEN ai_tier = 'Outperforming' THEN 1 END) * 100 / COUNT(*)` (e.g. `75%`)

---

### 3. TIER FILTERING INTEGRATION
* Gisuportahan ang filter tabs sa frontend:
  * `All` ➔ Tanang companies.
  * `Outperforming` ➔ `WHERE ai_tier = 'Outperforming'`
  * `Moderate` ➔ `WHERE ai_tier = 'Moderate'`
  * `At Risk` ➔ `WHERE ai_tier = 'At Risk'` (highlighted red churn warning).

---

### 4. DATA PAYLOAD RESPONSE
```json
{
  "summary": {
    "total_portfolio_mrr": "$337,600",
    "avg_churn_rate": "2.8%",
    "avg_ltv_cac": "3.8x",
    "outperforming_ratio": "75%"
  },
  "companies": [
    {
      "id": "uuid-1",
      "name": "CloudNest Inc.",
      "initial": "CN",
      "type": "Enterprise SaaS",
      "revenue": "$142,500",
      "revenue_growth": "+18.4%",
      "churn_rate": "2.1%",
      "high_churn_warning": false,
      "subscribers": "1,420",
      "ai_tier": "Outperforming"
    }
  ]
}
```

---

### 5. INTERACTIVE DRILL-DOWN
* Pag-click sa bisan asa nga row:
  * I-update ang `selectedCompanyId` sa `DashboardContext`.
  * Mo-redirect ngadto sa `/` (Dashboard overview sa maong kumpanya).
