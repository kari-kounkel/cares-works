// Rebuild board_properties from the systems that actually know, replacing the
// list that was typed out of docs/standing-orders.html.
//
// The rule, so the row set is explainable and complete-able:
//   every production hostname Vercel serves,
//   plus every domain Kari owns that no project claims.
//
// Kari's declared `checks` are preserved by host — a re-sync must never wipe an
// answer she gave. Rows that no longer exist upstream are removed.

import fs from 'fs';

const SCRATCH = 'C:/Users/kari/AppData/Local/Temp/claude/C--dev-cares-works/0467cf6c-6a56-4f20-91c0-11bba211c22f/scratchpad';

const auth = JSON.parse(fs.readFileSync('C:/Users/kari/AppData/Roaming/xdg.data/com.vercel.cli/auth.json', 'utf8'));
const V = auth.token;
const TEAM = 'team_MzJfjdVk8hjUhRXEzk8iyMbt';

const env = fs.readFileSync(SCRATCH + '/env.board', 'utf8');
const cfg = (k) => env.match(new RegExp(k + '="?([^"\n]+)'))[1].trim();
const SB = cfg('SUPABASE_URL').replace(/\/$/, '');
const KEY = cfg('SUPABASE_SERVICE_KEY');

const vercel = async (p) => {
  const r = await fetch('https://api.vercel.com' + p, { headers: { Authorization: 'Bearer ' + V } });
  if (!r.ok) throw new Error(p + ' ' + r.status);
  return r.json();
};
const rest = async (method, path, body) => {
  const r = await fetch(SB + '/rest/v1/' + path, {
    method,
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(method + ' ' + path + ' -> ' + r.status + ' ' + t.slice(0, 300));
  return t ? JSON.parse(t) : null;
};

const { projects } = await vercel(`/v9/projects?teamId=${TEAM}&limit=100`);
const { domains } = await vercel(`/v5/domains?teamId=${TEAM}&limit=100`);

const isVanity = (h) => h.endsWith('.vercel.app');
const derived = [];

for (const p of projects) {
  const aliases = p.targets?.production?.alias || [];
  const custom = aliases.filter((a) => !isVanity(a));
  if (custom.length) {
    for (const h of custom) derived.push({ host: h, label: p.name, backend: 'vercel: ' + p.name, status: 'live' });
  } else {
    // Live, but reachable only on a vercel.app URL — no domain of its own.
    const vanity = aliases.find((a) => a.split('-').length <= 3) || aliases[0];
    if (vanity) derived.push({ host: vanity, label: p.name, backend: 'vercel: ' + p.name, status: 'no custom domain' });
  }
}

const claimed = new Set(derived.map((d) => d.host));
for (const d of domains) {
  if (!claimed.has(d.name) && !claimed.has('www.' + d.name)) {
    derived.push({ host: d.name, label: '(unclaimed)', backend: 'registered, no Vercel project', status: 'unclaimed' });
  }
}

derived.sort((a, b) => a.host.localeCompare(b.host));
console.log('derived %d hostnames from %d projects + %d registered domains',
  derived.length, projects.length, domains.length);

const users = await rest('GET', 'board_properties?select=user_id&limit=1000');
const userIds = [...new Set(users.map((u) => u.user_id))];
console.log('applying to %d user(s)', userIds.length);

for (const uid of userIds) {
  const existing = await rest('GET', `board_properties?select=id,host,checks,probe,probed_at&user_id=eq.${uid}`);
  const byHost = Object.fromEntries(existing.map((e) => [e.host, e]));

  const rows = derived.map((d, i) => ({
    user_id: uid, host: d.host, label: d.label, backend: d.backend, status: d.status,
    sort: i + 1,
    // Never lose an answer she gave, or a scan already taken.
    checks: byHost[d.host]?.checks || {},
    probe: byHost[d.host]?.probe || {},
    probed_at: byHost[d.host]?.probed_at || null,
  }));

  await fetch(SB + '/rest/v1/board_properties?on_conflict=user_id,host', {
    method: 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json',
               Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  }).then(async (r) => { if (!r.ok) throw new Error('upsert ' + r.status + ' ' + (await r.text()).slice(0, 200)); });

  const keep = new Set(derived.map((d) => d.host));
  const stale = existing.filter((e) => !keep.has(e.host));
  for (const s of stale) await rest('DELETE', 'board_properties?id=eq.' + s.id);
  console.log('  user %s: %d rows, removed %d that no longer exist upstream (%s)',
    uid.slice(0, 8), rows.length, stale.length, stale.map((s) => s.host).join(', ') || 'none');
}

const all = await rest('GET', 'board_properties?select=host,status&user_id=eq.' + userIds[0] + '&order=sort');
console.log('\nfinal list:');
for (const r of all) console.log('  ', r.host.padEnd(36), r.status);
