"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { formatINR } from "@/lib/financial/money";

type Mode = "create" | "edit";

export interface CustomerOption {
  id: string;
  name: string;
}

export interface InvoiceFormItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

export interface InvoiceFormInitial {
  customerId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  expectedCollectionDate: string;
  notes: string;
  paymentInstructions: string;
  items: InvoiceFormItem[];
}

interface InvoiceFormProps {
  mode: Mode;
  customers: CustomerOption[];
  defaultDate: string;
  initial?: Partial<InvoiceFormInitial>;
  /** Preselected customer for create mode; ignored when absent. */
  initialCustomerId?: string;
  invoiceId?: string;
}

type HeaderValues = Omit<InvoiceFormInitial, "items">;
type HeaderFieldName = keyof HeaderValues;
type FieldErrors = Partial<Record<string, string[]>>;

interface EditableItem extends InvoiceFormItem {
  key: number;
}

interface ApiResponse {
  success: boolean;
  data?: { id?: string };
  error?: {
    code: string;
    message: string;
    fields?: FieldErrors;
  };
}

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-700 bg-[#172133] px-3 py-2 text-xs text-white placeholder-slate-400 focus:bg-[#1d293f] focus:outline-none focus:ring-2 focus:ring-indigo-500";
const labelClass = "block text-xs font-semibold text-slate-300";

let itemKeySeed = 0;

function newItem(partial?: Partial<InvoiceFormItem>): EditableItem {
  itemKeySeed += 1;
  return { key: itemKeySeed, description: "", quantity: "1", unitPrice: "", ...partial };
}

/** Line amount in paise, or null while the row is incomplete or invalid. */
function linePaise(quantity: string, unitPrice: string): number | null {
  if (quantity.trim() === "" || unitPrice.trim() === "") {
    return null;
  }
  const q = Number(quantity);
  const p = Number(unitPrice);
  if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p < 0) {
    return null;
  }
  const paise = Math.round(q * p * 100);
  return Number.isSafeInteger(paise) ? paise : null;
}

function formatLine(quantity: string, unitPrice: string): string {
  const paise = linePaise(quantity, unitPrice);
  return paise === null ? "—" : formatINR(paise);
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}

