import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

// ─── Theme ────────────────────────────────────────────────────────────────────

const T = {
  accent: "#0F6E56",
  light: "#E1F5EE",
  mid: "#5DCAA5",
  dark: "#04342C",
  muted: "#3D7A67",
  green: "#1D9E75",
  greenLt: "#E1F5EE",
  teal: "#5DCAA5",
  bg: "#F0FBF6",
  warm: "#FDFCFA",
  border: "#C8EAD9",
  visited: "#0F6E56",
  queued: "#5DCAA5",
  unvisited: "#CBD5E1",
};

const THEME_CONFIGS = {
  light: {
    label: "Light",
    bg: "#F9F8F6",
    panel: "#FFFFFF",
    text: "#1A1917",
    subtext: "#6B6963",
    accent: "#0F6E56",
    border: "#C8EAD9",
    cardBg: "#E1F5EE",
  },
  dark: {
    label: "Dark",
    bg: "#0D1F1A",
    panel: "#122018",
    text: "#5DCAA5",
    subtext: "#4BA88A",
    accent: "#1D9E75",
    border: "#1A3D30",
    cardBg: "#1A3D30",
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
    family: "'Comic Sans MS','Chalkboard SE',cursive",
    desc: "High readability",
  },
];

const FONT_SIZE_CONFIGS = [
  { key: "sm", label: "Small", size: "0.85rem", preview: "14px" },
  { key: "md", label: "Medium", size: "1rem", preview: "16px" },
  { key: "lg", label: "Large", size: "1.125rem", preview: "18px" },
];

// ─── Graph data ───────────────────────────────────────────────────────────────
//
// A fixed undirected graph used across all visualisations.
// Nodes are laid out in a rough tree shape so BFS level-order is visually clear.
//
//           0
//          / \
//         1   2
//        /|   |\
//       3 4   5 6
//      /     |
//     7       8
//
// Positions are in a [0,1] unit box; we scale to canvas at draw time.

const GRAPH_NODES = [
  { id: 0, label: "A", ux: 0.5, uy: 0.08 },
  { id: 1, label: "B", ux: 0.28, uy: 0.28 },
  { id: 2, label: "C", ux: 0.72, uy: 0.28 },
  { id: 3, label: "D", ux: 0.13, uy: 0.52 },
  { id: 4, label: "E", ux: 0.38, uy: 0.52 },
  { id: 5, label: "F", ux: 0.62, uy: 0.52 },
  { id: 6, label: "G", ux: 0.87, uy: 0.52 },
  { id: 7, label: "H", ux: 0.08, uy: 0.78 },
  { id: 8, label: "I", ux: 0.55, uy: 0.78 },
];

const GRAPH_EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
  [3, 7],
  [5, 8],
];

// BFS order from node 0: [0, 1, 2, 3, 4, 5, 6, 7, 8]
// BFS levels: 0→[0], 1→[1,2], 2→[3,4,5,6], 3→[7,8]
const BFS_LEVELS = [[0], [1, 2], [3, 4, 5, 6], [7, 8]];
const BFS_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8];
// parent map for drawing the BFS tree edges differently
const BFS_PARENT = { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 5 };

// ─── Canvas helper ────────────────────────────────────────────────────────────

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

// ─── Low-level graph drawing helpers ─────────────────────────────────────────

function nodePos(node, W, H, PAD) {
  return {
    x: PAD + node.ux * (W - PAD * 2),
    y: PAD + node.uy * (H - PAD * 2),
  };
}

function drawEdges(
  ctx,
  W,
  H,
  PAD,
  highlight = new Set(),
  highlightColor = T.teal,
) {
  GRAPH_EDGES.forEach(([a, b]) => {
    const pa = nodePos(GRAPH_NODES[a], W, H, PAD);
    const pb = nodePos(GRAPH_NODES[b], W, H, PAD);
    const isHL = highlight.has(`${a}-${b}`) || highlight.has(`${b}-${a}`);
    ctx.strokeStyle = isHL ? highlightColor : "rgba(203,213,225,0.6)";
    ctx.lineWidth = isHL ? 2.5 : 1.5;
    ctx.setLineDash(isHL ? [] : []);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  });
}

function drawNodes(ctx, W, H, PAD, colorFn, labelFn) {
  GRAPH_NODES.forEach((node) => {
    const { x, y } = nodePos(node, W, H, PAD);
    const { fill, stroke, textColor } = colorFn(node.id);
    const R = Math.min(W, H) * 0.048;
    // shadow
    ctx.shadowColor = "rgba(15,110,86,0.18)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    // label
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(R * 0.85)}px DM Sans,system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelFn ? labelFn(node) : node.label, x, y);
  });
}

// ─── Syntax coloring (adapted for Python/pseudocode) ──────────────────────────

