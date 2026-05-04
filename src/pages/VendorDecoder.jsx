// =============================================================================
// VendorDecoder.jsx
// CARES Works — Vendor Decoder, full React port of the standalone HTML tool.
// =============================================================================
//
// INTEGRATION NOTES (for Kari):
//   - Adjust the supabase import path on line 30 to match your repo
//   - Adjust the route in your App.jsx / router config (see bottom of file)
//   - Drop the styles inline OR extract to a .css file — either works
//   - Per standing rule: no backticks in JSX, string concatenation only
//
// FEATURES:
//   - Vendor list + chart of accounts paste-import
//   - Per-vendor mapping with account typeahead
//   - Bulk select + bulk apply account
//   - Remove duplicates
//   - Generate printable reference sheet
//   - Share via link (creates Supabase session, copies URL)
//   - Auto-load + auto-save when URL has ?s=token (review mode)
//   - Owner-only buttons hidden when in review
//
// =============================================================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';

// =============================================================================
// Helpers
// =============================================================================

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < 16; i++) out += chars[arr[i] % 62];
  return out;
}

function blankVendor(name) {
  return {
    id: Date.now() + Math.random(),
    name: name || '',
    mappings: [{ account: '', logicType: '', logicValue: '' }],
    poUsage: '',
    notes: ''
  };
}

function findPriorAccount(list, name) {
  if (!name) return '';
  const target = name.trim().toLowerCase();
  for (const v of list) {
    if ((v.name || '').trim().toLowerCase() === target && v.mappings?.[0]?.account) {
      return v.mappings[0].account;
    }
  }
  return '';
}

function logicPlaceholder(t) {
  return ({
    po: 'PO starts with PR-',
    amount: 'Over $500',
    keyword: 'Invoice says install',
    location: 'Ships from St. Paul',
    other: 'Rule description'
  })[t] || '';
}

function formatLogic(t) {
  return ({ po: 'PO', amount: 'Amount', keyword: 'Keyword', location: 'Location', other: 'Rule' })[t] || '';
}

// =============================================================================
// Main component
// =============================================================================

const LOCAL_KEY = 'cares_vendor_decoder_v1';

