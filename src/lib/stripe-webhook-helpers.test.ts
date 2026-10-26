import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    parseStripeEvent,
    normalizeStripeToPayment,
    resolveCompanyFromStripe,
} from './stripe-webhook-helpers';

test('normalizeStripeToPayment correctly converts payment_intent.succeeded to PROCESSED status and dollar amounts', () => {
    const mockEvent = {
        id: 'evt_test_success_123',
        type: 'payment_intent.succeeded',
        created: 1711929600,
        data: {
            object: {
                id: 'pi_test_123',
                amount: 4900, // 4900 cents = $49.00
                currency: 'usd',
                status: 'succeeded',
                customer: 'cus_123',
                receipt_email: 'sarah.connor@cyberdyne.io',
                description: 'Metrica Enterprise Annual License',
                metadata: {
                    company_id: 'c-stripe',
                    customer_name: 'Sarah Connor',
                },
            },
        },
    };

    const payment = normalizeStripeToPayment(mockEvent);
    assert.ok(payment, 'Payment should not be null');
    assert.equal(payment.payment_id, 'pi_test_123');
    assert.equal(payment.amount, 49.00);
    assert.equal(payment.currency, 'USD');
    assert.equal(payment.status, 'PROCESSED');
    assert.equal(payment.customer, 'Sarah Connor');
    assert.equal(payment.product, 'Metrica Enterprise Annual License');
    assert.equal(payment.metadata_company_id, 'c-stripe');
});

test('normalizeStripeToPayment correctly converts invoice.payment_failed to FAILED', () => {
    const mockEvent = {
        id: 'evt_test_failed_456',
        type: 'invoice.payment_failed',
        created: 1711929700,
        data: {
            object: {
                id: 'in_test_failed_456',
                amount_due: 12000,
                currency: 'usd',
                status: 'open',
                customer_email: 'john.doe@startup.com',
                customer_name: 'John Doe',
                metadata: {},
            },
        },
    };

    const payment = normalizeStripeToPayment(mockEvent);
    assert.ok(payment);
    assert.equal(payment.payment_id, 'in_test_failed_456');
    assert.equal(payment.amount, 120.00);
    assert.equal(payment.status, 'FAILED');
});

test('normalizeStripeToPayment correctly converts charge.refunded to REFUNDED', () => {
    const mockEvent = {
        id: 'evt_test_refund_789',
        type: 'charge.refunded',
        created: 1711929800,
        data: {
            object: {
                id: 'ch_test_refund_789',
                amount_refunded: 5000,
                currency: 'usd',
                refunded: true,
                billing_details: { name: 'Alex Murphy', email: 'alex@omnicorp.com' },
                metadata: {},
            },
        },
    };

    const payment = normalizeStripeToPayment(mockEvent);
    assert.ok(payment);
    assert.equal(payment.amount, 50.00);
    assert.equal(payment.status, 'REFUNDED');
});

test('resolveCompanyFromStripe prioritizes URL query parameter then metadata then company list fallback', () => {
    const companies = [
        { id: '11111111-1111-1111-1111-111111111111', name: 'Stripe SaaS Co' },
        { id: '22222222-2222-2222-2222-222222222222', name: 'Apex Logistics' },
    ];

    // Priority 1: Query param
    const resolvedFromQuery = resolveCompanyFromStripe(
        { data: { object: { metadata: { company_id: 'Apex Logistics' } } } },
        'Stripe SaaS Co',
        companies
    );
    assert.equal(resolvedFromQuery, '11111111-1111-1111-1111-111111111111');

    // Priority 2: Metadata when query param is null
    const resolvedFromMeta = resolveCompanyFromStripe(
        { data: { object: { metadata: { company_id: 'Apex Logistics' } } } },
        null,
        companies
    );
    assert.equal(resolvedFromMeta, '22222222-2222-2222-2222-222222222222');

    // Priority 3: Fallback to first company
    const resolvedFallback = resolveCompanyFromStripe(
        { data: { object: { metadata: {} } } },
        null,
        companies
    );
    assert.equal(resolvedFallback, '11111111-1111-1111-1111-111111111111');
});
