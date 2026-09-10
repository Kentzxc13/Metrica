"use client";

import React from 'react';
import { AuditLedgerEvent } from '@/types/ledger';

interface AuditEventModalProps {
    event: AuditLedgerEvent | null;
    onClose: () => void;
    onShowToast: (msg: string) => void;
}

export function AuditEventModal({ event, onClose, onShowToast }: AuditEventModalProps) {
    if (!event) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-gray-200 shadow-floating space-y-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-bold text-gray-900 tracking-tight">{event.code}</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                event.status === 'Delivered 200 OK'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : event.status === 'Failed 402'
                                    ? 'bg-rose-50 text-rose-700'
                                    : 'bg-amber-50 text-amber-700'
                            }`}>
                                {event.status}
                            </span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono mt-0.5 block">{event.name}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </button>
                </div>

                {/* Audit Details Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-gray-100 rounded-xl bg-gray-50/70 p-3">
                    <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Customer</span>
                        <span className="font-bold text-gray-900 text-xs block mt-0.5">{event.customer}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Workspace</span>
                        <span className="font-bold text-gray-900 text-xs block mt-0.5">{event.company}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">MRR Movement</span>
                        <span className={`font-mono font-bold text-xs block mt-0.5 ${
                            event.isPositive ? 'text-emerald-600' : event.isNegative ? 'text-rose-600' : 'text-gray-600'
                        }`}>
                            {event.mrrDelta}
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Timestamp</span>
                        <span className="font-mono text-gray-900 text-xs block mt-0.5">{event.timestamp}</span>
                    </div>
                </div>

                {/* Verification & Gateway Meta */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-medium">Gateway Ingestion:</span>
                        <span className="font-semibold text-gray-800">{event.gateway}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-medium">Stripe / Invoice Ref:</span>
                        <span className="font-mono font-semibold text-gray-900">{event.payload.invoiceId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-medium">IP &amp; Geographic Origin:</span>
                        <span className="font-mono text-gray-700">{event.payload.customerIp} ({event.payload.geo})</span>
                    </div>
                    {event.payload.cardBrand && (
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 font-medium">Payment Instrument:</span>
                            <span className="text-gray-800">{event.payload.cardBrand} •••• {event.payload.cardLast4}</span>
                        </div>
                    )}
                    {event.payload.failureReason && (
                        <div className="flex items-start justify-between text-rose-600 pt-1 border-t border-gray-100">
                            <span className="font-medium">Failure Reason:</span>
                            <span className="font-semibold text-right max-w-xs">{event.payload.failureReason}</span>
                        </div>
                    )}
                </div>

                {/* Raw Webhook JSON Payload */}
                <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Raw Webhook Cryptographic Telemetry</span>
                    <pre className="bg-[#18181b] text-[#f4f4f5] p-3 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40 leading-relaxed">
{JSON.stringify({
    event_id: event.code,
    type: event.name,
    category: event.category,
    customer: event.customer,
    company_workspace: event.company,
    mrr_delta: event.mrrDelta,
    timestamp: event.timestamp,
    signature: event.payload.signature,
    meta: {
        invoice: event.payload.invoiceId,
        ip: event.payload.customerIp,
        origin: event.payload.geo,
        gateway: event.gateway
    }
}, null, 2)}
                    </pre>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <button
                        onClick={() => {
                            navigator.clipboard?.writeText?.(JSON.stringify(event, null, 2));
                            onShowToast(`Copied ${event.code} telemetry payload to clipboard!`);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Copy Raw JSON</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors">
                        Close Inspector
                    </button>
                </div>
            </div>
        </div>
    );
}
