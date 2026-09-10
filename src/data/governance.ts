import { BoardMeeting } from '@/types/governance';

export const INITIAL_BOARD_MEETINGS: BoardMeeting[] = [
    {
        id: 'bm-1',
        companyName: 'CloudNest',
        initials: 'CN',
        ticker: '$CNST',
        sector: 'Cloud Infrastructure & Kubernetes',
        boardRole: 'Board Director',
        nextMeetingDate: 'Nov 18, 2025 • 10:00 AM PST',
        status: 'Scheduled',
        quorum: '5/5 Directors Confirmed',
        agendaTopic: 'Q4 Financial Close, FY26 Annual Budget & Series B Pre-Marketing',
        materialsStatus: 'Audit Deck Ready',
        agendaItems: [
            'Q4 Financial Audit & Operating Cash Runway (+18 months cash runway reserve)',
            'FY26 Annual Operating Budget & Headcount Plan (+$4.2M OpEx approval)',
            'Series B Pre-Marketing Advisory Mandate & Target Valuation Range ($120M)'
        ],
        resolutionType: 'ANNUAL BUDGET & ADVISORY MANDATE',
        resolutionText: 'Formal adoption of the FY26 Annual Operating Plan ($18.4M) and authorization to engage investment banking advisors for Series B pre-marketing.',
        resolutionStatus: '3 of 3 Directors Signed (Passed)',
        isSigned: true,
        deliveryRate: '3 of 3 Delivered (100%)',
        priorCommitments: [
            {
                id: 'c-101',
                title: 'Q3 financial audit reconciliation and cash runway stress-test with Deloitte',
                status: 'completed',
                owner: 'CFO / Audit Committee',
                targetDeadline: 'Nov 10, 2025'
            },
            {
                id: 'c-102',
                title: 'Finalize FY26 OpEx model (+18 mo cash runway buffer under low-ARR scenario)',
                status: 'completed',
                owner: 'CEO & Head of FP&A',
                targetDeadline: 'Nov 12, 2025'
            },
            {
                id: 'c-103',
                title: 'Series B pre-marketing RFP and shortlist 3 institutional banking advisors',
                status: 'completed',
                owner: 'Aris Vance & CEO',
                targetDeadline: 'Nov 15, 2025'
            }
        ],
        strategicProbes: [
            {
                id: 'sp-101',
                category: 'SERIES B VALUATION',
                question: 'Are the 3 shortlisted banking advisors aligning on a $120M target valuation consistent with our 124% net retention rate?',
                contextHint: 'Pre-marketing timeline should avoid macroeconomic dips to ensure a tight, competitive bookbuild.'
            },
            {
                id: 'sp-102',
                category: 'OPEX DISCIPLINE',
                question: 'Can the +$4.2M headcount expansion be released in tranches conditioned on gross margin staying above 80%?',
                contextHint: 'Preserves cash runway buffer comfortably above the 18-month baseline reserve.'
            }
        ],
        boardSeats: {
            votingDirectors: '3 Seats (CN, Aris Vance, Independent)',
            observers: '2 Seats (DS, PA)',
            auditLead: 'CloudNest Inc. (Lead Director)',
            compLead: 'Independent Board Chair'
        },
        preMeetingChecklist: {
            deckStatus: 'Audit Deck Ready (v3.2)',
            financialsStatus: 'Deloitte Reconciled',
            quorumStatus: '5/5 Confirmed (100%)',
            legalStatus: 'Approved by Counsel'
        }
    },
    {
        id: 'bm-2',
        companyName: 'CyberShield',
        initials: 'CS',
        ticker: '$CYBR',
        sector: 'Zero-Trust Infrastructure & SOC2',
        boardRole: 'Board Director',
        nextMeetingDate: 'Dec 02, 2025 • 2:00 PM EST',
        status: 'Consent Required',
        quorum: '3/3 Investor Quorum',
        agendaTopic: 'Expansion of 2025 Equity Incentive Pool (ESOP +3.5%)',
        pendingResolution: 'Written Consent: Unanimous Approval for 2025 ESOP Expansion',
        materialsStatus: 'Draft Pending',
        agendaItems: [
            'Expansion of 2025 Equity Incentive Pool (ESOP +3.5% of fully diluted capitalization)',
            'Zero-Trust Architecture Rollout & SOC2 Type II Audit Finding Remediations',
            'Federal & Defense Enterprise Sales Pipeline ($14.2M ARR Target for FY26)'
        ],
        resolutionType: 'UNANIMOUS WRITTEN CONSENT',
        resolutionText: 'Unanimous Written Consent to authorize an expansion of the 2025 Equity Incentive Plan (ESOP) by +3.5% of fully diluted capitalization.',
        resolutionStatus: '2 of 3 Directors Signed',
        isSigned: false,
        deliveryRate: '2 of 3 Delivered (67%)',
        priorCommitments: [
            {
                id: 'c-201',
                title: 'SOC2 Type II remediation: zero-trust ingress audit findings closed',
                status: 'completed',
                owner: 'VP Security & Infra',
                targetDeadline: 'Nov 25, 2025'
            },
            {
                id: 'c-202',
                title: 'Benchmark 2025 ESOP pool (+3.5%) against Tier-1 Series B peer group',
                status: 'in_progress',
                owner: 'Comp Committee / Legal',
                targetDeadline: 'Today (In Review)'
            },
            {
                id: 'c-203',
                title: 'Federal sales pipeline security clearance compliance & GovCloud staging',
                status: 'delayed',
                owner: 'Head of Public Sector',
                targetDeadline: 'Dec 15 (Pushed 2 wks)'
            }
        ],
        strategicProbes: [
            {
                id: 'sp-201',
                category: 'EQUITY DILUTION & ESOP',
                question: 'Which specific incoming C-suite hires will receive the +3.5% ESOP pool expansion, and what are their 4-year milestone vesting targets?',
                contextHint: 'Ensure dilution protection for Series A investor seats; prevent unallocated pool decay.'
            },
            {
                id: 'sp-202',
                category: 'FEDERAL PIPELINE REMEDIATION',
                question: 'What caused the 2-week delay in GovCloud staging, and will it threaten the $14.2M FY26 federal sales target?',
                contextHint: 'SOC2 Type II remediations must be ratified before DoD defense vendor accreditation.'
            }
        ],
        boardSeats: {
            votingDirectors: '3 Seats (CS, Aris Vance, Independent)',
            observers: '2 Seats (DS, PA)',
            auditLead: 'Aris Vance (Audit Chair)',
            compLead: 'CyberShield Inc.'
        },
        preMeetingChecklist: {
            deckStatus: 'Draft Pending Review',
            financialsStatus: 'Internal Audit Verified',
            quorumStatus: '3/3 Quorum Confirmed',
            legalStatus: 'Ready for Review'
        }
    },
    {
        id: 'bm-3',
        companyName: 'FlowOps',
        initials: 'FO',
        ticker: '$FLO',
        sector: 'Developer Automation & CI/CD Telemetry',
        boardRole: 'Board Director',
        nextMeetingDate: 'Dec 15, 2025 • 11:30 AM PST',
        status: 'Materials Sent',
        quorum: '4/5 Confirmed',
        agendaTopic: 'Enterprise Channel Partnerships & Security Operations Expansion',
        materialsStatus: 'Audit Deck Ready',
        agendaItems: [
            'Master Commercial Services Agreement with Tier-1 Cloud Distro Partners',
            'CI/CD Telemetry Platform v3.0 Architectural Roadmap & SLA Commitments',
            'H1 2026 Core Platform Engineering Headcount (+12 Senior Staff Engineers)'
        ],
        resolutionType: 'COMMERCIAL PARTNERSHIP MANDATE',
        resolutionText: 'Formal authorization of Master Commercial Services Agreement with Tier-1 Cloud Distro Partners and mutual SLA indemnification.',
        resolutionStatus: '2 of 3 Directors Signed',
        isSigned: false,
        deliveryRate: '2 of 3 Delivered (67%)',
        priorCommitments: [
            {
                id: 'c-301',
                title: 'Master Commercial Services Agreement draft completed with partner counsel',
                status: 'completed',
                owner: 'CEO & General Counsel',
                targetDeadline: 'Dec 01, 2025'
            },
            {
                id: 'c-302',
                title: 'Telemetry v3.0 platform architectural roadmap & SLA liability caps',
                status: 'completed',
                owner: 'CTO / Core Platform',
                targetDeadline: 'Dec 08, 2025'
            },
            {
                id: 'c-303',
                title: 'H1 engineering hiring plan: recruit initial 6 Senior Staff SRE roles',
                status: 'in_progress',
                owner: 'VP People & Talent',
                targetDeadline: 'Q1 Target (In Progress)'
            }
        ],
        strategicProbes: [
            {
                id: 'sp-301',
                category: 'COMMERCIAL LIABILITY',
                question: 'Does the Tier-1 Cloud Distro master agreement cap our outage liability at 12 months trailing revenue?',
                contextHint: 'Prevent uncapped indemnity exposure across shared Kubernetes telemetry infrastructure.'
            },
            {
                id: 'sp-302',
                category: 'ENGINEERING SCALE',
                question: 'Why did telemetry v3 load testing flag latency degradation past 10M events/sec before SRE hiring completed?',
                contextHint: 'Board requires confirmation of 99.99% SLA reliability commitments before public announcement.'
            }
        ],
        boardSeats: {
            votingDirectors: '3 Seats (FO, Aris Vance, Founder Seat)',
            observers: '1 Seat (Early Angel Lead)',
            auditLead: 'CloudNest Inc.',
            compLead: 'Aris Vance'
        },
        preMeetingChecklist: {
            deckStatus: 'Board Materials Dispatched',
            financialsStatus: 'Q4 Gross Margin at 78%',
            quorumStatus: '4/5 Attendees Confirmed',
            legalStatus: 'Commercial Counsel Cleared'
        }
    },
    {
        id: 'bm-4',
        companyName: 'DataSync',
        initials: 'DS',
        ticker: '$DSNC',
        sector: 'Enterprise ETL & Data Integration',
        boardRole: 'Board Observer',
        nextMeetingDate: 'Jan 12, 2026 • 9:00 AM EST',
        status: 'Scheduled',
        quorum: 'Observer Rights Active',
        agendaTopic: 'FY25 Operational Review & Bank Connector Ingestion Audit',
        materialsStatus: 'Audit Deck Ready',
        agendaItems: [
            'FY25 Year-End Operational Review & Bank Ingestion Protocol Revisions',
            'SOC2 Type II Annual Recertification & Third-Party Penetration Test Results',
            'Enterprise Net Retention Rate Analysis (Current NRR: 124% across Tier-1 Banks)'
        ],
        resolutionType: 'OBSERVER FORMAL ACKNOWLEDGEMENT',
        resolutionText: 'Formal Board Observer acknowledgement of annual compliance audit, bank connector ingestion protocols, and regulatory disclosures.',
        resolutionStatus: 'Observer Verified',
        isSigned: true,
        deliveryRate: '3 of 3 Delivered (100%)',
        priorCommitments: [
            {
                id: 'c-401',
                title: 'Bank connector throughput audit: validated sub-50ms ingestion latency',
                status: 'completed',
                owner: 'Head of Engineering',
                targetDeadline: 'Dec 20, 2025'
            },
            {
                id: 'c-402',
                title: 'SOC2 Type II annual penetration testing report sign-off without high findings',
                status: 'completed',
                owner: 'Audit Committee',
                targetDeadline: 'Jan 05, 2026'
            },
            {
                id: 'c-403',
                title: 'Enterprise NRR cohort analysis across 14 Tier-1 banking deployments',
                status: 'completed',
                owner: 'VP Customer Success',
                targetDeadline: 'Jan 10, 2026'
            }
        ],
        strategicProbes: [
            {
                id: 'sp-401',
                category: 'ENTERPRISE RETENTION',
                question: 'With 124% NRR across Tier-1 banks, what packaging strategy prevents contract compression during annual bank reviews?',
                contextHint: 'Audit pack must demonstrate sub-50ms ETL throughput compliance to reinforce pricing power.'
            },
            {
                id: 'sp-402',
                category: 'INFRASTRUCTURE COMPLIANCE',
                question: 'Did third-party penetration testing identify any unauthenticated bank connector endpoints?',
                contextHint: 'Annual recertification report must be signed off by audit committee before Q1 close.'
            }
        ],
        boardSeats: {
            votingDirectors: '2 Seats (Founders & Lead Seed Series)',
            observers: '2 Seats (Aris Vance, Secondary VC)',
            auditLead: 'External Audit Committee',
            compLead: 'Founder Committee'
        },
        preMeetingChecklist: {
            deckStatus: 'Audit Pack Available',
            financialsStatus: 'Cash Runway: 22 Months',
            quorumStatus: 'Observer Rights Active',
            legalStatus: 'Governance File Current'
        }
    },
    {
        id: 'bm-5',
        companyName: 'PulseAI',
        initials: 'PA',
        ticker: '$PLSE',
        sector: 'Real-Time Telemetry & Predictive AI',
        boardRole: 'Board Observer',
        nextMeetingDate: 'Jan 28, 2026 • 1:00 PM PST',
        status: 'Scheduled',
        quorum: 'Observer Rights Active',
        agendaTopic: 'GPU Cluster Capacity Planning & Commercial Expansion Pipeline',
        materialsStatus: 'Audit Deck Ready',
        agendaItems: [
            'Multi-Year GPU Compute Cluster Lease Commitment ($3.2M CapEx over 36 months)',
            'Real-Time Telemetry & Predictive AI Enterprise ARR Growth (+84% YoY)',
            'Key AI Research Talent Retention Grants & Secondary Liquidity Facility'
        ],
        resolutionType: 'CAPEX LEASE APPROVAL',
        resolutionText: 'Board authorization for 36-month high-density compute infrastructure cluster lease commitment and electrical power allocation guarantee.',
        resolutionStatus: '1 of 3 Directors Signed',
        isSigned: false,
        deliveryRate: '2 of 3 Delivered (67%)',
        priorCommitments: [
            {
                id: 'c-501',
                title: 'GPU compute cluster efficiency audit: sustained 92% active training utilization',
                status: 'completed',
                owner: 'Chief AI Scientist',
                targetDeadline: 'Jan 15, 2026'
            },
            {
                id: 'c-502',
                title: 'Negotiate 36-month compute pricing guarantee and secondary power allocation',
                status: 'in_progress',
                owner: 'CEO & Aris Vance',
                targetDeadline: 'Jan 24, 2026'
            },
            {
                id: 'c-503',
                title: 'Establish key researcher retention grants and liquidity schedule structure',
                status: 'delayed',
                owner: 'Board Comp Chair',
                targetDeadline: 'Q1 2026'
            }
        ],
        strategicProbes: [
            {
                id: 'sp-501',
                category: 'CAPEX ARBITRAGE',
                question: 'Does the $3.2M 36-month GPU cluster lease provide price-drop renegotiation rights if next-gen compute costs fall?',
                contextHint: 'Avoid locking long-term CapEx commitments without compute cost deflation protection.'
            },
            {
                id: 'sp-502',
                category: 'AI TALENT RETENTION',
                question: 'How do our key researcher retention grants and liquidity schedule benchmark against Tier-1 foundation labs?',
                contextHint: 'Mitigates critical model training talent flight risks ahead of next-gen architecture rollout.'
            }
        ],
        boardSeats: {
            votingDirectors: '3 Seats (PA Founder, AI Fund Lead, Aris Vance)',
            observers: '2 Seats (Tech Incubator, Ecosystem Partner)',
            auditLead: 'Independent Audit Lead',
            compLead: 'Aris Vance'
        },
        preMeetingChecklist: {
            deckStatus: 'Executive Briefing Ready',
            financialsStatus: 'GPU Utilization at 92%',
            quorumStatus: 'Observer Rights Active',
            legalStatus: 'Compute Lease Review Ready'
        }
    }
];


