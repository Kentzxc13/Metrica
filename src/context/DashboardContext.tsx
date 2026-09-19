"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Company, Transaction } from '@/types/company';
import { SystemAlert, TeamMessage } from '@/types/alerts';
// Mock fallback kept commented out for offline resilience
// import { COMPANIES, INITIAL_TRANSACTIONS } from '@/data/companies';
import { INITIAL_SYSTEM_ALERTS, INITIAL_TEAM_MESSAGES } from '@/data/alertsAndMessages';
import { supabaseBrowser } from '@/lib/supabase-browser';

const TRANSACTIONS_CACHE_KEY = 'metrica_transactions_cache';

interface DashboardContextType {
    selectedCompanyId: string;
    setSelectedCompanyId: (id: string) => void;
    currentCompany: Company;
    companies: Company[];
    isCompaniesLoading: boolean;
    globalSearchQuery: string;
    setGlobalSearchQuery: (query: string) => void;
    actionToastMessage: string | null;
    showActionToast: (msg: string) => void;
    alerts: SystemAlert[];
    unreadAlertsCount: number;
    markAllAlertsRead: (silent?: boolean) => void;
    dismissAlert: (id: string) => void;
    triggerNotification: (alert: {
        title: string;
        message: string;
        type?: 'risk' | 'error' | 'success';
        tag?: string;
        actionNav?: string;
        actionCompanyId?: string;
    }) => void;
    updateCompanyHealth: (companyId: string, updates: Partial<Company>) => void;
    messages: TeamMessage[];
    unreadMessagesCount: number;
    markAllMessagesRead: (silent?: boolean) => void;
    markMessageRead: (id: string) => void;
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

