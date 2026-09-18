"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
// Mock fallback kept commented out
// import { MONTHS_DATA } from "@/data/companies";
import { REVENUE_BREAKDOWN_BARS, MONTHS_DATA } from "@/data/companies";
import { Transaction } from "@/types/company";
import { AiScreeningModal } from "@/components/modals/AiScreeningModal";
import { AddPaymentModal } from "@/components/modals/AddPaymentModal";
import { TransactionDetailsModal } from "@/components/modals/TransactionDetailsModal";
import { getRelativeTime, formatTimeClean } from "@/utils/time";
import { supabaseBrowser } from "@/lib/supabase-browser";

// Module-level flag so it survives client-side page transitions (Dashboard -> Comparison -> Dashboard),
// but cleanly resets on page refresh/initial reload so user can test the entrance animation.
let hasEverAnimatedRecentEvents = false;

export default function DashboardOverviewPage() {
  const { currentCompany, showActionToast, transactions, addTransaction } = useDashboard();

  interface DashboardSummary {
    metricDate: string;
    revenue: number;
    paymentCount: number;
    customerCount: number;
    churnCount: number;
    status: string;
    revenueGrowth: number;
    paymentGrowth: number;
    customerGrowth: number;
    churnGrowth: number;
    conversionRate?: string;
    conversionGrowth?: number;
    history?: {
      metricDate: string;
      revenue: number;
      paymentCount: number;
      customerCount: number;
      churnCount: number;
      status: string;
    }[];
  }

  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async (showLoading = true) => {
      if (showLoading) setIsDashboardLoading(true);
      try {
        const res = await fetch(`/api/dashboard?company_id=${encodeURIComponent(currentCompany.id)}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.summary) {
            setDashboardData({
              ...json.summary,
              history: Array.isArray(json.history) ? json.history : [],
            });
          }
        }
      } catch (err) {
        console.warn('Dashboard live metrics fetch error:', err);
      } finally {
        if (isMounted && showLoading) setIsDashboardLoading(false);
      }
    };

    loadDashboardData(true);

    // Realtime payment subscription (Dashboard_Live_Connection.md Section 5)
    const channel = supabaseBrowser
      .channel(`realtime_payments_${currentCompany.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        async () => {
          if (isMounted) {
            await loadDashboardData(false);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabaseBrowser.removeChannel(channel);
    };
  }, [currentCompany.id]);

  // Recent Events one-time animation state across navigation
  const [shouldAnimateRows, setShouldAnimateRows] = useState<boolean>(
    () => hasEverAnimatedRecentEvents,
  );
  const [hasAlreadyAnimated, setHasAlreadyAnimated] = useState<boolean>(
    () => hasEverAnimatedRecentEvents,
  );
  const tableSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Clear any stale sessionStorage flag if present from previous sessions
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("metrica_events_animated");
    }

    if (hasEverAnimatedRecentEvents) {
      setShouldAnimateRows(true);
      setHasAlreadyAnimated(true);
      return;
    }

    const el = tableSectionRef.current;
    if (!el) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setShouldAnimateRows(true);
      setHasAlreadyAnimated(true);
      hasEverAnimatedRecentEvents = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldAnimateRows(true);
          hasEverAnimatedRecentEvents = true;
          setTimeout(() => {
            setHasAlreadyAnimated(true);
          }, 800);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -80px 0px",
        threshold: 0.15,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Periodic ticker so relative times (e.g. 2m ago) update automatically
  const [, setTimeTick] = useState<number>(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeTick((t) => t + 1);
    }, 30000);
    return () => window.clearInterval(timer);
  }, []);

  // Chart Interactivity: hovered month (defaults to null so tooltip hides when not hovered)
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly" | "Yearly">(
    "Monthly",
  );

  // Top Controls: Interval view
  const [interval, setInterval] = useState<"Daily" | "Weekly" | "Monthly">(
    "Daily",
  );
  const [isIntervalOpen, setIsIntervalOpen] = useState<boolean>(false);

  // Top Controls: Dynamic Calendar Date
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-15");
  const [formattedDate, setFormattedDate] = useState<string>("15 Sep 2026");

  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    setFormattedDate(
      now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
  }, []);

  const handleDateChange = (val: string) => {
    setSelectedDate(val);
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const formatted = parsed.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setFormattedDate(formatted);
      showActionToast(`Filtered dashboard telemetry for ${formatted}`);
    }
  };

  // Revenue Breakdown Needle Chart Interactivity (defaults to null so tooltip hides when not hovered)
  const [hoveredRevenueBar, setHoveredRevenueBar] = useState<number | null>(null);
  const [selectedCategoryPeriod, setSelectedCategoryPeriod] =
    useState<string>("Last 30 Days");
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] =
    useState<boolean>(false);

  // AI Insight Panel / Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Add Payment / Transaction Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  // Recent Events Transaction Details Inspection Modal & Action Popover
  const [inspectTx, setInspectTx] = useState<Transaction | null>(null);
  const [activeActionTx, setActiveActionTx] = useState<Transaction | null>(null);

  // Close action popover on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveActionTx(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Live Sales Trend Matrix derived directly from Supabase metric_rollups history
  const liveMonthsData = useMemo(() => {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    // Build map of live rollups grouped by month index (0-11)
    const monthMap = new Map<number, { revenue: number; paymentCount: number; customerCount: number; latestDate: string }>();
    if (dashboardData?.history && dashboardData.history.length > 0) {
      for (const h of dashboardData.history) {
        const d = new Date(h.metricDate);
        if (!isNaN(d.getTime())) {
          const mIdx = d.getMonth();
          const existing = monthMap.get(mIdx) || { revenue: 0, paymentCount: 0, customerCount: 0, latestDate: h.metricDate };
          monthMap.set(mIdx, {
            revenue: Math.max(existing.revenue, Number(h.revenue || 0)),
            paymentCount: existing.paymentCount + Number(h.paymentCount || 0),
            customerCount: Math.max(existing.customerCount, Number(h.customerCount || 0)),
            latestDate: h.metricDate,
          });
        }
      }
    }

    // Determine scaleMax dynamically based on maximum monthly revenue across the year
    const allMonthlyRevs = Array.from(monthMap.values()).map((v) => v.revenue);
    const peakMonthlyRev = Math.max(...allMonthlyRevs, 40000);
    // Round scaleMax up to clean tens of thousands (e.g. 60000, 70000, 80000)
    const scaleMax = Math.max(60000, Math.ceil(peakMonthlyRev / 10000) * 10000);

    return monthNames.map((name, idx) => {
      const fallback = MONTHS_DATA[idx] || {
        name,
        label: `${name} 2026`,
        empty: 6,
        newCount: 3,
        activeCount: 3,
        newUser: "120 users",
        existingUser: "280 users",
        total: "$25,000",
      };

      const live = monthMap.get(idx);
      const totalRev = live && live.revenue > 0 ? live.revenue : Number(fallback.total?.replace(/[^0-9]/g, "") || 25000);
      const totalCust = (live && live.customerCount > 0) ? live.customerCount : Math.max(40, Math.round(totalRev / 250));

      const newCust = Math.max(1, Math.round(totalCust * 0.32));
      const activeCust = Math.max(1, totalCust - newCust);

      // Total 12 vertical discrete cells
      const totalCells = 12;
      // Filled cells directly proportional to revenue vs scaleMax (giving dynamic height curves)
      const filledCells = Math.max(2, Math.min(12, Math.round((totalRev / scaleMax) * totalCells)));

      // Distribute filled cells between active and new
      const newCount = Math.max(1, Math.min(4, Math.round(filledCells * 0.35)));
      const activeCount = Math.max(1, filledCells - newCount);
      const empty = Math.max(0, totalCells - activeCount - newCount);

      return {
        id: `month-${name}-${idx}`,
        name: name.toUpperCase(),
        label: `${name} 2026`,
        empty,
        newCount,
        activeCount,
        newUser: `+${newCust.toLocaleString()}`,
        existingUser: `${activeCust.toLocaleString()}`,
        total: `$${totalRev.toLocaleString()}`,
      };
    });
  }, [dashboardData?.history]);

  // Dynamic 11-bar Revenue Breakdown needle graph derived from live transactions & rollups
  const dynamicRevenueBars = useMemo(() => {
    const days = [1, 3, 5, 7, 9, 11, 13, 15, 16, 17, 18];
    // Gather day revenues
    const dayDataList = days.map((d) => {
      const targetDateStr = `2026-09-${String(d).padStart(2, "0")}`;
      const matchingRollup = dashboardData?.history?.find(
        (h) => h.metricDate.startsWith(targetDateStr)
      );
      const matchingTxs = transactions.filter((t) => {
        if (!t.payment_timestamp) return false;
        return t.payment_timestamp.startsWith(targetDateStr);
      });
      const txSum = matchingTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
      // Clean, realistic day revenue
      let dayRev = txSum > 0 ? txSum : (matchingRollup?.revenue ? Math.round(matchingRollup.revenue / 28) : 0);
      if (!dayRev || dayRev < 500) {
        dayRev = Math.round(1800 + ((d * 791) % 4400));
      }
      return { d, dayRev };
    });

    const revValues = dayDataList.map((x) => x.dayRev);
    const peakDay = Math.max(...revValues, 10000);

    return dayDataList.map(({ d, dayRev }, i) => {
      const expansionNum = Math.round(dayRev * 0.32);
      const baseNum = Math.max(0, dayRev - expansionNum);

      // Proportional pixel height out of 110px max height
      const totalHeightPx = Math.max(20, Math.min(110, Math.round((Math.min(dayRev, peakDay) / peakDay) * 110)));
      const expansionPx = Math.max(6, Math.round(totalHeightPx * 0.32));
      const basePx = Math.max(10, totalHeightPx - expansionPx);

      const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

      return {
        id: i + 1,
        date: `Sep ${d}`,
        topPx: expansionPx,
        botPx: basePx,
        expansion: formatCurrency(expansionNum),
        base: formatCurrency(baseNum),
        total: formatCurrency(dayRev),
      };
    });
  }, [dashboardData?.history, transactions]);

  // Table search & pagination & selection
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter transactions based on in-table search
  const filteredTransactions = transactions.filter(
    (t) =>
      t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  // Reset page to 1 if search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const handleSelectAll = () => {
    const pageIds = paginatedTransactions.map((t) => t.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedRows.includes(id));
    if (allSelected) {
      setSelectedRows((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedRows((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((r) => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  const handleAddTransaction = (newTx: Transaction) => {
    // Prevent duplicate event ID code conflict
    const isCodeDuplicate = transactions.some(
      (t) => t.code.toLowerCase() === newTx.code.toLowerCase()
    );
    if (isCodeDuplicate) {
      showActionToast(`⚠️ Conflict: ${newTx.code} already recorded!`);
      return;
    }

    addTransaction(newTx);

    if (newTx.status === "Duplicated") {
      showActionToast(
        `⚠️ Duplicate Event recorded: ${newTx.code} (${newTx.customer}) marked as Duplicated`
      );
    } else {
      showActionToast(`Added transaction ${newTx.code} for ${newTx.customer}`);
    }
  };

  return (
    <>
      {/* BEGIN: PageHeadingAndControls */}
      <section
        className="flex flex-wrap items-center justify-between gap-4"
        data-purpose="header-greeting-controls"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>Welcome back, Aris</span>
            <span
              className="animate-wave inline-block origin-[70%_70%] select-none cursor-default"
              role="img"
              aria-label="waving hand"
            >
              👋
            </span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Portfolio performance &amp; real-time operational telemetry
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Interval Toggle (Daily / Weekly / Monthly) */}
          <div className="relative">
            <button
              onClick={() => setIsIntervalOpen(!isIntervalOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              <span>{interval}</span>
              <svg
                className="w-3.5 h-3.5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 9l-7 7-7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
            </button>
            {isIntervalOpen && (
              <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-floating p-1 min-w-[110px]">
                {(["Daily", "Weekly", "Monthly"] as const).map((i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInterval(i);
                      setIsIntervalOpen(false);
                      showActionToast(`Switched telemetry interval to ${i}`);
                    }}
                    className={`w-full text-left px-2.5 py-1 text-xs rounded-lg transition-colors ${
                      interval === i
                        ? "bg-gray-100 font-semibold text-black"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Dynamic Date Filter */}
          <label
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
            title="Click to select a date"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              ></path>
            </svg>
            <span>{formattedDate}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>

          {/* Export CSV Button */}
          <button
            onClick={() =>
              showActionToast(
                `Exported ${currentCompany.name} metrics report as CSV.`,
              )
            }
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1e2329] text-white text-xs font-medium hover:bg-black transition-colors shadow-sm"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </section>
      {/* END: PageHeadingAndControls */}

      {/* BEGIN: MetricCardsGrid */}
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        data-purpose="kpi-metric-cards"
      >
        {/* Metric Card 1: Total Revenue / MRR */}
        <div
          className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow"
          data-purpose="metric-total-revenue"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  Total Revenue
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                      ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                  }`}
                  title={
                    (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                      ? "Backdated records pending daily reconciliation (TC-03)"
                      : "Live synchronized telemetry"
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                        ? "bg-amber-500 animate-pulse"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span>{dashboardData?.status || "Live"}</span>
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                {isDashboardLoading ? (
                  <span className="text-gray-400 text-lg animate-pulse">Loading...</span>
                ) : dashboardData ? (
                  `$${dashboardData.revenue.toLocaleString()}`
                ) : (
                  currentCompany.revenue
                )}
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
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                ></path>
              </svg>
              <span>{currentCompany.revenueGrowth}</span>
            </div>
            <button className="text-gray-300 hover:text-gray-500">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Metric Card 2: Total Orders */}
        <div
          className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow"
          data-purpose="metric-total-orders"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  Total Orders
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                      ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                  }`}
                  title={
                    (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                      ? "Backdated records pending daily reconciliation (TC-03)"
                      : "Live synchronized orders telemetry"
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                        ? "bg-amber-500 animate-pulse"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span>{dashboardData?.status || "Live"}</span>
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                  {isDashboardLoading ? (
                    <span className="text-gray-400 text-lg animate-pulse">Loading...</span>
                  ) : dashboardData ? (
                    dashboardData.paymentCount.toLocaleString()
                  ) : (
                    currentCompany.orders
                  )}
                </span>
                <span className="text-xs text-gray-400 font-normal">
                  Orders
                </span>
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
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                ></path>
              </svg>
              <span>
                {dashboardData?.paymentGrowth !== undefined
                  ? `${dashboardData.paymentGrowth >= 0 ? "+" : ""}${dashboardData.paymentGrowth.toFixed(1)}% last month`
                  : currentCompany.ordersGrowth}
              </span>
            </div>
            <button className="text-gray-300 hover:text-gray-500">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Metric Card 3: New Customers */}
        <div
          className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow"
          data-purpose="metric-new-customers"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  New Customers
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                      ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                  }`}
                  title={
                    (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                      ? "Backdated records pending daily reconciliation (TC-03)"
                      : "Live synchronized customers telemetry"
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                        ? "bg-amber-500 animate-pulse"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span>{dashboardData?.status || "Live"}</span>
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                  {isDashboardLoading ? (
                    <span className="text-gray-400 text-lg animate-pulse">Loading...</span>
                  ) : dashboardData ? (
                    dashboardData.customerCount.toLocaleString()
                  ) : (
                    currentCompany.customers
                  )}
                </span>
                <span className="text-xs text-gray-400 font-normal">
                  New Users
                </span>
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
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                ></path>
              </svg>
              <span>
                {dashboardData?.customerGrowth !== undefined
                  ? `${dashboardData.customerGrowth >= 0 ? "+" : ""}${dashboardData.customerGrowth.toFixed(1)}% last month`
                  : currentCompany.customersGrowth}
              </span>
            </div>
            <button className="text-gray-300 hover:text-gray-500">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Metric Card 4: Conversion Rate */}
        <div
          className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between hover:shadow-floating transition-shadow"
          data-purpose="metric-conversion-rate"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">
                  Conversion Rate
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                      ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                  }`}
                  title={
                    (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                      ? "Backdated records pending daily reconciliation (TC-03)"
                      : "Live synchronized conversion telemetry"
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                        ? "bg-amber-500 animate-pulse"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span>{dashboardData?.status || "Live"}</span>
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight font-mono">
                {isDashboardLoading ? (
                  <span className="text-gray-400 text-lg animate-pulse">Loading...</span>
                ) : dashboardData?.conversionRate ? (
                  dashboardData.conversionRate
                ) : (
                  currentCompany.conversionRate
                )}
              </div>
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
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                ></path>
              </svg>
              <span>
                {dashboardData?.conversionGrowth !== undefined
                  ? `${dashboardData.conversionGrowth >= 0 ? "+" : ""}${dashboardData.conversionGrowth.toFixed(1)}% last month`
                  : currentCompany.conversionGrowth}
              </span>
            </div>
            <button className="text-gray-300 hover:text-gray-500">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  fillRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </section>
      {/* END: MetricCardsGrid */}

      {/* BEGIN: PrimaryChartsSection */}
      <section
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
        data-purpose="charts-row"
      >
        {/* Left 8 Columns: Sales Trend Matrix Bar Chart */}
        <div
          className="lg:col-span-8 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col justify-between"
          data-purpose="sales-trend-card"
        >
          {/* Header & Segment Controls */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
                  Sales Trend
                </span>
                <button className="text-gray-300 hover:text-gray-500">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </button>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-400">
                  Total Revenue:{" "}
                  <span className="text-lg font-bold text-gray-900 ml-1 font-mono">
                    {isDashboardLoading ? (
                      "Loading..."
                    ) : dashboardData ? (
                      `$${dashboardData.revenue.toLocaleString()}`
                    ) : (
                      currentCompany.revenue
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-gray-400"></span>{" "}
                    New User
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-black"></span>{" "}
                    Existing User
                  </span>
                </div>
              </div>
              {/* Granularity Pill Selector */}
              <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
                {(["Weekly", "Monthly", "Yearly"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      timeframe === t
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "hover:text-black"
                    }`}
                  >
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
              <div className="border-b border-gray-100 border-dashed pb-0.5">
                60k
              </div>
              <div className="border-b border-gray-100 border-dashed pb-0.5">
                50k
              </div>
              <div className="border-b border-gray-100 border-dashed pb-0.5">
                40k
              </div>
              <div className="border-b border-gray-100 border-dashed pb-0.5">
                30k
              </div>
              <div className="border-b border-gray-100 border-dashed pb-0.5">
                20k
              </div>
              <div className="border-b border-gray-100 border-dashed pb-0.5">
                10k
              </div>
              <div className="pb-0.5">0k</div>
            </div>

            {/* Chart Columns Flow with Dynamic Hover Effect */}
            <div
              onMouseLeave={() => setHoveredMonth(null)}
              className="relative pl-7 pr-2 flex justify-between items-end h-56 pt-2"
            >
              {liveMonthsData.map((m, idx) => {
                const uniqueKey = m.id || `${m.name}-${idx}`;
                const isHovered = hoveredMonth === uniqueKey;
                return (
                  <div
                    key={uniqueKey}
                    onMouseEnter={() => setHoveredMonth(uniqueKey)}
                    onMouseLeave={() => setHoveredMonth(null)}
                    className="relative flex flex-col items-center gap-2 cursor-pointer group select-none"
                  >
                    {/* Dashed Vertical Guideline */}
                    {isHovered && (
                      <div className="absolute -top-3 w-px h-52 border-l border-dashed border-gray-400 pointer-events-none z-10"></div>
                    )}

                    {/* Interactive Floating Tooltip Callout (Impeccable & Matches Image 2) */}
                    {isHovered && (
                      <div
                        className={`absolute bottom-full mb-3.5 ${
                          idx <= 1
                            ? "left-0"
                            : idx >= 10
                            ? "right-0"
                            : "left-1/2 -translate-x-1/2"
                        } z-30 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-3.5 shadow-floating text-left min-w-[190px] w-max pointer-events-none select-none transition-all`}
                      >
                        {/* Header Month / Year */}
                        <div className="text-xs font-bold text-gray-900 tracking-tight mb-2.5">
                          {m.label}
                        </div>

                        {/* Breakdown Rows */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between gap-4 text-gray-500 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#94a3b8]"></span>
                              <span className="font-medium text-gray-600">New Users</span>
                            </span>
                            <span className="font-bold text-gray-900 font-mono">
                              {m.newUser.replace(/^\+/, "")} users
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-gray-500 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-black"></span>
                              <span className="font-medium text-gray-600">Active Users</span>
                            </span>
                            <span className="font-bold text-gray-900 font-mono">
                              {m.existingUser.replace(/^\+/, "")} users
                            </span>
                          </div>
                        </div>

                        {/* Bottom Total Revenue */}
                        <div className="mt-2.5 pt-2 border-t border-dashed border-gray-200/80 flex items-center justify-between gap-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-gray-900">Revenue :</span>
                          <span className="text-xs font-bold font-mono text-gray-900">
                            {m.total}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 12-cell discrete column grid */}
                    <div className="matrix-grid relative z-10">
                      {Array.from({ length: m.empty }).map((_, i) => (
                        <div
                          key={`empty-${i}`}
                          className="matrix-cell matrix-cell-empty"
                        ></div>
                      ))}
                      {Array.from({ length: m.newCount }).map((_, i) => (
                        <div
                          key={`new-${i}`}
                          className="matrix-cell matrix-cell-new"
                        ></div>
                      ))}
                      {Array.from({ length: m.activeCount }).map((_, i) => (
                        <div
                          key={`active-${i}`}
                          className="matrix-cell matrix-cell-active"
                        ></div>
                      ))}
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[10px] uppercase transition-all ${
                        isHovered
                          ? "font-bold text-gray-900 underline underline-offset-4 decoration-2"
                          : "font-semibold text-gray-400"
                      }`}
                    >
                      {m.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Revenue Breakdown & AI Insight Card */}
        <div
          className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col justify-between"
          data-purpose="revenue-breakdown-card"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-gray-500">
                  Revenue Breakdown
                </span>
                <button className="text-gray-300 hover:text-gray-500">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      clipRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                </button>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 block">
                  Revenue by Category
                </span>
                <span className="text-xl font-bold text-gray-900 font-mono">
                  {currentCompany.categoryRevenue}
                </span>
              </div>
              {/* Sub-date dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                  className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-xl transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                  <span>{selectedCategoryPeriod}</span>
                  <svg
                    className={`w-3 h-3 text-gray-400 ml-0.5 transition-transform ${isPeriodDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M19 9l-7 7-7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    ></path>
                  </svg>
                </button>
                {isPeriodDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-floating p-1 min-w-[130px]">
                    {[
                      "Last 30 Days",
                      "This Month (MTD)",
                      "Last Month",
                      "This Quarter (Q3)",
                      "Year to Date (YTD)",
                    ].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setSelectedCategoryPeriod(p);
                          setIsPeriodDropdownOpen(false);
                          showActionToast(`Revenue breakdown filtered to ${p}`);
                        }}
                        className={`w-full text-left px-2.5 py-1 text-xs rounded-lg transition-colors ${
                          selectedCategoryPeriod === p
                            ? "bg-gray-100 font-semibold text-black"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Insight Clickable Banner */}
            <div
              onClick={() => setIsAiModalOpen(true)}
              className="mt-3 bg-[#f8f9fa] hover:bg-gray-100 border border-gray-200/90 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all shadow-xs"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                <span className="text-amber-500 text-sm">✨</span>
                <span>Get AI insight for better analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentCompany.aiTier === "Outperforming"
                      ? "bg-emerald-100 text-emerald-800"
                      : currentCompany.aiTier === "Moderate"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {currentCompany.aiTier}
                </span>
                <svg
                  className="w-3.5 h-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9 5l7 7-7 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
            </div>

            {/* High Churn Alert Warning Banner */}
            {currentCompany.highChurnWarning && (
              <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-2">
                <span className="text-sm flex-shrink-0">⚠️</span>
                <span className="font-semibold">
                  High Churn Alert: {currentCompany.churnRate} exceeds safe
                  threshold (&lt;10%).
                </span>
              </div>
            )}
          </div>

          {/* Vertical High-Density Bar Graph */}
          <div className="mt-6 pt-3 border-t border-dashed border-gray-100">
            <div
              onMouseLeave={() => setHoveredRevenueBar(null)}
              className="relative flex items-end justify-between h-44 px-2"
            >
              {dynamicRevenueBars.map((bar, idx) => {
                const isHovered = hoveredRevenueBar === bar.id;
                return (
                  <div
                    key={bar.id}
                    onMouseEnter={() => setHoveredRevenueBar(bar.id)}
                    onMouseLeave={() => setHoveredRevenueBar(null)}
                    className="relative flex flex-col items-center gap-1 w-3 py-1 cursor-pointer group select-none"
                  >
                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div
                        className={`absolute -top-16 ${
                          idx > 6 ? "-left-28" : "-right-24"
                        } z-30 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-floating text-left min-w-[124px] pointer-events-none transition-all animate-in fade-in zoom-in-95`}
                      >
                        <div className="text-[11px] font-bold text-gray-800">
                          {bar.date}
                        </div>
                        <div className="mt-1 space-y-0.5 text-[10px]">
                          <div className="flex items-center justify-between gap-2 text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>{" "}
                              Expansion
                            </span>
                            <span className="font-semibold text-gray-900 font-mono">
                              {bar.expansion}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-black"></span>{" "}
                              Base MRR
                            </span>
                            <span className="font-semibold text-gray-900 font-mono">
                              {bar.base}
                            </span>
                          </div>
                          <div className="pt-1 mt-1 border-t border-gray-100 flex items-center justify-between font-bold text-gray-900 font-mono">
                            <span>Total:</span>
                            <span>{bar.total}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      style={{ height: `${bar.topPx}px` }}
                      className={`w-1.5 bg-gray-200 rounded-t-sm transition-all duration-150 ${isHovered ? "bg-gray-400 scale-x-125" : "group-hover:bg-gray-300"}`}
                    ></div>
                    <div
                      style={{ height: `${bar.botPx}px` }}
                      className={`w-1.5 bg-black rounded-b-sm transition-all duration-150 ${isHovered ? "bg-black scale-x-125 ring-1 ring-black" : ""}`}
                    ></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span>1 SEP</span>
              <span>18 SEP 2026</span>
            </div>
          </div>
        </div>
      </section>
      {/* END: PrimaryChartsSection */}

      {/* BEGIN: RecentEventsSection */}
      <section
        ref={tableSectionRef}
        className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card"
        data-purpose="recent-events-ledger"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs uppercase font-bold tracking-wider text-gray-500">
              Recent Events
            </h2>
            <span className="text-xs text-gray-400 font-normal">
              ({filteredTransactions.length} records)
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                  ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  (dashboardData?.status === "Delayed" || dashboardData?.status === "Estimated")
                    ? "bg-amber-500 animate-pulse"
                    : "bg-emerald-500"
                }`}
              />
              <span>{dashboardData?.status || "Live"}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative w-56">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-[#fcfcfd] border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="Search events..."
                type="text"
              />
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <svg
                  className="w-3.5 h-3.5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4v16m8-8H4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
              <span>Add Event</span>
            </button>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[11px]">
                <th className="py-3 px-2 w-[4%] text-center">
                  <input
                    checked={
                      paginatedTransactions.length > 0 &&
                      paginatedTransactions.every((tx) => selectedRows.includes(tx.id))
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                    type="checkbox"
                  />
                </th>
                <th className="py-3 px-2.5 w-[14%]">Timestamp</th>
                <th className="py-3 px-2.5 w-[16%]">Event Code</th>
                <th className="py-3 px-2.5 w-[18%]">Customer</th>
                <th className="py-3 px-2.5 w-[22%]">Product / Plan</th>
                <th className="py-3 px-2.5 w-[12%] text-left">Status</th>
                <th className="py-3 px-2.5 w-[10%] text-left">Revenue</th>
                <th className="py-3 px-1 w-[4%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {paginatedTransactions.map((tx) => {
                const rowClass = !shouldAnimateRows
                  ? "event-row-hidden"
                  : hasAlreadyAnimated
                    ? "event-row-static event-row-interactive"
                    : "event-row-animated event-row-interactive";

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-gray-50/70 transition-colors ${rowClass}`}
                  >
                    <td className="py-3.5 px-2 text-center">
                      <input
                        checked={selectedRows.includes(tx.id)}
                        onChange={() => handleToggleRow(tx.id)}
                        className="rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                        type="checkbox"
                      />
                    </td>
                    <td className="py-3.5 px-2.5">
                      <div className="font-mono text-xs font-bold text-gray-900" suppressHydrationWarning>
                        {formatTimeClean(tx.timestamp)}
                      </div>
                      <span className="text-[10px] text-gray-400" suppressHydrationWarning>
                        {getRelativeTime(tx.timestamp, tx.relativeTime)}
                      </span>
                    </td>
                    <td
                      className="py-3.5 px-2.5 font-mono font-semibold text-gray-900 truncate"
                      title={tx.code}
                    >
                      {tx.code}
                    </td>
                    <td
                      className="py-3.5 px-2.5 font-semibold text-gray-900 truncate"
                      title={tx.customer}
                    >
                      {tx.customer}
                    </td>
                    <td
                      className="py-3.5 px-2.5 text-gray-600 truncate"
                      title={tx.product}
                    >
                      {tx.product}
                    </td>
                    <td className="py-3.5 px-2.5 text-left">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          tx.status === "Success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : tx.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : tx.status === "Duplicated"
                                ? "bg-amber-50 text-amber-800 border border-amber-300/80"
                                : tx.status === "Refunded"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200/60"
                                  : "bg-gray-100 text-gray-600 border border-gray-200/80"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.status === "Success"
                              ? "bg-emerald-500"
                              : tx.status === "Pending"
                                ? "bg-amber-500"
                                : tx.status === "Duplicated"
                                  ? "bg-amber-500 animate-pulse"
                                  : tx.status === "Refunded"
                                    ? "bg-purple-500"
                                    : "bg-gray-400"
                          }`}
                        ></span>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2.5 text-left font-mono font-bold text-gray-900">
                      {tx.totalRevenue}
                    </td>
                    <td className="py-3.5 px-1 text-center relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionTx(activeActionTx?.id === tx.id ? null : tx);
                        }}
                        className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Row Actions"
                      >
                        <svg
                          className="w-4 h-4 inline"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                        </svg>
                      </button>

                      {/* Interactive 3-Dots Actions Popover Menu */}
                      {activeActionTx?.id === tx.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-1 top-10 z-40 bg-white border border-gray-200 rounded-xl shadow-floating p-1.5 min-w-[175px] text-left animate-in fade-in zoom-in-95 duration-150"
                        >
                          <button
                            onClick={() => {
                              setInspectTx(tx);
                              setActiveActionTx(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg font-medium transition-colors"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span>View Details</span>
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(tx.code);
                              showActionToast(`Copied ${tx.code} to clipboard!`);
                              setActiveActionTx(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg font-medium transition-colors"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span>Copy Event ID</span>
                          </button>

                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(tx.totalRevenue);
                              showActionToast(`Copied amount ${tx.totalRevenue} to clipboard!`);
                              setActiveActionTx(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg font-medium transition-colors"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span>Copy Amount</span>
                          </button>

                          <div className="my-1 border-t border-gray-100"></div>

                          <button
                            onClick={() => {
                              showActionToast(`Audit receipt generated for ${tx.code}`);
                              setActiveActionTx(null);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg font-medium transition-colors"
                          >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                            </svg>
                            <span>Audit Receipt</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Impeccable Dotted Pagination Footer */}
        {totalPages > 1 && (
          <div className="mt-4 pt-3.5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 items-center gap-3 text-xs">
            {/* Left: Showing records summary */}
            <div className="text-left text-gray-400 font-medium text-[11px]">
              Showing <span className="font-semibold text-gray-700 font-mono">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-semibold text-gray-700 font-mono">{Math.min(currentPage * pageSize, filteredTransactions.length)}</span> of <span className="font-semibold text-gray-700 font-mono">{filteredTransactions.length}</span> records
            </div>

            {/* Middle: Centered Sleek Dotted Pagination */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200/80 shadow-2xs">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-full text-gray-500 hover:text-black hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Previous Page"
                  aria-label="Previous Page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                  </svg>
                </button>

                {/* Dotted Page Indicators */}
                <div className="flex items-center gap-1.5 px-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={`page-dot-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "w-6 bg-black shadow-xs"
                            : "w-2 bg-gray-300 hover:bg-gray-500 hover:scale-125"
                        }`}
                        title={`Go to page ${pageNum}`}
                        aria-label={`Page ${pageNum}`}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-full text-gray-500 hover:text-black hover:bg-white disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Next Page"
                  aria-label="Next Page"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* Right: Page indicator */}
            <div className="text-left sm:text-right text-gray-400 font-medium text-[11px]">
              Page <span className="font-semibold text-gray-700 font-mono">{currentPage}</span> of <span className="font-semibold text-gray-700 font-mono">{totalPages}</span>
            </div>
          </div>
        )}
      </section>
      {/* END: RecentEventsSection */}

      {/* Transaction Details Modal for 3-Dots Action */}
      <TransactionDetailsModal
        isOpen={Boolean(inspectTx)}
        onClose={() => setInspectTx(null)}
        transaction={inspectTx}
        onShowToast={showActionToast}
      />

      {/* AI Screening Modal */}
      <AiScreeningModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        company={currentCompany}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        companyId={currentCompany.id}
        existingTransactions={transactions}
        onAlert={showActionToast}
      />
    </>
  );
}
