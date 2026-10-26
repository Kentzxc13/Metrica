# AI_Screening_Add_Prospect

Giya para sa "+ Add Prospect" button, modal, 1-Click test presets, ug card injection sa frontend.

---

### 1. Header Trigger ("Add Prospect" Button)
* **File:** `src/app/ai-screening/page.tsx`
* **Button:** `+ Add Prospect` sa header tupad sa sector dropdown filter.

---

### 2. "Add Prospect" Modal Form
* **File:** `src/components/modals/AddProspectModal.tsx`
* **Form Inputs:**
  * `Company Name` (text)
  * `Monthly Revenue / MRR` (number)
  * `Churn Rate %` (number)
  * `Growth Rate %` (number)
* **1-Click Preset Buttons (Zero-typing para sa Evaluator):**
  * Button `Load NimbusPay (TC-04)` ➔ Auto-fill: 10000 MRR, 3% Churn, 15% Growth.
  * Button `Load QuickBill (TC-05)` ➔ Auto-fill: 8000 MRR, 18% Churn, 2% Growth.
* **Submit Action:**
  * Button: `Run AI Evaluation`
  * Call: `POST /api/evaluate`
  * Loading state: "Running AI operational diligence..."

---

### 3. Card UI Injection (100% Same Design)
* Inig dawat sa evaluation result:
  * I-append ang bag-ong card sa deal flow grid.
  * **100% parehas sa existing card design:**
    * Monogram avatar
    * Stage tag (`SEED`)
    * Sektor (`Fintech`)
    * Gray metrics bar (`ARR`, `YOY GROWTH`, `CHURN`, `VALUATION`)
    * `AI SCREENING MEMO` box nga naay italic quote
* **Kung High Churn (TC-05):**
  * Churn rate font color mahimong pula (`text-rose-600`).
  * Naay separate red alert warning sulod sa card: *"High churn rate exceeds safe threshold (10%)"*.

---

### 4. Data Visibility (TC-06)
* Siguroha nga ang tinuod nga numero makita ug ma-hover sa card, dili tabunan sa AI rating.
