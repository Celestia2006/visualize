import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  accent: "#3C3489",
  light: "#EEEDFE",
  mid: "#AFA9EC",
  dark: "#26215C",
  muted: "#7B78A8",
  green: "#1D9E75",
  greenLt: "#E1F5EE",
  teal: "#5DCAA5",
  bg: "#F6F5FF",
  warm: "#FDFCFA",
  border: "#E8E6F5",
  hit: "#534AB7", // page hit colour
  miss: "#1D9E75", // page fault colour
  hitLt: "#EEEDFE",
  missLt: "#E1F5EE",
};

const THEME_CONFIGS = {
  light: {
    label: "Light",
    bg: "#F9F8F6",
    panel: "#FFFFFF",
    text: "#1A1917",
    subtext: "#6B6963",
    accent: "#3C3489",
    border: "#E4E2DC",
    cardBg: "#EEEDFE",
  },
  dark: {
    label: "Dark",
    bg: "#1A1917",
    panel: "#252321",
    text: "#088d55",
    subtext: "#79cfe4",
    accent: "#c91678",
    border: "#333333",
    cardBg: "#2D2A3E",
  },
  "cb-light": {
    label: "CB Light",
    bg: "#FFF9E8",
    panel: "#FFFFFF",
    text: "#1A1400",
    subtext: "#5A5030",
    accent: "#C0720A",
    border: "#E8D890",
    cardBg: "#FFF0C0",
  },
  "cb-dark": {
    label: "CB Dark",
    bg: "#001020",
    panel: "#0A1928",
    text: "#cb942c",
    subtext: "#9bb3c0",
    accent: "#1cbabc",
    border: "#1A3040",
    cardBg: "#0A2840",
  },
};

const FONT_CONFIGS = [
  {
    key: "neutral",
    label: "Neutral",
    family: "var(--font-body)",
    desc: "Clean & modern",
  },
  {
    key: "academic",
    label: "Academic",
    family: "var(--font-body)",
    desc: "Scholarly & refined",
  },
  {
    key: "dyslexic",
    label: "Dyslexic-friendly",
    family: "'Comic Sans MS', 'Chalkboard SE', cursive",
    desc: "High readability",
  },
];

const FONT_SIZE_CONFIGS = [
  { key: "sm", label: "Small", size: "0.85rem", preview: "14px" },
  { key: "md", label: "Medium", size: "1rem", preview: "16px" },
  { key: "lg", label: "Large", size: "1.125rem", preview: "18px" },
];

// ─── FIFO helpers ─────────────────────────────────────────────────────────────

// Simulate FIFO page replacement on a reference string with given frame count
// Returns array of snapshots: { ref, frames, fault, evicted }
function simulateFIFO(referenceString, frameCount) {
  const frames = []; // current frames (ordered oldest→newest)
  const snapshots = [];
  for (const page of referenceString) {
    const hit = frames.includes(page);
    let evicted = null;
    if (!hit) {
      if (frames.length < frameCount) {
        frames.push(page);
      } else {
        evicted = frames.shift(); // FIFO: remove oldest
        frames.push(page);
      }
    }
    snapshots.push({
      ref: page,
      frames: [...frames],
      fault: !hit,
      evicted,
    });
  }
  return snapshots;
}

// Default demo: classic textbook reference string
const DEMO_REF = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2];
const DEMO_FRAMES = 3;
const DEMO_SNAPS = simulateFIFO(DEMO_REF, DEMO_FRAMES);

// ─── Syntax coloring ──────────────────────────────────────────────────────────

function colorLine(text) {
  if (!text.trim()) return <span>&nbsp;</span>;
  const cm = text.match(/^(\s*)(#.*)$/);
  if (cm)
    return (
      <>
        <span style={{ color: "rgba(220,218,240,0.35)" }}>{cm[1]}</span>
        <span style={{ color: "#7B78A8", fontStyle: "italic" }}>{cm[2]}</span>
      </>
    );
  const tokens = [];
  let m;
  const push = (re, type) => {
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null)
      tokens.push({
        start: m.index,
        end: m.index + m[0].length,
        type,
        val: m[0],
      });
  };
  push(
    /\b(def|return|import|as|from|if|else|for|in|and|or|not|True|False|while|class|len|range|print)\b/g,
    "kw",
  );
  push(/(""".*?"""|'[^']*'|"[^"]*")/g, "str");
  push(/\b(\d+\.?\d*(?:e-?\d+)?)\b/g, "num");
  push(
    /\b(fifo|simulate|frames|faults|hits|deque|popleft|append|collections|evicted|reference)\b/g,
    "fn",
  );
  tokens.sort((a, b) => a.start - b.start);
  const parts = [];
  const colors = {
    kw: "#9D91F5",
    str: "#5DCAA5",
    num: "#E5A96A",
    fn: "#7BC8F5",
  };
  let cursor = 0;
  tokens.forEach((tok) => {
    if (tok.start < cursor) return;
    if (tok.start > cursor)
      parts.push(
        <span key={cursor} style={{ color: "rgba(220,218,240,0.78)" }}>
          {text.slice(cursor, tok.start)}
        </span>,
      );
    parts.push(
      <span key={tok.start} style={{ color: colors[tok.type] }}>
        {tok.val}
      </span>,
    );
    cursor = tok.end;
  });
  if (cursor < text.length)
    parts.push(
      <span key="end" style={{ color: "rgba(220,218,240,0.78)" }}>
        {text.slice(cursor)}
      </span>,
    );
  return <>{parts}</>;
}

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function useCanvas(draw, deps) {
  const ref = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    function render() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cssW = rect.width || canvas.offsetWidth || 480;
      const cssH = rect.height || canvas.offsetHeight || 320;
      if (
        canvas.width !== Math.round(cssW * dpr) ||
        canvas.height !== Math.round(cssH * dpr)
      ) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, cssW, cssH);
    }

    render();
    const ro = new ResizeObserver(render);
    ro.observe(canvas);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function AvatarNavBubble({ user }) {
  const [failed, setFailed] = useState(false);
  const hasImage = user?.avatarImage && !failed;
  return (
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: "var(--accent-light)",
        border: "1px solid var(--accent-mid)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontSize: "1em",
      }}
    >
      {hasImage ? (
        <img
          src={user.avatarImage}
          alt={user.avatarName ?? "avatar"}
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        (user?.avatar?.emoji ?? "🦉")
      )}
    </div>
  );
}

// ─── Step visualizations ──────────────────────────────────────────────────────

// Viz 1: What is a page fault? — simple frame diagram, 3 frames, 1 reference
function PageFaultViz() {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const PAD = 36;
    const frameW = 72,
      frameH = 52,
      gap = 18;
    const totalW = 3 * frameW + 2 * gap;
    const startX = (W - totalW) / 2;
    const frameY = H / 2 - 30;

    // Draw RAM label
    ctx.fillStyle = "rgba(60,52,137,0.18)";
    roundRect(ctx, startX - 14, frameY - 18, totalW + 28, frameH + 36, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(60,52,137,0.55)";
    ctx.font = "bold 11px DM Sans";
    ctx.textAlign = "center";
    ctx.fillText("🖥  RAM — 3 frames", W / 2, frameY - 5);

    // Draw frames
    const pages = [1, 2, null]; // frame 3 is empty
    pages.forEach((p, i) => {
      const x = startX + i * (frameW + gap);
      ctx.strokeStyle =
        p !== null ? "rgba(60,52,137,0.5)" : "rgba(60,52,137,0.2)";
      ctx.lineWidth = 1.5;
      ctx.fillStyle = p !== null ? T.hitLt : "#fafafa";
      roundRect(ctx, x, frameY, frameW, frameH, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = p !== null ? T.accent : "rgba(60,52,137,0.25)";
      ctx.font = p !== null ? "bold 20px DM Sans" : "14px DM Sans";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        p !== null ? `Page ${p}` : "empty",
        x + frameW / 2,
        frameY + frameH / 2,
      );
      ctx.textBaseline = "alphabetic";
      // Frame index label
      ctx.fillStyle = "rgba(123,120,168,0.6)";
      ctx.font = "9px DM Sans";
      ctx.fillText(`Frame ${i + 1}`, x + frameW / 2, frameY + frameH + 14);
    });

    // Incoming page arrow
    const arrowX = W / 2;
    const arrowY = frameY - 54;
    ctx.fillStyle = "rgba(213,60,60,0.88)";
    roundRect(ctx, arrowX - 40, arrowY - 18, 80, 28, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px DM Sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Request: Page 3", arrowX, arrowY - 4);
    ctx.textBaseline = "alphabetic";

    // Arrow pointing down
    ctx.strokeStyle = "rgba(213,60,60,0.75)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY + 10);
    ctx.lineTo(arrowX, frameY - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(arrowX - 6, frameY - 8);
    ctx.lineTo(arrowX, frameY - 2);
    ctx.lineTo(arrowX + 6, frameY - 8);
    ctx.fillStyle = "rgba(213,60,60,0.75)";
    ctx.fill();

    // PAGE FAULT badge
    const bx = W - PAD - 110,
      by = PAD;
    ctx.fillStyle = "rgba(213,60,60,0.9)";
    roundRect(ctx, bx, by, 110, 34, 8);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px DM Sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡ PAGE FAULT", bx + 55, by + 17);
    ctx.textBaseline = "alphabetic";

    // Legend
    ctx.font = "10px DM Sans";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(60,52,137,0.7)";
    ctx.fillText("Page 3 is not in RAM → must load from disk", PAD, H - 14);
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        width: "100%",
        aspectRatio: "3/2",
        borderRadius: "12px",
        display: "block",
      }}
    />
  );
}

