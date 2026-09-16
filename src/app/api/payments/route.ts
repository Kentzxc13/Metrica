import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface PaymentRequest {
    payment_id: string;
    company_id: string;
    amount: number;
    currency?: string;
    payment_timestamp: string;
    status?: string;
    customer?: string;
    product?: string;
    raw_payload?: Record<string, unknown>;
}

function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
    );
}

function normalizeCompanyKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/(inc|platform|gateway|saas|tool)$/g, '');
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        if (!companyId) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'company_id is required',
                },
                { status: 400 }
            );
        }

        let companyUuid = companyId;

        if (!isUuid(companyId)) {
            const { data: companies, error: companyLookupError } =
                await supabase
                    .from('companies')
                    .select('id, name');

            if (companyLookupError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: companyLookupError.message,
                    },
                    { status: 500 }
                );
            }

            const requestedKey = normalizeCompanyKey(companyId);

            const matchedCompany = companies?.find(
                (company: { id: string; name: string }) =>
                    normalizeCompanyKey(company.name) === requestedKey
            );

            if (!matchedCompany) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Company not found: ${companyId}`,
                    },
                    { status: 404 }
                );
            }

            companyUuid = matchedCompany.id;
        }

        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name, type, initial')
            .eq('id', companyUuid)
            .maybeSingle();

        if (companyError) {
            return NextResponse.json(
                {
                    success: false,
                    error: companyError.message,
                },
                { status: 500 }
            );
        }

        if (!company) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Company not found: ${companyId}`,
                },
                { status: 404 }
            );
        }

        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select(
                'id, payment_id, company_id, amount, currency, payment_timestamp, received_at, status, customer, product'
            )
            .eq('company_id', companyUuid)
            .order('payment_timestamp', { ascending: false });

        if (paymentsError) {
            return NextResponse.json(
                {
                    success: false,
                    error: paymentsError.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
    {
        success: true,
        company,
        events: (payments ?? []).map((payment) => ({
            ...payment,
            event_type: 'PAYMENT',
        })),
        count: payments?.length ?? 0,
    },
    { status: 200 }
);
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: 'Unable to retrieve payment history',
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as PaymentRequest;

        // -----------------------------
        // 1. Validate request
        // -----------------------------

        if (!body.payment_id || typeof body.payment_id !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'payment_id is required',
                },
                { status: 400 }
            );
        }

        if (!body.company_id || typeof body.company_id !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'company_id is required',
                },
                { status: 400 }
            );
        }

        if (
            typeof body.amount !== 'number' ||
            !Number.isFinite(body.amount) ||
            body.amount <= 0
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'amount must be a positive number',
                },
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

        const paymentStatus = (body.status ?? 'PROCESSED').toUpperCase();

        // -----------------------------
        // 2. Resolve company ID
        // -----------------------------

        let companyUuid = body.company_id;

        if (!isUuid(body.company_id)) {
            const { data: companies, error: companyLookupError } =
                await supabase
                    .from('companies')
                    .select('id, name');

            if (companyLookupError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: companyLookupError.message,
                    },
                    { status: 500 }
                );
            }

            const requestedKey = normalizeCompanyKey(body.company_id);

            const matchedCompany = companies?.find(
                (company: { id: string; name: string }) =>
                    normalizeCompanyKey(company.name) === requestedKey
            );

            if (!matchedCompany) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Company not found: ${body.company_id}`,
                    },
                    { status: 400 }
                );
            }

            companyUuid = matchedCompany.id;
        }

        // -----------------------------
        // 3. Insert payment
        // -----------------------------

        const { data, error } = await supabase
            .from('payments')
            .insert({
                payment_id: body.payment_id,
                company_id: companyUuid,
                amount: body.amount,
                currency: body.currency ?? 'USD',
                payment_timestamp: body.payment_timestamp,
                status: paymentStatus,
                customer: body.customer ?? null,
                product: body.product ?? null,
                raw_payload: body.raw_payload ?? null,
            })
            .select(
                'id, payment_id, company_id, amount, currency, payment_timestamp, received_at, status, customer, product'
            )
            .single();

        // -----------------------------
        // 4. Duplicate payment handling
        // -----------------------------

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Payment already exists',
                        payment_id: body.payment_id,
                    },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                },
                { status: 500 }
            );
        }

        // -----------------------------
        // 5. Update metric rollup
        // -----------------------------
        //
        // Only PROCESSED payments affect revenue,
        // payment count, and customer count.
        //
        // metric_date comes from payment_timestamp,
        // not received_at. This supports late/out-of-order
        // events being recalculated against their actual date.

        if (paymentStatus === 'PROCESSED') {
            const paymentDate = new Date(
                body.payment_timestamp
            )
                .toISOString()
                .slice(0, 10);

            const startOfDay = `${paymentDate}T00:00:00.000Z`;
            const startOfNextDay = new Date(
                new Date(startOfDay).getTime() + 24 * 60 * 60 * 1000
            ).toISOString();

            // Get all processed payments for this company/date.
            const { data: dayPayments, error: dayPaymentsError } =
                await supabase
                    .from('payments')
                    .select('amount, customer')
                    .eq('company_id', companyUuid)
                    .eq('status', 'PROCESSED')
                    .gte('payment_timestamp', startOfDay)
                    .lt('payment_timestamp', startOfNextDay);

            if (dayPaymentsError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Payment saved, but metric rollup failed: ${dayPaymentsError.message}`,
                    },
                    { status: 500 }
                );
            }

            const revenue = (dayPayments ?? []).reduce(
                (total: number, payment: { amount: number }) =>
                    total + Number(payment.amount),
                0
            );

            const paymentCount = dayPayments?.length ?? 0;

            const uniqueCustomers = new Set(
                (dayPayments ?? [])
                    .map(
                        (payment: { customer: string | null }) =>
                            payment.customer
                    )
                    .filter(
                        (customer): customer is string =>
                            Boolean(customer)
                    )
            );

            const customerCount = uniqueCustomers.size;

            // Check if a rollup already exists for this
            // company and metric date.
            const { data: existingRollup, error: rollupLookupError } =
                await supabase
                    .from('metric_rollups')
                    .select(
                        'id, company_id, metric_date, revenue, payment_count, customer_count, churn_count, status'
                    )
                    .eq('company_id', companyUuid)
                    .eq('metric_date', paymentDate)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

            if (rollupLookupError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Payment saved, but metric rollup lookup failed: ${rollupLookupError.message}`,
                    },
                    { status: 500 }
                );
            }

            if (existingRollup) {
                // Update existing daily rollup.
                const { error: rollupUpdateError } = await supabase
                    .from('metric_rollups')
                    .update({
                        revenue,
                        payment_count: paymentCount,
                        customer_count: customerCount,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingRollup.id);

                if (rollupUpdateError) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: `Payment saved, but metric rollup update failed: ${rollupUpdateError.message}`,
                        },
                        { status: 500 }
                    );
                }
            } else {
                // Create a new daily rollup if none exists.
                const { error: rollupInsertError } = await supabase
                    .from('metric_rollups')
                    .insert({
                        company_id: companyUuid,
                        metric_date: paymentDate,
                        revenue,
                        payment_count: paymentCount,
                        customer_count: customerCount,
                        churn_count: 0,
                        status: 'Live',
                    });

                if (rollupInsertError) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: `Payment saved, but metric rollup creation failed: ${rollupInsertError.message}`,
                        },
                        { status: 500 }
                    );
                }
            }
        }

        // -----------------------------
        // 6. Return successful response
        // -----------------------------

        return NextResponse.json(
            {
                success: true,
                payment: data,
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: 'Invalid JSON request body',
            },
            { status: 400 }
        );
    }
}