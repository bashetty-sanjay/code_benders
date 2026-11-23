"use client";

import Link from "next/link";
import { formatINR } from "@/lib/financial/money";

export type CustomerOption = {
  id: string;
  name: string;
  companyName?: string | null;
};

type PrepareResult =
  | { status: "error"; message: string }
  | {
      status: "choose";
      amountPaise: number;
      customerQuery: string;
      options: CustomerOption[];
      issueDate: string;
      dueDate: string;
      dueDateIsDefault: boolean;
    }
  | {
      status: "new-customer";
      amountPaise: number;
      customerName: string;
      issueDate: string;
      dueDate: string;
      dueDateIsDefault: boolean;
    }
  | {
      status: "ready";
      amountPaise: number;
      customer: CustomerOption;
      summary: {
        customerName: string;
        amountPaise: number;
        issueDate: string;
        dueDate: string;
        dueDateIsDefault: boolean;
        description: string;
      };
    };

export type InvoiceCommandResult = Exclude<PrepareResult, { status: "error" }>;

type ConfirmSuccess = { invoiceId: string; invoiceNumber: string };

export type InvoiceCard =
  | {
      kind: "choose";
      amountPaise: number;
      options: CustomerOption[];
      issueDate: string;
      dueDate: string;
      dueDateIsDefault: boolean;
    }
  | {
      kind: "new-customer";
      amountPaise: number;
      customerName: string;
      issueDate: string;
      dueDate: string;
      dueDateIsDefault: boolean;
    }
  | {
      kind: "ready";
      amountPaise: number;
      customerId: string;
      customerName: string;
      issueDate: string;
      dueDate: string;
      dueDateIsDefault: boolean;
    };

export type InvoiceMessage = {
  id: string;
  text: string;
  card?: InvoiceCard;
  resolved?: boolean;
  link?: { href: string; label: string };
};

export type ConfirmBody = { customerId: string } | { newCustomerName: string };

export const FALLBACK_ERROR = "Something went wrong. Please try again.";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: T;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json || json.success !== true || json.data === undefined) {
    throw new Error(json?.error?.message ?? FALLBACK_ERROR);
  }
  return json.data;
}

/** Asks the server whether the message is an invoice command. */
export function prepareInvoiceCommand(text: string): Promise<PrepareResult> {
  return postJson<PrepareResult>("/api/assistant/actions/prepare", { message: text });
}

export function isInvoiceCommand(result: PrepareResult): result is InvoiceCommandResult {
  return result.status !== "error";
}

/** Builds the assistant message that shows an invoice command's result. */
export function invoiceReply(id: string, result: InvoiceCommandResult): InvoiceMessage {
  switch (result.status) {
    case "choose":
      return {
        id,
        text: "Which customer did you mean?",
        card: {
          kind: "choose",
          amountPaise: result.amountPaise,
          options: result.options,
          issueDate: result.issueDate,
          dueDate: result.dueDate,
          dueDateIsDefault: result.dueDateIsDefault,
        },
      };
    case "new-customer":
      return {
        id,
        text: `No customer named '${result.customerName}' exists. Create a new customer with that name?`,
        card: {
          kind: "new-customer",
          amountPaise: result.amountPaise,
          customerName: result.customerName,
          issueDate: result.issueDate,
          dueDate: result.dueDate,
          dueDateIsDefault: result.dueDateIsDefault,
        },
      };
    case "ready":
      return {
        id,
        text: "",
        card: {
          kind: "ready",
          amountPaise: result.amountPaise,
          customerId: result.customer.id,
          customerName: result.summary.customerName,
          issueDate: result.summary.issueDate,
          dueDate: result.summary.dueDate,
          dueDateIsDefault: result.summary.dueDateIsDefault,
        },
      };
  }
}

/** Builds the ready-to-save message after the user picks a customer from the list. */
export function invoiceChoiceReply(
  id: string,
  option: CustomerOption,
  amountPaise: number,
  issueDate: string,
  dueDate: string,
  dueDateIsDefault: boolean,
): InvoiceMessage {
  return {
    id,
    text: "",
    card: {
      kind: "ready",
      amountPaise,
      customerId: option.id,
      customerName: option.companyName
        ? `${option.name} (${option.companyName})`
        : option.name,
      issueDate,
      dueDate,
      dueDateIsDefault,
    },
  };
}

export function saveInvoice(
  body: ConfirmBody,
  amountPaise: number,
  dueDate: string,
): Promise<ConfirmSuccess> {
  return postJson<ConfirmSuccess>("/api/assistant/actions/confirm", {
    ...body,
    amountRupees: amountPaise / 100,
    dueDate,
  });
}

/** Renders an invoice message's text, link and confirm/cancel/choose controls. */
export function InvoiceMessageBody({
  message,
  pending,
  onChoose,
  onSave,
  onCancel,
}: {
  message: InvoiceMessage;
  pending: boolean;
  onChoose: (option: CustomerOption) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { card } = message;
  return (
    <>
      {message.text && <p>{message.text}</p>}

      {message.link && (
        <p>
          <Link
            href={message.link.href}
            className="inline-flex min-h-10 items-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 font-semibold text-indigo-400 underline decoration-indigo-400/40 underline-offset-4 hover:bg-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {message.link.label}
          </Link>
        </p>
      )}

      {card?.kind === "choose" && !message.resolved && (
        <div className="flex flex-col gap-2">
          {card.options.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={pending}
              onClick={() => onChoose(option)}
              className="min-h-11 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-left text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              <span className="font-semibold text-white">{option.name}</span>
              {option.companyName ? <span className="text-slate-400"> ({option.companyName})</span> : ""}
            </button>
          ))}
        </div>
      )}

      {card?.kind === "new-customer" && !message.resolved && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Due {card.dueDate}
            {card.dueDateIsDefault ? " using default 14-day payment term" : ""}.
          </p>
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onSave}
            className="min-h-10 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            Create customer and invoice
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="min-h-10 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          </div>
        </div>
      )}

      {card?.kind === "ready" && !message.resolved && (
        <div className="space-y-3">
          <p className="text-slate-200">
            Invoice for <strong className="text-white">{card.customerName}</strong>, <strong className="text-emerald-400">{formatINR(card.amountPaise)}</strong>
            {`, issued ${card.issueDate}, due ${card.dueDate}`}
            . It will be saved as a draft.
          </p>
          {card.dueDateIsDefault && (
            <p className="text-xs leading-5 text-slate-400">
              Used default 14-day payment term. Type <span className="font-mono text-slate-300">due YYYY-MM-DD</span> to change it.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={onSave}
              className="min-h-10 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              Confirm and save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onCancel}
              className="min-h-10 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
