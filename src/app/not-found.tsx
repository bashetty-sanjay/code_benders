import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0f17] p-6 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-xl backdrop-blur">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-indigo-400 border border-slate-700">
          <span className="text-xl font-bold">404</span>
        </div>
        <h1 className="mt-4 text-xl font-bold text-white">Record Not Found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The requested financial record or invoice does not exist or may have been archived.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
