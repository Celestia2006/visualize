import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../../store/userStore";
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

// ─── Avatar data ─────────────────────────────────────────────────────────────

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

// ─── Theme configs ────────────────────────────────────────────────────────────

const THEME_CONFIGS = {
  light: { label: "Light", bg: "#F9F8F6", panel: "#FFFFFF", text: "#1A1917", subtext: "#6B6963", accent: "#3C3489", border: "#E4E2DC", cardBg: "#EEEDFE" },
  dark: { label: "Dark", bg: "#1A1917", panel: "#252321", text: "#F0EDE8", subtext: "#8A8680", accent: "#AFA9EC", border: "#333333", cardBg: "#2D2A3E" },
  "cb-light": { label: "CB Light", bg: "#FFF9E8", panel: "#FFFFFF", text: "#1A1400", subtext: "#5A5030", accent: "#C0720A", border: "#E8D890", cardBg: "#FFF0C0" },
  "cb-dark": { label: "CB Dark", bg: "#001020", panel: "#0A1928", text: "#E0F0FF", subtext: "#7090A0", accent: "#40B0FF", border: "#1A3040", cardBg: "#0A2840" },
};

const FONT_CONFIGS = [
  { key: "neutral", label: "Neutral", family: "'DM Sans', sans-serif", desc: "Clean & modern" },
  { key: "academic", label: "Academic", family: "'DM Serif Display', serif", desc: "Scholarly & refined" },
  { key: "dyslexic", label: "Dyslexic-friendly", family: "'Comic Sans MS', 'Chalkboard SE', cursive", desc: "High readability" },
];

const FONT_SIZE_CONFIGS = [
  { key: "sm", label: "Small", size: "0.85rem", preview: "14px" },
  { key: "md", label: "Medium", size: "1rem", preview: "16px" },
  { key: "lg", label: "Large", size: "1.125rem", preview: "18px" },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const S = {
  btnPrimary: {
    width: "100%", padding: "0.68rem", background: "#3C3489", color: "#fff",
    border: "none", borderRadius: "9px", fontFamily: "'DM Sans',system-ui,sans-serif",
    fontSize: "0.9rem", fontWeight: 500, cursor: "pointer", transition: "opacity 0.2s",
  },
  btnGhost: {
    flex: 1, padding: "0.65rem", background: "transparent", color: "#6B6963",
    border: "0.5px solid #E4E2DC", borderRadius: "9px",
    fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: "0.9rem", cursor: "pointer",
  },
  optCard: (sel) => ({
    border: `0.5px solid ${sel ? "#3C3489" : "#E4E2DC"}`,
    background: sel ? "#EEEDFE" : "#fff", borderRadius: "10px",
    padding: "0.8rem 1rem", cursor: "pointer", position: "relative",
    transition: "border-color 0.2s, background 0.2s, transform 0.15s",
    transform: sel ? "scale(1.015)" : "scale(1)",
  }),
  sectionHead: {
    fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "#A09C95", marginBottom: "0.6rem",
  },
  label: {
    display: "block", fontSize: "0.72rem", fontWeight: 500,
    letterSpacing: "0.06em", textTransform: "uppercase",
    color: "#6B6963", marginBottom: "0.35rem",
  },
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function StepDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: "5px", marginBottom: "1.4rem" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          height: "5px",
          width: i === current ? "22px" : "5px",
          borderRadius: "3px",
          background: i === current ? "#3C3489" : i < current ? "#AFA9EC" : "#E4E2DC",
          transition: "all 0.35s ease",
        }} />
      ))}
    </div>
  );
}

function CheckBadge() {
  return (
    <div style={{
      position: "absolute", top: "8px", right: "8px", width: "15px", height: "15px",
      borderRadius: "50%", background: "#3C3489", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <svg width="7" height="5" viewBox="0 0 7 5">
        <polyline points="1,2.5 2.8,4 6,1" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function StepHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: "1.3rem", color: "#1A1917", marginBottom: "0.25rem" }}>
        {title}
      </h2>
      {subtitle && <p style={{ fontSize: "0.82rem", color: "#A09C95", lineHeight: 1.55 }}>{subtitle}</p>}
    </div>
  );
}

