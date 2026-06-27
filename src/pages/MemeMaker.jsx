import { useState, useEffect, useRef, useCallback } from "react";
import { navigate } from "../App";
import { supabase } from "../supabaseClient";
import { logToolSession } from "../toolSessions";

// ---- CARES Works brand tokens (matches the rest of the app) ----
const S = {
  slate: "#3d4560", orange: "#e8773a", orangeDark: "#c95f22", orangeLight: "#fdf0e8",
  paper: "#faf8f4", cream: "#f2ede3", ink: "#1e1e2a", rule: "#ddd8cc",
  muted: "#7a7585", gold: "#C9A84C", green: "#5a9a5a", white: "#ffffff",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};
const MONTHLY_URL = "https://buy.stripe.com/7sY5kD7Nl2HgeLp1Q818c06";
const ANNUAL_URL = "https://buy.stripe.com/14A5kD4B981AgTxcuM18c09";
const KARI_EMAIL = "kari@karikounkel.com";
const FONTS = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap";

// Card canvas palette (the meme itself — vintage Americana)
const CARD = { navy: "#1F3A5F", red: "#9B3A2E", gold: "#B07D2B", cream: "#F3E8C8", parch: "#FBF6E9", ink: "#2B2B2B", sideFill: "#EFE3C4" };

