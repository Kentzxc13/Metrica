export interface DataPipeline {
    id: string;
    name: string;
    companyName: string;
    initials: string;
    protocol: 'REST Webhook' | 'Stripe Connect' | 'GraphQL Real-Time' | 'OAuth 2.0 Ingestion';
    endpoint: string;
    syncRate: string;
    latency: string;
    lastPayloadSynced: string;
    status: 'Healthy' | 'Syncing' | 'Degraded';
    sha256Verification: string;
}
