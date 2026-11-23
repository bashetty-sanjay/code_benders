import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { formatINR } from "@/lib/financial/money";
import { listCustomers } from "@/lib/services/customers";
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

type CustomersPageProps = {
  searchParams: Promise<{ search?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { search } = await searchParams;
  const term = search?.trim() ?? "";
  const customers = await listCustomers({ search: term || undefined });

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + (c.summary?.outstandingPaise ?? 0),
    0,
  );
  const totalOverdue = customers.reduce(
    (sum, c) => sum + (c.summary?.overdueOutstandingPaise ?? 0),
    0,
  );
  const clientsWithOverdue = customers.filter(
    (c) => (c.summary?.overdueOutstandingPaise ?? 0) > 0,
  ).length;

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Customer & Client Directory
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {customers.length} Accounts
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Maintain client contacts, view individual payment histories, and track unpaid balances.
            </p>
          </div>

          <Link
            href="/customers/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </Link>
        </div>

        {/* 3 Metric Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">Total Clients</span>
            <div className="text-xl font-extrabold text-white mt-1">{customers.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Active studio relationships</div>
          </div>
          <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 shadow-xl">
            <span className="text-xs text-slate-400 font-medium">Total Balance Owed</span>
            <div className="text-xl font-extrabold text-indigo-400 mt-1">{formatINR(totalOutstanding)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all client accounts</div>
          </div>
          <div className="bg-[#111827] rounded-2xl p-4 border border-rose-900/50 bg-rose-950/20 shadow-xl">
            <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Clients Overdue
            </span>
            <div className="text-xl font-extrabold text-rose-400 mt-1">{formatINR(totalOverdue)}</div>
            <div className="text-[11px] text-rose-300 font-medium mt-0.5">
              {clientsWithOverdue} client{clientsWithOverdue === 1 ? "" : "s"} require chase
            </div>
          </div>
        </section>

        {/* Search */}
        <form method="GET" action="/customers" className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={term}
              placeholder="Search by client name, company, email..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-700 bg-[#172133] text-white placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors"
          >
            Search
          </button>
          {term && (
            <Link
              href="/customers"
              className="px-3 py-2 rounded-xl border border-slate-700 bg-[#172133] text-slate-300 text-xs font-semibold hover:bg-slate-800"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Customer Table */}
        <section className="bg-[#111827] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          {customers.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">
                {term ? `No customers match "${term}".` : "No customers yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                <thead className="bg-[#151e2f] text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Client Name</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3 text-right">Overdue</th>
                    <th className="px-4 py-3 text-right">Open Invoices</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-[#111827]">
                  {customers.map((c) => {
                    const hasOverdue = (c.summary?.overdueOutstandingPaise ?? 0) > 0;
                    return (
                      <tr key={c.id} className="hover:bg-[#162134] transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <Link
                                href={`/customers/${c.id}`}
                                className="font-semibold text-white hover:text-indigo-400 flex items-center gap-1"
                              >
                                <span>{c.name}</span>
                                {c.archivedAt && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                    Archived
                                  </span>
                                )}
                              </Link>
                              <div className="text-[11px] text-slate-400">
                                {c.email || c.phone || "No contact info"}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-300">{c.companyName || "—"}</td>

                        <td className="px-4 py-3.5 text-right font-bold text-white">
                          {formatINR(c.summary?.outstandingPaise ?? 0)}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`font-bold ${
                              hasOverdue ? "text-rose-400" : "text-slate-500"
                            }`}
                          >
                            {formatINR(c.summary?.overdueOutstandingPaise ?? 0)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right text-slate-300 font-medium">
                          {c.summary?.openInvoiceCount ?? 0}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/invoices/new?customerId=${c.id}`}
                              className="px-2.5 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold transition-colors"
                            >
                              + Invoice
                            </Link>
                            <Link
                              href={`/customers/${c.id}`}
                              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shadow-sm transition-colors"
                            >
                              Ledger
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
