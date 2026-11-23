"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ArchiveButtonProps {
  customerId: string;
  archived: boolean;
}

interface ApiResponse {
  success: boolean;
  error?: { code: string; message: string };
}

export function ArchiveButton({ customerId, archived }: ArchiveButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleArchive() {
    if (!window.confirm("Archive this customer? Their invoices and payment history will be retained.")) {
      return;
    }
    setPending(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch(`/api/customers/${customerId}/archive`, { method: "POST" });

      let json: ApiResponse | null = null;
      try {
        json = (await response.json()) as ApiResponse;
      } catch {
        json = null;
      }

      if (!response.ok || !json?.success) {
        setIsError(true);
        setMessage(json?.error?.message ?? "Could not archive the customer. Please try again.");
        return;
      }

      setMessage("Customer archived successfully.");
      router.refresh();
    } catch {
      setIsError(true);
      setMessage("Could not reach the app. Check that it is running and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleArchive}
        disabled={pending || archived}
        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 disabled:opacity-60 transition"
      >
        {archived ? "Archived" : pending ? "Archiving..." : "Archive client"}
      </button>
      {message && (
        <p role={isError ? "alert" : "status"} className={`text-xs font-medium ${isError ? "text-rose-400" : "text-emerald-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
