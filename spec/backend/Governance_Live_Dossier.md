# Governance_Live_Dossier

Giya sa pag-konektar sa database ngadto sa Board Governance page (`src/app/governance/page.tsx`).

---

### 1. TARGET PAGE & DATABASE STORAGE
* **Page:** `src/app/governance/page.tsx`
* **Table:** `public.companies` (Hybrid JSONB Storage para zero-join speed)

---

### 2. DATABASE COLUMNS SA `companies`
| Column | Type | Description |
| :--- | :--- | :--- |
| `next_meeting_date` | `text` | Petsa sa Session Card (e.g. "Dec 02, 2025") |
| `agenda_topic` | `text` | Primary topic (e.g. "Expansion of 2025 ESOP Pool") |
| `board_role` | `text` | "Director Seat" \| "Observer Seat" |
| `meeting_status` | `text` | "Active Session", "Scheduled", "All Delivered" |
| `governance_dossier` | `jsonb` | Kompleto nga unod (Agenda, Checklist, Commitments, Probes) |

---

### 3. SULOD SA `governance_dossier` (JSONB Structure)
```json
{
  "quorum": "3/3 Investor Quorum",
  "agenda_items": [
    "Expansion of 2025 Equity Incentive Pool (ESOP +3.5%)",
    "Zero-Trust Architecture Rollout & SOC2 Type II Audit Findings",
    "Federal & Defense Enterprise Sales Pipeline ($14.2M Target)"
  ],
  "checklist": {
    "board_materials": "Draft Pending Review",
    "financial_model": "Internal Audit Verified",
    "quorum_status": "3/3 Quorum Confirmed",
    "prior_commitments": "2 of 3 Delivered (67%)"
  },
  "commitments": [
    {
      "id": "c-1",
      "title": "SOC2 Type II remediation: zero-trust ingress audit findings closed",
      "lead": "VP Security & Infra",
      "due_date": "Nov 25, 2025",
      "status": "COMPLETED"
    },
    {
      "id": "c-2",
      "title": "Benchmark 2025 ESOP pool (+3.5%) against Tier-1 Series B peer group",
      "lead": "Comp Committee / Legal",
      "due_date": "Today (In Review)",
      "status": "IN REVIEW"
    }
  ],
  "strategic_probes": [
    {
      "inquiry_num": 1,
      "category": "EQUITY DILUTION & ESOP",
      "question": "Which specific incoming C-suite hires will receive the +3.5% ESOP pool expansion, and what are their 4-year milestone vesting targets?",
      "rationale": "Ensure dilution protection for Series A investor seats; prevent unallocated pool decay."
    }
  ]
}
```

---

### 4. CORE BACKEND QUERIES & APIS

#### A. Database Connection Setup (`src/lib/supabase.ts`)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### B. Fetch Live Governance Dossier (Kuhaon tanang sessions para sa UI):
```typescript
// Query para sa Next.js Server Component o API route
export async function getGovernanceSessions() {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      initial,
      type,
      next_meeting_date,
      agenda_topic,
      board_role,
      meeting_status,
      governance_dossier
    `)
    .not('governance_dossier', 'is', null)
    .order('next_meeting_date', { ascending: true });

  if (error) throw error;
  return data;
}
```

#### C. API Route para sa Bag-ong Commitment (`src/app/api/governance/commitment/route.ts`):
* **Endpoint:** `POST /api/governance/commitment`
* **Payload:** `{ companyId: string, title: string, owner: string, targetDeadline: string }`
* **Logic:** 
  1. Kuhaon ang kasamtangang `governance_dossier` sa company.
  2. I-append ang bag-ong commitment sa array.
  3. I-update ang `companies` row:
```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { companyId, title, owner, targetDeadline } = await req.json();

  // 1. Fetch current dossier
  const { data: company, error: fetchErr } = await supabase
    .from('companies')
    .select('governance_dossier')
    .eq('id', companyId)
    .single();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

  const dossier = company.governance_dossier || { commitments: [] };
  const newCommitment = {
    id: `c-${Date.now()}`,
    title,
    owner,
    targetDeadline,
    status: 'in_progress'
  };

  dossier.commitments = [...(dossier.commitments || []), newCommitment];

  // 2. Persist updated dossier
  const { error: updateErr } = await supabase
    .from('companies')
    .update({ governance_dossier: dossier })
    .eq('id', companyId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ success: true, commitment: newCommitment });
}
```

#### D. API Route para sa AI Strategic Probes Generation (`src/app/api/governance/generate-probes/route.ts`):
* **Endpoint:** `POST /api/governance/generate-probes`
* **Action:** Magbasa sa pinakabag-ong metrics (MRR, Churn) sa company, mag-generate og 2 ka strategic boardroom inquiries, ug i-save sa `governance_dossier->'strategic_probes'`.