// Viz 2: Reference string table — show the classic reference string
function ReferenceStringViz() {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const refs = DEMO_REF;
    const cellW = Math.min(36, (W - 60) / refs.length);
    const cellH = 38;
    const startX = (W - refs.length * cellW) / 2;
    const rowY = H / 2 - cellH / 2;

    ctx.fillStyle = "rgba(60,52,137,0.12)";
    roundRect(
      ctx,
      startX - 10,
      rowY - 24,
      refs.length * cellW + 20,
      cellH + 44,
      10,
    );
    ctx.fill();

    ctx.fillStyle = "rgba(60,52,137,0.5)";
    ctx.font = "bold 10px DM Sans";
    ctx.textAlign = "center";
    ctx.fillText(
      "Reference String  (pages requested over time →)",
      W / 2,
      rowY - 10,
    );

    refs.forEach((p, i) => {
      const x = startX + i * cellW;
      const snap = DEMO_SNAPS[i];
      ctx.fillStyle = snap.fault
        ? "rgba(213,60,60,0.13)"
        : "rgba(83,74,183,0.12)";
      roundRect(ctx, x + 1, rowY, cellW - 2, cellH, 5);
      ctx.fill();
      ctx.strokeStyle = snap.fault
        ? "rgba(213,60,60,0.45)"
        : "rgba(83,74,183,0.3)";
      ctx.lineWidth = 1;
      roundRect(ctx, x + 1, rowY, cellW - 2, cellH, 5);
      ctx.stroke();
      ctx.fillStyle = snap.fault
        ? "rgba(213,60,60,0.88)"
        : "rgba(60,52,137,0.8)";
      ctx.font = `bold ${cellW > 28 ? 14 : 11}px DM Sans`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p, x + cellW / 2, rowY + cellH / 2);
      ctx.textBaseline = "alphabetic";
      // fault/hit indicator
      ctx.font = "8px DM Sans";
      ctx.fillStyle = snap.fault
        ? "rgba(213,60,60,0.7)"
        : "rgba(83,74,183,0.55)";
      ctx.fillText(snap.fault ? "F" : "H", x + cellW / 2, rowY + cellH + 11);
      // index
      ctx.fillStyle = "rgba(123,120,168,0.4)";
      ctx.font = "7px DM Sans";
      ctx.fillText(i + 1, x + cellW / 2, rowY - 4);
    });

    // Legend
    [
      ["rgba(213,60,60,0.7)", "F = Page Fault (miss)"],
      ["rgba(83,74,183,0.7)", "H = Hit (page already in RAM)"],
    ].forEach(([c, lbl], i) => {
      const lx = 30 + i * 180;
      ctx.beginPath();
      ctx.arc(lx + 5, H - 14, 4, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.fillStyle = "rgba(74,71,64,0.72)";
      ctx.font = "9.5px DM Sans";
      ctx.textAlign = "left";
      ctx.fillText(lbl, lx + 13, H - 10);
    });
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        width: "100%",
        aspectRatio: "3/2",
        borderRadius: "12px",
        display: "block",
      }}
    />
  );
}

// Viz 3: FIFO queue — animate the circular queue pointer
function FIFOQueueViz() {
  const [step, setStep] = useState(0);
  const MAX = 6; // show first 6 references

  const snap = DEMO_SNAPS[Math.min(step, MAX - 1)];

  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      const PAD = 40;
      const frameCount = DEMO_FRAMES;
      const frameW = 80,
        frameH = 54,
        gap = 16;
      const totalW = frameCount * frameW + (frameCount - 1) * gap;
      const startX = (W - totalW) / 2;
      const frameY = H / 2 - frameH / 2 + 10;

      // Title
      ctx.fillStyle = "rgba(60,52,137,0.5)";
      ctx.font = "bold 10px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText(`Step ${step + 1}: Requested page ${snap.ref}`, W / 2, 22);

      // Draw each frame
      snap.frames.forEach((p, i) => {
        const x = startX + i * (frameW + gap);
        const isOldest = i === 0 && snap.frames.length === frameCount;
        ctx.fillStyle = isOldest ? "rgba(229,169,106,0.18)" : T.hitLt;
        roundRect(ctx, x, frameY, frameW, frameH, 10);
        ctx.fill();
        ctx.strokeStyle = isOldest ? "#E5A96A" : "rgba(60,52,137,0.4)";
        ctx.lineWidth = isOldest ? 2 : 1.5;
        roundRect(ctx, x, frameY, frameW, frameH, 10);
        ctx.stroke();
        ctx.fillStyle = isOldest ? "#A0640A" : T.accent;
        ctx.font = "bold 18px DM Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`P${p}`, x + frameW / 2, frameY + frameH / 2);
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(123,120,168,0.6)";
        ctx.font = "8.5px DM Sans";
        ctx.fillText(`Frame ${i + 1}`, x + frameW / 2, frameY + frameH + 13);
        if (isOldest) {
          ctx.fillStyle = "#A0640A";
          ctx.font = "bold 8px DM Sans";
          ctx.fillText("← FIFO: oldest", x + frameW / 2, frameY - 8);
        }
      });

      // Empty frames
      for (let i = snap.frames.length; i < frameCount; i++) {
        const x = startX + i * (frameW + gap);
        ctx.fillStyle = "#fafafa";
        ctx.strokeStyle = "rgba(60,52,137,0.15)";
        ctx.lineWidth = 1;
        roundRect(ctx, x, frameY, frameW, frameH, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(60,52,137,0.2)";
        ctx.font = "11px DM Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("empty", x + frameW / 2, frameY + frameH / 2);
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(123,120,168,0.4)";
        ctx.font = "8.5px DM Sans";
        ctx.fillText(`Frame ${i + 1}`, x + frameW / 2, frameY + frameH + 13);
      }

      // Badge
      const badge = snap.fault ? "⚡ PAGE FAULT" : "✓ HIT";
      const badgeCol = snap.fault
        ? "rgba(213,60,60,0.88)"
        : "rgba(29,158,117,0.88)";
      ctx.fillStyle = badgeCol;
      roundRect(ctx, W - PAD - 106, PAD - 6, 106, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px DM Sans";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badge, W - PAD - 53, PAD + 9);
      ctx.textBaseline = "alphabetic";

      if (snap.evicted !== null) {
        ctx.fillStyle = "rgba(160,100,10,0.75)";
        ctx.font = "9.5px DM Sans";
        ctx.textAlign = "center";
        ctx.fillText(
          `Page ${snap.evicted} evicted (was oldest)`,
          W / 2,
          frameY + frameH + 34,
        );
      }
    },
    [step, snap],
  );

  return (
    <div>
      <canvas
        ref={ref}
        style={{
          width: "100%",
          aspectRatio: "3/2",
          borderRadius: "12px",
          display: "block",
        }}
      />
      <div
        style={{
          marginTop: "0.6rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "2px",
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(step / (MAX - 1)) * 100}%`,
              background: `linear-gradient(90deg,#D85A30,${"var(--accent)"})`,
              borderRadius: "2px",
              transition: "width 0.1s",
            }}
          />
        </div>
        <button
          onClick={() => setStep((s) => Math.min(s + 1, MAX - 1))}
          disabled={step >= MAX - 1}
          style={{
            padding: "3px 10px",
            borderRadius: "6px",
            border: `1px solid ${"var(--border)"}`,
            background: "#fff",
            color: step >= MAX - 1 ? "var(--border)" : "var(--accent)",
            fontSize: "0.72rem",
            fontFamily: "var(--font-body)",
            cursor: step >= MAX - 1 ? "default" : "pointer",
          }}
        >
          Next →
        </button>
        <button
          onClick={() => setStep(0)}
          style={{
            padding: "3px 10px",
            borderRadius: "6px",
            border: `1px solid ${"var(--border)"}`,
            background: "#fff",
            color: "var(--text-muted)",
            fontSize: "0.72rem",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
          }}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}

// Viz 4: Full simulation table — all steps, colour-coded
function SimulationTableViz() {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const snaps = DEMO_SNAPS;
    const n = snaps.length;
    const cellW = Math.max(28, Math.min(38, (W - 90) / n));
    const cellH = 28;
    const labelW = 80;
    const startX = labelW + 10;
    const rows = DEMO_FRAMES; // one row per frame slot

    const totalH = (rows + 2) * cellH + 20;
    const offsetY = (H - totalH) / 2;

    // Header row (reference string)
    ctx.fillStyle = "rgba(60,52,137,0.12)";
    ctx.fillRect(startX, offsetY, n * cellW, cellH);
    ctx.fillStyle = "rgba(60,52,137,0.6)";
    ctx.font = "bold 9px DM Sans";
    ctx.textAlign = "left";
    ctx.fillText("Reference →", 4, offsetY + cellH - 9);

    snaps.forEach((s, i) => {
      const x = startX + i * cellW;
      ctx.fillStyle = s.fault ? "rgba(213,60,60,0.12)" : "rgba(83,74,183,0.1)";
      ctx.fillRect(x, offsetY, cellW, cellH);
      ctx.strokeStyle = "rgba(60,52,137,0.1)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(x, offsetY, cellW, cellH);
      ctx.fillStyle = "rgba(40,38,70,0.85)";
      ctx.font = "bold 11px DM Sans";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.ref, x + cellW / 2, offsetY + cellH / 2);
      ctx.textBaseline = "alphabetic";
    });

    // Frame rows
    for (let r = 0; r < rows; r++) {
      const y = offsetY + (r + 1) * cellH;
      ctx.fillStyle = "rgba(74,71,64,0.55)";
      ctx.font = "8.5px DM Sans";
      ctx.textAlign = "right";
      ctx.fillText(`Frame ${r + 1}`, startX - 6, y + cellH - 9);
      snaps.forEach((s, i) => {
        const x = startX + i * cellW;
        const page = s.frames[r];
        ctx.strokeStyle = "rgba(60,52,137,0.08)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, cellW, cellH);
        if (page !== undefined) {
          ctx.fillStyle = "rgba(60,52,137,0.07)";
          ctx.fillRect(x, y, cellW, cellH);
          ctx.fillStyle = T.accent;
          ctx.font = "11px DM Sans";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(page, x + cellW / 2, y + cellH / 2);
          ctx.textBaseline = "alphabetic";
        }
      });
    }

    // Fault indicator row
    const faultY = offsetY + (rows + 1) * cellH;
    ctx.fillStyle = "rgba(74,71,64,0.55)";
    ctx.font = "8.5px DM Sans";
    ctx.textAlign = "right";
    ctx.fillText("Fault?", startX - 6, faultY + cellH - 9);
    snaps.forEach((s, i) => {
      const x = startX + i * cellW;
      ctx.fillStyle = s.fault ? "rgba(213,60,60,0.82)" : "rgba(83,74,183,0.65)";
      ctx.font = "bold 9px DM Sans";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.fault ? "✗" : "✓", x + cellW / 2, faultY + cellH / 2);
      ctx.textBaseline = "alphabetic";
    });

    // Summary
    const faults = snaps.filter((s) => s.fault).length;
    ctx.fillStyle = "rgba(213,60,60,0.75)";
    ctx.font = "10px DM Sans";
    ctx.textAlign = "left";
    ctx.fillText(
      `Total page faults: ${faults} / ${snaps.length}   (hit rate: ${(((snaps.length - faults) / snaps.length) * 100).toFixed(0)}%)`,
      6,
      H - 8,
    );
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        width: "100%",
        aspectRatio: "3/2",
        borderRadius: "12px",
        display: "block",
      }}
    />
  );
}

