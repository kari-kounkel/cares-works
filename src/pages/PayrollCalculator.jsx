// =============================================================================
// PayrollCalculator.jsx
// CARES Works — Payroll Stub Calculator. Member-only tool.
// Calculates gross pay, federal/state withholding, FICA, manual deductions,
// and generates a printable pay stub.
// Route: /tools/payroll-calculator
// =============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { navigate } from '../App';

const MONTHLY_URL = 'https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06';
const ANNUAL_URL  = 'https://buy.stripe.com/14A5kD4B981AgTxcuM18c09';

// =============================================================================
// TAX DATA — 2026
// Source: IRS Revenue Procedure 2025-32, Publication 15-T (2026)
// =============================================================================

// 2026 Pub 15-T Withholding Adjustment — amounts subtracted from annualized
// wages BEFORE applying brackets (from Worksheet 1A, line 1h)
// Step 2 NOT checked: MFJ = $12,900, all others = $8,600
const FED_STD = { S: 8600, MFJ: 12900, HOH: 8600, MFS: 8600 };

// 2026 Annualized Federal Brackets (IRS Rev. Proc. 2025-32)
// Format: [bracket_start, rate, cumulative_tax_at_bracket_start]
const FED_BRACKETS = {
  S: [
    [0,       0.10, 0],
    [12400,   0.12, 1240],
    [50400,   0.22, 5800],
    [105700,  0.24, 17966],
    [201775,  0.32, 41024],
    [256225,  0.35, 58448],
    [640600,  0.37, 192979.25],
    [Infinity,0.37, 192979.25],
  ],
  MFJ: [
    [0,       0.10, 0],
    [24800,   0.12, 2480],
    [100800,  0.22, 11600],
    [211400,  0.24, 35932],
    [403550,  0.32, 82048],
    [512450,  0.35, 116896],
    [768700,  0.37, 206583.50],
    [Infinity,0.37, 206583.50],
  ],
  HOH: [
    [0,       0.10, 0],
    [17700,   0.12, 1770],
    [67450,   0.22, 7740],
    [105700,  0.24, 16155],
    [201750,  0.32, 39207],
    [256200,  0.35, 56631],
    [640600,  0.37, 191171],
    [Infinity,0.37, 191171],
  ],
  MFS: [
    [0,       0.10, 0],
    [12400,   0.12, 1240],
    [50400,   0.22, 5800],
    [105700,  0.24, 17966],
    [201775,  0.32, 41024],
    [256225,  0.35, 58448],
    [384350,  0.37, 103291.75],
    [Infinity,0.37, 103291.75],
  ],
};

function calcBracketTax(annualIncome, brackets) {
  if (annualIncome <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length - 1; i++) {
    const [min, rate, base] = brackets[i];
    const [nextMin] = brackets[i + 1];
    if (annualIncome <= nextMin) {
      tax = base + (annualIncome - min) * rate;
      break;
    }
  }
  return Math.max(0, tax);
}

// Pay periods per year
const PAY_PERIODS = { Weekly: 52, Biweekly: 26, Semimonthly: 24, Monthly: 12 };

function calcFederalWithholding(grossPeriod, filingStatus, preTaxDedPeriod, additionalPeriod, payPeriod) {
  const periods = PAY_PERIODS[payPeriod] || 26;
  const annualGross = grossPeriod * periods;
  const annualPreTax = preTaxDedPeriod * periods;
  const stdAmt = FED_STD[filingStatus] || FED_STD.S;
  const adjustedWage = Math.max(0, annualGross - annualPreTax - stdAmt);
  const annualTax = calcBracketTax(adjustedWage, FED_BRACKETS[filingStatus] || FED_BRACKETS.S);
  const periodTax = annualTax / periods;
  return Math.max(0, periodTax + (additionalPeriod || 0));
}

// =============================================================================
// STATE DATA
// type: 'none'   — no state income tax, $0 auto
// type: 'auto'   — MN only, calculated from tables below
// type: 'manual' — user looks up their state table and enters the amount
// =============================================================================

const MN_STD_DED = { S: 14575, MFJ: 29150 };
const MN_BRACKETS = {
  S:   [[0,0.0535,0],[31690,0.068,1695.42],[104090,0.0785,6619.34],[193240,0.0985,13620.19],[Infinity,0.0985,13620.19]],
  MFJ: [[0,0.0535,0],[46330,0.068,2478.66],[184040,0.0785,9844.92],[321450,0.0985,20633.62],[Infinity,0.0985,20633.62]],
};

