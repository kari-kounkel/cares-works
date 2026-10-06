(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const drivers = { sarah: { name: 'Sarah M.', assignment: 'Route 12', ready: true }, mike: { name: 'Mike R.', assignment: 'Route 7', ready: true }, amanda: { name: 'Amanda T.', assignment: 'Route 31', ready: false }, tom: { name: 'Tom S.', assignment: 'Science Museum trip', ready: true } };
  const checked = new Set();
  let pending = [];
  const clearTimers = () => { pending.forEach(clearTimeout); pending = []; };
  document.querySelectorAll('[data-driver]').forEach(card => {
    card.addEventListener('click', () => {
      const driver = drivers[card.dataset.driver];
      if (checked.has(card.dataset.driver)) return;
      clearTimers();
      checked.add(card.dataset.driver);
      card.classList.add('checked');
      card.disabled = true;
      card.setAttribute('aria-label', `${driver.name} checked in at 5:31 AM. ${driver.ready ? driver.assignment + ' ready in this example.' : 'Vehicle review is still required.'}`);
      card.querySelector('.check-status').innerHTML = '✓ Checked in<small>5:31 AM</small>';
      $('checked-count').textContent = String(checked.size).padStart(2, '0');
      $('event-summary').textContent = `${driver.name} checked in at 5:31 AM. ${driver.ready ? driver.assignment + ' ready in this example.' : 'Route 31 still needs vehicle review.'}`;
      const descriptions = [driver.ready ? 'Driver present · assignment ready' : 'Driver present · vehicle hold remains', 'Work assignment linked · hours to confirm', 'Route linked · operated service to confirm'];
      ['dispatch', 'payroll', 'billing'].forEach((key, index) => {
        const node = $('flow-' + key);
        node.classList.remove('lit');
        node.querySelector('.flow-check').textContent = String(index + 1).padStart(2, '0');
        node.querySelector('.flow-description').textContent = 'Connecting assignment…';
        pending.push(setTimeout(() => { node.classList.add('lit'); node.querySelector('.flow-check').textContent = '✓'; node.querySelector('.flow-description').textContent = descriptions[index]; }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : index * 280));
      });
    });
  });
  $('reset-checkin').addEventListener('click', () => {
    clearTimers(); checked.clear(); $('checked-count').textContent = '00';
    document.querySelectorAll('[data-driver]').forEach(card => { const d = drivers[card.dataset.driver]; card.disabled = false; card.classList.remove('checked'); card.querySelector('.check-status').innerHTML = 'Check in <span aria-hidden="true">→</span>'; card.setAttribute('aria-label', `Check in ${d.name}, ${d.assignment}${d.ready ? '' : '; vehicle review still required'}`); });
    ['dispatch', 'payroll', 'billing'].forEach((key, i) => { const node = $('flow-' + key); node.classList.remove('lit'); node.querySelector('.flow-check').textContent = String(i + 1).padStart(2, '0'); node.querySelector('.flow-description').textContent = ['Waiting for check-in', 'Assignment waiting', 'Route waiting'][i]; });
    $('event-summary').textContent = 'Start with Sarah. One check-in, three places informed.';
  });

  // Fictional presentation fixtures only. These are not forecasts, rates, or a finance engine.
  const labels = ['Payroll & Taxes', 'Accounts Payable', 'Debt Service', 'Insurance', 'Fleet / Operations'];
  const explanations = [
    'Projected pay periods, employer taxes and benefits. Final hours and assumptions would be reviewed before payroll preparation.',
    'Known bills and recurring vendor commitments, placed in the months when cash is expected to leave.',
    'Scheduled vehicle, equipment and property payments. The future ledger below illustrates payments through payoff.',
    'Illustrative annual and recurring premiums, separated from AP here to avoid counting them twice.',
    'Projected fuel, registration and operating costs. These amounts are not included again in AP.'
  ];
  const detailNames = [
    ['April 7 · projected wages', 'April 21 · projected wages', 'Employer taxes & benefits'],
    ['Known vendor bills', 'Recurring vendor obligations', 'Scheduled contract payments'],
    ['Bus 23 · vehicle loan', 'Bus 18 · vehicle loan', 'Other vehicle / equipment debt', 'Property & leases'],
    ['Fleet insurance renewal', 'Liability & other premiums'],
    ['Fuel assumptions', 'Registration & licensing', 'Maintenance commitments']
  ];
  const months = Array.from({ length: 56 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 9 + i, 1));
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    let values = [204000 + (i % 4) * 2400, 139000 + (i % 3) * 3100, 70650, i % 6 === 0 ? 34000 : 22000, 23600 + (i % 5) * 800];
    let incoming = 498600 + (i % 6) * 6700;
    if (i === 18) { values = [211400, 143200, 72630, 34000, 26000]; incoming = 523800; }
    const total = values.reduce((a, b) => a + b, 0);
    return { date, label, values, incoming, total, net: incoming - total };
  });
  let selected = 0, range = 12, category = 0, chartStart = 0;
  months.forEach((m, i) => { const option = document.createElement('option'); option.value = i; option.textContent = m.label; $('cash-month').append(option); });
  function parts(index) {
    const total = months[selected].values[index];
    if (index === 0) return [Math.round(total * .405), Math.round(total * .405), total - Math.round(total * .405) * 2];
    if (index === 1) return [Math.round(total * .62), Math.round(total * .25), total - Math.round(total * .62) - Math.round(total * .25)];
    if (index === 2) return [selected <= 55 ? 2500 : 0, selected < 24 ? 2050 : 0, 41800, total - 41800 - 2500 - (selected < 24 ? 2050 : 0)];
    if (index === 3) return [Math.round(total * .8), total - Math.round(total * .8)];
    return [Math.round(total * .6), Math.round(total * .1), total - Math.round(total * .6) - Math.round(total * .1)];
  }
  function renderDetail() {
    const m = months[selected], values = parts(category);
    const names = [...detailNames[category]];
    if (category === 0) { const name = m.date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }); names[0] = `${name} 7 · projected wages`; names[1] = `${name} 21 · projected wages`; }
    $('obligation-detail').innerHTML = `<p class="micro">${m.label.toUpperCase()} · ILLUSTRATIVE DETAIL</p><h4>${labels[category]}</h4><p>${explanations[category]}</p>${values.map((v, i) => `<div class="detail-line"><span>${names[i]}</span><strong>${money(v)}</strong></div>`).join('')}<div class="detail-total"><span>Category total</span><span>${money(m.values[category])}</span></div><span class="detail-label">Synthetic amounts · selectable categories</span>`;
  }
  function renderChart() {
    const end = range === 'all' ? months.length : Math.min(chartStart + range, months.length);
    const subset = months.slice(chartStart, end);
    const max = Math.max(...subset.flatMap(m => [m.incoming, m.total]));
    $('chart-caption').textContent = `${subset[0].label}${subset.length > 1 ? ' – ' + subset.at(-1).label : ''} · ${subset.length} ${subset.length === 1 ? 'month' : 'months'}`;
    $('cash-chart').innerHTML = subset.map((m, n) => `<button class="chart-month" data-month="${chartStart + n}" aria-pressed="${selected === chartStart + n}" aria-label="${m.label}: cash in ${money(m.incoming)}, cash required ${money(m.total)}"><span class="bar-pair" aria-hidden="true"><span class="bar bar-in" style="height:${m.incoming / max * 100}%"></span><span class="bar bar-out" style="height:${m.total / max * 100}%"></span></span><span>${m.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })}</span></button>`).join('');
  }
  function loanRow(index, bus) {
    const m = months[index];
    const is23 = bus === 23, length = is23 ? 56 : 24, payment = is23 ? 2500 : 2050;
    // Fixed synthetic installment examples: not calculated from real loans or lending terms.
    const principal = is23 ? Math.round(2114 + (2487 - 2114) * index / 55) : Math.round(1842 + (2043 - 1842) * index / 23);
    let remaining = 0;
    for (let j = index + 1; j < length; j++) remaining += is23 ? Math.round(2114 + (2487 - 2114) * j / 55) : Math.round(1842 + (2043 - 1842) * j / 23);
    return { date: new Date(Date.UTC(m.date.getUTCFullYear(), m.date.getUTCMonth(), is23 ? 15 : 21)), type: 'Loan', name: 'Bus ' + bus, principal, interest: payment - principal, payment, remaining };
  }
  function renderLedger() {
    const m = months[selected], rows = [];
    const add = (day, type, name, payment) => rows.push({ date: new Date(Date.UTC(m.date.getUTCFullYear(), m.date.getUTCMonth(), day)), type, name, payment });
    if ($('all-obligations').checked) {
      for (let i = selected; i < months.length; i++) { rows.push(loanRow(i, 23)); if (i < 24) rows.push(loanRow(i, 18)); }
      $('ledger-note').textContent = `Selected loan examples from ${m.label} through May 2031. Both fictional balances reach zero. This loan-only view is not the total Cash Required breakdown.`;
    } else {
      add(1, 'Insurance', 'Fleet & liability premiums', m.values[3]);
      const pay = parts(0); add(7, 'Payroll', 'Projected wages · first period', pay[0]); add(21, 'Payroll', 'Projected wages · second period', pay[1]); add(28, 'Taxes / benefits', 'Employer obligations', pay[2]);
      add(10, 'AP', 'Known & recurring vendor obligations', m.values[1]); rows.push(loanRow(selected, 23)); if (selected < 24) rows.push(loanRow(selected, 18));
      const debt = parts(2); add(20, 'Debt', 'Other vehicle / equipment debt', debt[2]); add(25, 'Debt', 'Property & leases', debt[3]); add(28, 'Operations', 'Fuel, registration & maintenance', m.values[4]);
      $('ledger-note').textContent = `${m.label}: illustrative payment rows total ${money(rows.reduce((sum, r) => sum + r.payment, 0))}, matching Cash Required. Payroll and operations are assumptions; loan rows are synthetic schedules.`;
    }
    rows.sort((a, b) => a.date - b.date);
    $('ledger-rows').innerHTML = rows.map(r => `<tr><td>${r.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</td><td>${r.type}</td><td>${r.name}</td><td>${r.principal === undefined ? '—' : money(r.principal)}</td><td>${r.interest === undefined ? '—' : money(r.interest)}</td><td>${money(r.payment)}</td><td>${r.remaining === undefined ? '—' : money(r.remaining)}</td></tr>`).join('');
  }
  function render() {
    const m = months[selected]; $('cash-month').value = selected;
    $('cash-month-title').textContent = m.label; $('cash-in').textContent = money(m.incoming); $('cash-out').textContent = money(m.total); $('cash-net').textContent = (m.net >= 0 ? '+' : '−') + money(Math.abs(m.net));
    $('cash-net').parentElement.classList.toggle('negative', m.net < 0);
    $('cash-categories').innerHTML = labels.map((label, i) => `<button class="category-button" data-category="${i}" aria-pressed="${i === category}"><span>${label}</span><strong>${money(m.values[i])}</strong><span aria-hidden="true">↗</span></button>`).join('');
    renderDetail(); renderChart(); renderLedger();
  }
  $('cash-month').addEventListener('change', event => { selected = Number(event.target.value); chartStart = selected; render(); });
  $('april-shortcut').addEventListener('click', () => { selected = 18; chartStart = 18; render(); });
  document.querySelectorAll('[data-range]').forEach(button => button.addEventListener('click', () => { range = button.dataset.range === 'all' ? 'all' : Number(button.dataset.range); chartStart = selected; document.querySelectorAll('[data-range]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); renderChart(); }));
  $('cash-chart').addEventListener('click', event => { const button = event.target.closest('[data-month]'); if (!button) return; selected = Number(button.dataset.month); render(); $('cash-chart').querySelector(`[data-month="${selected}"]`)?.focus({ preventScroll: true }); });
  $('cash-categories').addEventListener('click', event => { const button = event.target.closest('[data-category]'); if (!button) return; category = Number(button.dataset.category); document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); renderDetail(); });
  $('all-obligations').addEventListener('change', renderLedger);
  render();
})();