// ─── Theme preview card ───────────────────────────────────────────────────────

function ThemePreviewCard({ themeKey, isSelected, onClick }) {
  const cfg = THEME_CONFIGS[themeKey];
  return (
    <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        cursor: "pointer", borderRadius: "12px",
        border: `2px solid ${isSelected ? "#3C3489" : "#E4E2DC"}`, overflow: "hidden",
        transition: "border-color 0.2s, transform 0.15s, box-shadow 0.2s",
        transform: isSelected ? "scale(1.03)" : "scale(1)",
        boxShadow: isSelected ? "0 0 0 4px rgba(60,52,137,0.12)" : "0 2px 8px rgba(0,0,0,0.08)",
      }}>
      <div style={{ background: cfg.bg, padding: "10px", minHeight: "88px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "7px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: cfg.accent }} />
          <div style={{ flex: 1, height: "3px", borderRadius: "2px", background: cfg.border }} />
          <div style={{ width: "16px", height: "3px", borderRadius: "2px", background: cfg.border }} />
        </div>
        <div style={{ background: cfg.panel, borderRadius: "5px", padding: "6px", border: `0.5px solid ${cfg.border}` }}>
          <div style={{ width: "55%", height: "4px", borderRadius: "2px", background: cfg.text, opacity: 0.7, marginBottom: "4px" }} />
          <div style={{ width: "85%", height: "3px", borderRadius: "2px", background: cfg.subtext, opacity: 0.4, marginBottom: "3px" }} />
          <div style={{ width: "70%", height: "3px", borderRadius: "2px", background: cfg.subtext, opacity: 0.3, marginBottom: "6px" }} />
          <div style={{ width: "36px", height: "12px", borderRadius: "3px", background: cfg.accent }} />
        </div>
      </div>
      <div style={{ background: cfg.panel, borderTop: `1px solid ${cfg.border}`, padding: "5px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 600, color: cfg.text, letterSpacing: "0.04em" }}>{cfg.label}</span>
        {isSelected && (
          <div style={{ width: "13px", height: "13px", borderRadius: "50%", background: "#3C3489", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="7" height="5" viewBox="0 0 7 5">
              <polyline points="1,2.5 2.8,4 6,1" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 1 — Skill ───────────────────────────────────────────────────────────

function StepSkill({ animKey, selectedSkill, setSelectedSkill, onContinue, onBack }) {
  const skills = [
    {
      key: "beginner", icon: "🌱", label: "Beginner", tagline: "New to this — let's build from scratch",
      effects: ["Simple, jargon-free explanations", "Step-by-step walkthroughs", "More hints & tooltips", "AI assistant uses everyday language"],
    },
    {
      key: "experienced", icon: "⚡", label: "Experienced", tagline: "I know the basics — skip the fluff",
      effects: ["Technical terminology used freely", "Concise, dense explanations", "Focus on edge cases & nuances", "AI assistant uses expert language"],
    },
  ];
  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={5} current={0} />
      <StepHeader title="What's your level?" subtitle="This shapes how the AI assistant explains concepts and how we present content." />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {skills.map((s) => (
          <div key={s.key}
            style={{ ...S.optCard(selectedSkill === s.key), padding: "1rem 1.1rem" }}
            onClick={() => setSelectedSkill(s.key)}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelectedSkill(s.key)}
          >
            {selectedSkill === s.key && <CheckBadge />}
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.4rem" }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1A1917" }}>{s.label}</div>
                <div style={{ fontSize: "0.78rem", color: "#6B6963", fontStyle: "italic" }}>{s.tagline}</div>
              </div>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
              {s.effects.map((effect, i) => (
                <li key={i} style={{ fontSize: "0.77rem", color: selectedSkill === s.key ? "#3C3489" : "#8A8680", lineHeight: 1.6 }}>
                  {effect}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={S.btnGhost} onClick={onBack}>← Back</button>
        <button
          style={{ ...S.btnPrimary, flex: 1, opacity: selectedSkill ? 1 : 0.45, cursor: selectedSkill ? "pointer" : "not-allowed" }}
          onClick={() => selectedSkill && onContinue()}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 — Theme ───────────────────────────────────────────────────────────

function StepTheme({ animKey, selectedTheme, setSelectedTheme, onContinue, onBack }) {
  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={5} current={1} />
      <StepHeader title="Pick your theme" subtitle="Each preview shows how your learning environment will look." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem", marginBottom: "0.75rem" }}>
        {Object.keys(THEME_CONFIGS).map((k) => (
          <ThemePreviewCard key={k} themeKey={k} isSelected={selectedTheme === k} onClick={() => setSelectedTheme(k)} />
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: "#A09C95", marginBottom: "1.25rem", textAlign: "center" }}>
        Changeable anytime in Settings
      </p>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={S.btnGhost} onClick={onBack}>← Back</button>
        <button
          style={{ ...S.btnPrimary, flex: 1, opacity: selectedTheme ? 1 : 0.45, cursor: selectedTheme ? "pointer" : "not-allowed" }}
          onClick={() => selectedTheme && onContinue()}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 — Font ────────────────────────────────────────────────────────────

function StepFont({ animKey, selectedFont, setSelectedFont, selectedFontSize, setSelectedFontSize, onContinue, onBack }) {
  const activeFontCfg = FONT_CONFIGS.find((f) => f.key === selectedFont) || null;
  const activeSizeCfg = FONT_SIZE_CONFIGS.find((f) => f.key === selectedFontSize) || null;
  const canContinue = selectedFont && selectedFontSize;

  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={5} current={2} />
      <StepHeader title="Typography" subtitle="Choose what feels most comfortable to read." />

      <div style={{ marginBottom: "1.15rem" }}>
        <p style={S.sectionHead}>Font style</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {FONT_CONFIGS.map((f) => (
            <div key={f.key}
              style={{ ...S.optCard(selectedFont === f.key), display: "flex", alignItems: "center", gap: "1rem", padding: "0.7rem 1rem" }}
              onClick={() => setSelectedFont(f.key)}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedFont(f.key)}
            >
              {selectedFont === f.key && <CheckBadge />}
              <div style={{ fontFamily: f.family, fontSize: "1.6rem", color: "#1A1917", minWidth: "36px", lineHeight: 1 }}>Aa</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#1A1917", fontFamily: f.family }}>{f.label}</div>
                <div style={{ fontSize: "0.73rem", color: "#8A8680" }}>{f.desc}</div>
              </div>
              <div style={{ fontFamily: f.family, fontSize: "0.75rem", color: selectedFont === f.key ? "#3C3489" : "#C0BAB4" }}>
                The quick brown fox
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <p style={S.sectionHead}>Text size</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
          {FONT_SIZE_CONFIGS.map((fs) => (
            <div key={fs.key}
              style={{ ...S.optCard(selectedFontSize === fs.key), textAlign: "center", padding: "0.75rem 0.4rem" }}
              onClick={() => setSelectedFontSize(fs.key)}
              role="button" tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedFontSize(fs.key)}
            >
              {selectedFontSize === fs.key && <CheckBadge />}
              <div style={{ fontSize: fs.size, color: "#1A1917", fontWeight: 500, marginBottom: "3px" }}>Aa</div>
              <div style={{ fontSize: "0.7rem", color: "#6B6963" }}>{fs.label}</div>
              <div style={{ fontSize: "0.65rem", color: "#C0BAB4" }}>{fs.preview}</div>
            </div>
          ))}
        </div>
      </div>

      {(activeFontCfg || activeSizeCfg) && (
        <div style={{ background: "#F9F8F6", border: "0.5px solid #E4E2DC", borderRadius: "10px", padding: "0.9rem 1rem", marginBottom: "1.25rem", transition: "all 0.25s ease" }}>
          <p style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A09C95", marginBottom: "0.5rem" }}>
            Preview
          </p>
          <p style={{ fontFamily: activeFontCfg ? activeFontCfg.family : "inherit", fontSize: activeSizeCfg ? activeSizeCfg.size : "1rem", color: "#1A1917", lineHeight: 1.6, margin: 0, transition: "font-family 0.2s ease, font-size 0.2s ease" }}>
            A decision tree splits data by asking yes/no questions about features — each branch narrows the classification until a leaf node gives the answer.
          </p>
          {activeFontCfg && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#AFA9EC", fontFamily: activeFontCfg.family }}>
              {activeFontCfg.label}{activeSizeCfg ? ` · ${activeSizeCfg.label}` : ""}
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={S.btnGhost} onClick={onBack}>← Back</button>
        <button
          style={{ ...S.btnPrimary, flex: 1, opacity: canContinue ? 1 : 0.45, cursor: canContinue ? "pointer" : "not-allowed" }}
          onClick={() => canContinue && onContinue()}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─── Step 4 — Avatar ─────────────────────────────────────────────────────────

function AvatarImage({ avatar, size, style = {} }) {
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
        ...style,
      }}
    />
  );
}

function StepAvatar({ animKey, firstName, selectedAvatar, setSelectedAvatar, onContinue, onBack }) {
  const current = AVATARS[selectedAvatar];
  return (
    <div key={animKey} style={{ animation: "slideIn 0.28s ease" }}>
      <StepDots total={5} current={3} />
      <StepHeader
        title="Choose your avatar"
        subtitle="Pick the learner that feels like you."
      />

      {/* Selected avatar hero */}
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
          <AvatarImage avatar={current} size={74} />
        </div>
        <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1A1917" }}>
          {current.name}
        </p>
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "#3C3489",
            marginTop: "2px",
          }}
        >
          {current.title}
        </p>
        <p
          style={{
            fontSize: "0.78rem",
            color: "#A09C95",
            marginTop: "0.5rem",
            lineHeight: 1.55,
            maxWidth: "300px",
            margin: "0.5rem auto 0",
          }}
        >
          {current.description}
        </p>
      </div>

      {/* Avatar grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0.55rem",
          marginBottom: "1.75rem",
        }}
      >
        {AVATARS.map((a, i) => (
          <div
            key={i}
            onClick={() => setSelectedAvatar(i)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelectedAvatar(i)}
            title={`${a.name} — ${a.title}`}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              border: `2px solid ${selectedAvatar === i ? "#3C3489" : "transparent"}`,
              background: selectedAvatar === i ? "#EEEDFE" : "#F9F8F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s, transform 0.15s",
              transform: selectedAvatar === i ? "scale(1.18)" : "scale(1)",
              boxShadow:
                selectedAvatar === i
                  ? "0 0 0 4px rgba(60,52,137,0.12)"
                  : "none",
            }}
          >
            <AvatarImage avatar={a} size={52} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button style={S.btnGhost} onClick={onBack}>
          ← Back
        </button>
        <button style={{ ...S.btnPrimary, flex: 1 }} onClick={onContinue}>
          Continue →
        </button>
      </div>
    </div>
  );
}

// ─── Step 5 — Done ────────────────────────────────────────────────────────────

function StepDone({ animKey, firstName, selectedAvatar, selectedSkill, selectedTheme, selectedFont, selectedFontSize, onComplete }) {
  const cfg = selectedTheme ? THEME_CONFIGS[selectedTheme] : THEME_CONFIGS.light;
  const fontCfg = FONT_CONFIGS.find((f) => f.key === selectedFont) || FONT_CONFIGS[0];
  const sizeCfg = FONT_SIZE_CONFIGS.find((f) => f.key === selectedFontSize) || FONT_SIZE_CONFIGS[1];
  const avatar = AVATARS[selectedAvatar];

  return (
    <div
      key={animKey}
      style={{
        animation: "slideIn 0.28s ease",
        textAlign: "center",
        padding: "0.25rem 0",
      }}
    >
      <StepDots total={5} current={4} />
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
        <p
          style={{
            fontSize: "0.68rem",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#A09C95",
            marginBottom: "0.6rem",
          }}
        >
          Your setup
        </p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}
        >
          {[
            ["Avatar", `${avatar.name} — ${avatar.title}`],
            [
              "Level",
              selectedSkill === "beginner" ? "🌱 Beginner" : "⚡ Experienced",
            ],
            ["Theme", cfg.label],
            ["Font", `${fontCfg.label} · ${sizeCfg.label}`],
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
        onClick={onComplete}
      >
        Go to dashboard →
      </button>
    </div>
  );
}

// ─── Main OnboardingPage ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUserStore();

  const { firstName = "", lastName = "", signupEmail = "", password = "" } = location.state || {};

  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedFont, setSelectedFont] = useState(null);
  const [selectedFontSize, setSelectedFontSize] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  function goTo(n) {
    setStep(n);
    setAnimKey((k) => k + 1);
  }

  function handleComplete() {
    setUser({
      firstName: firstName || "Friend",
      lastName,
      email: signupEmail,
      avatar: AVATARS[selectedAvatar].emoji,
      avatarImage: AVATARS[selectedAvatar].image,
      avatarName: AVATARS[selectedAvatar].name,
      skill: selectedSkill || "beginner",
      theme: selectedTheme || "light",
      font: selectedFont || "neutral",
      fontSize: selectedFontSize || "md",
      stats: { completed: 0, total: 6, minutesSpent: 0 },
      lastTopic: null,
    });
    setTimeout(() => navigate("/landing"), 700);
  }

  const steps = [
    <StepSkill key={animKey} animKey={animKey} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill}
      onContinue={() => goTo(1)} onBack={() => navigate(-1)} />,
    <StepTheme key={animKey} animKey={animKey} selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme}
      onContinue={() => goTo(2)} onBack={() => goTo(0)} />,
    <StepFont key={animKey} animKey={animKey} selectedFont={selectedFont} setSelectedFont={setSelectedFont}
      selectedFontSize={selectedFontSize} setSelectedFontSize={setSelectedFontSize}
      onContinue={() => goTo(3)} onBack={() => goTo(1)} />,
    <StepAvatar key={animKey} animKey={animKey} firstName={firstName} selectedAvatar={selectedAvatar}
      setSelectedAvatar={setSelectedAvatar} onContinue={() => goTo(4)} onBack={() => goTo(2)} />,
    <StepDone key={animKey} animKey={animKey} firstName={firstName} selectedAvatar={selectedAvatar}
      selectedSkill={selectedSkill} selectedTheme={selectedTheme} selectedFont={selectedFont}
      selectedFontSize={selectedFontSize} onComplete={handleComplete} />,
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideIn { from { opacity:0; transform:translateX(16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        button:active { transform: scale(0.97); }
      `}</style>
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#F9F8F6", fontFamily: "'DM Sans',system-ui,sans-serif", padding: "2rem",
      }}>
        <div style={{
          width: "100%", maxWidth: "460px", background: "#fff",
          border: "0.5px solid #E4E2DC", borderRadius: "18px",
          padding: "2rem", boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
        }}>
          {/* Logo */}
          <div style={{ marginBottom: "1.75rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "7px", background: "#3C3489", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <polygon points="12 2 2 7 12 12 22 7" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "1rem", color: "#1A1917" }}>Visualize</span>
          </div>

          {steps[step]}
        </div>
      </div>
    </>
  );
}