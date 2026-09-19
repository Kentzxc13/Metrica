"use client";

import React from 'react';
import { DashboardProvider, useDashboard } from '@/context/DashboardContext';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { TopBar } from '@/components/layout/TopBar';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { actionToastMessage } = useDashboard();

    return (
        <div className="min-h-screen font-sans text-dashboard-textPrimary bg-[#f3f4f7] antialiased flex">
            {/* Integrated Left Navigation Sidebar */}
            <LeftSidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <div className="p-4 md:p-6 lg:p-7 flex flex-col gap-5 max-w-[1680px] w-full mx-auto">
                    <TopBar />
                    <main className="flex-1 flex flex-col gap-5 min-w-0" data-purpose="main-dashboard-body">
                        {children}
                    </main>
                </div>
            </div>

            {/* Global Action Notification Toast */}
            {actionToastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-zinc-800 animate-in fade-in slide-in-from-bottom-3">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{actionToastMessage}</span>
                </div>
            )}
        </div>
    );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <DashboardProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </DashboardProvider>
    );
}
