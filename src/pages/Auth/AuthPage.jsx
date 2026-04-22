import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROTATING_PHRASES = [
  "complex concepts,",
  "graph traversal,",
  "ML classification,",
  "OS scheduling,",
  "algorithms,",
];

const BG_PANELS = [
  {
    topic: "BFS",
    desc: "Graph traversal",
    nodes: [
      { id: "A", x: 50, y: 40 },
      { id: "B", x: 20, y: 70 },
      { id: "C", x: 80, y: 70 },
      { id: "D", x: 10, y: 95 },
      { id: "E", x: 35, y: 95 },
      { id: "F", x: 65, y: 95 },
    ],
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["B", "E"],
      ["C", "F"],
    ],
    visitOrder: ["A", "B", "C", "D", "E", "F"],
  },
  {
    topic: "Classification",
    desc: "ML decision boundary",
    points: Array.from({ length: 22 }, (_, i) => ({
      x: 15 + ((i * 37) % 70),
      y: 20 + ((i * 53) % 70),
      cls: i % 2,
    })),
  },
  {
    topic: "FIFO",
    desc: "Process scheduling",
    processes: [
      { name: "P1", burst: 4, color: "#7F77DD" },
      { name: "P2", burst: 3, color: "#5DCAA5" },
      { name: "P3", burst: 5, color: "#D85A30" },
      { name: "P4", burst: 2, color: "#D4537E" },
    ],
  },
];

const AVATARS = [
  {
    emoji: "🐶",
    name: "Laika",
    title: "The Pioneer",
    description:
      "First in line, always. Laika dives into new topics headfirst, learns by doing, and keeps going even when no one else has been there before. A little lonely at the frontier, but she wouldn't trade it for anything.",
  },
  {
    emoji: "🐱",
    name: "Félicette",
    title: "The Analyst",
    description:
      "She observes before she acts. Félicette watches, waits, and only moves when she's mapped the whole terrain — learning by understanding the why before the what. Quiet, precise, always three steps ahead.",
  },
  {
    emoji: "🐰",
    name: "Snowball",
    title: "The Wonderer",
    description:
      "Down the rabbit hole again. Snowball follows curiosity wherever it leads — one topic becomes five, one question opens ten doors. She doesn't study linearly; she stumbles into understanding and always arrives somewhere magical.",
  },
  {
    emoji: "🦚",
    name: "Argus",
    title: "The Observer",
    description:
      "A hundred eyes, nothing escapes him. Argus absorbs everything at once — patterns, connections, the big picture. He learns by seeing how everything fits together before zooming in. Detail-oriented but never loses sight of the whole.",
  },
  {
    emoji: "🦕",
    name: "Rexy",
    title: "The Relentless",
    description:
      "She doesn't read the manual. She IS the manual. Rexy learns by sheer force — repetition, practice, trial and error. She'll attempt something a hundred times before she gets it, and she will get it. Setbacks are just warm-up laps.",
  },
  {
    emoji: "🦉",
    name: "Hedwig",
    title: "The Sage",
    description:
      "She always delivers. Hedwig is methodical and loyal to the process — she reads everything, takes her time, and never skips steps. When she understands something, it stays with her forever.",
  },
  {
    emoji: "🦋",
    name: "Iris",
    title: "The Transformer",
    description:
      "She's not the same student she was yesterday. Iris absorbs knowledge in bursts — periods of quiet stillness, then sudden dramatic leaps in understanding. She connects concepts across completely different subjects and emerges changed every time.",
  },
  {
    emoji: "🐺",
    name: "Akela",
    title: "The Strategist",
    description:
      "He leads by knowing the terrain. Akela plans before he acts — maps out what he needs to learn, sets a path, and moves with quiet precision. He thinks in systems and structures, and never wastes a move.",
  },
  {
    emoji: "🐉",
    name: "Festus",
    title: "The Chaotic Genius",
    description:
      "Somehow always works. Festus looks like he's flying off the rails — jumping between topics, making wild leaps in logic — but underneath the chaos there's a method no one else could have designed. He gets there. Loudly. With fire.",
  },
  {
    emoji: "🦜",
    name: "Blue",
    title: "The Last of His Kind",
    description:
      "Rare things take time. Blue is the kind of learner who needs the right environment to thrive. He learns slowly at first, then all at once — and he doesn't just absorb information, he carries it like it matters. Because for him, it does.",
  },
  {
    emoji: "🐯",
    name: "Machli",
    title: "The Queen",
    description:
      "Her territory is knowledge. Machli claims a subject and owns it — deep dives, no half-measures, and an almost territorial protectiveness over what she knows. She's been through harder things than this syllabus.",
  },
  {
    emoji: "🐋",
    name: "Humphrey",
    title: "The Explorer",
    description:
      "He keeps getting lost. He keeps finding things. Humphrey doesn't learn in straight lines — he wanders into tangents, surfaces in unexpected places, and occasionally forgets what chapter he started on. But his detours are always worth it.",
  },
  {
    emoji: "🦫",
    name: "Gort",
    title: "The Unbothered",
    description:
      "Stress? Never heard of it. Gort moves at his own pace, and somehow that pace works. He doesn't panic before exams, doesn't spiral on hard topics. He just keeps going — calmly, consistently — and somehow he always gets there.",
  },
  {
    emoji: "🦌",
    name: "Bambi",
    title: "The Gentle Learner",
    description:
      "He learns by watching the world. Bambi takes everything in softly — observation, reflection, slow understanding. He gets overwhelmed by intensity, but in quiet moments he absorbs more than anyone in the room. He doesn't race; he grows.",
  },
  {
    emoji: "🐠",
    name: "Nemo",
    title: "The Brave One",
    description:
      "Small, a little scared, absolutely going for it. Nemo is terrified of the hard stuff but does it anyway. He asks the questions others are embarrassed to ask, explores further than his comfort zone, and reminds everyone that courage is just showing up.",
  },
];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = ["#E4E2DC", "#EF9F27", "#EF9F27", "#3B6D11", "#3B6D11"];

