import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase';
import {
    parseStripeEvent,
    normalizeStripeToPayment,
    resolveCompanyFromStripe,
} from '@/lib/stripe-webhook-helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function createVerificationHash(data: {
    payment_id: string;
    company_id: string;
    amount: number;
    currency: string;
    payment_timestamp: string;
}) {
    const payload = [
        data.payment_id,
        data.company_id,
        data.amount,
        data.currency,
        data.payment_timestamp,
    ].join('|');

    return createHash('sha256').update(payload).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('stripe-signature');
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const isStrict = process.env.WEBHOOK_STRICT_MODE === 'true';

        // 1. Parse & Verify Event Signature (Permissive in sandbox unless strict mode is enabled)
        const parseResult = parseStripeEvent(rawBody, signature, webhookSecret, isStrict);

        if (!parseResult.event) {
            console.error('[Stripe Webhook] Validation failed:', parseResult.error);
            return NextResponse.json(
                { success: false, error: parseResult.error || 'Failed to process event' },
                { status: 400 }
            );
        }

        const event = parseResult.event;

        // 2. Filter supported events (Ignore unhandled events cleanly with 200 OK)
        const supportedTypes = [
            'payment_intent.succeeded',
            'payment_intent.payment_failed',
            'payment_intent.created',
            'charge.succeeded',
            'charge.failed',
            'charge.refunded',
            'invoice.paid',
            'invoice.payment_failed',
            'customer.subscription.created',
            'customer.subscription.deleted',
        ];

        if (!supportedTypes.includes(event.type)) {
            return NextResponse.json(
                { received: true, ignored: true, type: event.type },
                { status: 200 }
            );
        }

        // 3. Normalize into Metrica's payment schema
        const normalized = normalizeStripeToPayment(event);
        if (!normalized) {
            return NextResponse.json(
                { success: false, error: 'Could not normalize Stripe event object' },
                { status: 400 }
            );
        }

        // 4. Resolve Dynamic Company
        const { searchParams } = new URL(request.url);
        const queryCompanyId = searchParams.get('company_id');

        let targetCompanyId = '00000000-0000-0000-0000-000000000000';

        if (supabase) {
            const { data: companies } = await supabase
                .from('companies')
                .select('id, name');

            targetCompanyId = resolveCompanyFromStripe(
                event,
                queryCompanyId,
                companies || []
            );
        }

        // 5. Generate SHA-256 verification hash
        const verificationHash = createVerificationHash({
            payment_id: normalized.payment_id,
            company_id: targetCompanyId,
            amount: normalized.amount,
            currency: normalized.currency,
            payment_timestamp: normalized.payment_timestamp,
        });

        // 6. Insert / Upsert into Supabase payments table
        if (supabase) {
            const insertPayload: Record<string, unknown> = {
                payment_id: normalized.payment_id,
                company_id: targetCompanyId,
                amount: normalized.amount,
                currency: normalized.currency,
                payment_timestamp: normalized.payment_timestamp,
                status: normalized.status,
                customer: normalized.customer,
                product: normalized.product,
                raw_payload: normalized.raw_payload,
                verification_hash: verificationHash,
            };

            let { data, error } = await supabase
                .from('payments')
                .upsert(insertPayload, { onConflict: 'payment_id' })
                .select()
                .single();

            // Fallback without verification_hash if column is missing
            if (error && (error.code === '42703' || error.message?.includes('verification_hash'))) {
                delete insertPayload.verification_hash;
                const retry = await supabase
                    .from('payments')
                    .upsert(insertPayload, { onConflict: 'payment_id' })
                    .select()
                    .single();
                data = retry.data;
                error = retry.error;
            }

            if (error) {
                console.error('[Stripe Webhook] Supabase upsert error:', error);
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Stripe webhook processed successfully',
                company_id: targetCompanyId,
                payment: data,
                verified: parseResult.verified,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Stripe webhook received (offline mode)',
            normalized,
        });
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Internal server error';
        console.error('[Stripe Webhook] Server error:', err);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
