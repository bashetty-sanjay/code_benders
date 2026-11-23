"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";
import {
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Plus,
  Menu,
  X,
  Wallet,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { href: "/invoices",   label: "Invoices",         icon: FileText,  badge: "Track"  },
  { href: "/forecast",   label: "Cash Forecast",    icon: TrendingUp, badge: "30-90d" },
  { href: "/customers",  label: "Customers",        icon: Users },
  { href: "/bills",      label: "Expenses & Bills", icon: Receipt },
  { href: "/assistant",  label: "AI Assistant",     icon: Sparkles,  badge: "AI" },
  { href: "/settings",   label: "Settings",         icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100 font-sans antialiased">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white shadow-lg focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>

      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 text-slate-200 border-r border-slate-800 z-30 shadow-xl">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors duration-200">
                  CashPilot AI
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">One-Person Back Office</p>
            </div>
          </Link>

          {/* Quick Create button */}
          <div className="mt-4">
            <Link
              href="/invoices/new"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all duration-150 hover:shadow-indigo-600/50 hover:-translate-y-px"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Invoice</span>
            </Link>
          </div>
        </div>

        {/* Nav Items */}
        <nav aria-label="Primary Navigation" className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Core Operations
          </div>
          {NAV_ITEMS.map(({ href, label, icon: Icon, badge }, index) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                style={{ animationDelay: `${index * 30}ms` }}
                className={`
                  relative flex items-center justify-between px-3 py-2.5 rounded-lg text-sm
                  font-medium transition-all duration-200 group overflow-hidden
                  ${isActive
                    ? "bg-indigo-600/90 text-white shadow-sm shadow-indigo-900/50"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active left accent bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-indigo-300"
                    aria-hidden="true"
                  />
                )}

                {/* Hover background sheen */}
                <span
                  className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-slate-800/60 to-transparent pointer-events-none"
                  aria-hidden="true"
                />

                <div className="flex items-center gap-3 relative z-10">
                  <Icon
                    className={`w-4 h-4 transition-all duration-200 ${
                      isActive
                        ? "text-white scale-110"
                        : "text-slate-400 group-hover:text-white group-hover:scale-105"
                    }`}
                  />
                  <span className="relative z-10">{label}</span>
                </div>

                {badge && (
                  <span
                    className={`relative z-10 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors duration-200 ${
                      isActive
                        ? "bg-indigo-700/80 text-white"
                        : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer security badge */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
          <div className="rounded-lg bg-slate-800/60 p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">Local-First Vault</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              100% private SQLite database. No external accounting leak.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Header Bar ─────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">CashPilot AI</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/invoices/new"
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs">Invoice</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
          >
            <span
              className="block transition-transform duration-200"
              style={{ transform: mobileMenuOpen ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </span>
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer + Backdrop ──────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
          mobileMenuOpen
            ? "bg-slate-950/80 backdrop-blur-sm pointer-events-auto"
            : "bg-transparent pointer-events-none"
        }`}
        aria-hidden={!mobileMenuOpen}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileMenuOpen}
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-white">CashPilot AI</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-150"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-4 space-y-0.5" aria-label="Mobile navigation">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Navigation
            </div>
            {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
              const isActive =
                pathname === href ||
                (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-indigo-700/80 text-white" : "bg-slate-800 text-slate-300"
                    }`}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <Link
            href="/invoices/new"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors duration-150 shadow-lg shadow-indigo-900/40"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 lg:p-8 mt-14 md:mt-0 max-w-7xl w-full mx-auto focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
