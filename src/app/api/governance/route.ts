import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Supabase client is not initialized',
                },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('company_id');

        let query = supabase
            .from('governance_commitments')
            .select(`
                id,
                company_id,
                meeting_id,
                title,
                status,
                owner,
                target_deadline,
                resolution_note,
                created_at,
                updated_at,
                companies (
                    id,
                    name,
                    initial
                )
            `)
            .order('created_at', { ascending: false });

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Governance GET error:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to load governance commitments',
                },
                { status: 500 }
            );
        }

        const commitments = (data || []).map((item: any) => {
            const company = Array.isArray(item.companies)
                ? item.companies[0]
                : item.companies;

            return {
                id: item.id,
                companyId: item.company_id,
                companyName: company?.name ?? 'Unknown Company',
                companyInitial: company?.initial ?? 'N/A',
                meetingId: item.meeting_id,
                title: item.title,
                status: item.status,
                owner: item.owner,
                targetDeadline: item.target_deadline,
                resolutionNote: item.resolution_note,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
            };
        });

        return NextResponse.json({
            success: true,
            count: commitments.length,
            commitments,
        });
    } catch (error) {
        console.error('Governance API error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}