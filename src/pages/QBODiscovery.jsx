import { navigate } from "../App";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";

const S = {
  slate: "#3d4560", orange: "#e8773a", orangeLight: "#fdf0e8",
  paper: "#faf8f4", cream: "#f2ede3", ink: "#1e1e2a",
  rule: "#ddd8cc", muted: "#7a7585", gold: "#C9A84C",
  green: "#5a9a5a", greenLight: "#f0faf0", red: "#c95f22",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const MOBILE_TOOL = `
  @media (max-width: 640px) {
    .tool-header { padding: 0 16px !important; }
    .tool-page { padding: 28px 16px 60px !important; }
    .tool-h1 { font-size: 26px !important; }
    .tool-section { padding: 20px 16px !important; }
    .field-grid { grid-template-columns: 1fr !important; }
    .field-grid-3 { grid-template-columns: 1fr !important; }
  }
  @media print {
    .no-print { display: none !important; }
    header { display: none !important; }
    body { background: #fff; }
    .tool-section { page-break-inside: avoid; }
  }
`;

const inp = (extra = {}) => ({
  width: "100%", padding: "10px 14px", background: "#fff",
  border: "1px solid " + S.rule, borderRadius: 8, color: S.ink,
  fontSize: 14, fontFamily: "'Figtree', sans-serif", outline: "none",
  lineHeight: 1.5, boxSizing: "border-box", ...extra,
});

const lbl = {
  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em",
  textTransform: "uppercase", color: S.muted, marginBottom: 6, display: "block",
};

const sectionCard = {
  background: "#fff", border: "1px solid " + S.rule, borderRadius: 14,
  padding: "28px 32px", marginBottom: 20, position: "relative",
};

const sectionHeading = {
  fontFamily: "'DM Serif Display', serif", fontSize: 22, color: S.ink,
  margin: "0 0 4px", lineHeight: 1.2,
};

const sectionSub = {
  fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 14,
  color: S.orange, margin: "0 0 22px", lineHeight: 1.4,
};

const sectionNum = {
  position: "absolute", top: 24, right: 28,
  fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em",
  color: S.gold, textTransform: "uppercase",
};

const STORAGE_KEY = "qbo-discovery-current";
const TOOL_TYPE = "qbo_discovery";

const INITIAL_FORM = {
  // Section 1 — Company Profile
  client_name: "", contact_name: "", contact_email: "", contact_phone: "",
  legal_name: "", ein_last4: "", entity_type: "", industry: "",
  years_in_business: "", revenue_band: "", employee_count: "", contractor_count: "",
  assessment_date: new Date().toISOString().slice(0, 10),
  // Section 2 — QBO Setup
  using_qbo: "", qbo_level: "", years_on_qbo: "", multi_user: "",
  user_count: "", qbo_apps_notes: "",
  integration_billcom: false, integration_gusto: false, integration_adp: false,
  integration_shopify: false, integration_stripe: false, integration_square: false,
  integration_amazon: false, integration_paypal: false, integration_expensify: false,
  integration_none: false,
  // Section 3 — COA
  coa_condition: "", coa_count: "", coa_subaccounts: "", coa_numbering: "",
  suspense_balance: "", coa_notes: "",
  // Section 4 — Bank Feeds
  bank_count: "", cc_count: "", feed_status: "", feed_issues: "",
  // Section 5 — Reconciliation
  recon_last_date: "", recon_monthly: "", recon_unrec_count: "",
  recon_months_behind: "", recon_issues: "",
  // Section 6 — Payroll
  payroll_provider: "", pay_frequency: "", pay_schedules: "", pay_method: "",
  union: "", payroll_deductions: "", payroll_issues: "",
  // Section 7 — AP
  ap_intake: "", ap_approval: "", ap_pay_method: "", ap_outstanding: "", ap_pain: "",
  // Section 8 — AR
  ar_invoice_source: "", ar_frequency: "", ar_aging: "",
  ar_outstanding: "", ar_collections: "", ar_issues: "",
  // Section 9 — Sales Tax
  tax_collect: "", tax_frequency: "", tax_current: "",
  tax_jurisdictions: "", tax_issues: "",
  // Section 10 — Reporting
  reports_current: "", reports_needed: "", reports_cadence: "", reports_custom: "",
  // Section 11 — Compliance
  cpa_name: "", cpa_contact: "", tax_filed: "", form_1099: "", form_w2: "",
  active_notices: "", compliance_notes: "",
  // Section 12 — Pain Points
  pain_top: "", pain_other: "", pain_wishlist: "",
  // Section 13 — Scope Recommendation
  scope_cleanup: false, scope_ongoing: false, scope_cfo: false,
  scope_payroll: false, scope_training: false, scope_hybrid: false, scope_decline: false,
  est_cleanup_hours: "", est_monthly_hours: "",
  fee_cleanup: "", fee_monthly: "",
  red_flags: "", green_flags: "", private_notes: "",
};

// Section field-group definitions for progress tracking
const SECTION_FIELDS = {
  1: ["client_name", "contact_name", "contact_email", "contact_phone", "legal_name", "ein_last4", "entity_type", "industry", "years_in_business", "revenue_band", "employee_count", "contractor_count"],
  2: ["using_qbo", "qbo_level", "years_on_qbo", "multi_user", "user_count", "qbo_apps_notes", "integration_billcom", "integration_gusto", "integration_adp", "integration_shopify", "integration_stripe", "integration_square", "integration_amazon", "integration_paypal", "integration_expensify", "integration_none"],
  3: ["coa_condition", "coa_count", "coa_subaccounts", "coa_numbering", "suspense_balance", "coa_notes"],
  4: ["bank_count", "cc_count", "feed_status", "feed_issues"],
  5: ["recon_last_date", "recon_monthly", "recon_unrec_count", "recon_months_behind", "recon_issues"],
  6: ["payroll_provider", "pay_frequency", "pay_schedules", "pay_method", "union", "payroll_deductions", "payroll_issues"],
  7: ["ap_intake", "ap_approval", "ap_pay_method", "ap_outstanding", "ap_pain"],
  8: ["ar_invoice_source", "ar_frequency", "ar_aging", "ar_outstanding", "ar_collections", "ar_issues"],
  9: ["tax_collect", "tax_frequency", "tax_current", "tax_jurisdictions", "tax_issues"],
  10: ["reports_current", "reports_needed", "reports_cadence", "reports_custom"],
  11: ["cpa_name", "cpa_contact", "tax_filed", "form_1099", "form_w2", "active_notices", "compliance_notes"],
  12: ["pain_top", "pain_other", "pain_wishlist"],
  13: ["scope_cleanup", "scope_ongoing", "scope_cfo", "scope_payroll", "scope_training", "scope_hybrid", "scope_decline", "est_cleanup_hours", "est_monthly_hours", "fee_cleanup", "fee_monthly", "red_flags", "green_flags", "private_notes"],
};

// --- helper components ---
function PillRadio({ name, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
      {options.map(opt => {
        const optVal = typeof opt === "string" ? opt : opt.value;
        const optLabel = typeof opt === "string" ? opt : opt.label;
        const active = value === optVal;
        return (
          <label key={optVal} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 100,
            border: "1.5px solid " + (active ? S.orange : S.rule),
            background: active ? S.orange : "#fff",
            color: active ? "#fff" : S.muted,
            fontSize: 13, fontWeight: active ? 600 : 500, cursor: "pointer",
            fontFamily: "'Figtree', sans-serif", userSelect: "none",
            transition: "all 0.15s",
          }}>
            <input type="radio" name={name} value={optVal} checked={active}
              onChange={() => onChange(optVal)}
              style={{ display: "none" }} />
            {optLabel}
          </label>
        );
      })}
    </div>
  );
}

