import { createHmac, timingSafeEqual } from 'crypto';

export interface NormalizedStripePayment {
    payment_id: string;
    amount: number;
    currency: string;
    payment_timestamp: string;
    status: 'PROCESSED' | 'FAILED' | 'REFUNDED' | 'PENDING';
    customer: string;
    product: string;
    metadata_company_id?: string;
    raw_payload: Record<string, unknown>;
}

export interface CompanyCandidate {
    id: string;
    name: string;
}

/**
 * Normalizes company key for fuzzy matching
 */
export function normalizeCompanyKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/^c[-_]/, '')
        .replace(/[^a-z0-9]/g, '')
        .replace(/(inc|platform|gateway|saas|tool)$/g, '');
}

/**
 * Checks if a string is a valid UUID
 */
export function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * Verifies Stripe webhook signature using HMAC-SHA256 according to Stripe's spec
 */
export function verifyStripeSignature(
    rawBody: string,
    signatureHeader: string | null,
    secret: string,
    toleranceSeconds = 300
): { valid: boolean; error?: string } {
    if (!signatureHeader) {
        return { valid: false, error: 'Missing stripe-signature header' };
    }

    const elements = signatureHeader.split(',');
    let timestamp = -1;
    const signatures: string[] = [];

    for (const item of elements) {
        const [key, value] = item.trim().split('=');
        if (key === 't') {
            timestamp = parseInt(value, 10);
        } else if (key === 'v1') {
            signatures.push(value);
        }
    }

    if (timestamp === -1 || signatures.length === 0) {
        return { valid: false, error: 'Malformed stripe-signature header' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
        return { valid: false, error: 'Stripe signature timestamp outside tolerance window' };
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expectedSignature = createHmac('sha256', secret)
        .update(signedPayload, 'utf8')
        .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const matched = signatures.some((sig) => {
        const sigBuffer = Buffer.from(sig, 'hex');
        if (sigBuffer.length !== expectedBuffer.length) return false;
        return timingSafeEqual(sigBuffer, expectedBuffer);
    });

    if (!matched) {
        return { valid: false, error: 'Signature mismatch' };
    }

    return { valid: true };
}

/**
 * Parses Stripe event JSON and validates security
 */
export function parseStripeEvent(
    rawBody: string,
    signatureHeader: string | null,
    secret?: string,
    isStrict = false
): { event: any; verified: boolean; error?: string } {
    let parsed: any;
    try {
        parsed = JSON.parse(rawBody);
    } catch {
        return { event: null, verified: false, error: 'Invalid JSON payload' };
    }

    if (secret && signatureHeader) {
        const verifyRes = verifyStripeSignature(rawBody, signatureHeader, secret);
        if (!verifyRes.valid) {
            if (isStrict) {
                return { event: null, verified: false, error: verifyRes.error };
            }
            return { event: parsed, verified: false, error: verifyRes.error };
        }
        return { event: parsed, verified: true };
    }

    if (isStrict) {
        return { event: null, verified: false, error: 'Strict mode requires secret and signature' };
    }

    return { event: parsed, verified: false };
}

/**
 * Normalizes Stripe Event to Metrica Payment Schema
 */
export function normalizeStripeToPayment(
    event: any,
    fallbackCompanyId?: string
): NormalizedStripePayment | null {
    if (!event || !event.data || !event.data.object) {
        return null;
    }

    const obj = event.data.object;
    const eventType = String(event.type || '');
    let status: 'PROCESSED' | 'FAILED' | 'REFUNDED' | 'PENDING' = 'PROCESSED';

    let amountCents = 0;
    if (typeof obj.amount === 'number') {
        amountCents = obj.amount;
    } else if (typeof obj.amount_due === 'number') {
        amountCents = obj.amount_due;
    } else if (typeof obj.amount_refunded === 'number') {
        amountCents = obj.amount_refunded;
    } else if (typeof obj.total === 'number') {
        amountCents = obj.total;
    }

    if (eventType.includes('payment_failed') || eventType.includes('failed')) {
        status = 'FAILED';
    } else if (eventType.includes('refund') || eventType.includes('deleted') || eventType.includes('canceled')) {
        status = 'REFUNDED';
    } else if (eventType.includes('pending') || eventType.includes('processing')) {
        status = 'PENDING';
    } else {
        status = 'PROCESSED';
    }

    const currency = (obj.currency || 'USD').toUpperCase();
    const amount = Math.round(amountCents) / 100;

    // Customer resolution
    const customer =
        obj.metadata?.customer_name ||
        obj.billing_details?.name ||
        obj.customer_name ||
        obj.receipt_email ||
        obj.customer_email ||
        obj.customer ||
        'Stripe Sandbox Customer';

    // Product resolution
    const product =
        obj.description ||
        obj.metadata?.product_name ||
        obj.lines?.data?.[0]?.description ||
        'Metrica Platform License';

    const metadataCompanyId = obj.metadata?.company_id || obj.metadata?.company || fallbackCompanyId;

    const paymentTimestamp = event.created
        ? new Date(event.created * 1000).toISOString()
        : new Date().toISOString();

    return {
        payment_id: obj.id || `evt_${event.id}`,
        amount,
        currency,
        payment_timestamp: paymentTimestamp,
        status,
        customer,
        product,
        metadata_company_id: metadataCompanyId,
        raw_payload: event,
    };
}

/**
 * Resolves Company UUID from query parameter, event metadata, or fallback
 */
export function resolveCompanyFromStripe(
    event: any,
    queryCompanyId: string | null,
    companies: CompanyCandidate[]
): string {
    const rawTarget =
        queryCompanyId ||
        event?.data?.object?.metadata?.company_id ||
        event?.data?.object?.metadata?.company;

    if (rawTarget) {
        if (isUuid(rawTarget)) {
            const exists = companies.find((c) => c.id === rawTarget);
            if (exists) return exists.id;
        }

        const targetKey = normalizeCompanyKey(rawTarget);
        const match = companies.find(
            (c) => normalizeCompanyKey(c.name) === targetKey || normalizeCompanyKey(c.id) === targetKey
        );
        if (match) return match.id;
    }

    // Fallback to first company in portfolio
    return companies[0]?.id || '00000000-0000-0000-0000-000000000000';
}
