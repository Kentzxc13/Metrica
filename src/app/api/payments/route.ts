import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-memory set of processed payment/event IDs for idempotency enforcement (fallback when Supabase is offline or testing)
const inMemoryProcessedIds = new Set<string>([
    'evt_9410',
    'evt_9411',
    'evt_9412',
    'evt_9413',
]);

const inMemoryTransactionsList: any[] = [
    { id: '1', code: '#evt_9410', customer: 'Ryan Korsgaard', product: 'Enterprise Tier License', status: 'Success', totalRevenue: '$41,400', timestamp: '14:32:05', relativeTime: '2m ago' },
    { id: '2', code: '#evt_9411', customer: 'Madelyn Lubin', product: 'Pro Annual Seat Package', status: 'Success', totalRevenue: '$89,200', timestamp: '13:58:12', relativeTime: '36m ago' },
    { id: '3', code: '#evt_9412', customer: 'Abram Bergson', product: 'Cloud Dedicated Node', status: 'Pending', totalRevenue: '$75,900', timestamp: '12:14:45', relativeTime: '2h ago' },
    { id: '4', code: '#evt_9413', customer: 'Phillip Mango', product: 'Integration API Connector', status: 'Refunded', totalRevenue: '$19,500', timestamp: '10:05:19', relativeTime: '4h ago' },
];

interface PaymentRequest {
    payment_id: string;
    company_id: string;
    amount: number;
    currency?: string;
    payment_timestamp: string;
    status?: string;
    customer?: string;
    product?: string;
    is_duplicate?: boolean;
    raw_payload?: Record<string, unknown>;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeCompanyKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/^c[-_]/, '')
        .replace(/[^a-z0-9]/g, '')
        .replace(/(inc|platform|gateway|saas|tool)$/g, '');
}

