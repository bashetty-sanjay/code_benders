import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { BillForm } from "@/components/bills/bill-form";

export const dynamic = "force-dynamic";

export default function NewBillPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/bills" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
          ← All bills &amp; payables
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Record New Bill</h1>
        <p className="mt-1 text-sm text-slate-400">
          Add a recurring expense (rent, cloud hosting, SaaS) or a one-time contractor payout to track in your 30–90 day cash forecast.
        </p>
      </div>
      <div className="max-w-xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-md backdrop-blur">
        <BillForm mode="create" />
      </div>
    </AppShell>
  );
}
