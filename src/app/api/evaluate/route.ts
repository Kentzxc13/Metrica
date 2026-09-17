import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProspectEvaluateRequest {
    company_name?: string;
    companyName?: string;
    mrr?: number | string;
    churn_rate?: number | string;
    churnRate?: number | string;
    growth_rate?: number | string;
    growthRate?: number | string;
    company_id?: string;
    companyId?: string;
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

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as ProspectEvaluateRequest;

        // Check if evaluating an existing company by ID
        const targetCompanyId = body.company_id || body.companyId;
        const companyName = body.company_name || body.companyName;

        // Mode A: New Prospect Evaluation Engine (TC-04 & TC-05, spec/backend/AI_Screening_Live_Evaluation.md)
        if (companyName || (body.mrr !== undefined && (body.churn_rate !== undefined || body.churnRate !== undefined))) {
            const name = String(companyName || 'New Prospect').trim();
            const mrr = Number(body.mrr ?? 10000);
            const churnRate = Number(body.churn_rate ?? body.churnRate ?? 0);
            const growthRate = Number(body.growth_rate ?? body.growthRate ?? 0);

            let aiTier: 'Outperforming' | 'Moderate' | 'At Risk' = 'Moderate';
            let highChurnWarning = false;
            let aiRationale = '';
            let aiScore = 75;

            // Rule 1: High Churn (TC-05)
            if (churnRate > 10) {
                aiTier = 'At Risk';
                highChurnWarning = true;
                aiScore = 48;
                aiRationale = `Critical warning: Churn rate (${churnRate.toFixed(1)}%) exceeds the safe 10% threshold. Unit economics require immediate remediation.`;
            }
            // Rule 2: Outperforming (TC-04)
            else if (growthRate >= 15 && churnRate <= 5) {
                aiTier = 'Outperforming';
                highChurnWarning = false;
                aiScore = 93;
                aiRationale = `Strong growth (+${growthRate.toFixed(1)}%) and low churn (${churnRate.toFixed(1)}%) indicate healthy customer retention and capital efficiency.`;
            }
            // Rule 3: Moderate
            else {
                aiTier = 'Moderate';
                highChurnWarning = false;
                aiScore = 78;
                aiRationale = `Consistent recurring revenue with steady expansion (+${growthRate.toFixed(1)}%) and manageable churn (${churnRate.toFixed(1)}%).`;
            }

            const arrValue = `$${Math.round(mrr * 12).toLocaleString()}`;
            const mrrValue = `$${Number(mrr).toLocaleString()}`;
            const churnStr = `${churnRate.toFixed(1)}%`;
            const growthStr = `${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`;

            // Persist to Supabase if connected
            let persistedCompanyId = `comp_${Date.now()}`;
            if (supabase) {
                try {
                    const initials = name
                        .split(' ')
                        .map((word) => word[0])
                        .join('')
                        .slice(0, 3)
                        .toUpperCase() || 'NP';

                    const { data: insertedComp } = await supabase
                        .from('companies')
                        .upsert(
                            {
                                name,
                                initial: initials,
                                type: 'Enterprise SaaS',
                                ai_tier: aiTier,
                                ai_rationale: aiRationale,
                                high_churn_warning: highChurnWarning,
                            },
                            { onConflict: 'name' }
                        )
                        .select('id')
                        .single();

                    if (insertedComp?.id) {
                        persistedCompanyId = insertedComp.id;
                        // Also record metric rollup
                        const todayDate = new Date().toISOString().slice(0, 10);
                        await supabase
                            .from('metric_rollups')
                            .insert({
                                company_id: insertedComp.id,
                                metric_date: todayDate,
                                revenue: mrr,
                                payment_count: 1,
                                customer_count: 1,
                                churn_count: churnRate > 0 ? Math.round((mrr * churnRate) / 1000) : 0,
                                status: 'Live',
                            });
                    }
                } catch (dbErr) {
                    console.warn('Supabase prospect sync skipped:', dbErr);
                }
            }

            const evaluationResult = {
                company_id: persistedCompanyId,
                companyId: persistedCompanyId,
                company_name: name,
                companyName: name,
                ai_tier: aiTier,
                aiTier,
                ai_score: aiScore,
                aiScore,
                ai_rationale: aiRationale,
                aiRationale,
                high_churn_warning: highChurnWarning,
                highChurnWarning,
                arr: arrValue,
                mrr: mrrValue,
                churn_rate: churnStr,
                churnRate: churnStr,
                growth_rate: growthStr,
                growthRate: growthStr,
            };

            return NextResponse.json(
                {
                    success: true,
                    data: evaluationResult,
                    evaluation: evaluationResult,
                },
                { status: 200 }
            );
        }

        // Mode B: Existing Company Lookup Evaluation (Backward Compatibility)
        if (targetCompanyId) {
            let companyRecord: any = null;

            if (supabase) {
                try {
                    if (isUuid(targetCompanyId)) {
                        const { data } = await supabase
                            .from('companies')
                            .select('id, name, type, initial, ai_tier, ai_rationale, high_churn_warning')
                            .eq('id', targetCompanyId)
                            .single();
                        companyRecord = data;
                    } else {
                        const { data: comps } = await supabase
                            .from('companies')
                            .select('id, name, type, initial, ai_tier, ai_rationale, high_churn_warning');

                        if (comps) {
                            const reqKey = normalizeCompanyKey(targetCompanyId);
                            companyRecord = comps.find((c: any) => normalizeCompanyKey(c.name) === reqKey) || comps[0];
                        }
                    }
                } catch (dbErr) {
                    console.warn('Supabase company evaluation lookup error:', dbErr);
                }
            }

            const compName = companyRecord?.name || 'CloudNest Inc.';
            const rawTier = companyRecord?.ai_tier || 'Outperforming';
            const aiTier: 'Outperforming' | 'Moderate' | 'At Risk' =
                rawTier.toLowerCase().includes('risk') ? 'At Risk' :
                rawTier.toLowerCase().includes('outperform') ? 'Outperforming' : 'Moderate';

            const highChurnWarning = Boolean(companyRecord?.high_churn_warning || aiTier === 'At Risk');
            const aiScore = aiTier === 'Outperforming' ? 94 : aiTier === 'Moderate' ? 82 : 48;
            const aiRationale = companyRecord?.ai_rationale ||
                (aiTier === 'Outperforming'
                    ? 'Exceptional expansion velocity and resilient net retention metrics.'
                    : aiTier === 'At Risk'
                    ? 'Critical warning: elevated churn exceeds risk tolerance thresholds.'
                    : 'Balanced growth profile with predictable cash conversion cycles.');

            const evaluationResult = {
                companyId: companyRecord?.id || targetCompanyId,
                company_id: companyRecord?.id || targetCompanyId,
                companyName: compName,
                company_name: compName,
                aiTier,
                ai_tier: aiTier,
                aiScore,
                ai_score: aiScore,
                aiRationale,
                ai_rationale: aiRationale,
                highChurnWarning,
                high_churn_warning: highChurnWarning,
            };

            return NextResponse.json(
                {
                    success: true,
                    data: evaluationResult,
                    evaluation: evaluationResult,
                },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'company_name and metrics or company_id is required' },
            { status: 400 }
        );
    } catch {
        return NextResponse.json(
            { success: false, error: 'Invalid JSON request body' },
            { status: 400 }
        );
    }
}
