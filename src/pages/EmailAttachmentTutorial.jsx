import { useState } from "react";

const S = {
  slate: "#3d4560", orange: "#e8773a", orangeLight: "#fdf0e8",
  paper: "#faf8f4", cream: "#f2ede3", ink: "#1e1e2a",
  rule: "#ddd8cc", muted: "#7a7585", gold: "#C9A84C",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const SCRIPT = `import imaplib
import email
import os
from email.header import decode_header
from datetime import datetime

# ── CONFIGURE THESE ────────────────────────────────────────────
EMAIL_ADDRESS = "you@youremail.com"
EMAIL_PASSWORD = "your-app-password"       # Gmail: use an App Password, not your login password
IMAP_SERVER   = "imap.gmail.com"           # For Outlook: imap-mail.outlook.com
SAVE_FOLDER   = r"C:\\Users\\You\\Documents\\Invoices"  # Where files will land
# ───────────────────────────────────────────────────────────────

def clean_filename(name):
    return "".join(c for c in name if c.isalnum() or c in (" ", ".", "_", "-")).strip()

def pull_attachments():
    os.makedirs(SAVE_FOLDER, exist_ok=True)
    mail = imaplib.IMAP4_SSL(IMAP_SERVER)
    mail.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
    mail.select("inbox")

    _, messages = mail.search(None, "UNSEEN")
    ids = messages[0].split()
    print(f"Found {len(ids)} unread messages.")
    saved = 0

    for msg_id in ids:
        _, msg_data = mail.fetch(msg_id, "(RFC822)")
        msg = email.message_from_bytes(msg_data[0][1])

        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue
            if part.get("Content-Disposition") is None:
                continue

            filename = part.get_filename()
            if not filename:
                continue

            decoded, enc = decode_header(filename)[0]
            if isinstance(decoded, bytes):
                filename = decoded.decode(enc or "utf-8")

            ext = os.path.splitext(filename)[1].lower()
            if ext not in [".pdf", ".xlsx", ".xls", ".csv", ".docx", ".doc", ".png", ".jpg"]:
                continue

            date_prefix = datetime.now().strftime("%Y-%m-%d")
            safe_name = clean_filename(filename)
            dest = os.path.join(SAVE_FOLDER, date_prefix + "_" + safe_name)

            # Don't overwrite — add a counter if file exists
            counter = 1
            base, ext2 = os.path.splitext(dest)
            while os.path.exists(dest):
                dest = base + "_" + str(counter) + ext2
                counter += 1

            with open(dest, "wb") as f:
                f.write(part.get_payload(decode=True))

            print(f"Saved: {dest}")
            saved += 1

    mail.logout()
    print(f"Done. {saved} file(s) saved to {SAVE_FOLDER}")

if __name__ == "__main__":
    pull_attachments()
`;

const STEPS = [
  {
    num: "01",
    title: "Install Python",
    content: "Go to python.org/downloads and install Python 3.10 or newer. During installation, check the box that says \"Add Python to PATH\" — do not skip this. When it is done, open a Command Prompt and type: python --version. If you see a version number, you are ready.",
  },
  {
    num: "02",
    title: "Create an App Password (Gmail)",
    content: "Your regular Gmail password will not work here. Google requires an App Password for third-party scripts.\n\n1. Go to myaccount.google.com\n2. Click Security on the left\n3. Under \"How you sign in to Google,\" click 2-Step Verification (enable it if it is off)\n4. Scroll to the bottom and click App Passwords\n5. Choose \"Mail\" and \"Windows Computer\" (or Mac)\n6. Google gives you a 16-character password — copy it, you only see it once\n\nFor Outlook: use your regular password but enable IMAP in Settings first.",
  },
  {
    num: "03",
    title: "Copy the Script",
    content: "Use the Copy Script button below. Open Notepad (or any plain text editor — not Word). Paste the script. Edit the three lines at the top:\n\n— EMAIL_ADDRESS: your email\n— EMAIL_PASSWORD: the App Password from Step 02\n— SAVE_FOLDER: the folder on your computer where files should land\n\nSave the file as: pull_attachments.py\nMake sure it saves as .py and not .py.txt — in Notepad, set \"Save as type\" to \"All Files.\"",
  },
  {
    num: "04",
    title: "Run It",
    content: "Open Command Prompt. Navigate to where you saved the file:\n\ncd C:\\Users\\YourName\\Documents\n\nThen run:\n\npython pull_attachments.py\n\nYou should see it printing file names as it saves them. When it is done, open your SAVE_FOLDER — everything is there, dated, named, ready.\n\nTo run it every morning without thinking about it: search \"Task Scheduler\" in Windows and set it to run the script at 7:00 AM daily.",
  },
  {
    num: "05",
    title: "Troubleshooting",
    content: "Login failed: Double-check the App Password. No spaces. Make sure 2-Step Verification is on.\n\nNo files saved: The script only grabs UNREAD messages. If your inbox is all read, mark some as unread and try again. Or change \"UNSEEN\" in the script to \"ALL\" to grab everything.\n\nFile not found error: Check your SAVE_FOLDER path. Use double backslashes in Windows paths (C:\\\\Users\\\\...) or forward slashes (C:/Users/...).\n\nPython not recognized: You did not check \"Add Python to PATH\" during install. Uninstall and reinstall with that box checked.",
  },
];

export default function EmailAttachmentTutorial() {
  const [copied, setCopied] = useState(false);
  const [openStep, setOpenStep] = useState(null);

  const copy = () => {
    navigator.clipboard.writeText(SCRIPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <header style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>
          CARES <span style={{ color: S.orange }}>Works.</span>
        </a>
        <a href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>{"<- Dashboard"}</a>
      </header>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>Free Tool — Automation</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: S.slate, lineHeight: 1.15, marginBottom: 16 }}>
            Stop Drowning in<br />Email Attachments
          </h1>
          <p style={{ fontSize: 16, color: S.muted, lineHeight: 1.7, maxWidth: 580, marginBottom: 12 }}>
            Every morning, somewhere in your inbox, there are invoices, vendor docs, and receipts sitting in emails you have not touched yet. This Python script pulls all of them out, names them by date, and drops them in a folder — automatically.
          </p>
          <p style={{ fontSize: 15, color: S.muted, lineHeight: 1.7, maxWidth: 580, marginBottom: 24 }}>
            No coding experience needed. Five steps. Fifteen minutes. Done.
          </p>
          <div style={{ width: 48, height: 3, background: S.grad, borderRadius: 100 }} />
        </div>

        {/* WHAT IT DOES */}
        <div style={{ background: S.orangeLight, border: "1px solid #f0c8a0", borderRadius: 12, padding: "24px 28px", marginBottom: 40 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: S.orange, marginBottom: 12 }}>What this script does</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["Connects to your Gmail or Outlook inbox securely", "Finds every unread message with an attachment", "Pulls out PDFs, spreadsheets, Word docs, and images", "Names each file with today's date so they sort automatically", "Saves them to a folder of your choosing — no more hunting", "Can be scheduled to run every morning at 7am without you touching it"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: S.orange, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 14, color: S.ink, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEPS */}
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate, marginBottom: 20 }}>How to Set It Up</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
          {STEPS.map(step => {
            const isOpen = openStep === step.num;
            return (
              <div key={step.num} style={{ background: "#fff", border: "1px solid " + (isOpen ? S.orange : S.rule), borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" }}>
                <div onClick={() => setOpenStep(isOpen ? null : step.num)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 24px", cursor: "pointer" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: S.orange, flexShrink: 0 }}>{step.num}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: S.slate, flex: 1 }}>{step.title}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: S.muted, flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid " + S.rule, padding: "20px 24px", background: S.cream }}>
                    <pre style={{ fontFamily: "'Figtree', sans-serif", fontSize: 14, color: S.ink, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>{step.content}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* THE SCRIPT */}
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate, marginBottom: 12 }}>The Script</h2>
        <p style={{ fontSize: 14, color: S.muted, marginBottom: 20, lineHeight: 1.6 }}>
          Copy this, paste it into Notepad, edit the three lines at the top, and save as <span style={{ fontFamily: "'DM Mono', monospace", background: S.cream, padding: "1px 6px", borderRadius: 4 }}>pull_attachments.py</span>.
        </p>

        <div style={{ background: S.slate, borderRadius: 12, overflow: "hidden", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>pull_attachments.py</span>
            <button onClick={copy} style={{ padding: "6px 16px", background: copied ? "#5a9a5a" : S.orange, border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", transition: "background 0.2s" }}>
              {copied ? "Copied!" : "Copy Script"}
            </button>
          </div>
          <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.7, padding: "20px 24px", margin: 0, overflowX: "auto", whiteSpace: "pre" }}>{SCRIPT}</pre>
        </div>

        {/* CTA */}
        <div style={{ background: S.slate, borderRadius: 14, padding: "36px 40px", color: "#fff", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(232,119,58,0.15) 0%, transparent 60%)" }} />
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>CARES Works Membership</div>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, marginBottom: 10, lineHeight: 1.2 }}>There are 15 more tools like this one.</h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 24, maxWidth: 460 }}>New tool every week. Monthly Debrief with real answers. Court of Accounts — a business parable that actually teaches something. $27/month.</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <a href="https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06" style={{ display: "inline-block", background: S.grad, color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 28px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Join Monthly — $27/mo</a>
              <a href="https://buy.stripe.com/5kQ8wPd7F3Lk6eT3Yg18c07" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.gold, textDecoration: "none", letterSpacing: "0.08em", fontWeight: 700 }}>Or annual — $197/year</a>
            </div>
          </div>
        </div>

      </div>
      <script src="https://chat.karikounkel.com/widget.js" defer></script>
    </div>
  );
}
