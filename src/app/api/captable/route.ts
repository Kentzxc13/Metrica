import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

const formatMoney = (value: number | null | undefined) => {
    const amount = Number(value ?? 0);

    if (Math.abs(amount) >= 1_000_000) {
        return '$' + (amount / 1_000_000).toFixed(2) + 'M';
    }

    if (Math.abs(amount) >= 1_000) {
        return '$' + (amount / 1_000).toFixed(0) + 'K';
    }

    return '$' + amount.toLocaleString('en-US');
};

export async function GET(request: Request) {
    try {
        const db = supabase;

        if (!db) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Supabase client is not available',
                },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        let query = db
            .from('cap_table_holdings')
            .select(
                `
                id,
                company_id,
                stage,
                share_class,
                initial_invest_date,
                capital_invested,
                equity_percent,
                post_money_valuation,
                current_fair_value,
                moic,
                irr,
                board_role,
                pro_rata_rights,
                shares_owned,
                price_per_share,
                liquidation_pref,
                anti_dilution,
                equity_breakdown,
                latest_funding_note,
                created_at,
                companies (
                    id,
                    name,
                    type,
                    initial
                )
                `
            )
            .order('created_at', { ascending: true });

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Cap Table query failed:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to load cap table holdings.',
                },
                { status: 500 }
            );
        }

        const holdings = (data ?? []).map((holding) => {
            const company = Array.isArray(holding.companies)
                ? holding.companies[0]
                : holding.companies;

            const companyName = company?.name ?? 'Unknown Company';
            const capitalInvested = Number(holding.capital_invested ?? 0);
            const postMoneyValuation = Number(
                holding.post_money_valuation ?? 0
            );
            const currentFairValue = Number(
                holding.current_fair_value ?? 0
            );
            const moic = Number(holding.moic ?? 0);
            const irr = holding.irr === null
                ? null
                : Number(holding.irr);

            return {
                id: holding.id,
                ventureId: slugify(companyName),
                companyId: holding.company_id,
                companyName,
                ticker: '$' + (company?.initial ?? 'N/A'),
                initials: company?.initial ?? 'N/A',
                sector: company?.type ?? 'N/A',
                stage: holding.stage,
                shareClass: holding.share_class,
                initialInvestDate: holding.initial_invest_date,
                capitalInvested,
                capitalInvestedFormatted: formatMoney(capitalInvested),
                equityPercent: Number(holding.equity_percent ?? 0),
                postMoneyValuation,
                postMoneyValuationFormatted:
                    formatMoney(postMoneyValuation),
                currentFairValue,
                currentFairValueFormatted:
                    formatMoney(currentFairValue),
                unrealizedGain:
                    currentFairValue - capitalInvested,
                unrealizedGainFormatted: formatMoney(
                    currentFairValue - capitalInvested
                ),
                moic,
                irr: irr ?? 0,
                boardRole:
                    holding.board_role === 'Board Observer'
                        ? 'Board Observer'
                        : 'Board Director',
                proRataRights: Boolean(holding.pro_rata_rights),
                foundersEquity: Number(
                    holding.equity_breakdown?.foundersEquity ?? 0
                ),
                esopPool: Number(
                    holding.equity_breakdown?.esopPool ?? 0
                ),
                otherInvestorsEquity: Number(
                    holding.equity_breakdown?.otherInvestorsEquity ?? 0
                ),
                sharesOwned: holding.shares_owned ?? '',
                pricePerShare:
                    holding.price_per_share === null
                        ? ''
                        : '$' + Number(holding.price_per_share).toFixed(2),
                liquidationPref: holding.liquidation_pref ?? '',
                antiDilution: holding.anti_dilution ?? '',
                latestFundingNote: holding.latest_funding_note ?? '',
                createdAt: holding.created_at,
            };
        });

        return NextResponse.json({
            success: true,
            count: holdings.length,
            holdings,
        });
    } catch (error) {
        console.error('Cap Table API error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Unexpected server error.',
            },
            { status: 500 }
        );
    }
}