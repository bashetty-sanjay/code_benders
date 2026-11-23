import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { formatINR } from "@/lib/financial/money";
import { listCustomers } from "@/lib/services/customers";
import { listInvoices, type InvoiceListFilters } from "@/lib/services/invoices";
import {
  FileText,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

type InvoicesPageProps = {
  searchParams: Promise<{
    status?: string;
    customerId?: string;
    search?: string;
    dueFrom?: string;
    dueTo?: string;
  }>;
};

const STATUS_OPTIONS: { value: NonNullable<InvoiceListFilters["status"]>; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "ISSUED_UNPAID", label: "Issued, unpaid" },
  { value: "PARTIALLY_PAID", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const rawStatus = params.status ?? "";
  const status = STATUS_OPTIONS.find((option) => option.value === rawStatus)?.value;
  const customerId = params.customerId?.trim() || undefined;
  const search = params.search?.trim() || undefined;
  const dueFrom = params.dueFrom?.trim() || undefined;
  const dueTo = params.dueTo?.trim() || undefined;

  const [invoices, customers] = await Promise.all([
    listInvoices({ status, customerId, search, dueFrom, dueTo }),
    listCustomers(),
  ]);

  const hasFilters = Boolean(status || customerId || search || dueFrom || dueTo);

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalPaise, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidPaise, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstandingPaise, 0);
  const totalOverdue = invoices
    .filter((inv) => inv.overdue)
    .reduce((sum, inv) => sum + inv.outstandingPaise, 0);

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Studio Invoices
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {invoices.length} Records
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Create, track payment status, download PDF invoices, and trigger WhatsApp chases.
            </p>
          </div>

          <Link
            href="/invoices/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Invoice</span>
          </Link>
        </div>

        {/* 4 Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">Total Billed</span>
            <div className="text-xl font-extrabold text-white mt-1">{formatINR(totalBilled)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across displayed invoices</div>
          </div>
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">Total Collected</span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">{formatINR(totalCollected)}</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-0.5">Cleared in studio bank</div>
          </div>
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">Unpaid Receivables</span>
            <div className="text-xl font-extrabold text-indigo-400 mt-1">{formatINR(totalOutstanding)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting settlement</div>
          </div>
          <div className="bg-[#111827] rounded-2xl p-4 border border-rose-900/50 bg-rose-950/20 shadow-xl">
            <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Overdue Amount
            </span>
            <div className="text-xl font-extrabold text-rose-400 mt-1">{formatINR(totalOverdue)}</div>
            <div className="text-[11px] text-rose-300 font-medium mt-0.5">Requires immediate chase</div>
          </div>
        </section>

        {/* Filters */}
        <form
          method="GET"
          action="/invoices"
          className="bg-[#111827] p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="block text-xs font-semibold text-slate-300 mb-1">
              Search Invoice
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="search"
                name="search"
                type="search"
                defaultValue={search ?? ""}
                placeholder="Invoice number or client name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-[#172133] text-white placeholder-slate-400 focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="min-w-[140px]">
            <label htmlFor="status" className="block text-xs font-semibold text-slate-300 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status ?? ""}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-[#172133] text-white focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[160px]">
            <label htmlFor="customerId" className="block text-xs font-semibold text-slate-300 mb-1">
              Client
            </label>
            <select
              id="customerId"
              name="customerId"
              defaultValue={customerId ?? ""}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-[#172133] text-white focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Clients</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-colors"
            >
              Apply Filter
            </button>
            {hasFilters && (
              <Link
                href="/invoices"
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-[#172133] hover:bg-[#1d293f] text-slate-300 text-xs font-semibold transition-colors"
              >
                Reset
              </Link>
            )}
          </div>
        </form>

        {/* Invoice Table */}
        <section className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No invoices match your selection.</p>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or create a new invoice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                <thead className="bg-[#151e2f] text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Invoice #</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Issued Date</th>
                    <th className="px-4 py-3">Due Date & Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#111827]">
                  {invoices.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    const isOverdue = inv.overdue;

                    return (
                      <tr key={inv.id} className="hover:bg-[#162134] transition-colors group">
                        <td className="px-5 py-3.5 font-mono font-bold text-indigo-400">
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="hover:underline flex items-center gap-1"
                          >
                            <span>{inv.invoiceNumber}</span>
                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{inv.customer.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {inv.customer.companyName || "Direct"}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-300">{inv.issueDate}</td>

                        <td className="px-4 py-3.5">
                          <div className="text-slate-200 font-medium">{inv.dueDate}</div>
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {inv.overdueDays}d overdue
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right font-medium text-slate-300">
                          {formatINR(inv.totalPaise)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`font-bold ${
                              inv.outstandingPaise > 0
                                ? isOverdue
                                  ? "text-rose-400"
                                  : "text-white"
                                : "text-emerald-400"
                            }`}
                          >
                            {formatINR(inv.outstandingPaise)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              isPaid
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : isOverdue
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : inv.status === "PARTIALLY_PAID"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : inv.status === "DRAFT"
                                ? "bg-slate-700 text-slate-300"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {STATUS_LABELS[inv.status] ?? inv.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.outstandingPaise > 0 && inv.customer.phone && (
                              <a
                                href={`https://wa.me/${inv.customer.phone.replace(
                                  /\D/g,
                                  "",
                                )}?text=${encodeURIComponent(
                                  `Hi ${inv.customer.name}, gently reminding you regarding invoice ${inv.invoiceNumber} for ${formatINR(
                                    inv.outstandingPaise,
                                  )}. Please let us know when payment is transferred. Thanks!`,
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chase via WhatsApp"
                                className="p-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow-sm transition-colors"
                            >
                              Manage
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
