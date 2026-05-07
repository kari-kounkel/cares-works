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
// TAX DATA
// =============================================================================

// 2024 Federal Percentage Method (IRS Pub 15-T) — verify annually
// Standard withholding amounts subtracted before applying brackets
const FED_STD = { S: 14600, MFJ: 29200, HOH: 21900, MFS: 14600 };

// Annualized federal brackets [ceiling, rate, base_tax_at_ceiling_of_prev_bracket]
// Format: [min, rate, base] — base is cumulative tax owed at the start of this bracket
const FED_BRACKETS = {
  S: [
    [0,       0.10, 0],
    [11600,   0.12, 1160],
    [47150,   0.22, 5426],
    [100525,  0.24, 17168.50],
    [191950,  0.32, 39110.50],
    [243725,  0.35, 55678.50],
    [609350,  0.37, 183647.25],
    [Infinity,0.37, 183647.25],
  ],
  MFJ: [
    [0,       0.10, 0],
    [23200,   0.12, 2320],
    [94300,   0.22, 10852],
    [201050,  0.24, 34337],
    [383900,  0.32, 78221],
    [487450,  0.35, 111108],
    [731200,  0.37, 196669.50],
    [Infinity,0.37, 196669.50],
  ],
  HOH: [
    [0,       0.10, 0],
    [16550,   0.12, 1655],
    [63100,   0.22, 7241],
    [100500,  0.24, 15469],
    [191950,  0.32, 37461],
    [243700,  0.35, 54013],
    [609350,  0.37, 181954.50],
    [Infinity,0.37, 181954.50],
  ],
  MFS: [
    [0,       0.10, 0],
    [11600,   0.12, 1160],
    [47150,   0.22, 5426],
    [100525,  0.24, 17168.50],
    [191950,  0.32, 39110.50],
    [243725,  0.35, 55678.50],
    [609350,  0.37, 183647.25],
    [Infinity,0.37, 183647.25],
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
// STATE TAX DATA
// type: 'none' | 'flat' | 'bracket'
// For brackets: { S: [[min,rate,base],...], MFJ: [...] }
// stdDed: standard deduction used before applying brackets
// =============================================================================

const STATES = {
  AL: { name: 'Alabama',              type: 'bracket',
        S:   [[0,0.02,0],[500,0.04,10],[3000,0.05,110],[Infinity,0.05,110]],
        MFJ: [[0,0.02,0],[1000,0.04,20],[6000,0.05,220],[Infinity,0.05,220]],
        stdDed: { S: 2500, MFJ: 7500 } },
  AK: { name: 'Alaska',               type: 'none' },
  AZ: { name: 'Arizona',              type: 'flat', rate: 0.025 },
  AR: { name: 'Arkansas',             type: 'bracket',
        S:   [[0,0.02,0],[4299,0.04,86],[8399,0.044,250],[Infinity,0.044,250]],
        MFJ: [[0,0.02,0],[4299,0.04,86],[8399,0.044,250],[Infinity,0.044,250]],
        stdDed: { S: 2200, MFJ: 4400 } },
  CA: { name: 'California',           type: 'bracket',
        S:   [[0,0.01,0],[10756,0.02,107.56],[25499,0.04,402.42],[40245,0.06,992.26],[55866,0.08,1929.52],[70606,0.093,3107.74],[360659,0.103,29999.97],[432787,0.113,37426.00],[721314,0.123,70060.00],[Infinity,0.123,70060]],
        MFJ: [[0,0.01,0],[21512,0.02,215.12],[50998,0.04,804.84],[80490,0.06,1984.52],[111732,0.08,3859.04],[141212,0.093,6215.48],[721318,0.103,59998],[865574,0.113,74850],[1000000,0.123,90118],[Infinity,0.123,90118]],
        stdDed: { S: 5202, MFJ: 10404 } },
  CO: { name: 'Colorado',             type: 'flat', rate: 0.044 },
  CT: { name: 'Connecticut',          type: 'bracket',
        S:   [[0,0.03,0],[10000,0.05,300],[50000,0.055,2300],[100000,0.06,5050],[200000,0.065,11050],[250000,0.069,14300],[500000,0.0699,31550],[Infinity,0.0699,31550]],
        MFJ: [[0,0.03,0],[20000,0.05,600],[100000,0.055,4600],[200000,0.06,10100],[400000,0.065,22100],[500000,0.069,28600],[1000000,0.0699,63100],[Infinity,0.0699,63100]],
        stdDed: { S: 0, MFJ: 0 } },
  DE: { name: 'Delaware',             type: 'bracket',
        S:   [[0,0,0],[2000,0.022,0],[5000,0.039,66],[10000,0.048,261],[20000,0.052,741],[25000,0.0555,1001],[60000,0.066,2943],[Infinity,0.066,2943]],
        MFJ: [[0,0,0],[2000,0.022,0],[5000,0.039,66],[10000,0.048,261],[20000,0.052,741],[25000,0.0555,1001],[60000,0.066,2943],[Infinity,0.066,2943]],
        stdDed: { S: 3250, MFJ: 6500 } },
  FL: { name: 'Florida',              type: 'none' },
  GA: { name: 'Georgia',              type: 'flat', rate: 0.0549 },
  HI: { name: 'Hawaii',               type: 'bracket',
        S:   [[0,0.014,0],[2400,0.032,33.6],[4800,0.055,110.4],[9600,0.064,374.4],[14400,0.068,681.6],[19200,0.072,1008],[24000,0.076,1353.6],[36000,0.079,2265.6],[48000,0.083,3213.6],[150000,0.09,11679.6],[175000,0.1,13929.6],[200000,0.11,16429.6],[Infinity,0.11,16429.6]],
        MFJ: [[0,0.014,0],[4800,0.032,67.2],[9600,0.055,220.8],[19200,0.064,748.8],[28800,0.068,1363.2],[38400,0.072,2016],[48000,0.076,2707.2],[72000,0.079,4531.2],[96000,0.083,6427.2],[300000,0.09,23359.2],[350000,0.1,27859.2],[400000,0.11,32859.2],[Infinity,0.11,32859.2]],
        stdDed: { S: 2200, MFJ: 4400 } },
  ID: { name: 'Idaho',                type: 'flat', rate: 0.058 },
  IL: { name: 'Illinois',             type: 'flat', rate: 0.0495 },
  IN: { name: 'Indiana',              type: 'flat', rate: 0.0305 },
  IA: { name: 'Iowa',                 type: 'flat', rate: 0.038 },
  KS: { name: 'Kansas',               type: 'bracket',
        S:   [[0,0.031,0],[15000,0.057,465],[Infinity,0.057,465]],
        MFJ: [[0,0.031,0],[30000,0.057,930],[Infinity,0.057,930]],
        stdDed: { S: 3500, MFJ: 8000 } },
  KY: { name: 'Kentucky',             type: 'flat', rate: 0.04 },
  LA: { name: 'Louisiana',            type: 'bracket',
        S:   [[0,0.0185,0],[12500,0.035,231.25],[50000,0.0425,1543.75],[Infinity,0.0425,1543.75]],
        MFJ: [[0,0.0185,0],[25000,0.035,462.5],[100000,0.0425,3087.5],[Infinity,0.0425,3087.5]],
        stdDed: { S: 4500, MFJ: 9000 } },
  ME: { name: 'Maine',                type: 'bracket',
        S:   [[0,0.058,0],[24500,0.0675,1421],[58050,0.0715,3684.13],[Infinity,0.0715,3684.13]],
        MFJ: [[0,0.058,0],[49050,0.0675,2844.9],[116100,0.0715,7369.73],[Infinity,0.0715,7369.73]],
        stdDed: { S: 14600, MFJ: 29200 } },
  MD: { name: 'Maryland',             type: 'bracket',
        S:   [[0,0.02,0],[1000,0.03,20],[2000,0.04,50],[3000,0.0475,90],[100000,0.05,4702.5],[125000,0.0525,5952.5],[150000,0.055,7265],[250000,0.0575,12765],[Infinity,0.0575,12765]],
        MFJ: [[0,0.02,0],[1000,0.03,20],[2000,0.04,50],[3000,0.0475,90],[150000,0.05,7027.5],[175000,0.0525,8277.5],[225000,0.055,10902.5],[300000,0.0575,14027.5],[Infinity,0.0575,14027.5]],
        stdDed: { S: 2350, MFJ: 4700 } },
  MA: { name: 'Massachusetts',        type: 'flat', rate: 0.05 },
  MI: { name: 'Michigan',             type: 'flat', rate: 0.0425 },
  MN: { name: 'Minnesota',            type: 'bracket',
        S:   [[0,0.0535,0],[31690,0.068,1695.42],[104090,0.0785,6619.34],[193240,0.0985,13620.19],[Infinity,0.0985,13620.19]],
        MFJ: [[0,0.0535,0],[46330,0.068,2478.66],[184040,0.0785,9844.92],[321450,0.0985,20633.62],[Infinity,0.0985,20633.62]],
        stdDed: { S: 14575, MFJ: 29150 },
        note: 'Standard MN withholding only. Contact CARES Works for additional MN tax customization.' },
  MS: { name: 'Mississippi',          type: 'flat', rate: 0.047 },
  MO: { name: 'Missouri',             type: 'bracket',
        S:   [[0,0,0],[1207,0.015,0],[2414,0.02,18.11],[3622,0.025,42.25],[4829,0.03,72.45],[5763,0.035,108.46],[6919,0.04,148.92],[8111,0.045,196.55],[9322,0.05,251.05],[Infinity,0.054,311.60]],
        MFJ: [[0,0,0],[1207,0.015,0],[2414,0.02,18.11],[3622,0.025,42.25],[4829,0.03,72.45],[5763,0.035,108.46],[6919,0.04,148.92],[8111,0.045,196.55],[9322,0.05,251.05],[Infinity,0.054,311.60]],
        stdDed: { S: 21400, MFJ: 24800 } },
  MT: { name: 'Montana',              type: 'flat', rate: 0.059 },
  NE: { name: 'Nebraska',             type: 'bracket',
        S:   [[0,0.0246,0],[3700,0.0351,91.02],[22170,0.0501,739.73],[33180,0.0664,1291.77],[Infinity,0.0664,1291.77]],
        MFJ: [[0,0.0246,0],[7380,0.0351,181.49],[44340,0.0501,1479.64],[66360,0.0664,2583.54],[Infinity,0.0664,2583.54]],
        stdDed: { S: 7900, MFJ: 15800 } },
  NV: { name: 'Nevada',               type: 'none' },
  NH: { name: 'New Hampshire',        type: 'none' },
  NJ: { name: 'New Jersey',           type: 'bracket',
        S:   [[0,0.014,0],[20000,0.0175,280],[35000,0.035,542.5],[40000,0.05525,717.5],[75000,0.0637,2451],[500000,0.0897,29539],[Infinity,0.1075,38441.6]],
        MFJ: [[0,0.014,0],[20000,0.0175,280],[50000,0.0245,805],[70000,0.035,1295],[80000,0.05525,1645],[150000,0.0637,5512.5],[500000,0.0897,27807.5],[Infinity,0.1075,39107.8]],
        stdDed: { S: 1000, MFJ: 2000 } },
  NM: { name: 'New Mexico',           type: 'bracket',
        S:   [[0,0.017,0],[5500,0.032,93.5],[11000,0.047,269.5],[16000,0.049,504.5],[210000,0.059,10011.5],[Infinity,0.059,10011.5]],
        MFJ: [[0,0.017,0],[8000,0.032,136],[16000,0.047,392],[24000,0.049,768],[315000,0.059,15013.5],[Infinity,0.059,15013.5]],
        stdDed: { S: 14600, MFJ: 29200 } },
  NY: { name: 'New York',             type: 'bracket',
        S:   [[0,0.04,0],[8500,0.045,340],[11700,0.0525,484],[13900,0.0585,599.5],[80650,0.0625,4501.73],[215400,0.0685,12932.73],[1077550,0.0965,71996.05],[5000000,0.103,449845.78],[Infinity,0.109,449845.78]],
        MFJ: [[0,0.04,0],[17150,0.045,686],[23600,0.0525,976.25],[27900,0.0585,1201.75],[161550,0.0625,9018.73],[323200,0.0685,19111.86],[2155350,0.0965,144572.01],[5000000,0.103,419212.43],[Infinity,0.109,419212.43]],
        stdDed: { S: 8000, MFJ: 16050 } },
  NC: { name: 'North Carolina',       type: 'flat', rate: 0.045 },
  ND: { name: 'North Dakota',         type: 'bracket',
        S:   [[0,0.011,0],[44725,0.204,491.98],[225975,0.0227,36971.46],[Infinity,0.0227,36971.46]],
        MFJ: [[0,0.011,0],[74750,0.204,822.25],[275925,0.0227,41781.85],[Infinity,0.0227,41781.85]],
        stdDed: { S: 14600, MFJ: 29200 } },
  OH: { name: 'Ohio',                 type: 'bracket',
        S:   [[0,0,0],[26050,0.02765,0],[100000,0.03226,2044.62],[115300,0.03688,4428.95],[Infinity,0.04],[Infinity,0.04,5032.86]],
        MFJ: [[0,0,0],[26050,0.02765,0],[100000,0.03226,2044.62],[115300,0.03688,4428.95],[Infinity,0.04,5032.86]],
        stdDed: { S: 0, MFJ: 0 } },
  OK: { name: 'Oklahoma',             type: 'bracket',
        S:   [[0,0.0025,0],[1000,0.0075,2.5],[2500,0.0175,13.75],[3750,0.0275,35.63],[4900,0.0375,67.25],[7200,0.0475,153.5],[Infinity,0.0475,153.5]],
        MFJ: [[0,0.0025,0],[2000,0.0075,5],[5000,0.0175,27.5],[7500,0.0275,71.25],[9800,0.0375,134.5],[12200,0.0475,224.5],[Infinity,0.0475,224.5]],
        stdDed: { S: 6350, MFJ: 12700 } },
  OR: { name: 'Oregon',               type: 'bracket',
        S:   [[0,0.0475,0],[10000,0.0675,475],[125000,0.0875,8200],[Infinity,0.099,18262.5]],
        MFJ: [[0,0.0475,0],[18400,0.0675,874],[250000,0.0875,16504],[Infinity,0.099,36629]],
        stdDed: { S: 2420, MFJ: 4840 } },
  PA: { name: 'Pennsylvania',         type: 'flat', rate: 0.0307 },
  RI: { name: 'Rhode Island',         type: 'bracket',
        S:   [[0,0.0375,0],[77450,0.0475,2904.38],[176050,0.0599,7587.75],[Infinity,0.0599,7587.75]],
        MFJ: [[0,0.0375,0],[77450,0.0475,2904.38],[176050,0.0599,7587.75],[Infinity,0.0599,7587.75]],
        stdDed: { S: 9500, MFJ: 19000 } },
  SC: { name: 'South Carolina',       type: 'flat', rate: 0.064 },
  SD: { name: 'South Dakota',         type: 'none' },
  TN: { name: 'Tennessee',            type: 'none' },
  TX: { name: 'Texas',                type: 'none' },
  UT: { name: 'Utah',                 type: 'flat', rate: 0.0455 },
  VT: { name: 'Vermont',              type: 'bracket',
        S:   [[0,0.0335,0],[45400,0.066,1520.9],[110650,0.076,4825.9],[229550,0.0875,13855.5],[Infinity,0.0875,13855.5]],
        MFJ: [[0,0.0335,0],[75850,0.066,2540.98],[183400,0.076,9640.98],[279450,0.0875,16937.68],[Infinity,0.0875,16937.68]],
        stdDed: { S: 14600, MFJ: 29200 } },
  VA: { name: 'Virginia',             type: 'bracket',
        S:   [[0,0.02,0],[3000,0.03,60],[5000,0.05,120],[17000,0.0575,720],[Infinity,0.0575,720]],
        MFJ: [[0,0.02,0],[3000,0.03,60],[5000,0.05,120],[17000,0.0575,720],[Infinity,0.0575,720]],
        stdDed: { S: 4500, MFJ: 9000 } },
  WA: { name: 'Washington',           type: 'none' },
  WV: { name: 'West Virginia',        type: 'bracket',
        S:   [[0,0.0236,0],[10000,0.0315,236],[25000,0.0354,708.5],[40000,0.0472,1239.5],[60000,0.0512,2183.5],[Infinity,0.0512,2183.5]],
        MFJ: [[0,0.0236,0],[10000,0.0315,236],[25000,0.0354,708.5],[40000,0.0472,1239.5],[60000,0.0512,2183.5],[Infinity,0.0512,2183.5]],
        stdDed: { S: 0, MFJ: 0 } },
  WI: { name: 'Wisconsin',            type: 'bracket',
        S:   [[0,0.035,0],[13810,0.044,483.35],[27630,0.053,1091.63],[304170,0.0765,15731.63],[Infinity,0.0765,15731.63]],
        MFJ: [[0,0.035,0],[18420,0.044,644.7],[36830,0.053,1455.14],[405550,0.0765,20976.85],[Infinity,0.0765,20976.85]],
        stdDed: { S: 11930, MFJ: 21820 } },
  WY: { name: 'Wyoming',              type: 'none' },
  DC: { name: 'Washington DC',        type: 'bracket',
        S:   [[0,0.04,0],[10000,0.06,400],[40000,0.065,2200],[60000,0.085,3500],[350000,0.0925,28150],[1000000,0.0975,88287.5],[Infinity,0.1075,88287.5]],
        MFJ: [[0,0.04,0],[10000,0.06,400],[40000,0.065,2200],[60000,0.085,3500],[350000,0.0925,28150],[1000000,0.0975,88287.5],[Infinity,0.1075,88287.5]],
        stdDed: { S: 0, MFJ: 0 } },
};

function calcStateWithholding(annualTaxableIncome, stateCode, filingStatus) {
  const st = STATES[stateCode];
  if (!st || st.type === 'none') return 0;
  if (st.type === 'flat') return Math.max(0, annualTaxableIncome * st.rate);
  const stdDed = st.stdDed ? (filingStatus === 'MFJ' ? st.stdDed.MFJ : st.stdDed.S) : 0;
  const taxable = Math.max(0, annualTaxableIncome - stdDed);
  const brackets = filingStatus === 'MFJ' ? st.MFJ : st.S;
  if (!brackets) return 0;
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
// GATE
// =============================================================================
const S = {
  navy: '#1a2744', navy2: '#243260', gold: '#c9a84c', gold2: '#e8c97a',
  cream: '#faf8f4', orange: '#e8773a', muted: '#7a7585', ink: '#1e1e2a',
  rule: '#e8e8ec', white: '#ffffff', green: '#1a7a4a',
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
  const [loading, setLoading]   = useState(true);

  // Company
  const [companyName, setCompanyName] = useState('');

  // Employee
  const [empName,   setEmpName]   = useState('');
  const [payType,   setPayType]   = useState('hourly');    // hourly | salary
  const [rate,      setRate]      = useState('');
  const [hours,     setHours]     = useState('');
  const [otHours,   setOtHours]   = useState('');
  const [annualSal, setAnnualSal] = useState('');
  const [payPeriod, setPayPeriod] = useState('Biweekly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd,   setPeriodEnd]   = useState('');
  const [checkNum,    setCheckNum]    = useState('');

  // Tax
  const [filingStatus, setFilingStatus] = useState('S');
  const [addlFed,      setAddlFed]      = useState('');
  const [stateCode,    setStateCode]    = useState('MN');

  // Deductions
  const [deductions, setDeductions] = useState([blankDed()]);

  // Output
  const [result,     setResult]     = useState(null);
  const [showStub,   setShowStub]   = useState(false);

  useEffect(() => {
    async function check() {
      if (!session) { setLoading(false); return; }
      try {
        const { data } = await supabase.from('profiles').select('is_member').eq('id', session.user.id).maybeSingle();
        setIsMember(!!(data && data.is_member));
      } catch { setIsMember(false); }
      setLoading(false);
    }
    check();
  }, [session]);

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: S.muted }}>Loading…</div>;
  if (!isMember) return <Gate />;

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

    const addlFedAmt = parseFloat(addlFed) || 0;
    const federalTax = calcFederalWithholding(grossPay, filingStatus, preTaxTotal, addlFedAmt, payPeriod);

    const ficaWage = grossPay - preTaxTotal;
    const ssTax    = Math.max(0, ficaWage * 0.062);
    const medTax   = Math.max(0, ficaWage * 0.0145);

    const annualTaxable = (grossPay - preTaxTotal) * periods;
    const annualStateTax = calcStateWithholding(annualTaxable, stateCode, filingStatus);
    const stateTax = annualStateTax / periods;

    const stateInfo = STATES[stateCode] || {};

    const totalWithholding = federalTax + ssTax + medTax + stateTax + postTaxTotal;
    const netPay = grossPay - preTaxTotal - federalTax - ssTax - medTax - stateTax - postTaxTotal;

    setResult({
      regularPay, otPay, grossPay,
      preTaxDeds: deds.filter(d => d.type === 'pretax'),
      postTaxDeds: deds.filter(d => d.type === 'posttax'),
      preTaxTotal, postTaxTotal,
      federalTax, ssTax, medTax, stateTax,
      stateNote: stateInfo.note || null,
      stateName: stateInfo.name || stateCode,
      totalWithholding, netPay,
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

  const stateList = Object.entries(STATES).sort((a, b) => a[1].name.localeCompare(b[1].name));

  return (
    <div className="pc-page">
      <PCStyles />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="pc-header">
        <a href="/" className="pc-brand">CARES <span className="pc-brand-accent">Works.</span></a>
        <nav className="pc-nav">
          <button className="pc-nav-link" onClick={() => navigate('/tools/payroll-checklist')}>Payroll Checklist</button>
          <button className="pc-nav-link" onClick={() => navigate('/dashboard')}>Dashboard</button>
        </nav>
      </header>

      {/* HERO */}
      <div className="pc-hero">
        <div className="pc-hero-inner">
          <div className="pc-eyebrow">CARES Works · Member Tool</div>
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
              <select className="pc-input" value={stateCode} onChange={e => setStateCode(e.target.value)}>
                {stateList.map(([code, st]) => (
                  <option key={code} value={code}>{st.name}{st.type === 'none' ? ' (no income tax)' : ''}</option>
                ))}
              </select>
            </div>
          </div>
          {STATES[stateCode] && STATES[stateCode].note && (
            <div className="pc-state-note">ℹ️ {STATES[stateCode].note}</div>
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
              {result.stateNote && (
                <div className="pc-stub-note">ℹ️ {result.stateNote}</div>
              )}
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
    '.pc-page { font-family: var(--pc-font); background: #faf8f4; color: #1e1e2a; min-height: 100vh; }' +
    '.pc-page * { box-sizing: border-box; margin: 0; padding: 0; }' +
    ".pc-page { --pc-navy: #1a2744; --pc-navy2: #243260; --pc-gold: #c9a84c; --pc-gold2: #e8c97a; --pc-orange: #e8773a; --pc-cream: #faf8f4; --pc-rule: #e8e8ec; --pc-muted: #7a7585; --pc-ink: #1e1e2a; --pc-font: 'DM Sans', sans-serif; }" +

    // Header
    '.pc-header { background: #fff; border-bottom: 1px solid var(--pc-rule); padding: 18px 40px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }' +
    ".pc-brand { font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; color: var(--pc-ink); text-decoration: none; }" +
    '.pc-brand-accent { color: var(--pc-orange); }' +
    '.pc-nav { display: flex; align-items: center; gap: 16px; }' +
    '.pc-nav-link { background: transparent; border: none; font-family: var(--pc-font); font-size: 13px; font-weight: 500; color: var(--pc-muted); cursor: pointer; padding: 0; transition: color .15s; }' +
    '.pc-nav-link:hover { color: var(--pc-navy); }' +

    // Hero
    '.pc-hero { background: #f2ede3; border-bottom: 1px solid var(--pc-rule); padding: 44px 40px 32px; }' +
    '.pc-hero-inner { max-width: 860px; margin: 0 auto; }' +
    ".pc-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--pc-gold); margin-bottom: 10px; }" +
    ".pc-h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 40px; line-height: 1.1; color: var(--pc-navy); margin-bottom: 8px; }" +
    '.pc-accent { font-style: italic; color: var(--pc-gold); }' +
    ".pc-tagline { font-family: 'Playfair Display', Georgia, serif; font-style: italic; font-size: 16px; color: var(--pc-gold); margin-bottom: 12px; }" +
    '.pc-hero-desc { font-size: 15px; color: var(--pc-muted); max-width: 600px; line-height: 1.6; }' +

    // Disclaimer
    '.pc-disclaimer { background: #fff8e8; border-bottom: 1px solid #f0d898; padding: 14px 40px; font-size: 13px; color: #6b4f10; line-height: 1.55; }' +

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
    '.pc-input:focus { outline: none; border-color: var(--pc-navy); box-shadow: 0 0 0 3px rgba(26,39,68,.06); }' +
    '.pc-calc-display { padding: 10px 12px; background: #f4f4f8; border-radius: 8px; font-size: 15px; font-weight: 600; color: var(--pc-navy); border: 1.5px solid var(--pc-rule); }' +

    // State note
    '.pc-state-note { margin-top: 12px; padding: 10px 14px; background: #fff8e8; border-left: 3px solid var(--pc-gold); border-radius: 4px; font-size: 13px; color: #6b4f10; line-height: 1.5; }' +

    // Deductions
    '.pc-ded-row { display: grid; grid-template-columns: 1fr 120px 120px 36px; gap: 10px; margin-bottom: 10px; align-items: center; }' +
    '.pc-ded-remove { background: transparent; border: none; font-size: 18px; color: var(--pc-muted); cursor: pointer; padding: 0; line-height: 1; transition: color .15s; }' +
    '.pc-ded-remove:hover { color: #c0392b; }' +
    ".pc-add-ded { font-family: var(--pc-font); font-size: 13px; color: var(--pc-orange); background: transparent; border: 1px dashed var(--pc-orange); padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 4px; }" +
    '.pc-add-ded:hover { background: #fdf0e8; }' +

    // Actions
    '.pc-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 40px; }' +
    '.pc-btn-primary { padding: 13px 28px; background: var(--pc-navy); color: #fff; border: none; border-radius: 9px; font-family: var(--pc-font); font-size: 14px; font-weight: 600; cursor: pointer; transition: all .18s; }' +
    '.pc-btn-primary:hover { background: var(--pc-navy2); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(26,39,68,.2); }' +
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
    '.pc-stub-note { margin-top: 14px; padding: 10px 14px; background: #fff8e8; border-left: 3px solid var(--pc-gold); border-radius: 4px; font-size: 12px; color: #6b4f10; line-height: 1.5; }' +
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
