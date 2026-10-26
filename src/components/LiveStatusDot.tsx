"use client";

import React from 'react';
import { SkeletonBone } from './SkeletonShimmer';

export type SocketStatusType = 'connected' | 'delayed' | 'disconnected';

interface LiveStatusDotProps {
  status?: SocketStatusType;
  isLoading?: boolean;
  className?: string;
  size?: number;
}

/**
 * Reusable Live Status Dot for Page Titles
 * 🟢 Green pulse = Active Live Socket connection
 * 🟡 Yellow amber pulse = Delayed telemetry / Reconciliation pending
 * 🔴 Red = Disconnected / Offline
 * Grey Skeleton circle = Loading
 */
export function LiveStatusDot({
  status = 'connected',
  isLoading = false,
  className = '',
  size = 8,
}: LiveStatusDotProps) {
  if (isLoading) {
    return (
      <span className={`inline-flex items-center align-middle ${className}`}>
        <SkeletonBone width={size} height={size} borderRadius={999} />
      </span>
    );
  }

  const tooltipText =
    status === 'connected'
      ? 'Live socket connected (telemetry synchronized)'
      : status === 'delayed'
      ? 'Delayed telemetry / pending reconciliation (TC-03)'
      : 'Socket disconnected / offline';

  const colorClass =
    status === 'connected'
      ? 'bg-emerald-500 animate-pulse'
      : status === 'delayed'
      ? 'bg-amber-500 animate-pulse'
      : 'bg-rose-500';

  return (
    <span
      className={`relative inline-flex items-center justify-center align-middle cursor-pointer group ml-2.5 ${className}`}
      title={tooltipText}
    >
      <span
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`rounded-full ${colorClass}`}
      />
      {/* Micro Tooltip */}
      <span className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover:flex items-center px-2 py-0.5 rounded-md bg-zinc-900 text-white text-[10px] whitespace-nowrap shadow-md">
        {status === 'connected'
          ? 'Live socket connected'
          : status === 'delayed'
          ? 'Delayed telemetry'
          : 'Socket offline'}
      </span>
    </span>
  );
}

export default LiveStatusDot;
