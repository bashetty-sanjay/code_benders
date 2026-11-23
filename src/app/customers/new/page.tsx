import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/customers" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
          ← All clients
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Add New Client</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create a debtor profile to track billings, payment collection dates, and WhatsApp payment reminders.
        </p>
      </div>
      <div className="max-w-2xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-md backdrop-blur">
        <CustomerForm mode="create" />
      </div>
    </AppShell>
  );
}
