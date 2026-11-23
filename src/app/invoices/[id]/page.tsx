import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { ExpectedCollectionForm } from "@/components/invoices/expected-collection-form";
import { todayKolkata } from "@/lib/financial/dates";
import { formatINR } from "@/lib/financial/money";
import { ServiceError } from "@/lib/services/errors";
import { getInvoiceDetail } from "@/lib/services/invoices";
import { Clock, Calendar, CheckCircle2, ChevronRight } from "lucide-react";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED_UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-slate-800 text-slate-300 border border-slate-700",
  ISSUED_UNPAID: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  PARTIALLY_PAID: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  PAID: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  OVERDUE: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

async function loadInvoice(id: string) {
  try {
    return await getInvoiceDetail(id);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;
  const invoice = await loadInvoice(id);
  const statusLabel = STATUS_LABELS[invoice.status] ?? invoice.status;
  const statusClass = STATUS_CLASSES[invoice.status] ?? "bg-slate-800 text-slate-300";

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        {/* Header Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">
              Customer:{" "}
              <Link
                href={`/customers/${invoice.customer.id}`}
                className="font-semibold text-white hover:text-indigo-400 underline underline-offset-2"
              >
                {invoice.customer.name}
              </Link>
              {invoice.customer.companyName ? ` (${invoice.customer.companyName})` : ""}
            </p>
          </div>
          <InvoiceActions
            invoiceId={invoice.id}
            lifecycle={invoice.lifecycle}
            outstandingPaise={invoice.outstandingPaise}
            defaultDate={todayKolkata()}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Meta details card */}
            <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-xl">
              <dl className="grid gap-4 text-xs sm:grid-cols-3">
                <div>
                  <dt className="text-slate-400 font-medium">Issue Date</dt>
                  <dd className="mt-1 font-bold text-white text-sm">{invoice.issueDate}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-medium">Due Date</dt>
                  <dd className="mt-1 font-bold text-white text-sm">{invoice.dueDate}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 font-medium">Expected Collection</dt>
                  <dd className="mt-1 font-bold text-indigo-400 text-sm">
                    {invoice.expectedCollectionDate ?? "—"}
                  </dd>
                </div>
              </dl>
              {invoice.overdueDays > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-rose-400 text-xs font-bold">
                  <Clock className="w-4 h-4" />
                  <span>
                    {invoice.overdueDays} {invoice.overdueDays === 1 ? "day" : "days"} overdue — Follow up on WhatsApp
                  </span>
                </div>
              )}
            </section>

            {/* Items Table */}
            <section className="rounded-2xl border border-slate-800 bg-[#111827] shadow-xl overflow-hidden">
              <h2 className="border-b border-slate-800 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Invoice Line Items
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800 text-xs text-left">
                  <thead className="bg-[#151e2f] text-slate-400 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-[#111827]">
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#162134]">
                        <td className="px-5 py-3.5 text-white font-medium">{item.description}</td>
                        <td className="px-4 py-3.5 text-right text-slate-400">
                          {(item.quantityMilli / 1000).toLocaleString("en-IN", { maximumFractionDigits: 3 })}
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-400">{formatINR(item.unitPricePaise)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-white">
                          {formatINR(item.lineTotalPaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Payments Record */}
            <section className="rounded-2xl border border-slate-800 bg-[#111827] shadow-xl overflow-hidden">
              <h2 className="border-b border-slate-800 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                Recorded Payments
              </h2>
              {invoice.payments.length === 0 ? (
                <p className="p-5 text-xs text-slate-500">No payments recorded yet for this invoice.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800 text-xs text-left">
                    <thead className="bg-[#151e2f] text-slate-400 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-[#111827]">
                      {invoice.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-[#162134]">
                          <td className="px-5 py-3 text-slate-300 font-medium">{payment.paymentDate}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {METHOD_LABELS[payment.method] ?? payment.method}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{payment.referenceNumber ?? "—"}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-400">
                            {formatINR(payment.amountPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Notes & Instructions */}
            {(invoice.notes || invoice.paymentInstructions) && (
              <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#111827] p-5 text-xs shadow-xl">
                {invoice.notes && (
                  <div>
                    <h2 className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">
                      Notes
                    </h2>
                    <p className="mt-1 whitespace-pre-line text-slate-300 leading-relaxed">{invoice.notes}</p>
                  </div>
                )}
                {invoice.paymentInstructions && (
                  <div>
                    <h2 className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">
                      Payment Instructions
                    </h2>
                    <p className="mt-1 whitespace-pre-line text-slate-300 leading-relaxed">
                      {invoice.paymentInstructions}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-xl">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Balance</h2>
              <dl className="mt-3 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Subtotal</dt>
                  <dd className="font-semibold text-white">{formatINR(invoice.totalPaise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Received to date</dt>
                  <dd className="font-semibold text-emerald-400">{formatINR(invoice.paidPaise)}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2.5">
                  <dt className="text-slate-300 font-bold">Outstanding</dt>
                  <dd className="font-extrabold text-base text-white">{formatINR(invoice.outstandingPaise)}</dd>
                </div>
              </dl>
            </section>
            {invoice.lifecycle === "ISSUED" && invoice.outstandingPaise > 0 && (
              <ExpectedCollectionForm
                invoiceId={invoice.id}
                initialDate={invoice.expectedCollectionDate}
                minimumDate={todayKolkata()}
              />
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
