// Build the property inventory from the systems that actually know, instead of
// from a hand-written ledger. Sources, in order of authority:
//
//   1. Vercel  — every project, and its production alias(es). This is what is
//                actually serving on the internet.
//   2. Vercel  — registered apex domains.
//   3. A live fetch of each resulting hostname.
//
// Prints a table. Writes nothing.

import fs from 'fs';

const auth = JSON.parse(fs.readFileSync(
  'C:/Users/kari/AppData/Roaming/xdg.data/com.vercel.cli/auth.json', 'utf8'));
const TOKEN = auth.token;
const TEAM = 'team_MzJfjdVk8hjUhRXEzk8iyMbt';

const api = async (path) => {
  const r = await fetch('https://api.vercel.com' + path, {
    headers: { Authorization: 'Bearer ' + TOKEN },
  });
  if (!r.ok) throw new Error(path + ' -> ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r.json();
};

// v9 projects carries targets.production.alias — every hostname a project serves.
const { projects } = await api(`/v9/projects?teamId=${TEAM}&limit=100`);
const { domains } = await api(`/v5/domains?teamId=${TEAM}&limit=100`);

const registered = new Set(domains.map((d) => d.name));
const isVanity = (h) => h.endsWith('.vercel.app');

const rows = [];
for (const p of projects) {
  const aliases = (p.targets?.production?.alias || []);
  const real = aliases.filter((a) => !isVanity(a));
  const shown = real.length ? real : aliases.filter((a) => a.split('-').length <= 3).slice(0, 1);
  if (!shown.length) rows.push({ project: p.name, host: null, vanityOnly: true });
  for (const h of shown) rows.push({ project: p.name, host: h, vanityOnly: isVanity(h) });
}

// Apex domains nobody's project claimed as a production alias.
const claimed = new Set(rows.map((r) => r.host).filter(Boolean));
for (const d of registered) {
  if (![...claimed].some((h) => h === d || h === 'www.' + d)) {
    rows.push({ project: '(registered, no production alias found)', host: d, orphan: true });
  }
}

const probe = async (host) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 10000);
  try {
    const r = await fetch('https://' + host, { signal: c.signal, redirect: 'follow' });
    const html = (await r.text()).slice(0, 200000);
    const title = (html.match(/<title[^>]*>([^<]{1,60})/i) || [])[1];
    return { http: r.status, title: title ? title.trim() : '' };
  } catch (e) {
    return { http: null, title: e.name === 'AbortError' ? 'timeout' : 'unreachable' };
  } finally { clearTimeout(t); }
};

await Promise.all(rows.map(async (r) => { if (r.host) r.probe = await probe(r.host); }));

const pad = (s, n) => String(s ?? '').slice(0, n).padEnd(n);
console.log(pad('PROJECT', 24), pad('HOST', 34), pad('HTTP', 5), 'TITLE');
console.log('-'.repeat(100));
for (const r of rows.sort((a, b) => (a.project + a.host).localeCompare(b.project + b.host))) {
  console.log(pad(r.project, 24), pad(r.host || '— no domain —', 34),
    pad(r.probe?.http ?? '', 5), (r.probe?.title || '').slice(0, 34),
    r.orphan ? '  <-- REGISTERED, UNCLAIMED' : r.vanityOnly ? '  (vercel.app only)' : '');
}
console.log('\nprojects: %d | registered domains: %d | rows: %d', projects.length, domains.length, rows.length);
console.log('registered:', [...registered].join(', '));
