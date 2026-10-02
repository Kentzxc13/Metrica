"use client";

import React from 'react';
import { StartupProspect } from '@/types/screening';

interface StartupMemoModalProps {
    startup: StartupProspect | null;
    onClose: () => void;
    isBookmarked: boolean;
    onToggleBookmark: (id: string) => void;
    onShowToast: (msg: string) => void;
}

export function StartupMemoModal({
    startup,
    onClose,
    isBookmarked,
    onToggleBookmark,
    onShowToast
}: StartupMemoModalProps) {
    if (!startup) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-gray-200 shadow-floating space-y-4 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {startup.initial}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 tracking-tight">{startup.name}</h3>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                    {startup.stage}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400">{startup.sector} • {startup.verification.detail}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </button>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 leading-relaxed">
                    {startup.description}
                </p>

                {/* Unit Economics & Capital Efficiency */}
                <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Unit Economics &amp; Capital Efficiency</span>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase block font-semibold">LTV : CAC</span>
                            <span className="text-xs font-mono font-bold text-gray-900 mt-0.5 block">{startup.unitEconomics.ltvCac}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase block font-semibold">Gross Margin</span>
                            <span className="text-xs font-mono font-bold text-emerald-600 mt-0.5 block">{startup.unitEconomics.grossMargin}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase block font-semibold">Payback</span>
                            <span className="text-xs font-mono font-bold text-gray-900 mt-0.5 block">{startup.unitEconomics.paybackPeriod}</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] text-gray-400 uppercase block font-semibold">Magic Number</span>
                            <span className="text-xs font-mono font-bold text-gray-900 mt-0.5 block">{startup.unitEconomics.magicNumber}</span>
                        </div>
                    </div>
                </div>

                {/* Competitive Moat */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Algorithmic Moat Assessment</span>
                    <p className="text-xs text-gray-700 leading-relaxed">{startup.moat}</p>
                </div>

                {/* Screening Thesis */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">AI Investment Conviction</span>
                    <p className="text-xs text-gray-700 leading-relaxed italic">&ldquo;{startup.thesis}&rdquo;</p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <button
                        onClick={() => {
                            navigator.clipboard?.writeText?.(`${startup.name} Diligence Memo:\nARR: ${startup.arr} (${startup.yoyGrowth})\nValuation: ${startup.valuation}\nLTV:CAC: ${startup.unitEconomics.ltvCac}\nThesis: ${startup.thesis}`);
                            onShowToast(`Copied ${startup.name} memo to clipboard!`);
                        }}
                        className="px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                        Copy Summary
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onToggleBookmark(startup.id);
                                onClose();
                            }}
                            className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors">
                            {isBookmarked ? 'Remove from Pipeline' : 'Save to Pipeline'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
