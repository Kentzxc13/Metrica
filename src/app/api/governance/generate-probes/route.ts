import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        let body: any = {};
        try {
            body = await request.json();
        } catch {
            // body defaults to empty
        }

        const companyName = body.companyName || 'Portfolio Venture';
        const agenda = body.agendaTopic || 'Strategic Expansion & Operational Governance';

        // High-conviction venture director probes
        const timestamp = Date.now();
        const generatedProbes = [
            {
                id: `probe-ai-${timestamp}-1`,
                category: 'DILUTION & CAPITAL EFFICIENCY',
                question: `Given the strategic mandate regarding "${agenda}", what is the projected dilution impact on Series A investor ownership across subsequent follow-on rounds?`,
                contextHint: `Safeguard cap table anti-dilution rights and ensure capital allocation aligns with the 24-month ARR milestone plan for ${companyName}.`,
            },
            {
                id: `probe-ai-${timestamp}-2`,
                category: 'UNIT ECONOMICS & CHURN RISK',
                question: `What proactive dunning and customer retention guardrails are implemented to protect Net Revenue Retention (NRR) above 125% during enterprise scaling?`,
                contextHint: `Mitigate involuntary churn attrition and maintain healthy LTV:CAC ratios exceeding 3.5x under current operating conditions.`,
            },
        ];

        return NextResponse.json({
            success: true,
            probes: generatedProbes,
            generatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('AI Probe Generation error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate AI probes',
            },
            { status: 500 }
        );
    }
}
