"use client";

import { useState } from "react";
import {
  AlertTriangle,
  MessageCircle,
  Copy,
  Check,
  X,
  Send,
  Sparkles,
  PhoneCall,
  Clock,
  ArrowRight,
} from "lucide-react";
import { formatINR } from "@/lib/financial/money";

export interface OverdueClient {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  outstandingPaise: number;
  overdueDays: number;
  dueDate: string;
}

interface BadDayTriageProps {
  overdueClients: OverdueClient[];
  totalOverduePaise: number;
}

export function BadDayTriageModal({ overdueClients, totalOverduePaise }: BadDayTriageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  if (overdueClients.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-medium text-emerald-800">
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        <span>Zero Overdue Invoices — Cashflow is on schedule!</span>
      </div>
    );
  }

  function getReminderMessage(client: OverdueClient): string {
    const formattedAmount = formatINR(client.outstandingPaise);
    return `Hi ${client.customerName}, following up regarding invoice ${client.invoiceNumber} for ${formattedAmount}, which was due on ${client.dueDate} (${client.overdueDays} days ago). Could you please confirm when we can expect this transfer? Let us know if you need the invoice or bank details again. Thanks!`;
  }

  function handleCopy(id: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCopyAll() {
    const summary = overdueClients
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.customerName} - ${c.invoiceNumber}: ${formatINR(c.outstandingPaise)} (${c.overdueDays} days late)\n` +
          `Reminder: "${getReminderMessage(c)}"\n`,
      )
      .join("\n");
    void navigator.clipboard.writeText(
      `--- BAD DAY CASH TRIAGE SUMMARY (${overdueClients.length} Overdue Clients - Total: ${formatINR(
        totalOverduePaise,
      )}) ---\n\n${summary}`,
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  }

  function getWhatsAppUrl(client: OverdueClient): string {
    const phone = client.customerPhone ? client.customerPhone.replace(/\D/g, "") : "";
    const text = encodeURIComponent(getReminderMessage(client));
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <AlertTriangle className="w-4 h-4 animate-pulse" />
        <span>Bad Day Triage Mode ({overdueClients.length} Overdue)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0f172a] text-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-800">
            {/* Header */}
            <div className="bg-[#111827] text-white p-5 flex items-start justify-between border-b border-slate-800">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Bad Day Triage: Fast Cash Recovery</h2>
                    <span className="text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {overdueClients.length} clients owe a total of{" "}
                    <strong className="text-white font-bold">{formatINR(totalOverduePaise)}</strong>.
                    Follow up in under 2 minutes with one-click drafted reminders.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Bar */}
            <div className="bg-[#131c2e] px-5 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Ranked by overdue duration and cash impact
              </span>
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 font-semibold text-indigo-300 hover:text-white px-2.5 py-1 rounded bg-indigo-500/20 border border-indigo-500/30 transition-colors"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAll ? "All Reminders Copied!" : "Copy All Reminders"}</span>
              </button>
            </div>

            {/* Client List */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1 divide-y divide-slate-800/80">
              {overdueClients.map((client) => {
                const message = getReminderMessage(client);
                const isCopied = copiedId === client.id;
                const isCritical = client.overdueDays >= 15;

                return (
                  <div key={client.id} className="pt-3.5 first:pt-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{client.customerName}</span>
                          <span className="text-xs text-slate-400 font-mono">#{client.invoiceNumber}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isCritical
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {client.overdueDays} days late
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Due Date: {client.dueDate} · Phone: {client.customerPhone || "Not set"}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold text-white">
                          {formatINR(client.outstandingPaise)}
                        </div>
                        <span className="text-[10px] uppercase font-bold text-rose-400">Uncollected</span>
                      </div>
                    </div>

                    {/* Pre-drafted WhatsApp reminder box */}
                    <div className="mt-2.5 p-3 rounded-xl bg-[#172133] border border-slate-700/80 text-xs text-slate-300 relative group">
                      <p className="italic text-slate-300 font-serif leading-relaxed">"{message}"</p>
                    </div>

                    {/* Actions */}
                    <div className="mt-2.5 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCopy(client.id, message)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow-sm transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? "Copied" : "Copy Draft"}</span>
                      </button>

                      <a
                        href={getWhatsAppUrl(client)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Send on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#111827] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Tip: Following up on WhatsApp recovers 78% of freelancer invoices within 48h.</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