export default function VendorDecoder() {
  // Read session token from URL — works without react-router-dom
  const sessionToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('s');
  }, []);
  const isReview = !!sessionToken;

  // -------- Core data state --------
  const [tier, setTier] = useState('free');
  const [vendors, setVendors] = useState([]);
  const [coa, setCoa] = useState([]);
  const [reviewerName, setReviewerName] = useState('');
  const [senderName, setSenderName] = useState('');

  // -------- UI state --------
  const [importText, setImportText] = useState('');
  const [coaText, setCoaText] = useState('');
  const [bulkSelected, setBulkSelected] = useState(() => new Set());
  const [bulkAccount, setBulkAccount] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [shareBanner, setShareBanner] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [vendorImportCollapsed, setVendorImportCollapsed] = useState(false);
  const [coaImportCollapsed, setCoaImportCollapsed] = useState(false);

  // -------- My sessions dropdown --------
  const [mySessions, setMySessions] = useState([]);
  const [sessionListLoaded, setSessionListLoaded] = useState(false);

  const saveTimer = useRef(null);
  const initialLoadDone = useRef(false);

  // -------- Initial load --------
  useEffect(() => {
    async function load() {
      if (sessionToken) {
        try {
          const { data, error } = await supabase
            .from('vendor_decoder_sessions')
            .select('*')
            .eq('id', sessionToken)
            .maybeSingle();
          if (error) throw error;
          if (!data) {
            setErrorBanner('Session not found. This link may have been deleted or never existed.');
            initialLoadDone.current = true;
            return;
          }
          setVendors(data.vendors || []);
          setCoa(data.coa || []);
          setReviewerName(data.reviewer_name || '');
          setSenderName(data.sender_name || '');
          setVendorImportCollapsed(true);
          setCoaImportCollapsed(true);
          supabase.from('vendor_decoder_sessions')
            .update({ last_viewed_at: new Date().toISOString() })
            .eq('id', sessionToken).then(() => {});
        } catch (e) {
          setErrorBanner('Could not load session. ' + (e?.message || 'Network or config issue.'));
        }
      } else {
        try {
          const saved = localStorage.getItem(LOCAL_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            setVendors(parsed.vendors || []);
            setCoa(parsed.coa || []);
            setTier(parsed.tier || 'free');
            if ((parsed.vendors || []).length > 0) setVendorImportCollapsed(true);
            if ((parsed.coa || []).length > 0) setCoaImportCollapsed(true);
          }
        } catch (e) {
          console.warn('Could not load local cache', e);
        }
      }
      initialLoadDone.current = true;
    }
    load();
  }, [sessionToken]);

  // -------- Auto-save on data change --------
  useEffect(() => {
    if (!initialLoadDone.current) return;
    if (sessionToken) {
      clearTimeout(saveTimer.current);
      setSaveStatus('Saving…');
      saveTimer.current = setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('vendor_decoder_sessions')
            .update({ vendors, coa, status: 'in_progress' })
            .eq('id', sessionToken);
          if (error) throw error;
          setSaveStatus('Saved ✓');
          setTimeout(() => {
            setSaveStatus(s => (s === 'Saved ✓' ? '' : s));
          }, 2000);
        } catch (e) {
          console.error('Save failed', e);
          setSaveStatus('Save failed');
        }
      }, 800);
    } else {
      try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ vendors, coa, tier }));
      } catch (e) {
        console.warn('Local save failed', e);
      }
    }
  }, [vendors, coa, tier, sessionToken]);

  // -------- Fetch my sessions list (owner mode only) --------
  useEffect(() => {
    if (sessionToken) return;
    refreshSessionList();
  }, [sessionToken]);

  async function refreshSessionList() {
    try {
      const { data, error } = await supabase
        .from('vendor_decoder_sessions')
        .select('id, reviewer_name, sender_name, updated_at, last_viewed_at, status')
        .order('updated_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setMySessions(data || []);
      setSessionListLoaded(true);
    } catch (e) {
      console.warn('Could not load session list', e);
      setSessionListLoaded(true);
    }
  }

  function openSession(token) {
    if (!token) return;
    window.location.search = '?s=' + token;
  }

  function backToOwnerView() {
    window.location.search = '';
  }

  // -------- COA lookup map --------
  const coaByNumber = useMemo(() => {
    const m = new Map();
    coa.forEach(a => m.set((a.number || '').trim(), a));
    return m;
  }, [coa]);

  function lookupAccountName(num) {
    const a = coaByNumber.get((num || '').trim());
    return a ? a.name : '';
  }

  // =========================================================================
  // Vendor import
  // =========================================================================
  function importVendors() {
    const text = importText.trim();
    if (!text) { window.alert('Paste a vendor list first.'); return; }
    const lines = text.split('\n')
      .map(l => l.split(/[,\t]/)[0].trim())
      .filter(Boolean);
    if (lines.length === 0) { window.alert('No vendors found.'); return; }

    const existing = new Set(vendors.map(v => (v.name || '').trim().toLowerCase()));
    let added = 0, skipped = 0, autoFilled = 0;
    const newRows = [];
    lines.forEach(name => {
      const key = name.trim().toLowerCase();
      if (existing.has(key)) { skipped++; return; }
      const v = blankVendor(name);
      const prior = findPriorAccount([...vendors, ...newRows], name);
      if (prior) { v.mappings[0].account = prior; autoFilled++; }
      newRows.push(v);
      existing.add(key);
      added++;
    });
    setVendors([...vendors, ...newRows]);
    setImportText('');
    setVendorImportCollapsed(true);
    let msg = 'Loaded ' + added + ' new vendor' + (added === 1 ? '' : 's') + '.';
    if (skipped > 0) msg += ' Skipped ' + skipped + ' already in your list.';
    if (autoFilled > 0) msg += ' Auto-mapped ' + autoFilled + ' from prior entries.';
    window.alert(msg);
  }

  // =========================================================================
  // COA import
  // =========================================================================
  function importCOA() {
    const text = coaText.trim();
    if (!text) { window.alert('Paste your chart of accounts first.'); return; }
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = [];
    lines.forEach(line => {
      let parts;
      if (line.includes(' · ')) parts = line.split(' · ');
      else if (line.includes('\t')) parts = line.split('\t');
      else if (line.includes('|')) parts = line.split('|');
      else parts = line.split(',');
      parts = parts.map(p => p.trim()).filter(Boolean);
      if (parts.length === 0) return;
      const acct = {
        number: parts[0] || '',
        name: parts[1] || '',
        type: parts[2] || '',
        detail: parts[3] || ''
      };
      if (acct.number && acct.name) parsed.push(acct);
    });
    if (parsed.length === 0) {
      window.alert('No accounts could be parsed. Each line needs at least an account number and a name.');
      return;
    }
    setCoa(parsed);
    setCoaText('');
    setCoaImportCollapsed(true);
  }

  // =========================================================================
  // Vendor row updates
  // =========================================================================
  function updateField(idx, field, value) {
    setVendors(prev => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  }

  function updateMapping(vIdx, mIdx, field, value) {
    setVendors(prev => prev.map((v, i) => {
      if (i !== vIdx) return v;
      const mappings = v.mappings.map((m, j) => (j === mIdx ? { ...m, [field]: value } : m));
      return { ...v, mappings };
    }));
  }

  function addMapping(vIdx) {
    setVendors(prev => prev.map((v, i) => (
      i === vIdx ? { ...v, mappings: [...v.mappings, { account: '', logicType: 'po', logicValue: '' }] } : v
    )));
  }

  function deleteMapping(vIdx, mIdx) {
    setVendors(prev => prev.map((v, i) => (
      i === vIdx ? { ...v, mappings: v.mappings.filter((_, j) => j !== mIdx) } : v
    )));
  }

  function addBlankVendor() {
    setVendors(prev => [...prev, blankVendor('')]);
  }

  function deleteVendor(idx) {
    if (!window.confirm('Delete ' + (vendors[idx].name || 'this vendor') + '?')) return;
    setVendors(prev => prev.filter((_, i) => i !== idx));
  }

  function clearAll() {
    if (!window.confirm('Clear all vendors and accounts?')) return;
    setVendors([]);
    setCoa([]);
    setVendorImportCollapsed(false);
    setCoaImportCollapsed(false);
    setShowPreview(false);
    setBulkSelected(new Set());
  }

  // =========================================================================
  // Dedupe
  // =========================================================================
  function removeDuplicates() {
    if (vendors.length === 0) return;
    const seen = new Map();
    const merged = [];
    vendors.forEach(v => {
      const key = (v.name || '').trim().toLowerCase();
      if (!key) { merged.push(v); return; }
      if (!seen.has(key)) { seen.set(key, merged.length); merged.push(v); }
      else {
        const idx = seen.get(key);
        const existHas = (merged[idx].mappings?.[0]?.account || merged[idx].notes || merged[idx].poUsage);
        const incHas = (v.mappings?.[0]?.account || v.notes || v.poUsage);
        if (!existHas && incHas) merged[idx] = v;
      }
    });
    const removed = vendors.length - merged.length;
    if (removed === 0) { window.alert('No duplicates found.'); return; }
    if (!window.confirm('Found ' + removed + ' duplicate' + (removed === 1 ? '' : 's') + '. Remove them? Rows with mappings or notes are kept.')) return;
    setVendors(merged);
  }

  // =========================================================================
  // Bulk selection
  // =========================================================================
  function toggleRow(id, checked) {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked) {
    if (checked) setBulkSelected(new Set(vendors.map(v => v.id)));
    else setBulkSelected(new Set());
  }

  function clearBulkSelection() {
    setBulkSelected(new Set());
  }

  function applyBulkAccount() {
    const account = bulkAccount.trim();
    if (!account) { window.alert('Type or pick an account number first.'); return; }
    if (bulkSelected.size === 0) return;
    let count = 0;
    setVendors(prev => prev.map(v => {
      if (!bulkSelected.has(v.id)) return v;
      count++;
      const mappings = (v.mappings && v.mappings.length > 0)
        ? v.mappings.map((m, i) => (i === 0 ? { ...m, account } : m))
        : [{ account, logicType: '', logicValue: '' }];
      return { ...v, mappings };
    }));
    setBulkAccount('');
    setBulkSelected(new Set());
    const acctName = lookupAccountName(account);
    setTimeout(() => {
      window.alert('Mapped ' + count + ' vendor' + (count === 1 ? '' : 's') + ' to ' + account + (acctName ? ' (' + acctName + ')' : '') + '.');
    }, 0);
  }

  // =========================================================================
  // Share via link
  // =========================================================================
  async function shareViaLink() {
    if (vendors.length === 0) {
      window.alert('Add at least one vendor before creating a review link.');
      return;
    }
    const reviewer = window.prompt('Who is this review copy for? (e.g. "Frank", "Tim", "Laurie")', '') || '';
    if (!reviewer.trim()) {
      window.alert('Reviewer name is required so you can keep your links straight later.');
      return;
    }
    const sender = window.prompt('Your name (so the reviewer knows who sent it). Optional.', senderName || '') || '';
    const newToken = generateToken();
    try {
      const { error } = await supabase
        .from('vendor_decoder_sessions')
        .insert({
          id: newToken,
          reviewer_name: reviewer.trim(),
          sender_name: sender.trim() || null,
          vendors,
          coa,
          status: 'active'
        });
      if (error) throw error;
    } catch (e) {
      console.error('Could not create session', e);
      window.alert('Could not create the review link: ' + (e?.message || 'unknown error'));
      return;
    }
    const url = window.location.origin + window.location.pathname + '?s=' + newToken;
    try { await navigator.clipboard.writeText(url); }
    catch (e) { /* clipboard might be blocked, banner still shows the URL */ }
    setShareBanner({ url, reviewer: reviewer.trim() });
    refreshSessionList();
  }

  // =========================================================================
  // Reference sheet preview
  // =========================================================================
  function generatePreview() {
    setShowPreview(true);
    setTimeout(() => {
      const el = document.getElementById('vd-preview-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }

  // =========================================================================
  // Render
  // =========================================================================

  const allSelected = vendors.length > 0 && bulkSelected.size === vendors.length;
  const someSelected = bulkSelected.size > 0 && !allSelected;
  const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="vd-page">
      <Styles />

      <div className="vd-hero">
        <div className="vd-hero-inner">
          <div className="vd-eyebrow">A CARES Works Tool</div>
          <h1 className="vd-h1">Vendor <span className="vd-accent">Decoder</span></h1>
          <div className="vd-tagline">Revenue is vanity. Net profit is sanity.</div>
          <p className="vd-hero-desc">Turn your vendor list into a posting playbook. The new bookkeeper inherits clarity instead of chaos — every vendor mapped to the right account, with the logic that tells them when it's something else.</p>
        </div>
      </div>

      <main className="vd-main">

        {errorBanner && (
          <div className="vd-error-banner">{errorBanner}</div>
        )}

        {isReview && !errorBanner && (
          <div className="vd-review-banner">
            <strong>Review session</strong>{senderName ? ' from ' + senderName : ''} for <strong>{reviewerName || 'you'}</strong> — edits save automatically.
          </div>
        )}

        {shareBanner && (
          <div className="vd-share-banner">
            <strong>Link for {shareBanner.reviewer} copied to clipboard.</strong>{' '}
            <a href={shareBanner.url} target="_blank" rel="noreferrer" className="vd-share-link">{shareBanner.url}</a>
            <div className="vd-share-note">Save this URL — it's how you'll see {shareBanner.reviewer}'s edits later. Open it any time to check their progress.</div>
            <button className="vd-btn-ghost" onClick={() => setShareBanner(null)} style={{ marginTop: '8px' }}>Dismiss</button>
          </div>
        )}

        {!isReview && mySessions.length > 0 && (
          <div className="vd-sessions-bar">
            <label className="vd-sessions-label">Open a previous session:</label>
            <select
              className="vd-sessions-select"
              defaultValue=""
              onChange={e => openSession(e.target.value)}
            >
              <option value="">— select a reviewer —</option>
              {mySessions.map(s => {
                const date = new Date(s.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const label = (s.reviewer_name || 'Untitled') + ' · last edit ' + date + (s.status === 'in_progress' ? ' · in progress' : '');
                return <option key={s.id} value={s.id}>{label}</option>;
              })}
            </select>
            <span className="vd-sessions-count">{mySessions.length} total</span>
          </div>
        )}

        {isReview && (
          <div className="vd-back-bar">
            <button className="vd-btn-ghost" onClick={backToOwnerView}>← back to my own view</button>
          </div>
        )}

        {!isReview && (
          <div className="vd-tier-toggle">
            <button className={'vd-tier-btn' + (tier === 'free' ? ' vd-active' : '')} onClick={() => setTier('free')}>Free</button>
            <button className={'vd-tier-btn' + (tier === 'pro' ? ' vd-active' : '')} onClick={() => setTier('pro')}>CARES Works Member</button>
            <span className="vd-tier-note">{tier === 'free' ? 'One account per vendor + basic printable sheet' : 'Multiple mappings + decision logic + dense reference sheet'}</span>
          </div>
        )}

        <details className="vd-how">
          <summary>How this works</summary>
          <div className="vd-how-body">
            {isReview ? (
              <>
                <p>No account, no downloads. Your edits save automatically as you make them.</p>
                <ol>
                  <li><strong>Edit any cell below.</strong> Account numbers, notes, PO usage — change anything.</li>
                  <li><strong>Use the checkboxes</strong> to select multiple vendors and map them all to one account in a click.</li>
                  <li><strong>Watch the action bar</strong> for "Saving…" then "Saved ✓" so you know your changes stuck.</li>
                  <li><strong>Close the tab whenever you're done.</strong> No submit button. Whoever sent you this link will see your edits.</li>
                  <li><strong>Come back any time</strong> using the same link. Your work is waiting.</li>
                </ol>
              </>
            ) : (
              <>
                <ol>
                  <li><strong>Paste your vendor list</strong> in section 1. One per line. Duplicates skipped automatically.</li>
                  <li><strong>Paste your chart of accounts</strong> in section 2. The mapping field below becomes a typeahead once it's loaded.</li>
                  <li><strong>Map vendors to accounts.</strong> Type the number, the name fills in. Use checkboxes + bulk action bar to map many at once.</li>
                  <li><strong>Click <em>Share via link →</em></strong> to create a copy for a reviewer. Type their name. You get a unique URL on your clipboard.</li>
                  <li><strong>Email them the link.</strong> They edit, autosave, close the tab.</li>
                  <li><strong>Open their link any time</strong> to see their work. Each reviewer has their own session.</li>
                </ol>
                <p className="vd-how-foot"><strong>Save your share links somewhere</strong> — that's how you'll get back to each reviewer's work later.</p>
              </>
            )}
          </div>
        </details>

        {!isReview && (
          <section className="vd-section">
            {vendorImportCollapsed ? (
              <div className="vd-collapsed">
                <span className="vd-collapsed-summary"><strong>✓ {vendors.length} vendors loaded.</strong></span>
                <button className="vd-btn-ghost vd-btn-sm" onClick={() => setVendorImportCollapsed(false)}>+ add more</button>
              </div>
            ) : (
              <>
                <h2 className="vd-h2">1. Import vendor list</h2>
                <p className="vd-section-desc">Paste from Excel, QuickBooks vendor export, or type one per line.</p>
                <div className="vd-import-row">
                  <div>
                    <textarea
                      className="vd-textarea"
                      value={importText}
                      onChange={e => setImportText(e.target.value)}
                      placeholder={'Priority Envelope\nHello Print Supply\nOffice Depot\nAcme HVAC\n...'}
                    />
                    <div className="vd-import-help">One vendor per line. Duplicates skipped automatically.</div>
                  </div>
                  <button className="vd-btn-primary" onClick={importVendors}>Load vendors →</button>
                </div>
              </>
            )}
          </section>
        )}

        {!isReview && (
          <section className="vd-section">
            {coaImportCollapsed ? (
              <div className="vd-collapsed">
                <span className="vd-collapsed-summary"><strong>✓ {coa.length} accounts loaded.</strong></span>
                <button className="vd-btn-ghost vd-btn-sm" onClick={() => setCoaImportCollapsed(false)}>+ replace or add</button>
              </div>
            ) : (
              <>
                <h2 className="vd-h2">2. Import chart of accounts</h2>
                <p className="vd-section-desc">Account number first, then name. Type optional. The mapping field becomes a typeahead once loaded.</p>
                <div className="vd-import-row">
                  <div>
                    <textarea
                      className="vd-textarea"
                      value={coaText}
                      onChange={e => setCoaText(e.target.value)}
                      placeholder={'6500 · Office Supplies · Expense\n6010 · Advertising · Expense\n5000 · Cost of Goods Sold · COGS\n...'}
                    />
                    <div className="vd-import-help">Separators: tab, comma, pipe, or " · ". Loading replaces any existing chart.</div>
                  </div>
                  <button className="vd-btn-primary" onClick={importCOA}>Load accounts →</button>
                </div>
              </>
            )}
          </section>
        )}

        {vendors.length > 0 && (
          <section className="vd-section">
            <h2 className="vd-h2">{isReview ? '' : '3. '}Map each vendor to its account</h2>
            <p className="vd-section-desc">
              Assign the primary GL account. Add notes about anything tricky.
              {tier === 'pro' && !isReview ? ' Add multiple mappings with decision logic when the same vendor lands in different accounts.' : ''}
            </p>

            <div className="vd-actions-bar">
              {!isReview && <button className="vd-btn-secondary" onClick={addBlankVendor}>+ Add vendor</button>}
              {!isReview && <button className="vd-btn-secondary" onClick={removeDuplicates}>Remove duplicates</button>}
              <button className="vd-btn-secondary" onClick={generatePreview}>Generate reference sheet</button>
              {!isReview && <button className="vd-btn-primary" onClick={shareViaLink}>Share via link →</button>}
              {!isReview && <button className="vd-btn-ghost" onClick={clearAll}>Clear all</button>}
              {saveStatus && <span className="vd-save-indicator">{saveStatus}</span>}
            </div>

            {bulkSelected.size > 0 && (
              <div className="vd-bulk-bar">
                <span><strong>{bulkSelected.size}</strong> selected</span>
                <span className="vd-bulk-arrow">→ map all to account:</span>
                <input
                  className="vd-bulk-input"
                  type="text"
                  list="vd-coa-list"
                  value={bulkAccount}
                  onChange={e => setBulkAccount(e.target.value)}
                  placeholder="5210"
                  onKeyDown={e => { if (e.key === 'Enter') applyBulkAccount(); }}
                />
                <button className="vd-btn-primary vd-btn-compact" onClick={applyBulkAccount}>Apply to selected</button>
                <button className="vd-btn-ghost" onClick={clearBulkSelection}>Clear selection</button>
              </div>
            )}

            <table className="vd-table">
              <thead>
                <tr>
                  <th style={{ width: 30, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected; }}
                      onChange={e => toggleSelectAll(e.target.checked)}
                      title="Select all"
                    />
                  </th>
                  <th style={{ width: '22%' }}>Vendor</th>
                  <th>Account mapping(s)</th>
                  <th style={{ width: '16%' }}>PO usage</th>
                  <th style={{ width: '20%' }}>Notes</th>
                  <th style={{ width: 30 }}></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v, i) => (
                  <VendorRow
                    key={v.id}
                    vendor={v}
                    tier={tier}
                    isReview={isReview}
                    selected={bulkSelected.has(v.id)}
                    lookupAccountName={lookupAccountName}
                    onToggleRow={(checked) => toggleRow(v.id, checked)}
                    onUpdateField={(field, value) => updateField(i, field, value)}
                    onUpdateMapping={(mIdx, field, value) => updateMapping(i, mIdx, field, value)}
                    onAddMapping={() => addMapping(i)}
                    onDeleteMapping={(mIdx) => deleteMapping(i, mIdx)}
                    onDelete={() => deleteVendor(i)}
                  />
                ))}
              </tbody>
            </table>
          </section>
        )}

        <datalist id="vd-coa-list">
          {coa.map(a => (
            <option key={a.number} value={a.number}>
              {a.name + (a.type ? ' (' + a.type + ')' : '')}
            </option>
          ))}
        </datalist>

        {showPreview && (
          <section className="vd-section" id="vd-preview-section">
            <div className="vd-preview-header">
              <h2 className="vd-h2" style={{ margin: 0 }}>Reference sheet</h2>
              <button className="vd-btn-primary" onClick={() => window.print()}>Print this sheet</button>
            </div>
            <p className="vd-section-desc">Dense, usable. Print it, fold it, tape it next to the desk.</p>
            <div className="vd-preview-pane">
              <h3 className="vd-preview-h3">Vendor Posting Reference</h3>
              <div className="vd-preview-meta">Generated {todayStr} • CARES Works Vendor Decoder</div>
              <table className="vd-preview-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Vendor</th>
                    <th style={{ width: '12%' }}>Account</th>
                    <th>Decision logic / notes</th>
                    <th style={{ width: '12%' }}>PO</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.flatMap(v => v.mappings.map((m, i) => {
                    const isFirst = i === 0;
                    const logic = m.logicType ? formatLogic(m.logicType) + ': ' + m.logicValue : (isFirst ? 'Default' : '');
                    return (
                      <tr key={v.id + '-' + i}>
                        <td className="vd-preview-vendor">{isFirst ? (v.name || '—') : ''}</td>
                        <td className="vd-preview-acct">{m.account || '—'}</td>
                        <td><span className="vd-preview-logic">{logic}</span>{isFirst && v.notes ? <span className="vd-preview-logic"> — {v.notes}</span> : null}</td>
                        <td>{isFirst ? (v.poUsage || '—') : ''}</td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
              <div className="vd-preview-foot">CARES Works · tools.caresmn.com · Revenue is vanity. Net profit is sanity.</div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// =============================================================================
// VendorRow
// =============================================================================
function VendorRow({
  vendor: v, tier, isReview, selected, lookupAccountName,
  onToggleRow, onUpdateField, onUpdateMapping, onAddMapping, onDeleteMapping, onDelete
}) {
  return (
    <tr>
      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
        <input type="checkbox" checked={selected} onChange={e => onToggleRow(e.target.checked)} />
      </td>
      <td>
        <input
          type="text"
          className="vd-input vd-vendor-name"
          value={v.name}
          onChange={e => onUpdateField('name', e.target.value)}
          placeholder="Vendor name"
        />
      </td>
      <td>
        {v.mappings.map((m, mIdx) => {
          const isFirst = mIdx === 0;
          const showLogic = tier === 'pro' || !isFirst;
          return (
            <div key={mIdx} className="vd-mapping-block">
              <div className="vd-mapping-grid">
                <div>
                  <label className="vd-mapping-label">Account #</label>
                  <input
                    type="text"
                    list="vd-coa-list"
                    className="vd-input"
                    value={m.account}
                    onChange={e => onUpdateMapping(mIdx, 'account', e.target.value)}
                    placeholder="5210"
                  />
                  {m.account && lookupAccountName(m.account) && (
                    <div className="vd-acct-hint">{lookupAccountName(m.account)}</div>
                  )}
                </div>
                {showLogic ? (
                  <>
                    <div>
                      <label className="vd-mapping-label">When</label>
                      <select
                        className="vd-input"
                        value={m.logicType}
                        onChange={e => onUpdateMapping(mIdx, 'logicType', e.target.value)}
                      >
                        <option value="">Default</option>
                        <option value="po">PO pattern</option>
                        <option value="amount">Dollar amount</option>
                        <option value="keyword">Description keyword</option>
                        <option value="location">Ship from / location</option>
                        <option value="other">Other rule</option>
                      </select>
                    </div>
                    <div>
                      <label className="vd-mapping-label">Detail</label>
                      <input
                        type="text"
                        className="vd-input"
                        value={m.logicValue}
                        onChange={e => onUpdateMapping(mIdx, 'logicValue', e.target.value)}
                        placeholder={logicPlaceholder(m.logicType)}
                      />
                    </div>
                    {!isFirst ? (
                      <button
                        className="vd-btn-ghost"
                        onClick={() => onDeleteMapping(mIdx)}
                        style={{ marginTop: '18px' }}
                        title="Remove this rule"
                      >×</button>
                    ) : <div />}
                  </>
                ) : (
                  <>
                    <div className="vd-default-note">Default account for this vendor</div>
                    <div />
                  </>
                )}
              </div>
            </div>
          );
        })}
        {tier === 'pro' ? (
          <button className="vd-add-mapping" onClick={onAddMapping}>+ Add another mapping rule</button>
        ) : (
          <button className="vd-add-mapping" disabled title="Available for CARES Works members">
            + Add rule <span className="vd-gated-badge">Member</span>
          </button>
        )}
      </td>
      <td>
        <select
          className="vd-input"
          value={v.poUsage}
          onChange={e => onUpdateField('poUsage', e.target.value)}
        >
          <option value="">—</option>
          <option value="Always">Always required</option>
          <option value="Sometimes">Sometimes</option>
          <option value="Never">Not used</option>
        </select>
      </td>
      <td>
        <textarea
          className="vd-input vd-textarea-cell"
          value={v.notes}
          onChange={e => onUpdateField('notes', e.target.value)}
          placeholder="Anything the new person needs to know"
        />
      </td>
      <td>
        {!isReview && (
          <button className="vd-btn-ghost" onClick={onDelete} title="Delete">×</button>
        )}
      </td>
    </tr>
  );
}

// =============================================================================
// Inline styles — scoped under .vd-page so they don't bleed into the rest of your app
// =============================================================================
function Styles() {
  const css = '.vd-page {' +
    '--vd-slate: #3d4560;' +
    '--vd-orange: #e8773a;' +
    '--vd-orange-light: #fdf0e8;' +
    '--vd-paper: #faf8f4;' +
    '--vd-cream: #f2ede3;' +
    '--vd-ink: #1e1e2a;' +
    '--vd-rule: #ddd8cc;' +
    '--vd-muted: #7a7585;' +
    '--vd-gold: #C9A84C;' +
    '--vd-green: #5a9a5a;' +
    '--vd-red: #c95f22;' +
    "font-family: 'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;" +
    'background: var(--vd-paper);' +
    'color: var(--vd-ink);' +
    'line-height: 1.5;' +
    'min-height: 100vh;' +
    '}' +
    '.vd-page * { box-sizing: border-box; }' +
    '.vd-hero { background: var(--vd-cream); border-bottom: 1px solid var(--vd-rule); padding: 48px 32px 32px; }' +
    '.vd-hero-inner { max-width: 1200px; margin: 0 auto; }' +
    ".vd-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--vd-orange); margin-bottom: 12px; }" +
    ".vd-h1 { font-family: 'DM Serif Display', serif; font-size: 44px; line-height: 1.05; margin: 0 0 12px; color: var(--vd-ink); letter-spacing: -0.01em; }" +
    '.vd-accent { font-style: italic; color: var(--vd-orange); }' +
    ".vd-tagline { font-family: 'DM Serif Display', serif; font-style: italic; font-size: 18px; color: var(--vd-gold); margin: 0 0 16px; }" +
    '.vd-hero-desc { font-size: 16px; color: var(--vd-muted); max-width: 720px; margin: 0; }' +
    '.vd-main { max-width: 1200px; margin: 0 auto; padding: 32px; }' +
    '.vd-tier-toggle { display: inline-flex; background: #fff; border: 1px solid var(--vd-rule); border-radius: 8px; padding: 4px; margin-bottom: 24px; }' +
    '.vd-tier-btn { font-family: inherit; font-size: 13px; font-weight: 600; padding: 8px 16px; border: none; background: transparent; color: var(--vd-muted); cursor: pointer; border-radius: 6px; }' +
    '.vd-tier-btn.vd-active { background: var(--vd-slate); color: #fff; }' +
    ".vd-tier-note { display: inline-block; margin-left: 12px; font-family: 'DM Mono', monospace; font-size: 11px; color: var(--vd-muted); text-transform: uppercase; letter-spacing: 0.08em; vertical-align: middle; }" +
    ".vd-sessions-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: #fff; border: 1px solid var(--vd-rule); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }" +
    ".vd-sessions-label { font-family: 'DM Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vd-muted); font-weight: 600; }" +
    ".vd-sessions-select { font-family: inherit; font-size: 13px; padding: 6px 10px; border: 1px solid var(--vd-rule); border-radius: 6px; background: var(--vd-paper); flex: 1; min-width: 240px; }" +
    ".vd-sessions-count { font-size: 12px; color: var(--vd-muted); font-family: 'DM Mono', monospace; }" +
    '.vd-back-bar { margin-bottom: 16px; }' +
    '.vd-section { background: #fff; border: 1px solid var(--vd-rule); border-radius: 10px; padding: 24px; margin-bottom: 24px; }' +
    ".vd-h2 { font-family: 'DM Serif Display', serif; font-size: 22px; margin: 0 0 8px; color: var(--vd-ink); }" +
    '.vd-section-desc { font-size: 14px; color: var(--vd-muted); margin: 0 0 20px; }' +
    '.vd-import-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: end; }' +
    ".vd-textarea { font-family: 'DM Mono', monospace; font-size: 13px; width: 100%; min-height: 120px; padding: 12px; border: 1px solid var(--vd-rule); border-radius: 6px; resize: vertical; background: var(--vd-paper); }" +
    '.vd-textarea:focus { outline: none; border-color: var(--vd-orange); }' +
    '.vd-import-help { font-size: 12px; color: var(--vd-muted); margin-top: 8px; }' +
    '.vd-collapsed { display: flex; align-items: center; justify-content: space-between; }' +
    '.vd-collapsed-summary { color: var(--vd-green); }' +
    '.vd-btn-primary, .vd-btn-secondary, .vd-btn-ghost { font-family: inherit; font-weight: 600; border-radius: 6px; cursor: pointer; white-space: nowrap; transition: all 0.15s; }' +
    '.vd-btn-primary { font-size: 14px; padding: 10px 18px; background: var(--vd-orange); color: #fff; border: none; }' +
    '.vd-btn-primary:hover { background: var(--vd-red); }' +
    '.vd-btn-compact { padding: 6px 14px; }' +
    '.vd-btn-secondary { font-size: 14px; padding: 10px 18px; background: #fff; color: var(--vd-slate); border: 1px solid var(--vd-rule); }' +
    '.vd-btn-secondary:hover { background: var(--vd-cream); }' +
    '.vd-btn-ghost { background: transparent; color: var(--vd-muted); padding: 6px 10px; font-size: 12px; border: none; }' +
    '.vd-btn-ghost:hover { color: var(--vd-red); }' +
    '.vd-btn-sm { font-size: 12px; padding: 4px 10px; }' +
    '.vd-actions-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; align-items: center; }' +
    ".vd-save-indicator { margin-left: auto; font-size: 12px; color: var(--vd-muted); font-family: 'DM Mono', monospace; }" +
    '.vd-bulk-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; background: var(--vd-orange-light); border: 1px solid var(--vd-orange); border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }' +
    '.vd-bulk-arrow { color: var(--vd-muted); }' +
    ".vd-bulk-input { font-family: 'DM Mono', monospace; font-size: 13px; padding: 6px 10px; border: 1px solid var(--vd-rule); border-radius: 4px; width: 140px; }" +
    '.vd-table { width: 100%; border-collapse: collapse; font-size: 14px; }' +
    ".vd-table thead th { text-align: left; font-family: 'DM Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vd-muted); padding: 10px 12px; border-bottom: 2px solid var(--vd-slate); background: var(--vd-cream); }" +
    '.vd-table td { padding: 12px; border-bottom: 1px solid var(--vd-rule); vertical-align: top; }' +
    '.vd-input { font-family: inherit; font-size: 13px; padding: 6px 8px; border: 1px solid var(--vd-rule); border-radius: 4px; background: #fff; width: 100%; }' +
    '.vd-textarea-cell { min-height: 36px; resize: vertical; }' +
    '.vd-vendor-name { font-weight: 600; color: var(--vd-ink); }' +
    '.vd-acct-hint { font-size: 11px; color: var(--vd-muted); margin-top: 2px; font-style: italic; }' +
    '.vd-mapping-block { background: var(--vd-cream); border-left: 3px solid var(--vd-orange); padding: 12px; border-radius: 4px; margin-bottom: 8px; }' +
    '.vd-mapping-block:last-child { margin-bottom: 0; }' +
    '.vd-mapping-grid { display: grid; grid-template-columns: 120px 140px 1fr 24px; gap: 8px; align-items: start; }' +
    ".vd-mapping-label { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vd-muted); margin-bottom: 4px; display: block; }" +
    '.vd-default-note { grid-column: span 3; color: var(--vd-muted); font-size: 12px; align-self: center; }' +
    ".vd-add-mapping { font-family: 'DM Mono', monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vd-orange); background: transparent; border: 1px dashed var(--vd-orange); padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px; width: 100%; }" +
    '.vd-add-mapping:hover:not(:disabled) { background: var(--vd-orange-light); }' +
    '.vd-add-mapping:disabled { opacity: 0.4; cursor: not-allowed; }' +
    '.vd-gated-badge { display: inline-block; background: var(--vd-gold); color: var(--vd-ink); font-size: 10px; padding: 3px 8px; border-radius: 3px; margin-left: 8px; font-weight: 600; }' +
    '.vd-how { background: #fff; border: 1px solid var(--vd-rule); border-radius: 8px; padding: 0; margin-bottom: 24px; }' +
    '.vd-how summary { cursor: pointer; padding: 12px 16px; font-weight: 600; color: var(--vd-slate); font-size: 14px; list-style: none; }' +
    '.vd-how summary::-webkit-details-marker { display: none; }' +
    '.vd-how summary::before { content: "▸"; margin-right: 8px; color: var(--vd-orange); display: inline-block; transition: transform 0.15s; }' +
    '.vd-how[open] summary::before { transform: rotate(90deg); }' +
    '.vd-how-body { padding: 0 16px 16px; font-size: 13px; color: var(--vd-ink); line-height: 1.65; }' +
    '.vd-how-body ol { padding-left: 20px; margin: 8px 0; }' +
    '.vd-how-foot { margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--vd-rule); font-size: 12px; }' +
    '.vd-review-banner { background: var(--vd-orange-light); border-left: 4px solid var(--vd-orange); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; color: var(--vd-ink); }' +
    '.vd-share-banner { background: #e8f5e9; border-left: 4px solid var(--vd-green); padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; color: var(--vd-ink); }' +
    '.vd-share-link { color: var(--vd-orange); word-break: break-all; }' +
    '.vd-share-note { margin-top: 6px; font-size: 12px; color: var(--vd-muted); }' +
    '.vd-error-banner { background: #fee; border-left: 4px solid #c00; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 14px; color: var(--vd-ink); }' +
    '.vd-preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }' +
    '.vd-preview-pane { background: #fff; border: 2px solid var(--vd-slate); border-radius: 8px; padding: 24px; }' +
    ".vd-preview-h3 { font-family: 'DM Serif Display', serif; font-size: 18px; margin: 0 0 4px; }" +
    ".vd-preview-meta { font-family: 'DM Mono', monospace; font-size: 10px; color: var(--vd-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }" +
    '.vd-preview-table { width: 100%; border-collapse: collapse; font-size: 11px; }' +
    ".vd-preview-table th { text-align: left; font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vd-muted); padding: 6px 8px; border-bottom: 1.5px solid var(--vd-ink); }" +
    '.vd-preview-table td { padding: 6px 8px; border-bottom: 1px solid var(--vd-rule); vertical-align: top; }' +
    '.vd-preview-vendor { font-weight: 600; }' +
    ".vd-preview-acct { font-family: 'DM Mono', monospace; font-weight: 600; color: var(--vd-slate); white-space: nowrap; }" +
    '.vd-preview-logic { font-size: 10px; color: var(--vd-muted); }' +
    ".vd-preview-foot { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--vd-rule); font-size: 10px; color: var(--vd-muted); font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.06em; text-align: center; }" +
    '@media print {' +
    '.vd-hero, .vd-tier-toggle, .vd-actions-bar, .vd-bulk-bar, .vd-section:not(#vd-preview-section) { display: none !important; }' +
    '.vd-page { background: #fff; }' +
    '.vd-main { padding: 0; max-width: none; }' +
    '.vd-preview-pane { border: none; padding: 0; }' +
    '#vd-preview-section { background: #fff; border: none; padding: 0; }' +
    '}' +
    '@media (max-width: 700px) {' +
    '.vd-h1 { font-size: 32px; }' +
    '.vd-main { padding: 16px; }' +
    '.vd-mapping-grid { grid-template-columns: 1fr; }' +
    '}';
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

// =============================================================================
// USAGE — add this to your router (App.jsx or wherever you define routes):
//
//   import VendorDecoder from './pages/tools/VendorDecoder';
//   ...
//   <Route path="/tools/vendor-decoder" element={<VendorDecoder />} />
//
// And to your tool library / nav:
//
//   <Link to="/tools/vendor-decoder">Vendor Decoder</Link>
//
// =============================================================================
