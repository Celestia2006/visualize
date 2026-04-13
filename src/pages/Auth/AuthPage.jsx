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

const AVATARS = ["🦉", "🦊", "🐼", "🤖", "🧑‍🚀"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Strong", "Very strong"];
const STRENGTH_COLORS = ["#E4E2DC", "#EF9F27", "#EF9F27", "#3B6D11", "#3B6D11"];

// ─── Mock existing users (for login simulation) ───────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, setUser } = useUserStore();

  const [tab, setTab] = useState("login");
  const [step, setStep] = useState(0);
  const [panelIndex, setPanelIndex] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseVisible, setPhraseVisible] = useState(true);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState("beginner");
  const [selectedTheme, setSelectedTheme] = useState("light");
  const [selectedFont, setSelectedFont] = useState("neutral");

  const [toast, setToast] = useState({ show: false, msg: "" });

  useEffect(() => {
    const t = setInterval(
      () => setPanelIndex((i) => (i + 1) % BG_PANELS.length),
      4000,
    );
    return () => clearInterval(t);
  }, []);

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
      skill: selectedSkill,
      theme: selectedTheme,
      font: selectedFont,
      stats: { completed: 0, total: 6, minutesSpent: 0 },
      lastTopic: null,
    });
    showToast("Account created!");
    setTimeout(() => navigate("/landing"), 700);
  }

  const strength = getStrength(password);

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
    sectionHead: {
      fontSize: "0.68rem",
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "#A09C95",
      marginBottom: "0.5rem",
    },
    optCard: (sel) => ({
      border: `0.5px solid ${sel ? "#3C3489" : "#E4E2DC"}`,
      background: sel ? "#EEEDFE" : "#fff",
      borderRadius: "9px",
      padding: "0.65rem 0.8rem",
      cursor: "pointer",
      position: "relative",
      transition: "border-color 0.2s, background 0.2s",
    }),
    fontSwatch: (sel) => ({
      border: `0.5px solid ${sel ? "#3C3489" : "#E4E2DC"}`,
      background: sel ? "#EEEDFE" : "#fff",
      borderRadius: "8px",
      padding: "0.6rem 0.5rem",
      cursor: "pointer",
      textAlign: "center",
      transition: "border-color 0.2s, background 0.2s",
    }),
    avatarOpt: (sel) => ({
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      border: `2px solid ${sel ? "#3C3489" : "transparent"}`,
      background: "#F9F8F6",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.1rem",
      cursor: "pointer",
      transition: "border-color 0.2s",
    }),
    stepDot: (state) => ({
      height: "6px",
      width: state === "active" ? "18px" : "6px",
      borderRadius: "4px",
      background:
        state === "active"
          ? "#3C3489"
          : state === "done"
            ? "#AFA9EC"
            : "#E4E2DC",
      transition: "all 0.3s ease",
    }),
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
  };

  function StepDots() {
    return (
      <div style={{ display: "flex", gap: "5px", marginBottom: "1.5rem" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={S.stepDot(
              i === step ? "active" : i < step ? "done" : "idle",
            )}
          />
        ))}
      </div>
    );
  }

  function CheckIcon() {
    return (
      <div
        style={{
          position: "absolute",
          top: "7px",
          right: "7px",
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
    );
  }

  function Step0() {
    return (
      <div style={{ animation: "fadeUp 0.25s ease" }}>
        <StepDots />
        <div style={{ display: "flex", gap: "0.7rem", marginBottom: "1rem" }}>
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
            style={{
              fontSize: "0.75rem",
              color: "#A09C95",
              marginTop: "0.3rem",
            }}
          >
            {STRENGTH_LABELS[strength] || "Use at least 8 characters"}
          </p>
        </div>
        <div style={S.field}>
          <label style={S.label}>Profile picture</label>
          <div
            style={{
              display: "flex",
              gap: "0.55rem",
              flexWrap: "wrap",
              marginTop: "0.35rem",
            }}
          >
            {AVATARS.map((emoji, i) => (
              <div
                key={i}
                style={S.avatarOpt(selectedAvatar === i)}
                onClick={() => setSelectedAvatar(i)}
                role="button"
                tabIndex={0}
              >
                {emoji}
              </div>
            ))}
          </div>
        </div>
        <button style={S.btnPrimary} onClick={() => setStep(1)}>
          Continue →
        </button>
      </div>
    );
  }

  function Step1() {
    const themes = [
      { key: "light", label: "Light", bg: "#F9F8F6", border: "#E4E2DC" },
      { key: "dark", label: "Dark", bg: "#1A1917", border: "transparent" },
      {
        key: "cb-light",
        label: "CB Light",
        bg: "linear-gradient(135deg,#FFF9DB 50%,#E8F4FD 50%)",
      },
      {
        key: "cb-dark",
        label: "CB Dark",
        bg: "linear-gradient(135deg,#1A1400 50%,#001A2C 50%)",
      },
    ];
    const fonts = [
      { key: "neutral", label: "Neutral", family: "'DM Sans',sans-serif" },
      {
        key: "academic",
        label: "Academic",
        family: "'DM Serif Display',serif",
      },
      { key: "dyslexic", label: "Dyslexic", family: "'Comic Sans MS',cursive" },
    ];
    return (
      <div style={{ animation: "fadeUp 0.25s ease" }}>
        <StepDots />
        <div style={{ marginBottom: "1rem" }}>
          <p style={S.sectionHead}>Skill level</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.55rem",
            }}
          >
            {[
              {
                key: "beginner",
                label: "Beginner",
                desc: "New to these topics",
              },
              {
                key: "experienced",
                label: "Experienced",
                desc: "Some prior knowledge",
              },
            ].map((opt) => (
              <div
                key={opt.key}
                style={S.optCard(selectedSkill === opt.key)}
                onClick={() => setSelectedSkill(opt.key)}
                role="button"
                tabIndex={0}
              >
                {selectedSkill === opt.key && <CheckIcon />}
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "#1A1917",
                    marginBottom: "2px",
                  }}
                >
                  {opt.label}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6B6963" }}>
                  {opt.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <p style={S.sectionHead}>Theme</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "0.5rem",
            }}
          >
            {themes.map((t) => (
              <div
                key={t.key}
                onClick={() => setSelectedTheme(t.key)}
                title={t.label}
                role="button"
                tabIndex={0}
                style={{
                  height: "36px",
                  borderRadius: "8px",
                  background: t.bg,
                  border: `2px solid ${selectedTheme === t.key ? "#3C3489" : t.border || "transparent"}`,
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    bottom: "3px",
                    left: 0,
                    right: 0,
                    textAlign: "center",
                    fontSize: "0.55rem",
                    fontWeight: 500,
                    color: t.key.includes("dark") ? "#ccc" : "#444",
                  }}
                >
                  {t.label}
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#A09C95",
              marginTop: "0.3rem",
            }}
          >
            Changeable anytime in settings
          </p>
        </div>
        <div style={{ marginBottom: "1.25rem" }}>
          <p style={S.sectionHead}>Font</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "0.5rem",
            }}
          >
            {fonts.map((f) => (
              <div
                key={f.key}
                style={S.fontSwatch(selectedFont === f.key)}
                onClick={() => setSelectedFont(f.key)}
                role="button"
                tabIndex={0}
              >
                <div
                  style={{
                    fontFamily: f.family,
                    fontSize: "1.15rem",
                    color: "#1A1917",
                    marginBottom: "2px",
                  }}
                >
                  Aa
                </div>
                <div style={{ fontSize: "0.68rem", color: "#6B6963" }}>
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button style={S.btnGhost} onClick={() => setStep(0)}>
            ← Back
          </button>
          <button
            style={{ ...S.btnPrimary, flex: 1 }}
            onClick={() => setStep(2)}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  function Step2() {
    return (
      <div
        style={{
          animation: "fadeUp 0.25s ease",
          textAlign: "center",
          padding: "1rem 0",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            background: "#EAF3DE",
            border: "0.5px solid #C0DD97",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.25rem",
          }}
        >
          <svg
            width="22"
            height="22"
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
            marginBottom: "0.5rem",
          }}
        >
          You're all set
        </p>
        <p
          style={{
            fontSize: "0.88rem",
            color: "#6B6963",
            lineHeight: 1.65,
            margin: "0 auto 1.75rem",
            maxWidth: "240px",
          }}
        >
          Your preferences are saved. Start exploring concepts at your own pace.
        </p>
        <button
          style={{ ...S.btnPrimary, maxWidth: "200px", margin: "0 auto" }}
          onClick={handleSignupComplete}
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes orbFloat { from { transform:translateY(0px) scale(1); } to { transform:translateY(-20px) scale(1.04); } }
        button:active { transform: scale(0.98); }
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
        {/* Left panel */}
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

        {/* Right panel */}
        <div
          className="right-panel"
          style={{
            width: "480px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "#fff",
              border: "0.5px solid #E4E2DC",
              borderRadius: "18px",
              padding: "2rem",
              boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
            }}
          >
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
                  setStep(0);
                  setLoginError("");
                }}
              >
                Sign in
              </button>
              <button
                style={S.tabBtn(tab === "signup")}
                onClick={() => setTab("signup")}
              >
                Create account
              </button>
            </div>

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

            {tab === "signup" && (
              <>
                {step === 0 && <Step0 />}
                {step === 1 && <Step1 />}
                {step === 2 && <Step2 />}
              </>
            )}
          </div>
        </div>
      </div>

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
