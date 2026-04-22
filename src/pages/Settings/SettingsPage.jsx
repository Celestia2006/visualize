import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
import { themes } from "../../styles/themes";
import laikaImg from "../../assets/Laika.png";
import felicetteImg from "../../assets/Felicette.png";
import snowballImg from "../../assets/Snowball.png";
import argusImg from "../../assets/Argus.png";
import rexyImg from "../../assets/Rexy.png";
import hedwigImg from "../../assets/Hedwig.png";
import morphoImg from "../../assets/Morpho.png";
import akelaImg from "../../assets/Akela.png";
import festusImg from "../../assets/Festus.png";
import bluImg from "../../assets/Blu.png";
import machliImg from "../../assets/Machli.png";
import humphreyImg from "../../assets/Humphrey.png";
import gortImg from "../../assets/Gort.png";
import bambiImg from "../../assets/Bambi.png";
import nemoImg from "../../assets/Nemo.jpg";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATARS = [
  {
    emoji: "🐶",
    name: "Laika",
    image: laikaImg,
    title: "The Pioneer",
    description:
      "First in line, always. Laika dives into new topics headfirst, learns by doing, and keeps going even when no one else has been there before. A little lonely at the frontier, but she wouldn't trade it for anything.",
  },
  {
    emoji: "🐱",
    name: "Félicette",
    image: felicetteImg,
    title: "The Analyst",
    description:
      "She observes before she acts. Félicette watches, waits, and only moves when she's mapped the whole terrain — learning by understanding the why before the what. Quiet, precise, always three steps ahead.",
  },
  {
    emoji: "🐰",
    name: "Snowball",
    image: snowballImg,
    title: "The Wonderer",
    description:
      "Down the rabbit hole again. Snowball follows curiosity wherever it leads — one topic becomes five, one question opens ten doors. She doesn't study linearly; she stumbles into understanding and always arrives somewhere magical.",
  },
  {
    emoji: "🦚",
    name: "Argus",
    image: argusImg,
    title: "The Observer",
    description:
      "A hundred eyes, nothing escapes him. Argus absorbs everything at once — patterns, connections, the big picture. He learns by seeing how everything fits together before zooming in. Detail-oriented but never loses sight of the whole.",
  },
  {
    emoji: "🦕",
    name: "Rexy",
    image: rexyImg,
    title: "The Relentless",
    description:
      "She doesn't read the manual. She IS the manual. Rexy learns by sheer force — repetition, practice, trial and error. She'll attempt something a hundred times before she gets it, and she will get it. Setbacks are just warm-up laps.",
  },
  {
    emoji: "🦉",
    name: "Hedwig",
    title: "The Sage",
    image: hedwigImg,
    description:
      "She always delivers. Hedwig is methodical and loyal to the process — she reads everything, takes her time, and never skips steps. When she understands something, it stays with her forever.",
  },
  {
    emoji: "🦋",
    name: "Iris",
    image: morphoImg,
    title: "The Transformer",
    description:
      "She's not the same student she was yesterday. Iris absorbs knowledge in bursts — periods of quiet stillness, then sudden dramatic leaps in understanding. She connects concepts across completely different subjects and emerges changed every time.",
  },
  {
    emoji: "🐺",
    name: "Akela",
    image: akelaImg,
    title: "The Strategist",
    description:
      "He leads by knowing the terrain. Akela plans before he acts — maps out what he needs to learn, sets a path, and moves with quiet precision. He thinks in systems and structures, and never wastes a move.",
  },
  {
    emoji: "🐉",
    name: "Festus",
    image: festusImg,
    title: "The Chaotic Genius",
    description:
      "Somehow always works. Festus looks like he's flying off the rails — jumping between topics, making wild leaps in logic — but underneath the chaos there's a method no one else could have designed. He gets there. Loudly. With fire.",
  },
  {
    emoji: "🦜",
    name: "Blu",
    image: bluImg,
    title: "The Last of His Kind",
    description:
      "Rare things take time. Blue is the kind of learner who needs the right environment to thrive. He learns slowly at first, then all at once — and he doesn't just absorb information, he carries it like it matters. Because for him, it does.",
  },
  {
    emoji: "🐯",
    name: "Machli",
    image: machliImg,
    title: "The Queen",
    description:
      "Her territory is knowledge. Machli claims a subject and owns it — deep dives, no half-measures, and an almost territorial protectiveness over what she knows. She's been through harder things than this syllabus.",
  },
  {
    emoji: "🐋",
    name: "Humphrey",
    image: humphreyImg,
    title: "The Explorer",
    description:
      "He keeps getting lost. He keeps finding things. Humphrey doesn't learn in straight lines — he wanders into tangents, surfaces in unexpected places, and occasionally forgets what chapter he started on. But his detours are always worth it.",
  },
  {
    emoji: "🦫",
    name: "Gort",
    image: gortImg,
    title: "The Unbothered",
    description:
      "Stress? Never heard of it. Gort moves at his own pace, and somehow that pace works. He doesn't panic before exams, doesn't spiral on hard topics. He just keeps going — calmly, consistently — and somehow he always gets there.",
  },
  {
    emoji: "🦌",
    name: "Bambi",
    image: bambiImg,
    title: "The Gentle Learner",
    description:
      "He learns by watching the world. Bambi takes everything in softly — observation, reflection, slow understanding. He gets overwhelmed by intensity, but in quiet moments he absorbs more than anyone in the room. He doesn't race; he grows.",
  },
  {
    emoji: "🐠",
    name: "Nemo",
    image: nemoImg,
    title: "The Brave One",
    description:
      "Small, a little scared, absolutely going for it. Nemo is terrified of the hard stuff but does it anyway. He asks the questions others are embarrassed to ask, explores further than his comfort zone, and reminds everyone that courage is just showing up.",
  },
];

