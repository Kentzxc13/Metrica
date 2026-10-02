import { DataPipeline } from '@/types/pipeline';

export const INITIAL_DATA_PIPELINES: DataPipeline[] = [
    {
        id: 'pipe-1',
        name: 'Stripe Sandbox Webhook Ingestion',
        companyName: 'Metrica Platform',
        initials: 'ST',
        protocol: 'REST Webhook',
        endpoint: '/api/webhooks/stripe',
        syncRate: 'Real-time Push',
        latency: '18ms',
        lastPayloadSynced: 'Just now',
        status: 'Healthy',
        sha256Verification: 'sha256:whsec_86769b563eec0dd31dd47dcb9fa44010805cf1382ba05c7f3a00e4152ff10062'
    },
    {
        id: 'pipe-2',
        name: 'SOC2 Security Audit Log Feed',
        companyName: 'CyberShield',
        initials: 'CS',
        protocol: 'REST Webhook',
        endpoint: 'api.metrica.io/v1/telemetry/cybershield/audit',
        syncRate: '120 events/sec',
        latency: '28ms',
        lastPayloadSynced: '1s ago',
        status: 'Healthy',
        sha256Verification: 'sha256:8f434346648f6b96df89dda901c5176b'
    },
    {
        id: 'pipe-3',
        name: 'CI/CD Pipeline Telemetry',
        companyName: 'FlowOps',
        initials: 'FO',
        protocol: 'GraphQL Real-Time',
        endpoint: 'api.metrica.io/v1/telemetry/flowops/graphql',
        syncRate: '45 events/sec',
        latency: '42ms',
        lastPayloadSynced: '5s ago',
        status: 'Healthy',
        sha256Verification: 'sha256:5994471abb01112afcc18159f6cc74b4'
    },
    {
        id: 'pipe-4',
        name: 'QuickBooks Enterprise Ledger Sync',
        companyName: 'DataSync',
        initials: 'DS',
        protocol: 'OAuth 2.0 Ingestion',
        endpoint: 'api.metrica.io/v1/telemetry/datasync/quickbooks',
        syncRate: 'Hourly Batch',
        latency: '110ms',
        lastPayloadSynced: '14m ago',
        status: 'Healthy',
        sha256Verification: 'sha256:a665a45920422f9d417e4867efdc4fb8'
    },
    {
        id: 'pipe-5',
        name: 'Kafka Real-Time Telemetry Stream',
        companyName: 'PulseAI',
        initials: 'PA',
        protocol: 'REST Webhook',
        endpoint: 'api.metrica.io/v1/telemetry/pulseai/kafka',
        syncRate: '88 events/sec',
        latency: '31ms',
        lastPayloadSynced: '2s ago',
        status: 'Healthy',
        sha256Verification: 'sha256:2c624232cdd221771294dfbb379aa42e'
    }
];
