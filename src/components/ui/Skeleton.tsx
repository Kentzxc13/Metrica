import React from 'react';

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
    children?: React.ReactNode;
}

/**
 * Intrinsic Sizing Shimmer Wrapper (Discord & Linear Style)
 * Automatically takes the exact natural geometry of children with zero layout shift.
 */
export function Shimmer({ className = '', children, ...props }: ShimmerProps) {
    if (!children) {
        return (
            <div
                className={`shimmer-bone rounded-md ${className}`}
                {...props}
            />
        );
    }

    return (
        <div className={`shimmer-bone rounded-md inline-block relative ${className}`} {...props}>
            <div className="invisible select-none pointer-events-none" aria-hidden="true">
                {children}
            </div>
        </div>
    );
}

/**
 * Standalone Bone with Porcelain Light-Mode Sheen
 */
export function ShimmerBone({
    className = '',
    width,
    height,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & {
    width?: string;
    height?: string;
}) {
    return (
        <div
            className={`shimmer-bone rounded-md ${width || ''} ${height || ''} ${className}`}
            {...props}
        />
    );
}

/**
 * Specific KPI Value Shimmer (Matches text-2xl font-mono bounding box)
 */
export function KpiValueSkeleton({
    width = 'w-28',
    height = 'h-7',
    className = '',
}: {
    width?: string;
    height?: string;
    className?: string;
}) {
    return (
        <span
            className={`shimmer-bone inline-block ${height} ${width} rounded-md align-middle my-0.5 ${className}`}
            aria-hidden="true"
        />
    );
}

/**
 * Standalone KPI Card Shimmer
 */
export function KpiCardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="h-3 w-20 rounded-full" />
                        <ShimmerBone className="h-4 w-12 rounded-full" />
                    </div>
                    <div className="pt-1">
                        <ShimmerBone className="h-7 w-28 rounded-md" />
                    </div>
                </div>
                {/* Sparkline bone bars */}
                <div className="flex items-end gap-1 h-8 pt-1">
                    <ShimmerBone className="w-1 h-3 rounded-full" />
                    <ShimmerBone className="w-1 h-5 rounded-full" />
                    <ShimmerBone className="w-1 h-4 rounded-full" />
                    <ShimmerBone className="w-1 h-7 rounded-full" />
                    <ShimmerBone className="w-1 h-6 rounded-full" />
                </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <ShimmerBone className="h-3.5 w-24 rounded-full" />
                <ShimmerBone className="h-3.5 w-14 rounded-full" />
            </div>
        </div>
    );
}

/**
 * Multi-Row Table Skeleton with Realistic Column Geometry
 */
export function TableRowSkeleton({
    columns = 8,
    rows = 5,
}: {
    columns?: number;
    rows?: number;
}) {
    const colWidths = ['w-32', 'w-24', 'w-20', 'w-28', 'w-16', 'w-20', 'w-14', 'w-20', 'w-10'];

    return (
        <>
            {Array.from({ length: rows }).map((_, rIdx) => (
                <tr key={rIdx} className="border-b border-gray-100/80 last:border-0">
                    {columns === 8 ? (
                        <>
                            {/* Dashboard Recent Events Exact Columns */}
                            <td className="py-3.5 px-2 text-center w-10">
                                <div className="flex justify-center">
                                    <ShimmerBone className="w-3.5 h-3.5 rounded-sm" />
                                </div>
                            </td>
                            <td className="py-3.5 px-2.5 w-[13.5%]">
                                <ShimmerBone className="h-3.5 w-20 rounded-sm" />
                            </td>
                            <td className="py-3.5 px-2.5 w-[15%]">
                                <ShimmerBone className="h-3.5 w-24 rounded-sm" />
                            </td>
                            <td className="py-3.5 px-2.5 w-[17.5%]">
                                <div className="flex items-center gap-2">
                                    <ShimmerBone className="w-6 h-6 rounded-full shrink-0" />
                                    <ShimmerBone className="h-3.5 w-24 rounded-sm" />
                                </div>
                            </td>
                            <td className="py-3.5 px-2.5 w-[19.5%]">
                                <ShimmerBone className="h-3.5 w-28 rounded-sm" />
                            </td>
                            <td className="py-3.5 px-2.5 w-[11%]">
                                <ShimmerBone className="h-5 w-16 rounded-full" />
                            </td>
                            <td className="py-3.5 px-2.5 w-[10%]">
                                <ShimmerBone className="h-3.5 w-16 rounded-sm" />
                            </td>
                            <td className="py-3.5 pr-4 pl-2 w-[10%] text-center">
                                <ShimmerBone className="h-5 w-6 rounded-md mx-auto" />
                            </td>
                        </>
                    ) : (
                        Array.from({ length: columns }).map((_, cIdx) => (
                            <td key={cIdx} className="py-3.5 px-3">
                                {cIdx === 0 ? (
                                    <div className="flex items-center gap-3">
                                        <ShimmerBone className="w-7 h-7 rounded-lg shrink-0" />
                                        <div className="space-y-1">
                                            <ShimmerBone className="h-3.5 w-28 rounded-sm" />
                                            <ShimmerBone className="h-2.5 w-16 rounded-sm" />
                                        </div>
                                    </div>
                                ) : cIdx === columns - 1 ? (
                                    <ShimmerBone className="h-6 w-8 rounded-md ml-auto" />
                                ) : (
                                    <ShimmerBone
                                        className={`h-3.5 ${colWidths[cIdx % colWidths.length]} rounded-sm ${
                                            cIdx % 2 === 0 ? 'mx-auto' : ''
                                        }`}
                                    />
                                )}
                            </td>
                        ))
                    )}
                </tr>
            ))}
        </>
    );
}

