"use client";

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';

export default function SettingsPage() {
    const { showActionToast } = useDashboard();
    const [activeTab, setActiveTab] = useState<'profile' | 'thresholds' | 'notifications' | 'security'>('profile');

    // Profile state
    const [profile, setProfile] = useState({
        name: 'Aris Vance',
        title: 'Lead Investor & General Partner',
        firm: 'Metrica Syndicate Fund IV',
        email: 'aris.vance@metrica.io',
        currency: 'USD ($)',
        timezone: 'America/Los_Angeles (Pacific Time)',
        dateFormat: 'MM/DD/YYYY'
    });

    // Thresholds state
    const [thresholds, setThresholds] = useState({
        runwayMonths: 6.0,
        burnMultiple: 2.0,
        boardNoticeHours: 72,
        quorumPercent: 67
    });

    // Notification toggles state
    const [notifications, setNotifications] = useState({
        boardReminders: true,
        runwayAlerts: true,
        pipelineDegradation: true,
        aiScreeningDigest: true,
        capTableDilution: false
    });

    const handleSave = () => {
        showActionToast('System preferences saved successfully.');
    };

    const handleCopyToken = () => {
        if (typeof navigator !== 'undefined') {
            navigator.clipboard.writeText('mtr_live_98b8c7e9a2f4c18090ae2');
            showActionToast('API token copied to clipboard.');
        }
    };

    const tabs = [
        { id: 'profile', label: 'General Profile' },
        { id: 'thresholds', label: 'Governance Thresholds' },
        { id: 'notifications', label: 'Notification Dispatch' },
        { id: 'security', label: 'Security & API Keys' },
    ] as const;

    return (
        <div className="flex flex-col gap-6 pb-10">
            {/* Section 1: Page Header */}
            <section className="flex flex-wrap items-center justify-between gap-4" data-purpose="settings-header">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
                    <p className="text-xs text-gray-500 mt-1">Configure investor credentials, governance thresholds, notification dispatch, and security keys</p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => showActionToast('Settings restored to fund defaults.')}
                        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-gray-200/80 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors shadow-xs"
                    >
                        <span>Reset Defaults</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#1e2329] text-white text-xs font-medium hover:bg-black transition-colors shadow-sm"
                    >
                        <span>Save Changes</span>
                    </button>
                </div>
            </section>

            {/* Section 2: Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-gray-50 border border-gray-200/60 rounded-xl text-xs w-fit">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                                isActive
                                    ? 'bg-black text-white shadow-xs font-semibold'
                                    : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                            }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Section 3: Tab Content Area */}
            {/* Tab 1: General Profile */}
            {activeTab === 'profile' && (
                <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-6" data-purpose="profile-settings">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Investor Identity &amp; Fund Profile</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Primary credentials used across board resolutions, dossiers, and audit ledgers</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-gray-100">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Executive Title &amp; Role</label>
                            <input
                                type="text"
                                value={profile.title}
                                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Venture Entity / Fund</label>
                            <input
                                type="text"
                                value={profile.firm}
                                onChange={(e) => setProfile({ ...profile, firm: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black bg-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Official Work Email</label>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black bg-white"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-900 mb-1">Regional &amp; Reporting Standards</h2>
                        <p className="text-xs text-gray-500 mb-4">Currency and timezone defaults applied to all portfolio benchmarking charts</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Reporting Currency</label>
                                <select
                                    value={profile.currency}
                                    onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black bg-white"
                                >
                                    <option>USD ($)</option>
                                    <option>EUR (€)</option>
                                    <option>GBP (£)</option>
                                    <option>SGD (S$)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Default Timezone</label>
                                <select
                                    value={profile.timezone}
                                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black bg-white"
                                >
                                    <option>America/Los_Angeles (Pacific Time)</option>
                                    <option>America/New_York (Eastern Time)</option>
                                    <option>Europe/London (GMT)</option>
                                    <option>Asia/Singapore (SGT)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Date Display Format</label>
                                <select
                                    value={profile.dateFormat}
                                    onChange={(e) => setProfile({ ...profile, dateFormat: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-black bg-white"
                                >
                                    <option>MM/DD/YYYY (US Standard)</option>
                                    <option>DD/MM/YYYY (International)</option>
                                    <option>YYYY-MM-DD (ISO)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Tab 2: Governance Thresholds */}
            {activeTab === 'thresholds' && (
                <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-6" data-purpose="thresholds-settings">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Governance &amp; Venture Risk Triggers</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Automated warning thresholds applied across all portfolio companies</p>
                    </div>

                    <div className="divide-y divide-gray-100 pt-2 border-t border-gray-100">
                        {/* Threshold 1 */}
                        <div className="py-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="max-w-md">
                                <div className="text-xs font-semibold text-gray-900">Critical Cash Runway Warning</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    Flag a venture when cash reserves drop below this monthly threshold.
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="3"
                                    max="12"
                                    step="0.5"
                                    value={thresholds.runwayMonths}
                                    onChange={(e) => setThresholds({ ...thresholds, runwayMonths: parseFloat(e.target.value) })}
                                    className="w-32 accent-black cursor-pointer"
                                />
                                <span className="font-mono text-xs font-semibold text-gray-900 w-16 text-right">
                                    {thresholds.runwayMonths.toFixed(1)} mos
                                </span>
                            </div>
                        </div>

                        {/* Threshold 2 */}
                        <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="max-w-md">
                                <div className="text-xs font-semibold text-gray-900">Burn Multiple Upper Ceiling</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    Triggers advisory notice when net burn exceeds multiple of net new ARR.
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="1.0"
                                    max="3.5"
                                    step="0.1"
                                    value={thresholds.burnMultiple}
                                    onChange={(e) => setThresholds({ ...thresholds, burnMultiple: parseFloat(e.target.value) })}
                                    className="w-32 accent-black cursor-pointer"
                                />
                                <span className="font-mono text-xs font-semibold text-gray-900 w-16 text-right">
                                    {thresholds.burnMultiple.toFixed(1)}x
                                </span>
                            </div>
                        </div>

                        {/* Threshold 3 */}
                        <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="max-w-md">
                                <div className="text-xs font-semibold text-gray-900">Board Pack Advance Delivery</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    Hours prior to convening when board packets must be certified and distributed.
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="24"
                                    max="120"
                                    step="12"
                                    value={thresholds.boardNoticeHours}
                                    onChange={(e) => setThresholds({ ...thresholds, boardNoticeHours: parseInt(e.target.value) })}
                                    className="w-32 accent-black cursor-pointer"
                                />
                                <span className="font-mono text-xs font-semibold text-gray-900 w-16 text-right">
                                    {thresholds.boardNoticeHours} hrs
                                </span>
                            </div>
                        </div>

                        {/* Threshold 4 */}
                        <div className="py-4 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="max-w-md">
                                <div className="text-xs font-semibold text-gray-900">Statutory Quorum Minimum</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    Required percentage of voting equity signatures to certify formal board resolutions.
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="51"
                                    max="80"
                                    step="1"
                                    value={thresholds.quorumPercent}
                                    onChange={(e) => setThresholds({ ...thresholds, quorumPercent: parseInt(e.target.value) })}
                                    className="w-32 accent-black cursor-pointer"
                                />
                                <span className="font-mono text-xs font-semibold text-gray-900 w-16 text-right">
                                    {thresholds.quorumPercent}%
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Tab 3: Notification Dispatch */}
            {activeTab === 'notifications' && (
                <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-6" data-purpose="notifications-settings">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Notification &amp; Alert Dispatch</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Real-time alerts sent to your email and authenticated devices</p>
                    </div>

                    <div className="divide-y divide-gray-100 pt-2 border-t border-gray-100">
                        {/* Notice 1 */}
                        <div className="py-4 first:pt-0 flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold text-gray-900">Board Pack Delivery &amp; Quorum Reminders</div>
                                <div className="text-xs text-gray-500 mt-0.5">Dispatched 72 hours before formal session convening</div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, boardReminders: !notifications.boardReminders })}
                                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                                    notifications.boardReminders ? 'bg-black' : 'bg-gray-200'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.boardReminders ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Notice 2 */}
                        <div className="py-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold text-gray-900">Critical Cash Runway Warnings</div>
                                <div className="text-xs text-gray-500 mt-0.5">Immediate push notification when any portfolio runway drops below 6 months</div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, runwayAlerts: !notifications.runwayAlerts })}
                                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                                    notifications.runwayAlerts ? 'bg-black' : 'bg-gray-200'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.runwayAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Notice 3 */}
                        <div className="py-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold text-gray-900">Telemetry Ingestion &amp; Pipeline Latency</div>
                                <div className="text-xs text-gray-500 mt-0.5">Alerts when webhook ingestion fails or latency exceeds 100ms P99</div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, pipelineDegradation: !notifications.pipelineDegradation })}
                                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                                    notifications.pipelineDegradation ? 'bg-black' : 'bg-gray-200'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.pipelineDegradation ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Notice 4 */}
                        <div className="py-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold text-gray-900">AI Diligence Screening Digests</div>
                                <div className="text-xs text-gray-500 mt-0.5">Summary memo sent when automated diligence scoring finishes</div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, aiScreeningDigest: !notifications.aiScreeningDigest })}
                                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                                    notifications.aiScreeningDigest ? 'bg-black' : 'bg-gray-200'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.aiScreeningDigest ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Notice 5 */}
                        <div className="py-4 last:pb-0 flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold text-gray-900">Cap Table Dilution &amp; Option Pool Simulation</div>
                                <div className="text-xs text-gray-500 mt-0.5">Notifies whenever round modeling alters ownership percentages</div>
                            </div>
                            <button
                                onClick={() => setNotifications({ ...notifications, capTableDilution: !notifications.capTableDilution })}
                                className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                                    notifications.capTableDilution ? 'bg-black' : 'bg-gray-200'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications.capTableDilution ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Tab 4: Security & API Keys */}
            {activeTab === 'security' && (
                <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card space-y-6" data-purpose="security-settings">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Cryptographic Security &amp; Access Control</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Multi-factor credentials and personal API keys for enterprise pipeline telemetry</p>
                    </div>

                    {/* 2FA Status */}
                    <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-semibold text-gray-900">Two-Factor Authentication (2FA)</div>
                            <div className="text-xs text-gray-500 mt-0.5">Hardware Security Key (FIDO2 / YubiKey)</div>
                            <div className="text-xs font-semibold text-emerald-600 mt-1">Active &amp; Enforced</div>
                        </div>
                        <button
                            onClick={() => showActionToast('Security key credentials verified.')}
                            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                        >
                            Manage Security Keys
                        </button>
                    </div>

                    {/* Active API Token */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-xs font-semibold text-gray-900">Personal Access Tokens</div>
                                <div className="text-xs text-gray-500 mt-0.5">Used for cURL telemetry ingestion and ledger verification</div>
                            </div>
                            <button
                                onClick={() => showActionToast('New API access token provisioned: mtr_live_•••••••')}
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-black transition-colors"
                            >
                                Generate New Key
                            </button>
                        </div>

                        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <div className="font-mono text-xs font-semibold text-gray-900">Production Telemetry Ingestion Key</div>
                                    <div className="font-mono text-[11px] text-gray-500 mt-0.5">mtr_live_98b8c7e9a2f4c18090ae2••••••••</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopyToken}
                                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                                    >
                                        Copy Token
                                    </button>
                                    <button
                                        onClick={() => showActionToast('Token permissions updated.')}
                                        className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                                    >
                                        Rotate
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-200/60 font-mono">
                                <span>Created: Oct 14, 2025</span>
                                <span>Last Active: 2 mins ago</span>
                                <span>Scope: Ingestion &amp; Audit Write</span>
                            </div>
                        </div>
                    </div>

                    {/* Audit & Compliance Standards */}
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-xs font-semibold text-gray-900">Cryptographic Ledger Retention Standard</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                Immutable SHA-256 event chaining compliant with standard SEC 7-year audit retention mandates.
                            </div>
                            <div className="text-xs font-semibold text-gray-900 mt-1">7 Years Statutory VC Compliance</div>
                        </div>
                        <button
                            onClick={() => showActionToast('Ledger audit certificate generated (SHA-256 verified).')}
                            className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
                        >
                            Verify Ledger Chain
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}
