import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface DashboardRequest {
    company_id: string;
}

interface CompanyRecord {
    id: string;
    name: string;
    type: string;
    initial: string;
}

interface MetricRollup {
    id: string;
    company_id: string;
    metric_date: string;
    revenue: number;
    payment_count: number;
    customer_count: number;
    churn_count: number;
    status: string;
    created_at: string;
    updated_at: string;
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

function calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
        return current === 0 ? 0 : 100;
    }

    return Number((((current - previous) / previous) * 100).toFixed(2));
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        if (!companyId || typeof companyId !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'company_id is required',
                },
                { status: 400 }
            );
        }

        let company: CompanyRecord | null = null;

        // Resolve UUID directly.
        if (isUuid(companyId)) {
            const { data, error } = await supabase
                .from('companies')
                .select('id, name, type, initial')
                .eq('id', companyId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Company not found',
                        },
                        { status: 404 }
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

            company = data as CompanyRecord;
        } else {
            // Resolve frontend company slug/name to the real company UUID.
            const { data: companies, error } = await supabase
                .from('companies')
                .select('id, name, type, initial');

            if (error) {
                return NextResponse.json(
                    {
                        success: false,
                        error: error.message,
                    },
                    { status: 500 }
                );
            }

            const requestedKey = normalizeCompanyKey(companyId);

            company =
                (companies as CompanyRecord[] | null)?.find(
                    (item) =>
                        normalizeCompanyKey(item.name) === requestedKey
                ) ?? null;

            if (!company) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Company not found: ${companyId}`,
                    },
                    { status: 404 }
                );
            }
        }

        // Get the latest rollups for this company.
        const { data: rollups, error: rollupError } = await supabase
            .from('metric_rollups')
            .select(
                'id, company_id, metric_date, revenue, payment_count, customer_count, churn_count, status, created_at, updated_at'
            )
            .eq('company_id', company.id)
            .order('metric_date', { ascending: false })
            .limit(12);

        if (rollupError) {
            return NextResponse.json(
                {
                    success: false,
                    error: rollupError.message,
                },
                { status: 500 }
            );
        }

        const history = (rollups ?? []) as MetricRollup[];
        const latest = history[0] ?? null;
        const previous = history[1] ?? null;

        if (!latest) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No metric rollup found for this company',
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                company: {
                    id: company.id,
                    name: company.name,
                    type: company.type,
                    initial: company.initial,
                },
                summary: {
                    metricDate: latest.metric_date,
                    revenue: Number(latest.revenue),
                    paymentCount: latest.payment_count,
                    customerCount: latest.customer_count,
                    churnCount: latest.churn_count,
                    status: latest.status,
                    revenueGrowth: calculateGrowth(
                        Number(latest.revenue),
                        previous ? Number(previous.revenue) : 0
                    ),
                    paymentGrowth: calculateGrowth(
                        latest.payment_count,
                        previous ? previous.payment_count : 0
                    ),
                    customerGrowth: calculateGrowth(
                        latest.customer_count,
                        previous ? previous.customer_count : 0
                    ),
                    churnGrowth: calculateGrowth(
                        latest.churn_count,
                        previous ? previous.churn_count : 0
                    ),
                },
                history: history.map((rollup) => ({
                    metricDate: rollup.metric_date,
                    revenue: Number(rollup.revenue),
                    paymentCount: rollup.payment_count,
                    customerCount: rollup.customer_count,
                    churnCount: rollup.churn_count,
                    status: rollup.status,
                })),
            },
            { status: 200 }
        );
    } catch {
        return NextResponse.json(
            {
                success: false,
                error: 'Unable to load dashboard metrics',
            },
            { status: 500 }
        );
    }
}