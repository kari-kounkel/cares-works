import { useState, useEffect, useRef, useCallback } from "react";
import { navigate } from "../App";

const S = {
  slate: "#3d4560",
  orange: "#e8773a",
  orangeDark: "#c95f22",
  orangeLight: "#fdf0e8",
  paper: "#faf8f4",
  cream: "#f2ede3",
  ink: "#1e1e2a",
  rule: "#ddd8cc",
  muted: "#7a7585",
  gold: "#C9A84C",
  green: "#5a9a5a",
  red: "#c95f22",
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const STORAGE_KEY = "cares_checklists_v1";
const CURRENT_KEY = "cares_checklists_current_v1";
const DEFAULT_COLUMNS = ["Status A", "Status B"];

function uid() {
  return "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

function getAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function saveAll(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    return true;
  } catch (e) {
    return false;
  }
}

function emptyChecklist(name) {
  return {
    name: name || "Untitled checklist",
    updated: Date.now(),
    sections: [
      {
        id: uid(),
        name: "New Section",
        columns: [...DEFAULT_COLUMNS],
        items: [{ id: uid(), text: "First item", states: ["", ""], notes: "" }],
      },
    ],
  };
}

const PRINT_CSS = `
  @media print {
    .no-print { display: none !important; }
    body { background: #fff !important; }
    .cb-section { box-shadow: none !important; border: 1px solid #ccc !important; page-break-inside: avoid; }
  }
  @media (max-width: 640px) {
    .cb-page { padding: 24px 16px 60px !important; }
    .cb-h1 { font-size: 26px !important; }
    .cb-picker { flex-direction: column; align-items: stretch !important; }
    .cb-picker select { width: 100% !important; min-width: 0 !important; }
    .cb-controls { flex-wrap: wrap; }
    .cb-section { padding: 16px !important; }
    .cb-table th.col-notes { display: none; }
    .cb-table td.notes-cell { display: none; }
  }
`;

export default function ChecklistBuilder() {
  const [allChecklists, setAllChecklists] = useState(getAll());
  const [currentId, setCurrentId] = useState(() => {
    const stored = localStorage.getItem(CURRENT_KEY);
    const all = getAll();
    if (stored && stored !== "NEW" && all[stored]) return stored;
    if (Object.keys(all).length > 0) {
      const sorted = Object.entries(all).sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0));
      return sorted[0][0];
    }
    return "NEW";
  });
  const [checklist, setChecklist] = useState(() => {
    const stored = localStorage.getItem(CURRENT_KEY);
    const all = getAll();
    if (stored && stored !== "NEW" && all[stored]) return all[stored];
    if (Object.keys(all).length > 0) {
      const sorted = Object.entries(all).sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0));
      return sorted[0][1];
    }
    return emptyChecklist();
  });
  const [toast, setToast] = useState(null);
  const dragSrcRef = useRef(null);

  // Inject font + print/responsive CSS
  useEffect(() => {
    const id = "cb-fonts-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
    const styleId = "cb-print-css";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = PRINT_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // Persist current id whenever it changes
  useEffect(() => {
    localStorage.setItem(CURRENT_KEY, currentId);
  }, [currentId]);

  // Auto-save every 30s if checklist is already saved
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentId === "NEW") return;
      const updated = { ...checklist, updated: Date.now() };
      const next = { ...allChecklists, [currentId]: updated };
      saveAll(next);
    }, 30000);
    return () => clearInterval(interval);
  }, [checklist, currentId, allChecklists]);

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  // ─── ACTIONS ───
  const handleSave = () => {
    const updated = { ...checklist, updated: Date.now() };
    let id = currentId;
    if (id === "NEW") id = uid();
    const next = { ...allChecklists, [id]: updated };
    if (saveAll(next)) {
      setAllChecklists(next);
      setCurrentId(id);
      showToast("Saved.", "success");
    } else {
      showToast("Save failed.", "danger");
    }
  };

  const handleNew = () => {
    const name = window.prompt("Name this new checklist:", "My new checklist");
    if (!name) return;
    setChecklist(emptyChecklist(name));
    setCurrentId("NEW");
    showToast("Started new checklist. Click Save to keep it.");
  };

  const handleSwitch = (id) => {
    if (!id || !allChecklists[id]) return;
    setCurrentId(id);
    setChecklist(allChecklists[id]);
  };

  const handleDelete = () => {
    if (currentId === "NEW") {
      showToast("Nothing saved to delete.");
      return;
    }
    const name = checklist.name || "this checklist";
    if (!window.confirm("Delete the saved checklist \"" + name + "\"?")) return;
    const next = { ...allChecklists };
    delete next[currentId];
    saveAll(next);
    setAllChecklists(next);
    if (Object.keys(next).length > 0) {
      const firstId = Object.keys(next)[0];
      setCurrentId(firstId);
      setChecklist(next[firstId]);
    } else {
      setCurrentId("NEW");
      setChecklist(emptyChecklist());
    }
    showToast("Deleted.", "danger");
  };

  // ─── STATE MUTATORS ───
  const updateName = (newName) => {
    setChecklist((c) => ({ ...c, name: newName }));
  };

  const addSection = () => {
    setChecklist((c) => ({
      ...c,
      sections: [
        ...c.sections,
        {
          id: uid(),
          name: "New Section",
          columns: [...DEFAULT_COLUMNS],
          items: [{ id: uid(), text: "New item", states: ["", ""], notes: "" }],
        },
      ],
    }));
  };

  const deleteSection = (sectionId) => {
    const sec = checklist.sections.find((s) => s.id === sectionId);
    if (!sec) return;
    if (!window.confirm("Delete section \"" + sec.name + "\"?")) return;
    setChecklist((c) => ({ ...c, sections: c.sections.filter((s) => s.id !== sectionId) }));
  };

  const updateSection = (sectionId, patch) => {
    setChecklist((c) => ({
      ...c,
      sections: c.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
    }));
  };

  const updateColumn = (sectionId, colIdx, newName) => {
    setChecklist((c) => ({
      ...c,
      sections: c.sections.map((s) => {
        if (s.id !== sectionId) return s;
        const cols = [...s.columns];
        cols[colIdx] = newName;
        return { ...s, columns: cols };
      }),
    }));
  };

  const addRow = (sectionId) => {
    setChecklist((c) => ({
      ...c,
      sections: c.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: [
            ...s.items,
            { id: uid(), text: "New item", states: new Array(s.columns.length).fill(""), notes: "" },
          ],
        };
      }),
    }));
  };

  const updateItem = (sectionId, itemId, patch) => {
    setChecklist((c) => ({
      ...c,
      sections: c.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: s.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
        };
      }),
    }));
  };

  const deleteRow = (sectionId, itemId) => {
    if (!window.confirm("Delete this row?")) return;
    setChecklist((c) => ({
      ...c,
      sections: c.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, items: s.items.filter((it) => it.id !== itemId) };
      }),
    }));
  };

  const cycleCircle = (sectionId, itemId, colIdx) => {
    setChecklist((c) => ({
      ...c,
      sections: c.sections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          items: s.items.map((it) => {
            if (it.id !== itemId) return it;
            const states = [...it.states];
            const cur = states[colIdx];
            const next = cur === "" ? "checked" : cur === "checked" ? "partial" : cur === "partial" ? "broken" : "";
            states[colIdx] = next;
            return { ...it, states };
          }),
        };
      }),
    }));
  };

  // ─── DRAG & DROP ───
  const onDragStart = (sectionId, itemId, e) => {
    dragSrcRef.current = { sectionId, itemId };
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e) => {
    e.preventDefault();
    const tr = e.currentTarget;
    const rect = tr.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    tr.classList.remove("cb-drag-top", "cb-drag-bottom");
    if (e.clientY < midY) tr.classList.add("cb-drag-top");
    else tr.classList.add("cb-drag-bottom");
  };

  const onDragLeave = (e) => {
    e.currentTarget.classList.remove("cb-drag-top", "cb-drag-bottom");
  };

  const onDrop = (sectionId, itemId, e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("cb-drag-top", "cb-drag-bottom");
    const src = dragSrcRef.current;
    if (!src) return;
    if (src.sectionId === sectionId && src.itemId === itemId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertBefore = e.clientY < midY;

    setChecklist((c) => {
      const sections = c.sections.map((s) => ({ ...s, items: [...s.items] }));
      const srcSec = sections.find((s) => s.id === src.sectionId);
      const dstSec = sections.find((s) => s.id === sectionId);
      if (!srcSec || !dstSec) return c;

      const srcIdx = srcSec.items.findIndex((it) => it.id === src.itemId);
      if (srcIdx === -1) return c;
      const [moved] = srcSec.items.splice(srcIdx, 1);

      // Adjust column count if moving across sections with different column counts
      if (moved.states.length !== dstSec.columns.length) {
        const newStates = new Array(dstSec.columns.length).fill("");
        for (let i = 0; i < Math.min(moved.states.length, dstSec.columns.length); i++) {
          newStates[i] = moved.states[i];
        }
        moved.states = newStates;
      }

      const dstIdx = dstSec.items.findIndex((it) => it.id === itemId);
      const insertAt = insertBefore ? dstIdx : dstIdx + 1;
      dstSec.items.splice(insertAt, 0, moved);
      return { ...c, sections };
    });
    dragSrcRef.current = null;
  };

  // ─── EDITABLE TEXT (uncontrolled contenteditable) ───
  const Editable = ({ value, onBlur, style, className, placeholder, multiline }) => {
    const ref = useRef(null);
    useEffect(() => {
      if (ref.current && ref.current.textContent !== value) {
        ref.current.textContent = value || "";
      }
    }, [value]);
    return (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={className}
        style={style}
        onBlur={(e) => {
          const text = e.currentTarget.textContent || "";
          if (text !== value) onBlur(text);
        }}
        data-placeholder={placeholder}
      />
    );
  };

  // ─── RENDER ───
  const sortedSavedIds = Object.entries(allChecklists)
    .sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0))
    .map(([id]) => id);

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      {/* TOP BAR */}
      <div className="no-print" style={{
        height: 56, background: S.slate, padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>
          CARES <span style={{ color: S.orange }}>Works.</span>
        </a>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>
          Build Your Own Checklist
        </span>
      </div>

      {/* PAGE */}
      <div className="cb-page" style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 32px 80px" }}>
        {/* BACK LINK */}
        <button
          className="no-print"
          onClick={() => navigate("/dashboard")}
          style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted,
            letterSpacing: "0.1em", background: "none", border: "none", cursor: "pointer",
            textTransform: "uppercase", marginBottom: 16, padding: 0,
          }}>
          ← Back to dashboard
        </button>

        {/* HEADING */}
        <h1 className="cb-h1" style={{
          fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.05,
          margin: "0 0 12px", color: S.ink,
        }}>
          Build Your Own <span style={{ fontStyle: "italic", color: S.orange }}>Checklist</span>
        </h1>
        <p style={{ fontSize: 16, color: S.muted, maxWidth: 720, margin: "0 0 8px", lineHeight: 1.5 }}>
          Make as many as you want. Click anything to edit. Drag rows to rearrange. Cycle the circles to track status. Notes column for the details that matter.
        </p>
        <p style={{
          fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 14,
          color: S.gold, margin: "12px 0 24px",
        }}>
          For the brain that has too many tabs open and not enough hands.
        </p>

        {/* PICKER */}
        <div className="cb-picker no-print" style={{
          background: S.slate, color: "#fff", padding: "18px 24px", borderRadius: 12,
          marginBottom: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.55)",
          }}>
            Active:
          </span>
          <Editable
            value={checklist.name}
            onBlur={updateName}
            style={{
              fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff",
              flex: 1, outline: "none", padding: "2px 6px", borderRadius: 4, minWidth: 200,
            }}
          />
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.55)",
          }}>
            Switch to:
          </span>
          <select
            value={currentId === "NEW" ? "" : currentId}
            onChange={(e) => handleSwitch(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.1)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
              padding: "8px 14px", fontFamily: "'Figtree', sans-serif", fontSize: 14,
              minWidth: 220, cursor: "pointer",
            }}>
            <option value="">— Saved checklists —</option>
            {sortedSavedIds.map((id) => (
              <option key={id} value={id} style={{ background: S.slate, color: "#fff" }}>
                {allChecklists[id].name || "Untitled"}
              </option>
            ))}
          </select>
          <button onClick={handleNew} style={subtleBtn()}>+ New</button>
          <button onClick={handleDelete} style={{ ...subtleBtn(), color: "#ffb3a0" }}>Delete current</button>
        </div>

        {/* CONTROLS */}
        <div className="cb-controls no-print" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={handleSave} style={{
            background: S.grad, color: "#fff", border: "none", padding: "10px 20px",
            borderRadius: 8, fontFamily: "'Figtree', sans-serif", fontSize: 13,
            fontWeight: 700, cursor: "pointer",
          }}>
            💾 Save Checklist
          </button>
          <button onClick={addSection} style={secondaryBtn()}>+ Add Section</button>
          <button onClick={() => window.print()} style={secondaryBtn()}>🖨️ Print</button>
        </div>

        {/* LEGEND */}
        <div className="no-print" style={{
          background: S.cream, borderRadius: 10, padding: "12px 18px",
          marginBottom: 22, fontSize: 13, display: "flex", gap: 24,
          flexWrap: "wrap", alignItems: "center", color: S.muted,
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace", fontSize: 10,
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Click circles to cycle:
          </span>
          <Legend label="Empty" state="" />
          <Legend label="Done" state="checked" />
          <Legend label="Partial" state="partial" />
          <Legend label="Broken / Missing" state="broken" />
        </div>

        {/* SECTIONS */}
        {checklist.sections.map((section) => (
          <div key={section.id} className="cb-section" style={{
            background: "#fff", border: "1px solid " + S.rule, borderRadius: 14,
            padding: "22px 26px", marginBottom: 22,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              borderBottom: "1px solid " + S.cream, paddingBottom: 10, marginBottom: 14,
            }}>
              <Editable
                value={section.name}
                onBlur={(v) => updateSection(section.id, { name: v })}
                style={{
                  fontFamily: "'DM Serif Display', serif", fontSize: 22, color: S.ink,
                  flex: 1, outline: "none", padding: "2px 6px", borderRadius: 4,
                }}
              />
              <button
                onClick={() => deleteSection(section.id)}
                className="no-print"
                style={{
                  background: "transparent", border: "1px solid " + S.rule,
                  borderRadius: 6, padding: "4px 10px", color: S.red,
                  fontSize: 12, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
                }}>
                🗑 Section
              </button>
            </div>

            <table className="cb-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="no-print" style={thStyle({ width: 28 })}></th>
                  <th style={thStyle({ width: "32%", textAlign: "left" })}>Item</th>
                  {section.columns.map((col, idx) => (
                    <th key={idx} style={thStyle({ width: "11%", textAlign: "center" })}>
                      <Editable
                        value={col}
                        onBlur={(v) => updateColumn(section.id, idx, v)}
                        style={{
                          display: "inline-block", outline: "none",
                          padding: "2px 6px", borderRadius: 4, minWidth: 40,
                        }}
                      />
                    </th>
                  ))}
                  <th className="col-notes" style={thStyle({ width: "28%", textAlign: "left" })}>Notes</th>
                  <th className="no-print" style={thStyle({ width: 40 })}></th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item) => (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={(e) => onDragStart(section.id, item.id, e)}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(section.id, item.id, e)}
                    style={{ borderBottom: "1px solid " + S.cream }}>
                    <td className="no-print" style={{
                      padding: 12, textAlign: "center", color: S.rule,
                      cursor: "grab", userSelect: "none", fontSize: 16,
                    }}>⋮⋮</td>
                    <td style={{ padding: 12, verticalAlign: "top" }}>
                      <Editable
                        value={item.text}
                        onBlur={(v) => updateItem(section.id, item.id, { text: v })}
                        style={{
                          outline: "none", padding: "4px 6px", borderRadius: 4,
                          fontSize: 14, color: S.ink, minHeight: 22, lineHeight: 1.5,
                        }}
                      />
                    </td>
                    {item.states.map((state, colIdx) => (
                      <td key={colIdx} style={{ padding: 12, textAlign: "center", verticalAlign: "top" }}>
                        <Circle state={state} onClick={() => cycleCircle(section.id, item.id, colIdx)} />
                      </td>
                    ))}
                    <td className="notes-cell" style={{ padding: 12, verticalAlign: "top" }}>
                      <Editable
                        value={item.notes}
                        onBlur={(v) => updateItem(section.id, item.id, { notes: v })}
                        placeholder="Add notes…"
                        style={{
                          outline: "none", padding: "4px 6px", borderRadius: 4,
                          fontSize: 13, color: S.muted, fontStyle: "italic",
                          minHeight: 22, lineHeight: 1.5,
                        }}
                      />
                    </td>
                    <td className="no-print" style={{ padding: 12, textAlign: "center" }}>
                      <button
                        onClick={() => deleteRow(section.id, item.id)}
                        title="Delete row"
                        style={{
                          background: "transparent", border: "none", color: S.rule,
                          cursor: "pointer", fontSize: 16, padding: "2px 8px",
                        }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="no-print">
                  <td
                    colSpan={4 + section.columns.length}
                    onClick={() => addRow(section.id)}
                    style={{
                      padding: 10, textAlign: "center", color: S.muted,
                      fontFamily: "'DM Mono', monospace", fontSize: 11,
                      textTransform: "uppercase", letterSpacing: "0.1em",
                      cursor: "pointer", background: S.paper,
                    }}>
                    + Add row
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* ADD SECTION BAR */}
        <div
          className="no-print"
          onClick={addSection}
          style={{
            textAlign: "center", color: S.muted,
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            textTransform: "uppercase", letterSpacing: "0.1em",
            cursor: "pointer", background: S.cream, padding: 18,
            borderRadius: 12, border: "1px dashed " + S.rule, marginBottom: 22,
          }}>
          + Add a Section
        </div>

        <div className="no-print" style={{
          textAlign: "center", marginTop: 40, padding: 24, color: S.muted,
          fontFamily: "'DM Serif Display', serif", fontStyle: "italic", fontSize: 13,
        }}>
          A free CARES Works tool. Saved in your browser, this device only.
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.type === "success" ? S.green : toast.type === "danger" ? S.red : S.slate,
          color: "#fff", padding: "14px 22px", borderRadius: 10, fontSize: 14,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000,
          fontFamily: "'Figtree', sans-serif",
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        .cb-drag-top { box-shadow: inset 0 2px 0 ${S.orange}; }
        .cb-drag-bottom { box-shadow: inset 0 -2px 0 ${S.orange}; }
        [contenteditable]:focus { background: ${S.orangeLight}; }
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: ${S.rule};
          font-style: italic;
        }
      `}</style>
    </div>
  );
}

function thStyle(extra) {
  return {
    background: "#f2ede3", padding: "10px 12px",
    fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500,
    color: "#7a7585", textTransform: "uppercase", letterSpacing: "0.1em",
    borderBottom: "1px solid #ddd8cc",
    ...(extra || {}),
  };
}

function subtleBtn() {
  return {
    background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 6, padding: "6px 12px", color: "rgba(255,255,255,0.85)",
    fontSize: 12, cursor: "pointer", fontFamily: "'Figtree', sans-serif",
  };
}

function secondaryBtn() {
  return {
    background: "#fff", color: "#1e1e2a", border: "1px solid #ddd8cc",
    padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", fontFamily: "'Figtree', sans-serif",
  };
}

function Circle({ state, onClick }) {
  const colors = {
    "": { bg: "#fff", border: "#7a7585", fg: "transparent", char: "" },
    checked: { bg: "#5a9a5a", border: "#5a9a5a", fg: "#fff", char: "✓" },
    partial: { bg: "#C9A84C", border: "#C9A84C", fg: "#fff", char: "~" },
    broken: { bg: "#c95f22", border: "#c95f22", fg: "#fff", char: "✗" },
  };
  const c = colors[state] || colors[""];
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-block", width: 22, height: 22,
        border: "2px solid " + c.border, borderRadius: "50%",
        background: c.bg, color: c.fg, cursor: "pointer",
        userSelect: "none", lineHeight: "18px", textAlign: "center",
        fontSize: 14, fontWeight: 700, transition: "all 0.15s",
      }}>
      {c.char}
    </span>
  );
}

function Legend({ label, state }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Circle state={state} onClick={() => {}} />
      <span>{label}</span>
    </span>
  );
}
