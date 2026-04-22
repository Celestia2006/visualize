import { useState, useEffect } from "react";
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
            background:
              i === bars.length - 1 ? "var(--accent)" : "var(--accent-mid)",
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
            fontSize: "0.67em",
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
          fontFamily: "var(--font-body)",
          fontSize: "1.2em",
          fontWeight: 700,
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
          fontSize: "0.82em",
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
              fontSize: "0.7em",
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
          fontSize: "0.8em",
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
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--card-bg-hover)" : "var(--card-bg)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${hovered ? "var(--accent-mid)" : "var(--border)"}`,
        borderRadius: "14px",
        padding: "1.1rem 1.2rem",
        boxShadow: hovered
          ? "0 6px 20px var(--shadow)"
          : "0 2px 12px var(--shadow)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition:
          "background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s",
      }}
    >
      <p
        style={{
          fontSize: "0.7em",
          color: "var(--text-muted)",
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
            fontFamily: "var(--font-body)",
            fontSize: "1.8em",
            color: "var(--text)",
            lineHeight: 1,
          }}
        >
          {value}
          <span
            style={{
              fontSize: "1em",
              color: "var(--text-muted)",
              marginLeft: "2px",
            }}
          >
            {unit}
          </span>
        </p>
      )}
      {sub && (
        <p
          style={{
            fontSize: "0.72em",
            color: "var(--text-faint)",
            marginTop: "0.3rem",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Quote card ───────────────────────────────────────────────────────────────

function QuoteCard({ quote }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--card-bg-hover)" : "var(--card-bg)",
        backdropFilter: "blur(10px)",
        border: `1px solid ${hovered ? "var(--accent-mid)" : "var(--border)"}`,
        borderRadius: "14px",
        padding: "0.85rem 1.1rem",
        maxWidth: "280px",
        flexShrink: 0,
        boxShadow: hovered
          ? "0 6px 20px var(--shadow)"
          : "0 2px 16px var(--shadow)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition:
          "background 0.2s, border-color 0.2s, box-shadow 0.2s, transform 0.2s",
      }}
    >
      <p
        style={{
          fontSize: "0.78em",
          color: "var(--text-muted)",
          lineHeight: 1.65,
          fontStyle: "italic",
          marginBottom: "0.35rem",
          opacity: 0.9,
        }}
      >
        "{quote.text}"
      </p>
      <p
        style={{
          fontSize: "0.7em",
          color: "var(--text-faint)",
          fontWeight: 500,
        }}
      >
        — {quote.author}
      </p>
    </div>
  );
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, logout } = useUserStore();
  const navigate = useNavigate();
  const [bookmarkHovered, setBookmarkHovered] = useState(false);
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
          fontFamily: "var(--font-body)",
          fontSize: "var(--font-size-base)",
          background: "var(--bg)",
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
            background: "var(--nav-bg)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid var(--border)",
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
                background: "var(--accent)",
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
                fontFamily: "var(--font-body)",
                fontSize: "1.05em",
                color: "var(--text)",
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
              onClick={focusMode ? exitFocus : enterFocus}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: focusMode ? "var(--accent)" : "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "100px",
                padding: "5px 12px",
                fontSize: "0.78em",
                color: focusMode ? "#fff" : "var(--accent)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {focusMode ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="2" fill="var(--accent)" />
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    stroke="var(--accent)"
                    strokeWidth="1"
                    fill="none"
                  />
                </svg>
              )}
              {focusMode ? "Exit Focus" : "Focus"}
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

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AvatarNavBubble user={user} />
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.78em",
                  color: "var(--text-faint)",
                  fontFamily: "var(--font-body)",
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
              "linear-gradient(160deg, var(--accent-light) 0%, var(--surface-alt) 55%, var(--surface-alt) 100%)",
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
                      fontFamily: "var(--font-body)",
                      fontSize: "clamp(1.9em,4vw,2.6em)",
                      fontWeight: 700,
                      color: "var(--text)",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.1,
                      marginBottom: "0.45rem",
                    }}
                  >
                    {greeting.salutation}
                  </h1>
                  <p
                    style={{
                      fontSize: "0.95em",
                      color: "var(--accent)",
                      lineHeight: 1.5,
                      opacity: 0.8,
                    }}
                  >
                    {greeting.sub}
                  </p>
                </div>
                {/* Quote card */}
                <QuoteCard quote={quote} />
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
                      ? "var(--card-bg-hover)"
                      : "var(--card-bg)",
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${bookmarkHovered ? "var(--accent-mid)" : "var(--border)"}`,
                    borderRadius: "14px",
                    padding: "1.1rem 1.2rem",
                    cursor: "pointer",
                    transition:
                      "background 0.2s, border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                    transform: bookmarkHovered ? "translateY(-2px)" : "none",
                    boxShadow: bookmarkHovered
                      ? "0 8px 24px var(--shadow)"
                      : "0 2px 12px var(--shadow)",
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
                        background: "var(--accent)",
                        animation: "pulse 2s ease infinite",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.7em",
                        color: "var(--accent)",
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
                      fontFamily: "var(--font-body)",
                      fontSize: "1em",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: "0.25rem",
                      lineHeight: 1.3,
                    }}
                  >
                    {lastTopic.subject} — {lastTopic.topic}
                  </p>
                  <p style={{ fontSize: "0.72em", color: "var(--text-muted)" }}>
                    {lastTopic.progress}% through
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "0.65rem",
                      fontSize: "0.78em",
                      fontWeight: 500,
                      color: bookmarkHovered
                        ? "var(--accent)"
                        : "var(--accent-mid)",
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
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
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
                    fontFamily: "var(--font-body)",
                    fontSize: "1.35em",
                    fontWeight: 700,
                    color: "var(--text)",
                    letterSpacing: "-0.015em",
                  }}
                >
                  Subjects
                </h2>
                <p
                  style={{
                    fontSize: "0.8em",
                    color: "var(--text-faint)",
                    marginTop: "2px",
                  }}
                >
                  Three topics, each with interactive visualizations
                </p>
              </div>
              <span style={{ fontSize: "0.78em", color: "var(--text-faint)" }}>
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
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                animation: "fadeUp 0.5s ease 0.4s both",
              }}
            >
              <p style={{ fontSize: "0.75em", color: "var(--text-faint)" }}>
                Your preferences —{" "}
                <span
                  style={{
                    color: "var(--accent)",
                    textTransform: "capitalize",
                  }}
                >
                  {theme} theme · {font} font · {skill} mode
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
