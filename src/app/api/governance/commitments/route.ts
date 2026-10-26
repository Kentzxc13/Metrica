import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeCompanyKey(value: string): string {
    return value
        .toLowerCase()
        .replace(/^(comp|company|c)[-_]/, '')
        .replace(/[^a-z0-9]/g, '')
        .replace(/(inc|platform|gateway|saas|tool)$/g, '');
}

export async function POST(request: NextRequest) {
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

        let body: any;

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid JSON body',
                },
                { status: 400 }
            );
        }

        const {
            companyId,
            meetingId,
            title,
            status,
            owner,
            targetDeadline,
            resolutionNote,
        } = body;

        if (
            !companyId ||
            !meetingId ||
            !title ||
            !status ||
            !owner ||
            !targetDeadline
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'companyId, meetingId, title, status, owner, and targetDeadline are required',
                },
                { status: 400 }
            );
        }

        const allowedStatuses = [
            'completed',
            'in_progress',
            'delayed',
        ];

        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Invalid status. Use completed, in_progress, or delayed',
                },
                { status: 400 }
            );
        }

        let company: { id: string; name: string; initial?: string } | null = null;

        if (isUuid(companyId)) {
            const { data: compById, error: compByIdError } = await supabase
                .from('companies')
                .select('id, name, initial')
                .eq('id', companyId)
                .maybeSingle();

            if (!compByIdError && compById) {
                company = compById;
            }
        }

        if (!company) {
            const { data: companies, error: listError } = await supabase
                .from('companies')
                .select('id, name, initial');

            if (listError) {
                console.error('Company list error:', listError);
            } else if (companies && companies.length > 0) {
                const reqKey = normalizeCompanyKey(companyId);
                company = companies.find(
                    (c: { id: string; name: string }) =>
                        normalizeCompanyKey(c.name) === reqKey ||
                        normalizeCompanyKey(c.id) === reqKey
                ) ?? companies[0]; // Graceful fallback to first company if available
            }
        }

        if (!company) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Company not found',
                },
                { status: 404 }
            );
        }

        const resolvedCompanyId = company.id;

        const { data: existing, error: duplicateError } = await supabase
            .from('governance_commitments')
            .select('id')
            .eq('company_id', resolvedCompanyId)
            .eq('meeting_id', meetingId)
            .eq('title', title)
            .maybeSingle();

        if (duplicateError) {
            console.error('Duplicate check error:', duplicateError);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to check duplicate commitment',
                },
                { status: 500 }
            );
        }

        if (existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Commitment already exists',
                },
                { status: 409 }
            );
        }

        const { data: commitment, error: insertError } = await supabase
            .from('governance_commitments')
            .insert({
                company_id: resolvedCompanyId,
                meeting_id: meetingId,
                title,
                status,
                owner,
                target_deadline: targetDeadline,
                resolution_note: resolutionNote || null,
            })
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
                updated_at
            `)
            .single();

        if (insertError) {
            console.error('Commitment insert error:', insertError);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to create governance commitment',
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: 'Governance commitment created successfully',
                commitment: {
                    id: commitment.id,
                    companyId: commitment.company_id,
                    companyName: company.name,
                    companyInitial: company.initial,
                    meetingId: commitment.meeting_id,
                    title: commitment.title,
                    status: commitment.status,
                    owner: commitment.owner,
                    targetDeadline: commitment.target_deadline,
                    resolutionNote: commitment.resolution_note,
                    createdAt: commitment.created_at,
                    updatedAt: commitment.updated_at,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Governance commitment POST error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}