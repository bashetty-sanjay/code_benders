"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ArrowUp,
  Bot,
  FilePlus2,
  MessageSquarePlus,
  ShieldCheck,
  Sparkles,
  UserRound,
  WifiOff,
} from "lucide-react";
import type { AssistantStatus } from "@/lib/services/assistant";
import { parsePendingInvoiceReply } from "@/lib/assistant/invoice-command";
import {
  FALLBACK_ERROR,
  InvoiceMessageBody,
  invoiceChoiceReply,
  invoiceReply,
  isInvoiceCommand,
  prepareInvoiceCommand,
  saveInvoice,
  type CustomerOption,
  type InvoiceMessage,
} from "@/components/assistant/invoice-command-chat";

type QueryResult = { answer: string; factsUsed: string[] };
type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  error?: { message?: string };
};
type ChatMessage = {
  kind: "chat";
  id: string;
  role: "user" | "assistant";
  content: string;
  factsUsed?: string[];
  tone?: "default" | "error";
};
type InvoiceEntry = { kind: "invoice"; message: InvoiceMessage };
type Entry = ChatMessage | InvoiceEntry;

const SUGGESTIONS = [
  { label: "Check money owed", prompt: "How much money do customers owe me?" },
  { label: "Review overdue invoices", prompt: "Which invoices are overdue?" },
  {
    label: "Check the next 30 days",
    prompt: "Will I have enough cash for bills in the next 30 days?",
  },
  { label: "Create an invoice draft", prompt: "Create an invoice of 5000 for a customer" },
];
const MAX_HISTORY_ENTRIES = 10;
const MAX_HISTORY_CONTENT = 2000;

function assistantUnavailableMessage(status: AssistantStatus): string {
  if (!status.configured) {
    return "Online AI answers are not configured yet. I can still help create an invoice draft—try “Create an invoice of 5000 for Acme”.";
  }
  return "Online AI answers are off. Enable them from the privacy notice above, then retry this message. Local invoice commands still work without online AI.";
}

function localConversationReply(text: string): string | null {
  const normalized = text.toLocaleLowerCase("en-IN").replace(/[!,.?]+$/g, "").trim();
  if (["hi", "hello", "hey", "good morning", "good afternoon", "good evening"].includes(normalized)) {
    return "Hi! I’m CashPilot. I can explain your cash flow, find overdue invoices, review upcoming bills, or prepare an invoice draft. What would you like to check?";
  }
  if (["thanks", "thank you", "thankyou", "thx"].includes(normalized)) {
    return "You’re welcome. Ask me whenever you want to check your finances or prepare another invoice draft.";
  }
  return null;
}