function colorLine(text) {
  if (!text.trim()) return <span>&nbsp;</span>;
  const cm = text.match(/^(\s*)(#.*)$/);
  if (cm)
    return (
      <>
        <span style={{ color: "rgba(200,240,220,0.25)" }}>{cm[1]}</span>
        <span style={{ color: "#5DCAA5", fontStyle: "italic" }}>{cm[2]}</span>
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
    /\b(def|return|import|as|from|if|else|for|in|and|or|not|True|False|while|break|append|pop|add)\b/g,
    "kw",
  );
  push(/(""".*?"""|'[^']*'|"[^"]*")/g, "str");
  push(/\b(\d+\.?\d*(?:e-?\d+)?)\b/g, "num");
  push(
    /\b(bfs|dfs|queue|visited|graph|deque|neighbors|node|start|level|popleft|collections)\b/g,
    "fn",
  );
  tokens.sort((a, b) => a.start - b.start);
  const parts = [];
  const colors = {
    kw: "#5DCAA5",
    str: "#E5A96A",
    num: "#AFA9EC",
    fn: "#7BC8F5",
  };
  let cursor = 0;
  tokens.forEach((tok) => {
    if (tok.start < cursor) return;
    if (tok.start > cursor)
      parts.push(
        <span key={cursor} style={{ color: "rgba(200,240,220,0.78)" }}>
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
      <span key="end" style={{ color: "rgba(200,240,220,0.78)" }}>
        {text.slice(cursor)}
      </span>,
    );
  return <>{parts}</>;
}

// ─── AvatarNavBubble ──────────────────────────────────────────────────────────

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

// Step 0 — What is a graph?  Show the plain graph, highlight nothing.
function GraphIntroViz() {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const PAD = 32;
    drawEdges(ctx, W, H, PAD);
    drawNodes(ctx, W, H, PAD, () => ({
      fill: "#fff",
      stroke: T.mid,
      textColor: T.dark,
    }));
    // level labels on the left
    const lvLabels = ["Level 0", "Level 1", "Level 2", "Level 3"];
    BFS_LEVELS.forEach((lvNodes, li) => {
      // draw a faint horizontal band
      const ys = lvNodes.map((id) => PAD + GRAPH_NODES[id].uy * (H - PAD * 2));
      const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
      ctx.fillStyle =
        li % 2 === 0 ? "rgba(29,158,117,0.04)" : "rgba(93,202,165,0.04)";
      ctx.fillRect(PAD, avgY - 26, W - PAD * 2, 52);
      ctx.fillStyle = "rgba(15,110,86,0.35)";
      ctx.font = "bold 9.5px DM Sans";
      ctx.textAlign = "left";
      ctx.fillText(lvLabels[li], PAD + 4, avgY + 3.5);
    });
    // re-draw nodes on top of bands
    drawNodes(ctx, W, H, PAD, () => ({
      fill: "#fff",
      stroke: T.mid,
      textColor: T.dark,
    }));
    // legend
    ctx.fillStyle = "rgba(15,110,86,0.55)";
    ctx.font = "10px DM Sans";
    ctx.textAlign = "left";
    ctx.fillText("Node (vertex)", PAD + 4, H - 10);
    ctx.strokeStyle = "rgba(93,202,165,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PAD + 90, H - 10 - 4);
    ctx.lineTo(PAD + 110, H - 10 - 4);
    ctx.stroke();
    ctx.fillStyle = "rgba(15,110,86,0.55)";
    ctx.fillText("Edge (connection)", PAD + 114, H - 10);
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

// Step 1 — The Queue.  Animate a queue filling with nodes in BFS order.
function QueueViz() {
  const [step, setStep] = useState(0);
  const total = BFS_ORDER.length + 1; // +1 for the "empty start" frame

  useEffect(() => {
    if (step >= total - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 700);
    return () => clearTimeout(t);
  }, [step, total]);

  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      const PAD = 32;

      // ── top half: graph with visited highlighted ──
      const graphH = H * 0.54;
      const visitedSoFar = new Set(BFS_ORDER.slice(0, Math.max(0, step)));
      const currentNode = step > 0 ? BFS_ORDER[step - 1] : null;

      drawEdges(ctx, W, graphH, PAD);
      drawNodes(ctx, W, graphH, PAD, (id) => {
        if (id === currentNode)
          return { fill: T.accent, stroke: T.dark, textColor: "#fff" };
        if (visitedSoFar.has(id))
          return { fill: T.light, stroke: T.mid, textColor: T.dark };
        return {
          fill: "#fff",
          stroke: "rgba(203,213,225,0.8)",
          textColor: "#94A3B8",
        };
      });

      // ── bottom half: queue visualization ──
      const queueItems = BFS_ORDER.slice(0, step);
      const queueY = graphH + 18;
      const boxW = 36,
        boxH = 30,
        gap = 6;
      const totalW = queueItems.length * (boxW + gap);
      const startX = (W - totalW) / 2;

      ctx.fillStyle = "rgba(15,110,86,0.35)";
      ctx.font = "bold 9px DM Sans";
      ctx.textAlign = "left";
      ctx.fillText("Queue →", PAD, queueY + boxH / 2 + 3.5);

      // label "dequeue" arrow
      ctx.fillStyle = "rgba(15,110,86,0.55)";
      ctx.font = "8px DM Sans";
      ctx.textAlign = "center";
      if (queueItems.length > 0) {
        ctx.fillText("← dequeue", startX + boxW / 2, queueY - 4);
        ctx.fillText("enqueue →", startX + totalW - boxW / 2, queueY - 4);
      }

      queueItems.forEach((id, qi) => {
        const bx = startX + qi * (boxW + gap);
        const isHead = qi === 0;
        const r = 7;
        ctx.beginPath();
        ctx.moveTo(bx + r, queueY);
        ctx.lineTo(bx + boxW - r, queueY);
        ctx.quadraticCurveTo(bx + boxW, queueY, bx + boxW, queueY + r);
        ctx.lineTo(bx + boxW, queueY + boxH - r);
        ctx.quadraticCurveTo(
          bx + boxW,
          queueY + boxH,
          bx + boxW - r,
          queueY + boxH,
        );
        ctx.lineTo(bx + r, queueY + boxH);
        ctx.quadraticCurveTo(bx, queueY + boxH, bx, queueY + boxH - r);
        ctx.lineTo(bx, queueY + r);
        ctx.quadraticCurveTo(bx, queueY, bx + r, queueY);
        ctx.closePath();
        ctx.fillStyle = isHead ? T.accent : T.light;
        ctx.fill();
        ctx.strokeStyle = isHead ? T.dark : T.mid;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = isHead ? "#fff" : T.dark;
        ctx.font = `bold ${Math.round(boxH * 0.44)}px DM Sans`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(GRAPH_NODES[id].label, bx + boxW / 2, queueY + boxH / 2);
        ctx.textBaseline = "alphabetic";
      });

      if (step === 0) {
        ctx.fillStyle = "rgba(15,110,86,0.4)";
        ctx.font = "10px DM Sans";
        ctx.textAlign = "center";
        ctx.fillText(
          "Queue is empty — BFS will start here",
          W / 2,
          queueY + boxH / 2 + 4,
        );
      }

      // status line
      ctx.fillStyle = T.muted;
      ctx.font = "9.5px DM Sans";
      ctx.textAlign = "center";
      const status =
        step === 0
          ? "Start: enqueue node A"
          : step < total - 1
            ? `Visiting ${GRAPH_NODES[currentNode].label} — enqueue its unvisited neighbours`
            : "All nodes visited ✓";
      ctx.fillText(status, W / 2, H - 8);
    },
    [step],
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
              width: `${(step / (total - 1)) * 100}%`,
              background: `linear-gradient(90deg,${T.teal},${T.accent})`,
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

// Step 2 — Level-by-level traversal.  Shows each BFS level lighting up.
function LevelOrderViz() {
  const [activeLevel, setActiveLevel] = useState(0);

  useEffect(() => {
    if (activeLevel >= BFS_LEVELS.length - 1) return;
    const t = setTimeout(() => setActiveLevel((l) => l + 1), 1100);
    return () => clearTimeout(t);
  }, [activeLevel]);

  const visited = new Set(BFS_LEVELS.slice(0, activeLevel + 1).flat());

  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      const PAD = 36;
      // Draw level-bands
      BFS_LEVELS.forEach((lvNodes, li) => {
        const ys = lvNodes.map(
          (id) => PAD + GRAPH_NODES[id].uy * (H - PAD * 2),
        );
        const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
        ctx.fillStyle =
          li === activeLevel
            ? "rgba(29,158,117,0.09)"
            : li < activeLevel
              ? "rgba(93,202,165,0.04)"
              : "transparent";
        ctx.fillRect(PAD, avgY - 26, W - PAD * 2, 52);
      });

      const hlEdges = new Set();
      BFS_LEVELS.slice(0, activeLevel + 1)
        .flat()
        .forEach((id) => {
          const par = BFS_PARENT[id];
          if (par !== undefined) hlEdges.add(`${par}-${id}`);
        });
      drawEdges(ctx, W, H, PAD, hlEdges, T.accent);

      drawNodes(ctx, W, H, PAD, (id) => {
        const inCurrent = BFS_LEVELS[activeLevel].includes(id);
        if (inCurrent)
          return { fill: T.accent, stroke: T.dark, textColor: "#fff" };
        if (visited.has(id))
          return { fill: T.light, stroke: T.mid, textColor: T.dark };
        return {
          fill: "#fff",
          stroke: "rgba(203,213,225,0.8)",
          textColor: "#94A3B8",
        };
      });

      // Level badge
      ctx.fillStyle = T.accent;
      ctx.font = "bold 10px DM Sans";
      ctx.textAlign = "center";
      ctx.fillText(
        `Level ${activeLevel}  (${BFS_LEVELS[activeLevel].map((id) => GRAPH_NODES[id].label).join(", ")})`,
        W / 2,
        H - 10,
      );
    },
    [activeLevel],
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
              width: `${(activeLevel / (BFS_LEVELS.length - 1)) * 100}%`,
              background: `linear-gradient(90deg,${T.teal},${T.accent})`,
              borderRadius: "2px",
              transition: "width 0.8s",
            }}
          />
        </div>
        <button
          onClick={() => setActiveLevel(0)}
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

// Step 3 — Visited set / cycle prevention.
function VisitedSetViz() {
  const ref = useCanvas((ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const PAD = 32;
    // Draw full graph dimmed
    drawEdges(ctx, W, H * 0.7, PAD);
    // Highlight a back-edge that would cause a cycle (0→1 is already visited)
    ctx.strokeStyle = "#E53535";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    const p0 = nodePos(GRAPH_NODES[0], W, H * 0.7, PAD);
    const p1 = nodePos(GRAPH_NODES[1], W, H * 0.7, PAD);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p0.x, p0.y);
    ctx.stroke();
    ctx.setLineDash([]);
    drawNodes(ctx, W, H * 0.7, PAD, (id) => {
      if (id <= 4) return { fill: T.light, stroke: T.mid, textColor: T.dark };
      return {
        fill: "#fff",
        stroke: "rgba(203,213,225,0.8)",
        textColor: "#94A3B8",
      };
    });
    // "Already visited!" callout
    const mid = { x: (p0.x + p1.x) / 2 + 36, y: (p0.y + p1.y) / 2 };
    ctx.fillStyle = "#E53535";
    ctx.font = "bold 9.5px DM Sans";
    ctx.textAlign = "left";
    ctx.fillText("skip — already visited!", mid.x, mid.y);

    // Bottom: visited set display
    const setY = H * 0.74;
    ctx.fillStyle = "rgba(15,110,86,0.45)";
    ctx.font = "bold 9px DM Sans";
    ctx.textAlign = "left";
    ctx.fillText("visited  = {", PAD, setY + 14);
    const visitedIds = [0, 1, 2, 3, 4];
    const boxSize = 26,
      boxGap = 5;
    const startX = PAD + 78;
    visitedIds.forEach((id, i) => {
      const bx = startX + i * (boxSize + boxGap);
      ctx.beginPath();
      ctx.arc(bx + boxSize / 2, setY + 5, boxSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = T.light;
      ctx.fill();
      ctx.strokeStyle = T.mid;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = T.dark;
      ctx.font = `bold 10px DM Sans`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(GRAPH_NODES[id].label, bx + boxSize / 2, setY + 5);
      ctx.textBaseline = "alphabetic";
    });
    ctx.fillStyle = "rgba(15,110,86,0.45)";
    ctx.font = "bold 9px DM Sans";
    ctx.textAlign = "left";
    ctx.fillText(
      "}",
      startX + visitedIds.length * (boxSize + boxGap) + 4,
      setY + 14,
    );
    ctx.fillStyle = "rgba(15,110,86,0.45)";
    ctx.font = "9px DM Sans";
    ctx.textAlign = "center";
    ctx.fillText("✓ prevents revisiting & infinite loops", W / 2, H - 8);
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

// Step 4 — Shortest path guarantee.
function ShortestPathViz() {
  const [pathStep, setPathStep] = useState(0);
  const PATH = [0, 2, 5, 8]; // A→C→F→I

  useEffect(() => {
    if (pathStep >= PATH.length - 1) return;
    const t = setTimeout(() => setPathStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [pathStep]);

  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      const PAD = 36;
      drawEdges(ctx, W, H, PAD);
      // Highlight the path edges so far
      const pathEdges = new Set();
      for (let i = 0; i < pathStep; i++)
        pathEdges.add(`${PATH[i]}-${PATH[i + 1]}`);
      pathEdges.forEach((key) => {
        const [a, b] = key.split("-").map(Number);
        const pa = nodePos(GRAPH_NODES[a], W, H, PAD);
        const pb = nodePos(GRAPH_NODES[b], W, H, PAD);
        ctx.strokeStyle = "#FACC15";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(250,204,21,0.6)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
      drawNodes(ctx, W, H, PAD, (id) => {
        if (id === PATH[pathStep])
          return { fill: "#FACC15", stroke: "#92400E", textColor: "#1A1400" };
        if (PATH.slice(0, pathStep).includes(id))
          return { fill: T.accent, stroke: T.dark, textColor: "#fff" };
        return {
          fill: "#fff",
          stroke: "rgba(203,213,225,0.8)",
          textColor: "#94A3B8",
        };
      });
      // distance label
      ctx.fillStyle = T.accent;
      ctx.font = "bold 10px DM Sans";
      ctx.textAlign = "center";
      const labels = [
        "Start at A",
        "A → C  (1 hop)",
        "A → C → F  (2 hops)",
        "A → C → F → I  (3 hops — shortest!) ✓",
      ];
      ctx.fillText(labels[pathStep], W / 2, H - 10);
    },
    [pathStep],
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
              width: `${(pathStep / (PATH.length - 1)) * 100}%`,
              background: `linear-gradient(90deg,#FACC15,${T.accent})`,
              borderRadius: "2px",
              transition: "width 0.6s",
            }}
          />
        </div>
        <button
          onClick={() => setPathStep(0)}
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

// Step 5 — Full BFS animation (all together).
function FullBFSViz() {
  const [frame, setFrame] = useState(0);
  // Each frame: { visiting, visited, queue }
  const frames = (() => {
    const result = [];
    const visited = new Set();
    const queue = [0];
    result.push({ visiting: null, visited: new Set(), queue: [0] });
    while (queue.length) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      const neighbours = GRAPH_EDGES.filter(([a, b]) => a === cur || b === cur)
        .map(([a, b]) => (a === cur ? b : a))
        .filter((n) => !visited.has(n));
      neighbours.forEach((n) => {
        if (!queue.includes(n)) queue.push(n);
      });
      result.push({
        visiting: cur,
        visited: new Set(visited),
        queue: [...queue],
      });
    }
    result.push({ visiting: null, visited: new Set(visited), queue: [] });
    return result;
  })();

  useEffect(() => {
    if (frame >= frames.length - 1) return;
    const t = setTimeout(() => setFrame((f) => f + 1), 800);
    return () => clearTimeout(t);
  }, [frame, frames.length]);

  const { visiting, visited, queue } =
    frames[Math.min(frame, frames.length - 1)];

  const ref = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      const PAD = 32;
      const graphH = H * 0.72;

      const hlEdges = new Set();
      visited.forEach((id) => {
        const par = BFS_PARENT[id];
        if (par !== undefined) hlEdges.add(`${par}-${id}`);
      });
      drawEdges(ctx, W, graphH, PAD, hlEdges, T.mid);
      drawNodes(
        ctx,
        W,
        graphH,
        PAD,
        (id) => {
          if (id === visiting)
            return { fill: T.accent, stroke: T.dark, textColor: "#fff" };
          if (queue.includes(id))
            return { fill: "#fff", stroke: T.mid, textColor: T.dark };
          if (visited.has(id))
            return { fill: T.light, stroke: T.mid, textColor: T.dark };
          return {
            fill: "#fff",
            stroke: "rgba(203,213,225,0.6)",
            textColor: "#94A3B8",
          };
        },
        (node) => {
          if (queue.includes(node.id) && node.id !== visiting)
            return `${node.label}·${queue.indexOf(node.id) + 1}`;
          return node.label;
        },
      );

      // Queue strip
      const stripY = graphH + 10;
      ctx.fillStyle = T.muted;
      ctx.font = "bold 8.5px DM Sans";
      ctx.textAlign = "left";
      ctx.fillText(
        `queue = [${queue.map((id) => GRAPH_NODES[id].label).join(", ")}]`,
        PAD,
        stripY + 12,
      );
      ctx.fillText(
        `visited = {${[...visited].map((id) => GRAPH_NODES[id].label).join(", ")}}`,
        PAD,
        stripY + 26,
      );

      // Legend
      [
        [T.accent, T.dark, "Currently visiting"],
        [T.light, T.mid, "Visited"],
        ["#fff", T.mid, "In queue"],
        ["#fff", "rgba(203,213,225,0.6)", "Not seen yet"],
      ].forEach(([fill, stroke, lbl], i) => {
        const lx = PAD + i * ((W - PAD * 2) / 4);
        ctx.beginPath();
        ctx.arc(lx + 5, H - 10, 5, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = "rgba(15,110,86,0.6)";
        ctx.font = "8px DM Sans";
        ctx.textAlign = "left";
        ctx.fillText(lbl, lx + 13, H - 7);
      });

      if (frame === frames.length - 1) {
        ctx.fillStyle = T.accent;
        ctx.font = "bold 10px DM Sans";
        ctx.textAlign = "center";
        ctx.fillText("✓ BFS complete — all nodes visited", W / 2, stripY + 40);
      }
    },
    [frame, visiting, visited, queue],
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
              width: `${(frame / (frames.length - 1)) * 100}%`,
              background: `linear-gradient(90deg,${T.teal},${T.accent})`,
              borderRadius: "2px",
              transition: "width 0.1s",
            }}
          />
        </div>
        <button
          onClick={() => setFrame(0)}
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
    viz: "intro",
    title: "What is a Graph?",
    context:
      "Before we can traverse anything, we need to know what we're traversing. A graph is just a collection of nodes (vertices) connected by edges. Nothing more — the structure is beautifully simple.",
    code: [
      "# A graph as an adjacency list",
      "graph = {",
      "    'A': ['B', 'C'],",
      "    'B': ['A', 'D', 'E'],",
      "    'C': ['A', 'F', 'G'],",
      "    'D': ['B', 'H'],",
      "    'E': ['B'],",
      "    'F': ['C', 'I'],",
      "    'G': ['C'],",
      "    'H': ['D'],",
      "    'I': ['F'],",
      "}",
    ],
    beginner:
      "Think of it like a map of cities and roads. Each city is a node; each road is an edge. When you want to visit all cities — or find the shortest route between two — you need a traversal strategy. BFS is one of the two classics. The visualisation on the right shows our 9-node graph. Each letter is a node; lines between them are edges. Notice how BFS naturally groups nodes by how far they are from the start.",
    advanced:
      "A graph G = (V, E) where V is the vertex set and E ⊆ V × V is the edge set. We represent it as an adjacency list: a hash map from each vertex to its neighbour list. This gives O(1) average neighbour lookup. Alternative representations — adjacency matrix, edge list, CSR format — trade space for different access patterns. This graph is undirected (edges are symmetric) and unweighted (all edges cost 1).",
  },
  {
    id: 1,
    viz: "queue",
    title: "The Queue — BFS's Core Data Structure",
    context:
      "BFS uses a queue (FIFO — First In, First Out). You enqueue the start node, then repeatedly dequeue a node and enqueue its unvisited neighbours. The queue is why BFS explores level by level.",
    code: [
      "import collections",
      "",
      "def bfs(graph, start):",
      "    visited = set()",
      "    queue   = collections.deque([start])",
      "    visited.add(start)",
      "",
      "    while queue:",
      "        node = queue.popleft()   # dequeue front",
      "        print(node)",
      "",
      "        for neighbor in graph[node]:",
      "            if neighbor not in visited:",
      "                visited.add(neighbor)",
      "                queue.append(neighbor)",
    ],
    beginner:
      "Picture a supermarket checkout queue: whoever joined first leaves first. BFS does the same with nodes. You start with just node A in the queue. You take A out, look at its neighbours (B and C), and put them at the back. Then you take B out, put in B's unvisited neighbours. The key insight: because you always process earlier-arrived nodes first, you always visit nearby nodes before far-away ones. That's the whole magic.",
    advanced:
      "The deque.popleft() is O(1) — this is why collections.deque is used instead of a list (list.pop(0) is O(n)). Marking nodes visited at enqueue time, not at dequeue, is critical: it prevents the same node entering the queue multiple times, keeping time complexity O(V + E). Space complexity is O(V) for the queue in the worst case (star graph where every node is adjacent to the root).",
  },
  {
    id: 2,
    viz: "level",
    title: "Level-Order Exploration",
    context:
      "BFS doesn't just visit nodes — it visits them in exact level order. All nodes at distance 1 before distance 2, all distance 2 before distance 3. Watch each level light up in sequence.",
    code: [
      "def bfs_levels(graph, start):",
      "    visited  = {start}",
      "    level    = [start]",
      "    all_lvls = []",
      "",
      "    while level:",
      "        all_lvls.append(level)",
      "        next_level = []",
      "        for node in level:",
      "            for nbr in graph[node]:",
      "                if nbr not in visited:",
      "                    visited.add(nbr)",
      "                    next_level.append(nbr)",
      "        level = next_level",
      "",
      "    return all_lvls",
      "# → [['A'], ['B','C'], ['D','E','F','G'], ['H','I']]",
    ],
    beginner:
      "Imagine dropping a stone in a pond. Ripples spread outward in perfect circles — first the ring right next to the stone, then the ring a bit further, then further still. BFS is exactly like that, but on a graph. Level 0 is just the start node. Level 1 is everything one hop away. Level 2 is everything two hops away that hasn't been visited yet. The visualisation shows each level illuminating in turn.",
    advanced:
      "The level-order variant uses a 'frontier' list instead of a deque. Each level represents the BFS wavefront at a fixed distance from the source. This naturally computes the unweighted shortest-path distance from the start to every reachable node — just record which level each node first appeared in. The runtime is still O(V + E): each vertex is added to exactly one level list, each edge is examined exactly twice.",
  },
  {
    id: 3,
    viz: "visited",
    title: "The Visited Set — Avoiding Cycles",
    context:
      "Without a visited set, BFS on a graph with cycles would loop forever. The visited set acts as memory: once you've seen a node, you never enqueue it again.",
    code: [
      "# WITHOUT visited set — infinite loop!",
      "# A → B → A → B → A → ...",
      "",
      "# WITH visited set — correct",
      "visited = set()",
      "",
      "def bfs_safe(graph, start):",
      "    visited.add(start)          # mark before enqueue",
      "    queue = collections.deque([start])",
      "",
      "    while queue:",
      "        node = queue.popleft()",
      "        for nbr in graph[node]:",
      "            if nbr not in visited:  # skip seen nodes",
      "                visited.add(nbr)    # mark on enqueue",
      "                queue.append(nbr)",
    ],
    beginner:
      "Graphs can have cycles — paths that loop back to where you started. Without some memory of where you've been, BFS would just keep going around the same loop forever. The visited set is that memory. Every time you consider a neighbour, you check: have I already added this to the queue? If yes, skip it. The visualisation shows a red 'skip' arrow when BFS encounters a back-edge to an already-visited node.",
    advanced:
      "In an undirected graph every edge (u, v) is seen twice — once from u's neighbour list and once from v's. Marking at enqueue (not dequeue) is essential: marking at dequeue allows the same node to be enqueued multiple times, ballooning the queue to O(E) size and inflating time complexity to O(E log E) with the priority-queue variant. Using a hash set for visited gives O(1) amortised membership checks. For implicit graphs (e.g. word ladders), the set also serves as the 'explored' dictionary storing shortest distances.",
  },
  {
    id: 4,
    viz: "shortest",
    title: "Shortest Path Guarantee",
    context:
      "In an unweighted graph, BFS guarantees the shortest path from source to any node. The first time BFS reaches a node, it has taken the fewest possible hops to get there.",
    code: [
      "def bfs_shortest_path(graph, start, end):",
      "    visited = {start: None}   # node → parent",
      "    queue   = collections.deque([start])",
      "",
      "    while queue:",
      "        node = queue.popleft()",
      "        if node == end:",
      "            break",
      "        for nbr in graph[node]:",
      "            if nbr not in visited:",
      "                visited[nbr] = node   # record parent",
      "                queue.append(nbr)",
      "",
      "    # Reconstruct path by walking up parents",
      "    path = []",
      "    cur  = end",
      "    while cur is not None:",
      "        path.append(cur)",
      "        cur = visited.get(cur)",
      "    return path[::-1]",
      "# bfs_shortest_path(graph, 'A', 'I') → ['A','C','F','I']",
    ],
    beginner:
      "Because BFS visits nodes level-by-level, the first time it reaches your destination it has taken the minimum number of hops. There's no shorter route — by the time BFS arrives at that node, it has already visited everything closer. The visualisation traces the path from A to I: A (level 0) → C (level 1) → F (level 2) → I (level 3). Three hops. You can't do it in two — try it on the graph yourself.",
    advanced:
      "Correctness follows from the BFS invariant: when a node u at distance d is dequeued, all nodes at distance < d have already been dequeued. Proof by induction: if u is first reached via path of length k, any shorter path of length k−1 would have caused u to be enqueued one level earlier — contradiction. Path reconstruction via the parent dictionary runs in O(d) where d is the path length. Note that BFS gives shortest-hop paths in unweighted graphs; Dijkstra's algorithm generalises this to weighted edges at O((V+E) log V) cost.",
  },
  {
    id: 5,
    viz: "full",
    title: "Putting It All Together",
    context:
      "Watch the complete BFS run from start to finish: queue evolving, visited set growing, tree edges forming. Every piece we've seen working in concert.",
    code: [
      "import collections",
      "",
      "def bfs(graph, start):",
      "    visited = {start}",
      "    queue   = collections.deque([start])",
      "    order   = []",
      "",
      "    while queue:",
      "        node = queue.popleft()",
      "        order.append(node)",
      "",
      "        for nbr in graph[node]:",
      "            if nbr not in visited:",
      "                visited.add(nbr)",
      "                queue.append(nbr)",
      "",
      "    return order",
      "",
      "# bfs(graph, 'A')",
      "# → ['A','B','C','D','E','F','G','H','I']",
    ],
    beginner:
      "Here's everything working together. The animation shows the queue state and visited set updating in real time. Node labels in the queue show their position (A·1 means A is first in the queue). Notice how BFS naturally discovers nodes in order of their distance from A — that's the level-by-level property we studied in Step 3. The final output list is the BFS traversal order, and it's identical to the level-order reading of the graph.",
    advanced:
      "Time complexity: O(V + E) — each vertex is enqueued exactly once (O(V)) and each edge is examined at most twice (O(E)). Space complexity: O(V) for the queue and visited set. The BFS tree (edges used to first discover each node) forms a spanning tree of the connected component containing the start node. Applications: shortest path in unweighted graphs, bipartite checking, connected components, level-synchronised distributed computing (Bellman-Ford's BFS layer), and as the basis of bidirectional BFS for fast diameter estimation.",
  },
];

const VIZ_MAP = {
  intro: <GraphIntroViz key="intro" />,
  queue: <QueueViz key="queue" />,
  level: <LevelOrderViz key="level" />,
  visited: <VisitedSetViz key="visited" />,
  shortest: <ShortestPathViz key="shortest" />,
  full: <FullBFSViz key="full" />,
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
                background: "#0D1F1A",
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
                    color: "rgba(200,240,220,0.28)",
                    marginLeft: "6px",
                    fontFamily: "monospace",
                  }}
                >
                  bfs.py
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(200,240,220,0.18)",
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
                        color: "rgba(200,240,220,0.13)",
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
                  background: `linear-gradient(135deg,${T.light} 0%,#D8F5ED 100%)`,
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
                    color: "#1A3830",
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

      {/* ── RIGHT: fixed visualization panel ── */}
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
            padding: "1.1rem",
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

          {/* Viz */}
          <div
            key={`viz-${activeStep}`}
            style={{ animation: "fadeUp 0.3s ease" }}
          >
            {VIZ_MAP[STEPS[activeStep].viz]}
          </div>
        </div>

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
  const [startNode, setStartNode] = useState("A");
  const [targetNode, setTargetNode] = useState("I");
  const [submitted, setSubmitted] = useState(false);
  const [animFrame, setAnimFrame] = useState(0);

  // Build BFS result from user-chosen start
  const nodeByLabel = Object.fromEntries(
    GRAPH_NODES.map((n) => [n.label, n.id]),
  );
  const startId = nodeByLabel[startNode.toUpperCase()] ?? 0;
  const targetId = nodeByLabel[targetNode.toUpperCase()] ?? 8;

  // Run BFS and collect frames
  const bfsResult = (() => {
    const visited = {}; // id → parent id (null for start)
    const queue = [startId];
    visited[startId] = null;
    const orderFrames = [
      {
        visiting: null,
        visited: new Set([startId]),
        queue: [startId],
        path: null,
      },
    ];
    while (queue.length) {
      const cur = queue.shift();
      const newVisited = new Set(Object.keys(visited).map(Number));
      const path = (() => {
        if (cur !== targetId) return null;
        const p = [];
        let c = cur;
        while (c !== null && c !== undefined) {
          p.push(c);
          c = visited[c];
        }
        return p.reverse();
      })();
      orderFrames.push({
        visiting: cur,
        visited: new Set(Object.keys(visited).map(Number)),
        queue: [...queue],
        path,
      });
      if (cur === targetId) break;
      const neighbours = GRAPH_EDGES.filter(([a, b]) => a === cur || b === cur)
        .map(([a, b]) => (a === cur ? b : a))
        .filter((n) => !(n in visited));
      neighbours.forEach((n) => {
        visited[n] = cur;
        queue.push(n);
      });
    }
    orderFrames.push({
      visiting: null,
      visited: new Set(Object.keys(visited).map(Number)),
      queue: [],
      path: (() => {
        const p = [];
        let c = targetId;
        while (c !== null && c !== undefined) {
          p.push(c);
          c = visited[c];
        }
        return p.reverse();
      })(),
    });
    return { frames: orderFrames, parentMap: visited };
  })();

  const totalFrames = bfsResult.frames.length;

  useEffect(() => {
    if (!submitted) return;
    if (animFrame >= totalFrames - 1) return;
    const t = setTimeout(() => setAnimFrame((f) => f + 1), 600);
    return () => clearTimeout(t);
  }, [submitted, animFrame, totalFrames]);

  function handleRun() {
    setSubmitted(true);
    setAnimFrame(0);
  }

  const currentFrame = bfsResult.frames[Math.min(animFrame, totalFrames - 1)];
  const { visiting, visited: visitedSet, queue: queueArr, path } = currentFrame;

  // Canvas
  const vizRef = useCanvas(
    (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      const PAD = 36;
      const graphH = H * 0.78;

      if (!submitted) {
        drawEdges(ctx, W, graphH, PAD);
        drawNodes(ctx, W, graphH, PAD, (id) => {
          if (id === startId)
            return { fill: T.accent, stroke: T.dark, textColor: "#fff" };
          if (id === targetId)
            return { fill: "#FACC15", stroke: "#92400E", textColor: "#1A1400" };
          return {
            fill: "#fff",
            stroke: "rgba(203,213,225,0.8)",
            textColor: "#94A3B8",
          };
        });
        ctx.fillStyle = T.muted;
        ctx.font = "bold 10px DM Sans";
        ctx.textAlign = "center";
        ctx.fillText(
          `Start: ${startNode.toUpperCase()} (green)   Target: ${targetNode.toUpperCase()} (yellow)`,
          W / 2,
          graphH + 20,
        );
        ctx.font = "9px DM Sans";
        ctx.fillText("Set nodes and hit Run BFS →", W / 2, graphH + 36);
        return;
      }

      // Path edges
      const pathEdges = new Set();
      if (path && path.length > 1) {
        for (let i = 0; i < path.length - 1; i++)
          pathEdges.add(`${path[i]}-${path[i + 1]}`);
      }
      pathEdges.forEach((key) => {
        const [a, b] = key.split("-").map(Number);
        const pa = nodePos(GRAPH_NODES[a], W, graphH, PAD);
        const pb = nodePos(GRAPH_NODES[b], W, graphH, PAD);
        ctx.strokeStyle = "#FACC15";
        ctx.lineWidth = 4;
        ctx.shadowColor = "rgba(250,204,21,0.5)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
      drawEdges(ctx, W, graphH, PAD);
      drawNodes(ctx, W, graphH, PAD, (id) => {
        if (id === visiting)
          return { fill: T.accent, stroke: T.dark, textColor: "#fff" };
        if (id === targetId && path && path.includes(id))
          return { fill: "#FACC15", stroke: "#92400E", textColor: "#1A1400" };
        if (visitedSet.has(id))
          return { fill: T.light, stroke: T.mid, textColor: T.dark };
        if (queueArr.includes(id))
          return { fill: "#fff", stroke: T.mid, textColor: T.dark };
        return {
          fill: "#fff",
          stroke: "rgba(203,213,225,0.6)",
          textColor: "#94A3B8",
        };
      });

      // Status
      ctx.fillStyle = T.muted;
      ctx.font = "9.5px DM Sans";
      ctx.textAlign = "center";
      const statusMsg =
        animFrame >= totalFrames - 1 && path && path.length > 0
          ? `Shortest path: ${path.map((id) => GRAPH_NODES[id].label).join(" → ")}  (${path.length - 1} hops)`
          : visiting !== null
            ? `Visiting ${GRAPH_NODES[visiting]?.label ?? "?"} — queue: [${queueArr.map((id) => GRAPH_NODES[id].label).join(", ")}]`
            : "BFS running…";
      ctx.fillText(statusMsg, W / 2, graphH + 20);
    },
    [
      submitted,
      visiting,
      visitedSet,
      queueArr,
      path,
      animFrame,
      startId,
      targetId,
    ],
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
    textTransform: "uppercase",
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

  const hops = path ? path.length - 1 : null;
  const valid =
    GRAPH_NODES.some((n) => n.label === startNode.toUpperCase()) &&
    GRAPH_NODES.some((n) => n.label === targetNode.toUpperCase());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Main row */}
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
              Choose nodes
            </p>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={lbl}>Start node (A – I)</label>
              <input
                style={fld}
                type="text"
                maxLength={1}
                value={startNode}
                placeholder="A"
                onChange={(e) => setStartNode(e.target.value.toUpperCase())}
                onFocus={fo(T.mid)}
                onBlur={bl}
              />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={lbl}>Target node (A – I)</label>
              <input
                style={fld}
                type="text"
                maxLength={1}
                value={targetNode}
                placeholder="I"
                onChange={(e) => setTargetNode(e.target.value.toUpperCase())}
                onFocus={fo("#FACC15")}
                onBlur={bl}
              />
            </div>
            {!valid && (
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "#E53535",
                  marginTop: "-0.25rem",
                }}
              >
                Enter valid node labels: A B C D E F G H I
              </p>
            )}
          </div>

          {/* Graph reference card */}
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
                  background: T.mid,
                  display: "inline-block",
                }}
              />
              Graph structure
            </p>
            <pre
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {`A: B C
B: A D E
C: A F G
D: B H
E: B
F: C I
G: C
H: D
I: F`}
            </pre>
          </div>

          <button
            onClick={handleRun}
            disabled={!valid}
            style={{
              width: "100%",
              padding: "0.8rem",
              background: valid
                ? `linear-gradient(135deg,${T.accent},#1D9E75)`
                : "var(--border)",
              color: valid ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: "10px",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: valid ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              boxShadow: valid ? `0 4px 16px ${T.accent}40` : "none",
              transition: "transform 0.1s",
            }}
            onMouseDown={(e) =>
              valid && (e.currentTarget.style.transform = "scale(0.98)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon
                points="3,2 12,7 3,12"
                fill={valid ? "#fff" : "var(--text-muted)"}
              />
            </svg>
            Run BFS
          </button>
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
            BFS traversal
          </p>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "0.85rem",
            }}
          >
            {submitted
              ? `${startNode.toUpperCase()} → ${targetNode.toUpperCase()}  ${animFrame >= totalFrames - 1 ? "(done)" : "(running…)"}`
              : "Set nodes on the left and hit Run BFS"}
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
          {submitted && animFrame < totalFrames - 1 && (
            <div
              style={{
                marginTop: "0.5rem",
                height: "4px",
                borderRadius: "2px",
                background: "var(--border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(animFrame / (totalFrames - 1)) * 100}%`,
                  background: `linear-gradient(90deg,${T.teal},${T.accent})`,
                  transition: "width 0.3s",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {submitted && animFrame >= totalFrames - 1 && path && (
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
              background: T.light,
              border: `1px solid ${T.mid}60`,
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
              Verdict
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "2.2rem",
                lineHeight: 1,
              }}
            >
              {hops !== null && hops >= 0 ? "✅" : "❌"}
            </p>
            <p
              style={{
                fontSize: "0.82rem",
                color: T.dark,
                marginTop: "5px",
                fontWeight: 500,
              }}
            >
              {hops !== null && hops >= 0 ? `Reachable!` : "Not reachable"}
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
              Shortest distance
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.6rem",
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {hops}
              <span style={{ fontSize: "1rem", color: T.mid }}> hops</span>
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
                  width: `${Math.min(100, (hops / (GRAPH_NODES.length - 1)) * 100)}%`,
                  background: `linear-gradient(90deg,${T.green},${"var(--accent)"})`,
                  borderRadius: "2px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              minimum hops (BFS guarantee)
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
              Nodes visited
            </p>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "1.6rem",
                color: "var(--text)",
                lineHeight: 1,
              }}
            >
              {visitedSet.size}
              <span style={{ fontSize: "1rem", color: T.mid }}>
                /{GRAPH_NODES.length}
              </span>
            </p>
            <p
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              before target found
            </p>
          </div>
          <div
            style={{
              gridColumn: "1/-1",
              background: "#0D1F1A",
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
                color: "rgba(93,202,165,0.6)",
                marginBottom: "0.5rem",
              }}
            >
              Path trace
            </p>
            <pre
              style={{
                margin: 0,
                fontFamily:
                  "'JetBrains Mono','Fira Code','Courier New',monospace",
                fontSize: "0.78rem",
                color: "rgba(200,240,220,0.85)",
                lineHeight: 1.85,
              }}
            >
              {`start  = ${startNode.toUpperCase()}\ntarget = ${targetNode.toUpperCase()}\npath   = [${path.map((id) => GRAPH_NODES[id].label).join(" → ")}]\nhops   = ${hops}\n→  BFS guarantees this is the shortest path ✓`}
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
      q: "What is BFS?",
      a: "BFS — Breadth-First Search — is a way of visiting every node in a graph by exploring one 'ring' of neighbours at a time. You start at one node, visit everything directly connected to it, then everything connected to those, and so on. Think of it like ripples spreading outward from a stone dropped in a pond.",
    },
    {
      q: "What is a graph?",
      a: "A graph is just a collection of things (nodes) and connections between them (edges). Cities connected by roads, people connected by friendships, web pages connected by links — all of these are graphs. BFS is one of the main tools for exploring them.",
    },
    {
      q: "What data structure does BFS use?",
      a: "BFS uses a queue — a line where the first thing to arrive is the first thing to leave (FIFO). You enqueue the start node, then loop: dequeue one node, look at its neighbours, enqueue the unvisited ones. Because you always process earlier arrivals first, nearby nodes get visited before distant ones.",
    },
    {
      q: "What is the visited set?",
      a: "The visited set is BFS's memory. Every time you enqueue a node, you add it to the visited set. Before enqueuing any neighbour, you check whether it's already visited — if it is, you skip it. Without this, BFS would loop forever around any cycle in the graph.",
    },
    {
      q: "Why does BFS find the shortest path?",
      a: "Because BFS visits nodes level-by-level, the first time it arrives at a node is guaranteed to be via the shortest route. Imagine concentric ripples: the first ripple to reach a point is always the one that started nearest to it. If there were a shorter path, BFS would have found it in an earlier level.",
    },
    {
      q: "What is a level in BFS?",
      a: "A BFS level groups all nodes that are the same number of hops away from the start. Level 0 is the start node. Level 1 is everything directly connected to it. Level 2 is everything connected to level 1 that hasn't been seen yet. The number of levels BFS needs equals the maximum distance from the start to any reachable node.",
    },
    {
      q: "What is the difference between BFS and DFS?",
      a: "BFS explores outward ring-by-ring using a queue — it finds shortest paths but may use more memory. DFS dives as deep as possible down one branch before backtracking, using a stack (or recursion). BFS is great for shortest paths and level-wise exploration; DFS is better for cycle detection, topological sort, and maze-solving.",
    },
  ],
  experienced: [
    {
      q: "What is the time complexity of BFS?",
      a: "O(V + E), where V is the number of vertices and E is the number of edges. Each vertex is enqueued exactly once, and each edge is examined at most twice (once from each endpoint in an undirected graph). The visited set (hash set) ensures O(1) amortised membership checks.",
    },
    {
      q: "Why mark visited at enqueue, not dequeue?",
      a: "Marking at enqueue prevents a node from being added to the queue multiple times. If you mark at dequeue, the same node can be enqueued O(degree) times, inflating queue size to O(E) and breaking the O(V + E) time bound. Marking at enqueue is also needed for the shortest-path correctness proof: the first enqueue corresponds to the shortest path.",
    },
    {
      q: "How does BFS prove shortest path correctness?",
      a: "By induction on BFS levels. Base: the start node is at distance 0. Inductive step: if all nodes at distance ≤ k are enqueued in the correct order, their unvisited neighbours are at distance k+1. Because we enqueue them in the same breadth-first order, they are dequeued before any node at distance k+2. The first time any node is enqueued, it's via the shortest path — any shorter path would have been discovered in an earlier level.",
    },
    {
      q: "What is the space complexity of BFS?",
      a: "O(V) for the queue and visited set combined. In the worst case (a star graph with V−1 leaves), all neighbours of the root are enqueued simultaneously, giving a queue size of V−1. For implicit graphs, space can be the bottleneck: bidirectional BFS halves the search depth and reduces frontier size to O(b^(d/2)) vs O(b^d) for standard BFS, where b is the branching factor and d is the path length.",
    },
    {
      q: "What is the BFS tree?",
      a: "The BFS tree is the spanning tree formed by the edges used to first discover each node (the parent-child edges). It encodes the shortest-path DAG from the source. All tree edges have the property that the child's BFS distance equals the parent's distance plus one. Non-tree edges in an undirected graph always connect nodes at the same or adjacent BFS levels.",
    },
    {
      q: "How is BFS used for bipartite checking?",
      a: "A graph is bipartite iff it can be 2-coloured such that no edge connects same-colour nodes — equivalently, iff it contains no odd-length cycles. BFS detects this in O(V + E): colour the start node white, then alternate colours as you descend levels. If you ever encounter an edge connecting two same-coloured nodes (a cross-edge within the same level), the graph is not bipartite.",
    },
    {
      q: "What is bidirectional BFS?",
      a: "Bidirectional BFS runs two simultaneous BFS searches — one from the source and one from the target — and terminates when their frontiers meet. The path length is sum of both frontier depths. In a graph with branching factor b and shortest path of length d, standard BFS explores O(b^d) nodes; bidirectional BFS explores O(b^(d/2)) from each side, a quadratic improvement. Used in practice for shortest paths in large social or web graphs.",
    },
  ],
};

const SUGGESTED_QUESTIONS = {
  beginner: [
    "What is BFS?",
    "What data structure does BFS use?",
    "What is the visited set?",
    "Why does BFS find the shortest path?",
    "What is a level in BFS?",
  ],
  experienced: [
    "What is the time complexity of BFS?",
    "Why mark visited at enqueue, not dequeue?",
    "How does BFS prove shortest path correctness?",
    "What is the BFS tree?",
    "How is BFS used for bipartite checking?",
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
          ? "Hi! I'm your AI assistant for this topic. Ask me anything about BFS — in plain English, no jargon required."
          : "Hello. I can answer technical questions about BFS, graph traversal, time complexity, and related algorithms. What would you like to dig into?",
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
            ? "Switched to plain English mode. Ask me anything about BFS — no jargon required."
            : "Switched to technical mode. I'll use precise terminology and complexity analysis. What would you like to explore?",
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
      ? "Great question! It's a bit outside what I have covered right now. Try asking about the queue, visited set, BFS levels, or shortest path."
      : "That falls outside my current knowledge for this topic. Try asking about time complexity, the BFS tree, bipartite checking, or bidirectional BFS.";
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
      {/* ── Chat panel ── */}
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
              background: `linear-gradient(135deg,${T.accent},#1D9E75)`,
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
              <circle cx="13" cy="4" r="2" fill={T.mid} />
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
              Breadth-First Search ·{" "}
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
                    background: `linear-gradient(135deg,${T.accent},#1D9E75)`,
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
                      ? `linear-gradient(135deg,${T.accent},#1D9E75)`
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
                  background: `linear-gradient(135deg,${T.accent},#1D9E75)`,
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
              placeholder="Ask anything about BFS…"
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

      {/* ── Sidebar ── */}
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
        {/* Depth toggle pill */}
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

const TOPIC_INTRO = `Can a computer find the shortest path through a maze just by following a simple rule? BFS does exactly that — using nothing but a queue and a visited set, it explores a graph level-by-level and guarantees the shortest route every time.`;

export default function BFSTopicPage() {
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
    subject: "Data Structures & Algorithms",
    subjectKey: "dsa",
    title: "Breadth-First Search",
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
        ::-webkit-scrollbar-thumb{background:rgba(93,202,165,0.4);border-radius:3px}
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
          "--accent-mid": T.mid,
          "--green": T.green,
          "--green-light": T.greenLt,
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
              background: "rgba(240,251,246,0.92)",
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
                  color: "var(--accent)",
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
            background: `linear-gradient(150deg, ${T.light} 0%, #D8F5ED 100%)`,
            borderBottom: `1px solid ${T.border}`,
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
              bg: `rgba(29,158,117,0.15)`,
              dur: "14s",
            },
            {
              w: 140,
              h: 140,
              bottom: "-40px",
              left: "60%",
              bg: `rgba(93,202,165,0.12)`,
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
                  DSA · Graph Traversal
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
                  Breadth-First Search{" "}
                  <span style={{ fontSize: "1.5rem" }}>🔍🌊</span>
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
              {/* Sub-page tabs */}
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