const MOCK_EXISTING_USERS = {
  "alex@uni.edu": {
    firstName: "Alex",
    lastName: "Chen",
    avatar: "🦉",
    skill: "beginner",
    theme: "light",
    font: "neutral",
    stats: { completed: 3, total: 6, minutesSpent: 47 },
    lastTopic: {
      subject: "DSA",
      topic: "BFS / DFS",
      path: "/subject/dsa",
      progress: 68,
    },
  },
};

// ─── Theme preview configs ────────────────────────────────────────────────────
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
    text: "#F0EDE8",
    subtext: "#8A8680",
    accent: "#AFA9EC",
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
    text: "#E0F0FF",
    subtext: "#7090A0",
    accent: "#40B0FF",
    border: "#1A3040",
    cardBg: "#0A2840",
  },
};

const FONT_CONFIGS = [
  {
    key: "neutral",
    label: "Neutral",
    family: "'DM Sans', sans-serif",
    desc: "Clean & modern",
  },
  {
    key: "academic",
    label: "Academic",
    family: "'DM Serif Display', serif",
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

// ─── Animated BG panels ───────────────────────────────────────────────────────

function BFSPanel({ active }) {
  const [visited, setVisited] = useState([]);
  const topic = BG_PANELS[0];
  useEffect(() => {
    if (!active) {
      setVisited([]);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      if (i < topic.visitOrder.length) {
        setVisited((v) => [...v, topic.visitOrder[i]]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setVisited([]), 1200);
      }
    }, 420);
    return () => clearInterval(interval);
  }, [active]);
  const nodeMap = Object.fromEntries(topic.nodes.map((n) => [n.id, n]));
  return (
    <div style={{ width: "100%", height: "100%", padding: "1.5rem" }}>
      <p
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "0.5rem",
        }}
      >
        {topic.desc}
      </p>
      <svg viewBox="0 0 100 115" style={{ width: "100%", height: "85%" }}>
        {topic.edges.map(([a, b], i) => {
          const na = nodeMap[a],
            nb = nodeMap[b];
          return (
            <line
              key={i}
              x1={na.x}
              y1={na.y}
              x2={nb.x}
              y2={nb.y}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.8"
            />
          );
        })}
        {topic.nodes.map((n) => {
          const isVisited = visited.includes(n.id);
          const isActive = visited[visited.length - 1] === n.id;
          return (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={5.5}
                fill={
                  isActive
                    ? "#fff"
                    : isVisited
                      ? "rgba(127,119,221,0.9)"
                      : "rgba(255,255,255,0.12)"
                }
                stroke={
                  isVisited ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"
                }
                strokeWidth="0.8"
                style={{ transition: "fill 0.3s ease" }}
              />
              <text
                x={n.x}
                y={n.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="3.5"
                fill={isVisited ? "#fff" : "rgba(255,255,255,0.4)"}
                fontWeight="500"
              >
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ClassificationPanel({ active }) {
  const topic = BG_PANELS[1];
  const [highlight, setHighlight] = useState(null);
  useEffect(() => {
    if (!active) {
      setHighlight(null);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      setHighlight(i % topic.points.length);
      i++;
    }, 180);
    return () => clearInterval(interval);
  }, [active]);
  return (
    <div style={{ width: "100%", height: "100%", padding: "1.5rem" }}>
      <p
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "0.5rem",
        }}
      >
        {topic.desc}
      </p>
      <svg viewBox="0 0 100 100" style={{ width: "100%", height: "85%" }}>
        <line
          x1="50"
          y1="10"
          x2="50"
          y2="90"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.6"
          strokeDasharray="2,2"
        />
        {topic.points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={highlight === i ? 3.5 : 2.5}
            fill={
              p.cls === 0 ? "rgba(127,119,221,0.85)" : "rgba(93,202,165,0.85)"
            }
            stroke={highlight === i ? "#fff" : "transparent"}
            strokeWidth="0.8"
            style={{ transition: "r 0.2s ease" }}
          />
        ))}
      </svg>
    </div>
  );
}

function FIFOPanel({ active }) {
  const topic = BG_PANELS[2];
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    let p = 0;
    const interval = setInterval(() => {
      p += 1.5;
      if (p >= 100) p = 0;
      setProgress(p);
    }, 60);
    return () => clearInterval(interval);
  }, [active]);
  const total = topic.processes.reduce((s, p) => s + p.burst, 0);
  let cursor = 0;
  return (
    <div style={{ width: "100%", height: "100%", padding: "1.5rem" }}>
      <p
        style={{
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "1rem",
        }}
      >
        {topic.desc}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {topic.processes.map((proc) => {
          const start = (cursor / total) * 100;
          const width = (proc.burst / total) * 100;
          cursor += proc.burst;
          const filled = Math.max(0, Math.min(width, progress - start));
          return (
            <div
              key={proc.name}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <span
                style={{
                  fontSize: "0.65rem",
                  color: "rgba(255,255,255,0.5)",
                  width: "18px",
                }}
              >
                {proc.name}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "8px",
                  background: "rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(filled / width) * 100}%`,
                    height: "100%",
                    background: proc.color,
                    borderRadius: "4px",
                    transition: "width 0.06s linear",
                    opacity: 0.85,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "rgba(255,255,255,0.35)",
                  width: "16px",
                }}
              >
                {proc.burst}ms
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FloatingOrbs() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {[
        {
          size: 280,
          top: "-80px",
          left: "-60px",
          color: "rgba(127,119,221,0.18)",
          dur: "12s",
        },
        {
          size: 200,
          bottom: "-60px",
          right: "-40px",
          color: "rgba(93,202,165,0.14)",
          dur: "16s",
        },
        {
          size: 140,
          top: "40%",
          left: "30%",
          color: "rgba(216,90,48,0.10)",
          dur: "10s",
        },
      ].map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: orb.color,
            top: orb.top,
            left: orb.left,
            bottom: orb.bottom,
            right: orb.right,
            animation: `orbFloat ${orb.dur} ease-in-out infinite alternate`,
            animationDelay: `${i * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function getStrength(val) {
  let s = 0;
  if (val.length >= 8) s++;
  if (/[A-Z]/.test(val)) s++;
  if (/[0-9]/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  return s;
}

// ─── Theme Preview Mini-Card ──────────────────────────────────────────────────

function ThemePreviewCard({ themeKey, isSelected, onClick }) {
  const cfg = THEME_CONFIGS[themeKey];
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        cursor: "pointer",
        borderRadius: "12px",
        border: `2px solid ${isSelected ? "#3C3489" : "#E4E2DC"}`,
        overflow: "hidden",
        transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
        transform: isSelected ? "scale(1.03)" : "scale(1)",
        boxShadow: isSelected
          ? "0 0 0 4px rgba(60,52,137,0.12)"
          : "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ background: cfg.bg, padding: "10px", minHeight: "88px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginBottom: "7px",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "3px",
              background: cfg.accent,
            }}
          />
          <div
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: cfg.border,
            }}
          />
          <div
            style={{
              width: "16px",
              height: "3px",
              borderRadius: "2px",
              background: cfg.border,
            }}
          />
        </div>
        <div
          style={{
            background: cfg.panel,
            borderRadius: "5px",
            padding: "6px",
            border: `0.5px solid ${cfg.border}`,
          }}
        >
          <div
            style={{
              width: "55%",
              height: "4px",
              borderRadius: "2px",
              background: cfg.text,
              opacity: 0.7,
              marginBottom: "4px",
            }}
          />
          <div
            style={{
              width: "85%",
              height: "3px",
              borderRadius: "2px",
              background: cfg.subtext,
              opacity: 0.4,
              marginBottom: "3px",
            }}
          />
          <div
            style={{
              width: "70%",
              height: "3px",
              borderRadius: "2px",
              background: cfg.subtext,
              opacity: 0.3,
              marginBottom: "6px",
            }}
          />
          <div
            style={{
              width: "36px",
              height: "12px",
              borderRadius: "3px",
              background: cfg.accent,
            }}
          />
        </div>
      </div>
      <div
        style={{
          background: cfg.panel,
          borderTop: `1px solid ${cfg.border}`,
          padding: "5px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            color: cfg.text,
            letterSpacing: "0.04em",
          }}
        >
          {cfg.label}
        </span>
        {isSelected && (
          <div
            style={{
              width: "13px",
              height: "13px",
              borderRadius: "50%",
              background: "#3C3489",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="7" height="5" viewBox="0 0 7 5">
              <polyline
                points="1,2.5 2.8,4 6,1"
                fill="none"
                stroke="#fff"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared styles (module-level so object identity is stable) ───────────────

const S = {
  label: {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#6B6963",
    marginBottom: "0.35rem",
  },
  input: {
    width: "100%",
    padding: "0.58rem 0.8rem",
    border: "0.5px solid #E4E2DC",
    borderRadius: "9px",
    fontFamily: "'DM Sans',system-ui,sans-serif",
    fontSize: "0.9rem",
    color: "#1A1917",
    background: "#F9F8F6",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  field: { marginBottom: "1rem" },
  btnPrimary: {
    width: "100%",
    padding: "0.68rem",
    background: "#3C3489",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    fontFamily: "'DM Sans',system-ui,sans-serif",
    fontSize: "0.9rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  btnGhost: {
    flex: 1,
    padding: "0.65rem",
    background: "transparent",
    color: "#6B6963",
    border: "0.5px solid #E4E2DC",
    borderRadius: "9px",
    fontFamily: "'DM Sans',system-ui,sans-serif",
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  tabBtn: (active) => ({
    flex: 1,
    background: "none",
    border: "none",
    borderBottom: `2px solid ${active ? "#3C3489" : "transparent"}`,
    marginBottom: "-0.5px",
    padding: "0.6rem 0",
    fontFamily: "'DM Sans',system-ui,sans-serif",
    fontSize: "0.9rem",
    fontWeight: active ? 500 : 400,
    color: active ? "#1A1917" : "#A09C95",
    cursor: "pointer",
    transition: "color 0.2s, border-color 0.2s",
  }),
  optCard: (sel) => ({
    border: `0.5px solid ${sel ? "#3C3489" : "#E4E2DC"}`,
    background: sel ? "#EEEDFE" : "#fff",
    borderRadius: "10px",
    padding: "0.8rem 1rem",
    cursor: "pointer",
    position: "relative",
    transition: "border-color 0.2s, background 0.2s, transform 0.15s",
    transform: sel ? "scale(1.015)" : "scale(1)",
  }),
  avatarBtn: (sel) => ({
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: `2px solid ${sel ? "#3C3489" : "transparent"}`,
    background: sel ? "#EEEDFE" : "#F9F8F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s, transform 0.15s",
    transform: sel ? "scale(1.18)" : "scale(1)",
    boxShadow: sel ? "0 0 0 4px rgba(60,52,137,0.12)" : "none",
  }),
  sectionHead: {
    fontSize: "0.68rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#A09C95",
    marginBottom: "0.6rem",
  },
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function StepDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: "5px", marginBottom: "1.4rem" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "5px",
            width: i === current ? "22px" : "5px",
            borderRadius: "3px",
            background:
              i === current ? "#3C3489" : i < current ? "#AFA9EC" : "#E4E2DC",
            transition: "all 0.35s ease",
          }}
        />
      ))}
    </div>
  );
}

function CheckBadge() {
  return (
    <div
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        width: "15px",
        height: "15px",
        borderRadius: "50%",
        background: "#3C3489",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="7" height="5" viewBox="0 0 7 5">
        <polyline
          points="1,2.5 2.8,4 6,1"
          fill="none"
          stroke="#fff"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h2
        style={{
          fontFamily: "'DM Serif Display',Georgia,serif",
          fontSize: "1.3rem",
          color: "#1A1917",
          marginBottom: "0.25rem",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: "0.82rem", color: "#A09C95", lineHeight: 1.55 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Step 0 — Credentials ────────────────────────────────────────────────────

function StepCredentials({
  animKey,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  signupEmail,
  setSignupEmail,
  password,
  setPassword,
  strength,
  goToStep,
}) {
  const canContinue =
    firstName.trim() &&
    lastName.trim() &&
    signupEmail.includes("@") &&
    password.length >= 8;
  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={6} current={0} />
      <StepHeader
        title="Create your account"
        subtitle="Enter your details to get started"
      />
      <div style={{ display: "flex", gap: "0.65rem", marginBottom: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label style={S.label}>First name</label>
          <input
            style={S.input}
            placeholder="Alex"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={S.label}>Last name</label>
          <input
            style={S.input}
            placeholder="Chen"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      <div style={S.field}>
        <label style={S.label}>Email</label>
        <input
          style={S.input}
          type="email"
          placeholder="you@university.edu"
          value={signupEmail}
          onChange={(e) => setSignupEmail(e.target.value)}
        />
      </div>
      <div style={S.field}>
        <label style={S.label}>Password</label>
        <input
          style={S.input}
          type="password"
          placeholder="Minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div
          style={{
            height: "3px",
            borderRadius: "2px",
            background: "#E4E2DC",
            marginTop: "0.4rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: "2px",
              width: `${(strength / 4) * 100}%`,
              background: STRENGTH_COLORS[strength],
              transition: "width 0.3s ease, background 0.3s ease",
            }}
          />
        </div>
        <p
          style={{ fontSize: "0.75rem", color: "#A09C95", marginTop: "0.3rem" }}
        >
          {STRENGTH_LABELS[strength] || "Use at least 8 characters"}
        </p>
      </div>
      <button
        style={{
          ...S.btnPrimary,
          opacity: canContinue ? 1 : 0.45,
          cursor: canContinue ? "pointer" : "not-allowed",
        }}
        onClick={() => canContinue && goToStep("onboarding")}
      >
        Continue →
      </button>
    </div>
  );
}

// ─── Step 1 — Skill Level ────────────────────────────────────────────────────

function StepSkill({ animKey, selectedSkill, setSelectedSkill, goToStep }) {
  const skills = [
    {
      key: "beginner",
      icon: "🌱",
      label: "Beginner",
      tagline: "New to this — let's build from scratch",
      effects: [
        "Simple, jargon-free explanations",
        "Step-by-step walkthroughs",
        "More hints & tooltips",
        "AI assistant uses everyday language",
      ],
    },
    {
      key: "experienced",
      icon: "⚡",
      label: "Experienced",
      tagline: "I know the basics — skip the fluff",
      effects: [
        "Technical terminology used freely",
        "Concise, dense explanations",
        "Focus on edge cases & nuances",
        "AI assistant uses expert language",
      ],
    },
  ];
  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={6} current={1} />
      <StepHeader
        title="What's your level?"
        subtitle="This shapes how the AI assistant explains concepts and how we present content."
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {skills.map((s) => (
          <div
            key={s.key}
            style={{
              ...S.optCard(selectedSkill === s.key),
              padding: "1rem 1.1rem",
            }}
            onClick={() => {
              setSelectedSkill(s.key);
              goToStep(2);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && (setSelectedSkill(s.key), goToStep(2))
            }
          >
            {selectedSkill === s.key && <CheckBadge />}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                marginBottom: "0.5rem",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#1A1917",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "#6B6963",
                    fontStyle: "italic",
                  }}
                >
                  {s.tagline}
                </div>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {s.effects.map((effect, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: "0.77rem",
                    color: selectedSkill === s.key ? "#3C3489" : "#8A8680",
                    lineHeight: 1.6,
                  }}
                >
                  {effect}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={S.btnGhost} onClick={() => goToStep(0)}>
          ← Back
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 — Theme ──────────────────────────────────────────────────────────

function StepTheme({ animKey, selectedTheme, setSelectedTheme, goToStep }) {
  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={6} current={2} />
      <StepHeader
        title="Pick your theme"
        subtitle="Each preview shows how your learning environment will look."
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.7rem",
          marginBottom: "0.75rem",
        }}
      >
        {Object.keys(THEME_CONFIGS).map((k) => (
          <ThemePreviewCard
            key={k}
            themeKey={k}
            isSelected={selectedTheme === k}
            onClick={() => {
              setSelectedTheme(k);
              goToStep(3);
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontSize: "0.75rem",
          color: "#A09C95",
          marginBottom: "1.25rem",
          textAlign: "center",
        }}
      >
        Changeable anytime in Settings
      </p>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={S.btnGhost} onClick={() => goToStep(1)}>
          ← Back
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 — Font + Font Size ───────────────────────────────────────────────

function StepFont({
  animKey,
  selectedFont,
  setSelectedFont,
  selectedFontSize,
  setSelectedFontSize,
  goToStep,
}) {
  const activeFontCfg =
    FONT_CONFIGS.find((f) => f.key === selectedFont) || null;
  const activeSizeCfg =
    FONT_SIZE_CONFIGS.find((f) => f.key === selectedFontSize) || null;

  const handleFontSizeSelect = (key) => {
    setSelectedFontSize(key);
    if (selectedFont) {
      setTimeout(() => goToStep(4), 220);
    }
  };

  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={6} current={3} />
      <StepHeader
        title="Typography"
        subtitle="Choose what feels most comfortable to read."
      />
      <div style={{ marginBottom: "1.15rem" }}>
        <p style={S.sectionHead}>Font style</p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {FONT_CONFIGS.map((f) => (
            <div
              key={f.key}
              style={{
                ...S.optCard(selectedFont === f.key),
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.7rem 1rem",
              }}
              onClick={() => setSelectedFont(f.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedFont(f.key)}
            >
              {selectedFont === f.key && <CheckBadge />}
              <div
                style={{
                  fontFamily: f.family,
                  fontSize: "1.6rem",
                  color: "#1A1917",
                  minWidth: "36px",
                  lineHeight: 1,
                }}
              >
                Aa
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "#1A1917",
                    fontFamily: f.family,
                  }}
                >
                  {f.label}
                </div>
                <div style={{ fontSize: "0.73rem", color: "#8A8680" }}>
                  {f.desc}
                </div>
              </div>
              <div
                style={{
                  fontFamily: f.family,
                  fontSize: "0.75rem",
                  color: selectedFont === f.key ? "#3C3489" : "#C0BAB4",
                }}
              >
                The quick brown fox
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <p style={S.sectionHead}>Text size</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "0.5rem",
          }}
        >
          {FONT_SIZE_CONFIGS.map((fs) => (
            <div
              key={fs.key}
              style={{
                ...S.optCard(selectedFontSize === fs.key),
                textAlign: "center",
                padding: "0.75rem 0.4rem",
              }}
              onClick={() => handleFontSizeSelect(fs.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && handleFontSizeSelect(fs.key)
              }
            >
              {selectedFontSize === fs.key && <CheckBadge />}
              <div
                style={{
                  fontSize: fs.size,
                  color: "#1A1917",
                  fontWeight: 500,
                  marginBottom: "3px",
                }}
              >
                Aa
              </div>
              <div style={{ fontSize: "0.7rem", color: "#6B6963" }}>
                {fs.label}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#C0BAB4" }}>
                {fs.preview}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live text sample */}
      {(activeFontCfg || activeSizeCfg) && (
        <div
          style={{
            background: "#F9F8F6",
            border: "0.5px solid #E4E2DC",
            borderRadius: "10px",
            padding: "0.9rem 1rem",
            marginBottom: "1.25rem",
            transition: "all 0.25s ease",
          }}
        >
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#A09C95",
              marginBottom: "0.5rem",
            }}
          >
            Preview
          </p>
          <p
            style={{
              fontFamily: activeFontCfg ? activeFontCfg.family : "inherit",
              fontSize: activeSizeCfg ? activeSizeCfg.size : "1rem",
              color: "#1A1917",
              lineHeight: 1.6,
              margin: 0,
              transition: "font-family 0.2s ease, font-size 0.2s ease",
            }}
          >
            A decision tree splits data by asking yes/no questions about
            features — each branch narrows the classification until a leaf node
            gives the answer.
          </p>
          {activeFontCfg && (
            <p
              style={{
                marginTop: "0.5rem",
                fontSize: "0.72rem",
                color: "#AFA9EC",
                fontFamily: activeFontCfg.family,
              }}
            >
              {activeFontCfg.label}
              {activeSizeCfg ? ` · ${activeSizeCfg.label}` : ""}
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={S.btnGhost} onClick={() => goToStep(2)}>
          ← Back
        </button>
        {!(selectedFont && selectedFontSize) && (
          <button
            style={{
              ...S.btnPrimary,
              flex: 1,
              opacity: selectedFont && selectedFontSize ? 1 : 0.45,
              cursor:
                selectedFont && selectedFontSize ? "pointer" : "not-allowed",
            }}
            onClick={() => selectedFont && selectedFontSize && goToStep(4)}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 4 — Avatar ─────────────────────────────────────────────────────────

function StepAvatar({
  animKey,
  firstName,
  selectedAvatar,
  setSelectedAvatar,
  goToStep,
}) {
  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={6} current={4} />
      <StepHeader
        title="Choose your avatar"
        subtitle="This is who you'll be on Visualize."
      />
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "#EEEDFE",
            border: "3px solid #3C3489",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            margin: "0 auto 0.55rem",
            boxShadow: "0 0 0 6px rgba(60,52,137,0.1)",
            transition: "all 0.25s ease",
          }}
        >
          {AVATARS[selectedAvatar]}
        </div>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3C3489" }}>
          {AVATAR_NAMES[selectedAvatar]}
        </p>
        <p style={{ fontSize: "0.78rem", color: "#A09C95", marginTop: "2px" }}>
          Hi, {firstName || "there"}! 👋
        </p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.8rem",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        {AVATARS.map((emoji, i) => (
          <div
            key={i}
            style={S.avatarBtn(selectedAvatar === i)}
            onClick={() => setSelectedAvatar(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelectedAvatar(i)}
          >
            {emoji}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={S.btnGhost} onClick={() => goToStep(3)}>
          ← Back
        </button>
        <button
          style={{ ...S.btnPrimary, flex: 1 }}
          onClick={() => goToStep(5)}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─── Step 5 — All set! ───────────────────────────────────────────────────────

function StepDone({
  animKey,
  firstName,
  selectedAvatar,
  selectedSkill,
  selectedTheme,
  selectedFont,
  selectedFontSize,
  handleSignupComplete,
}) {
  const cfg = selectedTheme
    ? THEME_CONFIGS[selectedTheme]
    : THEME_CONFIGS.light;
  const fontCfg =
    FONT_CONFIGS.find((f) => f.key === selectedFont) || FONT_CONFIGS[0];
  const sizeCfg =
    FONT_SIZE_CONFIGS.find((f) => f.key === selectedFontSize) ||
    FONT_SIZE_CONFIGS[1];
  return (
    <div
      key={animKey}
      style={{
        animation: "slideIn 0.28s ease",
        textAlign: "center",
        padding: "0.25rem 0",
      }}
    >
      <StepDots total={6} current={5} />
      <div
        style={{
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          background: "#EAF3DE",
          border: "0.5px solid #C0DD97",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.1rem",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#3B6D11"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p
        style={{
          fontFamily: "'DM Serif Display',serif",
          fontSize: "1.5rem",
          color: "#1A1917",
          marginBottom: "0.35rem",
        }}
      >
        You're all set, {firstName || "there"}!
      </p>
      <p
        style={{
          fontSize: "0.85rem",
          color: "#6B6963",
          lineHeight: 1.65,
          margin: "0 auto 1.4rem",
          maxWidth: "240px",
        }}
      >
        Your preferences are saved. Start exploring at your own pace.
      </p>
      <div
        style={{
          background: "#F9F8F6",
          border: "0.5px solid #E4E2DC",
          borderRadius: "12px",
          padding: "0.9rem 1rem",
          marginBottom: "1.4rem",
          textAlign: "left",
        }}
      >
        <p style={S.sectionHead}>Your setup</p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}
        >
          {[
            [
              "Avatar",
              AVATARS[selectedAvatar] + " " + AVATAR_NAMES[selectedAvatar],
            ],
            [
              "Level",
              selectedSkill === "beginner" ? "🌱 Beginner" : "⚡ Experienced",
            ],
            ["Theme", cfg.label],
            ["Font", fontCfg.label + " · " + sizeCfg.label],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.78rem", color: "#8A8680" }}>{k}</span>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: "#1A1917",
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        style={{ ...S.btnPrimary, maxWidth: "220px", margin: "0 auto" }}
        onClick={handleSignupComplete}
      >
        Go to dashboard →
      </button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, setUser } = useUserStore();

  const [tab, setTab] = useState("login");
  // steps: 0=credentials, 1=skill, 2=theme, 3=font, 4=avatar, 5=done
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const [panelIndex, setPanelIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedFont, setSelectedFont] = useState(null);
  const [selectedFontSize, setSelectedFontSize] = useState(null);

  const [toast, setToast] = useState({ show: false, msg: "" });

  // Panel auto-rotate — stable, never re-mounts
  useEffect(() => {
    const t = setInterval(
      () => setPanelIndex((i) => (i + 1) % BG_PANELS.length),
      4000,
    );
    return () => clearInterval(t);
  }, []);

  // Phrase rotation
  useEffect(() => {
    const cycle = setInterval(() => {
      setPhraseVisible(false);
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % ROTATING_PHRASES.length);
        setPhraseVisible(true);
      }, 350);
    }, 2400);
    return () => clearInterval(cycle);
  }, []);

  function showToast(msg) {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: "" }), 2400);
  }

  function goToStep(next) {
    if (next === "onboarding") {
      navigate("/onboarding", {
        state: { firstName, lastName, signupEmail, password },
      });
      return;
    }
    setStep(next);
    setAnimKey((k) => k + 1);
  }

  function handleLogin() {
    setLoginError("");
    if (!loginEmail || loginPassword.length < 6) {
      setLoginError("Please enter a valid email and password.");
      return;
    }
    const existing = MOCK_EXISTING_USERS[loginEmail.toLowerCase()];
    const userData = existing ?? {
      firstName: loginEmail.split("@")[0],
      lastName: "",
      avatar: AVATARS[0],
      skill: "beginner",
      theme: "light",
      font: "neutral",
      stats: { completed: 0, total: 6, minutesSpent: 0 },
      lastTopic: null,
    };
    login(userData);
    showToast("Welcome back!");
    setTimeout(() => navigate("/landing"), 700);
  }

  function handleSignupComplete() {
    setUser({
      firstName: firstName || "Friend",
      lastName,
      avatar: AVATARS[selectedAvatar],
      skill: selectedSkill || "beginner",
      theme: selectedTheme || "light",
      font: selectedFont || "neutral",
      fontSize: selectedFontSize || "md",
      stats: { completed: 0, total: 6, minutesSpent: 0 },
      lastTopic: null,
    });
    showToast("Account created!");
    setTimeout(() => navigate("/landing"), 700);
  }

  const strength = getStrength(password);

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes orbFloat { from { transform:translateY(0px) scale(1); } to { transform:translateY(-20px) scale(1.04); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        button:active { transform: scale(0.97); }
        input:focus { border-color: #AFA9EC !important; box-shadow: 0 0 0 3px #EEEDFE !important; }
        @media (max-width: 720px) { .left-panel { display:none !important; } .right-panel { width:100% !important; min-height:100vh; } }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          fontFamily: "'DM Sans',system-ui,sans-serif",
          background: "#F9F8F6",
        }}
      >
        {/* ── Left panel ── */}
        <div
          className="left-panel"
          style={{
            flex: 1,
            position: "relative",
            background: "#1A1917",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "2.5rem",
            overflow: "hidden",
            minHeight: "100vh",
          }}
        >
          <FloatingOrbs />
          <div style={{ zIndex: 1 }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9px",
                background: "#3C3489",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polygon points="12 2 2 7 12 12 22 7" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
          </div>
          <div style={{ zIndex: 1 }}>
            <h1
              style={{
                fontFamily: "'DM Serif Display',Georgia,serif",
                fontSize: "clamp(2.2rem,4vw,3.2rem)",
                color: "#fff",
                lineHeight: 1.08,
                letterSpacing: "-0.03em",
              }}
            >
              Visualize
              <br />
              <span
                style={{
                  display: "inline-block",
                  color: "#AFA9EC",
                  fontStyle: "italic",
                  transition: "opacity 0.35s ease, transform 0.35s ease",
                  opacity: phraseVisible ? 1 : 0,
                  transform: phraseVisible
                    ? "translateY(0)"
                    : "translateY(6px)",
                }}
              >
                {ROTATING_PHRASES[phraseIndex]}
              </span>
              <br />
              intuitively.
            </h1>
            <p
              style={{
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.65,
                maxWidth: "280px",
                marginTop: "1rem",
              }}
            >
              Learn machine learning, graph algorithms, and OS theory through
              interactive visualizations — not memorization.
            </p>
          </div>
          <div style={{ zIndex: 1 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: "14px",
                height: "200px",
                overflow: "hidden",
              }}
            >
              {panelIndex === 0 && <BFSPanel active={panelIndex === 0} />}
              {panelIndex === 1 && (
                <ClassificationPanel active={panelIndex === 1} />
              )}
              {panelIndex === 2 && <FIFOPanel active={panelIndex === 2} />}
            </div>
            <div style={{ display: "flex", gap: "6px", marginTop: "0.75rem" }}>
              {BG_PANELS.map((_, i) => (
                <div
                  key={i}
                  onClick={() => setPanelIndex(i)}
                  role="button"
                  tabIndex={0}
                  style={{
                    width: i === panelIndex ? "18px" : "6px",
                    height: "6px",
                    borderRadius: "4px",
                    background:
                      i === panelIndex ? "#AFA9EC" : "rgba(255,255,255,0.2)",
                    transition: "width 0.3s ease",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div
          className="right-panel"
          style={{
            width: "500px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#fff",
              border: "0.5px solid #E4E2DC",
              borderRadius: "18px",
              padding: "2rem",
              boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: "0.5px solid #E4E2DC",
                marginBottom: "1.75rem",
              }}
            >
              <button
                style={S.tabBtn(tab === "login")}
                onClick={() => {
                  setTab("login");
                  setLoginError("");
                }}
              >
                Sign in
              </button>
              <button
                style={S.tabBtn(tab === "signup")}
                onClick={() => {
                  setTab("signup");
                  setStep(0);
                }}
              >
                Create account
              </button>
            </div>

            {/* ─── Login ─── */}
            {tab === "login" && (
              <div style={{ animation: "fadeUp 0.25s ease" }}>
                <div style={S.field}>
                  <label style={S.label}>Email</label>
                  <input
                    style={S.input}
                    type="email"
                    placeholder="you@university.edu"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Password</label>
                  <input
                    style={S.input}
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
                {loginError && (
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "#A32D2D",
                      background: "#FCEBEB",
                      border: "0.5px solid #F7C1C1",
                      borderRadius: "8px",
                      padding: "0.5rem 0.75rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {loginError}
                  </p>
                )}
                <button style={S.btnPrimary} onClick={handleLogin}>
                  Sign in
                </button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    margin: "1.1rem 0",
                    fontSize: "0.78rem",
                    color: "#A09C95",
                  }}
                >
                  <div
                    style={{ flex: 1, height: "0.5px", background: "#E4E2DC" }}
                  />{" "}
                  or continue with{" "}
                  <div
                    style={{ flex: 1, height: "0.5px", background: "#E4E2DC" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  {[
                    [
                      "Google",
                      <svg key="g" width="14" height="14" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>,
                    ],
                    [
                      "GitHub",
                      <svg
                        key="gh"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.929.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                      </svg>,
                    ],
                  ].map(([label, icon]) => (
                    <button
                      key={label}
                      style={{
                        flex: 1,
                        padding: "0.58rem",
                        background: "#F9F8F6",
                        border: "0.5px solid #E4E2DC",
                        borderRadius: "9px",
                        fontFamily: "'DM Sans',system-ui,sans-serif",
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        color: "#1A1917",
                      }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Signup ─── */}
            {tab === "signup" && (
              <StepCredentials
                animKey={animKey}
                firstName={firstName}
                setFirstName={setFirstName}
                lastName={lastName}
                setLastName={setLastName}
                signupEmail={signupEmail}
                setSignupEmail={setSignupEmail}
                password={password}
                setPassword={setPassword}
                strength={strength}
                goToStep={goToStep}
              />
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#EAF3DE",
          border: "0.5px solid #C0DD97",
          color: "#3B6D11",
          padding: "0.55rem 1.2rem",
          borderRadius: "100px",
          fontSize: "0.85rem",
          fontWeight: 500,
          opacity: toast.show ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 0.3s ease",
          whiteSpace: "nowrap",
          zIndex: 999,
        }}
      >
        {toast.msg}
      </div>
    </>
  );
}
