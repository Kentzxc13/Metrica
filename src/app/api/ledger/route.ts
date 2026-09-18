import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function formatStatus(status: string | null) {
    switch (status?.toUpperCase()) {
        case 'PROCESSED':
            return 'Delivered 200 OK';

        case 'FAILED':
            return 'Failed 402';

        case 'REFUNDED':
            return 'Refunded';

        case 'PENDING':
            return 'Pending Retry';

        default:
            return 'Pending Retry';
    }
}

function getCategory(status: string | null) {
    switch (status?.toUpperCase()) {
        case 'FAILED':
            return 'Failed Billing';

        case 'REFUNDED':
            return 'Churn & Cancellation';

        case 'PROCESSED':
            return 'New Subscription';

        default:
            return 'Audit & Security';
    }
}

function getEventName(status: string | null) {
    switch (status?.toUpperCase()) {
        case 'FAILED':
            return 'invoice.payment_failed';

        case 'REFUNDED':
            return 'customer.subscription.deleted';

        case 'PROCESSED':
            return 'customer.subscription.created';

        default:
            return 'payment.event.received';
    }
}

function formatRelativeTime(timestamp: string) {
    const eventTime = new Date(timestamp).getTime();
    const now = Date.now();

    const diffSeconds = Math.max(0, Math.floor((now - eventTime) / 1000));

    if (diffSeconds < 60) {
        return `${diffSeconds}s ago`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);

    return `${diffDays}d ago`;
}

function formatAmount(amount: number, currency: string | null) {
    const value = Number(amount || 0);
    const formatted = value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return `${currency || 'PHP'} ${formatted}`;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const companyId = searchParams.get('company_id');
        const limitParam = Number(searchParams.get('limit') || '100');

        const limit = Math.min(
            Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1),
            500
        );

        const db = supabase;

        if (!db) {
            return NextResponse.json(
                {
                    error: 'Supabase client is not available',
                },
                { status: 500 }
            );
        }

        let query = db
            .from('payments')
            .select(`
                id,
                payment_id,
                company_id,
                amount,
                currency,
                payment_timestamp,
                received_at,
                status,
                customer,
                product,
                verification_hash,
                companies (
                    id,
                    name
                )
            `)
            .order('payment_timestamp', { ascending: false })
            .limit(limit);

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Ledger query error:', error);

            return NextResponse.json(
                {
                    error: 'Failed to load ledger events',
                    details: error.message,
                },
                { status: 500 }
            );
        }

        const events = (data || []).map((payment: any) => {
            const amount = Number(payment.amount || 0);
            const currency = payment.currency || 'PHP';

            const status = payment.status || 'PENDING';
            const isFailed =
                status.toUpperCase() === 'FAILED' ||
                status.toUpperCase() === 'REFUNDED';

            const companyName =
                payment.companies?.name || 'Unknown Company';

            const timestamp =
                payment.payment_timestamp ||
                payment.received_at ||
                payment.created_at ||
                new Date().toISOString();

            return {
                id: payment.id,
                code: `#${payment.payment_id}`,
                timestamp,
                relativeTime: formatRelativeTime(timestamp),
                name: getEventName(status),
                category: getCategory(status),
                customer: payment.customer || 'Unknown Customer',
                company: companyName,

                mrrDelta: isFailed
                    ? `-${formatAmount(amount, currency)}/mo`
                    : `+${formatAmount(amount, currency)}/mo`,

                isPositive: !isFailed && status.toUpperCase() === 'PROCESSED',
                isNegative: isFailed,

                gateway: 'Supabase Payment API',
                status: formatStatus(status),

                payload: {
                    invoiceId: payment.payment_id,
                    customerIp: 'N/A',
                    geo: 'N/A',

                    signature:
                        payment.verification_hash ||
                        'No verification hash',
                },

                verificationHash: payment.verification_hash || null,

                paymentTimestamp: payment.payment_timestamp,
                receivedAt: payment.received_at,
            };
        });

        return NextResponse.json({
            success: true,
            count: events.length,
            events,
        });
    } catch (error) {
        console.error('Ledger API error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}