const THEMES = [
  {
    key: "light",
    label: "Light",
    desc: "Clean warm white",
    preview: {
      bg: "#F9F8F6",
      surface: "#fff",
      accent: "#3C3489",
      text: "#1A1917",
    },
  },
  {
    key: "dark",
    label: "Dark",
    desc: "Easy on the eyes",
    preview: {
      bg: "#1A1917",
      surface: "#2C2C2A",
      accent: "#AFA9EC",
      text: "#F9F8F6",
    },
  },
  {
    key: "cb-light",
    label: "Colorblind Light",
    desc: "High contrast, light",
    preview: {
      bg: "#FFF9DB",
      surface: "#fff",
      accent: "#0047AB",
      text: "#1A1917",
    },
  },
  {
    key: "cb-dark",
    label: "Colorblind Dark",
    desc: "High contrast, dark",
    preview: {
      bg: "#001A2C",
      surface: "#0D2137",
      accent: "#FFD700",
      text: "#F9F8F6",
    },
  },
];

const FONTS = [
  {
    key: "neutral",
    label: "Neutral",
    desc: "Clean, modern, easy to read",
    sample: "The quick brown fox",
    family: "selectedFont.family",
  },
  {
    key: "academic",
    label: "Academic",
    desc: "Scholarly serif — classic feel",
    sample: "The quick brown fox",
    family: "'DM Serif Display', Georgia, serif",
  },
  {
    key: "dyslexic",
    label: "Dyslexic-friendly",
    desc: "Optimised letter spacing",
    sample: "The quick brown fox",
    family: "'Comic Sans MS', 'Chalkboard SE', cursive",
  },
];

const FONT_SIZES = [
  { key: "sm", label: "Small", size: "0.82rem", desc: "More content visible" },
  { key: "md", label: "Default", size: "0.95rem", desc: "Balanced" },
  { key: "lg", label: "Large", size: "1.08rem", desc: "Easier to read" },
  {
    key: "xl",
    label: "Extra large",
    size: "1.2rem",
    desc: "Maximum readability",
  },
];

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