export async function GET() {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('payments')
                .select('id, payment_id, company_id, amount, currency, payment_timestamp, status, customer, product')
                .order('payment_timestamp', { ascending: false })
                .limit(20);

            if (!error && data && data.length > 0) {
                const formatted = data.map((item: any) => {
                    const code = item.payment_id?.startsWith('#') ? item.payment_id : `#${item.payment_id}`;
                    let status: 'Success' | 'Pending' | 'Refunded' | 'Duplicated' = 'Success';
                    const s = String(item.status || '').toUpperCase();
                    if (s.includes('DUP')) status = 'Duplicated';
                    else if (s.includes('PEND')) status = 'Pending';
                    else if (s.includes('REFUND')) status = 'Refunded';

                    return {
                        id: item.id || item.payment_id,
                        code,
                        customer: item.customer || 'Unknown Customer',
                        product: item.product || 'Standard SaaS License',
                        status,
                        totalRevenue: `$${Number(item.amount || 0).toLocaleString()}`,
                        timestamp: item.payment_timestamp
                            ? new Date(item.payment_timestamp).toLocaleTimeString('en-GB', { hour12: false })
                            : '12:00:00',
                        relativeTime: 'Just now',
                    };
                });
                return NextResponse.json(
                    { success: true, source: 'supabase', transactions: formatted },
                    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
                );
            }
        }
        return NextResponse.json(
            { success: true, source: 'in-memory', transactions: inMemoryTransactionsList },
            { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        );
    } catch (err) {
        return NextResponse.json(
            { success: true, source: 'fallback', transactions: inMemoryTransactionsList },
            { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as PaymentRequest;

        if (!body.payment_id || typeof body.payment_id !== 'string') {
            return NextResponse.json(
                { success: false, error: 'payment_id is required' },
                { status: 400 }
            );
        }

        const normalizedPaymentId = body.payment_id.replace(/^#/, '').trim();

        // Idempotency Engine check: prevent exact duplicate event ID / code processing
        if (inMemoryProcessedIds.has(normalizedPaymentId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Duplicate Event ID detected: #${normalizedPaymentId} has already been processed (Idempotency Key conflict). Duplicate rejected to prevent inaccurate metrics.`,
                    payment_id: body.payment_id,
                    is_duplicate: true,
                },
                { status: 409 }
            );
        }

        if (!body.company_id || typeof body.company_id !== 'string') {
            return NextResponse.json(
                { success: false, error: 'company_id is required' },
                { status: 400 }
            );
        }

        if (
            typeof body.amount !== 'number' ||
            !Number.isFinite(body.amount) ||
            body.amount <= 0
        ) {
            return NextResponse.json(
                { success: false, error: 'amount must be a positive number' },
                { status: 400 }
            );
        }

        if (
            !body.payment_timestamp ||
            typeof body.payment_timestamp !== 'string' ||
            Number.isNaN(Date.parse(body.payment_timestamp))
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'payment_timestamp must be a valid timestamp',
                },
                { status: 400 }
            );
        }

        let companyUuid = body.company_id;
        const code = body.payment_id.startsWith('#') ? body.payment_id : `#${body.payment_id}`;
        let statusNormalized: 'Success' | 'Pending' | 'Refunded' | 'Duplicated' = 'Success';
        if (body.status?.toUpperCase().includes('DUP') || body.is_duplicate) {
            statusNormalized = 'Duplicated';
        } else if (body.status?.toUpperCase().includes('PEND')) {
            statusNormalized = 'Pending';
        }

        if (supabase) {
            try {
                if (!isUuid(body.company_id)) {
                    const { data: companies, error: companyLookupError } =
                        await supabase
                            .from('companies')
                            .select('id, name');

                    if (!companyLookupError && companies) {
                        const requestedKey = normalizeCompanyKey(body.company_id);
                        const matchedCompany = companies.find(
                            (company: { id: string; name: string }) =>
                                normalizeCompanyKey(company.name) === requestedKey
                        );
                        if (matchedCompany) {
                            companyUuid = matchedCompany.id;
                        } else if (companies.length > 0) {
                            companyUuid = companies[0].id;
                        }
                    }
                }

                const { data, error } = await supabase
                    .from('payments')
                    .insert({
                        payment_id: body.payment_id,
                        company_id: companyUuid,
                        amount: body.amount,
                        currency: body.currency ?? 'USD',
                        payment_timestamp: body.payment_timestamp,
                        status: statusNormalized === 'Duplicated' ? 'DUPLICATED' : (body.status ?? 'PROCESSED'),
                        customer: body.customer ?? null,
                        product: body.product ?? null,
                        raw_payload: body.raw_payload ?? null,
                    })
                    .select(
                        'id, payment_id, company_id, amount, currency, payment_timestamp, received_at, status, customer, product'
                    )
                    .single();

                if (error) {
                    if (error.code === '23505') {
                        return NextResponse.json(
                            {
                                success: false,
                                error: `Duplicate Event ID detected: #${normalizedPaymentId} has already been processed (Idempotency Key conflict). Duplicate rejected to prevent inaccurate metrics.`,
                                payment_id: body.payment_id,
                                is_duplicate: true,
                            },
                            { status: 409 }
                        );
                    }
                    console.warn('Supabase insert warning:', error.message);
                } else if (data) {
                    inMemoryProcessedIds.add(normalizedPaymentId);
                    const formattedSavedTx = {
                        id: data.id || data.payment_id,
                        code,
                        customer: data.customer || body.customer || 'New Customer',
                        product: data.product || body.product || 'Standard SaaS License',
                        status: statusNormalized,
                        totalRevenue: `$${Number(body.amount).toLocaleString()}`,
                        timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                        relativeTime: 'Just now',
                    };
                    inMemoryTransactionsList.unshift(formattedSavedTx);

                    return NextResponse.json(
                        {
                            success: true,
                            payment: data,
                            transaction: formattedSavedTx,
                        },
                        { status: 201 }
                    );
                }
            } catch (dbErr) {
                console.warn('Supabase connection skipped, falling back to in-memory response:', dbErr);
            }
        }

        // Fallback in-memory response when Supabase is offline or not yet connected
        inMemoryProcessedIds.add(normalizedPaymentId);
        const fallbackPayment = {
            id: `pay_${Date.now()}`,
            code,
            payment_id: body.payment_id,
            company_id: companyUuid,
            amount: body.amount,
            currency: body.currency ?? 'USD',
            payment_timestamp: body.payment_timestamp,
            received_at: new Date().toISOString(),
            status: statusNormalized,
            customer: body.customer ?? 'New Customer',
            product: body.product ?? 'Standard SaaS License',
            totalRevenue: `$${Number(body.amount).toLocaleString()}`,
            timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            relativeTime: 'Just now',
        };

        inMemoryTransactionsList.unshift(fallbackPayment);

        return NextResponse.json(
            {
                success: true,
                payment: fallbackPayment,
                transaction: fallbackPayment,
            },
            { status: 201 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                error: err instanceof Error ? err.message : 'Invalid request',
            },
            { status: 400 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let id = searchParams.get('id') || searchParams.get('payment_id');

        if (!id) {
            const body = await request.json().catch(() => null);
            id = body?.id || body?.payment_id;
        }

        if (!id || typeof id !== 'string') {
            return NextResponse.json(
                { success: false, error: 'id or payment_id is required' },
                { status: 400 }
            );
        }

        const normalizedId = id.replace(/^#/, '').trim();

        // 1. Delete from Supabase if connected
        if (supabase) {
            try {
                if (isUuid(normalizedId)) {
                    await supabase
                        .from('payments')
                        .delete()
                        .eq('id', normalizedId);
                } else {
                    await supabase
                        .from('payments')
                        .delete()
                        .or(`payment_id.eq.${normalizedId},payment_id.eq.#${normalizedId}`);
                }
            } catch (dbErr) {
                console.warn('Supabase delete skipped:', dbErr);
            }
        }

        // 2. Remove from in-memory cache & idempotency set
        inMemoryProcessedIds.delete(normalizedId);
        inMemoryProcessedIds.delete(`evt_${normalizedId}`);

        const index = inMemoryTransactionsList.findIndex(
            (t) =>
                t.id === normalizedId ||
                t.code?.toLowerCase() === `#${normalizedId.toLowerCase()}` ||
                t.code?.toLowerCase() === normalizedId.toLowerCase()
        );
        if (index !== -1) {
            inMemoryTransactionsList.splice(index, 1);
        }

        return NextResponse.json({
            success: true,
            message: `Event/Payment #${normalizedId} deleted successfully`,
            deleted_id: normalizedId,
        });
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                error: err instanceof Error ? err.message : 'Invalid delete request',
            },
            { status: 400 }
        );
    }
}