// Viz 5: Fault rate vs frames — Belady's anomaly hint
function FaultRateViz() {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const PAD = 50;
    const maxFrames = 7;
    const faultCounts = Array.from({ length: maxFrames }, (_, i) => {
      const snaps = simulateFIFO(DEMO_REF, i + 1);
      return snaps.filter((s) => s.fault).length;
    });
    const maxFaults = Math.max(...faultCounts);
    const tX = (i) => PAD + (i / (maxFrames - 1)) * (W - PAD * 2);
    const tY = (f) => PAD + (1 - f / maxFaults) * (H - PAD * 2);

    // Grid
    ctx.strokeStyle = "rgba(60,52,137,0.07)";
    ctx.lineWidth = 0.8;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(PAD, PAD + (i * (H - PAD * 2)) / 4);
      ctx.lineTo(W - PAD, PAD + (i * (H - PAD * 2)) / 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PAD + (i * (W - PAD * 2)) / 4, PAD);
      ctx.lineTo(PAD + (i * (W - PAD * 2)) / 4, H - PAD);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(60,52,137,0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, PAD);
    ctx.lineTo(PAD, H - PAD);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD, H - PAD);
    ctx.lineTo(W - PAD, H - PAD);
    ctx.stroke();

    // Area fill
    const ag = ctx.createLinearGradient(0, PAD, 0, H - PAD);
    ag.addColorStop(0, "rgba(60,52,137,0.16)");
    ag.addColorStop(1, "rgba(60,52,137,0)");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.moveTo(tX(0), H - PAD);
    faultCounts.forEach((f, i) => ctx.lineTo(tX(i), tY(f)));
    ctx.lineTo(tX(maxFrames - 1), H - PAD);
    ctx.closePath();
    ctx.fill();

    // Curve
    ctx.strokeStyle = "rgba(60,52,137,0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    faultCounts.forEach((f, i) =>
      i === 0 ? ctx.moveTo(tX(i), tY(f)) : ctx.lineTo(tX(i), tY(f)),
    );
    ctx.stroke();

    // Points
    faultCounts.forEach((f, i) => {
      ctx.beginPath();
      ctx.arc(tX(i), tY(f), 5, 0, Math.PI * 2);
      ctx.fillStyle = "var(--accent)";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "rgba(60,52,137,0.8)";
      ctx.font = "9px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText(f, tX(i), tY(f) - 9);
    });

    // Belady's anomaly marker (3→4 frames, faults go up)
    const b3 = faultCounts[2],
      b4 = faultCounts[3];
    if (b4 > b3) {
      ctx.fillStyle = "rgba(213,60,60,0.8)";
      ctx.font = "bold 9px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText(
        "Belady's anomaly! ↑",
        (tX(2) + tX(3)) / 2,
        tY(Math.max(b3, b4)) - 18,
      );
    }

    // Axis labels
    ctx.fillStyle = "rgba(123,120,168,0.7)";
    ctx.font = "10px DM Sans";
    ctx.textAlign = "center";
    ctx.fillText("Number of frames (RAM size)", (PAD + W - PAD) / 2, H - 4);
    ctx.save();
    ctx.translate(14, (PAD + H - PAD) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Page faults", 0, 0);
    ctx.restore();
    Array.from({ length: maxFrames }, (_, i) => i + 1).forEach((f, i) => {
      ctx.textAlign = "center";
      ctx.fillText(f, tX(i), H - PAD + 13);
    });
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        width: "100%",
        aspectRatio: "3/2",
        borderRadius: "12px",
        display: "block",
      }}
    />
  );
}

