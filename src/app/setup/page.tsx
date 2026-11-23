import { redirect } from "next/navigation";
import { BusinessForm } from "@/components/business/business-form";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const existing = await prisma.businessProfile.findUnique({
    where: { id: "local-business" },
    select: { id: true },
  });

  if (existing) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0b0f17] p-6 text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg shadow-lg mb-3">
            C
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Setup Your Business Profile</h1>
          <p className="mt-1 text-sm text-slate-400">
            Configure your enterprise details for invoices, default payment terms, and UPI information.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl backdrop-blur">
          <BusinessForm mode="create" />
        </div>
      </div>
    </main>
  );
}