const STATES = {
  AL: { name: 'Alabama',            type: 'manual', link: 'https://www.revenue.alabama.gov/withholding-tax/' },
  AK: { name: 'Alaska',             type: 'none' },
  AZ: { name: 'Arizona',            type: 'manual', link: 'https://azdor.gov/business/withholding-tax' },
  AR: { name: 'Arkansas',           type: 'manual', link: 'https://www.dfa.arkansas.gov/income-tax/withholding-tax/' },
  CA: { name: 'California',         type: 'manual', link: 'https://www.edd.ca.gov/payroll_taxes/withholding_from_wages.htm' },
  CO: { name: 'Colorado',           type: 'manual', link: 'https://tax.colorado.gov/withholding-tax' },
  CT: { name: 'Connecticut',        type: 'manual', link: 'https://portal.ct.gov/DRS/Withholding/Withholding-Tax' },
  DE: { name: 'Delaware',           type: 'manual', link: 'https://revenue.delaware.gov/business-tax-forms/withholding-tax/' },
  DC: { name: 'Washington DC',      type: 'manual', link: 'https://otr.cfo.dc.gov/page/dc-employer-withholding' },
  FL: { name: 'Florida',            type: 'none' },
  GA: { name: 'Georgia',            type: 'manual', link: 'https://dor.georgia.gov/taxes/business-taxes/withholding-tax' },
  HI: { name: 'Hawaii',             type: 'manual', link: 'https://tax.hawaii.gov/withholding/' },
  ID: { name: 'Idaho',              type: 'manual', link: 'https://tax.idaho.gov/taxes/withholding/' },
  IL: { name: 'Illinois',           type: 'manual', link: 'https://tax.illinois.gov/research/taxinformation/income/payroll.html' },
  IN: { name: 'Indiana',            type: 'manual', link: 'https://www.in.gov/dor/business-tax/withholding-income-tax/' },
  IA: { name: 'Iowa',               type: 'manual', link: 'https://tax.iowa.gov/iowa-withholding-tax' },
  KS: { name: 'Kansas',             type: 'manual', link: 'https://www.ksrevenue.gov/buswithholdingforms.html' },
  KY: { name: 'Kentucky',           type: 'manual', link: 'https://revenue.ky.gov/Business/Pages/Withholding-Tax.aspx' },
  LA: { name: 'Louisiana',          type: 'manual', link: 'https://revenue.louisiana.gov/withholding' },
  ME: { name: 'Maine',              type: 'manual', link: 'https://www.maine.gov/revenue/taxes/income-estate-tax/withholding' },
  MD: { name: 'Maryland',           type: 'manual', link: 'https://www.marylandtaxes.gov/business/income/withholding/' },
  MA: { name: 'Massachusetts',      type: 'manual', link: 'https://www.mass.gov/info-details/withholding-tax' },
  MI: { name: 'Michigan',           type: 'manual', link: 'https://www.michigan.gov/taxes/business-taxes/withholding' },
  MN: { name: 'Minnesota',          type: 'manual', link: 'https://www.revenue.state.mn.us/withholding-income-tax' },
  MS: { name: 'Mississippi',        type: 'manual', link: 'https://www.dor.ms.gov/tax-rates/withholding' },
  MO: { name: 'Missouri',           type: 'manual', link: 'https://dor.mo.gov/withholding/' },
  MT: { name: 'Montana',            type: 'manual', link: 'https://mtrevenue.gov/taxes/withholding/' },
  NE: { name: 'Nebraska',           type: 'manual', link: 'https://revenue.nebraska.gov/businesses/withholding-tax' },
  NV: { name: 'Nevada',             type: 'none' },
  NH: { name: 'New Hampshire',      type: 'none' },
  NJ: { name: 'New Jersey',         type: 'manual', link: 'https://www.nj.gov/treasury/taxation/businesses/payroll/' },
  NM: { name: 'New Mexico',         type: 'manual', link: 'https://www.tax.newmexico.gov/businesses/withholding-tax/' },
  NY: { name: 'New York',           type: 'manual', link: 'https://www.tax.ny.gov/bus/wt/wtidx.htm' },
  NC: { name: 'North Carolina',     type: 'manual', link: 'https://www.ncdor.gov/taxes-forms/withholding-tax' },
  ND: { name: 'North Dakota',       type: 'manual', link: 'https://www.nd.gov/tax/user/businesses/businesstopics/withholding' },
  OH: { name: 'Ohio',               type: 'manual', link: 'https://tax.ohio.gov/business/ohio-employer-withholding-tax' },
  OK: { name: 'Oklahoma',           type: 'manual', link: 'https://oklahoma.gov/tax/business/withholding.html' },
  OR: { name: 'Oregon',             type: 'manual', link: 'https://www.oregon.gov/dor/programs/businesses/Pages/withholding.aspx' },
  PA: { name: 'Pennsylvania',       type: 'manual', link: 'https://www.revenue.pa.gov/TaxTypes/Personal%20Income%20Tax/Employer%20Withholding/Pages/default.aspx' },
  RI: { name: 'Rhode Island',       type: 'manual', link: 'https://tax.ri.gov/tax-sections/income-taxes/employer-tax-withholding' },
  SC: { name: 'South Carolina',     type: 'manual', link: 'https://dor.sc.gov/tax/withholding' },
  SD: { name: 'South Dakota',       type: 'none' },
  TN: { name: 'Tennessee',          type: 'none' },
  TX: { name: 'Texas',              type: 'none' },
  UT: { name: 'Utah',               type: 'manual', link: 'https://incometax.utah.gov/withholding' },
  VT: { name: 'Vermont',            type: 'manual', link: 'https://tax.vermont.gov/business-and-corp/withholding' },
  VA: { name: 'Virginia',           type: 'manual', link: 'https://www.tax.virginia.gov/withholding-tax' },
  WA: { name: 'Washington',         type: 'none' },
  WV: { name: 'West Virginia',      type: 'manual', link: 'https://tax.wv.gov/Business/WithholdingTax/Pages/WithholdingTax.aspx' },
  WI: { name: 'Wisconsin',          type: 'manual', link: 'https://www.revenue.wi.gov/Pages/withholding/home.aspx' },
  WY: { name: 'Wyoming',            type: 'none' },
};

function calcMNWithholding(annualTaxableIncome, filingStatus) {
  const stdDed = filingStatus === 'MFJ' ? MN_STD_DED.MFJ : MN_STD_DED.S;
  const taxable = Math.max(0, annualTaxableIncome - stdDed);
  const brackets = filingStatus === 'MFJ' ? MN_BRACKETS.MFJ : MN_BRACKETS.S;
  return calcBracketTax(taxable, brackets);
}

// =============================================================================
// HELPERS
// =============================================================================

