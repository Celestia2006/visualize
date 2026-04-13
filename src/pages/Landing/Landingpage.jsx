import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

// ─── Static data ──────────────────────────────────────────────────────────────

const QUOTES = [
  {
    text: "The only way to learn mathematics is to do mathematics.",
    author: "Paul Halmos",
  },
  { text: "An algorithm must be seen to be believed.", author: "Donald Knuth" },
  {
    text: "Computer science is no more about computers than astronomy is about telescopes.",
    author: "Edsger Dijkstra",
  },
  {
    text: "First, solve the problem. Then, write the code.",
    author: "John Johnson",
  },
  { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
];

const SUBJECTS = [
  {
    key: "ml",
    title: "Machine Learning",
    subtitle: "Classification",
    description:
      "Decision boundaries, feature spaces, and how machines learn to tell things apart.",
    topics: ["Binary Classification", "K-Nearest Neighbours", "Decision Trees"],
    accentColor: "#3C3489",
    lightColor: "#EEEDFE",
    midColor: "#AFA9EC",
    darkColor: "#26215C",
    cardBg: "#F5F4FE",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="8" cy="18" r="3" fill="#7F77DD" opacity="0.9" />
        <circle cx="11" cy="12" r="3" fill="#7F77DD" opacity="0.7" />
        <circle cx="6" cy="22" r="2.5" fill="#7F77DD" opacity="0.6" />
        <circle cx="20" cy="9" r="3" fill="#5DCAA5" opacity="0.9" />
        <circle cx="23" cy="14" r="3" fill="#5DCAA5" opacity="0.7" />
        <circle cx="19" cy="18" r="2.5" fill="#5DCAA5" opacity="0.6" />
        <line
          x1="14"
          y1="4"
          x2="14"
          y2="24"
          stroke="#3C3489"
          strokeWidth="0.8"
          strokeDasharray="2,2"
          opacity="0.3"
        />
      </svg>
    ),
  },
  {
    key: "dsa",
    title: "Data Structures",
    subtitle: "Graph Traversal",
    description:
      "Navigate trees and graphs with BFS and DFS — two algorithms that power the modern web.",
    topics: ["Breadth-First Search", "Depth-First Search", "Path Finding"],
    accentColor: "#0F6E56",
    lightColor: "#E1F5EE",
    midColor: "#5DCAA5",
    darkColor: "#04342C",
    cardBg: "#F0FBF6",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="6" r="3" fill="#1D9E75" opacity="0.9" />
        <circle cx="7" cy="16" r="3" fill="#1D9E75" opacity="0.75" />
        <circle cx="21" cy="16" r="3" fill="#1D9E75" opacity="0.75" />
        <circle cx="4" cy="24" r="2.5" fill="#5DCAA5" opacity="0.7" />
        <circle cx="11" cy="24" r="2.5" fill="#5DCAA5" opacity="0.7" />
        <circle cx="21" cy="24" r="2.5" fill="#5DCAA5" opacity="0.7" />
        <line
          x1="14"
          y1="9"
          x2="7"
          y2="13"
          stroke="#1D9E75"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="14"
          y1="9"
          x2="21"
          y2="13"
          stroke="#1D9E75"
          strokeWidth="1"
          opacity="0.5"
        />
        <line
          x1="7"
          y1="19"
          x2="4"
          y2="21.5"
          stroke="#5DCAA5"
          strokeWidth="1"
          opacity="0.4"
        />
        <line
          x1="7"
          y1="19"
          x2="11"
          y2="21.5"
          stroke="#5DCAA5"
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>
    ),
  },
  {
    key: "os",
    title: "Operating Systems",
    subtitle: "Scheduling",
    description:
      "How your OS decides which process runs next — from FIFO queues to shortest-job-first.",
    topics: ["FIFO Scheduling", "Shortest Job First", "Round Robin"],
    accentColor: "#854F0B",
    lightColor: "#FAEEDA",
    midColor: "#EF9F27",
    darkColor: "#412402",
    cardBg: "#FEF8EE",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect
          x="3"
          y="8"
          width="7"
          height="5"
          rx="2"
          fill="#EF9F27"
          opacity="0.9"
        />
        <rect
          x="3"
          y="15"
          width="5"
          height="5"
          rx="2"
          fill="#EF9F27"
          opacity="0.6"
        />
        <rect
          x="11"
          y="10"
          width="10"
          height="5"
          rx="2"
          fill="#BA7517"
          opacity="0.85"
        />
        <rect
          x="11"
          y="17"
          width="6"
          height="5"
          rx="2"
          fill="#BA7517"
          opacity="0.6"
        />
        <rect
          x="23"
          y="9"
          width="2"
          height="14"
          rx="1"
          fill="#1A1917"
          opacity="0.12"
        />
        <rect
          x="3"
          y="22"
          width="18"
          height="1.5"
          rx="0.75"
          fill="#1A1917"
          opacity="0.08"
        />
      </svg>
    ),
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(name) {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)
    return {
      salutation: `Good morning, ${name}.`,
      sub: "Ready for a fresh session?",
    };
  if (h >= 12 && h < 17)
    return {
      salutation: `Good afternoon, ${name}.`,
      sub: "A great time to tackle something new.",
    };
  if (h >= 17 && h < 21)
    return {
      salutation: `Good evening, ${name}.`,
      sub: "Wind down with something interesting.",
    };
  return {
    salutation: `Late night, ${name}?`,
    sub: "The best ideas come after midnight.",
  };
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function ActivitySparkline() {
  const bars = [3, 7, 5, 12, 8, 15, 10];
  const max = Math.max(...bars);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "3px",
        height: "28px",
      }}
    >
      {bars.map((v, i) => (
        <div
          key={i}
          style={{
            width: "6px",
            height: `${(v / max) * 100}%`,
            background: i === bars.length - 1 ? "#3C3489" : "#C8C5E8",
            borderRadius: "2px",
            animation: `growUp 0.5s ease ${i * 0.07}s both`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Subject card ─────────────────────────────────────────────────────────────

function SubjectCard({ subject, index, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: hovered ? subject.lightColor : subject.cardBg,
        border: `1px solid ${hovered ? subject.midColor : subject.lightColor}`,
        borderRadius: "18px",
        padding: "1.5rem",
        cursor: "pointer",
        transition:
          "background 0.25s, border-color 0.25s, transform 0.2s, box-shadow 0.2s",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 12px 32px ${subject.lightColor}CC`
          : `0 2px 8px ${subject.lightColor}80`,
        animation: `fadeUp 0.5s ease ${0.15 + index * 0.1}s both`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background arc */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          background: subject.lightColor,
          opacity: hovered ? 0.7 : 0.5,
          transition: "opacity 0.3s, transform 0.3s",
          transform: hovered ? "scale(1.15)" : "scale(1)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-10px",
          right: "-10px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: subject.midColor,
          opacity: 0.15,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1rem",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "13px",
            background: "#fff",
            boxShadow: `0 2px 8px ${subject.lightColor}`,
            border: `1px solid ${subject.lightColor}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {subject.icon}
        </div>
        <div
          style={{
            fontSize: "0.67rem",
            fontWeight: 500,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: subject.accentColor,
            background: "#fff",
            padding: "3px 9px",
            borderRadius: "100px",
            border: `1px solid ${subject.lightColor}`,
            boxShadow: `0 1px 4px ${subject.lightColor}`,
          }}
        >
          {subject.subtitle}
        </div>
      </div>

      <h3
        style={{
          fontFamily: "'DM Serif Display',serif",
          fontSize: "1.2rem",
          fontWeight: 400,
          color: subject.darkColor,
          marginBottom: "0.4rem",
          letterSpacing: "-0.01em",
          position: "relative",
        }}
      >
        {subject.title}
      </h3>
      <p
        style={{
          fontSize: "0.82rem",
          color: "#6B6963",
          lineHeight: 1.6,
          marginBottom: "1.1rem",
          position: "relative",
        }}
      >
        {subject.description}
      </p>

      {/* Topic pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          position: "relative",
        }}
      >
        {subject.topics.map((t) => (
          <span
            key={t}
            style={{
              fontSize: "0.7rem",
              color: subject.accentColor,
              background: "#fff",
              padding: "3px 9px",
              borderRadius: "100px",
              border: `1px solid ${subject.lightColor}`,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Explore arrow */}
      <div
        style={{
          marginTop: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "0.8rem",
          fontWeight: 500,
          color: hovered ? subject.accentColor : subject.midColor,
          transition: "color 0.2s",
          position: "relative",
        }}
      >
        Explore
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            transform: hovered ? "translateX(4px)" : "translateX(0)",
            transition: "transform 0.22s",
          }}
        >
          <path
            d="M2 7h10M8 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, unit, sub, children }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.9)",
        borderRadius: "14px",
        padding: "1.1rem 1.2rem",
        boxShadow: "0 2px 12px rgba(60,52,137,0.06)",
      }}
    >
      <p
        style={{
          fontSize: "0.7rem",
          color: "#7B78A8",
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </p>
      {children ?? (
        <p
          style={{
            fontFamily: "'DM Serif Display',serif",
            fontSize: "1.8rem",
            color: "#1A1917",
            lineHeight: 1,
          }}
        >
          {value}
          <span
            style={{ fontSize: "1rem", color: "#C8C5E8", marginLeft: "2px" }}
          >
            {unit}
          </span>
        </p>
      )}
      {sub && (
        <p
          style={{ fontSize: "0.72rem", color: "#A09C95", marginTop: "0.3rem" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const [bookmarkHovered, setBookmarkHovered] = useState(false);

  const displayName = user?.firstName ?? "there";
  const greeting = getGreeting(displayName);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const stats = user?.stats ?? { completed: 0, total: 6, minutesSpent: 0 };
  const lastTopic = user?.lastTopic ?? null;
  const theme = user?.theme ?? "light";
  const font = user?.font ?? "neutral";
  const skill = user?.skill ?? "beginner";

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes growUp  { from { transform:scaleY(0); }                  to { transform:scaleY(1); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
        @keyframes drift   { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-14px) scale(1.03); } }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-thumb { background:#D3D1C7; border-radius:3px; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          fontFamily: "'DM Sans',system-ui,sans-serif",
          background: "#F6F5FF",
        }}
      >
        {/* ── Navbar ── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2.5rem",
            height: "60px",
            background: "rgba(246,245,255,0.88)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(174,169,236,0.25)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "7px",
                background: "#3C3489",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <polygon points="12 2 2 7 12 12 22 7" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'DM Serif Display',serif",
                fontSize: "1.05rem",
                color: "#1A1917",
                letterSpacing: "-0.01em",
              }}
            >
              Visualize
            </span>
          </div>
          <div
            style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(174,169,236,0.35)",
                borderRadius: "100px",
                padding: "5px 12px",
                fontSize: "0.78rem",
                color: "#534AB7",
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: 500,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="2" fill="#534AB7" />
                <circle
                  cx="6"
                  cy="6"
                  r="5"
                  stroke="#534AB7"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
              Focus
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#8884B8",
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
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#EEEDFE",
                  border: "1px solid #AFA9EC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                }}
              >
                {user?.avatar ?? "🦉"}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  color: "#A09C95",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </nav>

        {/* ══════════════════════════════════════════════════
            DASHBOARD ZONE — soft purple wash
        ══════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            background:
              "linear-gradient(160deg, #EEEDFE 0%, #F0EFFE 40%, #E8F4FD 100%)",
            overflow: "hidden",
          }}
        >
          {/* Drifting orbs — purely decorative */}
          {[
            {
              w: 320,
              h: 320,
              top: "-80px",
              left: "-60px",
              bg: "rgba(127,119,221,0.18)",
              dur: "14s",
              delay: "0s",
            },
            {
              w: 220,
              h: 220,
              top: "30px",
              right: "-40px",
              bg: "rgba(55,138,221,0.12)",
              dur: "18s",
              delay: "3s",
            },
            {
              w: 160,
              h: 160,
              bottom: "0px",
              left: "38%",
              bg: "rgba(93,202,165,0.13)",
              dur: "11s",
              delay: "1.5s",
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
                left: orb.left,
                right: orb.right,
                bottom: orb.bottom,
                animation: `drift ${orb.dur} ease-in-out infinite`,
                animationDelay: orb.delay,
                pointerEvents: "none",
              }}
            />
          ))}

          <div
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              padding: "3rem 2rem 3.5rem",
              position: "relative",
            }}
          >
            {/* Greeting + quote */}
            <section
              style={{
                marginBottom: "2.5rem",
                animation: "fadeUp 0.45s ease both",
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
                <div>
                  <h1
                    style={{
                      fontFamily: "'DM Serif Display',Georgia,serif",
                      fontSize: "clamp(1.9rem,4vw,2.6rem)",
                      color: "#26215C",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.1,
                      marginBottom: "0.45rem",
                    }}
                  >
                    {greeting.salutation}
                  </h1>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      color: "#534AB7",
                      lineHeight: 1.5,
                      opacity: 0.8,
                    }}
                  >
                    {greeting.sub}
                  </p>
                </div>
                {/* Quote card */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.65)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    borderRadius: "14px",
                    padding: "0.85rem 1.1rem",
                    maxWidth: "280px",
                    flexShrink: 0,
                    boxShadow: "0 2px 16px rgba(60,52,137,0.08)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "#534AB7",
                      lineHeight: 1.65,
                      fontStyle: "italic",
                      marginBottom: "0.35rem",
                      opacity: 0.85,
                    }}
                  >
                    "{quote.text}"
                  </p>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "#8884B8",
                      fontWeight: 500,
                    }}
                  >
                    — {quote.author}
                  </p>
                </div>
              </div>
            </section>

            {/* Stats strip */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: `1fr 1fr 1fr ${lastTopic ? "1.6fr" : ""}`,
                gap: "0.8rem",
                animation: "fadeUp 0.5s ease 0.08s both",
              }}
            >
              <StatCard
                label="Completed"
                value={stats.completed}
                unit={`/${stats.total}`}
                sub="topics done"
              />

              <StatCard
                label="Time spent"
                value={stats.minutesSpent}
                unit="m"
                sub="this week"
              />

              <StatCard label="Activity" sub="past 7 days">
                <ActivitySparkline />
              </StatCard>

              {/* Continue / bookmark card */}
              {lastTopic && (
                <div
                  onMouseEnter={() => setBookmarkHovered(true)}
                  onMouseLeave={() => setBookmarkHovered(false)}
                  onClick={() => navigate(lastTopic.path)}
                  style={{
                    background: bookmarkHovered
                      ? "rgba(255,255,255,0.9)"
                      : "rgba(255,255,255,0.72)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${bookmarkHovered ? "#AFA9EC" : "rgba(255,255,255,0.9)"}`,
                    borderRadius: "14px",
                    padding: "1.1rem 1.2rem",
                    cursor: "pointer",
                    transition:
                      "background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                    transform: bookmarkHovered ? "translateY(-2px)" : "none",
                    boxShadow: bookmarkHovered
                      ? "0 8px 24px rgba(60,52,137,0.13)"
                      : "0 2px 12px rgba(60,52,137,0.06)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      height: "3px",
                      width: `${lastTopic.progress}%`,
                      background: "linear-gradient(90deg,#7F77DD,#5DCAA5)",
                      borderRadius: "0 2px 0 0",
                      transition: "width 0.4s ease",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#534AB7",
                        animation: "pulse 2s ease infinite",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "#534AB7",
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Continue
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: "'DM Serif Display',serif",
                      fontSize: "1rem",
                      color: "#26215C",
                      marginBottom: "0.25rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {lastTopic.subject} — {lastTopic.topic}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#8884B8" }}>
                    {lastTopic.progress}% through
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "0.65rem",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                      color: bookmarkHovered ? "#3C3489" : "#AFA9EC",
                      transition: "color 0.2s",
                    }}
                  >
                    Pick up where you left off
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{
                        transform: bookmarkHovered
                          ? "translateX(3px)"
                          : "translateX(0)",
                        transition: "transform 0.2s",
                      }}
                    >
                      <path
                        d="M2 6h8M6 2l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            SUBJECTS ZONE — clean warm white
        ══════════════════════════════════════════════════ */}
        <div
          style={{
            background: "#FDFCFA",
            borderTop: "1px solid rgba(174,169,236,0.18)",
          }}
        >
          <div
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              padding: "2.75rem 2rem 4rem",
            }}
          >
            {/* Section heading */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                animation: "fadeUp 0.5s ease 0.18s both",
              }}
            >
              <div>
                <h2
                  style={{
                    fontFamily: "'DM Serif Display',serif",
                    fontSize: "1.35rem",
                    fontWeight: 400,
                    color: "#1A1917",
                    letterSpacing: "-0.015em",
                  }}
                >
                  Subjects
                </h2>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#A09C95",
                    marginTop: "2px",
                  }}
                >
                  Three topics, each with interactive visualizations
                </p>
              </div>
              <span style={{ fontSize: "0.78rem", color: "#A09C95" }}>
                {stats.completed} of {stats.total} complete
              </span>
            </div>

            {/* Subject cards */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
                gap: "1rem",
              }}
            >
              {SUBJECTS.map((subject, i) => (
                <SubjectCard
                  key={subject.key}
                  subject={subject}
                  index={i}
                  onClick={() => navigate(`/subject/${subject.key}`)}
                />
              ))}
            </section>

            {/* Footer */}
            <div
              style={{
                marginTop: "3rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #EDE9E0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                animation: "fadeUp 0.5s ease 0.4s both",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "#B4B2A9" }}>
                Your preferences —{" "}
                <span style={{ color: "#534AB7", textTransform: "capitalize" }}>
                  {theme} theme · {font} font · {skill} mode
                </span>
              </p>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  color: "#B4B2A9",
                  fontFamily: "'DM Sans',sans-serif",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                >
                  <circle cx="6" cy="6" r="2.5" />
                  <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" />
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
