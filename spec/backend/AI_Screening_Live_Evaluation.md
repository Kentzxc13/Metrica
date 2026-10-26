# AI_Screening_Live_Evaluation

Diretso nga giya para sa live Next.js API evaluation engine ug Supabase save.

---

### 1. API Endpoint
* **File:** `src/app/api/evaluate/route.ts`
* **Method:** `POST`

---

### 2. Input Payload
```json
{
  "company_name": "NimbusPay",
  "mrr": 10000,
  "churn_rate": 3,
  "growth_rate": 15
}
```

---

### 3. Evaluation Rules
* **Rule 1 (TC-05 High Churn):**
  * Kung `churn_rate > 10`:
    * `ai_tier = "At Risk"`
    * `high_churn_warning = true`
* **Rule 2 (TC-04 Outperforming):**
  * Kung `growth_rate >= 15` UG `churn_rate <= 5`:
    * `ai_tier = "Outperforming"`
    * `high_churn_warning = false`
* **Rule 3 (Moderate):**
  * Tanan uban:
    * `ai_tier = "Moderate"`
    * `high_churn_warning = false`
* **Rule 4 (Rationale):**
  * 1-sentence VC explanation (e.g. *"Strong growth (15%) and low churn (3%) indicate healthy retention."*).

---

### 4. Supabase Database Sync
* **Table `companies`:**
  * I-save ang `company_name`, `ai_tier`, `ai_rationale`, `high_churn_warning`.
* **Table `metric_rollups`:**
  * I-save ang `revenue = mrr`, `churn_count = computed`.

---

### 5. Response Target
* Runtime: **< 5 seconds** (pasado sa TC-04).
```json
{
  "success": true,
  "data": {
    "company_name": "NimbusPay",
    "ai_tier": "Outperforming",
    "ai_rationale": "Strong growth (15%) and low churn (3%) indicate healthy retention.",
    "high_churn_warning": false,
    "arr": "$120k",
    "mrr": "$10,000",
    "churn_rate": "3.0%",
    "growth_rate": "+15.0%"
  }
}
```
