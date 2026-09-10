"use client";

import React from 'react';
import { Company } from '@/types/company';

interface AiScreeningModalProps {
    isOpen: boolean;
    onClose: () => void;
    company: Company;
}

export function AiScreeningModal({ isOpen, onClose, company }: AiScreeningModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">✨</span>
                        <h3 className="text-base font-bold text-gray-900">AI Screening Evaluation</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold">Analyzed Company</span>
                            <span className="text-sm font-bold text-gray-900">{company.name}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-400 uppercase tracking-wider block font-semibold">AI Risk Tier</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                company.aiTier === 'Prime' ? 'bg-emerald-100 text-emerald-800' :
                                company.aiTier === 'Good' ? 'bg-blue-100 text-blue-800' :
                                'bg-rose-100 text-rose-800'
                            }`}>
                                {company.aiTier} ({company.aiScore}/100)
                            </span>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 space-y-1.5">
                        <span className="text-xs font-semibold text-gray-700 block">AI Screening Rationale:</span>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {company.aiRationale}
                        </p>
                    </div>

                    {company.highChurnWarning && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                            <span className="text-base">⚠️</span>
                            <div>
                                <span className="font-bold block">Elevated Churn Rate Alert</span>
                                <span>Current churn rate ({company.churnRate}) exceeds 10%. High probability of revenue attrition.</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors">
                        Close Insight
                    </button>
                </div>
            </div>
        </div>
    );
}