// ---- Kari's preloaded 13 Series ----
const SERIES_13 = [
  { num: "No. 01 / 13", title: "American Revolution", vis: "Faded parchment, a quill, 13 stars in a circle", head: "Thirteen colonies bet everything they had on a document.", body: "Not a meme. Not a hot take. A document — signed by men who knew the signing could get them hanged.\nThat's what conviction costs when it's real. Ink, and the nerve to put your actual name under it.\nWe started this whole experiment by refusing to flatten the truth into something small. Worth remembering, 250 years later, when somebody tries to flatten history into six lazy bullet points.", side: "" },
  { num: "No. 02 / 13", title: "The Form", vis: "A red “logic error” stamp over a generic checklist meme", head: "“Hitler did X, therefore X leads to Hitler.”", body: "Okay. He also painted watercolors, kept a dog, and was a vegetarian.\nNobody's ever flinched at a landscape painting.\nThe comparison only stings if you've already decided who's guilty and you're shopping backward for a list that fits. That's not an argument. That's a verdict wearing an argument's coat.", side: "A real argument invites you to check the work. A bad one preempts you and calls you dim for asking." },
  { num: "No. 03 / 13", title: "American Explorers", vis: "A hand-drawn map, half-finished, compass in the corner", head: "Lewis and Clark didn't have a map.", body: "They made one. Mile by mile, river by river, freezing and starving and writing it all down anyway.\nHistory isn't something you download. It's something somebody built — usually cold, usually tired, usually with no idea if it'd work.\nWhich is why it's a little insulting to watch people treat the past like a stock photo. Some of us know it was earned.", side: "" },
  { num: "No. 04 / 13", title: "The Toast Alarm", vis: "A smoke detector screaming over a toaster", head: "A smoke alarm that goes off every time you make toast isn't keeping you safe.", body: "It's just teaching the whole house to ignore the sound.\nThat's what a “warning sign” does when it's so broad it fits every government that ever lived — left, right, here, abroad, last century and last Tuesday.\nWhen everything is the emergency, nothing is. And the one day the kitchen's actually on fire, nobody comes running.", side: "" },
  { num: "No. 05 / 13", title: "Davy & Daniel", vis: "Coonskin cap, a worn trail through tall trees", head: "Crockett and Boone became legends the hard way.", body: "Not because somebody posted them. Because the details were true — the trails were real, the bears were real, the grit was real.\nLegends last when they're earned. They evaporate when they're invented.\nSame test works on any story somebody hands you. Earned, or invented? You already know how to tell.", side: "" },
  { num: "No. 06 / 13", title: "What's Missing", vis: "A spotlight on an empty space where the real evidence should be", head: "Here's the sleight of hand.", body: "The stuff that made tyranny tyranny — a private army beating people in the street, the legislature dissolved, every rival party outlawed, elections ended — that's the diagnostic stuff.\nAnd it's exactly what the lazy checklist leaves out.\nIt stocks the shelf with the fuzzy things that fit anybody, because the real markers are hard to claim with a straight face. Watch what an argument omits. That's where it's hiding.", side: "" },
  { num: "No. 07 / 13", title: "The Native Era", vis: "Open prairie at golden hour, big sky", head: "The land had chapters before we got here.", body: "And the honest thing — the respectful thing — is to tell them straight. Not flattened, not romanticized, not erased. Straight.\nThat's the whole ethic of loving history: you owe the dead accuracy. You don't get to sand down the parts that complicate your story.\nA people that won't tell its past honestly isn't strong. It's scared. We can do better than scared.", side: "" },
  { num: "No. 08 / 13", title: "The Nameless Villain", vis: "A “WANTED” poster with a blank silhouette", head: "The cleverest part of a bad meme? It never names anyone.", body: "It can't be wrong, because it never quite says what it's saying. You supply the villain. The meme keeps its hands clean.\nThat's not analysis. That's a mirror in a history costume — you look in, see whoever you already feared, and call it proof.\nMake people say the actual claim out loud. Half of them can't.", side: "" },
  { num: "No. 09 / 13", title: "World War Two — the keystone", vis: "Rows of white crosses, or a single folded flag", head: "We know what real fascism cost.", body: "Because we counted the graves.\nThat's the thing about throwing the word around like a foam finger — it cheapens a horror that has an actual body count, an actual machinery, actual six-million reasons to be spoken with fear and trembling.\nThe generation that stormed those beaches didn't fight a hashtag. They fought the real thing. The least we owe them is to use the word like it still has weight.", side: "This isn't about defending any politician. It's about defending the dead from becoming a punchline in a Facebook graphic." },
  { num: "No. 10 / 13", title: "Pray and Discern", vis: "Open Bible, soft light, a flag in soft focus behind", head: "Nathan walked up to the most powerful man in the kingdom and said, “You are the man.”", body: "To the king's face. About the king's sin.\nScripture tells us to pray for our leaders — all of them — and it tells us to discern. Those aren't opposites. They're the same vocation.\nYou can lift a man up in prayer and still test his works. Anybody who tells you faith means closing your eyes hasn't met the prophets.", side: "" },
  { num: "No. 11 / 13", title: "British Kings & Queens", vis: "A crown — with a gentle red “no” line through it", head: "We left the crown on purpose.", body: "The whole country is, at its root, a refusal to bow to a man just because he was born loud.\nThat's the inheritance. Not loyalty to a person — loyalty to the idea that no person is too big to question. We fought a literal king over it.\nSo forgive me if I don't hand my brain to a meme. We didn't ditch one throne to start kneeling at another.", side: "" },
  { num: "No. 12 / 13", title: "Why It Matters", vis: "A boomerang mid-flight against a blue sky", head: "The same lazy template gets aimed at your side next.", body: "That's the part people miss in the heat of it. Defeat the man and you win a Tuesday. Defeat the bad logic and you win every week after.\nBecause the wet-cardboard argument doesn't care who's holding it. Next season it points the other direction.\nDefend the reasoning, not the jersey. It's the only win that lasts.", side: "" },
  { num: "No. 13 / 13", title: "This Flag Still Means Something", vis: "The flag, full frame, sun behind it", head: "No argument today. Just love.", body: "Thirteen reasons, for thirteen stripes:\n1 · Colonies who signed anyway.\n2 · Explorers who made the map.\n3 · A people stubborn enough to leave a king.\n4 · Graves we honor, knowing what they bought.\n5 · Freedom to question the powerful, out loud.\n6 · A first chapter owed an honest telling.\n7 · Legends earned on real trails.\n8 · Voices who speak truth to power.\n9 · The right to argue and stay friends.\n10 · Coarse uncles and quiet saints, same table.\n11 · The nerve to use big words carefully.\n12 · A second chance — for a person and a nation.\n13 · You — still here, still paying attention.\nThat's not partisanship. That's a homeland. ✨ Go Sparkle! ✨", side: "" },
];

function blankThirteen() {
  return Array.from({ length: 13 }, (_, i) => ({
    num: `No. ${String(i + 1).padStart(2, "0")} / 13`,
    title: `Card ${i + 1}`,
    vis: "Drop in your image for this card",
    head: "",
    body: "",
    side: "",
  }));
}

