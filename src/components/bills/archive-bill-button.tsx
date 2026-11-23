"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ArchiveBillButtonProps {
  billId: string;
}

interface ApiResponse {
  success: boolean;
  error?: { code: string; message: string };
}

export function ArchiveBillButton({ billId }: ArchiveBillButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const confirmed = window.confirm(
      "Archive this bill? Future occurrences will stop. Paid history is preserved.",
    );
    if (!confirmed) {
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/bills/${encodeURIComponent(billId)}/archive`, {
        method: "POST",
      });

      let json: ApiResponse | null = null;
      try {
        json = (await response.json()) as ApiResponse;
      } catch {
        json = null;
      }

      if (!response.ok || !json?.success) {
        setError(json?.error?.message ?? "The bill could not be archived. Please try again.");
        return;
      }

      router.refresh();
    } catch {
      setError("Could not reach the app. Check that it is running and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-400">
        Archiving stops future recurring occurrences. Paid history is kept in records.
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 disabled:opacity-60 transition"
      >
        {pending ? "Archiving..." : "Archive bill"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
