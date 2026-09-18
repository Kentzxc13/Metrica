import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
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

        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Commitment ID is required',
                },
                { status: 400 }
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

        const allowedFields = [
            'meetingId',
            'title',
            'status',
            'owner',
            'targetDeadline',
            'resolutionNote',
        ];

        const providedFields = Object.keys(body).filter((key) =>
            allowedFields.includes(key)
        );

        if (providedFields.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'No valid fields provided for update',
                },
                { status: 400 }
            );
        }

        if (
            body.status !== undefined &&
            !['completed', 'in_progress', 'delayed'].includes(body.status)
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'Invalid status. Use completed, in_progress, or delayed',
                },
                { status: 400 }
            );
        }

        const { data: existing, error: findError } = await supabase
            .from('governance_commitments')
            .select(`
                id,
                company_id,
                meeting_id,
                title,
                status,
                owner,
                target_deadline,
                resolution_note
            `)
            .eq('id', id)
            .maybeSingle();

        if (findError) {
            console.error('Commitment lookup error:', findError);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to find governance commitment',
                },
                { status: 500 }
            );
        }

        if (!existing) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Governance commitment not found',
                },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {};

        if (body.meetingId !== undefined) {
            updateData.meeting_id = body.meetingId;
        }

        if (body.title !== undefined) {
            updateData.title = body.title;
        }

        if (body.status !== undefined) {
            updateData.status = body.status;
        }

        if (body.owner !== undefined) {
            updateData.owner = body.owner;
        }

        if (body.targetDeadline !== undefined) {
            updateData.target_deadline = body.targetDeadline;
        }

        if (body.resolutionNote !== undefined) {
            updateData.resolution_note = body.resolutionNote;
        }

        updateData.updated_at = new Date().toISOString();

        const { data: updated, error: updateError } = await supabase
            .from('governance_commitments')
            .update(updateData)
            .eq('id', id)
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

        if (updateError) {
            console.error('Commitment update error:', updateError);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to update governance commitment',
                },
                { status: 500 }
            );
        }

        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name, initial')
            .eq('id', updated.company_id)
            .maybeSingle();

        if (companyError) {
            console.error('Updated company lookup error:', companyError);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Commitment updated, but company lookup failed',
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Governance commitment updated successfully',
            commitment: {
                id: updated.id,
                companyId: updated.company_id,
                companyName: company?.name ?? 'Unknown Company',
                companyInitial: company?.initial ?? 'N/A',
                meetingId: updated.meeting_id,
                title: updated.title,
                status: updated.status,
                owner: updated.owner,
                targetDeadline: updated.target_deadline,
                resolutionNote: updated.resolution_note,
                createdAt: updated.created_at,
                updatedAt: updated.updated_at,
            },
        });
    } catch (error) {
        console.error('Governance commitment PATCH error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}