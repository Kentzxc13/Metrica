import { DataPipeline } from '@/types/pipeline';

export const INITIAL_DATA_PIPELINES: DataPipeline[] = [
    {
        id: 'pipe-cloudnest',
        name: 'CloudNest Stripe Ingestion',
        companyName: 'CloudNest Inc.',
        initials: 'CN',
        protocol: 'REST Webhook',
        endpoint: '/api/webhooks/stripe?company_id=cloudnest',
        syncRate: '24 events/sec',
        latency: '22ms',
        lastPayloadSynced: 'Just now',
        status: 'Healthy',
        sha256Verification: 'sha256:whsec_86769b563eec0dd31dd47dcb9fa44010805cf1382ba05c7f3a00e4152ff10062'
    },
    {
        id: 'pipe-payloop',
        name: 'PayLoop Stripe Ingestion Pipeline',
        companyName: 'PayLoop Platform',
        initials: 'PL',
        protocol: 'REST Webhook',
        endpoint: '/api/webhooks/stripe?company_id=payloop',
        syncRate: '48 events/sec',
        latency: '19ms',
        lastPayloadSynced: 'Just now',
        status: 'Healthy',
        sha256Verification: 'sha256:whsec_86769b563eec0dd31dd47dcb9fa44010805cf1382ba05c7f3a00e4152ff10062'
    },
    {
        id: 'pipe-nimbuspay',
        name: 'NimbusPay Stripe Gateway Hub',
        companyName: 'NimbusPay Gateway',
        initials: 'NP',
        protocol: 'REST Webhook',
        endpoint: '/api/webhooks/stripe?company_id=nimbuspay',
        syncRate: '62 events/sec',
        latency: '15ms',
        lastPayloadSynced: 'Just now',
        status: 'Healthy',
        sha256Verification: 'sha256:whsec_86769b563eec0dd31dd47dcb9fa44010805cf1382ba05c7f3a00e4152ff10062'
    },
    {
        id: 'pipe-quickbill',
        name: 'QuickBill Stripe Telemetry',
        companyName: 'QuickBill SaaS',
        initials: 'QB',
        protocol: 'REST Webhook',
        endpoint: '/api/webhooks/stripe?company_id=quickbill',
        syncRate: '18 events/sec',
        latency: '31ms',
        lastPayloadSynced: 'Just now',
        status: 'Healthy',
        sha256Verification: 'sha256:whsec_86769b563eec0dd31dd47dcb9fa44010805cf1382ba05c7f3a00e4152ff10062'
    },
    {
        id: 'pipe-metrica',
        name: 'Global Master Stripe Sandbox',
        companyName: 'Metrica Platform',
        initials: 'ST',
        protocol: 'REST Webhook',
        endpoint: '/api/webhooks/stripe',
        syncRate: 'Real-time Push',
        latency: '14ms',
        lastPayloadSynced: 'Just now',
        status: 'Healthy',
        sha256Verification: 'sha256:whsec_86769b563eec0dd31dd47dcb9fa44010805cf1382ba05c7f3a00e4152ff10062'
    }
];
