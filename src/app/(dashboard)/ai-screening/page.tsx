"use client";

import React, { useState, useMemo } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { INITIAL_SCREENING_STARTUPS } from '@/data/screening';
import { StartupProspect } from '@/types/screening';
import { StartupMemoModal } from '@/components/modals/StartupMemoModal';

export default function AiScreeningPage() {
    const {
        globalSearchQuery,
        setGlobalSearchQuery,
        showActionToast,
        bookmarkedStartupIds,
        toggleBookmarkStartup
    } = useDashboard();

    const [screeningSectorFilter, setScreeningSectorFilter] = useState<string>('All Sectors');
    const [isSectorDropdownOpen, setIsSectorDropdownOpen] = useState<boolean>(false);
    const [selectedStartupMemo, setSelectedStartupMemo] = useState<StartupProspect | null>(null);

    // Dynamic sectors derived straight from startup dataset
    const dynamicSectors = useMemo(() => {
        const unique = Array.from(new Set(INITIAL_SCREENING_STARTUPS.map(s => s.sector)));
        return ['All Sectors', ...unique];
    }, []);

    const getSectorCount = (sector: string) => {
        if (sector === 'All Sectors') return INITIAL_SCREENING_STARTUPS.length;
        return INITIAL_SCREENING_STARTUPS.filter(s => s.sector === sector).length;
    };

    // Filter startups for AI Investment Screening (driven by Global Search & Sector Filter)
    const filteredStartups = INITIAL_SCREENING_STARTUPS.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              s.description.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                              s.sector.toLowerCase().includes(globalSearchQuery.toLowerCase());
        const matchesSector = screeningSectorFilter === 'All Sectors' || s.sector === screeningSectorFilter;
        return matchesSearch && matchesSector;
    });

    return (
        <>
            {/* BEGIN: Header & Dynamic Controls */}
            <section className="flex flex-wrap items-center justify-between gap-4" data-purpose="header-greeting-controls">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AI Investment Screening</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Curated SaaS deal flow &amp; algorithmic diligence</p>
                </div>

                <div className="flex items-center gap-2.5">
                    {/* Dynamic Sector Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSectorDropdownOpen(!isSectorDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                            <span>{screeningSectorFilter} ({getSectorCount(screeningSectorFilter)})</span>
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                        </button>
                        {isSectorDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-floating p-1 min-w-[170px] animate-in fade-in zoom-in-95">
                                {dynamicSectors.map((sec) => (
                                    <button
                                        key={sec}
                                        onClick={() => {
                                            setScreeningSectorFilter(sec);
                                            setIsSectorDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors ${
                                            screeningSectorFilter === sec ? 'bg-gray-100 font-semibold text-black' : 'text-gray-600 hover:bg-gray-50'
                                        }`}>
                                        <span>{sec}</span>
                                        <span className="text-[11px] text-gray-400 font-mono">({getSectorCount(sec)})</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Grid of Deal Screening Rectangle Cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredStartups.map((startup) => {
                    const isBookmarked = bookmarkedStartupIds.includes(startup.id);
                    return (
                        <div
                            key={startup.id}
                            className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow">
                            <div>
                                {/* Header: Monogram, Name, Sector & Verification Badge */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                            {startup.initial}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-gray-900 tracking-tight">{startup.name}</h3>
                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                                    {startup.stage}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-medium text-gray-400">{startup.sector}</span>
                                        </div>
                                    </div>

                                    {/* Verification Badge */}
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 flex-shrink-0">
                                        {startup.verification.type === 'Stripe Verified' ? (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                <span className="text-gray-800 font-medium">Stripe Verified</span>
                                            </>
                                        ) : startup.verification.type === 'SEC 10-Q' ? (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                <span className="text-gray-800 font-medium">SEC Filing</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                <span className="text-gray-700 font-medium">{startup.verification.type}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Short Description */}
                                <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                                    {startup.description}
                                </p>

                                {/* Financial Details Strip */}
                                <div className="mt-4 grid grid-cols-4 gap-2 border border-gray-100 rounded-xl bg-gray-50/70 p-2.5">
                                    <div>
                                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">ARR</span>
                                        <span className="font-mono font-bold text-gray-900 text-xs block mt-0.5">{startup.arr}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">YoY Growth</span>
                                        <span className="font-mono font-bold text-emerald-600 text-xs block mt-0.5">{startup.yoyGrowth}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Churn</span>
                                        <span className={`font-mono font-bold text-xs block mt-0.5 ${startup.isChurnWarning ? 'text-rose-600' : 'text-gray-900'}`}>
                                            {startup.churnRate}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider block">Valuation</span>
                                        <span className="font-mono font-bold text-gray-900 text-xs block mt-0.5">{startup.valuation}</span>
                                    </div>
                                </div>

                                {/* AI Screening Diligence Memo Box */}
                                <div className="mt-3.5 bg-gray-50 border border-gray-100/90 rounded-xl p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <svg className="w-3.5 h-3.5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                        </svg>
                                        <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500">AI Screening Memo</span>
                                        <span className="ml-auto text-[10px] text-gray-400 font-mono">{startup.verification.detail}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed italic">
                                        &ldquo;{startup.thesis}&rdquo;
                                    </p>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <button
                                    onClick={() => toggleBookmarkStartup(startup.id)}
                                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors ${
                                        isBookmarked
                                            ? 'bg-black text-white'
                                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                                    }`}>
                                    <svg className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                                    </svg>
                                    <span>{isBookmarked ? 'Saved' : 'Save Deal'}</span>
                                </button>

                                <button
                                    onClick={() => setSelectedStartupMemo(startup)}
                                    className="flex items-center gap-1 text-xs font-semibold text-gray-900 hover:text-gray-600 transition-colors">
                                    <span>View Full Memo</span>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredStartups.length === 0 && (
                    <div className="bg-white rounded-2xl p-12 border border-gray-200/80 text-center col-span-full">
                        <p className="text-sm font-semibold text-gray-900">No startups found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or choosing another sector filter.</p>
                        <button
                            onClick={() => {
                                setGlobalSearchQuery('');
                                setScreeningSectorFilter('All Sectors');
                            }}
                            className="mt-3 px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors">
                            Reset Filters
                        </button>
                    </div>
                )}
            </section>

            {/* Diligence Memo Modal */}
            <StartupMemoModal
                startup={selectedStartupMemo}
                onClose={() => setSelectedStartupMemo(null)}
                isBookmarked={selectedStartupMemo ? bookmarkedStartupIds.includes(selectedStartupMemo.id) : false}
                onToggleBookmark={toggleBookmarkStartup}
                onShowToast={showActionToast}
            />
        </>
    );
}
