import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

/**
 * Base Bone component with light-mode shimmer tailored for Metrica.
 * Uses high-efficiency CSS keyframe shimmer for 60fps rendering without external JS overhead.
 */
export function SkeletonBone({
  className = '',
  style,
  width,
  height,
  borderRadius = '8px',
}: SkeletonProps) {
  return (
    <div
      className={`metrica-skeleton-bone ${className}`}
      style={{
        width: width !== undefined ? width : '100%',
        height: height !== undefined ? height : '16px',
        borderRadius,
        ...style,
      }}
    />
  );
}

/**
 * Wraps content or acts as a shimmer container with children layout sizing
 */
export function SkeletonShimmerContainer({
  children,
  className = '',
  style,
  borderRadius = '8px',
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  borderRadius?: string | number;
}) {
  return (
    <div
      className={`metrica-skeleton-bone ${className}`}
      style={{
        borderRadius,
        ...style,
      }}
    >
      <div className="invisible select-none pointer-events-none">{children}</div>
    </div>
  );
}

/**
 * Dedicated Full-Blown KPI Card Skeleton
 * Exactly mirrors the 4 KPI stat cards on Metrica's white card aesthetic:
 * Top: Title skeleton + 5-bar micro sparkline skeleton
 * Middle: Value metric skeleton
 * Bottom: Growth percentage pill skeleton + info icon skeleton
 */
export function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-card flex flex-col justify-between select-none">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          {/* Top Title Bone */}
          <div className="flex items-center gap-1.5">
            <SkeletonBone width={95} height={12} borderRadius={4} />
          </div>
          {/* Main Metric Value Bone */}
          <div className="pt-0.5">
            <SkeletonBone width={120} height={26} borderRadius={6} />
          </div>
        </div>
        {/* Micro Sparkline Shimmer Bars */}
        <div className="flex items-end gap-1 h-8 pt-1">
          <SkeletonBone width={4} height={12} borderRadius={99} />
          <SkeletonBone width={4} height={20} borderRadius={99} />
          <SkeletonBone width={4} height={16} borderRadius={99} />
          <SkeletonBone width={4} height={28} borderRadius={99} />
          <SkeletonBone width={4} height={22} borderRadius={99} />
        </div>
      </div>
      {/* Bottom Subtext & Growth Bone */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SkeletonBone width={14} height={14} borderRadius={99} />
          <SkeletonBone width={75} height={12} borderRadius={4} />
        </div>
        <SkeletonBone width={14} height={14} borderRadius={99} />
      </div>
    </div>
  );
}

/**
 * 1. Sales Trend Matrix Bar Chart Skeleton
 * Perfectly matches the 48-column matrix pixel wave layout on Metrica's white card
 */
