export default function Loading() {
  return (
    <>
      {/* Top progress bar */}
      <div className="top-loading-bar" aria-hidden="true" />

      {/* Shimmer skeleton layout */}
      <div
        className="mx-auto max-w-6xl p-6 space-y-6"
        role="status"
        aria-live="polite"
        aria-label="Loading CashPilot"
      >
        <span className="sr-only">Loading CashPilot…</span>

        {/* Page header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-44 rounded-lg animate-shimmer" />
            <div className="h-4 w-64 rounded-md animate-shimmer stagger-1" />
          </div>
          <div className="h-9 w-32 rounded-lg animate-shimmer stagger-2" />
        </div>

        {/* KPI cards row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-800/60 animate-shimmer"
              style={{ animationDelay: `${i * 0.07}s` }}
            />
          ))}
        </div>

        {/* Chart / table area */}
        <div className="h-56 rounded-xl border border-slate-800/60 animate-shimmer stagger-3" />

        {/* Secondary rows */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-40 rounded-xl border border-slate-800/60 animate-shimmer stagger-4" />
          <div className="h-40 rounded-xl border border-slate-800/60 animate-shimmer stagger-5" />
        </div>
      </div>
    </>
  );
}
