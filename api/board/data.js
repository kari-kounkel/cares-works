// The Command Board's read endpoint: /api/board/data?panel=calendar|mail|ar
//
// One function rather than three, because the Hobby plan allows 12 Serverless
// Functions per deployment and this repo already runs seven of them. The panels
// themselves are in _panels.js.

import { requireUser, json } from "./_lib.js";
import { calendarPanel, mailPanel, arPanel } from "./_panels.js";

const PANELS = { calendar: calendarPanel, mail: mailPanel, ar: arPanel };

export default async function handler(req, res) {
  const panel = PANELS[String(req.query?.panel || "")];
  if (!panel) return json(res, 400, { error: "unknown_panel" });

  const user = await requireUser(req);
  if (!user) return json(res, 401, { error: "not_signed_in" });

  // A panel that fails returns a body the page can draw as a state. The only
  // thing that reaches this catch is a bug in our own code.
  try {
    return json(res, 200, await panel(user, req.query || {}));
  } catch (err) {
    return json(res, 200, { ok: false, error: err.message || "panel_failed" });
  }
}
