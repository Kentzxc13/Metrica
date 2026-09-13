"use client";

import React, { useState } from 'react';
import { Transaction } from '@/types/company';

interface AddPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTransaction: (tx: Transaction) => void;
    companyId: string;
}

export function AddPaymentModal({
    isOpen,
    onClose,
    onAddTransaction,
    companyId
}: AddPaymentModalProps) {
    const [newCustomer, setNewCustomer] = useState<string>('');
    const [newProduct, setNewProduct] = useState<string>('');
    const [newAmount, setNewAmount] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newCustomer || !newAmount) return;

        const paymentId = `PAY-${Date.now()}`;

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    payment_id: paymentId,
                    company_id: companyId,
                    amount: Number(newAmount),
                    currency: 'PHP',
                    payment_timestamp: new Date().toISOString(),
                    customer: newCustomer,
                    product: newProduct || 'Standard SaaS License',
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('Payment API error:', result);
                return;
            }

            const newTx: Transaction = {
                id: result.payment.id,
                code: `#${result.payment.payment_id}`,
                customer: result.payment.customer ?? newCustomer,
                product: result.payment.product ?? newProduct,
                status: 'Success',
                qty: 1,
                unitPrice: `₱${Number(result.payment.amount).toLocaleString()}`,
                totalRevenue: `₱${Number(result.payment.amount).toLocaleString()}`,
            };

            onAddTransaction(newTx);

            setNewCustomer('');
            setNewProduct('');
            setNewAmount('');
            onClose();
        } catch (error) {
            console.error('Failed to submit payment:', error);
        }
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

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Customer Name
                        </label>

                        <input
                            required
                            value={newCustomer}
                            onChange={(e) => setNewCustomer(e.target.value)}
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
                            onChange={(e) => setNewProduct(e.target.value)}
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
                            onChange={(e) => setNewAmount(e.target.value)}
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
                            className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                        >
                            Save Transaction
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}