"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';
import { COMPANIES } from '@/data/companies';

export function LeftSidebar() {
    const pathname = usePathname();
    const { selectedCompanyId, setSelectedCompanyId, currentCompany, showActionToast } = useDashboard();
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState<boolean>(false);

    const isNavActive = (path: string) => {
        if (path === '/') return pathname === '/';
        if (path === '/ledger') return pathname.startsWith('/ledger') || pathname.startsWith('/transactions');
        return pathname.startsWith(path);
    };

    return (
        <aside
            className="w-64 flex-shrink-0 sticky top-3 md:top-5 h-[calc(100vh-1.5rem)] md:h-[calc(100vh-2.5rem)] flex flex-col justify-between rounded-2xl bg-white border border-[#eaecef] p-4 shadow-sm z-30"
            data-purpose="sidebar-navigation">
            {/* Top Segment: Workspace Switcher */}
            <div className="flex-shrink-0 pb-3 border-b border-gray-100/70">
                <div className="relative">
                    <div
                        onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                        className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100/70 transition-colors cursor-pointer select-none"
                        data-purpose="workspace-switcher">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
                                {currentCompany.initial}
                            </div>
                            <div className="flex flex-col text-left">
                                <span
                                    className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 leading-none mb-0.5">
                                    {currentCompany.type}
                                </span>
                                <span className="text-xs font-semibold text-gray-900 leading-tight">
                                    {currentCompany.name}
                                </span>
                            </div>
                        </div>
                        <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isWorkspaceOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </div>

                    {/* Dropdown Menu */}
                    {isWorkspaceOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-gray-200 rounded-xl shadow-floating p-1.5 space-y-1">
                            <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                Switch Company
                            </div>
                            {COMPANIES.map((comp) => (
                                <button
                                    key={comp.id}
                                    onClick={() => {
                                        setSelectedCompanyId(comp.id);
                                        setIsWorkspaceOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors ${
                                        selectedCompanyId === comp.id
                                            ? 'bg-gray-100 font-semibold text-gray-900'
                                            : 'hover:bg-gray-50 text-gray-700'
                                    }`}>
                                    <div className="w-7 h-7 rounded-md bg-zinc-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                        {comp.initial}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-xs font-medium truncate">{comp.name}</span>
                                        <span className="text-[10px] text-gray-400 truncate">
                                            {comp.revenue} • Churn {comp.churnRate}
                                        </span>
                                    </div>
                                    {comp.highChurnWarning && (
                                        <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" title="High Churn Risk"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Segment: Navigation Menus (Scrollable with hidden scrollbar) */}
            <div className="flex-1 overflow-y-auto pr-0.5 py-3 space-y-5 text-[13px] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* Group 1: MAIN MENU (4 items) */}
                <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2">Main Menu</span>
                    <nav className="mt-2 space-y-1">
                        {/* 1. Dashboard */}
                        <Link
                            href="/"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                                isNavActive('/')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                            </svg>
                            <span>Dashboard</span>
                        </Link>

                        {/* 2. Company Comparison */}
                        <Link
                            href="/comparison"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                                isNavActive('/comparison')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                            <span>Company Comparison</span>
                        </Link>

                        {/* 3. AI Investment Screening */}
                        <Link
                            href="/ai-screening"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isNavActive('/ai-screening')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.286L13 21l-2.286-6.857L5 12l5.714-2.286L13 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                            <span>AI Investment Screening</span>
                        </Link>

                        {/* 4. Event Ledger */}
                        <Link
                            href="/ledger"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isNavActive('/ledger')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                            <span>Event Ledger</span>
                        </Link>
                    </nav>
                </div>

                {/* Group 2: PORTFOLIO GOVERNANCE (3 items) */}
                <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2">Portfolio Governance</span>
                    <nav className="mt-2 space-y-1">
                        {/* 1. Cap Table & Ownership */}
                        <Link
                            href="/captable"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isNavActive('/captable')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                                <path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                            <span>Cap Table &amp; Ownership</span>
                        </Link>

                        {/* 2. Board Governance & Reporting */}
                        <Link
                            href="/governance"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isNavActive('/governance')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                            <span>Board Governance</span>
                        </Link>

                        {/* 3. Data Pipelines & Integrations */}
                        <Link
                            href="/integrations"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isNavActive('/integrations')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                            <span>Data Pipelines &amp; APIs</span>
                        </Link>
                    </nav>
                </div>

                {/* Group 3: SETTINGS (2 items) */}
                <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2">Settings</span>
                    <nav className="mt-2 space-y-1">
                        <Link
                            href="/help"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isNavActive('/help')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                            <span>Help &amp; Test Guide</span>
                        </Link>

                        <Link
                            href="/settings"
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                                isNavActive('/settings')
                                    ? 'bg-gray-100/90 text-gray-900 font-semibold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                            </svg>
                            <span>System Settings</span>
                        </Link>
                    </nav>
                </div>
            </div>

            {/* Bottom User Profile Pill (Always pinned at bottom, Discord-style) */}
            <div className="flex-shrink-0 pt-3 border-t border-gray-100" data-purpose="user-profile">
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100 hover:bg-gray-100/80 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-1 ring-gray-200">
                            AV
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-gray-900 leading-tight">Aris Vance</span>
                            <span className="text-[11px] text-gray-400 leading-tight">Lead Investor &amp; GP</span>
                        </div>
                    </div>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                </div>
            </div>
        </aside>
    );
}
