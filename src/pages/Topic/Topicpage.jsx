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
  dog: "#534AB7",
  cat: "#1D9E75",
  dogLt: "#EEEDFE",
  catLt: "#E1F5EE",
};

// ─── Math helpers ─────────────────────────────────────────────────────────────

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}
function logisticPredict(x1, x2, w1, w2, b) {
  return sigmoid(w1 * x1 + w2 * x2 + b);
}

// Stable dataset: x1 = ear pointiness, x2 = fur fluffiness
// Dogs: high on both. Cats: low on both.
const FIXED_POINTS = [
  // Dogs (label 1)
  { x1: 2.8, x2: 3.1, label: 1 },
  { x1: 3.4, x2: 2.5, label: 1 },
  { x1: 1.9, x2: 3.6, label: 1 },
  { x1: 3.0, x2: 1.8, label: 1 },
  { x1: 2.3, x2: 2.9, label: 1 },
  { x1: 3.7, x2: 3.3, label: 1 },
  { x1: 1.5, x2: 2.1, label: 1 },
  { x1: 2.6, x2: 3.8, label: 1 },
  { x1: 3.9, x2: 2.2, label: 1 },
  { x1: 2.1, x2: 1.6, label: 1 },
  { x1: 3.2, x2: 3.0, label: 1 },
  { x1: 1.8, x2: 2.7, label: 1 },
  { x1: 4.0, x2: 1.5, label: 1 },
  { x1: 2.7, x2: 4.1, label: 1 },
  { x1: 3.5, x2: 2.8, label: 1 },
  // Cats (label 0)
  { x1: -1.5, x2: -2.8, label: 0 },
  { x1: -2.9, x2: -1.4, label: 0 },
  { x1: -0.9, x2: -3.2, label: 0 },
  { x1: -2.4, x2: -2.1, label: 0 },
  { x1: -3.0, x2: -0.8, label: 0 },
  { x1: -1.1, x2: -1.9, label: 0 },
  { x1: -2.7, x2: -2.9, label: 0 },
  { x1: -0.6, x2: -2.5, label: 0 },
  { x1: -3.3, x2: -1.7, label: 0 },
  { x1: -1.8, x2: -0.5, label: 0 },
  { x1: -2.1, x2: -3.1, label: 0 },
  { x1: -0.4, x2: -1.3, label: 0 },
  { x1: -2.6, x2: -0.9, label: 0 },
  { x1: -1.3, x2: -2.3, label: 0 },
  { x1: -3.5, x2: -2.0, label: 0 },
];

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
    /\b(def|return|import|as|from|if|else|for|in|and|or|not|True|False)\b/g,
    "kw",
  );
  push(/(""".*?"""|'[^']*'|"[^"]*")/g, "str");
  push(/\b(\d+\.?\d*(?:e-?\d+)?)\b/g, "num");
  push(
    /\b(np|sigmoid|predict|log_loss|train_step|clip|dot|mean|log|exp|len|zeros|array)\b/g,
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

function drawGrid(ctx, W, H, PAD, RANGE) {
  const tX = (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (W - PAD * 2);
  const tY = (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (H - PAD * 2);
  ctx.strokeStyle = "rgba(60,52,137,0.07)";
  ctx.lineWidth = 0.8;
  for (let v = -4; v <= 4; v += 2) {
    ctx.beginPath();
    ctx.moveTo(tX(v), PAD);
    ctx.lineTo(tX(v), H - PAD);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PAD, tY(v));
    ctx.lineTo(W - PAD, tY(v));
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(60,52,137,0.2)";
  ctx.lineWidth = 1;
  const cx = tX(0),
    cy = tY(0);
  ctx.beginPath();
  ctx.moveTo(cx, PAD);
  ctx.lineTo(cx, H - PAD);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(PAD, cy);
  ctx.lineTo(W - PAD, cy);
  ctx.stroke();
  ctx.fillStyle = "rgba(123,120,168,0.65)";
  ctx.font = "9px DM Sans,system-ui";
  ctx.textAlign = "center";
  ctx.fillText("ear pointiness →", (PAD + W - PAD) / 2, H - 5);
  ctx.save();
  ctx.translate(11, (PAD + H - PAD) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("fur fluffiness →", 0, 0);
  ctx.restore();
}

function drawEmojis(ctx, points, tX, tY, size = "14px", alpha = 1) {
  points.forEach((pt) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${size} serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pt.label === 1 ? "🐶" : "🐱", tX(pt.x1), tY(pt.x2));
    ctx.restore();
  });
}

function drawLegend(ctx, W, H, PAD, withBoundary = false) {
  const ly = H - 13;
  [
    ["#534AB7", "🐶 Dog"],
    [T.cat, "🐱 Cat"],
  ].forEach(([c, lbl], i) => {
    const lx = PAD + i * 90;
    ctx.beginPath();
    ctx.arc(lx + 5, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.fillStyle = "rgba(74,71,64,0.72)";
    ctx.font = "10px DM Sans";
    ctx.textAlign = "left";
    ctx.fillText(lbl, lx + 13, ly + 3.5);
  });
  if (withBoundary) {
    const bx = PAD + 192;
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = "rgba(60,52,137,0.65)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, ly - 4);
    ctx.lineTo(bx + 20, ly - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(60,52,137,0.65)";
    ctx.font = "10px DM Sans";
    ctx.textAlign = "left";
    ctx.fillText("boundary", bx + 24, ly + 3.5);
  }
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

function drawHeatmap(ctx, W, H, PAD, RANGE, w1, w2, bias) {
  const img = ctx.createImageData(W, H);
  for (let px = 0; px < W; px++) {
    for (let py = 0; py < H; py++) {
      const x1 = ((px - PAD) / (W - PAD * 2)) * RANGE * 2 - RANGE;
      const x2 = ((py - PAD) / (H - PAD * 2)) * RANGE * 2 - RANGE;
      if (px < PAD || px > W - PAD || py < PAD || py > H - PAD) continue;
      const p = logisticPredict(x1, x2, w1, w2, bias);
      const idx = (py * W + px) * 4;
      if (p > 0.5) {
        img.data[idx] = 60 + Math.round((p - 0.5) * 2 * 70);
        img.data[idx + 1] = 52 + Math.round((p - 0.5) * 2 * 20);
        img.data[idx + 2] = 137 + Math.round((p - 0.5) * 2 * 40);
        img.data[idx + 3] = Math.round((p - 0.5) * 2 * 58) + 10;
      } else {
        img.data[idx] = 29;
        img.data[idx + 1] = 158 + Math.round((0.5 - p) * 2 * 30);
        img.data[idx + 2] = 117 + Math.round((0.5 - p) * 2 * 40);
        img.data[idx + 3] = Math.round((0.5 - p) * 2 * 58) + 10;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawBoundaryLine(
  ctx,
  W,
  H,
  PAD,
  RANGE,
  w1,
  w2,
  bias,
  color = "rgba(60,52,137,0.88)",
  lw = 2.5,
) {
  if (Math.abs(w2) < 0.001) return;
  const tY = (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (H - PAD * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  let started = false;
  for (let px = PAD; px <= W - PAD; px++) {
    const x1 = ((px - PAD) / (W - PAD * 2)) * RANGE * 2 - RANGE;
    const x2 = -(w1 * x1 + bias) / w2;
    const cy = tY(x2);
    if (cy < PAD || cy > H - PAD) {
      started = false;
      continue;
    }
    if (!started) {
      ctx.moveTo(px, cy);
      started = true;
    } else ctx.lineTo(px, cy);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

// ─── Step visualizations ──────────────────────────────────────────────────────

function SigmoidViz() {
  const W = 480,
    H = 300,
    PAD = 50;
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const tX = (z) => PAD + ((z + 6) / 12) * (W - PAD * 2);
    const tY = (p) => PAD + (1 - p) * (H - PAD * 2);
    // Grid
    ctx.strokeStyle = "rgba(60,52,137,0.07)";
    ctx.lineWidth = 0.8;
    for (let z = -6; z <= 6; z += 2) {
      ctx.beginPath();
      ctx.moveTo(tX(z), PAD);
      ctx.lineTo(tX(z), H - PAD);
      ctx.stroke();
    }
    for (let p = 0; p <= 1; p += 0.25) {
      ctx.beginPath();
      ctx.moveTo(PAD, tY(p));
      ctx.lineTo(W - PAD, tY(p));
      ctx.stroke();
    }
    // Shaded halves
    ctx.fillStyle = "rgba(83,74,183,0.06)";
    ctx.fillRect(tX(0), PAD, W - PAD - tX(0), H - PAD * 2);
    ctx.fillStyle = "rgba(29,158,117,0.06)";
    ctx.fillRect(PAD, PAD, tX(0) - PAD, H - PAD * 2);
    // Zone labels
    ctx.font = "12px DM Sans";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(83,74,183,0.45)";
    ctx.fillText("🐶 Dog zone", tX(3), PAD + 20);
    ctx.fillStyle = "rgba(29,158,117,0.45)";
    ctx.fillText("🐱 Cat zone", tX(-3), PAD + 20);
    // 0.5 threshold
    ctx.strokeStyle = "rgba(120,120,120,0.28)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD, tY(0.5));
    ctx.lineTo(W - PAD, tY(0.5));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(100,100,100,0.5)";
    ctx.font = "9px DM Sans";
    ctx.textAlign = "right";
    ctx.fillText("p = 0.5 (boundary)", W - PAD - 4, tY(0.5) - 5);
    // Curve
    const grad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
    grad.addColorStop(0, T.cat);
    grad.addColorStop(1, T.dog);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = PAD; px <= W - PAD; px++) {
      const z = ((px - PAD) / (W - PAD * 2)) * 12 - 6;
      px === PAD
        ? ctx.moveTo(px, tY(sigmoid(z)))
        : ctx.lineTo(px, tY(sigmoid(z)));
    }
    ctx.stroke();
    // Annotated sample points
    [
      { z: 0, p: 0.5, label: "z=0 → 50/50" },
      {
        z: 2.5,
        p: sigmoid(2.5),
        label: `z=2.5 → ${(sigmoid(2.5) * 100).toFixed(0)}% dog`,
      },
      {
        z: -2.5,
        p: sigmoid(-2.5),
        label: `z=−2.5 → ${(sigmoid(-2.5) * 100).toFixed(0)}% cat`,
      },
    ].forEach(({ z, p, label }) => {
      const cx = tX(z),
        cy = tY(p);
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = z === 0 ? "#999" : z > 0 ? T.dog : T.cat;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle =
        z === 0
          ? "rgba(80,80,80,0.85)"
          : z > 0
            ? "rgba(83,74,183,0.88)"
            : "rgba(29,158,117,0.88)";
      ctx.font = "9px DM Sans";
      ctx.textAlign = z < 0 ? "right" : "left";
      ctx.fillText(label, cx + (z < 0 ? -9 : 9), cy + 4);
    });
    // Axis labels
    ctx.fillStyle = "rgba(123,120,168,0.7)";
    ctx.font = "10px DM Sans";
    ctx.textAlign = "center";
    ctx.fillText("z  (linear score)", (PAD + W - PAD) / 2, H - 5);
    ctx.save();
    ctx.translate(14, (PAD + H - PAD) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("probability σ(z)", 0, 0);
    ctx.restore();
    [-4, -2, 0, 2, 4].forEach((z) => {
      ctx.textAlign = "center";
      ctx.fillText(z, tX(z), H - PAD + 13);
    });
    ctx.textAlign = "right";
    [0, 0.5, 1].forEach((p) => ctx.fillText(p.toFixed(1), PAD - 6, tY(p) + 4));
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

function DataPointsViz() {
  const W = 480,
    H = 320,
    PAD = 46,
    RANGE = 5.5;
  const tX = useCallback(
    (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (W - PAD * 2),
    [],
  );
  const tY = useCallback(
    (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (H - PAD * 2),
    [],
  );
  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      drawGrid(ctx, W, H, PAD, RANGE);
      drawEmojis(ctx, FIXED_POINTS, tX, tY, "16px", 1);
      // Cluster annotation arrows
      ctx.fillStyle = "rgba(83,74,183,0.55)";
      ctx.font = "9.5px DM Sans";
      ctx.textAlign = "left";
      ctx.fillText("↗ Dogs cluster here", tX(1.2), tY(4.3));
      ctx.fillStyle = "rgba(29,158,117,0.55)";
      ctx.textAlign = "right";
      ctx.fillText("Cats cluster here ↙", tX(-0.8), tY(-3.8));
      drawLegend(ctx, W, H, PAD);
    },
    [tX, tY],
  );
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

function ScoreViz() {
  const W = 480,
    H = 320,
    PAD = 46,
    RANGE = 5.5;
  const tX = useCallback(
    (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (W - PAD * 2),
    [],
  );
  const tY = useCallback(
    (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (H - PAD * 2),
    [],
  );
  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      drawGrid(ctx, W, H, PAD, RANGE);
      // Dim all points
      drawEmojis(ctx, FIXED_POINTS, tX, tY, "13px", 0.28);
      // Spotlight dog example
      const ex = { x1: 2.8, x2: 3.1 };
      const cx = tX(ex.x1),
        cy = tY(ex.x2);
      // Projection dashes
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "rgba(83,74,183,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, PAD + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(PAD + 4, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(83,74,183,0.8)";
      ctx.font = "bold 9.5px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText("x₁=2.8", cx, PAD - 3);
      ctx.textAlign = "right";
      ctx.fillText("x₂=3.1", PAD - 3, cy + 4);
      // Glow ring
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(83,74,183,0.12)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(83,74,183,0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Emoji
      ctx.save();
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🐶", cx, cy);
      ctx.restore();
      // Callout box
      const bx = cx + 26,
        by = cy - 66;
      ctx.fillStyle = "rgba(50,42,130,0.93)";
      roundRect(ctx, bx, by, 194, 68, 9);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "9.5px 'JetBrains Mono',monospace";
      ctx.textAlign = "left";
      [
        "z = 1.2×2.8 + (−0.8)×3.1 + 0.1",
        "  = 3.36 − 2.48 + 0.10",
        "  = 0.98",
      ].forEach((ln, li) => ctx.fillText(ln, bx + 10, by + 16 + li * 14));
      ctx.font = "bold 10px DM Sans";
      ctx.fillText("p = σ(0.98) ≈ 0.73  → 🐶 Dog ✓", bx + 10, by + 58);
      drawLegend(ctx, W, H, PAD);
    },
    [tX, tY],
  );
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

function BoundaryViz() {
  const W = 480,
    H = 320,
    PAD = 46,
    RANGE = 5.5,
    w1 = 1.2,
    w2 = -0.8,
    bias = 0.1;
  const tX = useCallback(
    (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (W - PAD * 2),
    [],
  );
  const tY = useCallback(
    (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (H - PAD * 2),
    [],
  );
  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      drawHeatmap(ctx, W, H, PAD, RANGE, w1, w2, bias);
      drawGrid(ctx, W, H, PAD, RANGE);
      drawBoundaryLine(ctx, W, H, PAD, RANGE, w1, w2, bias);
      drawEmojis(ctx, FIXED_POINTS, tX, tY, "15px", 1);
      // Zone watermarks
      ctx.font = "bold 13px DM Sans";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(83,74,183,0.2)";
      ctx.fillText("🐶 Dog zone", tX(3.2), tY(3.8));
      ctx.fillStyle = "rgba(29,158,117,0.2)";
      ctx.fillText("🐱 Cat zone", tX(-3.2), tY(-3.8));
      drawLegend(ctx, W, H, PAD, true);
    },
    [tX, tY],
  );
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

function LossViz() {
  const W = 480,
    H = 300,
    PAD = 54;
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const epochs = 100;
    const losses = Array.from(
      { length: epochs },
      (_, i) =>
        0.693 * Math.exp(-i * 0.045) +
        0.05 +
        Math.sin(i * 0.65) * 0.012 * Math.exp(-i * 0.04),
    );
    const minL = Math.min(...losses),
      maxL = Math.max(...losses);
    const tX = (i) => PAD + (i / (epochs - 1)) * (W - PAD * 2);
    const tY = (l) => PAD + (1 - (l - minL) / (maxL - minL)) * (H - PAD * 2);
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
    losses.forEach((l, i) => ctx.lineTo(tX(i), tY(l)));
    ctx.lineTo(tX(epochs - 1), H - PAD);
    ctx.closePath();
    ctx.fill();
    // Curve
    const lg = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
    lg.addColorStop(0, "#D85A30");
    lg.addColorStop(0.55, "#854F0B");
    lg.addColorStop(1, T.green);
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    losses.forEach((l, i) =>
      i === 0 ? ctx.moveTo(tX(i), tY(l)) : ctx.lineTo(tX(i), tY(l)),
    );
    ctx.stroke();
    // Annotations
    const ann = [
      { i: 0, label: "Guessing (high loss)", col: "#D85A30", anchor: "left" },
      { i: 70, label: "≈ Converged", col: T.green, anchor: "right" },
    ];
    ann.forEach(({ i, label, col, anchor }) => {
      const cx = tX(i),
        cy = tY(losses[i]);
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = col;
      ctx.font = "9.5px DM Sans";
      ctx.textAlign = anchor;
      ctx.fillText(label, anchor === "left" ? cx + 9 : cx - 9, cy + 4);
    });
    ctx.fillStyle = "rgba(123,120,168,0.7)";
    ctx.font = "10px DM Sans";
    ctx.textAlign = "center";
    ctx.fillText("Training epoch", (PAD + W - PAD) / 2, H - 4);
    ctx.save();
    ctx.translate(14, (PAD + H - PAD) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("Log-loss", 0, 0);
    ctx.restore();
    [0, 25, 50, 75, 100].forEach((e) => {
      ctx.textAlign = "center";
      ctx.fillText(e, tX(Math.min(e, epochs - 1)), H - PAD + 13);
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

function GradientViz() {
  const W = 480,
    H = 320,
    PAD = 46,
    RANGE = 5.5;
  const tX = useCallback(
    (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (W - PAD * 2),
    [],
  );
  const tY = useCallback(
    (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (H - PAD * 2),
    [],
  );
  const [epoch, setEpoch] = useState(0);

  const trajectory = useRef(() => {
    let tw = [-0.15, 0.12],
      tb = 0;
    const traj = [{ w: [...tw], b: tb }];
    const lr = 0.04;
    for (let e = 0; e < 60; e++) {
      let dw = [0, 0],
        db = 0;
      FIXED_POINTS.forEach((pt) => {
        const p = sigmoid(tw[0] * pt.x1 + tw[1] * pt.x2 + tb);
        const err = p - pt.label;
        dw[0] += err * pt.x1;
        dw[1] += err * pt.x2;
        db += err;
      });
      const n = FIXED_POINTS.length;
      tw = [tw[0] - (lr * dw[0]) / n, tw[1] - (lr * dw[1]) / n];
      tb -= (lr * db) / n;
      traj.push({ w: [...tw], b: tb });
    }
    return traj;
  }).current;

  // Lazily initialise the trajectory array once
  const trajRef = useRef(null);
  if (!trajRef.current) trajRef.current = trajectory();

  useEffect(() => {
    if (epoch >= trajRef.current.length - 1) return;
    const t = setTimeout(() => setEpoch((e) => e + 1), 130);
    return () => clearTimeout(t);
  }, [epoch]);

  const {
    w: [tw1, tw2],
    b: tb,
  } = trajRef.current[Math.min(epoch, trajRef.current.length - 1)];

  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      // Light heatmap
      for (let px = PAD; px <= W - PAD; px += 3) {
        for (let py = PAD; py <= H - PAD; py += 3) {
          const x1 = ((px - PAD) / (W - PAD * 2)) * RANGE * 2 - RANGE;
          const x2 = ((py - PAD) / (H - PAD * 2)) * RANGE * 2 - RANGE;
          const p = logisticPredict(x1, x2, tw1, tw2, tb);
          ctx.fillStyle =
            p > 0.5
              ? `rgba(83,74,183,${(p - 0.5) * 0.14})`
              : `rgba(29,158,117,${(0.5 - p) * 0.14})`;
          ctx.fillRect(px, py, 3, 3);
        }
      }
      drawGrid(ctx, W, H, PAD, RANGE);
      // Initial boundary (ghost)
      const {
        w: [iw1, iw2],
        b: ib,
      } = trajRef.current[0];
      drawBoundaryLine(
        ctx,
        W,
        H,
        PAD,
        RANGE,
        iw1,
        iw2,
        ib,
        "rgba(180,175,200,0.35)",
        1.5,
      );
      // Current boundary
      drawBoundaryLine(
        ctx,
        W,
        H,
        PAD,
        RANGE,
        tw1,
        tw2,
        tb,
        "rgba(60,52,137,0.88)",
        2.5,
      );
      // Emoji — highlight misclassified
      FIXED_POINTS.forEach((pt) => {
        const cx = tX(pt.x1),
          cy = tY(pt.x2);
        const p = logisticPredict(pt.x1, pt.x2, tw1, tw2, tb);
        const wrong =
          (pt.label === 1 && p < 0.5) || (pt.label === 0 && p > 0.5);
        ctx.save();
        ctx.globalAlpha = wrong ? 1 : 0.55;
        ctx.font = wrong ? "16px serif" : "13px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pt.label === 1 ? "🐶" : "🐱", cx, cy);
        if (wrong) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#E53535";
          ctx.font = "bold 13px sans-serif";
          ctx.textBaseline = "bottom";
          ctx.fillText("✗", cx + 10, cy - 2);
        }
        ctx.restore();
      });
      // Epoch badge
      const pct = Math.round((epoch / (trajRef.current.length - 1)) * 100);
      ctx.fillStyle = "rgba(38,33,92,0.85)";
      roundRect(ctx, W - PAD - 106, PAD + 4, 106, 38, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText(`Epoch ${epoch} · ${pct}% trained`, W - PAD - 53, PAD + 17);
      if (epoch === trajRef.current.length - 1) {
        ctx.fillStyle = "#5DCAA5";
        ctx.font = "10px DM Sans";
        ctx.fillText("✓ Converged", W - PAD - 53, PAD + 31);
      }
      // Legend items
      const ly = H - 13;
      ctx.strokeStyle = "rgba(180,175,200,0.55)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(PAD, ly - 4);
      ctx.lineTo(PAD + 18, ly - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(120,115,140,0.7)";
      ctx.font = "10px DM Sans";
      ctx.textAlign = "left";
      ctx.fillText("initial", PAD + 22, ly + 3.5);
      ctx.strokeStyle = "rgba(60,52,137,0.75)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(PAD + 68, ly - 4);
      ctx.lineTo(PAD + 86, ly - 4);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(60,52,137,0.8)";
      ctx.fillText("current boundary", PAD + 90, ly + 3.5);
      ctx.fillStyle = "rgba(210,60,60,0.8)";
      ctx.fillText("✗ wrong", PAD + 248, ly + 3.5);
    },
    [tX, tY, tw1, tw2, tb, epoch],
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
            background: T.border,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(epoch / (trajRef.current.length - 1)) * 100}%`,
              background: `linear-gradient(90deg,#D85A30,${T.accent})`,
              borderRadius: "2px",
              transition: "width 0.1s",
            }}
          />
        </div>
        <button
          onClick={() => setEpoch(0)}
          style={{
            padding: "3px 10px",
            borderRadius: "6px",
            border: `1px solid ${T.border}`,
            background: "#fff",
            color: T.muted,
            fontSize: "0.72rem",
            fontFamily: "'DM Sans',sans-serif",
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
    viz: "sigmoid",
    title: "The Sigmoid Function",
    context:
      "Before we can classify anything, we need a way to turn raw numbers into a probability. Sigmoid does exactly that — it's the function that converts a score into '% chance of being a dog'.",
    code: [
      "import numpy as np",
      "",
      "# Squash any number into a 0–1 probability",
      "def sigmoid(z):",
      "    return 1 / (1 + np.exp(-z))",
      "",
      "# Examples:",
      "# sigmoid( 0)  → 0.50   perfectly uncertain",
      "# sigmoid( 3)  → 0.95   very likely a dog 🐶",
      "# sigmoid(-3)  → 0.05   very likely a cat 🐱",
    ],
    beginner:
      "Imagine a needle on a dial from 0 to 1. Sigmoid moves that needle: feed it a big positive number and it swings close to 1 (dog!); a big negative number swings it close to 0 (cat!); zero lands right in the middle — the model is 50/50. No matter what you feed it, the answer always stays between 0 and 1, which is what makes it a valid probability.",
    advanced:
      "σ(z) = 1/(1+e⁻ᶻ) is a smooth, strictly increasing bijection from ℝ → (0,1). Its derivative σ′(z) = σ(z)(1−σ(z)) cancels cleanly with the cross-entropy gradient, making the combined loss gradient simply (p−y). This numerical convenience is one reason logistic regression is the canonical linear classifier.",
  },
  {
    id: 1,
    viz: "datapoints",
    title: "Representing Each Animal",
    context:
      "Each cat or dog in our dataset is described by exactly two numbers. These numbers are the model's only evidence — it will never 'see' the actual animals.",
    code: [
      "# Each animal → [ear_pointiness, fur_fluffiness]",
      "# Values range roughly from -5 to +5",
      "",
      "X = np.array([",
      "    [ 2.8,  3.1],   # 🐶 pointy ears, fluffy",
      "    [ 3.4,  2.5],   # 🐶 very pointy, medium fluff",
      "    [-1.5, -2.8],   # 🐱 rounded ears, sleek",
      "    [-2.9, -1.4],   # 🐱 very rounded, less fluffy",
      "    # ... 26 more animals",
      "])",
      "",
      "y = np.array([1, 1, 0, 0, ...])  # 1=dog, 0=cat",
    ],
    beginner:
      "We turn each animal into a pair of numbers: how pointy their ears are (dogs score high, cats low) and how fluffy their fur is (again, dogs tend to score higher). Plot those two numbers on a chart and you can already see the 🐶 dots clustering top-right and the 🐱 dots clustering bottom-left. The model's job is to find a line that separates them.",
    advanced:
      "X ∈ ℝⁿˣ² is the design matrix; each row xᵢ is a feature vector drawn from the input space. Feature engineering — choosing ear geometry and coat texture as discriminative features — is a domain knowledge decision made prior to modelling. The label vector y ∈ {0,1}ⁿ encodes the Bernoulli response variable. The model has no semantic understanding of these features, only their numerical relationship to y.",
  },
  {
    id: 2,
    viz: "score",
    title: "Computing the Linear Score",
    context:
      "The model combines the two features into a single number z. That number is the 'raw score' — positive means leaning dog, negative means leaning cat.",
    code: [
      "# Learned parameters",
      "w = np.array([1.2, -0.8])  # [w_ear, w_fluff]",
      "b = 0.1                     # bias",
      "",
      "def predict(X, w, b):",
      "    z = np.dot(X, w) + b   # linear score",
      "    return sigmoid(z)       # → probability",
      "",
      "# Walk through a single dog (ears=2.8, fluff=3.1):",
      "# z = 1.2×2.8 + (−0.8)×3.1 + 0.1",
      "# z = 3.36  −  2.48  +  0.10  =  0.98",
      "# p = sigmoid(0.98)  ≈  0.73  → 🐶 Dog ✓",
    ],
    beginner:
      "The model multiplies each feature by a weight. Ear pointiness gets weight +1.2 — the more pointy, the more dog-like. Fur fluffiness gets weight −0.8 — wait, isn't fur fluffiness also dog-like? Yes, but once ears are accounted for, extra fluffiness alone doesn't add as much. The bias (+0.1) shifts things slightly. Adding them all up gives z, and passing z through sigmoid gives the final probability.",
    advanced:
      "z = wᵀx + b is the linear decision function. The weight vector w defines the normal to the decision hyperplane; its direction encodes which feature combination is most discriminative. The bias b translates the boundary off the origin. The dot product np.dot(X, w) vectorises over all n examples simultaneously. Note that w₂ < 0 does not mean fluffiness is cat-like; it reflects the partial effect of fluffiness after controlling for ear pointiness.",
  },
  {
    id: 3,
    viz: "boundary",
    title: "The Decision Boundary",
    context:
      "The boundary is the line in feature space where the model is exactly 50/50. Every animal on one side gets predicted 'dog'; every animal on the other side, 'cat'.",
    code: [
      "# The boundary: where z = 0  →  p = sigmoid(0) = 0.5",
      "",
      "# Solving  w[0]*x1 + w[1]*x2 + b = 0  for x2:",
      "#   x2 = -(w[0]*x1 + b) / w[1]",
      "",
      "# With w=[1.2, -0.8],  b=0.1:",
      "#   x2 = -(1.2*x1 + 0.1) / -0.8",
      "#   x2 =  1.5*x1 + 0.125",
      "",
      "# Above the line → z > 0 → p > 0.5 → 🐶 Dog",
      "# Below the line → z < 0 → p < 0.5 → 🐱 Cat",
    ],
    beginner:
      "The dashed line divides the chart into a dog zone and a cat zone. Any new animal whose feature point lands in the purple region will be classified as a dog; in the green region, a cat. The colour intensity shows confidence — deep purple means 'very definitely a dog', pale means 'close call'. Most of our training animals land well inside their own zone.",
    advanced:
      "The decision boundary is the affine hyperplane H = {x ∈ ℝ² : wᵀx + b = 0}. In ℝ² this is a line with slope −w₁/w₂ and intercept −b/w₂. The signed distance from any x to H equals (wᵀx+b)/‖w‖, which is proportional to σ⁻¹(p) — the log-odds. The heatmap renders σ(wᵀx+b) for every pixel, making the posterior probability landscape visually continuous.",
  },
  {
    id: 4,
    viz: "loss",
    title: "Measuring the Error — Log-Loss",
    context:
      "To train the model we need a single number that summarises 'how wrong are our predictions?'. Log-loss is that number, and training means making it as small as possible.",
    code: [
      "def log_loss(y, p):",
      "    # Clip to avoid log(0) = -∞",
      "    p = np.clip(p, 1e-7, 1 - 1e-7)",
      "    return -np.mean(",
      "        y * np.log(p) + (1-y) * np.log(1-p)",
      "    )",
      "",
      "# Intuition:",
      "# y=1 (dog),  p=0.95  →  small loss   ✓ confident & correct",
      "# y=1 (dog),  p=0.05  →  huge loss    ✗ confident & wrong",
      "# y=0 (cat),  p=0.50  →  medium loss  ~ uncertain",
    ],
    beginner:
      "Log-loss is like a penalty score. If you say '95% dog' and it really is a dog, the penalty is tiny. If you say '95% dog' and it's actually a cat, the penalty is enormous — the function punishes confident wrong answers far more than uncertain ones. The chart on the right shows loss falling from a high initial value (model is guessing) down to near-zero as training progresses and the predictions get better.",
    advanced:
      "L = −(1/n)Σ[yᵢ log pᵢ + (1−yᵢ)log(1−pᵢ)] is the negative log-likelihood under n independent Bernoulli observations. Its convexity in (w,b) guarantees a unique global minimum — no local traps. As p→0 for a positive example, −log(p)→∞, providing an infinite corrective gradient. The np.clip guards against numerical overflow in that limit.",
  },
  {
    id: 5,
    viz: "gradient",
    title: "Learning — Gradient Descent",
    context:
      "The model starts with random weights and gradually adjusts them. Each iteration it checks which direction reduces the loss, then takes a small step that way. Watch the boundary shift and the misclassified animals disappear.",
    code: [
      "def train_step(X, y, w, b, lr=0.1):",
      "    p   = predict(X, w, b)        # current predictions",
      "    err = p - y                   # error per animal",
      "    w  -= lr * X.T @ err / len(y) # adjust weights",
      "    b  -= lr * err.mean()          # adjust bias",
      "    return w, b",
      "",
      "# Full training loop",
      "w, b = np.zeros(2), 0.0",
      "for epoch in range(200):",
      "    w, b = train_step(X, y, w, b, lr=0.05)",
      "    # boundary shifts a little each epoch",
    ],
    beginner:
      "Training is just this loop repeated hundreds of times. Each round: make predictions, see which animals you got wrong (the ✗ marks), figure out which direction to nudge each weight to fix those mistakes, and nudge by a tiny amount (the learning rate). In the visualisation you can watch the dashed boundary rotate and slide until almost all animals land on the correct side.",
    advanced:
      "The gradient of L w.r.t. w is (1/n)Xᵀ(p−y); ∂L/∂b = mean(p−y). This strikingly clean form — the error signal is just (p−y) — arises because the sigmoid derivative cancels exactly with the cross-entropy derivative. The update rule implements vanilla full-batch gradient descent; in practice SGD, mini-batch, or Adam are used. The animation simulates the trajectory of (w,b) in parameter space from random initialisation to convergence.",
  },
];

const VIZ_MAP = {
  sigmoid: <SigmoidViz key="sig" />,
  datapoints: <DataPointsViz key="dp" />,
  score: <ScoreViz key="sc" />,
  boundary: <BoundaryViz key="bnd" />,
  loss: <LossViz key="loss" />,
  gradient: <GradientViz key="grad" />,
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
      {/* ── LEFT: scrolling narrative — occupies left 52% ── */}
      <div style={{ flex: "0 0 52%", minWidth: 0, paddingRight: "1.5rem" }}>
        {/* Level toggle — sticky strip */}
        <div
          style={{
            paddingBottom: "0.75rem",
            marginBottom: "0.5rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              background: "rgba(255,255,255,0.88)",
              border: `1px solid ${T.border}`,
              borderRadius: "100px",
              backdropFilter: "blur(8px)",
              boxShadow: `0 2px 8px ${T.light}80`,
            }}
          >
            <span
              style={{ fontSize: "0.72rem", color: T.muted, fontWeight: 500 }}
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
                  background: level === lv ? T.accent : "transparent",
                  color: level === lv ? "#fff" : T.muted,
                  fontFamily: "'DM Sans',sans-serif",
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
              borderTop: si > 0 ? `1px solid ${T.border}` : "none",
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
                border: `1px solid ${activeStep === si ? T.mid : T.border}`,
                width: "fit-content",
                transition: "background 0.3s, border-color 0.3s",
              }}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: activeStep === si ? T.accent : T.border,
                  transition: "background 0.3s",
                }}
              />
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: activeStep === si ? T.accent : T.muted,
                }}
              >
                Step {si + 1} · {STEPS.length} total
              </span>
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: "'DM Serif Display',serif",
                fontSize: "clamp(1.2rem,2vw,1.5rem)",
                color: T.dark,
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
                color: "#6A6560",
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
                  classifier.py
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

            {/* Explanation card — togglable */}
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
                      background: T.accent,
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
                      color: T.dark,
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

        {/* Bottom spacer so last section can scroll to viewport centre */}
        <div style={{ height: "45vh" }} />
      </div>

      {/* ── RIGHT: fixed visualization — fills right 48% of viewport, vertically centered ── */}
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
          pointerEvents: "none" /* let scroll pass through the empty space */,
        }}
      >
        <div
          style={{
            background: "#fff",
            border: `1px solid ${T.border}`,
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
                  color: T.muted,
                  marginBottom: "2px",
                }}
              >
                Visualization — Step {activeStep + 1}
              </p>
              <p
                style={{
                  fontFamily: "'DM Serif Display',serif",
                  fontSize: "1rem",
                  color: T.dark,
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
                    background: i === activeStep ? T.accent : T.border,
                    transition: "width 0.3s, background 0.3s",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Visualization — animates on step change */}
          <div
            key={`viz-${activeStep}`}
            style={{ animation: "fadeUp 0.3s ease" }}
          >
            {VIZ_MAP[STEPS[activeStep].viz]}
          </div>
        </div>

        {/* Scroll nudge on first step */}
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
                stroke={T.muted}
                strokeWidth="1.2"
              />
              <path
                d="M2 7l3 4 3-4"
                stroke={T.muted}
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontSize: "0.72rem", color: T.muted }}>
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
  const [x1, setX1] = useState("1.5");
  const [x2, setX2] = useState("2.0");
  const [w1, setW1] = useState("1.2");
  const [w2, setW2] = useState("-0.8");
  const [bias, setBias] = useState("0.1");
  const [submitted, setSubmitted] = useState(false);
  const [tick, setTick] = useState(0);

  const pW1 = parseFloat(w1) || 0,
    pW2 = parseFloat(w2) || 0,
    pBias = parseFloat(bias) || 0;
  const pX1 = parseFloat(x1) || 0,
    pX2 = parseFloat(x2) || 0;
  const z = pW1 * pX1 + pW2 * pX2 + pBias;
  const prob = sigmoid(z);
  const prediction = prob > 0.5 ? 1 : 0;
  const confidence = Math.abs(prob - 0.5) * 2;

  function handleRun() {
    setSubmitted(true);
    setTick((t) => t + 1);
  }

  const W = 480,
    H = 320,
    PAD = 46,
    RANGE = 5.5;
  const tX = (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (W - PAD * 2);
  const tY = (v) => PAD + ((v + RANGE) / (RANGE * 2)) * (H - PAD * 2);

  const vizRef = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      drawHeatmap(ctx, W, H, PAD, RANGE, pW1, pW2, pBias);
      drawGrid(ctx, W, H, PAD, RANGE);
      drawBoundaryLine(ctx, W, H, PAD, RANGE, pW1, pW2, pBias);
      FIXED_POINTS.forEach((pt) => {
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.font = "13px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pt.label === 1 ? "🐶" : "🐱", tX(pt.x1), tY(pt.x2));
        ctx.restore();
      });
      if (submitted) {
        const cx = tX(pX1),
          cy = tY(pX2);
        if (cx >= PAD && cx <= W - PAD && cy >= PAD && cy <= H - PAD) {
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.fillStyle =
            prediction === 1 ? "rgba(83,74,183,0.18)" : "rgba(29,158,117,0.18)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.strokeStyle = prediction === 1 ? T.dog : T.cat;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.save();
          ctx.font = "22px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("❓", cx, cy);
          ctx.restore();
        }
      }
      drawLegend(ctx, W, H, PAD, true);
    },
    [pW1, pW2, pBias, pX1, pX2, submitted, tick],
  );

  const fld = {
    width: "100%",
    padding: "0.5rem 0.65rem",
    border: `1px solid ${T.border}`,
    borderRadius: "8px",
    fontFamily: "'JetBrains Mono','Fira Code',monospace",
    fontSize: "0.88rem",
    color: T.dark,
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
    color: T.muted,
    marginBottom: "5px",
  };
  const sh = {
    fontSize: "0.68rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: T.muted,
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
    e.target.style.borderColor = T.border;
    e.target.style.boxShadow = "none";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* ── TOP ROW: viz left, controls right ── */}
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* Visualization */}
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            background: "#fff",
            border: `1px solid ${T.border}`,
            borderRadius: "16px",
            padding: "1rem",
            boxShadow: `0 2px 16px ${T.light}`,
          }}
        >
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 500,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: T.muted,
              marginBottom: "2px",
            }}
          >
            Decision boundary plot
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#6B6963",
              marginBottom: "0.75rem",
            }}
          >
            {submitted
              ? `Mystery animal (ear=${(+pX1).toFixed(1)}, fluff=${(+pX2).toFixed(1)}) shown as ❓`
              : "Set features on the right and hit Classify"}
          </p>
          <canvas
            ref={vizRef}
            style={{
              width: "100%",
              aspectRatio: "3/2",
              borderRadius: "12px",
              display: "block",
            }}
          />
        </div>

        {/* Controls */}
        <div
          style={{
            flex: "0 0 250px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              border: `1px solid ${T.border}`,
              borderRadius: "14px",
              padding: "1.1rem 1.2rem",
              boxShadow: `0 1px 6px ${T.light}80`,
            }}
          >
            <p style={sh}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: T.accent,
                  display: "inline-block",
                }}
              />
              Model weights
            </p>
            {[
              ["w₁  (ear weight)", w1, setW1, "e.g. 1.2", T.mid],
              ["w₂  (fluff weight)", w2, setW2, "e.g. -0.8", T.mid],
              ["b   (bias)", bias, setBias, "e.g. 0.1", T.mid],
            ].map(([l, v, s, p, c]) => (
              <div key={l} style={{ marginBottom: "0.7rem" }}>
                <label style={lbl}>{l}</label>
                <input
                  style={fld}
                  type="number"
                  step="0.1"
                  value={v}
                  placeholder={p}
                  onChange={(e) => s(e.target.value)}
                  onFocus={fo(c)}
                  onBlur={bl}
                />
              </div>
            ))}
          </div>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${T.border}`,
              borderRadius: "14px",
              padding: "1.1rem 1.2rem",
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
              Mystery animal ❓
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: T.muted,
                marginBottom: "0.75rem",
                lineHeight: 1.5,
              }}
            >
              Place a ❓ on the chart. Does it land in the dog zone or cat zone?
            </p>
            {[
              ["x₁  (ear pointiness)", x1, setX1, "e.g. 1.5", "#D85A30"],
              ["x₂  (fur fluffiness)", x2, setX2, "e.g. 2.0", "#D85A30"],
            ].map(([l, v, s, p, c]) => (
              <div key={l} style={{ marginBottom: "0.7rem" }}>
                <label style={lbl}>{l}</label>
                <input
                  style={fld}
                  type="number"
                  step="0.1"
                  value={v}
                  placeholder={p}
                  onChange={(e) => s(e.target.value)}
                  onFocus={fo(c)}
                  onBlur={bl}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleRun}
            style={{
              width: "100%",
              padding: "0.75rem",
              background: `linear-gradient(135deg,${T.accent},#534AB7)`,
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontFamily: "'DM Sans',sans-serif",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: `0 4px 16px ${T.accent}40`,
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
            Classify this animal
          </button>
        </div>
      </div>
      {/* end top row */}

      {/* ── BOTTOM ROW: results ── */}
      {submitted && (
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
              background: prediction === 1 ? T.dogLt : T.catLt,
              border: `1px solid ${prediction === 1 ? T.mid : T.teal}60`,
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
                color: prediction === 1 ? T.muted : "#0F6E56",
                marginBottom: "0.35rem",
              }}
            >
              Verdict
            </p>
            <p
              style={{
                fontFamily: "'DM Serif Display',serif",
                fontSize: "2.2rem",
                lineHeight: 1,
              }}
            >
              {prediction === 1 ? "🐶" : "🐱"}
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: prediction === 1 ? T.dark : "#04342C",
                marginTop: "5px",
                fontWeight: 500,
              }}
            >
              {prediction === 1 ? "It's a dog!" : "It's a cat!"}
            </p>
          </div>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${T.border}`,
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
                color: T.muted,
                marginBottom: "0.35rem",
              }}
            >
              Probability
            </p>
            <p
              style={{
                fontFamily: "'DM Serif Display',serif",
                fontSize: "1.6rem",
                color: T.dark,
                lineHeight: 1,
              }}
            >
              {(prob * 100).toFixed(1)}
              <span style={{ fontSize: "1rem", color: T.mid }}>%</span>
            </p>
            <div
              style={{
                marginTop: "6px",
                height: "4px",
                borderRadius: "2px",
                background: T.border,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${prob * 100}%`,
                  background: `linear-gradient(90deg,${T.green},${T.accent})`,
                  borderRadius: "2px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <p style={{ fontSize: "0.7rem", color: T.muted, marginTop: "4px" }}>
              {prediction === 1 ? "dog" : "cat"} probability
            </p>
          </div>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${T.border}`,
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
                color: T.muted,
                marginBottom: "0.35rem",
              }}
            >
              Linear score z
            </p>
            <p
              style={{
                fontFamily: "'DM Serif Display',serif",
                fontSize: "1.6rem",
                color: T.dark,
                lineHeight: 1,
              }}
            >
              {z.toFixed(3)}
            </p>
            <p style={{ fontSize: "0.7rem", color: T.muted, marginTop: "4px" }}>
              {z >= 0 ? "→ dog side of boundary" : "→ cat side of boundary"}
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
              {`z  = ${pW1.toFixed(2)} × ${pX1.toFixed(2)} + ${pW2.toFixed(2)} × ${pX2.toFixed(2)} + ${pBias.toFixed(2)}\n`}
              {`   = ${(pW1 * pX1).toFixed(3)} + ${(pW2 * pX2).toFixed(3)} + ${pBias.toFixed(3)}\n`}
              {`   = ${z.toFixed(4)}\n`}
              {`p  = σ(${z.toFixed(4)}) = ${prob.toFixed(4)}\n`}
              {`→  ${prediction === 1 ? "🐶 Dog" : "🐱 Cat"}  (confidence: ${(confidence * 100).toFixed(1)}%)`}
            </pre>
          </div>
        </div>
      )}

      {!submitted && (
        <div
          style={{
            background: "#fff",
            border: `1px dashed ${T.border}`,
            borderRadius: "14px",
            padding: "1.5rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.65rem" }}>
            🐶🐱
          </div>
          <p
            style={{
              fontFamily: "'DM Serif Display',serif",
              fontSize: "1.05rem",
              color: T.dark,
              marginBottom: "0.3rem",
            }}
          >
            Is it a dog or a cat?
          </p>
          <p style={{ fontSize: "0.82rem", color: "#A09C95", lineHeight: 1.6 }}>
            Set ear pointiness and fur fluffiness values, then hit{" "}
            <strong style={{ color: T.accent }}>Classify this animal</strong> to
            find out.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TOPIC_INTRO = `Can a computer tell cats from dogs just by looking at numbers? We'll build a logistic regression classifier from scratch — using ear pointiness and fur fluffiness as features — and walk through every line of code that makes it work.`;

export default function TopicPage() {
  const { subjectKey, topicKey } = useParams();
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [subPage, setSubPage] = useState("explanation");
  const [showExplanation, setShowExp] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  const meta = {
    subject: "Machine Learning",
    subjectKey: "ml",
    title: "Binary Classification",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{box-shadow:0 0 0 0 ${T.accent}60} 50%{box-shadow:0 0 0 8px ${T.accent}00} }
        @keyframes drift  { 0%,100%{transform:translate(0,0)scale(1)} 50%{transform:translate(6px,-10px)scale(1.04)} }
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-thumb{background:rgba(175,169,236,0.4);border-radius:3px}
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          fontFamily: "'DM Sans',system-ui,sans-serif",
          background: focusMode ? "#fff" : T.warm,
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
                  color: T.muted,
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "0.82rem",
                }}
              >
                Dashboard
              </button>
              <span style={{ color: T.border }}>›</span>
              <button
                onClick={() => navigate(`/subject/${meta.subjectKey}`)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: T.muted,
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "0.82rem",
                }}
              >
                {meta.subject}
              </button>
              <span style={{ color: T.border }}>›</span>
              <span style={{ color: T.dark, fontWeight: 500 }}>
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
                  <span style={{ fontSize: "0.75rem", color: T.muted }}>
                    Explanation
                  </span>
                  <button
                    onClick={() => setShowExp((v) => !v)}
                    style={{
                      width: "36px",
                      height: "20px",
                      borderRadius: "10px",
                      background: showExplanation ? T.accent : T.border,
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
                onClick={() => setFocusMode(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  background: "rgba(255,255,255,0.7)",
                  border: `1px solid ${T.border}`,
                  borderRadius: "100px",
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  color: T.accent,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  fontWeight: 500,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <circle cx="5.5" cy="5.5" r="2" fill={T.accent} />
                  <circle
                    cx="5.5"
                    cy="5.5"
                    r="4.5"
                    stroke={T.accent}
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
                Focus
              </button>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: T.light,
                  border: `1px solid ${T.mid}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                }}
              >
                {user?.avatar ?? "🦉"}
              </div>
            </div>
          </nav>
        )}

        {focusMode && (
          <div
            style={{
              background: T.accent,
              padding: "0.4rem 2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}
            >
              Focus mode — distractions hidden
            </span>
            <button
              onClick={() => setFocusMode(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.75rem",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Exit focus ×
            </button>
          </div>
        )}

        {/* Page header */}
        <div
          style={{
            background: `linear-gradient(150deg,${T.light} 0%,#EAF3DE 100%)`,
            borderBottom: `1px solid ${T.mid}40`,
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
              bg: "rgba(127,119,221,0.15)",
              dur: "14s",
            },
            {
              w: 140,
              h: 140,
              bottom: "-40px",
              left: "60%",
              bg: "rgba(93,202,165,0.12)",
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
                    color: T.muted,
                    marginBottom: "4px",
                  }}
                >
                  ML · Classification
                </p>
                <h1
                  style={{
                    fontFamily: "'DM Serif Display',serif",
                    fontSize: "clamp(1.4rem,3vw,1.9rem)",
                    color: T.dark,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.1,
                    marginBottom: "0.65rem",
                  }}
                >
                  Binary Classification{" "}
                  <span style={{ fontSize: "1.5rem" }}>🐶🐱</span>
                </h1>
                <p
                  style={{
                    fontSize: "0.87rem",
                    color: "#5A5650",
                    lineHeight: 1.7,
                  }}
                >
                  {TOPIC_INTRO}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  background: "rgba(255,255,255,0.65)",
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
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSubPage(key)}
                    style={{
                      padding: "0.45rem 1.1rem",
                      borderRadius: "9px",
                      border: "none",
                      background: subPage === key ? T.accent : "transparent",
                      color: subPage === key ? "#fff" : T.muted,
                      fontFamily: "'DM Sans',sans-serif",
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
            padding: "2rem 0 4rem 2rem",
            boxSizing: "border-box",
          }}
        >
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {subPage === "explanation" ? (
              <ExplanationPage
                showExplanation={showExplanation}
                userLevel={user?.skill ?? "beginner"}
              />
            ) : (
              <TryItOutPage />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
