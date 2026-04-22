import { useEffect } from "react";
import { useUserStore } from "../../store/userStore";
import { themes } from "../../styles/themes";

// ─── Font stacks ──────────────────────────────────────────────────────────────

const FONT_STACKS = {
  neutral: "'DM Sans', system-ui, sans-serif",
  academic: "'DM Sans', system-ui, sans-serif",
  dyslexic: "'OpenDyslexic', 'Comic Sans MS', sans-serif",
};

const FONT_IMPORTS = {
  neutral:
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap",
  academic:
    "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Merriweather:ital,opsz,wdth,wght@0,18..144,100.3,300..900;1,18..144,100.3,300..900&display=swap",
  dyslexic: null, // loaded via CDN below
};

const FONT_SIZES = {
  sm: "14px",
  md: "16px",
  lg: "18px",
  xl: "20px",
};

// ─── CSS var names matching themes.js keys ────────────────────────────────────

function applyTheme(themeKey, fontKey, fontSizeKey) {
  const t = themes[themeKey] ?? themes.light;
  const root = document.documentElement;

  // Colour tokens
  root.style.setProperty("--bg", t.bg);
  root.style.setProperty("--surface", t.surface);
  root.style.setProperty("--surface-alt", t.surfaceAlt);
  root.style.setProperty("--border", t.border);
  root.style.setProperty("--text", t.text);
  root.style.setProperty("--text-muted", t.textMuted);
  root.style.setProperty("--text-faint", t.textFaint);
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--accent-light", t.accentLight);
  root.style.setProperty("--accent-mid", t.accentMid);
  root.style.setProperty("--green", t.green);
  root.style.setProperty("--green-light", t.greenLight);
  root.style.setProperty("--nav-bg", t.navBg);
  root.style.setProperty("--code-bg", t.codeBg);
  root.style.setProperty("--shadow", t.shadow);
  root.style.setProperty("--card-bg", t.cardBg);
  root.style.setProperty("--card-bg-hover", t.cardBgHover);

  // Font token
  const stack = FONT_STACKS[fontKey] ?? FONT_STACKS.neutral;
  root.style.setProperty("--font-body", stack);

  // Inject Google Fonts link if needed
  const existingLink = document.getElementById("visualize-font-link");
  const href = FONT_IMPORTS[fontKey];
  if (href) {
    if (!existingLink) {
      const link = document.createElement("link");
      link.id = "visualize-font-link";
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    } else {
      existingLink.href = href;
    }
  } else if (fontKey === "dyslexic") {
    // OpenDyslexic via CDN
    if (!existingLink) {
      const link = document.createElement("link");
      link.id = "visualize-font-link";
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic-regular.min.css";
      document.head.appendChild(link);
    }
  }

  // Apply font and font-size to root + body so everything inherits
  const fontSize = FONT_SIZES[fontSizeKey] ?? FONT_SIZES.md;
  root.style.setProperty("--font-size-base", fontSize);
  document.body.style.fontFamily = stack;
  document.body.style.fontSize = fontSize;

  // Apply dark-mode class for any CSS that needs it
  document.documentElement.classList.toggle(
    "theme-dark",
    themeKey === "dark" || themeKey === "cb-dark",
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export default function ThemeProvider({ children }) {
  const user = useUserStore((s) => s.user);
  const themeKey = user?.theme ?? "light";
  const fontKey = user?.font ?? "neutral";
  const fontSizeKey = user?.fontSize ?? "md";

  useEffect(() => {
    applyTheme(themeKey, fontKey, fontSizeKey);
  }, [themeKey, fontKey, fontSizeKey]);

  // Also run once on mount with whatever is in the store
  useEffect(() => {
    applyTheme(themeKey, fontKey, fontSizeKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return children;
}
