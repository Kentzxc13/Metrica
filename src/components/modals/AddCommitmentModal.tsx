"use client";

import React, { useState } from 'react';
import { BoardCommitment } from '@/types/governance';

interface AddCommitmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    meetingId: string;
    companyId: string;
    companyName: string;
    onCommitmentAdded: (commitment: BoardCommitment) => void;
    onShowToast?: (message: string) => void;
}

export function AddCommitmentModal({
    isOpen,
    onClose,
    meetingId,
    companyId,
    companyName,
    onCommitmentAdded,
    onShowToast,
}: AddCommitmentModalProps) {
    const [title, setTitle] = useState('');
    const [owner, setOwner] = useState('');
    const [targetDeadline, setTargetDeadline] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const cleanTitle = title.trim();
        const cleanOwner = owner.trim();
        const cleanDeadline = targetDeadline.trim();

        if (!cleanTitle) {
            setErrorMessage('Please enter a commitment title.');
            return;
        }
        if (!cleanOwner) {
            setErrorMessage('Please enter a lead / owner.');
            return;
        }
        if (!cleanDeadline) {
            setErrorMessage('Please enter a target deadline.');
            return;
        }

        try {
            setIsSaving(true);

            const response = await fetch('/api/governance/commitments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    companyId: companyId || 'comp_cloudnest',
                    meetingId: meetingId || 'bm-2',
                    title: cleanTitle,
                    status: 'in_progress',
                    owner: cleanOwner,
                    targetDeadline: cleanDeadline,
                }),
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                throw new Error(json.error || 'Failed to save board commitment.');
            }

            const saved = json.commitment || {};

            const newCommitment: BoardCommitment = {
                id: saved.id || `c-${Date.now()}`,
                title: cleanTitle,
                owner: cleanOwner,
                targetDeadline: cleanDeadline,
                status: 'in_progress',
                resolutionNote: saved.resolutionNote || undefined,
            };

            onCommitmentAdded(newCommitment);
            onShowToast?.(`Recorded new board mandate: "${cleanTitle}"`);
            onClose();

            // Reset form
            setTitle('');
            setOwner('');
            setTargetDeadline('');
        } catch (err: any) {
            console.error('Save commitment failed:', err);
            // Fallback: If DB insertion fails (e.g. offline or uuid mismatch), still allow local commitment creation
            const fallbackCommitment: BoardCommitment = {
                id: `c-local-${Date.now()}`,
                title: cleanTitle,
                owner: cleanOwner,
                targetDeadline: cleanDeadline,
                status: 'in_progress',
            };
            onCommitmentAdded(fallbackCommitment);
            onShowToast?.(`Recorded board mandate locally: "${cleanTitle}"`);
            onClose();
            setTitle('');
            setOwner('');
            setTargetDeadline('');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-900 shrink-0"></span>
                            <h3 className="text-base font-bold text-gray-900 tracking-tight">
                                Record Board Commitment
                            </h3>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Add a strategic mandate for {companyName || 'the executive team'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        title="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="text-gray-400 font-medium">Quick Suggestions:</span>
                    <button
                        type="button"
                        onClick={() => {
                            setTitle('Hire VP of Enterprise Sales');
                            setOwner('CEO & Head of Talent');
                            setTargetDeadline('Q1 2026');
                        }}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                        VP Enterprise Sales
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setTitle('SOC2 Type II external re-audit signoff');
                            setOwner('VP Security & Infra');
                            setTargetDeadline('Dec 15, 2025');
                        }}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                        SOC2 Re-audit
                    </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                    <div>
                        <label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">
                            Commitment Mandate / Deliverable Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Complete SOC2 Type II audit remediation"
                            disabled={isSaving}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">
                                Lead / Owner
                            </label>
                            <input
                                type="text"
                                value={owner}
                                onChange={(e) => setOwner(e.target.value)}
                                placeholder="e.g. VP Engineering / CFO"
                                disabled={isSaving}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 block mb-1">
                                Target Deadline
                            </label>
                            <input
                                type="text"
                                value={targetDeadline}
                                onChange={(e) => setTargetDeadline(e.target.value)}
                                placeholder="e.g. Jan 31, 2026"
                                disabled={isSaving}
                                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60"
                        >
                            {isSaving ? (
                                <>
                                    <svg
                                        className="w-3.5 h-3.5 animate-spin text-white"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8H4z"
                                        ></path>
                                    </svg>
                                    <span>Saving to Ledger...</span>
                                </>
                            ) : (
                                <span>Save Commitment</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
