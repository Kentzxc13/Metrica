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
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeCompanyKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .replace(/(inc|platform|gateway|saas|tool)$/g, '');
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
                (company) =>
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

        const { data, error } = await supabase
            .from('payments')
            .insert({
                payment_id: body.payment_id,
                company_id: companyUuid,
                amount: body.amount,
                currency: body.currency ?? 'PHP',
                payment_timestamp: body.payment_timestamp,
                status: body.status ?? 'PROCESSED',
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