function PillCheckbox({ name, checked, onChange, label }) {
  return (
    <label style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 100,
      border: "1.5px solid " + (checked ? S.orange : S.rule),
      background: checked ? S.orange : "#fff",
      color: checked ? "#fff" : S.muted,
      fontSize: 13, fontWeight: checked ? 600 : 500, cursor: "pointer",
      fontFamily: "'Figtree', sans-serif", userSelect: "none",
      transition: "all 0.15s",
    }}>
      <input type="checkbox" name={name} checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ display: "none" }} />
      {label}
    </label>
  );
}

function Field({ label, required, optional, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <span style={lbl}>
        {label}
        {required && <span style={{ color: S.red, marginLeft: 4 }}>*</span>}
        {optional && <span style={{ fontStyle: "italic", color: S.muted, marginLeft: 6, textTransform: "none", letterSpacing: "0", fontFamily: "'Figtree', sans-serif", fontSize: 11 }}>{optional}</span>}
      </span>
      {children}
    </div>
  );
}

// --- main component ---
export default function QBODiscovery() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "vault"
  const [vaultState, setVaultState] = useState("checking"); // "checking" | "connected" | "no-session" | "no-member" | "error"
  const [userEmail, setUserEmail] = useState("");
  const [showVault, setShowVault] = useState(false);
  const [vaultList, setVaultList] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [savingVault, setSavingVault] = useState(false);

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const setRadio = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }));
  const setCheck = (field) => (val) => setForm(prev => ({ ...prev, [field]: val }));

  // --- toast helper ---
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- localStorage: load on mount ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data) {
          setForm(prev => ({ ...prev, ...parsed.data }));
        }
      }
    } catch (e) {
      console.warn("localStorage load error:", e);
    }
  }, []);

  // --- localStorage: auto-save on form change (debounced) ---
  useEffect(() => {
    setSaveStatus("saving");
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          data: form,
          savedAt: new Date().toISOString(),
        }));
        setSaveStatus("saved");
      } catch (e) {
        console.warn("localStorage save error:", e);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form]);

  // --- Supabase: check session + member status on mount ---
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user || !session.user.email) {
          setVaultState("no-session");
          return;
        }
        setUserEmail(session.user.email);
        const { data: memberRow, error } = await supabase
          .from("members")
          .select("plan")
          .eq("email", session.user.email)
          .maybeSingle();
        if (error) {
          console.warn("Member check error:", error);
          setVaultState("error");
          return;
        }
        if (memberRow && memberRow.plan) {
          setVaultState("connected");
        } else {
          setVaultState("no-member");
        }
      } catch (e) {
        console.warn("Supabase init error:", e);
        setVaultState("error");
      }
    })();
  }, []);

  // --- progress count ---
  const sectionsStarted = Object.keys(SECTION_FIELDS).filter(secNum => {
    return SECTION_FIELDS[secNum].some(field => {
      const val = form[field];
      if (typeof val === "boolean") return val;
      return val && String(val).trim() !== "";
    });
  }).length;

  // --- save to vault ---
  const handleSaveToVault = async () => {
    if (!form.client_name.trim()) {
      showToast("Client name required before saving to vault", "error");
      return;
    }
    if (vaultState !== "connected") {
      showToast("Vault not connected — use Export JSON instead", "error");
      return;
    }
    setSavingVault(true);
    try {
      const { error } = await supabase.from("client_assessments").insert({
        user_email: userEmail,
        client_name: form.client_name,
        assessment_date: form.assessment_date || null,
        tool_type: TOOL_TYPE,
        data: form,
      });
      if (error) throw error;
      showToast("✓ Saved to your vault", "success");
    } catch (e) {
      console.error("Vault save error:", e);
      showToast("Vault save failed: " + (e.message || "unknown error"), "error");
    } finally {
      setSavingVault(false);
    }
  };

  // --- load from vault ---
  const handleOpenVault = async () => {
    if (vaultState !== "connected") {
      showToast("Log in to load from vault", "error");
      return;
    }
    setShowVault(true);
    setVaultLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_assessments")
        .select("id, client_name, assessment_date, created_at, updated_at, data")
        .eq("user_email", userEmail)
        .eq("tool_type", TOOL_TYPE)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setVaultList(data || []);
    } catch (e) {
      console.error(e);
      showToast("Error loading vault: " + (e.message || ""), "error");
    } finally {
      setVaultLoading(false);
    }
  };

  const handleLoadAssessment = (row) => {
    if (saveStatus === "saving" && !window.confirm("You have unsaved local changes. Load this assessment and discard them?")) {
      return;
    }
    setForm({ ...INITIAL_FORM, ...row.data });
    setShowVault(false);
    showToast("✓ Loaded " + row.client_name, "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- export JSON ---
  const handleExportJSON = () => {
    const clientSlug = (form.client_name || "unnamed-client")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const date = form.assessment_date || new Date().toISOString().slice(0, 10);
    const filename = `qbo-discovery-${clientSlug}-${date}.json`;
    const payload = {
      tool: TOOL_TYPE,
      exported_at: new Date().toISOString(),
      client_name: form.client_name,
      assessment_date: form.assessment_date,
      data: form,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("✓ Downloaded " + filename, "success");
  };

  // --- clear form ---
  const handleClear = () => {
    if (!window.confirm("Clear the entire form? Your local draft will be wiped. (Vault saves are untouched.)")) return;
    setForm({ ...INITIAL_FORM, assessment_date: new Date().toISOString().slice(0, 10) });
    localStorage.removeItem(STORAGE_KEY);
    showToast("Form cleared. Ready for the next one.", "info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- vault banner config ---
  const vaultBanner = (() => {
    switch (vaultState) {
      case "checking": return { icon: "⏳", text: "Checking vault connection…", color: S.muted, border: S.rule };
      case "connected": return { icon: "✅", text: <><strong>Vault connected.</strong> Signed in as {userEmail}. Save to My Vault is live.</>, color: S.green, border: S.green, bg: S.greenLight };
      case "no-session": return { icon: "🔒", text: <>Not signed in. Your work saves locally, but you'll need to <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }} style={{ color: S.orange, fontWeight: 700 }}>log in</a> to save to your vault.</>, color: S.orange, border: S.orange, bg: S.orangeLight };
      case "no-member": return { icon: "⚠️", text: "Signed in, but no active CARES Works membership found. Local save only.", color: S.orange, border: S.orange, bg: S.orangeLight };
      case "error": return { icon: "📝", text: "Vault temporarily unavailable. Local save + JSON export fully working.", color: S.muted, border: S.rule };
      default: return { icon: "", text: "", color: S.muted, border: S.rule };
    }
  })();

  // --- save status indicator ---
  const saveDot = saveStatus === "saving"
    ? { color: S.orange, text: "Saving locally…" }
    : { color: S.green, text: "Saved locally" };

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE_TOOL}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="no-print tool-header" style={{
        background: S.slate, padding: "0 32px", display: "flex",
        alignItems: "center", justifyContent: "space-between", height: 58,
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100,
      }}>
        <a href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>
          CARES <span style={{ color: S.orange }}>Works.</span>
        </a>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: saveDot.color, display: "inline-block" }}></span>
            {saveDot.text}
          </span>
          <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} href="/dashboard"
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>
            {"<- Dashboard"}
          </a>
        </div>
      </header>

      <div className="tool-page" style={{ maxWidth: 980, margin: "0 auto", padding: "40px 32px 80px" }}>

        {/* HERO */}
        <div style={{ marginBottom: 28 }}>
          <h1 className="tool-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.05, margin: "0 0 12px", color: S.ink }}>
            QBO Discovery <span style={{ fontStyle: "italic", color: S.orange }}>Assessment</span>
          </h1>
          <p style={{ fontSize: 16, color: S.muted, maxWidth: 620, margin: "0 0 8px", lineHeight: 1.5 }}>
            Thirteen sections. Every question earning its keep. Walk in, walk out knowing what they've got, what they need, and what you'll quote them.
          </p>
          <p style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 14, color: S.gold, margin: "12px 0 0" }}>
            Revenue is vanity. Net profit is sanity.™
          </p>
        </div>

        {/* VAULT BANNER */}
        <div style={{
          background: vaultBanner.bg || S.cream, border: "1px " + (vaultState === "connected" ? "solid" : "dashed") + " " + vaultBanner.border,
          borderRadius: 10, padding: "12px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: S.ink,
        }}>
          <span style={{ fontSize: 16 }}>{vaultBanner.icon}</span>
          <span>{vaultBanner.text}</span>
        </div>

        {/* PROGRESS CARD */}
        <div style={{
          background: S.slate, color: "#fff", padding: "24px 28px", borderRadius: 12,
          marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 24, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              Assessment Progress
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginTop: 4 }}>
              {sectionsStarted} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 18 }}>/ 13 sections started</span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200, height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", background: S.orange, width: `${(sectionsStarted / 13) * 100}%`, transition: "width 0.3s ease" }}></div>
          </div>
        </div>

        {/* ============== SECTION 1 — COMPANY PROFILE ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ One</span>
          <h2 style={sectionHeading}>Company Profile</h2>
          <p style={sectionSub}>Who they are before we find out what they've been hiding.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Client / Business Name" required>
              <input style={inp()} value={form.client_name} onChange={set("client_name")} placeholder="e.g. Smith Family Dairy LLC" />
            </Field>
            <Field label="Primary Contact Name">
              <input style={inp()} value={form.contact_name} onChange={set("contact_name")} />
            </Field>
            <Field label="Email">
              <input type="email" style={inp()} value={form.contact_email} onChange={set("contact_email")} />
            </Field>
            <Field label="Phone">
              <input style={inp()} value={form.contact_phone} onChange={set("contact_phone")} />
            </Field>
            <Field label="Legal Entity Name" optional="if different">
              <input style={inp()} value={form.legal_name} onChange={set("legal_name")} />
            </Field>
            <Field label="EIN" optional="last 4 OK">
              <input style={inp()} value={form.ein_last4} onChange={set("ein_last4")} />
            </Field>
            <Field label="Entity Type" full>
              <PillRadio name="entity_type" value={form.entity_type} onChange={setRadio("entity_type")}
                options={["LLC", "S-Corp", "C-Corp", "Sole Prop", "Partnership", "Nonprofit", "Other"]} />
            </Field>
            <Field label="Industry">
              <input style={inp()} value={form.industry} onChange={set("industry")} placeholder="e.g. Print shop, daycare, trucking" />
            </Field>
            <Field label="Years in Business">
              <input type="number" style={inp()} value={form.years_in_business} onChange={set("years_in_business")} min="0" />
            </Field>
            <Field label="Annual Revenue Band">
              <select style={inp()} value={form.revenue_band} onChange={set("revenue_band")}>
                <option value="">— Select —</option>
                <option>Under $100K</option><option>$100K – $250K</option><option>$250K – $500K</option>
                <option>$500K – $1M</option><option>$1M – $5M</option><option>$5M – $10M</option><option>$10M+</option>
              </select>
            </Field>
            <Field label="Number of W-2 Employees">
              <input type="number" style={inp()} value={form.employee_count} onChange={set("employee_count")} min="0" />
            </Field>
            <Field label="Number of 1099 Contractors">
              <input type="number" style={inp()} value={form.contractor_count} onChange={set("contractor_count")} min="0" />
            </Field>
            <Field label="Assessment Date" required>
              <input type="date" style={inp()} value={form.assessment_date} onChange={set("assessment_date")} />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 2 — QBO SETUP ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Two</span>
          <h2 style={sectionHeading}>QuickBooks Setup Status</h2>
          <p style={sectionSub}>The lay of the land. What version, how long, and who's been in there lately.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Currently Using QBO?" full>
              <PillRadio name="using_qbo" value={form.using_qbo} onChange={setRadio("using_qbo")}
                options={["Yes", "No - other software", "No - manual / spreadsheets", "Migrating"]} />
            </Field>
            <Field label="QBO Subscription Level">
              <select style={inp()} value={form.qbo_level} onChange={set("qbo_level")}>
                <option value="">— Select —</option>
                <option>Simple Start</option><option>Essentials</option><option>Plus</option>
                <option>Advanced</option><option>Desktop (legacy)</option><option>Unsure</option><option>N/A</option>
              </select>
            </Field>
            <Field label="Years on Current System">
              <input type="number" step="0.5" style={inp()} value={form.years_on_qbo} onChange={set("years_on_qbo")} min="0" />
            </Field>
            <Field label="Multi-User?">
              <PillRadio name="multi_user" value={form.multi_user} onChange={setRadio("multi_user")} options={["Yes", "No", "Unsure"]} />
            </Field>
            <Field label="Number of Users">
              <input type="number" style={inp()} value={form.user_count} onChange={set("user_count")} min="0" />
            </Field>
            <Field label="Connected Apps / Integrations" full>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                {[
                  ["integration_billcom", "Bill.com"], ["integration_gusto", "Gusto"], ["integration_adp", "ADP"],
                  ["integration_shopify", "Shopify"], ["integration_stripe", "Stripe"], ["integration_square", "Square"],
                  ["integration_amazon", "Amazon"], ["integration_paypal", "PayPal"], ["integration_expensify", "Expensify"],
                  ["integration_none", "None"],
                ].map(([key, label]) => (
                  <PillCheckbox key={key} name={key} checked={form[key]} onChange={setCheck(key)} label={label} />
                ))}
              </div>
            </Field>
            <Field label="Other Apps / Notes" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.qbo_apps_notes} onChange={set("qbo_apps_notes")}
                placeholder="Anything else connected, any quirks, any admin access issues…" />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 3 — COA ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Three</span>
          <h2 style={sectionHeading}>Chart of Accounts Health</h2>
          <p style={sectionSub}>Is it a spine or a pile of bones? We're about to find out.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Overall Condition" full>
              <PillRadio name="coa_condition" value={form.coa_condition} onChange={setRadio("coa_condition")}
                options={["Clean", "Usable but messy", "Duplicates everywhere", "Never audited", "Complete disaster", "Don't know yet"]} />
            </Field>
            <Field label="Approx. Number of Accounts">
              <input type="number" style={inp()} value={form.coa_count} onChange={set("coa_count")} min="0" />
            </Field>
            <Field label="Sub-Accounts Used?">
              <PillRadio name="coa_subaccounts" value={form.coa_subaccounts} onChange={setRadio("coa_subaccounts")}
                options={["Yes - consistently", "Inconsistent", "No"]} />
            </Field>
            <Field label="Numbering Scheme in Place?">
              <PillRadio name="coa_numbering" value={form.coa_numbering} onChange={setRadio("coa_numbering")} options={["Yes", "Partial", "No"]} />
            </Field>
            <Field label="Suspense / Uncategorized Balance">
              <input style={inp()} value={form.suspense_balance} onChange={set("suspense_balance")} placeholder="$" />
            </Field>
            <Field label="Notes / Red Flags" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.coa_notes} onChange={set("coa_notes")}
                placeholder="Duplicate accounts, mystery balances, accounts still active that shouldn't be, etc." />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 4 — BANK FEEDS ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Four</span>
          <h2 style={sectionHeading}>Bank &amp; Credit Card Feeds</h2>
          <p style={sectionSub}>Where the money actually moves. And where the ghosts live.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Number of Bank Accounts">
              <input type="number" style={inp()} value={form.bank_count} onChange={set("bank_count")} min="0" />
            </Field>
            <Field label="Number of Credit Cards">
              <input type="number" style={inp()} value={form.cc_count} onChange={set("cc_count")} min="0" />
            </Field>
            <Field label="Feed Connection Status" full>
              <PillRadio name="feed_status" value={form.feed_status} onChange={setRadio("feed_status")}
                options={["All connected", "Some connected", "None connected", "Unsure"]} />
            </Field>
            <Field label="Feed Issues / Missing Accounts / Ghost Accounts" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.feed_issues} onChange={set("feed_issues")}
                placeholder="Disconnected feeds, old bank info, duplicate transactions, misdirected payments…" />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 5 — RECONCILIATION ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Five</span>
          <h2 style={sectionHeading}>Reconciliation Status</h2>
          <p style={sectionSub}>The question that separates the bookkeepers from the pretenders.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Last Clean Reconciliation Date" optional="estimate">
              <input style={inp()} value={form.recon_last_date} onChange={set("recon_last_date")} placeholder="e.g. March 2024 or Never" />
            </Field>
            <Field label="Reconciled Monthly?">
              <PillRadio name="recon_monthly" value={form.recon_monthly} onChange={setRadio("recon_monthly")}
                options={["Yes", "Inconsistent", "No", "Never"]} />
            </Field>
            <Field label="Approx. Unreconciled Transactions">
              <input type="number" style={inp()} value={form.recon_unrec_count} onChange={set("recon_unrec_count")} min="0" />
            </Field>
            <Field label="Months Behind">
              <input type="number" style={inp()} value={form.recon_months_behind} onChange={set("recon_months_behind")} min="0" />
            </Field>
            <Field label="Known Issues" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.recon_issues} onChange={set("recon_issues")}
                placeholder="Forced balances, stale transactions, prior-year adjustments outstanding…" />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 6 — PAYROLL ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Six</span>
          <h2 style={sectionHeading}>Payroll Setup</h2>
          <p style={sectionSub}>Who's paying whom, from which account, and is it actually hitting?</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Current Payroll Provider" full>
              <PillRadio name="payroll_provider" value={form.payroll_provider} onChange={setRadio("payroll_provider")}
                options={["QBO Payroll", "Gusto", "ADP", "Paychex", "Manual", "None", "Other"]} />
            </Field>
            <Field label="Pay Frequency">
              <select style={inp()} value={form.pay_frequency} onChange={set("pay_frequency")}>
                <option value="">— Select —</option>
                <option>Weekly</option><option>Bi-weekly</option><option>Semi-monthly</option>
                <option>Monthly</option><option>Multiple schedules</option>
              </select>
            </Field>
            <Field label="Number of Pay Schedules">
              <input type="number" style={inp()} value={form.pay_schedules} onChange={set("pay_schedules")} min="0" />
            </Field>
            <Field label="Payment Method">
              <PillRadio name="pay_method" value={form.pay_method} onChange={setRadio("pay_method")} options={["Direct Deposit", "Checks", "Mixed"]} />
            </Field>
            <Field label="Union Shop?">
              <PillRadio name="union" value={form.union} onChange={setRadio("union")} options={["Yes", "No"]} />
            </Field>
            <Field label="Standing Deductions / Benefits" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.payroll_deductions} onChange={set("payroll_deductions")}
                placeholder="Health insurance, 401k, HSA, garnishments, union dues, uniforms, etc." />
            </Field>
            <Field label="Known Payroll Issues" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.payroll_issues} onChange={set("payroll_issues")}
                placeholder="Misdirected bank accounts, wrong tax mapping, mismatched liabilities, missing 941s…" />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 7 — AP ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Seven</span>
          <h2 style={sectionHeading}>Accounts Payable / Bill Pay</h2>
          <p style={sectionSub}>How bills come in, who approves, how they leave.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="How Bills Come In">
              <select style={inp()} value={form.ap_intake} onChange={set("ap_intake")}>
                <option value="">— Select —</option>
                <option>Email</option><option>Mail</option><option>Vendor portal</option>
                <option>Bill.com inbox</option><option>Mixed</option>
              </select>
            </Field>
            <Field label="Approval Workflow">
              <select style={inp()} value={form.ap_approval} onChange={set("ap_approval")}>
                <option value="">— Select —</option>
                <option>None</option><option>Owner approves everything</option>
                <option>Two-step approval</option><option>Multi-step approval</option>
              </select>
            </Field>
            <Field label="Primary Payment Method">
              <select style={inp()} value={form.ap_pay_method} onChange={set("ap_pay_method")}>
                <option value="">— Select —</option>
                <option>Checks</option><option>ACH</option><option>Bill.com</option>
                <option>Wire</option><option>Credit card</option><option>Mixed</option>
              </select>
            </Field>
            <Field label="Outstanding AP Estimate">
              <input style={inp()} value={form.ap_outstanding} onChange={set("ap_outstanding")} placeholder="$" />
            </Field>
            <Field label="AP Pain Points" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.ap_pain} onChange={set("ap_pain")}
                placeholder="Late payments, missed bills, duplicate entries, 1099 tracking gaps…" />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 8 — AR ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Eight</span>
          <h2 style={sectionHeading}>Accounts Receivable / Invoicing</h2>
          <p style={sectionSub}>Money earned versus money actually collected. They're often not the same.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Invoicing From QBO?">
              <PillRadio name="ar_invoice_source" value={form.ar_invoice_source} onChange={setRadio("ar_invoice_source")}
                options={["Yes", "External", "Mixed", "No invoicing"]} />
            </Field>
            <Field label="Invoice Frequency">
              <input style={inp()} value={form.ar_frequency} onChange={set("ar_frequency")} placeholder="e.g. Weekly, per-job, monthly" />
            </Field>
            <Field label="Current AR Aging">
              <select style={inp()} value={form.ar_aging} onChange={set("ar_aging")}>
                <option value="">— Select —</option>
                <option>All current (under 30)</option><option>Mostly current</option>
                <option>Significant 30-60</option><option>Significant 60-90</option>
                <option>Significant 90+</option><option>Bad debt problem</option><option>Unknown</option>
              </select>
            </Field>
            <Field label="Outstanding AR Estimate">
              <input style={inp()} value={form.ar_outstanding} onChange={set("ar_outstanding")} placeholder="$" />
            </Field>
            <Field label="Collection Process" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.ar_collections} onChange={set("ar_collections")}
                placeholder="Statements, follow-up cadence, who handles collections, escalation process…" />
            </Field>
            <Field label="AR Issues" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.ar_issues} onChange={set("ar_issues")}
                placeholder="Unapplied credits, duplicate invoices, customer credit risk, undeposited funds…" />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 9 — SALES TAX ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Nine</span>
          <h2 style={sectionHeading}>Sales Tax</h2>
          <p style={sectionSub}>The one that sneaks up on people. Usually with penalties attached.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Collect Sales Tax?">
              <PillRadio name="tax_collect" value={form.tax_collect} onChange={setRadio("tax_collect")}
                options={["Yes", "No", "Should be but isn't"]} />
            </Field>
            <Field label="Filing Frequency">
              <select style={inp()} value={form.tax_frequency} onChange={set("tax_frequency")}>
                <option value="">— Select —</option>
                <option>Monthly</option><option>Quarterly</option><option>Annually</option>
                <option>Not filing</option><option>N/A</option>
              </select>
            </Field>
            <Field label="Current on Filings?">
              <PillRadio name="tax_current" value={form.tax_current} onChange={setRadio("tax_current")} options={["Yes", "Behind", "Unknown"]} />
            </Field>
            <Field label="States / Jurisdictions" full>
              <textarea rows={2} style={inp({ resize: "vertical" })} value={form.tax_jurisdictions} onChange={set("tax_jurisdictions")}
                placeholder="List all states and local jurisdictions where they collect or should collect" />
            </Field>
            <Field label="Sales Tax Issues" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.tax_issues} onChange={set("tax_issues")}
                placeholder="Nexus questions, behind on filings, mis-mapped rates, pending notices…" />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 10 — REPORTING ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Ten</span>
          <h2 style={sectionHeading}>Reporting</h2>
          <p style={sectionSub}>What they see versus what they need to see.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="What Reports Do They Currently Get?" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.reports_current} onChange={set("reports_current")}
                placeholder="P&L monthly, balance sheet, custom job costing, none, etc." />
            </Field>
            <Field label="What Reports Do They Actually Need?" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.reports_needed} onChange={set("reports_needed")}
                placeholder="What questions can't they answer with what they've got?" />
            </Field>
            <Field label="Reporting Cadence">
              <input style={inp()} value={form.reports_cadence} onChange={set("reports_cadence")} placeholder="e.g. Monthly close by the 10th" />
            </Field>
            <Field label="Custom Reports Needed?">
              <PillRadio name="reports_custom" value={form.reports_custom} onChange={setRadio("reports_custom")} options={["Yes", "No", "Maybe"]} />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 11 — COMPLIANCE ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Eleven</span>
          <h2 style={sectionHeading}>Compliance &amp; Year-End</h2>
          <p style={sectionSub}>Tax people, deadlines, and whether anyone's minding the store.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Current CPA / Tax Preparer">
              <input style={inp()} value={form.cpa_name} onChange={set("cpa_name")} />
            </Field>
            <Field label="CPA Contact">
              <input style={inp()} value={form.cpa_contact} onChange={set("cpa_contact")} placeholder="Phone or email" />
            </Field>
            <Field label="Last Year's Filing Status">
              <select style={inp()} value={form.tax_filed} onChange={set("tax_filed")}>
                <option value="">— Select —</option>
                <option>Filed on time</option><option>Filed on extension</option>
                <option>Still pending</option><option>Behind multiple years</option><option>Unknown</option>
              </select>
            </Field>
            <Field label="1099s Filed On Time?">
              <PillRadio name="form_1099" value={form.form_1099} onChange={setRadio("form_1099")} options={["Yes", "Late", "Never", "N/A"]} />
            </Field>
            <Field label="W-2s Filed On Time?">
              <PillRadio name="form_w2" value={form.form_w2} onChange={setRadio("form_w2")} options={["Yes", "Late", "N/A"]} />
            </Field>
            <Field label="Any Active Notices / Audits?">
              <PillRadio name="active_notices" value={form.active_notices} onChange={setRadio("active_notices")} options={["Yes", "No", "Unsure"]} />
            </Field>
            <Field label="Compliance Notes" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.compliance_notes} onChange={set("compliance_notes")}
                placeholder="Open notices, liens, workers comp audit, insurance audits, etc." />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 12 — PAIN POINTS ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Twelve</span>
          <h2 style={sectionHeading}>Pain Points — In Their Own Words</h2>
          <p style={sectionSub}>Shut up and let them tell you. This is where the real engagement lives.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "18px 24px" }}>
            <Field label="Biggest Pain Point" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.pain_top} onChange={set("pain_top")}
                placeholder="What's the thing that made them pick up the phone?" />
            </Field>
            <Field label="Other Pain Points" full>
              <textarea rows={4} style={inp({ resize: "vertical" })} value={form.pain_other} onChange={set("pain_other")}
                placeholder="Secondary frustrations, systems they've tried, what hasn't worked" />
            </Field>
            <Field label="What They Wish They Had" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.pain_wishlist} onChange={set("pain_wishlist")}
                placeholder="In a perfect world, what would their books look like?" />
            </Field>
          </div>
        </div>

        {/* ============== SECTION 13 — SCOPE ============== */}
        <div style={sectionCard} className="tool-section">
          <span style={sectionNum}>§ Thirteen</span>
          <h2 style={sectionHeading}>Your Scope Recommendation</h2>
          <p style={sectionSub}>The verdict. Scope, price, and whether this is a client or a cautionary tale.</p>
          <div className="field-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
            <Field label="Recommended Engagement Type" full>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                {[
                  ["scope_cleanup", "One-time cleanup"], ["scope_ongoing", "Ongoing monthly"],
                  ["scope_cfo", "Fractional CFO"], ["scope_payroll", "Payroll only"],
                  ["scope_training", "Training only"], ["scope_hybrid", "Hybrid"],
                  ["scope_decline", "Decline / refer out"],
                ].map(([key, label]) => (
                  <PillCheckbox key={key} name={key} checked={form[key]} onChange={setCheck(key)} label={label} />
                ))}
              </div>
            </Field>
            <Field label="Estimated Cleanup Hours">
              <input type="number" style={inp()} value={form.est_cleanup_hours} onChange={set("est_cleanup_hours")} min="0" />
            </Field>
            <Field label="Monthly Ongoing Hours">
              <input type="number" style={inp()} value={form.est_monthly_hours} onChange={set("est_monthly_hours")} min="0" />
            </Field>
            <Field label="Proposed Cleanup Fee">
              <input style={inp()} value={form.fee_cleanup} onChange={set("fee_cleanup")} placeholder="$" />
            </Field>
            <Field label="Proposed Monthly Fee">
              <input style={inp()} value={form.fee_monthly} onChange={set("fee_monthly")} placeholder="$" />
            </Field>
            <Field label="🚩 Red Flags" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.red_flags} onChange={set("red_flags")}
                placeholder="What would make you walk away, or price the risk in?" />
            </Field>
            <Field label="✅ Green Flags" full>
              <textarea rows={3} style={inp({ resize: "vertical" })} value={form.green_flags} onChange={set("green_flags")}
                placeholder="What tells you this will be a good fit?" />
            </Field>
            <Field label="Notes to Self" full>
              <textarea rows={4} style={inp({ resize: "vertical" })} value={form.private_notes} onChange={set("private_notes")}
                placeholder="Honest assessment — gut call, timeline, next steps, who else on the team" />
            </Field>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="no-print" style={{
          background: S.cream, border: "1px solid " + S.rule, borderRadius: 12,
          padding: "20px 24px", marginTop: 24, display: "flex",
          flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontStyle: "italic", color: S.muted, fontSize: 15 }}>
            When you're ready —
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={handleOpenVault} disabled={vaultState !== "connected"}
              style={{
                padding: "10px 18px", borderRadius: 8, border: "1px solid " + S.rule,
                background: "#fff", color: vaultState === "connected" ? S.ink : S.muted,
                fontSize: 13, fontWeight: 600, cursor: vaultState === "connected" ? "pointer" : "not-allowed",
                fontFamily: "'Figtree', sans-serif", opacity: vaultState === "connected" ? 1 : 0.5,
              }}>📂 Load from Vault</button>
            <button onClick={handleExportJSON}
              style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid " + S.rule, background: "#fff", color: S.ink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
              ⬇ Export JSON
            </button>
            <button onClick={() => window.print()}
              style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid " + S.rule, background: "#fff", color: S.ink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
              🖨 Print / PDF
            </button>
            <button onClick={handleClear}
              style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid " + S.rule, background: "#fff", color: S.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
              🗑 Clear Form
            </button>
            <button onClick={handleSaveToVault} disabled={savingVault || vaultState !== "connected"}
              style={{
                padding: "10px 22px", borderRadius: 8, border: "none",
                background: vaultState === "connected" ? S.grad : S.muted, color: "#fff",
                fontSize: 13, fontWeight: 700, cursor: (vaultState === "connected" && !savingVault) ? "pointer" : "not-allowed",
                fontFamily: "'Figtree', sans-serif", letterSpacing: "0.02em",
                opacity: savingVault ? 0.6 : 1,
              }}>
              {savingVault ? "Saving…" : "💾 Save to My Vault"}
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "32px 20px 0", color: S.muted, fontSize: 13, fontFamily: "'DM Serif Display', serif", fontStyle: "italic" }}>
          Built for Kari, by Kari. Now go sparkle. That's an order.
        </div>
      </div>

      {/* VAULT MODAL */}
      {showVault && (
        <div onClick={() => setShowVault(false)} style={{
          position: "fixed", inset: 0, background: "rgba(30,30,42,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 500, padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#fff", borderRadius: 14, maxWidth: 600, width: "100%",
            maxHeight: "80vh", overflowY: "auto", padding: "28px 32px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, margin: "0 0 8px", color: S.ink }}>
              Your Vault
            </h3>
            <p style={{ color: S.muted, fontSize: 13, margin: "0 0 16px" }}>
              Click any assessment to load it.
            </p>
            <div style={{ border: "1px solid " + S.rule, borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
              {vaultLoading ? (
                <div style={{ padding: 24, textAlign: "center", color: S.muted, fontStyle: "italic" }}>Loading…</div>
              ) : vaultList.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: S.muted, fontStyle: "italic" }}>No saved assessments yet.</div>
              ) : (
                vaultList.map((row, i) => (
                  <div key={row.id} onClick={() => handleLoadAssessment(row)}
                    style={{
                      padding: "12px 16px", borderBottom: i < vaultList.length - 1 ? "1px solid " + S.rule : "none",
                      cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = S.cream}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ fontWeight: 600, color: S.ink, fontSize: 14 }}>{row.client_name}</div>
                      <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>
                        {row.assessment_date || ""} · saved {new Date(row.updated_at || row.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{
                      padding: "6px 14px", borderRadius: 100, background: S.orangeLight,
                      color: S.orange, fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
                    }}>LOAD</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowVault(false)}
                style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid " + S.rule, background: "#fff", color: S.ink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Figtree', sans-serif" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          background: toast.type === "success" ? S.green : toast.type === "error" ? S.red : S.ink,
          color: "#fff", padding: "14px 20px", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontSize: 14, fontWeight: 500,
          maxWidth: 360, fontFamily: "'Figtree', sans-serif",
        }}>
          {toast.message}
        </div>
      )}

      <script src="https://chat.karikounkel.com/widget.js" defer></script>
    </div>
  );
}
