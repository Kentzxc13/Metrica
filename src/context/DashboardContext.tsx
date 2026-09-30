import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Company, Transaction, DashboardSummary } from '@/types/company';
import { CapTableHolding } from '@/types/captable';
import { AuditLedgerEvent } from '@/types/ledger';
import { SystemAlert, TeamMessage } from '@/types/alerts';
// Mock fallback kept commented out for offline resilience
// import { COMPANIES, INITIAL_TRANSACTIONS } from '@/data/companies';
import { INITIAL_SYSTEM_ALERTS, INITIAL_TEAM_MESSAGES } from '@/data/alertsAndMessages';
import { supabaseBrowser } from '@/lib/supabase-browser';

const TRANSACTIONS_CACHE_KEY = 'metrica_transactions_cache';
const DASHBOARD_CACHE_KEY = 'metrica_dashboard_cache';
const CAPTABLE_CACHE_KEY = 'metrica_captable_cache';
const LEDGER_CACHE_KEY = 'metrica_ledger_cache';
const COMPANIES_CACHE_KEY = 'metrica_companies_cache';
const SELECTED_COMPANY_KEY = 'metrica_selected_company_id';

function readLocalCache<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = localStorage.getItem(key);
        if (!item) return fallback;
        const parsed = JSON.parse(item);
        return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch {
        return fallback;
    }
}

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
    // Stale-While-Revalidate Caches (0ms Page Switching)
    dashboardSummaries: Record<string, DashboardSummary>;
    currentDashboardData: DashboardSummary | null;
    isDashboardLoading: boolean;
    loadDashboardData: (companyId?: string, forceShowLoading?: boolean) => Promise<void>;
    capTableHoldings: CapTableHolding[];
    isCapTableLoading: boolean;
    loadCapTable: (forceShowLoading?: boolean) => Promise<void>;
    ledgerEvents: AuditLedgerEvent[];
    isLedgerLoading: boolean;
    loadLedgerEvents: (forceShowLoading?: boolean) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
    const [selectedCompanyId, setSelectedCompanyIdState] = useState<string>(() => 
        readLocalCache<string>(SELECTED_COMPANY_KEY, 'cloudnest')
    );
    const setSelectedCompanyId = useCallback((id: string) => {
        setSelectedCompanyIdState(id);
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(SELECTED_COMPANY_KEY, JSON.stringify(id));
            } catch {}
        }
    }, []);

    const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
    const [actionToastMessage, setActionToastMessage] = useState<string | null>(null);
    const [alerts, setAlerts] = useState<SystemAlert[]>(INITIAL_SYSTEM_ALERTS);
    const [messages, setMessages] = useState<TeamMessage[]>(INITIAL_TEAM_MESSAGES);
    const [bookmarkedStartupIds, setBookmarkedStartupIds] = useState<string[]>([]);

    // Live companies loaded directly from Supabase with localStorage cache
    const [companies, setCompanies] = useState<Company[]>(() => 
        readLocalCache<Company[]>(COMPANIES_CACHE_KEY, [])
    );
    const [isCompaniesLoading, setIsCompaniesLoading] = useState<boolean>(() => companies.length === 0);

    // Persistent live transactions from Supabase with localStorage cache
    const [transactions, setTransactions] = useState<Transaction[]>(() => 
        readLocalCache<Transaction[]>(TRANSACTIONS_CACHE_KEY, [])
    );
    const [isTransactionsLoading, setIsTransactionsLoading] = useState<boolean>(() => transactions.length === 0);

    // Stale-While-Revalidate caches
    const [dashboardSummaries, setDashboardSummaries] = useState<Record<string, DashboardSummary>>(() => 
        readLocalCache<Record<string, DashboardSummary>>(DASHBOARD_CACHE_KEY, {})
    );
    const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);

    const [capTableHoldings, setCapTableHoldings] = useState<CapTableHolding[]>(() => 
        readLocalCache<CapTableHolding[]>(CAPTABLE_CACHE_KEY, [])
    );
    const [isCapTableLoading, setIsCapTableLoading] = useState<boolean>(false);
    const [hasLoadedCapTableOnce, setHasLoadedCapTableOnce] = useState<boolean>(() => capTableHoldings.length > 0);

    const [ledgerEvents, setLedgerEvents] = useState<AuditLedgerEvent[]>(() => 
        readLocalCache<AuditLedgerEvent[]>(LEDGER_CACHE_KEY, [])
    );
    const [isLedgerLoading, setIsLedgerLoading] = useState<boolean>(false);
    const [hasLoadedLedgerOnce, setHasLoadedLedgerOnce] = useState<boolean>(() => ledgerEvents.length > 0);

    // Keep refs to avoid stale closure or infinite re-render loops in callbacks
    const dashboardSummariesRef = useRef(dashboardSummaries);
    dashboardSummariesRef.current = dashboardSummaries;

    const capTableHoldingsRef = useRef(capTableHoldings);
    capTableHoldingsRef.current = capTableHoldings;

    const ledgerEventsRef = useRef(ledgerEvents);
    ledgerEventsRef.current = ledgerEvents;

    // Load live companies from Supabase
    useEffect(() => {
        let isMounted = true;
        const loadCompanies = async () => {
            const cached = readLocalCache<Company[]>(COMPANIES_CACHE_KEY, []);
            if (companies.length === 0 && cached.length > 0) {
                setCompanies(cached);
                setIsCompaniesLoading(false);
            }
            try {
                const res = await fetch('/api/companies', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && Array.isArray(data.companies) && data.companies.length > 0) {
                        setCompanies(data.companies);
                        if (typeof window !== 'undefined') {
                            try {
                                localStorage.setItem(COMPANIES_CACHE_KEY, JSON.stringify(data.companies));
                            } catch {}
                        }
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
    }, [companies.length]);

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

    const loadDashboardData = useCallback(async (companyId?: string, forceShowLoading = false) => {
        const targetId = companyId || selectedCompanyId || 'cloudnest';
        const cachedFromStorage = readLocalCache<Record<string, DashboardSummary>>(DASHBOARD_CACHE_KEY, {});
        const hasExistingData = !!dashboardSummariesRef.current[targetId] || !!cachedFromStorage[targetId];

        // SWR: Only show loading skeleton if we have NO cached data for this company
        if (!hasExistingData || forceShowLoading) {
            setIsDashboardLoading(true);
        }

        if (!dashboardSummariesRef.current[targetId] && cachedFromStorage[targetId]) {
            setDashboardSummaries((prev) => ({ ...prev, ...cachedFromStorage }));
        }

        try {
            const res = await fetch(`/api/dashboard?company_id=${encodeURIComponent(targetId)}`, { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                if (json.summary) {
                    const summary: DashboardSummary = {
                        ...json.summary,
                        history: Array.isArray(json.history) ? json.history : [],
                    };
                    setDashboardSummaries((prev) => {
                        const next = { ...prev, [targetId]: summary };
                        if (typeof window !== 'undefined') {
                            try {
                                localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(next));
                            } catch (e) {
                                console.warn('Failed to save dashboard cache:', e);
                            }
                        }
                        return next;
                    });
                }
            }
        } catch (err) {
            console.warn('Dashboard live metrics fetch error:', err);
        } finally {
            setIsDashboardLoading(false);
        }
    }, [selectedCompanyId]);

    const loadCapTable = useCallback(async (forceShowLoading = false) => {
        const cachedFromStorage = readLocalCache<CapTableHolding[]>(CAPTABLE_CACHE_KEY, []);
        const hasExisting = capTableHoldingsRef.current.length > 0 || cachedFromStorage.length > 0;

        if (!hasExisting || forceShowLoading) {
            setIsCapTableLoading(true);
        }

        if (capTableHoldingsRef.current.length === 0 && cachedFromStorage.length > 0) {
            setCapTableHoldings(cachedFromStorage);
            setHasLoadedCapTableOnce(true);
        }

        try {
            const res = await fetch('/api/captable', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const holdings = data.holdings || [];
                setCapTableHoldings(holdings);
                setHasLoadedCapTableOnce(true);
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(CAPTABLE_CACHE_KEY, JSON.stringify(holdings));
                    } catch (e) {
                        console.warn('Failed to save captable cache:', e);
                    }
                }
            }
        } catch (err) {
            console.warn('Failed to load cap table:', err);
        } finally {
            setIsCapTableLoading(false);
        }
    }, []);

    const loadLedgerEvents = useCallback(async (forceShowLoading = false) => {
        const cachedFromStorage = readLocalCache<AuditLedgerEvent[]>(LEDGER_CACHE_KEY, []);
        const hasExisting = ledgerEventsRef.current.length > 0 || cachedFromStorage.length > 0;

        if (!hasExisting || forceShowLoading) {
            setIsLedgerLoading(true);
        }

        if (ledgerEventsRef.current.length === 0 && cachedFromStorage.length > 0) {
            setLedgerEvents(cachedFromStorage);
            setHasLoadedLedgerOnce(true);
        }

        try {
            const res = await fetch('/api/ledger', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const events = data.events || [];
                setLedgerEvents(events);
                setHasLoadedLedgerOnce(true);
                if (typeof window !== 'undefined') {
                    try {
                        localStorage.setItem(LEDGER_CACHE_KEY, JSON.stringify(events));
                    } catch (e) {
                        console.warn('Failed to save ledger cache:', e);
                    }
                }
            }
        } catch (err) {
            console.warn('Failed to load ledger events:', err);
        } finally {
            setIsLedgerLoading(false);
        }
    }, []);

    // Initial mount: run background sync
    useEffect(() => {
        refreshTransactions();
    }, [refreshTransactions]);

    // Background sync dashboard when company changes
    useEffect(() => {
        loadDashboardData(selectedCompanyId, false);
    }, [selectedCompanyId, loadDashboardData]);

    const refreshTransactionsRef = useRef(refreshTransactions);
    refreshTransactionsRef.current = refreshTransactions;
    const loadDashboardDataRef = useRef(loadDashboardData);
    loadDashboardDataRef.current = loadDashboardData;
    const loadLedgerEventsRef = useRef(loadLedgerEvents);
    loadLedgerEventsRef.current = loadLedgerEvents;

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
                    refreshTransactionsRef.current();
                    loadDashboardDataRef.current(selectedCompanyId, false);
                    loadLedgerEventsRef.current(false);
                }
            )
            .subscribe();

        return () => {
            supabaseBrowser.removeChannel(channel);
        };
    }, [selectedCompanyId]);

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
        revenue: '$54,798',
        revenueGrowth: '+18.4% last month',
        orders: '251',
        ordersGrowth: '+12.1% last month',
        customers: '206',
        customersGrowth: '+8.4% last month',
        conversionRate: '5.8%',
        conversionGrowth: '+1.2% last month',
        categoryRevenue: '$54,798',
        categoryPeriod: 'Jan 1 - Sep 30',
        aiTier: 'Outperforming',
        aiScore: 94,
        aiRationale: 'Exceptional net expansion (118% NRR) and industry-low churn (2.1%). Outperforming capital allocation efficiency.',
        highChurnWarning: false,
        churnRate: '2.1%',
        ltv: '$6,850',
        ltvCac: '4.2x',
        subscribers: '206',
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
                dashboardSummaries,
                currentDashboardData: dashboardSummaries[currentCompany.id] || null,
                isDashboardLoading,
                loadDashboardData,
                capTableHoldings,
                isCapTableLoading,
                loadCapTable,
                ledgerEvents,
                isLedgerLoading,
                loadLedgerEvents,
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
