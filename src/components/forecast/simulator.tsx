"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import type { ForecastResult } from "@/lib/financial/forecast";
import { formatINR } from "@/lib/financial/money";
import { formatDisplayDate } from "@/components/forecast/format";
import { ForecastChart } from "@/components/forecast/forecast-chart";
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Play,
  CheckCircle2,
  Calendar,
  ArrowRight,
  TrendingDown,
  Info,
} from "lucide-react";

export type SimulatorInvoice = {
  id: string;
  label: string;
  outstandingPaise: number;
  expectedDate: string | null;
};

export type SimulationResult = {
  baseline: ForecastResult;
  scenario: ForecastResult;
  invoiceId: string;
  originalDate: string | null;
  scenarioDate: string | null;
  differenceAtHorizonPaise: number;
};

interface SimulatorProps {
  invoices: SimulatorInvoice[];
  horizonDays: number;
}

interface SimulateResponse {
  success: boolean;
  data?: SimulationResult;
  error?: { code: string; message: string };
}

const DELAY_PRESETS = [7, 15, 30] as const;

export function Simulator({ invoices, horizonDays }: SimulatorProps) {
  const [invoiceId, setInvoiceId] = useState(invoices[0]?.id ?? "");
  const [preset, setPreset] = useState<number | null>(15);
  const [customDelay, setCustomDelay] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [resultLabel, setResultLabel] = useState("");

  function resolveDelay(): number | null {
    if (preset !== null) return preset;
    const trimmed = customDelay.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const value = Number(trimmed);
    return value >= 1 && value <= 365 ? value : null;
  }

  const delayDays = resolveDelay();

  function handlePreset(days: number) {
    setPreset(days);
    setCustomDelay("");
  }

  function handleCustomChange(event: ChangeEvent<HTMLInputElement>) {
    setCustomDelay(event.target.value);
    setPreset(null);
  }

  function handleReset() {
    setInvoiceId(invoices[0]?.id ?? "");
    setPreset(15);
    setCustomDelay("");
    setError(null);
    setResult(null);
    setResultLabel("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoiceId || delayDays === null) return;

    setPending(true);
    setError(null);
    setResult(null);
    setResultLabel(invoices.find((invoice) => invoice.id === invoiceId)?.label ?? "");

    try {
      const response = await fetch("/api/forecast/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, delayDays, horizonDays }),
      });

      let json: SimulateResponse | null = null;
      try {
        json = (await response.json()) as SimulateResponse;
      } catch {
        json = null;
      }

      if (!response.ok || !json?.success || !json.data) {
        setError(json?.error?.message ?? "The simulation could not be run. Please try again.");
        return;
      }

      setResult(json.data);
    } catch {
      setError("Could not reach the app. Check that it is running and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Simulation Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-[#111827] p-5 sm:p-6 shadow-xl space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Simulate Payment Delays ("What-If" Analysis)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Stress-test studio cash reserves: select any key customer and test the impact if they pay late.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Stress-Testing Mode
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Invoice Selection */}
          <div>
            <label htmlFor="simulate-invoice" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Key Customer Invoice to Delay
            </label>
            <select
              id="simulate-invoice"
              name="invoiceId"
              required
              value={invoiceId}
              onChange={(event) => setInvoiceId(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-[#172133] px-3 py-2 text-xs text-white focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {invoices.length === 0 ? (
                <option value="">No open issued invoices available</option>
              ) : (
                invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.label} — {formatINR(inv.outstandingPaise)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Delay Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Delay Duration (Days Late)
            </label>
            <div className="flex items-center gap-2">
              {DELAY_PRESETS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handlePreset(days)}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    preset === days
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                      : "bg-[#172133] hover:bg-[#1d293f] text-slate-300 border-slate-700"
                  }`}
                >
                  +{days} Days {days === 15 ? "(Scenario)" : ""}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="365"
                placeholder="Custom"
                value={customDelay}
                onChange={handleCustomChange}
                className="w-20 rounded-xl border border-slate-700 bg-[#172133] px-2.5 py-2 text-xs text-white focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-xs text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-slate-400">
            Selected: <strong className="text-slate-200">{delayDays ?? 0} days delay</strong> against{" "}
            {horizonDays}-day horizon.
          </p>

          <div className="flex items-center gap-2">
            {result && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-[#172133] hover:bg-[#1e2a40] text-slate-300 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="submit"
              disabled={pending || !invoiceId || delayDays === null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{pending ? "Simulating Impact..." : "Run Delay Simulation"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Simulation Result Card */}
      {result && (
        <div className="rounded-2xl border border-indigo-900/50 bg-[#111827] p-5 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                Simulation Outcome
              </span>
              <h3 className="text-base font-bold text-white mt-1">
                Scenario Result: {resultLabel} delayed by {delayDays} days
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Difference at {horizonDays} days:</span>
              <div
                className={`text-base font-extrabold ${
                  result.differenceAtHorizonPaise < 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {result.differenceAtHorizonPaise > 0
                  ? `+${formatINR(result.differenceAtHorizonPaise)}`
                  : formatINR(result.differenceAtHorizonPaise)}
              </div>
            </div>
          </div>

          {/* Alert verdict */}
          {result.scenario.firstShortfallDate ? (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/60 text-xs text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-sm text-rose-300">
                  Critical Warning: Cash Shortfall Triggered!
                </strong>
                <p className="mt-0.5 text-rose-200/90">
                  If this customer delays payment by {delayDays} days, your studio cash will dip below zero on{" "}
                  <strong className="text-white">{formatDisplayDate(result.scenario.firstShortfallDate)}</strong>, reaching a low of{" "}
                  <strong className="text-white">{formatINR(result.scenario.minimumCashPaise)}</strong> on{" "}
                  {formatDisplayDate(result.scenario.minimumCashDate)}.
                </p>
                <div className="mt-2 text-rose-300 font-semibold flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Action: Chase invoice early or postpone non-essential supplier bills.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/60 text-xs text-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-sm text-emerald-300">
                  Cashflow Resilient: No Shortfall
                </strong>
                <p className="mt-0.5 text-emerald-200/90">
                  Even with this {delayDays}-day delay, your cash remains positive throughout the {horizonDays}
                  -day window. Lowest projected cash balance is{" "}
                  <strong className="text-white">{formatINR(result.scenario.minimumCashPaise)}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Comparison Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#172133] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Original Receipt Date</span>
              <div className="text-sm font-bold text-white mt-1">
                {result.originalDate ? formatDisplayDate(result.originalDate) : "Due date"}
              </div>
            </div>
            <div className="bg-[#172133] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Simulated Receipt Date</span>
              <div className="text-sm font-bold text-indigo-400 mt-1">
                {result.scenarioDate ? formatDisplayDate(result.scenarioDate) : "Delayed"}
              </div>
            </div>
            <div className="bg-[#172133] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Baseline Ending Cash</span>
              <div className="text-sm font-bold text-white mt-1">
                {formatINR(result.baseline.endingCashPaise)}
              </div>
            </div>
            <div className="bg-[#172133] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Simulated Ending Cash</span>
              <div className="text-sm font-bold text-white mt-1">
                {formatINR(result.scenario.endingCashPaise)}
              </div>
            </div>
          </div>

          {/* Comparative Chart */}
          <div className="bg-[#111827] rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-300">
              <span className="font-semibold">Simulated Cash Curve vs Baseline</span>
              <span className="text-[11px] text-slate-400">Horizon: {horizonDays} days</span>
            </div>
            <ForecastChart
              points={result.scenario.points}
              baselinePoints={result.baseline.points}
              horizonDays={horizonDays}
              primaryLabel="Simulated Cash"
            />
          </div>
        </div>
      )}
    </div>
  );
}
