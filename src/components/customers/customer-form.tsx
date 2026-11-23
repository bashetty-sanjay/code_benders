"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

type Mode = "create" | "edit";

interface FormValues {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

type FieldName = keyof FormValues;

export type CustomerFormInitial = Partial<FormValues>;

interface CustomerFormProps {
  mode: Mode;
  customerId?: string;
  initial?: CustomerFormInitial;
}

interface ApiResponse {
  success: boolean;
  data?: { id: string };
  error?: {
    code: string;
    message: string;
    fields?: Partial<Record<FieldName, string[]>>;
  };
}

const EMPTY_VALUES: FormValues = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
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

export function CustomerForm({ mode, customerId, initial }: CustomerFormProps) {
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
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        update(name, event.target.value),
      "aria-invalid": fieldErrors[name] && fieldErrors[name]!.length > 0 ? true : undefined,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const url = mode === "create" ? "/api/customers" : `/api/customers/${customerId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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

      const id = mode === "create" ? json.data?.id : customerId;
      if (!id) {
        setFormError("Saved, but the customer could not be opened. Check the customers list.");
        return;
      }
      window.location.assign(`/customers/${id}`);
    } catch {
      setFormError("Could not reach the app. Check that it is running and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="name" className={labelClass}>
          Client / Contact name *
        </label>
        <input type="text" placeholder="e.g. Rahul Sharma" className={inputClass} {...inputProps("name")} />
        <FieldError messages={fieldErrors.name} />
      </div>

      <div>
        <label htmlFor="companyName" className={labelClass}>
          Company / Business name
        </label>
        <input type="text" placeholder="e.g. Acme Studio Pvt Ltd" className={inputClass} {...inputProps("companyName")} />
        <FieldError messages={fieldErrors.companyName} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelClass}>
            Email address
          </label>
          <input type="email" placeholder="rahul@acmestudio.in" className={inputClass} {...inputProps("email")} />
          <FieldError messages={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone / WhatsApp Number
          </label>
          <input type="tel" placeholder="+91 98765 43210" className={inputClass} {...inputProps("phone")} />
          <p className="mt-1 text-[11px] text-slate-500">Used for 1-click WhatsApp payment reminders.</p>
          <FieldError messages={fieldErrors.phone} />
        </div>
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>
          Billing address
        </label>
        <textarea rows={2} placeholder="Suite 401, Cyber Heights, Indiranagar, Bengaluru" className={inputClass} {...inputProps("address")} />
        <FieldError messages={fieldErrors.address} />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Internal client notes
        </label>
        <textarea rows={3} placeholder="Payment term preferences, key stakeholders, payment cycles..." className={inputClass} {...inputProps("notes")} />
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
          {pending ? "Saving client..." : mode === "create" ? "Create client record" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