export function AssistantPanel({ initialStatus }: { initialStatus: AssistantStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [messages, setMessages] = useState<Entry[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [consentPending, setConsentPending] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const idCounter = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  function nextId(): string {
    idCounter.current += 1;
    return `msg-${idCounter.current}`;
  }

  function appendAssistantMessage(
    content: string,
    options: Pick<ChatMessage, "factsUsed" | "tone"> = {},
  ) {
    const message: ChatMessage = {
      kind: "chat",
      id: nextId(),
      role: "assistant",
      content,
      ...options,
    };
    setMessages((current) => [...current, message]);
  }

  function appendInvoiceText(text: string, link?: InvoiceMessage["link"]) {
    const id = nextId();
    setMessages((current) => [
      ...current,
      { kind: "invoice", message: { id, text, link } },
    ]);
  }

  function resolveInvoice(id: string) {
    setMessages((current) =>
      current.map((entry) =>
        entry.kind === "invoice" && entry.message.id === id
          ? { ...entry, message: { ...entry.message, resolved: true } }
          : entry,
      ),
    );
  }

  function findActiveInvoice(): InvoiceMessage | null {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const entry = messages[index];
      if (entry.kind === "invoice" && entry.message.card && !entry.message.resolved) {
        return entry.message;
      }
    }
    return null;
  }

  function updateInvoiceDueDate(id: string, dueDate: string) {
    setMessages((current) =>
      current.map((entry) =>
        entry.kind === "invoice" && entry.message.id === id && entry.message.card
          ? {
              ...entry,
              message: {
                ...entry.message,
                card: {
                  ...entry.message.card,
                  dueDate,
                  dueDateIsDefault: false,
                },
              },
            }
          : entry,
      ),
    );
  }

  async function handlePendingInvoiceReply(
    message: InvoiceMessage,
    text: string,
  ): Promise<boolean> {
    const card = message.card;
    if (!card) return false;

    const reply = parsePendingInvoiceReply(text);
    switch (reply.kind) {
      case "cancel":
        cancelInvoice(message);
        return true;
      case "confirm":
        if (card.kind === "choose") {
          appendInvoiceText("Choose a customer before I save the invoice draft.");
        } else {
          await saveInvoiceDraft(message);
        }
        return true;
      case "due-date-required":
        appendInvoiceText(
          `Every CashPilot invoice needs a due date for reminders and cash forecasts. I used ${card.dueDate}${
            card.dueDateIsDefault ? " (the default 14-day payment term)" : ""
          }. Type “due YYYY-MM-DD” to choose another date, or cancel the draft.`,
        );
        return true;
      case "invalid-due-date":
        appendInvoiceText(
          `Tell me the due date as a real date in YYYY-MM-DD format, for example “due ${card.dueDate}”.`,
        );
        return true;
      case "set-due-date":
        if (reply.dueDate < card.issueDate) {
          appendInvoiceText(
            `The due date cannot be before the issue date (${card.issueDate}). Choose ${card.issueDate} or a later date.`,
          );
          return true;
        }
        updateInvoiceDueDate(message.id, reply.dueDate);
        appendInvoiceText(
          `Due date updated to ${reply.dueDate}. Review the invoice above, then confirm or cancel.`,
        );
        return true;
      case "none":
        return false;
    }
  }

  function getHistory() {
    return messages
      .filter(
        (entry): entry is ChatMessage =>
          entry.kind === "chat" && entry.tone !== "error",
      )
      .slice(-MAX_HISTORY_ENTRIES)
      .map((entry) => ({
        role: entry.role,
        content: entry.content.slice(0, MAX_HISTORY_CONTENT),
      }));
  }

  async function askQuestion(text: string) {
    const response = await fetch("/api/assistant/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: getHistory() }),
    });
    let json: ApiResponse<QueryResult> | null = null;
    try {
      json = (await response.json()) as ApiResponse<QueryResult>;
    } catch {
      json = null;
    }
    if (!response.ok || !json?.data) {
      throw new Error(
        json?.error?.message ??
          (response.ok
            ? "I received an unreadable response. Please try again."
            : `I could not answer right now (HTTP ${response.status}). Please try again.`),
      );
    }
    appendAssistantMessage(json.data.answer, { factsUsed: json.data.factsUsed });
  }

  async function sendMessage(textValue = input, appendUser = true) {
    const text = textValue.trim();
    if (pending || !text) return;

    if (text.length > 1000) {
      appendAssistantMessage("Keep your message to 1,000 characters or fewer.", {
        tone: "error",
      });
      return;
    }

    if (appendUser) {
      const userMessage: ChatMessage = {
        kind: "chat",
        id: nextId(),
        role: "user",
        content: text,
      };
      setMessages((current) => [...current, userMessage]);
    }
    setInput("");
    setFailedMessage(null);
    setPending(true);

    try {
      const activeInvoice = findActiveInvoice();
      if (activeInvoice && (await handlePendingInvoiceReply(activeInvoice, text))) {
        return;
      }

      const localReply = localConversationReply(text);
      if (localReply) {
        appendAssistantMessage(localReply);
        return;
      }

      const prepared = await prepareInvoiceCommand(text).catch(() => null);
      if (prepared && isInvoiceCommand(prepared)) {
        if (activeInvoice) resolveInvoice(activeInvoice.id);
        const replyId = nextId();
        setMessages((current) => [
          ...current,
          { kind: "invoice", message: invoiceReply(replyId, prepared) },
        ]);
        return;
      }
      if (prepared?.status === "error" && /\b(?:invoice|bill)\b/i.test(text)) {
        appendAssistantMessage(prepared.message, { tone: "error" });
        return;
      }

      if (!status.available) {
        appendAssistantMessage(assistantUnavailableMessage(status), { tone: "error" });
        if (status.configured) setFailedMessage(text);
        return;
      }

      if (text.length < 3) {
        appendAssistantMessage("Please ask a question using at least 3 characters.", {
          tone: "error",
        });
        return;
      }

      await askQuestion(text);
    } catch (error) {
      appendAssistantMessage(
        error instanceof Error
          ? error.message
          : "I could not reach the assistant. Check your connection and try again.",
        { tone: "error" },
      );
      setFailedMessage(text);
    } finally {
      setPending(false);
    }
  }

  async function updateConsent(consent: boolean) {
    setConsentPending(true);
    setStatusError(null);
    try {
      const response = await fetch("/api/assistant/consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent }),
      });
      const json = (await response.json()) as ApiResponse<AssistantStatus>;
      if (!response.ok || !json.data) {
        setStatusError(json.error?.message ?? "Could not update AI privacy settings.");
        return;
      }
      setStatus(json.data);
    } catch {
      setStatusError("Could not reach the app. Check your connection and try again.");
    } finally {
      setConsentPending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function startNewConversation() {
    setMessages([]);
    setFailedMessage(null);
    setStatusError(null);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function retryFailedMessage() {
    if (!failedMessage || pending || !status.available) return;
    setMessages((current) => {
      const last = current.at(-1);
      return last?.kind === "chat" && last.tone === "error"
        ? current.slice(0, -1)
        : current;
    });
    void sendMessage(failedMessage, false);
  }

  function chooseCustomer(message: InvoiceMessage, option: CustomerOption) {
    if (message.card?.kind !== "choose") return;
    const { amountPaise, issueDate, dueDate, dueDateIsDefault } = message.card;
    resolveInvoice(message.id);
    const replyId = nextId();
    setMessages((current) => [
      ...current,
      {
        kind: "invoice",
        message: invoiceChoiceReply(
          replyId,
          option,
          amountPaise,
          issueDate,
          dueDate,
          dueDateIsDefault,
        ),
      },
    ]);
  }

  function cancelInvoice(message: InvoiceMessage) {
    resolveInvoice(message.id);
    appendInvoiceText("Cancelled. Nothing was saved.");
  }

  async function saveInvoiceDraft(message: InvoiceMessage) {
    const card = message.card;
    if (!card || card.kind === "choose") return;
    const body =
      card.kind === "new-customer"
        ? { newCustomerName: card.customerName }
        : { customerId: card.customerId };

    setPending(true);
    setFailedMessage(null);
    try {
      const data = await saveInvoice(body, card.amountPaise, card.dueDate);
      resolveInvoice(message.id);
      appendInvoiceText(`Saved draft invoice ${data.invoiceNumber}.`, {
        href: `/invoices/${data.invoiceId}`,
        label: "View invoice",
      });
    } catch (error) {
      appendAssistantMessage(error instanceof Error ? error.message : FALLBACK_ERROR, {
        tone: "error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex h-full min-h-[560px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur overflow-hidden">
      <header className="flex flex-col items-stretch gap-3 border-b border-slate-800 bg-slate-950/40 px-4 pb-4 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${
                status.available ? "bg-emerald-400" : "bg-amber-400"
              }`}
              aria-hidden="true"
            />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-white sm:text-lg">
              Financial Intelligence Assistant
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-slate-400 sm:text-sm">
              {status.available ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  Online AI active · grounded in your financial ledgers
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  Local natural-language invoice commands active
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          {status.available && (
            <button
              type="button"
              aria-label="Turn off online AI"
              disabled={consentPending}
              onClick={() => void updateConsent(false)}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-700"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              <span>
                {consentPending ? (
                  "Updating…"
                ) : (
                  <>
                    <span className="sm:hidden">AI on</span>
                    <span className="hidden sm:inline">Online AI on</span>
                  </>
                )}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={startNewConversation}
            disabled={pending}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">New session</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      {status.available && statusError && (
        <p role="alert" className="mx-4 mt-2 text-xs font-medium text-rose-400">{statusError}</p>
      )}

      {status.configured && !status.consented && (
        <div className="mx-4 mt-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-white">Enable online financial intelligence Q&amp;A?</p>
                <p className="mt-0.5 max-w-3xl text-xs leading-5 text-slate-300">
                  Only the minimum financial facts needed for your query are sent to Groq. Your
                  local database and contact details stay securely on this machine.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={consentPending}
              onClick={() => void updateConsent(true)}
              className="min-h-9 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            >
              {consentPending ? "Enabling…" : "Enable online AI"}
            </button>
          </div>
          {statusError && <p role="alert" className="mt-2 text-xs text-rose-400">{statusError}</p>}
        </div>
      )}

      {!status.configured && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs leading-5 text-amber-300">
          Online LLM answers can use <code>GROQ_API_KEY</code> and <code>GROQ_MODEL</code> in <code>.env</code>.
          Local invoice commands and financial search work out-of-the-box.
        </div>
      )}

      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation with Assistant"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-6"
      >
        {messages.length === 0 && !pending && (
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg">
              <Bot className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">How can I assist your back-office today?</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
              Query receivables, ageing debtor buckets, upcoming supplier bills, or simulate cash flow forecasts. You can also draft invoices in natural language.
            </p>
            <div className="mt-6 grid w-full gap-2 sm:grid-cols-2" aria-label="Suggested queries">
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => void sendMessage(suggestion.prompt)}
                  className="group flex min-h-12 items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-left text-sm font-medium text-slate-300 shadow-sm transition hover:border-slate-700 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {index === SUGGESTIONS.length - 1 ? (
                    <FilePlus2 className="h-4 w-4 shrink-0 text-indigo-400" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  )}
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-5">
          {messages.map((entry) => {
            if (entry.kind === "invoice") {
              const message = entry.message;
              return (
                <div key={message.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                    <Bot className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 max-w-[88%]">
                    <p className="mb-1 text-xs font-semibold text-slate-400">BackOffice Assistant</p>
                    <div className="space-y-3 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 px-4 py-3 text-sm leading-6 text-slate-200 shadow-md">
                      <InvoiceMessageBody
                        message={message}
                        pending={pending}
                        onChoose={(option) => chooseCustomer(message, option)}
                        onSave={() => void saveInvoiceDraft(message)}
                        onCancel={() => cancelInvoice(message)}
                      />
                    </div>
                  </div>
                </div>
              );
            }

            if (entry.role === "user") {
              return (
                <div key={entry.id} className="flex items-start justify-end gap-3">
                  <div className="min-w-0 max-w-[88%] text-right">
                    <p className="mb-1 text-xs font-semibold text-slate-400">You</p>
                    <div className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-left text-sm leading-6 text-white shadow-md">
                      {entry.content}
                    </div>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
                    <UserRound className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
              );
            }

            return (
              <div key={entry.id} className="flex items-start gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    entry.tone === "error"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-indigo-600 text-white shadow-sm"
                  }`}
                >
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 max-w-[88%]">
                  <p className="mb-1 text-xs font-semibold text-slate-400">BackOffice Assistant</p>
                  <div
                    className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-6 ${
                      entry.tone === "error"
                        ? "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                        : "bg-slate-900 text-slate-200 border border-slate-800 shadow-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{entry.content}</p>
                    {entry.factsUsed && entry.factsUsed.length > 0 && (
                      <details className="mt-3 border-t border-slate-800 pt-2 text-xs text-slate-400">
                        <summary className="cursor-pointer font-medium text-slate-300 hover:text-white">Sources consulted</summary>
                        <p className="mt-1.5 leading-5 text-slate-400">
                          {entry.factsUsed.join(" · ")}. No database records were modified.
                        </p>
                      </details>
                    )}
                    {entry.tone === "error" && failedMessage && status.available && (
                      <button
                        type="button"
                        onClick={retryFailedMessage}
                        disabled={pending}
                        className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 transition"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {pending && (
            <div className="flex items-start gap-3" aria-label="Assistant is thinking">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Bot className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-400">BackOffice Assistant</p>
                <div className="flex h-11 items-center gap-1.5 rounded-2xl rounded-tl-sm bg-slate-900 border border-slate-800 px-4 shadow-md">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400 [animation-delay:300ms]" />
                  <span className="sr-only">Checking your financial records…</span>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-slate-800 bg-slate-950/80 px-4 pb-4 pt-3 backdrop-blur">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <label htmlFor="assistant-question" className="sr-only">Message BackOffice Assistant</label>
          <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-inner transition focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
            <textarea
              ref={inputRef}
              id="assistant-question"
              rows={1}
              maxLength={1000}
              value={input}
              disabled={pending}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about cash runway, overdue clients, or draft an invoice..."
              className="max-h-32 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 disabled:opacity-60"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={pending || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 shadow-sm"
            >
              <ArrowUp className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] leading-4 text-slate-400">
            Press Enter to send · Shift+Enter for new line · Grounded strictly in your private local ledgers
          </p>
        </form>
      </div>
    </section>
  );
}
