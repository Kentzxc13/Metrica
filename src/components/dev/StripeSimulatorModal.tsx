'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';

interface StripeSimulatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const EVENT_PRESETS = [
    {
        name: 'New Subscription ($249.00)',
        type: 'payment_intent.succeeded',
        amount: 24900, // cents
        customer: 'Elena Rostova',
        product: 'Metrica Enterprise Annual License',
        badge: 'Success',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    },
    {
        name: 'Seat Expansion ($89.00)',
        type: 'payment_intent.succeeded',
        amount: 8900,
        customer: 'Marcus Vance',
        product: '10x Additional Dedicated AI Seats',
        badge: 'Expansion',
        badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    {
        name: 'Billing Failed ($149.00)',
        type: 'invoice.payment_failed',
        amount: 14900,
        customer: 'Liam Chen',
        product: 'Pro Infrastructure Tier',
        badge: 'Failed 402',
        badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    },
    {
        name: 'Customer Refund ($350.00)',
        type: 'charge.refunded',
        amount: 35000,
        customer: 'Sophia Taylor',
        product: 'Custom Analytics Addon (Refunded)',
        badge: 'Refund',
        badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
];

export function StripeSimulatorModal({ isOpen, onClose, onSuccess }: StripeSimulatorModalProps) {
    const { companies, currentCompany, showActionToast } = useDashboard();
    
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(() => currentCompany?.id || '');
    const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
    const [customCustomer, setCustomCustomer] = useState<string>('');
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [lastResponse, setLastResponse] = useState<any | null>(null);

    if (!isOpen) return null;

    const currentPreset = EVENT_PRESETS[selectedPresetIndex];
    const targetCompany = companies.find((c) => c.id === selectedCompanyId) || currentCompany || companies[0];

    const handleFireWebhook = async () => {
        setIsSubmitting(true);
        setLastResponse(null);

        try {
            const customerName = customCustomer.trim() || currentPreset.customer;
            const amountCents = customAmount.trim() ? Math.round(parseFloat(customAmount) * 100) : currentPreset.amount;
            const eventId = `evt_sim_${Date.now()}`;
            const paymentId = `pi_sim_${Math.random().toString(36).substring(2, 9)}`;

            // Form a genuine Stripe sandbox event payload
            const stripePayload = {
                id: eventId,
                object: 'event',
                api_version: '2023-10-16',
                created: Math.floor(Date.now() / 1000),
                type: currentPreset.type,
                data: {
                    object: {
                        id: paymentId,
                        object: currentPreset.type.startsWith('charge') ? 'charge' : 'payment_intent',
                        amount: amountCents,
                        amount_due: amountCents,
                        amount_refunded: currentPreset.type.includes('refund') ? amountCents : 0,
                        currency: 'usd',
                        status: currentPreset.type.includes('fail') ? 'failed' : 'succeeded',
                        customer_name: customerName,
                        receipt_email: `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                        description: currentPreset.product,
                        metadata: {
                            company_id: targetCompany?.id || 'c-stripe',
                            company_name: targetCompany?.name || 'Stripe SaaS Co',
                            customer_name: customerName,
                            product_name: currentPreset.product,
                            sandbox_test: 'true',
                        },
                    },
                },
            };

            const endpointUrl = targetCompany?.id 
                ? `/api/webhooks/stripe?company_id=${encodeURIComponent(targetCompany.id)}`
                : '/api/webhooks/stripe';

            const res = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'stripe-signature': `t=${Math.floor(Date.now() / 1000)},v1=simulated_signature_sandbox`,
                },
                body: JSON.stringify(stripePayload),
            });

            const data = await res.json();
            setLastResponse(data);

            if (res.ok && data.success) {
                showActionToast?.(`Stripe webhook (${currentPreset.type}) delivered! Ledger updated in real-time.`);
                onSuccess?.();
            } else {
                showActionToast?.(`Failed: ${data.error || 'Server error'}`);
            }
        } catch (err: any) {
            console.error('Simulator error:', err);
            setLastResponse({ success: false, error: err.message });
            showActionToast?.(`Simulator error: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold text-sm">
                            S
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Stripe Sandbox Webhook Simulator
                            </h3>
                            <p className="text-[11px] text-zinc-500">
                                Temporary Dev Tool (Detachable) &bull; Fires real events to `/api/webhooks/stripe`
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg p-1 rounded-md transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 text-xs">
                    {/* Company Selector */}
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                            Target Company (Multi-Tenant Destination)
                        </label>
                        <select
                            value={selectedCompanyId || targetCompany?.id || ''}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        >
                            {companies.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.type || 'SaaS'}) &bull; ID: {c.id.substring(0, 8)}...
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Event Presets */}
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                            Stripe Event Scenario
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {EVENT_PRESETS.map((preset, idx) => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => setSelectedPresetIndex(idx)}
                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                        selectedPresetIndex === idx
                                            ? 'border-[#635BFF] bg-[#635BFF]/5 ring-1 ring-[#635BFF]'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${preset.badgeClass}`}>
                                            {preset.badge}
                                        </span>
                                    </div>
                                    <div className="font-medium text-zinc-800 dark:text-zinc-200 text-xs">
                                        {preset.name}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
                                        {preset.type}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Customer / Overrides */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                            <label className="block text-[11px] text-zinc-500 mb-1">Customer Name (Optional)</label>
                            <input
                                type="text"
                                placeholder={currentPreset.customer}
                                value={customCustomer}
                                onChange={(e) => setCustomCustomer(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-900 dark:text-zinc-100"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] text-zinc-500 mb-1">Amount in USD (Optional)</label>
                            <input
                                type="number"
                                placeholder={(currentPreset.amount / 100).toString()}
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono"
                            />
                        </div>
                    </div>

                    {/* Server Diagnostic Response */}
                    {lastResponse && (
                        <div className={`p-3 rounded-xl border text-[11px] font-mono overflow-x-auto ${
                            lastResponse.success
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                            <div className="font-semibold mb-0.5">
                                {lastResponse.success ? '✔ 200 OK — Ingested & Broadcasted' : '✖ Webhook Error'}
                            </div>
                            <pre className="text-[10px] whitespace-pre-wrap">
                                {JSON.stringify(lastResponse, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
                    <span className="text-[11px] text-zinc-400">
                        Targeting: <strong className="text-zinc-700 dark:text-zinc-300">{targetCompany?.name}</strong>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-xs font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleFireWebhook}
                            disabled={isSubmitting}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#635BFF] hover:bg-[#5851ea] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <span>Firing Webhook...</span>
                            ) : (
                                <>
                                    <span>⚡ Fire Sandbox Webhook</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
