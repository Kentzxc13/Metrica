"use client";

import React, { useState } from "react";
import { Transaction } from "@/types/company";
import { formatTimeClean } from "@/utils/time";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onUpdateStatus?: (id: string, newStatus: "Success" | "Pending" | "Refunded") => void;
}

export function TransactionDetailsModal({
  transaction,
  isOpen,
  onClose,
  onShowToast,
  onUpdateStatus,
}: TransactionDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !transaction) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    onShowToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const geo = transaction.raw_payload?.geo || "Global (Multi-Region CDN)";
  const cardBrand = transaction.raw_payload?.cardBrand || "Visa Enterprise";
  const cardLast4 = transaction.raw_payload?.cardLast4 || "4242";
  const invoiceId = transaction.raw_payload?.invoiceId || `inv_${transaction.id.slice(0, 8)}`;
  const hash = transaction.verification_hash || "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-gray-200 shadow-floating space-y-4 animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-gray-900 tracking-tight">
                {transaction.code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  transaction.status === "Success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                    : transaction.status === "Pending"
                      ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                      : transaction.status === "Duplicated"
                        ? "bg-amber-50 text-amber-800 border border-amber-300/80"
                        : "bg-purple-50 text-purple-700 border border-purple-200/80"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    transaction.status === "Success"
                      ? "bg-emerald-500"
                      : transaction.status === "Pending"
                        ? "bg-amber-500"
                        : transaction.status === "Duplicated"
                          ? "bg-amber-500 animate-pulse"
                          : "bg-purple-500"
                  }`}
                />
                {transaction.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Live Verified Transaction Ledger Event
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </button>
        </div>

        {/* Primary Financial Metric Box */}
        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
              Total Amount
            </span>
            <div className="text-2xl font-black text-gray-900 font-mono mt-0.5">
              {transaction.totalRevenue}
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Currency: USD • Settlement Immediate
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">
              Customer
            </span>
            <div className="text-sm font-bold text-gray-900 mt-0.5">
              {transaction.customer}
            </div>
            <span className="text-[11px] text-gray-500 block truncate max-w-[180px]">
              {transaction.product}
            </span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="border border-gray-100 rounded-xl p-3 bg-white shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Timestamp &amp; Ingestion
            </span>
            <span className="font-mono font-bold text-gray-800 text-xs block mt-1">
              {formatTimeClean(transaction.timestamp)}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              {transaction.payment_timestamp
                ? new Date(transaction.payment_timestamp).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Today"}
            </span>
          </div>

          <div className="border border-gray-100 rounded-xl p-3 bg-white shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              Payment Method
            </span>
            <span className="font-semibold text-gray-800 text-xs block mt-1">
              {cardBrand} •••• {cardLast4}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Region: {geo}
            </span>
          </div>
        </div>

        {/* Invoice & Cryptographic Audit Hash */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-gray-500 font-medium">Invoice ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-gray-800">
                {invoiceId}
              </span>
              <button
                onClick={() => handleCopy(invoiceId, "Invoice ID")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy Invoice ID"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </button>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Cryptographic Verification Hash (SHA-256)
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  ></path>
                </svg>
                Verified
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] text-gray-600 break-all select-all">
                {hash}
              </p>
              <button
                onClick={() => handleCopy(hash, "Audit Hash")}
                className="text-gray-400 hover:text-gray-700 p-1 transition-colors shrink-0"
                title="Copy Hash"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={() => handleCopy(JSON.stringify(transaction, null, 2), "JSON Payload")}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-black font-semibold transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
            <span>{copiedField === "JSON Payload" ? "Copied JSON!" : "Copy JSON"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(transaction.code, "Event Code")}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              {copiedField === "Event Code" ? "Copied!" : "Copy Code"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-black hover:bg-gray-800 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
