export interface AuditLedgerEvent {
    id: string;
    code: string;
    timestamp: string;
    relativeTime: string;
    name: string;
    category:
        | 'New Subscription'
        | 'Upgrade & Expansion'
        | 'Failed Billing'
        | 'Churn & Cancellation'
        | 'Audit & Security';
    customer: string;
    company: string;
    mrrDelta: string;
    isPositive: boolean;
    isNegative: boolean;
    gateway: string;
    status: 'Delivered 200 OK' | 'Failed 402' | 'Pending Retry' | 'Refunded';
    payload: {
        invoiceId: string;
        customerIp: string;
        geo: string;
        cardBrand?: string;
        cardLast4?: string;
        failureReason?: string;
        signature: string;
    };
}