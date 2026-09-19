"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
// Mock fallback commented out
// import { COMPANIES } from '@/data/companies';
import { Company } from '@/types/company';
import { AiScreeningModal } from '@/components/modals/AiScreeningModal';

// Module-level flag so it survives client-side page transitions (Comparison -> Dashboard -> Comparison),
// but cleanly resets on page refresh/initial reload so user can test the entrance animation.
let hasEverAnimatedComparison = false;

export default function CompanyComparisonPage() {
    const router = useRouter();
    const {
        selectedCompanyId,
        setSelectedCompanyId,
        companies,
        globalSearchQuery,
        showActionToast
    } = useDashboard();

    // Benchmark matrix one-time animation state across navigation
    const [shouldAnimateRows, setShouldAnimateRows] = useState<boolean>(() => hasEverAnimatedComparison);
    const [hasAlreadyAnimated, setHasAlreadyAnimated] = useState<boolean>(() => hasEverAnimatedComparison);
    const tableSectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (hasEverAnimatedComparison) {
            setShouldAnimateRows(true);
            setHasAlreadyAnimated(true);
            return;
        }

        const el = tableSectionRef.current;
        if (!el) return;

        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            setShouldAnimateRows(true);
            setHasAlreadyAnimated(true);
            hasEverAnimatedComparison = true;
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldAnimateRows(true);
                    hasEverAnimatedComparison = true;
                    setTimeout(() => {
                        setHasAlreadyAnimated(true);
                    }, 800);
                    observer.disconnect();
                }
            },
            {
                rootMargin: '0px 0px -60px 0px',
                threshold: 0.1,
            }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const [comparisonTierFilter, setComparisonTierFilter] = useState<'All' | 'Outperforming' | 'Moderate' | 'At Risk'>('All');
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
    const [comparisonSelectedRows, setComparisonSelectedRows] = useState<string[]>([]);
    const [modalCompany, setModalCompany] = useState<Company | null>(null);

    // Filter companies for benchmark matrix (driven by Global Search & Tier Filter)
    const filteredCompanies = companies.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              c.type.toLowerCase().includes(globalSearchQuery.toLowerCase());
        const matchesTier = comparisonTierFilter === 'All' || c.aiTier === comparisonTierFilter;
        return matchesSearch && matchesTier;
    });

    const handleSelectAllComparison = () => {
        if (comparisonSelectedRows.length === filteredCompanies.length) {
            setComparisonSelectedRows([]);
        } else {
            setComparisonSelectedRows(filteredCompanies.map(c => c.id));
        }
    };

    const handleToggleComparisonRow = (id: string) => {
        if (comparisonSelectedRows.includes(id)) {
            setComparisonSelectedRows(comparisonSelectedRows.filter(r => r !== id));
        } else {
            setComparisonSelectedRows([...comparisonSelectedRows, id]);
        }
    };

    return (
        <>
            {/* BEGIN: PageHeadingAndControls */}
            <section className="flex flex-wrap items-center justify-between gap-4" data-purpose="header-greeting-controls">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Comparison</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Benchmark matrix &amp; portfolio valuation tiers</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Back to Dashboard Button (Secondary Navigation) */}
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-black hover:bg-gray-50 text-xs font-medium transition-colors shadow-2xs cursor-pointer">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Back to Dashboard</span>
                    </Link>

                    {/* Export CSV (Primary Action - Standard Black) */}
                    <button
                        onClick={() => showActionToast('Portfolio Benchmark CSV exported successfully!')}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm cursor-pointer">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Export CSV</span>
                    </button>
                </div>
            </section>
            {/* END: PageHeadingAndControls */}

            {/* BEGIN: MetricCardsGrid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="kpi-metric-cards">
                {/* Card 1: Combined Portfolio MRR */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Total Portfolio MRR</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 tracking-tight font-mono">$337,600</div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-3"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-6"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                            </svg>
                            <span>+16.4% avg MoM</span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500" title="Combined across 4 portfolio SaaS entities">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Card 2: Portfolio Avg Churn Rate */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Avg Portfolio Churn</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 tracking-tight font-mono">6.9%</div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-5"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-6"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-3"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-7"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span>1 Outlier (&gt;10%) • Target &lt;5.0%</span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500" title="QuickBill exceeds 10% threshold">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Card 3: Total Active Subscribers */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Total Subscribers</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">3,290</span>
                                <span className="text-xs text-gray-400 font-normal">Accounts</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-6"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                            </svg>
                            <span>+9.8% expansion (Avg LTV: $10,975)</span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500" title="Active paying subscribers">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Card 4: Portfolio Capital Health */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Portfolio Status</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">75%</span>
                                <span className="text-xs text-gray-400 font-normal">On Track</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-5"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-6"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span>1 Risky (Caution)</span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500" title="Screening caution: QuickBill SaaS flagged as Risky">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </section>
            {/* END: MetricCardsGrid */}

            {/* Benchmark Matrix Table Container */}
            <section ref={tableSectionRef} className="bg-white rounded-2xl border border-gray-200/80 shadow-card p-5" data-purpose="benchmark-matrix">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Benchmark Matrix</h2>
                        <p className="text-xs text-gray-500">
                            Click any row to open that company&apos;s dashboard, or use the three dots <span className="font-mono">(...)</span> for quick actions.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {comparisonSelectedRows.length > 0 && (
                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2.5 py-1 rounded-lg">
                                {comparisonSelectedRows.length} selected
                            </span>
                        )}

                        {/* Tier Filter Tabs (Same design as Cap Table page) */}
                        <div className="flex items-center bg-gray-50 border border-gray-200/80 p-1 rounded-xl gap-1">
                            {(['All', 'Outperforming', 'Moderate', 'At Risk'] as const).map(tier => {
                                const count = tier === 'All'
                                    ? companies.length
                                    : companies.filter((c) => c.aiTier === tier).length;
                                const isActive = comparisonTierFilter === tier;
                                return (
                                    <button
                                        key={tier}
                                        onClick={() => setComparisonTierFilter(tier)}
                                        className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
                                            isActive
                                                ? 'bg-gray-900 text-white shadow-xs'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                                        }`}
                                    >
                                        <span>{tier === 'All' ? 'All Tiers' : tier}</span>
                                        <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-600'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto overflow-y-hidden" style={{ overflowY: 'hidden' }}>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[11px]">
                                <th className="py-3 px-2 w-8">
                                    <input
                                        type="checkbox"
                                        checked={comparisonSelectedRows.length === filteredCompanies.length && filteredCompanies.length > 0}
                                        onChange={handleSelectAllComparison}
                                        className="rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                                    />
                                </th>
                                <th className="py-3 px-3">Company</th>
                                <th className="py-3 px-3">MRR (Revenue)</th>
                                <th className="py-3 px-3">Churn Rate</th>
                                <th className="py-3 px-3">Customer LTV</th>
                                <th className="py-3 px-3">LTV : CAC</th>
                                <th className="py-3 px-3">Subscribers</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3 text-center w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                            {filteredCompanies.map((c, index) => {
                                const isCurrent = selectedCompanyId === c.id;
                                const rowClass = !shouldAnimateRows
                                    ? "event-row-hidden"
                                    : hasAlreadyAnimated
                                        ? "event-row-static event-row-interactive"
                                        : "event-row-animated event-row-interactive";

                                return (
                                    <tr
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedCompanyId(c.id);
                                            router.push('/');
                                        }}
                                        className={`hover:bg-gray-50/80 transition-colors cursor-pointer group ${
                                            isCurrent ? 'bg-zinc-50/60' : ''
                                        } ${rowClass}`}>
                                        {/* Checkbox */}
                                        <td className="py-3.5 px-2" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={comparisonSelectedRows.includes(c.id)}
                                                onChange={() => handleToggleComparisonRow(c.id)}
                                                className="rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                                            />
                                        </td>

                                        {/* Company */}
                                        <td className="py-3.5 px-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                                                    {c.initial}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-gray-900 group-hover:text-black transition-colors">
                                                            {c.name}
                                                        </span>
                                                        {isCurrent && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black text-white">
                                                                Active
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 block">{c.type}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* MRR Revenue */}
                                        <td className="py-3.5 px-3">
                                            <div className="font-bold text-gray-900 font-mono text-[13px]">{c.revenue}</div>
                                            <span className="text-[10px] text-gray-400">
                                                {c.revenueGrowth}
                                            </span>
                                        </td>

                                        {/* Churn Rate */}
                                        <td className="py-3.5 px-3">
                                            {c.highChurnWarning ? (
                                                <span className="font-mono font-bold text-rose-600 text-xs">
                                                    {c.churnRate}
                                                </span>
                                            ) : (
                                                <span className="font-mono font-medium text-gray-700 text-xs">
                                                    {c.churnRate}
                                                </span>
                                            )}
                                        </td>

                                        {/* Customer LTV */}
                                        <td className="py-3.5 px-3 font-mono font-medium text-gray-900 text-xs">
                                            {c.ltv}
                                        </td>

                                        {/* LTV : CAC */}
                                        <td className="py-3.5 px-3 font-mono font-medium text-gray-900 text-xs">
                                            {c.ltvCac}
                                        </td>

                                        {/* Subscribers */}
                                        <td className="py-3.5 px-3 font-mono font-medium text-gray-700 text-xs">
                                            {c.subscribers}
                                        </td>

                                        {/* Status / AI Tier Bubble Pill */}
                                        <td className="py-3.5 px-3">
                                            {c.aiTier === 'At Risk' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 shadow-2xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                    <span>At Risk</span>
                                                </span>
                                            ) : c.aiTier === 'Moderate' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 shadow-2xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                    <span>Moderate</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-2xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    <span>Outperforming</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions Column */}
                                        <td className="py-3.5 px-3 text-center w-20" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative inline-flex items-center justify-center">
                                                <button
                                                    onClick={() => setActiveActionMenuId(activeActionMenuId === c.id ? null : c.id)}
                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-700 shadow-2xs transition-colors cursor-pointer ${
                                                        activeActionMenuId === c.id ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-200' : ''
                                                    }`}
                                                    title="Company actions">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                                    </svg>
                                                </button>

                                                {/* Contextual Action Dropdown */}
                                                {activeActionMenuId === c.id && (
                                                    <div
                                                        className={`absolute right-0 ${index >= filteredCompanies.length - 2 ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-52 bg-white rounded-xl shadow-floating border border-gray-200/90 py-1.5 z-40 text-left animate-in fade-in zoom-in-95`}>
                                                        <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                                            {c.name}
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCompanyId(c.id);
                                                                setActiveActionMenuId(null);
                                                                router.push('/');
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                            </svg>
                                                            <span>Open Dashboard</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setModalCompany(c);
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                            </svg>
                                                            <span>View AI Evaluation</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard?.writeText?.(`${c.name} Metrics:\nMRR: ${c.revenue} (${c.revenueGrowth})\nChurn: ${c.churnRate}\nLTV: ${c.ltv}\nLTV:CAC: ${c.ltvCac}\nSubscribers: ${c.subscribers}\nStatus: ${c.aiTier}`);
                                                                showActionToast(`Copied ${c.name} metrics to clipboard!`);
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                            </svg>
                                                            <span>Copy Metric Summary</span>
                                                        </button>
                                                        <div className="border-t border-gray-100 my-1"></div>
                                                        <button
                                                            onClick={() => {
                                                                showActionToast(`Exported ${c.name} benchmark CSV.`);
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                            </svg>
                                                            <span>Export Report (.csv)</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* AI Evaluation Modal if triggered from action menu */}
            {modalCompany && (
                <AiScreeningModal
                    isOpen={!!modalCompany}
                    onClose={() => setModalCompany(null)}
                    company={modalCompany}
                />
            )}
        </>
    );
}
