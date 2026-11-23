"use client";

import { useEffect, useState } from "react";

interface ReminderPanelProps {
  invoiceId: string;
  outstandingPaise: number;
}

interface ReminderResponse {
  success?: boolean;
  text?: string | null;
  data?: { text?: string | null };
  error?: { message?: string };
}

export function ReminderPanel({ invoiceId, outstandingPaise }: ReminderPanelProps) {
  const [text, setText] = useState("");
  const [hasText, setHasText] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/reminder`);
        const json = (await response.json()) as ReminderResponse;
        if (cancelled) return;
        if (!response.ok) {
          setLoadError(json.error?.message ?? "Could not load the reminder draft.");
          return;
        }
        const reminderText = json.data?.text ?? json.text ?? null;
        setHasText(reminderText !== null);
        setText(reminderText ?? "");
      } catch {
        if (!cancelled) {
          setLoadError("Could not load the reminder draft. Check that the app is running.");
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [invoiceId, outstandingPaise]);

  async function handleCopy() {
    setCopyMessage(null);
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Copied to clipboard.");
    } catch {
      setCopyMessage("Could not copy automatically. Select the text and copy it manually.");
    }
  }

  return (
    <section id="payment-reminder" className="scroll-mt-6 rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-xl">
      <h2 className="text-sm font-bold text-white">Payment Reminder Draft</h2>

      {!loaded && <p className="mt-2 text-xs text-slate-400">Loading reminder...</p>}

      {loaded && loadError && (
        <p role="alert" className="mt-2 text-xs text-red-400">
          {loadError}
        </p>
      )}

      {loaded && !loadError && !hasText && (
        <p className="mt-2 text-xs text-slate-400">Nothing is outstanding on this invoice.</p>
      )}

      {loaded && !loadError && hasText && (
        <div className="mt-2 space-y-3">
          <p className="text-xs text-slate-400">
            This is a pre-drafted reminder tailored for this invoice. Click to copy or launch directly in WhatsApp.
          </p>
          <label htmlFor="reminder-text" className="sr-only">
            Reminder text
          </label>
          <textarea
            id="reminder-text"
            rows={5}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-[#172133] p-3 text-xs text-white shadow-sm focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Copy Draft
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-colors"
            >
              Send via WhatsApp
            </a>
            {copyMessage && (
              <p role="status" className="text-xs font-medium text-emerald-400">
                {copyMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
