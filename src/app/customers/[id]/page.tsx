import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ArchiveButton } from "@/components/customers/archive-button";
import { formatINR } from "@/lib/financial/money";
import { getCustomerDetail } from "@/lib/services/customers";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

function SummaryCard({ label, value, tone }: { label: string; value: string; tone?: "red" }) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-sm backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight ${tone === "red" ? "text-rose-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof getCustomerDetail>>;
  try {
    detail = await getCustomerDetail(id);
  } catch {
    notFound();
  }
  const { customer, invoices, payments, summary } = detail;

  const issued = invoices.filter((invoice) => invoice.lifecycle === "ISSUED");
  const totalInvoicedPaise = issued.reduce((sum, invoice) => sum + invoice.totalPaise, 0);
  const receivedPaise = issued.reduce((sum, invoice) => sum + invoice.paidPaise, 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/customers" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
            ← All clients &amp; accounts
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">{customer.name}</h1>
            {customer.archivedAt && (
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                Archived
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/customers/${customer.id}/edit`}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            Edit client
          </Link>
          {customer.archivedAt === null && (
            <Link
              href={`/invoices/new?customerId=${customer.id}`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              + Create invoice
            </Link>
          )}
          <ArchiveButton customerId={customer.id} archived={customer.archivedAt !== null} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-sm backdrop-blur">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Client Contact &amp; Business Profile</h2>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-400 font-medium">Company Name</dt>
            <dd className="mt-0.5 text-slate-200 font-medium">{customer.companyName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400 font-medium">Email Address</dt>
            <dd className="mt-0.5 text-slate-200 font-medium">{customer.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400 font-medium">WhatsApp / Phone</dt>
            <dd className="mt-0.5 text-slate-200 font-medium">{customer.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400 font-medium">Billing Address</dt>
            <dd className="mt-0.5 whitespace-pre-line text-slate-200">{customer.address ?? "—"}</dd>
          </div>
          {customer.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-slate-400 font-medium">Internal Notes</dt>
              <dd className="mt-0.5 whitespace-pre-line text-slate-300 text-xs leading-relaxed">{customer.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard label="Total invoiced" value={formatINR(totalInvoicedPaise)} />
        <SummaryCard label="Total received" value={formatINR(receivedPaise)} />
        <SummaryCard label="Total outstanding" value={formatINR(summary.outstandingPaise)} />
        <SummaryCard
          label="Overdue outstanding"
          value={formatINR(summary.overdueOutstandingPaise)}
          tone="red"
        />
        <SummaryCard label="Unpaid invoices" value={String(summary.openInvoiceCount)} />
        <SummaryCard label="Overdue count" value={String(summary.overdueInvoiceCount)} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-white">Invoice History</h2>
        {invoices.length === 0 ? (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center">
            <p className="text-sm text-slate-400">No invoices generated for this client yet.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950/60 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Invoice #</th>
                    <th scope="col" className="px-5 py-3.5">Issue date</th>
                    <th scope="col" className="px-5 py-3.5">Due date</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Total</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Outstanding</th>
                    <th scope="col" className="px-5 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-medium text-white">{invoice.invoiceNumber}</td>
                      <td className="px-5 py-4 text-slate-300">{invoice.issueDate}</td>
                      <td className="px-5 py-4 text-slate-300">
                        {invoice.dueDate}
                        {invoice.overdue && (
                          <span className="ml-2 inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                            {invoice.overdueDays}d overdue
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-slate-200">{formatINR(invoice.totalPaise)}</td>
                      <td className="px-5 py-4 text-right font-bold text-white">
                        {formatINR(invoice.outstandingPaise)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          invoice.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : invoice.overdue
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : invoice.status === "DRAFT"
                            ? "bg-slate-700/50 text-slate-300 border border-slate-600/50"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {invoice.overdue ? "OVERDUE" : invoice.status === "ISSUED_UNPAID" ? "UNPAID" : invoice.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-3 font-medium">
                          {invoice.lifecycle === "DRAFT" && (
                            <Link href={`/invoices/${invoice.id}/edit`} className="text-slate-400 hover:text-white transition">
                              Edit
                            </Link>
                          )}
                          <Link href={`/invoices/${invoice.id}`} className="text-indigo-400 hover:text-indigo-300 transition">
                            View details →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold tracking-tight text-white">Recorded Payments</h2>
        {payments.length === 0 ? (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center">
            <p className="text-sm text-slate-400">No payment transactions recorded yet.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-slate-800/60 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md">
            {payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm">
                <span className="text-slate-400">{payment.paymentDate}</span>
                <span className="font-mono font-medium text-white">{payment.invoiceNumber}</span>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{payment.method}</span>
                <span className="font-bold text-emerald-400">+{formatINR(payment.amountPaise)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
