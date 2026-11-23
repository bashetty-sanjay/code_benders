"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { BILL_CATEGORIES, BILL_RECURRENCES } from "@/lib/schemas/bills";

type Mode = "create" | "edit";

interface FormValues {
  title: string;
  category: string;
  amountRupees: string;
  firstDueDate: string;
  recurrence: string;
  notes: string;
}

type FieldName = keyof FormValues;

export type BillFormInitial = Partial<FormValues>;

interface BillFormProps {
  mode: Mode;
  billId?: string;
  initial?: BillFormInitial;
}

interface ApiResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
    fields?: Partial<Record<FieldName, string[]>>;
  };
}

const EMPTY_VALUES: FormValues = {
  title: "",
  category: "Other",
  amountRupees: "",
  firstDueDate: "",
  recurrence: "NONE",
  notes: "",
};

const RECURRENCE_LABELS: Record<string, string> = {
  NONE: "One-time payment",
  MONTHLY: "Monthly recurring",
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition";
const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-300";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return <p className="mt-1.5 text-xs font-medium text-rose-400">{messages[0]}</p>;
}

export function BillForm({ mode, billId, initial }: BillFormProps) {
  const [values, setValues] = useState<FormValues>({ ...EMPTY_VALUES, ...initial });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, string[]>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function inputProps(name: FieldName) {
    return {
      id: name,
      name,
      value: values[name],
      onChange: (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
      ) => update(name, event.target.value),
      "aria-invalid": fieldErrors[name] && fieldErrors[name]!.length > 0 ? true : undefined,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const body = {
      title: values.title,
      category: values.category,
      amountRupees: values.amountRupees.trim() === "" ? null : Number(values.amountRupees),
      firstDueDate: values.firstDueDate,
      recurrence: values.recurrence,
      notes: values.notes,
    };

    try {
      const response = await fetch(mode === "create" ? "/api/bills" : `/api/bills/${billId}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let json: ApiResponse | null = null;
      try {
        json = (await response.json()) as ApiResponse;
      } catch {
        json = null;
      }

      if (!response.ok || !json?.success) {
        if (json?.error?.fields) {
          setFieldErrors(json.error.fields);
        }
        setFormError(json?.error?.message ?? "Something went wrong. Please try again.");
        return;
      }

      window.location.assign("/bills");
    } catch {
      setFormError("Could not reach the app. Check that it is running and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="title" className={labelClass}>
          Bill title *
        </label>
        <input type="text" placeholder="e.g. AWS Cloud Hosting, Office Rent, Adobe CC" className={inputClass} {...inputProps("title")} />
        <FieldError messages={fieldErrors.title} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={labelClass}>
            Category *
          </label>
          <select className={inputClass} {...inputProps("category")}>
            {BILL_CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-slate-900 text-slate-100">
                {category}
              </option>
            ))}
          </select>
          <FieldError messages={fieldErrors.category} />
        </div>

        <div>
          <label htmlFor="amountRupees" className={labelClass}>
            Amount in ₹ *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            placeholder="0.00"
            className={inputClass}
            {...inputProps("amountRupees")}
          />
          <FieldError messages={fieldErrors.amountRupees} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstDueDate" className={labelClass}>
            First / Next due date *
          </label>
          <input type="date" className={inputClass} {...inputProps("firstDueDate")} />
          <FieldError messages={fieldErrors.firstDueDate} />
        </div>

        <div>
          <label htmlFor="recurrence" className={labelClass}>
            Schedule recurrence *
          </label>
          <select className={inputClass} {...inputProps("recurrence")}>
            {BILL_RECURRENCES.map((recurrence) => (
              <option key={recurrence} value={recurrence} className="bg-slate-900 text-slate-100">
                {RECURRENCE_LABELS[recurrence]}
              </option>
            ))}
          </select>
          <FieldError messages={fieldErrors.recurrence} />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes / Account details
        </label>
        <textarea rows={3} placeholder="Account number, vendor UPI ID, auto-debit notes..." className={inputClass} {...inputProps("notes")} />
        <FieldError messages={fieldErrors.notes} />
      </div>

      {formError && (
        <div role="alert" className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-medium text-rose-400">
          {formError}
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60 transition"
        >
          {pending ? "Saving..." : mode === "create" ? "Save bill & sync forecast" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
