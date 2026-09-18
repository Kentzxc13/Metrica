"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Company, Transaction } from '@/types/company';
import { SystemAlert, TeamMessage } from '@/types/alerts';
import { COMPANIES, INITIAL_TRANSACTIONS } from '@/data/companies';
import { INITIAL_SYSTEM_ALERTS, INITIAL_TEAM_MESSAGES } from '@/data/alertsAndMessages';

const TRANSACTIONS_CACHE_KEY = 'metrica_transactions_cache';

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
    // Caching & persistent events/transactions
    transactions: Transaction[];
    isTransactionsLoading: boolean;
    addTransaction: (newTx: Transaction) => void;
    deleteTransaction: (id: string) => Promise<boolean>;
    refreshTransactions: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('cloudnest');
    const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
    const [actionToastMessage, setActionToastMessage] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_SYSTEM_ALERTS);
    const [messages, setMessages] = useState<TeamMessage[]>(INITIAL_TEAM_MESSAGES);
    const [bookmarkedStartupIds, setBookmarkedStartupIds] = useState<string[]>([]);

    // Persistent transactions with localStorage caching & background Supabase sync
    const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState<boolean>(true);

    const refreshTransactions = useCallback(async () => {
        try {
            const res = await fetch('/api/payments', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.transactions) && data.transactions.length > 0) {
                    setTransactions(data.transactions);
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(data.transactions));
                        } catch (e) {
                            console.warn('Failed to save transactions to localStorage cache:', e);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Background sync for transactions failed, using cached data:', err);
        } finally {
            setIsTransactionsLoading(false);
        }
    }, []);

    // Initial mount: load from localStorage cache first (immediate, no flicker), then background sync
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem(TRANSACTIONS_CACHE_KEY);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setTransactions(parsed);
                        setIsTransactionsLoading(false);
                    }
                }
            } catch (e) {
                console.warn('Failed to read transactions from localStorage cache:', e);
            }
        }

        // Run background sync
        refreshTransactions();
    }, [refreshTransactions]);

    const addTransaction = useCallback((newTx: Transaction) => {
        setTransactions((prev) => {
            const exists = prev.some((t) => t.code.toLowerCase() === newTx.code.toLowerCase());
            const updated = exists
                ? prev.map((t) => (t.code.toLowerCase() === newTx.code.toLowerCase() ? newTx : t))
                : [newTx, ...prev];

            if (typeof window !== 'undefined') {
                try {
                    localStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(updated));
                } catch (e) {
                    console.warn('Failed to write to localStorage:', e);
                }
            }
            return updated;
        });
    }, []);

    const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
        try {
            // Optimistic update
            setTransactions((prev) => {
                const updated = prev.filter((t) => t.id !== id && t.code !== id && t.code !== `#${id}`);
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(TRANSACTIONS_CACHE_KEY, JSON.stringify(updated));
                    } catch (e) {
                        console.warn('Failed to update localStorage after delete:', e);
                    }
                }
                return updated;
            });

            const res = await fetch(`/api/payments?id=${encodeURIComponent(id)}`, {
                method: 'DELETE',
            });
            return res.ok;
        } catch (err) {
            console.warn('Failed to delete transaction from server:', err);
            return false;
        }
    }, []);

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
                toggleBookmarkStartup,
                transactions,
                isTransactionsLoading,
                addTransaction,
                deleteTransaction,
                refreshTransactions,
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
