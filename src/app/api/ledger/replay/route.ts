import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const eventId = body?.event_id;

        if (!eventId || typeof eventId !== 'string') {
            return NextResponse.json(
                {
                    success: false,
                    error: 'event_id is required',
                },
                { status: 400 }
            );
        }
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

const { data: payment, error } = await db
    .from('payments')
            .select(
                'id, payment_id, company_id, amount, currency, payment_timestamp, received_at, status, verification_hash'
            )
            .eq('payment_id', eventId)
            .maybeSingle();

        if (error) {
            console.error('Ledger replay lookup failed:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to verify the event before replay.',
                },
                { status: 500 }
            );
        }

        if (!payment) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Event not found.',
                },
                { status: 404 }
            );
        }

        /*
         * Replay is intentionally idempotent.
         *
         * We do NOT insert another payment and we do NOT recalculate
         * financial metrics. This represents a webhook redelivery attempt
         * for an already-existing event.
         */

        return NextResponse.json({
            success: true,
            replayed: true,
            idempotent: true,
            message: 'Webhook replay accepted without creating a duplicate payment.',
            event: {
                payment_id: payment.payment_id,
                status: payment.status,
                payment_timestamp: payment.payment_timestamp,
                received_at: payment.received_at,
                verification_hash: payment.verification_hash,
            },
            replayed_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Ledger replay request failed:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Invalid replay request.',
            },
            { status: 400 }
        );
    }
}