// module-level image cache so we can draw async-loaded images
const imgCache = {};
function getImg(src, onReady) {
  if (!src) return null;
  if (imgCache[src] && imgCache[src].complete) return imgCache[src];
  if (!imgCache[src]) {
    const im = new Image();
    im.onload = () => onReady && onReady();
    im.src = src;
    imgCache[src] = im;
  }
  return imgCache[src].complete ? imgCache[src] : null;
}

export default function MemeMaker({ session }) {
  const userEmail = session?.user?.email || null;
  const [isMember, setIsMember] = useState(false);
  const [checking, setChecking] = useState(true);

  const isKari = userEmail === KARI_EMAIL;
  const [posts, setPosts] = useState(() => (isKari ? SERIES_13.map(p => ({ ...p })) : blankThirteen()));
  const [idx, setIdx] = useState(0);
  const [layout, setLayout] = useState("full"); // square-native default
  const [contentMode, setContentMode] = useState("text"); // "text" = overlay copy · "frame" = wrap a finished design
  const [biz, setBiz] = useState({ name: isKari ? "Kari Kounkel · The 13 Series" : "", website: isKari ? "karikounkel.com/history" : "", accent: CARD.gold, logo: "" });
  const [postImgs, setPostImgs] = useState({}); // idx -> dataURL
  const [projName, setProjName] = useState("My America 250 Series");
  const [projId, setProjId] = useState(null); // current saved-project id — reused so Save updates in place
  const [saved, setSaved] = useState([]); // [{id,name}]
  const [status, setStatus] = useState("");
  const [tick, setTick] = useState(0); // force redraw on async image load
  const canvasRef = useRef(null);

  const isCloud = isMember; // members get cloud saves; signed-in non-members get browser-only
  const LS_KEY = "cares_meme_projects_v1";

  // membership check
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!userEmail) { setChecking(false); return; }
      try {
        const { data } = await supabase.from("members").select("email").eq("email", userEmail).maybeSingle();
        if (!cancelled) setIsMember(!!data);
      } catch (_) { if (!cancelled) setIsMember(false); }
      if (!cancelled) setChecking(false);
    })();
    return () => { cancelled = true; };
  }, [userEmail]);

  // load saved project list
  const refreshSaved = useCallback(async () => {
    if (isCloud) {
      try {
        const { data } = await supabase.from("meme_projects").select("id,name,updated_at").eq("user_email", userEmail).order("updated_at", { ascending: false });
        setSaved(data || []);
      } catch (_) { setSaved([]); }
    } else {
      try {
        const all = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
        setSaved(Object.entries(all).map(([id, v]) => ({ id, name: v.name })));
      } catch (_) { setSaved([]); }
    }
  }, [isCloud, userEmail]);
  useEffect(() => { if (!checking && userEmail) refreshSaved(); }, [checking, userEmail, refreshSaved]);

  const current = posts[idx];
  const setField = (field, val) => setPosts(ps => ps.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));

  // ---------- canvas helpers ----------
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function star(ctx, cx, cy, spikes, outer, inner, fill) { let rot = Math.PI / 2 * 3, x = cx, y = cy, step = Math.PI / spikes; ctx.beginPath(); ctx.moveTo(cx, cy - outer); for (let i = 0; i < spikes; i++) { x = cx + Math.cos(rot) * outer; y = cy + Math.sin(rot) * outer; ctx.lineTo(x, y); rot += step; x = cx + Math.cos(rot) * inner; y = cy + Math.sin(rot) * inner; ctx.lineTo(x, y); rot += step; } ctx.lineTo(cx, cy - outer); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  function starRow(ctx, cx, y, count, gap, size, fill) { const total = (count - 1) * gap; let x = cx - total / 2; for (let i = 0; i < count; i++) { star(ctx, x, y, 5, size, size * 0.45, fill); x += gap; } }
  function drawCover(ctx, img, x, y, w, h) { const ir = img.width / img.height, br = w / h; let sw, sh, sx, sy; if (ir > br) { sh = img.height; sw = img.height * br; sx = (img.width - sw) / 2; sy = 0; } else { sw = img.width; sh = img.width / br; sx = 0; sy = (img.height - sh) / 2; } ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h); }
  function wrap(ctx, text, maxW, font) { ctx.font = font; const words = String(text).split(/\s+/); const lines = []; let cur = ""; for (const w of words) { const t = cur ? cur + " " + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
  function paraLines(ctx, paras, maxW, font) { let all = []; for (const p of paras) { wrap(ctx, p, maxW, font).forEach(l => all.push(l)); all.push("__GAP__"); } all.pop(); return all; }

  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = 1080, H = 1350, accent = biz.accent || CARD.gold;
    const onReady = () => setTick(t => t + 1);
    ctx.clearRect(0, 0, W, H);

    const img = getImg(postImgs[idx], onReady);
    const logo = getImg(biz.logo, onReady);

    const frameOnly = contentMode === "frame";

    // base
    ctx.fillStyle = CARD.parch; ctx.fillRect(0, 0, W, H);
    if ((layout === "full" || frameOnly) && img) { drawCover(ctx, img, 67, 67, W - 134, H - 134); }
    else if (!img) { ctx.fillStyle = "rgba(120,90,40,0.04)"; for (let i = 0; i < 1100; i++) ctx.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4); }

    // double frame
    ctx.strokeStyle = CARD.navy; ctx.lineWidth = 6; ctx.strokeRect(54, 54, W - 108, H - 108);
    ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.strokeRect(64, 64, W - 128, H - 128);

    const inX = 90, inW = W - 180;

    // FRAME-ONLY: wrap a finished design, add nothing but logo + a tiny credit strip
    if (frameOnly) {
      if (!img) { ctx.fillStyle = "#9a8a63"; ctx.font = "italic 22px 'DM Serif Display', serif"; ctx.textAlign = "center"; ctx.fillText("Drop in your finished square design →", W / 2, H / 2); }
      if (logo) { const ls = 92, lx = W - 86 - ls, ly = 84; const r = logo.width / logo.height; let dw = ls, dh = ls; if (r > 1) dh = ls / r; else dw = ls * r; ctx.drawImage(logo, lx + (ls - dw) / 2, ly + (ls - dh) / 2, dw, dh); }
      const credit = [biz.name, biz.website].filter(Boolean).join("   ·   ") || "Made with CARES MN Tools · tools.caresmn.com";
      ctx.save(); ctx.globalAlpha = 0.92; ctx.fillStyle = CARD.parch; roundRect(ctx, inX, H - 150, inW, 60, 12); ctx.fill(); ctx.restore();
      ctx.strokeStyle = accent; ctx.lineWidth = 1.5; roundRect(ctx, inX, H - 150, inW, 60, 12); ctx.stroke();
      ctx.textAlign = "center"; ctx.fillStyle = CARD.navy; ctx.font = "600 20px Figtree, sans-serif"; ctx.fillText(credit, W / 2, H - 112);
      return;
    }

    // eyebrow
    ctx.textAlign = "center"; ctx.fillStyle = accent; ctx.font = "700 26px 'DM Mono', monospace";
    try { ctx.letterSpacing = "4px"; } catch (e) {}
    ctx.fillText((current.num || "AMERICA 250").toUpperCase(), W / 2, 116);
    try { ctx.letterSpacing = "0px"; } catch (e) {}
    starRow(ctx, W / 2, 140, 7, 26, 7, CARD.red);

    let cursorY = 176;
    const footerY = H - 132;

    if (layout === "window") {
      const vY = cursorY, vH = 600, vX = inX, vW = inW;
      if (img) { ctx.save(); roundRect(ctx, vX, vY, vW, vH, 14); ctx.clip(); drawCover(ctx, img, vX, vY, vW, vH); ctx.restore(); ctx.strokeStyle = CARD.navy; ctx.lineWidth = 3; roundRect(ctx, vX, vY, vW, vH, 14); ctx.stroke(); }
      else { ctx.fillStyle = "#EDE2C2"; roundRect(ctx, vX, vY, vW, vH, 14); ctx.fill(); ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.setLineDash([8, 7]); roundRect(ctx, vX, vY, vW, vH, 14); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "#9a8a63"; ctx.font = "700 20px 'DM Mono', monospace"; ctx.fillText("DROP THIS CARD'S VISUAL HERE", W / 2, vY + vH / 2 - 6); ctx.font = "italic 19px 'DM Serif Display', serif"; ctx.fillStyle = "#7d6f4d"; wrap(ctx, current.vis, vW - 80, "italic 19px 'DM Serif Display', serif").slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, vY + vH / 2 + 24 + i * 26)); }
      cursorY = vY + vH + 34;
    } else if (img) {
      // full: parchment panel for text
      const pT = 740; ctx.fillStyle = "rgba(251,246,233,0.93)"; roundRect(ctx, inX - 8, pT, inW + 16, footerY - pT + 30, 16); ctx.fill(); ctx.strokeStyle = accent; ctx.lineWidth = 2; roundRect(ctx, inX - 8, pT, inW + 16, footerY - pT + 30, 16); ctx.stroke(); cursorY = pT + 34;
    } else {
      ctx.fillStyle = "#9a8a63"; ctx.font = "italic 20px 'DM Serif Display', serif";
      ctx.fillText("(Add this card's image — suggested: " + (current.vis || "your visual") + ")", W / 2, 250);
      cursorY = 300;
    }

    // sidebar reserve
    let sideLines = [], sideH = 0;
    if (current.side && current.side.trim()) { sideLines = wrap(ctx, current.side, inW - 72, "italic 23px 'DM Serif Display', serif"); sideH = 46 + sideLines.length * 30; }
    const bottomLimit = footerY - (sideH ? sideH + 22 : 10);

    // headline (auto-fit <=3 lines)
    let hSize = 50, hLines = [""];
    if (current.head && current.head.trim()) { while (hSize >= 28) { hLines = wrap(ctx, current.head, inW, "700 " + hSize + "px 'DM Serif Display', serif"); if (hLines.length <= 3) break; hSize -= 2; } }
    ctx.fillStyle = CARD.navy; ctx.font = "700 " + hSize + "px 'DM Serif Display', serif"; ctx.textAlign = "center";
    let y = cursorY;
    if (current.head && current.head.trim()) { hLines.forEach(l => { ctx.fillText(l, W / 2, y + hSize * 0.85); y += hSize * 1.07; }); y += 14; }

    // body (auto-fit)
    const bodyParas = String(current.body || "").split("\n").map(s => s.trim()).filter(Boolean);
    if (bodyParas.length) {
      let bSize = 27;
      const measure = sz => { const ls = paraLines(ctx, bodyParas, inW, "400 " + sz + "px Figtree, sans-serif"); let h = 0; for (const l of ls) h += (l === "__GAP__" ? sz * 0.5 : sz * 1.3); return { h, ls }; };
      let m = measure(bSize);
      while (bSize >= 14 && y + m.h > bottomLimit) { bSize -= 1; m = measure(bSize); }
      ctx.fillStyle = CARD.ink; ctx.font = "400 " + bSize + "px Figtree, sans-serif"; ctx.textAlign = "left";
      for (let i = 0; i < m.ls.length; i++) {
        const l = m.ls[i];
        if (l === "__GAP__") { y += bSize * 0.5; continue; }
        const lastOfPara = (i === m.ls.length - 1) || (m.ls[i + 1] === "__GAP__");
        const words = l.split(" ");
        const lineW = ctx.measureText(l).width;
        if (lastOfPara || words.length < 2 || lineW < inW * 0.5) {
          // last line of a paragraph (or a too-short line) → left-aligned, no ugly stretched gaps
          ctx.fillText(l, inX, y + bSize * 0.85);
        } else {
          const wordsW = words.reduce((s, w) => s + ctx.measureText(w).width, 0);
          const gap = (inW - wordsW) / (words.length - 1);
          let x = inX;
          for (const w of words) { ctx.fillText(w, x, y + bSize * 0.85); x += ctx.measureText(w).width + gap; }
        }
        y += bSize * 1.3;
      }
    }

    // sidebar box
    if (sideH) { const bx = inX, bw = inW, by = footerY - sideH - 6; ctx.fillStyle = CARD.sideFill; roundRect(ctx, bx, by, bw, sideH, 12); ctx.fill(); ctx.fillStyle = accent; ctx.font = "700 16px 'DM Mono', monospace"; ctx.textAlign = "left"; try { ctx.letterSpacing = "2px"; } catch (e) {} ctx.fillText("SIDEBAR NOTE", bx + 20, by + 28); try { ctx.letterSpacing = "0px"; } catch (e) {} ctx.fillStyle = CARD.ink; ctx.font = "italic 23px 'DM Serif Display', serif"; ctx.textAlign = "center"; let sy = by + 52; sideLines.forEach(l => { ctx.fillText(l, W / 2, sy); sy += 30; }); }

    // business logo (top-right)
    if (logo) { const ls = 96, lx = W - 90 - ls, ly = 86; ctx.save(); ctx.globalAlpha = 0.97; const r = logo.width / logo.height; let dw = ls, dh = ls; if (r > 1) dh = ls / r; else dw = ls * r; ctx.drawImage(logo, lx + (ls - dw) / 2, ly + (ls - dh) / 2, dw, dh); ctx.restore(); }

    // footer: business name / website (accent) + CARES credit
    ctx.textAlign = "center";
    const fLine = [biz.name, biz.website].filter(Boolean).join("   ·   ");
    if (fLine) { ctx.fillStyle = layout === "full" && img ? "#5b4a2e" : CARD.navy; ctx.font = "600 19px Figtree, sans-serif"; ctx.fillText(fLine, W / 2, footerY + 30); }
    ctx.fillStyle = "#9a8c6c"; ctx.font = "400 13px 'DM Mono', monospace";
    ctx.fillText("Made with CARES MN Tools · tools.caresmn.com", W / 2, footerY + 56);
  }, [posts, idx, layout, contentMode, biz, postImgs, current, tick]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTick(t => t + 1)); }, []);

  // ---------- file handlers ----------
  const readFile = (file, cb) => { const r = new FileReader(); r.onload = () => cb(r.result); r.readAsDataURL(file); };
  const onPostImg = e => { const f = e.target.files[0]; if (f) readFile(f, d => setPostImgs(m => ({ ...m, [idx]: d }))); };
  const onLogo = e => { const f = e.target.files[0]; if (f) readFile(f, d => setBiz(b => ({ ...b, logo: d }))); };

  // ---------- save / load ----------
  const projectData = () => ({ name: projName, posts, biz, layout, postImgs });
  const handleSave = async () => {
    const data = projectData();
    const id = projId || ("mp_" + Date.now());
    if (isCloud) {
      try {
        await supabase.from("meme_projects").upsert({ id, user_email: userEmail, name: projName, data, updated_at: new Date().toISOString() });
        logToolSession({ email: userEmail, slug: "america-250-meme-maker", title: "America 250 Meme Maker", icon: "🇺🇸", refId: id, name: projName, href: "/tools/america-250-meme-maker" });
        setProjId(id);
        setStatus(projId ? "Updated your saved set." : "Saved to your CARES Works vault.");
        refreshSaved();
      } catch (e) { setStatus("Cloud save unavailable — saved to this browser instead."); browserSave(data, id); }
    } else { browserSave(data, id); setStatus(projId ? "Updated (browser save)." : "Saved to this browser. Become a member to save to your vault across devices."); }
  };
  const browserSave = (data, id) => {
    try { const all = JSON.parse(localStorage.getItem(LS_KEY) || "{}"); all[id] = data; localStorage.setItem(LS_KEY, JSON.stringify(all)); setProjId(id); refreshSaved(); } catch (_) {}
  };
  const newProject = () => { setProjId(null); setPosts(isKari ? SERIES_13.map(p => ({ ...p })) : blankThirteen()); setPostImgs({}); setProjName("My America 250 Series"); setIdx(0); setStatus("Started a fresh set."); };
  const loadProject = async (id) => {
    let data = null;
    if (isCloud) { try { const { data: row } = await supabase.from("meme_projects").select("data").eq("id", id).maybeSingle(); data = row?.data; } catch (_) {} }
    else { try { data = JSON.parse(localStorage.getItem(LS_KEY) || "{}")[id]; } catch (_) {} }
    if (data) { setPosts(data.posts || posts); setBiz(data.biz || biz); setLayout(data.layout || "full"); setPostImgs(data.postImgs || {}); setProjName(data.name || projName); setProjId(id); setIdx(0); setStatus("Loaded “" + (data.name || "project") + ".”"); }
  };

  const download = () => {
    const cv = canvasRef.current; if (!cv) return;
    const slug = (current.title || "card").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const a = document.createElement("a"); a.download = `america250_${String(idx + 1).padStart(2, "0")}_${slug}.png`; a.href = cv.toDataURL("image/png"); a.click();
  };

  // ---------- gates ----------
  if (checking) return (<div style={{ minHeight: "100vh", background: S.paper, display: "flex", alignItems: "center", justifyContent: "center", color: S.muted, fontFamily: "Figtree, sans-serif" }}><link href={FONTS} rel="stylesheet" />Loading…</div>);

  // email-to-enter gate: nobody uses the tool without signing in
  if (!session) return (
    <div style={{ minHeight: "100vh", background: S.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Figtree, sans-serif" }}>
      <link href={FONTS} rel="stylesheet" />
      <div style={{ maxWidth: 460, width: "100%", background: S.white, borderRadius: 16, padding: "40px 36px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 50, marginBottom: 14 }}>🇺🇸</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>CARES MN Tools</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: S.slate, marginBottom: 12 }}>America 250 Meme Maker</h2>
        <p style={{ color: S.muted, fontSize: 15, lineHeight: 1.65, marginBottom: 26 }}>Sign in with your email to use the meme maker. Free to use — members can save their sets to the cloud.</p>
        <button onClick={() => navigate("/login")} style={{ background: S.grad, color: "#fff", border: "none", padding: "14px 26px", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%" }}>Sign in to start</button>
      </div>
    </div>
  );

  // ---------- main UI ----------
  const lbl = { display: "block", fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S.slate, margin: "16px 0 6px" };
  const inp = { width: "100%", border: "1.5px solid " + S.rule, borderRadius: 8, padding: "9px 11px", fontSize: 14, fontFamily: "Figtree, sans-serif", color: S.ink, background: "#fffdf9" };

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "Figtree, sans-serif", color: S.ink }}>
      <link href={FONTS} rel="stylesheet" />
      {/* header */}
      <div style={{ background: S.slate, color: "#fff", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>CARES MN Tools · tools.caresmn.com</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22 }}>America 250 Meme Maker</div>
        </div>
        <a href="/dashboard" onClick={e => { e.preventDefault(); navigate("/dashboard"); }} style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", textDecoration: "none", letterSpacing: "0.06em" }}>← Dashboard</a>
      </div>

      {/* status line */}
      <div style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, background: S.cream, flexWrap: "wrap" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: isCloud ? S.green : S.gold, display: "inline-block" }}></span>
        {isCloud ? <span>Cloud saves on. Signed in as {userEmail}.</span> : <span>Free mode — browser saves only. <a href={MONTHLY_URL} target="_blank" rel="noreferrer" style={{ color: S.orange, fontWeight: 700, textDecoration: "none" }}>Become a member</a> to save your sets to the cloud.</span>}
        {status && <span style={{ marginLeft: 10, fontStyle: "italic", color: S.slate }}>{status}</span>}
      </div>

      <div style={{ display: "flex", gap: 24, padding: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* controls */}
        <div style={{ flex: "1 1 360px", minWidth: 320, maxWidth: 480, background: "#fff", border: "1px solid " + S.rule, borderRadius: 14, padding: 20 }}>
          <label style={lbl}>Mode</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[["text", "Add text"], ["frame", "Frame only"]].map(([m, label]) => <button key={m} onClick={() => setContentMode(m)} style={{ flex: 1, border: "1.5px solid " + (contentMode === m ? S.orange : S.rule), background: contentMode === m ? S.orangeLight : "#fff", color: contentMode === m ? S.orangeDark : S.slate, borderRadius: 8, padding: 9, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>{label}</button>)}
          </div>
          <div style={{ fontSize: 11, color: S.muted, marginTop: 5 }}>{contentMode === "frame" ? "Wraps your finished Canva square in the frame + credit. No text added." : "Lays your headline/body/sidebar over a plain photo or graphic."}</div>

          <label style={lbl}>Card</label>
          <select value={idx} onChange={e => setIdx(+e.target.value)} style={inp}>
            {posts.map((p, i) => <option key={i} value={i}>{p.num.replace("No. ", "#").replace(" / 13", "")} — {p.title || "Untitled"}</option>)}
          </select>

          <label style={lbl}>Eyebrow / number</label>
          <input style={inp} value={current.num} onChange={e => setField("num", e.target.value)} />
          <label style={lbl}>Card title (menu label)</label>
          <input style={inp} value={current.title} onChange={e => setField("title", e.target.value)} />
          <label style={lbl}>Headline</label>
          <textarea style={{ ...inp, resize: "vertical" }} rows={2} value={current.head} onChange={e => setField("head", e.target.value)} />
          <label style={lbl}>Body <span style={{ textTransform: "none", fontWeight: 400, color: S.muted }}>(one line = one paragraph)</span></label>
          <textarea style={{ ...inp, resize: "vertical" }} rows={6} value={current.body} onChange={e => setField("body", e.target.value)} />
          <label style={lbl}>Sidebar note <span style={{ textTransform: "none", fontWeight: 400, color: S.muted }}>(blank = hidden)</span></label>
          <textarea style={{ ...inp, resize: "vertical" }} rows={2} value={current.side} onChange={e => setField("side", e.target.value)} />

          <label style={lbl}>This card's visual</label>
          <input type="file" accept="image/*" onChange={onPostImg} style={{ fontSize: 12 }} />
          {postImgs[idx] && <button onClick={() => setPostImgs(m => { const n = { ...m }; delete n[idx]; return n; })} style={{ marginLeft: 8, fontSize: 12, border: "1px solid " + S.rule, background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Remove</button>}

          <label style={lbl}>Image style</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["full", "window"].map(L => <button key={L} onClick={() => setLayout(L)} style={{ flex: 1, border: "1.5px solid " + (layout === L ? S.slate : S.rule), background: layout === L ? S.slate : "#fff", color: layout === L ? "#fff" : S.slate, borderRadius: 8, padding: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>{L === "full" ? "Full (square ✓)" : "Framed banner"}</button>)}
          </div>
          <div style={{ fontSize: 11, color: S.muted, marginTop: 5 }}>Square 1080×1080 visuals → use Full. Wide banners → use Framed.</div>

          <div style={{ borderTop: "1px solid " + S.rule, margin: "20px 0 0" }} />
          <label style={lbl}>Your business branding</label>
          <input style={inp} placeholder="Business name / handle" value={biz.name} onChange={e => setBiz(b => ({ ...b, name: e.target.value }))} />
          <input style={{ ...inp, marginTop: 8 }} placeholder="Website / call to action" value={biz.website} onChange={e => setBiz(b => ({ ...b, website: e.target.value }))} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span style={{ fontSize: 13, color: S.slate }}>Accent</span>
            <input type="color" value={biz.accent} onChange={e => setBiz(b => ({ ...b, accent: e.target.value }))} style={{ width: 44, height: 30, border: "none", background: "none" }} />
            <span style={{ fontSize: 13, color: S.slate, marginLeft: 8 }}>Logo</span>
            <input type="file" accept="image/*" onChange={onLogo} style={{ fontSize: 12 }} />
          </div>
        </div>

        {/* stage */}
        <div style={{ flex: "1 1 520px", minWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <canvas ref={canvasRef} width={1080} height={1350} style={{ width: "100%", maxWidth: 460, height: "auto", borderRadius: 14, boxShadow: "0 6px 22px rgba(0,0,0,0.18)", background: CARD.parch }} />
          <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 540 }}>
            <button onClick={() => setIdx(i => (i - 1 + posts.length) % posts.length)} style={{ flex: 1, border: "1.5px solid " + S.rule, background: "#fff", color: S.slate, borderRadius: 10, padding: 9, fontWeight: 600, cursor: "pointer" }}>‹ Prev</button>
            <button onClick={() => setIdx(i => (i + 1) % posts.length)} style={{ flex: 1, border: "1.5px solid " + S.rule, background: "#fff", color: S.slate, borderRadius: 10, padding: 9, fontWeight: 600, cursor: "pointer" }}>Next ›</button>
          </div>
          <button onClick={download} style={{ width: "100%", maxWidth: 540, background: S.grad, color: "#fff", border: "none", borderRadius: 10, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>⬇ Download this card (PNG)</button>

          {/* save row */}
          <div style={{ width: "100%", maxWidth: 540, background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} value={projName} onChange={e => setProjName(e.target.value)} placeholder="Project name" />
              <button onClick={handleSave} style={{ background: S.slate, color: "#fff", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 700, cursor: "pointer" }}>{projId ? "💾 Update" : "💾 Save"}</button>
              <button onClick={newProject} style={{ background: "#fff", color: S.slate, border: "1.5px solid " + S.rule, borderRadius: 8, padding: "0 14px", fontWeight: 700, cursor: "pointer" }}>+ New</button>
            </div>
            {saved.length > 0 && (
              <select onChange={e => e.target.value && loadProject(e.target.value)} value="" style={inp}>
                <option value="">— Load a saved set —</option>
                {saved.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
