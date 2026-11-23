import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import { BadDayTriageModal, type OverdueClient } from "@/components/dashboard/bad-day-triage";
import { WhoOwesMeSection, type ReceivableRow } from "@/components/dashboard/who-owes-me";
import { formatINR } from "@/lib/financial/money";
import { getDashboardData } from "@/lib/services/dashboard";
import { ServiceError } from "@/lib/services/errors";
import {
  Wallet,
  ArrowUpRight,
  AlertTriangle,
  Receipt,
  TrendingUp,
  ShieldCheck,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data;
  try {
    data = await getDashboardData(30);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") {
      redirect("/setup");
    }
    return (
      <AppShell>
        <div className="rounded-2xl border border-red-900/60 bg-red-950/30 p-8 text-center max-w-lg mx-auto mt-12 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-900/50 text-red-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Database Setup Required</h1>
          <p className="mt-2 text-sm text-red-300">
            We could not load your business details. Please ensure the database is initialized and migrated.
          </p>
          <div className="mt-6">
            <Link
              href="/setup"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
            >
              Run Initial Setup
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const { profile, summary, forecast, alerts, receivables, upcomingBills } = data;

  const overdueClients: OverdueClient[] = receivables
    .filter((r) => r.overdue)
    .map((r) => ({
      id: r.id,
      invoiceNumber: r.invoiceNumber,
      customerName: r.customer.name,
      customerPhone: r.customer.phone,
      customerEmail: r.customer.email,
      outstandingPaise: r.outstandingPaise,
      overdueDays: r.overdueDays,
      dueDate: r.dueDate,
    }));

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {profile.businessName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Back Office
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              One-Person Studio Cash & Receivables Control Center · Date: {data.today}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <BadDayTriageModal
              overdueClients={overdueClients}
              totalOverduePaise={summary.overduePaise}
            />

            <Link
              href="/invoices/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </Link>
          </div>
        </div>

        {/* Studio Operations Intelligence Bar */}
        <div className="rounded-2xl bg-gradient-to-r from-[#111827] via-[#1a233a] to-[#111827] p-4 sm:p-5 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">CashFlow Intelligence Active</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Healthy Buffer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                Automated debtor ageing tracking, one-click WhatsApp payment reminders, and proactive 30–90 day cash shortfall predictions.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <Link
              href="/forecast"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition-colors flex items-center gap-1"
            >
              <span>Explore Forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 6 Key Financial KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Recorded Cash */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Cash in Bank</span>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-xl font-extrabold text-white tracking-tight">
              {formatINR(summary.recordedCashPaise)}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 truncate">
              Snapshot {profile.openingCashDate}
            </div>
          </div>

          {/* 2. Total Outstanding */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Money Owed</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-xl font-extrabold text-white tracking-tight">
              {formatINR(summary.totalOutstandingPaise)}
            </div>
            <div className="mt-1 text-[11px] text-emerald-400 font-medium">
              {summary.openInvoiceCount} open {summary.openInvoiceCount === 1 ? "invoice" : "invoices"}
            </div>
          </div>

          {/* 3. Overdue (Action required) */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-rose-900/50 bg-rose-950/20 shadow-lg hover:border-rose-700 transition-all">
            <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                Overdue Debt
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-2 text-xl font-extrabold text-rose-400 tracking-tight">
              {formatINR(summary.overduePaise)}
            </div>
            <div className="mt-1 text-[11px] text-rose-300 font-semibold">
              {summary.overdueInvoiceCount} late {summary.overdueInvoiceCount === 1 ? "client" : "clients"}
            </div>
          </div>

          {/* 4. Upcoming Bills */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Bills (30 Days)</span>
              <Receipt className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-xl font-extrabold text-white tracking-tight">
              {formatINR(summary.upcomingBillsPaise)}
            </div>
            <div className="mt-1 text-[11px] text-amber-400 font-medium">
              {summary.upcomingBillCount} bills scheduled
            </div>
          </div>

          {/* 5. Projected Cash (30 days) */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Projected (30d)</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className={`mt-2 text-xl font-extrabold tracking-tight ${
              summary.projectedCashPaise < 0 ? "text-rose-400" : "text-indigo-400"
            }`}>
              {formatINR(summary.projectedCashPaise)}
            </div>
            <div className="mt-1 text-[11px] text-slate-400 truncate">
              {forecast.firstShortfallDate
                ? `Shortfall on ${forecast.firstShortfallDate}`
                : "Safe cash trajectory"}
            </div>
          </div>

          {/* 6. Studio Health Indicator */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Runway Health</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-base font-extrabold text-emerald-400 tracking-tight">
              {forecast.firstShortfallDate ? "At Risk" : "Strong"}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {summary.overdueInvoiceCount > 0 ? "Chase overdue to secure" : "No runway alert"}
            </div>
          </div>
        </section>

        {/* HERO FEATURE: Who Owes Me, How Much, and Since When? */}
        <WhoOwesMeSection receivables={receivables as unknown as ReceivableRow[]} />

        {/* 30-Day Cash Outlook Chart & Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: 30-Day Outlook Chart */}
          <section className="bg-[#111827] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    30-Day Cash Flow Projection
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Day-by-day cash balance incorporating expected customer receipts and upcoming studio expenses.
                  </p>
                </div>
                <Link
                  href="/forecast?horizon=30"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors"
                >
                  <span>Interactive Simulator</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="mt-4">
                <ForecastChart points={forecast.points} horizonDays={30} />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                Baseline projection based on payment due dates
              </span>
              <span className="font-semibold text-slate-200">
                Minimum Point: {formatINR(forecast.minimumCashPaise)}
              </span>
            </div>
          </section>

          {/* Right 1 Col: Action Center Alerts */}
          <section className="bg-[#111827] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Action Center
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Priority follow-ups & decisions for today
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {alerts.length} Action{alerts.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-medium">All caught up! No urgent alerts right now.</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const isHigh = alert.severity === "critical";
                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border text-xs transition-all ${
                        isHigh
                          ? "bg-rose-950/30 border-rose-900/60 text-rose-200"
                          : "bg-[#162032] border-slate-700/80 text-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold flex items-center gap-1.5 text-white">
                          {isHigh ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          )}
                          {alert.headline}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isHigh
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-300 leading-snug">{alert.explanation}</p>
                      <div className="mt-2.5 flex items-center justify-end">
                        <Link
                          href={alert.actionHref}
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2.5 py-1 rounded-lg shadow-sm transition-colors ${
                            isHigh
                              ? "bg-rose-600 hover:bg-rose-500 text-white"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white"
                          }`}
                        >
                          <span>{alert.actionLabel}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Upcoming Studio Bills & Expenses (Next 7-30 Days) */}
        <section className="bg-[#111827] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Upcoming Studio Expenses & Bills
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Rent, software subscriptions, contractor payouts, and taxes due in the next 30 days.
              </p>
            </div>
            <Link
              href="/bills"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Manage all bills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {upcomingBills.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No unpaid bills due in the next 7 days.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                <thead className="bg-[#151e2f] text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Bill / Expense Title</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5">Due Date</th>
                    <th className="px-4 py-2.5">Amount</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#111827]">
                  {upcomingBills.map((bill) => (
                    <tr key={`${bill.billId}-${bill.dueDate}`} className="hover:bg-[#162134] transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">{bill.title}</td>
                      <td className="px-4 py-3 text-slate-400">{bill.category}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                          <Calendar className="w-3 h-3" />
                          {bill.dueDate}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{formatINR(bill.amountPaise)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href="/bills"
                          className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                        >
                          View & Pay
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
