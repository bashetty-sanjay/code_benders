export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl p-6" role="status" aria-live="polite">
      <span className="sr-only">Loading CashPilot</span>
      <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl bg-slate-900 border border-slate-800" />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-slate-900 border border-slate-800" />
    </div>
  );
}