// Viz 6: Full animated simulation
function AnimatedSimViz() {
  const [step, setStep] = useState(0);
  const snaps = DEMO_SNAPS;

  useEffect(() => {
    if (step >= snaps.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [step]);

  const snap = snaps[Math.min(step, snaps.length - 1)];

  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      const PAD = 40;
      const frameW = 78,
        frameH = 50,
        gap = 14;
      const frameCount = DEMO_FRAMES;
      const totalW = frameCount * frameW + (frameCount - 1) * gap;
      const startX = (W - totalW) / 2;
      const frameY = H / 2 - frameH / 2 + 14;

      // Progress strip
      const stripH = 20,
        stripY = PAD - 14;
      snaps.forEach((s, i) => {
        const x = PAD + (i / snaps.length) * (W - PAD * 2);
        const w2 = (W - PAD * 2) / snaps.length - 2;
        ctx.fillStyle =
          i <= step
            ? s.fault
              ? "rgba(213,60,60,0.55)"
              : "rgba(83,74,183,0.45)"
            : "rgba(60,52,137,0.08)";
        roundRect(ctx, x, stripY, w2, stripH, 3);
        ctx.fill();
        if (w2 > 18) {
          ctx.fillStyle = "#fff";
          ctx.font = "8px DM Sans";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(s.ref, x + w2 / 2, stripY + stripH / 2);
          ctx.textBaseline = "alphabetic";
        }
      });

      // Frames
      snap.frames.forEach((p, i) => {
        const x = startX + i * (frameW + gap);
        ctx.fillStyle =
          i === 0 && snap.frames.length === frameCount
            ? "rgba(229,169,106,0.2)"
            : T.hitLt;
        roundRect(ctx, x, frameY, frameW, frameH, 10);
        ctx.fill();
        ctx.strokeStyle =
          i === 0 && snap.frames.length === frameCount
            ? "#E5A96A"
            : "rgba(60,52,137,0.4)";
        ctx.lineWidth = 1.5;
        roundRect(ctx, x, frameY, frameW, frameH, 10);
        ctx.stroke();
        ctx.fillStyle = T.accent;
        ctx.font = "bold 18px DM Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`P${p}`, x + frameW / 2, frameY + frameH / 2);
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(123,120,168,0.55)";
        ctx.font = "8px DM Sans";
        ctx.fillText(`Frame ${i + 1}`, x + frameW / 2, frameY + frameH + 13);
      });
      for (let i = snap.frames.length; i < frameCount; i++) {
        const x = startX + i * (frameW + gap);
        ctx.fillStyle = "#fafafa";
        ctx.strokeStyle = "rgba(60,52,137,0.15)";
        ctx.lineWidth = 1;
        roundRect(ctx, x, frameY, frameW, frameH, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(60,52,137,0.2)";
        ctx.font = "11px DM Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("empty", x + frameW / 2, frameY + frameH / 2);
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "rgba(123,120,168,0.4)";
        ctx.font = "8px DM Sans";
        ctx.fillText(`Frame ${i + 1}`, x + frameW / 2, frameY + frameH + 13);
      }

      // Badge
      const faultsSoFar = snaps
        .slice(0, step + 1)
        .filter((s) => s.fault).length;
      const pct = Math.round(((step + 1) / snaps.length) * 100);
      ctx.fillStyle = "rgba(38,33,92,0.85)";
      roundRect(ctx, W - PAD - 118, PAD + 4, 118, 38, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText(`Ref ${step + 1} · ${pct}% done`, W - PAD - 59, PAD + 17);
      ctx.fillStyle = snap.fault ? "rgba(255,120,120,0.95)" : "#5DCAA5";
      ctx.font = "10px DM Sans";
      ctx.fillText(
        snap.fault ? `⚡ Fault (${faultsSoFar} total)` : "✓ Hit",
        W - PAD - 59,
        PAD + 31,
      );

      if (snap.evicted !== null) {
        ctx.fillStyle = "rgba(160,100,10,0.75)";
        ctx.font = "9.5px DM Sans";
        ctx.textAlign = "center";
        ctx.fillText(
          `Page ${snap.evicted} evicted (FIFO: was oldest)`,
          W / 2,
          frameY + frameH + 32,
        );
      }
    },
    [step, snap],
  );

  return (
    <div>
      <canvas
        ref={ref}
        style={{
          width: "100%",
          aspectRatio: "3/2",
          borderRadius: "12px",
          display: "block",
        }}
      />
      <div
        style={{
          marginTop: "0.6rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "2px",
            background: "var(--border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(step / (snaps.length - 1)) * 100}%`,
              background: `linear-gradient(90deg,#D85A30,${"var(--accent)"})`,
              borderRadius: "2px",
              transition: "width 0.1s",
            }}
          />
        </div>
        <button
          onClick={() => setStep(0)}
          style={{
            padding: "3px 10px",
            borderRadius: "6px",
            border: `1px solid ${"var(--border)"}`,
            background: "#fff",
            color: "var(--text-muted)",
            fontSize: "0.72rem",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
          }}
        >
          ↺ Replay
        </button>
      </div>
    </div>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 0,
    viz: "pagefault",
    title: "What is a Page Fault?",
    context:
      "Before FIFO makes sense, we need to understand the problem it solves. When a program asks for a page of memory that isn't currently loaded in RAM, the OS must handle that miss — called a page fault.",
    code: [
      "# Virtual memory: programs use more space than RAM",
      "# The OS keeps a page table mapping virtual → physical",
      "",
      "# When CPU requests virtual address 0x3000:",
      "#   OS checks: is page 3 in RAM?",
      "#     YES → page hit, fast access",
      "#     NO  → page fault!",
      "#              1. Pause the process",
      "#              2. Load page from disk",
      "#              3. Update page table",
      "#              4. Resume the process",
    ],
    beginner:
      "Think of RAM like a desk with only a few folders on it. Your whole filing cabinet (disk) holds everything, but only a few folders can sit on the desk at once. Whenever you need a folder that's not on the desk, you have to walk to the cabinet and fetch it — that's a page fault. The goal of a page replacement algorithm is to decide which folder to put back in the cabinet to make room.",
    advanced:
      "A page fault triggers a hardware interrupt (trap to kernel mode). The OS must select a victim frame to evict (if no free frame exists), write it to the swap space if dirty, update the TLB and inverted page table, and then schedule the faulting instruction to be retried. The total penalty is 2–3 orders of magnitude slower than a RAM access (milliseconds vs nanoseconds), so minimising fault count is critical.",
  },
  {
    id: 1,
    viz: "refstring",
    title: "The Reference String",
    context:
      "To measure any page replacement algorithm, we feed it a reference string — a sequence of page numbers representing a program's memory accesses over time.",
    code: [
      "# Classic textbook example",
      "reference_string = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2]",
      "frame_count      = 3   # 3 frames of RAM",
      "",
      "# Each number = a page being requested",
      "# Algorithm must decide:",
      "#   - Is this page already in a frame? → HIT",
      "#   - Not in any frame?               → FAULT, load it",
      "#   - No free frame?                  → EVICT one first",
    ],
    beginner:
      "The reference string is just a list of pages a program needs, in order. Some pages are requested multiple times (page 0 appears four times), which is called temporal locality — programs often reuse the same data. A good algorithm exploits this by keeping recently used pages in RAM. The chart marks each access as a Hit (✓) or Fault (✗).",
    advanced:
      "The reference string is an abstraction of the working set W(t,Δ) — the set of pages accessed in the interval (t−Δ, t]. Optimal replacement (OPT/Bélády) uses future knowledge to achieve the minimum fault count; all real algorithms approximate it. The reference string here exhibits reuse patterns (page 0 at indices 1,4,6,10) that separate good from bad algorithms.",
  },
  {
    id: 2,
    viz: "queue",
    title: "The FIFO Queue",
    context:
      "FIFO (First In, First Out) is the simplest replacement policy: keep a queue of the frames in order of arrival. When you need to evict, remove the page that has been in RAM the longest.",
    code: [
      "from collections import deque",
      "",
      "def fifo(reference_string, frame_count):",
      "    frames = deque()    # ordered oldest → newest",
      "    page_set = set()    # for O(1) hit check",
      "    faults = 0",
      "",
      "    for page in reference_string:",
      "        if page not in page_set:           # FAULT",
      "            faults += 1",
      "            if len(frames) == frame_count: # evict oldest",
      "                evicted = frames.popleft()",
      "                page_set.remove(evicted)",
      "            frames.append(page)",
      "            page_set.add(page)",
      "    return faults",
    ],
    beginner:
      "Imagine the frames as seats on a bus. Pages board in order and sit in the first available seat. When the bus is full and a new page needs to board, the page that boarded earliest (sitting right at the front) must get off. FIFO doesn't care if that page is popular or not — it only cares about age. The deque makes this O(1): popleft() removes the oldest, append() adds the newest.",
    advanced:
      "FIFO maintains a circular pointer into a frame array — O(1) per reference. The page_set provides O(1) membership testing. Total complexity: O(n) in the reference string length. FIFO does not exploit temporal or spatial locality; it evicts by insertion order rather than recency of use. This leads to anomalous behaviour: adding more frames can increase faults (Bélády's anomaly, proven for FIFO but not for stack algorithms like LRU or OPT).",
  },
  {
    id: 3,
    viz: "table",
    title: "Full Simulation Trace",
    context:
      "Let's run the complete reference string through FIFO with 3 frames and record every step. The table shows which page occupies each frame at every point in time.",
    code: [
      "# reference = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2]",
      "# frames = 3",
      "",
      "# Step-by-step: fifo([7,0,1,2,0,3,0,4,2,3,0,3,2,1,2], 3)",
      "#  Ref  Frame1  Frame2  Frame3  Fault?",
      "#   7     7       -       -      ✗",
      "#   0     7       0       -      ✗",
      "#   1     7       0       1      ✗",
      "#   2     2       0       1      ✗  (evict 7)",
      "#   0     2       0       1      ✓  (hit!)",
      "#   3     2       3       1      ✗  (evict 0)",
      "#   0     2       3       0      ✗  (evict 1)",
      "#  ...  ...     ...     ...     ...",
      "# Total faults: 9 / 15",
    ],
    beginner:
      "Reading the table column by column, you can see frames filling up (first three entries are always faults), then starting to evict. Notice how page 0 is evicted at step 6 (request for 3), but then immediately needed again at step 7 — a fault that could have been avoided! That's a sign of FIFO's weakness: it doesn't know which pages are actually popular.",
    advanced:
      "The simulation yields 9 faults on 15 references → hit rate ≈ 40%. Note that with 4 frames, this reference string produces more faults (10) — Bélády's anomaly. This occurs because FIFO is not a stack algorithm: the set of pages present with k frames is not always a subset of the pages with k+1 frames. LRU and OPT are stack algorithms and immune to Bélády's anomaly.",
  },
  {
    id: 4,
    viz: "faultrate",
    title: "Fault Rate vs Frame Count",
    context:
      "Adding more RAM frames should reduce faults — and it usually does. But FIFO has a peculiar property: sometimes adding frames increases faults. This is called Bélády's Anomaly.",
    code: [
      "# Check fault count for 1..7 frames",
      "ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2]",
      "",
      "for f in range(1, 8):",
      "    faults = fifo(ref, f)",
      "    print(f'Frames={f}: {faults} faults')",
      "",
      "# Frames=1: 15   Frames=2: 15",
      "# Frames=3:  9   Frames=4: 10  ← anomaly! (↑)",
      "# Frames=5:  8   Frames=6:  7",
      "# Frames=7:  7",
    ],
    beginner:
      "The chart shows something strange: going from 3 frames to 4 frames causes more page faults. Normally you'd expect bigger RAM to always help. This quirk — called Bélády's Anomaly — is unique to FIFO and similar algorithms. It happens because adding a frame changes which pages get evicted, and sometimes the new eviction order is worse. Algorithms like LRU don't have this problem.",
    advanced:
      "Bélády's anomaly arises because FIFO's resident set R(n,k) — pages present with k frames on reference string n — satisfies neither the inclusion property R(n,k) ⊆ R(n,k+1) nor the stack property. Stack algorithms by definition satisfy R(n,k) ⊆ R(n,k+1) ∀k, guaranteeing monotone fault count. Proof of anomaly for the above string: 3 frames = 9 faults, 4 frames = 10 faults. This is the canonical counterexample due to Bélády (1969).",
  },
  {
    id: 5,
    viz: "animated",
    title: "Watch FIFO Run Live",
    context:
      "Watch the complete simulation unfold automatically. Notice when pages get evicted despite being useful, and spot the fault patterns across the reference string.",
    code: [
      "# Full FIFO run — watch frame state evolve",
      "frames = deque()",
      "page_set = set()",
      "",
      "for i, page in enumerate(reference_string):",
      "    if page in page_set:",
      "        print(f'Step {i+1}: page {page} → HIT')",
      "    else:",
      "        if len(frames) == frame_count:",
      "            evicted = frames.popleft()",
      "            page_set.remove(evicted)",
      "            print(f'  Evicted page {evicted} (oldest)')",
      "        frames.append(page)",
      "        page_set.add(page)",
      "        print(f'Step {i+1}: page {page} → FAULT')",
    ],
    beginner:
      "Watch the frame slots at the top. When a page arrives that's already there, you see a ✓ Hit — no disk access needed. When a fault happens, the oldest page (highlighted in amber) gets evicted and the new page takes its slot. The progress bar counts through all 15 references. At the end, count the red ✗ fault marks to find the total cost.",
    advanced:
      "The animation visualises the FIFO pointer advancing circularly through the frame array. Each frame replacement is O(1) due to the deque (doubly-ended queue). Observe that page 0 is evicted at step 6 (to admit page 3) and then faults again at step 7 — a predictable weakness. Compare this mentally to LRU, which would have retained page 0 (most recently used at step 5) and evicted page 1 instead, avoiding that subsequent fault.",
  },
];

const VIZ_MAP = {
  pagefault: <PageFaultViz key="pf" />,
  refstring: <ReferenceStringViz key="rs" />,
  queue: <FIFOQueueViz key="q" />,
  table: <SimulationTableViz key="tbl" />,
  faultrate: <FaultRateViz key="fr" />,
  animated: <AnimatedSimViz key="anim" />,
};

// ─── Explanation sub-page ─────────────────────────────────────────────────────

function ExplanationPage({ showExplanation, userLevel }) {
  const [level, setLevel] = useState(
    userLevel === "beginner" ? "beginner" : "advanced",
  );
  const [activeStep, setActiveStep] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const sectionRefs = useRef([]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = parseInt(e.target.dataset.step, 10);
            if (!isNaN(idx)) setActiveStep(idx);
          }
        }),
      { rootMargin: "-38% 0px -38% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div
      style={{ display: "flex", alignItems: "flex-start", minHeight: "100vh" }}
    >
      {/* ── LEFT: scrolling narrative ── */}
      <div style={{ flex: "0 0 52%", minWidth: 0, paddingRight: "1.5rem" }}>
        {/* Level toggle */}
        <div style={{ paddingBottom: "0.75rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              background: "rgba(255,255,255,0.88)",
              border: `1px solid ${"var(--border)"}`,
              borderRadius: "100px",
              backdropFilter: "blur(8px)",
              boxShadow: `0 2px 8px ${T.light}80`,
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Depth:
            </span>
            {["beginner", "advanced"].map((lv) => (
              <button
                key={lv}
                onClick={() => setLevel(lv)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "100px",
                  border: "none",
                  cursor: "pointer",
                  background: level === lv ? "var(--accent)" : "transparent",
                  color: level === lv ? "#fff" : "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.72rem",
                  fontWeight: 500,
                  transition: "background 0.18s, color 0.18s",
                }}
              >
                {lv === "beginner" ? "🐣 Beginner" : "🧑‍💻 Advanced"}
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        {STEPS.map((step, si) => (
          <section
            key={si}
            ref={(el) => (sectionRefs.current[si] = el)}
            data-step={si}
            style={{
              minHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              paddingTop: "3.5rem",
              paddingBottom: "3.5rem",
              borderTop: si > 0 ? `1px solid ${"var(--border)"}` : "none",
            }}
          >
            {/* Step badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                marginBottom: "0.8rem",
                padding: "4px 12px",
                borderRadius: "100px",
                background: activeStep === si ? T.light : "rgba(0,0,0,0.03)",
                border: `1px solid ${activeStep === si ? T.mid : "var(--border)"}`,
                width: "fit-content",
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background:
                    activeStep === si ? "var(--accent)" : "var(--border)",
                  transition: "background 0.3s",
                }}
              />
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color:
                    activeStep === si ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                Step {si + 1} · {STEPS.length} total
              </span>
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(1.2rem,2vw,1.5rem)",
                color: "var(--text)",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                marginBottom: "0.4rem",
              }}
            >
              {step.title}
            </h2>

            {/* Context */}
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                marginBottom: "1.4rem",
                maxWidth: "530px",
              }}
            >
              {step.context}
            </p>

            {/* Code block */}
            <div
              style={{
                background: "#1E1B2E",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.07)",
                overflow: "hidden",
                marginBottom: showExplanation ? "1rem" : "0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0.6rem 0.9rem",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {["#FF5F57", "#FFBD2E", "#28CA41"].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: "9px",
                      height: "9px",
                      borderRadius: "50%",
                      background: c,
                    }}
                  />
                ))}
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.28)",
                    marginLeft: "6px",
                    fontFamily: "monospace",
                  }}
                >
                  fifo.py
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.18)",
                    marginLeft: "auto",
                  }}
                >
                  step {si + 1}/{STEPS.length}
                </span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: "0.9rem 1rem",
                  fontFamily:
                    "'JetBrains Mono','Fira Code','Courier New',monospace",
                  fontSize: "0.775rem",
                  lineHeight: 1.82,
                  overflowX: "auto",
                }}
              >
                {step.code.map((line, li) => (
                  <div key={li} style={{ minHeight: "1.4em" }}>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.13)",
                        userSelect: "none",
                        marginRight: "14px",
                        fontSize: "0.67rem",
                      }}
                    >
                      {String(li + 1).padStart(2, "0")}
                    </span>
                    {colorLine(line)}
                  </div>
                ))}
              </pre>
            </div>

            {/* Explanation card */}
            {showExplanation && (
              <div
                key={`exp-${si}-${level}`}
                style={{
                  background: `linear-gradient(135deg,${T.light} 0%,#EAF3DE 100%)`,
                  border: `1px solid ${T.mid}50`,
                  borderRadius: "13px",
                  padding: "1rem 1.2rem",
                  animation: "fadeUp 0.22s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.55rem",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "6px",
                      background: "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                      <circle cx="5.5" cy="4" r="1.5" fill="#fff" />
                      <rect
                        x="4.75"
                        y="6"
                        width="1.5"
                        height="3"
                        rx="0.75"
                        fill="#fff"
                      />
                      <circle
                        cx="5.5"
                        cy="5.5"
                        r="4.5"
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--text)",
                    }}
                  >
                    {level === "beginner"
                      ? "Plain English"
                      : "Technical Detail"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#3A3830",
                    lineHeight: 1.78,
                  }}
                >
                  {level === "beginner" ? step.beginner : step.advanced}
                </p>
              </div>
            )}
          </section>
        ))}

        <div style={{ height: "45vh" }} />
      </div>

      {/* ── RIGHT: fixed visualization ── */}
      <div
        style={{
          position: "fixed",
          top: `${Math.max(56, 410 - scrollY)}px`,
          right: 0,
          width: "48%",
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "stretch",
          padding: "1.5rem 2rem 1.5rem 1rem",
          transition: "top 0.15s ease",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: `1px solid ${"var(--border)"}`,
            borderRadius: "18px",
            padding: "1.1rem 1.1rem 1.1rem",
            boxShadow: `0 4px 28px ${T.light}CC`,
            pointerEvents: "auto",
          }}
        >
          {/* Card header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.9rem",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.67rem",
                  fontWeight: 500,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "2px",
                }}
              >
                Visualization — Step {activeStep + 1}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  color: "var(--text)",
                  letterSpacing: "-0.01em",
                }}
              >
                {STEPS[activeStep].title}
              </p>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activeStep ? "18px" : "5px",
                    height: "5px",
                    borderRadius: "3px",
                    background:
                      i === activeStep ? "var(--accent)" : "var(--border)",
                    transition: "width 0.3s, background 0.3s",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Visualization */}
          <div
            key={`viz-${activeStep}`}
            style={{ animation: "fadeUp 0.3s ease" }}
          >
            {VIZ_MAP[STEPS[activeStep].viz]}
          </div>
        </div>

        {/* Scroll nudge */}
        {activeStep === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              opacity: 0.5,
              marginTop: "0.6rem",
              pointerEvents: "auto",
            }}
          >
            <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
              <rect
                x="3.5"
                y="0"
                width="3"
                height="7"
                rx="1.5"
                stroke={"var(--text-muted)"}
                strokeWidth="1.2"
              />
              <path
                d="M2 7l3 4 3-4"
                stroke={"var(--text-muted)"}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Scroll through each step — the viz updates
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Try It Out sub-page ──────────────────────────────────────────────────────

