// EmersonWorkspace.jsx — Matt Emerson's two sets of books under one door.
//
// He runs a for-profit (Emerson Services) and a 501(c)(3) (Social Services of
// Minnesota). They are genuinely separate ledgers — separate banks, separate
// chart of accounts, separate returns — so this is NOT one ledger with a filter.
// It's the same workspace machine pointed at one org or the other, with a switch
// on top. Switching remounts the workspace so nothing bleeds across the two.
//
// Everything that makes this "Matt's" instead of "ProGraphics'" lives in the
// PROFILE objects below and gets handed to LedgerWorkspace as `config`. No
// per-tenant branches inside the workspace itself.

import { useState } from "react";
import LedgerWorkspace from "./LedgerWorkspace";
import { N } from "../design/neon";

const FONTS = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap";

// Matt wanted a register, not a notebook, and next to no invoicing — so he gets
// a trimmed nav and the ledger reads like a checkbook.
const SECTIONS_FORPROFIT = ["notebook", "invoices", "bills", "reports", "documents", "admin"];
// The nonprofit adds Donations (year-end acknowledgment letters) and drops invoicing:
// its money comes in as Medicaid billing and gifts, not as invoices it sends.
const SECTIONS_NONPROFIT = ["notebook", "giving", "bills", "reports", "documents", "admin"];
const LABELS = { notebook: "Register", invoices: "Invoices & receipts" };

// Switched off for both books. Card payoff still exists — ProGraphics uses it — it just
// is not part of Matt's build. Same for the item catalogue and email campaigns.
const FEATURES_FORPROFIT = { cardPayoff: false, campaigns: false };
const FEATURES_NONPROFIT = { cardPayoff: false, campaigns: false, items: false, donations: true };

const PROGRESS = [
  { label: "Two sets of books", items: [
    ["Emerson Services — for-profit", "done"],
    ["Social Services of MN — 501(c)(3)", "done"],
    ["Switch without anything bleeding across", "done"],
  ] },
  { label: "Register", items: [
    ["Checkbook view — running balance", "done"],
    ["One account at a time", "done"],
    ["Category on every line", "done"],
    ["Write a check / cash / deposit by hand", "done"],
    ["Tick against the statement", "wip"],
  ] },
  { label: "Bank feed", items: [
    ["Accounts set up from his account list", "done"],
    ["Connect the bank (live feed)", "wip"],
    ["Opening balances at the start date", "todo"],
  ] },
  { label: "Payroll — Gusto", items: [
    ["Import a payroll run", "todo"],
    ["Split wages / taxes / net pay", "todo"],
    ["Allocate payroll across both entities", "todo"],
  ] },
  { label: "Nonprofit reporting", items: [
    ["Statement of Activities", "done"],
    ["Revenue split — contributed vs Medicaid", "done"],
    ["Expenses by function — program / M&G / fundraising", "done"],
    ["Year-end donation letters", "done"],
    ["Medicaid peer-support accounts", "done"],
    ["Statement of Financial Position", "todo"],
  ] },
  { label: "Bills & checks", items: [
    ["Record a vendor bill", "done"],
    ["Pay by printed check", "done"],
  ] },
  { label: "Invoicing (light)", items: [
    ["Send an invoice when he needs one", "done"],
    ["Record what came in", "done"],
  ] },
  { label: "Documents", items: [
    ["Bank statements filed by account", "todo"],
    ["501(c)(3) determination + filings", "todo"],
  ] },
  { label: "Reports", items: [
    ["Profit & Loss (for-profit)", "todo"],
    ["Balance sheet", "todo"],
  ] },
];

// Named-but-empty entities. The name is what resolves the live org in Supabase —
// no ids hardcoded here. Until the org loads, this is what the workspace shows.
function stub(name, short, blurb) {
  return {
    name, short, currentUser: "Matt", fiscalYearEnd: "December 31", today: "",
    users: [{ name: "Matt", initials: "M", role: "Owner", lands: "notebook" }],
    accounts: { banks: [], cards: [], loans: [] },
    notebook: [], invoices: [], reports: [], categories: [],
    salesTax: { quarter: "", taxable: 0, exempt: 0, collected: 0 },
    changelog: [{ date: "Aug 19, 2026", items: [blurb] }],
    needsConnect: true,
  };
}

// The two books. `entity` seeds the shell and resolves the org; `config` is the
// profile — sections, wording, ledger style, punch list.
const BOOKS = [
  {
    key: "services",
    tab: "Emerson Services",
    kind: "For-profit",
    accent: N.blue,
    entity: stub("Emerson Services", "Emerson Services", "Workspace created — accounts and categories loaded from his account list."),
    config: { sections: SECTIONS_FORPROFIT, labels: LABELS, ledgerStyle: "register", features: FEATURES_FORPROFIT, buildProgress: PROGRESS },
  },
  {
    key: "ssmn",
    tab: "Social Services of MN",
    kind: "Nonprofit · 501(c)(3)",
    accent: N.green,
    entity: stub("Social Services of Minnesota", "Social Services of MN", "Workspace created — Premier Banks accounts and the nonprofit chart of accounts are in."),
    config: {
      sections: SECTIONS_NONPROFIT, labels: LABELS, ledgerStyle: "register",
      features: FEATURES_NONPROFIT, reportStyle: "nonprofit", buildProgress: PROGRESS,
    },
  },
];

const REMEMBER = "cw_emerson_book";

export default function EmersonWorkspace({ session }) {
  const [bookKey, setBookKey] = useState(() => {
    try { return localStorage.getItem(REMEMBER) || BOOKS[0].key; } catch (e) { return BOOKS[0].key; }
  });
  const book = BOOKS.find(b => b.key === bookKey) || BOOKS[0];

  const pick = k => {
    setBookKey(k);
    try { localStorage.setItem(REMEMBER, k); } catch (e) { /* storage may be blocked */ }
  };

  return (
    <div style={{ minHeight: "100vh", background: N.white }}>
      <link href={FONTS} rel="stylesheet" />
      {/* Which set of books am I in? Sticky above the workspace so it's never a question. */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 60, background: N.white,
        borderBottom: "1px solid " + N.rule, display: "flex", alignItems: "center",
        gap: 10, padding: "9px 22px", flexWrap: "wrap", fontFamily: "'Figtree', sans-serif",
      }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9.5, letterSpacing: "0.14em", color: N.muted }}>EMERSON · SET OF BOOKS</span>
        {BOOKS.map(b => {
          const on = b.key === book.key;
          return (
            <button key={b.key} onClick={() => pick(b.key)} style={{
              display: "flex", alignItems: "baseline", gap: 8, cursor: "pointer",
              border: "1px solid " + (on ? b.accent : N.rule), background: on ? b.accent : N.white,
              color: on ? "#fff" : N.muted, borderRadius: 100, padding: "6px 15px",
              fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: on ? 700 : 500,
              boxShadow: on ? `0 2px 12px ${b.accent}44` : "none",
            }}>
              {b.tab}
              <span style={{ fontSize: 10.5, fontWeight: 500, opacity: on ? 0.85 : 1 }}>{b.kind}</span>
            </button>
          );
        })}
        <span style={{ marginLeft: "auto", fontSize: 11.5, color: N.muted }}>
          Two separate ledgers — nothing crosses between them.
        </span>
      </div>

      {/* Remount on switch: separate books get separate state, not a shared one filtered. */}
      <LedgerWorkspace key={book.key} entity={book.entity} config={book.config} session={session} />
    </div>
  );
}
