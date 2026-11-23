import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MarkPaidButton } from "@/components/bills/mark-paid-button";
import { addDaysISO, dueSoon } from "@/lib/financial/bills";
import { formatINR } from "@/lib/financial/money";
import { todayKolkata } from "@/lib/financial/dates";
import { parseBillRange } from "@/lib/schemas/bills";
import { listBillOccurrences } from "@/lib/services/bills";
import {
  Receipt,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

type BillsPageProps = {
  searchParams: Promise<{ from?: string; to?: string; status?: string }>;
};

function StatusBadge({
  status,
  paidDate,
  dueDate,
  today,
}: {
  status: "PAID" | "OVERDUE" | "UPCOMING";
  paidDate: string | null;
  dueDate: string;
  today: string;
}) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
        Paid {paidDate}
      </span>
    );
  }
  if (status === "OVERDUE") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300 border border-rose-500/30">
        <AlertTriangle className="w-3 h-3 text-rose-400" />
        Overdue
      </span>
    );
  }
  const soon = dueSoon(dueDate, today);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        soon
          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
          : "bg-slate-800 text-slate-300 border border-slate-700"
      }`}
    >
      <Clock className="w-3 h-3" />
      {soon ? "Due Soon" : "Upcoming"}
    </span>
  );
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const today = todayKolkata();
  const status = ["PAID", "OVERDUE", "UPCOMING"].includes(params.status ?? "")
    ? (params.status as "PAID" | "OVERDUE" | "UPCOMING")
    : undefined;
  const defaultFrom = status === "OVERDUE" ? addDaysISO(today, -365) : null;
  const defaultTo = status === "OVERDUE" ? today : null;
  const range = parseBillRange(params.from ?? defaultFrom, params.to ?? defaultTo);

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Studio Expenses & Recurring Bills
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Outflow Ledger
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Track studio rent, software tools, freelancer retainers, and utility costs to keep cash forecasts realistic.
            </p>
          </div>

          <Link
            href="/bills/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Bill</span>
          </Link>
        </div>

        {/* Filter Controls */}
        <form
          method="GET"
          action="/bills"
          className="bg-[#111827] p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-end gap-3"
        >
          <div className="min-w-[140px]">
            <label htmlFor="status" className="block text-xs font-semibold text-slate-300 mb-1">
              Filter by Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-[#172133] text-white focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div>
            <label htmlFor="from" className="block text-xs font-semibold text-slate-300 mb-1">
              From Date
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={range.success ? range.data.from : today}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-[#172133] text-white focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="to" className="block text-xs font-semibold text-slate-300 mb-1">
              To Date
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={range.success ? range.data.to : ""}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-[#172133] text-white focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-colors"
          >
            Filter Bills
          </button>
        </form>

        {!range.success ? (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-300">
            {range.error.issues[0]?.message ?? "Please correct the date range."}
          </div>
        ) : (
          <BillsTable range={range.data} today={today} status={status} />
        )}
      </div>
    </AppShell>
  );
}

async function BillsTable({
  range,
  today,
  status,
}: {
  range: { from: string; to: string };
  today: string;
  status?: "PAID" | "OVERDUE" | "UPCOMING";
}) {
  const rows = await listBillOccurrences(range, status);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#111827] p-8 text-center text-slate-400 shadow-xl">
        <Receipt className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-300">No bills found in this date window.</p>
        <p className="text-xs text-slate-500 mt-1">
          Add rent, software subscriptions, or taxes to include them in cash forecasts.
        </p>
      </div>
    );
  }

  return (
    <section className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
          <thead className="bg-[#151e2f] text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Expense Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-[#111827]">
            {rows.map((row) => (
              <tr key={`${row.billId}-${row.dueDate}`} className="hover:bg-[#162134] transition-colors">
                <td className="px-5 py-3.5">
                  <Link
                    href={`/bills/${row.billId}/edit`}
                    className="font-bold text-white hover:text-indigo-400"
                  >
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700">
                    {row.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-300">{row.dueDate}</td>
                <td className="px-4 py-3.5 text-right font-bold text-white">
                  {formatINR(row.amountPaise)}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge
                    status={row.status}
                    paidDate={row.paidDate}
                    dueDate={row.dueDate}
                    today={today}
                  />
                </td>
                <td className="px-5 py-3.5 text-right">
                  {row.status !== "PAID" && (
                    <MarkPaidButton
                      billId={row.billId}
                      dueDate={row.dueDate}
                      amountPaise={row.amountPaise}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