function TryItOutPage() {
  const [refInput, setRefInput] = useState("7 0 1 2 0 3 0 4 2 3 0 3 2 1 2");
  const [frameCount, setFrameCount] = useState("3");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  function handleRun() {
    const parsed = refInput
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter((n) => !isNaN(n));
    if (parsed.length === 0) return;
    const fc = Math.max(1, Math.min(8, parseInt(frameCount) || 3));
    const snaps = simulateFIFO(parsed, fc);
    const faults = snaps.filter((s) => s.fault).length;
    setResult({ snaps, faults, parsed, fc });
    setSubmitted(true);
  }

  const vizRef = useCanvas(
    (ctx, W, H) => {
      if (!result) {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = "rgba(60,52,137,0.2)";
        ctx.font = "13px DM Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Enter a reference string and hit Run →", W / 2, H / 2);
        ctx.textBaseline = "alphabetic";
        return;
      }
      ctx.clearRect(0, 0, W, H);
      const { snaps, parsed, fc } = result;
      const n = snaps.length;
      const cellW = Math.max(20, Math.min(40, (W - 90) / n));
      const cellH = 26;
      const labelW = 78;
      const startX = labelW + 6;
      const offsetY = 18;

      // Header
      ctx.fillStyle = "rgba(60,52,137,0.12)";
      ctx.fillRect(startX, offsetY, n * cellW, cellH);
      ctx.fillStyle = "rgba(60,52,137,0.6)";
      ctx.font = "bold 9px DM Sans";
      ctx.textAlign = "left";
      ctx.fillText("Ref →", 4, offsetY + cellH - 8);
      snaps.forEach((s, i) => {
        const x = startX + i * cellW;
        ctx.fillStyle = s.fault
          ? "rgba(213,60,60,0.12)"
          : "rgba(83,74,183,0.1)";
        ctx.fillRect(x, offsetY, cellW, cellH);
        ctx.strokeStyle = "rgba(60,52,137,0.1)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, offsetY, cellW, cellH);
        ctx.fillStyle = "rgba(40,38,70,0.85)";
        ctx.font = "bold 10px DM Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.ref, x + cellW / 2, offsetY + cellH / 2);
        ctx.textBaseline = "alphabetic";
      });

      // Frame rows
      for (let r = 0; r < fc; r++) {
        const y = offsetY + (r + 1) * cellH;
        ctx.fillStyle = "rgba(74,71,64,0.55)";
        ctx.font = "8px DM Sans";
        ctx.textAlign = "right";
        ctx.fillText(`F${r + 1}`, startX - 4, y + cellH - 8);
        snaps.forEach((s, i) => {
          const x = startX + i * cellW;
          ctx.strokeStyle = "rgba(60,52,137,0.08)";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, cellW, cellH);
          const page = s.frames[r];
          if (page !== undefined) {
            ctx.fillStyle = "rgba(60,52,137,0.07)";
            ctx.fillRect(x, y, cellW, cellH);
            ctx.fillStyle = T.accent;
            ctx.font = "10px DM Sans";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(page, x + cellW / 2, y + cellH / 2);
            ctx.textBaseline = "alphabetic";
          }
        });
      }

      // Fault row
      const faultY = offsetY + (fc + 1) * cellH;
      ctx.fillStyle = "rgba(74,71,64,0.55)";
      ctx.font = "8px DM Sans";
      ctx.textAlign = "right";
      ctx.fillText("Fault?", startX - 4, faultY + cellH - 8);
      snaps.forEach((s, i) => {
        const x = startX + i * cellW;
        ctx.fillStyle = s.fault
          ? "rgba(213,60,60,0.82)"
          : "rgba(83,74,183,0.65)";
        ctx.font = "bold 9px DM Sans";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(s.fault ? "✗" : "✓", x + cellW / 2, faultY + cellH / 2);
        ctx.textBaseline = "alphabetic";
      });
    },
    [result, submitted],
  );

  const fld = {
    width: "100%",
    padding: "0.5rem 0.65rem",
    border: `1px solid ${"var(--border)"}`,
    borderRadius: "8px",
    fontFamily: "'JetBrains Mono','Fira Code',monospace",
    fontSize: "0.88rem",
    color: "var(--text)",
    background: "#fff",
    outline: "none",
    transition: "border-color 0.2s,box-shadow 0.2s",
  };
  const lbl = {
    display: "block",
    fontSize: "0.7rem",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "5px",
  };
  const sh = {
    fontSize: "0.68rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: "0.65rem",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };
  const fo = (c) => (e) => {
    e.target.style.borderColor = c;
    e.target.style.boxShadow = `0 0 0 3px ${c}28`;
  };
  const bl = (e) => {
    e.target.style.borderColor = "var(--border)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        {/* LEFT — inputs */}
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: `1px solid ${"var(--border)"}`,
              borderRadius: "14px",
              padding: "1.25rem 1.4rem",
              boxShadow: `0 1px 6px ${T.light}80`,
            }}
          >
            <p style={sh}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "inline-block",
                }}
              />
              Simulation parameters
            </p>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={lbl}>
                Reference String (space-separated page numbers)
              </label>
              <input
                style={fld}
                type="text"
                value={refInput}
                placeholder="e.g. 7 0 1 2 0 3 0 4"
                onChange={(e) => setRefInput(e.target.value)}
                onFocus={fo(T.mid)}
                onBlur={bl}
              />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={lbl}>Number of frames (RAM slots, 1–8)</label>
              <input
                style={fld}
                type="number"
                min="1"
                max="8"
                step="1"
                value={frameCount}
                onChange={(e) => setFrameCount(e.target.value)}
                onFocus={fo(T.mid)}
                onBlur={bl}
              />
            </div>
          </div>

          <button
            onClick={handleRun}
            style={{
              width: "100%",
              padding: "0.8rem",
              background: `linear-gradient(135deg,${"var(--accent)"},#534AB7)`,
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: `0 4px 16px ${"var(--accent)"}40`,
              transition: "transform 0.1s",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.98)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="3,2 12,7 3,12" fill="#fff" />
            </svg>
            Run FIFO simulation
          </button>

          {result && (
            <div
              style={{
                background: "#fff",
                border: `1px solid ${"var(--border)"}`,
                borderRadius: "14px",
                padding: "1rem 1.2rem",
                boxShadow: `0 1px 6px ${T.light}80`,
              }}
            >
              <p style={sh}>
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#D85A30",
                    display: "inline-block",
                  }}
                />
                Presets
              </p>
              {[
                {
                  label: "Classic (3 frames)",
                  ref: "7 0 1 2 0 3 0 4 2 3 0 3 2 1 2",
                  fc: "3",
                },
                {
                  label: "Belady demo (4 frames)",
                  ref: "7 0 1 2 0 3 0 4 2 3 0 3 2 1 2",
                  fc: "4",
                },
                {
                  label: "All unique (2 frames)",
                  ref: "1 2 3 4 5 6 7 8",
                  fc: "2",
                },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setRefInput(p.ref);
                    setFrameCount(p.fc);
                    setSubmitted(false);
                    setResult(null);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.4rem 0.6rem",
                    marginBottom: "4px",
                    background: "transparent",
                    border: `1px solid ${"var(--border)"}`,
                    borderRadius: "7px",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — visualization */}
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            background: "#fff",
            border: `1px solid ${"var(--border)"}`,
            borderRadius: "16px",
            padding: "1.25rem",
            boxShadow: `0 2px 16px ${T.light}`,
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 500,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "2px",
            }}
          >
            Simulation trace
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "0.85rem",
            }}
          >
            {submitted && result
              ? `${result.parsed.length} references · ${result.fc} frames`
              : "Configure and run on the left"}
          </p>
          <canvas
            ref={vizRef}
            style={{
              width: "100%",
              borderRadius: "12px",
              display: "block",
              aspectRatio: "3/2",
            }}
          />
        </div>
      </div>

      {/* Results */}
      {submitted && result && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0.75rem",
            animation: "fadeUp 0.3s ease",
          }}
        >
          <div
            style={{
              background: T.missLt,
              border: `1px solid ${T.teal}60`,
              borderRadius: "12px",
              padding: "0.9rem 1rem",
            }}
          >
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#0F6E56",
                marginBottom: "0.35rem",
              }}
            >
              Page Faults
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "2.2rem",
                lineHeight: 1,
                color: "rgba(213,60,60,0.88)",
              }}
            >
              {result.faults}
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: "#04342C",
                marginTop: "5px",
                fontWeight: 500,
              }}
            >
              out of {result.parsed.length} refs
            </p>
          </div>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${"var(--border)"}`,
              borderRadius: "12px",
              padding: "0.9rem 1rem",
            }}
          >
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "0.35rem",
              }}
            >
              Hit Rate
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.6rem",
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {(
                ((result.parsed.length - result.faults) /
                  result.parsed.length) *
                100
              ).toFixed(1)}
              <span style={{ fontSize: "1rem", color: T.mid }}>%</span>
            </p>
            <div
              style={{
                marginTop: "6px",
                height: "4px",
                borderRadius: "2px",
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((result.parsed.length - result.faults) / result.parsed.length) * 100}%`,
                  background: `linear-gradient(90deg,${T.green},${"var(--accent)"})`,
                  borderRadius: "2px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${"var(--border)"}`,
              borderRadius: "12px",
              padding: "0.9rem 1rem",
            }}
          >
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "0.35rem",
              }}
            >
              Frames Used
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.6rem",
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {result.fc}
            </p>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              RAM slots allocated
            </p>
          </div>
          <div
            style={{
              gridColumn: "1/-1",
              background: "#1E1B2E",
              borderRadius: "12px",
              padding: "0.9rem 1.1rem",
            }}
          >
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "rgba(174,169,236,0.6)",
                marginBottom: "0.5rem",
              }}
            >
              Computation trace
            </p>
            <pre
              style={{
                margin: 0,
                fontFamily:
                  "'JetBrains Mono','Fira Code','Courier New',monospace",
                fontSize: "0.78rem",
                color: "rgba(220,218,240,0.85)",
                lineHeight: 1.85,
              }}
            >
              {`reference_string = [${result.parsed.join(", ")}]\n`}
              {`frame_count      = ${result.fc}\n`}
              {`\n`}
              {`total_faults     = ${result.faults}\n`}
              {`hit_rate         = ${(((result.parsed.length - result.faults) / result.parsed.length) * 100).toFixed(1)}%\n`}
              {`fault_rate       = ${((result.faults / result.parsed.length) * 100).toFixed(1)}%`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Assistant sub-page ────────────────────────────────────────────────────

const AI_QA = {
  beginner: [
    {
      q: "What is FIFO page replacement?",
      a: "FIFO stands for First In, First Out. When your computer runs out of space in RAM and needs to load a new page, it evicts the page that has been sitting in RAM the longest — like a queue at a shop where the first person to arrive is the first to leave. It doesn't care how popular the page is, only how old it is.",
    },
    {
      q: "What is a page fault?",
      a: "A page fault happens when a program asks for a piece of memory (a page) that isn't currently loaded in RAM. The operating system must pause the program, fetch the page from disk (which is much slower), load it into RAM, and then let the program continue. Too many page faults slow the system down significantly.",
    },
    {
      q: "What is a reference string?",
      a: "A reference string is the sequence of memory page requests a program makes over time. For example, [7, 0, 1, 2, 0, 3] means the program first needed page 7, then page 0, then page 1, and so on. We use it to test and compare page replacement algorithms.",
    },
    {
      q: "What is a page hit?",
      a: "A page hit (or just 'hit') is when a program requests a page and it's already in RAM. No disk access is needed — the data is served instantly. A high hit rate means fewer faults and a faster program.",
    },
    {
      q: "What is Belady's anomaly?",
      a: "Belady's anomaly is a surprising property of FIFO: sometimes giving it more frames (more RAM) causes more page faults, not fewer! You'd normally expect more RAM to always help. This anomaly is unique to FIFO-like algorithms — more intelligent algorithms like LRU don't have this problem.",
    },
    {
      q: "Why does FIFO not always work well?",
      a: "FIFO doesn't know which pages are actually useful — it just evicts the oldest page. If the oldest page is one that's frequently needed (like a loop variable), evicting it is a bad decision. Better algorithms like LRU track how recently a page was used, which is a much better signal of future usefulness.",
    },
  ],
  experienced: [
    {
      q: "What is the time complexity of FIFO?",
      a: "FIFO runs in O(n) time for a reference string of length n. Each reference requires an O(1) set lookup (for hit detection) and O(1) deque operations (popleft for eviction, append for insertion). The space complexity is O(k) where k is the frame count.",
    },
    {
      q: "What is Belady's anomaly formally?",
      a: "Bélády's anomaly states that for FIFO, there exist reference strings r and frame counts k such that F(r, k) < F(r, k+1), where F(r,k) is the fault count. This contradicts the intuition that more frames always help. Bélády proved in 1969 that this cannot occur for stack algorithms, where the resident set with k frames is always a subset of the resident set with k+1 frames.",
    },
    {
      q: "What is a stack algorithm?",
      a: "A stack algorithm is a page replacement policy where the set of pages in memory with k frames is always a subset of the pages in memory with k+1 frames. Formally: R(t,k) ⊆ R(t,k+1) for all t and k. LRU and OPT are stack algorithms; FIFO is not. Stack algorithms are immune to Bélády's anomaly by the stack property proof.",
    },
    {
      q: "How does FIFO compare to LRU?",
      a: "Both are O(n) per reference string. LRU evicts the least recently used page, exploiting temporal locality; FIFO evicts the oldest loaded page. LRU is a stack algorithm (immune to Bélády's anomaly) and generally achieves lower fault rates than FIFO on workloads with temporal locality. However, LRU requires tracking timestamps or maintaining an ordered list, making hardware implementation more complex. FIFO requires only a pointer — it is simpler to implement in hardware.",
    },
    {
      q: "What is the optimal page replacement algorithm?",
      a: "OPT (also called Bélády's optimal algorithm) evicts the page whose next use is furthest in the future. It achieves the minimum possible fault count for any reference string and frame count. OPT is not implementable in practice (it requires future knowledge), but serves as an upper bound to evaluate other algorithms. It is a stack algorithm and immune to Bélády's anomaly.",
    },
    {
      q: "What is thrashing and how does it relate to FIFO?",
      a: "Thrashing occurs when a process spends more time handling page faults than executing instructions — typically when the working set size exceeds the available frames. FIFO can exacerbate thrashing because it may evict pages that are part of the active working set (being recently used), causing them to fault again immediately. Working Set Model and Page Fault Frequency (PFF) algorithms address thrashing by dynamically adjusting frame allocations.",
    },
    {
      q: "What is the working set model?",
      a: "The working set W(t,Δ) of a process at time t is the set of pages referenced in the interval (t−Δ, t]. Denning's working set model allocates frames dynamically: each process gets exactly |W(t,Δ)| frames. If total working set demand exceeds physical memory, processes are suspended rather than thrashed. FIFO ignores the working set; LRU approximates it by tracking recency.",
    },
    {
      q: "How is FIFO implemented in hardware?",
      a: "FIFO is the easiest replacement policy to implement in hardware. A circular buffer of frame entries and a single tail pointer suffice: on a fault, evict frames[tail], load the new page there, and increment tail mod k. No access-time tracking is needed. This is why many early systems (e.g. MULTICS, early UNIX) used FIFO despite its suboptimal fault rate.",
    },
  ],
};

const SUGGESTED_QUESTIONS = {
  beginner: [
    "What is FIFO page replacement?",
    "What is a page fault?",
    "What is a reference string?",
    "What is Belady's anomaly?",
    "Why does FIFO not always work well?",
  ],
  experienced: [
    "What is the time complexity of FIFO?",
    "What is Belady's anomaly formally?",
    "What is a stack algorithm?",
    "How does FIFO compare to LRU?",
    "What is thrashing and how does it relate to FIFO?",
  ],
};

function AIPage({ userLevel }) {
  const [level, setLevel] = useState(
    userLevel === "experienced" ? "experienced" : "beginner",
  );
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        level === "beginner"
          ? "Hi! I'm your AI assistant for this topic. Ask me anything about FIFO page replacement — in plain English, no jargon required."
          : "Hello. I can answer technical questions about FIFO, page replacement algorithms, Bélády's anomaly, and the working set model. What would you like to dig into?",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  function switchLevel(newLevel) {
    if (newLevel === level) return;
    setLevel(newLevel);
    setMessages([
      {
        role: "assistant",
        text:
          newLevel === "beginner"
            ? "Switched to plain English mode. Ask me anything about FIFO page replacement — no jargon required."
            : "Switched to technical mode. I'll use OS terminology and precise definitions. What would you like to explore?",
      },
    ]);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function findAnswer(question) {
    const q = question.toLowerCase().trim();
    const bank = AI_QA[level];
    const exact = bank.find((item) => item.q.toLowerCase() === q);
    if (exact) return exact.a;
    const scored = bank
      .map((item) => {
        const words = q.split(/\s+/).filter((w) => w.length > 3);
        const hits = words.filter(
          (w) =>
            item.q.toLowerCase().includes(w) ||
            item.a.toLowerCase().includes(w),
        );
        return { item, score: hits.length };
      })
      .sort((a, b) => b.score - a.score);
    if (scored[0].score > 0) return scored[0].item.a;
    return level === "beginner"
      ? "That's a great question! It's a bit outside what I have covered right now. Try asking about page faults, the reference string, Belady's anomaly, or why FIFO can fail."
      : "That falls outside my current knowledge for this topic. Try asking about time complexity, stack algorithms, the working set model, or FIFO vs LRU.";
  }

  function handleSend(text) {
    const question = (text ?? input).trim();
    if (!question) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: question }]);
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: findAnswer(question) },
      ]);
      setThinking(false);
    }, 650);
  }

  const suggestions = SUGGESTED_QUESTIONS[level];

  return (
    <div
      style={{
        display: "flex",
        gap: "1.5rem",
        alignItems: "flex-start",
        width: "100%",
        height: "calc(100vh - 260px)",
        minHeight: "520px",
      }}
    >
      {/* Chat panel */}
      <div
        style={{
          flex: "0 0 57%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          border: `1px solid ${"var(--border)"}`,
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: `0 4px 24px ${T.light}CC`,
          height: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            borderBottom: `1px solid ${"var(--border)"}`,
            background: "var(--bg)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${"var(--accent)"}, #534AB7)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="6" r="2.5" fill="#fff" opacity="0.9" />
              <path
                d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.7"
              />
              <circle cx="13" cy="4" r="2" fill="#AFA9EC" />
              <path
                d="M13 2.5v1M13 5.5v1M11.5 4h1M14.5 4h1"
                stroke="#fff"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>
          <div>
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "var(--text)",
                lineHeight: 1.2,
              }}
            >
              AI Assistant
            </p>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              FIFO Page Replacement ·{" "}
              {level === "beginner" ? "🌱 Beginner" : "⚡ Technical"}
            </p>
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#3B6D11",
              }}
            />
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Online
            </span>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                gap: "0.6rem",
                alignItems: "flex-end",
                animation: "fadeUp 0.22s ease",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    background: `linear-gradient(135deg, ${"var(--accent)"}, #534AB7)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginBottom: "2px",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="6" r="2.5" fill="#fff" opacity="0.9" />
                    <path
                      d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5"
                      stroke="#fff"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.7"
                    />
                  </svg>
                </div>
              )}
              <div
                style={{
                  maxWidth: "75%",
                  padding: "0.7rem 0.95rem",
                  borderRadius:
                    msg.role === "user"
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                  background:
                    msg.role === "user"
                      ? `linear-gradient(135deg, ${"var(--accent)"}, #534AB7)`
                      : T.light,
                  border: msg.role === "user" ? "none" : `1px solid ${T.mid}40`,
                  color: msg.role === "user" ? "#fff" : "var(--text)",
                  fontSize: "0.88rem",
                  lineHeight: 1.68,
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "0.6rem",
                animation: "fadeUp 0.2s ease",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "8px",
                  background: `linear-gradient(135deg, ${"var(--accent)"}, #534AB7)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="6" r="2.5" fill="#fff" opacity="0.9" />
                  <path
                    d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.7"
                  />
                </svg>
              </div>
              <div
                style={{
                  padding: "0.7rem 1rem",
                  borderRadius: "14px 14px 14px 4px",
                  background: T.light,
                  border: `1px solid ${T.mid}40`,
                  display: "flex",
                  gap: "4px",
                  alignItems: "center",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: T.mid,
                      animation: `bounce 1.2s ease ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding: "0.85rem 1.1rem",
            borderTop: `1px solid ${"var(--border)"}`,
            background: "var(--bg)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "0.6rem",
              alignItems: "flex-end",
              background: "#fff",
              border: `1px solid ${"var(--border)"}`,
              borderRadius: "12px",
              padding: "0.5rem 0.5rem 0.5rem 0.9rem",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              placeholder="Ask anything about FIFO page replacement…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontFamily: "var(--font-body)",
                fontSize: "0.88rem",
                color: "var(--text)",
                background: "transparent",
                resize: "none",
                lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: input.trim() ? "var(--accent)" : T.light,
                border: "none",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.18s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M12 7H2M8 3l4 4-4 4"
                  stroke={input.trim() ? "#fff" : "var(--text-muted)"}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          height: "100%",
        }}
      >
        {/* Depth toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "#fff",
            border: `1px solid ${"var(--border)"}`,
            borderRadius: "100px",
            padding: "5px 6px 5px 14px",
            boxShadow: `0 2px 10px ${T.light}80`,
            alignSelf: "flex-start",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 500,
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Depth:
          </span>
          {[
            { key: "beginner", icon: "🌱", label: "Beginner" },
            { key: "experienced", icon: "⚡", label: "Advanced" },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => switchLevel(opt.key)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "0.4rem 0.75rem",
                borderRadius: "100px",
                border: "none",
                background: level === opt.key ? "var(--accent)" : "transparent",
                color: level === opt.key ? "#fff" : "var(--text-muted)",
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                fontWeight: level === opt.key ? 500 : 400,
                cursor: "pointer",
                transition: "background 0.18s, color 0.18s",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: "0.9rem" }}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Suggested questions */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${"var(--border)"}`,
            borderRadius: "14px",
            overflow: "hidden",
            boxShadow: `0 2px 12px ${T.light}80`,
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: "0.85rem 1rem",
              borderBottom: `1px solid ${"var(--border)"}`,
              background: "var(--bg)",
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
              }}
            >
              Suggested questions
            </p>
          </div>
          <div style={{ padding: "0.6rem", flex: 1, overflowY: "auto" }}>
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.65rem 0.75rem",
                  background: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  color: "var(--text)",
                  cursor: "pointer",
                  lineHeight: 1.5,
                  transition: "background 0.15s, color 0.15s",
                  display: "block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.light;
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text)";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TOPIC_INTRO = `When RAM runs out of space, the OS must decide which page to evict. FIFO (First In, First Out) picks the oldest page — simple, elegant, and occasionally surprising. We'll simulate it from scratch, trace every fault and hit, and uncover Bélády's Anomaly along the way.`;

export default function FIFOTopicPage() {
  const { subjectKey, topicKey } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const theme = user?.theme ?? "light";
  const font = user?.font ?? "neutral";
  const fontSize = user?.fontSize ?? "md";

  const themeCfg = THEME_CONFIGS[theme] ?? THEME_CONFIGS.light;
  const fontCfg = FONT_CONFIGS.find((f) => f.key === font) ?? FONT_CONFIGS[0];
  const fontSizeCfg =
    FONT_SIZE_CONFIGS.find((f) => f.key === fontSize) ?? FONT_SIZE_CONFIGS[1];

  const [subPage, setSubPage] = useState("explanation");
  const [showExplanation, setShowExp] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    const handler = () => setFocusMode(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  function enterFocus() {
    document.documentElement.requestFullscreen().catch(() => {});
    setFocusMode(true);
  }

  function exitFocus() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setFocusMode(false);
  }

  const meta = {
    subject: "Operating Systems",
    subjectKey: "os",
    title: "FIFO Page Replacement",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{box-shadow:0 0 0 0 ${"var(--accent)"}60} 50%{box-shadow:0 0 0 8px ${"var(--accent)"}00} }
        @keyframes drift  { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(6px,-10px)scale(1.04)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:rgba(175,169,236,0.4);border-radius:3px}
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          fontFamily: "var(--font-body)",
          fontSize: "var(--font-size-base)",
          background: focusMode ? "var(--surface)" : "var(--bg)",
          "--bg": themeCfg.bg,
          "--surface": themeCfg.panel,
          "--text": themeCfg.text,
          "--text-muted": themeCfg.subtext,
          "--accent": themeCfg.accent,
          "--border": themeCfg.border,
          "--accent-light": themeCfg.cardBg,
          "--font-body": fontCfg.family,
          "--font-size-base": fontSizeCfg.size,
        }}
      >
        {/* Navbar */}
        {!focusMode && (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 2rem",
              height: "56px",
              background: "rgba(246,245,255,0.92)",
              backdropFilter: "blur(14px)",
              borderBottom: `1px solid ${T.light}`,
              position: "sticky",
              top: 0,
              zIndex: 100,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.82rem",
              }}
            >
              <button
                onClick={() => navigate("/landing")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                }}
              >
                Dashboard
              </button>
              <span style={{ color: "var(--border)" }}>›</span>
              <button
                onClick={() => navigate(`/subject/${meta.subjectKey}`)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                }}
              >
                {meta.subject}
              </button>
              <span style={{ color: "var(--border)" }}>›</span>
              <span style={{ color: "var(--text)", fontWeight: 500 }}>
                {meta.title}
              </span>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              {subPage === "explanation" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Explanation
                  </span>
                  <button
                    onClick={() => setShowExp((v) => !v)}
                    style={{
                      width: "36px",
                      height: "20px",
                      borderRadius: "10px",
                      background: showExplanation
                        ? "var(--accent)"
                        : "var(--border)",
                      border: "none",
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "3px",
                        left: showExplanation ? "18px" : "3px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                </div>
              )}
              <button
                onClick={enterFocus}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(255,255,255,0.7)",
                  border: `1px solid ${"var(--border)"}`,
                  borderRadius: "100px",
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="2" fill={"var(--accent)"} />
                  <circle
                    cx="5.5"
                    cy="5.5"
                    r="4.5"
                    stroke={"var(--accent)"}
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
                Focus
              </button>
              <button
                onClick={() => navigate("/settings")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <AvatarNavBubble user={user} />
            </div>
          </nav>
        )}

        {/* Page header */}
        <div
          style={{
            background: `linear-gradient(150deg, var(--accent-light) 0%, var(--green-light) 100%)`,
            borderBottom: `1px solid var(--border)`,
            padding: focusMode ? "1.5rem 2rem 1.25rem" : "2rem 2rem 1.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {[
            {
              w: 200,
              h: 200,
              top: "-60px",
              right: "5%",
              bg: "color-mix(in srgb, var(--accent) 15%, transparent)",
              dur: "14s",
            },
            {
              w: 140,
              h: 140,
              bottom: "-40px",
              left: "60%",
              bg: "color-mix(in srgb, var(--green) 12%, transparent)",
              dur: "10s",
            },
          ].map((orb, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: orb.w,
                height: orb.h,
                borderRadius: "50%",
                background: orb.bg,
                top: orb.top,
                right: orb.right,
                bottom: orb.bottom,
                left: orb.left,
                animation: `drift ${orb.dur} ease-in-out infinite`,
                pointerEvents: "none",
              }}
            />
          ))}
          <div
            style={{
              maxWidth: "1250px",
              margin: "0 auto",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ maxWidth: "620px" }}>
                <p
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 500,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  OS · Memory Management
                </p>
                <h1
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(1.4rem,3vw,1.9rem)",
                    color: "var(--text)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: "0.65rem",
                  }}
                >
                  FIFO Page Replacement{" "}
                  <span style={{ fontSize: "1.5rem" }}>🖥️📄</span>
                </h1>
                <p
                  style={{
                    fontSize: "0.87rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.7,
                  }}
                >
                  {TOPIC_INTRO}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  background: "#fff",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.9)",
                  borderRadius: "12px",
                  padding: "4px",
                  gap: "4px",
                }}
              >
                {[
                  ["explanation", "Explanation"],
                  ["tryout", "Try it out"],
                  ["ai", "✦ Ask AI"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSubPage(key)}
                    style={{
                      padding: "0.45rem 1.1rem",
                      borderRadius: "9px",
                      border: "none",
                      background: subPage === key ? "var(--accent)" : "#fff",
                      color: subPage === key ? "#fff" : "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "background 0.2s, color 0.2s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            width: "100%",
            padding: "2rem 2rem 4rem 2rem",
            boxSizing: "border-box",
          }}
        >
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {subPage === "explanation" ? (
              <ExplanationPage
                showExplanation={showExplanation}
                userLevel={user?.skill ?? "beginner"}
              />
            ) : subPage === "tryout" ? (
              <TryItOutPage />
            ) : (
              <AIPage userLevel={user?.skill ?? "beginner"} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