function fmt(n) {
  return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function blankDed() {
  return { id: Date.now() + Math.random(), name: '', amount: '', type: 'pretax' };
}

// =============================================================================
// PREVIEW — shown to non-members so they can see what they're getting
// =============================================================================

function Preview() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#ffffff', minHeight: '100vh', color: '#0a0a14' }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ height: 36, width: 'auto', display: 'block' }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: '#0a0a14' }}>CARES <span style={{ color: '#0080ff' }}>Works.</span></span>
        </a>
        <a href={MONTHLY_URL} style={{ background: '#0080ff', color: '#fff', fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '.12em', textTransform: 'uppercase', padding: '9px 18px', borderRadius: '4px', textDecoration: 'none' }}>Join — $27/mo</a>
      </header>

      {/* HERO */}
      <div style={{ background: '#f7f9fc', borderBottom: '1px solid #e2e8f0', padding: '44px 40px 32px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#ff8a2a', marginBottom: '10px' }}>CARES Works · Member Tool</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '40px', lineHeight: 1.1, color: '#0a0a14', marginBottom: '8px' }}>Payroll <em style={{ fontStyle: 'italic', color: '#ff8a2a' }}>Stub Calculator</em></h1>
          <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '560px', lineHeight: 1.6 }}>Calculate gross pay, federal and state withholding, FICA, and deductions for all 50 states. Print a clean pay stub every pay period.</p>
        </div>
      </div>

      {/* WHAT YOU GET */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { icon: '💵', title: 'Hourly & salary', body: 'Regular pay, overtime at 1.5x, salary by pay period.' },
            { icon: '🗺️', title: 'All 50 states', body: 'Actual state withholding tables — brackets, flat rates, and no-tax states.' },
            { icon: '📋', title: 'Custom deductions', body: 'Add health insurance, 401(k), garnishments — pre-tax or post-tax.' },
            { icon: '🖨️', title: 'Printable stub', body: 'Clean, professional pay stub ready to hand to your employee.' },
          ].map(c => (
            <div key={c.title} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '20px 18px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{c.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a14', marginBottom: '5px' }}>{c.title}</div>
              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.55 }}>{c.body}</div>
            </div>
          ))}
        </div>

        {/* BLURRED STUB PREVIEW */}
        <div style={{ position: 'relative', marginBottom: '48px' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#ff8a2a', marginBottom: '12px' }}>Sample Pay Stub</div>

          {/* Stub — blurred */}
          <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', background: '#fff', border: '2px solid #0a0a14', borderRadius: '10px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '2px solid #0a0a14', marginBottom: '18px' }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0a0a14', marginBottom: '4px' }}>Acme Business LLC</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Jane Smith</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                <div>Pay Period: 05/01 — 05/15</div>
                <div>Check #: 1042</div>
                <div>Bi-weekly · Minnesota</div>
              </div>
            </div>
            {[
              ['EARNINGS', [['Regular Pay', '80 hrs', '$22.00', '$1,760.00'], ['Overtime', '4 hrs', '$33.00', '$132.00']]],
              ['TAXES WITHHELD', [['Federal Income Tax', '', 'Single', '$214.87'], ['Social Security', '', '6.2%', '$117.37'], ['Medicare', '', '1.45%', '$27.44'], ['Minnesota State Tax', '', 'State tables', '$102.48']]],
              ['DEDUCTIONS', [['Health Insurance', '', 'Pre-tax', '$150.00'], ['401(k)', '', 'Pre-tax', '$95.00']]],
            ].map(([title, rows]) => (
              <div key={title} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#0a0a14', borderBottom: '1px solid #0a0a14', paddingBottom: '5px', marginBottom: '8px' }}>{title}</div>
                {rows.map((r, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 100px 100px', fontSize: '13px', padding: '4px 0', borderBottom: '1px solid #e2e8f0' }}>
                    {r.map((cell, j) => <span key={j} style={{ textAlign: j > 0 ? 'right' : 'left' }}>{cell}</span>)}
                  </div>
                ))}
              </div>
            ))}
            <div style={{ borderTop: '2px solid #0a0a14', paddingTop: '12px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#0a0a14' }}>
                <span>Net Pay</span><span>$1,284.84</span>
              </div>
            </div>
          </div>

          {/* Overlay CTA */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(247,249,252,0.6)', borderRadius: '10px' }}>
            <div style={{ background: '#fff', border: '2px solid #0a0a14', borderRadius: '14px', padding: '36px 40px', textAlign: 'center', maxWidth: '380px', boxShadow: '0 8px 32px rgba(0,0,0,.12)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#0a0a14', marginBottom: '8px' }}>Members Only Tool</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>Unlock the Payroll Stub Calculator and the full CARES Works tool library for $27/month.</p>
              <a href={MONTHLY_URL} style={{ display: 'block', background: '#0080ff', color: '#fff', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', padding: '14px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, marginBottom: '10px' }}>Join for $27/month</a>
              <a href={ANNUAL_URL} style={{ display: 'block', background: '#fff', color: '#0080ff', fontFamily: "'DM Mono', monospace", fontSize: '12px', letterSpacing: '.12em', textTransform: 'uppercase', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, border: '2px solid #0080ff' }}>$270/year — save 2 months</a>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid #e2e8f0', padding: '22px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#64748b' }}>
        <div>© 2026 CARES Consulting Inc. · <a href="https://caresmn.com" style={{ color: '#64748b' }}>caresmn.com</a></div>
        <a href="https://karikounkel.store" style={{ color: '#64748b' }}>Full Store at karikounkel.store →</a>
      </footer>
    </div>
  );
}

// =============================================================================
// GATE — fallback if Preview is bypassed (shouldn't happen)
// =============================================================================
const S = {
  navy: '#0a0a14', navy2: '#0052cc', gold: '#ff8a2a', gold2: '#ffc499',
  cream: '#ffffff', orange: '#0080ff', muted: '#64748b', ink: '#0a0a14',
  rule: '#e2e8f0', white: '#ffffff', green: '#22c55e',
};

function Gate() {
  return (
    <div style={{ minHeight: '100vh', background: S.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: '460px', width: '100%', background: S.white, borderRadius: '16px', padding: '44px 36px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: S.navy, marginBottom: '10px', fontFamily: "'Playfair Display', serif" }}>Members Only Tool</h2>
        <p style={{ color: S.muted, marginBottom: '28px', lineHeight: '1.65', fontSize: '15px' }}>The Payroll Stub Calculator is a CARES Works member tool. Know what your employees take home — and why.</p>
        <a href={MONTHLY_URL} style={{ display: 'block', background: S.orange, color: S.white, padding: '14px 24px', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', marginBottom: '12px', fontSize: '15px' }}>Join for $27/month</a>
        <a href={ANNUAL_URL}  style={{ display: 'block', background: S.white, color: S.orange, padding: '12px 24px', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', border: '2px solid ' + S.orange, fontSize: '14px' }}>$270/year — save 2 months</a>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PayrollCalculator({ session }) {
  const [isMember, setIsMember] = useState(false);

  // Company
  const [companyName, setCompanyName] = useState('');

  // Employee
  const [empName,   setEmpName]   = useState('');
  const [payType,   setPayType]   = useState('hourly');
  const [rate,      setRate]      = useState('');
  const [hours,     setHours]     = useState('');
  const [otHours,   setOtHours]   = useState('');
  const [annualSal, setAnnualSal] = useState('');
  const [payPeriod, setPayPeriod] = useState('Biweekly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd,   setPeriodEnd]   = useState('');
  const [checkNum,    setCheckNum]    = useState('');

  // Tax
  const [filingStatus,    setFilingStatus]    = useState('S');
  const [addlFed,         setAddlFed]         = useState('');
  const [stateCode,       setStateCode]       = useState('MN');
  const [manualStateTax,  setManualStateTax]  = useState('');

  // Deductions
  const [deductions, setDeductions] = useState([blankDed()]);

  // Output
  const [result,   setResult]   = useState(null);
  const [showStub, setShowStub] = useState(false);

  useEffect(() => {
    async function check() {
      if (!session) return;
      try {
        const { data } = await supabase.from('members').select('plan').eq('email', session.user.email).single();
        setIsMember(!!data);
      } catch { setIsMember(false); }
    }
    check();
  }, [session]);

  // ---- Deduction helpers ----
  function addDed()         { setDeductions(d => [...d, blankDed()]); }
  function removeDed(id)    { setDeductions(d => d.filter(x => x.id !== id)); }
  function updateDed(id, k, v) { setDeductions(d => d.map(x => x.id === id ? { ...x, [k]: v } : x)); }

  // ---- Calculate ----
  function calculate() {
    const periods = PAY_PERIODS[payPeriod] || 26;
    let regularPay = 0, otPay = 0;

    if (payType === 'hourly') {
      const r = parseFloat(rate) || 0;
      const h = parseFloat(hours) || 0;
      const ot = parseFloat(otHours) || 0;
      regularPay = r * h;
      otPay = r * 1.5 * ot;
    } else {
      const annual = parseFloat(annualSal) || 0;
      regularPay = annual / periods;
    }

    const grossPay = regularPay + otPay;
    const deds = deductions.map(d => ({ ...d, amt: parseFloat(d.amount) || 0 })).filter(d => d.amt > 0);
    const preTaxTotal  = deds.filter(d => d.type === 'pretax').reduce((s, d) => s + d.amt, 0);
    const postTaxTotal = deds.filter(d => d.type === 'posttax').reduce((s, d) => s + d.amt, 0);

    const federalTax = calcFederalWithholding(grossPay, filingStatus, preTaxTotal, parseFloat(addlFed) || 0, payPeriod);
    const ficaWage   = grossPay - preTaxTotal;
    const ssTax      = Math.max(0, ficaWage * 0.062);
    const medTax     = Math.max(0, ficaWage * 0.0145);

    const stateInfo  = STATES[stateCode] || {};
    let stateTax = 0;
    if (stateInfo.type === 'auto') {
      const annualTaxable = ficaWage * periods;
      stateTax = calcMNWithholding(annualTaxable, filingStatus) / periods;
    } else if (stateInfo.type === 'manual') {
      stateTax = parseFloat(manualStateTax) || 0;
    }

    const netPay = grossPay - preTaxTotal - federalTax - ssTax - medTax - stateTax - postTaxTotal;

    setResult({
      regularPay, otPay, grossPay,
      preTaxDeds:  deds.filter(d => d.type === 'pretax'),
      postTaxDeds: deds.filter(d => d.type === 'posttax'),
      preTaxTotal, postTaxTotal,
      federalTax, ssTax, medTax, stateTax,
      stateName: stateInfo.name || stateCode,
      stateType: stateInfo.type,
      netPay,
    });
    setShowStub(true);
    setTimeout(() => {
      const el = document.getElementById('pc-stub');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function resetAll() {
    setResult(null); setShowStub(false);
    setEmpName(''); setRate(''); setHours(''); setOtHours(''); setAnnualSal('');
    setAddlFed(''); setDeductions([blankDed()]);
    setPeriodStart(''); setPeriodEnd(''); setCheckNum('');
  }

  const bizLabel = companyName || '[Company Name]';

  return (
    <div className="pc-page">
      <PCStyles />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="pc-header">
        <a href="/" className="pc-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/cares-works-neon-logo.png" alt="CARES Works" style={{ height: 32, width: 'auto', display: 'block' }} />
          <span>CARES <span className="pc-brand-accent">Works.</span></span>
        </a>
        <nav className="pc-nav">
          <button className="pc-nav-link" onClick={() => navigate('/tools/payroll-checklist')}>Payroll Checklist</button>
          <button className="pc-nav-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
        </nav>
      </header>

      {/* HERO */}
      <div className="pc-hero">
        <div className="pc-hero-inner">
          <div className="pc-eyebrow">CARES Works · Free Tool</div>
          <h1 className="pc-h1">Payroll <span className="pc-accent">Stub Calculator</span></h1>
          <div className="pc-tagline">Revenue is vanity. Net profit is sanity.</div>
          <p className="pc-hero-desc">Calculate gross pay, federal and state withholding, FICA, and deductions — then print a clean pay stub. What happens with the employer taxes is on you.</p>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div className="pc-disclaimer">
        <strong>Heads up:</strong> This tool calculates what goes on a pay stub — gross pay, standard withholdings, and deductions. It is not a tax solution. Rates are based on current IRS and state withholding tables and should be verified each January. You are responsible for your payroll. When in doubt, call your CPA.
      </div>

      <main className="pc-main">

        {/* COMPANY + EMPLOYEE */}
        <div className="pc-section">
          <div className="pc-section-label">Company & Employee</div>
          <div className="pc-row">
            <div className="pc-field">
              <label className="pc-label">Company Name <span className="pc-opt">(for stub header)</span></label>
              <input className="pc-input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="CARES Consulting LLC" />
            </div>
            <div className="pc-field">
              <label className="pc-label">Employee Name</label>
              <input className="pc-input" value={empName} onChange={e => setEmpName(e.target.value)} placeholder="Jane Smith" />
            </div>
          </div>
          <div className="pc-row">
            <div className="pc-field">
              <label className="pc-label">Pay Period Start</label>
              <input className="pc-input" type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div className="pc-field">
              <label className="pc-label">Pay Period End</label>
              <input className="pc-input" type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
            <div className="pc-field">
              <label className="pc-label">Check / Reference #</label>
              <input className="pc-input" value={checkNum} onChange={e => setCheckNum(e.target.value)} placeholder="1042" />
            </div>
          </div>
        </div>

        {/* PAY */}
        <div className="pc-section">
          <div className="pc-section-label">Pay</div>
          <div className="pc-row">
            <div className="pc-field">
              <label className="pc-label">Pay Type</label>
              <select className="pc-input" value={payType} onChange={e => setPayType(e.target.value)}>
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
              </select>
            </div>
            <div className="pc-field">
              <label className="pc-label">Pay Frequency</label>
              <select className="pc-input" value={payPeriod} onChange={e => setPayPeriod(e.target.value)}>
                <option value="Weekly">Weekly (52/yr)</option>
                <option value="Biweekly">Bi-weekly (26/yr)</option>
                <option value="Semimonthly">Semi-monthly (24/yr)</option>
                <option value="Monthly">Monthly (12/yr)</option>
              </select>
            </div>
          </div>

          {payType === 'hourly' ? (
            <div className="pc-row">
              <div className="pc-field">
                <label className="pc-label">Hourly Rate ($)</label>
                <input className="pc-input" type="number" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="18.00" />
              </div>
              <div className="pc-field">
                <label className="pc-label">Regular Hours</label>
                <input className="pc-input" type="number" step="0.25" value={hours} onChange={e => setHours(e.target.value)} placeholder="80" />
              </div>
              <div className="pc-field">
                <label className="pc-label">Overtime Hours <span className="pc-opt">(1.5x)</span></label>
                <input className="pc-input" type="number" step="0.25" value={otHours} onChange={e => setOtHours(e.target.value)} placeholder="0" />
              </div>
            </div>
          ) : (
            <div className="pc-row">
              <div className="pc-field">
                <label className="pc-label">Annual Salary ($)</label>
                <input className="pc-input" type="number" step="100" value={annualSal} onChange={e => setAnnualSal(e.target.value)} placeholder="52000" />
              </div>
              <div className="pc-field">
                <label className="pc-label">Period Pay</label>
                <div className="pc-calc-display">
                  {annualSal ? '$' + fmt((parseFloat(annualSal) || 0) / (PAY_PERIODS[payPeriod] || 26)) : '—'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TAX INFO */}
        <div className="pc-section">
          <div className="pc-section-label">Tax Withholding Info</div>
          <div className="pc-row">
            <div className="pc-field">
              <label className="pc-label">Filing Status (W-4)</label>
              <select className="pc-input" value={filingStatus} onChange={e => setFilingStatus(e.target.value)}>
                <option value="S">Single / Married Filing Separately</option>
                <option value="MFJ">Married Filing Jointly</option>
                <option value="HOH">Head of Household</option>
              </select>
            </div>
            <div className="pc-field">
              <label className="pc-label">Additional Federal Withholding <span className="pc-opt">(W-4 Step 4c, per period)</span></label>
              <input className="pc-input" type="number" step="1" value={addlFed} onChange={e => setAddlFed(e.target.value)} placeholder="0.00" />
            </div>
            <div className="pc-field">
              <label className="pc-label">Work State</label>
              <select className="pc-input" value={stateCode} onChange={e => { setStateCode(e.target.value); setManualStateTax(''); }}>
                {Object.entries(STATES).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([code, st]) => (
                  <option key={code} value={code}>{st.name}{st.type === 'none' ? ' — no state income tax' : st.type === 'auto' ? ' — auto-calculated' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* No-tax state */}
          {STATES[stateCode] && STATES[stateCode].type === 'none' && (
            <div className="pc-state-note">✅ {STATES[stateCode].name} has no state income tax. State withholding will show $0.00 on the stub.</div>
          )}

          {/* Manual state — show link + entry field */}
          {STATES[stateCode] && STATES[stateCode].type === 'manual' && (
            <div className="pc-manual-state">
              <div className="pc-manual-state-head">
                📋 Look up {STATES[stateCode].name} withholding
              </div>
              <p className="pc-manual-state-desc">
                State withholding tables change annually and vary by filing status, pay period, and wage bracket.
                Look up the per-period amount for this employee on your state's official withholding publication, then enter it below.
              </p>
              <a
                href={STATES[stateCode].link}
                target="_blank"
                rel="noreferrer"
                className="pc-state-link"
              >
                Open {STATES[stateCode].name} Withholding Tables →
              </a>
              <div className="pc-manual-entry">
                <label className="pc-label">{STATES[stateCode].name} State Withholding (per period)</label>
                <input
                  className="pc-input pc-manual-input"
                  type="number"
                  step="0.01"
                  value={manualStateTax}
                  onChange={e => setManualStateTax(e.target.value)}
                  placeholder="Enter amount from state table"
                />
              </div>
            </div>
          )}
        </div>

        {/* DEDUCTIONS */}
        <div className="pc-section">
          <div className="pc-section-label">Deductions <span className="pc-opt">(per pay period)</span></div>
          {deductions.map(d => (
            <div key={d.id} className="pc-ded-row">
              <input className="pc-input pc-ded-name" value={d.name} onChange={e => updateDed(d.id, 'name', e.target.value)} placeholder="Health insurance, 401(k), garnishment…" />
              <input className="pc-input pc-ded-amt" type="number" step="0.01" value={d.amount} onChange={e => updateDed(d.id, 'amount', e.target.value)} placeholder="0.00" />
              <select className="pc-input pc-ded-type" value={d.type} onChange={e => updateDed(d.id, 'type', e.target.value)}>
                <option value="pretax">Pre-tax</option>
                <option value="posttax">Post-tax</option>
              </select>
              <button className="pc-ded-remove" onClick={() => removeDed(d.id)}>×</button>
            </div>
          ))}
          <button className="pc-add-ded" onClick={addDed}>+ Add deduction</button>
        </div>

        {/* ACTIONS */}
        <div className="pc-actions">
          <button className="pc-btn-primary" onClick={calculate}>Calculate Pay Stub</button>
          <button className="pc-btn-ghost" onClick={resetAll}>Reset</button>
          <button className="pc-btn-secondary" onClick={() => navigate('/tools/payroll-checklist')}>Open Payroll Checklist →</button>
        </div>

        {/* PAY STUB OUTPUT */}
        {showStub && result && (
          <div id="pc-stub" className="pc-stub-wrapper">
            <div className="pc-stub-actions">
              <h3 className="pc-stub-heading">Pay Stub Preview</h3>
              <button className="pc-btn-primary" onClick={() => window.print()}>🖨️ Print Stub</button>
            </div>

            <div className="pc-stub">
              {/* STUB HEADER */}
              <div className="pc-stub-header">
                <div>
                  <div className="pc-stub-company">{companyName || 'Company Name'}</div>
                  <div className="pc-stub-empname">{empName || 'Employee Name'}</div>
                </div>
                <div className="pc-stub-meta">
                  {periodStart && periodEnd && (
                    <div className="pc-stub-meta-row"><span>Pay Period</span><strong>{periodStart} — {periodEnd}</strong></div>
                  )}
                  {checkNum && (
                    <div className="pc-stub-meta-row"><span>Check #</span><strong>{checkNum}</strong></div>
                  )}
                  <div className="pc-stub-meta-row"><span>Pay Frequency</span><strong>{payPeriod}</strong></div>
                  <div className="pc-stub-meta-row"><span>State</span><strong>{result.stateName}</strong></div>
                </div>
              </div>

              {/* EARNINGS */}
              <div className="pc-stub-section-title">Earnings</div>
              <div className="pc-stub-table">
                <div className="pc-stub-row pc-stub-thead">
                  <span>Description</span><span>Hours</span><span>Rate</span><span>Amount</span>
                </div>
                {payType === 'hourly' ? (
                  <>
                    <div className="pc-stub-row">
                      <span>Regular Pay</span>
                      <span>{hours || '0'}</span>
                      <span>${fmt(parseFloat(rate) || 0)}</span>
                      <span>${fmt(result.regularPay)}</span>
                    </div>
                    {result.otPay > 0 && (
                      <div className="pc-stub-row">
                        <span>Overtime Pay (1.5x)</span>
                        <span>{otHours}</span>
                        <span>${fmt((parseFloat(rate) || 0) * 1.5)}</span>
                        <span>${fmt(result.otPay)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="pc-stub-row">
                    <span>Salary</span>
                    <span>—</span>
                    <span>—</span>
                    <span>${fmt(result.regularPay)}</span>
                  </div>
                )}
                <div className="pc-stub-row pc-stub-subtotal">
                  <span>Gross Pay</span><span></span><span></span><span>${fmt(result.grossPay)}</span>
                </div>
              </div>

              {/* PRE-TAX DEDUCTIONS */}
              {result.preTaxDeds.length > 0 && (
                <>
                  <div className="pc-stub-section-title">Pre-Tax Deductions</div>
                  <div className="pc-stub-table">
                    {result.preTaxDeds.map((d, i) => (
                      <div key={i} className="pc-stub-row">
                        <span>{d.name || 'Deduction'}</span><span></span><span></span><span>- ${fmt(d.amt)}</span>
                      </div>
                    ))}
                    <div className="pc-stub-row pc-stub-subtotal">
                      <span>Taxable Wages</span><span></span><span></span>
                      <span>${fmt(result.grossPay - result.preTaxTotal)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* TAXES */}
              <div className="pc-stub-section-title">Taxes Withheld</div>
              <div className="pc-stub-table">
                <div className="pc-stub-row pc-stub-thead">
                  <span>Tax</span><span></span><span>Rate / Basis</span><span>Amount</span>
                </div>
                <div className="pc-stub-row">
                  <span>Federal Income Tax</span><span></span>
                  <span>Pub 15-T {filingStatus === 'MFJ' ? 'MFJ' : filingStatus === 'HOH' ? 'HOH' : 'Single'}</span>
                  <span>${fmt(result.federalTax)}</span>
                </div>
                <div className="pc-stub-row">
                  <span>Social Security</span><span></span><span>6.2%</span><span>${fmt(result.ssTax)}</span>
                </div>
                <div className="pc-stub-row">
                  <span>Medicare</span><span></span><span>1.45%</span><span>${fmt(result.medTax)}</span>
                </div>
                {result.stateTax > 0 && (
                  <div className="pc-stub-row">
                    <span>{result.stateName} State Tax</span><span></span><span>State tables</span>
                    <span>${fmt(result.stateTax)}</span>
                  </div>
                )}
                {result.stateTax === 0 && STATES[stateCode] && STATES[stateCode].type === 'none' && (
                  <div className="pc-stub-row pc-stub-zero">
                    <span>{result.stateName} State Tax</span><span></span><span>No state income tax</span><span>$0.00</span>
                  </div>
                )}
              </div>

              {/* POST-TAX DEDUCTIONS */}
              {result.postTaxDeds.length > 0 && (
                <>
                  <div className="pc-stub-section-title">Post-Tax Deductions</div>
                  <div className="pc-stub-table">
                    {result.postTaxDeds.map((d, i) => (
                      <div key={i} className="pc-stub-row">
                        <span>{d.name || 'Deduction'}</span><span></span><span></span><span>- ${fmt(d.amt)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TOTALS */}
              <div className="pc-stub-totals">
                <div className="pc-stub-total-row">
                  <span>Gross Pay</span><span>${fmt(result.grossPay)}</span>
                </div>
                <div className="pc-stub-total-row">
                  <span>Total Deductions & Taxes</span>
                  <span>- ${fmt(result.preTaxTotal + result.federalTax + result.ssTax + result.medTax + result.stateTax + result.postTaxTotal)}</span>
                </div>
                <div className="pc-stub-total-row pc-stub-net">
                  <span>Net Pay</span><span>${fmt(result.netPay)}</span>
                </div>
              </div>

              {/* STUB NOTE */}
              <div className="pc-stub-footer">
                Pay stub generated using standard IRS and state withholding tables. Verify rates annually. · tools.caresmn.com
              </div>
            </div>

            {/* NEXT STEPS */}
            <div className="pc-next-steps">
              <div className="pc-next-title">What to do with these numbers</div>
              <div className="pc-next-grid">
                <div className="pc-next-card">
                  <div className="pc-next-icon">🏦</div>
                  <div className="pc-next-head">Pay the employee</div>
                  <div className="pc-next-body">Issue the check or ACH transfer for the net pay amount. Keep a copy of this stub in your records.</div>
                </div>
                <div className="pc-next-card">
                  <div className="pc-next-icon">🧾</div>
                  <div className="pc-next-head">Federal taxes</div>
                  <div className="pc-next-body">Deposit federal withholding + employer FICA match via EFTPS. Frequency depends on your deposit schedule (monthly or semi-weekly).</div>
                </div>
                <div className="pc-next-card">
                  <div className="pc-next-icon">🗂️</div>
                  <div className="pc-next-head">State taxes</div>
                  <div className="pc-next-body">Remit state withholding to your state revenue department per their deposit schedule. Most states have an online portal.</div>
                </div>
                <div className="pc-next-card">
                  <div className="pc-next-icon">✅</div>
                  <div className="pc-next-head">Run the checklist</div>
                  <div className="pc-next-body">
                    <button className="pc-next-link" onClick={() => navigate('/tools/payroll-checklist')}>Open the Payroll Checklist →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MEMBER UPSELL */}
      <div className="pc-upsell">
        <div className="pc-upsell-inner">
          <div>
            <div className="pc-upsell-eyebrow">Upgrade Your Account</div>
            <h3 className="pc-upsell-title">Auto state withholding. Saved employees. Paycheck history.</h3>
            <p className="pc-upsell-desc">Members can request auto state withholding customization for their state — no more looking up tables. Plus saved employee profiles, paycheck history, and YTD withholding tracking. Message Ask Kari to get started.</p>
          </div>
          <div className="pc-upsell-ctas">
            <a href={MONTHLY_URL} className="pc-upsell-btn-primary">Join for $27/month</a>
            <a href={ANNUAL_URL}  className="pc-upsell-btn-gold">$270/year — save 2 months</a>
          </div>
        </div>
      </div>

      <footer className="pc-footer">
        <div>© 2026 CARES Consulting Inc. · <a href="https://caresmn.com" className="pc-footer-link">caresmn.com</a></div>
        <a href="https://karikounkel.store" className="pc-footer-link">Full Store at karikounkel.store →</a>
      </footer>
    </div>
  );
}

// =============================================================================
// STYLES
// =============================================================================

function PCStyles() {
  const css =
    '.pc-page { font-family: var(--pc-font); background: #ffffff; color: #0a0a14; min-height: 100vh; }' +
    '.pc-page * { box-sizing: border-box; margin: 0; padding: 0; }' +
    ".pc-page { --pc-navy: #0a0a14; --pc-navy2: #0052cc; --pc-gold: #ff8a2a; --pc-gold2: #ffc499; --pc-orange: #0080ff; --pc-cream: #ffffff; --pc-rule: #e2e8f0; --pc-muted: #64748b; --pc-ink: #0a0a14; --pc-font: 'DM Sans', sans-serif; }" +

    // Header
    '.pc-header { background: #fff; border-bottom: 1px solid var(--pc-rule); padding: 18px 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }' +
    ".pc-brand { font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; color: var(--pc-ink); text-decoration: none; }" +
    '.pc-brand-accent { color: var(--pc-orange); }' +
    '.pc-nav { display: flex; align-items: center; gap: 16px; }' +
    '.pc-nav-link { background: transparent; border: none; font-family: var(--pc-font); font-size: 13px; font-weight: 500; color: var(--pc-muted); cursor: pointer; padding: 0; transition: color .15s; }' +
    '.pc-nav-link:hover { color: var(--pc-navy); }' +

    // Hero
    '.pc-hero { background: #f7f9fc; border-bottom: 1px solid var(--pc-rule); padding: 44px 40px 32px; }' +
    '.pc-hero-inner { max-width: 860px; margin: 0 auto; }' +
    ".pc-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--pc-gold); margin-bottom: 10px; }" +
    ".pc-h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 40px; line-height: 1.1; color: var(--pc-navy); margin-bottom: 8px; }" +
    '.pc-accent { font-style: italic; color: var(--pc-gold); }' +
    ".pc-tagline { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 16px; color: var(--pc-gold); margin-bottom: 12px; }" +
    '.pc-hero-desc { font-size: 15px; color: var(--pc-muted); max-width: 600px; line-height: 1.6; }' +

    // Disclaimer
    '.pc-disclaimer { background: #fff3e8; border-bottom: 1px solid #ffe4cc; padding: 14px 40px; font-size: 13px; color: #9a3412; line-height: 1.55; }' +

    // Main
    '.pc-main { max-width: 860px; margin: 0 auto; padding: 36px 24px 80px; }' +

    // Sections
    '.pc-section { background: #fff; border: 1.5px solid var(--pc-rule); border-radius: 12px; padding: 24px; margin-bottom: 20px; }' +
    ".pc-section-label { font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--pc-gold); margin-bottom: 16px; padding-bottom: 10px; border-bottom: 1px solid var(--pc-rule); }" +
    '.pc-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px; }' +
    '.pc-row:last-child { margin-bottom: 0; }' +
    '.pc-field { display: flex; flex-direction: column; gap: 5px; }' +
    '.pc-label { font-size: 12px; font-weight: 500; color: var(--pc-muted); }' +
    ".pc-opt { font-size: 11px; font-weight: 400; font-style: italic; }" +
    '.pc-input { padding: 10px 12px; border: 1.5px solid var(--pc-rule); border-radius: 8px; font-family: var(--pc-font); font-size: 14px; color: var(--pc-ink); background: #fff; transition: border-color .15s; width: 100%; -webkit-appearance: none; }' +
    '.pc-input:focus { outline: none; border-color: var(--pc-navy); box-shadow: 0 0 0 3px rgba(10,10,20,.06); }' +
    '.pc-calc-display { padding: 10px 12px; background: #f4f4f8; border-radius: 8px; font-size: 15px; font-weight: 600; color: var(--pc-navy); border: 1.5px solid var(--pc-rule); }' +

    // State note & manual state
    '.pc-state-note { margin-top: 12px; padding: 10px 14px; background: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 4px; font-size: 13px; color: #1a3a2a; line-height: 1.5; }' +
    '.pc-manual-state { margin-top: 14px; background: #e6f0ff; border: 1.5px solid #b3d9ff; border-radius: 10px; padding: 18px 20px; }' +
    '.pc-manual-state-head { font-size: 13px; font-weight: 600; color: var(--pc-navy); margin-bottom: 6px; }' +
    '.pc-manual-state-desc { font-size: 13px; color: var(--pc-muted); line-height: 1.55; margin-bottom: 12px; }' +
    '.pc-state-link { display: inline-block; font-size: 13px; font-weight: 600; color: var(--pc-orange); text-decoration: none; margin-bottom: 14px; }' +
    '.pc-state-link:hover { text-decoration: underline; }' +
    '.pc-manual-entry { display: flex; flex-direction: column; gap: 5px; max-width: 280px; }' +
    '.pc-manual-input { border-color: #b3d9ff; }' +

    // Deductions
    '.pc-ded-row { display: grid; grid-template-columns: 1fr 120px 120px 36px; gap: 10px; margin-bottom: 10px; align-items: center; }' +
    '.pc-ded-remove { background: transparent; border: none; font-size: 18px; color: var(--pc-muted); cursor: pointer; padding: 0; line-height: 1; transition: color .15s; }' +
    '.pc-ded-remove:hover { color: #ef4444; }' +
    ".pc-add-ded { font-family: var(--pc-font); font-size: 13px; color: var(--pc-orange); background: transparent; border: 1px dashed var(--pc-orange); padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 4px; }" +
    '.pc-add-ded:hover { background: #e6f0ff; }' +

    // Actions
    '.pc-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }' +
    '.pc-btn-primary { padding: 13px 28px; background: var(--pc-navy); color: #fff; border: none; border-radius: 9px; font-family: var(--pc-font); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s; }' +
    '.pc-btn-primary:hover { background: var(--pc-navy2); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(10,10,20,.2); }' +
    '.pc-btn-secondary { padding: 13px 22px; background: transparent; color: var(--pc-navy); border: 1.5px solid var(--pc-rule); border-radius: 9px; font-family: var(--pc-font); font-size: 14px; font-weight: 500; cursor: pointer; transition: all .18s; }' +
    '.pc-btn-secondary:hover { border-color: var(--pc-navy); background: #f4f4f8; }' +
    '.pc-btn-ghost { padding: 13px 18px; background: transparent; color: var(--pc-muted); border: 1.5px solid var(--pc-rule); border-radius: 9px; font-family: var(--pc-font); font-size: 14px; cursor: pointer; }' +
    '.pc-btn-ghost:hover { color: var(--pc-ink); border-color: var(--pc-muted); }' +

    // Stub wrapper
    '.pc-stub-wrapper { margin-top: 8px; }' +
    '.pc-stub-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }' +
    ".pc-stub-heading { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: var(--pc-navy); }" +

    // Pay stub
    '.pc-stub { background: #fff; border: 2px solid var(--pc-navy); border-radius: 10px; padding: 32px; margin-bottom: 28px; }' +
    '.pc-stub-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid var(--pc-navy); margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }' +
    ".pc-stub-company { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: var(--pc-navy); margin-bottom: 4px; }" +
    '.pc-stub-empname { font-size: 15px; font-weight: 600; color: var(--pc-ink); }' +
    '.pc-stub-meta { text-align: right; }' +
    '.pc-stub-meta-row { display: flex; gap: 12px; justify-content: flex-end; font-size: 12px; margin-bottom: 3px; color: var(--pc-muted); }' +
    '.pc-stub-meta-row strong { color: var(--pc-ink); }' +
    ".pc-stub-section-title { font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--pc-navy); border-bottom: 1px solid var(--pc-navy); padding-bottom: 6px; margin: 18px 0 10px; }" +
    '.pc-stub-table { margin-bottom: 4px; }' +
    '.pc-stub-row { display: grid; grid-template-columns: 2fr 80px 100px 100px; font-size: 13px; padding: 5px 0; border-bottom: 1px solid var(--pc-rule); color: var(--pc-ink); }' +
    '.pc-stub-row span:not(:first-child) { text-align: right; }' +
    ".pc-stub-thead { font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--pc-muted); border-bottom: 1px solid var(--pc-muted); }" +
    '.pc-stub-subtotal { font-weight: 600; border-top: 1px solid var(--pc-navy); border-bottom: none; margin-top: 4px; color: var(--pc-navy); }' +
    '.pc-stub-zero { color: var(--pc-muted); font-style: italic; }' +
    '.pc-stub-totals { border-top: 2px solid var(--pc-navy); margin-top: 16px; padding-top: 12px; }' +
    '.pc-stub-total-row { display: flex; justify-content: space-between; font-size: 14px; padding: 5px 0; color: var(--pc-ink); }' +
    '.pc-stub-net { font-size: 18px; font-weight: 700; color: var(--pc-navy); border-top: 1px solid var(--pc-rule); padding-top: 10px; margin-top: 4px; }' +
    '.pc-stub-note { margin-top: 14px; padding: 10px 14px; background: #fff3e8; border-left: 3px solid var(--pc-gold); border-radius: 4px; font-size: 12px; color: #9a3412; line-height: 1.5; }' +
    ".pc-stub-footer { margin-top: 20px; padding-top: 12px; border-top: 1px dashed var(--pc-rule); font-size: 10px; color: var(--pc-muted); text-align: center; font-family: 'DM Mono', monospace; letter-spacing: .04em; }" +

    // Next steps
    '.pc-next-steps { background: #fff; border: 1.5px solid var(--pc-rule); border-radius: 12px; padding: 28px; }' +
    ".pc-next-title { font-family: 'Playfair Display', Georgia, serif; font-size: 20px; color: var(--pc-navy); margin-bottom: 20px; }" +
    '.pc-next-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }' +
    '.pc-next-card { background: #f8f8fc; border-radius: 10px; padding: 18px 16px; }' +
    '.pc-next-icon { font-size: 22px; margin-bottom: 8px; }' +
    '.pc-next-head { font-size: 13px; font-weight: 600; color: var(--pc-navy); margin-bottom: 6px; }' +
    '.pc-next-body { font-size: 12px; color: var(--pc-muted); line-height: 1.55; }' +
    '.pc-next-link { background: transparent; border: none; font-family: var(--pc-font); font-size: 13px; font-weight: 600; color: var(--pc-orange); cursor: pointer; padding: 0; text-decoration: underline; }' +

    // Member upsell strip
    '.pc-upsell { background: #0a0a14; padding: 48px 40px; }' +
    '.pc-upsell-inner { max-width: 860px; margin: 0 auto; display: flex; gap: 40px; align-items: flex-start; flex-wrap: wrap; }' +
    ".pc-upsell-eyebrow { font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--pc-gold); margin-bottom: 8px; }" +
    ".pc-upsell-title { font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #fff; line-height: 1.25; margin-bottom: 10px; flex: 1; min-width: 260px; }" +
    '.pc-upsell-desc { font-size: 14px; color: rgba(255,255,255,.6); line-height: 1.6; }' +
    '.pc-upsell-ctas { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; min-width: 200px; }' +
    ".pc-upsell-btn-primary { display: block; text-align: center; background: var(--pc-orange); color: #fff; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; padding: 13px 22px; border-radius: 7px; text-decoration: none; font-weight: 700; }" +
    ".pc-upsell-btn-gold { display: block; text-align: center; background: linear-gradient(135deg,#ff8a2a,#f06d0a); color: #0a0a14; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; padding: 13px 22px; border-radius: 7px; text-decoration: none; font-weight: 700; }" +

    // Footer
    '.pc-footer { border-top: 1px solid var(--pc-rule); padding: 22px 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }' +
    ".pc-footer { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--pc-muted); letter-spacing: .06em; }" +
    '.pc-footer-link { color: var(--pc-muted); text-decoration: underline; }' +
    '.pc-footer-link:hover { color: var(--pc-navy); }' +

    // Print
    '@media print {' +
    '.pc-header, .pc-hero, .pc-disclaimer, .pc-section, .pc-actions, .pc-stub-actions, .pc-next-steps, .pc-footer { display: none !important; }' +
    '.pc-stub-wrapper { margin-top: 0; }' +
    '.pc-stub { border: 1px solid #ccc; box-shadow: none; }' +
    'body, .pc-page { background: #fff; }' +
    '}' +

    // Responsive
    '@media (max-width: 600px) {' +
    '.pc-header { padding: 16px 20px; }' +
    '.pc-hero { padding: 32px 20px 24px; }' +
    '.pc-h1 { font-size: 28px; }' +
    '.pc-disclaimer { padding: 12px 20px; }' +
    '.pc-main { padding: 24px 16px 60px; }' +
    '.pc-ded-row { grid-template-columns: 1fr 90px 36px; }' +
    '.pc-ded-type { display: none; }' +
    '.pc-stub-row { grid-template-columns: 1fr 80px; }' +
    '.pc-stub-row span:nth-child(2), .pc-stub-row span:nth-child(3) { display: none; }' +
    '.pc-footer { padding: 18px 20px; flex-direction: column; gap: 6px; }' +
    '}';

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
