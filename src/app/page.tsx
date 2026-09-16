"use client";

import { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { MONTHS_DATA, REVENUE_BREAKDOWN_BARS, INITIAL_TRANSACTIONS } from '@/data/companies';
import { Transaction } from '@/types/company';
import { AiScreeningModal } from '@/components/modals/AiScreeningModal';
import { AddPaymentModal } from '@/components/modals/AddPaymentModal';

export default function DashboardOverviewPage() {
    const { currentCompany, showActionToast } = useDashboard();

    // Chart Interactivity: hovered month (defaults to 'Jun')
    const [hoveredMonth, setHoveredMonth] = useState<string | null>('Jun');
    const [timeframe, setTimeframe] = useState<'Weekly' | 'Monthly' | 'Yearly'>('Monthly');

    // Top Controls
    const [interval, setInterval] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
    const [isIntervalOpen, setIsIntervalOpen] = useState<boolean>(false);

    // Revenue Breakdown Needle Chart Interactivity
    const [hoveredRevenueBar, setHoveredRevenueBar] = useState<number | null>(7);
    const [selectedCategoryPeriod, setSelectedCategoryPeriod] = useState<string>('Jan 1 - Aug 30');
    const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState<boolean>(false);

    // AI Insight Panel / Modal
    const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
    const [dashboardData, setDashboardData] = useState<{
        summary: {
            revenue: number;
            paymentCount: number;
            customerCount: number;
            churnCount: number;
            revenueGrowth: number;
            paymentGrowth: number;
            customerGrowth: number;
            churnGrowth: number;
        };
        history: {
            metricDate: string;
            revenue: number;
            paymentCount: number;
            customerCount: number;
            churnCount: number;
            status: string;
        }[];
    } | null>(null);

    const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsDashboardLoading(true);

            try {
                const response = await fetch(
                    `/api/dashboard?company_id=${encodeURIComponent(currentCompany.id)}`
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to load dashboard data');
                }

                setDashboardData(result);
            } catch (error) {
                console.error('Dashboard data error:', error);
            } finally {
                setIsDashboardLoading(false);
            }
        };

        loadDashboardData();
    }, [currentCompany.id]);

    interface AiEvaluation {
        companyId: string;
        companyName: string;
        aiTier: 'Prime' | 'Good' | 'Risky';
        aiScore: number;
        aiRationale: string;
        highChurnWarning: boolean;
    }

    const [aiEvaluation, setAiEvaluation] = useState<AiEvaluation | null>(null);
    const [isAiEvaluationLoading, setIsAiEvaluationLoading] = useState<boolean>(false);

    const handleAiEvaluation = async () => {
        setIsAiEvaluationLoading(true);

        try {
            const response = await fetch('/api/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    company_id: currentCompany.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'AI evaluation failed');
            }

            console.log('AI Evaluation API Result:', result);
            setAiEvaluation(result.evaluation);
            setIsAiModalOpen(true);
        } catch (error) {
            console.error('AI evaluation error:', error);
            showActionToast('Unable to load AI evaluation.');
        } finally {
            setIsAiEvaluationLoading(false);
        }
    };

    // Add Payment / Transaction Modal
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

    // Table search & selection
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

    // Filter transactions based on in-table search
    const filteredTransactions = transactions.filter(t =>
        t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectAll = () => {
        if (selectedRows.length === filteredTransactions.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredTransactions.map(t => t.id));
        }
    };

    const handleToggleRow = (id: string) => {
        if (selectedRows.includes(id)) {
            setSelectedRows(selectedRows.filter(r => r !== id));
        } else {
            setSelectedRows([...selectedRows, id]);
        }
    };

    const handleAddTransaction = (newTx: Transaction) => {
        setTransactions([newTx, ...transactions]);
        showActionToast(`Added transaction ${newTx.code} for ${newTx.customer}`);
    };

    return (
        <>
            {/* BEGIN: PageHeadingAndControls */}
            <section className="flex flex-wrap items-center justify-between gap-4" data-purpose="header-greeting-controls">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, Aris</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Portfolio performance &amp; real-time operational telemetry</p>
                </div>
                <div className="flex items-center gap-2.5">
                    {/* Interval Toggle (Daily / Weekly / Monthly) */}
                    <div className="relative">
                        <button
                            onClick={() => setIsIntervalOpen(!isIntervalOpen)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                            <span>{interval}</span>
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                        </button>
                        {isIntervalOpen && (
                            <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-floating p-1 min-w-[110px]">
                                {(['Daily', 'Weekly', 'Monthly'] as const).map(i => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setInterval(i);
                                            setIsIntervalOpen(false);
                                        }}
                                        className={`w-full text-left px-2.5 py-1 text-xs rounded-lg transition-colors ${
                                            interval === i ? 'bg-gray-100 font-semibold text-black' : 'text-gray-600 hover:bg-gray-50'
                                        }`}>
                                        {i}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                        </svg>
                        <span>6 Nov 2025</span>
                    </div>

                    {/* Export CSV Button */}
                    <button
                        onClick={() => showActionToast(`Exported ${currentCompany.name} metrics report as CSV.`)}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1e2329] text-white text-xs font-medium hover:bg-black transition-colors shadow-sm">
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
                {/* Metric Card 1: Total Revenue / MRR */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow" data-purpose="metric-total-revenue">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Total Revenue</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                                {isDashboardLoading
                                    ? 'Loading...'
                                    : dashboardData
                                        ? `$${dashboardData.summary.revenue.toLocaleString()}`
                                        : currentCompany.revenue}
                            </div>
                        </div>
                        {/* Micro Sparkline Bar Chart */}
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
                            <span>
                                {isDashboardLoading
                                    ? 'Loading...'
                                    : dashboardData
                                        ? `${dashboardData.summary.revenueGrowth}%`
                                        : currentCompany.revenueGrowth}
                            </span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Metric Card 2: Total Orders */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow" data-purpose="metric-total-orders">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Total Orders</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                                    {isDashboardLoading
                                        ? 'Loading...'
                                        : dashboardData
                                            ? dashboardData.summary.paymentCount.toLocaleString()
                                            : currentCompany.orders}
                                </span>
                                <span className="text-xs text-gray-400 font-normal">Orders</span>
                            </div>
                        </div>
                        {/* Micro Sparkline Bar Chart */}
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
                            <span>
                                {isDashboardLoading
                                    ? 'Loading...'
                                    : dashboardData
                                        ? `${dashboardData.summary.paymentGrowth}%`
                                        : currentCompany.ordersGrowth}
                            </span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Metric Card 3: New Customers */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow" data-purpose="metric-new-customers">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">New Customers</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                                    {isDashboardLoading
                                        ? 'Loading...'
                                        : dashboardData
                                            ? dashboardData.summary.customerCount.toLocaleString()
                                            : currentCompany.customers}
                                </span>
                                <span className="text-xs text-gray-400 font-normal">New Users</span>
                            </div>
                        </div>
                        {/* Micro Sparkline Bar Chart */}
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-3"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-7"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
                            <div className="w-1 bg-gray-200 rounded-full h-4"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                            </svg>
                            <span>
                                {isDashboardLoading
                                    ? 'Loading...'
                                    : dashboardData
                                        ? `${dashboardData.summary.customerGrowth}%`
                                        : currentCompany.customersGrowth}
                            </span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Metric Card 4: Conversion Rate */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow" data-purpose="metric-conversion-rate">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Conversion Rate</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900 tracking-tight font-mono">{currentCompany.conversionRate}</div>
                        </div>
                        {/* Micro Sparkline Bar Chart */}
                        <div className="flex items-end gap-1 h-8 pt-1">
                            <div className="w-1 bg-gray-200 rounded-full h-3"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-4"></div>
                            <div className="w-1 bg-gray-400 rounded-full h-6"></div>
                            <div className="w-1 bg-gray-900 rounded-full h-8"></div>
                            <div className="w-1 bg-gray-300 rounded-full h-5"></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                            </svg>
                            <span>{currentCompany.conversionGrowth}</span>
                        </div>
                        <button className="text-gray-300 hover:text-gray-500">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </section>
            {/* END: MetricCardsGrid */}

            {/* BEGIN: PrimaryChartsSection */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4" data-purpose="charts-row">
                {/* Left 8 Columns: Sales Trend Matrix Bar Chart */}
                <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col justify-between" data-purpose="sales-trend-card">
                    {/* Header & Segment Controls */}
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs uppercase font-bold tracking-wider text-gray-500">Sales Trend</span>
                                <button className="text-gray-300 hover:text-gray-500">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                                    </svg>
                                </button>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-xs text-gray-400">
                                    Total Revenue: <span className="text-lg font-bold text-gray-900 ml-1 font-mono">{currentCompany.revenue}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full border border-gray-400"></span> New User
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-black"></span> Existing User
                                    </span>
                                </div>
                            </div>
                            {/* Granularity Pill Selector */}
                            <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
                                {(['Weekly', 'Monthly', 'Yearly'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTimeframe(t)}
                                        className={`px-2.5 py-1 rounded-lg transition-all ${
                                            timeframe === t
                                                ? 'bg-white text-black font-semibold shadow-xs'
                                                : 'hover:text-black'
                                        }`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Matrix Pixel Bar Chart Container */}
                    <div className="relative mt-6 pt-4 pb-2 border-t border-dashed border-gray-100">
                        {/* Background Scale ticks */}
                        <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none text-[10px] text-gray-300 font-mono">
                            <div className="border-b border-gray-100 border-dashed pb-0.5">60k</div>
                            <div className="border-b border-gray-100 border-dashed pb-0.5">50k</div>
                            <div className="border-b border-gray-100 border-dashed pb-0.5">40k</div>
                            <div className="border-b border-gray-100 border-dashed pb-0.5">30k</div>
                            <div className="border-b border-gray-100 border-dashed pb-0.5">20k</div>
                            <div className="border-b border-gray-100 border-dashed pb-0.5">10k</div>
                            <div className="pb-0.5">0k</div>
                        </div>

                        {/* Chart Columns Flow with Dynamic Hover Effect */}
                        <div
                            onMouseLeave={() => setHoveredMonth('Jun')}
                            className="relative pl-7 pr-2 flex justify-between items-end h-56 pt-2">
                            {MONTHS_DATA.map((m, idx) => {
                                const isHovered = hoveredMonth === m.name;
                                return (
                                    <div
                                        key={m.name}
                                        onMouseEnter={() => setHoveredMonth(m.name)}
                                        className="relative flex flex-col items-center gap-2 cursor-pointer group select-none">
                                        {/* Dashed Vertical Guideline */}
                                        {isHovered && (
                                            <div className="absolute -top-3 w-px h-52 border-l border-dashed border-gray-400 pointer-events-none z-10"></div>
                                        )}

                                        {/* Interactive Floating Tooltip Callout */}
                                        {isHovered && (
                                            <div
                                                className={`absolute -top-7 ${
                                                    idx > 7 ? '-left-28' : '-right-16'
                                                } z-20 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-floating text-left min-w-[124px] pointer-events-none transition-all`}>
                                                <div className="text-[11px] font-semibold text-gray-800">{m.label}</div>
                                                <div className="mt-1 space-y-0.5 text-[10px]">
                                                    <div className="flex items-center justify-between gap-2 text-gray-500">
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> New User
                                                        </span>
                                                        <span className="font-semibold text-gray-900 font-mono">{m.newUser}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 text-gray-500">
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-black"></span> Existing User
                                                        </span>
                                                        <span className="font-semibold text-gray-900 font-mono">{m.existingUser}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 12-cell discrete column grid */}
                                        <div className="matrix-grid relative z-10">
                                            {Array.from({ length: m.empty }).map((_, i) => (
                                                <div key={`empty-${i}`} className="matrix-cell matrix-cell-empty"></div>
                                            ))}
                                            {Array.from({ length: m.newCount }).map((_, i) => (
                                                <div key={`new-${i}`} className="matrix-cell matrix-cell-new"></div>
                                            ))}
                                            {Array.from({ length: m.activeCount }).map((_, i) => (
                                                <div key={`active-${i}`} className="matrix-cell matrix-cell-active"></div>
                                            ))}
                                        </div>

                                        {/* Month Label */}
                                        <span
                                            className={`text-[10px] uppercase transition-all ${
                                                isHovered
                                                    ? 'font-bold text-gray-900 underline underline-offset-4 decoration-2'
                                                    : 'font-semibold text-gray-400'
                                            }`}>
                                            {m.name}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right 4 Columns: Revenue Breakdown & AI Insight Card */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col justify-between" data-purpose="revenue-breakdown-card">
                    {/* Header */}
                    <div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs uppercase font-bold tracking-wider text-gray-500">Revenue Breakdown</span>
                                <button className="text-gray-300 hover:text-gray-500">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"></path>
                                    </svg>
                                </button>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                </svg>
                            </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                            <div>
                                <span className="text-xs text-gray-400 block">Revenue by Category</span>
                                <span className="text-xl font-bold text-gray-900 font-mono">{currentCompany.categoryRevenue}</span>
                            </div>
                            {/* Sub-date dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                                    className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-xl transition-colors">
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                    </svg>
                                    <span>{selectedCategoryPeriod}</span>
                                    <svg className={`w-3 h-3 text-gray-400 ml-0.5 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                    </svg>
                                </button>
                                {isPeriodDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-floating p-1 min-w-[130px]">
                                        {['Jan 1 - Aug 30', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Year to Date'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => {
                                                    setSelectedCategoryPeriod(p);
                                                    setIsPeriodDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-2.5 py-1 text-xs rounded-lg transition-colors ${
                                                    selectedCategoryPeriod === p ? 'bg-gray-100 font-semibold text-black' : 'text-gray-600 hover:bg-gray-50'
                                                }`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Insight Clickable Banner */}
                        <div
                            onClick={handleAiEvaluation}
                            className="mt-3 bg-[#f8f9fa] hover:bg-gray-100 border border-gray-200/90 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all shadow-xs">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                                <span className="text-amber-500 text-sm">✨</span>
                                <span>Get AI insight for better analysis</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    currentCompany.aiTier === 'Prime' ? 'bg-emerald-100 text-emerald-800' :
                                    currentCompany.aiTier === 'Good' ? 'bg-blue-100 text-blue-800' :
                                    'bg-rose-100 text-rose-800'
                                }`}>
                                    {currentCompany.aiTier}
                                </span>
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                </svg>
                            </div>
                        </div>

                        {/* High Churn Alert Warning Banner */}
                        {currentCompany.highChurnWarning && (
                            <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                                <span className="text-sm flex-shrink-0">⚠️</span>
                                <span className="font-semibold">
                                    High Churn Alert: {currentCompany.churnRate} exceeds safe threshold (&lt;10%).
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Vertical High-Density Bar Graph */}
                    <div className="mt-6 pt-3 border-t border-dashed border-gray-100">
                        <div className="relative flex items-end justify-between h-44 px-2">
                            {REVENUE_BREAKDOWN_BARS.map((bar, idx) => {
                                const isHovered = hoveredRevenueBar === bar.id;
                                return (
                                    <div
                                        key={bar.id}
                                        onMouseEnter={() => setHoveredRevenueBar(bar.id)}
                                        className="relative flex flex-col items-center gap-1 w-3 py-1 cursor-pointer group select-none">
                                        {/* Hover Floating Tooltip */}
                                        {isHovered && (
                                            <div
                                                className={`absolute -top-16 ${
                                                    idx > 6 ? '-left-28' : '-right-24'
                                                } z-30 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-floating text-left min-w-[124px] pointer-events-none transition-all animate-in fade-in zoom-in-95`}>
                                                <div className="text-[11px] font-bold text-gray-800">{bar.date}</div>
                                                <div className="mt-1 space-y-0.5 text-[10px]">
                                                    <div className="flex items-center justify-between gap-2 text-gray-500">
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Expansion
                                                        </span>
                                                        <span className="font-semibold text-gray-900 font-mono">{bar.expansion}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2 text-gray-500">
                                                        <span className="inline-flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-black"></span> Base MRR
                                                        </span>
                                                        <span className="font-semibold text-gray-900 font-mono">{bar.base}</span>
                                                    </div>
                                                    <div className="pt-1 mt-1 border-t border-gray-100 flex items-center justify-between font-bold text-gray-900 font-mono">
                                                        <span>Total:</span>
                                                        <span>{bar.total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className={`w-1.5 bg-gray-200 rounded-t-sm ${bar.topH} transition-all duration-150 ${isHovered ? 'bg-gray-400 scale-x-125' : 'group-hover:bg-gray-300'}`}></div>
                                        <div className={`w-1.5 bg-black rounded-b-sm ${bar.botH} transition-all duration-150 ${isHovered ? 'bg-black scale-x-125 ring-1 ring-black' : ''}`}></div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                            <span>1 JAN</span>
                            <span>30 JAN 2025</span>
                        </div>
                    </div>
                </div>
            </section>
            {/* END: PrimaryChartsSection */}

            {/* BEGIN: RecentTransactionsSection */}
            <section className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card" data-purpose="recent-transactions-ledger">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xs uppercase font-bold tracking-wider text-gray-500">Recent Transactions</h2>
                        <span className="text-xs text-gray-400 font-normal">
                            ({filteredTransactions.length} records)
                        </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="relative w-56">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1 bg-[#fcfcfd] border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
                                placeholder="Search transactions..."
                                type="text"
                            />
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                </svg>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span>Add Transaction</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[11px]">
                                <th className="py-3 px-2 w-8">
                                    <input
                                        checked={selectedRows.length === filteredTransactions.length && filteredTransactions.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                                        type="checkbox"
                                    />
                                </th>
                                <th className="py-3 px-3">Transaction ID</th>
                                <th className="py-3 px-3">Customer</th>
                                <th className="py-3 px-3">Product / Plan</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3 text-center">Qty</th>
                                <th className="py-3 px-3 text-right">Unit Price</th>
                                <th className="py-3 px-3 text-right">Total Revenue</th>
                                <th className="py-3 px-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                                    <td className="py-3.5 px-2">
                                        <input
                                            checked={selectedRows.includes(tx.id)}
                                            onChange={() => handleToggleRow(tx.id)}
                                            className="rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                                            type="checkbox"
                                        />
                                    </td>
                                    <td className="py-3.5 px-3 font-mono text-gray-400">{tx.code}</td>
                                    <td className="py-3.5 px-3 font-semibold text-gray-900">{tx.customer}</td>
                                    <td className="py-3.5 px-3 text-gray-600">{tx.product}</td>
                                    <td className="py-3.5 px-3">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                                                tx.status === 'Success'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                                    : tx.status === 'Pending'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                                    : 'bg-gray-100 text-gray-600 border border-gray-200/80'
                                            }`}>
                                            <span
                                                className={`w-1.5 h-1.5 rounded-full ${
                                                    tx.status === 'Success'
                                                        ? 'bg-emerald-500'
                                                        : tx.status === 'Pending'
                                                        ? 'bg-amber-500'
                                                        : 'bg-gray-400'
                                                }`}></span>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-3 text-center font-mono text-gray-600">{tx.qty}</td>
                                    <td className="py-3.5 px-3 text-right font-mono text-gray-900">{tx.unitPrice}</td>
                                    <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">{tx.totalRevenue}</td>
                                    <td className="py-3.5 px-3 text-center">
                                        <button className="text-gray-300 hover:text-gray-600">
                                            <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
            {/* END: RecentTransactionsSection */}

            {/* AI Screening Modal */}
            <AiScreeningModal
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                company={
                    aiEvaluation
                        ? {
                              ...currentCompany,
                              aiTier: aiEvaluation.aiTier,
                              aiScore: aiEvaluation.aiScore,
                              aiRationale: aiEvaluation.aiRationale,
                              highChurnWarning: aiEvaluation.highChurnWarning,
                          }
                        : currentCompany
                }
            />

            {/* Add Payment Modal */}
            <AddPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onAddTransaction={handleAddTransaction}
                companyId={currentCompany.id}
            />
        </>
    );
}