"use client";

import React, { useEffect, useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { INITIAL_BOARD_MEETINGS } from '@/data/governance';
import { BoardMeeting } from '@/types/governance';

export default function BoardGovernancePage() {
    const { globalSearchQuery, showActionToast } = useDashboard();
    const [boardMeetings, setBoardMeetings] =
        useState<BoardMeeting[]>(INITIAL_BOARD_MEETINGS);

    const [isLoadingCommitments, setIsLoadingCommitments] = useState(true);
    const [selectedMeetingId, setSelectedMeetingId] = useState<string>('bm-2');

    useEffect(() => {
        const loadGovernanceCommitments = async () => {
            try {
                setIsLoadingCommitments(true);

                const response = await fetch('/api/governance');

                if (!response.ok) {
                    throw new Error('Failed to load governance commitments');
                }

                const data = await response.json();
                const commitments = data.commitments || [];

                setBoardMeetings((currentMeetings) =>
                    currentMeetings.map((meeting) => {
                        const liveCommitments = commitments.filter(
                            (commitment: any) =>
                                commitment.meetingId === meeting.id
                        );

                        const existingCommitments =
                            meeting.priorCommitments || [];

                        const updatedCommitments =
                            existingCommitments.map((staticCommitment) => {
                                const liveCommitment = liveCommitments.find(
                                    (commitment: any) =>
                                        commitment.title ===
                                        staticCommitment.title
                                );

                                if (!liveCommitment) {
                                    return staticCommitment;
                                }

                                return {
                                    ...staticCommitment,
                                    id: liveCommitment.id,
                                    status: liveCommitment.status,
                                    owner: liveCommitment.owner,
                                    targetDeadline:
                                        liveCommitment.targetDeadline,
                                    resolutionNote:
                                        liveCommitment.resolutionNote,
                                };
                            });

                        const existingTitles = new Set(
                            existingCommitments.map(
                                (commitment) => commitment.title
                            )
                        );

                        const newLiveCommitments = liveCommitments
                            .filter(
                                (commitment: any) =>
                                    !existingTitles.has(commitment.title)
                            )
                            .map((commitment: any) => ({
                                id: commitment.id,
                                title: commitment.title,
                                status: commitment.status,
                                owner: commitment.owner,
                                targetDeadline:
                                    commitment.targetDeadline,
                                resolutionNote:
                                    commitment.resolutionNote,
                            }));

                        return {
                            ...meeting,
                            priorCommitments: [
                                ...updatedCommitments,
                                ...newLiveCommitments,
                            ],
                        };
                    })
                );
            } catch (error) {
                console.error(
                    'Failed to load governance commitments:',
                    error
                );
            } finally {
                setIsLoadingCommitments(false);
            }
        };

        loadGovernanceCommitments();
    }, []);

    const filteredBoardMeetings = boardMeetings.filter(m =>
        m.companyName.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        m.ticker.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        m.sector.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
        m.agendaTopic.toLowerCase().includes(globalSearchQuery.toLowerCase())
    );

    const selectedMeeting = boardMeetings.find(m => m.id === selectedMeetingId) || boardMeetings[0];

    // STEP 91B — Live commitment delivery calculation
    const selectedMeetingCommitments =
        selectedMeeting?.priorCommitments || [];

    const completedCommitments = selectedMeetingCommitments.filter(
        (commitment) => commitment.status === 'completed'
    ).length;

    const totalCommitments = selectedMeetingCommitments.length;

    const commitmentDeliveryRate =
        totalCommitments > 0
            ? Math.round(
                  (completedCommitments / totalCommitments) * 100
              )
            : 0;

    return (
        <div className="flex flex-col gap-5 pb-8">
            {/* Section 1: Page Heading */}
            <section data-purpose="governance-header-controls">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Board Governance &amp; Cadence</h1>
                <p className="text-xs text-gray-500 mt-1">Quarterly board meetings, management commitments &amp; institutional governance pack</p>
            </section>

            {/* Section 2: Quarterly Meeting Cadence Schedule Timeline Strip (Master Selector) */}
            <section className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-card space-y-3.5" data-purpose="governance-timeline-strip">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 tracking-tight">Quarterly Meeting Cadence Schedule</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Select a session milestone to inspect company dossier and management commitments</p>
                    </div>
                    <span className="text-xs font-mono font-medium text-gray-500 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg">Q4 2025 - Q1 2026</span>
                </div>

                {/* 5 Milestone Session Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                    {boardMeetings.map((bm, index) => {
                        const isSelected = selectedMeetingId === bm.id;
                        const isAllDelivered = bm.deliveryRate?.includes('100%');
                        return (
                            <div
                                key={bm.id}
                                onClick={() => setSelectedMeetingId(bm.id)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[156px] ${isSelected
                                    ? 'bg-white border-zinc-900 shadow-sm ring-1 ring-zinc-900/10'
                                    : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs'
                                    }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${isSelected ? 'bg-zinc-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            Session 0{index + 1}
                                        </span>
                                        <div className="w-8 h-8 rounded-xl bg-black text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                                            {bm.initials}
                                        </div>
                                    </div>
                                    <div className="mt-2.5">
                                        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                                            {bm.companyName}
                                        </h3>
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                                        {bm.nextMeetingDate.split('•')[0].trim()}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-600 leading-relaxed line-clamp-2">
                                        {bm.agendaTopic}
                                    </p>
                                </div>

                                {isSelected ? (
                                    <div className="mt-3 pt-2.5 border-t border-gray-200/80 flex items-center justify-between">
                                        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-900">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span>Active Session</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                                        <span className="font-medium">{isAllDelivered ? 'All Delivered' : 'Scheduled'}</span>
                                        {isAllDelivered && (
                                            <span className="text-emerald-600 font-bold text-xs">✓</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Section 3: Split Executive Cockpit (Connected Master-Detail) */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch" data-purpose="governance-cockpit-view">
                {/* Left Column (7 cols): Selected Session Dossier & Pre-Meeting Pack */}
                <div className="lg:col-span-7 flex flex-col">
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-4 h-full flex flex-col justify-between">
                        {/* Dossier Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-black text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                                    {selectedMeeting.initials}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-base font-bold text-gray-900 tracking-tight">{selectedMeeting.companyName}</h2>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                                            {selectedMeeting.ticker}
                                        </span>
                                        <span className="text-xs font-medium text-gray-500">
                                            • {selectedMeeting.boardRole === 'Board Director' ? 'Director Seat' : 'Observer Seat'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-400 mt-0.5">{selectedMeeting.sector}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-medium text-gray-800 bg-gray-50 border border-gray-200/80 px-2.5 py-1 rounded-lg">
                                    {selectedMeeting.nextMeetingDate.split('•')[0].trim()}
                                </span>
                                <button
                                    onClick={() => showActionToast(`Added ${selectedMeeting.companyName} session to calendar (.ics)`)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                    title="Add to Calendar"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Dossier Body: Expanded Agenda Block + Pre-Meeting Pack */}
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                            {/* Formal Session Agenda Block */}
                            <div className="p-4 rounded-xl bg-gray-50/90 border border-gray-200/80 space-y-3">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">PRIMARY SESSION AGENDA</span>
                                        <span className="text-xs font-mono font-medium text-gray-600 bg-white border border-gray-200/80 px-2 py-0.5 rounded-md">
                                            {selectedMeeting.quorum}
                                        </span>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900 leading-snug">
                                        {selectedMeeting.agendaTopic}
                                    </div>
                                </div>

                                {/* Structured Agenda Items Rows */}
                                <div className="space-y-2 pt-2.5 border-t border-gray-200/70">
                                    {selectedMeeting.agendaItems?.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2.5 px-3 rounded-lg bg-white border border-gray-200/70 shadow-2xs">
                                            <span className="w-5 h-5 rounded-full bg-zinc-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-medium text-gray-800 leading-normal truncate">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pre-Meeting Governance & Readiness Pack */}
                            <div className="p-4 rounded-xl bg-white border border-gray-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider">PRE-MEETING READINESS CHECKLIST</span>
                                    <span className="text-xs font-mono text-gray-400">Board Pack v2.4</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 text-xs">
                                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Board Materials</div>
                                            <div className="font-bold text-gray-900 text-xs mt-0.5">{selectedMeeting.preMeetingChecklist?.deckStatus || selectedMeeting.materialsStatus}</div>
                                        </div>
                                        <button
                                            onClick={() => showActionToast(`Board materials deck loaded for ${selectedMeeting.companyName}.`)}
                                            className="px-2.5 py-1 rounded-md bg-white border border-gray-200 hover:border-gray-300 text-xs font-medium text-gray-700 shadow-2xs transition-colors"
                                        >
                                            Preview
                                        </button>
                                    </div>

                                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Financial Model</div>
                                            <div className="font-bold text-gray-900 text-xs mt-0.5">{selectedMeeting.preMeetingChecklist?.financialsStatus || 'Verified'}</div>
                                        </div>
                                        <span className="text-emerald-600 font-bold text-xs">✓</span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Attendance Quorum</div>
                                            <div className="font-bold text-gray-900 text-xs mt-0.5">{selectedMeeting.preMeetingChecklist?.quorumStatus || selectedMeeting.quorum}</div>
                                        </div>
                                        <span className="text-gray-500 font-medium text-xs">Confirmed</span>
                                    </div>

                                    <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-200/60 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Prior Commitments</div>
                                            <div className="font-bold text-gray-900 text-xs mt-0.5">
                                                {`${completedCommitments} of ${totalCommitments} Delivered (${commitmentDeliveryRate}%)`}
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-semibold text-zinc-900">→ Right Panel</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (5 cols): Prior Board Commitments Tracker & Director's Probes */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-5 h-full">
                    {/* Action Panel: Prior Board Commitments Tracker */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-zinc-900 shrink-0"></span>
                                <h3 className="text-xs uppercase font-bold tracking-wider text-gray-900 leading-none">
                                    PRIOR BOARD COMMITMENTS
                                </h3>
                            </div>
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md">
                                {`${completedCommitments} of ${totalCommitments} Delivered (${commitmentDeliveryRate}%)`}
                            </span>
                        </div>

                        {/* Deliverables List: Scrollable showing 2 commitments */}
                        <div className="space-y-2.5 my-3 max-h-[148px] overflow-y-auto pr-1.5 custom-scrollbar">
                            {selectedMeeting.priorCommitments?.map((commitment) => {
                                const isCompleted = commitment.status === 'completed';
                                const isInProgress = commitment.status === 'in_progress';

                                return (
                                    <div
                                        key={commitment.id}
                                        onClick={() => showActionToast(`Mandate status: "${commitment.title}" (${commitment.owner})`)}
                                        className="p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/70 transition-all cursor-pointer flex flex-col justify-between gap-1.5"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={`text-xs font-bold shrink-0 ${isCompleted ? 'text-emerald-600' : isInProgress ? 'text-zinc-900' : 'text-amber-600'
                                                    }`}>
                                                {isCompleted ? '✓' : isInProgress ? '●' : '⚠'}
                                                </span>
                                                <span className="text-xs font-semibold text-gray-900 truncate">
                                                    {commitment.title}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md shrink-0 ${isCompleted
                                                ? 'bg-emerald-100/70 text-emerald-800'
                                                : isInProgress
                                                    ? 'bg-zinc-200 text-zinc-800'
                                                    : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {isCompleted ? 'Completed' : isInProgress ? 'In Review' : 'Delayed'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-gray-500 pl-4">
                                            <span className="truncate">Lead: {commitment.owner}</span>
                                            <span className="font-mono text-[11px] shrink-0 text-gray-500">{commitment.targetDeadline}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer Audit Assurance */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1.5 font-medium text-gray-600">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                                </svg>
                                <span>Verified by Audit Chair</span>
                            </span>
                            <button
                                onClick={() => showActionToast(`Commitment audit ledger exported for ${selectedMeeting.companyName}.`)}
                                className="text-xs font-medium text-gray-800 hover:text-black font-semibold underline underline-offset-2"
                            >
                                View Ledger
                            </button>
                        </div>
                    </div>

                    {/* Strategic Inquiries & Director's Probes */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card flex flex-col justify-between">
                        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                                <h3 className="text-xs uppercase font-bold tracking-wider text-gray-900 leading-none">
                                    DIRECTOR&apos;S STRATEGIC PROBES
                                </h3>
                            </div>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200/80 px-2.5 py-1 rounded-md">
                                {selectedMeeting.strategicProbes?.length || 2} Inquiries Prepared
                            </span>
                        </div>

                        {/* Probes List: Scrollable showing 1 probe */}
                        <div className="space-y-2.5 my-3 max-h-[124px] overflow-y-auto pr-1.5 custom-scrollbar">
                            {selectedMeeting.strategicProbes?.map((probe, idx) => (
                                <div
                                    key={probe.id}
                                    onClick={() => showActionToast(`Flagged for discussion: "${probe.question}"`)}
                                    className="p-3.5 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200/70 transition-all cursor-pointer space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-700 bg-white border border-gray-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                                            {probe.category}
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono">
                                            Inquiry #{idx + 1}
                                        </span>
                                    </div>
                                    <div className="text-xs font-semibold text-gray-900 leading-relaxed italic">
                                        &ldquo;{probe.question}&rdquo;
                                    </div>
                                    <div className="text-[11px] text-gray-500 leading-normal">
                                        Rationale: {probe.contextHint}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer Briefing Indicator */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span className="text-xs text-gray-400 italic">Prepared for Lead Investor Aris Vance</span>
                            <button
                                onClick={() => showActionToast(`Boardroom strategic briefing copied for ${selectedMeeting.companyName}.`)}
                                className="text-xs font-medium text-gray-800 hover:text-black font-semibold underline underline-offset-2"
                            >
                                Copy Briefing
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}