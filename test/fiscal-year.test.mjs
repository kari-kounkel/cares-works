function mk(fyEndMonth, fyEndDay) {
  const fyBounds = label => {
    const m = fyEndMonth, d = fyEndDay;
    const end = new Date(Date.UTC(label, m - 1, d));
    const start = new Date(Date.UTC(label, m - 1, d));
    start.setUTCDate(start.getUTCDate() + 1);
    start.setUTCFullYear(start.getUTCFullYear() - 1);
    return { start: start.toISOString().slice(0,10), end: end.toISOString().slice(0,10) };
  };
  const fyOf = dateISO => {
    const m = fyEndMonth, d = fyEndDay;
    const y = +dateISO.slice(0,4);
    const endThisYear = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return dateISO <= endThisYear ? y : y + 1;
  };
  return { fyBounds, fyOf };
}
let fail = 0;
const chk = (label, got, want) => { const ok = JSON.stringify(got)===JSON.stringify(want); if(!ok){fail++;console.log("FAIL",label,"got",got,"want",want);} else console.log("ok  ", label, JSON.stringify(got)); };

const dec = mk(12,31);
chk("Dec31 FY2026 bounds", dec.fyBounds(2026), {start:"2026-01-01", end:"2026-12-31"});
chk("Dec31 2026-07-10", dec.fyOf("2026-07-10"), 2026);
chk("Dec31 2026-01-01", dec.fyOf("2026-01-01"), 2026);
chk("Dec31 2026-12-31", dec.fyOf("2026-12-31"), 2026);

const jun = mk(6,30);
chk("Jun30 FY2026 bounds", jun.fyBounds(2026), {start:"2025-07-01", end:"2026-06-30"});
chk("Jun30 2026-07-01 -> FY2027", jun.fyOf("2026-07-01"), 2027);
chk("Jun30 2026-06-30 -> FY2026", jun.fyOf("2026-06-30"), 2026);
chk("Jun30 2025-07-01 -> FY2026", jun.fyOf("2025-07-01"), 2026);

const mar = mk(3,31);
chk("Mar31 FY2026 bounds", mar.fyBounds(2026), {start:"2025-04-01", end:"2026-03-31"});
chk("Mar31 2026-04-01 -> FY2027", mar.fyOf("2026-04-01"), 2027);

// every fyOf(date) must land inside fyBounds(that fy) — the real invariant
for (const [m,d] of [[12,31],[6,30],[3,31],[9,30],[1,31]]) {
  const f = mk(m,d);
  for (let y=2024;y<=2027;y++) for (let mm=1;mm<=12;mm++) for (const dd of [1,15,28]) {
    const iso = `${y}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
    const fy = f.fyOf(iso); const b = f.fyBounds(fy);
    if (!(iso >= b.start && iso <= b.end)) { fail++; console.log("FAIL invariant", m+"/"+d, iso, "->FY"+fy, b); }
  }
}
console.log(fail ? `\n${fail} FAILURES` : "\nall pass — every date lands inside its own fiscal year");
