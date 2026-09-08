// The One List, read as data.
//
// The list itself is authored as hand-written HTML in src/cockpits/the_one_list.html
// and runs verbatim inside the /kari/the-one-list cockpit. Rather than fork the
// content into a second copy that would immediately drift, this parses that same
// file into records the Command Board can draw.
//
// Tick state is NOT in here. It lives in public.kari_tool_data under tool_key
// "the_one_list", shaped { "<id>": 1 }, which is exactly what the cockpit writes —
// so a box ticked on the board and a box ticked in the cockpit are the same box.

import rawHtml from "../cockpits/the_one_list.html?raw";

export const ONE_LIST_TOOL_KEY = "the_one_list";
export const ONE_LIST_HREF = "/kari/the-one-list";

let cached = null;

export function oneListGroups() {
  if (cached) return cached;

  const doc = new DOMParser().parseFromString(rawHtml, "text/html");

  cached = [...doc.querySelectorAll("section.grp")].map((sec) => {
    const key = [...sec.classList].find((c) => c.startsWith("grp-") ) || "grp";
    const h2 = sec.querySelector("h2");

    // The heading carries its own count badge; drop it so it can be recomputed
    // against real tick state instead of being a number frozen into the markup.
    const heading = h2 ? h2.cloneNode(true) : null;
    heading?.querySelector(".cnt")?.remove();
    const full = (heading?.textContent || "").replace(/\s+/g, " ").trim();

    // "✅ Verify first — your last build session may have…" → emoji / title / detail
    const emojiMatch = full.match(/^(\P{L}{1,3})\s+/u);
    const emoji = emojiMatch ? emojiMatch[1].trim() : "";
    const rest = emojiMatch ? full.slice(emojiMatch[0].length) : full;
    const [title, ...detail] = rest.split("—");

    return {
      key,
      emoji,
      title: title.trim(),
      detail: detail.join("—").trim(),
      // Parked is the group Kari wrote "do NOT touch until everything above is
      // done" on. It stays out of the open count and is hidden by default.
      parked: key === "grp-parked",
      items: [...sec.querySelectorAll("li.row")].map((li) => ({
        id: li.getAttribute("data-id"),
        name: li.querySelector(".name")?.textContent.trim() || "",
        note: li.querySelector(".note")?.textContent.trim() || "",
        views: [...li.querySelectorAll(".views .v")]
          .filter((v) => !v.classList.contains("none"))
          .map((v) => v.textContent.trim()),
      })),
    };
  });

  return cached;
}

// The header stats the list was authored with: how much of the architecture is
// already standing. These are the 100 features that never appear as rows here —
// the file only itemises what is left — so without them the board would show
// only the remaining work and none of the ground already covered.
export function oneListProgress() {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  const stats = {};
  for (const el of doc.querySelectorAll(".stats .stat")) {
    const n = parseInt(el.querySelector(".n")?.textContent || "", 10);
    const label = (el.querySelector(".l")?.textContent || "").trim();
    if (label && Number.isFinite(n)) stats[label.toLowerCase()] = n;
  }
  const label = (doc.querySelector(".barlabel")?.textContent || "").replace(/\s+/g, " ").trim();
  const m = label.match(/(\d+)\s+of\s+(\d+)/);
  return {
    built: stats["built"] ?? (m ? Number(m[1]) : null),
    total: m ? Number(m[2]) : null,
    label,
  };
}

// Counts that drive the panel's tiles. `ticks` is the raw kari_tool_data blob.
export function oneListCounts(ticks) {
  const t = ticks || {};
  const done = (it) => Boolean(t[it.id]);
  let open = 0, done_ = 0, parked = 0;
  for (const g of oneListGroups()) {
    for (const it of g.items) {
      if (g.parked) parked++;
      else if (done(it)) done_++;
      else open++;
    }
  }
  return { open, done: done_, parked };
}
