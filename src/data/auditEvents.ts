import { AuditLedgerEvent } from '@/types/ledger';

export const INITIAL_AUDIT_EVENTS: AuditLedgerEvent[] = [
    {
        id: 'evt-1',
        code: '#evt_9410',
        timestamp: '14:32:05 UTC',
        relativeTime: '2m ago',
        name: 'customer.subscription.created',
        category: 'New Subscription',
        customer: 'Ryan Korsgaard',
        company: 'CloudNest',
        mrrDelta: '+$3,450/mo',
        isPositive: true,
        isNegative: false,
        gateway: 'Stripe Webhook',
        status: 'Delivered 200 OK',
        payload: {
            invoiceId: 'in_1P9x9410Enterprise',
            customerIp: '198.51.100.42',
            geo: 'San Francisco, US',
            cardBrand: 'Visa',
            cardLast4: '4242',
            signature: 'whsec_e4b8a21f8791c6e93b'
        }
    },
    {
        id: 'evt-2',
        code: '#evt_9411',
        timestamp: '13:58:12 UTC',
        relativeTime: '36m ago',
        name: 'plan.tier_expanded',
        category: 'Upgrade & Expansion',
        customer: 'Madelyn Lubin',
        company: 'CloudNest',
        mrrDelta: '+$2,980/mo',
        isPositive: true,
        isNegative: false,
        gateway: 'Stripe Webhook',
        status: 'Delivered 200 OK',
        payload: {
            invoiceId: 'in_1P9x9411AnnualPro',
            customerIp: '142.250.190.78',
            geo: 'Austin, US',
            cardBrand: 'Mastercard',
            cardLast4: '8821',
            signature: 'whsec_a7f920bc43118d09aa'
        }
    },
    {
        id: 'evt-3',
        code: '#evt_9412',
        timestamp: '12:14:45 UTC',
        relativeTime: '2h ago',
        name: 'invoice.payment_failed',
        category: 'Failed Billing',
        customer: 'Abram Bergson',
        company: 'QuickBill SaaS',
        mrrDelta: '-$1,750/mo',
        isPositive: false,
        isNegative: true,
        gateway: 'Stripe Webhook',
        status: 'Failed 402',
        payload: {
            invoiceId: 'in_1P9x9412DedicatedNode',
            customerIp: '82.165.197.1',
            geo: 'Berlin, DE',
            cardBrand: 'Visa',
            cardLast4: '1099',
            failureReason: 'Card expired. Smart Dunning retry 1 of 3 scheduled.',
            signature: 'whsec_bb19028df44719ac51'
        }
    },
    {
        id: 'evt-4',
        code: '#evt_9413',
        timestamp: '10:41:20 UTC',
        relativeTime: '4h ago',
        name: 'charge.dispute.created',
        category: 'Failed Billing',
        customer: 'Phillip Mango',
        company: 'PulseCare AI',
        mrrDelta: '-$1,950/mo',
        isPositive: false,
        isNegative: true,
        gateway: 'ACH Direct Debit',
        status: 'Pending Retry',
        payload: {
            invoiceId: 'in_1P9x9413ACHDispute',
            customerIp: '192.0.2.14',
            geo: 'Toronto, CA',
            failureReason: 'Customer bank inquiry: Unrecognized subscription debit.',
            signature: 'whsec_c80214aa8e09f4b123'
        }
    },
    {
        id: 'evt-5',
        code: '#evt_9414',
        timestamp: '09:20:18 UTC',
        relativeTime: '5h ago',
        name: 'customer.subscription.created',
        category: 'New Subscription',
        customer: 'Elena Rostova',
        company: 'DevPrism',
        mrrDelta: '+$1,200/mo',
        isPositive: true,
        isNegative: false,
        gateway: 'Paddle API',
        status: 'Delivered 200 OK',
        payload: {
            invoiceId: 'in_1P9x9414Observability',
            customerIp: '185.199.108.153',
            geo: 'London, UK',
            cardBrand: 'Amex',
            cardLast4: '1004',
            signature: 'whsec_ff94819a82bb904d11'
        }
    },
    {
        id: 'evt-6',
        code: '#evt_9415',
        timestamp: '07:15:33 UTC',
        relativeTime: '7h ago',
        name: 'subscription.seat_addon_added',
        category: 'Upgrade & Expansion',
        customer: 'Marcus Vance',
        company: 'AcquiredFlow',
        mrrDelta: '+$650/mo',
        isPositive: true,
        isNegative: false,
        gateway: 'Stripe Webhook',
        status: 'Delivered 200 OK',
        payload: {
            invoiceId: 'in_1P9x9415AddonSeats',
            customerIp: '64.233.160.1',
            geo: 'New York, US',
            cardBrand: 'Visa',
            cardLast4: '9012',
            signature: 'whsec_77189fa014ebaa9012'
        }
    },
    {
        id: 'evt-7',
        code: '#evt_9416',
        timestamp: '05:40:02 UTC',
        relativeTime: '9h ago',
        name: 'customer.subscription.deleted',
        category: 'Churn & Cancellation',
        customer: 'Tariq Mansour',
        company: 'QuickBill SaaS',
        mrrDelta: '-$890/mo',
        isPositive: false,
        isNegative: true,
        gateway: 'Stripe Webhook',
        status: 'Refunded',
        payload: {
            invoiceId: 'in_1P9x9416Terminated',
            customerIp: '94.200.15.8',
            geo: 'Dubai, AE',
            failureReason: 'Voluntary downgrade to open-source tier.',
            signature: 'whsec_11094fa8827eb0981a'
        }
    },
    {
        id: 'evt-8',
        code: '#evt_9417',
        timestamp: '03:10:50 UTC',
        relativeTime: '11h ago',
        name: 'security.audit_log_exported',
        category: 'Audit & Security',
        customer: 'Salung Prastyo (Admin)',
        company: 'Metrica Core',
        mrrDelta: '$0',
        isPositive: false,
        isNegative: false,
        gateway: 'System Audit',
        status: 'Delivered 200 OK',
        payload: {
            invoiceId: 'audit_sec_99417',
            customerIp: '127.0.0.1 (Local Session)',
            geo: 'Tokyo, JP',
            signature: 'sha256_90ff18ae82109bac33'
        }
    }
];
