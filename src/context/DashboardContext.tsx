"use client";

import React, { createContext, useContext, useState } from 'react';
import { Company } from '@/types/company';
import { SystemAlert, TeamMessage } from '@/types/alerts';
import { COMPANIES } from '@/data/companies';
import { INITIAL_SYSTEM_ALERTS, INITIAL_TEAM_MESSAGES } from '@/data/alertsAndMessages';

interface DashboardContextType {
    selectedCompanyId: string;
    setSelectedCompanyId: (id: string) => void;
    currentCompany: Company;
    globalSearchQuery: string;
    setGlobalSearchQuery: (query: string) => void;
    actionToastMessage: string | null;
    showActionToast: (msg: string) => void;
    alerts: SystemAlert[];
    unreadAlertsCount: number;
    markAllAlertsRead: () => void;
    dismissAlert: (id: string) => void;
    messages: TeamMessage[];
    unreadMessagesCount: number;
    markAllMessagesRead: () => void;
    bookmarkedStartupIds: string[];
    toggleBookmarkStartup: (id: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('cloudnest');
    const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
    const [actionToastMessage, setActionToastMessage] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_SYSTEM_ALERTS);
    const [messages, setMessages] = useState<TeamMessage[]>(INITIAL_TEAM_MESSAGES);
    const [bookmarkedStartupIds, setBookmarkedStartupIds] = useState<string[]>([]);

    const currentCompany = COMPANIES.find(c => c.id === selectedCompanyId) || COMPANIES[0];

    const showActionToast = (msg: string) => {
        setActionToastMessage(msg);
        setTimeout(() => setActionToastMessage(null), 3000);
    };

    const unreadAlertsCount = alerts.filter(a => !a.isRead).length;
    const unreadMessagesCount = messages.filter(m => !m.isRead).length;

    const markAllAlertsRead = () => {
        setAlerts(alerts.map(a => ({ ...a, isRead: true })));
        showActionToast('All notifications marked as read.');
    };

    const markAllMessagesRead = () => {
        setMessages(messages.map(m => ({ ...m, isRead: true })));
        showActionToast('All messages marked as read.');
    };

    const dismissAlert = (id: string) => {
        setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
    };

    const toggleBookmarkStartup = (id: string) => {
        if (bookmarkedStartupIds.includes(id)) {
            setBookmarkedStartupIds(bookmarkedStartupIds.filter(item => item !== id));
            showActionToast('Removed from deal pipeline.');
        } else {
            setBookmarkedStartupIds([...bookmarkedStartupIds, id]);
            showActionToast('Saved to deal pipeline!');
        }
    };

    return (
        <DashboardContext.Provider
            value={{
                selectedCompanyId,
                setSelectedCompanyId,
                currentCompany,
                globalSearchQuery,
                setGlobalSearchQuery,
                actionToastMessage,
                showActionToast,
                alerts,
                unreadAlertsCount,
                markAllAlertsRead,
                dismissAlert,
                messages,
                unreadMessagesCount,
                markAllMessagesRead,
                bookmarkedStartupIds,
                toggleBookmarkStartup
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
