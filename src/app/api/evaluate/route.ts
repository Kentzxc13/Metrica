import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface EvaluateRequest {
    company_id: string;
}

interface CompanyRecord {
    id: string;
    name: string;
    type: string;
    initial: string;
    ai_tier: string;
    ai_rationale: string;
    high_churn_warning: boolean;
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

function mapAiTier(tier: string): 'Prime' | 'Good' | 'Risky' {
    switch (tier.toLowerCase()) {
        case 'outperforming':
            return 'Prime';
        case 'at risk':
            return 'Risky';
        case 'moderate':
        default:
            return 'Good';
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as EvaluateRequest;

        if (!body.company_id || typeof body.company_id !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'company_id is required',
                },
                { status: 400 }
            );
        }

        let company: CompanyRecord | null = null;

        if (isUuid(body.company_id)) {
            const { data, error } = await supabase
                .from('companies')
                .select(
                    'id, name, type, initial, ai_tier, ai_rationale, high_churn_warning'
                )
                .eq('id', body.company_id)
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
            const { data: companies, error } = await supabase
                .from('companies')
                .select(
                    'id, name, type, initial, ai_tier, ai_rationale, high_churn_warning'
                );

            if (error) {
                return NextResponse.json(
                    {
                        success: false,
                        error: error.message,
                    },
                    { status: 500 }
                );
            }

            const requestedKey = normalizeCompanyKey(body.company_id);

            company =
                (companies as CompanyRecord[] | null)?.find(
                    (item) =>
                        normalizeCompanyKey(item.name) === requestedKey
                ) ?? null;

            if (!company) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Company not found: ${body.company_id}`,
                    },
                    { status: 404 }
                );
            }
        }

        const aiTier = mapAiTier(company.ai_tier);

        const aiScore =
            aiTier === 'Prime'
                ? 90
                : aiTier === 'Good'
                    ? 75
                    : 45;

        return NextResponse.json(
            {
                success: true,
                evaluation: {
                    companyId: company.id,
                    companyName: company.name,
                    aiTier,
                    aiScore,
                    aiRationale: company.ai_rationale,
                    highChurnWarning: company.high_churn_warning,
                },
            },
            { status: 200 }
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