import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { BusinessForm, type BusinessFormInitial } from "@/components/business/business-form";
import { prisma } from "@/lib/db/client";
import { Settings, ShieldCheck, Sparkles, Building2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await prisma.businessProfile.findUnique({
    where: { id: "local-business" },
  });

  if (!profile) {
    redirect("/setup");
  }

  const initial: BusinessFormInitial = {
    businessName: profile.businessName,
    ownerName: profile.ownerName,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    openingCashRupees: (profile.openingCashPaise / 100).toFixed(2),
    openingCashDate: profile.openingCashDate,
    paymentInstructions: profile.paymentInstructions ?? "",
  };

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8 max-w-4xl">
        {/* Header */}
        <div className="pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Studio & Profile Settings
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Configuration
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your graphic design studio name, owner contacts, bank payment instructions, and opening cash snapshot.
          </p>
        </div>

        {/* Local-First Architecture Guarantee */}
        <div className="rounded-2xl bg-indigo-950/40 border border-indigo-900/60 p-4 sm:p-5 text-indigo-200 flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <strong className="text-sm font-bold text-white block">
              100% Local-First Privacy Guarantee
            </strong>
            <p className="text-indigo-200/90 mt-0.5 leading-relaxed">
              Your customer invoices, bill data, and bank transactions are stored exclusively inside your local SQLite database (<code className="font-mono bg-[#172133] px-1.5 py-0.5 rounded border border-indigo-900">dev.db</code>).
              No financial data is uploaded to any remote server without explicit consent.
            </p>
          </div>
        </div>

        {/* Business Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#111827] p-6 shadow-xl">
          <BusinessForm mode="edit" initial={initial} />
        </div>
      </div>
    </AppShell>
  );
}
