import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { todayKolkata } from "@/lib/financial/dates";
import { listCustomers } from "@/lib/services/customers";

export const dynamic = "force-dynamic";

type NewInvoicePageProps = {
  searchParams: Promise<{ customerId?: string | string[] }>;
};

export default async function NewInvoicePage({ searchParams }: NewInvoicePageProps) {
  const { customerId } = await searchParams;
  const customers = await listCustomers();
  const requestedId = Array.isArray(customerId) ? customerId[0] : customerId;
  const initialCustomerId = customers.some((customer) => customer.id === requestedId) ? requestedId : undefined;

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/invoices" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
          ← All invoices &amp; receivables
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Create New Invoice</h1>
        <p className="mt-1 text-sm text-slate-400">
          Save as a draft first or issue immediately with pre-formatted service items and quick payment terms.
        </p>
      </div>

      <div className="max-w-3xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-md backdrop-blur">
        <InvoiceForm
          mode="create"
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          defaultDate={todayKolkata()}
          initialCustomerId={initialCustomerId}
        />
        {customers.length === 0 && (
          <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
            No clients registered yet.{" "}
            <Link href="/customers/new" className="font-semibold underline text-amber-200 hover:text-white">
              Add a client first
            </Link>{" "}
            before creating an invoice.
          </div>
        )}
      </div>
    </AppShell>
  );
}