// T is built inside the component from the active theme — see below
const STATIC = {
  success: "#3B6D11",
  successLt: "#EAF3DE",
  danger: "#A32D2D",
  dangerLt: "#FCEBEB",
};

// ─── Avatar image with emoji fallback (mirrors onboarding) ───────────────────

function AvatarImage({ avatar, size, style: extraStyle = {} }) {
  const [failed, setFailed] = useState(false);
  if (!avatar.image || failed) {
    return (
      <span style={{ fontSize: size * 0.45, lineHeight: 1 }}>
        {avatar.emoji}
      </span>
    );
  }
  return (
    <img
      src={avatar.image}
      alt={avatar.name}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: "50%",
        ...extraStyle,
      }}
    />
  );
}

// ─── Avatar picker modal — hero + thumbnail grid, mirrors onboarding ──────────

function AvatarPickerModal({ T, initialIdx, onSelect, onClose }) {
  const [hovered, setHovered] = useState(initialIdx);
  const current = AVATARS[hovered] ?? AVATARS[0];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          background: T.warm,
          borderRadius: "20px",
          padding: "2rem",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "88vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
          animation: "fadeUp 0.22s ease",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'DM Serif Display',serif",
                fontSize: "1.2rem",
                color: T.dark,
                letterSpacing: "-0.01em",
              }}
            >
              Choose your avatar
            </h2>
            <p
              style={{ fontSize: "0.78rem", color: T.muted, marginTop: "2px" }}
            >
              Pick the learner that feels like you.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1rem",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Hero — selected avatar large display */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: T.light,
              border: `3px solid ${T.accent}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.55rem",
              boxShadow: `0 0 0 6px ${T.accentLight ?? T.light}`,
              transition: "all 0.25s ease",
              overflow: "hidden",
            }}
          >
            <AvatarImage avatar={current} size={74} />
          </div>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: T.dark }}>
            {current.name}
          </p>
          <p
            style={{
              fontSize: "0.82rem",
              fontWeight: 500,
              color: T.accent,
              marginTop: "2px",
            }}
          >
            {current.title}
          </p>
          <p
            style={{
              fontSize: "0.78rem",
              color: T.muted,
              marginTop: "0.5rem",
              lineHeight: 1.55,
              maxWidth: "300px",
              margin: "0.5rem auto 0",
            }}
          >
            {current.description}
          </p>
        </div>

        {/* Thumbnail grid */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0.55rem",
          }}
        >
          {AVATARS.map((a, i) => (
            <div
              key={a.name}
              onClick={() => setHovered(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setHovered(i)}
              title={`${a.name} — ${a.title}`}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                border: `2px solid ${hovered === i ? T.accent : "transparent"}`,
                background:
                  hovered === i ? T.light : (T.surfaceAlt ?? "#F4F2EE"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                transition:
                  "border-color 0.2s, background 0.2s, transform 0.15s",
                transform: hovered === i ? "scale(1.18)" : "scale(1)",
                boxShadow:
                  hovered === i
                    ? `0 0 0 4px ${T.accentLight ?? T.light}`
                    : "none",
              }}
            >
              <AvatarImage avatar={a} size={52} />
            </div>
          ))}
        </div>

        {/* Confirm button */}
        <button
          onClick={() => onSelect(current.name)}
          style={{
            width: "100%",
            padding: "0.68rem",
            background: T.accent,
            color: "#fff",
            border: "none",
            borderRadius: "9px",
            fontFamily: "'DM Sans',sans-serif",
            fontSize: "0.9rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
        >
          Choose {current.name} →
        </button>
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, desc, children, danger, T }) {
  return (
    <div
      style={{
        background: T.warm,
        border: `1px solid ${danger ? "#F7C1C1" : T.border}`,
        borderRadius: "16px",
        overflow: "hidden",
        animation: "fadeUp 0.4s ease both",
      }}
    >
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: `1px solid ${danger ? "#FCEBEB" : T.border}`,
          background: danger ? "#FCEBEB" : T.bg,
        }}
      >
        <h2
          style={{
            fontFamily: "selectedFont.family",
            fontSize: "1.05rem",
            fontWeight: 400,
            color: danger ? T.danger : T.dark,
            letterSpacing: "-0.01em",
            marginBottom: desc ? "2px" : 0,
          }}
        >
          {title}
        </h2>
        {desc && (
          <p
            style={{ fontSize: "0.78rem", color: danger ? "#C15050" : T.muted }}
          >
            {desc}
          </p>
        )}
      </div>
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  );
}

// ─── Unsaved indicator ────────────────────────────────────────────────────────

function UnsavedDot() {
  return (
    <div
      style={{
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#EF9F27",
        animation: "pulse 2s ease infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, updatePreference, logout } = useUserStore();

  // Local draft state — only committed on Save
  const [draft, setDraft] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    avatar: user?.avatar ?? AVATARS[0],
    theme: user?.theme ?? "light",
    font: user?.font ?? "neutral",
    fontSize: user?.fontSize ?? "md",
    skill: user?.skill ?? "beginner",
  });

  // Build T from the draft theme using THEME_CONFIGS
  const tc = THEME_CONFIGS[draft.theme] ?? THEME_CONFIGS.light;
  const T = {
    accent: tc.accent,
    light: tc.cardBg,
    mid: tc.accent + "88", // derived mid-tone from accent with opacity
    dark: tc.text,
    muted: tc.subtext,
    border: tc.border,
    warm: tc.panel,
    bg: tc.bg,
    ...STATIC,
  };

  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const isDirty =
    JSON.stringify(draft) !==
    JSON.stringify({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      avatar: user?.avatar ?? AVATARS[0],
      theme: user?.theme ?? "light",
      font: user?.font ?? "neutral",
      fontSize: user?.fontSize ?? "md",
      skill: user?.skill ?? "beginner",
    });

  function set(key, val) {
    setDraft((d) => ({ ...d, [key]: val }));
    setSaved(false);
  }

  function handleSave() {
    Object.entries(draft).forEach(([key, val]) => updatePreference(key, val));
    setSaved(true);
    setTimeout(() => navigate("/landing"), 800);
  }

  function handleResetProgress() {
    updatePreference("stats", { completed: 0, total: 6, minutesSpent: 0 });
    updatePreference("lastTopic", null);
    setConfirmReset(false);
  }

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  const selectedTheme = THEMES.find((t) => t.key === draft.theme) ?? THEMES[0];
  const selectedFont = FONTS.find((f) => f.key === draft.font) ?? FONTS[0];
  const selectedSize =
    FONT_SIZES.find((f) => f.key === draft.fontSize) ?? FONT_SIZES[1];

  return (
    <>
      {avatarPickerOpen && (
        <AvatarPickerModal
          T={T}
          initialIdx={Math.max(
            0,
            AVATARS.findIndex(
              (a) => a.name === draft.avatar || a.emoji === draft.avatar,
            ),
          )}
          onSelect={(name) => {
            set("avatar", name);
            setAvatarPickerOpen(false);
          }}
          onClose={() => setAvatarPickerOpen(false)}
        />
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes drift  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #D3D1C7; border-radius: 3px; }
        input[type=text], input[type=email] {
          width: 100%; padding: 0.58rem 0.8rem;
          border: 1px solid ${T.border}; border-radius: 9px;
          font-family: selectedFont.family;
          font-size: 0.9rem; color: ${T.dark}; background: ${T.warm};
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
        }
        input[type=text]:focus, input[type=email]:focus {
          border-color: ${T.mid}; box-shadow: 0 0 0 3px ${T.light};
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          fontFamily: "selectedFont.family",
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
            background: "rgba(246,245,255,0.9)",
            backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${T.light}80`,
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <button
              onClick={() => navigate("/landing")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.muted,
                fontFamily: "selectedFont.family",
                fontSize: "0.82rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M10 7H4M6 4l-3 3 3 3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Dashboard
            </button>
            <span style={{ color: T.border }}>·</span>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "5px",
                  background: T.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polygon points="12 2 2 7 12 12 22 7" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <span
                style={{
                  fontFamily: "selectedFont.family",
                  fontSize: "0.95rem",
                  color: T.dark,
                }}
              >
                Settings
              </span>
            </div>
          </div>

          {/* Save bar */}
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            {isDirty && !saved && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.78rem",
                  color: "#854F0B",
                  animation: "fadeUp 0.2s ease",
                }}
              >
                <UnsavedDot />
                Unsaved changes
              </div>
            )}
            {saved && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.78rem",
                  color: T.success,
                  animation: "fadeUp 0.2s ease",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <polyline
                    points="2,6.5 5,9.5 11,3.5"
                    stroke={T.success}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Saved
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty}
              style={{
                padding: "0.45rem 1.1rem",
                background: isDirty ? T.accent : T.light,
                color: isDirty ? "#fff" : T.muted,
                border: "none",
                borderRadius: "9px",
                fontFamily: "selectedFont.family",
                fontSize: "0.85rem",
                fontWeight: 500,
                cursor: isDirty ? "pointer" : "default",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              Save changes
            </button>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: T.light,
                border: `1px solid ${T.mid}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {(() => {
                const av = AVATARS.find(
                  (a) => a.name === draft.avatar || a.emoji === draft.avatar,
                );
                return av ? (
                  <AvatarImage avatar={av} size={30} />
                ) : (
                  <span style={{ fontSize: "1rem" }}>
                    {draft.avatar?.emoji ?? "🦉"}
                  </span>
                );
              })()}
            </div>
          </div>
        </nav>

        {/* ── Header ── */}
        <div
          style={{
            background: `linear-gradient(150deg, ${T.light} 0%, #EAF3DE 100%)`,
            borderBottom: `1px solid ${T.mid}40`,
            padding: "2rem 2.5rem 1.75rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {[
            {
              w: 200,
              h: 200,
              top: "-60px",
              right: "8%",
              bg: "rgba(127,119,221,0.15)",
              dur: "14s",
            },
            {
              w: 130,
              h: 130,
              bottom: "-30px",
              left: "55%",
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
          <div style={{ position: "relative", maxWidth: "720px" }}>
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
              Your account
            </p>
            <h1
              style={{
                fontFamily: "selectedFont.family",
                fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                color: T.dark,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                marginBottom: "0.5rem",
              }}
            >
              Settings
            </h1>
            <p
              style={{
                fontSize: "1rem",
                color:
                  draft.theme === "dark" || draft.theme === "cb-dark"
                    ? "#ffffff"
                    : "#747474",
                lineHeight: 1.65,
              }}
            >
              Personalise your experience — theme, typography, skill level, and
              more. Changes take effect after you save.
            </p>
          </div>
        </div>

        {/* ── Content ── */}
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: "2.5rem 2rem 5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* ── Profile ── */}
          <Section
            title="Profile"
            desc="Your name and avatar shown across the app"
            T={T}
          >
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              {/* Avatar — display current + edit button */}
              <div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: T.muted,
                    marginBottom: "0.6rem",
                  }}
                >
                  Avatar
                </p>
                {(() => {
                  const current =
                    AVATARS.find(
                      (a) =>
                        a.name === draft.avatar || a.emoji === draft.avatar,
                    ) ?? AVATARS[0];
                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.55rem",
                        width: "130px",
                      }}
                    >
                      {/* Hero circle */}
                      <div
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                          background: T.light,
                          border: `3px solid ${T.accent}`,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: `0 0 0 5px ${T.accentLight ?? T.light}`,
                          overflow: "hidden",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <AvatarImage avatar={current} size={100} />
                      </div>
                      <p
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: T.dark,
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {current.name}
                      </p>
                      <p
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          color: T.accent,
                          textAlign: "center",
                        }}
                      >
                        {current.title}
                      </p>
                      {/* Edit button */}
                      <button
                        onClick={() => setAvatarPickerOpen(true)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "5px 14px",
                          borderRadius: "100px",
                          border: `1px solid ${T.border}`,
                          background: T.warm,
                          color: T.accent,
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          fontFamily: "'DM Sans',sans-serif",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          marginTop: "2px",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = T.light)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = T.warm)
                        }
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 11 11"
                          fill="none"
                        >
                          <path
                            d="M7.5 1.5l2 2L3 10H1V8L7.5 1.5z"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Change
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Name + email */}
              <div
                style={{
                  flex: 1,
                  minWidth: "220px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: T.muted,
                        marginBottom: "5px",
                      }}
                    >
                      First name
                    </label>
                    <input
                      type="text"
                      value={draft.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="Alex"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: T.muted,
                        marginBottom: "5px",
                      }}
                    >
                      Last name
                    </label>
                    <input
                      type="text"
                      value={draft.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      placeholder="Chen"
                    />
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.72rem",
                      fontWeight: 500,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: T.muted,
                      marginBottom: "5px",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@university.edu"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* ── Theme ── */}
          <Section title="Theme" desc="Choose how Visualize looks" T={T}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {THEMES.map((theme) => {
                const selected = draft.theme === theme.key;
                return (
                  <button
                    key={theme.key}
                    onClick={() => set("theme", theme.key)}
                    style={{
                      border: `2px solid ${selected ? T.accent : T.border}`,
                      borderRadius: "13px",
                      overflow: "hidden",
                      cursor: "pointer",
                      background: "none",
                      padding: 0,
                      transition:
                        "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
                      transform: selected ? "translateY(-2px)" : "none",
                      boxShadow: selected ? `0 6px 20px ${T.light}CC` : "none",
                    }}
                  >
                    {/* Preview swatch */}
                    <div
                      style={{
                        background: theme.preview.bg,
                        padding: "0.85rem 0.85rem 0.65rem",
                        borderBottom: `1px solid ${selected ? T.mid : T.border}`,
                      }}
                    >
                      {/* Mini UI mockup */}
                      <div
                        style={{
                          background: theme.preview.surface,
                          borderRadius: "6px",
                          padding: "6px 8px",
                          marginBottom: "5px",
                          border: `0.5px solid ${theme.preview.accent}30`,
                        }}
                      >
                        <div
                          style={{
                            width: "55%",
                            height: "5px",
                            borderRadius: "2px",
                            background: theme.preview.accent,
                            marginBottom: "4px",
                            opacity: 0.8,
                          }}
                        />
                        <div
                          style={{
                            width: "80%",
                            height: "3px",
                            borderRadius: "2px",
                            background: theme.preview.text,
                            opacity: 0.15,
                          }}
                        />
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[
                          theme.preview.accent,
                          theme.preview.text + "30",
                          theme.preview.text + "18",
                        ].map((c, i) => (
                          <div
                            key={i}
                            style={{
                              flex: i === 0 ? 0.6 : 1,
                              height: "3px",
                              borderRadius: "2px",
                              background: c,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Label */}
                    <div
                      style={{
                        background: "#fff",
                        padding: "0.6rem 0.85rem",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            color: T.dark,
                          }}
                        >
                          {theme.label}
                        </p>
                        {selected && (
                          <div
                            style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "50%",
                              background: T.accent,
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
                      <p
                        style={{
                          fontSize: "0.7rem",
                          color: T.muted,
                          marginTop: "1px",
                        }}
                      >
                        {theme.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Font style ── */}
          <Section
            title="Font style"
            desc="Pick what feels most comfortable to read"
            T={T}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              {FONTS.map((font) => {
                const selected = draft.font === font.key;
                return (
                  <button
                    key={font.key}
                    onClick={() => set("font", font.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.9rem 1.1rem",
                      background: selected ? T.light : "#fff",
                      border: `1px solid ${selected ? T.accent : T.border}`,
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.18s, border-color 0.18s",
                    }}
                  >
                    {/* Sample text */}
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontFamily: font.family,
                          fontSize: "1.05rem",
                          color: T.dark,
                          marginBottom: "2px",
                          lineHeight: 1.3,
                        }}
                      >
                        {font.sample}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 500,
                            color: selected ? T.accent : T.dark,
                          }}
                        >
                          {font.label}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: T.muted }}>
                          · {font.desc}
                        </span>
                      </div>
                    </div>
                    {selected && (
                      <div
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: T.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6">
                          <polyline
                            points="1,3 3,5 7,1"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Font size ── */}
          <Section
            title="Font size"
            desc="Adjust text size across explanations and content"
            T={T}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "0.6rem",
              }}
            >
              {FONT_SIZES.map((fs) => {
                const selected = draft.fontSize === fs.key;
                return (
                  <button
                    key={fs.key}
                    onClick={() => set("fontSize", fs.key)}
                    style={{
                      padding: "0.85rem 0.5rem",
                      background: selected ? T.light : "#fff",
                      border: `1px solid ${selected ? T.accent : T.border}`,
                      borderRadius: "12px",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "background 0.18s, border-color 0.18s",
                    }}
                  >
                    <p
                      style={{
                        fontSize: fs.size,
                        color: T.dark,
                        fontWeight: 500,
                        marginBottom: "4px",
                        lineHeight: 1,
                        fontFamily: "selectedFont.family",
                      }}
                    >
                      Aa
                    </p>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        color: selected ? T.accent : T.dark,
                        marginBottom: "2px",
                      }}
                    >
                      {fs.label}
                    </p>
                    <p style={{ fontSize: "0.65rem", color: T.muted }}>
                      {fs.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Live preview */}
            <div
              style={{
                marginTop: "1rem",
                background: T.warm,
                border: `1px solid ${T.border}`,
                borderRadius: "10px",
                padding: "1rem 1.15rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 500,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: T.muted,
                  marginBottom: "0.5rem",
                }}
              >
                Preview
              </p>
              <p
                style={{
                  fontFamily:
                    FONTS.find((f) => f.key === draft.font)?.family ??
                    "selectedFont.family",
                  fontSize: selectedSize.size,
                  color: T.dark,
                  lineHeight: 1.7,
                }}
              >
                The sigmoid function squashes any real number into the range (0,
                1), letting us interpret its output as a probability.
              </p>
            </div>
          </Section>

          {/* ── Skill level ── */}
          <Section
            title="Skill level"
            desc="Controls language and terminology used by the AI assistant"
            T={T}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              {[
                {
                  key: "beginner",
                  emoji: "🌱",
                  label: "Beginner",
                  desc: "Plain English explanations. No assumed prior knowledge.",
                },
                {
                  key: "experienced",
                  emoji: "⚡",
                  label: "Experienced",
                  desc: "Technical terminology. Denser, more precise explanations.",
                },
              ].map((opt) => {
                const selected = draft.skill === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => set("skill", opt.key)}
                    style={{
                      padding: "1.1rem 1.15rem",
                      background: selected ? T.light : "#fff",
                      border: `2px solid ${selected ? T.accent : T.border}`,
                      borderRadius: "13px",
                      cursor: "pointer",
                      textAlign: "left",
                      position: "relative",
                      transition:
                        "background 0.18s, border-color 0.18s, transform 0.15s",
                      transform: selected ? "translateY(-2px)" : "none",
                      boxShadow: selected ? `0 6px 18px ${T.light}CC` : "none",
                    }}
                  >
                    {selected && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          background: T.accent,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6">
                          <polyline
                            points="1,3 3,5 7,1"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                      {opt.emoji}
                    </div>
                    <p
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        color: T.dark,
                        marginBottom: "4px",
                      }}
                    >
                      {opt.label}
                    </p>
                    <p
                      style={{
                        fontSize: "0.78rem",
                        color: T.muted,
                        lineHeight: 1.55,
                      }}
                    >
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* ── Progress reset ── */}
          <Section
            title="Progress & bookmarks"
            desc="Manage your learning data"
            danger
            T={T}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {/* Progress summary */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {[
                  {
                    label: "Topics completed",
                    value: user?.stats?.completed ?? 0,
                  },
                  {
                    label: "Minutes spent",
                    value: user?.stats?.minutesSpent ?? 0,
                  },
                  {
                    label: "Last bookmark",
                    value: user?.lastTopic ? user.lastTopic.topic : "None",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      flex: 1,
                      background: "#F9F8F6",
                      border: "1px solid #EDE9E0",
                      borderRadius: "10px",
                      padding: "0.75rem 0.9rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.68rem",
                        color: "#9A9590",
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginBottom: "3px",
                      }}
                    >
                      {stat.label}
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 500,
                        color: T.dark,
                        fontFamily: "selectedFont.family",
                      }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reset button */}
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  style={{
                    padding: "0.65rem 1.1rem",
                    background: "transparent",
                    border: `1px solid #F7C1C1`,
                    borderRadius: "9px",
                    fontFamily: "selectedFont.family",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: T.danger,
                    cursor: "pointer",
                    width: "fit-content",
                    transition: "background 0.18s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#FCEBEB")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  Reset all progress and bookmarks
                </button>
              ) : (
                <div
                  style={{
                    background: "#FCEBEB",
                    border: "1px solid #F7C1C1",
                    borderRadius: "10px",
                    padding: "1rem 1.15rem",
                    animation: "fadeUp 0.2s ease",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: T.danger,
                      fontWeight: 500,
                      marginBottom: "4px",
                    }}
                  >
                    Are you sure?
                  </p>
                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "#C15050",
                      marginBottom: "0.85rem",
                      lineHeight: 1.5,
                    }}
                  >
                    This will clear all completed topics, time spent, and your
                    last bookmark. This cannot be undone.
                  </p>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button
                      onClick={handleResetProgress}
                      style={{
                        padding: "0.5rem 1rem",
                        background: T.danger,
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontFamily: "selectedFont.family",
                        fontSize: "0.82rem",
                        fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      Yes, reset everything
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#fff",
                        color: T.dark,
                        border: "1px solid #E4E2DC",
                        borderRadius: "8px",
                        fontFamily: "selectedFont.family",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* ── Sign out ── */}
          <div style={{ paddingTop: "0.5rem" }}>
            {!confirmLogout ? (
              <button
                onClick={() => setConfirmLogout(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  color: T.muted,
                  fontFamily: "selectedFont.family",
                  padding: "0.4rem 0",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                >
                  <path d="M5 11H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2M9 9l3-3-3-3M12 6.5H5" />
                </svg>
                Sign out
              </button>
            ) : (
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${T.border}`,
                  borderRadius: "10px",
                  padding: "1rem 1.15rem",
                  animation: "fadeUp 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <p style={{ fontSize: "0.85rem", color: T.dark }}>
                  Sign out of Visualize?
                </p>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: "0.45rem 0.9rem",
                      background: T.dark,
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontFamily: "selectedFont.family",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Sign out
                  </button>
                  <button
                    onClick={() => setConfirmLogout(false)}
                    style={{
                      padding: "0.45rem 0.9rem",
                      background: "transparent",
                      color: T.muted,
                      border: `1px solid ${T.border}`,
                      borderRadius: "8px",
                      fontFamily: "selectedFont.family",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
