import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name, initial')
            .eq('id', companyId)
            .maybeSingle();

        if (companyError) {
            console.error('Company lookup error:', companyError);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to verify company',
                },
                { status: 500 }
            );
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

        const { data: existing, error: duplicateError } = await supabase
            .from('governance_commitments')
            .select('id')
            .eq('company_id', companyId)
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
                company_id: companyId,
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