export function InvoiceForm({
  mode,
  customers,
  defaultDate,
  initial,
  initialCustomerId,
  invoiceId,
}: InvoiceFormProps) {
  const [values, setValues] = useState<HeaderValues>({
    customerId: initial?.customerId ?? initialCustomerId ?? "",
    invoiceNumber: initial?.invoiceNumber ?? "",
    issueDate: initial?.issueDate ?? defaultDate,
    dueDate: initial?.dueDate ?? defaultDate,
    expectedCollectionDate: initial?.expectedCollectionDate ?? "",
    notes: initial?.notes ?? "",
    paymentInstructions: initial?.paymentInstructions ?? "",
  });
  const [items, setItems] = useState<EditableItem[]>(() =>
    initial?.items && initial.items.length > 0
      ? initial.items.map((item) => newItem(item))
      : [newItem()],
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function update(name: HeaderFieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function updateItem(key: number, field: keyof InvoiceFormItem, value: string) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  }

  function removeItem(key: number) {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.key !== key)));
  }

  function addItem() {
    setItems((prev) => [...prev, newItem()]);
  }

  function headerProps(name: HeaderFieldName) {
    return {
      id: name,
      name,
      value: values[name],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        update(name, event.target.value),
      "aria-invalid": fieldErrors[name] && fieldErrors[name]!.length > 0 ? true : undefined,
    };
  }

  let grandPaise = 0;
  for (const item of items) {
    grandPaise += linePaise(item.quantity, item.unitPrice) ?? 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const body = {
      // Edit mode never sends customerId: an invoice keeps its customer once created.
      customerId: mode === "create" ? values.customerId : undefined,
      invoiceNumber: values.invoiceNumber.trim() || undefined,
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      expectedCollectionDate: values.expectedCollectionDate || null,
      notes: values.notes.trim() || (mode === "edit" ? null : undefined),
      paymentInstructions: values.paymentInstructions.trim() || (mode === "edit" ? null : undefined),
      items: items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPriceRupees: Number(item.unitPrice),
      })),
    };

    try {
      const response =
        mode === "create"
          ? await fetch("/api/invoices", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            })
          : await fetch(`/api/invoices/${invoiceId}`, {
              method: "PATCH",
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

      if (mode === "create") {
        const id = json.data?.id;
        window.location.assign(id ? `/invoices/${id}` : "/invoices");
      } else {
        window.location.assign(`/invoices/${invoiceId}`);
      }
    } catch {
      setFormError("Could not reach the app. Check that it is running and try again.");
    } finally {
      setPending(false);
    }
  }

  if (customers.length === 0 && mode === "create") {
    return (
      <p className="text-sm text-gray-600">
        Add a customer before creating an invoice.{" "}
        <Link href="/customers/new" className="font-medium text-gray-900 underline">
          New customer
        </Link>
      </p>
    );
  }

  function setDueInDays(days: number) {
    const base = values.issueDate || defaultDate;
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    update("dueDate", d.toISOString().slice(0, 10));
  }

  function applyPresetItem(description: string, price: string) {
    if (items.length === 1 && items[0].description === "" && items[0].unitPrice === "") {
      setItems([{ key: items[0].key, description, quantity: "1", unitPrice: price }]);
    } else {
      setItems((prev) => [...prev, newItem({ description, quantity: "1", unitPrice: price })]);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="customerId" className={labelClass}>
            Customer *
          </label>
          <select className={inputClass} disabled={mode === "edit"} {...headerProps("customerId")}>
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <FieldError messages={fieldErrors.customerId} />
        </div>

        <div>
          <label htmlFor="issueDate" className={labelClass}>
            Issue date *
          </label>
          <input type="date" className={inputClass} {...headerProps("issueDate")} />
          <FieldError messages={fieldErrors.issueDate} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="dueDate" className={labelClass}>
              Due date *
            </label>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span>Quick:</span>
              <button
                type="button"
                onClick={() => setDueInDays(7)}
                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                +7d
              </button>
              <button
                type="button"
                onClick={() => setDueInDays(15)}
                className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold"
              >
                +15d
              </button>
              <button
                type="button"
                onClick={() => setDueInDays(30)}
                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                +30d
              </button>
            </div>
          </div>
          <input type="date" className={inputClass} {...headerProps("dueDate")} />
          <FieldError messages={fieldErrors.dueDate} />
        </div>

        <div>
          <label htmlFor="expectedCollectionDate" className={labelClass}>
            Expected collection date
          </label>
          <input type="date" className={inputClass} {...headerProps("expectedCollectionDate")} />
          <FieldError messages={fieldErrors.expectedCollectionDate} />
        </div>

        <div>
          <label htmlFor="invoiceNumber" className={labelClass}>
            Invoice number
          </label>
          <input
            type="text"
            placeholder="Leave blank to auto-number"
            className={inputClass}
            {...headerProps("invoiceNumber")}
          />
          <FieldError messages={fieldErrors.invoiceNumber} />
        </div>
      </div>

      {/* Quick Service Presets for Freelancers */}
      <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/40 p-3 text-xs">
        <span className="font-semibold text-indigo-300 block mb-1.5">
          ⚡ Quick 1-Click Service Presets (Solo Studio):
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyPresetItem("Brand Identity & Logo Design", "45000")}
            className="px-2.5 py-1 rounded-lg bg-[#172133] border border-indigo-500/30 hover:bg-[#1e2a40] text-indigo-200 text-xs font-medium transition-colors"
          >
            + Brand Identity (₹45,000)
          </button>
          <button
            type="button"
            onClick={() => applyPresetItem("UI/UX Mobile App Design Sprint", "60000")}
            className="px-2.5 py-1 rounded-lg bg-[#172133] border border-indigo-500/30 hover:bg-[#1e2a40] text-indigo-200 text-xs font-medium transition-colors"
          >
            + UI/UX Sprint (₹60,000)
          </button>
          <button
            type="button"
            onClick={() => applyPresetItem("Monthly Creative Retainer", "35000")}
            className="px-2.5 py-1 rounded-lg bg-[#172133] border border-indigo-500/30 hover:bg-[#1e2a40] text-indigo-200 text-xs font-medium transition-colors"
          >
            + Monthly Retainer (₹35,000)
          </button>
          <button
            type="button"
            onClick={() => applyPresetItem("Landing Page Web Design", "25000")}
            className="px-2.5 py-1 rounded-lg bg-[#172133] border border-indigo-500/30 hover:bg-[#1e2a40] text-indigo-200 text-xs font-medium transition-colors"
          >
            + Landing Page (₹25,000)
          </button>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-xs font-bold text-slate-300">Line items *</legend>
        {items.map((item, index) => {
          const n = index + 1;
          return (
            <div key={item.key} className="grid gap-2 rounded-xl border border-slate-800 bg-[#131c2e] p-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label htmlFor={`item-${item.key}-description`} className="block text-xs font-medium text-slate-300">
                  Item {n} description
                </label>
                <input
                  id={`item-${item.key}-description`}
                  type="text"
                  value={item.description}
                  onChange={(event) => updateItem(item.key, "description", event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`item-${item.key}-quantity`} className="block text-xs font-medium text-slate-300">
                  Quantity
                </label>
                <input
                  id={`item-${item.key}-quantity`}
                  type="number"
                  step="0.001"
                  min="0.001"
                  inputMode="decimal"
                  value={item.quantity}
                  onChange={(event) => updateItem(item.key, "quantity", event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`item-${item.key}-unitPrice`} className="block text-xs font-medium text-slate-300">
                  Unit price ₹
                </label>
                <input
                  id={`item-${item.key}-unitPrice`}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(item.key, "unitPrice", event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col justify-end sm:col-span-2">
                <p className="text-xs font-medium text-slate-400">Line total</p>
                <p className="mt-1 py-2 text-sm font-bold text-white">{formatLine(item.quantity, item.unitPrice)}</p>
              </div>
              <div className="flex items-end sm:col-span-1">
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  disabled={items.length <= 1}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
        <FieldError messages={fieldErrors.items} />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={addItem}
            className="rounded-xl border border-indigo-500/30 bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 transition-colors"
          >
            + Add Line Item
          </button>
          <p className="text-sm font-extrabold text-white">Invoice total: {formatINR(grandPaise)}</p>
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea rows={3} className={inputClass} {...headerProps("notes")} />
        <FieldError messages={fieldErrors.notes} />
      </div>

      <div>
        <label htmlFor="paymentInstructions" className={labelClass}>
          Payment instructions
        </label>
        <textarea
          rows={3}
          placeholder="e.g. UPI: studio@bank, Bank: ..."
          className={inputClass}
          {...headerProps("paymentInstructions")}
        />
        <FieldError messages={fieldErrors.paymentInstructions} />
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-60"
        >
          {pending ? "Saving..." : mode === "create" ? "Save draft" : "Save changes"}
        </button>
        <Link href={mode === "edit" && invoiceId ? `/invoices/${invoiceId}` : "/invoices"} className="text-xs text-slate-400 hover:text-white">
          Cancel
        </Link>
      </div>
    </form>
  );
}
