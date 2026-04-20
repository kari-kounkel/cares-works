import { navigate } from "../App";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const S = {
  slate: "#3d4560", orange: "#e8773a", orangeDark: "#c95f22",
  orangeLight: "#fdf0e8", paper: "#faf8f4", cream: "#f2ede3",
  ink: "#1e1e2a", rule: "#ddd8cc", muted: "#7a7585", gold: "#C9A84C",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const MOBILE_TOOL = "@media (max-width: 640px) { .tool-header { padding: 0 16px !important; } .tool-page { padding: 28px 16px 60px !important; } .tool-h1 { font-size: 26px !important; } .tool-section { padding: 20px 16px !important; } }";

const ENHANCED_SCRIPT = "import imaplib\nimport email\nimport os\nimport csv\nfrom email.header import decode_header\nfrom datetime import datetime\n\n# CONFIGURE THESE\nEMAIL_ADDRESS = 'you@youremail.com'\nEMAIL_PASSWORD = 'your-app-password'\nIMAP_SERVER   = 'imap.gmail.com'\nSAVE_FOLDER   = r'C:\\\\Users\\\\You\\\\Documents\\\\Invoices'\nLOG_FILE      = r'C:\\\\Users\\\\You\\\\Documents\\\\Invoices\\\\email-detail.csv'\n\ndef clean_filename(name):\n    return ''.join(c for c in name if c.isalnum() or c in (' ', '.', '_', '-')).strip()\n\ndef pull_attachments():\n    os.makedirs(SAVE_FOLDER, exist_ok=True)\n    mail = imaplib.IMAP4_SSL(IMAP_SERVER)\n    mail.login(EMAIL_ADDRESS, EMAIL_PASSWORD)\n    mail.select('inbox')\n\n    _, messages = mail.search(None, 'UNSEEN')\n    ids = messages[0].split()\n    print('Found ' + str(len(ids)) + ' unread messages.')\n\n    # Open log file in append mode\n    log_exists = os.path.exists(LOG_FILE)\n    log = open(LOG_FILE, 'a', newline='', encoding='utf-8')\n    writer = csv.writer(log)\n    if not log_exists:\n        writer.writerow(['Date Saved', 'Sender', 'Subject', 'Filename', 'Size (KB)', 'Suggested Category'])\n\n    saved = 0\n    for msg_id in ids:\n        _, msg_data = mail.fetch(msg_id, '(RFC822)')\n        msg = email.message_from_bytes(msg_data[0][1])\n        sender = msg.get('From', '')\n        subject = msg.get('Subject', '')\n\n        for part in msg.walk():\n            if part.get_content_maintype() == 'multipart': continue\n            if part.get('Content-Disposition') is None: continue\n            filename = part.get_filename()\n            if not filename: continue\n            decoded, enc = decode_header(filename)[0]\n            if isinstance(decoded, bytes):\n                filename = decoded.decode(enc or 'utf-8')\n            ext = os.path.splitext(filename)[1].lower()\n            if ext not in ['.pdf', '.xlsx', '.xls', '.csv', '.docx', '.doc', '.png', '.jpg']: continue\n\n            date_prefix = datetime.now().strftime('%Y-%m-%d')\n            safe_name = clean_filename(filename)\n            dest = os.path.join(SAVE_FOLDER, date_prefix + '_' + safe_name)\n            counter = 1\n            base, ext2 = os.path.splitext(dest)\n            while os.path.exists(dest):\n                dest = base + '_' + str(counter) + ext2\n                counter += 1\n\n            payload = part.get_payload(decode=True)\n            with open(dest, 'wb') as f: f.write(payload)\n\n            # Suggest category from sender or subject\n            text = (sender + ' ' + subject).lower()\n            if 'invoice' in text or 'bill' in text: category = 'AP - Invoice'\n            elif 'receipt' in text or 'order' in text: category = 'Expense - Receipt'\n            elif 'statement' in text: category = 'Bank/CC - Statement'\n            elif 'w-9' in text or 'w9' in text: category = 'Vendor - W-9'\n            elif '1099' in text or 'w-2' in text: category = 'Tax - Forms'\n            elif 'contract' in text or 'agreement' in text: category = 'Legal - Contracts'\n            else: category = 'REVIEW'\n\n            size_kb = len(payload) // 1024\n            writer.writerow([date_prefix, sender, subject, safe_name, size_kb, category])\n            print('Saved: ' + dest + ' [' + category + ']')\n            saved += 1\n\n    log.close()\n    mail.logout()\n    print('Done. ' + str(saved) + ' file(s) saved. Log updated: ' + LOG_FILE)\n\nif __name__ == '__main__':\n    pull_attachments();\n";

const WORKFLOWS = [
  {
    num: "01",
    title: "Use the email-detail.csv file every morning",
    body: "The enhanced script doesn't just save attachments — it logs every one to a CSV with sender, subject, filename, size, and a suggested category. Open this file in Excel each morning. Sort by 'Suggested Category' and you'll see your day's work organized for you. Anything tagged 'REVIEW' is what needs a human decision."
  },
  {
    num: "02",
    title: "Build the suggested category list around YOUR vendors",
    body: "The script suggests categories based on common keywords (invoice, receipt, statement). Edit the script to add your own. If 'Xcel Energy' always sends utility bills, add: if 'xcel' in text: category = 'Utilities - Electric'. The more you teach it, the less the 'REVIEW' pile gets each week. Spend 15 minutes on this once a quarter and the script becomes yours."
  },
  {
    num: "03",
    title: "The Monday rhythm — 15 minutes, every week",
    body: "Open email-detail.csv from last week. Filter to last 7 days. Three columns to look at: vendors you got bills from, total dollar amounts you can eyeball, anything in 'REVIEW'. Process the REVIEW pile first (15-20 items max). Then archive the week's attachments into your accounting system. Done in 15 minutes if you don't let it pile up."
  },
  {
    num: "04",
    title: "Bridge to QuickBooks — the import sequence",
    body: "Once attachments are sorted into categories, the QuickBooks Online flow is: (1) Open the file in your folder. (2) Go to Banking → Receipts → Upload. (3) Drag the file in. QuickBooks AI reads vendor name, date, and amount. (4) Match to existing transaction OR create new bill. The category from your CSV tells you exactly which Chart of Accounts line to assign. Five files takes 3 minutes; thirty files takes 12. Faster than anything else."
  },
  {
    num: "05",
    title: "Monthly reconciliation — the end-of-month closure",
    body: "Last day of the month, open email-detail.csv. Filter to that month. Match the vendor list against your AP aging report in QuickBooks. Anything in your CSV but not in your AP? You forgot to enter it. Anything in AP but not in your CSV? You paid via credit card or auto-debit and the receipt didn't email. This 10-minute reconciliation catches every missing transaction every month. No more 'where did $400 go' surprises."
  },
  {
    num: "06",
    title: "Year-end: turn the CSV into a vendor 1099 prep list",
    body: "Open email-detail.csv at year-end. Sort by sender. Group by sender domain. Now you have a complete list of every vendor you got mail from this year — which is your 1099 prep list. Cross-reference against your QuickBooks vendor list. Any vendor you paid over $600 who isn't on your sender list? They should still be — that's a missing relationship to track down. Anyone on your sender list paid over $600 with no W-9 on file? Get the W-9 now, not in January."
  }
];

export default function EmailAttachmentsAdvanced({ session }) {
  const [copied, setCopied] = useState(false);
  const [openStep, setOpenStep] = useState("01");
  const [isMember, setIsMember] = useState(null); // null = loading

  useEffect(() => {
    if (!session) { setIsMember(false); return; }
    supabase.from("members").select("status").eq("email", session.user.email).single()
      .then(({ data }) => { setIsMember(data && data.status === "active"); });
  }, [session]);

  const copy = () => {
    navigator.clipboard.writeText(ENHANCED_SCRIPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Loading state
  if (isMember === null) {
    return (
      <div style={{ minHeight: "100vh", background: S.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif", color: S.muted, fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  // Non-member gate
  if (!isMember) {
    return (
      <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
        <style>{MOBILE_TOOL}</style>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <header className="tool-header" style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
          <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>CARES <span style={{ color: S.orange }}>Works.</span></a>
          <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>{"<- Dashboard"}</a>
        </header>
        <div className="tool-page" style={{ maxWidth: 640, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 12, fontWeight: 700 }}>Members Only</div>
          <h1 className="tool-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: S.slate, marginBottom: 16, lineHeight: 1.2 }}>What to Do With the Attachments After You Have Them</h1>
          <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.7, marginBottom: 28, maxWidth: 480, margin: "0 auto 28px" }}>
            The free script gets your attachments out of email and into a folder. This members-only workflow shows you what to do with them once they land — the Excel email-detail file, the Monday rhythm, the QuickBooks bridge, monthly reconciliation, and how to use your CSV as a 1099 prep list at year-end.
          </p>
          <a href="https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06" style={{ display: "inline-block", background: S.grad, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", padding: "14px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700, marginBottom: 12 }}>Join — $27/mo</a>
          <div style={{ fontSize: 12, color: S.muted, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>or annual — $270/year (2 months free)</div>
        </div>
        <script src="https://chat.karikounkel.com/widget.js" defer></script>
      </div>
    );
  }

  // Member — full content
  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE_TOOL}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header className="tool-header" style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>CARES <span style={{ color: S.orange }}>Works.</span></a>
        <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>{"<- Dashboard"}</a>
      </header>

      <div className="tool-page" style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>Member Tool · Advanced</div>
          <h1 className="tool-h1" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: S.slate, lineHeight: 1.15, marginBottom: 16 }}>
            What to Do With the<br /><em style={{ color: S.muted, fontSize: 32 }}>Attachments After.</em>
          </h1>
          <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.7, maxWidth: 580, marginBottom: 12 }}>
            The free script gets your attachments out of email. This is the workflow that turns a folder of files into bookkeeping done.
          </p>
          <p style={{ fontSize: 14, color: S.muted, fontStyle: "italic", maxWidth: 580, marginBottom: 24 }}>
            New: enhanced script that also writes an email-detail CSV with sender, subject, suggested category, and size. Below that — six workflows for using it.
          </p>
          <div style={{ width: 48, height: 3, background: S.grad, borderRadius: 100 }} />
        </div>

        {/* THE ENHANCED SCRIPT */}
        <div style={{ background: S.orangeLight, border: "1px solid #f0c8a0", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.orange, marginBottom: 8, fontWeight: 700 }}>What's enhanced</div>
          <div style={{ fontSize: 14, color: S.ink, lineHeight: 1.6 }}>
            Same script as the free version, plus: writes every saved attachment to <strong>email-detail.csv</strong> with sender, subject, filename, size, and an auto-suggested category (AP Invoice, Bank Statement, W-9, etc.). The CSV is what makes the workflows below work.
          </div>
        </div>

        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: S.slate, marginBottom: 12 }}>Enhanced Script</h2>
        <p style={{ fontSize: 14, color: S.muted, marginBottom: 16, lineHeight: 1.6 }}>
          Replace the free version with this one. Edit the four CONFIGURE lines at the top. Save as <span style={{ fontFamily: "'DM Mono', monospace", background: S.cream, padding: "1px 6px", borderRadius: 4 }}>pull_attachments.py</span>.
        </p>

        <div style={{ background: S.slate, borderRadius: 12, overflow: "hidden", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>pull_attachments.py (enhanced)</span>
            <button onClick={copy} style={{ padding: "6px 16px", background: copied ? "#5a9a5a" : S.orange, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", transition: "background 0.2s" }}>
              {copied ? "Copied!" : "Copy Script"}
            </button>
          </div>
          <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, padding: "20px 24px", margin: 0, overflowX: "auto", whiteSpace: "pre", maxHeight: 420 }}>{ENHANCED_SCRIPT}</pre>
        </div>

        {/* THE WORKFLOWS */}
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate, marginBottom: 8 }}>Six Workflows</h2>
        <p style={{ fontSize: 14, color: S.muted, marginBottom: 24, lineHeight: 1.6 }}>
          What to actually do with sorted attachments — daily, weekly, monthly, and at year-end.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {WORKFLOWS.map(w => {
            const isOpen = openStep === w.num;
            return (
              <div key={w.num} style={{ background: "#fff", border: "1px solid " + (isOpen ? S.orange : S.rule), borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" }}>
                <div onClick={() => setOpenStep(isOpen ? null : w.num)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", cursor: "pointer" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: S.orange, flexShrink: 0 }}>{w.num}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: S.slate, flex: 1, lineHeight: 1.3 }}>{w.title}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: S.muted, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid " + S.rule, padding: "20px 24px", background: S.cream }}>
                    <p style={{ fontFamily: "'Figtree', sans-serif", fontSize: 14, color: S.ink, lineHeight: 1.75, margin: 0 }}>{w.body}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CLOSING NOTE */}
        <div style={{ background: S.cream, border: "1px solid " + S.rule, borderLeft: "4px solid " + S.orange, borderRadius: 10, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: S.slate, fontStyle: "italic", lineHeight: 1.6 }}>
            The script is the easy part. The workflow is the part that turns a folder of files into a clean set of books at month-end.
          </div>
        </div>

      </div>
      <script src="https://chat.karikounkel.com/widget.js" defer></script>
    </div>
  );
}
