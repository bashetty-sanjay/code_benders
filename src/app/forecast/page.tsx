import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import { Simulator, type SimulatorInvoice } from "@/components/forecast/simulator";
import { formatDisplayDate } from "@/components/forecast/format";
import { formatINR } from "@/lib/financial/money";
import type { ForecastResult } from "@/lib/financial/forecast";
import {
  FORECAST_HORIZONS,
  getForecast,
  type ForecastHorizon,
} from "@/lib/services/forecast";
import { listInvoices } from "@/lib/services/invoices";
import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ horizon?: string | string[] }>;
};

const BASIS_LABELS: Record<ForecastResult["incomingEvents"][number]["basis"], string> = {
  OWNER_ESTIMATE: "Estimated Date",
  INVOICE_DUE_DATE: "Invoice Due Date",
  SHIFTED_SCENARIO: "Shifted by Simulation",
};

function parseHorizon(raw: string | string[] | undefined): ForecastHorizon {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return FORECAST_HORIZONS.find((horizon) => String(horizon) === value) ?? 30;
}

export default async function ForecastPage({ searchParams }: PageProps) {
  const horizon = parseHorizon((await searchParams).horizon);

  const [forecast, invoiceRows] = await Promise.all([getForecast(horizon), listInvoices()]);

  const invoices: SimulatorInvoice[] = invoiceRows
    .filter((row) => row.lifecycle === "ISSUED" && row.outstandingPaise > 0)
    .map((row) => ({
      id: row.id,
      label: `${row.invoiceNumber} · ${row.customer.name}`,
      outstandingPaise: row.outstandingPaise,
      expectedDate: row.expectedCollectionDate,
    }));

  const lastPoint = forecast.points[forecast.points.length - 1];

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                30–90 Day Cash Flow Forecast
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Predictive Model
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Anticipate cash crunches before they happen based on customer payment due dates and supplier commitments.
            </p>
          </div>

          {/* Horizon Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#172133] border border-slate-700/80">
            {FORECAST_HORIZONS.map((days) => {
              const active = days === horizon;
              return (
                <Link
                  key={days}
                  href={`?horizon=${days}`}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {days} Days Horizon
                </Link>
              );
            })}
          </div>
        </div>

        {/* 5 Forecast Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">Recorded Cash Today</span>
            <div className="text-xl font-extrabold text-white mt-1">
              {formatINR(forecast.recordedCashPaise)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Current starting balance</div>
          </div>

          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">Projected Ending Cash</span>
            <div
              className={`text-xl font-extrabold mt-1 ${
                forecast.endingCashPaise < 0 ? "text-rose-400" : "text-indigo-400"
              }`}
            >
              {formatINR(forecast.endingCashPaise)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              At day {horizon} ({formatDisplayDate(lastPoint.date)})
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">Lowest Projected Cash</span>
            <div
              className={`text-xl font-extrabold mt-1 ${
                forecast.minimumCashPaise < 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {formatINR(forecast.minimumCashPaise)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              On {formatDisplayDate(forecast.minimumCashDate)}
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">First Cash Shortfall</span>
            <div
              className={`text-sm font-bold mt-1.5 ${
                forecast.firstShortfallDate ? "text-rose-400 font-extrabold text-base" : "text-emerald-400"
              }`}
            >
              {forecast.firstShortfallDate
                ? formatDisplayDate(forecast.firstShortfallDate)
                : "No shortfall predicted"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {forecast.firstShortfallDate ? "Cash dips below zero" : "Cash stays positive"}
            </div>
          </div>

          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl col-span-2 md:col-span-1">
            <span className="text-xs text-slate-400 font-medium">Deficit Days</span>
            <div
              className={`text-xl font-extrabold mt-1 ${
                forecast.negativeDays > 0 ? "text-rose-400" : "text-white"
              }`}
            >
              {forecast.negativeDays}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {forecast.negativeDays > 0 ? "Days cash is in the red" : "Safe liquidity buffer"}
            </div>
          </div>
        </section>

        {/* Shortfall Alert Notice */}
        {forecast.firstShortfallDate ? (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-200 flex items-start gap-3 shadow-xl">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-sm text-rose-300">
                Action Required: Projected Cash Shortfall Detected!
              </strong>
              <p className="mt-0.5 text-rose-200/90">
                Studio cash is projected to go below zero on{" "}
                <strong className="text-white">{formatDisplayDate(forecast.firstShortfallDate)}</strong>, reaching a low of{" "}
                <strong className="text-white">{formatINR(forecast.minimumCashPaise)}</strong> on{" "}
                {formatDisplayDate(forecast.minimumCashDate)}. Use the What-If Simulator below to test how
                chasing late invoices or delaying bills resolves this.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-900/60 text-xs text-emerald-300 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">Healthy Cashflow:</strong> Projected cash reserves remain positive throughout the next{" "}
              {horizon} days.
            </span>
          </div>
        )}

        {/* Main Forecast Chart */}
        <section className="bg-[#111827] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {horizon}-Day Projected Cash Trajectory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Red dots on the chart represent days where projected closing cash balance dips below zero.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <ForecastChart points={forecast.points} horizonDays={horizon} />
          </div>
        </section>

        {/* WHAT-IF SCENARIO SIMULATOR */}
        <section>
          <Simulator invoices={invoices} horizonDays={horizon} />
        </section>

        {/* Expected Cash In & Out Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expected Money In */}
          <section className="bg-[#111827] rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  Expected Money In ({forecast.incomingEvents.length} Invoices)
                </h3>
                <p className="text-[11px] text-slate-400">Customer payments expected in this window</p>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              {forecast.incomingEvents.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">No incoming payments in this window.</p>
              ) : (
                <table className="min-w-full text-xs text-left divide-y divide-slate-800">
                  <thead className="bg-[#151e2f] text-slate-400 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="px-3 py-2">Expected Date</th>
                      <th className="px-3 py-2">Client</th>
                      <th className="px-3 py-2">Invoice</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {forecast.incomingEvents.map((e) => (
                      <tr key={`${e.invoiceId}|${e.date}`} className="hover:bg-[#162134]">
                        <td className="px-3 py-2.5 font-medium text-slate-300">{formatDisplayDate(e.date)}</td>
                        <td className="px-3 py-2.5 text-white font-semibold">{e.customerName}</td>
                        <td className="px-3 py-2.5 font-mono text-indigo-400">{e.invoiceNumber}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                          {formatINR(e.amountPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Expected Money Out (Bills) */}
          <section className="bg-[#111827] rounded-2xl border border-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-rose-400" />
                  Expected Money Out ({forecast.outgoingEvents.length} Bills)
                </h3>
                <p className="text-[11px] text-slate-400">Scheduled expenses, rent & supplier payments</p>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              {forecast.outgoingEvents.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-400">No outgoing bills in this window.</p>
              ) : (
                <table className="min-w-full text-xs text-left divide-y divide-slate-800">
                  <thead className="bg-[#151e2f] text-slate-400 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="px-3 py-2">Due Date</th>
                      <th className="px-3 py-2">Expense Item</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {forecast.outgoingEvents.map((e) => (
                      <tr key={`${e.billId}|${e.date}`} className="hover:bg-[#162134]">
                        <td className="px-3 py-2.5 font-medium text-slate-300">{formatDisplayDate(e.date)}</td>
                        <td className="px-3 py-2.5 text-white font-semibold">{e.title}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-rose-400">
                          {formatINR(e.amountPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
