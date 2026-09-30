# Governance_Interactive_Cockpit

Giya sa pagdugang og interactive buttons ug live actions sa Board Governance page (`src/app/governance/page.tsx`).

---

### 1. ASA IBUTANG ANG MGA BUTTONS (Exact UI Locations)

```
+-------------------------------------------------------------------------------+
| QUARTERLY MEETING CADENCE SCHEDULE (5 Session Cards: Session 01 to 05)        |
+-------------------------------------------------------------------------------+
| LEFT PANEL (Dossier & Checklist)     | RIGHT PANEL (Commitments & AI Probes)  |
|                                      |                                        |
| Primary Session Agenda               | ● PRIOR BOARD COMMITMENTS              |
| [1] Expansion of 2025 ESOP...        |   [+ Add Commitment] 👈 (BUTTON 1)     |
| [2] Zero-Trust Architecture...       |   - SOC2 Remediation [COMPLETED]       |
| [3] Federal Enterprise Sales...      |   - Benchmark ESOP   [IN REVIEW]       |
|                                      |----------------------------------------|
| Pre-Meeting Readiness Checklist      | ● DIRECTOR'S STRATEGIC PROBES          |
| - Board Materials: Draft Review      |   [✨ Generate AI Probes] 👈 (BUTTON 2)|
| - Attendance Quorum: 3/3 Confirmed   |   - Inquiry #1: Equity Dilution        |
| - Financial Model: Verified          |                                        |
|                                      | [Copy Briefing] (Existing button)      |
+-------------------------------------------------------------------------------+
```

---

### 2. DETALYE SA MGA BUTTONS:

#### 🔘 BUTTON 1: `+ Add Commitment`
* **Target File:** `src/app/governance/page.tsx`
* **Exact Line Target:** Linya 232-235 (sa sulod sa header sa Prior Board Commitments):
```tsx
<div className="flex items-center gap-2">
    <button
        onClick={() => setIsAddCommitmentOpen(true)}
        className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors flex items-center gap-1"
    >
        <span>+</span> Add Commitment
    </button>
    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md">
        {selectedMeeting.deliveryRate || '2 of 3 Delivered (67%)'}
    </span>
</div>
```
* **Unsay mahitabo inig click:**
  * Mo-abli og simple modal: **"Record New Board Commitment"**.
  * Inputs:
    1. **Commitment Title** (e.g. *"Hire VP of Enterprise Sales by Q1"*)
    2. **Lead / Owner** (e.g. *"CEO & Head of Talent"*)
    3. **Target Deadline** (e.g. *"Jan 31, 2026"*)
  * Inig click sa **Save**, ma-append dayon sa listahan ug ma-save sa Supabase!

---

#### 🔘 BUTTON 2: `✨ Generate AI Probes`
* **Target File:** `src/app/governance/page.tsx`
* **Exact Line Target:** Linya 303-306 (sa sulod sa header sa Director's Strategic Probes):
```tsx
<div className="flex items-center gap-2">
    <button
        onClick={handleGenerateAIProbes}
        disabled={isGeneratingProbes}
        className="px-2.5 py-1 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
    >
        <span>✨</span> {isGeneratingProbes ? 'Analyzing...' : 'Generate AI Probes'}
    </button>
    <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200/80 px-2.5 py-1 rounded-md">
        {selectedMeeting.strategicProbes?.length || 2} Inquiries Prepared
    </span>
</div>
```
* **Unsay mahitabo inig click:**
  * Magpakita og gamay nga spinner / state: *"AI analyzing burn rate & equity model..."*.
  * Mo-call sa backend (`POST /api/governance/generate-probes`) aron maghimo og 2 ka bag-ong strategic questions para sa maong kumpanya.
  * Mo-update dayon ang inquiry cards sa ubos!

---

### 3. INTERACTIVE COMMITMENT STATUS TOGGLE
* Ang mga badge sama sa `[COMPLETED]` ug `[IN REVIEW]` mahimong i-click:
  * Inig click, mo-toggle gikan `IN REVIEW` ➔ `COMPLETED`.
  * Mo-update dayon ang count nga `2 of 3 Delivered` mahimong `3 of 3 Delivered (100%)`.

---

### 4. 1-CLICK "COPY BRIEFING" (Already at Bottom Right)
* Pabilin ang kasamtangang button sa ubos.
* Pag-click: Mo-kopya sa kompleto nga dossier text sa clipboard para andam na basahon ni Aris sa meeting.