    // Live companies loaded directly from Supabase
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isCompaniesLoading, setIsCompaniesLoading] = useState<boolean>(true);

    // Persistent live transactions from Supabase (mock data hidden/commented out)
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isTransactionsLoading, setIsTransactionsLoading] = useState<boolean>(true);

    // Load live companies from Supabase
    useEffect(() => {
        let isMounted = true;
        const loadCompanies = async () => {
            try {
                setIsCompaniesLoading(true);
                const res = await fetch('/api/companies', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && Array.isArray(data.companies) && data.companies.length > 0) {
                        setCompanies(data.companies);
                    }
                }
            } catch (err) {
                console.warn('Failed to load live companies:', err);
            } finally {
                if (isMounted) setIsCompaniesLoading(false);
            }
        };
        loadCompanies();
        return () => { isMounted = false; };
    }, []);

    const refreshTransactions = useCallback(async () => {
        try {
            const url = selectedCompanyId && selectedCompanyId !== 'all'
                ? `/api/payments?company_id=${encodeURIComponent(selectedCompanyId)}`
                : '/api/payments';
            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data.transactions)) {
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
            console.warn('Background sync for transactions failed:', err);
        } finally {
            setIsTransactionsLoading(false);
        }
    }, [selectedCompanyId]);

    // Initial mount: load from localStorage cache first, then background sync
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

    // Realtime Supabase payment events listener
    useEffect(() => {
        const channel = supabaseBrowser
            .channel('dashboard_context_realtime_payments')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'payments',
                },
                () => {
                    refreshTransactions();
                }
            )
            .subscribe();

        return () => {
            supabaseBrowser.removeChannel(channel);
        };
    }, [refreshTransactions]);

    const showActionToast = useCallback((msg: string) => {
        setActionToastMessage(msg);
        setTimeout(() => setActionToastMessage(null), 3000);
    }, []);

    const triggerNotification = useCallback((alertData: {
        title: string;
        message: string;
        type?: 'risk' | 'error' | 'success';
        tag?: string;
        actionNav?: string;
        actionCompanyId?: string;
    }) => {
        const newAlert: SystemAlert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: alertData.title,
            message: alertData.message,
            time: 'Just now',
            type: alertData.type || 'risk',
            isRead: false,
            tag: alertData.tag || 'High Priority',
            actionNav: alertData.actionNav,
            actionCompanyId: alertData.actionCompanyId,
        };
        setAlerts((prev) => [newAlert, ...prev]);
        showActionToast(`🚨 Alert: ${alertData.title}`);
    }, [showActionToast]);

    const updateCompanyHealth = useCallback((companyId: string, updates: Partial<Company>) => {
        setCompanies((prev) => prev.map((c) => {
            const target = companyId.toLowerCase();
            if (c.id.toLowerCase() === target || c.name.toLowerCase().includes(target)) {
                const updated = { ...c, ...updates };
                // Detect status transition to At Risk
                if (updates.aiTier === 'At Risk' && c.aiTier !== 'At Risk') {
                    triggerNotification({
                        title: `Critical Alert: ${c.name} Dropped to At Risk`,
                        message: `${c.name} churn surged to ${updates.churnRate || c.churnRate || '16.4%'}. AI health tier downgraded to At Risk. Remediation required.`,
                        type: 'risk',
                        tag: 'Health Downgrade',
                        actionNav: 'comparison',
                        actionCompanyId: c.id,
                    });
                } else if (updates.aiTier === 'Outperforming' && c.aiTier === 'At Risk') {
                    triggerNotification({
                        title: `Health Restored: ${c.name}`,
                        message: `${c.name} unit economics stabilized. AI health tier restored to Outperforming.`,
                        type: 'success',
                        tag: 'Health Restored',
                        actionNav: 'comparison',
                        actionCompanyId: c.id,
                    });
                }
                return updated;
            }
            return c;
        }));
    }, [triggerNotification]);

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

        // Trigger notification if transaction failed
        if (newTx.status === 'Failed') {
            triggerNotification({
                title: 'Payment Failed: Smart Dunning Active',
                message: `Payment #${newTx.code} for ${newTx.customer} (${newTx.amount}) failed. Smart dunning sequence initiated.`,
                type: 'error',
                tag: 'Dunning',
                actionNav: 'ledger',
            });
        }
    }, [triggerNotification]);

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

    // Live company resolution with safe fallback
    const fallbackDefaultCompany: Company = {
        id: 'cloudnest',
        name: 'CloudNest Inc.',
        initial: 'CN',
        type: 'Enterprise SaaS',
        revenue: '$142,500',
        revenueGrowth: '+18.4% last month',
        orders: '2,420',
        ordersGrowth: '+12.1% last month',
        customers: '1,420',
        customersGrowth: '+8.4% last month',
        conversionRate: '4.8%',
        conversionGrowth: '+1.2% last month',
        categoryRevenue: '$142,500',
        categoryPeriod: 'Jan 1 - Sep 30',
        aiTier: 'Outperforming',
        aiScore: 94,
        aiRationale: 'Exceptional net expansion (118% NRR) and industry-low churn (2.1%).',
        highChurnWarning: false,
        churnRate: '2.1%',
        ltv: '$18,500',
        ltvCac: '4.2x',
        subscribers: '1,420',
    };

    const currentCompany = companies.find((c) => {
        const target = selectedCompanyId.toLowerCase();
        return c.id.toLowerCase() === target || c.name.toLowerCase().includes(target);
    }) || companies[0] || fallbackDefaultCompany;

    const unreadAlertsCount = alerts.filter(a => !a.isRead).length;
    const unreadMessagesCount = messages.filter(m => !m.isRead).length;

    const markAllAlertsRead = (silent = false) => {
        setAlerts(alerts.map(a => ({ ...a, isRead: true })));
        if (!silent) {
            showActionToast('All notifications marked as read.');
        }
    };

    const markAllMessagesRead = (silent = false) => {
        setMessages(messages.map(m => ({ ...m, isRead: true })));
        if (!silent) {
            showActionToast('All messages marked as read.');
        }
    };

    const dismissAlert = (id: string) => {
        setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
    };

    const markMessageRead = (id: string) => {
        setMessages(messages.map(m => m.id === id ? { ...m, isRead: true } : m));
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
                companies,
                isCompaniesLoading,
                globalSearchQuery,
                setGlobalSearchQuery,
                actionToastMessage,
                showActionToast,
                alerts,
                unreadAlertsCount,
                markAllAlertsRead,
                dismissAlert,
                triggerNotification,
                updateCompanyHealth,
                messages,
                unreadMessagesCount,
                markAllMessagesRead,
                markMessageRead,
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
