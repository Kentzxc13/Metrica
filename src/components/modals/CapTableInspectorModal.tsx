"use client";

import React, { useState } from 'react';
import { CapTableHolding } from '@/types/captable';

interface CapTableInspectorModalProps {
    holding: CapTableHolding | null;
    onClose: () => void;
    onShowToast: (msg: string) => void;
}

export function CapTableInspectorModal({
    holding,
    onClose,
    onShowToast
}: CapTableInspectorModalProps) {
    const [simulatedRaiseAmount, setSimulatedRaiseAmount] = useState<number>(10000000);
    const [simulatedPreMoneyVal, setSimulatedPreMoneyVal] = useState<number>(60000000);

    if (!holding) return null;

    const postMoneyVal = simulatedPreMoneyVal + simulatedRaiseAmount;
    const proRataCheckNeeded = simulatedRaiseAmount * (holding.equityPercent / 100);
    const proRataStakeVal = postMoneyVal * (holding.equityPercent / 100);
    const dilutedPercent = holding.equityPercent * (simulatedPreMoneyVal / postMoneyVal);
    const dilutedStakeVal = postMoneyVal * (dilutedPercent / 100);

    const formatCurrencyShort = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
        return `$${val.toLocaleString()}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-gray-200 shadow-floating space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
                {/* Modal Header: Monochromatic Initial & Venture Details */}
                <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white font-mono font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {holding.initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 tracking-tight">{holding.companyName}</h3>
                                <span className="font-mono text-xs text-gray-400 font-semibold">{holding.ticker}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200/60">
                                    {holding.stage}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                {holding.sector} • <span className="font-mono text-gray-600 font-medium">{holding.shareClass}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Close Inspector"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </button>
                </div>

                {/* Section 1: 4 Key Investment Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-gray-100 rounded-xl bg-gray-50/70 p-3">
                    <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Aris&apos;s Stake</span>
                        <div className="font-mono font-bold text-gray-900 text-xs mt-0.5">{holding.equityPercent.toFixed(1)}%</div>
                        <span className="text-[10px] text-gray-400 font-mono block">{holding.sharesOwned} shs</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Capital Invested</span>
                        <div className="font-mono font-bold text-gray-900 text-xs mt-0.5">{holding.capitalInvestedFormatted}</div>
                        <span className="text-[10px] text-gray-400 font-mono block">@{holding.pricePerShare}/sh</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Fair Net Value</span>
                        <div className="font-mono font-bold text-gray-900 text-xs mt-0.5">{holding.currentFairValueFormatted}</div>
                        <span className="text-[10px] text-emerald-600 font-mono font-medium block">{holding.unrealizedGainFormatted}</span>
                    </div>
                    <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Return Multiple</span>
                        <div className="font-mono font-bold text-emerald-600 text-xs mt-0.5">{holding.moic.toFixed(2)}x MOIC</div>
                        <span className="text-[10px] text-gray-500 font-mono block">+{holding.irr.toFixed(1)}% IRR</span>
                    </div>
                </div>

                {/* Section 2: Fully Diluted Shareholder Ownership Stacked Bar (Monochrome) */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                            Fully Diluted Shareholder Structure
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">Post-Money Cap Table</span>
                    </div>

                    {/* Stacked Bar */}
                    <div className="h-3.5 w-full bg-gray-200 rounded-lg overflow-hidden flex shadow-xs">
                        <div
                            style={{ width: `${holding.foundersEquity}%` }}
                            className="bg-zinc-800 h-full relative group transition-all"
                            title={`Founders & Early Team: ${holding.foundersEquity}%`}
                        />
                        <div
                            style={{ width: `${holding.equityPercent}%` }}
                            className="bg-zinc-950 h-full border-x border-white/20 relative group transition-all"
                            title={`Aris Vance: ${holding.equityPercent}%`}
                        />
                        <div
                            style={{ width: `${holding.otherInvestorsEquity}%` }}
                            className="bg-zinc-500 h-full relative group transition-all"
                            title={`Co-Investors & Syndicates: ${holding.otherInvestorsEquity}%`}
                        />
                        <div
                            style={{ width: `${holding.esopPool}%` }}
                            className="bg-zinc-300 h-full relative group transition-all"
                            title={`Employee Option Pool (ESOP): ${holding.esopPool}%`}
                        />
                    </div>

                    {/* Legend: Clean Grayscale */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800 shrink-0"></div>
                            <span className="text-gray-600">Founders ({holding.foundersEquity}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-950 ring-1 ring-zinc-700 shrink-0"></div>
                            <span className="font-bold text-gray-900">Aris Vance ({holding.equityPercent}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-500 shrink-0"></div>
                            <span className="text-gray-600">Syndicates ({holding.otherInvestorsEquity}%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-300 shrink-0"></div>
                            <span className="text-gray-600">ESOP ({holding.esopPool}%)</span>
                        </div>
                    </div>
                </div>

                {/* Section 3: Legal Terms & Protective Governance Provisions */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block">
                        Investment Agreement &amp; Protective Rights
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-white rounded-lg p-2.5 border border-gray-200/70">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Liquidation Preference</span>
                            <span className="font-mono text-gray-900 font-medium text-[11px] block mt-0.5">{holding.liquidationPref}</span>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-gray-200/70">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Anti-Dilution Protection</span>
                            <span className="font-mono text-gray-900 font-medium text-[11px] block mt-0.5">{holding.antiDilution}</span>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-gray-200/70">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Board Representation</span>
                            <span className="text-gray-900 font-medium text-[11px] block mt-0.5">
                                {holding.boardRole === 'Board Director' ? '🏛️ Full Board Director Seat (Voting)' : '👁️ Board Observer & Information Rights'}
                            </span>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-gray-200/70">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase block">Pro-Rata Rights</span>
                            <span className="text-emerald-700 font-medium text-[11px] block mt-0.5">
                                {holding.proRataRights ? '✓ Super Pro-Rata Right Guaranteed' : 'Standard participation'}
                            </span>
                        </div>
                    </div>
                    <div className="text-[11px] text-gray-500 italic pt-1">
                        &ldquo;{holding.latestFundingNote}&rdquo;
                    </div>
                </div>

                {/* Section 4: Interactive Next-Round Dilution & Pro-Rata Simulator */}
                <div className="bg-white border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                        <div>
                            <span className="text-xs font-bold text-gray-900 block">Next Round Pro-Rata &amp; Dilution Modeling Engine</span>
                            <span className="text-[10px] text-gray-400">Simulate upcoming financing round scenarios</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200/60">
                            Priced Round Simulator
                        </span>
                    </div>

                    {/* Simulation Parameters (Pills) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                            <label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Target Raise</label>
                            <div className="flex items-center gap-1.5">
                                {[5000000, 10000000, 15000000, 20000000].map(amount => (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => setSimulatedRaiseAmount(amount)}
                                        className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
                                            simulatedRaiseAmount === amount
                                                ? 'bg-zinc-900 text-white font-bold shadow-xs'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                        }`}
                                    >
                                        {formatCurrencyShort(amount)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-semibold text-gray-400 block mb-1">Pre-Money Valuation</label>
                            <div className="flex items-center gap-1.5">
                                {[40000000, 60000000, 80000000, 100000000].map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setSimulatedPreMoneyVal(val)}
                                        className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all ${
                                            simulatedPreMoneyVal === val
                                                ? 'bg-zinc-900 text-white font-bold shadow-xs'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                        }`}
                                    >
                                        {formatCurrencyShort(val)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Outcome Comparison: Option A vs Option B */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {/* Option A: Exercise Pro-Rata */}
                        <div className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-900">Option A: Exercise Pro-Rata</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                    Maintain {holding.equityPercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="space-y-1 text-xs pt-1">
                                <div className="flex justify-between text-gray-500">
                                    <span>Check to Write:</span>
                                    <span className="font-mono font-bold text-gray-900">{formatCurrencyShort(proRataCheckNeeded)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Post-Round Value:</span>
                                    <span className="font-mono font-bold text-emerald-600">{formatCurrencyShort(proRataStakeVal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 text-[11px]">
                                    <span>Implied Post-Money:</span>
                                    <span className="font-mono text-gray-700">{formatCurrencyShort(postMoneyVal)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Option B: Pass / Dilute */}
                        <div className="p-3 rounded-xl border border-gray-200/80 bg-gray-50/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-900">Option B: Pass / Diluted</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-gray-200 text-gray-700 font-mono">
                                    Dilutes to {dilutedPercent.toFixed(1)}%
                                </span>
                            </div>
                            <div className="space-y-1 text-xs pt-1">
                                <div className="flex justify-between text-gray-500">
                                    <span>Check to Write:</span>
                                    <span className="font-mono font-bold text-gray-900">$0.00</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Post-Round Value:</span>
                                    <span className="font-mono font-bold text-gray-900">{formatCurrencyShort(dilutedStakeVal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-500 text-[11px]">
                                    <span>Ownership Loss:</span>
                                    <span className="font-mono text-rose-600">-{(holding.equityPercent - dilutedPercent).toFixed(2)}% dilution</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Actions Footer */}
                <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                    <button
                        onClick={() => {
                            const summaryText = `${holding.companyName} (${holding.ticker}) Cap Table Dossier:\nStage: ${holding.stage} (${holding.shareClass})\nCapital Invested: ${holding.capitalInvestedFormatted}\nOwnership: ${holding.equityPercent}%\nFair Value: ${holding.currentFairValueFormatted} (${holding.unrealizedGainFormatted})\nMOIC: ${holding.moic.toFixed(2)}x | IRR: ${holding.irr}%\nGovernance: ${holding.boardRole} | Pro-Rata: ${holding.proRataRights ? 'Yes' : 'No'}\nFounders: ${holding.foundersEquity}% | Aris Vance: ${holding.equityPercent}% | Syndicates: ${holding.otherInvestorsEquity}% | ESOP: ${holding.esopPool}%\nLiquidation Pref: ${holding.liquidationPref}`;
                            navigator.clipboard?.writeText?.(summaryText);
                            onShowToast(`Copied ${holding.companyName} cap table summary to clipboard!`);
                        }}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Copy Cap Table Dossier</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                        Close Inspector
                    </button>
                </div>
            </div>
        </div>
    );
}
