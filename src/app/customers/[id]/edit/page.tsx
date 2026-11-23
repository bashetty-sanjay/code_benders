import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomerDetail } from "@/lib/services/customers";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof getCustomerDetail>>;
  try {
    detail = await getCustomerDetail(id);
  } catch {
    notFound();
  }
  const { customer } = detail;

  return (
    <AppShell>
      <div className="mb-6">
        <Link href={`/customers/${customer.id}`} className="text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors">
          ← Back to {customer.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Edit Client Details</h1>
        <p className="mt-1 text-sm text-slate-400">
          Update contact details, company name, or billing address.
        </p>
      </div>
      <div className="max-w-2xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-md backdrop-blur">
        <CustomerForm
          mode="edit"
          customerId={customer.id}
          initial={{
            name: customer.name,
            companyName: customer.companyName ?? "",
            email: customer.email ?? "",
            phone: customer.phone ?? "",
            address: customer.address ?? "",
            notes: customer.notes ?? "",
          }}
        />
      </div>
    </AppShell>
  );
}
