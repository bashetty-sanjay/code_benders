"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  MessageCircle,
  Copy,
  Check,
  CreditCard,
  ExternalLink,
  Search,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { formatINR } from "@/lib/financial/money";

export interface ReceivableRow {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
    name: string;
    companyName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  issueDate: string;
  dueDate: string;
  expectedCollectionDate?: string | null;
  totalPaise: number;
  paidPaise: number;
  outstandingPaise: number;
  overdue: boolean;
  overdueDays: number;
}

interface WhoOwesMeProps {
  receivables: ReceivableRow[];
}

export function WhoOwesMeSection({ receivables }: WhoOwesMeProps) {
  const [filterBucket, setFilterBucket] = useState<"ALL" | "CRITICAL" | "MODERATE" | "CURRENT">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const critical = receivables.filter((r) => r.overdue && r.overdueDays >= 16);
  const moderate = receivables.filter((r) => r.overdue && r.overdueDays > 0 && r.overdueDays < 16);
  const current = receivables.filter((r) => !r.overdue);

  const totalOutstanding = receivables.reduce((sum, r) => sum + r.outstandingPaise, 0);
  const criticalPaise = critical.reduce((sum, r) => sum + r.outstandingPaise, 0);
  const moderatePaise = moderate.reduce((sum, r) => sum + r.outstandingPaise, 0);
  const currentPaise = current.reduce((sum, r) => sum + r.outstandingPaise, 0);

  const filtered = receivables.filter((r) => {
    if (filterBucket === "CRITICAL" && !(r.overdue && r.overdueDays >= 16)) return false;
    if (filterBucket === "MODERATE" && !(r.overdue && r.overdueDays > 0 && r.overdueDays < 16)) return false;
    if (filterBucket === "CURRENT" && r.overdue) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = r.customer.name.toLowerCase().includes(q);
      const matchCompany = r.customer.companyName?.toLowerCase().includes(q);
      const matchInv = r.invoiceNumber.toLowerCase().includes(q);
      return matchName || matchCompany || matchInv;
    }
    return true;
  });

  function getReminderText(r: ReceivableRow): string {
    const formatted = formatINR(r.outstandingPaise);
    if (r.overdue) {
      return `Hi ${r.customer.name}, gently reminding you regarding invoice ${r.invoiceNumber} for ${formatted}, which was due on ${r.dueDate} (${r.overdueDays} days ago). Please let us know when payment will be processed. Thanks!`;
    }
    return `Hi ${r.customer.name}, sharing a polite note that invoice ${r.invoiceNumber} for ${formatted} is due on ${r.dueDate}. Let us know if you need any info!`;
  }

  function handleCopy(id: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getWhatsAppUrl(r: ReceivableRow): string {
    const phone = r.customer.phone ? r.customer.phone.replace(/\D/g, "") : "";
    const text = encodeURIComponent(getReminderText(r));
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  }

  return (
    <section className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      {/* Section Header */}
      <div className="p-5 sm:p-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Who Owes Me, How Much, and Since When?
            </h2>
            <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Live Ageing Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time debtor ledger answering exactly who has paid, who is late, and the exact days overdue.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search debtor or invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-700 bg-[#172133] text-xs text-white placeholder-slate-400 focus:bg-[#1c283e] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Ageing Summary Metric Buckets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80 bg-[#0d131f] border-b border-slate-800">
        <button
          type="button"
          onClick={() => setFilterBucket("ALL")}
          className={`p-4 text-left transition-all ${
            filterBucket === "ALL" ? "bg-[#162032] shadow-sm ring-1 ring-slate-700" : "hover:bg-[#131c2d]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Money Owed</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              {receivables.length}
            </span>
          </div>
          <div className="text-lg font-bold text-white mt-1">{formatINR(totalOutstanding)}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">All open unpaid invoices</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterBucket("CRITICAL")}
          className={`p-4 text-left transition-all ${
            filterBucket === "CRITICAL"
              ? "bg-rose-950/40 shadow-sm ring-1 ring-rose-500/60"
              : "hover:bg-rose-950/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              16+ Days Overdue
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {critical.length}
            </span>
          </div>
          <div className="text-lg font-bold text-rose-400 mt-1">{formatINR(criticalPaise)}</div>
          <p className="text-[11px] text-rose-300/80 font-medium mt-0.5">Immediate chase required</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterBucket("MODERATE")}
          className={`p-4 text-left transition-all ${
            filterBucket === "MODERATE"
              ? "bg-amber-950/40 shadow-sm ring-1 ring-amber-500/60"
              : "hover:bg-amber-950/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              1–15 Days Overdue
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {moderate.length}
            </span>
          </div>
          <div className="text-lg font-bold text-amber-400 mt-1">{formatINR(moderatePaise)}</div>
          <p className="text-[11px] text-amber-300/80 mt-0.5">Gentle reminder window</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterBucket("CURRENT")}
          className={`p-4 text-left transition-all ${
            filterBucket === "CURRENT"
              ? "bg-emerald-950/40 shadow-sm ring-1 ring-emerald-500/60"
              : "hover:bg-emerald-950/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Not Yet Due
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {current.length}
            </span>
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{formatINR(currentPaise)}</div>
          <p className="text-[11px] text-emerald-300/80 mt-0.5">Within payment terms</p>
        </button>
      </div>

      {/* Debtor List */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-300">No debtors match the selected filter.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
            <thead className="bg-[#151e2f] text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-5 py-3">Debtor & Customer</th>
                <th className="px-4 py-3">Invoice & Total</th>
                <th className="px-4 py-3">Amount Owed</th>
                <th className="px-4 py-3">Since When? (Overdue Age)</th>
                <th className="px-5 py-3 text-right">Quick Follow-Up Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-[#111827]">
              {filtered.map((r) => {
                const isCopied = copiedId === r.id;
                const reminderText = getReminderText(r);

                return (
                  <tr key={r.id} className="hover:bg-[#162134] transition-colors group">
                    {/* Debtor Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {r.customer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{r.customer.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {r.customer.companyName || r.customer.phone || "Direct Client"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Invoice */}
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/invoices/${r.id}`}
                        className="font-mono font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <span>{r.invoiceNumber}</span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <div className="text-[11px] text-slate-400">Issued {r.issueDate}</div>
                    </td>

                    {/* Amount Owed */}
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-sm">{formatINR(r.outstandingPaise)}</div>
                      {r.paidPaise > 0 ? (
                        <div className="text-[10px] text-emerald-400">
                          {formatINR(r.paidPaise)} partially received
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">Total: {formatINR(r.totalPaise)}</div>
                      )}
                    </td>

                    {/* Since When / Ageing */}
                    <td className="px-4 py-3.5">
                      {r.overdue ? (
                        <div>
                          <span
                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[11px] ${
                              r.overdueDays >= 16
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {r.overdueDays} {r.overdueDays === 1 ? "day" : "days"} late
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Due date was <strong className="text-slate-300">{r.dueDate}</strong>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <Calendar className="w-3 h-3" />
                            Due on {r.dueDate}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {r.expectedCollectionDate
                              ? `Expected by ${r.expectedCollectionDate}`
                              : "On track"}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Follow-up */}
                        <a
                          href={getWhatsAppUrl(r)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open WhatsApp with drafted reminder"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>

                        {/* Copy Reminder Text */}
                        <button
                          type="button"
                          onClick={() => handleCopy(r.id, reminderText)}
                          title="Copy drafted reminder script"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs shadow-sm transition-colors"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                        </button>

                        {/* Record Payment */}
                        <Link
                          href={`/invoices/${r.id}`}
                          title="Record payment or view details"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span className="hidden sm:inline">Pay</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
