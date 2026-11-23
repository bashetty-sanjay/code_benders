import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { BillForm } from "@/components/bills/bill-form";
import { ArchiveBillButton } from "@/components/bills/archive-bill-button";
import { todayKolkata } from "@/lib/financial/dates";
import { getBillDetail } from "@/lib/services/bills";
import { ServiceError } from "@/lib/services/errors";

export const dynamic = "force-dynamic";

type EditBillPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditBillPage({ params }: EditBillPageProps) {
  const { id } = await params;
  const today = todayKolkata();
  const bill = await getBillDetail(id, { from: today, to: today }).catch((error: unknown) => {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  });

  return (
    <AppShell>
      <div className="mb-6">
        <Link href="/bills" className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
          ← Back to bills
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Edit Bill</h1>
        <p className="mt-1 text-sm text-slate-400">{bill.title}</p>
      </div>

      <div className="max-w-xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-md backdrop-blur">
        <BillForm
          mode="edit"
          billId={bill.id}
          initial={{
            title: bill.title,
            category: bill.category,
            amountRupees: (bill.defaultAmountPaise / 100).toFixed(2),
            firstDueDate: bill.firstDueDate,
            recurrence: bill.recurrence,
            notes: bill.notes ?? "",
          }}
        />
      </div>

      <div className="mt-6 max-w-xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-md backdrop-blur">
        <h2 className="text-base font-semibold text-white">Archive Bill</h2>
        {bill.archivedOn !== null ? (
          <p className="mt-2 text-sm text-slate-400">
            This bill was archived on {bill.archivedOn}. Its historical paid records remain preserved in your financial ledgers.
          </p>
        ) : (
          <div className="mt-2">
            <ArchiveBillButton billId={bill.id} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
