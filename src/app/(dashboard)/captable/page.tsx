"use client";

import { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { CapTableHolding } from '@/types/captable';
import { CapTableInspectorModal } from '@/components/modals/CapTableInspectorModal';

export default function CapTableOwnershipPage() {
    const { globalSearchQuery, showActionToast } = useDashboard();

    const [capTableHoldings, setCapTableHoldings] = useState<CapTableHolding[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [capTableStageFilter, setCapTableStageFilter] = useState<'All' | 'Series A' | 'Seed'>('All');
    const [selectedHoldingForModal, setSelectedHoldingForModal] = useState<CapTableHolding | null>(null);

    useEffect(() => {
        const loadCapTable = async () => {
            try {
                setIsLoading(true);

                const response = await fetch('/api/captable');

                if (!response.ok) {
                    throw new Error('Failed to load cap table');
                }

                const data = await response.json();

                setCapTableHoldings(data.holdings || []);
            } catch (error) {
                console.error('Failed to load cap table:', error);
                setCapTableHoldings([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadCapTable();
    }, []);

    // Filtered holdings (driven by Global Header Search & Stage Filter)
    const filteredCapTableHoldings = capTableHoldings.filter(h => {
        const matchesSearch = h.companyName.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              h.ticker.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              h.sector.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              h.shareClass.toLowerCase().includes(globalSearchQuery.toLowerCase());
        const matchesStage = capTableStageFilter === 'All' || h.stage === capTableStageFilter;
        return matchesSearch && matchesStage;
    });

    const totalInvested = capTableHoldings.reduce(
        (total, holding) => total + Number(holding.capitalInvested || 0),
        0
    );

    const totalFairValue = capTableHoldings.reduce(
        (total, holding) => total + Number(holding.currentFairValue || 0),
        0
    );

    const totalUnrealizedGain = totalFairValue - totalInvested;

    const weightedMoic =
        totalInvested > 0 ? totalFairValue / totalInvested : 0;

    const weightedIrr =
        totalInvested > 0
            ? capTableHoldings.reduce(
                  (total, holding) =>
                      total +
                      Number(holding.irr || 0) *
                          Number(holding.capitalInvested || 0),
                  0
              ) / totalInvested
            : 0;

    const formatKpiMoney = (value: number) => {
        if (Math.abs(value) >= 1_000_000) {
            return '$' + (value / 1_000_000).toFixed(2) + 'M';
        }

        if (Math.abs(value) >= 1_000) {
            return '$' + (value / 1_000).toFixed(0) + 'K';
        }

        return '$' + value.toLocaleString('en-US');
    };

    return (
        <>
            {/* Section 1: Page Heading and Filter Controls */}
            <section className="flex flex-wrap items-center justify-between gap-4" data-purpose="captable-header-controls">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Cap Table &amp; Ownership</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Portfolio capital allocation, equity ownership &amp; investment return multiples</p>
                </div>
                <div className="flex items-center gap-2.5">
                    {/* Export Cap Table CSV */}
                    <button
                        onClick={() => {
                            showActionToast('Cap Table & Ownership Matrix exported to CSV.');
                        }}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Export Cap Table</span>
                    </button>
                </div>
            </section>

            {/* Section 2: Fund Performance Metric Strip (4 KPI Cards) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="captable-kpi-cards">
                {/* Card 1: Total Capital Invested */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Total Invested</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold font-mono text-gray-900 tracking-tight">
                                    {isLoading ? '—' : formatKpiMoney(totalInvested)}
                                </span>
                                <span className="text-xs text-gray-400 font-normal">Deployed</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-6"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">5 Active Venture Checks</span>
                        <span className="text-[10px] text-gray-400 font-mono">100% Called</span>
                    </div>
                </div>

                {/* Card 2: Portfolio Net Fair Value */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Portfolio Net Value</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold font-mono text-gray-900 tracking-tight">
                                    {isLoading ? '—' : formatKpiMoney(totalFairValue)}
                                </span>
                                <span className="text-xs text-emerald-600 font-medium">
                                    {isLoading ? '—' : formatKpiMoney(totalUnrealizedGain)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-3"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-6"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-7"></div>
                            <div className="w-1 bg-emerald-500 rounded-full h-8"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                            </svg>
                            <span>+134.4% net unrealized gain</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">Fair Value</span>
                    </div>
                </div>

                {/* Card 3: Unrealized MOIC Multiple */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Net Portfolio MOIC</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold font-mono text-gray-900 tracking-tight">
                                    {isLoading ? '—' : `${weightedMoic.toFixed(2)}x`}
                                </span>
                                <span className="text-xs text-gray-400 font-normal">Multiple</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-5"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-6"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                            </svg>
                            <span>Top Quartile Benchmark</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">Unrealized</span>
                    </div>
                </div>

                {/* Card 4: Blended Net IRR */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Blended Portfolio IRR</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold font-mono text-gray-900 tracking-tight">
                                    {isLoading ? '—' : `+${weightedIrr.toFixed(1)}%`}
                                </span>
                                <span className="text-xs text-emerald-600 font-normal">Annualized</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-3"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-6"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">Vintage 2023 - 2024</span>
                        <span className="text-[10px] text-gray-400 font-mono">Net of Carry</span>
                    </div>
                </div>
            </section>

            {/* Section 3: Master Cap Table & Ownership Matrix Table */}
            <section className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card" data-purpose="captable-table">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs uppercase font-bold tracking-wider text-gray-500">Venture Equity Allocation &amp; Cap Table Matrix</h2>
                        <span className="text-xs text-gray-400 font-normal">({filteredCapTableHoldings.length} holdings)</span>
                    </div>

                    {/* Stage Filter Tabs (Placed inside the table container) */}
                    <div className="inline-flex items-center rounded-xl bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
                        {(['All', 'Series A', 'Seed'] as const).map(stage => {
                            const count = stage === 'All' 
                                ? capTableHoldings.length 
                                : capTableHoldings.filter(h => h.stage === stage).length;
                            const isActive = capTableStageFilter === stage;
                            return (
                                <button
                                    key={stage}
                                    onClick={() => setCapTableStageFilter(stage)}
                                    className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                                        isActive 
                                            ? 'bg-white text-black font-semibold shadow-xs' 
                                            : 'hover:text-black'
                                    }`}
                                >
                                    <span>{stage === 'All' ? 'All Stages' : stage}</span>
                                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                                        isActive ? 'bg-gray-100 text-gray-900 font-medium' : 'bg-gray-200/70 text-gray-500'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600">
                        <thead>
                            <tr className="border-b border-gray-200/80 text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50/50">
                                <th className="py-3 px-3">Venture &amp; Sector</th>
                                <th className="py-3 px-3">Stage &amp; Share Class</th>
                                <th className="py-3 px-3 text-right">Capital Invested</th>
                                <th className="py-3 px-3 text-right">Ownership %</th>
                                <th className="py-3 px-3 text-right">Post-Money Val</th>
                                <th className="py-3 px-3 text-right">Holding Net Value</th>
                                <th className="py-3 px-3 text-center">Unrealized MOIC</th>
                                <th className="py-3 px-3">Governance / Rights</th>
                                <th className="py-3 px-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading && (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400">
                                        Loading cap table...
                                    </td>
                                </tr>
                            )}

                            {!isLoading && filteredCapTableHoldings.map((h) => (
                                <tr
                                    key={h.id}
                                    onClick={() => setSelectedHoldingForModal(h)}
                                    className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                                >
                                    {/* Venture Column: Monogram + Ticker */}
                                    <td className="py-3.5 px-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                                                {h.initials}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-bold text-gray-900 group-hover:text-black">{h.companyName}</span>
                                                    <span className="font-mono text-[10px] text-gray-400">{h.ticker}</span>
                                                </div>
                                                <div className="text-[11px] text-gray-400 truncate max-w-[200px]">{h.sector}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Stage & Share Class - clean, no bubbles */}
                                    <td className="py-3.5 px-3">
                                        <div>
                                            <div className="font-semibold text-gray-900">{h.stage}</div>
                                            <div className="text-[11px] text-gray-400 font-mono truncate max-w-[160px]">{h.shareClass}</div>
                                        </div>
                                    </td>

                                    {/* Capital Invested */}
                                    <td className="py-3.5 px-3 text-right font-mono font-semibold text-gray-900">
                                        {h.capitalInvestedFormatted}
                                    </td>

                                    {/* Ownership % - clean text */}
                                    <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">
                                        {h.equityPercent.toFixed(1)}%
                                    </td>

                                    {/* Post-Money Valuation */}
                                    <td className="py-3.5 px-3 text-right font-mono text-gray-700">
                                        {h.postMoneyValuationFormatted}
                                    </td>

                                    {/* Current Net Fair Value */}
                                    <td className="py-3.5 px-3 text-right">
                                        <div className="font-mono font-bold text-gray-900">{h.currentFairValueFormatted}</div>
                                        <div className="text-[10px] font-mono text-emerald-600 font-medium">{h.unrealizedGainFormatted}</div>
                                    </td>

                                    {/* Unrealized MOIC - clean font-mono text, no bubble */}
                                    <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-emerald-600">
                                        {h.moic.toFixed(2)}x
                                    </td>

                                    {/* Governance / Rights - clean text, no bubbles */}
                                    <td className="py-3.5 px-3">
                                        <div>
                                            <div className="font-medium text-gray-900">{h.boardRole === 'Board Director' ? 'Director' : 'Observer'}</div>
                                            {h.proRataRights && (
                                                <div className="text-[10px] text-gray-400 font-mono">Pro-Rata Rights</div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Action - 3 dots */}
                                    <td className="py-3.5 px-3 text-center">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedHoldingForModal(h);
                                            }}
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-700 shadow-2xs transition-colors cursor-pointer"
                                            title="Inspect Cap Table & Pro-Rata"
                                        >
                                            <svg className="w-3.5 h-3.5 inline" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {!isLoading && filteredCapTableHoldings.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400">
                                        No portfolio ventures match your search criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Cap Table & Dilution Inspector Modal */}
            <CapTableInspectorModal
                holding={selectedHoldingForModal}
                onClose={() => setSelectedHoldingForModal(null)}
                onShowToast={showActionToast}
            />
        </>
    );
}