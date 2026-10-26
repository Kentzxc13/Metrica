import { SystemAlert, TeamMessage } from '@/types/alerts';

export const INITIAL_SYSTEM_ALERTS: SystemAlert[] = [
    {
        id: 'alert-1',
        title: 'Critical Churn Threshold Exceeded',
        message: 'QuickBill SaaS churn reached 18.5% (target <5.0%). Unit economics remediation recommended.',
        time: '12m ago',
        type: 'risk',
        isRead: false,
        tag: 'High Priority',
        actionNav: 'comparison',
        actionCompanyId: 'quickbill'
    },
    {
        id: 'alert-2',
        title: 'Payment Failed: Smart Dunning Active',
        message: 'Stripe webhook #evt_9412 failed (402 Card Expired) for Abram Bergson ($1,750/mo).',
        time: '2h ago',
        type: 'error',
        isRead: false,
        tag: 'Dunning',
        actionNav: 'ledger'
    },
    {
        id: 'alert-3',
        title: 'Expansion MRR Milestone',
        message: 'CloudNest Inc. added +$4,250 net expansion MRR today across 2 enterprise upgrade tiers.',
        time: '5h ago',
        type: 'success',
        isRead: true,
        tag: 'Expansion',
        actionNav: 'dashboard'
    }
];

export const INITIAL_TEAM_MESSAGES: TeamMessage[] = [
    {
        id: 'msg-1',
        sender: 'Elena Rostova',
        initials: 'ER',
        role: 'Investment Principal',
        subject: 'AcquiredFlow Due Diligence',
        preview: 'Cross-border treasury licenses look clean. What is their CAC payback timeline for Q4?',
        time: '24m ago',
        isRead: false
    },
    {
        id: 'msg-2',
        sender: 'Ryan Korsgaard',
        initials: 'RK',
        role: 'CEO, CloudNest',
        subject: 'Enterprise Tier License Expansion',
        preview: 'Closed the 20-seat annual package with Madelyn Lubin. Stripe webhook telemetry confirmed.',
        time: '1h ago',
        isRead: false
    },
    {
        id: 'msg-3',
        sender: 'Metrica Compliance Bot',
        initials: 'CB',
        role: 'Automated Audit Rail',
        subject: 'Monthly Webhook Audit Export',
        preview: 'Cryptographic SHA-256 event ledger archived for SOC2 Type II compliance record.',
        time: 'Yesterday',
        isRead: true
    }
];
