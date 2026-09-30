"use client";

import React, { useState, useEffect } from 'react';
import { Transaction } from '@/types/company';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTransaction: (tx: Transaction) => void;
    companyId: string;
    existingTransactions?: Transaction[];
    onAlert?: (msg: string) => void;
}

export function AddPaymentModal({
    isOpen,
    onClose,
    onAddTransaction,
    companyId,
    existingTransactions = [],
    onAlert
}: AddPaymentModalProps) {
    const [newCustomer, setNewCustomer] = useState<string>('');
    const [newEventCode, setNewEventCode] = useState<string>('');
    const [newProduct, setNewProduct] = useState<string>('');
    const [newAmount, setNewAmount] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Compute next suggested sequential Event Code on modal open
    useEffect(() => {
        if (!isOpen) return;

        let maxNum = 9413;
        (existingTransactions || []).forEach((t) => {
            const match = t.code.match(/evt_(\d+)/i);
            if (match) {
                const parsed = parseInt(match[1], 10);
                if (!isNaN(parsed) && parsed > maxNum) {
                    maxNum = parsed;
                }
            }
        });

        const nextCode = `#evt_${maxNum + 1}`;
        setNewEventCode(nextCode);
        setErrorMsg('');
        setIsSubmitting(false);
    }, [isOpen, existingTransactions]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!newCustomer.trim() || !newAmount.trim()) return;

        // Determine target event code automatically
        let maxNum = 9413;
        (existingTransactions || []).forEach((t) => {
            const match = t.code.match(/evt_(\d+)/i);
            if (match) {
                const parsed = parseInt(match[1], 10);
                if (!isNaN(parsed) && parsed > maxNum) {
                    maxNum = parsed;
                }
            }
        });
        const formattedCode = newEventCode.trim() || `#evt_${maxNum + 1}`;
        const normalizedTargetCode = formattedCode.toLowerCase();
        const formattedRevenue = `$${Number(newAmount).toLocaleString()}`;
        const targetProduct = newProduct.trim() || 'Standard SaaS License';

        // Duplicate Detection: Check if same customer, product, and amount already exists
        const fingerprintDuplicate = existingTransactions.find(
            (t) =>
                t.customer.trim().toLowerCase() === newCustomer.trim().toLowerCase() &&
                t.product.trim().toLowerCase() === targetProduct.toLowerCase() &&
                (t.totalRevenue === formattedRevenue || 
                 t.totalRevenue.replace(/[^0-9.]/g, '') === Number(newAmount).toString())
        );

        const isDuplicate = Boolean(fingerprintDuplicate);
        const txStatus = isDuplicate ? 'Duplicated' : 'Success';

        // Ping the user via toast notification if duplicate is detected
        if (isDuplicate && onAlert) {
            onAlert(`⚠️ Duplicate Event Detected: ${newCustomer.trim()} with identical product and amount was already recorded. Tagged as Duplicated.`);
        }

        const paymentId = formattedCode.replace(/^#/, '');
        setIsSubmitting(true);
        let result: any = null;

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_id: paymentId,
                    company_id: companyId || 'c-cloudnest',
                    amount: Number(newAmount),
                    currency: 'USD',
                    payment_timestamp: new Date().toISOString(),
                    customer: newCustomer.trim(),
                    product: targetProduct,
                    status: isDuplicate ? 'DUPLICATED' : 'PROCESSED',
                    is_duplicate: isDuplicate,
                }),
            });

            if (response.status === 409) {
                const errData = await response.json().catch(() => null);
                const duplicateMsg = errData?.error || `Duplicate Event ID detected: #${paymentId} has already been ingested. Idempotency Key conflict.`;
                setErrorMsg(duplicateMsg);
                if (onAlert) {
                    onAlert(`⚠️ Idempotency Conflict: #${paymentId} already recorded!`);
                }
                setIsSubmitting(false);
                return;
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                setErrorMsg(errData?.error || 'Failed to record transaction.');
                setIsSubmitting(false);
                return;
            }

            result = await response.json().catch(() => null);
        } catch (err) {
            console.warn('Payment API request encountered an error, falling back locally:', err);
        }

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const newTx: Transaction = {
            id: result?.payment?.id || paymentId,
            code: formattedCode,
            customer: result?.payment?.customer ?? newCustomer.trim(),
            product: result?.payment?.product ?? targetProduct,
            status: txStatus,
            totalRevenue: formattedRevenue,
            timestamp: timeStr,
            relativeTime: 'Just now',
        };

        onAddTransaction(newTx);

        setNewEventCode('');
        setNewCustomer('');
        setNewProduct('');
        setNewAmount('');
        setErrorMsg('');
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="text-base font-bold text-gray-900">
                        Add New Transaction
                    </h3>

                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                        ×
                    </button>
                </div>

                {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1 animate-in fade-in">
                        <div className="font-bold flex items-center gap-1.5 text-rose-700">
                            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Idempotency Engine Rejection</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-rose-800">{errorMsg}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Automatic Event Code Display (no manual input needed) */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                                Event Code (Automatic)
                            </span>
                            <span className="font-mono text-xs font-bold text-gray-900">
                                {newEventCode || '#evt_9414'}
                            </span>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-medium px-2 py-0.5 rounded-full flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Auto Idempotency Key
                        </span>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Customer Name
                        </label>

                        <input
                            required
                            value={newCustomer}
                            onChange={(e) => {
                                setNewCustomer(e.target.value);
                                if (errorMsg) setErrorMsg('');
                            }}
                            placeholder="e.g. Jordan Blake"
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Product / Plan
                        </label>

                        <input
                            value={newProduct}
                            onChange={(e) => {
                                setNewProduct(e.target.value);
                                if (errorMsg) setErrorMsg('');
                            }}
                            placeholder="e.g. Enterprise Cloud Annual"
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Amount ($ USD)
                        </label>

                        <input
                            required
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={newAmount}
                            onChange={(e) => {
                                setNewAmount(e.target.value);
                                if (errorMsg) setErrorMsg('');
                            }}
                            placeholder="e.g. 2400"
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? 'Verifying Idempotency...' : 'Save Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
