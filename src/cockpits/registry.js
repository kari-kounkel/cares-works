// Generic cockpits wired through KariCockpitFrame. Add a tool = (1) copy its
// HTML here, (2) add a ?raw import + an entry below, (3) flip its kari_cockpits
// row to url=/kari/<slug> + status active. Only NON-sensitive tools go here
// (this repo is public). Tools with real client data load their HTML/data from
// the gated cloud instead.
import amortization from "./amortization.html?raw";
import upstairsFloorMap from "./upstairs_floor_map.html?raw";
import marbleverse from "./marbleverse.html?raw";
import standingOrders from "../../docs/standing-orders.html?raw";
import flowsuiteDecision from "../../docs/flowsuite-decision.html?raw";

export const FRAME_COCKPITS = {
  "amortization": { toolKey: "amortization", html: amortization, title: "Amortization & Journal Engine" },
  "upstairs-floor-map": { toolKey: "upstairs_floor_map", html: upstairsFloorMap, title: "Upstairs Floor Map" },
  "marbleverse": { toolKey: "marbleverse", html: marbleverse, title: "Marbleverse" },
  "standing-orders": { toolKey: "standing_orders", html: standingOrders, title: "Standing Orders" },
  "flowsuite": { toolKey: "flowsuite_decision", html: flowsuiteDecision, title: "The FlowSuite Decision" },
};

// Sensitive cockpits (real client/personnel data). Their HTML lives ONLY in the
// gated public.kari_cockpit_html table — never in this public repo. The frame
// fetches it at runtime by slug.
export const CLOUD_COCKPITS = {
  "ap-reconciliation": { title: "AP Reconciliation Cockpit" },
  "ap-verify": { title: "AP Verify Worksheet" },
  "property-leasing": { title: "Property / Rent-Roll Cockpit" },
  "rollout-tracker": { title: "Monday 7AM Rollout Tracker" },
  "desktop-audit": { title: "Desktop Audit Cockpit" },
  "confession": { title: "Confession of Judgment Calculator" },
};
