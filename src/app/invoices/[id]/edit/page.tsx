import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { InvoiceForm, type CustomerOption } from "@/components/invoices/invoice-form";
import { todayKolkata } from "@/lib/financial/dates";
import { ServiceError } from "@/lib/services/errors";
import { listCustomers } from "@/lib/services/customers";
import { getInvoiceDetail } from "@/lib/services/invoices";

type EditInvoicePageProps = {
  params: Promise<{ id: string }>;
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

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;
  const invoice = await loadInvoice(id);

  if (invoice.lifecycle !== "DRAFT") {
    return (
      <AppShell>
        <div className="mb-6">
          <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
            ← Back to invoice
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{invoice.invoiceNumber}</h1>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-md backdrop-blur">
          <p className="font-semibold text-rose-400">Issued invoices cannot be modified.</p>
          <p className="mt-1 text-sm text-slate-400">
            This invoice has already been issued to the client. You can view its payment status or record collections.
          </p>
          <Link
            href={`/invoices/${invoice.id}`}
            className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition"
          >
            View invoice details →
          </Link>
        </div>
      </AppShell>
    );
  }

  const customers: CustomerOption[] = (await listCustomers()).map((customer) => ({
    id: customer.id,
    name: customer.name,
  }));
  if (!customers.some((customer) => customer.id === invoice.customer.id)) {
    customers.push({ id: invoice.customer.id, name: invoice.customer.name });
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Link href={`/invoices/${invoice.id}`} className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
          ← Back to draft
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Edit Draft {invoice.invoiceNumber}</h1>
        <p className="mt-1 text-sm text-slate-400">
          Modify line items, due dates, or payment instructions prior to issuing.
        </p>
      </div>
      <div className="max-w-3xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-md backdrop-blur">
        <InvoiceForm
          mode="edit"
          invoiceId={invoice.id}
          customers={customers}
          defaultDate={todayKolkata()}
          initial={{
            customerId: invoice.customer.id,
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            expectedCollectionDate: invoice.expectedCollectionDate ?? "",
            notes: invoice.notes ?? "",
            paymentInstructions: invoice.paymentInstructions ?? "",
            items: invoice.items.map((item) => ({
              description: item.description,
              quantity: String(item.quantityMilli / 1000),
              unitPrice: (item.unitPricePaise / 100).toFixed(2),
            })),
          }}
        />
      </div>
    </AppShell>
  );
}