export function SalesTrendSkeleton() {
  return (
    <div className="relative mt-6 pt-4 pb-2 border-t border-dashed border-gray-100 select-none">
      {/* Background horizontal guideline ticks */}
      <div className="absolute inset-x-0 top-4 bottom-8 flex flex-col justify-between pointer-events-none">
        {['60k', '50k', '40k', '30k', '20k', '10k', '0k'].map((tick, i) => (
          <div key={i} className="flex items-center w-full border-b border-gray-100/80 border-dashed pb-0.5">
            <span className="w-7 text-right pr-2 text-gray-300 font-mono text-[10px]">{tick}</span>
            <div className="flex-1 border-b border-gray-100/80 border-dashed" />
          </div>
        ))}
      </div>

      {/* 48-Column Shimmer Canvas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(48, minmax(0, 1fr))',
          gap: '2.5px',
        }}
        className="relative w-full pl-9 pr-3 items-end pt-2"
      >
        {Array.from({ length: 48 }).map((_, colIdx) => {
          // Harmonic wave height simulation for realistic skeleton silhouette
          const waveHeight = Math.round(5 + 9 * Math.sin((colIdx / 48) * Math.PI * 1.8));
          const filledCells = Math.max(3, Math.min(18, waveHeight));
          const emptyCells = 20 - filledCells;

          return (
            <div key={colIdx} style={{ gap: '2.5px' }} className="flex flex-col items-center py-0.5">
              {/* Empty background cell placeholders */}
              {Array.from({ length: emptyCells }).map((_, r) => (
                <div
                  key={`e-${r}`}
                  className="w-full aspect-square rounded-[1.5px] bg-[#f8fafc] border border-gray-100/60"
                />
              ))}
              {/* Filled shimmer cells */}
              {Array.from({ length: filledCells }).map((_, r) => (
                <div
                  key={`f-${r}`}
                  className="w-full aspect-square rounded-[1.5px] metrica-skeleton-bone opacity-80"
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Axis Month Labels Skeleton - Exact match to loaded view */}
      <div className="flex w-full pl-9 pr-3 mt-2 pt-1 border-t border-dashed border-gray-100/90">
        {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m) => (
          <div key={m} className="flex-1 flex justify-center">
            <SkeletonBone width={24} height={10} borderRadius={3} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2. Revenue Breakdown Needle Bar Chart Skeleton
 * Replicates the 11 vertical needle bars with top expansion + bottom base pillars
 */
export function RevenueBreakdownSkeleton() {
  const heights = [120, 150, 190, 140, 175, 210, 160, 195, 130, 185, 205];
  return (
    <div className="flex-1 flex flex-col justify-between mt-5 relative select-none">
      {/* Background guideline bullets */}
      <div className="absolute inset-x-0 top-3 bottom-8 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={`g-${i}`} className="flex items-center w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-200 mr-2 flex-shrink-0" />
            <div className="flex-1 border-b border-gray-200/60 border-dashed" />
          </div>
        ))}
      </div>

      {/* 11 Needle Shimmer Bars */}
      <div className="relative flex items-end justify-between flex-1 min-h-[260px] px-2 z-10">
        {heights.map((h, idx) => {
          const topPx = Math.round(h * 0.35);
          const botPx = h - topPx;
          return (
            <div key={idx} className="flex flex-col items-center gap-1 w-3 py-1">
              {/* Expansion Top Shimmer Bar */}
              <div
                style={{ height: `${topPx}px` }}
                className="w-1.5 metrica-skeleton-bone rounded-t-sm opacity-60"
              />
              {/* Base Bottom Shimmer Bar */}
              <div
                style={{ height: `${botPx}px` }}
                className="w-1.5 metrica-skeleton-bone rounded-b-sm"
              />
            </div>
          );
        })}
      </div>

      {/* Bottom Dotted Axis Range */}
      <div className="mt-3 pt-1 flex items-center justify-between">
        <SkeletonBone width={40} height={10} borderRadius={3} />
        <div className="flex-1 mx-3 border-b border-gray-200 border-dotted" />
        <SkeletonBone width={70} height={10} borderRadius={3} />
      </div>
    </div>
  );
}

/**
 * 3. Standard Table Row Skeleton (5 or N rows)
 */
export function TableRowsSkeleton({
  rows = 5,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="hover:bg-gray-50/40 transition-colors">
          <td className="py-3.5 px-3">
            <SkeletonBone width={70} height={14} borderRadius={4} />
          </td>
          <td className="py-3.5 px-3">
            <div className="flex items-center gap-2.5">
              <SkeletonBone width={26} height={26} borderRadius={6} />
              <div className="space-y-1">
                <SkeletonBone width={110} height={12} borderRadius={3} />
                <SkeletonBone width={60} height={10} borderRadius={3} />
              </div>
            </div>
          </td>
          <td className="py-3.5 px-3">
            <SkeletonBone width={90} height={12} borderRadius={3} />
          </td>
          <td className="py-3.5 px-3">
            <SkeletonBone width={65} height={12} borderRadius={3} />
          </td>
          <td className="py-3.5 px-3">
            <SkeletonBone width={60} height={20} borderRadius={99} />
          </td>
          {columns >= 6 && (
            <td className="py-3.5 px-3 text-right">
              <div className="flex justify-end">
                <SkeletonBone width={70} height={14} borderRadius={4} />
              </div>
            </td>
          )}
          {columns >= 7 && (
            <td className="py-3.5 px-3 text-center">
              <div className="flex justify-center">
                <SkeletonBone width={28} height={28} borderRadius={8} />
              </div>
            </td>
          )}
        </tr>
      ))}
    </>
  );
}

