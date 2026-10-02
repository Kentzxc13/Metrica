"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useDashboard } from '@/context/DashboardContext';

export default function HelpPage() {
    const { showActionToast } = useDashboard();
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleCopyCurl = () => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(
                `curl -X POST https://api.metrica.io/v1/telemetry/test-ping \\\n  -H "Authorization: Bearer mtr_live_test_sample" \\\n  -H "X-Metrica-Signature: sha256=e3b0c44298fc1c149afbf4c8996fb924" \\\n  -H "Content-Type: application/json" \\\n  -d '{"event":"audit.ping","timestamp":1788964000,"status":"ok"}'`
            );
            showActionToast('Test cURL command copied to clipboard');
        }
    };

    const faqs = [
        {
            question: "How is the Magic Number calculated and what does it indicate?",
            answer: "The SaaS Magic Number evaluates go-to-market efficiency. It is computed as: (Quarterly Net New ARR × 4) ÷ (Prior Quarter Sales & Marketing Expense). A Magic Number above 1.0x indicates an efficient growth engine ready for aggressive capital scaling, while anything below 0.75x suggests operational friction."
        },
        {
            question: "How does Metrica calculate Cash Runway and trigger alerts?",
            answer: "Cash Runway is computed as Total Available Cash Reserves divided by Trailing 3-Month Average Net Cash Burn. If a portfolio company's runway falls below the configured 6.0-month threshold, Metrica automatically flags the company with a High Priority governance notice for lead investors."
        },
        {
            question: "How does the Cryptographic Audit Verification work?",
            answer: "Every board vote, cap table transaction, and telemetry payload is sealed with a SHA-256 cryptographic hash. The resulting hashes form a linear event chain, ensuring all recorded portfolio decisions and financial updates are immutable and verifiable for LP audit compliance."
        },
        {
            question: "What constitutes a certified Board Quorum?",
            answer: "A board action is certified as legally binding once a minimum of 67% of registered voting equity directors cast their electronic signature on the active session dossier. Incomplete quorums trigger automated dispatch reminders 72 hours before session gavel."
        }
    ];

    const shortcuts = [
        { key: "⌘ K", description: "Open Global Command Search across ventures and metrics" },
        { key: "G then D", description: "Quick jump to Portfolio Executive Dashboard" },
        { key: "G then G", description: "Quick jump to Board Governance & Cadence" },
        { key: "G then P", description: "Quick jump to Data Pipelines & APIs" },
        { key: "Esc", description: "Dismiss active modals, menus, or dropdowns" },
    ];

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Section 1: Page Header */}
            <section className="flex flex-wrap items-center justify-between gap-4" data-purpose="help-header">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Help &amp; Test Guide</h1>
                    <p className="text-xs text-gray-500 mt-1">Platform documentation, test procedures, and venture governance methodology</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => showActionToast('Concierge support ticket initiated for Aris Vance.')}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-black hover:bg-gray-50 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Contact Support</span>
                    </button>
                    <button
                        onClick={() => showActionToast('Documentation export generated (PDF).')}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm cursor-pointer"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Export Docs</span>
                    </button>
                </div>
            </section>

            {/* Section 2: Core Platform Feature Guides */}
            <section data-purpose="core-guides">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-900">Platform Walkthroughs</span>
                    <span className="text-[11px] font-mono text-gray-400">4 modules</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Module 1 */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card flex flex-col justify-between hover:border-gray-300 transition-colors">
                        <div>
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-semibold mb-3">
                                01
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">Portfolio Health</h2>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Continuous tracking of ARR, Net Retention (NRR), and Cash Runway directly from connected ERP and billing streams.
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Benchmark</div>
                                <div className="text-xs font-mono text-gray-800 font-medium mt-0.5">Rule of 40 ≥ 40% Target</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-2">
                            <Link href="/" className="text-xs font-semibold text-gray-900 hover:text-black flex items-center gap-1 group">
                                <span>Open Dashboard</span>
                                <span className="transition-transform group-hover:translate-x-0.5">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Module 2 */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card flex flex-col justify-between hover:border-gray-300 transition-colors">
                        <div>
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-semibold mb-3">
                                02
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">AI Screening</h2>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Automated diligence memos, risk thesis synthesis, and scoring across unit economics, TAM, and cohort retention.
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Scoring Model</div>
                                <div className="text-xs font-mono text-gray-800 font-medium mt-0.5">0-100 Diligence Score</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-2">
                            <Link href="/ai-screening" className="text-xs font-semibold text-gray-900 hover:text-black flex items-center gap-1 group">
                                <span>Review AI Screening</span>
                                <span className="transition-transform group-hover:translate-x-0.5">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Module 3 */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card flex flex-col justify-between hover:border-gray-300 transition-colors">
                        <div>
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-semibold mb-3">
                                03
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">Board Governance</h2>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Board pack dissemination, statutory quorum verification, director inquiries, and commitment tracking.
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Quorum Mandate</div>
                                <div className="text-xs font-mono text-gray-800 font-medium mt-0.5">≥ 67% Voting Equity</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-2">
                            <Link href="/governance" className="text-xs font-semibold text-gray-900 hover:text-black flex items-center gap-1 group">
                                <span>View Governance</span>
                                <span className="transition-transform group-hover:translate-x-0.5">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Module 4 */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-card flex flex-col justify-between hover:border-gray-300 transition-colors">
                        <div>
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-mono text-xs font-semibold mb-3">
                                04
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">Data Pipelines</h2>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Real-time ingestion pipelines for Stripe, SOC2, and Kafka with SHA-256 signatures for tamper-proof audit trails.
                            </p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Performance SLA</div>
                                <div className="text-xs font-mono text-gray-800 font-medium mt-0.5">P99 Latency &lt; 50ms</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-2">
                            <Link href="/integrations" className="text-xs font-semibold text-gray-900 hover:text-black flex items-center gap-1 group">
                                <span>Check Pipelines</span>
                                <span className="transition-transform group-hover:translate-x-0.5">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Webhook & Ingestion Test Guide */}
            <section className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card" data-purpose="test-guide-card">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">API &amp; Webhook Test Verification Guide</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Standard testing procedure for ingesting verified financial events into Metrica</p>
                    </div>
                    <button
                        onClick={handleCopyCurl}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                    >
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </svg>
                        <span>Copy Test cURL</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-start">
                    {/* Verification Checklist */}
                    <div className="lg:col-span-5 space-y-3">
                        <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                            <div className="text-xs font-semibold text-gray-900">Step 1: Header Authentication</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Include your Bearer token and HMAC-SHA256 signature in the request headers (<span className="font-mono text-gray-700">X-Metrica-Signature</span>).
                            </p>
                        </div>
                        <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                            <div className="text-xs font-semibold text-gray-900">Step 2: Dispatch Test Payload</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Send a POST request to <span className="font-mono text-gray-700">/v1/telemetry/test-ping</span>. The ingestion edge accepts JSON payloads up to 2MB.
                            </p>
                        </div>
                        <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                            <div className="text-xs font-semibold text-gray-900">Step 3: Verify ACK &amp; Hash Receipt</div>
                            <p className="text-xs text-gray-500 mt-1">
                                Expect an HTTP 200 OK with the cryptographic event hash. The verified record immediately appears in the Event Ledger.
                            </p>
                        </div>
                    </div>

                    {/* Terminal Block */}
                    <div className="lg:col-span-7 bg-[#0f1115] text-gray-300 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner border border-zinc-800">
                        <div className="flex items-center justify-between text-zinc-500 pb-2 mb-2 border-b border-zinc-800 text-[11px]">
                            <span>bash — curl verification request</span>
                            <span className="text-zinc-600">HTTPS POST</span>
                        </div>
                        <pre className="text-zinc-200 leading-relaxed font-mono whitespace-pre-wrap">
                            <span className="text-emerald-400">curl</span> -X POST https://api.metrica.io/v1/telemetry/test-ping \{'\n'}
                            {'  '}-H <span className="text-amber-300">&quot;Authorization: Bearer mtr_live_test_sample&quot;</span> \{'\n'}
                            {'  '}-H <span className="text-amber-300">&quot;X-Metrica-Signature: sha256=e3b0c44298fc1c149afbf4c8996fb924&quot;</span> \{'\n'}
                            {'  '}-H <span className="text-amber-300">&quot;Content-Type: application/json&quot;</span> \{'\n'}
                            {'  '}-d <span className="text-cyan-300">&#39;{`{"event":"audit.ping","timestamp":1788964000,"status":"ok"}`}&#39;</span>
                        </pre>
                    </div>
                </div>
            </section>

            {/* Section 4: Methodology & FAQs */}
            <section className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card" data-purpose="methodology-faqs">
                <div className="mb-4">
                    <h2 className="text-sm font-semibold text-gray-900">Venture Methodology &amp; Computation Guide</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Reference documentation for metrics, formulas, and statutory governance rules</p>
                </div>

                <div className="divide-y divide-gray-100">
                    {faqs.map((faq, idx) => {
                        const isOpen = openFaq === idx;
                        return (
                            <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full flex items-center justify-between gap-4 text-left group"
                                >
                                    <span className="text-xs font-semibold text-gray-900 group-hover:text-black">
                                        {faq.question}
                                    </span>
                                    <span className="text-gray-400 font-mono text-sm">
                                        {isOpen ? '−' : '+'}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="mt-2 text-xs text-gray-600 leading-relaxed pr-6">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Section 5: Keyboard Shortcuts & Support Desk */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5" data-purpose="shortcuts-and-support">
                {/* Hotkeys */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900">Platform Keyboard Shortcuts</h2>
                        <span className="text-[11px] font-mono text-gray-400">Quick Navigation</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {shortcuts.map((item, i) => (
                            <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                                <span className="text-xs text-gray-600">{item.description}</span>
                                <kbd className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-[11px] font-mono font-semibold text-gray-700 shrink-0">
                                    {item.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Priority Support Desk */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-900">Priority Support Desk</span>
                            <span className="text-[11px] font-mono text-gray-500">24/7 Concierge</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            Direct line to the dedicated Metrica Venture Partner response desk for fund setup and compliance audits.
                        </p>

                        <div className="mt-4 space-y-2 text-xs">
                            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                                <span className="text-gray-500">Assigned Account Tier</span>
                                <span className="font-semibold text-gray-900">General Partner (GP)</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                                <span className="text-gray-500">Response SLA</span>
                                <span className="font-semibold text-gray-900">Under 15 minutes</span>
                            </div>
                            <div className="flex items-center justify-between py-1.5">
                                <span className="text-gray-500">Direct Contact</span>
                                <span className="font-mono text-gray-900">concierge@metrica.io</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100">
                        <button
                            onClick={() => showActionToast('Priority support inquiry submitted. An analyst will contact you shortly.')}
                            className="w-full py-2 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-black transition-colors"
                        >
                            Open Concierge Ticket
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
