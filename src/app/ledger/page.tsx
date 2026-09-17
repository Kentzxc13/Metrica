"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { INITIAL_AUDIT_EVENTS } from '@/data/auditEvents';
import { AuditLedgerEvent } from '@/types/ledger';
import { AuditEventModal } from '@/components/modals/AuditEventModal';
import { formatTimeClean, getRelativeTime } from '@/utils/time';

// Module-level flag so it survives client-side page transitions (Ledger -> Dashboard -> Ledger),
// but cleanly resets on page refresh/initial reload so user can test the entrance animation.
let hasEverAnimatedLedger = false;

export default function EventLedgerPage() {
    const { globalSearchQuery, showActionToast } = useDashboard();

    // One-time staggered row animation state across navigation
    const [shouldAnimateRows, setShouldAnimateRows] = useState<boolean>(() => hasEverAnimatedLedger);
    const [hasAlreadyAnimated, setHasAlreadyAnimated] = useState<boolean>(() => hasEverAnimatedLedger);
    const tableSectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (hasEverAnimatedLedger) {
            setShouldAnimateRows(true);
            setHasAlreadyAnimated(true);
            return;
        }

        const el = tableSectionRef.current;
        if (!el) return;

        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            setShouldAnimateRows(true);
            setHasAlreadyAnimated(true);
            hasEverAnimatedLedger = true;
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldAnimateRows(true);
                    hasEverAnimatedLedger = true;
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

    // Periodic ticker so relative time (e.g. 2m ago) updates automatically every 30s
    const [, setTimeTick] = useState<number>(0);
    useEffect(() => {
        const timer = window.setInterval(() => {
            setTimeTick(t => t + 1);
        }, 30000);
        return () => window.clearInterval(timer);
    }, []);

    const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<string>('All Events');
    const [isLedgerDropdownOpen, setIsLedgerDropdownOpen] = useState<boolean>(false);
    const [selectedAuditEvent, setSelectedAuditEvent] = useState<AuditLedgerEvent | null>(null);
    const [activeLedgerMenuId, setActiveLedgerMenuId] = useState<string | null>(null);

    const ledgerCategories = useMemo(() => {
        const unique = Array.from(new Set(INITIAL_AUDIT_EVENTS.map(e => e.category)));
        return ['All Events', ...unique];
    }, []);

    const getLedgerCategoryCount = (cat: string) => {
        if (cat === 'All Events') return INITIAL_AUDIT_EVENTS.length;
        return INITIAL_AUDIT_EVENTS.filter(e => e.category === cat).length;
    };

    // Filter audit events (driven by Global Search & Category Filter)
    const filteredAuditEvents = INITIAL_AUDIT_EVENTS.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              e.code.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              e.customer.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              e.company.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              e.gateway.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              e.payload.invoiceId.toLowerCase().includes(globalSearchQuery.toLowerCase());
        const matchesCategory = ledgerCategoryFilter === 'All Events' || e.category === ledgerCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <>
            {/* BEGIN: Header & Controls */}
            <section className="flex flex-wrap items-center justify-between gap-4" data-purpose="header-greeting-controls">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Event Ledger</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Immutable financial telemetry &amp; real-time webhook audit trail</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Export CSV */}
                    <button
                        onClick={() => showActionToast('Audit Event Ledger CSV exported successfully!')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors">
                        <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Export Ledger</span>
                    </button>

                    {/* Event Category Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsLedgerDropdownOpen(!isLedgerDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                            <span>{ledgerCategoryFilter} ({getLedgerCategoryCount(ledgerCategoryFilter)})</span>
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                        </button>
                        {isLedgerDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-floating p-1 min-w-[210px] animate-in fade-in zoom-in-95">
                                {ledgerCategories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setLedgerCategoryFilter(cat);
                                            setIsLedgerDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                                            ledgerCategoryFilter === cat ? 'bg-gray-100 font-semibold text-black' : 'text-gray-600 hover:bg-gray-50'
                                        }`}>
                                        <span>{cat}</span>
                                        <span className="text-[11px] text-gray-400 font-mono">({getLedgerCategoryCount(cat)})</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Section 1: 4 Top Telemetry KPI Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="ledger-kpi-cards">
                {/* Card 1: Total Events Processed */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Total Events</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">1,420</span>
                                <span className="text-xs text-gray-400 font-normal">Today</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-3"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-6"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                            </svg>
                            <span>+12.4% vs yesterday</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">100% Delivery</span>
                    </div>
                </div>

                {/* Card 2: Net MRR Velocity */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Net MRR Velocity</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">+$4,250</span>
                                <span className="text-xs text-gray-400 font-normal">Added</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-6"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-5"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                            </svg>
                            <span>+18.2% expansion velocity</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">Net Inflow</span>
                    </div>
                </div>

                {/* Card 3: Delivered Events */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Delivered Events</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">1,418</span>
                                <span className="text-xs text-gray-400 font-normal">Delivered</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-7"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Stripe &amp; Bank Webhooks Active</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">Real-time</span>
                    </div>
                </div>

                {/* Card 4: Flagged Billing / Dunning Issues */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Flagged Events</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">2</span>
                                <span className="text-xs text-gray-400 font-normal">Action Required</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-5"></div>
                            <div className="w-1 bg-rose-500 rounded-full h-8"></div>
                            <div className="w-1 bg-rose-500 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-rose-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span>2 Involuntary Churn Risks</span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500" title="Smart Dunning configured">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* Section 2: Immutable Telemetry Table */}
            <section ref={tableSectionRef} className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card" data-purpose="event-ledger-table">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs uppercase font-bold tracking-wider text-gray-500">Immutable Financial Audit Stream</h2>
                        <span className="text-xs text-gray-400 font-normal">({filteredAuditEvents.length} events logged)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Webhook Ingestion Active</span>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-hidden" style={{ overflowY: 'hidden' }}>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[11px]">
                                <th className="py-3 px-3">Timestamp (UTC)</th>
                                <th className="py-3 px-3">Event Code &amp; Name</th>
                                <th className="py-3 px-3">Customer &amp; Workspace</th>
                                <th className="py-3 px-3">MRR Movement</th>
                                <th className="py-3 px-3">Gateway</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3 text-center w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                            {filteredAuditEvents.map((evt, index) => {
                                const rowClass = !shouldAnimateRows
                                    ? "event-row-hidden"
                                    : hasAlreadyAnimated
                                        ? "event-row-static event-row-interactive"
                                        : "event-row-animated event-row-interactive";

                                const isSuccess = evt.status === 'Delivered 200 OK' || evt.status.toLowerCase().includes('ok') || evt.status.toLowerCase().includes('success');
                                const isPending = evt.status === 'Pending Retry' || evt.status.toLowerCase().includes('pending');
                                const isFailed = evt.status === 'Failed 402' || evt.status.toLowerCase().includes('fail') || evt.status.toLowerCase().includes('error');
                                const isRefunded = evt.status === 'Refunded';

                                const bubbleColor = isSuccess
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                    : isPending
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                    : isFailed
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                    : isRefunded
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200/80';

                                const dotColor = isSuccess
                                    ? 'bg-emerald-500'
                                    : isPending
                                    ? 'bg-amber-500'
                                    : isFailed
                                    ? 'bg-rose-500'
                                    : isRefunded
                                    ? 'bg-purple-500'
                                    : 'bg-gray-400';

                                return (
                                    <tr
                                        key={evt.id}
                                        onClick={() => setSelectedAuditEvent(evt)}
                                        className={`hover:bg-gray-50/70 transition-colors cursor-pointer group ${rowClass}`}>
                                        {/* Timestamp */}
                                        <td className="py-3.5 px-3">
                                            <div className="font-mono text-xs font-bold text-gray-900" suppressHydrationWarning>{formatTimeClean(evt.timestamp)}</div>
                                            <span className="text-[10px] text-gray-400" suppressHydrationWarning>{getRelativeTime(evt.timestamp, evt.relativeTime)}</span>
                                        </td>

                                        {/* Event Code & Name */}
                                        <td className="py-3.5 px-3">
                                            <div className="font-mono text-xs font-semibold text-gray-900 group-hover:text-black transition-colors">{evt.code}</div>
                                            <span className="text-[11px] text-gray-400 font-mono">{evt.name}</span>
                                        </td>

                                        {/* Customer & Workspace */}
                                        <td className="py-3.5 px-3">
                                            <div className="font-bold text-gray-900">{evt.customer}</div>
                                            <span className="text-[11px] text-gray-400">{evt.company}</span>
                                        </td>

                                        {/* MRR Movement */}
                                        <td className="py-3.5 px-3">
                                            <span className={`font-mono font-bold text-xs ${
                                                evt.isPositive
                                                    ? 'text-emerald-600'
                                                    : evt.isNegative
                                                    ? 'text-rose-600'
                                                    : 'text-gray-500'
                                            }`}>
                                                {evt.mrrDelta}
                                            </span>
                                        </td>

                                        {/* Gateway */}
                                        <td className="py-3.5 px-3 text-gray-600 text-xs">
                                            {evt.gateway}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium shadow-2xs ${bubbleColor}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                                <span>{evt.status}</span>
                                            </span>
                                        </td>

                                        {/* Actions Column */}
                                        <td className="py-3.5 px-3 text-center w-20" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative inline-flex items-center justify-center">
                                                <button
                                                    onClick={() => setActiveLedgerMenuId(activeLedgerMenuId === evt.id ? null : evt.id)}
                                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center"
                                                    title="Event actions">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                                    </svg>
                                                </button>

                                                {/* Contextual Action Dropdown */}
                                                {activeLedgerMenuId === evt.id && (
                                                    <div className={`absolute right-0 ${index >= filteredAuditEvents.length - 2 ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-56 bg-white rounded-xl shadow-floating border border-gray-200/90 py-1.5 z-40 text-left animate-in fade-in zoom-in-95`}>
                                                    <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center justify-between">
                                                        <span>{evt.code}</span>
                                                        <span className="font-mono text-[10px]">{evt.gateway}</span>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedAuditEvent(evt);
                                                            setActiveLedgerMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                        </svg>
                                                        <span>Audit Webhook Payload</span>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard?.writeText?.(evt.payload.signature);
                                                            showActionToast(`Copied signature for ${evt.code}!`);
                                                            setActiveLedgerMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                        </svg>
                                                        <span>Copy Webhook Signature</span>
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            showActionToast(`Triggered webhook replay for ${evt.code} (${evt.name})`);
                                                            setActiveLedgerMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                        </svg>
                                                        <span>Replay Webhook Delivery</span>
                                                    </button>

                                                    <div className="border-t border-gray-100 my-1"></div>

                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard?.writeText?.(JSON.stringify(evt, null, 2));
                                                            showActionToast(`Exported ${evt.code} raw JSON to clipboard.`);
                                                            setActiveLedgerMenuId(null);
                                                        }}
                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                        </svg>
                                                        <span>Export Event (.json)</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                            {filteredAuditEvents.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-400">
                                        No telemetry events match your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Audit Event Modal */}
            <AuditEventModal
                event={selectedAuditEvent}
                onClose={() => setSelectedAuditEvent(null)}
                onShowToast={showActionToast}
            />
        </>
    );
}