/**
 * 4. Milestone Timeline Schedule Strip Skeleton (Session 01 - 05)
 */
export function MilestoneTimelineSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 select-none">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div
          key={`ms-skel-${idx}`}
          className="p-4 rounded-2xl border border-gray-200/80 bg-white flex flex-col justify-start min-h-[140px] space-y-3"
        >
          <div className="flex items-center justify-between">
            <SkeletonBone width={65} height={18} borderRadius={6} />
            <SkeletonBone width={32} height={32} borderRadius={10} />
          </div>
          <div className="space-y-1.5 pt-1">
            <SkeletonBone width={100} height={16} borderRadius={4} />
            <SkeletonBone width={70} height={12} borderRadius={3} />
          </div>
          <div className="pt-1">
            <SkeletonBone width="100%" height={12} borderRadius={3} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 5. Full Split Executive Cockpit Skeleton for Board Governance
 * Replicates the exact dual-column layout:
 * Left 7 cols: Session Dossier + Agenda Box (3 rows) + 4 Readiness Cards
 * Right 5 cols: Prior Commitments Tracker + Director's Strategic Probes
 */
export function GovernanceCockpitSkeleton() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch select-none" data-purpose="governance-cockpit-skeleton">
      {/* Left Column (7 cols): Selected Session Dossier & Pre-Meeting Pack */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-4 h-full flex flex-col justify-between">
          {/* Dossier Header Skeleton */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <SkeletonBone width={40} height={40} borderRadius={12} />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <SkeletonBone width={110} height={18} borderRadius={4} />
                  <SkeletonBone width={45} height={16} borderRadius={4} />
                  <SkeletonBone width={70} height={14} borderRadius={3} />
                </div>
                <SkeletonBone width={130} height={12} borderRadius={3} />
              </div>
            </div>
            <SkeletonBone width={95} height={28} borderRadius={10} />
          </div>

          {/* Dossier Body: Agenda Block Skeleton */}
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/70 space-y-3">
              <div className="flex items-center justify-between mb-1.5">
                <SkeletonBone width={140} height={12} borderRadius={3} />
                <SkeletonBone width={110} height={18} borderRadius={6} />
              </div>
              <SkeletonBone width="80%" height={18} borderRadius={4} />

              {/* 3 Structured Agenda Item Rows */}
              <div className="space-y-2 pt-2.5 border-t border-gray-200/60">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 px-3 rounded-xl bg-white border border-gray-200/70">
                    <SkeletonBone width={20} height={20} borderRadius={999} />
                    <SkeletonBone width={idx === 0 ? "75%" : idx === 1 ? "85%" : "65%"} height={14} borderRadius={4} />
                  </div>
                ))}
              </div>
            </div>

            {/* Pre-Meeting Governance & Readiness Pack (4 Cards) */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <SkeletonBone width={180} height={12} borderRadius={3} />
                <SkeletonBone width={90} height={18} borderRadius={4} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-center justify-between gap-2">
                    <div className="space-y-1.5">
                      <SkeletonBone width={85} height={10} borderRadius={2} />
                      <SkeletonBone width={110} height={14} borderRadius={3} />
                    </div>
                    <SkeletonBone width={65} height={20} borderRadius={999} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column (5 cols): Prior Board Commitments Tracker & Director's Probes */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-5 h-full">
        {/* Panel 1: Prior Board Commitments Tracker Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="space-y-1">
              <SkeletonBone width={150} height={14} borderRadius={3} />
              <SkeletonBone width={120} height={18} borderRadius={6} />
            </div>
            <SkeletonBone width={110} height={28} borderRadius={10} />
          </div>

          <div className="space-y-2.5 my-3">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonBone width="70%" height={14} borderRadius={3} />
                  <SkeletonBone width={65} height={16} borderRadius={999} />
                </div>
                <SkeletonBone width={100} height={11} borderRadius={2} />
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <SkeletonBone width={130} height={12} borderRadius={3} />
            <SkeletonBone width={70} height={12} borderRadius={3} />
          </div>
        </div>

        {/* Panel 2: Director's Strategic Probes Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="space-y-1">
              <SkeletonBone width={160} height={14} borderRadius={3} />
              <SkeletonBone width={110} height={16} borderRadius={6} />
            </div>
            <SkeletonBone width={125} height={28} borderRadius={10} />
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-200/70 my-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <SkeletonBone width={100} height={12} borderRadius={4} />
              <SkeletonBone width={55} height={12} borderRadius={3} />
            </div>
            <SkeletonBone width="100%" height={14} borderRadius={3} />
            <SkeletonBone width="90%" height={14} borderRadius={3} />
            <SkeletonBone width="60%" height={10} borderRadius={2} />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <SkeletonBone width={140} height={11} borderRadius={3} />
            <SkeletonBone width={80} height={11} borderRadius={3} />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for Data Pipelines & APIs (/integrations) Table
 * Exactly matches Active Pipelines table structure and rows.
 */
export function PipelinesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SkeletonBone width={100} height={14} borderRadius={4} />
          <SkeletonBone width={50} height={18} borderRadius={999} />
        </div>
        <SkeletonBone width={220} height={28} borderRadius={10} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-600">
          <thead className="bg-gray-50/70 border-b border-gray-100">
            <tr>
              <th className="py-3 px-4"><SkeletonBone width={110} height={10} borderRadius={2} /></th>
              <th className="py-3 px-4"><SkeletonBone width={60} height={10} borderRadius={2} /></th>
              <th className="py-3 px-4"><SkeletonBone width={140} height={10} borderRadius={2} /></th>
              <th className="py-3 px-4"><SkeletonBone width={110} height={10} borderRadius={2} /></th>
              <th className="py-3 px-4"><SkeletonBone width={90} height={10} borderRadius={2} /></th>
              <th className="py-3 px-4 text-center w-20"><SkeletonBone width={40} height={10} borderRadius={2} className="mx-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: rows }).map((_, idx) => (
              <tr key={idx}>
                {/* Col 1 */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <SkeletonBone width={32} height={32} borderRadius={8} className="shrink-0" />
                    <div className="space-y-1">
                      <SkeletonBone width={120} height={13} borderRadius={3} />
                      <SkeletonBone width={80} height={10} borderRadius={2} />
                    </div>
                  </div>
                </td>
                {/* Col 2 */}
                <td className="py-3 px-4">
                  <SkeletonBone width={65} height={18} borderRadius={6} />
                </td>
                {/* Col 3 */}
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <SkeletonBone width={140} height={12} borderRadius={3} />
                    <SkeletonBone width={90} height={10} borderRadius={2} />
                  </div>
                </td>
                {/* Col 4 */}
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <SkeletonBone width={80} height={12} borderRadius={3} />
                    <SkeletonBone width={60} height={10} borderRadius={2} />
                  </div>
                </td>
                {/* Col 5 */}
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <SkeletonBone width={75} height={18} borderRadius={999} />
                    <SkeletonBone width={50} height={10} borderRadius={2} />
                  </div>
                </td>
                {/* Col 6 */}
                <td className="py-3 px-4 text-center">
                  <SkeletonBone width={24} height={24} borderRadius={6} className="mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * Skeleton for Help & Test Guide (/help)
 */
export function HelpGuideSkeleton() {
  return (
    <div className="space-y-6">
      {/* 4 Feature Walkthrough Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SkeletonBone width={130} height={14} borderRadius={4} />
          <SkeletonBone width={60} height={12} borderRadius={3} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card flex flex-col justify-between h-[210px]">
              <div className="space-y-2">
                <SkeletonBone width={32} height={32} borderRadius={8} />
                <SkeletonBone width={120} height={14} borderRadius={3} />
                <SkeletonBone width="100%" height={12} borderRadius={2} />
                <SkeletonBone width="80%" height={12} borderRadius={2} />
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <SkeletonBone width={90} height={12} borderRadius={3} />
                <SkeletonBone width={16} height={12} borderRadius={3} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2-Col: FAQ Accordion & Quick Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-3">
          <SkeletonBone width={160} height={16} borderRadius={4} />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonBone width="65%" height={14} borderRadius={3} />
                  <SkeletonBone width={16} height={16} borderRadius={4} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-3">
          <SkeletonBone width={130} height={16} borderRadius={4} />
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/70 border border-gray-100">
                <SkeletonBone width={110} height={12} borderRadius={3} />
                <SkeletonBone width={45} height={18} borderRadius={6} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for System Settings (/settings)
 */
export function SettingsContentSkeleton() {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-6">
      <div className="space-y-1">
        <SkeletonBone width={180} height={16} borderRadius={4} />
        <SkeletonBone width={280} height={12} borderRadius={3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-gray-100">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <SkeletonBone width={100} height={12} borderRadius={3} />
            <SkeletonBone width="100%" height={36} borderRadius={10} />
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 space-y-3">
        <div className="space-y-1">
          <SkeletonBone width={160} height={14} borderRadius={3} />
          <SkeletonBone width={240} height={11} borderRadius={2} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="space-y-2">
              <SkeletonBone width={90} height={12} borderRadius={3} />
              <SkeletonBone width="100%" height={36} borderRadius={10} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Skeleton for Quick Ingestion Webhook cURL Terminal Box (/integrations)
 */
export function CurlQuickstartSkeleton() {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonBone width={8} height={8} borderRadius={999} />
          <SkeletonBone width={200} height={12} borderRadius={3} />
        </div>
        <SkeletonBone width={85} height={26} borderRadius={8} />
      </div>
      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
        <SkeletonBone width="75%" height={12} borderRadius={3} style={{ background: '#27272a' }} />
        <SkeletonBone width="50%" height={12} borderRadius={3} style={{ background: '#27272a' }} />
        <SkeletonBone width="65%" height={12} borderRadius={3} style={{ background: '#27272a' }} />
      </div>
    </section>
  );
}

/**
 * Skeleton for Company Comparison Benchmark Matrix Table (/comparison)
 */
export function ComparisonMatrixTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase text-[11px]">
            <th className="py-3 px-2 w-8"><SkeletonBone width={14} height={14} borderRadius={3} /></th>
            <th className="py-3 px-3"><SkeletonBone width={80} height={10} borderRadius={2} /></th>
            <th className="py-3 px-3"><SkeletonBone width={90} height={10} borderRadius={2} /></th>
            <th className="py-3 px-3"><SkeletonBone width={70} height={10} borderRadius={2} /></th>
            <th className="py-3 px-3"><SkeletonBone width={85} height={10} borderRadius={2} /></th>
            <th className="py-3 px-3"><SkeletonBone width={60} height={10} borderRadius={2} /></th>
            <th className="py-3 px-3"><SkeletonBone width={75} height={10} borderRadius={2} /></th>
            <th className="py-3 px-3"><SkeletonBone width={60} height={10} borderRadius={2} /></th>
            <th className="py-3 px-3 text-center w-20"><SkeletonBone width={40} height={10} borderRadius={2} className="mx-auto" /></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, idx) => (
            <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
              <td className="py-3.5 px-2">
                <SkeletonBone width={14} height={14} borderRadius={3} />
              </td>
              <td className="py-3.5 px-3">
                <div className="flex items-center gap-2.5">
                  <SkeletonBone width={28} height={28} borderRadius={8} className="shrink-0" />
                  <div className="space-y-1">
                    <SkeletonBone width={100} height={12} borderRadius={3} />
                    <SkeletonBone width={70} height={10} borderRadius={2} />
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-3">
                <SkeletonBone width={65} height={13} borderRadius={3} />
              </td>
              <td className="py-3.5 px-3">
                <SkeletonBone width={45} height={13} borderRadius={3} />
              </td>
              <td className="py-3.5 px-3">
                <SkeletonBone width={60} height={13} borderRadius={3} />
              </td>
              <td className="py-3.5 px-3">
                <SkeletonBone width={40} height={13} borderRadius={3} />
              </td>
              <td className="py-3.5 px-3">
                <SkeletonBone width={50} height={13} borderRadius={3} />
              </td>
              <td className="py-3.5 px-3">
                <SkeletonBone width={75} height={18} borderRadius={999} />
              </td>
              <td className="py-3.5 px-3 text-center">
                <SkeletonBone width={24} height={20} borderRadius={4} className="mx-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

