"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { INITIAL_DATA_PIPELINES } from '@/data/pipelines';
import { DataPipeline } from '@/types/pipeline';

export default function IntegrationsPage() {
    const { globalSearchQuery, showActionToast } = useDashboard();
    // Maintain each pipeline with an internal seconds elapsed counter
    const [pipelines, setPipelines] = useState<(DataPipeline & { secondsElapsed: number })[]>(() =>
        INITIAL_DATA_PIPELINES.map(p => {
            let initialSec = 2;
            if (p.lastPayloadSynced.includes('s ago')) {
                initialSec = parseInt(p.lastPayloadSynced) || 2;
            } else if (p.lastPayloadSynced.includes('m ago')) {
                initialSec = (parseInt(p.lastPayloadSynced) || 14) * 60;
            }
            return {
                ...p,
                secondsElapsed: initialSec,
            };
        })
    );
    const [filterProtocol, setFilterProtocol] = useState<string>('All');
    const [pingingId, setPingingId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        if (activeMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenuId]);

    // ✨ 1-Second Real-Time Telemetry & Seconds Ticker (Continuous counter)
    useEffect(() => {
        const ticker = setInterval(() => {
            setPipelines(prev => prev.map(pipe => {
                // If actively pinging/syncing this pipe, don't tick
                if (pipe.status === 'Syncing') return pipe;

                // Natural continuous time counter: 3s ago, 4s ago, 5s ago...
                const nextSec = pipe.secondsElapsed + 1;

                // Format live string: 1s ago, 2s ago, 1m ago...
                let formattedTime = `${nextSec}s ago`;
                if (nextSec >= 60) {
                    formattedTime = `${Math.floor(nextSec / 60)}m ago`;
                }

                // Subtle organic network latency jitter every 3 seconds: -2ms to +3ms
                let currentMs = parseInt(pipe.latency) || 32;
                if (nextSec % 3 === 0) {
                    const delta = Math.floor(Math.random() * 5) - 2;
                    currentMs = Math.max(18, Math.min(65, currentMs + delta));
                }

                return {
                    ...pipe,
                    secondsElapsed: nextSec,
                    latency: `${currentMs}ms`,
                    lastPayloadSynced: formattedTime,
                };
            }));
        }, 1000);

        return () => clearInterval(ticker);
    }, []);

    const filteredPipelines = pipelines.filter(pipe => {
        const matchesSearch =
            pipe.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            pipe.companyName.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            pipe.endpoint.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            pipe.protocol.toLowerCase().includes(globalSearchQuery.toLowerCase());

        const matchesProtocol =
            filterProtocol === 'All' ||
            (filterProtocol === 'Webhooks' && pipe.protocol.includes('Webhook')) ||
            (filterProtocol === 'Stripe' && pipe.protocol.includes('Stripe')) ||
            (filterProtocol === 'GraphQL' && pipe.protocol.includes('GraphQL')) ||
            (filterProtocol === 'OAuth' && pipe.protocol.includes('OAuth'));

        return matchesSearch && matchesProtocol;
    });

    const handleTriggerRefresh = () => {
        // Set all to Syncing
        setPipelines(prev => prev.map(p => ({ ...p, status: 'Syncing' })));
        showActionToast('Re-verifying all 5 cryptographic pipeline telemetry streams...');

        setTimeout(() => {
            setPipelines(prev => prev.map(p => {
                const refreshedMs = Math.floor(Math.random() * 20 + 20) + 'ms';
                return {
                    ...p,
                    latency: refreshedMs,
                    status: 'Healthy',
                    secondsElapsed: 0,
                    lastPayloadSynced: 'Just now'
                };
            }));
            showActionToast('All 5 pipelines verified & synchronized (P99 Healthy)');
        }, 750);
    };

    const handleTestPing = (pipe: DataPipeline) => {
        setPingingId(pipe.id);
        // Set this specific pipe to Syncing
        setPipelines(prev => prev.map(p => p.id === pipe.id ? { ...p, status: 'Syncing' } : p));

        setTimeout(() => {
            const liveMs = Math.floor(Math.random() * 18 + 19) + 'ms';
            setPipelines(prev => prev.map(p =>
                p.id === pipe.id ? {
                    ...p,
                    latency: liveMs,
                    status: 'Healthy',
                    secondsElapsed: 0,
                    lastPayloadSynced: 'Just now'
                } : p
            ));
            setPingingId(null);
            showActionToast(`ACK received from ${pipe.endpoint} in ${liveMs} (HTTP 200 OK)`);
        }, 600);
    };

    const handleCopyCurl = () => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(
                `curl -X POST https://api.metrica.io/v1/telemetry/events \\\n  -H "Authorization: Bearer mtr_live_98b8c7e9a2" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"mrr.checkpoint","amount":18500,"currency":"USD"}'`
            );
            showActionToast('cURL Webhook snippet copied to clipboard');
        }
    };

    return (
        <div className="flex flex-col gap-5 pb-8">
            {/* Section 1: Page Heading and Controls */}
            <section className="flex flex-wrap items-center justify-between gap-4" data-purpose="integrations-header-controls">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Data Pipelines &amp; APIs</h1>
                    <p className="text-xs text-gray-500 mt-1">Real-time enterprise ingestion pipes, REST/GraphQL endpoints &amp; cryptographic audit sync</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleTriggerRefresh}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-gray-200/80 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors shadow-xs"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Trigger Pipeline Refresh</span>
                    </button>
                    <button
                        onClick={() => showActionToast('New API Ingestion Key provisioned: mtr_live_•••••••')}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#1e2329] text-white text-xs font-medium hover:bg-black transition-colors shadow-sm"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>New Connector</span>
                    </button>
                </div>
            </section>

            {/* Section 2: Master Telemetry Connectors Table (Active Pipelines) */}
            <section className="bg-white rounded-2xl border border-gray-200/80 shadow-card overflow-visible" data-purpose="telemetry-connectors-table">
                {/* Table Header Controls */}
                <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">Active Pipelines</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-mono font-medium">
                            {filteredPipelines.length} total
                        </span>
                    </div>

                    {/* Protocol Filter Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-gray-50 border border-gray-200/60 rounded-xl text-xs">
                        {(['All', 'Webhooks', 'Stripe', 'GraphQL', 'OAuth'] as const).map((proto) => {
                            const isActive = filterProtocol === proto;
                            return (
                                <button
                                    key={proto}
                                    onClick={() => setFilterProtocol(proto)}
                                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                                        isActive
                                            ? 'bg-black text-white shadow-xs font-semibold'
                                            : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                                    }`}
                                >
                                    {proto}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Table Body */}
                <div className="overflow-x-auto overflow-y-visible">
                    <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="py-3 px-4">Pipeline &amp; Venture</th>
                                <th className="py-3 px-4">Protocol</th>
                                <th className="py-3 px-4">Endpoint &amp; Verification</th>
                                <th className="py-3 px-4">Throughput / Latency</th>
                                <th className="py-3 px-4">Status &amp; Sync</th>
                                <th className="py-3 px-4 text-center w-20">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPipelines.map((pipe, index) => (
                                <tr key={pipe.id} className="hover:bg-gray-50/60 transition-colors">
                                    {/* Column 1: Pipeline & Venture */}
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                {pipe.initials}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{pipe.name}</div>
                                                <div className="text-[11px] text-gray-400">{pipe.companyName}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Column 2: Protocol */}
                                    <td className="py-3 px-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px] font-mono font-medium border border-gray-200/50">
                                            {pipe.protocol}
                                        </span>
                                    </td>

                                    {/* Column 3: Endpoint & Verification */}
                                    <td className="py-3 px-4">
                                        <div className="space-y-0.5">
                                            <div className="font-mono text-gray-800 text-[11px]">{pipe.endpoint}</div>
                                            <div className="font-mono text-[10px] text-gray-400 truncate max-w-[240px]">
                                                {pipe.sha256Verification}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Column 4: Throughput & Latency */}
                                    <td className="py-3 px-4">
                                        <div className="space-y-0.5">
                                            <div className="font-mono text-gray-900 font-medium">{pipe.syncRate}</div>
                                            <div className="text-[10px] font-mono text-emerald-600 font-semibold">{pipe.latency} P99</div>
                                        </div>
                                    </td>

                                    {/* Column 5: Status & Sync - Dot and bubble removed */}
                                    <td className="py-3 px-4">
                                        <div className="space-y-0.5">
                                            <div className={`text-xs font-semibold flex items-center gap-1.5 ${
                                                pipe.status === 'Syncing' ? 'text-sky-600 animate-pulse' :
                                                pipe.status === 'Degraded' ? 'text-amber-600' : 'text-emerald-600'
                                            }`}>
                                                {pipe.status === 'Syncing' && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
                                                )}
                                                {pipe.status}
                                            </div>
                                            <div className="text-[10px] text-gray-400">Synced {pipe.lastPayloadSynced}</div>
                                        </div>
                                    </td>

                                    {/* Column 6: Actions - Centered Horizontal Triple Dots with Actions Dropdown */}
                                    <td className="py-3 px-4 text-center w-20">
                                        <div className="relative inline-flex justify-center" ref={activeMenuId === pipe.id ? menuRef : undefined}>
                                            <button
                                                onClick={() => setActiveMenuId(activeMenuId === pipe.id ? null : pipe.id)}
                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors ${
                                                    activeMenuId === pipe.id ? 'bg-gray-100 text-gray-900 ring-1 ring-gray-200' : ''
                                                }`}
                                                title="More Actions"
                                            >
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="5" cy="12" r="2" />
                                                    <circle cx="12" cy="12" r="2" />
                                                    <circle cx="19" cy="12" r="2" />
                                                </svg>
                                            </button>

                                            {activeMenuId === pipe.id && (
                                                <div
                                                    className={`absolute right-0 w-48 bg-white rounded-xl shadow-floating border border-gray-200/80 py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100 ${
                                                        index >= filteredPipelines.length - 2 ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                                                    }`}
                                                >
                                                    <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                                                        Pipeline Actions
                                                    </div>

                                                    {/* Action 1: Test Ping */}
                                                    <button
                                                        disabled={pingingId === pipe.id}
                                                        onClick={() => {
                                                            setActiveMenuId(null);
                                                            handleTestPing(pipe);
                                                        }}
                                                        className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2.5 transition-colors disabled:opacity-50"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        <span>{pingingId === pipe.id ? 'Pinging...' : 'Test Ping'}</span>
                                                    </button>

                                                    {/* Action 2: Copy Endpoint URL */}
                                                    <button
                                                        onClick={() => {
                                                            setActiveMenuId(null);
                                                            if (typeof navigator !== 'undefined') {
                                                                navigator.clipboard.writeText(`https://${pipe.endpoint}`);
                                                                showActionToast(`Copied endpoint for ${pipe.name}`);
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2.5 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>Copy Endpoint URL</span>
                                                    </button>

                                                    {/* Action 3: Inspect Config */}
                                                    <button
                                                        onClick={() => {
                                                            setActiveMenuId(null);
                                                            showActionToast(`Pipeline ${pipe.name} configuration inspector loaded.`);
                                                        }}
                                                        className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2.5 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span>Inspect Config</span>
                                                    </button>

                                                    <div className="my-1 border-t border-gray-100"></div>

                                                    {/* Action 4: Verify SHA-256 */}
                                                    <button
                                                        onClick={() => {
                                                            setActiveMenuId(null);
                                                            showActionToast(`Cryptographic audit verified for ${pipe.name}`);
                                                        }}
                                                        className="w-full px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-black flex items-center gap-2.5 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                        <span>Verify SHA-256</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Section 4: Integration Quick-Start cURL Terminal Box */}
            <section className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card space-y-3" data-purpose="curl-quickstart">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Quick Ingestion Webhook cURL</h3>
                    </div>
                    <button
                        onClick={handleCopyCurl}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-[11px] font-medium transition-colors"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Copy cURL</span>
                    </button>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 text-gray-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-zinc-800">
                    <span className="text-emerald-400">curl</span> -X POST https://api.metrica.io/v1/telemetry/events \<br />
                    &nbsp;&nbsp;-H <span className="text-amber-300">&quot;Authorization: Bearer mtr_live_98b8c7e9a2&quot;</span> \<br />
                    &nbsp;&nbsp;-H <span className="text-amber-300">&quot;Content-Type: application/json&quot;</span> \<br />
                    &nbsp;&nbsp;-d <span className="text-sky-300">&apos;&#123;&quot;event&quot;:&quot;mrr.checkpoint&quot;,&quot;amount&quot;:18500,&quot;currency&quot;:&quot;USD&quot;&#125;&apos;</span>
                </div>
            </section>
        </div>
    );
}
