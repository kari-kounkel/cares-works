import { navigate } from "../App";
import { useState, useRef, useEffect } from "react";

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
  grad: "linear-gradient(135deg, #e8773a, #c95f22)",
};

const MOBILE_COURT = `
  @media (max-width: 640px) {
    .court-header { padding: 0 16px !important; }
    .court-page { padding: 28px 16px 60px !important; }
    .court-h1 { font-size: 26px !important; }
    .court-audio { padding: 18px 16px !important; }
    .court-pdf { height: 55vh !important; }
    .court-player-row { gap: 12px !important; }
  }
`;


const SUFFIX = " from COURT OF ACCOUNTS A Tale of Ledgers Loyalty and Fancy Chickens";

const CHAPTERS = {
  prologue: {
    label: "Prologue",
    title: "The Kingdom of Eggerton",
    pdf: "/pdf/CHAPTER 0 PROLOGUE" + SUFFIX + ".pdf",
    audio: "/audio/The Court of Accounts Prologue.mp3",
  },
  "chapter-1": {
    label: "Chapter 1",
    title: "The Kingdom of Eggerton",
    pdf: "/pdf/CHAPTER 1" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-2": {
    label: "Chapter 2",
    title: "Lady Delia and the Court",
    pdf: "/pdf/CHAPTER 2" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-3": {
    label: "Chapter 3",
    title: "The Record Keepers",
    pdf: "/pdf/CHAPTER 3" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-4": {
    label: "Chapter 4",
    title: "",
    pdf: "/pdf/CHAPTER 4" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-5": {
    label: "Chapter 5",
    title: "",
    pdf: "/pdf/CHAPTER 5" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-6": {
    label: "Chapter 6",
    title: "",
    pdf: "/pdf/CHAPTER 6" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-7": {
    label: "Chapter 7",
    title: "",
    pdf: "/pdf/CHAPTER 7" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-8": {
    label: "Chapter 8",
    title: "",
    pdf: "/pdf/CHAPTER 8" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-9": {
    label: "Chapter 9",
    title: "",
    pdf: "/pdf/CHAPTER 9" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-10": {
    label: "Chapter 10",
    title: "",
    pdf: "/pdf/CHAPTER 10" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-11": {
    label: "Chapter 11",
    title: "",
    pdf: "/pdf/CHAPTER 11" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-12": {
    label: "Chapter 12",
    title: "",
    pdf: "/pdf/CHAPTER 12" + SUFFIX + ".pdf",
    audio: null,
  },
  "chapter-13": {
    label: "Chapter 13",
    title: "",
    pdf: "/pdf/CHAPTER 13" + SUFFIX + ".pdf",
    audio: null,
  },
  epilogue: {
    label: "Epilogue",
    title: "",
    pdf: "/pdf/CHAPTER 14 EPILOGUE" + SUFFIX + ".pdf",
    audio: null,
  },
};

function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 1.0;
    const onTimeUpdate = () => { if (!dragging) setCurrentTime(audio.currentTime); };
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [dragging]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else { audio.play(); setPlaying(true); }
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  };

  const handleSeek = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div style={{ background: S.slate, borderRadius: 14, padding: "28px 32px", marginBottom: 32, display: "flex", flexDirection: "column", gap: 16 }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          style={{ width: 52, height: 52, borderRadius: "50%", background: S.grad, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 16px rgba(232,119,58,0.4)" }}>
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 2 }}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Progress + time */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>
              {formatTime(currentTime)}
            </span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em" }}>
              {formatTime(duration)}
            </span>
          </div>
          <div
            onClick={handleSeek}
            style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.15)", borderRadius: 100, cursor: "pointer", position: "relative" }}>
            <div style={{ width: progress + "%", height: "100%", background: S.grad, borderRadius: 100, transition: dragging ? "none" : "width 0.1s" }} />
            <div style={{ position: "absolute", top: "50%", left: progress + "%", transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: S.orange, border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
        Read along below — or just listen
      </div>
    </div>
  );
}

export default function CourtChapter({ slug }) {
  const chapter = CHAPTERS[slug];

  if (!chapter) {
    return (
      <div style={{ minHeight: "100vh", background: S.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Figtree', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: S.slate, marginBottom: 12 }}>Chapter not found.</div>
          <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} href="/dashboard" style={{ color: S.orange, fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em" }}>← Back to dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: S.paper, fontFamily: "'Figtree', sans-serif", color: S.ink }}>
      <style>{MOBILE_COURT}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=Figtree:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="court-header" style={{ background: S.slate, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, boxShadow: "0 2px 12px rgba(0,0,0,0.15)", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#fff", textDecoration: "none" }}>
          CARES <span style={{ color: S.orange }}>Works.</span>
        </a>
        <a onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }} href="/dashboard" style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textDecoration: "none" }}>
          ← Back to dashboard
        </a>
      </header>

      <div className="court-page" style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* CHAPTER LABEL + TITLE */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: S.orange, marginBottom: 10 }}>
            Court of Accounts — {chapter.label}
          </div>
          {chapter.title ? (
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: S.slate, margin: 0, lineHeight: 1.2 }}>
              {chapter.title}
            </h1>
          ) : null}
          <div style={{ marginTop: 16, width: 48, height: 3, background: S.grad, borderRadius: 100 }} />
        </div>

        {/* AUDIO PLAYER — only if audio exists */}
        {chapter.audio && <AudioPlayer src={chapter.audio} />}

        {/* PDF VIEWER */}
        <div style={{ background: "#fff", border: "1px solid " + S.rule, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
          <iframe
            src={chapter.pdf + "#toolbar=0&navpanes=0&scrollbar=1"}
            className="court-pdf" style={{ width: "100%", height: "82vh", border: "none", display: "block" }}
            title={chapter.label}
          />
        </div>

        {/* DOWNLOAD LINK */}
        <div style={{ marginTop: 20, textAlign: "right" }}>
          <a
            href={chapter.pdf}
            download
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: S.muted, letterSpacing: "0.08em", textDecoration: "none", borderBottom: "1px solid " + S.rule, paddingBottom: 2 }}>
            Download PDF ↓
          </a>
        </div>

      </div>
      <script src="https://chat.karikounkel.com/widget.js" defer></script>
    </div>
  );
}
