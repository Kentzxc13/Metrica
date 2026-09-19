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

  // Chart Interactivity: hovered column index (0-47, defaults to null so tooltip hides when not hovered)
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
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
  const [isTableOptionsOpen, setIsTableOptionsOpen] = useState<boolean>(false);

  // Close action popover and dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveActionTx(null);
      setIsPeriodDropdownOpen(false);
      setIsTableOptionsOpen(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Filter 1: Dynamic Sales Trend Result reacting to timeframe (Weekly | Monthly | Yearly)
  const salesTrendResult = useMemo(() => {
    const baseCompRev =
      Number(currentCompany.revenue?.replace(/[^0-9]/g, "") || "") ||
      (currentCompany as unknown as { baseRev?: number }).baseRev ||
      48000;

    // Build map of live rollups grouped by month index (0-11)
    const monthMap = new Map<
      number,
      { revenue: number; paymentCount: number; customerCount: number; latestDate: string }
    >();
    if (dashboardData?.history && dashboardData.history.length > 0) {
      for (const h of dashboardData.history) {
        const d = new Date(h.metricDate);
        if (!isNaN(d.getTime())) {
          const mIdx = d.getMonth();
          const existing = monthMap.get(mIdx) || {
            revenue: 0,
            paymentCount: 0,
            customerCount: 0,
            latestDate: h.metricDate,
          };
          // Defensive clamp: protect against any test spikes > 120k for monthly aggregation
          const rawRev = Number(h.revenue || 0);
          const safeRev = rawRev > 120000 ? Math.round(baseCompRev * 1.05) : rawRev;
          const rawCust = Number(h.customerCount || 0);
          const safeCust = rawCust > 10 ? rawCust : Math.max(120, Math.round(safeRev / 260));

          monthMap.set(mIdx, {
            revenue: Math.max(existing.revenue, safeRev),
            paymentCount: existing.paymentCount + Number(h.paymentCount || 0),
            customerCount: Math.max(existing.customerCount, safeCust),
            latestDate: h.metricDate,
          });
        }
      }
    }

    // 48-Column Base Wave Silhouette (undulating wave line formed by discrete square cells)
    // Matches the reference image: peaks at FEB, MAY, JUL, OCT, DEC; troughs at APR, JUN, AUG, NOV
    const WAVE_CONTOURS = [
      // JAN (cols 0-3)
      { active: 2, new: 2 }, { active: 3, new: 3 }, { active: 5, new: 4 }, { active: 3, new: 2 },
      // FEB (cols 4-7) - peak
      { active: 4, new: 5 }, { active: 6, new: 7 }, { active: 5, new: 6 }, { active: 4, new: 4 },
      // MAR (cols 8-11)
      { active: 3, new: 4 }, { active: 4, new: 5 }, { active: 4, new: 5 }, { active: 3, new: 3 },
      // APR (cols 12-15) - valley then sharp start
      { active: 2, new: 2 }, { active: 2, new: 2 }, { active: 3, new: 4 }, { active: 5, new: 7 },
      // MAY (cols 16-19) - steep spike!
      { active: 6, new: 9 }, { active: 7, new: 11 }, { active: 5, new: 8 }, { active: 3, new: 5 },
      // JUN (cols 20-23) - valley (matching tooltip in image: active ~5, new ~6)
      { active: 2, new: 3 }, { active: 4, new: 5 }, { active: 5, new: 6 }, { active: 3, new: 4 },
      // JUL (cols 24-27) - sharp peak!
      { active: 5, new: 8 }, { active: 7, new: 10 }, { active: 4, new: 6 }, { active: 2, new: 3 },
      // AUG (cols 28-31) - valley
      { active: 1, new: 2 }, { active: 2, new: 2 }, { active: 2, new: 3 }, { active: 3, new: 3 },
      // SEP (cols 32-35) - mid wave
      { active: 3, new: 4 }, { active: 5, new: 5 }, { active: 6, new: 5 }, { active: 3, new: 4 },
      // OCT (cols 36-39) - sharp peak
      { active: 4, new: 6 }, { active: 7, new: 9 }, { active: 5, new: 7 }, { active: 3, new: 4 },
      // NOV (cols 40-43) - valley
      { active: 2, new: 3 }, { active: 2, new: 2 }, { active: 3, new: 3 }, { active: 4, new: 4 },
      // DEC (cols 44-47) - end peak
      { active: 3, new: 5 }, { active: 5, new: 7 }, { active: 6, new: 8 }, { active: 4, new: 5 },
    ];

    if (timeframe === "Weekly") {
      const monthLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];
      // Scale based on users (Image 2: 0k - 60k headcount ticks)
      const ticks = ["60k", "50k", "40k", "30k", "20k", "10k", "0k"];
      const totalRev = Math.round(baseCompRev * 0.95);

      const columns = WAVE_CONTOURS.map((c, i) => {
        const wIdx = Math.floor(i / 4);
        const activeCells = Math.max(1, Math.min(8, c.active));
        const newCells = Math.max(1, Math.min(20 - activeCells, c.new));
        const emptyCells = Math.max(0, 20 - activeCells - newCells);

        // 20 cells max = 60k users (3,000 users per discrete cell)
        const newUsersVal = Math.round(newCells * 3000);
        const existingUsersVal = Math.round(activeCells * 3000);
        const totalUsersVal = newUsersVal + existingUsersVal;
        const weekRev = Math.round((baseCompRev / 4) * (0.88 + (((wIdx * 17) % 25) / 100)));

        return {
          id: `col-w-${i}`,
          colIndex: i,
          monthIndex: wIdx,
          monthLabel: `Week ${wIdx + 1} (Q3 2026)`,
          activeCells,
          newCells,
          emptyCells,
          newUserFormatted: `${Math.round(newUsersVal / 1000)}k`,
          existingUserFormatted: `${Math.round(existingUsersVal / 1000)}k`,
          totalUsersFormatted: `${Math.round(totalUsersVal / 1000)}k`,
          revenueFormatted: `$${weekRev.toLocaleString()}`,
        };
      });

      return {
        columns,
        monthLabels,
        ticks,
        totalRevenue: `$${totalRev.toLocaleString()}`,
      };
    }

    if (timeframe === "Yearly") {
      const monthLabels = ["2021", "2022", "2023", "2024", "2025", "2026"];
      // Scale based on users (Image 2: 0k - 60k headcount ticks)
      const ticks = ["60k", "50k", "40k", "30k", "20k", "10k", "0k"];
      const yearlyRevs = [184500, 238200, 317828, 386400, 452000, 538900];
      const totalRev = Math.round(baseCompRev * 5.8);

      const columns = WAVE_CONTOURS.map((c, i) => {
        const yIdx = Math.floor(i / 8);
        const year = monthLabels[yIdx];
        const activeCells = Math.max(1, Math.min(8, c.active));
        const newCells = Math.max(1, Math.min(20 - activeCells, c.new));
        const emptyCells = Math.max(0, 20 - activeCells - newCells);

        // 20 cells max = 60k users (3,000 users per discrete cell)
        const newUsersVal = Math.round(newCells * 3000);
        const existingUsersVal = Math.round(activeCells * 3000);
        const totalUsersVal = newUsersVal + existingUsersVal;
        const revVal = yearlyRevs[yIdx] || Math.round(baseCompRev * 5.8);

        return {
          id: `col-y-${i}`,
          colIndex: i,
          monthIndex: yIdx,
          monthLabel: `Fiscal Year ${year}`,
          activeCells,
          newCells,
          emptyCells,
          newUserFormatted: `${Math.round(newUsersVal / 1000)}k`,
          existingUserFormatted: `${Math.round(existingUsersVal / 1000)}k`,
          totalUsersFormatted: `${Math.round(totalUsersVal / 1000)}k`,
          revenueFormatted: `$${revVal.toLocaleString()}`,
        };
      });

      return {
        columns,
        monthLabels,
        ticks,
        totalRevenue: `$${totalRev.toLocaleString()}`,
      };
    }

    // Default: "Monthly" (12 months of 2026)
    const monthLabels = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    // Scale based on users (Image 2: 0k - 60k headcount ticks)
    const ticks = ["60k", "50k", "40k", "30k", "20k", "10k", "0k"];

    // Base monthly seasonal distribution
    const monthlyBaseRevs = [
      42300, 45800, 51200, 48600, 53400, 57800,
      61200, 54798, 32800, 49600, 46100, 58400,
    ];

    // Compute live monthly scaling factors
    const columns = WAVE_CONTOURS.map((c, i) => {
      const mIdx = Math.floor(i / 4);
      const mName = monthLabels[mIdx];
      const live = monthMap.get(mIdx);
      const liveFactor = live && live.revenue > 0 ? Math.min(1.2, Math.max(0.85, live.revenue / baseCompRev)) : 1.0;

      const activeCells = Math.max(1, Math.min(8, Math.round(c.active * liveFactor)));
      const newCells = Math.max(1, Math.min(20 - activeCells, Math.round(c.new * liveFactor)));
      const emptyCells = Math.max(0, 20 - activeCells - newCells);

      // 20 cells max = 60k users (3,000 users per discrete cell)
      const newUsersVal = Math.round(newCells * 3000);
      const existingUsersVal = Math.round(activeCells * 3000);
      const totalUsersVal = newUsersVal + existingUsersVal;
      const mRev = live && live.revenue > 0 ? live.revenue : Math.round((monthlyBaseRevs[mIdx] || baseCompRev) * (baseCompRev / 54000));

      return {
        id: `col-m-${i}`,
        colIndex: i,
        monthIndex: mIdx,
        monthLabel: `${mName.charAt(0) + mName.slice(1).toLowerCase()} 2026`,
        activeCells,
        newCells,
        emptyCells,
        newUserFormatted: `${Math.round(newUsersVal / 1000)}k`,
        existingUserFormatted: `${Math.round(existingUsersVal / 1000)}k`,
        totalUsersFormatted: `${Math.round(totalUsersVal / 1000)}k`,
        revenueFormatted: `$${mRev.toLocaleString()}`,
      };
    });

    const totalRevVal = currentCompany.revenue
      ? currentCompany.revenue
      : "$20,320";

    return {
      columns,
      monthLabels,
      ticks,
      totalRevenue: totalRevVal,
    };
  }, [timeframe, dashboardData?.history, currentCompany]);

  // Filter 2: Dynamic Revenue Breakdown Result reacting to selectedCategoryPeriod
  const revenueBreakdownResult = useMemo(() => {
    const baseCompRev =
      Number(currentCompany.revenue?.replace(/[^0-9]/g, "") || "") ||
      (currentCompany as unknown as { baseRev?: number }).baseRev ||
      54000;

    // Find monthly rollups from database history
    const getMonthRollup = (mIdx: number) => {
      return dashboardData?.history?.find((h) => {
        const d = new Date(h.metricDate);
        return d.getMonth() === mIdx;
      });
    };

    const augRollup = getMonthRollup(7);
    const sepRollup = getMonthRollup(8);
    const julRollup = getMonthRollup(6);

    let totalCategoryRevenue = 54798;
    let dateRange = { start: "1 AUG", end: "31 AUG 2026" };
    let points: Array<{ label: string; amount: number }> = [];

    if (selectedCategoryPeriod === "Last Month") {
      // Full August 2026 performance
      totalCategoryRevenue = augRollup && augRollup.revenue > 0 ? augRollup.revenue : 54798;
      dateRange = { start: "1 AUG", end: "31 AUG 2026" };
      const days = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31];
      points = days.map((d) => {
        const dayRev = Math.round(
          (totalCategoryRevenue / 31) * (0.86 + (((d * 19) % 28) / 100))
        );
        return { label: `Aug ${d}`, amount: dayRev };
      });
    } else if (selectedCategoryPeriod === "This Month (MTD)") {
      // September 1 - 18, 2026
      const fullSepRev = sepRollup && sepRollup.revenue > 0 ? sepRollup.revenue : Math.round(baseCompRev * 1.1);
      totalCategoryRevenue = Math.round(fullSepRev * (18 / 30));
      dateRange = { start: "1 SEP", end: "18 SEP 2026" };
      const days = [1, 3, 5, 7, 9, 11, 13, 15, 16, 17, 18];
      points = days.map((d) => {
        const targetDateStr = `2026-09-${String(d).padStart(2, "0")}`;
        const matchingTxs = transactions.filter(
          (t) => t.payment_timestamp && t.payment_timestamp.startsWith(targetDateStr)
        );
        const txSum = matchingTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        let dayRev = txSum > 0 ? txSum : Math.round((totalCategoryRevenue / 18) * (0.84 + (((d * 23) % 32) / 100)));
        return { label: `Sep ${d}`, amount: dayRev };
      });
    } else if (selectedCategoryPeriod === "Last 30 Days") {
      // 30 Days rolling window (Aug 20 - Sep 18)
      totalCategoryRevenue = Math.round((baseCompRev || 54000) * 1.08);
      dateRange = { start: "20 AUG", end: "18 SEP 2026" };
      const dates = [
        "Aug 20", "Aug 23", "Aug 26", "Aug 29",
        "Sep 1", "Sep 4", "Sep 7", "Sep 10",
        "Sep 13", "Sep 16", "Sep 18",
      ];
      points = dates.map((label, idx) => {
        const dayRev = Math.round(
          (totalCategoryRevenue / 30) * 2.7 * (0.88 + (((idx * 17) % 25) / 100))
        );
        return { label, amount: dayRev };
      });
    } else if (selectedCategoryPeriod === "This Quarter (Q3)") {
      // Q3 (Jul, Aug, Sep MTD)
      const julRev = julRollup?.revenue || Math.round(baseCompRev * 0.95);
      const augRev = augRollup?.revenue || 54798;
      const sepRev = sepRollup ? Math.round(sepRollup.revenue * 0.6) : Math.round(baseCompRev * 0.65);
      totalCategoryRevenue = Math.round(julRev + augRev + sepRev);
      dateRange = { start: "1 JUL", end: "18 SEP 2026" };
      const dates = [
        "Jul 5", "Jul 15", "Jul 25", "Aug 5",
        "Aug 15", "Aug 25", "Sep 1", "Sep 6",
        "Sep 11", "Sep 15", "Sep 18",
      ];
      points = dates.map((label, idx) => {
        const intervalRev = Math.round(
          (totalCategoryRevenue / 11) * (0.85 + (((idx * 19) % 30) / 100))
        );
        return { label, amount: intervalRev };
      });
    } else {
      // Year to Date (YTD: Jan 1 - Sep 18)
      let ytdSum = 0;
      if (dashboardData?.history && dashboardData.history.length > 0) {
        for (const h of dashboardData.history) {
          const d = new Date(h.metricDate);
          if (d.getMonth() <= 8) {
            ytdSum += Number(h.revenue || 0);
          }
        }
      }
      totalCategoryRevenue = ytdSum > 0 ? Math.round(ytdSum) : Math.round(baseCompRev * 8.8);
      dateRange = { start: "1 JAN", end: "18 SEP 2026" };
      const dates = [
        "Jan 31", "Feb 28", "Mar 31", "Apr 30",
        "May 31", "Jun 30", "Jul 31", "Aug 15",
        "Aug 31", "Sep 10", "Sep 18",
      ];
      points = dates.map((label, idx) => {
        const intervalRev = Math.round(
          (totalCategoryRevenue / 11) * (0.82 + (((idx * 21) % 36) / 100))
        );
        return { label, amount: intervalRev };
      });
    }

    const peakVal = Math.max(...points.map((p) => p.amount), 1000);
    const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

    const bars = points.map((p, i) => {
      const expansionNum = Math.round(p.amount * 0.35);
      const baseNum = Math.max(0, p.amount - expansionNum);

      // Elevated bar heights matching reference Image 2
      const maxBarHeight = 225;
      const minBarHeight = 85;
      const totalHeightPx = Math.max(
        minBarHeight,
        Math.min(maxBarHeight, Math.round((p.amount / peakVal) * maxBarHeight))
      );
      const expansionPx = Math.max(26, Math.round(totalHeightPx * 0.35));
      const basePx = Math.max(50, totalHeightPx - expansionPx);

      return {
        id: i + 1,
        date: p.label,
        topPx: expansionPx,
        botPx: basePx,
        expansion: formatCurrency(expansionNum),
        base: formatCurrency(baseNum),
        total: formatCurrency(p.amount),
      };
    });

    return {
      totalCategoryRevenue,
      dateRange,
      bars,
    };
  }, [selectedCategoryPeriod, dashboardData?.history, currentCompany, transactions]);

  // Table search & selection (4-row scrollable container)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Filter transactions based on in-table search
  const filteredTransactions = transactions.filter(
    (t) =>
      t.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectAll = () => {
    const allIds = filteredTransactions.map((t) => t.id);
    const allSelected = allIds.length > 0 && allIds.every((id) => selectedRows.includes(id));
    if (allSelected) {
      setSelectedRows((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedRows((prev) => Array.from(new Set([...prev, ...allIds])));
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
              <div className="flex items-center gap-6">
                <div className="text-xs text-gray-400 font-medium">
                  Total Revenue :{" "}
                  <span className="text-xl font-bold text-gray-900 ml-1.5 font-mono">
                    {isDashboardLoading ? (
                      "Loading..."
                    ) : (
                      salesTrendResult.totalRevenue
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold tracking-wide text-gray-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-gray-400 bg-white"></span>
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-mono">NEW USER</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-black"></span>
                    <span className="text-[11px] uppercase tracking-wider text-gray-500 font-mono">EXISTING USER</span>
                  </span>
                </div>
              </div>
              {/* Granularity Pill Selector */}
              <div className="inline-flex rounded-xl bg-gray-100 p-0.5 text-xs font-medium text-gray-600">
                {(["Weekly", "Monthly", "Yearly"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeframe(t);
                      showActionToast(`Sales trend granularity switched to ${t}`);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
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
          <div
            onMouseLeave={() => setHoveredCol(null)}
            className="relative mt-6 pt-4 pb-2 border-t border-dashed border-gray-100 select-none"
          >
            {/* Background Scale ticks & Horizontal Dashed Lines */}
            <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none text-[10px] text-gray-300 font-mono">
              {salesTrendResult.ticks.map((t, idx) => (
                <div
                  key={`tick-${idx}`}
                  className="flex items-center w-full border-b border-gray-100/80 border-dashed pb-0.5"
                >
                  <span className="w-7 text-right pr-2 text-gray-400 font-mono">{t}</span>
                  <div className="flex-1 border-b border-gray-100/80 border-dashed" />
                </div>
              ))}
            </div>

            {/* 48-Column Wave Chart Canvas with Equal Horizontal and Vertical Spacing */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(48, minmax(0, 1fr))",
                gap: "2.5px",
              }}
              className="relative w-full pl-9 pr-3 items-end pt-2"
            >
              {salesTrendResult.columns.map((col) => {
                const isHovered = hoveredCol === col.colIndex;
                return (
                  <div
                    key={col.id}
                    onMouseEnter={() => setHoveredCol(col.colIndex)}
                    style={{ gap: "2.5px" }}
                    className="relative flex flex-col items-center cursor-pointer group py-0.5"
                  >
                    {/* Dashed Vertical Guideline */}
                    {isHovered && (
                      <div className="absolute -top-3 bottom-0 w-px border-l border-dashed border-gray-400 pointer-events-none z-10" />
                    )}

                    {/* Interactive Focal Tracking Dot at boundary */}
                    {isHovered && (
                      <div
                        style={{ bottom: `calc((${col.activeCells} / 20) * 100% - 4px)` }}
                        className="absolute w-2.5 h-2.5 rounded-full bg-black ring-2 ring-white shadow-xs pointer-events-none z-20"
                      />
                    )}

                    {/* Interactive Floating Tooltip Callout */}
                    {isHovered && (
                      <div
                        className={`absolute bottom-full mb-3.5 ${
                          col.colIndex <= 8
                            ? "left-0"
                            : col.colIndex >= 40
                            ? "right-0"
                            : "left-1/2 -translate-x-1/2"
                        } z-30 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-2xl p-3.5 shadow-floating text-left min-w-[185px] w-max pointer-events-none select-none transition-all`}
                      >
                        {/* Header: Total Users matching the top of the column on Y-Axis scale */}
                        <div className="flex items-baseline justify-between gap-3 mb-2.5 pb-2 border-b border-gray-100">
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                              Total Users
                            </span>
                            <span className="text-sm font-bold text-gray-900 font-mono tracking-tight">
                              {col.totalUsersFormatted} Users
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                              Revenue
                            </span>
                            <span className="text-xs font-bold text-gray-800 font-mono">
                              {col.revenueFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Breakdown Rows */}
                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between gap-4 text-gray-500 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full border border-gray-400 bg-[#cbd5e1]"></span>
                              <span className="font-medium text-gray-600">New User</span>
                            </span>
                            <span className="font-bold text-gray-900 font-mono">
                              {col.newUserFormatted}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-gray-500 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-black"></span>
                              <span className="font-medium text-gray-600">Existing User</span>
                            </span>
                            <span className="font-bold text-gray-900 font-mono">
                              {col.existingUserFormatted}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 20 Discrete Square Cells Stacked Vertically */}
                    {/* Top: Faint Background Screen Cells */}
                    {Array.from({ length: col.emptyCells }).map((_, r) => (
                      <div
                        key={`emp-${r}`}
                        className="w-full aspect-square rounded-[1.5px] bg-[#f8fafc] border border-gray-100/70 transition-colors"
                      />
                    ))}

                    {/* Middle: Light Gray New User Cells (flat stationary hover) */}
                    {Array.from({ length: col.newCells }).map((_, r) => (
                      <div
                        key={`new-${r}`}
                        className={`w-full aspect-square rounded-[1.5px] transition-colors duration-150 ${
                          isHovered ? "bg-[#94a3b8]" : "bg-[#cbd5e1]"
                        }`}
                      />
                    ))}

                    {/* Bottom: Solid Black Existing User Cells (flat stationary hover) */}
                    {Array.from({ length: col.activeCells }).map((_, r) => (
                      <div
                        key={`act-${r}`}
                        className={`w-full aspect-square rounded-[1.5px] transition-colors duration-150 ${
                          isHovered ? "bg-zinc-800" : "bg-black"
                        }`}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* X-Axis Month / Period Labels Below Chart */}
            <div className="flex w-full pl-9 pr-3 mt-2 pt-1 border-t border-dashed border-gray-100/90">
              {salesTrendResult.monthLabels.map((lbl, idx) => {
                const colsPerLabel = 48 / salesTrendResult.monthLabels.length;
                const isThisMonthHovered =
                  hoveredCol !== null &&
                  Math.floor(hoveredCol / colsPerLabel) === idx;
                return (
                  <span
                    key={lbl}
                    className={`flex-1 text-center text-[10px] uppercase tracking-wider transition-all select-none ${
                      isThisMonthHovered
                        ? "font-bold text-gray-900 underline underline-offset-4 decoration-2"
                        : "font-semibold text-gray-400"
                    }`}
                  >
                    {lbl}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Revenue Breakdown & AI Insight Card */}
        <div
          className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col"
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
                  ${revenueBreakdownResult.totalCategoryRevenue.toLocaleString()}
                </span>
              </div>
              {/* Sub-date dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPeriodDropdownOpen(!isPeriodDropdownOpen);
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
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
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full right-0 mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-floating p-1 min-w-[140px] animate-in fade-in zoom-in-95"
                  >
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
                        className={`w-full text-left px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
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

          {/* Vertical High-Density Bar Graph Canvas matching Image 2 */}
          <div className="flex-1 flex flex-col justify-between mt-5 relative select-none">
            {/* Background 5 Horizontal Dashed Guidelines with Left Bullets matching Image 2 */}
            <div className="absolute inset-x-0 top-3 bottom-8 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={`guideline-${i}`} className="flex items-center w-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2 flex-shrink-0 opacity-70" />
                  <div className="flex-1 border-b border-gray-200/70 border-dashed" />
                </div>
              ))}
            </div>

            {/* 11 Needle Bars Canvas */}
            <div
              onMouseLeave={() => setHoveredRevenueBar(null)}
              className="relative flex items-end justify-between flex-1 min-h-[260px] px-2 z-10"
            >
              {revenueBreakdownResult.bars.map((bar, idx) => {
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
                        className={`absolute bottom-full mb-2 ${
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
                      className={`w-1.5 bg-[#cbd5e1] rounded-t-sm transition-colors duration-200 ${
                        isHovered ? "bg-gray-400" : "group-hover:bg-gray-300"
                      }`}
                    ></div>
                    <div
                      style={{ height: `${bar.botPx}px` }}
                      className={`w-1.5 bg-black rounded-b-sm transition-colors duration-200 ${
                        isHovered ? "bg-zinc-800" : ""
                      }`}
                    ></div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Dotted Axis Range (matching Image 2: 1 JAN ········ 30 JAN 2025) */}
            <div className="mt-3 pt-1 flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span className="flex-shrink-0">{revenueBreakdownResult.dateRange.start}</span>
              <div className="flex-1 mx-3 border-b border-gray-200 border-dotted" />
              <span className="flex-shrink-0">{revenueBreakdownResult.dateRange.end}</span>
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

            {/* Header Boxed 3-Dots Options Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTableOptionsOpen(!isTableOptionsOpen);
                }}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-700 shadow-2xs transition-colors cursor-pointer ${
                  isTableOptionsOpen ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-200' : ''
                }`}
                title="More table options"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
              </button>

              {isTableOptionsOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1.5 z-40 bg-white border border-gray-200 rounded-xl shadow-floating p-1.5 min-w-[160px] text-left animate-in fade-in zoom-in-95 duration-150"
                >
                  <button
                    onClick={() => {
                      const csvHeader = "ID,Code,Customer,Product,Status,Revenue\n";
                      const csvRows = filteredTransactions.map(t => `"${t.id}","${t.code}","${t.customer}","${t.product}","${t.status}","${t.totalRevenue}"`).join("\n");
                      const blob = new Blob([csvHeader + csvRows], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.setAttribute("href", url);
                      link.setAttribute("download", `events_${new Date().toISOString().slice(0, 10)}.csv`);
                      link.click();
                      setIsTableOptionsOpen(false);
                      showActionToast("Exported events as CSV!");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRows([]);
                      setIsTableOptionsOpen(false);
                      showActionToast("Selection cleared");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-black rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>Clear Selection</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4-Row Scrollable Table Container with Impeccable Bottom Vanishing Effect */}
        <div className="relative">
          <div
            className="w-full overflow-x-auto overflow-y-auto max-h-[252px] custom-scrollbar select-none"
            style={{ scrollbarWidth: "thin" }}
          >
            <table className="w-full text-left text-xs border-collapse table-fixed">
              <thead className="sticky top-0 bg-white z-20">
                <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[11px] bg-white">
                  <th className="py-3 px-2 w-[3.5%] text-center">
                    <input
                      checked={
                        filteredTransactions.length > 0 &&
                        filteredTransactions.every((tx) => selectedRows.includes(tx.id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-black focus:ring-black h-3.5 w-3.5 cursor-pointer"
                      type="checkbox"
                    />
                  </th>
                  <th className="py-3 px-2.5 w-[13.5%]">Timestamp</th>
                  <th className="py-3 px-2.5 w-[15%]">Event Code</th>
                  <th className="py-3 px-2.5 w-[17.5%]">Customer</th>
                  <th className="py-3 px-2.5 w-[19.5%]">Product / Plan</th>
                  <th className="py-3 px-2.5 w-[11%] text-left">Status</th>
                  <th className="py-3 px-2.5 w-[10%] text-left">Revenue</th>
                  <th className="py-3 pr-4 pl-2 w-[10%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {filteredTransactions.map((tx, index) => {
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
                    <td className="py-3.5 pr-4 pl-2 text-center relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionTx(activeActionTx?.id === tx.id ? null : tx);
                        }}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-700 shadow-2xs transition-colors cursor-pointer ${
                          activeActionTx?.id === tx.id ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-200' : ''
                        }`}
                        title="Row Actions"
                      >
                        <svg
                          className="w-3.5 h-3.5 inline"
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
                          className={`absolute right-3 ${
                            index >= 3 ? "bottom-full mb-1.5" : "top-full mt-1.5"
                          } z-40 bg-white border border-gray-200 rounded-xl shadow-floating p-1.5 min-w-[175px] text-left animate-in fade-in zoom-in-95 duration-150`}
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

        {/* Impeccable Bottom Vanishing / Blurring Fade Overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/85 to-transparent backdrop-blur-[0.5px] z-10 rounded-b-xl" />
      </div>
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
