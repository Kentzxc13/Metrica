"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDashboard } from '@/context/DashboardContext';

export function TopBar() {
    const pathname = usePathname();
    const router = useRouter();
    const {
        currentCompany,
        setSelectedCompanyId,
        globalSearchQuery,
        setGlobalSearchQuery,
        showActionToast,
        alerts,
        unreadAlertsCount,
        markAllAlertsRead,
        dismissAlert,
        messages,
        unreadMessagesCount,
        markAllMessagesRead
    } = useDashboard();

    const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
    const [isMessagesOpen, setIsMessagesOpen] = useState<boolean>(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const getPageTitle = () => {
        if (pathname.startsWith('/comparison')) return 'Company Comparison';
        if (pathname.startsWith('/ai-screening')) return 'AI Investment Screening';
        if (pathname.startsWith('/ledger') || pathname.startsWith('/transactions')) return 'Event Ledger';
        if (pathname.startsWith('/captable')) return 'Cap Table & Ownership';
        if (pathname.startsWith('/governance')) return 'Board Governance & Cadence';
        if (pathname.startsWith('/integrations')) return 'Data Pipelines & APIs';
        return currentCompany.name;
    };

    const getSearchPlaceholder = () => {
        if (pathname.startsWith('/comparison')) return 'Search companies...';
        if (pathname.startsWith('/ai-screening')) return 'Search startups or sectors...';
        if (pathname.startsWith('/ledger') || pathname.startsWith('/transactions')) return 'Search telemetry, customers, IDs...';
        if (pathname.startsWith('/captable')) return 'Search ventures, shares, rounds...';
        if (pathname.startsWith('/governance')) return 'Search board meetings, updates...';
        if (pathname.startsWith('/integrations')) return 'Search APIs, webhooks, pipelines...';
        return 'Search across Metrica...';
    };

    return (
        <header className="flex items-center justify-between pt-1.5 pb-1" data-purpose="top-navigation-bar">
            {/* Breadcrumb */}
            <nav className="flex items-center text-xs font-medium text-gray-400 space-x-1.5">
                <Link
                    href="/"
                    className="text-gray-500 hover:text-gray-800 transition-colors">
                    Dashboard
                </Link>
                <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" fillRule="evenodd"></path>
                </svg>
                <span className="text-gray-900 font-semibold">
                    {getPageTitle()}
                </span>
            </nav>

            {/* Right Header Actions */}
            <div className="flex items-center gap-3">
                {/* Global Search Input with Dynamic Placeholder & Keyboard Shortcut (Cmd+K) */}
                <div className="relative w-64 md:w-80">
                    <input
                        ref={searchInputRef}
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-16 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all shadow-sm"
                        placeholder={getSearchPlaceholder()}
                        type="text"
                    />
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                        {globalSearchQuery && (
                            <button
                                onClick={() => setGlobalSearchQuery('')}
                                className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
                                title="Clear search">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                </svg>
                            </button>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono border border-gray-200 px-1 py-0.5 rounded bg-gray-50 pointer-events-none">⌘ K</span>
                    </div>
                </div>

                {/* Notification Bell with Floating Popover */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setIsNotificationsOpen(!isNotificationsOpen);
                            setIsMessagesOpen(false);
                        }}
                        className="relative w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm"
                        title="System & Risk Notifications">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                        </svg>
                        {unreadAlertsCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                {unreadAlertsCount}
                            </span>
                        )}
                    </button>

                    {/* Floating Notifications Popover */}
                    {isNotificationsOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-floating p-4 z-50 text-left animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                                    {unreadAlertsCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600">
                                            {unreadAlertsCount} new
                                        </span>
                                    )}
                                </div>
                                {unreadAlertsCount > 0 && (
                                    <button
                                        onClick={markAllAlertsRead}
                                        className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors">
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Alerts List */}
                            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto mt-1 -mx-2 px-2">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        onClick={() => {
                                            dismissAlert(alert.id);
                                            if (alert.actionNav) {
                                                if (alert.actionCompanyId) {
                                                    setSelectedCompanyId(alert.actionCompanyId);
                                                }
                                                const targetPath = alert.actionNav === 'dashboard' ? '/' : `/${alert.actionNav}`;
                                                router.push(targetPath);
                                            }
                                            setIsNotificationsOpen(false);
                                        }}
                                        className={`py-3 px-2 rounded-xl transition-colors cursor-pointer flex gap-3 ${
                                            !alert.isRead ? 'bg-gray-50/70 hover:bg-gray-100/70' : 'hover:bg-gray-50/40 opacity-70'
                                        }`}>
                                        {/* Alert Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {alert.type === 'risk' ? (
                                                <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                    </svg>
                                                </div>
                                            ) : alert.type === 'error' ? (
                                                <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Alert Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="font-semibold text-xs text-gray-900 truncate">{alert.title}</span>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{alert.time}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{alert.message}</p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                                                    alert.type === 'risk'
                                                        ? 'bg-rose-100/70 text-rose-700'
                                                        : alert.type === 'error'
                                                        ? 'bg-amber-100/70 text-amber-700'
                                                        : 'bg-emerald-100/70 text-emerald-700'
                                                }`}>
                                                    {alert.tag}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium hover:underline">
                                                    Take action →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="pt-3 border-t border-gray-100 mt-2 flex items-center justify-between text-xs">
                                <Link
                                    href="/ledger"
                                    onClick={() => setIsNotificationsOpen(false)}
                                    className="text-gray-500 hover:text-black font-semibold text-[11px] transition-colors">
                                    View Event Ledger Stream →
                                </Link>
                                <button
                                    onClick={() => setIsNotificationsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 text-[11px]">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Message/Inbox Button with Floating Popover */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setIsMessagesOpen(!isMessagesOpen);
                            setIsNotificationsOpen(false);
                        }}
                        className="relative w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-sm"
                        title="Team & Investor Messages">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                        </svg>
                        {unreadMessagesCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-900 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                                {unreadMessagesCount}
                            </span>
                        )}
                    </button>

                    {/* Floating Messages Popover */}
                    {isMessagesOpen && (
                        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-floating p-4 z-50 text-left animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900 text-sm">Inbox</h3>
                                    {unreadMessagesCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">
                                            {unreadMessagesCount} unread
                                        </span>
                                    )}
                                </div>
                                {unreadMessagesCount > 0 && (
                                    <button
                                        onClick={markAllMessagesRead}
                                        className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors">
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Messages List */}
                            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto mt-1 -mx-2 px-2">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        onClick={() => {
                                            showActionToast(`Opened message from ${msg.sender}`);
                                            setIsMessagesOpen(false);
                                        }}
                                        className={`py-3 px-2 rounded-xl transition-colors cursor-pointer flex gap-3 ${
                                            !msg.isRead ? 'bg-gray-50/70 hover:bg-gray-100/70' : 'hover:bg-gray-50/40 opacity-70'
                                        }`}>
                                        {/* Initials Avatar */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                                            {msg.initials}
                                        </div>

                                        {/* Message Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <span className="font-semibold text-xs text-gray-900 truncate">{msg.sender}</span>
                                                    <span className="text-[10px] text-gray-400">({msg.role})</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap">{msg.time}</span>
                                            </div>
                                            <div className="font-semibold text-[11px] text-gray-800 mt-0.5 truncate">{msg.subject}</div>
                                            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{msg.preview}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="pt-3 border-t border-gray-100 mt-2 flex items-center justify-between text-xs">
                                <button
                                    onClick={() => {
                                        showActionToast('Compose modal initialized.');
                                        setIsMessagesOpen(false);
                                    }}
                                    className="text-gray-900 hover:text-black font-semibold text-[11px] transition-colors">
                                    + New Direct Message
                                </button>
                                <button
                                    onClick={() => setIsMessagesOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 text-[11px]">
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Headshot Button */}
                <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white font-mono font-bold text-xs flex items-center justify-center ring-1 ring-gray-200 cursor-pointer shadow-xs" title="Aris Vance (GP & Lead Investor)">
                    AV
                </div>
            </div>
        </header>
    );
}