const SKELETON_WAVE_CONTOURS = [
    // JAN (cols 0-3)
    { active: 2, new: 2 }, { active: 3, new: 3 }, { active: 5, new: 4 }, { active: 3, new: 2 },
    // FEB (cols 4-7) - peak
    { active: 4, new: 5 }, { active: 6, new: 7 }, { active: 5, new: 6 }, { active: 4, new: 4 },
    // MAR (cols 8-11)
    { active: 3, new: 4 }, { active: 4, new: 5 }, { active: 4, new: 5 }, { active: 3, new: 3 },
    // APR (cols 12-15) - valley
    { active: 2, new: 2 }, { active: 2, new: 2 }, { active: 3, new: 4 }, { active: 5, new: 7 },
    // MAY (cols 16-19) - steep spike
    { active: 6, new: 9 }, { active: 7, new: 11 }, { active: 5, new: 8 }, { active: 3, new: 5 },
    // JUN (cols 20-23) - valley
    { active: 2, new: 3 }, { active: 4, new: 5 }, { active: 5, new: 6 }, { active: 3, new: 4 },
    // JUL (cols 24-27) - sharp peak
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

const SKELETON_NEEDLE_BARS = [
    { topPx: 38, botPx: 72 },
    { topPx: 48, botPx: 90 },
    { topPx: 42, botPx: 80 },
    { topPx: 64, botPx: 120 },
    { topPx: 52, botPx: 98 },
    { topPx: 72, botPx: 136 },
    { topPx: 60, botPx: 114 },
    { topPx: 78, botPx: 146 },
    { topPx: 56, botPx: 104 },
    { topPx: 70, botPx: 130 },
    { topPx: 62, botPx: 118 },
];

/**
 * 1:1 Pixel-Accurate Sales Trend Matrix Bar Chart Skeleton
 * Every single cell in the 48x20 grid has shimmer animation (no blank white gaps).
 * Zero raw text, icons, or buttons: all shimmered down into pure glowing skeleton geometry.
 */
export function SalesTrendSkeleton() {
    return (
        <div
            className="lg:col-span-8 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col justify-between"
            data-purpose="sales-trend-card"
        >
            {/* Header & Segment Controls */}
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="h-4 w-28 rounded-md" />
                        <ShimmerBone className="w-3.5 h-3.5 rounded-full" />
                    </div>
                    <ShimmerBone className="w-5 h-4 rounded-md" />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <ShimmerBone className="h-3.5 w-24 rounded-sm" />
                            <ShimmerBone className="h-6 w-28 rounded-md" />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1.5">
                                <ShimmerBone className="w-2.5 h-2.5 rounded-full" />
                                <ShimmerBone className="h-3 w-16 rounded-sm" />
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <ShimmerBone className="w-2.5 h-2.5 rounded-full" />
                                <ShimmerBone className="h-3 w-20 rounded-sm" />
                            </span>
                        </div>
                    </div>
                    {/* Granularity Pill Selector Skeleton */}
                    <div className="inline-flex items-center gap-1 rounded-xl bg-gray-100 p-0.5">
                        <ShimmerBone className="h-6 w-16 rounded-lg" />
                        <ShimmerBone className="h-6 w-14 rounded-lg" />
                        <ShimmerBone className="h-6 w-12 rounded-lg" />
                    </div>
                </div>
            </div>

            {/* Matrix Pixel Bar Chart Container matching page.tsx line 1156 */}
            <div className="relative mt-6 pt-4 pb-2 border-t border-dashed border-gray-100 select-none">
                {/* Background Scale ticks & Horizontal Dashed Lines */}
                <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div
                            key={`tick-${idx}`}
                            className="flex items-center w-full border-b border-gray-100/80 border-dashed pb-0.5"
                        >
                            <div className="w-7 flex justify-end pr-2">
                                <ShimmerBone className="h-2 w-5 rounded-xs" />
                            </div>
                            <div className="flex-1 border-b border-gray-100/80 border-dashed" />
                        </div>
                    ))}
                </div>

                {/* 48-Column Wave Chart Canvas with Equal Horizontal and Vertical Spacing */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(48, minmax(0, 1fr))',
                        gap: '2.5px',
                    }}
                    className="relative w-full pl-9 pr-3 items-end pt-2"
                >
                    {SKELETON_WAVE_CONTOURS.map((col, colIdx) => {
                        const totalActive = Math.min(18, col.active + col.new);
                        const emptyCount = 20 - totalActive;
                        return (
                            <div
                                key={colIdx}
                                style={{ gap: '2.5px' }}
                                className="relative flex flex-col items-center py-0.5"
                            >
                                {/* 20 Discrete Square Cells Stacked Vertically */}
                                {/* Top: Background Screen Cells with soft shimmer beam (no blank white) */}
                                {Array.from({ length: emptyCount }).map((_, r) => (
                                    <div
                                        key={`emp-${r}`}
                                        className="w-full aspect-square rounded-[1.5px] shimmer-bone opacity-35 border border-white/20"
                                    />
                                ))}

                                {/* Middle/Bottom: Active wave cells with solid shimmer */}
                                {Array.from({ length: totalActive }).map((_, r) => (
                                    <div
                                        key={`act-${r}`}
                                        className="w-full aspect-square rounded-[1.5px] shimmer-bone shadow-xs"
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>

                {/* X-Axis Month / Period Labels Below Chart */}
                <div className="flex w-full pl-9 pr-3 mt-2 pt-1 border-t border-dashed border-gray-100/90 gap-1">
                    {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((lbl) => (
                        <div key={lbl} className="flex-1 flex justify-center">
                            <ShimmerBone className="h-2.5 w-6 rounded-sm" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/**
 * 1:1 Pixel-Accurate Revenue Breakdown & AI Insight Card Skeleton
 * Every vertical guideline, needle track, header pill, and axis range has shimmer.
 * Zero raw text, icons, or buttons: all shimmered down into pure glowing skeleton geometry.
 */
export function RevenueBreakdownSkeleton() {
    return (
        <div
            className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col justify-between"
            data-purpose="revenue-breakdown-card"
        >
            {/* Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="h-4 w-36 rounded-md" />
                        <ShimmerBone className="w-3.5 h-3.5 rounded-full" />
                    </div>
                    <ShimmerBone className="w-5 h-4 rounded-md" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <div className="space-y-1.5">
                        <ShimmerBone className="h-3.5 w-28 rounded-sm" />
                        <ShimmerBone className="h-6 w-24 rounded-md" />
                    </div>
                    <ShimmerBone className="h-7 w-24 rounded-xl" />
                </div>

                {/* AI Insight Banner Skeleton */}
                <div className="mt-3 bg-[#f8f9fa] border border-gray-200/90 rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="w-4 h-4 rounded-full" />
                        <ShimmerBone className="h-3.5 w-48 rounded-md" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ShimmerBone className="h-4 w-16 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Vertical High-Density Bar Graph Canvas matching page.tsx line 1481 */}
            <div className="flex-1 flex flex-col justify-between mt-5 relative select-none">
                {/* Background 5 Horizontal Dashed Guidelines with Left Bullets */}
                <div className="absolute inset-x-0 top-3 bottom-8 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={`guideline-${i}`} className="flex items-center w-full">
                            <span className="w-1.5 h-1.5 rounded-full shimmer-bone mr-2 flex-shrink-0" />
                            <div className="flex-1 border-b border-gray-200/70 border-dashed" />
                        </div>
                    ))}
                </div>

                {/* 11 Needle Bars Canvas with full vertical tracks (no blank white) */}
                <div className="relative flex items-end justify-between flex-1 min-h-[260px] px-2 z-10">
                    {SKELETON_NEEDLE_BARS.map((bar, idx) => (
                        <div
                            key={idx}
                            className="relative flex flex-col items-center justify-end h-[240px] w-3 py-1 select-none"
                        >
                            {/* Full-height subtle vertical track with shimmer so it's not blank white */}
                            <div className="absolute inset-y-1 w-1.5 rounded-sm shimmer-bone opacity-25" />

                            {/* Top Expansion segment: solid shimmer bone */}
                            <div
                                style={{ height: `${bar.topPx}px` }}
                                className="w-1.5 shimmer-bone rounded-t-sm relative z-10 mb-0.5 shadow-xs"
                            />
                            {/* Bottom Base MRR segment: solid shimmer bone */}
                            <div
                                style={{ height: `${bar.botPx}px` }}
                                className="w-1.5 shimmer-bone rounded-b-sm relative z-10 shadow-xs"
                            />
                        </div>
                    ))}
                </div>

                {/* Bottom Dotted Axis Range with Shimmer Bones */}
                <div className="mt-3 pt-1 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <ShimmerBone className="h-3 w-10 rounded-sm" />
                    <div className="flex-1 mx-3 border-b border-gray-200 border-dotted" />
                    <ShimmerBone className="h-3 w-18 rounded-sm" />
                </div>
            </div>
        </div>
    );
}

/**
 * Full Page Skeleton for Dashboard Overview
 */
export function DashboardPageSkeleton() {
    return (
        <div className="space-y-6 animate-fadeIn pb-8">
            {/* Top Bar / Header Skeleton */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <ShimmerBone className="h-6 w-44 rounded-md" />
                    <ShimmerBone className="h-3.5 w-72 rounded-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <ShimmerBone className="h-8 w-28 rounded-xl" />
                    <ShimmerBone className="h-8 w-32 rounded-xl" />
                </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
            </div>

            {/* Main Interactive Charts Area Skeleton matching page.tsx line 1070 */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4" data-purpose="charts-row">
                <SalesTrendSkeleton />
                <RevenueBreakdownSkeleton />
            </section>

            {/* Recent Events Table Skeleton */}
            <section className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card" data-purpose="recent-events-ledger">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="h-4 w-28 rounded-md" />
                        <ShimmerBone className="h-3.5 w-16 rounded-sm" />
                        <ShimmerBone className="h-4 w-12 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <ShimmerBone className="w-56 h-7 rounded-xl" />
                        <ShimmerBone className="w-24 h-7 rounded-xl" />
                        <ShimmerBone className="w-7 h-7 rounded-lg" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                <th className="py-3 px-2 text-center w-10">
                                    <div className="flex justify-center">
                                        <ShimmerBone className="w-3.5 h-3.5 rounded-sm" />
                                    </div>
                                </th>
                                <th className="py-3 px-2.5 w-[13.5%]">
                                    <ShimmerBone className="h-3 w-16 rounded-sm" />
                                </th>
                                <th className="py-3 px-2.5 w-[15%]">
                                    <ShimmerBone className="h-3 w-18 rounded-sm" />
                                </th>
                                <th className="py-3 px-2.5 w-[17.5%]">
                                    <ShimmerBone className="h-3 w-16 rounded-sm" />
                                </th>
                                <th className="py-3 px-2.5 w-[19.5%]">
                                    <ShimmerBone className="h-3 w-24 rounded-sm" />
                                </th>
                                <th className="py-3 px-2.5 w-[11%]">
                                    <ShimmerBone className="h-3 w-12 rounded-sm" />
                                </th>
                                <th className="py-3 px-2.5 w-[10%]">
                                    <ShimmerBone className="h-3 w-14 rounded-sm" />
                                </th>
                                <th className="py-3 pr-4 pl-2 w-[10%] text-center">
                                    <ShimmerBone className="h-3 w-12 rounded-sm mx-auto" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <TableRowSkeleton columns={8} rows={5} />
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

/**
 * Full Page Skeleton for Cap Table
 */
export function CapTablePageSkeleton() {
    return (
        <div className="space-y-6 animate-fadeIn pb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <ShimmerBone className="h-6 w-48 rounded-md" />
                    <ShimmerBone className="h-3.5 w-80 rounded-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <ShimmerBone className="h-8 w-28 rounded-xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card shimmer-card-sheen space-y-4">
                <div className="flex justify-between items-center">
                    <ShimmerBone className="h-4 w-48 rounded-md" />
                    <div className="flex gap-1">
                        <ShimmerBone className="h-7 w-16 rounded-lg" />
                        <ShimmerBone className="h-7 w-20 rounded-lg" />
                        <ShimmerBone className="h-7 w-16 rounded-lg" />
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <th key={i} className="py-2.5 px-3">
                                    <ShimmerBone className="h-3 w-16 rounded-sm" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <TableRowSkeleton columns={9} rows={5} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Full Page Skeleton for Event Ledger
 */
export function LedgerPageSkeleton() {
    return (
        <div className="space-y-6 animate-fadeIn pb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <ShimmerBone className="h-6 w-40 rounded-md" />
                    <ShimmerBone className="h-3.5 w-64 rounded-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <ShimmerBone className="h-8 w-32 rounded-xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card shimmer-card-sheen space-y-4">
                <div className="flex justify-between items-center">
                    <ShimmerBone className="h-4 w-52 rounded-md" />
                    <ShimmerBone className="h-7 w-28 rounded-lg" />
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <th key={i} className="py-2.5 px-3">
                                    <ShimmerBone className="h-3 w-16 rounded-sm" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <TableRowSkeleton columns={7} rows={6} />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Full Page Skeleton for AI Investment Screening
 * Zero text, zero icons, zero buttons: 100% pure shimmer bones
 */
export function AiScreeningPageSkeleton() {
    return (
        <div className="space-y-6 animate-fadeIn pb-8">
            {/* Header: Title + Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <ShimmerBone className="h-6 w-52 rounded-md" />
                    <ShimmerBone className="h-3.5 w-72 rounded-sm" />
                </div>
                <div className="flex items-center gap-2.5">
                    <ShimmerBone className="h-8 w-32 rounded-xl" />
                    <ShimmerBone className="h-8 w-28 rounded-xl" />
                </div>
            </div>

            {/* Grid of Deal Screening Rectangle Cards (2 columns, 6 cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card flex flex-col justify-between space-y-4"
                    >
                        {/* Top: Avatar, Name, Badges, Star */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <ShimmerBone className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <ShimmerBone className="h-4 w-28 rounded-md" />
                                        <ShimmerBone className="h-3.5 w-14 rounded-md" />
                                        <ShimmerBone className="h-3.5 w-20 rounded-md" />
                                    </div>
                                    <ShimmerBone className="h-3 w-20 rounded-sm" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShimmerBone className="h-6 w-24 rounded-lg" />
                                <ShimmerBone className="w-7 h-7 rounded-lg" />
                            </div>
                        </div>

                        {/* Middle: 2 Description Lines */}
                        <div className="space-y-1.5 pt-1">
                            <ShimmerBone className="h-3 w-full rounded-sm" />
                            <ShimmerBone className="h-3 w-4/5 rounded-sm" />
                        </div>

                        {/* Metric Strip: 4 items (ARR, Growth, Net Burn, Score) */}
                        <div className="grid grid-cols-4 gap-2 py-3 px-3.5 bg-gray-50/70 border border-gray-100 rounded-xl">
                            {Array.from({ length: 4 }).map((_, mIdx) => (
                                <div key={mIdx} className="space-y-1">
                                    <ShimmerBone className="h-2.5 w-12 rounded-xs" />
                                    <ShimmerBone className="h-4 w-16 rounded-sm" />
                                </div>
                            ))}
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                            <ShimmerBone className="h-3.5 w-32 rounded-sm" />
                            <div className="flex gap-2">
                                <ShimmerBone className="h-7 w-20 rounded-lg" />
                                <ShimmerBone className="h-7 w-24 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Full Page Skeleton for Company Comparison & Benchmarks
 * Zero text, zero icons, zero buttons: 100% pure shimmer bones
 */
export function ComparisonPageSkeleton() {
    return (
        <div className="space-y-6 animate-fadeIn pb-8">
            {/* Header: Title + Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <ShimmerBone className="h-6 w-56 rounded-md" />
                    <ShimmerBone className="h-3.5 w-72 rounded-sm" />
                </div>
                <div className="flex items-center gap-2.5">
                    <ShimmerBone className="h-8 w-36 rounded-xl" />
                    <ShimmerBone className="h-8 w-28 rounded-xl" />
                </div>
            </div>

            {/* 4 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
            </div>

            {/* Benchmark Matrix Table */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-card space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="h-4 w-40 rounded-md" />
                        <ShimmerBone className="h-3.5 w-16 rounded-sm" />
                        <ShimmerBone className="h-4 w-20 rounded-full" />
                    </div>
                    <div className="flex gap-1">
                        <ShimmerBone className="h-7 w-14 rounded-lg" />
                        <ShimmerBone className="h-7 w-24 rounded-lg" />
                        <ShimmerBone className="h-7 w-20 rounded-lg" />
                        <ShimmerBone className="h-7 w-18 rounded-lg" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-3 px-2 text-center w-10">
                                    <div className="flex justify-center">
                                        <ShimmerBone className="w-3.5 h-3.5 rounded-sm" />
                                    </div>
                                </th>
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <th key={i} className="py-2.5 px-3">
                                        <ShimmerBone className="h-3 w-20 rounded-sm" />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <TableRowSkeleton columns={8} rows={5} />
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/**
 * 1:1 Pixel-Accurate Full Page Skeleton for Board Governance & Cadence
 * Exactly matches governance/page.tsx:
 * - Section 1: Heading
 * - Section 2: 5 Milestone Session Cards Timeline Strip
 * - Section 3: 7-col Dossier & Agenda & 2x2 Checklist + 5-col Commitments Tracker & AI Probes
 * Zero raw text, icons, or buttons: all shimmered down into pure glowing skeleton geometry.
 */
export function GovernancePageSkeleton() {
    return (
        <div className="flex flex-col gap-5 pb-8 animate-fadeIn">
            {/* Section 1: Page Heading */}
            <div className="space-y-1">
                <ShimmerBone className="h-7 w-72 rounded-md" />
                <ShimmerBone className="h-3.5 w-96 rounded-sm" />
            </div>

            {/* Section 2: Quarterly Meeting Cadence Schedule Timeline Strip */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-card space-y-3.5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <ShimmerBone className="h-4 w-64 rounded-md" />
                        <ShimmerBone className="h-3 w-80 rounded-sm" />
                    </div>
                    <ShimmerBone className="h-6 w-32 rounded-lg" />
                </div>

                {/* 5 Milestone Session Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                        <div
                            key={idx}
                            className={`p-4 rounded-2xl border flex flex-col justify-start min-h-[140px] space-y-2.5 ${
                                idx === 1
                                    ? 'bg-white border-zinc-300 shadow-sm ring-1 ring-zinc-200'
                                    : 'bg-white border-gray-200/80'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <ShimmerBone className="h-4 w-20 rounded-md" />
                                <ShimmerBone className="w-8 h-8 rounded-xl shrink-0" />
                            </div>
                            <div className="pt-1">
                                <ShimmerBone className="h-4 w-28 rounded-md" />
                            </div>
                            <ShimmerBone className="h-3 w-20 rounded-xs" />
                            <div className="space-y-1 pt-1">
                                <ShimmerBone className="h-3 w-full rounded-xs" />
                                <ShimmerBone className="h-3 w-4/5 rounded-xs" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 3: Split Executive Cockpit */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left Column (7 cols): Selected Session Dossier & Pre-Meeting Pack */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-4 h-full flex flex-col justify-between">
                        {/* Dossier Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <ShimmerBone className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <ShimmerBone className="h-5 w-32 rounded-md" />
                                        <ShimmerBone className="h-4 w-12 rounded-md" />
                                        <ShimmerBone className="h-4 w-24 rounded-md" />
                                    </div>
                                    <ShimmerBone className="h-3 w-20 rounded-sm" />
                                </div>
                            </div>
                            <ShimmerBone className="h-8 w-28 rounded-xl" />
                        </div>

                        {/* Dossier Body: Formal Session Agenda Block */}
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/70 space-y-3">
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <ShimmerBone className="h-3 w-36 rounded-xs" />
                                        <ShimmerBone className="h-5 w-24 rounded-md" />
                                    </div>
                                    <ShimmerBone className="h-4 w-3/4 rounded-md" />
                                </div>

                                {/* Structured Agenda Items Rows */}
                                <div className="space-y-2 pt-2.5 border-t border-gray-200/60">
                                    {Array.from({ length: 3 }).map((_, aIdx) => (
                                        <div
                                            key={aIdx}
                                            className="flex items-center gap-3 p-2.5 px-3 rounded-xl bg-white border border-gray-200/70"
                                        >
                                            <ShimmerBone className="w-5 h-5 rounded-full shrink-0" />
                                            <ShimmerBone className="h-3.5 w-full rounded-sm" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pre-Meeting Governance & Readiness Pack */}
                            <div className="pt-3 border-t border-gray-100 space-y-3">
                                <div className="flex items-center justify-between">
                                    <ShimmerBone className="h-3 w-48 rounded-xs" />
                                    <ShimmerBone className="h-5 w-24 rounded-md" />
                                </div>

                                <div className="grid grid-cols-2 gap-2.5">
                                    {Array.from({ length: 4 }).map((_, cIdx) => (
                                        <div
                                            key={cIdx}
                                            className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-center justify-between gap-2"
                                        >
                                            <div className="space-y-1 min-w-0 flex-1">
                                                <ShimmerBone className="h-2.5 w-20 rounded-xs" />
                                                <ShimmerBone className="h-3.5 w-28 rounded-sm" />
                                            </div>
                                            <ShimmerBone className="h-6 w-16 rounded-lg shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (5 cols): Prior Board Commitments Tracker & Director's Probes */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-5 h-full">
                    {/* Action Panel: Prior Board Commitments Tracker */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <ShimmerBone className="w-2 h-2 rounded-full shrink-0" />
                                    <ShimmerBone className="h-3.5 w-44 rounded-md" />
                                </div>
                                <ShimmerBone className="h-4 w-36 rounded-md ml-4" />
                            </div>
                            <ShimmerBone className="h-7 w-28 rounded-xl shrink-0" />
                        </div>

                        {/* Deliverables List */}
                        <div className="space-y-2.5 my-3">
                            {Array.from({ length: 3 }).map((_, dIdx) => (
                                <div
                                    key={dIdx}
                                    className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 flex flex-col justify-between gap-1.5"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            <ShimmerBone className="w-3.5 h-3.5 rounded-full shrink-0" />
                                            <ShimmerBone className="h-3.5 w-3/4 rounded-sm" />
                                        </div>
                                        <ShimmerBone className="h-5 w-20 rounded-md shrink-0" />
                                    </div>
                                    <div className="flex items-center justify-between pl-5">
                                        <ShimmerBone className="h-3 w-24 rounded-xs" />
                                        <ShimmerBone className="h-3 w-16 rounded-xs" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Audit Assurance */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ShimmerBone className="w-4 h-4 rounded-full" />
                                <ShimmerBone className="h-3 w-32 rounded-sm" />
                            </div>
                            <ShimmerBone className="h-3 w-20 rounded-sm" />
                        </div>
                    </div>

                    {/* Strategic Inquiries & Director's Probes */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <ShimmerBone className="w-2 h-2 rounded-full shrink-0" />
                                    <ShimmerBone className="h-3.5 w-48 rounded-md" />
                                </div>
                                <ShimmerBone className="h-4 w-32 rounded-md ml-4" />
                            </div>
                            <ShimmerBone className="h-7 w-32 rounded-xl shrink-0" />
                        </div>

                        {/* Probes List */}
                        <div className="space-y-2.5 my-3">
                            <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/70 space-y-2">
                                <div className="flex items-center justify-between">
                                    <ShimmerBone className="h-4 w-24 rounded-md" />
                                    <ShimmerBone className="h-3 w-16 rounded-xs" />
                                </div>
                                <ShimmerBone className="h-3.5 w-full rounded-sm" />
                                <ShimmerBone className="h-3 w-4/5 rounded-xs" />
                            </div>
                        </div>

                        {/* Footer Briefing Indicator */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                            <ShimmerBone className="h-3 w-48 rounded-sm" />
                            <ShimmerBone className="h-3 w-20 rounded-sm" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * 1:1 Pixel-Accurate Full Page Skeleton for Data Pipelines & APIs
 * Exactly matches integrations/page.tsx:
 * - Section 1: Heading & 2 action buttons
 * - Section 2: Master Telemetry Connectors Table (6 exact columns: Pipeline/Venture, Protocol, Endpoint/SHA, Throughput/Latency, Status/Sync, Actions)
 * - Section 3: Quick Ingestion Webhook cURL Terminal Box
 * Zero raw text, icons, or buttons: all shimmered down into pure glowing skeleton geometry.
 */
export function IntegrationsPageSkeleton() {
    return (
        <div className="flex flex-col gap-5 pb-8 animate-fadeIn">
            {/* Section 1: Page Heading and Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <ShimmerBone className="h-7 w-64 rounded-md" />
                    <ShimmerBone className="h-3.5 w-96 rounded-sm" />
                </div>
                <div className="flex items-center gap-2.5">
                    <ShimmerBone className="h-8 w-44 rounded-xl" />
                    <ShimmerBone className="h-8 w-32 rounded-xl" />
                </div>
            </div>

            {/* Section 2: Master Telemetry Connectors Table (Active Pipelines) */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
                {/* Table Header Controls */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="h-4 w-28 rounded-md" />
                        <ShimmerBone className="h-5 w-16 rounded-full" />
                    </div>

                    {/* Protocol Filter Tabs Container */}
                    <div className="inline-flex items-center rounded-xl bg-gray-100 p-0.5 gap-1">
                        <ShimmerBone className="h-6 w-12 rounded-lg" />
                        <ShimmerBone className="h-6 w-20 rounded-lg" />
                        <ShimmerBone className="h-6 w-16 rounded-lg" />
                        <ShimmerBone className="h-6 w-18 rounded-lg" />
                        <ShimmerBone className="h-6 w-14 rounded-lg" />
                    </div>
                </div>

                {/* Table Body matching the 6 specific columns of integrations/page.tsx */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/70 border-b border-gray-100">
                            <tr>
                                <th className="py-3 px-4 w-[24%]">
                                    <ShimmerBone className="h-3 w-28 rounded-xs" />
                                </th>
                                <th className="py-3 px-4 w-[12%]">
                                    <ShimmerBone className="h-3 w-16 rounded-xs" />
                                </th>
                                <th className="py-3 px-4 w-[26%]">
                                    <ShimmerBone className="h-3 w-36 rounded-xs" />
                                </th>
                                <th className="py-3 px-4 w-[16%]">
                                    <ShimmerBone className="h-3 w-24 rounded-xs" />
                                </th>
                                <th className="py-3 px-4 w-[14%]">
                                    <ShimmerBone className="h-3 w-20 rounded-xs" />
                                </th>
                                <th className="py-3 px-4 text-center w-20">
                                    <ShimmerBone className="h-3 w-12 rounded-xs mx-auto" />
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Array.from({ length: 6 }).map((_, rIdx) => (
                                <tr key={rIdx} className="hover:bg-gray-50/60">
                                    {/* Column 1: Pipeline & Venture (monogram avatar + 2 lines) */}
                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-2.5">
                                            <ShimmerBone className="w-8 h-8 rounded-lg shrink-0" />
                                            <div className="space-y-1">
                                                <ShimmerBone className="h-3.5 w-28 rounded-sm" />
                                                <ShimmerBone className="h-2.5 w-20 rounded-xs" />
                                            </div>
                                        </div>
                                    </td>

                                    {/* Column 2: Protocol pill */}
                                    <td className="py-3.5 px-4">
                                        <ShimmerBone className="h-5 w-18 rounded-md" />
                                    </td>

                                    {/* Column 3: Endpoint & Verification (2 lines of mono) */}
                                    <td className="py-3.5 px-4">
                                        <div className="space-y-1">
                                            <ShimmerBone className="h-3.5 w-40 rounded-sm" />
                                            <ShimmerBone className="h-2.5 w-52 rounded-xs" />
                                        </div>
                                    </td>

                                    {/* Column 4: Throughput & Latency (2 lines of mono) */}
                                    <td className="py-3.5 px-4">
                                        <div className="space-y-1">
                                            <ShimmerBone className="h-3.5 w-24 rounded-sm" />
                                            <ShimmerBone className="h-2.5 w-16 rounded-xs" />
                                        </div>
                                    </td>

                                    {/* Column 5: Status & Sync (status tag + synced time) */}
                                    <td className="py-3.5 px-4">
                                        <div className="space-y-1">
                                            <ShimmerBone className="h-3.5 w-16 rounded-sm" />
                                            <ShimmerBone className="h-2.5 w-20 rounded-xs" />
                                        </div>
                                    </td>

                                    {/* Column 6: Actions (centered 7x7 button) */}
                                    <td className="py-3.5 px-4 text-center">
                                        <ShimmerBone className="w-7 h-7 rounded-lg mx-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 4: Integration Quick-Start cURL Terminal Box */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="w-2 h-2 rounded-full" />
                        <ShimmerBone className="h-3.5 w-44 rounded-md" />
                    </div>
                    <ShimmerBone className="h-6 w-20 rounded-lg" />
                </div>
                {/* Terminal Code Block Skeleton with shimmering code lines (light porcelain) */}
                <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/70 space-y-2">
                    <div className="flex items-center gap-2">
                        <ShimmerBone className="h-3 w-12 rounded-xs" />
                        <ShimmerBone className="h-3 w-64 rounded-xs" />
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                        <ShimmerBone className="h-3 w-8 rounded-xs" />
                        <ShimmerBone className="h-3 w-48 rounded-xs" />
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                        <ShimmerBone className="h-3 w-8 rounded-xs" />
                        <ShimmerBone className="h-3 w-36 rounded-xs" />
                    </div>
                    <div className="flex items-center gap-2 pl-4">
                        <ShimmerBone className="h-3 w-8 rounded-xs" />
                        <ShimmerBone className="h-3 w-72 rounded-xs" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Full Page Skeleton for Settings & Workspace
 * Zero text, zero icons, zero buttons: 100% pure shimmer bones
 */
export function SettingsPageSkeleton() {
    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header: Title + Save Button */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <ShimmerBone className="h-6 w-52 rounded-md" />
                    <ShimmerBone className="h-3.5 w-72 rounded-sm" />
                </div>
                <ShimmerBone className="h-8 w-28 rounded-xl" />
            </div>

            {/* Tab Navigation Strip */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
                <ShimmerBone className="h-7 w-28 rounded-xl" />
                <ShimmerBone className="h-7 w-36 rounded-xl" />
                <ShimmerBone className="h-7 w-32 rounded-xl" />
                <ShimmerBone className="h-7 w-32 rounded-xl" />
            </div>

            {/* Profile Settings Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-6">
                <div className="flex items-center gap-4">
                    <ShimmerBone className="w-16 h-16 rounded-full shrink-0" />
                    <div className="space-y-2">
                        <ShimmerBone className="h-4 w-32 rounded-md" />
                        <ShimmerBone className="h-3 w-48 rounded-sm" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                    {Array.from({ length: 6 }).map((_, fIdx) => (
                        <div key={fIdx} className="space-y-2">
                            <ShimmerBone className="h-3 w-24 rounded-sm" />
                            <ShimmerBone className="h-9 w-full rounded-xl" />
                        </div>
                    ))}
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <ShimmerBone className="h-8 w-32 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

/**
 * Full Page Skeleton for Help & Support Guide
 * Zero text, zero icons, zero buttons: 100% pure shimmer bones
 */
export function HelpPageSkeleton() {
    return (
        <div className="space-y-6 animate-fadeIn pb-10">
            {/* Header: Title + Action */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5">
                    <ShimmerBone className="h-6 w-48 rounded-md" />
                    <ShimmerBone className="h-3.5 w-80 rounded-sm" />
                </div>
                <ShimmerBone className="h-8 w-32 rounded-xl" />
            </div>

            {/* Quick Start 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, qIdx) => (
                    <div key={qIdx} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-3">
                        <ShimmerBone className="w-9 h-9 rounded-xl" />
                        <div className="space-y-1.5">
                            <ShimmerBone className="h-4 w-28 rounded-md" />
                            <ShimmerBone className="h-3 w-full rounded-sm" />
                            <ShimmerBone className="h-3 w-3/4 rounded-sm" />
                        </div>
                        <ShimmerBone className="h-3 w-20 rounded-sm" />
                    </div>
                ))}
            </div>

            {/* FAQ Accordion Section */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-4">
                <div className="space-y-1 mb-2">
                    <ShimmerBone className="h-4 w-44 rounded-md" />
                    <ShimmerBone className="h-3 w-64 rounded-sm" />
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, faqIdx) => (
                        <div key={faqIdx} className="p-4 rounded-xl border border-gray-100 space-y-2">
                            <div className="flex justify-between items-center">
                                <ShimmerBone className="h-3.5 w-64 rounded-sm" />
                                <ShimmerBone className="w-4 h-4 rounded-sm" />
                            </div>
                            {faqIdx === 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-gray-50">
                                    <ShimmerBone className="h-3 w-full rounded-sm" />
                                    <ShimmerBone className="h-3 w-5/6 rounded-sm" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
