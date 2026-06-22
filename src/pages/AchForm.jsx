// =============================================================================
// AchForm.jsx
// CARES Works — ACH Banking Form. Free tool, no storage, browser-only.
// Two modes: Collect (blank printable form to send) / Share (fill your own info).
// Route: /tools/ach-form
// =============================================================================

import { useState, useRef } from 'react';

const MONTHLY_URL = 'https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06';
const ANNUAL_URL = 'https://buy.stripe.com/14A5kD4B981AgTxcuM18c09';

function today() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AchForm() {
  const [mode, setMode] = useState('collect');
  const [showOutput, setShowOutput] = useState(false);
  const [outputType, setOutputType] = useState('print');
  const [copyDone, setCopyDone] = useState(false);
  const outputRef = useRef(null);

  // Collect mode
  const [cBiz, setCBiz] = useState('');
  const [cContact, setCContact] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cPayee, setCPayee] = useState('');
  const [cPurpose, setCPurpose] = useState('');

  // Share mode
  const [sName, setSName] = useState('');
  const [sBiz, setSBiz] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sBank, setSBank] = useState('');
  const [sType, setSType] = useState('');
  const [sRouting, setSRouting] = useState('');
  const [sAccount, setSAccount] = useState('');
  const [sRecipient, setSRecipient] = useState('');
  const [sPurpose, setSPurpose] = useState('');


  function switchMode(m) {
    setShowOutput(false);
    setCopyDone(false);
  }

  function reset() {
    setCBiz(''); setCContact(''); setCEmail(''); setCPhone(''); setCPayee(''); setCPurpose('');
    setSName(''); setSBiz(''); setSAddress(''); setSPhone(''); setSEmail('');
    setSBank(''); setSType(''); setSRouting(''); setSAccount(''); setSRecipient(''); setSPurpose('');
    setShowOutput(false);
    setCopyDone(false);
  }

  function generateCollect() {
    setOutputType('print');
    setShowOutput(true);
    setTimeout(() => outputRef.current && outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function generateShare() {
    setOutputType('print');
    setShowOutput(true);
    setTimeout(() => outputRef.current && outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function generateText() {
    setOutputType('text');
    setShowOutput(true);
    setTimeout(() => outputRef.current && outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function copyText() {
    const lines = [
      'ACH BANKING INFORMATION',
      'Date: ' + today(),
      sRecipient ? 'Prepared for: ' + sRecipient : '',
      sPurpose ? 'Purpose: ' + sPurpose : '',
      '',
      'ACCOUNT HOLDER',
      sName ? 'Name: ' + sName : '',
      sBiz ? 'Business: ' + sBiz : '',
      sAddress ? 'Address: ' + sAddress : '',
      sPhone ? 'Phone: ' + sPhone : '',
      sEmail ? 'Email: ' + sEmail : '',
      '',
      'BANKING DETAILS',
      sBank ? 'Bank: ' + sBank : '',
      sType ? 'Account Type: ' + sType : '',
      sRouting ? 'Routing Number: ' + sRouting : '',
      sAccount ? 'Account Number: ' + sAccount : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2500);
    });
  }

  const bizLabel = cBiz || '[Your Business Name]';

  return (
    <div className="ach-page">
      <Styles />
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="ach-site-header">
        <a href="/" className="ach-site-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/cares-works-logo.png" alt="CARES Works" style={{ height: 32, width: 'auto', display: 'block' }} />
          <span>CARES <span className="ach-brand-accent">Works.</span></span>
        </a>
        <nav className="ach-site-nav">
          <a href="/" className="ach-nav-link">All Free Tools</a>
          <a href="/#join" className="ach-nav-link">Membership</a>
          <a href={MONTHLY_URL} className="ach-nav-join">Join — $27/mo</a>
        </nav>
      </header>

      <div className="ach-hero">
        <div className="ach-hero-inner">
          <div className="ach-eyebrow">A CARES Works Tool</div>
          <h1 className="ach-h1">ACH <span className="ach-accent">Banking Form</span></h1>
          <div className="ach-tagline">Revenue is vanity. Net profit is sanity.</div>
          <p className="ach-hero-desc">
            Collect banking details from someone else — or package your own to share.
            Nothing is stored. Nothing is sent. Everything stays in your browser.
          </p>
        </div>
      </div>

      <main className="ach-main">

        {/* MODE TOGGLE */}
        <div className="ach-mode-row">
          <button
            className={'ach-mode-btn' + (mode === 'collect' ? ' ach-active' : '')}
            onClick={() => switchMode('collect')}
          >
            📥 Collect ACH Info
          </button>
          <button
            className={'ach-mode-btn' + (mode === 'share' ? ' ach-active' : '')}
            onClick={() => switchMode('share')}
          >
            📤 Share My ACH Info
          </button>
        </div>

        <div className="ach-mode-desc">
          {mode === 'collect' ? (
            <>
              <strong>Collecting from someone else.</strong> Enter your business name, then generate a
              blank printable form to send. They fill in their banking details and return it to you.
            </>
          ) : (
            <>
              <strong>Sharing your own info.</strong> Fill in your banking details and generate a
              formatted sheet to hand off — to an employer, client, or vendor.
            </>
          )}
        </div>

        {/* COLLECT MODE */}
        {mode === 'collect' && (
          <div>
            <div className="ach-section">
              <div className="ach-section-label">Your Business Info</div>
              <div className="ach-row">
                <Field label="Your Business Name" required>
                  <input className="ach-input" value={cBiz} onChange={e => setCBiz(e.target.value)} placeholder="CARES Consulting LLC" />
                </Field>
                <Field label="Your Contact Name">
                  <input className="ach-input" value={cContact} onChange={e => setCContact(e.target.value)} placeholder="Kari Kounkel" />
                </Field>
              </div>
              <div className="ach-row">
                <Field label="Your Email">
                  <input className="ach-input" type="email" value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="kari@caresmn.com" />
                </Field>
                <Field label="Your Phone">
                  <input className="ach-input" type="tel" value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="(612) 000-0000" />
                </Field>
              </div>
            </div>

            <div className="ach-section">
              <div className="ach-section-label">Payee / Vendor Info (Optional)</div>
              <div className="ach-row">
                <Field label="Payee Name or Business">
                  <input className="ach-input" value={cPayee} onChange={e => setCPayee(e.target.value)} placeholder="Leave blank — they'll fill this in" />
                </Field>
                <Field label="Purpose / Description">
                  <input className="ach-input" value={cPurpose} onChange={e => setCPurpose(e.target.value)} placeholder="e.g. Contractor payroll, vendor payment" />
                </Field>
              </div>
            </div>

            <div className="ach-security">
              🔒 This generates a <strong>printable document</strong> to send to your payee.
              They complete and return it to you through a secure channel. Never request ACH info via unprotected email.
            </div>

            <div className="ach-actions">
              <button className="ach-btn-primary" onClick={generateCollect}>📄 Generate Blank Form</button>
              <button className="ach-btn-ghost" onClick={reset}>Clear</button>
            </div>
          </div>
        )}

        {/* SHARE MODE */}
        {mode === 'share' && (
          <div>
            <div className="ach-section">
              <div className="ach-section-label">Account Holder Information</div>
              <div className="ach-row">
                <Field label="Full Legal Name" required>
                  <input className="ach-input" value={sName} onChange={e => setSName(e.target.value)} placeholder="Name on the bank account" />
                </Field>
                <Field label="Business Name (if applicable)">
                  <input className="ach-input" value={sBiz} onChange={e => setSBiz(e.target.value)} placeholder="Leave blank if personal account" />
                </Field>
              </div>
              <div className="ach-row ach-full">
                <Field label="Address on Account" required>
                  <input className="ach-input" value={sAddress} onChange={e => setSAddress(e.target.value)} placeholder="Street address, City, State, ZIP" />
                </Field>
              </div>
              <div className="ach-row">
                <Field label="Phone">
                  <input className="ach-input" type="tel" value={sPhone} onChange={e => setSPhone(e.target.value)} placeholder="(612) 000-0000" />
                </Field>
                <Field label="Email">
                  <input className="ach-input" type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="your@email.com" />
                </Field>
              </div>
            </div>

            <div className="ach-section">
              <div className="ach-section-label">Banking Details</div>
              <div className="ach-row">
                <Field label="Bank Name" required>
                  <input className="ach-input" value={sBank} onChange={e => setSBank(e.target.value)} placeholder="e.g. Wells Fargo, US Bank" />
                </Field>
                <Field label="Account Type" required>
                  <select className="ach-input" value={sType} onChange={e => setSType(e.target.value)}>
                    <option value="">— Select —</option>
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Business Checking">Business Checking</option>
                    <option value="Business Savings">Business Savings</option>
                  </select>
                </Field>
              </div>
              <div className="ach-row">
                <Field label="Routing Number" required hint="9 digits — bottom-left of a check">
                  <input className="ach-input" value={sRouting} onChange={e => setSRouting(e.target.value)} placeholder="9 digits" maxLength={9} inputMode="numeric" />
                </Field>
                <Field label="Account Number" required hint="Bottom of check, right of routing number">
                  <input className="ach-input" value={sAccount} onChange={e => setSAccount(e.target.value)} placeholder="Your account number" inputMode="numeric" />
                </Field>
              </div>
            </div>

            <div className="ach-section">
              <div className="ach-section-label">Sending To (Optional)</div>
              <div className="ach-row">
                <Field label="Recipient / Business Name">
                  <input className="ach-input" value={sRecipient} onChange={e => setSRecipient(e.target.value)} placeholder="Who is requesting this info?" />
                </Field>
                <Field label="Purpose">
                  <input className="ach-input" value={sPurpose} onChange={e => setSPurpose(e.target.value)} placeholder="e.g. Direct deposit setup, vendor payment" />
                </Field>
              </div>
            </div>

            <div className="ach-security">
              🔒 <span><strong>Before you send this back:</strong> Use your browser to print this page as a PDF (File → Print → Save as PDF). Then password-protect the PDF before sending — most PDF readers and preview apps let you set a password under File → Export or Save As. Only share through a trusted channel — in person, encrypted file, or your employer's secure portal. <strong>Never email account numbers as an unprotected attachment or in the body of an email.</strong></span>
            </div>

            <div className="ach-actions">
              <button className="ach-btn-primary" onClick={generateShare}>📄 Generate My ACH Sheet</button>
              <button className="ach-btn-gold" onClick={generateText}>📋 Copy as Text</button>
              <button className="ach-btn-ghost" onClick={reset}>Clear</button>
            </div>
          </div>
        )}

        {/* OUTPUT PANEL */}
        {showOutput && (
          <div className="ach-output" ref={outputRef}>
            <div className="ach-output-header">
              <h3 className="ach-output-title">
                {mode === 'collect' ? 'ACH Authorization Form — Blank' : outputType === 'text' ? 'Copy as Text' : 'ACH Banking Info Sheet'}
              </h3>
              <span className="ach-output-badge">READY TO {outputType === 'text' ? 'COPY' : 'PRINT'}</span>
            </div>

            <div className="ach-output-body">

              {/* COLLECT PRINT */}
              {mode === 'collect' && (
                <div className="ach-doc">
                  <div className="ach-doc-header">
                    <div>
                      <div className="ach-doc-title">ACH Authorization Form</div>
                      <div className="ach-doc-sub">Requested by {bizLabel}</div>
                    </div>
                    <div className="ach-doc-date">
                      <span>Date Requested</span>
                      {today()}
                    </div>
                  </div>

                  {cPurpose && (
                    <div className="ach-purpose-note">
                      <strong>Purpose:</strong> {cPurpose}
                    </div>
                  )}

                  <div className="ach-doc-section-title">Requesting Party</div>
                  <div className="ach-print-grid">
                    <PrintField label="Business Name" value={bizLabel} />
                    {cContact && <PrintField label="Contact Name" value={cContact} />}
                    {cEmail && <PrintField label="Email" value={cEmail} />}
                    {cPhone && <PrintField label="Phone" value={cPhone} />}
                  </div>

                  <div className="ach-doc-section-title">Payee Information — Please Complete</div>
                  <div className="ach-print-grid">
                    <PrintBlank label="Full Legal Name" />
                    <PrintBlank label="Business Name (if applicable)" />
                  </div>
                  <div className="ach-print-grid ach-grid-full">
                    <PrintBlank label="Address on Account" />
                  </div>
                  <div className="ach-print-grid">
                    <PrintBlank label="Phone" />
                    <PrintBlank label="Email" />
                  </div>

                  <div className="ach-doc-section-title">Banking Details — Please Complete</div>
                  <div className="ach-print-grid">
                    <PrintBlank label="Bank Name" />
                    <div className="ach-print-field">
                      <div className="ach-pf-label">Account Type</div>
                      <div className="ach-check-row">
                        <label className="ach-check"><input type="checkbox" /> Checking</label>
                        <label className="ach-check"><input type="checkbox" /> Savings</label>
                        <label className="ach-check"><input type="checkbox" /> Business</label>
                      </div>
                    </div>
                  </div>
                  <div className="ach-sensitive">
                    <div className="ach-print-grid">
                      <PrintBlank label="⚠ Routing Number (9 digits)" sensitive />
                      <PrintBlank label="⚠ Account Number" sensitive />
                    </div>
                  </div>

                  <div className="ach-auth-block">
                    <p className="ach-auth-text">
                      By signing below, I authorize <strong>{bizLabel}</strong> to initiate ACH credit
                      and/or debit entries to my account at the financial institution identified above,
                      in accordance with applicable agreements. This authorization is to remain in full
                      force until revoked in writing.
                    </p>
                    <div className="ach-sig-grid">
                      <PrintBlank label="Authorized Signature" />
                      <PrintBlank label="Date" />
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <PrintBlank label="Printed Name" />
                    </div>
                  </div>
                </div>
              )}

              {/* SHARE PRINT */}
              {mode === 'share' && outputType === 'print' && (
                <div className="ach-doc">
                  <div className="ach-doc-header">
                    <div>
                      <div className="ach-doc-title">ACH Banking Information</div>
                      <div className="ach-doc-sub">{sBiz || sName || '[Account Holder]'}</div>
                    </div>
                    <div className="ach-doc-date">
                      <span>Date Prepared</span>
                      {today()}
                    </div>
                  </div>

                  {(sRecipient || sPurpose) && (
                    <div className="ach-purpose-note">
                      {sRecipient && <span><strong>Prepared for:</strong> {sRecipient}&nbsp;&nbsp;</span>}
                      {sPurpose && <span><strong>Purpose:</strong> {sPurpose}</span>}
                    </div>
                  )}

                  <div className="ach-doc-section-title">Account Holder Information</div>
                  <div className="ach-print-grid">
                    <PrintField label="Full Legal Name" value={sName || '[Name]'} />
                    {sBiz && <PrintField label="Business Name" value={sBiz} />}
                  </div>
                  {sAddress && (
                    <div className="ach-print-grid ach-grid-full">
                      <PrintField label="Address on Account" value={sAddress} />
                    </div>
                  )}
                  {(sPhone || sEmail) && (
                    <div className="ach-print-grid">
                      {sPhone && <PrintField label="Phone" value={sPhone} />}
                      {sEmail && <PrintField label="Email" value={sEmail} />}
                    </div>
                  )}

                  <div className="ach-doc-section-title">Banking Details</div>
                  <div className="ach-print-grid">
                    <PrintField label="Bank Name" value={sBank || '[Bank Name]'} />
                    <PrintField label="Account Type" value={sType || '[Account Type]'} />
                  </div>
                  <div className="ach-sensitive">
                    <div className="ach-print-grid">
                      <PrintField label="⚠ Routing Number" value={sRouting || '[Routing Number]'} sensitive />
                      <PrintField label="⚠ Account Number" value={sAccount || '[Account Number]'} sensitive />
                    </div>
                  </div>

                  <div className="ach-auth-block">
                    <p className="ach-auth-text">
                      I authorize the release of the above banking information for the purpose of
                      establishing ACH payment arrangements. I confirm this information is accurate
                      as of the date above.
                    </p>
                    <div className="ach-sig-grid">
                      <PrintBlank label="Signature" />
                      <PrintBlank label="Date" />
                    </div>
                    <p className="ach-auth-text" style={{ marginTop: '16px', borderTop: '1px dashed #ddd', paddingTop: '14px' }}>
                      <strong>How to return this form securely:</strong> Print as PDF (File → Print → Save as PDF), then password-protect it before sending (File → Export or Save As → add password). Do not email banking details as an unprotected attachment or in the body of an email.
                    </p>
                  </div>
                </div>
              )}

              {/* SHARE TEXT */}
              {mode === 'share' && outputType === 'text' && (
                <div>
                  <p className="ach-copy-hint">Click copy, then paste into a secure message or document.</p>
                  <div className="ach-copy-panel">
                    <button
                      className={'ach-copy-btn' + (copyDone ? ' ach-copied' : '')}
                      onClick={copyText}
                    >
                      {copyDone ? 'Copied ✓' : 'Copy'}
                    </button>
                    <pre className="ach-copy-pre">
                      {'ACH BANKING INFORMATION\n'}
                      {'Date: ' + today() + '\n'}
                      {sRecipient ? 'Prepared for: ' + sRecipient + '\n' : ''}
                      {sPurpose ? 'Purpose: ' + sPurpose + '\n' : ''}
                      {'\nACCOUNT HOLDER\n'}
                      {sName ? 'Name: ' + sName + '\n' : ''}
                      {sBiz ? 'Business: ' + sBiz + '\n' : ''}
                      {sAddress ? 'Address: ' + sAddress + '\n' : ''}
                      {sPhone ? 'Phone: ' + sPhone + '\n' : ''}
                      {sEmail ? 'Email: ' + sEmail + '\n' : ''}
                      {'\nBANKING DETAILS\n'}
                      {sBank ? 'Bank: ' + sBank + '\n' : ''}
                      {sType ? 'Account Type: ' + sType + '\n' : ''}
                      {sRouting ? 'Routing Number: ' + sRouting + '\n' : ''}
                      {sAccount ? 'Account Number: ' + sAccount + '\n' : ''}
                    </pre>
                  </div>
                </div>
              )}

            </div>

            {outputType !== 'text' && (
              <div className="ach-output-footer">
                <button className="ach-btn-primary" onClick={() => window.print()}>🖨️ Print</button>
                <button className="ach-btn-ghost" onClick={() => setShowOutput(false)}>Close</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MEMBERSHIP CTA */}
      <div className="ach-cta-strip">
        <div className="ach-cta-inner">
          <div className="ach-cta-left">
            <div className="ach-cta-eyebrow">CARES Works Membership</div>
            <h3 className="ach-cta-title">This is one of the free tools.<br /><em>There is a whole library inside.</em></h3>
            <p className="ach-cta-desc">HR, bookkeeping, operations, communication — new tools added every month. Plus Ask Kari, The Debrief, and Court of Accounts.</p>
            <a href="/" className="ach-cta-browse">Browse all free tools →</a>
          </div>
          <div className="ach-cta-price-block">
            <div className="ach-cta-price">$27<span>/mo</span></div>
            <div className="ach-cta-price-sub">or <strong>$270/year</strong> — 2 months free</div>
            <a href={MONTHLY_URL} className="ach-cta-btn-primary">Join Monthly — $27/mo</a>
            <a href={ANNUAL_URL} className="ach-cta-btn-gold">Join Annual — $270/yr</a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="ach-footer">
        <div>© 2026 CARES Consulting Inc. · <a href="https://caresmn.com" className="ach-footer-link">caresmn.com</a></div>
        <a href="https://karikounkel.store" className="ach-footer-link">Full Store at karikounkel.store →</a>
      </footer>

    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function Field({ label, required, hint, children }) {
  return (
    <div className="ach-field">
      <label className="ach-field-label">
        {label}
        {required && <span className="ach-req"> *</span>}
      </label>
      {children}
      {hint && <span className="ach-hint">{hint}</span>}
    </div>
  );
}

function PrintField({ label, value, sensitive }) {
  return (
    <div className={'ach-print-field' + (sensitive ? ' ach-sensitive-field' : '')}>
      <div className="ach-pf-label">{label}</div>
      <div className="ach-pf-value">{value}</div>
    </div>
  );
}

function PrintBlank({ label, sensitive }) {
  return (
    <div className={'ach-print-field' + (sensitive ? ' ach-sensitive-field' : '')}>
      <div className="ach-pf-label">{label}</div>
      <div className="ach-pf-blank"></div>
    </div>
  );
}

// =============================================================================
// Styles
// =============================================================================

function Styles() {
  const css =
    '.ach-page {' +
    '--ach-navy: #1a2744;' +
    '--ach-navy2: #243260;' +
    '--ach-gold: #c9a84c;' +
    '--ach-gold2: #e8c97a;' +
    '--ach-cream: #faf8f4;' +
    '--ach-rule: #e8e8ec;' +
    '--ach-muted: #7a7585;' +
    '--ach-ink: #1e1e2a;' +
    '--ach-orange: #e8773a;' +
    '--ach-warn: #fff8e8;' +
    '--ach-warn-border: #f0d898;' +
    '--ach-green: #1a7a4a;' +
    "--ach-font: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;" +
    'font-family: var(--ach-font);' +
    'background: var(--ach-cream);' +
    'color: var(--ach-ink);' +
    'min-height: 100vh;' +
    '}' +
    '.ach-page * { box-sizing: border-box; margin: 0; padding: 0; }' +

    // Header
    '.ach-site-header { background: #fff; border-bottom: 1px solid var(--ach-rule); padding: 18px 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }' +
    ".ach-site-brand { font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; color: var(--ach-ink); text-decoration: none; }" +
    '.ach-brand-accent { color: var(--ach-orange); }' +
    '.ach-site-nav { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }' +
    ".ach-nav-link { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ach-muted); text-decoration: none; transition: color .15s; }" +
    '.ach-nav-link:hover { color: var(--ach-navy); }' +
    ".ach-nav-join { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; background: var(--ach-orange); color: #fff; padding: 9px 18px; border-radius: 4px; text-decoration: none; transition: background .15s; }" +
    '.ach-nav-join:hover { background: #c95f22; }' +

    // CTA strip
    '.ach-cta-strip { background: #3d4560; padding: 56px 40px; }' +
    '.ach-cta-inner { max-width: 820px; margin: 0 auto; display: flex; gap: 48px; align-items: flex-start; flex-wrap: wrap; }' +
    '.ach-cta-left { flex: 1; min-width: 260px; }' +
    ".ach-cta-eyebrow { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ach-orange); margin-bottom: 12px; }" +
    ".ach-cta-title { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #fff; line-height: 1.2; margin-bottom: 12px; }" +
    '.ach-cta-title em { font-style: italic; color: var(--ach-gold2); }' +
    '.ach-cta-desc { font-size: 15px; color: rgba(255,255,255,.65); line-height: 1.65; margin-bottom: 16px; }' +
    ".ach-cta-browse { font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.08em; color: var(--ach-gold); text-decoration: none; }" +
    '.ach-cta-browse:hover { color: var(--ach-gold2); }' +
    '.ach-cta-price-block { flex-shrink: 0; min-width: 200px; display: flex; flex-direction: column; gap: 8px; }' +
    ".ach-cta-price { font-family: 'Playfair Display', Georgia, serif; font-size: 52px; color: #fff; line-height: 1; }" +
    '.ach-cta-price span { font-family: var(--ach-font); font-size: 16px; color: rgba(255,255,255,.45); font-weight: 400; }' +
    ".ach-cta-price-sub { font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(255,255,255,.4); letter-spacing: .05em; margin-bottom: 4px; }" +
    '.ach-cta-price-sub strong { color: var(--ach-gold); }' +
    ".ach-cta-btn-primary { display: block; text-align: center; background: var(--ach-orange); color: #fff; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; transition: background .15s; }" +
    '.ach-cta-btn-primary:hover { background: #c95f22; }' +
    ".ach-cta-btn-gold { display: block; text-align: center; background: linear-gradient(135deg,#C9A84C,#e0c060); color: #1e1e2a; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; padding: 14px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; }" +

    // Footer
    '.ach-footer { border-top: 1px solid var(--ach-rule); padding: 24px 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }' +
    ".ach-footer { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--ach-muted); letter-spacing: .06em; }" +
    '.ach-footer-link { color: var(--ach-muted); text-decoration: underline; }' +
    '.ach-footer-link:hover { color: var(--ach-navy); }' +

    // Hero
    '.ach-hero { background: #f2ede3; border-bottom: 1px solid var(--ach-rule); padding: 48px 32px 32px; }' +
    '.ach-hero-inner { max-width: 820px; margin: 0 auto; }' +
    ".ach-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ach-gold); margin-bottom: 12px; }" +
    ".ach-h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 42px; line-height: 1.1; color: var(--ach-navy); margin-bottom: 10px; }" +
    '.ach-accent { font-style: italic; color: var(--ach-gold); }' +
    ".ach-tagline { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 17px; color: var(--ach-gold); margin-bottom: 14px; }" +
    '.ach-hero-desc { font-size: 15px; color: var(--ach-muted); max-width: 640px; line-height: 1.6; }' +

    // Main
    '.ach-main { max-width: 820px; margin: 0 auto; padding: 40px 24px 80px; }' +

    // Mode toggle
    '.ach-mode-row { display: flex; background: #e8e8ec; border-radius: 12px; padding: 4px; width: fit-content; margin-bottom: 20px; }' +
    '.ach-mode-btn { padding: 11px 26px; border: none; border-radius: 9px; font-family: var(--ach-font); font-size: 14px; font-weight: 500; cursor: pointer; background: transparent; color: var(--ach-muted); transition: all 0.18s; }' +
    '.ach-mode-btn.ach-active { background: var(--ach-navy); color: #fff; box-shadow: 0 2px 10px rgba(26,39,68,.22); }' +

    // Mode desc
    '.ach-mode-desc { background: var(--ach-navy); color: rgba(255,255,255,.82); border-radius: 10px; padding: 16px 20px; font-size: 14px; line-height: 1.6; margin-bottom: 32px; }' +
    '.ach-mode-desc strong { color: var(--ach-gold2); }' +

    // Section
    '.ach-section { background: #fff; border: 1.5px solid var(--ach-rule); border-radius: 12px; padding: 24px; margin-bottom: 20px; }' +
    '.ach-section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ach-gold); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--ach-rule); }' +

    // Field rows
    '.ach-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }' +
    '.ach-row.ach-full { grid-template-columns: 1fr; }' +
    '.ach-row:last-child { margin-bottom: 0; }' +
    '.ach-field { display: flex; flex-direction: column; gap: 5px; }' +
    '.ach-field-label { font-size: 12px; font-weight: 500; color: var(--ach-muted); }' +
    '.ach-req { color: #c0392b; }' +
    '.ach-hint { font-size: 11px; color: #aaa; line-height: 1.4; }' +
    '.ach-input { padding: 11px 13px; border: 1.5px solid var(--ach-rule); border-radius: 8px; font-family: var(--ach-font); font-size: 14px; color: var(--ach-ink); background: #fff; transition: border-color .15s; width: 100%; -webkit-appearance: none; }' +
    '.ach-input:focus { outline: none; border-color: var(--ach-navy); box-shadow: 0 0 0 3px rgba(26,39,68,.07); }' +

    // Security note
    '.ach-security { display: flex; align-items: flex-start; gap: 10px; background: #f0f4ff; border: 1px solid #d0daf5; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; font-size: 13px; color: var(--ach-navy2); line-height: 1.55; }' +

    // Actions
    '.ach-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }' +
    '.ach-btn-primary { padding: 13px 26px; background: var(--ach-navy); color: #fff; border: none; border-radius: 9px; font-family: var(--ach-font); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s; }' +
    '.ach-btn-primary:hover { background: var(--ach-navy2); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(26,39,68,.22); }' +
    '.ach-btn-gold { padding: 13px 26px; background: var(--ach-gold); color: var(--ach-navy); border: none; border-radius: 9px; font-family: var(--ach-font); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s; }' +
    '.ach-btn-gold:hover { background: var(--ach-gold2); transform: translateY(-1px); }' +
    '.ach-btn-ghost { padding: 13px 18px; background: transparent; color: var(--ach-navy); border: 1.5px solid var(--ach-rule); border-radius: 9px; font-family: var(--ach-font); font-size: 14px; font-weight: 500; cursor: pointer; transition: all .18s; }' +
    '.ach-btn-ghost:hover { border-color: var(--ach-navy); background: #f4f4f8; }' +

    // Output panel
    '.ach-output { border: 1.5px solid var(--ach-rule); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.06); margin-top: 8px; }' +
    '.ach-output-header { background: var(--ach-navy); padding: 18px 26px; display: flex; justify-content: space-between; align-items: center; }' +
    ".ach-output-title { font-family: 'Playfair Display', Georgia, serif; color: #fff; font-size: 18px; }" +
    '.ach-output-badge { color: var(--ach-gold); font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; }' +
    '.ach-output-body { background: #fff; padding: 32px 28px; }' +
    '.ach-output-footer { display: flex; gap: 10px; padding: 18px 26px; background: #f4f4f6; border-top: 1px solid var(--ach-rule); }' +

    // Document styles
    ".ach-doc { font-family: var(--ach-font); }" +
    '.ach-doc-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid var(--ach-navy); margin-bottom: 24px; }' +
    ".ach-doc-title { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: var(--ach-navy); }" +
    '.ach-doc-sub { font-size: 12px; color: var(--ach-muted); margin-top: 4px; }' +
    '.ach-doc-date { text-align: right; font-size: 13px; color: var(--ach-ink); }' +
    '.ach-doc-date span { display: block; font-size: 10px; color: var(--ach-muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 3px; }' +
    '.ach-doc-section-title { font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--ach-navy); margin: 22px 0 14px; padding-bottom: 8px; border-bottom: 1px solid var(--ach-navy); }' +
    '.ach-purpose-note { background: #f4f6ff; border-radius: 8px; padding: 11px 14px; font-size: 13px; color: var(--ach-ink); margin-bottom: 18px; }' +
    '.ach-print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px; }' +
    '.ach-print-grid.ach-grid-full { grid-template-columns: 1fr; }' +
    '.ach-print-field { display: flex; flex-direction: column; gap: 4px; }' +
    '.ach-pf-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--ach-muted); }' +
    '.ach-pf-value { font-size: 14px; font-weight: 500; color: var(--ach-ink); padding-bottom: 6px; border-bottom: 1px solid var(--ach-rule); min-height: 26px; }' +
    '.ach-pf-blank { border-bottom: 1px solid var(--ach-rule); min-height: 34px; background: #f8f8fa; border-radius: 4px; }' +
    '.ach-check-row { display: flex; gap: 16px; padding-top: 8px; }' +
    '.ach-check { font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer; }' +
    '.ach-sensitive { background: var(--ach-warn); border: 1px solid var(--ach-warn-border); border-radius: 8px; padding: 14px; margin-bottom: 16px; }' +
    '.ach-sensitive .ach-pf-label { color: #8a6a10; }' +
    '.ach-auth-block { margin-top: 28px; padding-top: 22px; border-top: 1px dashed #ccc; }' +
    '.ach-auth-text { font-size: 12px; color: var(--ach-muted); line-height: 1.6; margin-bottom: 20px; }' +
    '.ach-sig-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 18px; }' +

    // Copy panel
    '.ach-copy-hint { font-size: 13px; color: var(--ach-muted); margin-bottom: 12px; }' +
    '.ach-copy-panel { background: var(--ach-navy); border-radius: 10px; padding: 20px 22px; position: relative; }' +
    '.ach-copy-pre { color: rgba(255,255,255,.85); font-family: monospace; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }' +
    '.ach-copy-btn { position: absolute; top: 14px; right: 14px; background: var(--ach-gold); color: var(--ach-navy); border: none; border-radius: 6px; padding: 6px 14px; font-family: var(--ach-font); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; }' +
    '.ach-copy-btn.ach-copied { background: var(--ach-green); color: #fff; }' +

    // Responsive
    '@media (max-width: 580px) {' +
    '.ach-h1 { font-size: 30px; }' +
    '.ach-hero { padding: 32px 20px 24px; }' +
    '.ach-main { padding: 24px 16px 60px; }' +
    '.ach-row { grid-template-columns: 1fr; }' +
    '.ach-print-grid { grid-template-columns: 1fr; }' +
    '.ach-sig-grid { grid-template-columns: 1fr; }' +
    '.ach-mode-row { width: 100%; }' +
    '.ach-mode-btn { flex: 1; }' +
    '}' +

    // Print
    '@media print {' +
    '.ach-hero, .ach-mode-row, .ach-mode-desc, .ach-section, .ach-security, .ach-actions, .ach-output-header, .ach-output-footer, .ach-output-badge { display: none !important; }' +
    '.ach-output { border: none; box-shadow: none; }' +
    '.ach-output-body { padding: 0; }' +
    'body, .ach-page { background: #fff; }' +
    '}';

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// =============================================================================
// ROUTE — add to App.jsx:
//
//   import AchForm from './pages/AchForm';
//   ...
//   if (path === '/tools/ach-form') return <AchForm />;
// =============================================================================
